const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

let DatabaseSync = null;
const originalEmitWarning = process.emitWarning;
try {
  process.emitWarning = (warning, ...args) => {
    const warningName = typeof args[0] === "string" ? args[0] : args[0]?.type;
    if (warningName === "ExperimentalWarning" && String(warning).includes("SQLite")) return;
    originalEmitWarning.call(process, warning, ...args);
  };
  ({ DatabaseSync } = require("node:sqlite"));
  process.emitWarning = originalEmitWarning;
} catch {
  DatabaseSync = null;
  process.emitWarning = originalEmitWarning;
}

class SQLiteDatabaseProvider {
  constructor(config) {
    this.config = config;
    this.filePath = config.dbFile;
    this.database = null;
    this.sqliteCli = DatabaseSync ? null : this.resolveSqliteCli(config.sqliteCli);
  }

  connect() {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    if (DatabaseSync && !this.database) {
      this.database = new DatabaseSync(this.filePath);
      return;
    }

    if (!DatabaseSync && !this.sqliteCli) {
      throw new Error("sqlite3 executable not found. Install sqlite3 on PATH or place sqlite3.exe under tools/sqlite/.");
    }
  }

  run(sql, params = []) {
    this.connect();
    if (this.database) {
      if (params.length === 0) {
        this.database.exec(sql);
      } else {
        this.database.prepare(sql).run(...params);
      }
      return;
    }

    const command = `${this.bind(sql, params)};`;
    this.execute(command);
  }

  all(sql, params = []) {
    this.connect();
    if (this.database) {
      return this.database.prepare(sql).all(...params);
    }

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

  close() {
    if (this.database) {
      this.database.close();
      this.database = null;
    }
  }

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

  resolveSqliteCli(projectCli) {
    if (projectCli && fs.existsSync(projectCli)) return projectCli;

    const executableName = process.platform === "win32" ? "sqlite3.exe" : "sqlite3";
    for (const directory of (process.env.PATH || "").split(path.delimiter)) {
      if (!directory) continue;
      const candidate = path.join(directory, executableName);
      if (fs.existsSync(candidate)) return candidate;
    }

    return null;
  }
}

module.exports = { SQLiteDatabaseProvider };
