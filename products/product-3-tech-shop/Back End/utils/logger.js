async function Logger(req, res, next) {
    // Add logger:
   
    let _log;
        //req.logger = console;
        _log = (severity, ...args) => {
            // Handle parsing for args:
            args = args.map(v => {
                if (v instanceof Error) return v.stack;
                return v instanceof Object ? JSON.stringify(v) : v;
            });
            // Print out console:
            console.log(args.join(" "));
        };
    
    req.logger = {
        shrink: (obj) => {
            if (obj instanceof Array) return obj.slice(0,2).map(req.logger.shrink);
            if (obj?.constructor.name === "Object") {
                obj = Object.keys(obj).reduce((r, k) => { r[k] = req.logger.shrink(obj[k]); return r; }, {});
            }
            return obj;
        },
        log: _log.bind(req.logger, "DEFAULT"),
        debug: _log.bind(req.logger, "DEBUG"),
        info: _log.bind(req.logger, "INFO"),
        warn: _log.bind(req.logger, "WARNING"),
        error: _log.bind(req.logger, "ERROR")
    };
    // Handle CORS:
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With,Accept,Content-type,Origin,Authorization,Anonymous");
    // Log request:
    // if (req.body && req.body !== {}) {
    //     req.logger.debug("Request body:", req.logger.shrink(req.body));
    // }

    // if (req.body && Object.keys(req.body).length > 0) {
    //     req.logger.debug("Request body:", req.logger.shrink(req.body));
    // }
    // // Log response:
    // const resSend = res.send;
    // res.send = (body) => {
    //     req.logger.debug("Response body:", req.logger.shrink(body));
    //     res.send = resSend;
    //     return res.send(body);
    // };
    next();
};


    const logfmt = require("logfmt").requestLogger();
    module.exports = async (req, res, next) => {
        logfmt(req, res, Logger.bind(null, req, res, next));
    };

