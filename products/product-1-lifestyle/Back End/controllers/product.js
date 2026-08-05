const validator = require("validator");


const {
    productUploadApi, optionalUploadApi,draftUploadApi,
    saveImage,saveDraftImage,saveProductImage,saveFaceImage,
    deleteFileIfExists
} = require('../helpers/img');
const { jwtSecret } = require('../config/ApplicationSettings');



const { api, auth, validateAndCast ,userAuth,verifyJwt} = require('../helpers/common');
const errors = require('../helpers/errors');

/**
 * Variation validation schema
 */
const variationSchema = {
    body: {
        color_id: { type: "int", required: true },
        variant_id: { type: "int", required: true },
        buying_price: { type: "float", required: false, default: 0 },
        selling_price: { type: "float", required: true },
        discount: { type: "float", required: false, default: 0 },
        discount_type: {
            type: "int",
            required: false,
            default: 0 // 0 = flat, 1 = percentage
        },
        stock: { type: "int", required: false, default: 0 },
        sku: { type: "string", required: false },
        weight_kg: { type: "float", required: false, default: 0 },
        free_delivery: { type: "bool", required: false, default: null } // null = inherit from product
    }
};

exports.createProduct = productUploadApi(
    {
        body: {
            name: { type: "string", required: true },
            name_bd: { type: "string", required: false },
            slug: { type: "string", required: true },
            main_category_id: { type: "int", required: true },
            sub_category_id: { type: "int", required: false },
            child_category_id: { type: "int", required: false },
            brand_id: { type: "int", required: false },
            attribute_id: { type: "int", required: true },
            video_path: { type: "string", required: false },
            short_description: { type: "string", required: false },
            long_description: { type: "string", required: false },
            status: { type: "bool", default: true, required: false },
            featured: { type: "bool", default: false, required: false },
            free_delivery: { type: "bool", default: false, required: false },
            best_deal: { type: "bool", default: false, required: false },
            meta_title: { type: "string", required: false },
            meta_description: { type: "string", required: false },
            meta_keywords: { type: "string", required: true }, // Changed from false to true
            canonical_url: { type: "string", required: false },
            og_title: { type: "string", required: false },
            og_description: { type: "string", required: false },
            robots: { type: "string", default: "index, follow", required: false }
        }
    },
    auth(async (req, connection, adminInfo) => {

        const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"];
        if (!adminInfo.roles.some(role => ALLOWED_ROLES.includes(role))) throw new errors.UNAUTHORIZED();

        const { variations } = req.body;
        const data = req.typed.body;

        if (!variations || !Array.isArray(variations) || variations.length === 0) {
            throw new errors.PARAMETER_MISSING("Product variations are required.");
        }

        // ---------- FIELD VALIDATION ----------
        if (data.name.length > 255) {
            throw new errors.INVALID_FIELDS_PROVIDED("Product name cannot exceed 255 characters.");
        }
        if (data.name_bd && data.name_bd.length > 255) {
            throw new errors.INVALID_FIELDS_PROVIDED("বাংলা নাম ২৫৫ অক্ষরের বেশি হতে পারবে না");
        }

        if (data.slug.length > 255) {
            throw new errors.INVALID_FIELDS_PROVIDED("Product slug cannot exceed 255 characters.");
        }

        if (data.meta_title && data.meta_title.length > 60) {
            throw new errors.INVALID_FIELDS_PROVIDED("Meta title cannot exceed 60 characters.");
        }

        if (
            data.robots &&
            ![
                "index, follow",
                "noindex, nofollow",
                "index, nofollow",
                "noindex, follow"
            ].includes(data.robots)
        ) {
            throw new errors.INVALID_FIELDS_PROVIDED("Invalid value for robots field.");
        }

        if (data.short_description && data.short_description.length > 3000) {
            throw new errors.INVALID_FIELDS_PROVIDED("Short description cannot exceed 3000 characters.");
        }

        // if (data.long_description && data.long_description.length > 20000) {
        //     throw new errors.INVALID_FIELDS_PROVIDED("Long description cannot exceed 20000 characters.");
        // }

        if (data.meta_description && data.meta_description.length > 500) {
            throw new errors.INVALID_FIELDS_PROVIDED("Meta description cannot exceed 500 characters.");
        }

        // ===========================================
        // ADDED: Meta keywords validation and processing
        // ===========================================
        if (!data.meta_keywords || data.meta_keywords.trim() === "") {
            throw new errors.INVALID_FIELDS_PROVIDED("Meta keywords are required.");
        }

        // Validate max length
        if (data.meta_keywords.length > 255) {
            throw new errors.INVALID_FIELDS_PROVIDED("Meta keywords cannot exceed 255 characters.");
        }

        // Process and validate meta keywords format
        let processedMetaKeywords = data.meta_keywords.trim();
        
        // Remove extra spaces around commas and multiple commas
        processedMetaKeywords = processedMetaKeywords
            .split(',')
            .map(keyword => keyword.trim())
            .filter(keyword => keyword !== '') // Remove empty strings
            .join(', ');
            
        // Check if we have at least one keyword after processing
        if (processedMetaKeywords === "") {
            throw new errors.INVALID_FIELDS_PROVIDED("Meta keywords must contain at least one valid keyword.");
        }

        // Validate each individual keyword
        const keywordsArray = processedMetaKeywords.split(',').map(k => k.trim());
        const invalidKeywords = [];
        
        for (const keyword of keywordsArray) {
            // Check keyword length (individual keyword)
            if (keyword.length > 50) {
                invalidKeywords.push(`"${keyword}" exceeds 50 characters`);
            }
            
            // Check for special characters (optional, but recommended)
            if (/[<>{}[\]~`!@#$%^&*()_+=|\\:;"']/.test(keyword)) {
                invalidKeywords.push(`"${keyword}" contains invalid characters`);
            }
        }
        
        if (invalidKeywords.length > 0) {
            throw new errors.INVALID_FIELDS_PROVIDED(`Invalid meta keywords: ${invalidKeywords.join(', ')}`);
        }
        
        // Limit total number of keywords (optional)
        if (keywordsArray.length > 20) {
            throw new errors.INVALID_FIELDS_PROVIDED("Cannot have more than 20 meta keywords.");
        }
        
        // Update the data with processed meta keywords
        data.meta_keywords = processedMetaKeywords;
        // ===========================================

        if (data.og_title && data.og_title.length > 100) {
            throw new errors.INVALID_FIELDS_PROVIDED("OG title cannot exceed 100 characters.");
        }

        if (data.og_description && data.og_description.length > 500) {
            throw new errors.INVALID_FIELDS_PROVIDED("OG description cannot exceed 500 characters.");
        }
        if (data.canonical_url && !validator.isURL(data.canonical_url)) throw new errors.INVALID_FIELDS_PROVIDED("Canonical URL is not valid.");
        if (data.video_path && !validator.isURL(data.video_path)) throw new errors.INVALID_FIELDS_PROVIDED("Video URL is not valid.");

        // ---------- PRE-TRANSACTION VALIDATION ----------

        // 1. Check slug uniqueness
        const existingSlug = await connection.queryOne("SELECT id FROM products WHERE slug = ?", [data.slug]);
        if (existingSlug) throw new errors.ALREADY_EXIST("Product slug already exists.");

        // 2. Check for duplicate SKUs in the incoming request data itself
        const incomingSkus = variations.map(v => v.sku).filter(s => s);
        if (new Set(incomingSkus).size !== incomingSkus.length) {
            throw new errors.ALREADY_EXIST("Duplicate SKUs found within the request variations.");
        }

        // 3. Check if any provided SKUs already exist in the Database
        if (incomingSkus.length > 0) {
            const existingDbSkus = await connection.query(
                "SELECT sku FROM product_skus WHERE sku IN (?)",
                [incomingSkus]
            );
            if (existingDbSkus.length > 0) {
                throw new errors.ALREADY_EXIST(`SKU already exists: ${existingDbSkus[0].sku}`);
            }
        }

        // Extract unique IDs
        const colorIds = [...new Set(variations.map(v => v.color_id))];
        const variantIds = [...new Set(variations.map(v => v.variant_id))];

        // Parallel existence checks
        const [
            mainCat,
            subCat,
            childCat,
            brand,
            attr,
            dbColors,
            dbVariants
        ] = await Promise.all([
            connection.queryOne(
                "SELECT id FROM main_categories WHERE id = ?",
                [data.main_category_id]
            ),
            data.sub_category_id
                ? connection.queryOne(
                    "SELECT id FROM sub_categories WHERE id = ?",
                    [data.sub_category_id]
                )
                : Promise.resolve(true),
            data.child_category_id
                ? connection.queryOne(
                    "SELECT id FROM child_categories WHERE id = ?",
                    [data.child_category_id]
                )
                : Promise.resolve(true),
            data.brand_id
                ? connection.queryOne(
                    "SELECT id FROM brands WHERE id = ?",
                    [data.brand_id]
                )
                : Promise.resolve(true),
            connection.queryOne(
                "SELECT id FROM attributes WHERE id = ?",
                [data.attribute_id]
            ),
            connection.query(
                "SELECT id FROM colors WHERE id IN (?)",
                [colorIds]
            ),
            connection.query(
                "SELECT id FROM variants WHERE id IN (?)",
                [variantIds]
            )
        ]);

        if (!mainCat) throw new errors.NOT_FOUND("Main Category not found.");
        if (data.sub_category_id && !subCat) throw new errors.NOT_FOUND("Sub Category not found.");
        if (data.child_category_id && !childCat) throw new errors.NOT_FOUND("Child Category not found.");
        if (data.brand_id && !brand) throw new errors.NOT_FOUND("Brand not found.");
        if (!attr) throw new errors.NOT_FOUND("Attribute not found.");
        if (dbColors.length !== colorIds.length) throw new errors.NOT_FOUND("Invalid Color IDs provided.");
        if (dbVariants.length !== variantIds.length) throw new errors.NOT_FOUND("Invalid Variant IDs provided.");

        // ---------- INSERT PRODUCT ----------
        const productResult = await connection.query(
            `
            INSERT INTO products (
                name, name_bd, slug, main_category_id, sub_category_id, child_category_id,
                brand_id, attribute_id, video_path, short_description, long_description,
                status, featured, free_delivery, best_deal,
                meta_title, meta_description, meta_keywords, canonical_url,
                og_title, og_description, robots
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                data.name,
                data.name_bd || null,
                data.slug,
                data.main_category_id,
                data.sub_category_id,
                data.child_category_id,
                data.brand_id,
                data.attribute_id,
                data.video_path,
                data.short_description,
                data.long_description,
                data.status,
                data.featured,
                data.free_delivery,
                data.best_deal,
                data.meta_title,
                data.meta_description,
                data.meta_keywords, // Now using processed keywords
                data.canonical_url,
                data.og_title,
                data.og_description,
                data.robots
            ]
        );

        const productId = productResult.insertId;

        // ---------- VARIATIONS ----------
        const validColorIds = new Set(dbColors.map(c => c.id));
        const validVariantIds = new Set(dbVariants.map(v => v.id));
        const requestSkus = new Set();

        for (const variationData of variations) {
            const { body: v } = validateAndCast(
                { body: variationData },
                variationSchema
            );

            if (v.sku && v.sku.length > 100) {
                throw new errors.INVALID_FIELDS_PROVIDED("SKU cannot exceed 100 characters.");
            }

            if (!validColorIds.has(v.color_id)) {
                throw new errors.NOT_FOUND(`Color ID ${v.color_id} is invalid or doesn't exist.`);
            }

            if (!validVariantIds.has(v.variant_id)) {
                throw new errors.NOT_FOUND(`Variant ID ${v.variant_id} is invalid or doesn't exist.`);
            }

            // ---------- DISCOUNT VALIDATION ----------
            if (![0, 1].includes(v.discount_type)) {
                throw new errors.INVALID_FIELDS_PROVIDED(
                    "discount_type must be 0 (flat) or 1 (percentage)."
                );
            }

            if (v.discount < 0) {
                throw new errors.INVALID_FIELDS_PROVIDED(
                    "Discount cannot be negative."
                );
            }

            // Percentage discount sanity check
            if (v.discount_type === 1 && v.discount > 100) {
                throw new errors.INVALID_FIELDS_PROVIDED(
                    "Percentage discount cannot exceed 100%."
                );
            }

            const finalSku =
                v.sku || `SKU-${productId}-${v.color_id}-${v.variant_id}`;

            if (requestSkus.has(finalSku)) {
                throw new errors.ALREADY_EXIST(`Duplicate SKU detected in request: ${finalSku}`);
            }

            if (finalSku.length > 100) {
                throw new errors.INVALID_FIELDS_PROVIDED(
                    `SKU "${finalSku}" exceeds 100 characters.`
                );
            }

            requestSkus.add(finalSku);

            await connection.query(
                `
                INSERT INTO product_skus (
                    product_id, color_id, variant_id,
                    buying_price, selling_price,
                    discount, discount_type,
                    stock, sku, weight_kg, free_delivery
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    productId,
                    v.color_id,
                    v.variant_id,
                    v.buying_price,
                    v.selling_price,
                    v.discount,
                    v.discount_type,
                    v.stock,
                    finalSku,
                    v.weight_kg,
                    v.free_delivery !== undefined ? v.free_delivery : null
                ]
            );
        }

        // ---------- PRODUCT IMAGES ----------
        let firstImagePath = null;
        if (req.files && req.files.product_images) {
            let serial = 1;
            for (const file of req.files.product_images) {
                const imgPath = await saveProductImage(file.path, "products");
                if (serial === 1) firstImagePath = imgPath;
                await connection.query(
                    "INSERT INTO product_images (product_id, img_path, serial) VALUES (?, ?, ?)",
                    [productId, imgPath, serial++]
                );
            }
        }

        // ---------- FACE IMAGE (listing thumbnail) ----------
        if (firstImagePath) {
            const faceImagePath = await saveFaceImage(firstImagePath);
            if (faceImagePath) {
                await connection.query(
                    "UPDATE products SET face_image = ? WHERE id = ?",
                    [faceImagePath, productId]
                );
            }
        }

        // ---------- AUDIT LOG ----------
        await connection.query(
            `
            INSERT INTO admin_audit_logs
            (admin_id, action, resource, resource_id, meta)
            VALUES (?, 'CREATE_PRODUCT', 'product', ?, ?)
            `,
            [adminInfo.id, productId, JSON.stringify({ 
                name: data.name,
                name_bd: data.name_bd || data.name,
                meta_keywords: data.meta_keywords 
            })]
        );

        return { 
            success: true, 
            productId,
            processed_meta_keywords: data.meta_keywords 
        };
    })
);




exports.editProduct = productUploadApi(
    {
        params: {
            id: { type: "int", required: true }
        },
        body: {
            name: { type: "string" },
            name_bd: { type: "string" },
            slug: { type: "string" },
            main_category_id: { type: "int" },
            sub_category_id: { type: "int" },
            child_category_id: { type: "int" },
            brand_id: { type: "int" },
            video_path: { type: "string" },
            short_description: { type: "string" },
            long_description: { type: "string" },
            status: { type: "bool" },
            featured: { type: "bool" },
            free_delivery: { type: "bool" },
            best_deal: { type: "bool" },
            meta_title: { type: "string" },
            meta_description: { type: "string" },
            meta_keywords: { type: "string" },
            canonical_url: { type: "string" },
            og_title: { type: "string" },
            og_description: { type: "string" },
            robots: { type: "string" },
            delete_image_ids: { type: "array" }
        }
    },
    auth(async (req, connection, adminInfo) => {
        const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"];
        if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
            throw new errors.UNAUTHORIZED();
        }

        const product_id = req.typed.params.id;

        // ---------- CHECK PRODUCT EXISTS ----------
        const product = await connection.queryOne(
            "SELECT id, name FROM products WHERE id = ?",
            [product_id]
        );
        if (!product) throw new errors.NOT_FOUND("Product not found.");

        // ---------- DESTRUCTURE BODY ----------
        const {
            name,
            name_bd,
            slug,
            main_category_id,
            sub_category_id,
            child_category_id,
            brand_id,
            video_path,
            short_description,
            long_description,
            status,
            featured,
            free_delivery,
            best_deal,
            meta_title,
            meta_description,
            meta_keywords,
            canonical_url,
            og_title,
            og_description,
            robots
        } = req.typed.body;

        // ---------- BUILD UPDATE OBJECT (ONLY PROVIDED FIELDS) ----------
        const updateFields = {};
        if (name !== undefined) updateFields.name = name;
        if (name_bd !== undefined) updateFields.name_bd = name_bd;
        if (slug !== undefined) updateFields.slug = slug;
        if (main_category_id !== undefined) updateFields.main_category_id = main_category_id;
        if (sub_category_id !== undefined) updateFields.sub_category_id = sub_category_id;
        if (child_category_id !== undefined) updateFields.child_category_id = child_category_id;
        if (brand_id !== undefined) updateFields.brand_id = brand_id;
        if (video_path !== undefined) updateFields.video_path = video_path;
        if (short_description !== undefined) updateFields.short_description = short_description;
        if (long_description !== undefined) updateFields.long_description = long_description;
        if (status !== undefined) updateFields.status = status;
        if (featured !== undefined) updateFields.featured = featured;
        if (free_delivery !== undefined) updateFields.free_delivery = free_delivery;
        if (best_deal !== undefined) updateFields.best_deal = best_deal;
        if (meta_title !== undefined) updateFields.meta_title = meta_title;
        if (meta_description !== undefined) updateFields.meta_description = meta_description;
        
        // ===========================================
        // ADDED: Meta keywords processing for edit
        // ===========================================
        if (meta_keywords !== undefined) {
            // If meta_keywords is provided but empty, throw error (it's required field)
            if (meta_keywords === null || meta_keywords === "") {
                throw new errors.INVALID_FIELDS_PROVIDED("Meta keywords can not be empty.");
            }
            
            // Process and validate meta keywords
            let processedMetaKeywords = meta_keywords.trim();
            
            // Validate max length
            if (processedMetaKeywords.length > 255) {
                throw new errors.INVALID_FIELDS_PROVIDED("Meta keywords cannot exceed 255 characters.");
            }
            
            // Remove extra spaces around commas and multiple commas
            processedMetaKeywords = processedMetaKeywords
                .split(',')
                .map(keyword => keyword.trim())
                .filter(keyword => keyword !== '') // Remove empty strings
                .join(', ');
                
            // Check if we have at least one keyword after processing
            if (processedMetaKeywords === "") {
                throw new errors.INVALID_FIELDS_PROVIDED("Meta keywords must contain at least one valid keyword.");
            }

            // Validate each individual keyword
            const keywordsArray = processedMetaKeywords.split(',').map(k => k.trim());
            const invalidKeywords = [];
            
            for (const keyword of keywordsArray) {
                // Check keyword length (individual keyword)
                if (keyword.length > 50) {
                    invalidKeywords.push(`${keyword} exceeds 50 characters`);
                }
                
                // Check for special characters (optional, but recommended)
                if (/[<>{}[\]~`!@#$%^&*()_+=|\\:;"']/.test(keyword)) {
                    invalidKeywords.push(`${keyword} contains invalid characters`);
                }
            }
            
            if (invalidKeywords.length > 0) {
                throw new errors.INVALID_FIELDS_PROVIDED(`Invalid meta keywords: ${invalidKeywords.join(', ')}`);
            }
            
            // Limit total number of keywords (optional)
            if (keywordsArray.length > 20) {
                throw new errors.INVALID_FIELDS_PROVIDED("Cannot have more than 20 meta keywords.");
            }
            
            // Store processed meta keywords
            updateFields.meta_keywords = processedMetaKeywords;
        }
        // ===========================================
        
        if (canonical_url !== undefined) updateFields.canonical_url = canonical_url;
        if (og_title !== undefined) updateFields.og_title = og_title;
        if (og_description !== undefined) updateFields.og_description = og_description;
        if (robots !== undefined) updateFields.robots = robots;

        // ---------- FIELD VALIDATION ----------
        if (updateFields.name && updateFields.name.length > 255)
            throw new errors.INVALID_FIELDS_PROVIDED("Name max 255 chars.");
        if (updateFields.name_bd && updateFields.name_bd.length > 255)
            throw new errors.INVALID_FIELDS_PROVIDED("বাংলা নাম ২৫৫ অক্ষরের বেশি হতে পারবে না");
        if (updateFields.slug && updateFields.slug.length > 255)
            throw new errors.INVALID_FIELDS_PROVIDED("Slug max 255 chars.");
        if (updateFields.meta_title && updateFields.meta_title.length > 60)
            throw new errors.INVALID_FIELDS_PROVIDED("Meta title max 60 chars.");
        if (updateFields.short_description && updateFields.short_description.length > 3000)
            throw new errors.INVALID_FIELDS_PROVIDED("Short description max 3000 chars.");
        // if (updateFields.long_description && updateFields.long_description.length > 20000)
        //     throw new errors.INVALID_FIELDS_PROVIDED("Long description max 20000 chars.");
        
        // ===========================================
        // ADDED: Meta description validation
        // ===========================================
        if (updateFields.meta_description && updateFields.meta_description.length > 500)
            throw new errors.INVALID_FIELDS_PROVIDED("Meta description cannot exceed 500 characters.");
        // ===========================================
        
        if (updateFields.canonical_url && !validator.isURL(updateFields.canonical_url))
            throw new errors.INVALID_FIELDS_PROVIDED("Invalid canonical URL.");
        if (updateFields.video_path && !validator.isURL(updateFields.video_path))
            throw new errors.INVALID_FIELDS_PROVIDED("Invalid video URL.");
        
        // ===========================================
        // ADDED: OG title and description validation
        // ===========================================
        if (updateFields.og_title && updateFields.og_title.length > 100)
            throw new errors.INVALID_FIELDS_PROVIDED("OG title cannot exceed 100 characters.");
        if (updateFields.og_description && updateFields.og_description.length > 500)
            throw new errors.INVALID_FIELDS_PROVIDED("OG description cannot exceed 500 characters.");
        // ===========================================
        
        if (
            updateFields.robots &&
            !["index, follow", "noindex, nofollow", "index, nofollow", "noindex, follow"].includes(updateFields.robots)
        ) {
            throw new errors.INVALID_FIELDS_PROVIDED("Invalid robots value.");
        }

        // ---------- SLUG DUPLICATE CHECK ----------
        if (updateFields.slug) {
            const slugExists = await connection.queryOne(
                "SELECT id FROM products WHERE slug = ? AND id != ?",
                [updateFields.slug, product_id]
            );
            if (slugExists) throw new errors.ALREADY_EXIST("Product slug already exists.");
        }

        // ---------- FOREIGN KEY VALIDATION ----------
        const foreignKeys = [
            { field: "main_category_id", table: "main_categories" },
            { field: "sub_category_id", table: "sub_categories" },
            { field: "child_category_id", table: "child_categories" },
            { field: "brand_id", table: "brands" },
            { field: "attribute_id", table: "attributes" }
        ];

        for (const fk of foreignKeys) {
            if (fk.field in updateFields) {
                const exists = await connection.queryOne(
                    `SELECT id FROM ${fk.table} WHERE id = ?`,
                    [updateFields[fk.field]]
                );
                if (!exists) {
                    throw new errors.INVALID_FIELDS_PROVIDED(`Invalid ${fk.field} provided`);
                }
            }
        }

        // ---------- IMAGE LIMIT VALIDATION ----------
        const MAX_IMAGES = 10;
        const [{ count: existingCount }] = await connection.query(
            `SELECT COUNT(*) AS count FROM product_images WHERE product_id = ?`,
            [product_id]
        );

        const delete_image_ids = Array.isArray(req.typed.body.delete_image_ids) ? req.typed.body.delete_image_ids : [];
        if (delete_image_ids.length > 0) {
            const [{ count }] = await connection.query(
                `SELECT COUNT(*) AS count FROM product_images WHERE id IN (?) AND product_id = ?`,
                [delete_image_ids, product_id]
            );
            if (count !== delete_image_ids.length)
                throw new errors.NOT_FOUND("Invalid image IDs provided for deletion.");
        }

        const newImageCount = req.files?.product_images?.length || 0;
        const finalImageCount = existingCount - delete_image_ids.length + newImageCount;
        if (finalImageCount > MAX_IMAGES)
            throw new errors.INVALID_FIELDS_PROVIDED(`A product can have max ${MAX_IMAGES} images.`);

        // ---------- UPDATE PRODUCT ----------
        if (Object.keys(updateFields).length > 0) {
            await connection.query("UPDATE products SET ? WHERE id = ?", [updateFields, product_id]);
        }

        // ---------- DELETE SELECTED IMAGES ----------
        if (delete_image_ids.length > 0) {
            const images = await connection.query(
                `SELECT id, img_path FROM product_images WHERE id IN (?) AND product_id = ?`,
                [delete_image_ids, product_id]
            );
            for (const img of images) deleteFileIfExists(img.img_path);

            await connection.query("DELETE FROM product_images WHERE id IN (?)", [delete_image_ids]);
        }

        // ---------- ADD NEW IMAGES ----------
        if (newImageCount > 0) {
            // Find current max serial so new images continue the sequence
            const [{ max_serial }] = await connection.query(
                `SELECT COALESCE(MAX(serial), 0) AS max_serial FROM product_images WHERE product_id = ?`,
                [product_id]
            );
            let nextSerial = max_serial + 1;
            for (const file of req.files.product_images) {
                const imgPath = await saveProductImage(file.path, `products`);
                await connection.query(
                    "INSERT INTO product_images (product_id, img_path, serial) VALUES (?, ?, ?)",
                    [product_id, imgPath, nextSerial++]
                );
            }
        }

        // ---------- FACE IMAGE (regenerate when images change) ----------
        if (delete_image_ids.length > 0 || newImageCount > 0) {
            // Delete old face image file before generating new one
            const oldProduct = await connection.queryOne(
                `SELECT face_image FROM products WHERE id = ?`, [product_id]
            );
            if (oldProduct?.face_image) deleteFileIfExists(oldProduct.face_image);

            const firstImg = await connection.queryOne(
                `SELECT img_path FROM product_images WHERE product_id = ? ORDER BY serial ASC, id ASC LIMIT 1`,
                [product_id]
            );
            if (firstImg) {
                const faceImagePath = await saveFaceImage(firstImg.img_path);
                await connection.query(
                    "UPDATE products SET face_image = ? WHERE id = ?",
                    [faceImagePath || null, product_id]
                );
            } else {
                await connection.query("UPDATE products SET face_image = NULL WHERE id = ?", [product_id]);
            }
        }

        // ---------- AUDIT LOG ----------
        await connection.query(
            `INSERT INTO admin_audit_logs
        (admin_id, action, resource, resource_id, meta)
        VALUES (?, 'EDIT_PRODUCT', 'product', ?, ?)`,
            [
                adminInfo.id,
                product_id,
                JSON.stringify({
                    updated_fields: Object.keys(updateFields),
                    images_deleted: delete_image_ids,
                    images_added: newImageCount,
                    // Include processed meta keywords if they were updated
                    meta_keywords_updated: updateFields.meta_keywords !== undefined
                })
            ]
        );

        return { 
            success: true };
    })
);


/**
 * PATCH /admin/product/:id/images/reorder
 * Body: { image_ids: [5, 3, 8, 1] }  — ordered array of image IDs (1-based serial = position)
 * Validates all IDs belong to the given product, then updates serial values in one transaction.
 */
exports.reorderProductImages = api(
    {
        params: { id: { type: "int", required: true } }
    },
    auth(async (req, connection, adminInfo) => {
        const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"];
        if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) throw new errors.UNAUTHORIZED();

        const productId = req.typed.params.id;

        // Validate body
        const rawIds = req.body?.image_ids;
        if (!Array.isArray(rawIds) || rawIds.length === 0) {
            throw new errors.PARAMETER_MISSING("image_ids must be a non-empty array.");
        }

        const imageIds = rawIds.map(id => {
            const n = parseInt(id, 10);
            if (isNaN(n) || n <= 0) throw new errors.INVALID_FIELDS_PROVIDED("Each image_id must be a positive integer.");
            return n;
        });

        // Check for duplicates
        if (new Set(imageIds).size !== imageIds.length) {
            throw new errors.INVALID_FIELDS_PROVIDED("Duplicate image IDs provided.");
        }

        // Verify product exists
        const product = await connection.queryOne("SELECT id FROM products WHERE id = ?", [productId]);
        if (!product) throw new errors.NOT_FOUND("Product not found.");

        // Verify all provided IDs belong to this product
        const dbImages = await connection.query(
            `SELECT id FROM product_images WHERE id IN (?) AND product_id = ?`,
            [imageIds, productId]
        );
        if (dbImages.length !== imageIds.length) {
            throw new errors.INVALID_FIELDS_PROVIDED("One or more image IDs do not belong to this product.");
        }

        // Update serials — api() wrapper already manages the transaction
        for (let i = 0; i < imageIds.length; i++) {
            await connection.query(
                `UPDATE product_images SET serial = ? WHERE id = ? AND product_id = ?`,
                [i + 1, imageIds[i], productId]
            );
        }

        // Audit log
        await connection.query(
            `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta)
             VALUES (?, 'EDIT_PRODUCT', 'product', ?, ?)`,
            [adminInfo.id, productId, JSON.stringify({ image_reorder: imageIds })]
        );

        // ---------- FACE IMAGE (regenerate on reorder — new serial=1 becomes thumbnail) ----------
        // Delete old face image file before generating new one
        const oldProductFace = await connection.queryOne(
            `SELECT face_image FROM products WHERE id = ?`, [productId]
        );
        if (oldProductFace?.face_image) deleteFileIfExists(oldProductFace.face_image);

        const newFirstImageId = imageIds[0];
        const reorderFirstImg = await connection.queryOne(
            `SELECT img_path FROM product_images WHERE id = ? AND product_id = ?`,
            [newFirstImageId, productId]
        );
        if (reorderFirstImg) {
            const faceImagePath = await saveFaceImage(reorderFirstImg.img_path);
            if (faceImagePath) {
                await connection.query(
                    "UPDATE products SET face_image = ? WHERE id = ?",
                    [faceImagePath, productId]
                );
            }
        }

        return { success: true };

    })
);

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /admin/product/image/:imageId/sku
// Assign or clear a sku_id on a single product image.
// Body: { sku_id: number | null }
// A SKU encodes a specific color + size (variant) combination.
// null sku_id = shared image shown for ALL SKUs.
// ─────────────────────────────────────────────────────────────────────────────
exports.assignImageSku = api(
    {
        params: { imageId: { type: "int", required: true } }
    },
    auth(async (req, connection, adminInfo) => {
        const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"];
        if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) throw new errors.UNAUTHORIZED();

        const imageId = req.typed.params.imageId;
        // sku_id may be null (clear) or a positive int (assign to specific SKU)
        const rawSkuId = req.body?.sku_id;
        const sku_id = rawSkuId === null || rawSkuId === undefined ? null : parseInt(rawSkuId, 10);

        if (sku_id !== null && (!Number.isFinite(sku_id) || sku_id <= 0)) {
            throw new errors.INVALID_FIELDS_PROVIDED("sku_id must be a positive integer or null.");
        }

        // Ensure image exists
        const img = await connection.queryOne(
            `SELECT id, product_id FROM product_images WHERE id = ?`, [imageId]
        );
        if (!img) throw new errors.NOT_FOUND("Image not found.");

        // If assigning, verify the SKU belongs to this product
        if (sku_id !== null) {
            const skuExists = await connection.queryOne(
                `SELECT id FROM product_skus WHERE id = ? AND product_id = ? LIMIT 1`,
                [sku_id, img.product_id]
            );
            if (!skuExists) throw new errors.INVALID_FIELDS_PROVIDED("This SKU does not belong to this product.");
        }

        await connection.query(
            `UPDATE product_images SET sku_id = ? WHERE id = ?`, [sku_id, imageId]
        );

        await connection.query(
            `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta) VALUES (?, "EDIT_PRODUCT", "product", ?, ?)`,
            [adminInfo.id, img.product_id, JSON.stringify({ image_sku_assign: { image_id: imageId, sku_id } })]
        );

        return { success: true, image_id: imageId, sku_id };
    })
);


// exports.getProducts = api({
//     query: {
//         search: { type: "string" },
//         main_category_id: { type: "int" },
//         sub_category_id: { type: "int" },
//         child_category_id: { type: "int" },
//         brand_id: { type: "int" },
//         status: { type: "bool" },
//         featured: { type: "bool" },
//         best_deal: { type: "bool" },
//         free_delivery: { type: "bool" },
//         min_price: { type: "float" },
//         max_price: { type: "float" },
//         in_stock: { type: "bool" },
//         limit: { type: "int", default: 20 },
//         offset: { type: "int", default: 0 },
//         sort_by: { type: "string", default: "created_at" }, // name, created_at, price
//         sort_order: { type: "string", default: "DESC" }
//     }
// }, auth(async (req, connection, adminInfo) => {
//     const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"];
//     if (!adminInfo.roles.some(role => ALLOWED_ROLES.includes(role))) throw new errors.UNAUTHORIZED();

//     let { limit, offset } = req.typed.query;
//     limit = Math.min(Math.max(limit, 1), 50);
//     offset = Math.max(offset, 0);
//     req.typed.query.limit = limit;
//     req.typed.query.offset = offset;

//     const q = req.typed.query;
//     const filters = [];
//     const values = [];

//     // ---------- SEARCH ----------
//     if (q.search) {
//         filters.push("(p.name LIKE ? OR p.slug LIKE ?)");
//         values.push(`%${q.search}%`, `%${q.search}%`);
//     }

//     // ---------- CATEGORY & BRAND FILTER ----------
//     ["main_category_id", "sub_category_id", "child_category_id", "brand_id"].forEach(key => {
//         if (q[key] !== undefined) {
//             filters.push(`p.${key} = ?`);
//             values.push(q[key]);
//         }
//     });

//     // ---------- STATUS & FLAGS ----------
//     ["status", "featured", "best_deal", "free_delivery"].forEach(key => {
//         if (q[key] !== undefined) {
//             filters.push(`p.${key} = ?`);
//             values.push(q[key] ? 1 : 0);
//         }
//     });

//     // ---------- PRICE FILTER ----------
//     if (q.min_price !== undefined) {
//         filters.push("s.selling_price >= ?");
//         values.push(q.min_price);
//     }
//     if (q.max_price !== undefined) {
//         filters.push("s.selling_price <= ?");
//         values.push(q.max_price);
//     }

//     // ---------- STOCK FILTER ----------
//     let stockFilter = "";
//     let stockJoinNeeded = false;
    
//     if (q.in_stock !== undefined) {
//         stockJoinNeeded = true;
//         if (q.in_stock) {
//             // For in_stock = true, we need at least one SKU with stock > 0
//             stockFilter = "EXISTS (SELECT 1 FROM product_skus ps WHERE ps.product_id = p.id AND ps.stock > 0)";
//         } else {
//             // For in_stock = false, all SKUs should have stock = 0 OR product has no SKUs
//             stockFilter = "NOT EXISTS (SELECT 1 FROM product_skus ps WHERE ps.product_id = p.id AND ps.stock > 0)";
//         }
//     }

//     // ---------- BUILD WHERE CLAUSE ----------
//     let whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
    
//     // Add stock filter if it exists
//     if (stockFilter) {
//         whereClause += whereClause ? ` AND ${stockFilter}` : `WHERE ${stockFilter}`;
//     }

//     // ---------- JOIN CLAUSE ----------
//     let joinClause = "LEFT JOIN product_skus s ON s.product_id = p.id";
    
//     // If we need price filters but not stock filter, we still need the join
//     if ((q.min_price !== undefined || q.max_price !== undefined) && !stockJoinNeeded) {
//         joinClause = "LEFT JOIN product_skus s ON s.product_id = p.id";
//     }

//     // ---------- COUNT TOTAL ----------
//     const [{ total }] = await connection.query(
//         `SELECT COUNT(DISTINCT p.id) AS total
//          FROM products p
//          ${joinClause}
//          ${whereClause}`,
//         values
//     );

//     // ---------- SORT ----------
//     const validSortColumns = ["name", "created_at", "price"];
//     let sortBy = validSortColumns.includes(q.sort_by) ? q.sort_by : "created_at";
//     let sortOrder = q.sort_order.toUpperCase() === "ASC" ? "ASC" : "DESC";

//     // ---------- FETCH PRODUCTS ----------
//     let orderByClause;
//     let selectColumns = "p.*";
    
//     if (sortBy === "price") {
//         orderByClause = `MIN(s.selling_price) ${sortOrder}`;
//         // Need grouping for price sorting
//         selectColumns = "p.*, MIN(s.selling_price) as min_price";
//     } else {
//         orderByClause = `p.${sortBy} ${sortOrder}`;
//     }

//     // Determine if we need GROUP BY
//     const needsGroupBy = sortBy === "price" || q.min_price !== undefined || q.max_price !== undefined;
//     const groupByClause = needsGroupBy ? "GROUP BY p.id" : "";

//     const productRows = await connection.query(
//         `SELECT ${selectColumns}
//          FROM products p
//          ${joinClause}
//          ${whereClause}
//          ${groupByClause}
//          ORDER BY ${orderByClause}
//          LIMIT ? OFFSET ?`,
//         [...values, q.limit, q.offset]
//     );

//     const productIds = productRows.map(p => p.id);

//     // ---------- FETCH VARIATIONS ----------
//     const variationsRows = productIds.length
//         ? await connection.query(
//             `SELECT * FROM product_skus WHERE product_id IN (?)`,
//             [productIds]
//         )
//         : [];

//     // ---------- FETCH IMAGES ----------
//     const imagesRows = productIds.length
//         ? await connection.query(
//             `SELECT * FROM product_images WHERE product_id IN (?)`,
//             [productIds]
//         )
//         : [];

//     // ---------- FORMAT PRODUCTS ----------
//     const productsMap = new Map();
//     for (const p of productRows) {
//         productsMap.set(p.id, {
//             id: p.id,
//             name: p.name,
//             slug: p.slug,
//             main_category_id: p.main_category_id,
//             sub_category_id: p.sub_category_id,
//             child_category_id: p.child_category_id,
//             brand_id: p.brand_id,
//             status: !!p.status,
//             featured: !!p.featured,
//             best_deal: !!p.best_deal,
//             free_delivery: !!p.free_delivery,
//             created_at: p.created_at,
//             updated_at: p.updated_at,
//             images: [],
//             variations: [],
//             stock_summary: {
//                 total_stock: 0,
//                 in_stock: false,
//                 variation_count: 0
//             }
//         });
//     }

//     // Attach variations and calculate stock summary
//     const stockSummaryMap = new Map();
    
//     for (const v of variationsRows) {
//         const product = productsMap.get(v.product_id);
//         if (product) {
//             product.variations.push({
//                 id: v.id,
//                 color_id: v.color_id,
//                 variant_id: v.variant_id,
//                 buying_price: v.buying_price,
//                 selling_price: v.selling_price,
//                 discount: v.discount,
//                 discount_type: v.discount_type,
//                 stock: v.stock,
//                 sku: v.sku
//             });
            
//             // Update stock summary
//             if (!stockSummaryMap.has(v.product_id)) {
//                 stockSummaryMap.set(v.product_id, {
//                     total_stock: 0,
//                     variation_count: 0,
//                     in_stock: false
//                 });
//             }
            
//             const summary = stockSummaryMap.get(v.product_id);
//             summary.total_stock += v.stock;
//             summary.variation_count++;
//             if (v.stock > 0) {
//                 summary.in_stock = true;
//             }
//         }
//     }

//     // Attach stock summary to products
//     for (const [productId, summary] of stockSummaryMap) {
//         const product = productsMap.get(productId);
//         if (product) {
//             product.stock_summary = summary;
//         }
//     }

//     // Attach images
//     for (const img of imagesRows) {
//         const product = productsMap.get(img.product_id);
//         if (product) {
//             product.images.push({ id: img.id, path: img.img_path });
//         }
//     }

//     return { 
//         total, 
//         count: productsMap.size,
//         limit: q.limit,
//         offset: q.offset,
//         products: Array.from(productsMap.values()) 
//     };
// }));

// exports.getProductById = api({
//     params: {
//         id: { type: "int", required: true }
//     },
    
// }, auth(async (req, connection,adminInfo) => {
//     const productId = req.typed.params.id;
   
//     const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"];
//     if (!adminInfo.roles.some(role => ALLOWED_ROLES.includes(role))) throw new errors.UNAUTHORIZED();


//     // ---------- 1. Fetch product info with joins ----------
//     const productRow = await connection.queryOne(
//         `SELECT 
//             p.*,
//             mc.name as main_category_name,
//             sc.name as sub_category_name,
//             cc.name as child_category_name,
//             b.name as brand_name,
//             b.img_path as brand_image,
//             a.name as attribute_name
//          FROM products p
//          LEFT JOIN main_categories mc ON mc.id = p.main_category_id
//          LEFT JOIN sub_categories sc ON sc.id = p.sub_category_id
//          LEFT JOIN child_categories cc ON cc.id = p.child_category_id
//          LEFT JOIN brands b ON b.id = p.brand_id
//          LEFT JOIN attributes a ON a.id = p.attribute_id
//          WHERE p.id = ?`,
//         [productId]
//     );

//     if (!productRow) throw new errors.NOT_FOUND("Product not found.");

//     const product = {
//         id: productRow.id,
//         name: productRow.name,
//         slug: productRow.slug,
//         main_category: { id: productRow.main_category_id, name: productRow.main_category_name },
//         sub_category: { id: productRow.sub_category_id, name: productRow.sub_category_name },
//         child_category: { id: productRow.child_category_id, name: productRow.child_category_name },
//         brand: productRow.brand_id ? {
//             id: productRow.brand_id,
//             name: productRow.brand_name,
//             image: productRow.brand_image
//         } : null,
//         attribute: productRow.attribute_id ? {
//             id: productRow.attribute_id,
//             name: productRow.attribute_name
//         } : null,
//         video_path: productRow.video_path,
//         short_description: productRow.short_description,
//         long_description: productRow.long_description,
//         status: !!productRow.status,
//         featured: !!productRow.featured,
//         free_delivery: !!productRow.free_delivery,
//         best_deal: !!productRow.best_deal,
//         view_count: productRow.view_count || 0,
//         sell_count: productRow.sell_count || 0,
//         meta_title: productRow.meta_title,
//         canonical_url: productRow.canonical_url,
//         meta_description: productRow.meta_description,
//         meta_keywords: productRow.meta_keywords,
//         og_title: productRow.og_title,
//         og_description: productRow.og_description,
//         robots: productRow.robots,
//         created_at: productRow.created_at,
//         updated_at: productRow.updated_at,
//         images: [],
//         variations: [],
//         available_colors: [],
//         available_variants: [],
//         related_products: []
//     };

//     // ---------- 2. Fetch images ----------
//     const images = await connection.query(
//         `SELECT id, img_path, priority FROM product_images WHERE product_id = ? ORDER BY priority ASC, id ASC`,
//         [productId]
//     );
//     product.images = images.map(img => ({ id: img.id, path: img.img_path, priority: img.priority }));

//     // ---------- 3. Fetch variations ----------
//     const variations = await connection.query(
//         `SELECT ps.id, ps.color_id, ps.variant_id, ps.buying_price, ps.selling_price, ps.discount, ps.discount_type, ps.stock, ps.sku, ps.status as sku_status,
//                 c.name as color_name, c.hex as color_hex, c.priority as color_priority, c.status as color_status,
//                 v.name as variant_name, v.serial as variant_serial, v.status as variant_status,
//                 a.id as attribute_id, a.name as attribute_name, a.priority as attribute_priority
//          FROM product_skus ps
//          LEFT JOIN colors c ON c.id = ps.color_id
//          LEFT JOIN variants v ON v.id = ps.variant_id
//          LEFT JOIN attributes a ON a.id = v.attribute_id
//          WHERE ps.product_id = ? ORDER BY c.priority ASC, v.priority ASC`,
//         [productId]
//     );

//     const colorsSet = new Set();
//     const variantsSet = new Set();

//     product.variations = variations.map(variation => {
//         const variationObj = {
//             id: variation.id,
//             color: variation.color_id ? { id: variation.color_id, name: variation.color_name, hex: variation.color_hex, priority: variation.color_priority, status: !!variation.color_status } : null,
//             variant: variation.variant_id ? { id: variation.variant_id, name: variation.variant_name, priority: variation.variant_priority, status: !!variation.variant_status, attribute: variation.attribute_id ? { id: variation.attribute_id, name: variation.attribute_name, priority: variation.attribute_priority } : null } : null,
//             buying_price: Number(variation.buying_price),
//             selling_price: Number(variation.selling_price),
//             discount: Number(variation.discount),
//             discount_type: variation.discount_type,
//             final_price: variation.discount_type === 1 
//                 ? Number(variation.selling_price) * (1 - Number(variation.discount) / 100)
//                 : Number(variation.selling_price) - Number(variation.discount),
//             stock: variation.stock,
//             sku: variation.sku,
//             status: !!variation.sku_status,
//             in_stock: variation.stock > 0
//         };

//         if (variation.color_id) colorsSet.add(JSON.stringify({ id: variation.color_id, name: variation.color_name, hex: variation.color_hex, priority: variation.color_priority }));
//         if (variation.variant_id) variantsSet.add(JSON.stringify({ id: variation.variant_id, name: variation.variant_name, attribute_id: variation.attribute_id, attribute_name: variation.attribute_name }));
//         return variationObj;
//     });

//     // ---------- 4. Formatting sets ----------
//     product.available_colors = Array.from(colorsSet).map(s => JSON.parse(s)).sort((a, b) => a.priority - b.priority);
//     product.available_variants = Array.from(variantsSet).map(s => JSON.parse(s)).sort((a, b) => a.attribute_name?.localeCompare(b.attribute_name) || a.name.localeCompare(b.name));

//     // ---------- 5. Summary ----------
//     product.summary = {
//         total_variations: product.variations.length,
//         total_in_stock: product.variations.filter(v => v.in_stock).length,
//         total_out_of_stock: product.variations.filter(v => !v.in_stock).length,
//         min_price: product.variations.length > 0 ? Math.min(...product.variations.map(v => v.final_price)) : 0,
//         max_price: product.variations.length > 0 ? Math.max(...product.variations.map(v => v.final_price)) : 0,
//         total_stock: product.variations.reduce((sum, v) => sum + v.stock, 0)
//     };

 
    
//     // ---------- 6. Related Products based ONLY on meta keywords ----------
// if (productRow.meta_keywords && productRow.meta_keywords.trim() !== '') {
//     const keywords = productRow.meta_keywords
//         .split(',')
//         .map(k => k.trim())
//         .filter(k => k !== '');

//     if (keywords.length > 0) {
//         // 1. Conditions for WHERE clause
//         const keywordConditions = keywords.map(() => `p.meta_keywords LIKE ?`).join(' OR ');

//         // 2. Logic for SCORING (Match count)
//         // We check each keyword individually and add 1 if it matches
//         const scoringLogic = keywords.map(() => `IF(p.meta_keywords LIKE ?, 1, 0)`).join(' + ');

//         // 3. Parameters: [Scoring Keywords..., Where Keywords..., CurrentProductId]
//         const keywordParams = [...keywords.map(k => `%${k}%`), ...keywords.map(k => `%${k}%`), productId];

//         const keywordRelated = await connection.query(
//             `SELECT p.id, p.name, p.slug, p.featured, p.sell_count, p.view_count,
//                     (SELECT pi.img_path FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.priority ASC LIMIT 1) as image,
//                     (${scoringLogic}) as keyword_match_count
//              FROM products p 
//              WHERE (${keywordConditions}) 
//                AND p.id != ? 
//                AND p.status = 1
//              ORDER BY keyword_match_count DESC, p.featured DESC, p.sell_count DESC 
//              LIMIT 20`,
//             keywordParams
//         );

//         product.related_products = keywordRelated.map(rp => ({ 
//             id: rp.id, 
//             name: rp.name, 
//             slug: rp.slug, 
//             image: rp.image,
//             featured: !!rp.featured,
//             sell_count: rp.sell_count || 0,
//             view_count: rp.view_count || 0,
//             keyword_match_count: rp.keyword_match_count || 0
//         }));
//     }
// } else {
//         // If no meta keywords, return empty array
//         product.related_products = [];
//     }

    

//     return { 
     
//         success: true,
//         product 
//     };
// }));


exports.getProducts = api({
    query: {
        search: { type: "string" },
        main_category_id: { type: "int" },
        sub_category_id: { type: "int" },
        child_category_id: { type: "int" },
        brand_id: { type: "int" },
        status: { type: "bool" },
        featured: { type: "bool" },
        best_deal: { type: "bool" },
        free_delivery: { type: "bool" },
        min_price: { type: "float" },
        max_price: { type: "float" },
        in_stock: { type: "bool" },
        limit: { type: "int", default: 20 },
        offset: { type: "int", default: 0 },
        sort_by: { type: "string", default: "created_at" }, // name, created_at, price
        sort_order: { type: "string", default: "DESC" },
        min_rating: { type: "int" }
    }
}, auth(async (req, connection, adminInfo) => {
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"];
    if (!adminInfo.roles.some(role => ALLOWED_ROLES.includes(role))) throw new errors.UNAUTHORIZED();

    let { limit, offset } = req.typed.query;
    limit = Math.min(Math.max(limit, 1), 50);
    offset = Math.max(offset, 0);
    req.typed.query.limit = limit;
    req.typed.query.offset = offset;

    const q = req.typed.query;
    const filters = [];
    const values = [];

    // ---------- SEARCH ----------
    if (q.search) {
        filters.push("(CONVERT(p.name USING utf8mb4) COLLATE utf8mb4_unicode_ci LIKE ? OR p.name_bd COLLATE utf8mb4_unicode_ci LIKE ? OR p.slug LIKE ?)");
        values.push(`%${q.search}%`, `%${q.search}%`, `%${q.search}%`);
    }

    // ---------- CATEGORY & BRAND FILTER ----------
    ["main_category_id", "sub_category_id", "child_category_id", "brand_id"].forEach(key => {
        if (q[key] !== undefined) {
            filters.push(`p.${key} = ?`);
            values.push(q[key]);
        }
    });

    // ---------- STATUS & FLAGS ----------
    ["status", "featured", "best_deal", "free_delivery"].forEach(key => {
        if (q[key] !== undefined) {
            filters.push(`p.${key} = ?`);
            values.push(q[key] ? 1 : 0);
        }
    });

    // ---------- CATEGORY STATUS HIERARCHY CHECK ----------
    // Ensure the entire category chain is active
    // filters.push("mc.status = 1");
    // filters.push("(p.sub_category_id IS NULL OR sc.status = 1)");
    // filters.push("(p.child_category_id IS NULL OR cc.status = 1)");

    // ---------- PRICE FILTER ----------
    if (q.min_price !== undefined) {
        filters.push("s.selling_price >= ?");
        values.push(q.min_price);
    }
    if (q.max_price !== undefined) {
        filters.push("s.selling_price <= ?");
        values.push(q.max_price);
    }

    // ---------- STOCK FILTER ----------
    let stockFilter = "";
    if (q.in_stock !== undefined) {
        if (q.in_stock) {
            stockFilter = "EXISTS (SELECT 1 FROM product_skus ps WHERE ps.product_id = p.id AND ps.stock > 0)";
        } else {
            stockFilter = "NOT EXISTS (SELECT 1 FROM product_skus ps WHERE ps.product_id = p.id AND ps.stock > 0)";
        }
    }

    // ---------- BUILD WHERE CLAUSE ----------
    let whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
    if (stockFilter) {
        whereClause += whereClause ? ` AND ${stockFilter}` : `WHERE ${stockFilter}`;
    }

    // Star rating filter (V2-042)
    if (q.min_rating !== undefined && q.min_rating >= 1 && q.min_rating <= 5) {
        const ratingFilter = 'p.avg_rating >= ?';
        whereClause += whereClause ? ` AND ${ratingFilter}` : `WHERE ${ratingFilter}`;
        values.push(q.min_rating);
    }

    // ---------- JOIN CLAUSE ----------
    // Added INNER JOIN for main_categories and LEFT JOINs for sub/child categories
    let joinClause = `
        INNER JOIN main_categories mc ON p.main_category_id = mc.id
        LEFT JOIN sub_categories sc ON p.sub_category_id = sc.id
        LEFT JOIN child_categories cc ON p.child_category_id = cc.id
        LEFT JOIN product_skus s ON s.product_id = p.id
    `;

    // ---------- COUNT TOTAL ----------
    const [{ total }] = await connection.query(
        `SELECT COUNT(DISTINCT p.id) AS total
         FROM products p
         ${joinClause}
         ${whereClause}`,
        values
    );

    // ---------- SORT ----------
    const validSortColumns = ["name", "created_at", "price"];
    let sortBy = validSortColumns.includes(q.sort_by) ? q.sort_by : "created_at";
    let sortOrder = q.sort_order.toUpperCase() === "ASC" ? "ASC" : "DESC";

    // ---------- FETCH PRODUCTS ----------
    let orderByClause;
    let selectColumns = `
        p.*,
        MAX(mc.name) AS main_category_name,
        MAX(mc.name_bd) AS main_category_name_bd,
        MAX(sc.name) AS sub_category_name,
        MAX(sc.name_bd) AS sub_category_name_bd,
        MAX(cc.name) AS child_category_name,
        MAX(cc.name_bd) AS child_category_name_bd
    `;
    
    if (sortBy === "price") {
        orderByClause = `MIN(s.selling_price) ${sortOrder}`;
        selectColumns = `
            p.*,
            MIN(s.selling_price) as min_price,
            MAX(mc.name) AS main_category_name,
            MAX(mc.name_bd) AS main_category_name_bd,
            MAX(sc.name) AS sub_category_name,
            MAX(sc.name_bd) AS sub_category_name_bd,
            MAX(cc.name) AS child_category_name,
            MAX(cc.name_bd) AS child_category_name_bd
        `;
    } else {
        orderByClause = `p.${sortBy} ${sortOrder}`;
    }

    const groupByClause = "GROUP BY p.id";

    const productRows = await connection.query(
        `SELECT ${selectColumns}
         FROM products p
         ${joinClause}
         ${whereClause}
         ${groupByClause}
         ORDER BY ${orderByClause}
         LIMIT ? OFFSET ?`,
        [...values, q.limit, q.offset]
    );

    const productIds = productRows.map(p => p.id);

    // ---------- FETCH VARIATIONS ----------
    const variationsRows = productIds.length
        ? await connection.query(
            `SELECT * FROM product_skus WHERE product_id IN (?)`,
            [productIds]
        )
        : [];

    // ---------- FETCH IMAGES ----------
    const imagesRows = productIds.length
        ? await connection.query(
            `SELECT * FROM product_images WHERE product_id IN (?)`,
            [productIds]
        )
        : [];

    // ---------- FORMAT PRODUCTS ----------
    const productsMap = new Map();
    for (const p of productRows) {
        productsMap.set(p.id, {
            id: p.id,
            name: p.name,
            name_bd: p.name_bd,
            slug: p.slug,
            main_category_id: p.main_category_id,
            main_category_name: p.main_category_name,
            main_category_name_bd: p.main_category_name_bd,
            sub_category_id: p.sub_category_id,
            sub_category_name: p.sub_category_name,
            sub_category_name_bd: p.sub_category_name_bd,
            child_category_id: p.child_category_id,
            child_category_name: p.child_category_name,
            child_category_name_bd: p.child_category_name_bd,
            brand_id: p.brand_id,
            face_image: p.face_image || null,
            status: !!p.status,
            featured: !!p.featured,
            best_deal: !!p.best_deal,
            free_delivery: !!p.free_delivery,
            has_single_product_page: !!p.has_single_product_page,
            created_at: p.created_at,
            updated_at: p.updated_at,
            avg_rating: Number(p.avg_rating) || 0,
            review_count: p.review_count || 0,
            images: [],
            variations: [],
            stock_summary: {
                total_stock: 0,
                in_stock: false,
                variation_count: 0
            }
        });
    }

    const stockSummaryMap = new Map();
    for (const v of variationsRows) {
        const product = productsMap.get(v.product_id);
        if (product) {
            product.variations.push({
                id: v.id,
                color_id: v.color_id,
                variant_id: v.variant_id,
                buying_price: v.buying_price,
                selling_price: v.selling_price,
                discount: v.discount,
                discount_type: v.discount_type,
                stock: v.stock,
                sku: v.sku
            });
            
            if (!stockSummaryMap.has(v.product_id)) {
                stockSummaryMap.set(v.product_id, {
                    total_stock: 0,
                    variation_count: 0,
                    in_stock: false
                });
            }
            
            const summary = stockSummaryMap.get(v.product_id);
            summary.total_stock += v.stock;
            summary.variation_count++;
            if (v.stock > 0) {
                summary.in_stock = true;
            }
        }
    }

    for (const [productId, summary] of stockSummaryMap) {
        const product = productsMap.get(productId);
        if (product) {
            product.stock_summary = summary;
        }
    }

    for (const img of imagesRows) {
        const product = productsMap.get(img.product_id);
        if (product) {
            product.images.push({ id: img.id, path: img.img_path });
        }
    }

    return { 
        total, 
        // count: productsMap.size,
        limit: q.limit,
        offset: q.offset,
        products: Array.from(productsMap.values()) 
    };
}));

exports.getProductById = api({
    params: {
        id: { type: "int", required: true }
    },
    
}, auth(async (req, connection, adminInfo) => {
    const productId = req.typed.params.id;
   
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"];
    if (!adminInfo.roles.some(role => ALLOWED_ROLES.includes(role))) throw new errors.UNAUTHORIZED();

    // ---------- 1. Fetch product info with joins ----------
    // Added category status checks to the WHERE clause
    const productRow = await connection.queryOne(
        `SELECT 
            p.*,
            mc.name as main_category_name,
            mc.name_bd as main_category_name_bd,
            sc.name as sub_category_name,
            sc.name_bd as sub_category_name_bd,
            cc.name as child_category_name,
            cc.name_bd as child_category_name_bd,
            b.name as brand_name,
            b.img_path as brand_image,
            a.name as attribute_name,
            a.name_bd as attribute_name_bd
         FROM products p
         INNER JOIN main_categories mc ON mc.id = p.main_category_id
         LEFT JOIN sub_categories sc ON sc.id = p.sub_category_id
         LEFT JOIN child_categories cc ON cc.id = p.child_category_id
         LEFT JOIN brands b ON b.id = p.brand_id
         LEFT JOIN attributes a ON a.id = p.attribute_id
         WHERE p.id = ?
       `,
        [productId]
    );

    if (!productRow) throw new errors.NOT_FOUND("Product not found or its category is inactive.");

    const product = {
        id: productRow.id,
        name: productRow.name,
        name_bd: productRow.name_bd,
        slug: productRow.slug,
        main_category: { id: productRow.main_category_id, name: productRow.main_category_name, name_bd: productRow.main_category_name_bd },
        sub_category: { id: productRow.sub_category_id, name: productRow.sub_category_name, name_bd: productRow.sub_category_name_bd },
        child_category: { id: productRow.child_category_id, name: productRow.child_category_name, name_bd: productRow.child_category_name_bd },
        brand: productRow.brand_id ? {
            id: productRow.brand_id,
            name: productRow.brand_name,
            name_bd: productRow.brand_name,
            image: productRow.brand_image
        } : null,
        attribute: productRow.attribute_id ? {
            id: productRow.attribute_id,
            name: productRow.attribute_name,
            name_bd: productRow.attribute_name_bd
        } : null,
        video_path: productRow.video_path,
        short_description: productRow.short_description,
        long_description: productRow.long_description,
        status: !!productRow.status,
        featured: !!productRow.featured,
        free_delivery: !!productRow.free_delivery,
        best_deal: !!productRow.best_deal,
        has_single_product_page: !!productRow.has_single_product_page,
        view_count: productRow.view_count || 0,
        sell_count: productRow.sell_count || 0,
        meta_title: productRow.meta_title,
        canonical_url: productRow.canonical_url,
        meta_description: productRow.meta_description,
        meta_keywords: productRow.meta_keywords,
        og_title: productRow.og_title,
        og_description: productRow.og_description,
        robots: productRow.robots,
        created_at: productRow.created_at,
        updated_at: productRow.updated_at,
        images: [],
        variations: [],
        available_colors: [],
        available_variants: [],
        related_products: []
    };

    // ---------- 2. Fetch images ----------
    const images = await connection.query(
        `SELECT pi.id, pi.img_path, pi.serial, pi.sku_id,
                ps.color_id AS sku_color_id, ps.variant_id AS sku_variant_id
         FROM product_images pi
         LEFT JOIN product_skus ps ON ps.id = pi.sku_id
         WHERE pi.product_id = ? ORDER BY pi.serial ASC, pi.id ASC`,
        [productId]
    );
    product.images = images.map(img => ({
        id: img.id,
        path: img.img_path,
        serial: img.serial,
        sku_id: img.sku_id ?? null,
        sku_color_id: img.sku_color_id ?? null,
        sku_variant_id: img.sku_variant_id ?? null
    }));

    // ---------- 3. Fetch variations ----------
    const variations = await connection.query(
        `SELECT ps.id, ps.color_id, ps.variant_id, ps.buying_price, ps.selling_price, ps.discount, ps.discount_type, ps.stock, ps.sku, ps.status as sku_status, ps.weight_kg,
                c.name as color_name, c.name_bd as color_name_bd, c.hex as color_hex, c.priority as color_priority, c.status as color_status,
                v.name as variant_name, v.name_bd as variant_name_bd, v.serial as variant_serial, v.status as variant_status,v.updated_at as variant_updated_at,
                a.id as attribute_id, a.name as attribute_name, a.name_bd as attribute_name_bd, a.priority as attribute_priority
         FROM product_skus ps
         LEFT JOIN colors c ON c.id = ps.color_id
         LEFT JOIN variants v ON v.id = ps.variant_id
         LEFT JOIN attributes a ON a.id = v.attribute_id
         WHERE ps.product_id = ? ORDER BY c.priority ASC, v.serial ASC, v.id ASC`,
        [productId]
    );

    const colorsSet = new Set();
    const variantsSet = new Set();

    product.variations = variations.map(variation => {
        const variationObj = {
            id: variation.id,
            color: variation.color_id ? { id: variation.color_id, name: variation.color_name, name_bd: variation.color_name_bd, hex: variation.color_hex, priority: variation.color_priority, status: !!variation.color_status } : null,
            variant: variation.variant_id ? { id: variation.variant_id, name: variation.variant_name, name_bd: variation.variant_name_bd, serial: variation.variant_serial, status: !!variation.variant_status, attribute: variation.attribute_id ? { id: variation.attribute_id, name: variation.attribute_name, name_bd: variation.attribute_name_bd, priority: variation.attribute_priority } : null } : null,
            buying_price: Number(variation.buying_price),
            selling_price: Number(variation.selling_price),
            discount: Number(variation.discount),
            discount_type: variation.discount_type,
            final_price: variation.discount_type === 1 
                ? Number(variation.selling_price) * (1 - Number(variation.discount) / 100)
                : Number(variation.selling_price) - Number(variation.discount),
            stock: variation.stock,
            sku: variation.sku,
            weight_kg: Number(variation.weight_kg ?? 0),
            status: !!variation.sku_status,
            in_stock: variation.stock > 0
        };

        if (variation.color_id) colorsSet.add(JSON.stringify({ id: variation.color_id, name: variation.color_name, name_bd: variation.color_name_bd, hex: variation.color_hex, priority: variation.color_priority }));
        if (variation.variant_id) variantsSet.add(JSON.stringify({ id: variation.variant_id, name: variation.variant_name, name_bd: variation.variant_name_bd, attribute_id: variation.attribute_id, attribute_name: variation.attribute_name, attribute_name_bd: variation.attribute_name_bd }));
        return variationObj;
    });

    // ---------- 4. Formatting sets ----------
    product.available_colors = Array.from(colorsSet).map(s => JSON.parse(s)).sort((a, b) => a.priority - b.priority);
    product.available_variants = Array.from(variantsSet).map(s => JSON.parse(s)).sort((a, b) => a.attribute_name?.localeCompare(b.attribute_name) || a.name.localeCompare(b.name));

    // ---------- 5. Summary ----------
    product.summary = {
        total_variations: product.variations.length,
        total_in_stock: product.variations.filter(v => v.in_stock).length,
        total_out_of_stock: product.variations.filter(v => !v.in_stock).length,
        min_price: product.variations.length > 0 ? Math.min(...product.variations.map(v => v.final_price)) : 0,
        max_price: product.variations.length > 0 ? Math.max(...product.variations.map(v => v.final_price)) : 0,
        total_stock: product.variations.reduce((sum, v) => sum + v.stock, 0)
    };

    // ---------- 6. Related Products based ONLY on meta keywords ----------
    if (productRow.meta_keywords && productRow.meta_keywords.trim() !== '') {
        const keywords = productRow.meta_keywords
            .split(',')
            .map(k => k.trim())
            .filter(k => k !== '');

        if (keywords.length > 0) {
            const keywordConditions = keywords.map(() => `p.meta_keywords LIKE ?`).join(' OR ');
            const scoringLogic = keywords.map(() => `IF(p.meta_keywords LIKE ?, 1, 0)`).join(' + ');
            const keywordParams = [...keywords.map(k => `%${k}%`), ...keywords.map(k => `%${k}%`), productId];

            // Added Category Status Check for Related Products as well
            const keywordRelated = await connection.query(
                `SELECT p.id, p.name, p.name_bd, p.slug, p.featured, p.sell_count, p.view_count,
                        COALESCE(p.face_image, (SELECT pi.img_path FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.serial ASC, pi.id ASC LIMIT 1)) as image,
                        (${scoringLogic}) as keyword_match_count
                 FROM products p 
                 INNER JOIN main_categories mc ON mc.id = p.main_category_id
                 LEFT JOIN sub_categories sc ON sc.id = p.sub_category_id
                 LEFT JOIN child_categories cc ON cc.id = p.child_category_id
                 WHERE (${keywordConditions}) 
                   AND p.id != ? 
                   AND p.status = 1
                   AND mc.status = 1
                   AND (p.sub_category_id IS NULL OR sc.status = 1)
                   AND (p.child_category_id IS NULL OR cc.status = 1)
                 ORDER BY keyword_match_count DESC, p.featured DESC, p.sell_count DESC 
                 LIMIT 20`,
                keywordParams
            );

            product.related_products = keywordRelated.map(rp => ({ 
                id: rp.id, 
                name: rp.name, 
                name_bd: rp.name_bd,
                slug: rp.slug, 
                image: rp.image,
                featured: !!rp.featured,
                sell_count: rp.sell_count || 0,
                view_count: rp.view_count || 0,
                keyword_match_count: rp.keyword_match_count || 0
            }));
        }
    } else {
        product.related_products = [];
    }

    return { 
        success: true,
        product 
    };
}));






 

// exports.getProductByIdUser = api({
//     params: {
//         id: { type: "int", required: true }
//     },
//     query: {
//         ip: { type: "string", required: false }
//     },
// }, async (req, connection) => {
//     const productId = req.typed.params.id;
//     const userIp = req.typed.query.ip;

//     // ---------- OPTIONAL AUTH ----------
//     let userId = null;
//     let isAuthenticated = false;

//     try {
//         const authHeader = req.headers.authorization;
//         if (authHeader && authHeader.startsWith("Bearer ")) {
//             const token = authHeader.split(" ")[1];
//             const decodedToken = await verifyJwt(token, jwtSecret);

//             if (decodedToken?.uid) {
//                 const user = await connection.queryOne(
//                     `SELECT id, status, is_email_verified, token_version
//                      FROM users
//                      WHERE id = ? AND status = 'active' AND deleted_at IS NULL`,
//                     [decodedToken.uid]
//                 );

//                 if (
//                     user &&
//                     user.is_email_verified &&
//                     decodedToken.ev === true &&
//                     decodedToken.tv === user.token_version
//                 ) {
//                     userId = user.id;
//                     isAuthenticated = true;
//                 }
//             }
//         }
//     } catch (e) {}

//     // ---------- PRODUCT ----------
//     const productRow = await connection.queryOne(
//         `SELECT 
//             p.*,
//             mc.name as main_category_name,
//             sc.name as sub_category_name,
//             cc.name as child_category_name,
//             b.name as brand_name,
//             b.img_path as brand_image,
//             a.name as attribute_name
//          FROM products p
//          LEFT JOIN main_categories mc ON mc.id = p.main_category_id
//          LEFT JOIN sub_categories sc ON sc.id = p.sub_category_id
//          LEFT JOIN child_categories cc ON cc.id = p.child_category_id
//          LEFT JOIN brands b ON b.id = p.brand_id
//          LEFT JOIN attributes a ON a.id = p.attribute_id
//          WHERE p.id = ? AND p.status = 1`,
//         [productId]
//     );

//     if (!productRow) throw new errors.NOT_FOUND("Product not found.");

//     // ---------- PRODUCT FAV ----------
//     let isFavourite = false;
//     if (isAuthenticated) {
//         const fav = await connection.queryOne(
//             `SELECT 1 FROM favorites WHERE user_id = ? AND product_id = ? LIMIT 1`,
//             [userId, productRow.id]
//         );
//         isFavourite = !!fav;
//     }

//     const product = {
//         id: productRow.id,
//         name: productRow.name,
//         slug: productRow.slug,
//         is_favourite: isAuthenticated ? isFavourite : false,
//         main_category: { id: productRow.main_category_id, name: productRow.main_category_name },
//         sub_category: { id: productRow.sub_category_id, name: productRow.sub_category_name },
//         child_category: { id: productRow.child_category_id, name: productRow.child_category_name },
//         brand: productRow.brand_id ? {
//             id: productRow.brand_id,
//             name: productRow.brand_name,
//             image: productRow.brand_image
//         } : null,
//         attribute: productRow.attribute_id ? {
//             id: productRow.attribute_id,
//             name: productRow.attribute_name
//         } : null,
//         video_path: productRow.video_path,
//         short_description: productRow.short_description,
//         long_description: productRow.long_description,
//         featured: !!productRow.featured,
//         free_delivery: !!productRow.free_delivery,
//         best_deal: !!productRow.best_deal,
//         sell_count: productRow.sell_count || 0,
//         meta_title: productRow.meta_title,
//         canonical_url: productRow.canonical_url,
//         meta_description: productRow.meta_description,
//         meta_keywords: productRow.meta_keywords,
//         og_title: productRow.og_title,
//         og_description: productRow.og_description,
//         robots: productRow.robots,
//         images: [],
//         variations: [],
//         available_colors: [],
//         available_variants: [],
//         related_products: []
//     };

//     // ---------- IMAGES ----------
//     const images = await connection.query(
//         `SELECT id, img_path, priority
//          FROM product_images
//          WHERE product_id = ?
//          ORDER BY priority ASC, id ASC`,
//         [productRow.id]
//     );
//     product.images = images.map(i => ({ id: i.id, path: i.img_path, priority: i.priority }));

//     // ---------- 3. Fetch variations ----------
//     const variations = await connection.query(
//         `SELECT ps.id, ps.color_id, ps.variant_id, ps.selling_price, ps.discount, ps.discount_type, ps.stock, ps.sku,
//                 c.name as color_name, c.hex as color_hex, c.priority as color_priority,
//                 v.name as variant_name, v.serial as variant_serial,
//                 a.id as attribute_id, a.name as attribute_name, a.priority as attribute_priority
//          FROM product_skus ps
//          LEFT JOIN colors c ON c.id = ps.color_id
//          LEFT JOIN variants v ON v.id = ps.variant_id
//          LEFT JOIN attributes a ON a.id = v.attribute_id
//          WHERE ps.product_id = ? AND ps.status = 1 AND ps.stock > 0
//          ORDER BY c.priority ASC, v.priority ASC`,
//         [productRow.id]
//     );

//     const colorsSet = new Set();
//     const variantsSet = new Set();

//     product.variations = variations.map(v => {
//         if (v.color_id) {
//             colorsSet.add(JSON.stringify({
//                 id: v.color_id,
//                 name: v.color_name,
//                 hex: v.color_hex,
//                 priority: v.color_priority
//             }));
//         }

//         if (v.variant_id) {
//             variantsSet.add(JSON.stringify({
//                 id: v.variant_id,
//                 name: v.variant_name,
//                 attribute_id: v.attribute_id,
//                 attribute_name: v.attribute_name
//             }));
//         }

//         return {
//             id: v.id,
//             color: v.color_id ? {
//                 id: v.color_id,
//                 name: v.color_name,
//                 hex: v.color_hex,
//                 priority: v.color_priority
//             } : null,
//             variant: v.variant_id ? {
//                 id: v.variant_id,
//                 name: v.variant_name,
//                 priority: v.variant_priority,
//                 attribute: v.attribute_id ? {
//                     id: v.attribute_id,
//                     name: v.attribute_name,
//                     priority: v.attribute_priority
//                 } : null
//             } : null,
//             selling_price: Number(v.selling_price),
//             discount: Number(v.discount),
//             discount_type: v.discount_type,
//             final_price: v.discount_type === 1
//                 ? Number(v.selling_price) * (1 - Number(v.discount) / 100)
//                 : Number(v.selling_price) - Number(v.discount),
//             stock: v.stock,
//             sku: v.sku,
//             in_stock: v.stock > 0
//         };
//     });

//     product.available_colors = Array.from(colorsSet)
//         .map(s => JSON.parse(s))
//         .sort((a, b) => a.priority - b.priority);

//     product.available_variants = Array.from(variantsSet)
//         .map(s => JSON.parse(s))
//         .sort((a, b) =>
//             a.attribute_name?.localeCompare(b.attribute_name) ||
//             a.name.localeCompare(b.name)
//         );

//     // ---------- 4. Related products (meta keywords only) ----------
//     if (productRow.meta_keywords?.trim()) {
//         const keywords = productRow.meta_keywords
//             .split(',')
//             .map(k => k.trim())
//             .filter(Boolean);

//         if (keywords.length) {
//             const conditions = keywords.map(() => `p.meta_keywords LIKE ?`).join(' OR ');
//             const scoring = keywords.map(() => `IF(p.meta_keywords LIKE ?,1,0)`).join(' + ');
//             const params = [
//                 ...keywords.map(k => `%${k}%`),
//                 ...keywords.map(k => `%${k}%`),
//                 productRow.id
//             ];

//             const related = await connection.query(
//                 `SELECT 
//                     p.id, p.name, p.slug, p.featured,
//                     (SELECT pi.img_path 
//                      FROM product_images pi 
//                      WHERE pi.product_id = p.id 
//                      ORDER BY pi.priority ASC LIMIT 1) AS image,
//                     (SELECT MIN(ps.selling_price)
//                      FROM product_skus ps
//                      WHERE ps.product_id = p.id AND ps.status = 1) AS min_price,
//                     (${scoring}) AS keyword_match_count
//                  FROM products p
//                  WHERE (${conditions})
//                    AND p.id != ?
//                    AND p.status = 1
//                  ORDER BY keyword_match_count DESC, p.featured DESC, p.sell_count DESC
//                  LIMIT 10`,
//                 params
//             );

//             let favSet = new Set();
//             if (isAuthenticated && related.length) {
//                 const favs = await connection.query(
//                     `SELECT product_id FROM favorites 
//                      WHERE user_id = ? AND product_id IN (?)`,
//                     [userId, related.map(r => r.id)]
//                 );
//                 favSet = new Set(favs.map(f => f.product_id));
//             }

//             product.related_products = related.map(r => ({
//                 id: r.id,
//                 name: r.name,
//                 slug: r.slug,
//                 image: r.image,
//                 featured: !!r.featured,
//                 min_price: Number(r.min_price) || 0,
//                 is_favourite: isAuthenticated ? favSet.has(r.id) : false,
//                 keyword_match_count: r.keyword_match_count || 0
//             }));
//         }
//     }

//     // ---------- VIEW COUNT ----------
//     if (userIp) {
//         try {
//             const log = await connection.query(
//                 `INSERT IGNORE INTO product_view_logs (product_id, ip_address)
//                  VALUES (?, INET6_ATON(?))`,
//                 [productRow.id, userIp]
//             );

//             if (log?.affectedRows > 0) {
//                 await connection.query(
//                     `UPDATE products SET view_count = view_count + 1 WHERE id = ?`,
//                     [productRow.id]
//                 );
//             }
//         } catch (e) {}
//     }

//     return {
//         success: true,
//         product
//     };
// });
exports.getProductByIdUser = api({
    params: {
        id: { type: "int", required: true }
    },
    query: {
        ip: { type: "string", required: false }
    },
}, async (req, connection) => {
    const productId = req.typed.params.id;
    const userIp = req.typed.query.ip;

    // ---------- OPTIONAL AUTH ----------
    let userId = null;
    let isAuthenticated = false;

    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.split(" ")[1];
            const decodedToken = await verifyJwt(token, jwtSecret);

            if (decodedToken?.uid) {
                const user = await connection.queryOne(
                    `SELECT id, status, is_email_verified, token_version
                     FROM users
                     WHERE id = ? AND status = 'active' AND deleted_at IS NULL`,
                    [decodedToken.uid]
                );

                if (
                    user &&
                    user.is_email_verified &&
                    decodedToken.ev === true &&
                    decodedToken.tv === user.token_version
                ) {
                    userId = user.id;
                    isAuthenticated = true;
                }
            }
        }
    } catch (e) {}

    // ---------- PRODUCT ----------
    // Added category joins and hierarchy status checks
    const productRow = await connection.queryOne(
        `SELECT 
            p.*,
            mc.name as main_category_name,
            mc.name_bd as main_category_name_bd,
            sc.name as sub_category_name,
            sc.name_bd as sub_category_name_bd,
            cc.name as child_category_name,
            cc.name_bd as child_category_name_bd,
            b.name as brand_name,
            b.img_path as brand_image,
            a.name as attribute_name,
            a.name_bd as attribute_name_bd
         FROM products p
         INNER JOIN main_categories mc ON mc.id = p.main_category_id
         LEFT JOIN sub_categories sc ON sc.id = p.sub_category_id
         LEFT JOIN child_categories cc ON cc.id = p.child_category_id
         LEFT JOIN brands b ON b.id = p.brand_id
         LEFT JOIN attributes a ON a.id = p.attribute_id
         WHERE p.id = ? 
           AND p.status = 1
           AND mc.status = 1
           AND (p.sub_category_id IS NULL OR sc.status = 1)
           AND (p.child_category_id IS NULL OR cc.status = 1)`,
        [productId]
    );

    if (!productRow) throw new errors.NOT_FOUND("Product not found.");

    // ---------- PRODUCT FAV ----------
    let isFavourite = false;
    if (isAuthenticated) {
        const fav = await connection.queryOne(
            `SELECT 1 FROM favorites WHERE user_id = ? AND product_id = ? LIMIT 1`,
            [userId, productRow.id]
        );
        isFavourite = !!fav;
    }

    const product = {
        id: productRow.id,
        name: productRow.name,
        name_bd: productRow.name_bd,
        slug: productRow.slug,
        is_favourite: isAuthenticated ? isFavourite : false,
        main_category: { id: productRow.main_category_id, name: productRow.main_category_name, name_bd: productRow.main_category_name_bd },
        sub_category: { id: productRow.sub_category_id, name: productRow.sub_category_name, name_bd: productRow.sub_category_name_bd },
        child_category: { id: productRow.child_category_id, name: productRow.child_category_name, name_bd: productRow.child_category_name_bd },
        brand: productRow.brand_id ? {
            id: productRow.brand_id,
            name: productRow.brand_name,
            name_bd: productRow.brand_name,
            image: productRow.brand_image
        } : null,
        attribute: productRow.attribute_id ? {
            id: productRow.attribute_id,
            name: productRow.attribute_name,
            name_bd: productRow.attribute_name_bd
        } : null,
        video_path: productRow.video_path,
        short_description: productRow.short_description,
        long_description: productRow.long_description,
        featured: !!productRow.featured,
        free_delivery: !!productRow.free_delivery,
        best_deal: !!productRow.best_deal,
        sell_count: productRow.sell_count || 0,
        meta_title: productRow.meta_title,
        canonical_url: productRow.canonical_url,
        meta_description: productRow.meta_description,
        meta_keywords: productRow.meta_keywords,
        og_title: productRow.og_title,
        og_description: productRow.og_description,
        robots: productRow.robots,
        has_single_product_page: !!productRow.has_single_product_page,
        images: [],
        variations: [],
        available_colors: [],
        available_variants: [],
        related_products: []
    };

    // ---------- IMAGES ----------
    const images = await connection.query(
        `SELECT pi.id, pi.img_path, pi.serial, pi.sku_id,
                ps.color_id AS sku_color_id, ps.variant_id AS sku_variant_id
         FROM product_images pi
         LEFT JOIN product_skus ps ON ps.id = pi.sku_id
         WHERE pi.product_id = ?
         ORDER BY pi.serial ASC, pi.id ASC`,
        [productRow.id]
    );
    product.images = images.map(i => ({
        id: i.id,
        path: i.img_path,
        serial: i.serial,
        sku_id: i.sku_id ?? null,
        sku_color_id: i.sku_color_id ?? null,
        sku_variant_id: i.sku_variant_id ?? null
    }));

    // ---------- 3. Fetch variations ----------
    const variations = await connection.query(
        `SELECT ps.id, ps.color_id, ps.variant_id, ps.selling_price, ps.discount, ps.discount_type, ps.stock, ps.sku, ps.weight_kg, ps.free_delivery,
                c.name as color_name, c.name_bd as color_name_bd, c.hex as color_hex, c.priority as color_priority,
                v.name as variant_name, v.name_bd as variant_name_bd, v.serial as variant_serial, v.updated_at ,
                a.id as attribute_id, a.name as attribute_name, a.name_bd as attribute_name_bd, a.priority as attribute_priority
         FROM product_skus ps
         LEFT JOIN colors c ON c.id = ps.color_id
         LEFT JOIN variants v ON v.id = ps.variant_id
         LEFT JOIN attributes a ON a.id = v.attribute_id
         WHERE ps.product_id = ? AND ps.status = 1 AND ps.stock > 0
         ORDER BY v.serial ASC, v.updated_at DESC, v.name ASC, c.priority ASC`,
        [productRow.id]
    );

    const colorsMap = new Map();
    const variantsMap = new Map();

    product.variations = variations.map(v => {
        if (v.color_id && !colorsMap.has(v.color_id)) {
            colorsMap.set(v.color_id, {
                id: v.color_id,
                name: v.color_name,
                name_bd: v.color_name_bd,
                hex: v.color_hex,
                priority: v.color_priority
            });
        }

        if (v.variant_id && !variantsMap.has(v.variant_id)) {
            variantsMap.set(v.variant_id, {
                id: v.variant_id,
                name: v.variant_name,
                name_bd: v.variant_name_bd,
                serial: v.variant_serial ?? 1,
                attribute_id: v.attribute_id,
                attribute_name: v.attribute_name,
                attribute_name_bd: v.attribute_name_bd
            });
        }

        return {
            id: v.id,
            color: v.color_id ? {
                id: v.color_id,
                name: v.color_name,
                name_bd: v.color_name_bd,
                hex: v.color_hex,
                priority: v.color_priority
            } : null,
            variant: v.variant_id ? {
                id: v.variant_id,
                name: v.variant_name,
                name_bd: v.variant_name_bd,
                priority: v.variant_serial,
                attribute: v.attribute_id ? {
                    id: v.attribute_id,
                    name: v.attribute_name,
                    name_bd: v.attribute_name_bd,
                    priority: v.attribute_priority
                } : null
            } : null,
            selling_price: Number(v.selling_price),
            discount: Number(v.discount),
            discount_type: v.discount_type,
            final_price: v.discount_type === 1
                ? Number(v.selling_price) * (1 - Number(v.discount) / 100)
                : Number(v.selling_price) - Number(v.discount),
            stock: v.stock,
            sku: v.sku,
            weight_kg: Number(v.weight_kg ?? 0),
            // COALESCE: SKU-level overrides product-level; null means use product default
            free_delivery: v.free_delivery !== null && v.free_delivery !== undefined
                ? !!v.free_delivery
                : !!productRow.free_delivery,
            in_stock: v.stock > 0
        };
    });

    product.available_colors = Array.from(colorsMap.values())
        .sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));

    // Sort variants by serial ASC — reflects drag-and-drop order set in admin
    product.available_variants = Array.from(variantsMap.values())
        .sort((a, b) => (a.serial ?? 1) - (b.serial ?? 1));

 
 // ---------- 4. Related products (meta keywords only) ----------
    if (productRow.meta_keywords?.trim()) {
        const keywords = productRow.meta_keywords
            .split(',')
            .map(k => k.trim())
            .filter(Boolean);

        if (keywords.length) {
            const conditions = keywords.map(() => `p.meta_keywords LIKE ?`).join(' OR ');
            const scoring = keywords.map(() => `IF(p.meta_keywords LIKE ?,1,0)`).join(' + ');
            const params = [
                ...keywords.map(k => `%${k}%`),
                ...keywords.map(k => `%${k}%`),
                productRow.id
            ];

            // 1. Fetch the Related Product Rows
            const related = await connection.query(
                `SELECT 
                    p.id, p.name, p.name_bd, p.slug, p.featured, p.sell_count,
                    COALESCE(p.face_image, (SELECT pi.img_path FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.serial ASC, pi.id ASC LIMIT 1)) AS image,
                    (${scoring}) AS keyword_match_count
                 FROM products p
                 INNER JOIN main_categories mc ON mc.id = p.main_category_id
                 LEFT JOIN sub_categories sc ON sc.id = p.sub_category_id
                 LEFT JOIN child_categories cc ON cc.id = p.child_category_id
                 WHERE (${conditions})
                   AND p.id != ?
                   AND p.status = 1
                   AND mc.status = 1
                   AND (p.sub_category_id IS NULL OR sc.status = 1)
                   AND (p.child_category_id IS NULL OR cc.status = 1)
                 ORDER BY keyword_match_count DESC, p.featured DESC, p.sell_count DESC
                 LIMIT 10`,
                params
            );

            if (related.length > 0) {
                const relatedIds = related.map(r => r.id);

                // 2. Fetch ALL variations for these related products
                const relatedSkus = await connection.query(
                    `SELECT id, product_id, selling_price, discount, discount_type, stock, sku
                     FROM product_skus
                     WHERE product_id IN (?) AND status = 1`,
                    [relatedIds]
                );

                // 3. Fetch Favorites for related products if user is logged in
                let favSet = new Set();
                if (isAuthenticated) {
                    const favs = await connection.query(
                        `SELECT product_id FROM favorites 
                         WHERE user_id = ? AND product_id IN (?)`,
                        [userId, relatedIds]
                    );
                    favSet = new Set(favs.map(f => f.product_id));
                }

                // 4. Map everything together
                product.related_products = related.map(r => {
                    // Filter SKUs belonging to this specific related product
                    const productVariations = relatedSkus
                        .filter(s => s.product_id === r.id)
                        .map(s => {
                            const sellingPrice = Number(s.selling_price);
                            const discount = Number(s.discount);
                            const finalPrice = s.discount_type === 1
                                ? sellingPrice * (1 - discount / 100)
                                : sellingPrice - discount;

                            return {
                                id: s.id,
                                selling_price: sellingPrice,
                                discount: discount,
                                discount_type: s.discount_type,
                                final_price: Number(finalPrice.toFixed(2)),
                                stock: s.stock,
                                sku: s.sku,
                                in_stock: s.stock > 0
                            };
                        });

                    // Calculate min_price for convenience on the frontend
                    const minPrice = productVariations.length > 0 
                        ? Math.min(...productVariations.map(v => v.final_price)) 
                        : 0;

                    return {
                        id: r.id,
                        name: r.name,
                        name_bd: r.name_bd,
                        slug: r.slug,
                        image: r.image,
                        featured: !!r.featured,
                        min_price: minPrice,
                        is_favourite: isAuthenticated ? favSet.has(r.id) : false,
                        keyword_match_count: r.keyword_match_count || 0,
                        variations: productVariations // <--- List of all variations added here
                    };
                });
            }
        }
    }

    // ---------- VIEW COUNT ----------
    if (userIp) {
        try {
            const log = await connection.query(
                `INSERT IGNORE INTO product_view_logs (product_id, ip_address)
                 VALUES (?, INET6_ATON(?))`,
                [productRow.id, userIp]
            );

            if (log?.affectedRows > 0) {
                await connection.query(
                    `UPDATE products SET view_count = view_count + 1 WHERE id = ?`,
                    [productRow.id]
                );
            }
        } catch (e) {}
    }

    return {
        success: true,
        product
    };
});
 

 
 
// exports.getProductsusers = api({
//     query: {
//         search: { type: "string" },
//         main_category_id: { type: "int" },
//         sub_category_id: { type: "int" },
//         child_category_id: { type: "int" },
//         brand_id: { type: "int" },
//         color_id: { type: "int" },
//         variant_id: { type: "int" },
//         featured: { type: "bool" },
//         best_deal: { type: "bool" },
//         free_delivery: { type: "bool" },
//         min_price: { type: "float" },
//         max_price: { type: "float" },
//         in_stock: { type: "bool" },
//         is_favourite: { type: "bool" },
//         limit: { type: "int", default: 20 },
//         offset: { type: "int", default: 0 },
//         sort_by: { type: "string", default: "created_at" },
//         sort_order: { type: "string", default: "DESC" }
//     }
// }, async (req, connection) => {
//     let { limit, offset } = req.typed.query;
//     limit = Math.min(Math.max(limit, 1), 50);
//     offset = Math.max(offset, 0);

//     const q = req.typed.query;
//     const filters = [];
//     const values = [];

//     // ---------- AUTHENTICATION LOGIC ----------
//     let userId = null;
//     let isAuthenticated = false;
//     try {
//         const authHeader = req.headers.authorization;
//         if (authHeader && authHeader.startsWith("Bearer ")) {
//             const token = authHeader.split(" ")[1];
//             const decodedToken = await verifyJwt(token, jwtSecret);
//             if (decodedToken && decodedToken.uid) {
//                 const user = await connection.queryOne(
//                     `SELECT id, status, is_email_verified, token_version FROM users WHERE id = ? AND status = 'active' AND deleted_at IS NULL`,
//                     [decodedToken.uid]
//                 );
//                 if (user && user.is_email_verified && decodedToken.ev === true && decodedToken.tv === user.token_version) {
//                     userId = user.id;
//                     isAuthenticated = true;
//                 }
//             }
//         }
//     } catch (error) { /* Silent fail */ }

//     // ---------- BASE FILTERS ----------
//     filters.push("p.status = 1");
    
//     // CATEGORY STATUS SAFETY HIERARCHY
//     filters.push("mc.status = 1");
//     filters.push("(p.sub_category_id IS NULL OR sc.status = 1)");
//     filters.push("(p.child_category_id IS NULL OR cc.status = 1)");

//     if (q.search) {
//         filters.push("(p.name LIKE ? OR p.slug LIKE ? OR p.short_description LIKE ?)");
//         values.push(`%${q.search}%`, `%${q.search}%`, `%${q.search}%`);
//     }
//     ["main_category_id", "sub_category_id", "child_category_id", "brand_id"].forEach(key => {
//         if (q[key] !== undefined) {
//             filters.push(`p.${key} = ?`);
//             values.push(q[key]);
//         }
//     });
//     ["featured", "best_deal", "free_delivery"].forEach(key => {
//         if (q[key] !== undefined) {
//             filters.push(`p.${key} = ?`);
//             values.push(q[key] ? 1 : 0);
//         }
//     });

//     // ---------- SKU SUBQUERY & ATTRIBUTE FILTERS ----------
//     let skuFilters = ["ps.status = 1"];
//     let skuValues = [];
//     if (q.color_id !== undefined) { skuFilters.push("ps.color_id = ?"); skuValues.push(q.color_id); }
//     if (q.variant_id !== undefined) { skuFilters.push("ps.variant_id = ?"); skuValues.push(q.variant_id); }

//     const skuSubquery = `
//         SELECT 
//             ps.product_id, ps.selling_price, ps.discount, ps.discount_type, ps.stock,
//             ps.color_id, ps.variant_id, v.name as variant_name,
//             (ps.selling_price - 
//              COALESCE(ps.discount * (ps.discount_type = 1) * ps.selling_price / 100, 0) - 
//              COALESCE(ps.discount * (ps.discount_type = 0), 0)) as final_price
//         FROM product_skus ps
//         LEFT JOIN variants v ON ps.variant_id = v.id
//         WHERE ${skuFilters.join(" AND ")}
//     `;

//     // ---------- PRICE & STOCK FILTERS ----------
//     if (q.min_price !== undefined) { filters.push("s.final_price >= ?"); values.push(q.min_price); }
//     if (q.max_price !== undefined) { filters.push("s.final_price <= ?"); values.push(q.max_price); }
//     if (q.in_stock !== undefined) { filters.push(q.in_stock ? "s.stock > 0" : "s.stock = 0"); }

//     if (q.is_favourite !== undefined && isAuthenticated) {
//         const subOp = q.is_favourite ? "IN" : "NOT IN";
//         filters.push(`p.id ${subOp} (SELECT product_id FROM favorites WHERE user_id = ?)`);
//         values.push(userId);
//     }

//     const whereClause = `WHERE ${filters.join(" AND ")}`;

//     // ---------- TOTAL COUNT ----------
//     // Added JOINs to count query to respect category status
//     const countQuery = `
//         SELECT COUNT(DISTINCT p.id) AS total 
//         FROM products p 
//         INNER JOIN main_categories mc ON mc.id = p.main_category_id
//         LEFT JOIN sub_categories sc ON sc.id = p.sub_category_id
//         LEFT JOIN child_categories cc ON cc.id = p.child_category_id
//         INNER JOIN (${skuSubquery}) s ON s.product_id = p.id 
//         ${whereClause}
//     `;
//     const [{ total }] = await connection.query(countQuery, [...skuValues, ...values]);

//     // ---------- SORTING ----------
//     const validSortColumns = ["name", "created_at", "price", "sell_count", "featured"];
//     let sortBy = validSortColumns.includes(q.sort_by) ? q.sort_by : "created_at";
//     let sortOrder = q.sort_order.toUpperCase() === "ASC" ? "ASC" : "DESC";
//     let orderByClause;
//     switch (sortBy) {
//         case "price": orderByClause = `MIN(s.final_price) ${sortOrder}`; break;
//         case "name": orderByClause = `p.name ${sortOrder}`; break;
//         case "sell_count": orderByClause = `p.sell_count ${sortOrder}`; break;
//         case "featured": orderByClause = `p.featured DESC, p.sell_count DESC`; break;
//         default: orderByClause = `p.created_at ${sortOrder}`;
//     }

//     // ---------- FETCH DATA WITH ATTRIBUTES ----------
//     const productQuery = `
//         SELECT DISTINCT 
//             p.id, p.name, p.slug, p.short_description, 
//             p.main_category_id, p.sub_category_id, p.child_category_id, p.brand_id,
//             p.featured, p.best_deal, p.free_delivery, p.sell_count,
//             (SELECT pi.img_path FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.priority ASC LIMIT 1) as thumbnail,
//             MIN(s.selling_price) as min_price,
//             MAX(s.selling_price) as max_price,
//             SUM(s.stock) as total_stock,
//             COUNT(s.product_id) as variation_count,
//             GROUP_CONCAT(DISTINCT s.color_id) as color_ids,
//             GROUP_CONCAT(DISTINCT s.variant_id) as variant_ids,
//             GROUP_CONCAT(DISTINCT s.variant_name SEPARATOR '||') as variant_names
//         FROM products p
//         INNER JOIN main_categories mc ON mc.id = p.main_category_id
//         LEFT JOIN sub_categories sc ON sc.id = p.sub_category_id
//         LEFT JOIN child_categories cc ON cc.id = p.child_category_id
//         INNER JOIN (${skuSubquery}) s ON s.product_id = p.id
//         ${whereClause}
//         GROUP BY p.id
//         ORDER BY ${orderByClause}
//         LIMIT ? OFFSET ?
//     `;

//     const productRows = await connection.query(productQuery, [...skuValues, ...values, limit, offset]);
//     const productIds = productRows.map(p => p.id);

//     let userFavourites = new Set();
//     if (isAuthenticated && productIds.length > 0) {
//         const favourites = await connection.query(`SELECT product_id FROM favorites WHERE user_id = ? AND product_id IN (?)`, [userId, productIds]);
//         userFavourites = new Set(favourites.map(f => f.product_id));
//     }

//     let imagesRows = [], categoriesRows = [], brandsRows = [];
//     if (productIds.length > 0) {
//         imagesRows = await connection.query(`SELECT product_id, id, img_path, priority FROM product_images WHERE product_id IN (?) ORDER BY priority ASC`, [productIds]);
//         const catIds = [...new Set(productRows.flatMap(p => [p.main_category_id, p.sub_category_id, p.child_category_id].filter(id => id)))];
//         if (catIds.length > 0) {
//             categoriesRows = await connection.query(`SELECT id, name FROM main_categories WHERE id IN (?) UNION SELECT id, name FROM sub_categories WHERE id IN (?) UNION SELECT id, name FROM child_categories WHERE id IN (?)`, [catIds, catIds, catIds]);
//         }
//         const brandIds = productRows.map(p => p.brand_id).filter(id => id);
//         if (brandIds.length > 0) brandsRows = await connection.query(`SELECT id, name, img_path FROM brands WHERE id IN (?)`, [brandIds]);
//     }

//     const categoriesMap = new Map(categoriesRows.map(c => [c.id, c.name]));
//     const brandsMap = new Map(brandsRows.map(b => [b.id, { name: b.name, image: b.img_path }]));

//     // ---------- RESPONSE FORMATTING ----------
//     const products = productRows.map(p => {
//         const productImages = imagesRows.filter(img => img.product_id === p.id).slice(0, 3).map(img => ({ id: img.id, path: img.img_path, priority: img.priority }));
        
//         return {
//             id: p.id,
//             name: p.name,
//             slug: p.slug,
//             short_description: p.short_description,
//             is_favourite: isAuthenticated ? userFavourites.has(p.id) : false,
//             main_category: p.main_category_id ? { id: p.main_category_id, name: categoriesMap.get(p.main_category_id) || "" } : null,
//             sub_category: p.sub_category_id ? { id: p.sub_category_id, name: categoriesMap.get(p.sub_category_id) || "" } : null,
//             child_category: p.child_category_id ? { id: p.child_category_id, name: categoriesMap.get(p.child_category_id) || "" } : null,
//             brand: p.brand_id ? { id: p.brand_id, name: brandsMap.get(p.brand_id)?.name || "", image: brandsMap.get(p.brand_id)?.image || "" } : null,
//             thumbnail: p.thumbnail,
//             images: productImages,
//             featured: !!p.featured,
//             best_deal: !!p.best_deal,
//             free_delivery: !!p.free_delivery,
//             sell_count: p.sell_count || 0,
//             price_range: {
//                 min: Number(p.min_price) || 0,
//                 max: Number(p.max_price) || 0,
//                 has_discount: Number(p.min_price) < Number(p.max_price)
//             },
//             stock_info: {
//                 total_stock: p.total_stock || 0,
//                 in_stock: (p.total_stock || 0) > 0,
//                 variation_count: p.variation_count || 0
//             },
//             available_attributes: {
//                 color_ids: p.color_ids ? p.color_ids.split(',').map(Number) : [],
//                 variant_ids: p.variant_ids ? p.variant_ids.split(',').map(Number) : [],
//                 variant_names: p.variant_names ? p.variant_names.split('||') : []
//             }
//         };
//     });

//     return { success: true, total, limit, offset, products };
// });


 
// exports.getProductsusers = api({
//     query: {
//         search: { type: "string" },
//         main_category_id: { type: "int" },
//         sub_category_id: { type: "int" },
//         child_category_id: { type: "int" },
//         brand_id: { type: "string" }, // Changed to string for comma-separated values
//         color_id: { type: "string" }, // Changed to string for comma-separated values
//         variant_id: { type: "string" }, // Changed to string for comma-separated values
//         featured: { type: "bool" },
//         best_deal: { type: "bool" },
//         free_delivery: { type: "bool" },
//         min_price: { type: "float" },
//         max_price: { type: "float" },
//         in_stock: { type: "bool" },
//         is_favourite: { type: "bool" },
//         limit: { type: "int", default: 20 },
//         offset: { type: "int", default: 0 },
//         sort_by: { type: "string", default: "created_at" },
//         sort_order: { type: "string", default: "DESC" }
//     }
// }, async (req, connection) => {
//     let { limit, offset } = req.typed.query;
//     limit = Math.min(Math.max(limit, 1), 50);
//     offset = Math.max(offset, 0);

//     const q = req.typed.query;
//     const filters = [];
//     const values = [];

//     // ---------- AUTHENTICATION LOGIC ----------
//     let userId = null;
//     let isAuthenticated = false;
//     try {
//         const authHeader = req.headers.authorization;
//         if (authHeader && authHeader.startsWith("Bearer ")) {
//             const token = authHeader.split(" ")[1];
//             const decodedToken = await verifyJwt(token, jwtSecret);
//             if (decodedToken && decodedToken.uid) {
//                 const user = await connection.queryOne(
//                     `SELECT id, status, is_email_verified, token_version FROM users WHERE id = ? AND status = 'active' AND deleted_at IS NULL`,
//                     [decodedToken.uid]
//                 );
//                 if (user && user.is_email_verified && decodedToken.ev === true && decodedToken.tv === user.token_version) {
//                     userId = user.id;
//                     isAuthenticated = true;
//                 }
//             }
//         }
//     } catch (error) { /* Silent fail */ }

//     // ---------- BASE FILTERS ----------
//     filters.push("p.status = 1");
    
//     // CATEGORY STATUS SAFETY HIERARCHY
//     filters.push("mc.status = 1");
//     filters.push("(p.sub_category_id IS NULL OR sc.status = 1)");
//     filters.push("(p.child_category_id IS NULL OR cc.status = 1)");

//     if (q.search) {
//         filters.push("(p.name LIKE ? OR p.slug LIKE ? OR p.short_description LIKE ?)");
//         values.push(`%${q.search}%`, `%${q.search}%`, `%${q.search}%`);
//     }

//     // Single ID Filters
//     ["main_category_id", "sub_category_id", "child_category_id"].forEach(key => {
//         if (q[key] !== undefined) {
//             filters.push(`p.${key} = ?`);
//             values.push(q[key]);
//         }
//     });

//     // Multiple ID Filter: Brand
//     if (q.brand_id) {
//         const brandIds = q.brand_id.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
//         if (brandIds.length > 0) {
//             filters.push(`p.brand_id IN (${brandIds.map(() => '?').join(',')})`);
//             values.push(...brandIds);
//         }
//     }

//     ["featured", "best_deal", "free_delivery"].forEach(key => {
//         if (q[key] !== undefined) {
//             filters.push(`p.${key} = ?`);
//             values.push(q[key] ? 1 : 0);
//         }
//     });

//     // ---------- SKU SUBQUERY & ATTRIBUTE FILTERS ----------
//     let skuFilters = ["ps.status = 1"];
//     let skuValues = [];

//     // Multiple ID Filter: Color
//     if (q.color_id) {
//         const colorIds = q.color_id.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
//         if (colorIds.length > 0) {
//             skuFilters.push(`ps.color_id IN (${colorIds.map(() => '?').join(',')})`);
//             skuValues.push(...colorIds);
//         }
//     }

//     // Multiple ID Filter: Variant
//     if (q.variant_id) {
//         const variantIds = q.variant_id.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
//         if (variantIds.length > 0) {
//             skuFilters.push(`ps.variant_id IN (${variantIds.map(() => '?').join(',')})`);
//             skuValues.push(...variantIds);
//         }
//     }

//     const skuSubquery = `
//         SELECT 
//             ps.product_id, ps.selling_price, ps.discount, ps.discount_type, ps.stock,
//             ps.color_id, ps.variant_id, v.name as variant_name,
//             (ps.selling_price - 
//              COALESCE(ps.discount * (ps.discount_type = 1) * ps.selling_price / 100, 0) - 
//              COALESCE(ps.discount * (ps.discount_type = 0), 0)) as final_price
//         FROM product_skus ps
//         LEFT JOIN variants v ON ps.variant_id = v.id
//         WHERE ${skuFilters.join(" AND ")}
//     `;

//     // ---------- PRICE & STOCK FILTERS ----------
//     if (q.min_price !== undefined) { filters.push("s.final_price >= ?"); values.push(q.min_price); }
//     if (q.max_price !== undefined) { filters.push("s.final_price <= ?"); values.push(q.max_price); }
//     if (q.in_stock !== undefined) { filters.push(q.in_stock ? "s.stock > 0" : "s.stock = 0"); }

//     if (q.is_favourite !== undefined && isAuthenticated) {
//         const subOp = q.is_favourite ? "IN" : "NOT IN";
//         filters.push(`p.id ${subOp} (SELECT product_id FROM favorites WHERE user_id = ?)`);
//         values.push(userId);
//     }

//     const whereClause = `WHERE ${filters.join(" AND ")}`;

//     // ---------- TOTAL COUNT ----------
//     const countQuery = `
//         SELECT COUNT(DISTINCT p.id) AS total 
//         FROM products p 
//         INNER JOIN main_categories mc ON mc.id = p.main_category_id
//         LEFT JOIN sub_categories sc ON sc.id = p.sub_category_id
//         LEFT JOIN child_categories cc ON cc.id = p.child_category_id
//         INNER JOIN (${skuSubquery}) s ON s.product_id = p.id 
//         ${whereClause}
//     `;
//     const [{ total }] = await connection.query(countQuery, [...skuValues, ...values]);

//     // ---------- SORTING ----------
//     const validSortColumns = ["name", "created_at", "price", "sell_count", "featured"];
//     let sortBy = validSortColumns.includes(q.sort_by) ? q.sort_by : "created_at";
//     let sortOrder = q.sort_order.toUpperCase() === "ASC" ? "ASC" : "DESC";
//     let orderByClause;
//     switch (sortBy) {
//         case "price": orderByClause = `MIN(s.final_price) ${sortOrder}`; break;
//         case "name": orderByClause = `p.name ${sortOrder}`; break;
//         case "sell_count": orderByClause = `p.sell_count ${sortOrder}`; break;
//         case "featured": orderByClause = `p.featured DESC, p.sell_count DESC`; break;
//         default: orderByClause = `p.created_at ${sortOrder}`;
//     }

//     // ---------- FETCH DATA WITH ATTRIBUTES ----------
//     const productQuery = `
//         SELECT DISTINCT 
//             p.id, p.name, p.slug, p.short_description, 
//             p.main_category_id, p.sub_category_id, p.child_category_id, p.brand_id,
//             p.featured, p.best_deal, p.free_delivery, p.sell_count,
//             (SELECT pi.img_path FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.priority ASC LIMIT 1) as thumbnail,
//             MIN(s.selling_price) as min_price,
//             MAX(s.selling_price) as max_price,
//             SUM(s.stock) as total_stock,
//             COUNT(s.product_id) as variation_count,
//             GROUP_CONCAT(DISTINCT s.color_id) as color_ids,
//             GROUP_CONCAT(DISTINCT s.variant_id) as variant_ids,
//             GROUP_CONCAT(DISTINCT s.variant_name SEPARATOR '||') as variant_names
//         FROM products p
//         INNER JOIN main_categories mc ON mc.id = p.main_category_id
//         LEFT JOIN sub_categories sc ON sc.id = p.sub_category_id
//         LEFT JOIN child_categories cc ON cc.id = p.child_category_id
//         INNER JOIN (${skuSubquery}) s ON s.product_id = p.id
//         ${whereClause}
//         GROUP BY p.id
//         ORDER BY ${orderByClause}
//         LIMIT ? OFFSET ?
//     `;

//     const productRows = await connection.query(productQuery, [...skuValues, ...values, limit, offset]);
//     const productIds = productRows.map(p => p.id);

//     let userFavourites = new Set();
//     if (isAuthenticated && productIds.length > 0) {
//         const favourites = await connection.query(`SELECT product_id FROM favorites WHERE user_id = ? AND product_id IN (?)`, [userId, productIds]);
//         userFavourites = new Set(favourites.map(f => f.product_id));
//     }

//     let imagesRows = [], categoriesRows = [], brandsRows = [];
//     if (productIds.length > 0) {
//         imagesRows = await connection.query(`SELECT product_id, id, img_path, priority FROM product_images WHERE product_id IN (?) ORDER BY priority ASC`, [productIds]);
//         const catIds = [...new Set(productRows.flatMap(p => [p.main_category_id, p.sub_category_id, p.child_category_id].filter(id => id)))];
//         if (catIds.length > 0) {
//             categoriesRows = await connection.query(`SELECT id, name FROM main_categories WHERE id IN (?) UNION SELECT id, name FROM sub_categories WHERE id IN (?) UNION SELECT id, name FROM child_categories WHERE id IN (?)`, [catIds, catIds, catIds]);
//         }
//         const brandIds = productRows.map(p => p.brand_id).filter(id => id);
//         if (brandIds.length > 0) brandsRows = await connection.query(`SELECT id, name, img_path FROM brands WHERE id IN (?)`, [brandIds]);
//     }

//     const categoriesMap = new Map(categoriesRows.map(c => [c.id, c.name]));
//     const brandsMap = new Map(brandsRows.map(b => [b.id, { name: b.name, image: b.img_path }]));

//     // ---------- RESPONSE FORMATTING ----------
//     const products = productRows.map(p => {
//         const productImages = imagesRows.filter(img => img.product_id === p.id).slice(0, 3).map(img => ({ id: img.id, path: img.img_path, priority: img.priority }));
        
//         return {
//             id: p.id,
//             name: p.name,
//             slug: p.slug,
//             short_description: p.short_description,
//             is_favourite: isAuthenticated ? userFavourites.has(p.id) : false,
//             main_category: p.main_category_id ? { id: p.main_category_id, name: categoriesMap.get(p.main_category_id) || "" } : null,
//             sub_category: p.sub_category_id ? { id: p.sub_category_id, name: categoriesMap.get(p.sub_category_id) || "" } : null,
//             child_category: p.child_category_id ? { id: p.child_category_id, name: categoriesMap.get(p.child_category_id) || "" } : null,
//             brand: p.brand_id ? { id: p.brand_id, name: brandsMap.get(p.brand_id)?.name || "", image: brandsMap.get(p.brand_id)?.image || "" } : null,
//             thumbnail: p.thumbnail,
//             images: productImages,
//             featured: !!p.featured,
//             best_deal: !!p.best_deal,
//             free_delivery: !!p.free_delivery,
//             sell_count: p.sell_count || 0,
//             price_range: {
//                 min: Number(p.min_price) || 0,
//                 max: Number(p.max_price) || 0,
//                 has_discount: Number(p.min_price) < Number(p.max_price)
//             },
//             stock_info: {
//                 total_stock: p.total_stock || 0,
//                 in_stock: (p.total_stock || 0) > 0,
//                 variation_count: p.variation_count || 0
//             },
//             available_attributes: {
//                 color_ids: p.color_ids ? p.color_ids.split(',').map(Number) : [],
//                 variant_ids: p.variant_ids ? p.variant_ids.split(',').map(Number) : [],
//                 variant_names: p.variant_names ? p.variant_names.split('||') : []
//             }
//         };
//     });

//     return { success: true, total, limit, offset, products };
// });

 


exports.getProductsusers = api({
    query: {
        search: { type: "string" },
        main_category_id: { type: "int" },
        sub_category_id: { type: "int" },
        child_category_id: { type: "int" },
        brand_id: { type: "string" },
        color_id: { type: "string" },
        variant_id: { type: "string" },
        featured: { type: "bool" },
        best_deal: { type: "bool" },
        free_delivery: { type: "bool" },
        min_price: { type: "float" },
        max_price: { type: "float" },
        in_stock: { type: "bool" },
        is_favourite: { type: "bool" },
        min_rating: { type: "int" },
        limit: { type: "int", default: 20 },
        offset: { type: "int", default: 0 },
        sort_by: { type: "string", default: "created_at" },
        sort_order: { type: "string", default: "DESC" }
    }
}, async (req, connection) => {
    let { limit, offset } = req.typed.query;
    limit = Math.min(Math.max(limit, 1), 50);
    offset = Math.max(offset, 0);

    const q = req.typed.query;
    const filters = [];
    const values = [];

    // ---------- AUTHENTICATION LOGIC ----------
    let userId = null;
    let isAuthenticated = false;
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.split(" ")[1];
            const decodedToken = await verifyJwt(token, jwtSecret);
            if (decodedToken && decodedToken.uid) {
                const user = await connection.queryOne(
                    `SELECT id, status, is_email_verified, token_version FROM users WHERE id = ? AND status = 'active' AND deleted_at IS NULL`,
                    [decodedToken.uid]
                );
                if (user && user.is_email_verified && decodedToken.ev === true && decodedToken.tv === user.token_version) {
                    userId = user.id;
                    isAuthenticated = true;
                }
            }
        }
    } catch (error) { /* Silent fail */ }

    // ---------- BASE FILTERS ----------
    filters.push("p.status = 1");
    filters.push("mc.status = 1");
    filters.push("(p.sub_category_id IS NULL OR sc.status = 1)");
    filters.push("(p.child_category_id IS NULL OR cc.status = 1)");

    if (q.search) {
        filters.push("(CONVERT(p.name USING utf8mb4) COLLATE utf8mb4_unicode_ci LIKE ? OR p.name_bd COLLATE utf8mb4_unicode_ci LIKE ? OR p.slug LIKE ? OR p.short_description LIKE ?)");
        values.push(`%${q.search}%`, `%${q.search}%`, `%${q.search}%`, `%${q.search}%`);
    }

    ["main_category_id", "sub_category_id", "child_category_id"].forEach(key => {
        if (q[key] !== undefined) {
            filters.push(`p.${key} = ?`);
            values.push(q[key]);
        }
    });

    if (q.brand_id) {
        const brandIds = q.brand_id.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
        if (brandIds.length > 0) {
            filters.push(`p.brand_id IN (${brandIds.map(() => '?').join(',')})`);
            values.push(...brandIds);
        }
    }

    ["featured", "best_deal", "free_delivery"].forEach(key => {
        if (q[key] !== undefined) {
            filters.push(`p.${key} = ?`);
            values.push(q[key] ? 1 : 0);
        }
    });

    // ---------- SKU SUBQUERY & ATTRIBUTE FILTERS ----------
    let skuFilters = ["ps.status = 1"];
    let skuValues = [];

    if (q.color_id) {
        const colorIds = q.color_id.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
        if (colorIds.length > 0) {
            skuFilters.push(`ps.color_id IN (${colorIds.map(() => '?').join(',')})`);
            skuValues.push(...colorIds);
        }
    }

    if (q.variant_id) {
        const variantIds = q.variant_id.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
        if (variantIds.length > 0) {
            skuFilters.push(`ps.variant_id IN (${variantIds.map(() => '?').join(',')})`);
            skuValues.push(...variantIds);
        }
    }

    const skuSubquery = `
        SELECT 
            ps.id, ps.product_id, ps.sku, ps.selling_price, ps.discount, ps.discount_type, ps.stock,
            ps.color_id, c.name as color_name, c.name_bd as color_name_bd, c.hex as color_hex,
            ps.variant_id, v.name as variant_name, v.name_bd as variant_name_bd, v.serial as variant_serial, v.updated_at as variant_updated_at,
            (ps.discount > 0) as sku_has_discount,
            (ps.selling_price - 
             COALESCE(ps.discount * (ps.discount_type = 1) * ps.selling_price / 100, 0) - 
             COALESCE(ps.discount * (ps.discount_type = 0), 0)) as final_price
        FROM product_skus ps
        LEFT JOIN colors c ON ps.color_id = c.id
        LEFT JOIN variants v ON ps.variant_id = v.id
        WHERE ${skuFilters.join(" AND ")}
    `;

    // ---------- PRICE & STOCK FILTERS ----------
    if (q.min_price !== undefined) { filters.push("s.final_price >= ?"); values.push(q.min_price); }
    if (q.max_price !== undefined) { filters.push("s.final_price <= ?"); values.push(q.max_price); }
    if (q.in_stock !== undefined) { filters.push(q.in_stock ? "s.stock > 0" : "s.stock = 0"); }

    if (q.is_favourite !== undefined && isAuthenticated) {
        const subOp = q.is_favourite ? "IN" : "NOT IN";
        filters.push(`p.id ${subOp} (SELECT product_id FROM favorites WHERE user_id = ?)`);
        values.push(userId);
    }

    // Star rating filter (V2-042)
    if (q.min_rating !== undefined && q.min_rating >= 1 && q.min_rating <= 5) {
        filters.push('p.avg_rating >= ?');
        values.push(q.min_rating);
    }

    const whereClause = `WHERE ${filters.join(" AND ")}`;

    // ---------- TOTAL COUNT ----------
    const countQuery = `
        SELECT COUNT(DISTINCT p.id) AS total 
        FROM products p 
        INNER JOIN main_categories mc ON mc.id = p.main_category_id
        LEFT JOIN sub_categories sc ON sc.id = p.sub_category_id
        LEFT JOIN child_categories cc ON cc.id = p.child_category_id
        INNER JOIN (${skuSubquery}) s ON s.product_id = p.id 
        ${whereClause}
    `;
    const [{ total }] = await connection.query(countQuery, [...skuValues, ...values]);

    // ---------- SORTING ----------
    const validSortColumns = ["name", "created_at", "price", "sell_count", "featured"];
    let sortBy = validSortColumns.includes(q.sort_by) ? q.sort_by : "created_at";
    let sortOrder = q.sort_order.toUpperCase() === "ASC" ? "ASC" : "DESC";
    let orderByClause;
    switch (sortBy) {
        case "price": orderByClause = `MIN(s.final_price) ${sortOrder}`; break;
        case "name": orderByClause = `p.name ${sortOrder}`; break;
        case "sell_count": orderByClause = `p.sell_count ${sortOrder}`; break;
        case "featured": orderByClause = `p.featured DESC, p.sell_count DESC`; break;
        default: orderByClause = `p.created_at ${sortOrder}`;
    }

    // ---------- FETCH DATA ----------
    const productQuery = `
        SELECT DISTINCT 
            p.id, p.name, p.name_bd, p.slug, p.short_description, 
            p.main_category_id, p.sub_category_id, p.child_category_id, p.brand_id,
            p.featured, p.best_deal, p.free_delivery, p.sell_count,
            p.avg_rating, p.review_count,
            COALESCE(p.face_image, (SELECT pi.img_path FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.serial ASC, pi.id ASC LIMIT 1)) as thumbnail,
            MIN(s.final_price) as min_final_price,
            MAX(s.final_price) as max_final_price,
            MAX(s.sku_has_discount) as product_has_discount,
            SUM(s.stock) as total_stock,
            COUNT(s.product_id) as variation_count,
            GROUP_CONCAT(DISTINCT s.color_id) as color_ids,
            GROUP_CONCAT(
                DISTINCT s.variant_id
                ORDER BY s.variant_serial ASC, s.variant_updated_at DESC, s.variant_name ASC
            ) as variant_ids,
            GROUP_CONCAT(
                DISTINCT s.variant_name
                ORDER BY s.variant_serial ASC, s.variant_updated_at DESC, s.variant_name ASC
                SEPARATOR '||'
            ) as variant_names,
            GROUP_CONCAT(
                DISTINCT s.variant_name_bd
                ORDER BY s.variant_serial ASC, s.variant_updated_at DESC, s.variant_name ASC
                SEPARATOR '||'
            ) as variant_names_bd
        FROM products p
        INNER JOIN main_categories mc ON mc.id = p.main_category_id
        LEFT JOIN sub_categories sc ON sc.id = p.sub_category_id
        LEFT JOIN child_categories cc ON cc.id = p.child_category_id
        INNER JOIN (${skuSubquery}) s ON s.product_id = p.id
        ${whereClause}
        GROUP BY p.id
        ORDER BY ${orderByClause}
        LIMIT ? OFFSET ?
    `;

    const productRows = await connection.query(productQuery, [...skuValues, ...values, limit, offset]);
    const productIds = productRows.map(p => p.id);

    // ---------- BATCH FETCH RELATED DATA ----------
    let variationsRows = [], imagesRows = [], categoriesRows = [], brandsRows = [], userFavourites = new Set();
    
    if (productIds.length > 0) {
        variationsRows = await connection.query(skuSubquery + ` AND ps.product_id IN (${productIds.map(() => '?').join(',')})`, [...skuValues, ...productIds]);
        
        /* Corrected batch fetch sorting */
        imagesRows = await connection.query(
            `SELECT product_id, id, img_path, serial FROM product_images WHERE product_id IN (?) ORDER BY serial ASC, id ASC`, 
            [productIds]
        );
        
        const catIds = [...new Set(productRows.flatMap(p => [p.main_category_id, p.sub_category_id, p.child_category_id].filter(id => id)))];
        if (catIds.length > 0) {
            categoriesRows = await connection.query(`SELECT id, name, name_bd FROM main_categories WHERE id IN (?) UNION SELECT id, name, name_bd FROM sub_categories WHERE id IN (?) UNION SELECT id, name, name_bd FROM child_categories WHERE id IN (?)`, [catIds, catIds, catIds]);
        }
        
        const brandIds = [...new Set(productRows.map(p => p.brand_id).filter(id => id))];
        if (brandIds.length > 0) brandsRows = await connection.query(`SELECT id, name,  img_path FROM brands WHERE id IN (?)`, [brandIds]);

        if (isAuthenticated) {
            const favourites = await connection.query(`SELECT product_id FROM favorites WHERE user_id = ? AND product_id IN (?)`, [userId, productIds]);
            userFavourites = new Set(favourites.map(f => f.product_id));
        }
    }

    const categoriesMap = new Map(categoriesRows.map(c => [c.id, { name: c.name, name_bd: c.name_bd }]));
    const brandsMap = new Map(brandsRows.map(b => [b.id, { name: b.name, image: b.img_path }]));

    // ---------- RESPONSE FORMATTING ----------
    const products = productRows.map(p => {
        // Keep consistent sorting here as well
        const productImages = imagesRows
            .filter(img => img.product_id === p.id)
            .slice(0, 5) // Increased to 5 in case you want more than 3 gallery images
            .map(img => ({ id: img.id, path: img.img_path, priority: img.priority }));
        
        const productVariations = variationsRows.filter(v => v.product_id === p.id).map(v => ({
            id: v.id,
            sku: v.sku,
            stock: v.stock,
            selling_price: Number(v.selling_price),
            final_price: Number(v.final_price),
            discount: Number(v.discount),
            discount_type: v.discount_type,
            has_discount: v.discount > 0,
            color: v.color_id ? { id: v.color_id, name: v.color_name, name_bd: v.color_name_bd, hex: v.color_hex } : null,
            variant: v.variant_id ? { id: v.variant_id, name: v.variant_name, name_bd: v.variant_name_bd } : null
        }));

        return {
            id: p.id,
            name: p.name,
            name_bd: p.name_bd,
            slug: p.slug,
            short_description: p.short_description,
            is_favourite: isAuthenticated ? userFavourites.has(p.id) : false,
            main_category: p.main_category_id ? { id: p.main_category_id, name: categoriesMap.get(p.main_category_id)?.name || "", name_bd: categoriesMap.get(p.main_category_id)?.name_bd ?? null } : null,
            sub_category: p.sub_category_id ? { id: p.sub_category_id, name: categoriesMap.get(p.sub_category_id)?.name || "", name_bd: categoriesMap.get(p.sub_category_id)?.name_bd ?? null } : null,
            child_category: p.child_category_id ? { id: p.child_category_id, name: categoriesMap.get(p.child_category_id)?.name || "", name_bd: categoriesMap.get(p.child_category_id)?.name_bd ?? null } : null,
            brand: p.brand_id ? { id: p.brand_id, name: brandsMap.get(p.brand_id)?.name || "", image: brandsMap.get(p.brand_id)?.image || "" } : null,
            thumbnail: p.thumbnail,
            images: productImages,
            featured: !!p.featured,
            best_deal: !!p.best_deal,
            free_delivery: !!p.free_delivery,
            sell_count: p.sell_count || 0,
            avg_rating: Number(p.avg_rating) || 0,
            review_count: p.review_count || 0,
            price_range: {
                min: Number(p.min_final_price) || 0,
                max: Number(p.max_final_price) || 0,
                has_discount: !!p.product_has_discount 
            },
            stock_info: {
                total_stock: p.total_stock || 0,
                in_stock: (p.total_stock || 0) > 0,
                variation_count: p.variation_count || 0
            },
            available_attributes: {
                color_ids: p.color_ids ? p.color_ids.split(',').map(Number) : [],
                variant_ids: p.variant_ids ? p.variant_ids.split(',').map(Number) : [],
                variant_names: p.variant_names ? p.variant_names.split('||') : [],
                variant_names_bd: p.variant_names_bd ? p.variant_names_bd.split('||') : []
            },
            variations: productVariations
        };
    });

    return { success: true, total, limit, offset, products };
});


exports.deleteProduct = api({
    params: {
        id: { type: "int", required: true }
    }
}, auth(async (req, connection, adminInfo) => {

    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"];
    if (!adminInfo.roles.some(role => ALLOWED_ROLES.includes(role))) throw new errors.UNAUTHORIZED();

    const productId = req.typed.params.id;

    // ---------- FETCH PRODUCT ----------
    const product = await connection.queryOne(
        `SELECT id, name FROM products WHERE id = ?`,
        [productId]
    );

    if (!product) throw new errors.NOT_FOUND("Product not found.");

    // ---------- FETCH IMAGES ----------
    const images = await connection.query(
        `SELECT img_path FROM product_images WHERE product_id = ?`,
        [productId]
    );

    // ---------- START TRANSACTION ----------

    // ---------- DELETE VARIATIONS ----------
    await connection.query(
        `DELETE FROM product_skus WHERE product_id = ?`,
        [productId]
    );

    // ---------- DELETE IMAGES FROM DB & DISK ----------
    for (const img of images) {
        await connection.query(
            `DELETE FROM product_images WHERE product_id = ? AND img_path = ?`,
            [productId, img.img_path]
        );

        // delete from disk
        deleteFileIfExists(img.img_path);
    }

    // ---------- DELETE PRODUCT ----------
    await connection.query(
        `DELETE FROM products WHERE id = ?`,
        [productId]
    );

    // ---------- AUDIT LOG ----------
    await connection.query(
        `INSERT INTO admin_audit_logs
            (admin_id, action, resource, resource_id, meta)
            VALUES (?, 'DELETE_PRODUCT', 'product', ?, ?)`,
        [adminInfo.id, productId, JSON.stringify({ name: product.name })]
    );

    return { success: true };


}));




// ---------- CREATE PRODUCT VARIATION ----------
exports.createProductVariation = api(
  {
    body: {
      product_id: { type: "int", required: true },
      color_id: { type: "int", required: true },
      variant_id: { type: "int", required: true },

      buying_price: { type: "float", default: 0 },
      selling_price: { type: "float", required: true },

      discount: { type: "float", default: 0 },

      // ✅ NEW
      discount_type: {
        type: "int",
        default: 0 // 0 = flat, 1 = percentage
      },

      stock: { type: "int", default: 0 },
      sku: { type: "string", required: false },
      weight_kg: { type: "float", default: 0 }
    }
  },
  auth(async (req, connection, adminInfo) => {

    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
      throw new errors.UNAUTHORIZED();
    }

    const v = req.typed.body;

    // ---------- DISCOUNT VALIDATION ----------
    if (![0, 1].includes(v.discount_type)) {
      throw new errors.INVALID_FIELDS_PROVIDED(
        "discount_type must be 0 (flat) or 1 (percentage)."
      );
    }

    if (v.discount < 0) {
      throw new errors.INVALID_FIELDS_PROVIDED(
        "Discount cannot be negative."
      );
    }

    if (v.discount_type === 1 && v.discount > 100) {
      throw new errors.INVALID_FIELDS_PROVIDED(
        "Percentage discount cannot exceed 100%."
      );
    }

    // ---------- PARALLEL EXISTENCE CHECKS ----------
    const [
      dbColor,
      dbVariant,
      product
    ] = await Promise.all([
      connection.queryOne(
        "SELECT id FROM colors WHERE id = ?",
        [v.color_id]
      ),
      connection.queryOne(
        "SELECT id FROM variants WHERE id = ?",
        [v.variant_id]
      ),
      connection.queryOne(
        "SELECT id FROM products WHERE id = ?",
        [v.product_id]
      )
    ]);

    if (!product) throw new errors.NOT_FOUND("Product not found.");
    if (!dbColor) throw new errors.NOT_FOUND("Color not found.");
    if (!dbVariant) throw new errors.NOT_FOUND("Variant not found.");

    // ---------- SKU GENERATION ----------
    const sku = v.sku || `SKU-${v.product_id}-${v.color_id}-${v.variant_id}`;

    if (sku.length > 100) {
      throw new errors.INVALID_FIELDS_PROVIDED(
        "SKU cannot exceed 100 characters."
      );
    }

    // ---------- DUPLICATE SKU CHECK ----------
    const existingSku = await connection.queryOne(
      "SELECT id FROM product_skus WHERE sku = ?",
      [sku]
    );
    if (existingSku) {
      throw new errors.ALREADY_EXIST(`Duplicate SKU: ${sku}`);
    }

    // ---------- INSERT VARIATION ----------
    const result = await connection.query(
      `
      INSERT INTO product_skus (
        product_id,
        color_id,
        variant_id,
        buying_price,
        selling_price,
        discount,
        discount_type,
        stock,
        sku,
        weight_kg,
        free_delivery
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        v.product_id,
        v.color_id,
        v.variant_id,
        v.buying_price,
        v.selling_price,
        v.discount,
        v.discount_type,
        v.stock,
        sku,
        v.weight_kg,
        v.free_delivery !== undefined ? v.free_delivery : null
      ]
    );

    // ---------- AUDIT LOG ----------
    await connection.query(
      `
      INSERT INTO admin_audit_logs
      (admin_id, action, resource, resource_id, meta)
      VALUES (?, 'CREATE_PRODUCT_VARIATION', 'product_skus', ?, ?)
      `,
      [adminInfo.id, result.insertId, JSON.stringify({ sku })]
    );

    return { success: true, skuId: result.insertId };
  })
);

// ---------- EDIT PRODUCT VARIATION ----------
exports.editProductVariation = api(
  {
    params: { id: { type: "int", required: true } },
    body: {
      buying_price: { type: "float", required: false },
      selling_price: { type: "float", required: false },
      discount: { type: "float", required: false },
      discount_type: {
        type: "int",
        required: false // 0 = flat, 1 = percentage
      },
      stock: { type: "int", required: false },
      sku: { type: "string", required: false },
      weight_kg: { type: "float", required: false },
      free_delivery: { type: "bool", required: false } // null clears override (inherit from product)
    }
  },
  auth(async (req, connection, adminInfo) => {

    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
      throw new errors.UNAUTHORIZED();
    }

    const { id } = req.typed.params;
    const data = Object.fromEntries(
      Object.entries(req.typed.body).filter(([, v]) => v !== undefined)
    );

    // ---------- EXISTENCE CHECK ----------
    const skuRow = await connection.queryOne(
      "SELECT id, sku, discount, discount_type FROM product_skus WHERE id = ?",
      [id]
    );
    if (!skuRow) throw new errors.NOT_FOUND("SKU not found.");

    // ---------- DISCOUNT TYPE VALIDATION ----------
    if (
      data.discount_type !== undefined &&
      ![0, 1].includes(data.discount_type)
    ) {
      throw new errors.INVALID_FIELDS_PROVIDED(
        "discount_type must be 0 (flat) or 1 (percentage)."
      );
    }

    // ---------- DISCOUNT VALIDATION ----------
    const finalDiscountType =
      data.discount_type !== undefined
        ? data.discount_type
        : skuRow.discount_type;

    const finalDiscount =
      data.discount !== undefined
        ? data.discount
        : skuRow.discount;

    if (finalDiscount < 0) {
      throw new errors.INVALID_FIELDS_PROVIDED(
        "Discount cannot be negative."
      );
    }

    if (finalDiscountType === 1 && finalDiscount > 100) {
      throw new errors.INVALID_FIELDS_PROVIDED(
        "Percentage discount cannot exceed 100%."
      );
    }

    // ---------- SKU VALIDATION ----------
    if (data.sku && data.sku.length > 100) {
      throw new errors.INVALID_FIELDS_PROVIDED(
        "SKU cannot exceed 100 characters."
      );
    }

    // ---------- DUPLICATE SKU CHECK ----------
    if (data.sku && data.sku !== skuRow.sku) {
      const duplicate = await connection.queryOne(
        "SELECT id FROM product_skus WHERE sku = ? AND id != ?",
        [data.sku, id]
      );
      if (duplicate) {
        throw new errors.ALREADY_EXIST(`Duplicate SKU: ${data.sku}`);
      }
    }

    // ---------- CLEAN EMPTY UPDATE ----------
    if (Object.keys(data).length === 0) {
      throw new errors.PARAMETER_MISSING("No fields provided for update.");
    }

    // ---------- UPDATE ----------
    await connection.query(
      "UPDATE product_skus SET ? WHERE id = ?",
      [data, id]
    );

    // ---------- AUDIT LOG ----------
    await connection.query(
      `
      INSERT INTO admin_audit_logs
      (admin_id, action, resource, resource_id, meta)
      VALUES (?, 'EDIT_PRODUCT_VARIATION', 'product_skus', ?, ?)
      `,
      [adminInfo.id, id, JSON.stringify({ updated_fields: Object.keys(data) })]
    );

    return { success: true };
  })
);


// ---------- DELETE PRODUCT VARIATION ----------
exports.deleteProductVariation = api(
    {
        params: { id: { type: "int", required: true } }
    },
    auth(async (req, connection, adminInfo) => {

        const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"];
        if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
            throw new errors.UNAUTHORIZED();
        }

        const { id } = req.typed.params;

        const sku = await connection.queryOne(
            "SELECT id, sku FROM product_skus WHERE id = ?",
            [id]
        );
        if (!sku) throw new errors.NOT_FOUND("SKU not found.");

        await connection.query(
            "DELETE FROM product_skus WHERE id = ?",
            [id]
        );

        // ---------- AUDIT LOG ----------
        await connection.query(
            `INSERT INTO admin_audit_logs
            (admin_id, action, resource, resource_id, meta)
            VALUES (?, 'DELETE_PRODUCT_VARIATION', 'product_skus', ?, ?)`,
            [adminInfo.id, id, JSON.stringify({ sku: sku.sku })]
        );

        return { success: true };
    })
);

// exports.getProductVariations = api(
//     {
//         params: { product_id: { type: "int", required: true } }
//     },
//     auth(async (req, connection, adminInfo) => {
//         const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"];
//         if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
//             throw new errors.UNAUTHORIZED();
//         }

//         // Fetch variations with all related details
//         const variations = await connection.query(
//             `SELECT 
//                 ps.*,
//                 c.name as color_name,
//                 c.hex as color_hex,
//                 c.priority as color_priority,
//                 c.status as color_status,
//                 v.name as variant_name,
//                 v.serial as variant_serial,
//                 v.status as variant_status,
//                 a.id as attribute_id,
//                 a.name as attribute_name,
//                 a.priority as attribute_priority,
//                 a.status as attribute_status
//              FROM product_skus ps
//              LEFT JOIN colors c ON c.id = ps.color_id
//              LEFT JOIN variants v ON v.id = ps.variant_id
//              LEFT JOIN attributes a ON a.id = v.attribute_id
//              WHERE ps.product_id = ?
//              ORDER BY ps.id DESC, c.priority ASC, v.priority ASC`,
//             [req.typed.params.product_id]
//         );

//         // Calculate final price for each variation
//         const formattedVariations = variations.map(v => {
//             const finalPrice = v.discount_type === 1
//                 ? Number(v.selling_price) * (1 - Number(v.discount) / 100)
//                 : Number(v.selling_price) - Number(v.discount);

//             return {
//                 id: v.id,
//                 product_id: v.product_id,
//                 color_id: v.color_id,
//                 variant_id: v.variant_id,
//                 buying_price: Number(v.buying_price),
//                 selling_price: Number(v.selling_price),
//                 discount: Number(v.discount),
//                 discount_type: v.discount_type,
//                 final_price: finalPrice,
//                 stock: v.stock,
//                 sku: v.sku,
//                 status: !!v.status,
//                 color: v.color_id ? {
//                     id: v.color_id,
//                     name: v.color_name,
//                     hex: v.color_hex,
//                     priority: v.color_priority,
//                     status: !!v.color_status
//                 } : null,
//                 variant: v.variant_id ? {
//                     id: v.variant_id,
//                     name: v.variant_name,
//                     priority: v.variant_priority,
//                     status: !!v.variant_status,
//                     attribute: v.attribute_id ? {
//                         id: v.attribute_id,
//                         name: v.attribute_name,
//                         priority: v.attribute_priority,
//                         status: !!v.attribute_status
//                     } : null
//                 } : null,
//                 in_stock: v.stock > 0
//                 // Removed created_at and updated_at since they don't exist in product_skus
//             };
//         });

//         // Get product details for context
//         const product = await connection.queryOne(
//             `SELECT id, name, slug, status, created_at, updated_at 
//              FROM products 
//              WHERE id = ?`,
//             [req.typed.params.product_id]
//         );

//         // Get available colors and variants for this product
//         const availableColors = await connection.query(
//             `SELECT DISTINCT 
//                 c.id, c.name, c.hex, c.priority, c.status
//              FROM product_skus ps
//              JOIN colors c ON c.id = ps.color_id
//              WHERE ps.product_id = ?
//              ORDER BY c.priority ASC`,
//             [req.typed.params.product_id]
//         );

//         const availableVariants = await connection.query(
//             `SELECT DISTINCT 
//                 v.id, v.name, v.priority, v.status,
//                 a.id as attribute_id, a.name as attribute_name, 
//                 a.priority as attribute_priority, a.status as attribute_status
//              FROM product_skus ps
//              JOIN variants v ON v.id = ps.variant_id
//              LEFT JOIN attributes a ON a.id = v.attribute_id
//              WHERE ps.product_id = ?
//              ORDER BY v.priority ASC`,
//             [req.typed.params.product_id]
//         );

//         // Calculate summary statistics
//         const summary = {
//             total_variations: formattedVariations.length,
//             active_variations: formattedVariations.filter(v => v.status).length,
//             in_stock_variations: formattedVariations.filter(v => v.in_stock).length,
//             out_of_stock_variations: formattedVariations.filter(v => !v.in_stock).length,
//             total_stock: formattedVariations.reduce((sum, v) => sum + v.stock, 0),
//             min_price: formattedVariations.length > 0 ? 
//                 Math.min(...formattedVariations.map(v => v.final_price)) : 0,
//             max_price: formattedVariations.length > 0 ? 
//                 Math.max(...formattedVariations.map(v => v.final_price)) : 0,
//             total_buying_value: formattedVariations.reduce((sum, v) => sum + (v.buying_price * v.stock), 0),
//             total_selling_value: formattedVariations.reduce((sum, v) => sum + (v.final_price * v.stock), 0)
//         };

//         return { 
//             product: product ? {
//                 id: product.id,
//                 name: product.name,
//                 slug: product.slug,
//                 status: !!product.status,
//                 created_at: product.created_at,
//                 updated_at: product.updated_at
//             } : null,
//             variations: formattedVariations,
//             available_options: {
//                 colors: availableColors.map(c => ({
//                     id: c.id,
//                     name: c.name,
//                     hex: c.hex,
//                     priority: c.priority,
//                     status: !!c.status
//                 })),
//                 variants: availableVariants.map(v => ({
//                     id: v.id,
//                     name: v.name,
//                     priority: v.priority,
//                     status: !!v.status,
//                     attribute: v.attribute_id ? {
//                         id: v.attribute_id,
//                         name: v.attribute_name,
//                         priority: v.attribute_priority,
//                         status: !!v.attribute_status
//                     } : null
//                 }))
//             },
//             summary,
//             count: formattedVariations.length
//         };
//     })
// );

exports.getProductVariations = api(
    {
        params: { product_id: { type: "int", required: true } }
    },
    auth(async (req, connection, adminInfo) => {
        const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"];
        if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
            throw new errors.UNAUTHORIZED();
        }

        const productId = req.typed.params.product_id;

        // ---------- 1. Strict Product & Category Hierarchy Check ----------
        const product = await connection.queryOne(
            `SELECT 
                p.id, p.name,p.name_bd, p.slug, p.status, p.created_at, p.updated_at,
                p.main_category_id, p.sub_category_id, p.child_category_id,
                mc.status as main_cat_status,
                sc.status as sub_cat_status,
                cc.status as child_cat_status
             FROM products p
             INNER JOIN main_categories mc ON mc.id = p.main_category_id
             LEFT JOIN sub_categories sc ON sc.id = p.sub_category_id
             LEFT JOIN child_categories cc ON cc.id = p.child_category_id
             WHERE p.id = ?`,
            [productId]
        );

        if (!product) throw new errors.NOT_FOUND("Product not found.");

        // Check if any category in the chain is inactive
        const isHierarchyActive = 
            product.main_cat_status === 1 && 
            (product.sub_category_id === null || product.sub_cat_status === 1) &&
            (product.child_category_id === null || product.child_cat_status === 1);

        // STRICT ENFORCEMENT: If category is inactive, do not return variations
        if (!isHierarchyActive) {
            throw new errors.NOT_FOUND("Product not found.");
        }

        // ---------- 2. Fetch variations (only reaches here if categories are active) ----------
        const variations = await connection.query(
            `SELECT 
                ps.*,
                c.name as color_name,
                c.name_bd as color_name_bd,
                c.hex as color_hex,
                c.priority as color_priority,
                c.status as color_status,
                v.name as variant_name,
                v.name_bd as variant_name_bd,
                v.serial as variant_serial,
                v.status as variant_status,
                a.id as attribute_id,
                a.name as attribute_name,
                a.name_bd as attribute_name_bd,
                a.priority as attribute_priority,
                a.status as attribute_status
             FROM product_skus ps
             LEFT JOIN colors c ON c.id = ps.color_id
             LEFT JOIN variants v ON v.id = ps.variant_id
             LEFT JOIN attributes a ON a.id = v.attribute_id
             WHERE ps.product_id = ?
             ORDER BY c.priority ASC, v.serial ASC, v.updated_at DESC, v.name ASC, ps.id DESC`,
            [productId]
        );

        const formattedVariations = variations.map(v => {
            const finalPrice = v.discount_type === 1
                ? Number(v.selling_price) * (1 - Number(v.discount) / 100)
                : Number(v.selling_price) - Number(v.discount);

            return {
                id: v.id,
                product_id: v.product_id,
                color_id: v.color_id,
                variant_id: v.variant_id,
                buying_price: Number(v.buying_price),
                selling_price: Number(v.selling_price),
                discount: Number(v.discount),
                discount_type: v.discount_type,
                final_price: finalPrice,
                stock: v.stock,
                sku: v.sku,
                weight_kg: Number(v.weight_kg ?? 0),
                status: !!v.status,
                color: v.color_id ? {
                    id: v.color_id,
                    name: v.color_name,
                    name_bd: v.color_name_bd,
                    hex: v.color_hex,
                    priority: v.color_priority,
                    status: !!v.color_status
                } : null,
                variant: v.variant_id ? {
                    id: v.variant_id,
                    name: v.variant_name,
                    name_bd: v.variant_name_bd,
                    serial: v.variant_serial,
                    status: !!v.variant_status,
                    attribute: v.attribute_id ? {
                        id: v.attribute_id,
                        name: v.attribute_name,
                        name_bd: v.attribute_name_bd,
                        priority: v.attribute_priority,
                        status: !!v.attribute_status
                    } : null
                } : null,
                in_stock: v.stock > 0
            };
        });

        // ---------- 3. Fetch Options & Stats ----------
        const availableColors = await connection.query(
            `SELECT DISTINCT c.id, c.name, c.name_bd, c.hex, c.priority, c.status
             FROM product_skus ps JOIN colors c ON c.id = ps.color_id
             WHERE ps.product_id = ? ORDER BY c.priority ASC`, [productId]
        );

        const availableVariants = await connection.query(
            `SELECT DISTINCT v.id, v.name, v.name_bd, v.serial, v.status, v.updated_at,
                a.id as attribute_id, a.name as attribute_name, a.name_bd as attribute_name_bd, a.status as attribute_status
             FROM product_skus ps JOIN variants v ON v.id = ps.variant_id
             LEFT JOIN attributes a ON a.id = v.attribute_id
             WHERE ps.product_id = ? ORDER BY v.serial ASC, v.updated_at DESC, v.name ASC`, [productId]
        );

        const summary = {
            total_variations: formattedVariations.length,
            active_variations: formattedVariations.filter(v => v.status).length,
            in_stock_variations: formattedVariations.filter(v => v.in_stock).length,
            out_of_stock_variations: formattedVariations.filter(v => !v.in_stock).length,
            total_stock: formattedVariations.reduce((sum, v) => sum + v.stock, 0),
            min_price: formattedVariations.length > 0 ? Math.min(...formattedVariations.map(v => v.final_price)) : 0,
            max_price: formattedVariations.length > 0 ? Math.max(...formattedVariations.map(v => v.final_price)) : 0,
            total_buying_value: formattedVariations.reduce((sum, v) => sum + (v.buying_price * v.stock), 0),
            total_selling_value: formattedVariations.reduce((sum, v) => sum + (v.final_price * v.stock), 0)
        };

        return { 
            product: {
                id: product.id,
                name: product.name,
                name_bd: product.name_bd,
                slug: product.slug,
                status: !!product.status,
                category_status_ok: true, // It must be true if we got here
                created_at: product.created_at,
                updated_at: product.updated_at
            },
            variations: formattedVariations,
            available_options: {
                colors: availableColors.map(c => ({ ...c, name_bd: c.name_bd, status: !!c.status })),
                variants: availableVariants.map(v => ({ ...v, name_bd: v.name_bd, attribute_name_bd: v.attribute_name_bd, status: !!v.status, attribute: v.attribute_id ? { id: v.attribute_id, name: v.attribute_name, name_bd: v.attribute_name_bd, status: !!v.attribute_status } : null }))
            },
            summary,
            count: formattedVariations.length
        };
    })
);

// exports.getProductVariationById = api(
//     {
//         params: { id: { type: "int", required: true } }
//     },
//     auth(async (req, connection, adminInfo) => {
//         // Fetch variation with all related details
//         const variation = await connection.queryOne(
//             `SELECT 
//                 ps.*,
//                 p.name as product_name,
//                 p.slug as product_slug,
//                 p.status as product_status,
//                 p.main_category_id,
//                 p.sub_category_id,
//                 p.child_category_id,
//                 p.brand_id,
//                 p.created_at as product_created_at,
//                 p.updated_at as product_updated_at,
//                 c.name as color_name,
//                 c.hex as color_hex,
//                 c.priority as color_priority,
//                 c.status as color_status,
//                 v.name as variant_name,
//                 v.serial as variant_serial,
//                 v.status as variant_status,
//                 a.id as attribute_id,
//                 a.name as attribute_name,
//                 a.priority as attribute_priority,
//                 a.status as attribute_status
//              FROM product_skus ps
//              JOIN products p ON p.id = ps.product_id
//              LEFT JOIN colors c ON c.id = ps.color_id
//              LEFT JOIN variants v ON v.id = ps.variant_id
//              LEFT JOIN attributes a ON a.id = v.attribute_id
//              WHERE ps.id = ?`,
//             [req.typed.params.id]
//         );

//         if (!variation) {
//             throw new errors.NOT_FOUND("SKU not found.");
//         }

//         // Calculate final price
//         const finalPrice = variation.discount_type === 1
//             ? Number(variation.selling_price) * (1 - Number(variation.discount) / 100)
//             : Number(variation.selling_price) - Number(variation.discount);

//         // Get product images
//         const images = await connection.query(
//             `SELECT id, img_path, priority 
//              FROM product_images 
//              WHERE product_id = ? 
//              ORDER BY priority ASC, id ASC`,
//             [variation.product_id]
//         );

//         // Get product categories and brand
//         let categories = {};
//         let brand = null;

//         if (variation.main_category_id) {
//             const mainCat = await connection.queryOne(
//                 "SELECT id, name FROM main_categories WHERE id = ?",
//                 [variation.main_category_id]
//             );
//             categories.main_category = mainCat;
//         }

//         if (variation.sub_category_id) {
//             const subCat = await connection.queryOne(
//                 "SELECT id, name FROM sub_categories WHERE id = ?",
//                 [variation.sub_category_id]
//             );
//             categories.sub_category = subCat;
//         }

//         if (variation.child_category_id) {
//             const childCat = await connection.queryOne(
//                 "SELECT id, name FROM child_categories WHERE id = ?",
//                 [variation.child_category_id]
//             );
//             categories.child_category = childCat;
//         }

//         if (variation.brand_id) {
//             brand = await connection.queryOne(
//                 "SELECT id, name, img_path FROM brands WHERE id = ?",
//                 [variation.brand_id]
//             );
//         }

//         return {
//             variation: {
//                 id: variation.id,
//                 product: {
//                     id: variation.product_id,
//                     name: variation.product_name,
//                     slug: variation.product_slug,
//                     status: !!variation.product_status,
//                     created_at: variation.product_created_at,
//                     updated_at: variation.product_updated_at,
//                     categories,
//                     brand: brand ? {
//                         id: brand.id,
//                         name: brand.name,
//                         image: brand.img_path
//                     } : null
//                 },
//                 color: variation.color_id ? {
//                     id: variation.color_id,
//                     name: variation.color_name,
//                     hex: variation.color_hex,
//                     priority: variation.color_priority,
//                     status: !!variation.color_status
//                 } : null,
//                 variant: variation.variant_id ? {
//                     id: variation.variant_id,
//                     name: variation.variant_name,
//                     priority: variation.variant_priority,
//                     status: !!variation.variant_status,
//                     attribute: variation.attribute_id ? {
//                         id: variation.attribute_id,
//                         name: variation.attribute_name,
//                         priority: variation.attribute_priority,
//                         status: !!variation.attribute_status
//                     } : null
//                 } : null,
//                 pricing: {
//                     buying_price: Number(variation.buying_price),
//                     selling_price: Number(variation.selling_price),
//                     discount: Number(variation.discount),
//                     discount_type: variation.discount_type,
//                     final_price: finalPrice,
//                     profit_margin: Number(variation.selling_price) - Number(variation.buying_price),
//                     profit_percentage: Number(variation.buying_price) > 0 ? 
//                         ((Number(variation.selling_price) - Number(variation.buying_price)) / Number(variation.buying_price)) * 100 : 0
//                 },
//                 inventory: {
//                     stock: variation.stock,
//                     sku: variation.sku,
//                     status: !!variation.status,
//                     in_stock: variation.stock > 0,
//                     low_stock: variation.stock <= 10 && variation.stock > 0,
//                     out_of_stock: variation.stock === 0
//                 }
//             },
//             images: images.map(img => ({
//                 id: img.id,
//                 path: img.img_path,
//                 priority: img.priority
//             }))
//         };
//     })
// );
 


exports.getProductVariationById = api(
    {
        params: { id: { type: "int", required: true } }
    },
    auth(async (req, connection, adminInfo) => {
        // ---------- 1. Fetch variation with product and category statuses ----------
        // We join categories directly to check statuses in one go
        const variation = await connection.queryOne(
            `SELECT 
                ps.*,
                p.name as product_name,
                p.name_bd as product_name_bd,
                p.slug as product_slug,
                p.status as product_status,
                p.main_category_id,
                p.sub_category_id,
                p.child_category_id,
                p.brand_id,
                p.created_at as product_created_at,
                p.updated_at as product_updated_at,
                /* Category Statuses */
                mc.name as mc_name, mc.name_bd as mc_name_bd, mc.status as mc_status,
                sc.name as sc_name, sc.name_bd as sc_name_bd, sc.status as sc_status,
                cc.name as cc_name, cc.name_bd as cc_name_bd, cc.status as cc_status,
                /* Attribute/Color info */
                c.name as color_name, c.name_bd as color_name_bd,
                c.hex as color_hex,
                c.priority as color_priority,
                c.status as color_status,
                v.name as variant_name, v.name_bd as variant_name_bd,
                v.serial as variant_serial,
                v.status as variant_status,
                a.id as attribute_id,
                a.name as attribute_name, a.name_bd as attribute_name_bd,
                a.priority as attribute_priority,
                a.status as attribute_status
             FROM product_skus ps
             JOIN products p ON p.id = ps.product_id
             INNER JOIN main_categories mc ON mc.id = p.main_category_id
             LEFT JOIN sub_categories sc ON sc.id = p.sub_category_id
             LEFT JOIN child_categories cc ON cc.id = p.child_category_id
             LEFT JOIN colors c ON c.id = ps.color_id
             LEFT JOIN variants v ON v.id = ps.variant_id
             LEFT JOIN attributes a ON a.id = v.attribute_id
             WHERE ps.id = ?`,
            [req.typed.params.id]
        );

        if (!variation) {
            throw new errors.NOT_FOUND("Product variation not found.");
        }

        // ---------- 2. Hierarchy Status Enforcement ----------
        const isHierarchyActive = 
            variation.mc_status === 1 && 
            (variation.sub_category_id === null || variation.sc_status === 1) &&
            (variation.child_category_id === null || variation.cc_status === 1);

        if (!isHierarchyActive) {
            throw new errors.NOT_FOUND("Product variation not found.");
        }

        // Calculate final price
        const finalPrice = variation.discount_type === 1
            ? Number(variation.selling_price) * (1 - Number(variation.discount) / 100)
            : Number(variation.selling_price) - Number(variation.discount);

        // Get product images
        const images = await connection.query(
            `SELECT id, img_path, serial 
             FROM product_images 
             WHERE product_id = ? 
             ORDER BY serial ASC, id ASC`,
            [variation.product_id]
        );

        // Build categories object from existing joined data
        const categories = {
            main_category: { id: variation.main_category_id, name: variation.mc_name, name_bd: variation.mc_name_bd },
            sub_category: variation.sub_category_id ? { id: variation.sub_category_id, name: variation.sc_name, name_bd: variation.sc_name_bd } : null,
            child_category: variation.child_category_id ? { id: variation.child_category_id, name: variation.cc_name, name_bd: variation.cc_name_bd } : null
        };

        // Get brand separately if exists
        let brand = null;
        if (variation.brand_id) {
            brand = await connection.queryOne(
                "SELECT id, name, img_path FROM brands WHERE id = ?",
                [variation.brand_id]
            );
        }

        return {
            variation: {
                id: variation.id,
                product: {
                    id: variation.product_id,
                    name: variation.product_name,
                    name_bd: variation.product_name_bd,
                    slug: variation.product_slug,
                    status: !!variation.product_status,
                    created_at: variation.product_created_at,
                    updated_at: variation.product_updated_at,
                    categories,
                    brand: brand ? {
                        id: brand.id,
                        name: brand.name,
                        image: brand.img_path
                    } : null
                },
                color: variation.color_id ? {
                    id: variation.color_id,
                    name: variation.color_name,
                    name_bd: variation.color_name_bd,
                    hex: variation.color_hex,
                    priority: variation.color_priority,
                    status: !!variation.color_status
                } : null,
                variant: variation.variant_id ? {
                    id: variation.variant_id,
                    name: variation.variant_name,
                    name_bd: variation.variant_name_bd,
                    serial: variation.variant_serial,
                    status: !!variation.variant_status,
                    attribute: variation.attribute_id ? {
                        id: variation.attribute_id,
                        name: variation.attribute_name,
                        name_bd: variation.attribute_name_bd,
                        priority: variation.attribute_priority,
                        status: !!variation.attribute_status
                    } : null
                } : null,
                pricing: {
                    buying_price: Number(variation.buying_price),
                    selling_price: Number(variation.selling_price),
                    discount: Number(variation.discount),
                    discount_type: variation.discount_type,
                    final_price: finalPrice,
                    profit_margin: Number(variation.selling_price) - Number(variation.buying_price),
                    profit_percentage: Number(variation.buying_price) > 0 ? 
                        ((Number(variation.selling_price) - Number(variation.buying_price)) / Number(variation.buying_price)) * 100 : 0
                },
                inventory: {
                    stock: variation.stock,
                    sku: variation.sku,
                    status: !!variation.status,
                    in_stock: variation.stock > 0,
                    low_stock: variation.stock <= 10 && variation.stock > 0,
                    out_of_stock: variation.stock === 0
                }
            },
            images: images.map(img => ({
                id: img.id,
                path: img.img_path,
                priority: img.priority
            }))
        };
    })
);


// exports.getProductVariationsUser = api(
//     {
//         params: { product_id: { type: "int", required: true } }
//     },
//     async (req, connection) => {
//         // First, check if product exists and is active
//         const product = await connection.queryOne(
//             "SELECT id, status FROM products WHERE id = ?",
//             [req.typed.params.product_id]
//         );

//         if (!product) {
//             throw new errors.NOT_FOUND("Product not found.");
//         }

//         if (!product.status) {
//             throw new errors.NOT_FOUND("Product is not available.");
//         }

//         // Fetch active variations with related data
//         const variations = await connection.query(
//             `SELECT 
//                 ps.id,
//                 ps.product_id,
//                 ps.color_id,
//                 ps.variant_id,
//                 ps.selling_price,
//                 ps.discount,
//                 ps.discount_type,
//                 ps.stock,
//                 ps.sku,
//                 ps.status,
//                 c.name as color_name,
//                 c.hex as color_hex,
//                 c.priority as color_priority,
//                 v.name as variant_name,
//                 v.serial as variant_serial,
//                 a.name as attribute_name,
//                 a.priority as attribute_priority
//              FROM product_skus ps
//              LEFT JOIN colors c ON c.id = ps.color_id
//              LEFT JOIN variants v ON v.id = ps.variant_id
//              LEFT JOIN attributes a ON a.id = v.attribute_id
//              WHERE ps.product_id = ? 
//                AND ps.status = 1 
//                AND ps.stock > 0
//              ORDER BY c.priority ASC, v.priority ASC`,
//             [req.typed.params.product_id]
//         );

//         // Format variations for user response
//         const formattedVariations = variations.map(v => {
//             const finalPrice = v.discount_type === 1
//                 ? Number(v.selling_price) * (1 - Number(v.discount) / 100)
//                 : Number(v.selling_price) - Number(v.discount);

//             return {
//                 id: v.id,
//                 product_id: v.product_id,
//                 color: v.color_id ? {
//                     id: v.color_id,
//                     name: v.color_name,
//                     hex: v.color_hex,
//                     priority: v.color_priority
//                 } : null,
//                 variant: v.variant_id ? {
//                     id: v.variant_id,
//                     name: v.variant_name,
//                     priority: v.variant_priority,
//                     attribute: v.attribute_name ? {
//                         name: v.attribute_name,
//                         priority: v.attribute_priority
//                     } : null
//                 } : null,
//                 price: {
//                     selling: Number(v.selling_price),
//                     discount: Number(v.discount),
//                     discount_type: v.discount_type,
//                     final: finalPrice,
//                     has_discount: Number(v.discount) > 0
//                 },
//                 stock: v.stock,
//                 sku: v.sku,
//                 in_stock: v.stock > 0,
//                 available_quantity: Math.min(v.stock, 10) // Max 10 items can be added to cart at once
//             };
//         });

//         // Get available colors and variants for filtering
//         const availableColors = [];
//         const availableVariants = [];
//         const colorsSet = new Set();
//         const variantsSet = new Set();

//         variations.forEach(v => {
//             if (v.color_id && !colorsSet.has(v.color_id)) {
//                 colorsSet.add(v.color_id);
//                 availableColors.push({
//                     id: v.color_id,
//                     name: v.color_name,
//                     hex: v.color_hex,
//                     priority: v.color_priority
//                 });
//             }

//             if (v.variant_id && !variantsSet.has(v.variant_id)) {
//                 variantsSet.add(v.variant_id);
//                 availableVariants.push({
//                     id: v.variant_id,
//                     name: v.variant_name,
//                     attribute: v.attribute_name ? {
//                         name: v.attribute_name,
//                         priority: v.attribute_priority
//                     } : null
//                 });
//             }
//         });

//         // Sort by priority
//         availableColors.sort((a, b) => a.priority - b.priority);
//         availableVariants.sort((a, b) => 
//             (a.attribute?.priority || 0) - (b.attribute?.priority || 0) || 
//             a.name.localeCompare(b.name)
//         );

//         return { 
//             success: true,
//             product_id: req.typed.params.product_id,
//             variations: formattedVariations,
//             filters: {
//                 colors: availableColors,
//                 variants: availableVariants
//             },
//             summary: {
//                 total_variations: formattedVariations.length,
//                 min_price: formattedVariations.length > 0 ? 
//                     Math.min(...formattedVariations.map(v => v.price.final)) : 0,
//                 max_price: formattedVariations.length > 0 ? 
//                     Math.max(...formattedVariations.map(v => v.price.final)) : 0,
//                 total_stock: formattedVariations.reduce((sum, v) => sum + v.stock, 0),
//                 has_variations: formattedVariations.length > 0
//             }
//         };
//     }
// );

exports.getProductVariationsUser = api(
    {
        params: { product_id: { type: "int", required: true } }
    },
    async (req, connection) => {
        const productId = req.typed.params.product_id;

        // ---------- 1. Check Product & Category Hierarchy Status ----------
        // We join categories to ensure the entire chain is active (status = 1)
        const product = await connection.queryOne(
            `SELECT 
                p.id, p.status,
                mc.status as main_cat_status,
                sc.status as sub_cat_status,
                cc.status as child_cat_status,
                p.sub_category_id,
                p.child_category_id
             FROM products p
             INNER JOIN main_categories mc ON mc.id = p.main_category_id
             LEFT JOIN sub_categories sc ON sc.id = p.sub_category_id
             LEFT JOIN child_categories cc ON cc.id = p.child_category_id
             WHERE p.id = ?`,
            [productId]
        );

        if (!product) {
            throw new errors.NOT_FOUND("Product not found.");
        }

        // Validate the hierarchy: Main must be active, Sub/Child must be active IF they exist
        const isHierarchyActive = 
            product.main_cat_status === 1 && 
            (product.sub_category_id === null || product.sub_cat_status === 1) &&
            (product.child_category_id === null || product.child_cat_status === 1);

        if (!product.status || !isHierarchyActive) {
            throw new errors.NOT_FOUND("Product not found.");
        }

        // ---------- 2. Fetch active variations with related data ----------
        const variations = await connection.query(
            `SELECT 
                ps.id,
                ps.product_id,
                ps.color_id,
                ps.variant_id,
                ps.selling_price,
                ps.discount,
                ps.discount_type,
                ps.stock,
                ps.sku,
                ps.status,
                ps.weight_kg,
                c.name as color_name,
                c.name_bd as color_name_bd,
                c.hex as color_hex,
                c.priority as color_priority,
                v.name as variant_name,
                v.name_bd as variant_name_bd,
                v.serial as variant_serial,
                a.name as attribute_name,
                a.name_bd as attribute_name_bd,
                a.priority as attribute_priority
             FROM product_skus ps
             LEFT JOIN colors c ON c.id = ps.color_id
             LEFT JOIN variants v ON v.id = ps.variant_id
             LEFT JOIN attributes a ON a.id = v.attribute_id
             WHERE ps.product_id = ? 
               AND ps.status = 1 
               AND ps.stock > 0
             ORDER BY c.priority ASC, v.serial ASC, v.updated_at DESC, v.name ASC`,
            [productId]
        );

        // Format variations for user response
        const formattedVariations = variations.map(v => {
            const finalPrice = v.discount_type === 1
                ? Number(v.selling_price) * (1 - Number(v.discount) / 100)
                : Number(v.selling_price) - Number(v.discount);

            return {
                id: v.id,
                product_id: v.product_id,
                color: v.color_id ? {
                    id: v.color_id,
                    name: v.color_name,
                    name_bd: v.color_name_bd,
                    hex: v.color_hex,
                    priority: v.color_priority
                } : null,
                variant: v.variant_id ? {
                    id: v.variant_id,
                    name: v.variant_name,
                    name_bd: v.variant_name_bd,
                    priority: v.variant_serial,
                    attribute: v.attribute_name ? {
                        name: v.attribute_name,
                        name_bd: v.attribute_name_bd,
                        priority: v.attribute_priority
                    } : null
                } : null,
                price: {
                    selling: Number(v.selling_price),
                    discount: Number(v.discount),
                    discount_type: v.discount_type,
                    final: finalPrice,
                    has_discount: Number(v.discount) > 0
                },
                stock: v.stock,
                sku: v.sku,
                weight_kg: Number(v.weight_kg ?? 0),
                in_stock: v.stock > 0,
                available_quantity: Math.min(v.stock, 10) 
            };
        });

        // Get available colors and variants for filtering
        const availableColors = [];
        const availableVariants = [];
        const colorsSet = new Set();
        const variantsSet = new Set();

        variations.forEach(v => {
            if (v.color_id && !colorsSet.has(v.color_id)) {
                colorsSet.add(v.color_id);
                availableColors.push({
                    id: v.color_id,
                    name: v.color_name,
                    name_bd: v.color_name_bd,
                    hex: v.color_hex,
                    priority: v.color_priority
                });
            }

            if (v.variant_id && !variantsSet.has(v.variant_id)) {
                variantsSet.add(v.variant_id);
                availableVariants.push({
                    id: v.variant_id,
                    name: v.variant_name,
                    name_bd: v.variant_name_bd,
                    serial: v.variant_serial ?? 1,
                    attribute: v.attribute_name ? {
                        name: v.attribute_name,
                        name_bd: v.attribute_name_bd
                    } : null
                });
            }
        });

        // Sort colors by priority, variants by serial (drag-and-drop order)
        availableColors.sort((a, b) => a.priority - b.priority);
        availableVariants.sort((a, b) => (a.serial ?? 1) - (b.serial ?? 1));

        return { 
            success: true,
            product_id: productId,
            variations: formattedVariations,
            filters: {
                colors: availableColors,
                variants: availableVariants
            },
            summary: {
                total_variations: formattedVariations.length,
                min_price: formattedVariations.length > 0 ? 
                    Math.min(...formattedVariations.map(v => v.price.final)) : 0,
                max_price: formattedVariations.length > 0 ? 
                    Math.max(...formattedVariations.map(v => v.price.final)) : 0,
                total_stock: formattedVariations.reduce((sum, v) => sum + v.stock, 0),
                has_variations: formattedVariations.length > 0
            }
        };
    }
);

// exports.getProductVariationByIdUser = api(
//     {
//         params: { id: { type: "int", required: true } }
//     },
//     async (req, connection) => {
//         // Fetch variation with product and related data
//         const variation = await connection.queryOne(
//             `SELECT 
//                 ps.*,
//                 p.name as product_name,
//                 p.slug as product_slug,
//                 p.status as product_status,
//                 p.free_delivery,
//                 c.name as color_name,
//                 c.hex as color_hex,
//                 v.name as variant_name,
//                 a.name as attribute_name
//              FROM product_skus ps
//              JOIN products p ON p.id = ps.product_id
//              LEFT JOIN colors c ON c.id = ps.color_id
//              LEFT JOIN variants v ON v.id = ps.variant_id
//              LEFT JOIN attributes a ON a.id = v.attribute_id
//              WHERE ps.id = ? AND ps.status = 1`,
//             [req.typed.params.id]
//         );

//         if (!variation) {
//             throw new errors.NOT_FOUND("Product variation not found.");
//         }

//         if (!variation.product_status) {
//             throw new errors.NOT_FOUND("Product is not available.");
//         }

//         // Calculate final price
//         const finalPrice = variation.discount_type === 1
//             ? Number(variation.selling_price) * (1 - Number(variation.discount) / 100)
//             : Number(variation.selling_price) - Number(variation.discount);

//         // Get product images
//         const images = await connection.query(
//             `SELECT id, img_path, priority 
//              FROM product_images 
//              WHERE product_id = ? 
//              ORDER BY priority ASC, id ASC`,
//             [variation.product_id]
//         );

//         return {
//             success: true,
//             variation: {
//                 id: variation.id,
//                 product: {
//                     id: variation.product_id,
//                     name: variation.product_name,
//                     slug: variation.product_slug,
//                     free_delivery: !!variation.free_delivery
//                 },
//                 color: variation.color_id ? {
//                     id: variation.color_id,
//                     name: variation.color_name,
//                     hex: variation.color_hex
//                 } : null,
//                 variant: variation.variant_id ? {
//                     id: variation.variant_id,
//                     name: variation.variant_name,
//                     attribute: variation.attribute_name ? {
//                         name: variation.attribute_name
//                     } : null
//                 } : null,
//                 price: {
//                     selling: Number(variation.selling_price),
//                     discount: Number(variation.discount),
//                     discount_type: variation.discount_type,
//                     final: finalPrice,
//                     has_discount: Number(variation.discount) > 0
//                 },
//                 stock: variation.stock,
//                 sku: variation.sku,
//                 in_stock: variation.stock > 0,
//                 available_quantity: Math.min(variation.stock, 10)
//             },
//             images: images.map(img => ({
//                 id: img.id,
//                 path: img.img_path,
//                 priority: img.priority
//             }))
//         };
//     }
// );

 


exports.getProductVariationByIdUser = api(
    {
        params: { id: { type: "int", required: true } }
    },
    async (req, connection) => {
        // ---------- 1. Fetch variation with resilient Category Joins ----------
        const variation = await connection.queryOne(
            `SELECT 
                ps.*,
                p.name as product_name,
                p.name_bd as product_name_bd,
                p.slug as product_slug,
                p.status as product_status,
                p.free_delivery,
                p.main_category_id,
                p.sub_category_id,
                p.child_category_id,
                /* Category Statuses - Use COALESCE to treat missing categories as 'Active' so they don't block */
                COALESCE(mc.status, 1) as main_cat_status,
                COALESCE(sc.status, 1) as sub_cat_status,
                COALESCE(cc.status, 1) as child_cat_status,
                c.name as color_name,
                c.name_bd as color_name_bd,
                c.hex as color_hex,
                v.name as variant_name,
                v.name_bd as variant_name_bd,
                a.name as attribute_name,
                a.name_bd as attribute_name_bd
             FROM product_skus ps
             JOIN products p ON p.id = ps.product_id
             LEFT JOIN main_categories mc ON mc.id = p.main_category_id
             LEFT JOIN sub_categories sc ON sc.id = p.sub_category_id
             LEFT JOIN child_categories cc ON cc.id = p.child_category_id
             LEFT JOIN colors c ON c.id = ps.color_id
             LEFT JOIN variants v ON v.id = ps.variant_id
             LEFT JOIN attributes a ON a.id = v.attribute_id
             WHERE ps.id = ? AND ps.status = 1`,
            [req.typed.params.id]
        );

        if (!variation) {
            throw new errors.NOT_FOUND("Product variation not found.");
        }

        // ---------- 2. Logic Check ----------
        // If a category exists but its status is 0, we block it.
        const isHierarchyActive = 
            variation.main_cat_status === 1 && 
            variation.sub_cat_status === 1 && 
            variation.child_cat_status === 1;

        if (!variation.product_status || !isHierarchyActive) {
            throw new errors.NOT_FOUND("Product variation not found.");
        }

        // ---------- 3. Pricing & Images ----------
        const finalPrice = variation.discount_type === 1
            ? Number(variation.selling_price) * (1 - Number(variation.discount) / 100)
            : Number(variation.selling_price) - Number(variation.discount);

        const images = await connection.query(
            `SELECT pi.id, pi.img_path, pi.serial, pi.sku_id,
                    ps.color_id AS sku_color_id, ps.variant_id AS sku_variant_id
             FROM product_images pi
             LEFT JOIN product_skus ps ON ps.id = pi.sku_id
             WHERE pi.product_id = ? ORDER BY pi.serial ASC, pi.id ASC`,
            [variation.product_id]
        );

        return {
            success: true,
            variation: {
                id: variation.id,
                product: {
                    id: variation.product_id,
                    name: variation.product_name,
                    name_bd: variation.product_name_bd,
                    slug: variation.product_slug,
                    free_delivery: !!variation.free_delivery
                },
                color: variation.color_id ? { id: variation.color_id, name: variation.color_name, name_bd: variation.color_name_bd, hex: variation.color_hex } : null,
                variant: variation.variant_id ? { id: variation.variant_id, name: variation.variant_name, name_bd: variation.variant_name_bd, attribute: variation.attribute_name ? { name: variation.attribute_name, name_bd: variation.attribute_name_bd } : null } : null,
                price: {
                    selling: Number(variation.selling_price),
                    discount: Number(variation.discount),
                    discount_type: variation.discount_type,
                    final: finalPrice,
                    has_discount: Number(variation.discount) > 0
                },
                stock: variation.stock,
                sku: variation.sku,
                in_stock: variation.stock > 0,
                available_quantity: Math.min(variation.stock, 10)
            },
            images: images.map(img => ({ id: img.id, path: img.img_path, serial: img.serial }))
        };
    }
);
// favoriteController.js

// API: Add product to favorites
exports.addToFavorites = api(
  {
    params: {
      product_id: { type: "int", required: true }
    }
  },
  userAuth(async (req, connection, userInfo) => {
    const productId = req.typed.params.product_id;
    const userId = userInfo.id;

    // 1️⃣ Validate product exists and is active
    const product = await connection.queryOne(
      `SELECT p.id, p.name, p.name_bd, p.status, p.slug
       FROM products p
       WHERE p.id = ? AND p.status = 1`,
      [productId]
    );

    if (!product) {
      throw new errors.NOT_FOUND("Product not found or inactive");
    }

    // 2️⃣ Check if already in favorites
    const existingFavorite = await connection.queryOne(
      `SELECT id FROM favorites 
       WHERE user_id = ? AND product_id = ?`,
      [userId, productId]
    );

    if (existingFavorite) {
      throw new errors.BAD_REQUEST("Product is already in your favorites");
    }

    // 3️⃣ Add to favorites
    const favoriteResult = await connection.query(
      `INSERT INTO favorites (user_id, product_id, created_at)
       VALUES (?, ?, NOW())`,
      [userId, productId]
    );

    const favoriteId = favoriteResult.insertId;

    // 4️⃣ Log user activity
    await connection.query(
      `INSERT INTO user_audit_logs (
        user_id,
        action,
        ip_address,
        new_values,
        created_at
      ) VALUES (?, 'ADD_TO_FAVORITES', ?, ?, NOW())`,
      [
        userId,
        req.ip || null,
        JSON.stringify({
          favorite_id: favoriteId,
          product_id: productId,
          product_name: product.name
        })
      ]
    );

    // 5️⃣ Get updated favorite count
    const favoriteCount = await connection.queryOne(
      `SELECT COUNT(*) as count FROM favorites WHERE user_id = ?`,
      [userId]
    );

    return {
      success: true,
      message: "Product added to favorites",
      data: {
        favorite_id: favoriteId,
        product: {
          id: product.id,
          name: product.name,
          name_bd: product.name_bd,
          slug: product.slug
        },
        favorites_count: favoriteCount.count
      }
    };
  })
);

// API: Toggle favorite status
exports.toggleFavorite = api(
  {
    params: {
      product_id: { type: "int", required: true }
    }
  },
  userAuth(async (req, connection, userInfo) => {
    const productId = req.typed.params.product_id;
    const userId = userInfo.id;

    // 1️⃣ Validate product exists and is active
    const product = await connection.queryOne(
      `SELECT p.id, p.name, p.name_bd, p.status
       FROM products p
       WHERE p.id = ? AND p.status = 1`,
      [productId]
    );

    if (!product) {
      throw new errors.NOT_FOUND("Product not found or inactive");
    }

    // 2️⃣ Check current favorite status
    const existingFavorite = await connection.queryOne(
      `SELECT id, created_at 
       FROM favorites 
       WHERE user_id = ? AND product_id = ?`,
      [userId, productId]
    );

    let action = '';
    let favoriteId = null;

    // 3️⃣ Toggle favorite status
    if (existingFavorite) {
      // Remove from favorites
      await connection.query(
        `DELETE FROM favorites WHERE id = ?`,
        [existingFavorite.id]
      );
      action = 'removed';
      
      // Log removal
      await connection.query(
        `INSERT INTO user_audit_logs (
          user_id,
          action,
          ip_address,
          old_values,
          created_at
        ) VALUES (?, 'REMOVE_FROM_FAVORITES', ?, ?, NOW())`,
        [
          userId,
          req.ip || null,
          JSON.stringify({
            favorite_id: existingFavorite.id,
            product_id: productId,
            product_name: product.name
          })
        ]
      );
    } else {
      // Add to favorites
      const favoriteResult = await connection.query(
        `INSERT INTO favorites (user_id, product_id, created_at)
         VALUES (?, ?, NOW())`,
        [userId, productId]
      );
      favoriteId = favoriteResult.insertId;
      action = 'added';
      
      // Log addition
      await connection.query(
        `INSERT INTO user_audit_logs (
          user_id,
          action,
          ip_address,
          new_values,
          created_at
        ) VALUES (?, 'ADD_TO_FAVORITES', ?, ?, NOW())`,
        [
          userId,
          req.ip || null,
          JSON.stringify({
            favorite_id: favoriteId,
            product_id: productId,
            product_name: product.name
          })
        ]
      );
    }

    // 4️⃣ Get updated favorite count
    const favoriteCount = await connection.queryOne(
      `SELECT COUNT(*) as count FROM favorites WHERE user_id = ?`,
      [userId]
    );

    return {
      success: true,
      message: `Product ${action} ${action === 'added' ? 'to' : 'from'} favorites`,
      data: {
        action: action,
        is_favorite: action === 'added',
        favorite_id: favoriteId,
        product: {
          id: product.id,
          name: product.name,
          name_bd: product.name_bd
        },
        favorites_count: favoriteCount.count
      }
    };
  })
);

// // API: Remove product from favorites
// exports.removeFromFavorites = api(
//   {
//     params: {
//       product_id: { type: "int", required: true }
//     }
//   },
//   userAuth(async (req, connection, userInfo) => {
//     const productId = req.typed.params.product_id;
//     const userId = userInfo.id;

//     // 1️⃣ Check if product is in favorites
//     const favorite = await connection.queryOne(
//       `SELECT f.id, p.name 
//        FROM favorites f
//        JOIN products p ON p.id = f.product_id
//        WHERE f.user_id = ? AND f.product_id = ?`,
//       [userId, productId]
//     );

//     if (!favorite) {
//       throw new errors.NOT_FOUND("Product not found in your favorites");
//     }

//     // 2️⃣ Remove from favorites
//     await connection.query(
//       `DELETE FROM favorites WHERE id = ?`,
//       [favorite.id]
//     );

//     // 3️⃣ Log user activity
//     await connection.query(
//       `INSERT INTO user_audit_logs (
//         user_id,
//         action,
//         ip_address,
//         old_values,
//         created_at
//       ) VALUES (?, 'REMOVE_FROM_FAVORITES', ?, ?, NOW())`,
//       [
//         userId,
//         req.ip || null,
//         JSON.stringify({
//           favorite_id: favorite.id,
//           product_id: productId,
//           product_name: favorite.name
//         })
//       ]
//     );

//     // 4️⃣ Get updated favorite count
//     const favoriteCount = await connection.queryOne(
//       `SELECT COUNT(*) as count FROM favorites WHERE user_id = ?`,
//       [userId]
//     );

//     return {
//       success: true,
//       message: "Product removed from favorites",
//       data: {
//         removed: true,
//         product_id: productId,
//         favorites_count: favoriteCount.count
//       }
//     };
//   })
// );

// // API: Get user's favorite products
// exports.getFavorites = api(
//   {
//     query: {
//       page: { type: "int", required: false, default: 1, min: 1 },
//       limit: { type: "int", required: false, default: 20, min: 1, max: 100 },
//       sort_by: { 
//         type: "string", 
//         required: false, 
//         default: "added_date",
//         enum: ["added_date", "product_name", "price_low", "price_high"]
//       },
//       sort_order: { 
//         type: "string", 
//         required: false, 
//         default: "desc",
//         enum: ["asc", "desc"]
//       }
//     }
//   },
//   userAuth(async (req, connection, userInfo) => {
//     const { page, limit, sort_by, sort_order } = req.typed.query;
//     const userId = userInfo.id;
//     const offset = (page - 1) * limit;

//     // Build sort clause
//     let sortClause = 'f.created_at DESC'; // default
//     switch (sort_by) {
//       case 'product_name':
//         sortClause = `p.name ${sort_order.toUpperCase()}`;
//         break;
//       case 'price_low':
//         sortClause = 'min_price ASC';
//         break;
//       case 'price_high':
//         sortClause = 'min_price DESC';
//         break;
//       case 'added_date':
//       default:
//         sortClause = `f.created_at ${sort_order.toUpperCase()}`;
//         break;
//     }

//     // 1️⃣ Get favorite products with details
//     const favorites = await connection.query(
//       `SELECT 
//         f.id as favorite_id,
//         f.created_at as added_at,
//         p.id,
//         p.name,
//         p.slug,
//         p.short_description,
//         p.featured,
//         p.free_delivery,
//         p.best_deal,
//         p.view_count,
//         p.sell_count,
        
//         -- Get primary image
//         (
//           SELECT pi.img_path 
//           FROM product_images pi 
//           WHERE pi.product_id = p.id 
//           ORDER BY pi.priority ASC, pi.id ASC 
//           LIMIT 1
//         ) as primary_image,
        
//         -- Get brand info
//         b.name as brand_name,
//         b.img_path as brand_image,
        
//         -- Get minimum price from product_skus
//         MIN(
//           CASE 
//             WHEN ps.discount_type = 1 
//             THEN ps.selling_price * (1 - ps.discount / 100)
//             ELSE ps.selling_price - ps.discount
//           END
//         ) as min_price,
        
//         -- Get maximum price from product_skus
//         MAX(
//           CASE 
//             WHEN ps.discount_type = 1 
//             THEN ps.selling_price * (1 - ps.discount / 100)
//             ELSE ps.selling_price - ps.discount
//           END
//         ) as max_price,
        
//         -- Get total stock
//         SUM(ps.stock) as total_stock,
        
//         -- Check if any variant is in stock
//         MAX(CASE WHEN ps.stock > 0 THEN 1 ELSE 0 END) as has_stock
        
//        FROM favorites f
       
//        JOIN products p ON p.id = f.product_id
//          AND p.status = 1  -- Only active products
       
//        -- Join for brand
//        LEFT JOIN brands b ON b.id = p.brand_id
       
//        -- Join for pricing and stock info
//        LEFT JOIN product_skus ps ON ps.product_id = p.id
//          AND ps.status = 1  -- Active SKUs
       
//        WHERE f.user_id = ?
       
//        GROUP BY f.id, p.id, b.id
       
//        ORDER BY ${sortClause}
       
//        LIMIT ? OFFSET ?`,
//       [userId, limit, offset]
//     );

//     // 2️⃣ Get total count for pagination
//     const totalResult = await connection.queryOne(
//       `SELECT COUNT(*) as total
//        FROM favorites f
//        JOIN products p ON p.id = f.product_id
//        WHERE f.user_id = ? AND p.status = 1`,
//       [userId]
//     );

//     const total = totalResult.total;
//     const totalPages = Math.ceil(total / limit);

//     // 3️⃣ Process favorite products
//     const favoriteProducts = favorites.map(fav => {
//       const minPrice = Number(fav.min_price) || 0;
//       const maxPrice = Number(fav.max_price) || 0;
//       const hasMultiplePrices = minPrice !== maxPrice && maxPrice > 0;
      
//       return {
//         favorite_id: fav.favorite_id,
//         added_at: fav.added_at,
//         product: {
//           id: fav.id,
//           name: fav.name,
//           slug: fav.slug,
//           short_description: fav.short_description,
//           primary_image: fav.primary_image,
//           brand: fav.brand_name ? {
//             name: fav.brand_name,
//             image: fav.brand_image
//           } : null,
          
//           // Pricing info
//           pricing: {
//             min_price: minPrice,
//             max_price: maxPrice,
//             display_price: hasMultiplePrices 
//               ? `${minPrice.toFixed(0)} - ${maxPrice.toFixed(0)}` 
//               : minPrice > 0 ? minPrice.toFixed(0) : 'N/A',
//             has_multiple_prices: hasMultiplePrices
//           },
          
//           // Stock info
//           in_stock: fav.has_stock === 1,
//           total_stock: Number(fav.total_stock) || 0,
          
//           // Flags
//           featured: !!fav.featured,
//           free_delivery: !!fav.free_delivery,
//           best_deal: !!fav.best_deal,
          
//           // Stats
//           view_count: fav.view_count || 0,
//           sell_count: fav.sell_count || 0
//         }
//       };
//     });

//     return {
//       success: true,
//       data: {
//         favorites: favoriteProducts,
//         pagination: {
//           page: Number(page),
//           limit: Number(limit),
//           total: Number(total),
//           total_pages: totalPages,
//           has_next: page < totalPages,
//           has_prev: page > 1
//         },
//         summary: {
//           total_favorites: Number(total),
//           in_stock_count: favoriteProducts.filter(f => f.product.in_stock).length,
//           out_of_stock_count: favoriteProducts.filter(f => !f.product.in_stock).length
//         }
//       }
//     };
//   })
// );

// // API: Check if product is in favorites
// exports.checkFavoriteStatus = api(
//   {
//     params: {
//       product_id: { type: "int", required: true }
//     }
//   },
//   userAuth(async (req, connection, userInfo) => {
//     const productId = req.typed.params.product_id;
//     const userId = userInfo.id;

//     // 1️⃣ Check if product exists
//     const product = await connection.queryOne(
//       `SELECT id, name, status FROM products WHERE id = ?`,
//       [productId]
//     );

//     if (!product) {
//       throw new errors.NOT_FOUND("Product not found");
//     }

//     // 2️⃣ Check if in favorites
//     const favorite = await connection.queryOne(
//       `SELECT id, created_at 
//        FROM favorites 
//        WHERE user_id = ? AND product_id = ?`,
//       [userId, productId]
//     );

//     // 3️⃣ Get user's total favorite count
//     const favoriteCount = await connection.queryOne(
//       `SELECT COUNT(*) as count FROM favorites WHERE user_id = ?`,
//       [userId]
//     );

//     return {
//       success: true,
//       data: {
//         is_favorite: !!favorite,
//         product: {
//           id: product.id,
//           name: product.name,
//           active: product.status === 1
//         },
//         favorite_info: favorite ? {
//           favorite_id: favorite.id,
//           added_at: favorite.created_at
//         } : null,
//         user_favorites_count: favoriteCount.count
//       }
//     };
//   })
// );

// // API: Clear all favorites
// exports.clearFavorites = api(
//   {},
//   userAuth(async (req, connection, userInfo) => {
//     const userId = userInfo.id;

//     // 1️⃣ Get count before deletion for logging
//     const countResult = await connection.queryOne(
//       `SELECT COUNT(*) as count FROM favorites WHERE user_id = ?`,
//       [userId]
//     );

//     const countBefore = countResult.count;

//     if (countBefore === 0) {
//       throw new errors.BAD_REQUEST("Your favorites list is already empty");
//     }

//     // 2️⃣ Delete all favorites
//     const deleteResult = await connection.query(
//       `DELETE FROM favorites WHERE user_id = ?`,
//       [userId]
//     );

//     // 3️⃣ Log user activity
//     await connection.query(
//       `INSERT INTO user_audit_logs (
//         user_id,
//         action,
//         ip_address,
//         old_values,
//         created_at
//       ) VALUES (?, 'CLEAR_FAVORITES', ?, ?, NOW())`,
//       [
//         userId,
//         req.ip || null,
//         JSON.stringify({
//           items_removed: countBefore,
//           action: 'cleared_all_favorites'
//         })
//       ]
//     );

//     return {
//       success: true,
//       message: `Removed ${countBefore} items from favorites`,
//       data: {
//         removed_count: countBefore,
//         favorites_count: 0
//       }
//     };
//   })
// );

// // API: Get favorite product IDs only (for quick checks)
// exports.getFavoriteProductIds = api(
//   {
//     query: {
//       updated_after: { type: "string", required: false } // ISO date string
//     }
//   },
//   userAuth(async (req, connection, userInfo) => {
//     const userId = userInfo.id;
//     const { updated_after } = req.typed.query;

//     // Build WHERE clause for updated_after filter
//     let whereClause = "f.user_id = ?";
//     const params = [userId];
    
//     if (updated_after) {
//       whereClause += " AND f.created_at > ?";
//       params.push(updated_after);
//     }

//     // 1️⃣ Get only product IDs from favorites
//     const favoriteIds = await connection.query(
//       `SELECT f.product_id, f.created_at as added_at
//        FROM favorites f
//        JOIN products p ON p.id = f.product_id
//        WHERE ${whereClause} AND p.status = 1
//        ORDER BY f.created_at DESC`,
//       params
//     );

//     // 2️⃣ Get total count
//     const countResult = await connection.queryOne(
//       `SELECT COUNT(*) as count 
//        FROM favorites f
//        JOIN products p ON p.id = f.product_id
//        WHERE f.user_id = ? AND p.status = 1`,
//       [userId]
//     );

//     return {
//       success: true,
//       data: {
//         product_ids: favoriteIds.map(f => ({
//           product_id: f.product_id,
//           added_at: f.added_at
//         })),
//         total_count: countResult.count,
//         last_updated: new Date().toISOString()
//       }
//     };
//   })
// );




exports.uploadDraftImages = draftUploadApi(
    {
       
    },
    auth(async (req, connection, adminInfo) => {
        const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"];
        if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
            throw new errors.UNAUTHORIZED();
        }

        if (!req.files || !req.files.draft_images || req.files.draft_images.length === 0) {
            throw new errors.INVALID_FIELDS_PROVIDED("No draft images provided.");
        }

        const folder = "drafts";

        const uploadedPaths = [];

        try {
            for (const file of req.files.draft_images) {
                const imgPath = await saveDraftImage(
                    file.path,
                    folder
                );
                uploadedPaths.push(imgPath);
            }
        } catch (err) {
            // Safety cleanup if something fails mid-way
            for (const path of uploadedPaths) {
                deleteFileIfExists(path);
            }
             throw new errors.IMAGE_PROCESSING_FAILED(
                        "Failed to process draft image.:"+err
                    );
        }
 
        return {
            success: true,
            count: uploadedPaths.length,
            images: uploadedPaths
        };
    })
);


exports.deleteDraftImages = api(
    {
        // body: {
        //     paths: { type: "array", required: true }
        // }
    },
    auth(async (req, connection, adminInfo) => {
        const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"];
        if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
            throw new errors.UNAUTHORIZED();
        }

        const { paths } = req.body;

        if (!Array.isArray(paths) || paths.length === 0) {
            throw new errors.INVALID_FIELDS_PROVIDED("paths must be a non-empty array.");
        }

        if (paths.length > 10) {
            throw new errors.INVALID_FIELDS_PROVIDED("Cannot delete more than 10 draft images at once.");
        }

        const deleted = [];
        const skipped = [];

        for (const imgPath of paths) {
            // ---------- BASIC VALIDATION ----------
            if (
                typeof imgPath !== "string" ||
                !imgPath.startsWith("/uploads/") ||
                imgPath.includes("..")
            ) {
                skipped.push({ path: imgPath, reason: "Invalid path" });
                continue;
            }

            // ---------- DRAFT-ONLY SAFETY ----------
            // Adjust this rule if your draft folders are named differently
            if (!imgPath.includes("/draft")) {
                skipped.push({ path: imgPath, reason: "Not a draft image" });
                continue;
            }

            // ---------- EXTENSION CHECK ----------
            if (!/\.(png|jpg|jpeg|webp|gif)$/i.test(imgPath)) {
                skipped.push({ path: imgPath, reason: "Invalid file type" });
                continue;
            }

            // ---------- DELETE ----------
            try {
                deleteFileIfExists(imgPath);
                deleted.push(imgPath);
            } catch (err) {
                skipped.push({ path: imgPath, reason: "Delete failed" });
            }
        }

        return {
            success: true,
            deleted_count: deleted.length,
            skipped_count: skipped.length,
            deleted,
            skipped
        };
    })
);

exports.syncCartItemsUser = api({
    body: {
        sku_ids: { type: "array", required: true }
    }
}, async (req, connection) => {
    const rawIds = req.typed.body.sku_ids;
    if (!Array.isArray(rawIds) || rawIds.length === 0) {
        return { success: true, data: [] };
    }

    const skuIds = rawIds.map(id => parseInt(id, 10)).filter(id => !isNaN(id) && id > 0);
    if (skuIds.length === 0) return { success: true, data: [] };

    const skus = await connection.query(
        `SELECT ps.id, ps.selling_price, ps.discount, ps.discount_type, ps.stock, ps.weight_kg, ps.status,
                COALESCE(ps.free_delivery, p.free_delivery) AS free_delivery
         FROM product_skus ps
         JOIN products p ON p.id = ps.product_id
         WHERE ps.id IN (?)`,
        [skuIds]
    );

    const data = skus.map(s => {
        const discountVal = Number(s.discount || 0);
        const sellingPrice = Number(s.selling_price || 0);
        let finalPrice = sellingPrice;

        if (s.discount_type === 1) {
            finalPrice = sellingPrice * (1 - discountVal / 100);
        } else if (s.discount_type === 0) {
            finalPrice = sellingPrice - discountVal;
        }

        return {
            id: String(s.id),
            price: finalPrice > 0 ? finalPrice : 0,
            originalPrice: sellingPrice,
            discount: sellingPrice > finalPrice ? sellingPrice - finalPrice : 0,
            stock: s.status === 1 ? s.stock : 0,
            weight_kg: Number(s.weight_kg || 0),
            free_delivery: s.free_delivery === 1
        };
    });

    return { success: true, data };
});


// ────────────────────────────────────────────────
// PATCH /admin/product/:id/toggle-single-page
// Toggle the `has_single_product_page` flag for a product.
// ────────────────────────────────────────────────
exports.toggleSingleProductPage = api(
    {
        params: { id: { type: "int", required: true } }
    },
    auth(async (req, connection, adminInfo) => {
        const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"];
        if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) throw new errors.UNAUTHORIZED();

        const productId = req.typed.params.id;

        const product = await connection.queryOne(
            "SELECT id, name, has_single_product_page FROM products WHERE id = ?",
            [productId]
        );
        if (!product) throw new errors.NOT_FOUND("Product not found.");

        const newValue = product.has_single_product_page ? 0 : 1;

        await connection.query(
            "UPDATE products SET has_single_product_page = ? WHERE id = ?",
            [newValue, productId]
        );

        // Audit log
        await connection.query(
            `INSERT INTO admin_audit_logs
            (admin_id, action, resource, resource_id, meta)
            VALUES (?, 'TOGGLE_SINGLE_PAGE', 'product', ?, ?)`,
            [
                adminInfo.id,
                productId,
                JSON.stringify({
                    product_name: product.name,
                    has_single_product_page: !!newValue
                })
            ]
        );

        return {
            success: true,
            has_single_product_page: !!newValue
        };
    })
);


// ────────────────────────────────────────────────
// GET /user/product/:id/single-page-data
// Public endpoint — returns product + variations + bulk offers
// for the dedicated single product page.
// Validates that has_single_product_page = 1.
// ────────────────────────────────────────────────
exports.getSinglePageData = api({
    params: {
        id: { type: "int", required: true }
    }
}, async (req, connection) => {
    const productId = req.typed.params.id;

    // ---------- PRODUCT ----------
    const productRow = await connection.queryOne(
        `SELECT 
            p.*,
            mc.name as main_category_name,
            mc.name_bd as main_category_name_bd,
            sc.name as sub_category_name,
            sc.name_bd as sub_category_name_bd,
            cc.name as child_category_name,
            cc.name_bd as child_category_name_bd,
            b.name as brand_name,
            b.img_path as brand_image,
            a.name as attribute_name,
            a.name_bd as attribute_name_bd
         FROM products p
         INNER JOIN main_categories mc ON mc.id = p.main_category_id
         LEFT JOIN sub_categories sc ON sc.id = p.sub_category_id
         LEFT JOIN child_categories cc ON cc.id = p.child_category_id
         LEFT JOIN brands b ON b.id = p.brand_id
         LEFT JOIN attributes a ON a.id = p.attribute_id
         WHERE p.id = ? 
           AND p.status = 1
           AND p.has_single_product_page = 1
           AND mc.status = 1
           AND (p.sub_category_id IS NULL OR sc.status = 1)
           AND (p.child_category_id IS NULL OR cc.status = 1)`,
        [productId]
    );

    if (!productRow) throw new errors.NOT_FOUND("Product not found or single page is not enabled.");

    const product = {
        id: productRow.id,
        name: productRow.name,
        name_bd: productRow.name_bd,
        slug: productRow.slug,
        main_category: { id: productRow.main_category_id, name: productRow.main_category_name, name_bd: productRow.main_category_name_bd },
        sub_category: { id: productRow.sub_category_id, name: productRow.sub_category_name, name_bd: productRow.sub_category_name_bd },
        child_category: { id: productRow.child_category_id, name: productRow.child_category_name, name_bd: productRow.child_category_name_bd },
        brand: productRow.brand_id ? {
            id: productRow.brand_id,
            name: productRow.brand_name,
            image: productRow.brand_image
        } : null,
        attribute: productRow.attribute_id ? {
            id: productRow.attribute_id,
            name: productRow.attribute_name,
            name_bd: productRow.attribute_name_bd
        } : null,
        video_path: productRow.video_path,
        short_description: productRow.short_description,
        long_description: productRow.long_description,
        free_delivery: !!productRow.free_delivery,
        sell_count: productRow.sell_count || 0,
        meta_title: productRow.meta_title,
        canonical_url: productRow.canonical_url,
        meta_description: productRow.meta_description,
        meta_keywords: productRow.meta_keywords,
        og_title: productRow.og_title,
        og_description: productRow.og_description,
        robots: productRow.robots,
        avg_rating: Number(productRow.avg_rating) || 0,
        review_count: productRow.review_count || 0,
        images: [],
        variations: [],
        available_colors: [],
        available_variants: [],
        bulk_offers: []
    };

    // ---------- IMAGES ----------
    const images = await connection.query(
        `SELECT pi.id, pi.img_path, pi.serial, pi.sku_id,
                ps.color_id AS sku_color_id, ps.variant_id AS sku_variant_id
         FROM product_images pi
         LEFT JOIN product_skus ps ON ps.id = pi.sku_id
         WHERE pi.product_id = ?
         ORDER BY pi.serial ASC, pi.id ASC`,
        [productRow.id]
    );
    product.images = images.map(i => ({
        id: i.id,
        path: i.img_path,
        serial: i.serial,
        sku_id: i.sku_id ?? null,
        sku_color_id: i.sku_color_id ?? null,
        sku_variant_id: i.sku_variant_id ?? null
    }));

    // ---------- VARIATIONS ----------
    const variations = await connection.query(
        `SELECT ps.id, ps.color_id, ps.variant_id, ps.selling_price, ps.discount, ps.discount_type, ps.stock, ps.sku, ps.weight_kg, ps.free_delivery,
                c.name as color_name, c.name_bd as color_name_bd, c.hex as color_hex, c.priority as color_priority,
                v.name as variant_name, v.name_bd as variant_name_bd, v.serial as variant_serial, v.updated_at,
                a.id as attribute_id, a.name as attribute_name, a.name_bd as attribute_name_bd, a.priority as attribute_priority
         FROM product_skus ps
         LEFT JOIN colors c ON c.id = ps.color_id
         LEFT JOIN variants v ON v.id = ps.variant_id
         LEFT JOIN attributes a ON a.id = v.attribute_id
         WHERE ps.product_id = ? AND ps.status = 1 AND ps.stock > 0
         ORDER BY v.serial ASC, v.updated_at DESC, v.name ASC, c.priority ASC`,
        [productRow.id]
    );

    const colorsMap = new Map();
    const variantsMap = new Map();
    const skuIds = [];

    product.variations = variations.map(v => {
        skuIds.push(v.id);

        if (v.color_id && !colorsMap.has(v.color_id)) {
            colorsMap.set(v.color_id, {
                id: v.color_id,
                name: v.color_name,
                name_bd: v.color_name_bd,
                hex: v.color_hex,
                priority: v.color_priority
            });
        }

        if (v.variant_id && !variantsMap.has(v.variant_id)) {
            variantsMap.set(v.variant_id, {
                id: v.variant_id,
                name: v.variant_name,
                name_bd: v.variant_name_bd,
                serial: v.variant_serial ?? 1,
                attribute_id: v.attribute_id,
                attribute_name: v.attribute_name,
                attribute_name_bd: v.attribute_name_bd
            });
        }

        return {
            id: v.id,
            color: v.color_id ? {
                id: v.color_id,
                name: v.color_name,
                name_bd: v.color_name_bd,
                hex: v.color_hex,
                priority: v.color_priority
            } : null,
            variant: v.variant_id ? {
                id: v.variant_id,
                name: v.variant_name,
                name_bd: v.variant_name_bd,
                priority: v.variant_serial,
                attribute: v.attribute_id ? {
                    id: v.attribute_id,
                    name: v.attribute_name,
                    name_bd: v.attribute_name_bd,
                    priority: v.attribute_priority
                } : null
            } : null,
            selling_price: Number(v.selling_price),
            discount: Number(v.discount),
            discount_type: v.discount_type,
            final_price: v.discount_type === 1
                ? Number(v.selling_price) * (1 - Number(v.discount) / 100)
                : Number(v.selling_price) - Number(v.discount),
            stock: v.stock,
            sku: v.sku,
            weight_kg: Number(v.weight_kg ?? 0),
            free_delivery: v.free_delivery !== null && v.free_delivery !== undefined
                ? !!v.free_delivery
                : !!productRow.free_delivery,
            in_stock: v.stock > 0
        };
    });

    product.available_colors = Array.from(colorsMap.values())
        .sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));

    product.available_variants = Array.from(variantsMap.values())
        .sort((a, b) => (a.serial ?? 1) - (b.serial ?? 1));

    // ---------- BULK OFFERS ----------
    // Fetch active bulk discount rules for all in-stock SKUs of this product
    if (skuIds.length > 0) {
        const bulkRules = await connection.query(
            `SELECT 
                r.id,
                r.name,
                r.product_sku_id,
                r.min_qty,
                r.discount_type,
                r.discount_value,
                r.free_delivery,
                ps.sku,
                ps.selling_price,
                ps.discount AS sku_discount,
                ps.discount_type AS sku_discount_type
             FROM sku_bulk_discount_rules r
             JOIN product_skus ps ON ps.id = r.product_sku_id
             WHERE r.product_sku_id IN (?) AND r.status = 1
             ORDER BY r.product_sku_id ASC, r.min_qty ASC`,
            [skuIds]
        );

        product.bulk_offers = bulkRules.map(r => ({
            id: r.id,
            name: r.name,
            product_sku_id: r.product_sku_id,
            sku: r.sku,
            min_qty: r.min_qty,
            discount_type: r.discount_type,
            discount_value: Number(r.discount_value),
            free_delivery: !!r.free_delivery,
            sku_selling_price: Number(r.selling_price),
            sku_discount: Number(r.sku_discount),
            sku_discount_type: r.sku_discount_type
        }));
    }

    return {
        success: true,
        product
    };
});
