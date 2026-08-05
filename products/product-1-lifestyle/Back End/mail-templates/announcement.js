const path = require("path");
const nodemailer = require("nodemailer");
const errors = require("../helpers/errors"); // adjust path
const { getConfig } = require("../config/ApplicationSettingsDB"); // adjust path
const { BRAND_NAME, SHOP_URL, BRAND_ADDRESS, unsubscribeSecret } = require("../config/ApplicationSettings"); // adjust path
 
const hbsPackage = require("handlebars"); // Import the base handlebars package

// Register the 'eq' helper globally for this instance
hbsPackage.registerHelper('eq', function (a, b) {
    return a === b;
});

// Helper function to format date if needed
hbsPackage.registerHelper('formatDate', function (date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
});

// Helper to check if a value exists (for conditional content)
hbsPackage.registerHelper('ifExists', function (value, options) {
    if (value && value !== null && value !== '') {
        return options.fn(this);
    } else {
        return options.inverse(this);
    }
});

exports.sendAnnouncementMail = async (connection, mailObj) => {
    const { email, headline, body, token,image ,is_subscribed} = mailObj;

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
        throw new errors.SERVICE_UNAVAILABLE("Email configuration incomplete");
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

    // 5. Prepare email content
    // Convert body to HTML if it's plain text (basic conversion)
    let htmlBody = body;
    
    // Simple conversion for newlines to <br> tags if body appears to be plain text
    if (!body.includes('<') && !body.includes('>')) {
        htmlBody = body.replace(/\n/g, '<br>');
    }

    try {
        await transporter.sendMail({
            from: `${BRAND_NAME} <${cfg.MAIL_USER}>`,
            to: email,
            subject: headline,
            template: "announcement", // name of the template file i.e., announcement.handlebars
            context: {
                BRAND_NAME,
                BRAND_ADDRESS,
                SHOP_URL,
                headline,
                body: htmlBody,
                image:image||null,
                is_subscribed:is_subscribed==1?true:false, //boolean to show unsubscribe link
                current_year: new Date().getFullYear(),
                // unsubscribe_url: `${SHOP_URL}/unsubscribe?email=${encodeURIComponent(email)}&unsubscribe_token=${encodeURIComponent(token)}`,
                unsubscribe_url: `${SHOP_URL}/unsubscribe?email=${email}&unsubscribe_token=${token}`,

                // view_in_browser_url: `${SHOP_URL}/announcements/preview?email=${encodeURIComponent(email)}&token=${Buffer.from(Date.now().toString()).toString('base64')}`
            }
        });
    } catch (err) {
        console.log("============",err);
        throw new errors.SERVICE_UNAVAILABLE(`Email service error: ${err.message}`);
    }
};













 