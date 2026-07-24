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

  const dbClient = process.env.DB_CLIENT || "sqlite";
  const appEnv = process.env.APP_ENV || "local";
  const mysqlPassword = process.env.DB_PASSWORD || "";
  if (dbClient === "mysql" && !mysqlPassword) {
    throw new Error("DB_PASSWORD is required when DB_CLIENT=mysql");
  }

  return {
    appEnv,
    port: Number(process.env.PORT || 3000),
    dbClient,
    dbFile: path.resolve(rootDir, process.env.DB_FILE || "./data/english-corpus.sqlite"),
    corsOrigins: (process.env.CORS_ORIGIN || "http://localhost:3000,http://127.0.0.1:3000")
      .split(",")
      .map((origin) => origin.trim().replace(/\/$/, ""))
      .filter(Boolean),
    secureCookies: parseBoolean(process.env.COOKIE_SECURE, appEnv === "production"),
    systemUserId: process.env.SYSTEM_USER_ID || "system",
    sourceSystemUserId: process.env.SOURCE_SYSTEM_USER_ID || "system",
    mysql: {
      host: process.env.DB_HOST || "mysql6.sqlpub.com",
      port: Number(process.env.DB_PORT || 3311),
      database: process.env.DB_NAME || "yizcdl2357eng",
      user: process.env.DB_USER || "yizcdl2357",
      password: mysqlPassword,
      ssl: parseBoolean(process.env.DB_SSL, false),
      sslRejectUnauthorized: parseBoolean(process.env.DB_SSL_REJECT_UNAUTHORIZED, true),
      connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10)
    },
    rootDir,
    sqliteCli: path.resolve(rootDir, "tools/sqlite/sqlite3.exe")
  };
}

function parseBoolean(value, fallback) {
  if (value === undefined || value === "") return fallback;
  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
}

module.exports = { getConfig };
