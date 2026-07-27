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
  await ensureParagraphReview(config, provider);
}

async function ensureParagraphReview(config, provider) {
  const db = provider.getClient();
  const definitions = config.dbClient === "mysql"
    ? { status: "VARCHAR(16) NOT NULL DEFAULT 'approved'", submitted_at: "VARCHAR(32) NULL", review_version: "INT NOT NULL DEFAULT 0", reviewed_by: "VARCHAR(64) NULL", reviewed_at: "VARCHAR(32) NULL", rejection_reason: "TEXT NULL" }
    : { status: "TEXT NOT NULL DEFAULT 'approved'", submitted_at: "TEXT", review_version: "INTEGER NOT NULL DEFAULT 0", reviewed_by: "TEXT", reviewed_at: "TEXT", rejection_reason: "TEXT" };
  if (config.dbClient === "mysql") {
    const [rows] = await db.query("SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='paragraphs'");
    const existing = new Set(rows.map((row) => row.COLUMN_NAME));
    for (const [name, definition] of Object.entries(definitions)) if (!existing.has(name)) await db.query(`ALTER TABLE paragraphs ADD COLUMN ${name} ${definition}`);
    await db.query("UPDATE paragraphs SET status='approved' WHERE status IS NULL OR status NOT IN ('pending','approved','rejected')");
    await db.query("UPDATE paragraphs SET submitted_at=created_at WHERE submitted_at IS NULL");
    const [indexes] = await db.query(
      "SELECT INDEX_NAME FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='paragraphs' AND INDEX_NAME='idx_paragraphs_review_queue'"
    );
    if (!indexes.length) await db.query("CREATE INDEX idx_paragraphs_review_queue ON paragraphs(status, submitted_at, id)");
  } else {
    const existing = new Set(db.all("PRAGMA table_info(paragraphs)").map((row) => row.name));
    for (const [name, definition] of Object.entries(definitions)) if (!existing.has(name)) db.run(`ALTER TABLE paragraphs ADD COLUMN ${name} ${definition}`);
    db.run("UPDATE paragraphs SET status='approved' WHERE status IS NULL OR status NOT IN ('pending','approved','rejected')");
    db.run("UPDATE paragraphs SET submitted_at=created_at WHERE submitted_at IS NULL");
    db.run("CREATE INDEX IF NOT EXISTS idx_paragraphs_review_queue ON paragraphs(status, submitted_at, id)");
  }
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

module.exports = { runMigrations, ensureUserRole, ensureParagraphReview };
