const { api, auth } = require('../helpers/common');
const errors = require('../helpers/errors');
const validator  = require("validator");

exports.createProductVideo = api(
  {
    body: {
      product_id: { type: "int", required: false },
      label: { type: "string", required: false },
      video_url: { type: "string", required: true },
      path: { type: "string", required: false },
      thumb: { type: "string", required: false }
    }
  },
  auth(async (req, connection, adminInfo) => {
    /** 1️⃣ Authorization */
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
      throw new errors.UNAUTHORIZED();
    }

    const { product_id, label, video_url, path, thumb } = req.typed.body;

    /** 2️⃣ Validation */


      if ( !validator.isURL(video_url)) throw new errors.INVALID_FIELDS_PROVIDED("Video url is not valid.");

    if ( label && label.length>100) {
      throw new errors.INVALID_FIELDS_PROVIDED("Label can not be more than 100 degit");
    }
    if ( path && path.length>522) {
      throw new errors.INVALID_FIELDS_PROVIDED("Path can not be more than 522 degit");
    }

    if (product_id) {
          // Check if product exists in the main products table
      const productExists = await connection.queryOne(
        `SELECT id FROM products WHERE id = ? and status=1`,
        [product_id]
      );
      if (!productExists) {
        throw new errors.NOT_FOUND("Product not found ");
      }
      // Check if this product already has a video
      const existing = await connection.queryOne(
        `SELECT id FROM product_videos WHERE product_id = ? AND deleted_at IS NULL`,
        [product_id]
      );

      if (existing) {
        throw new errors.ALREADY_EXIST(`Product ID ${product_id} already has an associated video.`);
      }

    
    }

    /** 3️⃣ Database Insertion */
    const result = await connection.query(
      `INSERT INTO product_videos (product_id, label, video_url, path, thumb) 
       VALUES (?, ?, ?, ?, ?)`,
      [product_id || null, label || null, video_url || null, path || null, thumb || null]
    );

    const newId = result.insertId;

    /** 4️⃣ Audit Logging */
    await connection.query(
      `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta) 
       VALUES (?, 'CREATE_PRODUCT_VIDEO', 'product_video', ?, ?)`,
      [
        adminInfo.id, 
        newId, 
        JSON.stringify({ product_id, label, video_url, path })
      ]
    );

    return {
      success: true,
      message: "Product video created successfully",
      data: {
        id: newId,
        product_id,
        label,
        video_url,
        path,thumb
      }
    };
  })
);

exports.getAllProductVideos = api(
  {
    query: {
      product_id: { type: "int", required: false },
      search: { type: "string", required: false }, // Search by label
      limit: { type: "int", default: 20 },
      offset: { type: "int", default: 0 }
    }
  },
   async (req, connection, adminInfo) => {
    /** 1️⃣ Authorization */
    // const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"];
    // if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
    //   throw new errors.UNAUTHORIZED();
    // }

    let { product_id, search, limit, offset } = req.typed.query;
    limit = Math.min(Math.max(limit, 1), 50);
    offset = Math.max(offset, 0);

    let whereClauses = ["pv.deleted_at IS NULL"];
    let queryParams = [];

    /** 2️⃣ Filtering Logic */
    if (product_id) {
      whereClauses.push("pv.product_id = ?");
      queryParams.push(product_id);
    }

    if (search) {
      whereClauses.push("pv.label LIKE ?");
      queryParams.push(`%${search}%`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    /** 3️⃣ Count Query for Pagination */
    const countRes = await connection.queryOne(
      `SELECT COUNT(*) as total FROM product_videos pv ${whereSql}`,
      queryParams
    );

    /** 4️⃣ Data Query */
    // Joining with products to get the name for better admin UX
    const rows = await connection.query(
      `SELECT 
        pv.*, 
        p.name as product_name 
       FROM product_videos pv
       LEFT JOIN products p ON pv.product_id = p.id
       ${whereSql}
       ORDER BY pv.created_at DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    return {
      success: true,
      meta: {
        total: countRes?.total || 0,
        limit,
        offset
      },
      data: rows.map(row => ({
        id: row.id,
        product_id: row.product_id,
        product_name: row.product_name || "Standalone/Unlinked",
        label: row.label,
        video_url: row.video_url,
        path: row.path,
        thumb: row.thumb,
        created_at: row.created_at,
        updated_at: row.updated_at
      }))
    };
  })
;

 




exports.getProductVideoById = api(
  {
    params: { id: { type: "int", required: true } }
  },
  async (req, connection, adminInfo) => {
    // const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"];
    // if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
    //   throw new errors.UNAUTHORIZED();
    // }

    const { id } = req.typed.params;

    const row = await connection.queryOne(
      `SELECT 
        pv.id,
        pv.product_id,
        pv.label,
        pv.video_url,
        pv.path,
        pv.thumb,
        pv.created_at,
        pv.updated_at
       FROM product_videos pv
       WHERE pv.id = ? AND pv.deleted_at IS NULL`,
      [id]
    );

    if (!row) {
      throw new errors.NOT_FOUND("Product video not found.");
    }

    return {
      success: true,
      data: {
        id: row.id,
        product_id: row.product_id,
        label: row.label,
        video_url: row.video_url,
        path: row.path,
        thumb: row.thumb,
        created_at: row.created_at,
        updated_at: row.updated_at
      }
    };
  }
);

exports.getVideoByProductId = api(
  {
    params: { product_id: { type: "int", required: true } }
  },
   async (req, connection, adminInfo) => {
    // const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"];
    // if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
    //   throw new errors.UNAUTHORIZED();
    // }
    
    const { product_id } = req.typed.params;

    const row = await connection.queryOne(
      `SELECT 
        id,
        product_id,
        label,
        video_url,
        path,
        thumb,
        created_at,
        updated_at
       FROM product_videos 
       WHERE product_id = ? AND deleted_at IS NULL`,
      [product_id]
    );

    if (!row) {
      throw new errors.NOT_FOUND("Product video not found.");
    }

    return {
      success: true,
      data: {
        id: row.id,
        product_id: row.product_id,
        label: row.label,
        video_url: row.video_url,
        path: row.path,
        thumb: row.thumb,
        created_at: row.created_at,
        updated_at: row.updated_at
      }
    };
  }
);





exports.updateProductVideo = api(
  {
    params: { id: { type: "int", required: true } },
    body: {
      product_id: { type: "int", required: false },
      label: { type: "string", required: false },
      video_url: { type: "string", required: false },
      path: { type: "string", required: false },
      thumb: { type: "string", required: false }
    }
  },
  auth(async (req, connection, adminInfo) => {
    /** 1️⃣ Authorization */
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
      throw new errors.UNAUTHORIZED();
    }

    const { id } = req.typed.params;
    const { product_id, label, video_url, path, thumb } = req.typed.body;

    if(!product_id && !label && !video_url && !path && !thumb) throw new errors.NO_FIELDS_PROVIDED()

    /** 2️⃣ Fetch Existing Record */
    const existingVideo = await connection.queryOne(
      `SELECT * FROM product_videos WHERE id = ? AND deleted_at IS NULL`,
      [id]
    );
    if (!existingVideo) throw new errors.NOT_FOUND("Video record not found");

    /** 3️⃣ Validation */
    if (video_url && !validator.isURL(video_url)) {
      throw new errors.INVALID_FIELDS_PROVIDED("Video URL is not valid.");
    }
    
    if (label && label.length > 100) {
      throw new errors.INVALID_FIELDS_PROVIDED("Label cannot be more than 100 characters.");
    }

    // Check Product Constraints if product_id is being changed/added
    if (product_id !== undefined && product_id !== existingVideo.product_id) {
      if (product_id !== null) {
        // Verify product exists
        const productExists = await connection.queryOne(
          `SELECT id FROM products WHERE id = ? AND status = 1`,
          [product_id]
        );
        if (!productExists) throw new errors.NOT_FOUND("New product not found or inactive.");

        // Verify the new product doesn't already have another video
        const duplicateCheck = await connection.queryOne(
          `SELECT id FROM product_videos WHERE product_id = ? AND id != ? AND deleted_at IS NULL`,
          [product_id, id]
        );
        if (duplicateCheck) {
          throw new errors.ALREADY_EXIST(`Product ID ${product_id} is already linked to another video.`);
        }
      }
    }

    /** 4️⃣ Execute Update */
    const updateFields = [];
    const updateValues = [];

    const fieldsMapping = {
      product_id: product_id,
      label: label,
      video_url: video_url,
      path: path,
      thumb: thumb
    };

    for (const [key, value] of Object.entries(fieldsMapping)) {
      if (value !== undefined) {
        updateFields.push(`${key} = ?`);
        updateValues.push(value);
      }
    }

    // if (updateFields.length === 0) {
    //   throw new errors.NO_FIELDS_PROVIDED();
    // }

    await connection.query(
      `UPDATE product_videos SET ${updateFields.join(", ")} WHERE id = ?`,
      [...updateValues, id]
    );

    /** 5️⃣ Audit Logging */
    await connection.query(
      `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta) 
       VALUES (?, 'UPDATE_PRODUCT_VIDEO', 'product_video', ?, ?)`,
      [
        adminInfo.id, 
        id, 
        JSON.stringify({ 
          before: existingVideo, 
          after: req.typed.body 
        })
      ]
    );

    return {
      success: true,
      message: "Product video updated successfully" 
    };
  })
);


exports.deleteProductVideo = api(
  {
    params: { id: { type: "int", required: true } }
  },
  auth(async (req, connection, adminInfo) => {
    /** 1️⃣ Authorization */
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN"];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
      throw new errors.UNAUTHORIZED("You do not have permission to delete videos.");
    }

    const { id } = req.typed.params;

    /** 2️⃣ Check Existence */
    const video = await connection.queryOne(
      `SELECT id, product_id, label ,deleted_at FROM product_videos WHERE id = ? `,
      [id]
    );
    

    if (!video) {
      throw new errors.NOT_FOUND("Video record not found or already deleted.");
    }

    if (video.deleted_at) {
      throw new errors.NOT_FOUND("Video record already deleted.");
    }

    /** 3️⃣ Execute Soft Delete */
    await connection.query(
      `UPDATE product_videos SET deleted_at = NOW() WHERE id = ?`,
      [id]
    );

    /** 4️⃣ Audit Logging */
    await connection.query(
      `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta) 
       VALUES (?, 'DELETE_PRODUCT_VIDEO', 'product_video', ?, ?)`,
      [
        adminInfo.id, 
        id, 
        JSON.stringify({ 
          product_id: video.product_id, 
          label: video.label,
          deleted_at: new Date() 
        })
      ]
    );

    return {
      success: true,
      message: "Product video deleted successfully"
     
    };
  })
);