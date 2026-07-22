const { pool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
const storage = require('../services/storage');

// Product/category imagery is normalized to a sane max width and re-encoded to
// WebP so the storefront stays fast regardless of what admins upload. Oversized
// originals never reach the bucket.
const MAX_WIDTH = 1600;
const WEBP_QUALITY = 82;

const ALLOWED_KINDS = ['product_image', 'thumbnail', 'category_icon'];
const ALLOWED_OWNER_TYPES = ['product', 'category', null];

// POST /api/admin/media/upload — multipart field "file"
async function uploadMedia(req, res, next) {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded (field name must be "file")' });
        }

        const kind = ALLOWED_KINDS.includes(req.body.kind) ? req.body.kind : 'product_image';
        const ownerType = ALLOWED_OWNER_TYPES.includes(req.body.owner_type || null)
            ? (req.body.owner_type || null)
            : null;
        const ownerId = req.body.owner_id || null;

        // Normalize: cap width (never upscale), strip metadata, encode WebP.
        const pipeline = sharp(req.file.buffer, { failOn: 'none' })
            .rotate()
            .resize({ width: MAX_WIDTH, withoutEnlargement: true })
            .webp({ quality: WEBP_QUALITY });

        const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });

        const subdir = kind === 'category_icon' ? 'categories' : 'products';
        const { storageKey, url } = await storage.saveBuffer(data, { ext: '.webp', subdir });

        const id = uuidv4();
        await pool.query(
            `INSERT INTO media_assets (id, kind, owner_type, owner_id, url, storage_key, mime, size_bytes, width, height)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [id, kind, ownerType, ownerId, url, storageKey, 'image/webp', data.length, info.width, info.height]
        );

        res.status(201).json({ id, url, width: info.width, height: info.height });
    } catch (error) {
        next(error);
    }
}

// DELETE /api/admin/media/:id
async function deleteMedia(req, res, next) {
    try {
        const { id } = req.params;
        const { rows } = await pool.query('SELECT storage_key FROM media_assets WHERE id = $1', [id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Media not found' });

        await storage.deleteKey(rows[0].storage_key);
        await pool.query('DELETE FROM media_assets WHERE id = $1', [id]);
        res.json({ message: 'Media deleted successfully' });
    } catch (error) {
        next(error);
    }
}

module.exports = { uploadMedia, deleteMedia };
