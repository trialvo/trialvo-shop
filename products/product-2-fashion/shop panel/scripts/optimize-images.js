/**
 * One-time script to:
 * 1. Generate PWA icons (192x192, 512x512, maskable) from h-logo.png
 * 2. Compress large PNG images in /public/ to WebP
 */
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const PUBLIC = path.join(__dirname, "..", "public");
const ICONS_DIR = path.join(PUBLIC, "icons");

async function generatePwaIcons() {
 const logo = path.join(PUBLIC, "h-logo.png");
 if (!fs.existsSync(logo)) {
  console.log("⚠ h-logo.png not found, skipping PWA icon generation");
  return;
 }

 console.log("Generating PWA icons from h-logo.png...");

 // 192x192
 await sharp(logo)
  .resize(192, 192, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
  .png({ quality: 90 })
  .toFile(path.join(ICONS_DIR, "icon-192x192.png"));
 console.log("  ✓ icon-192x192.png");

 // 512x512
 await sharp(logo)
  .resize(512, 512, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
  .png({ quality: 90 })
  .toFile(path.join(ICONS_DIR, "icon-512x512.png"));
 console.log("  ✓ icon-512x512.png");

 // 512x512 maskable (with padding)
 await sharp(logo)
  .resize(400, 400, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
  .extend({
   top: 56, bottom: 56, left: 56, right: 56,
   background: { r: 255, g: 255, b: 255, alpha: 1 },
  })
  .png({ quality: 90 })
  .toFile(path.join(ICONS_DIR, "icon-maskable-512x512.png"));
 console.log("  ✓ icon-maskable-512x512.png");
}

async function compressImages() {
 const targets = ["slider1.png", "slider2.png", "pant.png", "video-banner.png"];

 for (const file of targets) {
  const src = path.join(PUBLIC, file);
  if (!fs.existsSync(src)) {
   console.log(`⚠ ${file} not found, skipping`);
   continue;
  }

  const stat = fs.statSync(src);
  const sizeMB = (stat.size / 1024 / 1024).toFixed(2);

  // Compress PNG in-place
  const buf = await sharp(src)
   .png({ quality: 80, compressionLevel: 9 })
   .toBuffer();

  fs.writeFileSync(src, buf);
  const newSize = (buf.length / 1024 / 1024).toFixed(2);
  console.log(`  ✓ ${file}: ${sizeMB}MB → ${newSize}MB`);
 }
}

(async () => {
 try {
  await generatePwaIcons();
  console.log("\nCompressing large images...");
  await compressImages();
  console.log("\n✅ Done!");
 } catch (err) {
  console.error("Error:", err);
  process.exit(1);
 }
})();
