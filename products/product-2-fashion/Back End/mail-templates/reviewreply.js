const path = require("path");
const nodemailer = require("nodemailer");
const errors = require("../helpers/errors");
const { getConfig } = require("../config/ApplicationSettingsDB");
const { BRAND_NAME, SHOP_URL, BRAND_ADDRESS } = require("../config/ApplicationSettings");

const hbsPackage = require("handlebars");

// Register helpers if not already registered
if (!hbsPackage.helpers.eq) {
    hbsPackage.registerHelper('eq', function (a, b) { return a === b; });
}
if (!hbsPackage.helpers.stars) {
    hbsPackage.registerHelper('stars', function (rating) {
        return '★'.repeat(rating) + '☆'.repeat(5 - rating);
    });
}

exports.sendReviewReplyMail = async (connection, mailObj) => {
    const { name, email, product_name, product_slug, rating, review_text, reply_text, review_date } = mailObj;

    // 1. Load email config from DB
    const configs = await getConfig(connection, false, "email");
    if (!configs.length || configs[0].is_active === 0) {
        throw new errors.SERVICE_UNAVAILABLE("Email service disabled");
    }

    // 2. Normalize config
    const cfg = configs.reduce((acc, c) => { acc[c.key_name] = c.value; return acc; }, {});
    if (!cfg.MAIL_HOST || !cfg.MAIL_PORT || !cfg.MAIL_USER || !cfg.MAIL_PASS) {
        throw new errors.SERVICE_UNAVAILABLE("Email configuration incomplete");
    }

    // 3. Create transporter
    const transporter = nodemailer.createTransport({
        host: cfg.MAIL_HOST,
        port: parseInt(cfg.MAIL_PORT),
        secure: parseInt(cfg.MAIL_PORT) === 465,
        auth: { user: cfg.MAIL_USER, pass: cfg.MAIL_PASS },
    });

    // 4. Setup handlebars
    const hbs = (await import("nodemailer-express-handlebars")).default;
    transporter.use(
        "compile",
        hbs({
            viewEngine: {
                extName: ".handlebars",
                partialsDir: path.join(__dirname, "handlebarTemplates"),
                defaultLayout: false,
                handlebars: hbsPackage,
            },
            viewPath: path.join(__dirname, "handlebarTemplates"),
            extName: ".handlebars",
        })
    );

    // 5. Format review date
    const formattedDate = review_date
        ? new Date(review_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        : 'N/A';

    // 6. Send mail
    try {
        await transporter.sendMail({
            from: `${BRAND_NAME} <${cfg.MAIL_USER}>`,
            to: email,
            subject: `Response to Your Review of "${product_name}" — ${BRAND_NAME}`,
            template: "reviewreply",
            context: {
                name: name || "Customer",
                BRAND_NAME,
                BRAND_ADDRESS,
                PRODUCT_PAGE: `${SHOP_URL}/products/${product_slug}`,
                year: new Date().getFullYear(),
                product_name,
                rating,
                star_display: '★'.repeat(rating) + '☆'.repeat(5 - rating),
                review_text: review_text || '(No text)',
                reply_text,
                review_date: formattedDate,
            }
        });
    } catch (err) {
        throw new errors.SERVICE_UNAVAILABLE(`Email service err: ${err}`);
    }
};
