// Import modules:
//import * as errors from './errors.js';
//import * as database from '../utils/database.js';
const errors = require("./errors");
const responses = require("./responses");
const database = require('../utils/connection');
const jwt = require('jsonwebtoken');
const { jwtSecret ,unsubscribeSecret} = require('../config/ApplicationSettings');


// exports.api = function api(requiredParams, func) {
//     // Handle case where no required params are passed:
//     if (func == null) {
//         func = requiredParams;
//         requiredParams = [];
//     }
//     // Generate wrapped function:
//     return async (req, res) => {
//         let connection;
//         try {
//             // Go through each required parameter, check if blank:
//             exports.checkParams(req, requiredParams);

//             // Get an open connection:
//             connection = await database.getConnection();
//             // Start transaction:
//             await connection.beginTransaction();
//             // Execute function:
//             const result = await func(req, connection);
//             // Commit transaction:
//             await connection.commit();
//             // Release connection:
//             await connection.release();
//             // Check if given response is of a pre-defined response:
//             if (result instanceof responses.QResponse) return result.apply(res);
//             // Serialize result and send (if available):
//             return result != null && res.send(result);
//         } catch (err) {


//             if (connection != null) {
//                 // Rollback transaction:
//                 await connection.rollback();
//                 // Release connection:
//                 await connection.release();
//             }
//             // Check if thrown error is of a pre-defined error:
//             if (err instanceof errors.QError) return res.send(err);
//             // Log error:
//             req.logger.error(err);
//             // Return masked error to api caller:
//             return res.send(new errors.ERROR_IN_EXECUTION());
//         }
//     }
// };


// exports.auth = function auth(extraFields, func) {
//     // Handle case where no extra fields are passed:
//     if (func == null) {
//         func = extraFields;
//         extraFields = [];
//     }
//     // Generate wrapped function:
//     return async (req, connection) => {

//         // Check for required params:
//         exports.checkParams(req, ["accessToken"]);

//         const accessToken = req.body.accessToken;
//         const decodedToken = await exports.verifyJwt(accessToken, jwtSecret);

//         if (decodedToken == null || decodedToken.email == null) throw new errors.INVALID_ACCESS_TOKEN();

//         const userQuery = "select id,email from users where email=?";
//         const userInfo = await connection.queryOne(userQuery, [decodedToken.email]);

//         if (userInfo == null || userInfo.id == null) throw new errors.INVALID_ACCESS_TOKEN();

//         return await func(req, connection, userInfo);
//     };
// };



exports.generateUnsubscribeToken = async (user) => {
  return jwt.sign(
    {
      uid: user.id,
      email: user.email,
      type: "unsubscribe"
    },
    unsubscribeSecret 
  );
}

exports.verifyUnsubscribeToken = async (token) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, unsubscribeSecret, (err, decoded) => {

      if (err) {
        resolve(null);
      } else {
        resolve(decoded);
      }
    });
  });
};

exports.verifyJwt = async (token, secret) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secret, (err, decoded) => {
      if (err) {

        resolve(null);
      } else {
        resolve(decoded);
      }
    });
  });
};



exports.isValidNumber = (value) => {
  const numberValue = Number(value);
  return typeof numberValue === 'number' && Number.isFinite(numberValue);
};





// Centralized validator + caster
exports.validateAndCast = function validateAndCast(req, schema = {}) {
  const sources = { params: {}, query: {}, body: {} };

  for (const source of ["params", "query", "body"]) {
    if (!schema[source]) continue;

    for (const [key, conf] of Object.entries(schema[source])) {
      let value = req[source][key];

      // Required check
      if (value == null || value === "") {
        if (conf.required) {
          throw new errors.PARAMETER_MISSING(`${key} is required.`);
        }
        value = conf.default;
      }

      // Skip casting if value is still undefined
      if (value == null) {
        sources[source][key] = value;
        continue;
      }

      // Auto-cast
      switch (conf.type) {
        case "int":
          value = parseInt(value, 10);
          if (Number.isNaN(value)) throw new errors.INVALID_FIELDS_PROVIDED(`${key} is not a valid integer.`);
          break;
        case "float":
          value = parseFloat(value);
          if (Number.isNaN(value)) throw new errors.INVALID_FIELDS_PROVIDED(`${key}  is not a valid float.`);
          break;
        case "bool":
          if (value === true || value === "true") value = true;
          else if (value === false || value === "false") value = false;
          else throw new errors.INVALID_FIELDS_PROVIDED(`${key} is not a valid boolean.`);
          break;
        case "string":
          value = String(value);
          break;
        default:
          break; // keep as-is
      }

      sources[source][key] = value;
    }
  }

  return sources;
};




exports.api = function api(schema = {}, func) {
  if (func == null) {
    func = schema;
    schema = {};
  }

  return async (req, res) => {
    let connection;

    try {
      // ✅ Attach typed data WITHOUT cloning req
      req.typed = exports.validateAndCast(req, schema);

      connection = await database.getConnection();
      await connection.beginTransaction();

      // ✅ Pass original req (headers intact)
      const result = await func(req, connection);

      await connection.commit();
      await connection.release();

      if (result instanceof responses.QResponse) {
        return result.apply(res);
      }

      return result != null && res.send(result);
    } catch (err) {


      if (connection) {
        await connection.rollback();
        await connection.release();
      }

      if (err instanceof errors.QError) {
        const httpStatus = (err.flag >= 400 && err.flag < 600) ? err.flag : 200;
        return res.status(httpStatus).json({ flag: err.flag, error: err.error, message: err.error });
      }

      req.logger?.error(err);
      return res.send(new errors.ERROR_IN_EXECUTION());
    }
  };
};


exports.auth = function auth(func) {
  return async (req, connection) => {

    if (!req || !req.headers) {

      throw new errors.UNAUTHORIZED("Request context missing");
    }


    const authHeader = req.headers.authorization;




    if (!authHeader || !authHeader.startsWith("Bearer ")) {

      throw new errors.INVALID_ACCESS_TOKEN();

    }

    const token = authHeader.split(" ")[1];
    const decodedToken = await exports.verifyJwt(token, jwtSecret);

    if (!decodedToken || !decodedToken.email) throw new errors.INVALID_ACCESS_TOKEN();

    const adminQuery = "SELECT id,email,token_version FROM admins WHERE email=? AND is_active = 1 AND deleted_at IS NULL";
    const admin = await connection.queryOne(adminQuery, [decodedToken.email]);

    if (!admin) throw new errors.INVALID_ACCESS_TOKEN();

    // check token_version
    if (decodedToken.token_version !== admin.token_version) {
      throw new errors.UNAUTHORIZED("Token expired, please login again");
    }

    const adminInfo = {
      id: admin.id,
      email: admin.email,
      roles: decodedToken.roles,
      permissions: decodedToken.permissions

    };

    return await func(req, connection, adminInfo);
  };
};

exports.userAuth = function userAuth(func) {
  return async (req, connection) => {
    if (!req || !req.headers) {
      throw new errors.UNAUTHORIZED("Request context missing");
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new errors.INVALID_ACCESS_TOKEN();
    }

    const token = authHeader.split(" ")[1];

    // 1. Verify JWT
    const decodedToken = await exports.verifyJwt(token, jwtSecret);

    if (!decodedToken || !decodedToken.uid) {
      throw new errors.INVALID_ACCESS_TOKEN();
    }

    // 2. Load user
    const user = await connection.queryOne(
      `
      SELECT
        id,
        email,
        last_name,
        first_name,
        google_id,
        img_path,
        status,
        gender,
        dob,
        is_email_verified,
        is_fully_verified,
        password_hash,
        total_spent,
        token_version,
        default_phone_id,
        default_address_id
      FROM users
      WHERE id = ? and status ='active'
        AND deleted_at IS NULL
      LIMIT 1
      `,
      [decodedToken.uid]
    );

    if (!user) {
      throw new errors.INVALID_ACCESS_TOKEN();
    }

    // // 3. Status checks
    // if (user.status !== "active") {
    //   throw new errors.FORBIDDEN("Account is not active");
    // }

    // 4. Email verification consistency check
    if (!user.is_email_verified || decodedToken.ev !== true) {
      throw new errors.UNAUTHORIZED("Email verification required");
    }

    // 5. Token version check (session invalidation)
    if (decodedToken.tv !== user.token_version) {
      throw new errors.UNAUTHORIZED("Session expired, please login again");
    }

    // 6. Attach user info to request
    const userInfo = {
      id: user.id,
      email: user.email,
        last_name:user.last_name,
        first_name:user.first_name,
       
      google_id: user.google_id,
      img_path: user.img_path,
      status: user.status,
      gender: user.gender,
      dob: user.dob,
      total_spent: user.total_spent,
      isEmailVerified: user.is_email_verified,
      isFullyVerified: user.is_fully_verified,
      has_password: user.password_hash? true : false,
      default_phone_id: user.default_phone_id,
      default_address_id: user.default_address_id
    };

    // 7. Continue
    return await func(req, connection, userInfo);
  };
};





// ontor er karone amar architecture e change kora laglo. Fishhhhhhhhhhhhh|


// app.patch(
//   "/products/:id",
//   api(
//     {
//       params: { id: { type: "int", required: true } },
//       body: { name: { type: "string", required: true } }
//     },
//     auth(async (req, connection) => {
//       const { params, body } = req.typed;
//       await connection.queryOne("UPDATE products SET name=? WHERE id=?", [body.name, params.id]);
//       return { success: true };
//     })
//   )
// );