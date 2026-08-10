const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// ── Ensure upload directories exist ──────────────────────────────────────────
const IMAGE_DIR = path.join(__dirname, '..', '..', 'uploads', 'images');
const VIDEO_DIR = path.join(__dirname, '..', '..', 'uploads', 'videos');
[IMAGE_DIR, VIDEO_DIR].forEach((d) => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

// ── Memory storage (raw bytes held in RAM before processing) ──────────────────
const storage = multer.memoryStorage();

// ── File filter ────────────────────────────────────────────────────────────────
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];

function fileFilter(req, file, cb) {
 if ([...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES].includes(file.mimetype)) {
  cb(null, true);
 } else {
  cb(new Error(`অসমর্থিত ফাইলের ধরন: ${file.mimetype}`), false);
 }
}

// ── Multer instances (memory) ─────────────────────────────────────────────────
const uploadSingle = multer({
 storage,
 fileFilter,
 limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
}).single('file');

const uploadMultiple = multer({
 storage,
 fileFilter,
 limits: { fileSize: 50 * 1024 * 1024 },
}).array('files', 10); // max 10 files at once

// ── Image optimiser via Sharp ─────────────────────────────────────────────────
/**
 * Converts an image buffer to an optimised WebP file on disk.
 * - Format  : WebP
 * - Quality : 75  (great compression, still visually lossless)
 * - Width   : max 1200 px  (aspect-ratio preserved, no upscaling)
 *
 * @param {Buffer} buffer  - Raw image bytes from multer memoryStorage
 * @param {string} originalName - Original filename (used to build the output name)
 * @returns {Promise<{filename: string, filepath: string, size: number}>}
 */
async function processImage(buffer, originalName) {
 const ext = path.extname(originalName).toLowerCase();
 const base = path.basename(originalName, ext)
  .toLowerCase()
  .replace(/[^a-z0-9]/g, '-')
  .substring(0, 40);

 const filename = `${base}-${Date.now()}.webp`;
 const filepath = path.join(IMAGE_DIR, filename);

 await sharp(buffer)
  .resize({ width: 1200, withoutEnlargement: true })
  .webp({ quality: 75 })
  .toFile(filepath);

 const { size } = fs.statSync(filepath);
 return { filename, filepath, size };
}

// ── Video writer (no processing needed) ──────────────────────────────────────
/**
 * Writes a video buffer directly to disk without any processing.
 * @param {Buffer} buffer
 * @param {string} originalName
 * @returns {{filename: string, filepath: string, size: number}}
 */
function saveVideo(buffer, originalName) {
 const ext = path.extname(originalName).toLowerCase();
 const base = path.basename(originalName, ext)
  .toLowerCase()
  .replace(/[^a-z0-9]/g, '-')
  .substring(0, 40);

 const filename = `${base}-${Date.now()}${ext}`;
 const filepath = path.join(VIDEO_DIR, filename);
 fs.writeFileSync(filepath, buffer);
 return { filename, filepath, size: buffer.length };
}

module.exports = { uploadSingle, uploadMultiple, processImage, saveVideo, ALLOWED_IMAGE_TYPES };
