/**
 * controllers/location_sync.js
 *
 * Admin-only endpoints:
 *   POST /api/v1/config/sync-pathao-locations    → fills pathao_locations_raw
 *   POST /api/v1/config/sync-steadfast-locations → fills steadfast_locations_raw
 *   POST /api/v1/config/merge-location-mappings  → merges staging into location_mappings
 *                                                   and backfills order_addresses
 */

const { api, auth }       = require('../helpers/common');
const errors              = require('../helpers/errors');
const {
  getPathaoToken,
  fetchPathaoCities,
  fetchPathaoZones,
  fetchPathaoAreas,
}                         = require('../helpers/courier');
const axios               = require('axios');

// ─── helpers ──────────────────────────────────────────────────────────────────

async function getConfig(connection, requireActive = false, service = null) {
  let q = 'SELECT * FROM system_config WHERE 1=1';
  const params = [];
  if (service)       { q += ' AND service = ?'; params.push(service); }
  if (requireActive) { q += ' AND is_active = 1'; }
  return connection.query(q, params);
}

function buildCourierCfg(rows) {
  const cfg = {};
  for (const row of rows) {
    if (!cfg[row.provider]) cfg[row.provider] = {};
    cfg[row.provider][row.key_name] = row.value;
  }
  return cfg;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// Normalize a city string for fuzzy matching (lowercase, trim, hyphen→space)
const normalize = s => (s || '').toLowerCase().trim().replace(/-/g, ' ');

// ─── Pathao sync ──────────────────────────────────────────────────────────────

exports.syncPathaoLocations = api(
  {},
  auth(async (req, connection, adminInfo) => {
    if (!adminInfo.roles.includes('SUPER_ADMIN'))
      throw new errors.UNAUTHORIZED();

    const rows    = await getConfig(connection, true, 'courier');
    const configs = buildCourierCfg(rows);

    if (!configs.pathao?.PATHAO_CLIENT_ID)
      throw new errors.BAD_REQUEST('Pathao is not configured or inactive.');

    const cfg   = configs.pathao;
    const token = await getPathaoToken(cfg);
    const cities = await fetchPathaoCities(cfg, token);

    if (!cities.length)
      throw new errors.BAD_REQUEST('Pathao returned 0 cities — check credentials / base URL.');

    let inserted = 0;
    const errors_list = [];

    // TRUNCATE staging table before fresh fill
    await connection.query('TRUNCATE TABLE pathao_locations_raw');

    for (const city of cities) {
      await sleep(800);
      let zones = [];
      try {
        zones = await fetchPathaoZones(cfg, token, city.city_id);
      } catch (e) {
        errors_list.push(`Zone fetch failed for city ${city.city_name} (${city.city_id}): ${e.message}`);
        continue;
      }

      for (const zone of zones) {
        await sleep(800);
        let areas = [];
        try {
          areas = await fetchPathaoAreas(cfg, token, zone.zone_id);
        } catch (e) {
          errors_list.push(`Area fetch failed for zone ${zone.zone_name} (${zone.zone_id}): ${e.message}`);
          continue;
        }

        for (const area of areas) {
          try {
            await connection.query(
              `INSERT INTO pathao_locations_raw
                 (city_id, city_name, zone_id, zone_name, area_id, area_name)
               VALUES (?, ?, ?, ?, ?, ?)
               ON DUPLICATE KEY UPDATE
                 city_id   = VALUES(city_id),
                 city_name = VALUES(city_name),
                 zone_id   = VALUES(zone_id),
                 zone_name = VALUES(zone_name),
                 area_name = VALUES(area_name),
                 synced_at = CURRENT_TIMESTAMP`,
              [city.city_id, city.city_name, zone.zone_id, zone.zone_name, area.area_id, area.area_name]
            );
            inserted++;
          } catch (e) {
            errors_list.push(`Insert failed (area ${area.area_id}): ${e.message}`);
          }
        }
      }
    }

    return {
      success: errors_list.length === 0,
      message: 'Pathao location sync complete',
      stats: { inserted, errors: errors_list },
    };
  })
);

// ─── Steadfast sync ───────────────────────────────────────────────────────────

exports.syncSteadfastLocations = api(
  {},
  auth(async (req, connection, adminInfo) => {
    if (!adminInfo.roles.includes('SUPER_ADMIN'))
      throw new errors.UNAUTHORIZED();

    const rows    = await getConfig(connection, true, 'courier');
    const configs = buildCourierCfg(rows);

    if (!configs.steadfast?.STEADFAST_API_KEY)
      throw new errors.BAD_REQUEST('Steadfast is not configured or inactive.');

    const cfg     = configs.steadfast;
    const baseUrl = cfg.STEADFAST_BASE_URL.replace(/\/$/, '');

    let sfData;
    try {
      const res = await axios.get(`${baseUrl}/police_stations`, {
        headers: {
          'Api-Key':      cfg.STEADFAST_API_KEY,
          'Secret-Key':   cfg.STEADFAST_SECRET_KEY,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      });
      if (res.data?.status !== 'success' || !Array.isArray(res.data?.data))
        throw new Error(res.data?.message || 'Invalid Steadfast response');
      sfData = res.data.data;
    } catch (e) {
      throw new errors.BAD_REQUEST(`Steadfast API error: ${e.message}`);
    }

    await connection.query('TRUNCATE TABLE steadfast_locations_raw');

    let inserted = 0;
    const errors_list = [];

    for (const district of sfData) {
      if (!Array.isArray(district.policestations)) continue;
      for (const ps of district.policestations) {
        try {
          await connection.query(
            `INSERT INTO steadfast_locations_raw
               (district_id, district_name, station_id, station_name)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
               district_id   = VALUES(district_id),
               district_name = VALUES(district_name),
               station_name  = VALUES(station_name),
               synced_at     = CURRENT_TIMESTAMP`,
            [district.id, district.name, ps.id, ps.name]
          );
          inserted++;
        } catch (e) {
          errors_list.push(`Insert failed (station ${ps.id} – ${ps.name}): ${e.message}`);
        }
      }
    }

    return {
      success: errors_list.length === 0,
      message: 'Steadfast location sync complete',
      stats: { inserted, errors: errors_list },
    };
  })
);

// ─── Merge runner (inline — uses the api() connection, no child process) ──────

exports.mergeLocationMappings = api(
  {},
  auth(async (req, connection, adminInfo) => {
    if (!adminInfo.roles.includes('SUPER_ADMIN'))
      throw new errors.UNAUTHORIZED();

    const dry_run        = req.query.dry_run        === 'true' || req.query.dry_run        === '1';
    const pathao_only    = req.query.pathao_only    === 'true' || req.query.pathao_only    === '1';
    const steadfast_only = req.query.steadfast_only === 'true' || req.query.steadfast_only === '1';
    const DO_PATHAO    = !steadfast_only;
    const DO_STEADFAST = !pathao_only;

    const log  = [];
    const info = (msg) => { console.log('[merge]', msg); log.push(msg); };
    const warn = (msg) => { console.warn('[merge][WARN]', msg); log.push('[WARN] ' + msg); };

    if (dry_run) info('*** DRY-RUN MODE — no DB writes ***');

    // Staging table counts
    const [pathaoRow] = await connection.query('SELECT COUNT(*) AS c FROM pathao_locations_raw');
    const [sfRow]     = await connection.query('SELECT COUNT(*) AS c FROM steadfast_locations_raw');
    info(`Staging: pathao_locations_raw=${pathaoRow.c}  steadfast_locations_raw=${sfRow.c}`);

    if (DO_PATHAO    && pathaoRow.c === 0) warn('pathao_locations_raw is empty — run sync first.');
    if (DO_STEADFAST && sfRow.c === 0)     warn('steadfast_locations_raw is empty — run sync first.');

    // ── Step 1: Pathao ────────────────────────────────────────────────────────
    if (DO_PATHAO) {
      info('=== Pathao merge ===');
      const rows = await connection.query(
        'SELECT * FROM pathao_locations_raw ORDER BY city_id, zone_id, area_id'
      );
      info(`  Rows: ${rows.length}`);

      if (rows.length) {
        rows.slice(0, 3).forEach(r =>
          info(`  sample: city="${r.city_name}"  zone="${r.zone_name}"  area="${r.area_name}"`)
        );

        if (!dry_run) {
          let upserted = 0, failed = 0;
          for (const r of rows) {
            try {
              await connection.query(
                `INSERT INTO location_mappings
                   (location_type, district_name, city_name, area_name,
                    pathao_city_id, pathao_zone_id, pathao_area_id)
                 VALUES ('city', ?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                   district_name  = VALUES(district_name),
                   city_name      = VALUES(city_name),
                   area_name      = VALUES(area_name),
                   pathao_city_id = VALUES(pathao_city_id),
                   pathao_zone_id = VALUES(pathao_zone_id)`,
                [r.city_name, r.zone_name, r.area_name, r.city_id, r.zone_id, r.area_id]
              );
              upserted++;
            } catch (e) {
              warn(`  area_id=${r.area_id} failed: ${e.message}`);
              failed++;
            }
          }
          info(`  Pathao done — upserted: ${upserted}  failed: ${failed}`);
        } else {
          info('  [dry-run] skipping writes.');
        }
      }
    }

    // ── Step 2: Steadfast ─────────────────────────────────────────────────────
    if (DO_STEADFAST) {
      info('=== Steadfast merge ===');
      const rows = await connection.query(
        'SELECT * FROM steadfast_locations_raw ORDER BY district_id, station_id'
      );
      info(`  Rows: ${rows.length}`);

      if (rows.length) {
        rows.slice(0, 3).forEach(r =>
          info(`  sample: district="${r.district_name}"  station="${r.station_name}"`)
        );

        if (!dry_run) {
          let upserted = 0, failed = 0;
          for (const r of rows) {
            try {
              // 1. Already exists with this steadfast_id → just update district_name
              const byStation = await connection.query(
                'SELECT id FROM location_mappings WHERE steadfast_id = ? LIMIT 1',
                [r.station_id]
              );
              if (byStation && byStation.length) {
                await connection.query(
                  `UPDATE location_mappings
                   SET district_name = ?, city_name = COALESCE(city_name, ?)
                   WHERE id = ?`,
                  [r.district_name, r.station_name, byStation[0].id]
                );
              } else {
                // 2. Link to existing Pathao row in same district by area name
                const existing = await connection.query(
                  `SELECT id FROM location_mappings
                   WHERE district_name = ? AND area_name = ? AND steadfast_id IS NULL
                   LIMIT 1`,
                  [r.district_name, r.station_name]
                );
                if (existing && existing.length) {
                  await connection.query(
                    'UPDATE location_mappings SET steadfast_id = ? WHERE id = ?',
                    [r.station_id, existing[0].id]
                  );
                } else {
                  // 3. Insert as standalone Steadfast row
                  await connection.query(
                    `INSERT INTO location_mappings
                       (location_type, district_name, city_name, area_name, steadfast_id)
                     VALUES ('city', ?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE
                       district_name = VALUES(district_name),
                       city_name     = VALUES(city_name),
                       area_name     = VALUES(area_name)`,
                    [r.district_name, r.district_name, r.station_name, r.station_id]
                  );
                }
              }
              upserted++;
            } catch (e) {
              warn(`  station_id=${r.station_id} failed: ${e.message}`);
              failed++;
            }
          }
          info(`  Steadfast done — upserted: ${upserted}  failed: ${failed}`);
        } else {
          info('  [dry-run] skipping writes.');
        }
      }
    }

    // ── Step 3: Normalize legacy location_mappings rows ───────────────────────
    // Old rows have district_name=NULL but city_name holds a zone name (e.g. "Ashulia").
    // Self-join against already-populated rows to backfill district_name.
    info('=== Normalizing legacy rows (district_name IS NULL) ===');

    const populatedRows = await connection.query(
      `SELECT DISTINCT LOWER(TRIM(city_name)) AS k, district_name
       FROM location_mappings
       WHERE district_name IS NOT NULL AND city_name IS NOT NULL`
    );
    const cityDistrictMap = new Map();
    for (const r of populatedRows) {
      if (!cityDistrictMap.has(r.k)) cityDistrictMap.set(r.k, r.district_name);
    }

    const legacyRows = await connection.query(
      'SELECT id, city_name FROM location_mappings WHERE district_name IS NULL AND city_name IS NOT NULL'
    );
    const matchable = legacyRows.filter(r => cityDistrictMap.has(normalize(r.city_name)));
    info(`  Legacy rows without district_name: ${legacyRows.length}  matchable: ${matchable.length}`);

    if (!dry_run && matchable.length) {
      let normFixed = 0;
      for (const r of matchable) {
        const district = cityDistrictMap.get(normalize(r.city_name));
        await connection.query(
          'UPDATE location_mappings SET district_name = ? WHERE id = ?',
          [district, r.id]
        );
        normFixed++;
      }
      info(`  Updated ${normFixed} legacy rows with district_name.`);
    } else if (dry_run) {
      info(`  [dry-run] Would update ${matchable.length} legacy rows.`);
    }

    // ── Step 4: Backfill order_addresses.location_mapping_id ─────────────────
    // Match oa.city against lm.city_name, lm.area_name, AND lm.district_name.
    // Also handle known Bangla/English synonyms (Chattogram↔Chittagong, etc).
    // Prefer rows WITH district_name when multiple matches exist.
    info('=== Backfilling order_addresses.location_mapping_id ===');

    // Known synonyms & misspellings: alternate → canonical (in location_mappings)
    const SYNONYMS = {
      // Official Bangla/English alternate names
      'chattogram':   'chittagong',
      'cumilla':      'comilla',
      'barishal':     'barisal',
      'noakhali':     'noakhali',
      'coxs bazar':   "cox's bazar",
      'coxsbazar':    "cox's bazar",
      'jessore':      'jashore',
      // Common misspellings found in order_addresses
      'cittagong':    'chittagong',
      'kishorganj':   'kishoreganj',
      'kulna':        'khulna',
      'bagora':       'bogura',
      'rangur':       'rangpur',
      'nilfamari':    'nilphamari',
      'sirajganjn':   'sirajganj',
      'serpur':       'sherpur',
      'savaer':       'savar',
      'narsingdi':    'narsingdi',
    };

    const lmAll = await connection.query(
      'SELECT id, city_name, area_name, district_name FROM location_mappings WHERE city_name IS NOT NULL'
    );

    // Build lookup: normalized value → { id, hasDistrict }
    const cityIdMap = new Map();
    function addToMap(key, id, hasDistrict) {
      const k = normalize(key);
      if (!k) return;
      const existing = cityIdMap.get(k);
      // Prefer rows that have district_name set
      if (!existing || (hasDistrict && !existing.hasDistrict)) {
        cityIdMap.set(k, { id, hasDistrict });
      }
    }

    for (const r of lmAll) {
      const hasDist = !!r.district_name;
      addToMap(r.city_name,    r.id, hasDist);
      addToMap(r.area_name,    r.id, hasDist);
      addToMap(r.district_name, r.id, hasDist);
    }

    // Add synonym aliases: if "chittagong" is in the map, also add "chattogram"
    for (const [alias, canonical] of Object.entries(SYNONYMS)) {
      const entry = cityIdMap.get(normalize(canonical));
      if (entry && !cityIdMap.has(normalize(alias))) {
        cityIdMap.set(normalize(alias), entry);
      }
      // Also reverse: if alias is in the map but canonical isn't
      const aliasEntry = cityIdMap.get(normalize(alias));
      if (aliasEntry && !cityIdMap.has(normalize(canonical))) {
        cityIdMap.set(normalize(canonical), aliasEntry);
      }
    }

    // Find order_addresses that are unlinked OR linked to stale rows (district_name=NULL)
    const oaRows = await connection.query(
      `SELECT oa.id, oa.city, oa.location_mapping_id, lm.district_name
       FROM order_addresses oa
       LEFT JOIN location_mappings lm ON lm.id = oa.location_mapping_id
       WHERE oa.location_mapping_id IS NULL
          OR lm.district_name IS NULL`
    );
    info(`  order_addresses needing link/re-link: ${oaRows.length}`);

    // Helper: try exact match, then first-word fallback for multi-word entries
    function findMatch(city) {
      const k = normalize(city);
      if (!k) return null;
      // Exact match
      let entry = cityIdMap.get(k);
      if (entry) return entry;
      // First word fallback: "kurigram sadar kamarpara." → try "kurigram"
      const firstWord = k.replace(/[^a-z]/g, ' ').trim().split(/\s+/)[0];
      if (firstWord && firstWord.length >= 4 && firstWord !== k) {
        entry = cityIdMap.get(firstWord);
        if (entry) return entry;
      }
      return null;
    }

    if (!dry_run && oaRows.length) {
      let linked = 0, unmatched = [];
      for (const oa of oaRows) {
        const entry = findMatch(oa.city);
        if (!entry) { unmatched.push(oa.city); continue; }
        await connection.query(
          'UPDATE order_addresses SET location_mapping_id = ? WHERE id = ?',
          [entry.id, oa.id]
        );
        linked++;
      }
      info(`  Linked/re-linked ${linked} order_addresses rows.`);
      // Show unique unmatched cities for debugging
      const uniqueUnmatched = [...new Set(unmatched.map(c => (c || '').trim()))].slice(0, 20);
      if (uniqueUnmatched.length) {
        info(`  Unmatched cities (${uniqueUnmatched.length}): ${uniqueUnmatched.join(', ')}`);
      }
    } else if (dry_run) {
      const wouldLink = oaRows.filter(oa => findMatch(oa.city)).length;
      info(`  [dry-run] Would link/re-link ${wouldLink} order_addresses rows.`);
      const unmatched = [...new Set(oaRows.filter(oa => !findMatch(oa.city)).map(oa => (oa.city || '').trim()))].slice(0, 20);
      if (unmatched.length) info(`  Unmatched cities: ${unmatched.join(', ')}`);
    }


    // ── Step 5: Normalize Steadfast "X City" → Pathao "X" district names ─────
    // Steadfast uses "Dhaka City" / "Chittagong City" etc. while Pathao uses
    // "Dhaka" / "Chittagong". This causes them to show as separate zones.
    // Fix: if a location_mappings row has district_name = "X City" and "X"
    // exists as a canonical Pathao district_name, update it to "X".
    info('=== Normalizing Steadfast "X City" district names ===');

    // Get all distinct Pathao district names (they have pathao_city_id set)
    const pathaoCities = await connection.query(
      `SELECT DISTINCT LOWER(TRIM(district_name)) AS d
       FROM location_mappings
       WHERE district_name IS NOT NULL AND pathao_city_id IS NOT NULL`
    );
    const pathaoSet = new Set(pathaoCities.map(r => r.d));

    // Find rows where district_name ends with " City" and the base matches a Pathao city
    const cityRows = await connection.query(
      `SELECT id, district_name FROM location_mappings
       WHERE district_name LIKE '% City' OR district_name LIKE '% city'`
    );

    const toNormalize = cityRows.filter(r => {
      const base = r.district_name.replace(/ city$/i, '').trim();
      return pathaoSet.has(base.toLowerCase());
    });

    info(`  Rows with "X City" that can be normalized: ${toNormalize.length}`);

    if (!dry_run && toNormalize.length) {
      let normalized = 0;
      for (const r of toNormalize) {
        const canonical = r.district_name.replace(/ city$/i, '').trim();
        // Get the exact-case version from pathao rows
        const [pathaoRow] = await connection.query(
          'SELECT district_name FROM location_mappings WHERE LOWER(TRIM(district_name)) = ? AND pathao_city_id IS NOT NULL LIMIT 1',
          [canonical.toLowerCase()]
        );
        const districtName = pathaoRow ? pathaoRow.district_name : canonical;
        await connection.query(
          'UPDATE location_mappings SET district_name = ? WHERE id = ?',
          [districtName, r.id]
        );
        normalized++;
      }
      info(`  Normalized ${normalized} rows ("Dhaka City" → "Dhaka" etc.).`);

      // Also re-link order_addresses that point to those normalized rows so the
      // dashboard COALESCE picks up the updated district_name immediately
      if (toNormalize.length) {
        const normalizedIds = toNormalize.map(r => r.id);
        // No action needed — same row IDs, district_name already updated above
        info(`  order_addresses pointing to these rows will resolve correctly.`);
      }
    } else if (dry_run) {
      info(`  [dry-run] Would normalize ${toNormalize.length} rows.`);
    }

    // ── Final summary ────────────────────────────────────────────────────────
    const [lmTotal]  = await connection.query('SELECT COUNT(*) AS c FROM location_mappings');
    const [lmDist]   = await connection.query('SELECT COUNT(*) AS c FROM location_mappings WHERE district_name IS NOT NULL');
    const [oaLinked] = await connection.query('SELECT COUNT(*) AS c FROM order_addresses WHERE location_mapping_id IS NOT NULL');
    const [oaTotal]  = await connection.query('SELECT COUNT(*) AS c FROM order_addresses');
    info(`=== location_mappings: total=${lmTotal.c}  with district_name=${lmDist.c} ===`);
    info(`=== order_addresses linked: ${oaLinked.c} / ${oaTotal.c} ===`);
    info('Done.');


    return {
      success: true,
      dry_run,
      output: log.join('\n'),
    };
  })
);
