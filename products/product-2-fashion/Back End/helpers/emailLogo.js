const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

// Stable CID so Gmail can match multipart/related PNG to <img src="cid:...">
const EMAIL_LOGO_CID = "logo@trialvo.local";
const REL = path.join("branding", "email-logo.svg");
const MAX_BYTES = 256 * 1024;
const PNG_WIDTH = 320;

function resolveLogoPath() {
  return path.join(__dirname, "..", "uploads", REL);
}

function hasEmailLogo() {
  return fs.existsSync(resolveLogoPath());
}

function emptyLogoParts() {
  return {
    hasEmailLogo: false,
    EMAIL_LOGO_SRC: null,
    EMAIL_LOGO_CID: null,
    attachments: [],
  };
}

/**
 * SVG stays on disk. Mail embeds a PNG via multipart/related CID.
 * Gmail strips data: image URIs, so CID PNG is the only reliable
 * no-external-URL approach that still renders inline.
 * @returns {Promise<{ hasEmailLogo: boolean, EMAIL_LOGO_SRC: string|null, EMAIL_LOGO_CID: string|null, attachments: object[] }>}
 */
async function getEmailLogoMailParts() {
  if (!hasEmailLogo()) {
    return emptyLogoParts();
  }

  const svgBuffer = fs.readFileSync(resolveLogoPath());
  let png;

  try {
    // Density + 320px width keeps the mark sharp on retina while preserving aspect
    png = await sharp(svgBuffer, { density: 144 })
      .resize({ width: PNG_WIDTH, withoutEnlargement: false })
      .png()
      .toBuffer();
  } catch {
    // Gmail cannot reliably render raw SVG; skip the logo rather than send a broken image
    return emptyLogoParts();
  }

  return {
    hasEmailLogo: true,
    EMAIL_LOGO_CID,
    EMAIL_LOGO_SRC: `cid:${EMAIL_LOGO_CID}`,
    attachments: [
      {
        content: png,
        cid: EMAIL_LOGO_CID,
        contentType: "image/png",
        contentDisposition: "inline",
        // omit filename so Gmail is less likely to list it as a downloadable file
      },
    ],
  };
}

function normalizeSvgText(buffer) {
  let text = Buffer.isBuffer(buffer) ? buffer.toString("utf8") : String(buffer);
  if (text.charCodeAt(0) === 0xFEFF) {
    text = text.slice(1);
  }
  return text.replace(/^\s*<\?xml[\s\S]*?\?>\s*/i, "");
}

function saveEmailLogoSvg(buffer) {
  const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer || "");
  if (!buf.length) {
    throw new Error("SVG file is empty");
  }
  if (buf.length > MAX_BYTES) {
    throw new Error("SVG must be 256 KB or smaller");
  }

  const text = normalizeSvgText(buf);
  if (!/<svg[\s>]/i.test(text)) {
    throw new Error("File is not a valid SVG");
  }
  if (/<script/i.test(text)) {
    throw new Error("SVG must not contain script tags");
  }

  const dest = resolveLogoPath();
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, buf);
}

function deleteEmailLogo() {
  const dest = resolveLogoPath();
  if (fs.existsSync(dest)) {
    fs.unlinkSync(dest);
  }
}

function readEmailLogoBuffer() {
  const dest = resolveLogoPath();
  if (!fs.existsSync(dest)) return null;
  return fs.readFileSync(dest);
}

module.exports = {
  EMAIL_LOGO_CID,
  hasEmailLogo,
  getEmailLogoMailParts,
  saveEmailLogoSvg,
  deleteEmailLogo,
  readEmailLogoBuffer,
  resolveLogoPath,
};
