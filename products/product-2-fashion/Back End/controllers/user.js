const { api, userAuth, verifyJwt } = require('../helpers/common');
const { optionalUploadApi, saveImage, deleteFileIfExists } = require('../helpers/img'); // Adjust paths as needed

const errors = require("../helpers/errors");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { jwtSecret, GAUTH_CLIENT_ID, BRAND_NAME } = require('../config/ApplicationSettings');
const { getConfig } = require('../config/ApplicationSettingsDB');
const {
  getPermissionConfig,
  ensurePermissionDefaults
} = require("../config/PermissionSettingsDB");
const { validateLogin } = require("../validators/login");
const { sendSMS } = require('../helpers/sms');
const crypto = require('crypto');

const validator = require("validator");
const nodemailer = require("nodemailer");
const { sendEmailVerification } = require("../mail-templates/emailverify")
const { sendWelcome } = require("../mail-templates/welcome")
const { sendForgotPassEmail } = require("../mail-templates/forgotpass")

const { OAuth2Client } = require("google-auth-library");

const getForgotPassMethodConfig = async (connection) => {
  await ensurePermissionDefaults(connection);
  const rows = await getPermissionConfig(connection, false, "forgot_pass_method");

  const config = {
    email: true,
    sms: false
  };

  for (const row of rows) {
    if (!Object.prototype.hasOwnProperty.call(config, row.key_name)) continue;
    config[row.key_name] = String(row.value) === "true";
  }

  return config;
};

const validateForgotPasswordChannel = ({ email, phone_number, permission }) => {
  if (!permission.email && !permission.sms) {
    throw new errors.SERVICE_UNAVAILABLE("Forgot password method is currently disabled");
  }

  if (!email && !phone_number) {
    if (permission.email && permission.sms) {
      throw new errors.INVALID_FIELDS_PROVIDED("Provide either email or phone_number");
    }
    if (permission.email) {
      throw new errors.INVALID_FIELDS_PROVIDED("Provide email");
    }
    throw new errors.INVALID_FIELDS_PROVIDED("Provide phone_number");
  }

  if (email && phone_number) {
    throw new errors.INVALID_FIELDS_PROVIDED("Provide either email or phone_number");
  }

  if (email && !permission.email) {
    throw new errors.BAD_REQUEST("Forgot password via email is disabled");
  }

  if (phone_number && !permission.sms) {
    throw new errors.BAD_REQUEST("Forgot password via sms is disabled");
  }
};

// ── Public: which channels are enabled for customer password reset ────────────
exports.getUserForgotPassMethods = api(
  {},
  async (req, connection) => {
    const config = await getForgotPassMethodConfig(connection);
    return { success: true, email: config.email, sms: config.sms };
  }
);


exports.googleAuth = api(
  {
    body: {
      gauthToken: { type: "string", required: true },
      ip: { type: "string", required: false }
    }
  },
  async (req, connection) => {
    const { gauthToken, ip } = req.typed.body;

    if (ip && !validator.isIP(ip)) {
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid IP address");
    }

    const userAgent = req.headers["user-agent"] || null;
    const client = new OAuth2Client(process.env.GAUTH_CLIENT_ID);

    let ticket;
    try {
      ticket = await client.verifyIdToken({
        idToken: gauthToken,
        audience: process.env.GAUTH_CLIENT_ID
      });
    } catch (err) {
      throw new errors.INVALID_ACCESS_TOKEN("Invalid Google token");
    }

    const payload = ticket.getPayload();
    const {
      sub: googleId,
      email,
      given_name: firstName = "",
      family_name: lastName = "",
      picture: img
    } = payload;

    if (!email) {
      throw new errors.INVALID_FIELDS_PROVIDED("Email not found in Google token");
    }

    // ---------------------------------------------------
    // FETCH USER
    // ---------------------------------------------------
    let user = await connection.queryOne(
      `
      SELECT 
        id,
        email,
        google_id,
        first_name,
        last_name,
        img_path,
        status,
        password_hash,
        gender,
        dob,
        is_email_verified,
        is_fully_verified,
        token_version,
        total_spent,
        default_phone_id,
        default_address_id
      FROM users
      WHERE email = ?
        AND deleted_at IS NULL
      LIMIT 1
      `,
      [email]
    );

    // ---------------------------------------------------
    // CREATE USER (IF NOT EXISTS)
    // ---------------------------------------------------
    if (!user) {
      const result = await connection.query(
        `
        INSERT INTO users (
          google_id,
          email,
          first_name,
          last_name,
          img_path,
          is_email_verified,
          status,
          register_ip
        )
        VALUES (?, ?, ?, ?, ?, 1, 'active', ?)
        `,
        [
          googleId,
          email,
          firstName || null,
          lastName || null,
          img || null,
          ip || null
        ]
      );

      user = {
        id: result.insertId,
        email,
        google_id: googleId,
        first_name: firstName,
        last_name: lastName,
        img_path: img,
        status: "active",
        gender: null,
        dob: null,
        is_email_verified: true,
        is_fully_verified: false,
        token_version: 0,
        total_spent: 0,
        default_phone_id: null,
        default_address_id: null
      };


      // 6. Load email config
      // const configs = await getConfig(connection, false, "email");
      // if (!configs.length || configs[0].is_active === 0) {
      //   throw new errors.SERVICE_UNAVAILABLE("Email service disabled");
      // }



      // const cfg = configs.reduce((acc, c) => {
      //   acc[c.key_name] = c.value;
      //   return acc;
      // }, {});

      // 7. Send email
      // const transporter = nodemailer.createTransport({
      //   host: cfg.MAIL_HOST,
      //   port: parseInt(cfg.MAIL_PORT),
      //   secure: parseInt(cfg.MAIL_PORT) === 465,
      //   auth: {
      //     user: cfg.MAIL_USER,
      //     pass: cfg.MAIL_PASS
      //   }
      // });

      // try {
      //   await transporter.sendMail({
      //     from: `"Vellora Team" <${cfg.MAIL_USER}>`,
      //     to: email,
      //     subject: "Welcome to Vellora",
      //     html: `
      //     <p>Hello ${firstName || 'User'},</p>
      //     <p>Welcome to Vellora! Your account has been successfully created using Google authentication.</p>
      //   `
      //   });
      // } catch (err) {
      //   console.error("Email send failed:", err);
      // }


      // ─────────────────── Send Email ───────────────────
      await sendWelcome(connection, {
        name: `${firstName} ${lastName || "User"}`,
        email
      });



      await connection.query(
        `
        INSERT INTO user_audit_logs
          (user_id, action, ip_address, user_agent)
        VALUES (?, 'GOOGLE_REGISTER', ?, ?)
        `,
        [user.id, ip, userAgent]
      );
    }
    // ---------------------------------------------------
    // LOGIN EXISTING USER
    // ---------------------------------------------------
    else {
      if (user.status !== "active") {
        throw new errors.FORBIDDEN("Account is deactivated");
      }

      const updateFields = {};
      if (!user.google_id) updateFields.google_id = googleId;
      if (!user.first_name && firstName) updateFields.first_name = firstName;
      if (!user.last_name && lastName) updateFields.last_name = lastName;
      if (!user.img_path && img) updateFields.img_path = img;
      if (!user.is_email_verified) updateFields.is_email_verified = 1;

      if (Object.keys(updateFields).length) {
        const setClause = Object.keys(updateFields)
          .map(k => `${k} = ?`)
          .join(", ");

        await connection.query(
          `
          UPDATE users
          SET ${setClause}
          WHERE id = ?
          `,
          [...Object.values(updateFields), user.id]
        );
      }

      await connection.query(
        `
        INSERT INTO user_audit_logs
          (user_id, action, ip_address, user_agent)
        VALUES (?, 'GOOGLE_LOGIN', ?, ?)
        `,
        [user.id, ip, userAgent]
      );
    }

    // ---------------------------------------------------
    // LOAD PHONES
    // ---------------------------------------------------
    const phones = await connection.query(
      `
      SELECT 
        id,
        phone_number,
        is_verified
      FROM user_phones
      WHERE user_id = ?
      ORDER BY id ASC
      `,
      [user.id]
    );

    // ---------------------------------------------------
    // LOAD ADDRESSES
    // ---------------------------------------------------
    const addresses = await connection.query(
      `
      SELECT 
        id,
        phone_id,
        name,
        address_type,
        full_address,
        city,
        zip_code
      FROM user_addresses
      WHERE user_id = ?
      ORDER BY id ASC
      `,
      [user.id]
    );

    // ---------------------------------------------------
    // JWT
    // ---------------------------------------------------
    const tokenPayload = {
      uid: user.id,
      ev: true,
      fv: user.is_fully_verified,
      tv: user.token_version,
      hp: user.password_hash ? true : false
    };

    const accessToken = jwt.sign(tokenPayload, jwtSecret);

    // ---------------------------------------------------
    // RESPONSE
    // ---------------------------------------------------
    return {
      success: true,
      access_token: accessToken,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        img_path: user.img_path,
        status: user.status,
        has_password: user.password_hash ? true : false,
        gender: user.gender,
        dob: user.dob,
        is_email_verified: true,
        is_fully_verified: user.is_fully_verified,
        total_spent: user.total_spent,
        default_phone: user.default_phone_id,
        phones,
        default_address: user.default_address_id,
        addresses
      }
    };
  }
);




exports.createUser = api(
  {
    body: {
      email: { type: "string", required: true },
      first_name: { type: "string", required: true },
      last_name: { type: "string", required: true },
      password: { type: "string", required: true },
      ip: { type: "string" }
    }
  },
  async (req, connection) => {
    const userAgent = req.headers["user-agent"] || null;

    const { email, first_name, last_name, password } = req.typed.body;

    // ─────────────────── Validation ───────────────────
    validateLogin(email, password);

    if (req.typed.body.ip && !validator.isIP(req.typed.body.ip)) {
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid IP address");
    }

    if (first_name.length < 2 || first_name.length > 50) {
      throw new errors.INVALID_FIELDS_PROVIDED(
        "First name must be between 2 and 50 characters"
      );
    }

    if (last_name.length < 2 || last_name.length > 50) {
      throw new errors.INVALID_FIELDS_PROVIDED(
        "Last name must be between 2 and 50 characters"
      );
    }

    // ─────────────────── Check existing user ───────────────────
    const existingUser = await connection.queryOne(
      `
      SELECT id, is_email_verified , deleted_at
      FROM users
      WHERE email = ?
        
      `,
      [email]
    );

    let userId;

    // ─────────────────── Create or Update user ───────────────────
    const passwordHash = await bcrypt.hash(password, 12);

    if (existingUser) {


      if (existingUser.deleted_at != null) {
        throw new errors.ALREADY_EXIST("Email was  deleted , contact help line");
      }


      if (existingUser.is_email_verified === 1) {
        throw new errors.ALREADY_EXIST("Email already verified ");
      }

      // Update unverified user
      await connection.query(
        `
        UPDATE users
        SET
          password_hash = ?,
          first_name = ?,
          last_name = ? 
        WHERE id = ?
        `,
        [passwordHash, first_name, last_name, existingUser.id]
      );

      userId = existingUser.id;
    } else {
      // Insert new user
      const result = await connection.query(
        `
        INSERT INTO users
          (email, password_hash, first_name, last_name)
        VALUES (?, ?, ?, ?)
        `,
        [email, passwordHash, first_name, last_name]
      );

      userId = result.insertId;
    }

    // ─────────────────── OTP (UPSERT) ───────────────────
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExp = new Date(Date.now() + 10 * 60 * 1000);

    await connection.query(
      `
      INSERT INTO user_verifications
        (user_id, email_otp, email_otp_exp)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE
        email_otp = VALUES(email_otp),
        email_otp_exp = VALUES(email_otp_exp) 
      `,
      [userId, otp, otpExp]
    );

    // ─────────────────── Audit Log ───────────────────
    await connection.query(
      `
      INSERT INTO user_audit_logs
        (user_id, action, ip_address, user_agent)
      VALUES (?, 'USER_REGISTER', ?, ?)
      `,
      [userId, req.typed.body.ip || null, userAgent]
    );

    // ─────────────────── Send Email ───────────────────
    await sendEmailVerification(connection, {
      name: `${first_name} ${last_name || ""}`,
      email,
      otp
    });


    // Convert array to a key-value object for easy access

    // 2. Fetch and Map Email Configurations
    //     const configs = await getConfig(connection, false, 'email');

    //     // Check if the email service is globally active
    //     if (configs.length === 0 || configs[0].is_active === 0) {
    //       throw new errors.SERVICE_UNAVAILABLE("Email service is currently disabled.");
    //     }

    //   const cfg = configs.reduce((acc, item) => {
    //     acc[item.key_name] = item.value;
    //     return acc;
    //   }, {});


    //   const transporter = nodemailer.createTransport({
    //     host: cfg.MAIL_HOST,
    //     port: parseInt(cfg.MAIL_PORT),
    //     secure: parseInt(cfg.MAIL_PORT) === 465,
    //     auth: { user: cfg.MAIL_USER, pass: cfg.MAIL_PASS }
    //   });



    // try {
    //     await transporter.sendMail({
    //       from: `"Vellora Team" <${cfg.MAIL_USER}>`,
    //       to: email,
    //       subject: "Email verification",
    //       html: `<p>Hello ${ first_name || 'user'},</p>
    //              <p>Your verification  otp is: <b>${otp}</b></p>
    //              <p>This code expires in 15 minutes.</p>`
    //     });


    //   } catch (err) {
    //     console.error("Mail Error:", err);
    //     // We return success to the user but log the error for the dev
    //   }



    // ─────────────────── Response ───────────────────
    return {
      success: true,
      message: "Account created. OTP sent to email."
    };
  }
);



exports.resendVerificationOtp = api(
  {
    body: {
      email: { type: "string", required: true }
    }
  },
  async (req, connection) => {
    const { email } = req.typed.body;
    if (!validator.isEmail(email)) throw new errors.INVALID_PARAMETER("Invalid email");



    /* ---------------- FETCH USER ---------------- */

    const user = await connection.queryOne(
      `SELECT id, first_name,last_name, is_email_verified FROM users WHERE email = ? AND deleted_at IS NULL`,
      [email]
    );

    if (!user) {
      throw new errors.NOT_FOUND("User not found");
    }

    if (user.is_email_verified) {
      throw new errors.BAD_REQUEST("Email already verified");
    }

    /* ---------------- GENERATE OTP ---------------- */

    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExp = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    await connection.query(
      `UPDATE user_verifications 
       SET email_otp = ?, email_otp_exp = ? 
       WHERE user_id = ?`,
      [otp, otpExp, user.id]
    );



    await sendEmailVerification(connection, {
      name: `${user.first_name} ${user.last_name || ""}`,
      email,
      otp
    });
    /* ---------------- LOAD EMAIL CONFIG ---------------- */

    // const configs = await getConfig(connection, false, "email");
    // if (!configs.length || configs[0].is_active === 0) {
    //   throw new errors.SERVICE_UNAVAILABLE("Email service disabled");
    // }

    // const cfg = configs.reduce((acc, c) => {
    //   acc[c.key_name] = c.value;
    //   return acc;
    // }, {});

    // /* ---------------- SEND EMAIL ---------------- */

    // const transporter = nodemailer.createTransport({
    //   host: cfg.MAIL_HOST,
    //   port: parseInt(cfg.MAIL_PORT),
    //   secure: parseInt(cfg.MAIL_PORT) === 465,
    //   auth: {
    //     user: cfg.MAIL_USER,
    //     pass: cfg.MAIL_PASS
    //   }
    // });

    // try {
    //   await transporter.sendMail({
    //     from: `"Vellora Team" <${cfg.MAIL_USER}>`,
    //     to: email,
    //     subject: "Your Email Verification Code",
    //     html: `
    //       <p>Hello ${user.first_name},</p>
    //       <p>Your email verification code is:</p>
    //       <h2>${otp}</h2>
    //       <p>This code expires in 10 minutes.</p>
    //     `
    //   });
    // } catch (err) {
    //   console.error("Email send failed:", err);
    //   throw new errors.SERVICE_UNAVAILABLE("Failed to send verification email");
    // }

    /* ---------------- AUDIT LOG ---------------- */

    await connection.query(
      `INSERT INTO user_audit_logs (user_id, action)
       VALUES (?, 'RESEND_OTP' )`,
      [user.id]
    );

    return {
      success: true,
      message: "Verification code resent successfully"
    };
  }
);





exports.verifyEmailOtp = api(
  {
    body: {
      email: { type: "string", required: true },
      otp: { type: "string", required: true },
      ip: { type: "string" }
    }
  },
  async (req, connection) => {
    const { email, otp, ip } = req.typed.body;
    const userAgent = req.headers["user-agent"] || null;

    if (!validator.isEmail(email)) {
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid email format");
    }

    if (ip && !validator.isIP(ip)) {
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid IP address");
    }
    // 1. Validate OTP
    const user = await connection.queryOne(
      `
      SELECT 
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.token_version,
        u.img_path,
        u.status,
        u.password_hash,
        u.gender,
        u.dob,
        u.is_email_verified,
        u.is_fully_verified,
        u.total_spent,
        u.register_ip,
        u.default_phone_id,
        u.default_address_id
      FROM users u
      JOIN user_verifications uv ON uv.user_id = u.id
      WHERE u.email = ?
        AND u.status = 'active'
        AND uv.email_otp = ?
        AND uv.email_otp_exp > NOW()
        AND u.deleted_at IS NULL
      `,
      [email, otp]
    );

    if (!user) {
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid or expired OTP");
    }

    // 2. Update verification + token version
    await connection.query(
      `
      UPDATE users u
      JOIN user_verifications uv ON uv.user_id = u.id
      SET 
        u.is_email_verified = 1,
        u.token_version = u.token_version + 1,
        u.register_ip = COALESCE(u.register_ip, ?),
        uv.email_otp = NULL,
        uv.email_otp_exp = NULL
      WHERE u.id = ?
      `,
      [ip, user.id]
    );

    // 3. Audit log
    await connection.query(
      `
      INSERT INTO user_audit_logs
        (user_id, action, ip_address, user_agent, old_values, new_values)
      VALUES (?, 'VERIFY_EMAIL', ?, ?, ?, ?)
      `,
      [
        user.id,
        ip,
        userAgent,
        JSON.stringify({ is_email_verified: 0 }),
        JSON.stringify({ is_email_verified: 1 })
      ]
    );

    // 4. Generate JWT (token_version already incremented)
    const tokenPayload = {
      uid: user.id,
      ev: true,
      fv: user.is_fully_verified,
      tv: user.token_version + 1,
      hp: user.password_hash ? true : false
    };

    const accessToken = jwt.sign(tokenPayload, jwtSecret);

    return {
      success: true,
      access_token: accessToken,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        img_path: user.img_path,
        status: user.status,
        has_password: user.password_hash ? true : false,
        gender: user.gender,
        dob: user.dob,
        is_email_verified: true,
        is_fully_verified: user.is_fully_verified == 1,
        total_spent: user.total_spent,
        default_phone: user.default_phone_id,
        phones: [],
        default_address: user.default_address_id,
        addresses: []
      }
    };
  }
);

exports.loginUser = api(
  {
    body: {
      email: { type: "string", required: true },
      password: { type: "string", required: true },
      ip: { type: "string" }
    }
  },
  async (req, connection) => {
    const { email, password, ip } = req.typed.body;
    const userAgent = req.headers["user-agent"] || null;

    validateLogin(email, password);
    if (ip && !validator.isIP(ip)) {
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid IP address");
    }

    // 1. Fetch user
    const user = await connection.queryOne(
      `
      SELECT 
        id,
        email,
        password_hash,
        token_version,
        first_name,
        last_name,
        img_path,
        status,
        gender,
        dob,
        is_email_verified,
        is_fully_verified,
        default_phone_id,
        default_address_id,
        total_spent,
        register_ip
      FROM users
      WHERE email = ? and status ='active'
        AND deleted_at IS NULL
      LIMIT 1
      `,
      [email]
    );

    if (!user || !user.password_hash) {
      throw new errors.INVALID_EMAIL_PASS("Invalid email or password");
    }

    if (user.status !== "active") {
      throw new errors.FORBIDDEN("Account is not active");
    }

    if (!user.is_email_verified) {
      throw new errors.FORBIDDEN("Email not verified");
    }

    // 2. Verify password
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      throw new errors.INVALID_EMAIL_PASS("Invalid email or password");
    }

    // 3. Load phones
    const phones = await connection.query(
      `
      SELECT 
        id,
        phone_number,
        is_verified
      FROM user_phones
      WHERE user_id = ?
      ORDER BY   id ASC
      `,
      [user.id]
    );


    // 4. Load addresses
    const addresses = await connection.query(
      `
      SELECT 
        id,
        name,
        phone_id,
        address_type,
        full_address,
        city,
        zip_code
      FROM user_addresses
      WHERE user_id = ?
      ORDER BY id ASC
      `,
      [user.id]
    );


    if (ip && !user.register_ip) {
      await connection.query(
        `
    UPDATE users SET register_ip = ? WHERE id = ?
    `,
        [ip, user.id]
      );
    }

    // 5. Audit log (LOGIN)
    await connection.query(
      `
      INSERT INTO user_audit_logs
        (user_id, action, ip_address, user_agent)
      VALUES (?, 'LOGIN', ?, ?)
      `,
      [user.id, ip, userAgent]
    );

    // 6. Generate JWT
    const tokenPayload = {
      uid: user.id,
      ev: true,
      fv: user.is_fully_verified,
      tv: user.token_version,
      hp: user.password_hash ? true : false
    };

    const accessToken = jwt.sign(tokenPayload, jwtSecret);

    return {
      success: true,
      access_token: accessToken,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        img_path: user.img_path,
        status: user.status,
        has_password: user.password_hash ? true : false,
        gender: user.gender,
        dob: user.dob,
        is_email_verified: true,
        is_fully_verified: user.is_fully_verified,
        total_spent: user.total_spent,
        default_phone: user.default_phone_id,
        phones,
        default_address: user.default_address_id,
        addresses
      }
    };
  }
);






exports.userForgotPassword = api(
  {
    body: {
      email: { type: "string", required: false },
      phone_number: { type: "string", required: false }
    }
  },
  async (req, connection) => {
    const { email, phone_number } = req.typed.body;
    const permission = await getForgotPassMethodConfig(connection);

    validateForgotPasswordChannel({ email, phone_number, permission });

    let user;

    // 1️⃣ Find user
    if (email) {
      if (!validator.isEmail(email)) throw new errors.INVALID_FIELDS_PROVIDED("Invalid email format");

      user = await connection.queryOne(
        `SELECT id, first_name,last_name, email FROM users WHERE email=? and status='active' AND deleted_at IS NULL`,
        [email]
      );
    } else if (phone_number) {
      user = await connection.queryOne(
        `SELECT u.id, u.first_name,u.last_name, up.phone_number 
         FROM users u
         JOIN user_phones up ON up.user_id = u.id
         WHERE up.phone_number = ? and up.is_verified = 1 and u.status='active' AND u.deleted_at IS NULL`,
        [phone_number]
      );
    }

    if (!user) {
      // Security: don't reveal existence
      // return { success: true, message: "If this contact exists, an OTP has been sent." };
      throw new errors.NOT_FOUND("User not found or inactive.");
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    // 2️⃣ Save OTP
    if (email) {
      // Save in user_verifications
      await connection.query(
        `INSERT INTO user_verifications (user_id, pass_otp, pass_otp_exp)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE pass_otp=?, pass_otp_exp=?`,
        [user.id, otp, expiresAt, otp, expiresAt]
      );



      // ─────────────────── Send Email ───────────────────
      await sendForgotPassEmail(connection, {
        name: `${user.first_name} ${user.last_name || ""}`,
        email,
        otp
      });

  

    } else if (phone_number) {
      // Save in user_phones

      await connection.query(
        `INSERT INTO user_verifications (user_id, pass_otp, pass_otp_exp)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE pass_otp=?, pass_otp_exp=?`,
        [user.id, otp, expiresAt, otp, expiresAt]
      );


      // Send SMS
      const result = await sendSMS(connection, phone_number, `Your ${BRAND_NAME} reset password OTP is ${otp}. It expires in 10 minutes. Do not share it with anyone.`);
      if (!result.success) {
        throw new errors.BAD_REQUEST(`SMS sending failed: ${result.msg}`);
      }
    }

    return {
      success: true,
      message: `Otp is sent to your ${email ? "email" : "phone number"}`
    };
  }
);



exports.verifyUserForgotPasswordOtp = api(
  {
    body: {
      email: { type: "string", required: false },
      phone_number: { type: "string", required: false },
      otp: { type: "string", required: true }
    }
  },
  async (req, connection) => {
    const { email, phone_number, otp } = req.typed.body;
    const permission = await getForgotPassMethodConfig(connection);

    validateForgotPasswordChannel({ email, phone_number, permission });

    let user;

    // 1️⃣ Find user and check OTP
    if (email) {
      user = await connection.queryOne(
        `SELECT u.id
         FROM users u
         JOIN user_verifications uv ON uv.user_id = u.id
         WHERE u.email=? AND uv.pass_otp=? AND uv.pass_otp_exp > NOW() AND u.status='active' AND u.deleted_at IS NULL`,
        [email, otp]
      );
    } else if (phone_number) {


      user = await connection.queryOne(
        `SELECT u.id
         FROM users u
         JOIN user_phones up ON up.user_id = u.id
         JOIN user_verifications uv ON uv.user_id = u.id
         WHERE up.phone_number = ? AND up.is_verified = 1 AND uv.pass_otp=? AND uv.pass_otp_exp > NOW() AND u.status='active' AND u.deleted_at IS NULL`,
        [phone_number, otp]
      );
    }

    if (!user) {
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid or expired OTP");
    }

    return {
      success: true,
      message: "OTP is valid"
    };
  }
);



exports.userResetPassword = api(
  {
    body: {
      email: { type: "string", required: false },
      phone_number: { type: "string", required: false },
      otp: { type: "string", required: true },
      new_password: { type: "string", required: true }
    }
  },
  async (req, connection) => {
    const { email, phone_number, otp, new_password } = req.typed.body;
    const permission = await getForgotPassMethodConfig(connection);

    validateForgotPasswordChannel({ email, phone_number, permission });

    if (!validator.isLength(new_password, { min: 8, max: 20 })) {
      throw new errors.INVALID_FIELDS_PROVIDED('Password must be between 8 and 20 characters.');
    }

    let user;

    // 1️⃣ Find user and verify OTP
    if (email) {
      user = await connection.queryOne(
        `SELECT u.id, u.token_version
         FROM users u
         JOIN user_verifications uv ON uv.user_id = u.id
         WHERE u.email=? AND uv.pass_otp=? AND uv.pass_otp_exp > NOW() AND u.status='active' AND u.deleted_at IS NULL`,
        [email, otp]
      );
    } else if (phone_number) {
      user = await connection.queryOne(
        `SELECT u.id, u.token_version
         FROM users u
         JOIN user_phones up ON up.user_id = u.id
         JOIN user_verifications uv ON uv.user_id = u.id
         WHERE up.phone_number = ? AND up.is_verified = 1 AND uv.pass_otp=? AND uv.pass_otp_exp > NOW() AND u.status='active' AND u.deleted_at IS NULL`,
        [phone_number, otp]
      );
    }
    if (!user) {
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid or expired OTP");
    }

    // 2️⃣ Hash new password
    const hashedPassword = await bcrypt.hash(new_password, 12);

    // 3️⃣ Update user password, clear OTP, bump token_version
    await connection.query(
      `UPDATE users u
       JOIN user_verifications uv ON uv.user_id = u.id
       SET u.password_hash=?, u.token_version=u.token_version+1, uv.pass_otp=NULL, uv.pass_otp_exp=NULL
       WHERE u.id=?`,
      [hashedPassword, user.id]
    );

    await connection.query(`insert into user_audit_logs (user_id, action) values (?, 'PASSWORD_RESET')`, [user.id]);

    return {
      success: true,
      message: "Password reset successful. Please login with your new password."
    };
  }
);





exports.getProfile = api(
  {},
  async (req, connection) => {
    // 1. Extract and Verify Token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new errors.INVALID_ACCESS_TOKEN();
    }

    const token = authHeader.split(" ")[1];
    const decodedToken = await verifyJwt(token, jwtSecret);

    if (!decodedToken || !decodedToken.uid) {
      throw new errors.INVALID_ACCESS_TOKEN();
    }

    // 2. Fetch User (Including names which were missing in your wrapper)
    const user = await connection.queryOne(
      `
            SELECT 
                id,
                email,
                first_name,
                last_name,
                img_path,
                status,
                gender,
                dob,
                is_email_verified,
                is_fully_verified,
                password_hash,
                token_version,
                default_phone_id,
                default_address_id,
                total_spent
            FROM users
            WHERE id = ? AND status = 'active' AND deleted_at IS NULL
            LIMIT 1
            `,
      [decodedToken.uid]
    );

    if (!user) {
      throw new errors.INVALID_ACCESS_TOKEN();
    }
    // 4. Email verification consistency check
    if (!user.is_email_verified || decodedToken.ev !== true) {
      throw new errors.UNAUTHORIZED("Email verification required");
    }

    // Token version check (to match your auth logic)
    if (decodedToken.tv !== user.token_version) {
      throw new errors.UNAUTHORIZED("Session expired, please login again");
    }

    // 3. Load phones
    const phones = await connection.query(
      `
            SELECT id, phone_number, is_verified
            FROM user_phones
            WHERE user_id = ?
            ORDER BY id ASC
            `,
      [user.id]
    );

    // 4. Load addresses
    const addresses = await connection.query(
      `
            SELECT id, phone_id,name, address_type, full_address, city, zip_code
            FROM user_addresses
            WHERE user_id = ?
            ORDER BY id ASC
            `,
      [user.id]
    );

    // 5. Return the exact same structure as loginUser
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        img_path: user.img_path,
        status: user.status,
        gender: user.gender,
        dob: user.dob,
        is_email_verified: !!user.is_email_verified,
        is_fully_verified: !!user.is_fully_verified,
        has_password: user.password_hash ? true : false,
        total_spent: user.total_spent,
        default_phone: user.default_phone_id,
        phones,
        default_address: user.default_address_id,
        addresses
      }
    };
  }
);



exports.editProfile = optionalUploadApi(
  "profile",
  {
    body: {
      first_name: { type: "string" },
      last_name: { type: "string" },
      gender: { type: "string" },
      dob: { type: "string" },
      phone: { type: "string" }
    }
  },
  userAuth(async (req, connection, user) => {
    const userId = user.id;
    const { first_name, last_name, gender, dob, phone } = req.typed.body;

    // 1. Validation
    if (first_name && (first_name.length < 2 || first_name.length > 50)) throw new errors.INVALID_FIELDS_PROVIDED("First name must be between 2 and 50 characters");
    if (last_name && (last_name.length < 2 || last_name.length > 50)) throw new errors.INVALID_FIELDS_PROVIDED("Last name must be between 2 and 50 characters");
    if (gender && !['male', 'female', 'other', 'unspecified'].includes(gender)) throw new errors.INVALID_FIELDS_PROVIDED("Invalid gender value");
    if (dob && !validator.isDate(dob)) throw new errors.INVALID_FIELDS_PROVIDED("Invalid date of birth format");

    const updates = [];
    const params = [];

    if (first_name) { updates.push("first_name = ?"); params.push(first_name); }
    if (last_name) { updates.push("last_name = ?"); params.push(last_name); }
    if (gender) { updates.push("gender = ?"); params.push(gender); }
    if (dob) { updates.push("dob = ?"); params.push(dob); }

    // 2. Complex Phone Logic (Ghost Record Protection)
    if (phone) {
      if (!validator.isMobilePhone(phone)) throw new errors.INVALID_FIELDS_PROVIDED("Invalid phone number format");


      // // Check if this phone exists ANYWHERE in the system
      // const exists = await connection.query(
      //   `SELECT id, user_id, is_verified FROM user_phones WHERE phone_number = ?`,
      //   [phone]
      // );



      // if (exists.length > 0) {
      //   for (const phoneRecord of exists) {
      //     // Rule A: If someone else has already verified this phone, block it
      //     if (phoneRecord.is_verified === 1 && phoneRecord.user_id !== userId) {
      //       throw new errors.ALREADY_EXIST("Phone number is already verified by another user");
      //     }

      //     // Rule B: If it belongs to the current user
      //     if (phoneRecord.user_id === userId) {
      //       if (phoneRecord.is_verified === 1) {
      //         // It's verified and belongs to user: Set as default
      //         updates.push("default_phone_id = ?");
      //         params.push(phoneRecord.id);

      //         //<cutter>
      //         updates.push("is_fully_verified = ?");
      //         params.push(1);
      //         //</cutter>

      //       } else {
      //         // It's not verified: Don't allow setting as default yet
      //         //throw new errors.BAD_REQUEST("Phone number already exists for you but is not verified.");

      //         //<cutter>
      //         updates.push("default_phone_id = ?");
      //         params.push(phoneRecord.id);
      //         updates.push("is_fully_verified = ?");
      //         params.push(0);
      //         //</cutter>

      //       }
      //     }
      //   }
      // } else {

      //   console.log("=====================d");
      //   // Rule C: Doesn't exist at all, insert as unverified ghost record
      //    const newphone= await connection.query(
      //     "INSERT INTO user_phones (user_id, phone_number, is_verified) VALUES (?, ?, ?)",
      //     [userId, phone, 0]
      //   );

      //        //<cutter>
      //         updates.push("default_phone_id = ?");
      //         params.push(newphone.insertId);
      //         updates.push("is_fully_verified = ?");
      //         params.push(0);
      //         //</cutter>
      // }


      const verifiedRow = await connection.queryOne(
        `SELECT id, user_id 
   FROM user_phones 
   WHERE phone_number = ? AND is_verified = 1
   `,
        [phone]
      );

      if (verifiedRow && verifiedRow.user_id !== userId) {
        throw new errors.ALREADY_EXIST(
          "Phone number is already verified by another user"
        );
      }


      const ownRow = await connection.queryOne(
        `SELECT id, is_verified
   FROM user_phones
   WHERE phone_number = ? AND user_id = ?
   `,
        [phone, userId]
      );


      let phoneId;
      let fullyVerified = 0;

      if (ownRow) {
        phoneId = ownRow.id;
        fullyVerified = ownRow.is_verified ? 1 : 0;
      } else {
        const result = await connection.query(
          `INSERT INTO user_phones (user_id, phone_number, is_verified)
     VALUES (?, ?, 0)`,
          [userId, phone]
        );
        phoneId = result.insertId;
      }


      updates.push("default_phone_id = ?");
      params.push(phoneId);

      updates.push("is_fully_verified = ?");
      params.push(fullyVerified);





    }

    // 3. Image Handling
    if (user.img_path) deleteFileIfExists(user.img_path);

    if (req.files && req.files.profile) {
      const newpath = await saveImage(req.files.profile[0].path, `profiles/users/${userId}`);
      updates.push("img_path = ?");
      params.push(newpath);
    }

    // 3. Execute Updates
    if (updates.length > 0) {
      params.push(userId);
      await connection.query(
        `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
        params
      );
    }

    // ─── User Audit Log ───────────────────────────────────────────────
    if (updates.length > 0) {
      const changedFields = {};
      if (first_name) changedFields.first_name = first_name;
      if (last_name) changedFields.last_name = last_name;
      if (gender) changedFields.gender = gender;
      if (dob) changedFields.dob = dob;
      if (req.file) changedFields.profile_image = "updated";

      await connection.query(
        `INSERT INTO user_audit_logs (user_id, action, ip_address, new_values)
         VALUES (?, 'UPDATE_PROFILE', ?, ?)`,
        [userId, req.ip || null, JSON.stringify(changedFields)]
      );
    }

    return {
      success: true,
      message: "Profile updated successfully"
    };
  })
);




exports.changePassword = api(
  {
    body: {
      oldPassword: { type: "string", required: true },
      newPassword: { type: "string", required: true }
    }
  },
  userAuth(async (req, connection, user) => {
    const userId = user.id;
    const { oldPassword, newPassword } = req.typed.body;

    if (!validator.isLength(oldPassword, { min: 8, max: 20 })) {
      throw new errors.INVALID_FIELDS_PROVIDED("Password must be between 8 and 20 characters.");
    }

    if (!validator.isLength(newPassword, { min: 8, max: 20 })) {
      throw new errors.INVALID_FIELDS_PROVIDED("Password must be between 8 and 20 characters.");
    }

    const dbUser = await connection.queryOne(
      "SELECT password_hash FROM users WHERE id = ?",
      [userId]
    );

    // if (!dbUser?.password_hash) {
    //   throw new errors.NOT_FOUND("User record not found");
    // }


    if (!dbUser) {
      throw new errors.NOT_FOUND("User record not found");
    }
    if (!dbUser.password_hash) {
      throw new errors.BAD_REQUEST("Password change not allowed for users without a password.");
    }

    const match = await bcrypt.compare(oldPassword, dbUser.password_hash);
    if (!match) {
      throw new errors.UNAUTHORIZED("Invalid old password");
    }

    const sameAsOld = await bcrypt.compare(newPassword, dbUser.password_hash);
    if (sameAsOld) {
      throw new errors.INVALID_FIELDS_PROVIDED("New password must be different from old password.");
    }

    const newHash = await bcrypt.hash(newPassword, 12);


    await connection.query(
      `UPDATE users 
       SET password_hash = ?, token_version = token_version + 1 
       WHERE id = ?`,
      [newHash, userId]
    );

    await connection.query(
      `INSERT INTO user_audit_logs (user_id, action) 
       VALUES (?, 'PASSWORD_CHANGE')`,
      [userId]
    );



    return {
      success: true,
      message: "Password changed successfully. Please log in again."
    };
  })
);


exports.setInitialPassword = api(
  {
    body: {
      password: { type: "string", required: true },
      ip: { type: "string", required: false }
    }
  },
  userAuth(async (req, connection, user) => {
    const userId = user.id;
    const { password, ip } = req.typed.body;

    // 1. IP Validation (Only if provided)
    if (ip && !validator.isIP(ip)) {
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid IP address");
    }

    // 2. Password Strength Validation
    if (!validator.isLength(password, { min: 8, max: 20 })) {
      throw new errors.INVALID_FIELDS_PROVIDED("Password must be between 8 and 20 characters.");
    }


    // If they already have a password, they must use the changePassword flow instead
    if (user.has_password) {
      throw new errors.BAD_REQUEST(
        "A password has already been set for this account. Please use the Change Password option."
      );
    }


    if (!user.isEmailVerified) {
      throw new errors.BAD_REQUEST(
        "Email not verified"
      );
    }

    // 4. Hash the password
    const saltRounds = 12;
    const newHash = await bcrypt.hash(password, saltRounds);

    // 5. Update User Record
    // We increment token_version to refresh the security state of the account
    await connection.query(
      `UPDATE users 
       SET password_hash = ?, 
           token_version = token_version + 1 
       WHERE id = ?`,
      [newHash, userId]
    );


    await connection.query(
      `INSERT INTO user_audit_logs (user_id, action, ip_address) 
       VALUES (?, 'SET_INITIAL_PASSWORD', ?)`,
      [userId, ip || null]
    );

    return {
      success: true,
      message: "Password set successfully. You can now use this password to log in next time."
    };
  })
);


exports.insertPhone = api(
  {
    body: {
      phone_number: { type: "string", required: true }
    }
  },
  userAuth(async (req, connection, user) => {
    const { phone_number } = req.typed.body;

    if (!validator.isMobilePhone(phone_number)) throw new errors.INVALID_FIELDS_PROVIDED("Invalid phone number format");

    // Check duplicate
    const exists = await connection.query(
      `SELECT id,user_id,is_verified FROM user_phones WHERE  phone_number=?`,
      [phone_number]
    );

    // Replace the .forEach block with this:
    if (exists.length > 0) {
      for (const phone of exists) {
        if (phone.is_verified === 1) {
          throw new errors.ALREADY_EXIST("Phone number already exists and verified");
        }

        if (phone.user_id === user.id) {
          throw new errors.ALREADY_EXIST("Phone number already exists for this user");
        }
      }
    }


    await connection.query(
      `INSERT INTO user_phones (user_id, phone_number, is_verified) VALUES (?, ?, 0)`,
      [user.id, phone_number]
    );

    // Audit log
    await connection.query(
      `INSERT INTO user_audit_logs (user_id, action,  new_values) VALUES (?, 'ADD_PHONE',  ?)`,
      [user.id, JSON.stringify({ phone_number })]
    );

    return {
      success: true,
      msg: "Phone added successfully"
    };
  })
);


exports.sendPhoneOtp = api(
  {
    body: {
      phone_id: { type: "int", required: true }

    }
  },
  userAuth(async (req, connection, user) => {
    const { phone_id } = req.typed.body;

    const phone = await connection.queryOne(
      `SELECT id, phone_number, is_verified FROM user_phones WHERE id=? AND user_id=?`,
      [phone_id, user.id]
    );

    if (!phone) throw new errors.NOT_FOUND("Phone record not found");
    if (phone.is_verified) throw new errors.BAD_REQUEST("This phone record is already verified");

    // CRITICAL CHECK: Ensure no OTHER user has verified this exact number while you were waiting
    const isClaimed = await connection.queryOne(
      `SELECT id FROM user_phones WHERE phone_number = ? AND is_verified = 1 AND user_id != ?`,
      [phone.phone_number, user.id]
    );

    if (isClaimed) {
      throw new errors.ALREADY_EXIST("This phone number has already been verified by another account");
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExp = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    // Save OTP
    await connection.query(
      `UPDATE user_phones SET otp=?, otp_exp=? WHERE id=?`,
      [otp, otpExp, phone_id]
    );

    // Send SMS
    const message = `Your  ${BRAND_NAME} phone verification OTP is ${otp}`;
    const result = await sendSMS(connection, phone.phone_number, message);
    if (!result.success) {
      throw new errors.BAD_REQUEST(`SMS sending failed: ${result.msg}`);
    }

    // Audit log
    await connection.query(
      `INSERT INTO user_audit_logs (user_id, action ) VALUES (?, 'SEND_PHONE_OTP')`,
      [user.id]
    );

    return {
      success: true,
      msg: "OTP sent to your phone number"
    };
  })
);


exports.verifyPhoneOtp = api(
  {
    body: {
      phone_id: { type: "int", required: true },
      otp: { type: "string", required: true }

    }
  },
  userAuth(async (req, connection, user) => {
    const { phone_id, otp } = req.typed.body;

    const phone = await connection.queryOne(
      `SELECT id, is_verified FROM user_phones WHERE id=? AND user_id=? AND otp=? AND otp_exp>NOW()`,
      [phone_id, user.id, otp]
    );

    if (!phone) throw new errors.INVALID_FIELDS_PROVIDED("Invalid or expired OTP");

    await connection.query(
      `UPDATE user_phones SET is_verified=1, otp=NULL, otp_exp=NULL WHERE id=?`,
      [phone_id]
    );




    // Combine both updates into one database call
    await connection.query(
      `UPDATE users SET 
     default_phone_id = COALESCE(default_phone_id, ?),
     is_fully_verified = 1
   WHERE id = ?`,
      [phone_id, user.id]
    );

    // Audit log
    await connection.query(
      `INSERT INTO user_audit_logs (user_id, action ) VALUES (?, 'VERIFY_PHONE')`,
      [user.id]
    );

    return {
      success: true,
      msg: "Phone verified successfully"
    };
  })
);


exports.setDefaultPhone = api(
  {
    body: {
      phone_id: { type: "int", required: true }
    }
  },
  userAuth(async (req, connection, user) => {
    const { phone_id } = req.typed.body;


    const phone = await connection.queryOne(
      `
      SELECT id FROM user_phones
      WHERE id = ? AND user_id = ? AND is_verified = 1
      `,
      [phone_id, user.id]
    );

    if (!phone) {
      throw new errors.NOT_FOUND("Verified phone not found");
    }


    await connection.query(`update users set default_phone_id=? where id=?`, [phone_id, user.id]);


    // 3. Audit log
    await connection.query(
      `
      INSERT INTO user_audit_logs
        (user_id, action,  new_values)
      VALUES (?, 'SET_DEFAULT_PHONE', ?)
      `,
      [
        user.id,

        JSON.stringify({ phone_id })
      ]
    );

    return {
      success: true,
      message: "Default phone updated"
    };
  })
);



exports.getPhones = api(
  {},
  userAuth(async (req, connection, user) => {

    const phones = await connection.query(
      `
      SELECT 
        up.id,
        up.phone_number,
        up.is_verified,
        IF(u.default_phone_id = up.id, 1, 0) AS is_default
      FROM user_phones up
      JOIN users u ON u.id = up.user_id
      WHERE up.user_id = ?
      ORDER BY is_default DESC, up.created_at ASC
      `,
      [user.id]
    );

    return {
      success: true,
      phones
    };
  })
);



exports.deletePhone = api(
  {
    params: {
      phone_id: { type: "int", required: true }
    }
  },
  userAuth(async (req, connection, user) => {
    const { phone_id } = req.typed.params;

    const phone = await connection.queryOne(
      `
      SELECT id
      FROM user_phones
      WHERE id = ? AND user_id = ?
      `,
      [phone_id, user.id]
    );

    if (!phone) {
      throw new errors.NOT_FOUND("Phone not found");
    }

    if (user.default_phone_id === phone_id) {
      throw new errors.FORBIDDEN("Cannot delete default phone. Please set another phone as default first.");
    }



    const count = await connection.queryOne(
      `SELECT COUNT(*) as total FROM user_phones WHERE user_id = ?`,
      [user.id]
    );

    if (count.total <= 1) {
      throw new errors.FORBIDDEN("At least one phone is required");
    }

    await connection.query(
      `DELETE FROM user_phones WHERE id = ?`,
      [phone_id]
    );

    await connection.query(
      `
      INSERT INTO user_audit_logs
        (user_id, action, old_values)
      VALUES (?, 'DELETE_PHONE', ?)
      `,
      [
        user.id,
        JSON.stringify({ phone_id })
      ]
    );

    return {
      success: true,
      message: "Phone deleted"
    };
  })
);


//----------------cutter api

// exports.createAddress = api(
//   {
//     body: {
//       name: { type: "string", required: false },
//       phone: { type: "string", required: false },
//       type: { type: "string", required: true },
//       full_address: { type: "string", required: true },
//       city: { type: "string", required: false },
//       zip_code: { type: "string", required: false }
//     }
//   },
//   userAuth(async (req, connection, user) => {


//     const userId = user.id;
//     const {
//       name,
//       phone,
//       type,
//       full_address,
//       city,
//       zip_code
//     } = req.typed.body;




//     if (!['home', 'office', 'n/a'].includes(type)) throw new errors.INVALID_FIELDS_PROVIDED("Invalid address type");

//     if (full_address.length < 5 || full_address.length > 255)  throw new errors.INVALID_FIELDS_PROVIDED("Full address must be between 5 and 255 characters");

//     if (city && (city.length < 2 || city.length > 100))  throw new errors.INVALID_FIELDS_PROVIDED("City must be between 2 and 100 characters");

//     if (zip_code && (zip_code.length < 2 || zip_code.length > 20))  throw new errors.INVALID_FIELDS_PROVIDED("Zip code must be between 2 and 20 characters");

//     if (phone && !validator.isMobilePhone(phone))  throw new errors.INVALID_FIELDS_PROVIDED("Invalid phone number format");

//     if (name && (name.length < 2 || name.length > 200)) throw new errors.INVALID_FIELDS_PROVIDED("Name must be between 2 and 200 characters");


//     // --------------------------------------------------
//     // 1. HANDLE PHONE LOGIC (YOUR EXACT RULES)
//     // --------------------------------------------------


//      let phoneId = null;
//      let isPhoneVerified = false;

//     if (phone) {
//       const exists = await connection.query(
//         `SELECT id, user_id, is_verified FROM user_phones WHERE phone_number = ?`,
//         [phone]
//       );

//       if (exists.length > 0) {
//         for (const phoneRecord of exists) {
//           // Rule A: Verified phone belongs to someone else
//           if (phoneRecord.is_verified === 1 && phoneRecord.user_id !== userId) {
//             throw new errors.ALREADY_EXIST(
//               "Phone number is already verified by another user"
//             );
//           }

//           // Rule B: Phone belongs to current user
//           if (phoneRecord.user_id === userId) {
//             if (phoneRecord.is_verified === 1) {
//               isPhoneVerified = true;
//               phoneId = phoneRecord.id;
//             } else {
//              phoneId = phoneRecord.id;
//             }
//           }
//         }
//       } else {
//         // Rule C: Insert ghost unverified phone
//         const insertPhone = await connection.query(
//           `INSERT INTO user_phones (user_id, phone_number, is_verified)
//            VALUES (?, ?, 0)`,
//           [userId, phone]
//         );

//         phoneId = insertPhone.insertId;
//       }
//     } else {
//       // --------------------------------------------------
//       // 2. NO PHONE PROVIDED → USE DEFAULT PHONE
//       // --------------------------------------------------
//       if (user.default_phone_id) {
//         phoneId = user.default_phone_id;
//       }
//     }

//     // --------------------------------------------------
//     // 3. NAME FALLBACK
//     // --------------------------------------------------
//     const finalName =
//       name ||
//       [user.first_name, user.last_name].filter(Boolean).join(" ") ||
//       null;

//     // --------------------------------------------------
//     // 4. INSERT ADDRESS
//     // --------------------------------------------------
//     const result = await connection.query(
//       `
//       INSERT INTO user_addresses (
//         user_id,
//         phone_id,
//         name,
//         address_type,
//         full_address,
//         city,
//         zip_code
//       )
//       VALUES (?, ?, ?, ?, ?, ?, ?)
//       `,
//       [
//         userId,
//         phoneId,
//         finalName,
//         type,
//         full_address,
//         city || null,
//         zip_code || null
//       ]
//     );


//      if (user.default_address_id === null && isPhoneVerified === true) {
//        await connection.query(
//          `UPDATE users SET default_address_id = ? WHERE id = ?`,
//          [result.insertId, userId]
//        );
//      }
//     // --------------------------------------------------
//     // 5. AUDIT LOG (OPTIONAL BUT RECOMMENDED)
//     // --------------------------------------------------
//     await connection.query(
//       `
//       INSERT INTO user_audit_logs (user_id, action)
//       VALUES (?, 'ADDRESS_CREATE')
//       `,
//       [userId]
//     );



//     return {
//       success: true,
//       message: "Address created successfully",
//       address_id: result.insertId
//     };
//   })
// );



exports.createAddress = api(
  {
    body: {
      name: { type: "string", required: false },
      phone: { type: "string", required: false },
      type: { type: "string", required: true },
      full_address: { type: "string", required: true },
      city: { type: "string", required: false },
      zip_code: { type: "string", required: false },
      location_mapping_id: { type: "int", required: false }
    }
  },
  userAuth(async (req, connection, user) => {


    const userId = user.id;
    const {
      name,
      phone,
      type,
      full_address,
      city,
      zip_code
    } = req.typed.body;




    if (!['home', 'office', 'n/a'].includes(type)) throw new errors.INVALID_FIELDS_PROVIDED("Invalid address type");

    if (full_address.length < 5 || full_address.length > 255) throw new errors.INVALID_FIELDS_PROVIDED("Full address must be between 5 and 255 characters");

    if (city && (city.length < 2 || city.length > 100)) throw new errors.INVALID_FIELDS_PROVIDED("City must be between 2 and 100 characters");

    if (zip_code && (zip_code.length < 2 || zip_code.length > 20)) throw new errors.INVALID_FIELDS_PROVIDED("Zip code must be between 2 and 20 characters");

    if (phone && !validator.isMobilePhone(phone)) throw new errors.INVALID_FIELDS_PROVIDED("Invalid phone number format");

    if (name && (name.length < 2 || name.length > 200)) throw new errors.INVALID_FIELDS_PROVIDED("Name must be between 2 and 200 characters");




    // --------------------------------------------------
    // 1. HANDLE PHONE LOGIC (USER-SCOPED ONLY)
    // --------------------------------------------------

    let phoneId = null;
    let isPhoneVerified = false;

    if (phone) {
      // Check if THIS user already has the phone
      const existing = await connection.queryOne(
        `
    SELECT id, is_verified
    FROM user_phones
    WHERE user_id = ? AND phone_number = ?
    `,
        [userId, phone]
      );

      if (existing) {
        phoneId = existing.id;
        isPhoneVerified = existing.is_verified === 1;
      } else {
        // Insert new phone for this user (always allowed)
        const insertPhone = await connection.query(
          `
      INSERT INTO user_phones (user_id, phone_number, is_verified)
      VALUES (?, ?, 0)
      `,
          [userId, phone]
        );

        phoneId = insertPhone.insertId;
      }
    } else {
      // --------------------------------------------------
      // 2. NO PHONE PROVIDED → USE DEFAULT PHONE
      // --------------------------------------------------
      if (user.default_phone_id) {
        phoneId = user.default_phone_id;
      }
    }


    // --------------------------------------------------
    // 3. NAME FALLBACK
    // --------------------------------------------------
    const finalName =
      name ||
      [user.first_name, user.last_name].filter(Boolean).join(" ") ||
      null;

    // --------------------------------------------------
    // 4. INSERT ADDRESS
    // --------------------------------------------------
    const result = await connection.query(
      `
      INSERT INTO user_addresses (
        user_id,
        phone_id,
        name,
        address_type,
        full_address,
        city,
        zip_code,
        location_mapping_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        userId,
        phoneId,
        finalName,
        type,
        full_address,
        city || null,
        zip_code || null,
        req.typed.body.location_mapping_id || null
      ]
    );


    if (user.default_address_id === null && isPhoneVerified === true) {
      await connection.query(
        `UPDATE users SET default_address_id = ? WHERE id = ?`,
        [result.insertId, userId]
      );
    }
    // --------------------------------------------------
    // 5. AUDIT LOG (OPTIONAL BUT RECOMMENDED)
    // --------------------------------------------------
    await connection.query(
      `
      INSERT INTO user_audit_logs (user_id, action)
      VALUES (?, 'ADDRESS_CREATE')
      `,
      [userId]
    );



    return {
      success: true,
      message: "Address created successfully",
      address_id: result.insertId
    };
  })
);


//----------------cutter api

// exports.editAddress = api(
//   {
//     params: {
//       address_id: { type: "int", required: true }
//     },
//     body: {

//       name: { type: "string", required: false },
//       phone: { type: "string", required: false },
//       type: { type: "string", required: false },
//       full_address: { type: "string", required: false },
//       city: { type: "string", required: false },
//       zip_code: { type: "string", required: false }
//     }
//   },
//   userAuth(async (req, connection, user) => {

//     const userId = user.id;
//     const { address_id } = req.typed.params;
//     const {

//       name,
//       phone,
//       type,
//       full_address,
//       city,
//       zip_code
//     } = req.typed.body;


//     if(  !name && !phone && !type && !full_address && !city && !zip_code) {
//       throw new errors.INVALID_FIELDS_PROVIDED("At least one field must be provided for update");
//     }

//     if (type && !['home', 'office', 'n/a'].includes(type)) {
//       throw new errors.INVALID_FIELDS_PROVIDED("Invalid address type");
//     }

//     if (full_address && (full_address.length < 5 || full_address.length > 255)) {
//       throw new errors.INVALID_FIELDS_PROVIDED(
//         "Full address must be between 5 and 255 characters"
//       );
//     }

//     if (city && (city.length < 2 || city.length > 100)) {
//       throw new errors.INVALID_FIELDS_PROVIDED(
//         "City must be between 2 and 100 characters"
//       );
//     }

//     if (zip_code && (zip_code.length < 2 || zip_code.length > 20)) {
//       throw new errors.INVALID_FIELDS_PROVIDED(
//         "Zip code must be between 2 and 20 characters"
//       );
//     }

//     if (phone && !validator.isMobilePhone(phone)) {
//       throw new errors.INVALID_FIELDS_PROVIDED("Invalid phone number format");
//     }

//     if (name && (name.length < 2 || name.length > 200)) {
//       throw new errors.INVALID_FIELDS_PROVIDED(
//         "Name must be between 2 and 200 characters"
//       );
//     }

//     // --------------------------------------------------
//     // 0. LOAD ADDRESS & OWNERSHIP CHECK
//     // --------------------------------------------------
//     const address = await connection.queryOne(
//       `
//       SELECT id, phone_id
//       FROM user_addresses
//       WHERE id = ? AND user_id = ?
//       LIMIT 1
//       `,
//       [address_id, userId]
//     );

//     if (!address) {
//       throw new errors.NOT_FOUND("Address not found");
//     }

//     // --------------------------------------------------
//     // 1. VALIDATIONS (ONLY IF PROVIDED)
//     // --------------------------------------------------


//     // --------------------------------------------------
//     // 2. HANDLE PHONE (SAME LOGIC AS CREATE)
//     // --------------------------------------------------
//     let phoneId = address.phone_id;
//     let isPhoneVerified = false;

//     if (phone !== undefined) {
//       // Explicit update of phone
//       if (phone === null || phone === "") {
//         phoneId = null;
//       } else {
//         const exists = await connection.query(
//           `SELECT id, user_id, is_verified FROM user_phones WHERE phone_number = ?`,
//           [phone]
//         );

//         if (exists.length > 0) {
//           for (const phoneRecord of exists) {
//             if (phoneRecord.is_verified === 1 && phoneRecord.user_id !== userId) {
//               throw new errors.ALREADY_EXIST(
//                 "Phone number is already verified by another user"
//               );
//             }

//             if (phoneRecord.user_id === userId) {
//               phoneId = phoneRecord.id;
//               if (phoneRecord.is_verified === 1) {
//                 isPhoneVerified = true;
//               }
//             }
//           }
//         } else {
//           const insertPhone = await connection.query(
//             `INSERT INTO user_phones (user_id, phone_number, is_verified)
//              VALUES (?, ?, 0)`,
//             [userId, phone]
//           );
//           phoneId = insertPhone.insertId;
//         }
//       }
//     }

//     // --------------------------------------------------
//     // 3. NAME FALLBACK (IF PROVIDED AS EMPTY)
//     // --------------------------------------------------
//     let finalName = name;
//     if (name === "") {
//       finalName =
//         [user.first_name, user.last_name].filter(Boolean).join(" ") || null;
//     }

//     // --------------------------------------------------
//     // 4. BUILD UPDATE QUERY
//     // --------------------------------------------------
//     const updates = [];
//     const params = [];

//     if (finalName !== undefined) {
//       updates.push("name = ?");
//       params.push(finalName);
//     }

//     if (type) {
//       updates.push("address_type = ?");
//       params.push(type);
//     }

//     if (full_address) {
//       updates.push("full_address = ?");
//       params.push(full_address);
//     }

//     if (city !== undefined) {
//       updates.push("city = ?");
//       params.push(city || null);
//     }

//     if (zip_code !== undefined) {
//       updates.push("zip_code = ?");
//       params.push(zip_code || null);
//     }

//     if (phone !== undefined) {
//       updates.push("phone_id = ?");
//       params.push(phoneId);
//     }



//     params.push(address_id);

//     await connection.query(
//       `
//       UPDATE user_addresses
//       SET ${updates.join(", ")}
//       WHERE id = ?
//       `,
//       params
//     );

//     // --------------------------------------------------
//     // 5. SET DEFAULT ADDRESS (IF APPLICABLE)
//     // --------------------------------------------------
//     if (user.default_address_id === null && isPhoneVerified === true) {
//       await connection.query(
//         `UPDATE users SET default_address_id = ? WHERE id = ?`,
//         [address_id, userId]
//       );
//     }

//     // --------------------------------------------------
//     // 6. AUDIT LOG
//     // --------------------------------------------------
//     await connection.query(
//       `
//       INSERT INTO user_audit_logs (user_id, action)
//       VALUES (?, 'ADDRESS_UPDATE')
//       `,
//       [userId]
//     );



//     return {
//       success: true,
//       message: "Address updated successfully"
//     };
//   })
// );



exports.editAddress = api(
  {
    params: {
      address_id: { type: "int", required: true }
    },
    body: {

      name: { type: "string", required: false },
      phone: { type: "string", required: false },
      type: { type: "string", required: false },
      full_address: { type: "string", required: false },
      city: { type: "string", required: false },
      zip_code: { type: "string", required: false },
      location_mapping_id: { type: "int", required: false }
    }
  },
  userAuth(async (req, connection, user) => {

    const userId = user.id;
    const { address_id } = req.typed.params;
    const {

      name,
      phone,
      type,
      full_address,
      city,
      zip_code
    } = req.typed.body;


    if (!name && !phone && !type && !full_address && !city && !zip_code && req.typed.body.location_mapping_id === undefined) {
      throw new errors.INVALID_FIELDS_PROVIDED("At least one field must be provided for update");
    }

    if (type && !['home', 'office', 'n/a'].includes(type)) {
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid address type");
    }

    if (full_address && (full_address.length < 5 || full_address.length > 255)) {
      throw new errors.INVALID_FIELDS_PROVIDED(
        "Full address must be between 5 and 255 characters"
      );
    }

    if (city && (city.length < 2 || city.length > 100)) {
      throw new errors.INVALID_FIELDS_PROVIDED(
        "City must be between 2 and 100 characters"
      );
    }

    if (zip_code && (zip_code.length < 2 || zip_code.length > 20)) {
      throw new errors.INVALID_FIELDS_PROVIDED(
        "Zip code must be between 2 and 20 characters"
      );
    }

    if (phone && !validator.isMobilePhone(phone)) {
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid phone number format");
    }

    if (name && (name.length < 2 || name.length > 200)) {
      throw new errors.INVALID_FIELDS_PROVIDED(
        "Name must be between 2 and 200 characters"
      );
    }

    // --------------------------------------------------
    // 0. LOAD ADDRESS & OWNERSHIP CHECK
    // --------------------------------------------------
    const address = await connection.queryOne(
      `
      SELECT id, phone_id
      FROM user_addresses
      WHERE id = ? AND user_id = ?
      LIMIT 1
      `,
      [address_id, userId]
    );

    if (!address) {
      throw new errors.NOT_FOUND("Address not found");
    }

    // --------------------------------------------------
    // 1. VALIDATIONS (ONLY IF PROVIDED)
    // --------------------------------------------------


    // --------------------------------------------------
    // 2. HANDLE PHONE (USER-SCOPED, FLEXIBLE)
    // --------------------------------------------------
    let phoneId = address.phone_id;
    let isPhoneVerified = false;

    if (phone !== undefined) {
      // Explicit phone update
      if (phone === null || phone === "") {
        phoneId = null;
      } else {  
        // Check if THIS user already has this phone
        const existing = await connection.queryOne(
          `
      SELECT id, is_verified
      FROM user_phones
      WHERE user_id = ? AND phone_number = ?
      `,
          [userId, phone]
        );

        if (existing) {
          phoneId = existing.id;
          isPhoneVerified = existing.is_verified === 1;
        } else {
          // Always allow inserting new phone for this user
          const insertPhone = await connection.query(
            `
        INSERT INTO user_phones (user_id, phone_number, is_verified)
        VALUES (?, ?, 0)
        `,
            [userId, phone]
          );

          phoneId = insertPhone.insertId;
        }
      }
    }

    // --------------------------------------------------
    // 3. NAME FALLBACK (IF PROVIDED AS EMPTY)
    // --------------------------------------------------
    let finalName = name;
    if (name === "") {
      finalName =
        [user.first_name, user.last_name].filter(Boolean).join(" ") || null;
    }

    // --------------------------------------------------
    // 4. BUILD UPDATE QUERY
    // --------------------------------------------------
    const updates = [];
    const params = [];

    if (finalName !== undefined) {
      updates.push("name = ?");
      params.push(finalName);
    }

    if (type) {
      updates.push("address_type = ?");
      params.push(type);
    }

    if (full_address) {
      updates.push("full_address = ?");
      params.push(full_address);
    }

    if (city !== undefined) {
      updates.push("city = ?");
      params.push(city || null);
    }

    if (zip_code !== undefined) {
      updates.push("zip_code = ?");
      params.push(zip_code || null);
    }

    if (phone !== undefined) {
      updates.push("phone_id = ?");
      params.push(phoneId);
    }

    if (req.typed.body.location_mapping_id !== undefined) {
      updates.push("location_mapping_id = ?");
      params.push(req.typed.body.location_mapping_id || null);
    }



    params.push(address_id);

    await connection.query(
      `
      UPDATE user_addresses
      SET ${updates.join(", ")}
      WHERE id = ?
      `,
      params
    );

    // --------------------------------------------------
    // 5. SET DEFAULT ADDRESS (IF APPLICABLE)
    // --------------------------------------------------
    if (user.default_address_id === null && isPhoneVerified === true) {
      await connection.query(
        `UPDATE users SET default_address_id = ? WHERE id = ?`,
        [address_id, userId]
      );
    }

    // --------------------------------------------------
    // 6. AUDIT LOG
    // --------------------------------------------------
    await connection.query(
      `
      INSERT INTO user_audit_logs (user_id, action)
      VALUES (?, 'ADDRESS_UPDATE')
      `,
      [userId]
    );



    return {
      success: true,
      message: "Address updated successfully"
    };
  })
);


exports.setDefaultAddress = api(
  {
    body: {
      address_id: { type: "int", required: true }
    }
  },
  userAuth(async (req, connection, user) => {
    const userId = user.id;
    const { address_id } = req.typed.body;

    // ----------------------------------------
    // 1. FETCH ADDRESS (OWNERSHIP CHECK)
    // ----------------------------------------
    const addresses = await connection.queryOne(
      `
      SELECT
        ua.id,
        ua.phone_id,
        up.is_verified
      FROM user_addresses ua
      LEFT JOIN user_phones up ON up.id = ua.phone_id
      WHERE ua.id = ? AND ua.user_id = ?
      `,
      [address_id, userId]
    );

    if (!addresses) {
      throw new errors.NOT_FOUND("Address not found");
    }

    const address = addresses;
    // ----------------------------------------
    // 2. PHONE MUST EXIST
    // ----------------------------------------
    if (!address.phone_id) {
      throw new errors.BAD_REQUEST(
        "Address has no phone number attached"
      );
    }

    // ----------------------------------------
    // 3. PHONE MUST BE VERIFIED
    // ----------------------------------------
    //<cutter>
    // if (address.is_verified !== 1) {
    //   throw new errors.BAD_REQUEST(
    //     "Cannot set default address with unverified phone number"
    //   );
    // }
 //</cutter>
    // ----------------------------------------
    // 4. UPDATE DEFAULT ADDRESS
    // ----------------------------------------
    await connection.query(
      `
      UPDATE users
      SET default_address_id = ?
      WHERE id = ?
      `,
      [address_id, userId]
    );

    // ----------------------------------------
    // 5. AUDIT LOG
    // ----------------------------------------
    await connection.query(
      `
      INSERT INTO user_audit_logs (user_id, action)
      VALUES (?, 'ADDRESS_SET_DEFAULT')
      `,
      [userId]
    );


    return {
      success: true,
      message: "Default address updated successfully"
    };
  })
);


exports.getAddresses = api(
  {
    query: {
      limit: { type: "int", required: false },
      offset: { type: "int", required: false },
      type: { type: "string", required: false }
    }
  },
  userAuth(async (req, connection, user) => {
    const userId = user.id;

    let {
      limit = 10,
      offset = 0,
      type
    } = req.typed.query;

    // ----------------------------------------
    // 1. SANITIZE PAGINATION
    // ----------------------------------------
    limit = Math.min(Math.max(limit, 1), 50);
    offset = Math.max(offset, 0);

    // ----------------------------------------
    // 2. TYPE VALIDATION (OPTIONAL)
    // ----------------------------------------
    if (type && !['home', 'office', 'n/a'].includes(type)) {
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid address type filter");
    }

    // ----------------------------------------
    // 3. BUILD DYNAMIC WHERE
    // ----------------------------------------
    const where = ["ua.user_id = ?"];
    const params = [userId];

    if (type) {
      where.push("ua.address_type = ?");
      params.push(type);
    }

    const whereSql = where.join(" AND ");

    // ----------------------------------------
    // 4. FETCH DATA
    // ----------------------------------------
    const addresses = await connection.query(
      `
      SELECT
        ua.id,
        ua.name,
        ua.address_type,
        ua.full_address,
        ua.city,
        ua.zip_code,
        ua.created_at,

        up.id AS phone_id,
        up.phone_number,
        up.is_verified,

        IF(u.default_address_id = ua.id, 1, 0) AS is_default
      FROM user_addresses ua
      LEFT JOIN user_phones up ON up.id = ua.phone_id
      INNER JOIN users u ON u.id = ua.user_id
      WHERE ${whereSql}
      ORDER BY ua.id DESC
      LIMIT ? OFFSET ?
      `,
      [...params, limit, offset]
    );

    // ----------------------------------------
    // 5. TOTAL COUNT (FOR PAGINATION)
    // ----------------------------------------
    const countResult = await connection.query(
      `
      SELECT COUNT(*) AS total
      FROM user_addresses ua
      WHERE ${whereSql}
      `,
      params
    );



    return {
      success: true,
      pagination: {
        limit,
        offset,
        total: countResult[0].total
      },
      data: addresses
    };
  })
);
exports.getAddressById = api(
  {
    params: {
      address_id: { type: "int", required: true }
    }
  },
  userAuth(async (req, connection, user) => {
    const userId = user.id;
    const { address_id } = req.typed.params;

    // --------------------------------------
    // 1. FETCH ADDRESS (OWNERSHIP CHECK)
    // --------------------------------------
    const address = await connection.queryOne(
      `
      SELECT 
        a.id,
        a.name,
        a.address_type,
        a.full_address,
        a.city,
        a.zip_code,
        a.location_mapping_id,
        a.created_at,

        lm.area_name,

        p.id AS phone_id,
        p.phone_number,
        p.is_verified AS phone_verified
      FROM user_addresses a
      LEFT JOIN user_phones p ON p.id = a.phone_id
      LEFT JOIN location_mappings lm ON lm.id = a.location_mapping_id
      WHERE a.id = ?
        AND a.user_id = ?
      LIMIT 1
      `,
      [address_id, userId]
    );

    if (!address) {
      throw new errors.NOT_FOUND("Address not found");
    }

    // --------------------------------------
    // 2. RESPONSE FORMAT
    // --------------------------------------
    return {
      success: true,
      address: {
        id: address.id,
        name: address.name,
        type: address.address_type,
        full_address: address.full_address,
        city: address.city,
        zip_code: address.zip_code,
        location_mapping_id: address.location_mapping_id || null,
        area_name: address.area_name || null,
        created_at: address.created_at,
        phone: address.phone_id
          ? {
            id: address.phone_id,
            number: address.phone_number,
            is_verified: Boolean(address.phone_verified)
          }
          : null,
        is_default: user.default_address_id === address.id
      }
    };
  })
);


exports.deleteAddress = api(
  {
    params: {
      address_id: { type: "int", required: true }
    }
  },
  userAuth(async (req, connection, user) => {
    const userId = user.id;
    const { address_id } = req.typed.params;

    // --------------------------------------
    // 1. CHECK ADDRESS OWNERSHIP
    // --------------------------------------
    const address = await connection.queryOne(
      `
      SELECT id
      FROM user_addresses
      WHERE id = ?
        AND user_id = ?
      LIMIT 1
      `,
      [address_id, userId]
    );

    if (!address) {
      throw new errors.NOT_FOUND("Address not found");
    }

    // --------------------------------------
    // 2. DELETE ADDRESS
    // --------------------------------------
    await connection.query(
      `
      DELETE FROM user_addresses
      WHERE id = ?
      `,
      [address_id]
    );

    // --------------------------------------
    // 3. CLEAR DEFAULT ADDRESS IF NEEDED
    // --------------------------------------
    if (user.default_address_id === address_id) {
      await connection.query(
        `
        UPDATE users
        SET default_address_id = NULL
        WHERE id = ?
        `,
        [userId]
      );
    }

    // --------------------------------------
    // 4. AUDIT LOG
    // --------------------------------------
    await connection.query(
      `
      INSERT INTO user_audit_logs (user_id, action)
      VALUES (?, 'ADDRESS_DELETE')
      `,
      [userId]
    );


    return {
      success: true,
      message: "Address deleted successfully"
    };
  })
);
