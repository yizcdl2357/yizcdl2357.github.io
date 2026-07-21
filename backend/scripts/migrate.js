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
}

async function main() {
  const config = getConfig();
  const provider = createDatabaseProvider(config);

  await provider.connect();
  await runMigrations(config, provider);

  await provider.close();
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = { runMigrations };
