const validator  = require("validator");
const errors = require("../helpers/errors");

exports.validateLogin=(email, password )=> {
 
  // Email validation
  if (!validator.isEmail(email))   throw new errors.INVALID_PARAMETER("Invalid email");

  
if (!validator.isLength(password, { min: 8, max: 20 })) {
        throw new errors.INVALID_PARAMETER('Password must be between 8 and 20 characters.');
    }


}
