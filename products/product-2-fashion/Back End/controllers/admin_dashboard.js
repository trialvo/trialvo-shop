
const { api, auth } = require('../helpers/common');
const errors = require("../helpers/errors");
const validator = require('validator');


const { getConfig } = require('../config/ApplicationSettingsDB');

const TIME_RANGES = {
  today: {
    current: [`CURDATE()`, `CURDATE() + INTERVAL 1 DAY`],
    last: [`CURDATE() - INTERVAL 1 DAY`, `CURDATE()`]
  },
  week: {
    current: [
      `DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)`,
      `DATE_ADD(DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY), INTERVAL 7 DAY)`
    ],
    last: [
      `DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) + 7 DAY)`,
      `DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)`
    ]
  },
  month: {
    current: [
      `DATE_FORMAT(CURDATE(), '%Y-%m-01')`,
      `DATE_ADD(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 1 MONTH)`
    ],
    last: [
      `DATE_SUB(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 1 MONTH)`,
      `DATE_FORMAT(CURDATE(), '%Y-%m-01')`
    ]
  },
  year: {
    current: [
      `DATE_FORMAT(CURDATE(), '%Y-01-01')`,
      `DATE_ADD(DATE_FORMAT(CURDATE(), '%Y-01-01'), INTERVAL 1 YEAR)`
    ],
    last: [
      `DATE_SUB(DATE_FORMAT(CURDATE(), '%Y-01-01'), INTERVAL 1 YEAR)`,
      `DATE_FORMAT(CURDATE(), '%Y-01-01')`
    ]
  }
};
const ACTIVE_STATUSES = [
  'approved', 'processing', 'packaging',
  'shipped', 'out_for_delivery', 'delivered'
];

const CANCEL_STATUSES = [
  'returned', 'cancelled', 'trash'
];


// exports.getOverview = api(
//   {},
//   auth(async (req, connection, adminInfo) => {
//     const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"];
//     if (!adminInfo.roles.some(role => ALLOWED_ROLES.includes(role))) throw new errors.UNAUTHORIZED();

//     const overview = {};

//     for (const scope of Object.keys(TIME_RANGES)) {
//       overview[scope] = {};

//       for (const period of ['current', 'last']) {
//         const [from, to] = TIME_RANGES[scope][period];

//         /** Orders + Sales */
//         const [orderRow] = await connection.query(`
//           SELECT
//             COUNT(CASE WHEN order_status IN (?) THEN 1 END) AS total_orders,
//             COALESCE(SUM(CASE WHEN order_status IN (?) THEN subtotal END), 0) AS total_sales,
//             COUNT(CASE WHEN order_status IN (?) THEN 1 END) AS total_cancelled
//           FROM orders
//           WHERE created_at >= ${from}
//             AND created_at < ${to}
//         `, [
//           ACTIVE_STATUSES,
//           ACTIVE_STATUSES,
//           CANCEL_STATUSES
//         ]);

//         /** Page Views */
//         const [viewRow] = await connection.query(`
//           SELECT COUNT(*) AS total_views
//           FROM page_view_logs
//           WHERE viewed_at >= ${from}
//             AND viewed_at < ${to}
//         `);

//         overview[scope][period] = {
//           total_orders: orderRow.total_orders || 0,
//           total_sales: Number(orderRow.total_sales || 0),
//           total_cancelled: orderRow.total_cancelled || 0,
//           total_views: viewRow.total_views || 0
//         };
//       }
//     }

//     return {
//       success: true,
//       overview
//     };
//   })
// );



exports.getOverview = api(
  {},
  auth(async (req, connection, adminInfo) => {
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"];
    if (!adminInfo.roles.some(role => ALLOWED_ROLES.includes(role))) throw new errors.UNAUTHORIZED();

    const overview = {};

    for (const scope of Object.keys(TIME_RANGES)) {
      overview[scope] = {};

      for (const period of ['current', 'last']) {
        const [from, to] = TIME_RANGES[scope][period];

        /** Orders + Sales */
        const [orderRow] = await connection.query(`
          SELECT
            COUNT(CASE WHEN order_status IN (?) THEN 1 END) AS total_orders,
            COALESCE(SUM(CASE WHEN order_status IN (?) THEN subtotal END), 0) AS total_sales,
            COUNT(CASE WHEN order_status IN (?) THEN 1 END) AS total_cancelled
          FROM orders
          WHERE created_at >= ${from}
            AND created_at < ${to}
        `, [
          ACTIVE_STATUSES,
          ACTIVE_STATUSES,
          CANCEL_STATUSES
        ]);

        /** Page Views */
        const [viewRow] = await connection.query(`
          SELECT COUNT(*) AS total_views
          FROM page_view_logs
          WHERE viewed_at >= ${from}
            AND viewed_at < ${to}
        `);

        overview[scope][period] = {
          total_orders: orderRow.total_orders || 0,
          total_sales: Number(orderRow.total_sales || 0),
          total_cancelled: orderRow.total_cancelled || 0,
          total_views: viewRow.total_views || 0
        };
      }

      // Calculate percentage changes for current vs last period
      const current = overview[scope].current;
      const last = overview[scope].last;

      overview[scope].change = {
        total_orders: calculatePercentageChange(last.total_orders, current.total_orders),
        total_sales: calculatePercentageChange(last.total_sales, current.total_sales),
        total_cancelled: calculatePercentageChange(last.total_cancelled, current.total_cancelled),
        total_views: calculatePercentageChange(last.total_views, current.total_views)
      };
    }

    return {
      success: true,
      overview
    };
  })
);

// Helper function to calculate percentage change
function calculatePercentageChange(oldValue, newValue) {
  if (oldValue === 0) {
    // If there were no values in the last period, return positive infinity or handle as needed
    return newValue > 0 ? 100 : 0;
  }

  const change = ((newValue - oldValue) / oldValue) * 100;
  return Number(change.toFixed(2)); // Round to 2 decimal places
}
// Updated helper function with better handling
// function calculatePercentageChange(oldValue, newValue) {
//   if (oldValue === 0) {
//     if (newValue === 0) {
//       return { value: 0, label: "No change" };
//     }
//     // Going from 0 to positive
//     return { value: Infinity, label: "New activity" };
//   }

//   if (newValue === 0) {
//     // Going from positive to 0
//     return { value: -100, label: "No activity" };
//   }

//   const change = ((newValue - oldValue) / oldValue) * 100;
//   const rounded = Number(change.toFixed(2));

//   let label = "Increase";
//   if (rounded < 0) label = "Decrease";
//   if (Math.abs(rounded) < 1) label = "Stable";

//   return { value: rounded, label };
// }




exports.getTopViewedProducts = api(
  {
    query: {
      timeRange: { type: "string", default: "all" },
      limit: { type: "int", default: 20 },
      offset: { type: "int", default: 0 },
    }
  },
  auth(async (req, connection, adminInfo) => {
    // ... (Auth and limit/offset logic)
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"];
    if (!adminInfo.roles.some(role => ALLOWED_ROLES.includes(role))) throw new errors.UNAUTHORIZED();

    let { limit, offset, timeRange } = req.typed.query;
    limit = Math.min(Math.max(limit, 1), 50);
    offset = Math.max(offset, 0);


    if (!['today', 'week', 'month', 'year', 'all'].includes(timeRange)) {
      throw new errors.INVALID_FIELDS_PROVIDED("Select one of these time range: today, week, month, year, all");
    }

    let products;
    let totalCount;

    if (timeRange === 'all') {
      // FAST PATH: Use the pre-aggregated column in the products table
      const [countResult] = await connection.query(
        `SELECT COUNT(*) as total FROM products WHERE status = 1`
      );
      totalCount = countResult.total || 0;

      products = await connection.query(`
        SELECT 
          p.id, p.name, p.slug,
          p.view_count as range_view_count, -- Using the lifetime column
          (SELECT MAX(viewed_at) FROM product_view_logs WHERE product_id = p.id) as last_viewed_at,
          COALESCE(p.face_image, (SELECT img_path FROM product_images WHERE product_id = p.id ORDER BY serial ASC, id ASC LIMIT 1)) as first_image,
          (SELECT MIN(ps.selling_price) FROM product_skus ps WHERE ps.product_id = p.id AND ps.status = 1) as min_selling_price
        FROM products p
        WHERE p.status = 1
        ORDER BY p.view_count DESC
        LIMIT ? OFFSET ?
      `, [limit, offset]);

    } else {
      // DETAILED PATH: Query logs for specific time range
      let fromDate = new Date();
      if (timeRange === 'today') fromDate.setHours(0, 0, 0, 0);
      else if (timeRange === 'week') fromDate.setDate(fromDate.getDate() - 7);
      else if (timeRange === 'month') fromDate.setMonth(fromDate.getMonth() - 1);
      else if (timeRange === 'year') fromDate.setFullYear(fromDate.getFullYear() - 1);

      const fromDateStr = fromDate.toISOString().slice(0, 19).replace('T', ' ');

      const [countResult] = await connection.query(`
        SELECT COUNT(DISTINCT product_id) as total 
        FROM product_view_logs 
        WHERE viewed_at >= ?`, [fromDateStr]
      );
      totalCount = countResult.total || 0;

      products = await connection.query(`
        SELECT 
          p.id, p.name, p.slug,
          COUNT(pvl.id) as range_view_count,
          MAX(pvl.viewed_at) as last_viewed_at,
          COALESCE(p.face_image, (SELECT img_path FROM product_images WHERE product_id = p.id ORDER BY serial ASC, id ASC LIMIT 1)) as first_image,
          (SELECT MIN(ps.selling_price) FROM product_skus ps WHERE ps.product_id = p.id AND ps.status = 1) as min_selling_price
        FROM product_view_logs pvl
        JOIN products p ON pvl.product_id = p.id
        WHERE p.status = 1 AND pvl.viewed_at >= ?
        GROUP BY p.id
        ORDER BY range_view_count DESC
        LIMIT ? OFFSET ?
      `, [fromDateStr, limit, offset]);
    }

    // Common Formatting logic...
    const formattedProducts = products.map(product => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      view_count: parseInt(product.range_view_count || 0),
      image: product.first_image || null,
      selling_price: parseFloat(product.min_selling_price || 0),
      last_viewed: product.last_viewed_at
    }));

    return {
      success: true,
      data: formattedProducts,

      meta: { timeRange, count: totalCount, limit, offset }
    };


  })
);

exports.getTopSellingProducts = api(
  {
    query: {
      timeRange: { type: "string", default: "all" },
      limit: { type: "int", default: 20 },
      offset: { type: "int", default: 0 },
    }
  },
  auth(async (req, connection, adminInfo) => {
    // ... (Keep your Auth logic)
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"];
    if (!adminInfo.roles.some(role => ALLOWED_ROLES.includes(role))) {
      throw new errors.UNAUTHORIZED();
    }

    let { limit, offset, timeRange } = req.typed.query;
    limit = Math.min(Math.max(limit, 1), 50);
    offset = Math.max(offset, 0);

    if (!['today', 'week', 'month', 'year', 'all'].includes(timeRange)) {
      throw new errors.INVALID_FIELDS_PROVIDED("Select one of these time range: today, week, month, year, all");
    }

    //const ACTIVE_STATUSES = ['approved', 'processing', 'packaging', 'shipped', 'out_for_delivery', 'delivered'];
    const statusPlaceholders = ACTIVE_STATUSES.map(() => '?').join(',');

    let dateCondition = '';
    let dateParams = [];

    if (timeRange !== 'all') {
      let fromDate = new Date();
      if (timeRange === 'today') fromDate.setHours(0, 0, 0, 0);
      else if (timeRange === 'week') fromDate.setDate(fromDate.getDate() - 7);
      else if (timeRange === 'month') fromDate.setMonth(fromDate.getMonth() - 1);
      else if (timeRange === 'year') fromDate.setFullYear(fromDate.getFullYear() - 1);

      dateCondition = 'AND o.placed_at >= ?';
      dateParams.push(fromDate.toISOString().slice(0, 19).replace('T', ' '));
    }

    // STEP 1: Get products ordered by sales count (including 0s)
    // We use a LEFT JOIN on order_items so products with 0 sales still appear
    const productsQuery = `
        SELECT 
          p.id as product_id, 
          p.name as product_name,
          p.slug,
          mc.id as mc_id, mc.name as mc_name,
          sc.id as sc_id, sc.name as sc_name,
          cc.id as cc_id, cc.name as cc_name,
          COALESCE(p.face_image, (SELECT img_path FROM product_images WHERE product_id = p.id ORDER BY serial ASC, id ASC LIMIT 1)) as first_image,
          /* Calculate period sales specifically */
          COALESCE((
            SELECT SUM(oi.quantity) 
            FROM order_items oi 
            JOIN orders o ON oi.order_id = o.id 
            WHERE oi.product_id = p.id 
            AND o.order_status IN (${statusPlaceholders})
            ${dateCondition}
          ), 0) as period_sell_count
        FROM products p
        LEFT JOIN main_categories mc ON p.main_category_id = mc.id
        LEFT JOIN sub_categories sc ON p.sub_category_id = sc.id
        LEFT JOIN child_categories cc ON p.child_category_id = cc.id
        WHERE p.status = 1
        ORDER BY period_sell_count DESC, p.id DESC
        LIMIT ? OFFSET ?
      `;

    const queryParams = [...ACTIVE_STATUSES, ...dateParams, limit, offset];
    const products = await connection.query(productsQuery, queryParams);

    if (products.length === 0) {
      return { success: true, data: [] };
    }

    const productIds = products.map(p => p.product_id);
    const productIdPlaceholders = productIds.map(() => '?').join(',');

    // STEP 2: Get Variations and their lifetime counts
    const variationsQuery = `
        SELECT 
          ps.product_id,
          ps.id as sku_id, ps.sku, ps.selling_price, ps.stock,
          COALESCE((
            SELECT SUM(oi2.quantity) 
            FROM order_items oi2 
            JOIN orders o2 ON oi2.order_id = o2.id 
            WHERE oi2.product_sku_id = ps.id 
            AND o2.order_status IN (${statusPlaceholders})
          ), 0) as sku_lifetime_sell
        FROM product_skus ps
        WHERE ps.product_id IN (${productIdPlaceholders}) AND ps.status = 1
      `;

    const variations = await connection.query(variationsQuery, [...ACTIVE_STATUSES, ...productIds]);

    // STEP 3: Format the response
    const result = products.map(p => {
      const productVariations = variations.filter(v => v.product_id === p.product_id);

      return {
        product_id: p.product_id,
        product_name: p.product_name,
        first_image: p.first_image,
        main_category: { id: p.mc_id, name: p.mc_name },
        sub_category: { id: p.sc_id, name: p.sc_name },
        child_category: { id: p.cc_id, name: p.cc_name },
        total_sell_count: parseInt(p.period_sell_count),
        total_in_stock: productVariations.reduce((sum, v) => sum + parseInt(v.stock || 0), 0),
        variations: productVariations.map(v => ({
          id: v.sku_id,
          sku: v.sku,
          selling_price: parseFloat(v.selling_price),
          stock: v.stock,
          sell_count: parseInt(v.sku_lifetime_sell)
        }))
      };
    });

    return {
      success: true,
      data: result,
      meta: { timeRange, count: result.length, limit, offset }
    };


  })
);


exports.getTopSellingAreas = api(
  {
    query: {
      timeRange: { type: "string", default: "all" },
      limit: { type: "int", default: 20 },
      offset: { type: "int", default: 0 },
    }
  },
  auth(async (req, connection, adminInfo) => {
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "SALES_MANAGER"];
    if (!adminInfo.roles.some(role => ALLOWED_ROLES.includes(role))) {
      throw new errors.UNAUTHORIZED();
    }

    let { limit, offset, timeRange } = req.typed.query;
    limit = Math.min(Math.max(limit, 1), 50);
    offset = Math.max(offset, 0);

    if (!['today', 'week', 'month', 'year', 'all'].includes(timeRange)) {
      throw new errors.INVALID_FIELDS_PROVIDED("Select one of these time range: today, week, month, year, all");
    }

    const ACTIVE_STATUSES = ['approved', 'processing', 'packaging', 'shipped', 'out_for_delivery', 'delivered'];
    const statusPlaceholders = ACTIVE_STATUSES.map(() => '?').join(',');

    // Helper to get date string
    const getDateParam = (range) => {
      if (range === 'all') return null;
      let fromDate = new Date();
      if (range === 'today') fromDate.setHours(0, 0, 0, 0);
      else if (range === 'week') fromDate.setDate(fromDate.getDate() - 7);
      else if (range === 'month') fromDate.setMonth(fromDate.getMonth() - 1);
      else if (range === 'year') fromDate.setFullYear(fromDate.getFullYear() - 1);
      return fromDate.toISOString().slice(0, 19).replace('T', ' ');
    };

    const dateParam = getDateParam(timeRange);

    // Group by level-1 zone:
    //   - lm.district_name = Pathao city name (Dhaka, Chittagong…) — set after Pathao sync fix
    //   - lm.city_name     = Steadfast/RedX district name OR old Pathao zone name (fallback)
    //   - oa.city          = raw text for orders before location_mapping_id migration
    const zoneExpr = `COALESCE(lm.district_name, lm.city_name, oa.city)`;
    const dateSnippet = dateParam ? 'AND o.placed_at >= ?' : '';
    const areaQuery = `
      SELECT
        ${zoneExpr} AS zone,
        COUNT(DISTINCT CASE WHEN o.order_status IN (${statusPlaceholders}) ${dateSnippet} THEN o.id END) AS period_orders,
        SUM(CASE WHEN o.order_status IN (${statusPlaceholders}) ${dateSnippet} THEN o.grand_total ELSE 0 END) AS period_revenue,
        COALESCE(SUM(CASE WHEN o.order_status IN (${statusPlaceholders}) ${dateSnippet} THEN oi.quantity ELSE 0 END), 0) AS period_items_sold
      FROM order_addresses oa
      LEFT JOIN location_mappings lm ON lm.id = oa.location_mapping_id
      LEFT JOIN orders o ON oa.order_id = o.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE ${zoneExpr} IS NOT NULL
        AND ${zoneExpr} != ''
      GROUP BY ${zoneExpr}
      ORDER BY period_revenue DESC, period_orders DESC
      LIMIT ? OFFSET ?
    `;

    // Each of the 3 CASE blocks needs ACTIVE_STATUSES [+ dateParam]
    let queryParams = [];
    if (dateParam) {
      queryParams = [
        ...ACTIVE_STATUSES, dateParam,
        ...ACTIVE_STATUSES, dateParam,
        ...ACTIVE_STATUSES, dateParam,
        limit, offset
      ];
    } else {
      queryParams = [...ACTIVE_STATUSES, ...ACTIVE_STATUSES, ...ACTIVE_STATUSES, limit, offset];
    }

    const areas = await connection.query(areaQuery, queryParams);

    const result = areas.map(area => ({
      zone: area.zone,
      total_orders: parseInt(area.period_orders || 0),
      total_items_sold: parseInt(area.period_items_sold || 0),
      total_revenue: parseFloat(area.period_revenue || 0).toFixed(2),
    }));

    return {
      success: true,
      data: result,
      meta: {
        timeRange,
        count: result.length,
        limit,
        offset
      }
    };
  })
);


exports.getAccurateMonthlyStats = api(
  {
    query: {
      year: { type: "int", default: new Date().getFullYear() }
    }
  },
  auth(async (req, connection, adminInfo) => {


    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN"];
    if (!adminInfo.roles.some(role => ALLOWED_ROLES.includes(role))) {
      throw new errors.UNAUTHORIZED();
    }

    const { year } = req.typed.query;

    const current_year = new Date().getFullYear();

    if (year < 2022 || year > current_year) throw new errors.INVALID_PARAMETER(`Year must be between 2022 and ${current_year}`)


    const statsQuery = `
      SELECT 
        MONTH(o.placed_at) as month_num,
        SUM(o.grand_total) as revenue,
        SUM(
          o.grand_total 
          - COALESCE(item_costs.total_buying_cost, 0) 
          - COALESCE(oc.our_charge, 0)
        ) as profit
      FROM orders o
      /* Subquery to get total buying cost per order */
      LEFT JOIN (
        SELECT order_id, SUM(buying_price * quantity) as total_buying_cost
        FROM order_items
        GROUP BY order_id
      ) item_costs ON o.id = item_costs.order_id
      /* Join to get our actual courier cost */
      LEFT JOIN order_couriers oc ON o.id = oc.order_id
      WHERE YEAR(o.placed_at) = ?
        AND o.order_status IN ('approved', 'processing', 'packaging', 'shipped', 'out_for_delivery', 'delivered')
        AND o.deleted_at IS NULL
      GROUP BY MONTH(o.placed_at)
      ORDER BY month_num ASC
    `;

    const rawData = await connection.query(statsQuery, [year]);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const formattedData = monthNames.map((name, index) => {
      const monthData = rawData.find(d => d.month_num === index + 1);
      return {
        month: name,
        revenue: monthData ? parseFloat(monthData.revenue).toFixed(2) : "0.00",
        profit: monthData ? parseFloat(monthData.profit).toFixed(2) : "0.00"
      };
    });

    return {
      success: true,
      year: year,
      data: formattedData
    };
  })
);

// exports.getLowStockProducts = api(
//   {
//     query: {
//       limit: { type: "int", default: 20 },
//       offset: { type: "int", default: 0 }
//     }
//   },
//   auth(async (req, connection, adminInfo) => {
//     /** 1️⃣ Authorization */
//     const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"];
//     if (!adminInfo.roles.some(role => ALLOWED_ROLES.includes(role))) {
//       throw new errors.UNAUTHORIZED();
//     }

//     /** 2️⃣ Get the Alert Limit from System Config */
//     const configRows = await getConfig(connection, false, "product");
//     const alertRow = configRows.find(r => r.key_name === "PRODUCT_STOCK_ALERT_MIN_COUNT");

//     if (!alertRow || !alertRow.is_active) {
//       return { success: true, message: "Stock alert system is currently disabled", data: [], meta: { total: 0 } };
//     }

//     const stockLimit = Number(alertRow.value) || 0;

//     let { limit, offset } = req.typed.query;
//     limit = Math.min(Math.max(limit, 1), 50);
//     offset = Math.max(offset, 0);

//     /** 3️⃣ Fetch Total Count for Pagination */
//     const countResult = await connection.queryOne(`
//       SELECT COUNT(*) as total
//       FROM product_skus ps
//       JOIN products p ON ps.product_id = p.id
//       WHERE ps.stock <= ? 
//         AND ps.status = 1 
//         AND p.status = 1
//     `, [stockLimit]);

//     const total = countResult?.total || 0;

//     /** 4️⃣ Fetch Paginated Rows */
//     const lowStockQuery = `
//       SELECT 
//         p.id as product_id,
//         p.name as product_name,
//         ps.id as product_variation_id,
//         ps.sku,
//         ps.stock,
//         c.name as color_name,
//         v.name as variant_name
//       FROM product_skus ps
//       JOIN products p ON ps.product_id = p.id
//       LEFT JOIN colors c ON ps.color_id = c.id
//       LEFT JOIN variants v ON ps.variant_id = v.id
//       WHERE ps.stock <= ? 
//         AND ps.status = 1 
//         AND p.status = 1
//       ORDER BY ps.stock ASC
//       LIMIT ? OFFSET ?
//     `;

//     const rows = await connection.query(lowStockQuery, [stockLimit, limit, offset]);

//     /** 5️⃣ Format the Data */
//     const formattedData = rows.reduce((acc, row) => {
//       let product = acc.find(p => p.product_id === row.product_id);

//       if (!product) {
//         product = {
//           product_id: row.product_id,
//           name: row.product_name,
//           low_stock_variations: []
//         };
//         acc.push(product);
//       }

//       product.low_stock_variations.push({
//         product_variation_id: row.product_variation_id,
//         sku_code: row.sku,
//         color: row.color_name,
//         variant: row.variant_name,
//         current_stock: row.stock
//       });

//       return acc;
//     }, []);

//     return {
//       success: true,

//       total: total, // Total number of SKUs low on stock
//       limit,
//       offset,
//       alert_limit_used: stockLimit,

//       data: formattedData
//     };
//   })
// );

exports.getLowStockProducts = api(
  {
    query: {
      limit: { type: "int", default: 20 },
      offset: { type: "int", default: 0 }
    }
  },
  auth(async (req, connection, adminInfo) => {
    /** 1️⃣ Authorization */
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"];
    if (!adminInfo.roles.some(role => ALLOWED_ROLES.includes(role))) {
      throw new errors.UNAUTHORIZED();
    }

    /** 2️⃣ Get the Alert Limit from System Config */
    const configRows = await getConfig(connection, false, "product");
    const alertRow = configRows.find(r => r.key_name === "PRODUCT_STOCK_ALERT_MIN_COUNT");

    if (!alertRow || !alertRow.is_active) {
      return { success: true, message: "Stock alert system is currently disabled", data: [], meta: { total: 0 } };
    }

    const stockLimit = Number(alertRow.value) || 0;

    let { limit, offset } = req.typed.query;
    limit = Math.min(Math.max(limit, 1), 50);
    offset = Math.max(offset, 0);

    /** 3️⃣ Fetch Total Count for Pagination */
    const countResult = await connection.queryOne(`
      SELECT COUNT(*) as total
      FROM product_skus ps
      JOIN products p ON ps.product_id = p.id
      WHERE ps.stock <= ? 
        AND ps.status = 1 
        AND p.status = 1
    `, [stockLimit]);

    const total = countResult?.total || 0;

    /** 4️⃣ Fetch Paginated Rows (Added Subquery for last_updated) */
    const lowStockQuery = `
      SELECT 
        p.id as product_id,
        p.name as product_name,
        ps.id as product_variation_id,
        ps.sku,
        ps.stock,
        c.name as color_name,
        v.name as variant_name,
        (SELECT created_at FROM product_stock_logs WHERE sku_id = ps.id ORDER BY created_at DESC LIMIT 1) as last_updated
      FROM product_skus ps
      JOIN products p ON ps.product_id = p.id
      LEFT JOIN colors c ON ps.color_id = c.id
      LEFT JOIN variants v ON ps.variant_id = v.id
      WHERE ps.stock <= ? 
        AND ps.status = 1 
        AND p.status = 1
      ORDER BY ps.stock ASC
      LIMIT ? OFFSET ?
    `;

    const rows = await connection.query(lowStockQuery, [stockLimit, limit, offset]);

    /** 5️⃣ Format the Data */
    const formattedData = rows.reduce((acc, row) => {
      let product = acc.find(p => p.product_id === row.product_id);

      if (!product) {
        product = {
          product_id: row.product_id,
          name: row.product_name,
          low_stock_variations: []
        };
        acc.push(product);
      }

      product.low_stock_variations.push({
        product_variation_id: row.product_variation_id,
        sku_code: row.sku,
        color: row.color_name,
        variant: row.variant_name,
        current_stock: row.stock,
        last_updated: row.last_updated // New field included here
      });

      return acc;
    }, []);

    return {
      success: true,

      total: total, 
      limit,
      offset,
      alert_limit_used: stockLimit,

      data: formattedData
    };
  })
);


exports.getOrderOverview = api(
  {
    query: {
      startDate: { type: "string", required: false },
      endDate: { type: "string", required: false }
    }
  },
  auth(async (req, connection, adminInfo) => {
    /** 1️⃣ Authorization */
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"];
    if (!adminInfo.roles.some(role => ALLOWED_ROLES.includes(role))) {
      throw new errors.UNAUTHORIZED();
    }

    const { startDate, endDate } = req.typed.query;
    let params = [];
    let dateFilter = "WHERE deleted_at IS NULL";

    /** 2️⃣ Date Validation */
    if (startDate && !validator.isISO8601(startDate)) {
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid start date format (YYYY-MM-DD).");
    }
    if (endDate && !validator.isISO8601(endDate)) {
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid end date format (YYYY-MM-DD).");
    }

    /** 3️⃣ Flexible Filter Building */
    if (startDate) {
      dateFilter += " AND created_at >= ?";
      params.push(`${startDate} 00:00:00`);
    }
    if (endDate) {
      dateFilter += " AND created_at <= ?";
      params.push(`${endDate} 23:59:59`);
    }

    /** 4️⃣ Order Statistics (Conditional Aggregation) */
    const orderStats = await connection.queryOne(`
      SELECT 
        COUNT(CASE WHEN order_status IN ('approved','processing','packaging','shipped','out_for_delivery') THEN 1 END) as order_processing,
        COUNT(CASE WHEN order_status = 'delivered' THEN 1 END) as order_processed,
        COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid_orders,
        COUNT(CASE WHEN payment_status IN ('unpaid', 'partial_paid') THEN 1 END) as unpaid_orders,
        COUNT(CASE WHEN order_status = 'cancelled' THEN 1 END) as cancelled_orders,
        COUNT(CASE WHEN order_status IN ('returned', 'trash') THEN 1 END) as returned_orders
      FROM orders
      ${dateFilter}
    `, params);

    /** 5️⃣ Product & Stock Statistics (Real-time Snapshot) */
    const productStats = await connection.queryOne(`
      SELECT 
        COUNT(CASE WHEN status = 0 THEN 1 END) as inactive_products,
        (
          SELECT COUNT(*) FROM products p 
          WHERE p.status = 1 AND NOT EXISTS (
            SELECT 1 FROM product_skus ps 
            WHERE ps.product_id = p.id AND ps.stock > 0 AND ps.status = 1
          )
        ) as stock_out_products
      FROM products
    `);

    /** 6️⃣ Format Timeframe Label */
    let timeframeLabel = "All Time";
    if (startDate && endDate) timeframeLabel = `${startDate} to ${endDate}`;
    else if (startDate) timeframeLabel = `From ${startDate} onwards`;
    else if (endDate) timeframeLabel = `Up to ${endDate}`;

    return {
      success: true,

      timeframe: timeframeLabel,

      data: {
        orders: {
          order_processing: Number(orderStats.order_processing) || 0,
          order_processed: Number(orderStats.order_processed) || 0,
          paid_orders: Number(orderStats.paid_orders) || 0,
          unpaid_orders: Number(orderStats.unpaid_orders) || 0,
          cancelled_orders: Number(orderStats.cancelled_orders) || 0,
          returned_orders: Number(orderStats.returned_orders) || 0
        },
        inventory: {
          inactive_products: Number(productStats.inactive_products) || 0,
          stock_out_products: Number(productStats.stock_out_products) || 0
        }
      }
    };
  })
);



// exports.getOrderDashboardStats = api(
//   {
//     query: {
//       startDate: { type: "string", required: false },
//       endDate: { type: "string", required: false }
//     }
//   },
//   auth(async (req, connection, adminInfo) => {
//     /** 1️⃣ Authorization */
//     const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"];
//     if (!adminInfo.roles.some(role => ALLOWED_ROLES.includes(role))) {
//       throw new errors.UNAUTHORIZED();
//     }

//     const { startDate, endDate } = req.typed.query;
//     let params = [];
//     let dateFilter = "WHERE deleted_at IS NULL";

//     /** 2️⃣ Date Validation */
//     if (startDate && !validator.isISO8601(startDate)) {
//       throw new errors.INVALID_FIELDS_PROVIDED("Invalid start date format (YYYY-MM-DD).");
//     }
//     if (endDate && !validator.isISO8601(endDate)) {
//       throw new errors.INVALID_FIELDS_PROVIDED("Invalid end date format (YYYY-MM-DD).");
//     }

//     /** 3️⃣ Build Dynamic Filter */
//     if (startDate) {
//       dateFilter += " AND created_at >= ?";
//       params.push(`${startDate} 00:00:00`);
//     }
//     if (endDate) {
//       dateFilter += " AND created_at <= ?";
//       params.push(`${endDate} 23:59:59`);
//     }

//     /** 4️⃣ Execute Single-Pass Aggregation */
//     const stats = await connection.queryOne(`
//       SELECT 
//         /* Order Status Counts */
//         COUNT(CASE WHEN order_status = 'new' THEN 1 END) as status_new,
//         COUNT(CASE WHEN order_status = 'approved' THEN 1 END) as status_approved,
//         COUNT(CASE WHEN order_status = 'processing' THEN 1 END) as status_processing,
//         COUNT(CASE WHEN order_status = 'packaging' THEN 1 END) as status_packaging,
//         COUNT(CASE WHEN order_status = 'shipped' THEN 1 END) as status_shipped,
//         COUNT(CASE WHEN order_status = 'out_for_delivery' THEN 1 END) as status_out_for_delivery,
//         COUNT(CASE WHEN order_status = 'delivered' THEN 1 END) as status_delivered,
//         COUNT(CASE WHEN order_status = 'returned' THEN 1 END) as status_returned,
//         COUNT(CASE WHEN order_status = 'cancelled' THEN 1 END) as status_cancelled,
//         COUNT(CASE WHEN order_status = 'on_hold' THEN 1 END) as status_on_hold,
//         COUNT(CASE WHEN order_status = 'trash' THEN 1 END) as status_trash,

//         /* Payment Status Counts */
//         COUNT(CASE WHEN payment_status = 'unpaid' THEN 1 END) as pay_unpaid,
//         COUNT(CASE WHEN payment_status = 'partial_paid' THEN 1 END) as pay_partial,
//         COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as pay_paid,

//         /* Payment Type Counts */
//         COUNT(CASE WHEN payment_type = 'cod' THEN 1 END) as type_cod,
//         COUNT(CASE WHEN payment_type = 'gateway' THEN 1 END) as type_gateway,
//         COUNT(CASE WHEN payment_type = 'mixed' THEN 1 END) as type_mixed,

//         /* Totals */
//         COUNT(*) as total_orders,
//         SUM(grand_total) as total_value
//       FROM orders
//       ${dateFilter}
//     `, params);

//     /** 5️⃣ Meta Labeling */
//     let timeframeLabel = "All Time";
//     if (startDate && endDate) timeframeLabel = `${startDate} to ${endDate}`;
//     else if (startDate) timeframeLabel = `From ${startDate} onwards`;
//     else if (endDate) timeframeLabel = `Up to ${endDate}`;



//     return {
//       success: true,
//       meta: {
//         timeframe: timeframeLabel,
//         total_records: Number(stats.total_orders) || 0,
//         total_grand_total: Number(stats.total_value) || 0
//       },
//       data: {
//         order_status: {
//           new: Number(stats.status_new) || 0,
//           approved: Number(stats.status_approved) || 0,
//           processing: Number(stats.status_processing) || 0,
//           packaging: Number(stats.status_packaging) || 0,
//           shipped: Number(stats.status_shipped) || 0,
//           out_for_delivery: Number(stats.status_out_for_delivery) || 0,
//           delivered: Number(stats.status_delivered) || 0,
//           returned: Number(stats.status_returned) || 0,
//           cancelled: Number(stats.status_cancelled) || 0,
//           on_hold: Number(stats.status_on_hold) || 0,
//           trash: Number(stats.status_trash) || 0
//         },
//         payment_status: {
//           unpaid: Number(stats.pay_unpaid) || 0,
//           partial_paid: Number(stats.pay_partial) || 0,
//           paid: Number(stats.pay_paid) || 0
//         },
//         payment_methods: {
//           cod: Number(stats.type_cod) || 0,
//           gateway: Number(stats.type_gateway) || 0,
//           mixed: Number(stats.type_mixed) || 0
//         }
//       }
//     };
//   })
// );
 

exports.getOrderDashboardStats = api(
  {
    query: {
      startDate: { type: "string", required: false },
      endDate: { type: "string", required: false }
    }
  },
  auth(async (req, connection, adminInfo) => {
    /** 1️⃣ Authorization */
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"];
    if (!adminInfo.roles.some(role => ALLOWED_ROLES.includes(role))) {
      throw new errors.UNAUTHORIZED();
    }

    const { startDate, endDate } = req.typed.query;
    let params = [];
    let dateFilter = "WHERE deleted_at IS NULL";

    /** 2️⃣ Date Validation */
    if (startDate && !validator.isISO8601(startDate)) {
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid start date format (YYYY-MM-DD).");
    }
    if (endDate && !validator.isISO8601(endDate)) {
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid end date format (YYYY-MM-DD).");
    }

    /** 3️⃣ Build Dynamic Filter */
    if (startDate) {
      dateFilter += " AND created_at >= ?";
      params.push(`${startDate} 00:00:00`);
    }
    if (endDate) {
      dateFilter += " AND created_at <= ?";
      params.push(`${endDate} 23:59:59`);
    }

    /** 4️⃣ Execute Single-Pass Aggregation */
    const stats = await connection.queryOne(`
      SELECT 
        /* Order Status Counts */
        COUNT(CASE WHEN order_status = 'new' THEN 1 END) as status_new,
        COUNT(CASE WHEN order_status = 'approved' THEN 1 END) as status_approved,
        COUNT(CASE WHEN order_status = 'processing' THEN 1 END) as status_processing,
        COUNT(CASE WHEN order_status = 'packaging' THEN 1 END) as status_packaging,
        COUNT(CASE WHEN order_status = 'shipped' THEN 1 END) as status_shipped,
        COUNT(CASE WHEN order_status = 'out_for_delivery' THEN 1 END) as status_out_for_delivery,
        COUNT(CASE WHEN order_status = 'delivered' THEN 1 END) as status_delivered,
        COUNT(CASE WHEN order_status = 'returned' THEN 1 END) as status_returned,
        COUNT(CASE WHEN order_status = 'cancelled' THEN 1 END) as status_cancelled,
        COUNT(CASE WHEN order_status = 'on_hold' THEN 1 END) as status_on_hold,
        COUNT(CASE WHEN order_status = 'trash' THEN 1 END) as status_trash,

        /* Payment Status Counts */
        COUNT(CASE WHEN payment_status = 'unpaid' THEN 1 END) as pay_unpaid,
        COUNT(CASE WHEN payment_status = 'partial_paid' THEN 1 END) as pay_partial,
        COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as pay_paid,

        /* Payment Type Counts */
        COUNT(CASE WHEN payment_type = 'cod' THEN 1 END) as type_cod,
        COUNT(CASE WHEN payment_type = 'gateway' THEN 1 END) as type_gateway,
        COUNT(CASE WHEN payment_type = 'mixed' THEN 1 END) as type_mixed,

        /* Totals */
        COUNT(*) as total_orders,
        SUM(grand_total) as total_value,

        /* Extra Meta Properties */
        SUM(CASE WHEN order_status = 'delivered' THEN grand_total ELSE 0 END) as total_delivered_order_grandtotal,
        SUM(CASE WHEN order_status = 'delivered' THEN (
          (SELECT SUM((item.selling_price * item.quantity) - (item.buying_price * item.quantity) - item.discount - item.coupon_discount) 
           FROM order_items item WHERE item.order_id = orders.id) + 
          (SELECT IFNULL(oc.customer_charge - oc.our_charge, 0) FROM order_couriers oc WHERE oc.order_id = orders.id)
        ) ELSE 0 END) as total_delivered_order_profit

      FROM orders
      ${dateFilter}
    `, params);

    /** 5️⃣ Meta Labeling */
    let timeframeLabel = "All Time";
    if (startDate && endDate) timeframeLabel = `${startDate} to ${endDate}`;
    else if (startDate) timeframeLabel = `From ${startDate} onwards`;
    else if (endDate) timeframeLabel = `Up to ${endDate}`;

    return {
      success: true,
      meta: {
        timeframe: timeframeLabel,
        total_records: Number(stats.total_orders) || 0,
        total_grand_total: Number(stats.total_value) || 0,
        total_delivered_order_grandtotal: Number(stats.total_delivered_order_grandtotal) || 0,
        total_delivered_order_profit: Number(stats.total_delivered_order_profit) || 0
      },
      data: {
        order_status: {
          new: Number(stats.status_new) || 0,
          approved: Number(stats.status_approved) || 0,
          processing: Number(stats.status_processing) || 0,
          packaging: Number(stats.status_packaging) || 0,
          shipped: Number(stats.status_shipped) || 0,
          out_for_delivery: Number(stats.status_out_for_delivery) || 0,
          delivered: Number(stats.status_delivered) || 0,
          returned: Number(stats.status_returned) || 0,
          cancelled: Number(stats.status_cancelled) || 0,
          on_hold: Number(stats.status_on_hold) || 0,
          trash: Number(stats.status_trash) || 0
        },
        payment_status: {
          unpaid: Number(stats.pay_unpaid) || 0,
          partial_paid: Number(stats.pay_partial) || 0,
          paid: Number(stats.pay_paid) || 0
        },
        payment_methods: {
          cod: Number(stats.type_cod) || 0,
          gateway: Number(stats.type_gateway) || 0,
          mixed: Number(stats.type_mixed) || 0
        }
      }
    };
  })
);

exports.getYearlyOrderComparison = api(
  {},
  auth(async (req, connection, adminInfo) => {
    /** 1️⃣ Authorization */
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"];
    if (!adminInfo.roles.some(role => ALLOWED_ROLES.includes(role))) {
      throw new errors.UNAUTHORIZED();
    }

    const currentYear = new Date().getFullYear();
    const lastYear = currentYear - 1;
    const beforeLastYear = currentYear - 2;

    /** 2️⃣ SQL Query with Conditional Aggregation */
    // We filter for successful/active order statuses as requested
    const comparisonQuery = `
      SELECT 
        MONTH(placed_at) as month_num,
        COUNT(CASE WHEN YEAR(placed_at) = ? THEN 1 END) as current_yr,
        COUNT(CASE WHEN YEAR(placed_at) = ? THEN 1 END) as last_yr,
        COUNT(CASE WHEN YEAR(placed_at) = ? THEN 1 END) as before_last_yr
      FROM orders
      WHERE order_status IN ('approved', 'processing', 'packaging', 'shipped', 'out_for_delivery', 'delivered')
        AND YEAR(placed_at) IN (?, ?, ?)
        AND deleted_at IS NULL
      GROUP BY month_num
      ORDER BY month_num ASC
    `;

    const rawData = await connection.query(comparisonQuery, [
      currentYear, lastYear, beforeLastYear, // For the CASE statements
      currentYear, lastYear, beforeLastYear  // For the WHERE filter
    ]);

    /** 3️⃣ Formatting for Chart Compatibility */
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const data = monthNames.map((name, index) => {
      const monthIndex = index + 1;
      const match = rawData.find(r => r.month_num === monthIndex);

      return {
        month: name,
        current_year: match ? Number(match.current_yr) : 0,
        last_year: match ? Number(match.last_yr) : 0,
        before_last_year: match ? Number(match.before_last_yr) : 0
      };
    });



    return {
      success: true,
      meta: {
        years: {
          current: currentYear,
          last: lastYear,
          before_last: beforeLastYear
        },
        status_filtered: ['approved', 'processing', 'packaging', 'shipped', 'out_for_delivery', 'delivered']
      },
      data: data
    };
  })
);


exports.getOrderReport = api(
  {
    query: {
      limit: { type: "int", default: 20 },
      offset: { type: "int", default: 0 },
      startDate: { type: "string", required: false },
      endDate: { type: "string", required: false },
      order_type: { type: "string", required: false }, // Added
      order_status: { type: "string", required: false },
      payment_status: { type: "string", required: false },
      payment_type: { type: "string", required: false },
      search: { type: "string", required: false }
    }
  },
  auth(async (req, connection, adminInfo) => {
    /** 1️⃣ Authorization */
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"];
    if (!adminInfo.roles.some(role => ALLOWED_ROLES.includes(role))) {
      throw new errors.UNAUTHORIZED();
    }

    const q = req.typed.query;

    /** 2️⃣ Strict Validations */
    if (q.order_type && !['regular', 'guest', 'admin_regular', 'admin_stranger', 'single_page'].includes(q.order_type))
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid order type");

    if (q.order_status && ![
      'new', 'approved', 'processing', 'packaging', 'shipped',
      'out_for_delivery', 'delivered', 'returned', 'cancelled', 'on_hold', 'trash'
    ].includes(q.order_status))
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid order status");

    if (q.payment_status && !['unpaid', 'partial_paid', 'paid'].includes(q.payment_status))
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid payment status");

    if (q.payment_type && !['gateway', 'cod', 'mixed'].includes(q.payment_type))
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid payment type");

    if (q.startDate && !validator.isISO8601(q.startDate))
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid start date format");

    if (q.endDate && !validator.isISO8601(q.endDate))
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid end date format");

    /** 3️⃣ Filter Construction */
    let filters = ["o.deleted_at IS NULL"];
    let params = [];

    if (q.startDate) {
      filters.push("o.created_at >= ?");
      params.push(`${q.startDate} 00:00:00`);
    }
    if (q.endDate) {
      filters.push("o.created_at <= ?");
      params.push(`${q.endDate} 23:59:59`);
    }
    if (q.order_type) {
      filters.push("o.order_type = ?");
      params.push(q.order_type);
    }
    if (q.order_status) {
      filters.push("o.order_status = ?");
      params.push(q.order_status);
    }
    if (q.payment_status) {
      filters.push("o.payment_status = ?");
      params.push(q.payment_status);
    }
    if (q.payment_type) {
      filters.push("o.payment_type = ?");
      params.push(q.payment_type);
    }
    if (q.search) {
      filters.push("(o.customer_name LIKE ? OR o.customer_phone LIKE ? OR o.customer_email LIKE ? OR o.id LIKE ?)");
      const term = `%${q.search}%`;
      params.push(term, term, term, term);
    }

    const whereClause = `WHERE ${filters.join(" AND ")}`;

    /** 4️⃣ Data Fetching */
    const reportQuery = `
      SELECT 
        o.id as order_id,
        o.order_type,
        o.customer_name,
        o.customer_phone,
        o.customer_email,
        o.grand_total,
        o.paid_amount,
        o.due_amount,
        o.order_status,
        o.payment_status,
        o.payment_type,
        o.placed_at, o.paid_at, o.shipped_at, o.delivered_at, o.cancelled_at,
        o.created_at, o.updated_at,
        oa.full_address, oa.city,
        (SELECT SUM(quantity) FROM order_items WHERE order_id = o.id) as item_count,
        ((SELECT SUM(buying_price * quantity) FROM order_items WHERE order_id = o.id) + COALESCE(oc.our_charge, 0)) as total_cost
      FROM orders o
      LEFT JOIN order_addresses oa ON o.id = oa.order_id
      LEFT JOIN order_couriers oc ON o.id = oc.order_id
      ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const countQuery = `SELECT COUNT(*) as total FROM orders o ${whereClause}`;

    const [rows, countRes] = await Promise.all([
      connection.query(reportQuery, [...params, q.limit, q.offset]),
      connection.queryOne(countQuery, params)
    ]);

    return {
      success: true,
      meta: {
        total: countRes?.total || 0,
        limit: q.limit,
        offset: q.offset
      },
      data: rows.map(row => ({
        ...row,
        item_count: Number(row.item_count) || 0,
        total_cost: Number(row.total_cost || 0).toFixed(2),
        profit: (Number(row.grand_total) - Number(row.total_cost || 0)).toFixed(2)
      }))
    };
  })
);


 
exports.getVisitorReport = api(
  {},
  auth(async (req, connection, adminInfo) => {
    /** 1️⃣ Authorization */
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN","CATALOG_MANAGER"];
    if (!adminInfo.roles.some(role => ALLOWED_ROLES.includes(role))) {
      throw new errors.UNAUTHORIZED();
    }

    const now = new Date();
    // Live threshold: 15 minutes
    const liveThreshold = new Date(now.getTime() - 15 * 60000);

    /** 2️⃣ Optimized Analytics Query */
    // Since uniq_daily_page_view handles daily uniqueness, we don't need DISTINCT for daily stats.
    // However, for Week/Month/Year stats, we use DISTINCT(ip_address) because an IP 
    // might visit on multiple different dates within that range.
    const stats = await connection.queryOne(`
      SELECT 
        /* Active Now: Unique IPs across any page in last 15 mins */
        COUNT(DISTINCT ip_address) as active_now,

        /* Today: Simple count because UNIQUE KEY handles 1 IP per day */
        (SELECT COUNT(*) FROM page_view_logs WHERE view_date = CURDATE()) as today,

        /* Yesterday */
        (SELECT COUNT(*) FROM page_view_logs WHERE view_date = DATE_SUB(CURDATE(), INTERVAL 1 DAY)) as yesterday,

        /* This Week (Unique IPs this week) */
        (SELECT COUNT(DISTINCT ip_address) FROM page_view_logs 
         WHERE viewed_at >= STR_TO_DATE(CONCAT(YEARWEEK(CURDATE(), 1), ' Monday'), '%X%V %W')) as this_week,

        /* Last Week */
        (SELECT COUNT(DISTINCT ip_address) FROM page_view_logs 
         WHERE YEARWEEK(view_date, 1) = YEARWEEK(CURDATE(), 1) - 1) as last_week,

        /* This Month */
        (SELECT COUNT(DISTINCT ip_address) FROM page_view_logs 
         WHERE MONTH(view_date) = MONTH(CURDATE()) AND YEAR(view_date) = YEAR(CURDATE())) as this_month,

        /* Last Month */
        (SELECT COUNT(DISTINCT ip_address) FROM page_view_logs 
         WHERE view_date >= LAST_DAY(CURRENT_DATE - INTERVAL 2 MONTH) + INTERVAL 1 DAY 
         AND view_date <= LAST_DAY(CURRENT_DATE - INTERVAL 1 MONTH)) as last_month,

        /* This Year */
        (SELECT COUNT(DISTINCT ip_address) FROM page_view_logs 
         WHERE YEAR(view_date) = YEAR(CURDATE())) as this_year,

        /* Last Year */
        (SELECT COUNT(DISTINCT ip_address) FROM page_view_logs 
         WHERE YEAR(view_date) = YEAR(CURDATE()) - 1) as last_year

      FROM page_view_logs
      WHERE viewed_at >= ?
    `, [liveThreshold]);

    /** 3️⃣ Calculate Growth */
    const todayCount = Number(stats.today) || 0;
    const yesterdayCount = Number(stats.yesterday) || 0;
    let dailyGrowth = "0%";
    if (yesterdayCount > 0) {
        dailyGrowth = (((todayCount - yesterdayCount) / yesterdayCount) * 100).toFixed(2) + "%";
    }

    return {
      success: true,
      data: {
        active_now: Number(stats.active_now) || 0,
        daily: {
          today: todayCount,
          yesterday: yesterdayCount,
          growth: dailyGrowth
        },
        weekly: {
          this_week: Number(stats.this_week) || 0,
          last_week: Number(stats.last_week) || 0
        },
        monthly: {
          this_month: Number(stats.this_month) || 0,
          last_month: Number(stats.last_month) || 0
        },
        yearly: {
          this_year: Number(stats.this_year) || 0,
          last_year: Number(stats.last_year) || 0
        }
      },
      meta: {
        generated_at: now,
        live_definition: "Unique IP addresses active within the last 15 minutes"
      }
    };
  })
);


 
exports.getDailyVisitorTrend = api(
  {
    query: {
      startDate: { type: "string", required: true },
      endDate: { type: "string", required: true }
    }
  },
  auth(async (req, connection, adminInfo) => {
    /** 1️⃣ Authorization */
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN","CATALOG_MANAGER"];
    if (!adminInfo.roles.some(role => ALLOWED_ROLES.includes(role))) {
      throw new errors.UNAUTHORIZED();
    }

    const { startDate, endDate } = req.typed.query;

    /** 2️⃣ Date Validation */
    if (!validator.isISO8601(startDate) || !validator.isISO8601(endDate)) {
        throw new errors.INVALID_FIELDS_PROVIDED("Invalid date format. Please use YYYY-MM-DD.");
    }

    /** 3️⃣ Fetch Daily Unique Visitors */
    // We use DISTINCT(ip_address) in case a user visits multiple DIFFERENT pages 
    // (e.g. 'landing' and 'product') on the same day. 
    // They should only count as 1 daily visitor.
    const rows = await connection.query(`
      SELECT 
        view_date as date,
        COUNT(DISTINCT ip_address) as visitor_count
      FROM page_view_logs
      WHERE view_date BETWEEN ? AND ?
      GROUP BY view_date
      ORDER BY view_date ASC
    `, [startDate, endDate]);

    /** 4️⃣ Fill Missing Dates (Zero-Filling) */
    // If no one visits on a Tuesday, SQL won't return that row. 
    // This logic ensures the frontend gets a continuous line for the chart.
    const start = new Date(startDate);
    const end = new Date(endDate);
    const result = [];
    
    // Create a lookup map for the SQL results
    const dataMap = new Map(rows.map(r => [
        r.date instanceof Date ? r.date.toISOString().split('T')[0] : r.date, 
        r.visitor_count
    ]));

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      result.push({
        date: dateStr,
        visitors: Number(dataMap.get(dateStr)) || 0
      });
    }

    return {
      success: true,
      meta: {
        startDate,
        endDate,
        total_days: result.length,
        total_unique_visitors: rows.reduce((sum, r) => sum + Number(r.visitor_count), 0)
      },
      data: result
    };
  })
);


 
exports.getTopViewedProductsReport = api(
  {
    query: {
      startDate: { type: "string", required: false },
      endDate: { type: "string", required: false },
      limit: { type: "int", default: 20 },
      offset: { type: "int", default: 0 },
    }
  },
  auth(async (req, connection, adminInfo) => {
    /** 1️⃣ Authorization */
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"];
    if (!adminInfo.roles.some(role => ALLOWED_ROLES.includes(role))) {
      throw new errors.UNAUTHORIZED();
    }

    let { limit, offset, startDate, endDate } = req.typed.query;
    limit = Math.min(Math.max(limit, 1), 100);
    offset = Math.max(offset, 0);

    let queryParams = [];
    let dateFilter = "WHERE p.status = 1";

    /** 2️⃣ Date Validation & Filter Building */
    if (startDate) {
      if (!validator.isISO8601(startDate)) throw new errors.INVALID_FIELDS_PROVIDED("Invalid startDate");
      dateFilter += " AND pvl.viewed_at >= ?";
      queryParams.push(`${startDate} 00:00:00`);
    }

    if (endDate) {
      if (!validator.isISO8601(endDate)) throw new errors.INVALID_FIELDS_PROVIDED("Invalid endDate");
      dateFilter += " AND pvl.viewed_at <= ?";
      queryParams.push(`${endDate} 23:59:59`);
    }

    /** 3️⃣ Count Total Unique Products Viewed in Range */
    const countResult = await connection.queryOne(`
      SELECT COUNT(DISTINCT pvl.product_id) as total 
      FROM product_view_logs pvl
      JOIN products p ON pvl.product_id = p.id
      ${dateFilter}
    `, queryParams);

    const totalCount = countResult?.total || 0;

    /** 4️⃣ Fetch Ranked Products */
    // We join product_view_logs with products to get details and rank by hit frequency
    const products = await connection.query(`
      SELECT 
        p.id, 
        p.name, 
        p.slug,
        COUNT(pvl.id) as range_view_count,
        MAX(pvl.viewed_at) as last_viewed_at,
        COALESCE(p.face_image, (SELECT img_path FROM product_images WHERE product_id = p.id ORDER BY serial ASC, id ASC LIMIT 1)) as image,
        (SELECT MIN(ps.selling_price) FROM product_skus ps WHERE ps.product_id = p.id AND ps.status = 1) as price
      FROM product_view_logs pvl
      INNER JOIN products p ON pvl.product_id = p.id
      ${dateFilter}
      GROUP BY p.id
      ORDER BY range_view_count DESC
      LIMIT ? OFFSET ?
    `, [...queryParams, limit, offset]);

    return {
      success: true,
      meta: {
        total: totalCount,
        limit,
        offset,
        startDate: startDate || "Beginning of logs",
        endDate: endDate || "Today"
      },
      data: products.map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        view_count: Number(p.range_view_count) || 0,
        image: p.image || null,
        min_price: Number(p.price) || 0,
        last_viewed: p.last_viewed_at
      }))
    };
  })
);


// exports.getProductDashboardSummery = api(
//   {},
//   auth(async (req, connection, adminInfo) => {
//     /** 1️⃣ Authorization check */
//     const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"];
//     if (!adminInfo.roles.some(role => ALLOWED_ROLES.includes(role))) {
//       throw new errors.UNAUTHORIZED();
//     }

//     /** 2️⃣ Fetch Stock Alert Limit from System Config */
//     // Using your getConfig logic pattern
//     const configs = await getConfig(connection, false, "product");
//     let alertLimit = 0;
//     let isAlertActive = false;

//     for (const row of configs) {
//       if (row.key_name === "PRODUCT_STOCK_ALERT_MIN_COUNT") {
//         isAlertActive = Boolean(row.is_active);
//         alertLimit = Number(row.value) || 0;
//       }
//     }

//     /** 3️⃣ SQL Logic for Product Counts */
//     // Base filter for "Active" products following the hierarchy
//     const activeProductFilter = `
//       p.status = 1 
//       AND mc.status = 1 
//       AND (p.sub_category_id IS NULL OR sc.status = 1) 
//       AND (p.child_category_id IS NULL OR cc.status = 1)
//     `;

//     const statsQuery = `
//       SELECT 
//         -- Total Active Products
//         COUNT(DISTINCT p.id) as total_active_products,

//         -- Products where ANY variation is <= alert limit
//         COUNT(DISTINCT CASE 
//           WHEN ${isAlertActive} = 1 AND s.min_stock <= ? THEN p.id 
//           ELSE NULL 
//         END) as low_stock_products,

//         -- Products where ALL variations are > alert limit
//         COUNT(DISTINCT CASE 
//           WHEN ${isAlertActive} = 1 AND s.min_stock > ? THEN p.id 
//           ELSE NULL 
//         END) as healthy_stock_products

//       FROM products p
//       INNER JOIN main_categories mc ON p.main_category_id = mc.id
//       LEFT JOIN sub_categories sc ON p.sub_category_id = sc.id
//       LEFT JOIN child_categories cc ON p.child_category_id = cc.id
//       INNER JOIN (
//         SELECT product_id, MIN(stock) as min_stock 
//         FROM product_skus 
//         WHERE status = 1 
//         GROUP BY product_id
//       ) s ON p.id = s.product_id
//       WHERE ${activeProductFilter}
//     `;

//     /** 4️⃣ SQL Logic for Category Counts */
//     const categoryQuery = `
//       SELECT 
//         (SELECT COUNT(*) FROM main_categories WHERE status = 1) as main_categories,
//         (SELECT COUNT(*) FROM sub_categories WHERE status = 1) as sub_categories,
//         (SELECT COUNT(*) FROM child_categories WHERE status = 1) as child_categories
//     `;

//     const [productStats, catStats] = await Promise.all([
//       connection.queryOne(statsQuery, [alertLimit, alertLimit]),
//       connection.queryOne(categoryQuery)
//     ]);

//     return {
//       success: true,
//       stock_alert_config: {
//         active: isAlertActive,
//         limit: alertLimit
//       },
//       data: {
//         product: {
//           total_active: productStats.total_active_products || 0,
//           under_limit_stock: productStats.low_stock_products || 0,
//           above_limit_stock: productStats.healthy_stock_products || 0
//         },
//         categories: {
//           main: catStats.main_categories || 0,
//           sub: catStats.sub_categories || 0,
//           child: catStats.child_categories || 0
//         }
//       }
//     };
//   })
// );
exports.getProductDashboardSummery = api(
  {},
  auth(async (req, connection, adminInfo) => {
    /** 1️⃣ Authorization check */
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"];
    if (!adminInfo.roles.some(role => ALLOWED_ROLES.includes(role))) {
      throw new errors.UNAUTHORIZED();
    }

    /** 2️⃣ Fetch Stock Alert Limit from System Config */
    const configs = await getConfig(connection, false, "product");
    let alertLimit = 0;
    let isAlertActive = false;

    for (const row of configs) {
      if (row.key_name === "PRODUCT_STOCK_ALERT_MIN_COUNT") {
        isAlertActive = Boolean(row.is_active);
        alertLimit = Number(row.value) || 0;
      }
    }

    /** 3️⃣ SQL Logic for Product, Stock & Inventory Value */
    const activeProductFilter = `
      p.status = 1 
      AND mc.status = 1 
      AND (p.sub_category_id IS NULL OR sc.status = 1) 
      AND (p.child_category_id IS NULL OR cc.status = 1)
    `;

    const statsQuery = `
      SELECT 
        -- Product Counts
        COUNT(DISTINCT CASE WHEN ${activeProductFilter} THEN p.id END) as active_count,
        COUNT(DISTINCT CASE WHEN NOT (${activeProductFilter}) THEN p.id END) as inactive_count,
        COUNT(DISTINCT CASE WHEN ${activeProductFilter} AND ${isAlertActive} = 1 AND s.min_stock <= ? THEN p.id END) as low_stock_count,
        COUNT(DISTINCT CASE WHEN ${activeProductFilter} AND ${isAlertActive} = 1 AND s.min_stock > ? THEN p.id END) as healthy_stock_count,

        -- Valuation (Buying Price * Stock and Selling Price * Stock)
        SUM(CASE WHEN ${activeProductFilter} THEN s.total_buying_val ELSE 0 END) as total_buying_price,
        SUM(CASE WHEN ${activeProductFilter} THEN s.total_selling_val ELSE 0 END) as total_selling_price

      FROM products p
      INNER JOIN main_categories mc ON p.main_category_id = mc.id
      LEFT JOIN sub_categories sc ON p.sub_category_id = sc.id
      LEFT JOIN child_categories cc ON p.child_category_id = cc.id
      LEFT JOIN (
        SELECT 
            product_id, 
            MIN(stock) as min_stock,
            SUM(buying_price * stock) as total_buying_val,
            SUM(selling_price * stock) as total_selling_val
        FROM product_skus 
        WHERE status = 1 
        GROUP BY product_id
      ) s ON p.id = s.product_id
    `;

    /** 4️⃣ SQL Logic for Categories & Coupons */
    const miscStatsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM main_categories WHERE status = 1) as main_categories,
        (SELECT COUNT(*) FROM sub_categories WHERE status = 1) as sub_categories,
        (SELECT COUNT(*) FROM child_categories WHERE status = 1) as child_categories,
        (SELECT COUNT(*) FROM coupons WHERE status = 1 AND NOW() BETWEEN start_date AND expire_date AND deleted_at IS NULL) as active_coupons
    `;

    const [productStats, miscStats] = await Promise.all([
      connection.queryOne(statsQuery, [alertLimit, alertLimit]),
      connection.queryOne(miscStatsQuery)
    ]);

    return {
      success: true,
      stock_alert_config: {
        active: isAlertActive,
        limit: alertLimit
      },
      data: {
        product_status: {
          total_active: Number(productStats.active_count) || 0,
          total_inactive: Number(productStats.inactive_count) || 0,
          under_limit_stock: Number(productStats.low_stock_count) || 0,
          above_limit_stock: Number(productStats.healthy_stock_count) || 0
        },
        inventory_valuation: {
          total_buying_value: Number(productStats.total_buying_price || 0).toFixed(2),
          total_selling_value: Number(productStats.total_selling_price || 0).toFixed(2)
        },
        categories: {
          main: Number(miscStats.main_categories) || 0,
          sub: Number(miscStats.sub_categories) || 0,
          child: Number(miscStats.child_categories) || 0
        },
        coupons: {
          active: Number(miscStats.active_coupons) || 0
        }
      }
    };
  })
);

// exports.getCategorySalesAnalytics = api(
//   {
//     query: {
//       startDate: { type: "string", required: false },
//       endDate: { type: "string", required: false },
//       limit: { type: "int", default: 10 },
//       offset: { type: "int", default: 0 }
//     }
//   },
//   auth(async (req, connection, adminInfo) => {
//     /** 1️⃣ Authorization */
//     const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"];
//     if (!adminInfo.roles.some(role => ALLOWED_ROLES.includes(role))) {
//       throw new errors.UNAUTHORIZED();
//     }

//     const q = req.typed.query;

//   if (q.startDate && !validator.isISO8601(q.startDate)) {
//       throw new errors.INVALID_FIELDS_PROVIDED("Invalid start date format (YYYY-MM-DD).");
//     }
//     if (q.endDate && !validator.isISO8601(q.endDate)) {
//       throw new errors.INVALID_FIELDS_PROVIDED("Invalid end date format (YYYY-MM-DD).");
//     }

//     const limit = Math.min(Math.max(q.limit, 1), 50);
//     const offset = Math.max(q.offset, 0);

//     /** 2️⃣ Date Range & Timeframe Labeling */
//     let dateCondition = "";
//     let timeframe = "All Time";
//     let params = [];

//     const ACTIVE_STATUSES = ['approved', 'processing', 'packaging', 'shipped', 'out_for_delivery', 'delivered'];
//     const statusPlaceholders = ACTIVE_STATUSES.map(() => '?').join(',');
//     params.push(...ACTIVE_STATUSES);

//     if (q.startDate && q.endDate) {
//       timeframe = `${q.startDate} to ${q.endDate}`;
//       dateCondition = " AND o.created_at >= ? AND o.created_at <= ?";
//       params.push(`${q.startDate} 00:00:00`, `${q.endDate} 23:59:59`);
//     } else if (q.startDate) {
//       timeframe = `From ${q.startDate} onwards`;
//       dateCondition = " AND o.created_at >= ?";
//       params.push(`${q.startDate} 00:00:00`);
//     } else if (q.endDate) {
//       timeframe = `Up to ${q.endDate}`;
//       dateCondition = " AND o.created_at <= ?";
//       params.push(`${q.endDate} 23:59:59`);
//     }

//     /** 3️⃣ Analytic Queries */
//     // Helper function to build the query per level
//     const buildQuery = (table, foreignKey) => `
//       SELECT 
//         cat.id, cat.name, cat.img_path,
//         SUM(oi.quantity) as items_sold,
//         SUM(oi.line_total) as total_revenue,
//         COUNT(DISTINCT oi.order_id) as total_orders
//       FROM order_items oi
//       JOIN orders o ON oi.order_id = o.id
//       JOIN products p ON oi.product_id = p.id
//       JOIN ${table} cat ON p.${foreignKey} = cat.id
//       WHERE o.order_status IN (${statusPlaceholders}) ${dateCondition}
//       GROUP BY cat.id
//       ORDER BY items_sold DESC
//       LIMIT ? OFFSET ?
//     `;

//     const [mainCats, subCats, childCats] = await Promise.all([
//       connection.query(buildQuery('main_categories', 'main_category_id'), [...params, limit, offset]),
//       connection.query(buildQuery('sub_categories', 'sub_category_id'), [...params, limit, offset]),
//       connection.query(buildQuery('child_categories', 'child_category_id'), [...params, limit, offset])
//     ]);

//     /** 4️⃣ Formatting Response */
//     const format = (list) => list.map(item => ({
//       id: item.id,
//       name: item.name,
//       image: item.img_path,
//       sold_count: Number(item.items_sold) || 0,
//       revenue: Number(item.total_revenue || 0).toFixed(2),
//       order_count: Number(item.total_orders) || 0
//     }));

//     return {
//       success: true,
//       timeframe, // Matches your requested format
//       meta: { limit, offset },
//       data: {
//         main_categories: format(mainCats),
//         sub_categories: format(subCats),
//         child_categories: format(childCats)
//       }
//     };
//   })
// );

exports.getCategorySalesAnalytics = api(
  {
    query: {
      startDate: { type: "string", required: false },
      endDate: { type: "string", required: false },
      limit: { type: "int", default: 10 },
      offset: { type: "int", default: 0 }
    }
  },
  auth(async (req, connection, adminInfo) => {

    /** 1️⃣ Authorization */
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
      throw new errors.UNAUTHORIZED();
    }

    const q = req.typed.query;

    if (q.startDate && !validator.isISO8601(q.startDate)) {
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid start date format (YYYY-MM-DD).");
    }
    if (q.endDate && !validator.isISO8601(q.endDate)) {
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid end date format (YYYY-MM-DD).");
    }

    const limit  = Math.min(Math.max(q.limit, 1), 50);
    const offset = Math.max(q.offset, 0);

    /** 2️⃣ Filters */
    const ACTIVE_STATUSES = ['approved','processing','packaging','shipped','out_for_delivery','delivered'];
    const params = [...ACTIVE_STATUSES];

    let dateSQL = "";
    if (q.startDate && q.endDate) {
      dateSQL = " AND o.created_at BETWEEN ? AND ?";
      params.push(`${q.startDate} 00:00:00`, `${q.endDate} 23:59:59`);
    } else if (q.startDate) {
      dateSQL = " AND o.created_at >= ?";
      params.push(`${q.startDate} 00:00:00`);
    } else if (q.endDate) {
      dateSQL = " AND o.created_at <= ?";
      params.push(`${q.endDate} 23:59:59`);
    }

    /** 3️⃣ Single Aggregation */
    const sql = `
      WITH product_sales AS (
        SELECT
          oi.product_id,
          SUM(oi.quantity) AS items_sold,
          SUM(oi.line_total) AS total_revenue,
          COUNT(DISTINCT oi.order_id) AS total_orders
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        WHERE o.order_status IN (${ACTIVE_STATUSES.map(() => '?').join(',')})
        ${dateSQL}
        GROUP BY oi.product_id
      )

      SELECT 'main' AS level, c.id, c.name, c.img_path,
             SUM(ps.items_sold) items_sold,
             SUM(ps.total_revenue) total_revenue,
             SUM(ps.total_orders) total_orders
      FROM product_sales ps
      JOIN products p ON p.id = ps.product_id
      JOIN main_categories c ON c.id = p.main_category_id
      GROUP BY c.id

      UNION ALL

      SELECT 'sub', c.id, c.name, c.img_path,
             SUM(ps.items_sold),
             SUM(ps.total_revenue),
             SUM(ps.total_orders)
      FROM product_sales ps
      JOIN products p ON p.id = ps.product_id
      JOIN sub_categories c ON c.id = p.sub_category_id
      GROUP BY c.id

      UNION ALL

      SELECT 'child', c.id, c.name, c.img_path,
             SUM(ps.items_sold),
             SUM(ps.total_revenue),
             SUM(ps.total_orders)
      FROM product_sales ps
      JOIN products p ON p.id = ps.product_id
      JOIN child_categories c ON c.id = p.child_category_id
      GROUP BY c.id
      ORDER BY items_sold DESC
      LIMIT ? OFFSET ?
    `;

    const rows = await connection.query(sql, [...params, limit, offset]);

    /** 4️⃣ Split result */
    const format = r => ({
      id: r.id,
      name: r.name,
      image: r.img_path,
      sold_count: Number(r.items_sold) || 0,
      revenue: Number(r.total_revenue || 0).toFixed(2),
      order_count: Number(r.total_orders) || 0
    });

    return {
      success: true,
      data: {
        main_categories: rows.filter(r => r.level === 'main').map(format),
        sub_categories: rows.filter(r => r.level === 'sub').map(format),
        child_categories: rows.filter(r => r.level === 'child').map(format)
      }
    };
  })
);



exports.getProductSalesReport = api(
  {
    query: {
      startDate: { type: "string", required: false },
      endDate: { type: "string", required: false },
      main_category_id: { type: "int" },
      sub_category_id: { type: "int" },
      child_category_id: { type: "int" },
      status: { type: "bool" }, // Now handled as Boolean (true/false)
      search: { type: "string" },
      limit: { type: "int", default: 20 },
      offset: { type: "int", default: 0 }
    }
  },
  auth(async (req, connection, adminInfo) => {
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"];
    if (!adminInfo.roles.some(role => ALLOWED_ROLES.includes(role))) {
      throw new errors.UNAUTHORIZED();
    }

    const q = req.typed.query;
    const limit = Math.min(Math.max(q.limit, 1), 100);
    const offset = Math.max(q.offset, 0);

    /** 1️⃣ Define Active Hierarchy Logic */
    const activeHierarchySql = `(
        p.status = 1 
        AND mc.status = 1 
        AND (p.sub_category_id IS NULL OR sc.status = 1) 
        AND (p.child_category_id IS NULL OR cc.status = 1)
    )`;

    /** 2️⃣ Build Filters */
    let filters = ["o.order_status IN ('approved', 'processing', 'packaging', 'shipped', 'out_for_delivery', 'delivered')"];
    let params = [];

    // Date Filters
    if (q.startDate) {
      filters.push("o.created_at >= ?");
      params.push(`${q.startDate} 00:00:00`);
    }
    if (q.endDate) {
      filters.push("o.created_at <= ?");
      params.push(`${q.endDate} 23:59:59`);
    }

    // Category Filters
    if (q.main_category_id) { filters.push("p.main_category_id = ?"); params.push(q.main_category_id); }
    if (q.sub_category_id) { filters.push("p.sub_category_id = ?"); params.push(q.sub_category_id); }
    if (q.child_category_id) { filters.push("p.child_category_id = ?"); params.push(q.child_category_id); }

    // Boolean Status Filter
    if (q.status !== undefined) {
      // If status is true, we check hierarchy = 1. If false, hierarchy = 0.
      filters.push(`${activeHierarchySql} = ?`);
      params.push(q.status ? 1 : 0);
    }

    // String Search (Name, Slug, Categories, or SKU)
    if (q.search) {
      filters.push(`(
        p.name LIKE ? OR 
        p.slug LIKE ? OR 
        mc.name LIKE ? OR 
        sc.name LIKE ? OR 
        cc.name LIKE ? OR
        EXISTS (SELECT 1 FROM product_skus ps WHERE ps.product_id = p.id AND ps.sku LIKE ?)
      )`);
      const term = `%${q.search}%`;
      params.push(term, term, term, term, term, term);
    }

    const whereClause = `WHERE ${filters.join(" AND ")}`;

    /** 3️⃣ SQL Execution */
    const reportQuery = `
      SELECT 
        p.id, p.name, p.slug, p.updated_at,
        mc.name as main_category,mc.id as main_category_id,
        sc.name as sub_category,sc.id as sub_category_id,
        cc.name as child_category,cc.id as child_category_id,
        ${activeHierarchySql} as is_currently_active,
        SUM(oi.quantity) as items_sold,
        SUM(oi.buying_price * oi.quantity) as total_buying_price,
        SUM(oi.selling_price * oi.quantity) as total_selling_price,
        SUM(oi.discount * oi.quantity) as total_item_discount,
        SUM(oi.line_total) as net_sales
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN products p ON oi.product_id = p.id
      JOIN main_categories mc ON p.main_category_id = mc.id
      LEFT JOIN sub_categories sc ON p.sub_category_id = sc.id
      LEFT JOIN child_categories cc ON p.child_category_id = cc.id
      ${whereClause}
      GROUP BY p.id
      ORDER BY items_sold DESC
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(DISTINCT p.id) as total 
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN products p ON oi.product_id = p.id
      JOIN main_categories mc ON p.main_category_id = mc.id
      LEFT JOIN sub_categories sc ON p.sub_category_id = sc.id
      LEFT JOIN child_categories cc ON p.child_category_id = cc.id
      ${whereClause}
    `;

    const [rows, countRes] = await Promise.all([
      connection.query(reportQuery, [...params, limit, offset]),
      connection.queryOne(countQuery, params)
    ]);

    /** 4️⃣ Timeframe Label Construction */
    let timeframe = "All Time";
    if (q.startDate && q.endDate) timeframe = `${q.startDate} to ${q.endDate}`;
    else if (q.startDate) timeframe = `From ${q.startDate} onwards`;
    else if (q.endDate) timeframe = `Up to ${q.endDate}`;

    return {
      success: true,
      timeframe,
      meta: {
        total: countRes?.total || 0,
        limit,
        offset
      },
      note:"Net revenue here is calculated without delivery charges and coupon discount. Only usings buying price,selling price and item discount",
      data: rows.map(row => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        last_updated: row.updated_at,
        is_active: !!row.is_currently_active,
        categories: {
          main: {id:row.main_category_id , name:row.main_category},
          sub: {id:row.sub_category_id , name:row.sub_category},
          child: {id:row.child_category_id , name:row.child_category},
          // sub: row.sub_category,
          // child: row.child_category
        },
        metrics: {
          quantity_sold: Number(row.items_sold),
          total_buying_price: Number(row.total_buying_price || 0).toFixed(2),
          total_selling_price: Number(row.total_selling_price || 0).toFixed(2),
          total_item_discount: Number(row.total_item_discount || 0).toFixed(2),
          net_revenue: Number(row.net_sales || 0).toFixed(2),
          
        }
      }))
    };
  })
);





exports.getInventoryStockSummery = api(
  {},
  auth(async (req, connection, adminInfo) => {
    /** 1️⃣ Authorization check */
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"];
    if (!adminInfo.roles.some(role => ALLOWED_ROLES.includes(role))) {
      throw new errors.UNAUTHORIZED();
    }

    /** 2️⃣ Fetch Stock Alert Limit from System Config */
    const configs = await getConfig(connection, false, "product");
    let alertLimit = 0;
    let isAlertActive = false;

    for (const row of configs) {
      if (row.key_name === "PRODUCT_STOCK_ALERT_MIN_COUNT") {
        isAlertActive = Boolean(row.is_active);
        alertLimit = Number(row.value) || 0;
      }
    }

    /** 3️⃣ Strict Active Hierarchy Logic */
    // A SKU is only "Active" if:
    // 1. ps.status = 1
    // 2. p.status = 1
    // 3. Main Category, Sub Category (if exists), and Child Category (if exists) are status = 1
    const activeHierarchyFilter = `
      ps.status = 1
      AND p.status = 1 
      AND mc.status = 1 
      AND (p.sub_category_id IS NULL OR sc.status = 1) 
      AND (p.child_category_id IS NULL OR cc.status = 1)
    `;

    /** 4️⃣ Execute Aggregation Query */
    const statsQuery = `
      SELECT 
        -- Total Active SKUs
        COUNT(ps.id) as total_active_items,

        -- In Stock (Active items with stock > 0)
        COUNT(CASE WHEN ps.stock > 0 THEN 1 END) as in_stock_count,

        -- Out of Stock (Active items with stock = 0)
        COUNT(CASE WHEN ps.stock = 0 THEN 1 END) as out_of_stock_count,

        -- Low Stock (Active items with stock <= alert limit)
        COUNT(CASE WHEN ${isAlertActive ? 'ps.stock <= ?' : '0=1'} THEN 1 END) as low_stock_count
      FROM product_skus ps
      JOIN products p ON ps.product_id = p.id
      INNER JOIN main_categories mc ON p.main_category_id = mc.id
      LEFT JOIN sub_categories sc ON p.sub_category_id = sc.id
      LEFT JOIN child_categories cc ON p.child_category_id = cc.id
      WHERE ${activeHierarchyFilter}
    `;

    const stats = await connection.queryOne(statsQuery, isAlertActive ? [alertLimit] : []);

    return {
      success: true,
      stock_alert_config: {
        active: isAlertActive,
        limit: alertLimit
      },
      data: {
        total_active_items: Number(stats.total_active_items) || 0,
        in_stock: Number(stats.in_stock_count) || 0,
        out_of_stock: Number(stats.out_of_stock_count) || 0,
        low_stock: Number(stats.low_stock_count) || 0
      }
    };
  })
);



exports.getCategoryStockSummary = api(
  {},
  auth(async (req, connection, adminInfo) => {
    /** 1️⃣ Authorization */
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"];
    if (!adminInfo.roles.some(role => ALLOWED_ROLES.includes(role))) {
      throw new errors.UNAUTHORIZED();
    }

    /** 2️⃣ Fetch Stock Alert Limit */
    const configs = await getConfig(connection, false, "product");
    let alertLimit = 0;
    let isAlertActive = false;

    for (const row of configs) {
      if (row.key_name === "PRODUCT_STOCK_ALERT_MIN_COUNT") {
        isAlertActive = Boolean(row.is_active);
        alertLimit = Number(row.value) || 0;
      }
    }

    /** 3️⃣ Strict Active Hierarchy Filter */
    const activeFilter = `
      ps.status = 1 AND p.status = 1 AND mc.status = 1 
      AND (p.sub_category_id IS NULL OR sc.status = 1) 
      AND (p.child_category_id IS NULL OR cc.status = 1)
    `;

    /** 4️⃣ SQL Queries with Parent IDs */
    const alertParams = isAlertActive ? [alertLimit] : [];

    // Main Category Query
    const mainQuery = `
      SELECT 
        mc.id, mc.name,
        COUNT(ps.id) as total_skus,
        SUM(ps.stock) as total_stock_qty,
        COUNT(CASE WHEN ps.stock > 0 THEN 1 END) as in_stock_count,
        COUNT(CASE WHEN ps.stock = 0 THEN 1 END) as out_of_stock_count,
        COUNT(CASE WHEN ${isAlertActive ? 'ps.stock <= ?' : '0=1'} THEN 1 END) as low_stock_count
      FROM main_categories mc
      JOIN products p ON p.main_category_id = mc.id
      JOIN product_skus ps ON ps.product_id = p.id
      LEFT JOIN sub_categories sc ON p.sub_category_id = sc.id
      LEFT JOIN child_categories cc ON p.child_category_id = cc.id
      WHERE mc.status = 1 AND ${activeFilter}
      GROUP BY mc.id
    `;

    // Sub Category Query (includes main_category_id)
    const subQuery = `
      SELECT 
        sc.id, sc.name, sc.main_category_id,
        COUNT(ps.id) as total_skus,
        SUM(ps.stock) as total_stock_qty,
        COUNT(CASE WHEN ps.stock > 0 THEN 1 END) as in_stock_count,
        COUNT(CASE WHEN ps.stock = 0 THEN 1 END) as out_of_stock_count,
        COUNT(CASE WHEN ${isAlertActive ? 'ps.stock <= ?' : '0=1'} THEN 1 END) as low_stock_count
      FROM sub_categories sc
      JOIN products p ON p.sub_category_id = sc.id
      JOIN product_skus ps ON ps.product_id = p.id
      INNER JOIN main_categories mc ON p.main_category_id = mc.id
      LEFT JOIN child_categories cc ON p.child_category_id = cc.id
      WHERE sc.status = 1 AND ${activeFilter}
      GROUP BY sc.id
    `;

    // Child Category Query (includes sub_category_id AND main_category_id via product)
    const childQuery = `
      SELECT 
        cc.id, cc.name, cc.sub_category_id, p.main_category_id,
        COUNT(ps.id) as total_skus,
        SUM(ps.stock) as total_stock_qty,
        COUNT(CASE WHEN ps.stock > 0 THEN 1 END) as in_stock_count,
        COUNT(CASE WHEN ps.stock = 0 THEN 1 END) as out_of_stock_count,
        COUNT(CASE WHEN ${isAlertActive ? 'ps.stock <= ?' : '0=1'} THEN 1 END) as low_stock_count
      FROM child_categories cc
      JOIN products p ON p.child_category_id = cc.id
      JOIN product_skus ps ON ps.product_id = p.id
      INNER JOIN main_categories mc ON p.main_category_id = mc.id
      INNER JOIN sub_categories sc ON p.sub_category_id = sc.id
      WHERE cc.status = 1 AND ${activeFilter}
      GROUP BY cc.id
    `;

    const [mainStocks, subStocks, childStocks] = await Promise.all([
      connection.query(mainQuery, alertParams),
      connection.query(subQuery, alertParams),
      connection.query(childQuery, alertParams)
    ]);

    return {
      success: true,
      data: {
        main_categories: mainStocks.map(m => ({
          id: m.id,
          name: m.name,
          metrics: { total_variations: Number(m.total_skus), in_stock: Number(m.in_stock_count), out_of_stock: Number(m.out_of_stock_count), low_stock: Number(m.low_stock_count) }
        })),
        sub_categories: subStocks.map(s => ({
          id: s.id,
          name: s.name,
          main_category_id: s.main_category_id,
          metrics: { total_variations: Number(s.total_skus), in_stock: Number(s.in_stock_count), out_of_stock: Number(s.out_of_stock_count), low_stock: Number(s.low_stock_count) }
        })),
        child_categories: childStocks.map(c => ({
          id: c.id,
          name: c.name,
          sub_category_id: c.sub_category_id,
          main_category_id: c.main_category_id,
          metrics: { total_variations: Number(c.total_skus), in_stock: Number(c.in_stock_count), out_of_stock: Number(c.out_of_stock_count), low_stock: Number(c.low_stock_count) }
        }))
      }
    };
  })
);


exports.getStockTrend = api(
  {
    query: {
      year: { type: "string", required: false } // Year is now optional
    }
  },
  auth(async (req, connection, adminInfo) => {
    /** 1️⃣ Authorization */
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN"];
    if (!adminInfo.roles.some(role => ALLOWED_ROLES.includes(role))) {
      throw new errors.UNAUTHORIZED();
    }

    const q = req.typed.query;
    const currentYear = new Date().getFullYear();
    let validatedYear;

    /** 2️⃣ Year Validation & Defaulting */
    if (q.year) {
      // If year is provided, validate it
      if (!validator.isInt(q.year, { min: 2024, max: currentYear + 1 })) {
        throw new errors.INVALID_FIELDS_PROVIDED(`Please provide a valid year between 2024 and ${currentYear + 1}`);
      }
      validatedYear = parseInt(q.year);
    } else {
      // Default to current year (2026)
      validatedYear = currentYear;
    }

    /** 3️⃣ Execute Aggregation Query */
    const trendQuery = `
      SELECT 
        m.month_name as month,
        COALESCE(SUM(CASE WHEN sl.action = 'in' THEN (sl.new_stock - sl.old_stock) ELSE 0 END), 0) as stock_in,
        COALESCE(SUM(CASE WHEN sl.action = 'out' THEN (sl.old_stock - sl.new_stock) ELSE 0 END), 0) as stock_out
      FROM (
        SELECT 1 as m_num, 'Jan' as month_name UNION SELECT 2, 'Feb' UNION 
        SELECT 3, 'Mar' UNION SELECT 4, 'Apr' UNION SELECT 5, 'May' UNION 
        SELECT 6, 'Jun' UNION SELECT 7, 'Jul' UNION SELECT 8, 'Aug' UNION 
        SELECT 9, 'Sep' UNION SELECT 10, 'Oct' UNION SELECT 11, 'Nov' UNION 
        SELECT 12, 'Dec'
      ) m
      LEFT JOIN product_stock_logs sl ON m.m_num = MONTH(sl.created_at) AND YEAR(sl.created_at) = ?
      GROUP BY m.m_num, m.month_name
      ORDER BY m.m_num ASC
    `;

    const rows = await connection.query(trendQuery, [validatedYear]);

    /** 4️⃣ Response Formatting */
    const formattedTrend = rows.map(row => ({
      month: row.month,
      stock_in: Number(row.stock_in),
      stock_out: Number(row.stock_out)
    }));

    return {
      success: true,
      year: validatedYear, 
      data: formattedTrend
    };
  })
);



// exports.getStockReport = api(
//   {
//     query: {
//       limit: { type: "int", default: 20 },
//       offset: { type: "int", default: 0 },
//       main_category_id: { type: "int" },
//       sub_category_id: { type: "int" },
//       child_category_id: { type: "int" },
//       status: { type: "string" }, // 'instock', 'low_stock', 'out_of_stock'
//       search: { type: "string" }
//     }
//   },
//   auth(async (req, connection, adminInfo) => {
//     /** 1️⃣ Authorization */
//     const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"];
//     if (!adminInfo.roles.some(role => ALLOWED_ROLES.includes(role))) {
//       throw new errors.UNAUTHORIZED();
//     }

//     const q = req.typed.query;
//     const limit = Math.min(Math.max(q.limit, 1), 100);
//     const offset = Math.max(q.offset, 0);

//     /** 2️⃣ Fetch Alert Limit */
//     const configs = await getConfig(connection, false, "product");
//     const alertLimit = Number(configs.find(r => r.key_name === "PRODUCT_STOCK_ALERT_MIN_COUNT")?.value) || 0;

//     /** 3️⃣ Hierarchy Filter Logic */
//     const activeHierarchyFilter = `
//       ps.status = 1 AND p.status = 1 AND mc.status = 1 
//       AND (p.sub_category_id IS NULL OR sc.status = 1) 
//       AND (p.child_category_id IS NULL OR cc.status = 1)
//     `;

//     /** 4️⃣ Build Dynamic Filters */
//     let filters = [activeHierarchyFilter];
//     let params = [];

//     // Category Filters
//     if (q.main_category_id) { filters.push("p.main_category_id = ?"); params.push(q.main_category_id); }
//     if (q.sub_category_id) { filters.push("p.sub_category_id = ?"); params.push(q.sub_category_id); }
//     if (q.child_category_id) { filters.push("p.child_category_id = ?"); params.push(q.child_category_id); }


//     if(q.status && q.status!=="instock"&& q.status!=="out_of_stock" && q.status!=="low_stock") throw new errors.INVALID_FIELDS_PROVIDED("Status is invalid ")
//     // Stock Status Filter
//     if (q.status === 'instock') {
//       filters.push("ps.stock > 0");
//     } else if (q.status === 'out_of_stock') {
//       filters.push("ps.stock = 0");
//     } else if (q.status === 'low_stock') {
//       filters.push("ps.stock <= ?");
//       params.push(alertLimit);
//     }

//     // Search (Category Names, Product Name, Slug, SKU Code)
//     if (q.search) {
//       filters.push(`(
//         p.name LIKE ? OR p.slug LIKE ? OR ps.sku LIKE ? OR
//         mc.name LIKE ? OR sc.name LIKE ? OR cc.name LIKE ?
//       )`);
//       const term = `%${q.search}%`;
//       params.push(term, term, term, term, term, term);
//     }

//     const whereClause = `WHERE ${filters.join(" AND ")}`;

//     /** 5️⃣ Execute Queries */
//     const reportQuery = `
//       SELECT 
//         ps.id as sku_id,
//         ps.sku as sku_code,
//         p.name as product_name,
//         mc.id as mc_id, mc.name as mc_name,
//         sc.id as sc_id, sc.name as sc_name,
//         cc.id as cc_id, cc.name as cc_name,
//         ps.stock,
//         (SELECT created_at FROM product_stock_logs WHERE sku_id = ps.id ORDER BY created_at DESC LIMIT 1) as last_updated
//       FROM product_skus ps
//       JOIN products p ON ps.product_id = p.id
//       JOIN main_categories mc ON p.main_category_id = mc.id
//       LEFT JOIN sub_categories sc ON p.sub_category_id = sc.id
//       LEFT JOIN child_categories cc ON p.child_category_id = cc.id
//       ${whereClause}
//       ORDER BY ps.stock ASC, ps.id DESC
//       LIMIT ? OFFSET ?
//     `;

//     const countQuery = `
//       SELECT COUNT(*) as total 
//       FROM product_skus ps
//       JOIN products p ON ps.product_id = p.id
//       JOIN main_categories mc ON p.main_category_id = mc.id
//       LEFT JOIN sub_categories sc ON p.sub_category_id = sc.id
//       LEFT JOIN child_categories cc ON p.child_category_id = cc.id
//       ${whereClause}
//     `;

//     const [rows, countRes] = await Promise.all([
//       connection.query(reportQuery, [...params, limit, offset]),
//       connection.queryOne(countQuery, params)
//     ]);

//     /** 6️⃣ Format Output */
//     const data = rows.map(row => {
//       let stockStatus = 'instock';
//       if (row.stock === 0) stockStatus = 'out_of_stock';
//       else if (row.stock <= alertLimit) stockStatus = 'low_stock';

//       return {
//         id: row.sku_id,
//         skucode: row.sku_code,
//         product_name: row.product_name,
//         categories: {
//           main: { id: row.mc_id, name: row.mc_name },
//           sub: row.sc_id ? { id: row.sc_id, name: row.sc_name } : null,
//           child: row.cc_id ? { id: row.cc_id, name: row.cc_name } : null
//         },
//         stock: row.stock,
//         stock_status: stockStatus,
//         last_updated: row.last_updated
//       };
//     });

//     return {
//       success: true,
//       meta: {
//         total: countRes?.total || 0,
//         limit,
//         offset,
//         alert_limit_applied: alertLimit
//       },
//       data
//     };
//   })
// );

exports.getStockReport = api(
  {
    query: {
      limit: { type: "int", default: 20 },
      offset: { type: "int", default: 0 },
      startDate: { type: "string", required: false },
      endDate: { type: "string", required: false },
      main_category_id: { type: "int" },
      sub_category_id: { type: "int" },
      child_category_id: { type: "int" },
      status: { type: "string" }, // 'instock', 'low_stock', 'out_of_stock'
      search: { type: "string" }
    }
  },
  auth(async (req, connection, adminInfo) => {
    /** 1️⃣ Authorization */
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"];
    if (!adminInfo.roles.some(role => ALLOWED_ROLES.includes(role))) {
      throw new errors.UNAUTHORIZED();
    }

    const q = req.typed.query;
    const limit = Math.min(Math.max(q.limit, 1), 100);
    const offset = Math.max(q.offset, 0);

    /** 2️⃣ Fetch Alert Limit */
    const configs = await getConfig(connection, false, "product");
    const alertLimit = Number(configs.find(r => r.key_name === "PRODUCT_STOCK_ALERT_MIN_COUNT")?.value) || 0;

    /** 3️⃣ Hierarchy Filter Logic */
    const activeHierarchyFilter = `
      ps.status = 1 AND p.status = 1 AND mc.status = 1 
      AND (p.sub_category_id IS NULL OR sc.status = 1) 
      AND (p.child_category_id IS NULL OR cc.status = 1)
    `;

    /** 4️⃣ Build Dynamic Filters */
    let filters = [activeHierarchyFilter];
    let params = [];
    
    const ACTIVE_ORDERS_SQL = "'approved', 'processing', 'packaging', 'shipped', 'out_for_delivery', 'delivered'";

    // Build Date Condition for Subqueries
    let dateCondition = "";
    let dateParams = [];
    if (q.startDate) {
      dateCondition += " AND o.created_at >= ?";
      dateParams.push(`${q.startDate} 00:00:00`);
    }
    if (q.endDate) {
      dateCondition += " AND o.created_at <= ?";
      dateParams.push(`${q.endDate} 23:59:59`);
    }

    // Main Category Filters
    if (q.main_category_id) { filters.push("p.main_category_id = ?"); params.push(q.main_category_id); }
    if (q.sub_category_id) { filters.push("p.sub_category_id = ?"); params.push(q.sub_category_id); }
    if (q.child_category_id) { filters.push("p.child_category_id = ?"); params.push(q.child_category_id); }

    // Stock Status Filter
    if (q.status === 'instock') {
      filters.push("ps.stock > 0");
    } else if (q.status === 'out_of_stock') {
      filters.push("ps.stock = 0");
    } else if (q.status === 'low_stock') {
      filters.push("ps.stock <= ?");
      params.push(alertLimit);
    }

    // Search
    if (q.search) {
      filters.push(`(
        p.name LIKE ? OR p.slug LIKE ? OR ps.sku LIKE ? OR
        mc.name LIKE ? OR sc.name LIKE ? OR cc.name LIKE ?
      )`);
      const term = `%${q.search}%`;
      params.push(term, term, term, term, term, term);
    }

    const whereClause = `WHERE ${filters.join(" AND ")}`;

    /** 5️⃣ Main Query with Correlated Sales Metrics */
    const reportQuery = `
      SELECT 
        ps.id as sku_id,
        ps.sku as sku_code,
        p.name as product_name,
        mc.id as mc_id, mc.name as mc_name,
        sc.id as sc_id, sc.name as sc_name,
        cc.id as cc_id, cc.name as cc_name,
        ps.stock,
        (SELECT created_at FROM product_stock_logs WHERE sku_id = ps.id ORDER BY created_at DESC LIMIT 1) as last_updated,
        
        COALESCE((
          SELECT SUM(oi.buying_price * oi.quantity)
          FROM order_items oi
          JOIN orders o ON oi.order_id = o.id
          WHERE oi.product_sku_id = ps.id AND o.order_status IN (${ACTIVE_ORDERS_SQL}) ${dateCondition}
        ), 0) as period_buying_price,
        
        COALESCE((
          SELECT SUM(oi.selling_price * oi.quantity)
          FROM order_items oi
          JOIN orders o ON oi.order_id = o.id
          WHERE oi.product_sku_id = ps.id AND o.order_status IN (${ACTIVE_ORDERS_SQL}) ${dateCondition}
        ), 0) as period_selling_price,
        
        COALESCE((
          SELECT SUM(oi.discount * oi.quantity)
          FROM order_items oi
          JOIN orders o ON oi.order_id = o.id
          WHERE oi.product_sku_id = ps.id AND o.order_status IN (${ACTIVE_ORDERS_SQL}) ${dateCondition}
        ), 0) as period_discount
        
      FROM product_skus ps
      JOIN products p ON ps.product_id = p.id
      JOIN main_categories mc ON p.main_category_id = mc.id
      LEFT JOIN sub_categories sc ON p.sub_category_id = sc.id
      LEFT JOIN child_categories cc ON p.child_category_id = cc.id
      ${whereClause}
      ORDER BY ps.stock ASC
      LIMIT ? OFFSET ?
    `;

    // Flatten parameters: [dateParams (for 3 subqueries), filters, limit, offset]
    const finalParams = [...dateParams, ...dateParams, ...dateParams, ...params, limit, offset];

    const [rows, countRes] = await Promise.all([
      connection.query(reportQuery, finalParams),
      connection.queryOne(`SELECT COUNT(*) as total FROM product_skus ps JOIN products p ON ps.product_id = p.id JOIN main_categories mc ON p.main_category_id = mc.id LEFT JOIN sub_categories sc ON p.sub_category_id = sc.id LEFT JOIN child_categories cc ON p.child_category_id = cc.id ${whereClause}`, params)
    ]);

    /** 6️⃣ Timeframe Formatting */
    let timeframe = "All Time";
    if (q.startDate && q.endDate) timeframe = `${q.startDate} to ${q.endDate}`;
    else if (q.startDate) timeframe = `From ${q.startDate} onwards`;
    else if (q.endDate) timeframe = `Up to ${q.endDate}`;

    return {
      success: true,
      timeframe,
        note:"Net revenue here is calculated without delivery charges and coupon discount. Only usings buying price,selling price and item discount",
      
      meta: {
        total: countRes?.total || 0,
        limit,
        offset,
        alert_limit_applied: alertLimit
      },
      data: rows.map(row => {
        let stockStatus = 'instock';
        if (row.stock === 0) stockStatus = 'out_of_stock';
        else if (row.stock <= alertLimit) stockStatus = 'low_stock';

        return {
          id: row.sku_id,
          skucode: row.sku_code,
          product_name: row.product_name,
          categories: {
            main: { id: row.mc_id, name: row.mc_name },
            sub: row.sc_id ? { id: row.sc_id, name: row.sc_name } : null,
            child: row.cc_id ? { id: row.cc_id, name: row.cc_name } : null
          },
          stock: row.stock,
          stock_status: stockStatus,
          last_updated: row.last_updated,
          sales_metrics: {
            total_buying_value: Number(row.period_buying_price).toFixed(2),
            total_selling_value: Number(row.period_selling_price).toFixed(2),
            total_discount_value: Number(row.period_discount).toFixed(2)
          }
        };
      })
    };
  })
);
