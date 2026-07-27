const fs = require("fs");
const path = require("path");
const { getConfig } = require("../config");
const { createDatabaseProvider } = require("../db/DatabaseProvider");

async function runMigrations(config, provider) {
  const typedDir = path.resolve(config.rootDir, "database/migrations", config.dbClient);
  const migrationsDir = fs.existsSync(typedDir)
    ? typedDir
    : path.resolve(config.rootDir, "database/migrations");

  for (const file of fs.readdirSync(migrationsDir).filter((name) => name.endsWith(".sql")).sort()) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    await provider.run(sql.replace(/;\s*$/g, ""));
    console.log(`Applied ${config.dbClient}/${file}`);
  }
  await ensureUserRole(config, provider);
}

async function ensureUserRole(config, provider) {
  const db = provider.getClient();
  if (config.dbClient === "mysql") {
    const [columns] = await db.query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'role'`
    );
    if (!columns.length) await db.query("ALTER TABLE users ADD COLUMN role VARCHAR(16) NOT NULL DEFAULT 'user' AFTER username");
    await db.query("UPDATE users SET role = 'user' WHERE role IS NULL OR role NOT IN ('user', 'admin')");
    await db.query("UPDATE users SET role = 'admin' WHERE username = 'yizcdl2357'");
    return;
  }

  const columns = db.all("PRAGMA table_info(users)");
  if (!columns.some((column) => column.name === "role")) {
    db.run("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user'");
  }
  db.run("UPDATE users SET role = 'user' WHERE role IS NULL OR role NOT IN ('user', 'admin')");
  db.run("UPDATE users SET role = 'admin' WHERE username = 'yizcdl2357'");
}

async function main() {
  const config = getConfig();
  const provider = createDatabaseProvider(config);
  try {
    await provider.connect();
    await runMigrations(config, provider);
  } finally {
    await provider.close();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}

module.exports = { runMigrations, ensureUserRole };
