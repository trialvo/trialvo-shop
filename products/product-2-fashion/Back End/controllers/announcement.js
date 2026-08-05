const { optionalUploadApi, saveAnnouncementImage, deleteFileIfExists } = require('../helpers/img');
const { api, auth ,generateUnsubscribeToken ,verifyUnsubscribeToken} = require('../helpers/common');
const errors = require('../helpers/errors');
const validator = require('validator');
const database = require('../utils/connection');
const { sendAnnouncementMail } = require('../mail-templates/announcement');
const { sendSMS } = require('../helpers/sms');
const { getConfig } = require("../config/ApplicationSettingsDB");
const { STORAGE_URL } = require("../config/ApplicationSettings");

function isValidDateTime(value) {
    const date = new Date(value);
    return !isNaN(date.getTime());
}

/**
 * Convert any valid datetime string (including ISO 8601 with 'Z' timezone suffix)
 * to a MySQL-compatible DATETIME string: 'YYYY-MM-DD HH:MM:SS'.
 * MySQL TIMESTAMP columns reject the ISO 8601 'Z' suffix format.
 * Returns null if value is falsy.
 */
function toMysqlDatetime(value) {
    if (!value) return null;
    return new Date(value).toISOString().slice(0, 19).replace('T', ' ');
}

/**
 * Strip HTML tags and decode basic entities → plain text for SMS.
 * Truncates to 160 chars with ellipsis if longer.
 */
function htmlToSmsText(html) {
    if (!html) return '';
    let text = String(html)
        // Replace block-level tags with newline
        .replace(/<\/(p|div|li|br|h[1-6])>/gi, '\n')
        // Strip all remaining tags
        .replace(/<[^>]+>/g, '')
        // Decode common HTML entities
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&nbsp;/g, ' ')
        // Collapse multiple whitespace / newlines into a single space
        .replace(/[\r\n]+/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim();

    if (text.length > 160) {
        text = text.slice(0, 159) + '\u2026'; // …
    }
    return text;
}

/**
 * Check whether email / sms services are configured and active.
 * Returns { emailOk: bool, smsOk: bool }
 */
async function checkServiceAvailability(connection) {
    const emailRows = await getConfig(connection, false, 'email');
    const emailCfg  = emailRows.reduce((acc, r) => { acc[r.key_name] = r; return acc; }, {});
    const emailOk   = !!(emailCfg.MAIL_HOST?.is_active &&
                         emailCfg.MAIL_HOST?.value &&
                         emailCfg.MAIL_PORT?.value &&
                         emailCfg.MAIL_USER?.value &&
                         emailCfg.MAIL_PASS?.value);

    const smsRows = await getConfig(connection, false, 'sms');
    const smsCfg  = smsRows.reduce((acc, r) => { if (r.is_active) acc[r.key_name] = r.value; return acc; }, {});
    const smsOk   = !!(smsCfg.SMS_ACTIVE_PROVIDER);

    return { emailOk, smsOk };
}

function sanitizeZoneName(value) {
    if (value == null) return "";

    let cleaned = String(value).trim();
    if (!cleaned) return "";

    // Decode escaped quote sequences first.
    cleaned = cleaned.replace(/\\"/g, "\"").replace(/\\'/g, "'");

    // Remove wrapping quotes repeatedly: "savar", '"savar"', etc.
    while (
        cleaned.length >= 2 &&
        (
            (cleaned.startsWith("\"") && cleaned.endsWith("\"")) ||
            (cleaned.startsWith("'") && cleaned.endsWith("'"))
        )
    ) {
        cleaned = cleaned.slice(1, -1).trim();
    }

    // Strip any lone stray quotes left at the start/end (e.g. from splitting "dhaka,tangail,manikganj" by comma)
    cleaned = cleaned.replace(/^["']+/, "").replace(/["']+$/, "").trim();

    return cleaned.replace(/\s+/g, " ").trim();
}

function normalizeEmail(value) {
    return String(value || "").trim().toLowerCase();
}

function normalizePhoneForSend(value) {
    return String(value || "").trim();
}

function sanitizeAreaName(value) {
    return sanitizeZoneName(value);
}

function normalizeZoneTargetItem(item) {
    if (item == null) return null;

    // Backward compatibility: plain city string
    if (typeof item === "string") {
        const cityName = sanitizeZoneName(item);
        if (!cityName) return null;
        return {
            location_mapping_id: null,
            city_name: cityName,
            area_name: null,
            city_name_normalized: cityName.toLowerCase(),
            area_name_normalized: null,
        };
    }

    if (typeof item !== "object") return null;

    const rawLocationMappingId = item.location_mapping_id ?? item.id ?? null;
    const parsedLocationMappingId = Number.parseInt(rawLocationMappingId, 10);
    const locationMappingId = Number.isInteger(parsedLocationMappingId) && parsedLocationMappingId > 0
        ? parsedLocationMappingId
        : null;

    const cityName = sanitizeZoneName(item.city_name ?? item.city ?? "");
    const areaName = sanitizeAreaName(item.area_name ?? item.area ?? "");

    if (!cityName && !areaName && !locationMappingId) {
        return null;
    }

    return {
        location_mapping_id: locationMappingId,
        city_name: cityName || null,
        area_name: areaName || null,
        city_name_normalized: cityName ? cityName.toLowerCase() : null,
        area_name_normalized: areaName ? areaName.toLowerCase() : null,
    };
}

function normalizeZoneTargets(body = {}) {
    const rawZones = body.zones ?? body["zones[]"];

    if (rawZones == null) return [];

    const parsedTargets = [];

    const pushIfValid = (candidate) => {
        const normalized = normalizeZoneTargetItem(candidate);
        if (normalized) parsedTargets.push(normalized);
    };

    if (Array.isArray(rawZones)) {
        rawZones.forEach(pushIfValid);
    } else if (typeof rawZones === "string") {
        const trimmed = rawZones.trim();
        if (!trimmed) return [];

        // Support JSON payload in form-data:
        // 1) ["Dhaka","Chattogram"]
        // 2) [{location_mapping_id, city_name, area_name}, ...]
        if (
            (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
            (trimmed.startsWith("{") && trimmed.endsWith("}"))
        ) {
            try {
                const parsed = JSON.parse(trimmed);
                if (Array.isArray(parsed)) {
                    parsed.forEach(pushIfValid);
                } else {
                    pushIfValid(parsed);
                }
            } catch (_) {
                // Fall back to comma-split below.
            }
        }

        // Backward compatibility: comma-separated city list.
        if (parsedTargets.length === 0) {
            trimmed
                .split(",")
                .forEach(pushIfValid);
        }
    }

    const deduped = [];
    const seen = new Set();

    for (const target of parsedTargets) {
        const key = target.location_mapping_id
            ? `id:${target.location_mapping_id}`
            : `legacy:${target.city_name_normalized || ""}:${target.area_name_normalized || ""}`;

        if (seen.has(key)) continue;
        seen.add(key);
        deduped.push(target);
    }

    return deduped;
}

function hasZonesPayload(body = {}) {
    return Object.prototype.hasOwnProperty.call(body, "zones")
        || Object.prototype.hasOwnProperty.call(body, "zones[]");
}

exports.createAnnouncement = optionalUploadApi(
    "announcement_image",
    {
        body: {
            headline: { type: "string", required: true },
            body: { type: "string", required: true },
            target_type: { type: "string", required: false, default: "all" }, // all, subscribed_only, registered_users_only
            zone_scope: { type: "string", required: false, default: "all" }, // all, selected
            status: { type: "string", required: false, default: "draft" },
            scheduled_at: { type: "string", required: false }, // YYYY-MM-DD HH:mm:ss
            channel: { type: "string", required: false, default: "email" } // email | sms | both
        }
    },
    auth(async (req, connection, adminInfo) => {

        /** 1️⃣ Authorization */
        const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN"];
        if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
            throw new errors.UNAUTHORIZED("Access denied.");
        }

        const {
            headline,
            body,
            target_type,
            zone_scope,
            status,
            scheduled_at,
            channel
        } = req.typed.body;

        const zoneTargets = normalizeZoneTargets(req.body);

        /** 2️⃣ Validations */
        if (headline.length > 255) {
            throw new errors.INVALID_FIELDS_PROVIDED("Headline too long.");
        }

        const validChannels = ['email', 'sms', 'both'];
        if (!validChannels.includes(channel)) {
            throw new errors.INVALID_FIELDS_PROVIDED("channel must be 'email', 'sms', or 'both'.");
        }

        // Check service availability for the requested channel
        const { emailOk, smsOk } = await checkServiceAvailability(connection);
        if ((channel === 'email' || channel === 'both') && !emailOk) {
            throw new errors.SERVICE_UNAVAILABLE("Email service is not configured or disabled.");
        }
        if ((channel === 'sms' || channel === 'both') && !smsOk) {
            throw new errors.SERVICE_UNAVAILABLE("SMS service is not configured or disabled.");
        }

        const validTargets = ['all', 'subscribed_only', 'registered_users_only'];
        if (!validTargets.includes(target_type)) {
            throw new errors.INVALID_FIELDS_PROVIDED("Invalid target type.");
        }

        // Zone scope validation
        if (!['all', 'selected'].includes(zone_scope)) {
            throw new errors.INVALID_FIELDS_PROVIDED("zone_scope must be 'all' or 'selected'.");
        }
        if (zone_scope === 'selected') {
            if (!zoneTargets.length) {
                throw new errors.INVALID_FIELDS_PROVIDED("zones array is required when zone_scope is 'selected'.");
            }
        }

        const validStatuses = ['draft', 'scheduled', 'sent', 'cancelled'];
        if (!validStatuses.includes(status)) {
            throw new errors.INVALID_FIELDS_PROVIDED("Invalid status.");
        }

        // Validate scheduled_at format if provided
        if (scheduled_at && !isValidDateTime(scheduled_at)) {
            throw new errors.INVALID_FIELDS_PROVIDED(
                "scheduled_at must be a valid datetime."
            );
        }

        // If scheduled, must have a valid future datetime
        if (status === 'scheduled') {
            if (
                !scheduled_at ||
                !isValidDateTime(scheduled_at) ||
                new Date(scheduled_at) <= new Date()
            ) {
                throw new errors.INVALID_FIELDS_PROVIDED(
                    "A valid future scheduled_at datetime is required."
                );
            }
        }

        /** 3️⃣ Handle Image Upload */
        let imagePath = null;
        if (req.files?.announcement_image?.[0]) {
            imagePath = await saveAnnouncementImage(
                req.files.announcement_image[0].path,
                "announcements"
            );
        }

        /** 4️⃣ Insert Announcement */
        const result = await connection.query(
            `INSERT INTO announcements 
             (headline, body, target_type, channel, zone_scope, status, scheduled_at, image_path)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                headline,
                body,
                target_type,
                channel,
                zone_scope,
                status,
                toMysqlDatetime(scheduled_at),
                imagePath
            ]
        );

        const announcementId = result.insertId;

        /** 4.5️⃣ Insert Zone Entries */
        if (zone_scope === 'selected' && zoneTargets.length > 0) {
            for (const zoneTarget of zoneTargets) {
                await connection.query(
                    `INSERT IGNORE INTO announcement_zones
                     (announcement_id, location_mapping_id, city_name, area_name, city_name_normalized, area_name_normalized)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                        announcementId,
                        zoneTarget.location_mapping_id,
                        zoneTarget.city_name,
                        zoneTarget.area_name,
                        zoneTarget.city_name_normalized,
                        zoneTarget.area_name_normalized,
                    ]
                );
            }
        }

        /** 5️⃣ Audit Log */
        await connection.query(
            `INSERT INTO admin_audit_logs 
             (admin_id, action, resource, resource_id, meta)
             VALUES (?, ?, 'announcements', ?, ?)`,
            [
                adminInfo.id,
                'CREATE_ANNOUNCEMENT',
                announcementId,
                JSON.stringify({
                    headline,
                    target_type,
                    channel,
                    status,
                    scheduled_at
                })
            ]
        );

        /** 6️⃣ Response */
        return {
            success: true,
            announcement_id: announcementId,
            message:
                status === 'scheduled'
                    ? "Announcement scheduled successfully."
                    : "Announcement draft saved successfully."
        };
    })
);


exports.getAllAnnouncements = api({
    query: {
        limit: { type: "int", required: false, default: 20 },
        offset: { type: "int", required: false, default: 0 },
        status: { type: "string", required: false },      // draft, scheduled, sent, cancelled
        target_type: { type: "string", required: false }, // all, subscribed_only, registered_users_only
        channel: { type: "string", required: false },    // email, sms, both
        zones: { type: "string", required: false },       // city or comma-separated cities
        search: { type: "string", required: false },      // Search in headline
        start_date: { type: "string", required: false },  // YYYY-MM-DD
        end_date: { type: "string", required: false }     // YYYY-MM-DD
    }
}, auth(async (req, connection, adminInfo) => {

    /** 1️⃣ Authorization check */
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "READ_ONLY_ADMIN"];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
        throw new errors.UNAUTHORIZED("Access denied.");
    }

    const { limit, offset, status, target_type, channel, zones, search, start_date, end_date } = req.typed.query;

    let queryParts = ["WHERE a.deleted_at IS NULL"];
    let queryValues = [];
    let hasZoneFilter = false;

    /** 2️⃣ Build Dynamic Filters */
    if (status) {

        if (!['draft', 'scheduled', 'sent', 'cancelled'].includes(status)) {
            throw new errors.INVALID_FIELDS_PROVIDED("Invalid status filter.");
        }

        queryParts.push("AND a.status = ?");
        queryValues.push(status);
    }

    if (target_type) {
        if (!['all', 'subscribed_only', 'registered_users_only'].includes(target_type)) {
            throw new errors.INVALID_FIELDS_PROVIDED("Invalid target_type filter.");
        }

        queryParts.push("AND a.target_type = ?");
        queryValues.push(target_type);
    }

    if (channel) {
        if (!['email', 'sms', 'both'].includes(channel)) {
            throw new errors.INVALID_FIELDS_PROVIDED("channel must be 'email', 'sms', or 'both'.");
        }
        queryParts.push("AND a.channel = ?");
        queryValues.push(channel);
    }

    if (search) {
        queryParts.push("AND a.headline LIKE ?");
        queryValues.push(`%${search}%`);
    }

    /** 2.5️⃣ Zone Filter (include global announcements) */
    if (zones) {
        const zoneTerms = String(zones)
            .split(",")
            .map(z => sanitizeZoneName(z).toLowerCase().replace(/\s+/g, " "))
            .filter(Boolean);

        if (zoneTerms.length > 0) {
            hasZoneFilter = true;
            const likeConditions = zoneTerms
                .map(() => "(REPLACE(LOWER(TRIM(COALESCE(az.city_name_normalized, ''))), '\"', '') LIKE ? OR REPLACE(LOWER(TRIM(COALESCE(az.area_name_normalized, ''))), '\"', '') LIKE ?)")
                .join(" OR ");

            queryParts.push(`
                AND (
                    a.zone_scope = 'all'
                    OR (
                        a.zone_scope = 'selected'
                        AND EXISTS (
                            SELECT 1
                            FROM announcement_zones az
                            WHERE az.announcement_id = a.id
                              AND (${likeConditions})
                        )
                    )
                )
            `);

            for (const term of zoneTerms) {
                queryValues.push(`%${term}%`);
                queryValues.push(`%${term}%`);
            }
        }
    }

    /** 3️⃣ Date Range Filters */
    // We filter based on created_at to see when the announcement was managed
    if (start_date) {
        if (!validator.isDate(start_date)) throw new errors.INVALID_FIELDS_PROVIDED("Invalid start_date format.");
        queryParts.push("AND a.created_at >= ?");
        queryValues.push(`${start_date} 00:00:00`);
    }

    if (end_date) {
        if (!validator.isDate(end_date)) throw new errors.INVALID_FIELDS_PROVIDED("Invalid end_date format.");
        queryParts.push("AND a.created_at <= ?");
        queryValues.push(`${end_date} 23:59:59`);
    }

    const whereClause = queryParts.join(" ");
    const orderByClause = hasZoneFilter
        ? "ORDER BY CASE WHEN a.zone_scope = 'selected' THEN 0 ELSE 1 END ASC, a.created_at DESC"
        : "ORDER BY a.created_at DESC";

    /** 4️⃣ Execute Count and Data Queries */
    const countResult = await connection.queryOne(
        `SELECT COUNT(*) as total FROM announcements a ${whereClause}`,
        queryValues
    );

    const announcements = await connection.query(
        `SELECT 
            a.*
         FROM announcements a
         ${whereClause}
         ${orderByClause}
         LIMIT ? OFFSET ?`,
        [...queryValues, limit, offset]
    );

    // Attach zones in list response for easier admin UI rendering.
    const announcementIds = announcements.map(a => a.id);
    const zonesByAnnouncementId = {};

    if (announcementIds.length > 0) {
        const zoneRows = await connection.query(
            `SELECT announcement_id, location_mapping_id, city_name, area_name, city_name_normalized, area_name_normalized
             FROM announcement_zones
             WHERE announcement_id IN (?)`,
            [announcementIds]
        );

        for (const row of zoneRows) {
            if (!zonesByAnnouncementId[row.announcement_id]) {
                zonesByAnnouncementId[row.announcement_id] = [];
            }

            zonesByAnnouncementId[row.announcement_id].push({
                location_mapping_id: row.location_mapping_id,
                city_name: sanitizeZoneName(row.city_name),
                area_name: sanitizeAreaName(row.area_name),
                city_name_normalized: sanitizeZoneName(row.city_name_normalized),
                area_name_normalized: sanitizeAreaName(row.area_name_normalized),
            });
        }
    }

    const data = announcements.map((announcement) => ({
        ...announcement,
        zones: zonesByAnnouncementId[announcement.id] || []
    }));

    return {
        success: true,
        total: countResult.total,
        limit,
        offset,
        data
    };
}));


exports.getAnnouncementById = api({
    params: {
        id: { type: "int", required: true }
    }
}, auth(async (req, connection, adminInfo) => {

    /** 1️⃣ Authorization check */
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "READ_ONLY_ADMIN"];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
        throw new errors.UNAUTHORIZED("Access denied.");
    }

    const { id } = req.typed.params;

    /** 2️⃣ Fetch Announcement Data */
    const announcement = await connection.queryOne(
        `SELECT 
            * FROM announcements 
         WHERE id = ? AND deleted_at IS NULL`,
        [id]
    );

    /** 3️⃣ Handle Not Found */
    if (!announcement) {
        throw new errors.NOT_FOUND("Announcement not found or has been deleted.");
    }

    /** 3.5️⃣ Fetch zones if zone_scope is selected */
    let zones = [];
    if (announcement.zone_scope === 'selected') {
        const zoneRows = await connection.query(
            `SELECT location_mapping_id, city_name, area_name, city_name_normalized, area_name_normalized
             FROM announcement_zones
             WHERE announcement_id = ?`,
            [id]
        );
        zones = zoneRows.map((row) => ({
            location_mapping_id: row.location_mapping_id,
            city_name: sanitizeZoneName(row.city_name),
            area_name: sanitizeAreaName(row.area_name),
            city_name_normalized: sanitizeZoneName(row.city_name_normalized),
            area_name_normalized: sanitizeAreaName(row.area_name_normalized),
        }));
    }

    return {
        success: true,
        data: {
            ...announcement,
            zones
        }
    };
}));


exports.editAnnouncement = optionalUploadApi(
    "announcement_image",
    {
        params: {
            id: { type: "int", required: true }
        },
        body: {
            headline: { type: "string", required: false },
            body: { type: "string", required: false },
            target_type: { type: "string", required: false },
            zone_scope: { type: "string", required: false },
            status: { type: "string", required: false },
            scheduled_at: { type: "string", required: false },
            channel: { type: "string", required: false } // email | sms | both
        }
    },
    auth(async (req, connection, adminInfo) => {
        const announcementId = req.typed.params.id;

        /** 1️⃣ Authorization */
        const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN"];
        if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
            throw new errors.UNAUTHORIZED("Access denied.");
        }

        const {
            headline,
            body,
            target_type,
            zone_scope,
            status,
            scheduled_at,
            channel
        } = req.typed.body;

        const zoneTargets = normalizeZoneTargets(req.body);
        const zonesProvided = hasZonesPayload(req.body);

        /** 2️⃣ Check Existence */
        const announcement = await connection.queryOne(
            "SELECT id, image_path, status as current_status, scheduled_at, zone_scope as current_zone_scope FROM announcements WHERE id = ? AND deleted_at IS NULL",
            [announcementId]
        );

        if (!announcement) {
            throw new errors.NOT_FOUND("Announcement not found.");
        }
        // Note: sent announcements are editable and can be reused as templates for later sends.

        /** 3️⃣ Validations */
        if (headline && headline.length > 255) {
            throw new errors.INVALID_FIELDS_PROVIDED("Headline too long.");
        }

        if (target_type) {
            const validTargets = ['all', 'subscribed_only', 'registered_users_only'];
            if (!validTargets.includes(target_type)) {
                throw new errors.INVALID_FIELDS_PROVIDED("Invalid target type.");
            }
        }

        // Zone scope validation
        if (zone_scope) {
            if (!['all', 'selected'].includes(zone_scope)) {
                throw new errors.INVALID_FIELDS_PROVIDED("zone_scope must be 'all' or 'selected'.");
            }
            if (zone_scope === 'selected') {
                if (!zoneTargets.length) {
                    throw new errors.INVALID_FIELDS_PROVIDED("zones array is required when zone_scope is 'selected'.");
                }
            }
        }

        if (status) {
            const validStatuses = ['draft', 'scheduled', 'sent', 'cancelled'];
            if (!validStatuses.includes(status)) {
                throw new errors.INVALID_FIELDS_PROVIDED("Invalid status.");
            }
        }

        if (channel) {
            const validChannels = ['email', 'sms', 'both'];
            if (!validChannels.includes(channel)) {
                throw new errors.INVALID_FIELDS_PROVIDED("channel must be 'email', 'sms', or 'both'.");
            }
            // Check availability for the new channel
            const { emailOk, smsOk } = await checkServiceAvailability(connection);
            if ((channel === 'email' || channel === 'both') && !emailOk) {
                throw new errors.SERVICE_UNAVAILABLE("Email service is not configured or disabled.");
            }
            if ((channel === 'sms' || channel === 'both') && !smsOk) {
                throw new errors.SERVICE_UNAVAILABLE("SMS service is not configured or disabled.");
            }
        }

        // DateTime Validation
        if (scheduled_at && !isValidDateTime(scheduled_at)) {
            throw new errors.INVALID_FIELDS_PROVIDED("scheduled_at must be a valid datetime.");
        }

        // Logic check for scheduling
        const finalStatus = status || announcement.current_status;
        const finalZoneScope = zone_scope || announcement.current_zone_scope;

        if (finalStatus === 'scheduled') {
            const dateToCheck = scheduled_at !== undefined ? scheduled_at : announcement.scheduled_at;
            if (!dateToCheck || new Date(dateToCheck) <= new Date()) {
                throw new errors.INVALID_FIELDS_PROVIDED("A valid future scheduled_at datetime is required to schedule.");
            }
        }

        /** 4️⃣ Handle Image Update */
        let imagePath = announcement.image_path;
        if (req.files?.announcement_image?.[0]) {
            // Delete old image if it exists
            if (announcement.image_path) {
                deleteFileIfExists(announcement.image_path);
            }
            // Save new image
            imagePath = await saveAnnouncementImage(
                req.files.announcement_image[0].path,
                "announcements"
            );
        }

        /** 5️⃣ Build Dynamic Update */
        const updates = [];
        const params = [];

        if (headline) { updates.push("headline = ?"); params.push(headline); }
        if (body) { updates.push("body = ?"); params.push(body); }
        if (target_type) { updates.push("target_type = ?"); params.push(target_type); }
        if (status) { updates.push("status = ?"); params.push(status); }
        if (channel) { updates.push("channel = ?"); params.push(channel); }

        // Handle scheduled_at specifically because it can be set to null.
        // Convert ISO 8601 (e.g. '2026-04-17T22:00:00.000Z') → MySQL DATETIME
        // string ('2026-04-17 22:00:00') because MySQL TIMESTAMP rejects the 'Z' suffix.
        if (scheduled_at !== undefined) {
            updates.push("scheduled_at = ?");
            params.push(toMysqlDatetime(scheduled_at));
        }

        if (imagePath !== announcement.image_path) {
            updates.push("image_path = ?");
            params.push(imagePath);
        }

        if (zone_scope) {
            updates.push("zone_scope = ?");
            params.push(zone_scope);
        }

        if (updates.length === 0 && !req.files?.announcement_image) {
            throw new errors.INVALID_FIELDS_PROVIDED("No changes provided.");
        }

        params.push(announcementId);

        /** 6️⃣ Execute Update */
        await connection.query(
            `UPDATE announcements SET ${updates.join(", ")}, updated_at = NOW() WHERE id = ?`,
            params
        );

        /** 6.5️⃣ Update zones if zone scope / zone list is provided */
        if (zone_scope !== undefined || zonesProvided) {
            if (finalZoneScope === "selected" && zonesProvided && zoneTargets.length === 0) {
                throw new errors.INVALID_FIELDS_PROVIDED("zones array cannot be empty when zone_scope is 'selected'.");
            }

            if (finalZoneScope === "all") {
                await connection.query(
                    `DELETE FROM announcement_zones WHERE announcement_id = ?`,
                    [announcementId]
                );
            } else if (finalZoneScope === "selected" && zonesProvided) {
                await connection.query(
                    `DELETE FROM announcement_zones WHERE announcement_id = ?`,
                    [announcementId]
                );

                for (const zoneTarget of zoneTargets) {
                    await connection.query(
                        `INSERT IGNORE INTO announcement_zones
                         (announcement_id, location_mapping_id, city_name, area_name, city_name_normalized, area_name_normalized)
                         VALUES (?, ?, ?, ?, ?, ?)`,
                        [
                            announcementId,
                            zoneTarget.location_mapping_id,
                            zoneTarget.city_name,
                            zoneTarget.area_name,
                            zoneTarget.city_name_normalized,
                            zoneTarget.area_name_normalized,
                        ]
                    );
                }
            }
        }

        /** 7️⃣ Audit Log */
        await connection.query(
            `INSERT INTO admin_audit_logs 
             (admin_id, action, resource, resource_id, meta)
             VALUES (?, ?, 'announcements', ?, ?)`,
            [
                adminInfo.id,
                'EDIT_ANNOUNCEMENT',
                announcementId,
                JSON.stringify({
                    changed_fields: Object.keys(req.typed.body),
                    status_from: announcement.current_status,
                    status_to: finalStatus,
                    channel_to: channel || undefined
                })
            ]
        );

        return {
            success: true,
            message: "Announcement updated successfully."
        };
    })
);

exports.deleteAnnouncement = api({
    params: {
        id: { type: "int", required: true }
    }
}, auth(async (req, connection, adminInfo) => {
    const announcementId = req.typed.params.id;

    /** 1️⃣ Authorization check */
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN"];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
        throw new errors.UNAUTHORIZED("Access denied.");
    }

    /** 2️⃣ Check Existence and Current Status */
    const announcement = await connection.queryOne(
        "SELECT id, headline, status, image_path FROM announcements WHERE id = ? AND deleted_at IS NULL",
        [announcementId]
    );

    if (!announcement) {
        throw new errors.NOT_FOUND("Announcement not found or already deleted.");
    }

    /** 3️⃣ Business Logic: Prevent deleting "Sent" items via this API */
    // Usually, you want to archive sent items rather than delete them to keep analytics
    if (announcement.status === 'sent') {
        throw new errors.FORBIDDEN("Cannot delete an announcement that has already been sent. ");
    }

    /** 4️⃣ Execute Soft Delete */
    await connection.query(
        "UPDATE announcements SET deleted_at = NOW(), status = 'cancelled' WHERE id = ?",
        [announcementId]
    );

    /** 5️⃣ Audit Log */
    await connection.query(
        `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta) 
         VALUES (?, ?, 'announcements', ?, ?)`,
        [
            adminInfo.id,
            'DELETE_ANNOUNCEMENT',
            announcementId,
            JSON.stringify({ headline: announcement.headline, previous_status: announcement.status })
        ]
    );

    return {
        success: true,
        message: "Announcement moved to trash successfully."
    };
}));


// Helper utility for throttling
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to extract a readable error message from both native Errors and QErrors
const errMsg = (e) => e?.error || e?.message || String(e);


 
// exports.sendAnnouncement = api({
//     params: {
//         id: { type: "int", required: true }
//     }
// }, auth(async (req, connection, adminInfo) => {
//     const announcementId = req.typed.params.id;

 
//     /** 1️⃣ Authorization */
//     const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "READ_ONLY_ADMIN"];
//     if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
//         throw new errors.UNAUTHORIZED();
//     }
//     // 1. Load email config from DB
//     const configs = await getConfig(connection, false, "email");

//     if (!configs.length || configs[0].is_active === 0) {
//         throw new errors.SERVICE_UNAVAILABLE("Email service disabled");
//     }

//     // 2. Normalize config
//     const cfg = configs.reduce((acc, c) => {
//         acc[c.key_name] = c.value;
//         return acc;
//     }, {});

//     if (
//         !cfg.MAIL_HOST ||
//         !cfg.MAIL_PORT ||
//         !cfg.MAIL_USER ||
//         !cfg.MAIL_PASS
//     ) {
//         throw new errors.SERVICE_UNAVAILABLE("Email service disabled");
//     }


//     /** 2️⃣ Fetch Announcement Details */
//     const announcement = await connection.queryOne(
//         "SELECT * FROM announcements WHERE id = ? AND deleted_at IS NULL",
//         [announcementId]
//     );

//     if (!announcement) throw new errors.NOT_FOUND("Announcement not found.");
//     if (announcement.status === 'sent') throw new errors.FORBIDDEN("Announcement already sent.");

//     /** 3️⃣ Fetch Targets (Filtering for Active/Non-Suspended) */
//     let recipients = [];
//     if (announcement.target_type === 'subscribed_only') {
//         recipients = await connection.query(
//             "SELECT email ,user_id as id FROM subscribers WHERE status = 1 AND suspended_at IS NULL  "
//         );
//     } else if (announcement.target_type === 'registered_users_only') {
//         recipients = await connection.query(
//             "SELECT email,id FROM users WHERE status = 'active' AND deleted_at IS NULL"
//         );
//     } else {
//         // 'all' - Unified list, ensuring no double emails for users who are also subscribers
//         recipients = await connection.query(`
//             SELECT DISTINCT email FROM (
//                 SELECT email  ,user_id as id FROM subscribers WHERE status = 1 AND suspended_at IS NULL 
//                 UNION
//                 SELECT email,id FROM users WHERE status = 'active' AND deleted_at IS NULL
//             ) as unified_emails
//         `);
//     }

//     if (recipients.length === 0) {
//         throw new errors.INVALID_FIELDS_PROVIDED("No active recipients found for this target group.");
//     }

//     /** 4️⃣ Update Status immediately to lock the record */
//     await connection.query(
//         "UPDATE announcements SET status = 'sent', sent_at = NOW() WHERE id = ?",
//         [announcementId]
//     );

//     /** 5️⃣ Throttled Background Dispatch */
//     (async () => {
//         let mailConn;
//         try {
//             mailConn = await database.getConnection();

//             for (let i = 0; i < recipients.length; i++) {
//                 const recipient = recipients[i];

//                 const token= await generateUnsubscribeToken(recipient);


//                 try {
//                     await sendAnnouncementMail(mailConn, {
//                         email: recipient.email,
//                         headline: announcement.headline,
//                         body: announcement.body,
//                         token,
//                         image: announcement.image_path ? `${STORAGE_URL}/${announcement.image_path}` : null
                        
//                     });
//                 } catch (sendErr) {
//                     console.error(`Mail failed for ${recipient.email}:`, sendErr.message);
//                 }

//                 // Apply 250ms delay between each email to prevent SMTP blocking
//                 // No delay needed after the last email
//                 if (i < recipients.length - 1) {
//                     await delay(250);
//                 }
//             }
//         } catch (err) {
//             console.error("Critical Bulk Mail Error:", err);
//         } finally {
//             if (mailConn) await mailConn.release();
//         }
//     })();

//     /** 6️⃣ Audit Log */
//     await connection.query(
//         `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta) 
//          VALUES (?, 'SEND_ANNOUNCEMENT', 'announcements', ?, ?)`,
//         [adminInfo.id, announcementId, JSON.stringify({ total_recipients: recipients.length })]
//     );

//     return {
//         success: true,
//         recipient_count: recipients.length,
//         message: `Sending started. It will take approx ${Math.ceil((recipients.length * 0.25) / 60)} minutes.`
//     };
// }));


/**
 * Core dispatch logic for sending an announcement.
 * Shared by both the manual send API and the auto-send scheduler.
 *
 * @param {Connection} connection - Active DB connection
 * @param {number}     announcementId - ID of the announcement to dispatch
 * @returns {{ channel: string, emailRecipientCount: number, smsRecipientCount: number }}
 * @throws NOT_FOUND, FORBIDDEN, SERVICE_UNAVAILABLE, INVALID_FIELDS_PROVIDED
 */
exports.dispatchAnnouncementById = async function dispatchAnnouncementById(connection, announcementId) {
    /** Fetch Announcement Details */
    const announcement = await connection.queryOne(
        "SELECT * FROM announcements WHERE id = ? AND deleted_at IS NULL",
        [announcementId]
    );

    if (!announcement) throw new errors.NOT_FOUND("Announcement not found.");

    if (announcement.status === 'sent') {
        throw new errors.FORBIDDEN("This announcement has already been sent. To send it again, edit the announcement and change its status first.");
    }

    const channel = announcement.channel || 'email';

    /** Check service availability for this announcement's channel */
    const { emailOk, smsOk } = await checkServiceAvailability(connection);
    if ((channel === 'email' || channel === 'both') && !emailOk) {
        throw new errors.SERVICE_UNAVAILABLE("Email service is not configured or disabled.");
    }
    if ((channel === 'sms' || channel === 'both') && !smsOk) {
        throw new errors.SERVICE_UNAVAILABLE("SMS service is not configured or disabled.");
    }

    /** Load zones if scope is selected */
    let selectedCityNames = [];
    let selectedLocationMappingIds = [];
    if (announcement.zone_scope === 'selected') {
        const zoneRows = await connection.query(
            `SELECT location_mapping_id, city_name_normalized
             FROM announcement_zones
             WHERE announcement_id = ?`,
            [announcementId]
        );

        selectedCityNames = zoneRows
            .map((z) => sanitizeZoneName(z.city_name_normalized).toLowerCase())
            .filter(Boolean);

        selectedLocationMappingIds = zoneRows
            .map((z) => Number.parseInt(z.location_mapping_id, 10))
            .filter((id) => Number.isInteger(id) && id > 0);

        if (selectedCityNames.length === 0 && selectedLocationMappingIds.length === 0) {
            throw new errors.INVALID_FIELDS_PROVIDED("No zones configured for this announcement.");
        }
    }

    /** Fetch Targets with is_subscribed flag */
    let recipients = [];
    if (announcement.target_type === 'subscribed_only') {
        recipients = await connection.query(
            `SELECT LOWER(TRIM(email)) AS email, user_id AS id, 1 AS is_subscribed
             FROM subscribers
             WHERE status = 1
               AND suspended_at IS NULL
               AND email IS NOT NULL
               AND TRIM(email) != ''`
        );
    } else if (announcement.target_type === 'registered_users_only') {
        recipients = await connection.query(
            "SELECT LOWER(TRIM(email)) AS email, id, 0 AS is_subscribed FROM users WHERE deleted_at IS NULL AND email IS NOT NULL AND TRIM(email) != ''"
        );
    } else {
        recipients = await connection.query(`
            SELECT
                email,
                MAX(is_subscribed) AS is_subscribed,
                COALESCE(
                    MIN(CASE WHEN source_type = 'user' THEN id END),
                    MIN(id)
                ) AS id
            FROM (
                SELECT LOWER(TRIM(email)) AS email, user_id AS id, 1 AS is_subscribed, 'subscriber' AS source_type
                FROM subscribers
                WHERE status = 1
                  AND suspended_at IS NULL
                  AND email IS NOT NULL
                  AND TRIM(email) != ''
                UNION
                SELECT LOWER(TRIM(email)) AS email, id, 0 AS is_subscribed, 'user' AS source_type
                FROM users
                WHERE deleted_at IS NULL
                  AND email IS NOT NULL
                  AND TRIM(email) != ''
            ) as unified_emails
            GROUP BY email
        `);
    }

    /** Filter recipients by zone if zone_scope = 'selected' */
    if (announcement.zone_scope === 'selected' && (selectedLocationMappingIds.length > 0 || selectedCityNames.length > 0)) {
        const zoneConditionParts = [];
        const zoneParams = [];

        if (selectedLocationMappingIds.length > 0) {
            zoneConditionParts.push("(ua.location_mapping_id IN (?) OR oa.location_mapping_id IN (?))");
            zoneParams.push(selectedLocationMappingIds, selectedLocationMappingIds);
        }

        if (selectedCityNames.length > 0) {
            zoneConditionParts.push(`(
                LOWER(TRIM(COALESCE(lmu.city_name, ua.city, ''))) IN (?)
                OR LOWER(TRIM(COALESCE(lmo.city_name, oa.city, ''))) IN (?)
            )`);
            zoneParams.push(selectedCityNames, selectedCityNames);
        }

        const userIdsInZone = await connection.query(
            `SELECT DISTINCT u.id
             FROM users u
             LEFT JOIN user_addresses ua ON ua.user_id = u.id
             LEFT JOIN location_mappings lmu ON lmu.id = ua.location_mapping_id
             LEFT JOIN orders o ON o.customer_id = u.id
             LEFT JOIN order_addresses oa ON oa.order_id = o.id
             LEFT JOIN location_mappings lmo ON lmo.id = oa.location_mapping_id
             WHERE u.deleted_at IS NULL
               AND (${zoneConditionParts.join(" OR ")})`,
            zoneParams
        );

        const zoneUserIds = new Set(userIdsInZone.map(r => r.id));
        recipients = recipients.filter(r => r.id && zoneUserIds.has(r.id));
    }

    /** Final de-duplication by email to prevent duplicate sends */
    {
        const byEmail = new Map();
        for (const recipient of recipients) {
            const email = normalizeEmail(recipient.email);
            if (!email) continue;

            const existing = byEmail.get(email);
            if (!existing) {
                byEmail.set(email, { ...recipient, email });
                continue;
            }

            // Prefer row with user id for downstream zone/SMS mapping.
            if (!existing.id && recipient.id) {
                byEmail.set(email, { ...recipient, email });
                continue;
            }

            // Preserve subscribed flag if any source marks as subscribed.
            if (!existing.is_subscribed && recipient.is_subscribed) {
                byEmail.set(email, { ...existing, is_subscribed: 1, email });
            }
        }
        recipients = [...byEmail.values()];
    }

    if (recipients.length === 0) {
        throw new errors.INVALID_FIELDS_PROVIDED("No active recipients found.");
    }

    /** Fetch verified phone numbers for SMS recipients (only registered users have phones) */
    let smsPhoneMap = new Map(); // user_id -> phone_number
    if (channel === 'sms' || channel === 'both') {
        if (announcement.target_type === 'subscribed_only') {
            // Subscribers don't have phone records — SMS not possible
            console.warn('[Announcement SMS] target_type=subscribed_only has no phone records. SMS skipped.');
        } else {
            const recipientIds = recipients.map(r => r.id).filter(Boolean);
            if (recipientIds.length > 0) {
                const phoneRows = await connection.query(
                    `SELECT up.user_id, MIN(up.phone_number) AS phone_number
                     FROM user_phones up
                     WHERE up.user_id IN (?) AND up.is_verified = 1
                     GROUP BY up.user_id`,
                    [recipientIds]
                );
                for (const row of phoneRows) {
                    smsPhoneMap.set(row.user_id, row.phone_number);
                }
            }
        }
    }

    /** Update Status */
    await connection.query(
        "UPDATE announcements SET status = 'sent', sent_at = NOW() WHERE id = ?",
        [announcementId]
    );

    const emailRecipientCount = (channel === 'email' || channel === 'both') ? recipients.length : 0;
    const smsRecipientCount   = smsPhoneMap.size;
    const smsText             = htmlToSmsText(announcement.body);

    /** Throttled Background Dispatch — Email leg */
    if (channel === 'email' || channel === 'both') {
        (async () => {
            let mailConn;
            try {
                mailConn = await database.getConnection();
                for (let i = 0; i < recipients.length; i++) {
                    const recipient = recipients[i];
                    const token = await generateUnsubscribeToken(recipient);
                    try {
                        await sendAnnouncementMail(mailConn, {
                            email: recipient.email,
                            headline: announcement.headline,
                            body: announcement.body,
                            token,
                            image: announcement.image_path ? `${STORAGE_URL}${announcement.image_path}` : null,
                            is_subscribed: !!recipient.is_subscribed
                        });
                    } catch (sendErr) {
                        console.error(`[Announcement Email] Failed for ${recipient.email}:`, errMsg(sendErr));
                    }
                    if (i < recipients.length - 1) await delay(250);
                }
            } catch (err) {
                console.error('[Announcement Email] Critical error:', errMsg(err));
            } finally {
                if (mailConn) await mailConn.release();
            }
        })();
    }

    /** Throttled Background Dispatch — SMS leg */
    if ((channel === 'sms' || channel === 'both') && smsPhoneMap.size > 0) {
        (async () => {
            let smsConn;
            try {
                smsConn = await database.getConnection();
                const phones = [...new Set(
                    [...smsPhoneMap.values()]
                        .map((p) => normalizePhoneForSend(p))
                        .filter(Boolean)
                )];
                for (let i = 0; i < phones.length; i++) {
                    try {
                        await sendSMS(smsConn, phones[i], smsText);
                    } catch (smsErr) {
                        console.error(`[Announcement SMS] Failed for ${phones[i]}:`, errMsg(smsErr));
                    }
                    if (i < phones.length - 1) await delay(300);
                }
            } catch (err) {
                console.error('[Announcement SMS] Critical error:', errMsg(err));
            } finally {
                if (smsConn) await smsConn.release();
            }
        })();
    }

    return { channel, emailRecipientCount, smsRecipientCount };
};


exports.sendAnnouncement = api({
    params: {
        id: { type: "int", required: true }
    }
}, auth(async (req, connection, adminInfo) => {
    const announcementId = req.typed.params.id;

    /** 1️⃣ Authorization */
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "READ_ONLY_ADMIN"];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
        throw new errors.UNAUTHORIZED();
    }

    /** 2️⃣ Dispatch via shared core logic */
    const result = await exports.dispatchAnnouncementById(connection, announcementId);

    /** 3️⃣ Audit Log */
    await connection.query(
        `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta) 
         VALUES (?, 'SEND_ANNOUNCEMENT', 'announcements', ?, ?)`,
        [adminInfo.id, announcementId, JSON.stringify({
            channel: result.channel,
            email_recipients: result.emailRecipientCount,
            sms_recipients: result.smsRecipientCount
        })]
    );

    const approxMinutes = Math.ceil((
        result.emailRecipientCount * 0.25 + result.smsRecipientCount * 0.3
    ) / 60);

    return {
        success: true,
        channel: result.channel,
        email_recipient_count: result.emailRecipientCount,
        sms_recipient_count: result.smsRecipientCount,
        message: `Sending started. It will take approx ${approxMinutes || 1} minutes.`
    };
}));




exports.sendManualAnnouncement = api({
    body: {
        announcement_id: { type: "int", required: true } 
    }
}, auth(async (req, connection, adminInfo) => {
    const { announcement_id } = req.typed.body;
    const { emails, phones } = req.body; // phones: optional array of BD phone numbers (11-digit)

    /** 1️⃣ Authorization */
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN","READ_ONLY_ADMIN"];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
        throw new errors.UNAUTHORIZED();
    }

    /** 1.5️⃣ Determine which channels are requested and check availability */
    const hasEmails = Array.isArray(emails) && emails.length > 0;
    const hasPhones = Array.isArray(phones)  && phones.length  > 0;

    if (!hasEmails && !hasPhones) {
        throw new errors.INVALID_FIELDS_PROVIDED("Provide at least one email or phone number.");
    }

    const { emailOk, smsOk } = await checkServiceAvailability(connection);
    if (hasEmails && !emailOk) {
        throw new errors.SERVICE_UNAVAILABLE("Email service is not configured or disabled.");
    }
    if (hasPhones && !smsOk) {
        throw new errors.SERVICE_UNAVAILABLE("SMS service is not configured or disabled.");
    }


    /** 2️⃣ Normalize, Validate & Deduplicate Emails & Phones */

    // Normalize phone: strip non-digits, remove leading 880/+880  → must be 01xxxxxxxxx (11 digits)
    const normalizePhone = (p) => {
        let digits = String(p).replace(/\D/g, '');
        if (digits.startsWith('880')) digits = '0' + digits.slice(3); // 880xxxxxxxxxx → 0xxxxxxxxxx
        return digits; // expected 11 digits starting with 01
    };

    let cleanEmails = [];
    let cleanPhones = [];

    if (hasEmails) {
        cleanEmails = [...new Set(emails.map(e => e.toLowerCase().trim()))];
        const invalidEmails = cleanEmails.filter(email => !validator.isEmail(email));
        if (invalidEmails.length > 0) {
            throw new errors.INVALID_FIELDS_PROVIDED(`Invalid email addresses: ${invalidEmails.join(", ")}`);
        }
    }

    if (hasPhones) {
        const normalized = phones.map(normalizePhone);
        cleanPhones = [...new Set(normalized)]; // deduplicate
        const invalidPhones = cleanPhones.filter(p => !/^01[0-9]{9}$/.test(p));
        if (invalidPhones.length > 0) {
            throw new errors.INVALID_FIELDS_PROVIDED(`Invalid phone numbers: ${invalidPhones.join(", ")}`);
        }
    }

    const announcement = await connection.queryOne(
        "SELECT * FROM announcements WHERE id = ? AND deleted_at IS NULL",
        [announcement_id]
    );

    if (!announcement) throw new errors.NOT_FOUND("Announcement not found.");

    // Business Rule: For manual sends, ensure the template is general (target_type = 'all')
    // if (announcement.target_type !== 'all') {
    //     throw new errors.FORBIDDEN("Manual dispatch is only allowed for announcements with 'all' target type.");
    // }

    /** 3️⃣ Fetch Subscriber Status for email recipients */
    let subscriberMap = new Map();
    if (cleanEmails.length > 0) {
        const subscriberData = await connection.query(`
            SELECT email, user_id as id FROM subscribers 
            WHERE email IN (?) AND status = 1 AND suspended_at IS NULL
        `, [cleanEmails]);
        subscriberMap = new Map(subscriberData.map(s => [s.email.toLowerCase(), s.id]));
    }

    const smsText = htmlToSmsText(announcement.body);

    /** 4️⃣ Throttled Background Dispatch — Email leg */
    if (cleanEmails.length > 0) {
        (async () => {
            let mailConn;
            try {
                mailConn = await database.getConnection();
                for (let i = 0; i < cleanEmails.length; i++) {
                    const email = cleanEmails[i];

                    const subscriberId = subscriberMap.get(email);
                    const isSubscribed = !!subscriberId;
                    const token = isSubscribed
                        ? await generateUnsubscribeToken({ email, id: subscriberId })
                        : null;
                    try {
                        await sendAnnouncementMail(mailConn, {
                            email,
                            headline: announcement.headline,
                            body: announcement.body,
                            token,
                            image: announcement.image_path ? `${STORAGE_URL}${announcement.image_path}` : null,
                            is_subscribed: isSubscribed
                        });
                    } catch (sendErr) {
                        console.error(`[Manual Email] Failed for ${email}:`, errMsg(sendErr));
                    }
                    if (i < cleanEmails.length - 1) await delay(250);
                }
            } catch (err) {
                console.error('[Manual Email] Critical error:', errMsg(err));
            } finally {
                if (mailConn) await mailConn.release();
            }
        })();
    }

    /** 4.5️⃣ Throttled Background Dispatch — SMS leg */
    if (cleanPhones.length > 0) {
        (async () => {
            let smsConn;
            try {
                smsConn = await database.getConnection();
                for (let i = 0; i < cleanPhones.length; i++) {
                    try {
                        await sendSMS(smsConn, cleanPhones[i], smsText);
                    } catch (smsErr) {
                        console.error(`[Manual SMS] Failed for ${cleanPhones[i]}:`, errMsg(smsErr));
                    }
                    if (i < cleanPhones.length - 1) await delay(300);
                }
            } catch (err) {
                console.error('[Manual SMS] Critical error:', errMsg(err));
            } finally {
                if (smsConn) await smsConn.release();
            }
        })();
    }

    /** 5️⃣ Audit Log */
    await connection.query(
        `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta) 
         VALUES (?, 'MANUAL_SEND_ANNOUNCEMENT', 'announcements', ?, ?)`,
        [adminInfo.id, announcement_id, JSON.stringify({
            email_count: cleanEmails.length,
            sms_count:   cleanPhones.length
        })]
    );

    return {
        success: true,
        email_recipients: cleanEmails.length,
        sms_recipients:   cleanPhones.length,
        message: `Manual dispatch started for ${cleanEmails.length + cleanPhones.length} recipient(s).`
    };
}));


 

exports.getAnnouncementCounts = api(
  {
    /* No query params required */
  },
  auth(async (req, connection, adminInfo) => {
    /** 1️⃣ Authorization */
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "READ_ONLY_ADMIN"];
    if (!adminInfo.roles.some(role => ALLOWED_ROLES.includes(role))) {
      throw new errors.UNAUTHORIZED();
    }

    /** 2️⃣ Execute Aggregation */
    const counts = await connection.queryOne(`
      SELECT 
        /* 1. Total unsent announcement (Drafts + Scheduled) */
        COUNT(CASE WHEN status IN ('draft', 'scheduled') THEN 1 END) as total_unsent,

        /* 2. Total count of announcement that are scheduled but not yet sent (Future time) */
        COUNT(CASE WHEN status = 'scheduled' AND scheduled_at > CURRENT_TIMESTAMP() THEN 1 END) as total_scheduled_pending,

        /* 3. Total number of announcements scheduled but not sent and time has passed (Missed/Overdue) */
        COUNT(CASE WHEN status = 'scheduled' AND scheduled_at <= CURRENT_TIMESTAMP() THEN 1 END) as total_scheduled_missed

      FROM announcements
      WHERE deleted_at IS NULL
    `);

    return {
      success: true,
      meta: {
        total_unsent: Number(counts.total_unsent) || 0,
        total_scheduled_pending: Number(counts.total_scheduled_pending) || 0,
        total_scheduled_overdue: Number(counts.total_scheduled_missed) || 0
      }
    };
  })
);


/**
 * GET /api/v1/admin/city-zones
 * Returns distinct non-empty city names sourced from both order_addresses and
 * user_addresses. Used by the admin panel to suggest zone targets when creating
 * or editing an announcement.
 *
 * Auth: SUPER_ADMIN, ADMIN, or READ_ONLY_ADMIN
 */
exports.getCityZones = api(
  {},
  auth(async (req, connection, adminInfo) => {
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "READ_ONLY_ADMIN"];
    if (!adminInfo.roles.some((r) => ALLOWED_ROLES.includes(r))) {
      throw new errors.UNAUTHORIZED();
    }

    // Use standardized city names from location_mappings (Pathao-sourced, consistent spelling)
    // Supplement with legacy text city values for users who ordered before the area selector
    const rows = await connection.query(`
      SELECT DISTINCT city_name AS city
      FROM location_mappings
      WHERE pathao_city_id IS NOT NULL AND city_name IS NOT NULL AND TRIM(city_name) != ''
      UNION
      SELECT DISTINCT TRIM(city) AS city
      FROM (
        SELECT city FROM order_addresses WHERE city IS NOT NULL AND TRIM(city) != ''
        UNION
        SELECT city FROM user_addresses WHERE city IS NOT NULL AND TRIM(city) != ''
      ) AS legacy
      WHERE TRIM(city) != ''
      ORDER BY city ASC
    `);

    const cities = rows
      .map((r) => r.city)
      .filter(Boolean)
      .map((c) => c.trim());

    return {
      success: true,
      total: cities.length,
      cities,
    };
  })
);

