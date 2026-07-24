const { SQLiteDatabaseProvider } = require("./SQLiteDatabaseProvider");
const { MySQLDatabaseProvider } = require("./MySQLDatabaseProvider");

function createDatabaseProvider(config) {
  if (config.dbClient === "sqlite") {
    return new SQLiteDatabaseProvider(config);
  }

  if (config.dbClient === "mysql") {
    return new MySQLDatabaseProvider(config);
  }

  throw new Error(`Unsupported DB_CLIENT: ${config.dbClient}`);
}

module.exports = { createDatabaseProvider };
