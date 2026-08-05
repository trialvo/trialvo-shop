const mysql = require('mysql2/promise');
const {
    host,
    dbPort,
    user,
    password,
    database,
    connectionLimit,
    instanceConnectionName,
    dbSocketPath,
    nodeEnv
} = require('../config/ApplicationSettings');

const isProduction = nodeEnv === "production";
const socketPath =
    dbSocketPath ||
    (instanceConnectionName ? `/cloudsql/${instanceConnectionName}` : "");

const poolConfig = {
    user,
    password,
    database,
    connectionLimit,
    multipleStatements: true,
    decimalNumbers: true,
    charset: 'UTF8MB4',
    timezone: '+00:00'
};

if (isProduction && socketPath) {
    poolConfig.socketPath = socketPath;
} else {
    poolConfig.host = host;
    poolConfig.port = dbPort;
}

let pool = mysql.createPool(poolConfig);

const query = pool.query.bind(pool);
pool.query = (sql, values, cb) => {
    if (values instanceof Function) {
        cb = values;
        values = [];
    }
    let promise = query(sql, values);
    if (cb != null) {
        promise.then((res) => cb(null, res[0]), (err) => cb(err, null));
    } else {
        return promise;
    }
};
connection = pool;
console.log("----- MYSQL connection setup -----");

class Connection {
    constructor(connection) {
        this.connection = connection;
    }

    async beginTransaction() {
        return await this.connection.beginTransaction();
    }

    async commit() {
        return await this.connection.commit();
    }

    async rollback() {
        return await this.connection.rollback();
    }

    async release() {
        return await this.connection.release();
    }

    async query(sql, values) {
        // Attempt to execute query:
        const [result, columns] = await this.connection.query(sql, values);
        return columns?.[0] instanceof Array && columns.length <= 1 ? result[0] : result;
     
    }
    
    async queryField(sql, values, field) {
        // Attempt to execute query:
        const [result, columns] = (await this.connection.query(sql, values)).map(d => d.map(r => r[field]));
        return columns?.[0] instanceof Array && columns.length <= 1 ? result[0] : result;
    }

    async queryOne(sql, values) {
        // Attempt to execute query:
        const [result, columns] = (await this.connection.query(sql, values)).map(d => d[0]);
        return columns?.[0] instanceof Array && columns.length <= 1 ? result[0] : result;
    }
    
    async queryOneField(sql, values, field) {
        // Attempt to execute query:
        const [result, columns] = (await this.connection.query(sql, values)).map(d => d[0]?.[field]);
        return columns?.[0] instanceof Array && columns.length <= 1 ? result[0] : result;
    }
    
    async queryCount(sql, values) {
        return await this.queryOneField(sql, values, "count(*)");
    }
}

exports.getConnection = async function getConnection() {
    return new Connection(await pool.getConnection());
};

