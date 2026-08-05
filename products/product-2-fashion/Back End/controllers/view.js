const { api } = require('../helpers/common');
const errors = require('../helpers/errors');
const validator = require('validator');
// exports.logPageView = api(
//   {
//     body: {
//       page_name: { 
//         type: "string", 
//         required: false,
//         default:"landing"
       
//       },
//       ip:{type:"string",required:true}
      
//     }
//   },
//   async (req, connection) => {
//     const { page_name ,ip} = req.typed.body;
 
//     if (page_name.length > 100) {
//       throw new errors.INVALID_FIELDS_PROVIDED("Page name cannot exceed 100 characters");
//     }
//     let   isNewView;
//             try {
  
//       // Try to insert the page view
//       // This will fail silently on duplicate (same IP, same page, same day) due to UNIQUE constraint
//       const result = await connection.query(
//         `INSERT INTO page_view_logs (page_name, ip_address) 
//          VALUES (?, INET6_ATON(?)) `,
//         [page_name, ip]
//       );
      
//       // Determine if a new view was recorded or it was a duplicate
//        isNewView = result.affectedRows > 0;
//      } catch(err){
//       // throw new errors.ALREADY_EXIST("This ip already viewed this page today");
//      }
     
      
//       return {
//         success: true,
//         message: isNewView ? "Page view logged successfully" : "Duplicate view (already counted today)",
       
//       };
      
 
//   }
// );

exports.logPageView = api(
  {
    body: {
      page_name: { 
        type: "string", 
        required: false,
        default: "landing"
      },
      ip: { type: "string", required: true }
    }
  },
  async (req, connection) => {
    const { page_name, ip } = req.typed.body;
 
    if (page_name.length > 100) {
      throw new errors.INVALID_FIELDS_PROVIDED("Page name cannot exceed 100 characters");
    }

    if(validator.isIP(ip)===false){
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid IP address format");
    }
   
      // FIRST: Check if this IP already viewed this page today
      const checkResult = await connection.query(
        `SELECT 1 FROM page_view_logs 
         WHERE page_name = ? 
           AND ip_address = INET6_ATON(?)
           AND view_date = CURDATE()
         LIMIT 1`,
        [page_name, ip]
      );
      
      // If a record exists, it's a duplicate
      if (checkResult.length > 0) {
        return {
          success: true,
          message: "Duplicate view (already counted today)",
          isNewView: false
        };
      }
      
      // SECOND: Insert the new view
      const insertResult = await connection.query(
        `INSERT INTO page_view_logs (page_name, ip_address) 
         VALUES (?, INET6_ATON(?))`,
        [page_name, ip]
      );
      
      return {
        success: true,
        message: "Page view logged successfully",
        isNewView: true
      };
  
  }
);

// Optional: Get page view statistics API
// exports.getPageViewStats = api(
//   {
//     query: {
//       page_name: { type: "string", required: false },
//       date_from: { type: "string", required: false },
//       date_to: { type: "string", required: false },
//       group_by: { type: "string", required: false, default: "day" } // day, page, both
//     }
//   },
//   auth(async (req, connection, adminInfo) => {
//     // Only allow admins to view stats
//     const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "ANALYTICS_MANAGER"];
//     if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
//       throw new errors.UNAUTHORIZED("You do not have permission to view page statistics");
//     }
    
//     const { page_name, date_from, date_to, group_by } = req.typed.query;
    
//     // Build WHERE clause
//     const filters = [];
//     const params = [];
    
//     if (page_name) {
//       filters.push("page_name = ?");
//       params.push(page_name);
//     }
    
//     if (date_from) {
//       filters.push("view_date >= ?");
//       params.push(date_from);
//     }
    
//     if (date_to) {
//       filters.push("view_date <= ?");
//       params.push(date_to);
//     }
    
//     const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
    
//     let query;
//     let queryParams;
    
//     switch(group_by) {
//       case 'day':
//         query = `
//           SELECT 
//             view_date as date,
//             COUNT(*) as view_count
//           FROM page_view_logs
//           ${whereClause}
//           GROUP BY view_date
//           ORDER BY view_date DESC
//         `;
//         queryParams = params;
//         break;
        
//       case 'page':
//         query = `
//           SELECT 
//             page_name,
//             COUNT(*) as view_count
//           FROM page_view_logs
//           ${whereClause}
//           GROUP BY page_name
//           ORDER BY view_count DESC
//         `;
//         queryParams = params;
//         break;
        
//       case 'both':
//         query = `
//           SELECT 
//             page_name,
//             view_date as date,
//             COUNT(*) as view_count
//           FROM page_view_logs
//           ${whereClause}
//           GROUP BY page_name, view_date
//           ORDER BY view_date DESC, view_count DESC
//         `;
//         queryParams = params;
//         break;
        
//       default:
//         throw new errors.INVALID_FIELDS_PROVIDED("group_by must be one of: day, page, both");
//     }
    
//     const stats = await connection.query(query, queryParams);
    
//     // Get total summary
//     const summaryResult = await connection.queryOne(
//       `SELECT 
//          COUNT(*) as total_views,
//          COUNT(DISTINCT page_name) as unique_pages,
//          COUNT(DISTINCT ip_address) as unique_visitors
//        FROM page_view_logs
//        ${whereClause}`,
//       params
//     );
    
//     return {
//       success: true,
//       data: {
//         summary: {
//           total_views: summaryResult.total_views || 0,
//           unique_pages: summaryResult.unique_pages || 0,
//           unique_visitors: summaryResult.unique_visitors || 0
//         },
//         stats: stats.map(stat => ({
//           ...stat,
//           view_count: parseInt(stat.view_count) || 0
//         }))
//       }
//     };
//   })
// );