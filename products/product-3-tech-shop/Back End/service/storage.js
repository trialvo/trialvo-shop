const fs = require("fs");
const path = require("path");
const { Storage } = require("@google-cloud/storage");
const ApplicationSettings = require("../config/ApplicationSettings");

const PROJECT_ROOT = path.resolve(__dirname, "..");

function normalizeRelativePath(relativePath) {
  if (!relativePath) return "";
  return relativePath.startsWith("/") ? relativePath.slice(1) : relativePath;
}

function ensureDirForFile(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

class LocalStorageAdapter {
  async saveBuffer(relativePath, buffer) {
    const normalized = normalizeRelativePath(relativePath);
    const absolutePath = path.join(PROJECT_ROOT, normalized);
    ensureDirForFile(absolutePath);
    fs.writeFileSync(absolutePath, buffer);
    return relativePath;
  }

  async saveFile(tempFilePath, relativePath) {
    const normalized = normalizeRelativePath(relativePath);
    const absolutePath = path.join(PROJECT_ROOT, normalized);
    ensureDirForFile(absolutePath);
    try {
      fs.renameSync(tempFilePath, absolutePath);
    } catch (error) {
      // Windows can throw EXDEV when moving files across drives (e.g. C: -> D:).
      // Fall back to copy + unlink so uploads still succeed in local development.
      if (error && error.code === "EXDEV") {
        fs.copyFileSync(tempFilePath, absolutePath);
        fs.unlinkSync(tempFilePath);
      } else {
        throw error;
      }
    }
    return relativePath;
  }

  async delete(relativePath) {
    const normalized = normalizeRelativePath(relativePath);
    const absolutePath = path.join(PROJECT_ROOT, normalized);
    if (fs.existsSync(absolutePath)) {
      try {
        fs.unlinkSync(absolutePath);
      } catch (err) {
        // Windows: sharp/multer may still hold a lock — retry after 500ms
        if (err.code === 'EBUSY') {
          setTimeout(() => {
            try { if (fs.existsSync(absolutePath)) fs.unlinkSync(absolutePath); }
            catch { /* best-effort */ }
          }, 500);
        } else {
          throw err;
        }
      }
    }
  }
}

class GcsStorageAdapter {
  constructor(bucketName) {
    this.storage = new Storage(
      ApplicationSettings.gcsProjectId
        ? { projectId: ApplicationSettings.gcsProjectId }
        : undefined
    );
    this.bucket = this.storage.bucket(bucketName);
  }

  async saveBuffer(relativePath, buffer, contentType = "application/octet-stream") {
    const objectName = normalizeRelativePath(relativePath);
    const file = this.bucket.file(objectName);
    await file.save(buffer, {
      resumable: false,
      contentType,
      metadata: {
        cacheControl: "public, max-age=31536000",
      },
    });
    return relativePath;
  }

  async saveFile(tempFilePath, relativePath, contentType = "application/octet-stream") {
    const objectName = normalizeRelativePath(relativePath);
    await this.bucket.upload(tempFilePath, {
      destination: objectName,
      resumable: false,
      metadata: {
        contentType,
        cacheControl: "public, max-age=31536000",
      }
    });
    return relativePath;
  }

  async delete(relativePath) {
    const objectName = normalizeRelativePath(relativePath);
    try {
      await this.bucket.file(objectName).delete({ ignoreNotFound: true });
    } catch (err) {
      if (err && err.code !== 404) {
        throw err;
      }
    }
  }
}

function createStorageAdapter() {
  const driver = (ApplicationSettings.storageDriver || "local").toLowerCase();
  if (driver === "gcs") {
    if (!ApplicationSettings.gcsBucket) {
      throw new Error("GCS_BUCKET is required when STORAGE_DRIVER=gcs");
    }
    return new GcsStorageAdapter(ApplicationSettings.gcsBucket);
  }
  return new LocalStorageAdapter();
}

const storage = createStorageAdapter();

module.exports = {
  storage
};
