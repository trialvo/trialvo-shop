const { uploadSingle, uploadMultiple, processImage, saveVideo, ALLOWED_IMAGE_TYPES } = require('../../middleware/upload');

// ── Helper to build relative path (frontend prepends IMAGE_BASE_URL) ──────────
function buildUrl(req, filename, isVideo) {
 return `/uploads/${isVideo ? 'videos' : 'images'}/${filename}`;
}

// ── POST /api/admin/upload — single file ──────────────────────────────────────
exports.uploadOne = (req, res) => {
 uploadSingle(req, res, async (err) => {
  if (err) return res.status(400).json({ success: false, message: err.message });
  if (!req.file) return res.status(400).json({ success: false, message: 'কোনো ফাইল পাওয়া যায়নি' });

  try {
   const isImage = ALLOWED_IMAGE_TYPES.includes(req.file.mimetype);
   let filename, size;

   if (isImage) {
    // Compress & convert to WebP via Sharp
    ({ filename, size } = await processImage(req.file.buffer, req.file.originalname));
   } else {
    // Video — write buffer directly to disk
    ({ filename, size } = saveVideo(req.file.buffer, req.file.originalname));
   }

   const url = buildUrl(req, filename, !isImage);
   return res.json({
    success: true,
    url,
    filename,
    mimetype: isImage ? 'image/webp' : req.file.mimetype,
    size,
    type: isImage ? 'image' : 'video',
   });
  } catch (processErr) {
   console.error('Image processing error:', processErr);
   return res.status(500).json({ success: false, message: 'ফাইল প্রক্রিয়াকরণে সমস্যা হয়েছে' });
  }
 });
};

// ── POST /api/admin/upload/multiple — up to 10 files ─────────────────────────
exports.uploadMany = (req, res) => {
 uploadMultiple(req, res, async (err) => {
  if (err) return res.status(400).json({ success: false, message: err.message });
  if (!req.files || req.files.length === 0)
   return res.status(400).json({ success: false, message: 'কোনো ফাইল পাওয়া যায়নি' });

  try {
   const results = await Promise.all(
    req.files.map(async (f) => {
     const isImage = ALLOWED_IMAGE_TYPES.includes(f.mimetype);
     let filename, size;

     if (isImage) {
      ({ filename, size } = await processImage(f.buffer, f.originalname));
     } else {
      ({ filename, size } = saveVideo(f.buffer, f.originalname));
     }

     return {
      url: buildUrl(req, filename, !isImage),
      filename,
      mimetype: isImage ? 'image/webp' : f.mimetype,
      size,
      type: isImage ? 'image' : 'video',
     };
    })
   );

   return res.json({ success: true, files: results });
  } catch (processErr) {
   console.error('Image processing error:', processErr);
   return res.status(500).json({ success: false, message: 'ফাইল প্রক্রিয়াকরণে সমস্যা হয়েছে' });
  }
 });
};
