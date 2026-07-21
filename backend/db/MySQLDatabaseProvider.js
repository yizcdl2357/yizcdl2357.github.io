class MySQLDatabaseProvider {
  constructor(config) {
    this.config = config;
    this.connection = null;
  }

  async connect() {
    const mysql = require("mysql2/promise");
    this.connection = await mysql.createConnection({
      host: this.config.mysql.host,
      port: this.config.mysql.port,
      database: this.config.mysql.database,
      user: this.config.mysql.user,
      password: this.config.mysql.password,
      multipleStatements: true,
      charset: "utf8mb4"
    });
    await this.connection.query("SET NAMES utf8mb4");
  }

  getClient() {
    return this.connection;
  }

  async run(sql, params = []) {
    await this.connection.query(sql, params);
  }

  async close() {
    if (this.connection) await this.connection.end();
  }
}

module.exports = { MySQLDatabaseProvider };
