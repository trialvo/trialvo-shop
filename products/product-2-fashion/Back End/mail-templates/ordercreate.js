const path = require("path");
const nodemailer = require("nodemailer");
const errors = require("../helpers/errors"); // adjust path
const { getConfig } = require("../config/ApplicationSettingsDB"); // adjust path
const { BRAND_NAME ,SHOP_URL,BRAND_ADDRESS} = require("../config/ApplicationSettings"); // adjust path
const { resolveFrom } = require("../helpers/mailFrom");

const hbsPackage = require("handlebars"); // Import the base handlebars package

// Register the 'eq' helper globally for this instance
hbsPackage.registerHelper('eq', function (a, b) {
    return a === b;
});


exports. sendOrdermail = async (connection, mailObj) => {
  const { name, email ,order} = mailObj;

  // 1. Load email config from DB
  const configs = await getConfig(connection, false, "email");

  if (!configs.length || configs[0].is_active === 0) {
    throw new errors.SERVICE_UNAVAILABLE("Email service disabled");
  }

  // 2. Normalize config
  const cfg = configs.reduce((acc, c) => {
    acc[c.key_name] = c.value;
    return acc;
  }, {});
 
  if (
    !cfg.MAIL_HOST ||
    !cfg.MAIL_PORT ||
    !cfg.MAIL_USER ||
    !cfg.MAIL_PASS
  ) {
    // throw new errors.SERVICE_UNAVAILABLE("Email configuration incomplete");
     console.log("Email config er==================");
    
  }

  // 3. Create transporter
  const transporter = nodemailer.createTransport({
    host: cfg.MAIL_HOST,
    port: parseInt(cfg.MAIL_PORT),
    secure: parseInt(cfg.MAIL_PORT) === 465,
    auth: {
      user: cfg.MAIL_USER,
      pass: cfg.MAIL_PASS,
    },
  });

  // 4. Setup handlebars (dynamic import)
  const hbs = (await import("nodemailer-express-handlebars")).default;

  transporter.use(
    "compile",
    hbs({
      viewEngine: {
        extName: ".handlebars",
        partialsDir: path.join(__dirname, "handlebarTemplates"),
        defaultLayout: false,
        // PASS THE CUSTOM HANDLEBARS INSTANCE HERE
        handlebars: hbsPackage,
      },
      viewPath: path.join(__dirname, "handlebarTemplates"),
      extName: ".handlebars",
    })
  );

 
  try {
 

    await transporter.sendMail({
      from: resolveFrom(cfg, BRAND_NAME),
      to: email,
      subject: `${BRAND_NAME} Order ${order.status === 'approved' ? 'Approved' : order.status === 'cancelled' ? 'Cancelled' : 'Confirmation'}`,
      template: "order",
      context: {
        name: name || "User",
        BRAND_NAME,
      BRAND_ADDRESS,
        SHOP_URL ,
        year: new Date().getFullYear(),
        order
      }
 


    });
  } catch (err) {
    // throw new errors.SERVICE_UNAVAILABLE(`Email service err :${err}`)
     console.log("Email config err==================",err);
  }

  // 5. Send mail

}


