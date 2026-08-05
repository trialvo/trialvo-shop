class QError {
    constructor(flag, error, ...extra) {
        this.flag = flag;
        this.error = error;
        if (extra.length > 0) Object.assign(this, ...extra.map(v => typeof v === 'string' || v instanceof String ? { error: v } : v));
    }

    extend(...objs) {
        let target = new QError();
        Object.assign(target, this, ...extra.map(v => typeof v === 'string' || v instanceof String ? { error: v } : v));
        return target;
    }


}
exports.QError = QError;

// Define constant errors:

exports.PARAMETER_MISSING = QError.bind(null, 100, "Please fill all the required fields.");
exports.ERROR_IN_EXECUTION = QError.bind(null, 102, "Something went wrong! Please try again later.");
exports.UNAUTHORIZED = QError.bind(null, 403, "You don't have authority for this action.");
exports.INVALID_ACCESS_TOKEN = QError.bind(null, 401, "You have been logged out. Please log in again.");
exports.NO_FIELDS_PROVIDED = QError.bind(null, 400, "No fields provided.");
exports.INVALID_FIELDS_PROVIDED = QError.bind(null, 422, "Invalid data provided.");
exports.INVALID_DEALER = QError.bind(null, 404, "Dealer not registered or not found.");
exports.INVALID_EMAIL_PASS = QError.bind(null, 401, "Invalid email or password combination.");
exports.INVALID_PARAMETER = QError.bind(null, 100, "Please enter valid parameters.");
exports.ALREADY_EXIST = QError.bind(null, 404, "Product already exist.");

exports.CUSTOMER_ALREADY_EXIST = QError.bind(null, 404, "Customer already exist.");
exports.NOT_FOUND = QError.bind(null, 404, "User not found.");
exports.SERVICE_UNAVAILABLE = QError.bind(null, 503, "Service is currently unavailable. Please try again later.");
exports.BAD_REQUEST = QError.bind(null, 400, "Bad request.");
exports.PHONE_NOT_VERIFIED = QError.bind(null, 405, "Phone not verified.");
exports.FORBIDDEN = QError.bind(null, 403, "Forbidden request.");
exports.PAYMENT_INITIALISATION_FAILD = QError.bind(null, 403, "Payment initialization failed.");
exports.UNVERIFIED_PHONE=QError.bind(null, 411, "Please set and verify a phone to order");

exports.IMAGE_PROCESSING_FAILED = QError.bind(null, 500, "Image processing failed. Please try again later.");
exports.CONFLICT = QError.bind(null, 409, "Conflict.");
