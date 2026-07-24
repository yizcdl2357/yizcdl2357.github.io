class MySQLDatabaseProvider {
  constructor(config) {
    this.config = config;
    this.pool = null;
  }

  async connect() {
    const mysql = require("mysql2/promise");
    const ssl = this.config.mysql.ssl
      ? { rejectUnauthorized: this.config.mysql.sslRejectUnauthorized }
      : undefined;
    this.pool = mysql.createPool({
      host: this.config.mysql.host,
      port: this.config.mysql.port,
      database: this.config.mysql.database,
      user: this.config.mysql.user,
      password: this.config.mysql.password,
      multipleStatements: true,
      charset: "utf8mb4",
      waitForConnections: true,
      connectionLimit: this.config.mysql.connectionLimit,
      queueLimit: 0,
      enableKeepAlive: true,
      ssl
    });
    await this.pool.query("SELECT 1");
  }

  getClient() {
    return this.pool;
  }

  async run(sql, params = []) {
    await this.pool.query(sql, params);
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }
}

module.exports = { MySQLDatabaseProvider };
