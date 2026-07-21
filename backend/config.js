const fs = require("fs");
const path = require("path");

function loadEnvFile(rootDir) {
  const envPath = path.resolve(rootDir, ".env");
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^["']|["']$/g, "");
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

function getConfig() {
  const rootDir = path.resolve(__dirname, "..");
  loadEnvFile(rootDir);

  return {
    appEnv: process.env.APP_ENV || "local",
    port: Number(process.env.PORT || 3000),
    dbClient: process.env.DB_CLIENT || "sqlite",
    dbFile: path.resolve(rootDir, process.env.DB_FILE || "./data/english-corpus.sqlite"),
    mysql: {
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT || 3306),
      database: process.env.DB_NAME || "english_corpus",
      user: process.env.DB_USER || "",
      password: process.env.DB_PASSWORD || ""
    },
    rootDir,
    sqliteCli: path.resolve(rootDir, "tools/sqlite/sqlite3.exe")
  };
}

module.exports = { getConfig };
