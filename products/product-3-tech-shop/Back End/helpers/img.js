const fs = require("fs");
const path = require("path");
const os = require("os");
const sharp = require("sharp");
const multer = require("multer");
const errors = require("./errors");
const { api } = require("./common");
const { storage } = require("../service/storage");

const { profile_size, profile_quality ,banner_quality,banner_height,banner_width ,product_height,product_quality,product_width ,announcement_height,announcement_quality,announcement_width, category_height, category_quality, category_width, report_image_width, report_image_height, report_image_quality, review_image_width, review_image_height, review_image_quality} = require("../config/ApplicationSettings");

const TEMP_UPLOAD_DIR = path.join(os.tmpdir(), "uploads-temp");

if (!fs.existsSync(TEMP_UPLOAD_DIR)) {
    fs.mkdirSync(TEMP_UPLOAD_DIR, { recursive: true });
}

function getContentTypeByExt(ext) {
    switch ((ext || "").toLowerCase()) {
        case ".png":
            return "image/png";
        case ".jpg":
        case ".jpeg":
            return "image/jpeg";
        case ".webp":
            return "image/webp";
        case ".gif":
            return "image/gif";
        default:
            return "application/octet-stream";
    }
}





function cleanupTempFiles(req) {
    if (!req.files) return;

    try {
        Object.values(req.files)
            .flat()
            .forEach(file => {
                safeTempCleanup(file?.path);
            });
    } catch (err) {
        console.error("Temp file cleanup failed:", err);
    }
}

/**
 * Safely remove a temp file — non-fatal.
 * On Windows, sharp may hold an EBUSY lock on the input file even after
 * .toBuffer() resolves. Catches the error and retries once after 200 ms.
 */
function safeTempCleanup(filePath) {
    if (!filePath) return;
    try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch {
        // Retry after a brief delay (sharp file-handle release on Windows)
        setTimeout(() => {
            try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); }
            catch { /* best-effort */ }
        }, 200);
    }
}

function hookResponseCleanup(req, res) {
    const originalSend = res.send.bind(res);

    res.send = (payload) => {
        // Cleanup ONLY on error responses
        if (
            payload instanceof errors.QError ||
            payload?.success === false ||
            payload?.error
        ) {
            cleanupTempFiles(req);
        }

        return originalSend(payload);
    };
}



// ######################################
// # 4. FILE UTILITIES
// ######################################

exports.saveImage = async (tempFilePath, folderPath, size, quality) => {
    // Profiles / brands / delivery / courier — always store as WebP
    const imageSize = size || profile_size;
    const imageQuality = quality || profile_quality;

    const fileName = `img_${Date.now()}.webp`;
    const relativePath = `/uploads/${folderPath}/${fileName}`;

    try {
        const buffer = await sharp(tempFilePath)
            .resize(imageSize, imageSize)
            .webp({ quality: imageQuality })
            .toBuffer();

        await storage.saveBuffer(relativePath, buffer, "image/webp");

    } catch (error) {
        console.error("Image processing failed:", error);
        safeTempCleanup(tempFilePath);
        throw new errors.IMAGE_PROCESSING_FAILED("Failed to process the uploaded image.");
    }

    // Delete original temp file (non-fatal — Windows may hold file lock briefly)
    safeTempCleanup(tempFilePath);

    // Return relative path for DB
    return relativePath;
};





// exports.saveProductImage = async ( 
//     tempFilePath,
//     folderPath,
//     width,
//     height,
//     quality
// ) => {
//     const productWidth  = width  || product_width;
//     const productHeight = height || product_height;
//     const productQuality = quality || product_quality;

//     // Build upload directory
//     const uploadDir = path.join(
//         path.resolve(__dirname, ".."),
//         "uploads",
//         folderPath
//     );

//     // Create directory if not exists
//     if (!fs.existsSync(uploadDir)) {
//         fs.mkdirSync(uploadDir, { recursive: true });
//     }

//     // Generate filename
//     const fileName = `product_${Date.now()}.png`;
//     const outputPath = path.join(uploadDir, fileName);

//     try {
//         await sharp(tempFilePath)
//             .resize(productWidth, productHeight, {
//                 fit: "cover",      // Keeps 3:1 ratio clean
//                 position: "center" // Crop from center
//             })
//             .png({
//                 quality: productQuality,
//                 compressionLevel: 9,
//                 adaptiveFiltering: true
//             })
//             .toFile(outputPath);

//     } catch (error) {
//         console.error("Product image processing failed:", error);

//         if (fs.existsSync(tempFilePath)) {
//             fs.unlinkSync(tempFilePath);
//         }

//         throw new errors.IMAGE_PROCESSING_FAILED(
//             "Failed to process product image."
//         );
//     }

//     // Remove temp file
//     if (fs.existsSync(tempFilePath)) {
//         fs.unlinkSync(tempFilePath);
//     }

//     // Return DB-safe relative path
//     return `/uploads/${folderPath}/${fileName}`;
// };


/**
 * Product gallery image — resize to product dimensions and always save as WebP.
 * (Previously saved as-is with the original extension.)
 */
exports.saveProductImage = async (
    tempFilePath,
    folderPath,
    width,
    height,
    quality
) => {
    const productWidth = width || product_width;
    const productHeight = height || product_height;
    const productQuality = quality || product_quality;

    const fileName = `product_${Date.now()}.webp`;
    const relativePath = `/uploads/${folderPath}/${fileName}`;

    try {
        const buffer = await sharp(tempFilePath)
            .resize(productWidth, productHeight, {
                fit: "cover",
                position: "center",
                withoutEnlargement: true,
            })
            .webp({ quality: productQuality })
            .toBuffer();

        await storage.saveBuffer(relativePath, buffer, "image/webp");
        safeTempCleanup(tempFilePath);
        return relativePath;
    } catch (error) {
        console.error("Product image save failed:", error);
        safeTempCleanup(tempFilePath);
        throw new errors.IMAGE_PROCESSING_FAILED(
            "Failed to save product image."
        );
    }
};


/**
 * Save a category image (main / sub / child categories).
 * Resizes to CATEGORY_WIDTH × CATEGORY_HEIGHT and compresses using sharp.
 * Falls back to ApplicationSettings defaults (400 × 400, quality 80) if env
 * vars are not set.
 */
exports.saveCategoryImage = async (
    tempFilePath,
    folderPath,
    width,
    height,
    quality
) => {
    const catWidth   = width   || category_width;
    const catHeight  = height  || category_height;
    const catQuality = quality || category_quality;

    // Generate filename
    const fileName    = `category_${Date.now()}.webp`;
    const relativePath = `/uploads/${folderPath}/${fileName}`;

    try {
        const buffer = await sharp(tempFilePath)
            .resize(catWidth, catHeight, {
                fit: "cover",
                position: "center",
                withoutEnlargement: true
            })
            .webp({ quality: catQuality })
            .toBuffer();

        await storage.saveBuffer(relativePath, buffer, "image/webp");

    } catch (error) {
        console.error("Category image processing failed:", error);
        safeTempCleanup(tempFilePath);

        throw new errors.IMAGE_PROCESSING_FAILED(
            "Failed to process category image."
        );
    }

    // Remove temp file (non-fatal — Windows may hold file lock briefly)
    safeTempCleanup(tempFilePath);

    // Return DB-safe relative path
    return relativePath;
};


/**
 * Generate a lightweight face image (WebP thumbnail) from an already-stored
 * product image path (DB relative path like /uploads/products/...).
 * Saves the result to /uploads/faceimage/face_*.webp via the storage adapter.
 * Non-fatal: returns null on any error so the main request still succeeds.
 */
exports.saveFaceImage = async (sourceRelativePath) => {
    const { face_image_width, face_image_height, face_image_quality } = require('../config/ApplicationSettings');
    const fileName = `face_${Date.now()}.webp`;
    const relativePath = `/uploads/faceimage/${fileName}`;
    try {
        let sourceBuffer;
        const driver = (process.env.STORAGE_DRIVER || 'local').toLowerCase();
        if (driver === 'gcs') {
            const { Storage } = require('@google-cloud/storage');
            const { gcsBucket, gcsProjectId } = require('../config/ApplicationSettings');
            const gcsClient = new Storage(gcsProjectId ? { projectId: gcsProjectId } : undefined);
            const objectName = sourceRelativePath.startsWith('/') ? sourceRelativePath.slice(1) : sourceRelativePath;
            const [buf] = await gcsClient.bucket(gcsBucket).file(objectName).download();
            sourceBuffer = buf;
        } else {
            const PROJECT_ROOT = path.resolve(__dirname, '..');
            const absPath = path.join(PROJECT_ROOT, sourceRelativePath.startsWith('/') ? sourceRelativePath.slice(1) : sourceRelativePath);
            if (!fs.existsSync(absPath)) throw new Error(`Source image not found: ${absPath}`);
            sourceBuffer = fs.readFileSync(absPath);
        }
        const faceBuffer = await sharp(sourceBuffer)
            .resize(face_image_width, face_image_height, { fit: 'cover', position: 'center', withoutEnlargement: true })
            .webp({ quality: face_image_quality })
            .toBuffer();
        await storage.saveBuffer(relativePath, faceBuffer, 'image/webp');
        return relativePath;
    } catch (error) {
        console.error('Face image generation failed:', error.message || error);
        return null;
    }
};




exports.saveBannerImage = async ( 
    tempFilePath,
    folderPath,
    width,
    height,
    quality
) => {
    const bannerWidth  = width  || banner_width;
    const bannerHeight = height || banner_height;
    const bannerQuality = quality || banner_quality;

    // Generate filename
    const fileName = `banner_${Date.now()}.webp`;
    const relativePath = `/uploads/${folderPath}/${fileName}`;

    try {
        const buffer = await sharp(tempFilePath)
            .resize(bannerWidth, bannerHeight, {
                fit: "cover",
                position: "center",
                withoutEnlargement: true
            })
            .webp({ quality: bannerQuality })
            .toBuffer();

        await storage.saveBuffer(relativePath, buffer, "image/webp");

    } catch (error) {
        console.error("Banner image processing failed:", error);
        safeTempCleanup(tempFilePath);

        throw new errors.IMAGE_PROCESSING_FAILED(
            "Failed to process banner image."
        );
    }

    // Remove temp file (non-fatal — Windows may hold file lock briefly)
    safeTempCleanup(tempFilePath);

    // Return DB-safe relative path
    return relativePath;
};


exports.saveAnnouncementImage = async ( 
    tempFilePath,
    folderPath,
    width,
    height,
    quality
) => {
    const announcementWidth  = width  || announcement_width;
    const announcementHeight = height || announcement_height;
    const announcementQuality = quality || announcement_quality;

    // Generate filename
    const fileName = `announcement_${Date.now()}.webp`;
    const relativePath = `/uploads/${folderPath}/${fileName}`;

    try {
        const buffer = await sharp(tempFilePath)
            .resize(announcementWidth, announcementHeight, {
                fit: "cover",
                position: "center",
                withoutEnlargement: true
            })
            .webp({ quality: announcementQuality })
            .toBuffer();

        await storage.saveBuffer(relativePath, buffer, "image/webp");

    } catch (error) {
        console.error("announcement image processing failed:", error);
        safeTempCleanup(tempFilePath);

        throw new errors.IMAGE_PROCESSING_FAILED(
            "Failed to process announcement image."
        );
    }

    // Remove temp file (non-fatal — Windows may hold file lock briefly)
    safeTempCleanup(tempFilePath);

    // Return DB-safe relative path
    return relativePath;
};









/**
 * Draft product images — convert to WebP (same pipeline as product gallery).
 */
exports.saveDraftImage = async (
  tempFilePath,
  folderPath,
  width,
  height,
  quality
) => {
  const productWidth = width || product_width;
  const productHeight = height || product_height;
  const productQuality = quality || product_quality;

  const fileName = `draft_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 8)}.webp`;

  const relativePath = `/uploads/${folderPath}/${fileName}`;

  try {
    const buffer = await sharp(tempFilePath)
      .resize(productWidth, productHeight, {
        fit: "cover",
        position: "center",
        withoutEnlargement: true,
      })
      .webp({ quality: productQuality })
      .toBuffer();

    await storage.saveBuffer(relativePath, buffer, "image/webp");
    safeTempCleanup(tempFilePath);
  } catch (error) {
    console.error("Draft image save failed:", error);
    safeTempCleanup(tempFilePath);
    throw new errors.IMAGE_PROCESSING_FAILED(
      "Failed to save draft image: " + error.message
    );
  }

  return relativePath;
};

// --- Multer Configuration ---
const ALLOWED_IMAGE_MIMES = new Set([
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
]);

const multerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Use a temporary directory
        cb(null, TEMP_UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

function imageFileFilter(req, file, cb) {
    if (ALLOWED_IMAGE_MIMES.has(String(file.mimetype || "").toLowerCase())) {
        return cb(null, true);
    }
    return cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", file.fieldname));
}

const upload = multer({
    storage: multerStorage,
    fileFilter: imageFileFilter,
});


// ######################################
// # 5. UPLOAD WRAPPER
// ######################################
exports.uploadApi = function uploadApi(fieldName, schema = {}, func) {
    const uploadMiddleware = upload.fields([{ name: fieldName, maxCount: 1 }]);

    return (req, res) => {
        uploadMiddleware(req, res, async (err) => {
            if (err) {
                cleanupTempFiles(req);
                return res.send(
                    err instanceof multer.MulterError
                        ? new errors.BAD_REQUEST(`Upload Error: ${err.code}`)
                        : new errors.ERROR_IN_EXECUTION()
                );
            }

            // Required file check
            if (!req.files || !req.files[fieldName] || req.files[fieldName].length === 0) {
                cleanupTempFiles(req);
                return res.send(
                    new errors.PARAMETER_MISSING(`${fieldName} file is required`)
                );
            }

            // 🔥 THIS MAKES CLEANUP GUARANTEED
            hookResponseCleanup(req, res);

            const wrappedApiHandler = api(schema, func);
            return wrappedApiHandler(req, res);
        });
    };
};

 

exports.productUploadApi = function productUploadApi(schema = {}, func) {
    const uploadMiddleware = upload.fields([
        { name: "product_images", maxCount: 10 }
    ]);

    return (req, res) => {
        uploadMiddleware(req, res, async (err) => {
            if (err) {
                cleanupTempFiles(req);
                return res.send(
                    err instanceof multer.MulterError
                        ? new errors.BAD_REQUEST(`Upload Error: ${err.code}`)
                        : new errors.ERROR_IN_EXECUTION()
                );
            }

            // 🔥 THIS IS THE FIX
            hookResponseCleanup(req, res);

            // ----------------------------
            // Safe JSON parsing
            // ----------------------------
            if (req.body.variations && typeof req.body.variations === "string") {
                try {
                    req.body.variations = JSON.parse(req.body.variations);
                } catch {
                    cleanupTempFiles(req);
                    return res.send(
                        new errors.INVALID_FIELDS_PROVIDED(
                            "Variations must be a valid JSON array."
                        )
                    );
                }
            }

            if (req.body.delete_image_ids && typeof req.body.delete_image_ids === "string") {
                try {
                    req.body.delete_image_ids = JSON.parse(req.body.delete_image_ids);
                } catch {
                    cleanupTempFiles(req);
                    return res.send(
                        new errors.INVALID_FIELDS_PROVIDED(
                            "delete_image_ids must be a valid JSON array."
                        )
                    );
                }
            }

            const wrappedApiHandler = api(schema, func);
            return wrappedApiHandler(req, res);
        });
    };
};





exports.draftUploadApi = function draftUploadApi(schema = {}, func) {
    const uploadMiddleware = upload.fields([
        { name: "draft_images", maxCount: 10 } // you can change limit
    ]);

    return (req, res) => {
        uploadMiddleware(req, res, async (err) => {
            if (err) {
                cleanupTempFiles(req);
                return res.send(
                    err instanceof multer.MulterError
                        ? new errors.BAD_REQUEST(`Upload Error: ${err.code}`)
                        : new errors.ERROR_IN_EXECUTION()
                );
            }

            // ensure cleanup on response end
            hookResponseCleanup(req, res);

            const wrappedApiHandler = api(schema, func);
            return wrappedApiHandler(req, res);
        });
    };
};

// ######################################
// # 6. OPTIONAL UPLOAD WRAPPER
// ######################################

exports.optionalUploadApi = function optionalUploadApi(fieldName, schema = {}, func) {
    const uploadMiddleware = upload.fields([{ name: fieldName, maxCount: 1 }]);

    return (req, res) => {
        uploadMiddleware(req, res, async (err) => {
            if (err) {
                cleanupTempFiles(req);
                return res.send(
                    err instanceof multer.MulterError
                        ? new errors.BAD_REQUEST(`Upload Error: ${err.code}`)
                        : new errors.ERROR_IN_EXECUTION()
                );
            }

            // 🔥 Hook response once – works for ALL errors inside api()
            hookResponseCleanup(req, res);

            const wrappedApiHandler = api(schema, func);
            return wrappedApiHandler(req, res);
        });
    };
};

/**
 * Save a report image (user submission or admin reply attachment).
 * Resizes to REPORT_IMAGE_WIDTH × REPORT_IMAGE_HEIGHT using fit:inside
 * (preserves aspect ratio, never upscales), converts to WebP.
 * Falls back to ApplicationSettings defaults (800 × 800, quality 70).
 */
exports.saveReportImage = async (
    tempFilePath,
    folderPath
) => {
    const rWidth   = report_image_width;
    const rHeight  = report_image_height;
    const rQuality = report_image_quality;

    const fileName     = `report_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.webp`;
    const relativePath = `/uploads/${folderPath}/${fileName}`;

    try {
        const buffer = await sharp(tempFilePath)
            .resize(rWidth, rHeight, {
                fit: "inside",
                withoutEnlargement: true
            })
            .webp({ quality: rQuality })
            .toBuffer();

        await storage.saveBuffer(relativePath, buffer, "image/webp");

    } catch (error) {
        console.error("Report image processing failed:", error);
        safeTempCleanup(tempFilePath);
        throw new errors.IMAGE_PROCESSING_FAILED(
            "Failed to process report image."
        );
    }

    // Remove temp file (non-fatal — Windows may hold file lock briefly)
    safeTempCleanup(tempFilePath);

    return relativePath;
};

/**
 * Multer upload wrapper for report image attachments.
 * Accepts up to 4 images via 'report_images' field.
 * Images are optional — handler works with or without file uploads.
 */
exports.reportUploadApi = function reportUploadApi(schema = {}, func) {
    const uploadMiddleware = upload.fields([
        { name: "report_images", maxCount: 4 }
    ]);

    return (req, res) => {
        uploadMiddleware(req, res, async (err) => {
            if (err) {
                cleanupTempFiles(req);
                return res.send(
                    err instanceof multer.MulterError
                        ? new errors.BAD_REQUEST(`Upload Error: ${err.code}`)
                        : new errors.ERROR_IN_EXECUTION()
                );
            }

            // ensure cleanup on response end
            hookResponseCleanup(req, res);

            const wrappedApiHandler = api(schema, func);
            return wrappedApiHandler(req, res);
        });
    };
};

/**
 * Save a review image attachment.
 * Mirrors saveReportImage — resize to review_image_width × review_image_height, WebP.
 */
exports.saveReviewImage = async (
    tempFilePath,
    folderPath
) => {
    const rWidth   = review_image_width;
    const rHeight  = review_image_height;
    const rQuality = review_image_quality;

    const fileName     = `review_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.webp`;
    const relativePath = `/uploads/${folderPath}/${fileName}`;

    try {
        const buffer = await sharp(tempFilePath)
            .resize(rWidth, rHeight, {
                fit: "inside",
                withoutEnlargement: true
            })
            .webp({ quality: rQuality })
            .toBuffer();

        await storage.saveBuffer(relativePath, buffer, "image/webp");

    } catch (error) {
        console.error("Review image processing failed:", error);
        safeTempCleanup(tempFilePath);
        throw new errors.IMAGE_PROCESSING_FAILED(
            "Failed to process review image."
        );
    }

    // Remove temp file (non-fatal — Windows may hold file lock briefly)
    safeTempCleanup(tempFilePath);

    return relativePath;
};

/**
 * Multer upload wrapper for review image attachments.
 * Accepts up to 4 images via 'review_images' field.
 * Images are optional — handler works with or without file uploads.
 */
exports.reviewUploadApi = function reviewUploadApi(schema = {}, func) {
    const uploadMiddleware = upload.fields([
        { name: "review_images", maxCount: 4 }
    ]);

    return (req, res) => {
        uploadMiddleware(req, res, async (err) => {
            if (err) {
                cleanupTempFiles(req);
                return res.send(
                    err instanceof multer.MulterError
                        ? new errors.BAD_REQUEST(`Upload Error: ${err.code}`)
                        : new errors.ERROR_IN_EXECUTION()
                );
            }

            // ensure cleanup on response end
            hookResponseCleanup(req, res);

            const wrappedApiHandler = api(schema, func);
            return wrappedApiHandler(req, res);
        });
    };
};

/**
 * Safely deletes a file from the file system if it exists.
 * The path is expected to be the public-facing URL path (e.g., /uploads/profiles/admins/1/img.png).
 *
 * @param {string} relativeFilePath - The relative file path returned by saveImage.
 * @returns {void}
 */
exports.deleteFileIfExists = function deleteFileIfExists(relativeFilePath) {
    if (!relativeFilePath) {
        return;
    }

    try {
        const maybePromise = storage.delete(relativeFilePath);
        if (maybePromise && typeof maybePromise.then === "function") {
            maybePromise.catch((error) => {
                console.error(`Failed to delete file ${relativeFilePath}:`, error);
            });
        }
    } catch (error) {
        // Log the error but don't re-throw, as failing to delete the old file
        // should not prevent the rest of the current transaction from succeeding.
        console.error(`Failed to delete file ${relativeFilePath}:`, error);
    }
};
