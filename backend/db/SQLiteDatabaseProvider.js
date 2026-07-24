const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

class SQLiteDatabaseProvider {
  constructor(config) {
    this.config = config;
    this.filePath = config.dbFile;
    this.sqliteCli = config.sqliteCli;
  }

  connect() {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    if (!fs.existsSync(this.sqliteCli)) {
      throw new Error(`sqlite3 executable not found: ${this.sqliteCli}`);
    }
  }

  run(sql, params = []) {
    this.connect();
    const command = `${this.bind(sql, params)};`;
    this.execute(command);
  }

  all(sql, params = []) {
    this.connect();
    const command = `.mode json\n${this.bind(sql, params)};`;
    const output = this.execute(command).trim();
    return output ? JSON.parse(output) : [];
  }

  get(sql, params = []) {
    return this.all(sql, params)[0] || null;
  }

  getClient() {
    return this;
  }

  close() {}

  execute(command) {
    return execFileSync(this.sqliteCli, [this.filePath], {
      input: command,
      encoding: "utf8",
      env: { ...process.env, SQLITE_UTF8: "1" }
    });
  }

  bind(sql, params) {
    let index = 0;
    return sql.replace(/\?/g, () => this.escape(params[index++]));
  }

  escape(value) {
    if (value === null || value === undefined) return "NULL";
    if (typeof value === "number") return String(value);
    return `'${String(value).replace(/'/g, "''")}'`;
  }
}

module.exports = { SQLiteDatabaseProvider };
