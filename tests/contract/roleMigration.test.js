const assert = require("assert");
const { ensureUserRole } = require("../../backend/scripts/migrate");

async function testMySQL() {
  let hasColumn = false;
  let alters = 0;
  const sql = [];
  const db = { query: async (statement) => {
    sql.push(statement);
    if (statement.includes("information_schema.COLUMNS")) return [hasColumn ? [{ COLUMN_NAME: "role" }] : []];
    if (statement.startsWith("ALTER TABLE")) { hasColumn = true; alters += 1; }
    return [[]];
  } };
  const provider = { getClient: () => db };
  await ensureUserRole({ dbClient: "mysql" }, provider);
  await ensureUserRole({ dbClient: "mysql" }, provider);
  assert.equal(alters, 1);
  assert(sql.some((item) => item.includes("role NOT IN ('user', 'admin')")));
  assert(sql.some((item) => item.includes("username = 'yizcdl2357'")));
  assert(!sql.some((item) => /SET role = 'user' WHERE role = 'admin'/.test(item)));
}

async function testSQLite() {
  let hasColumn = false;
  let alters = 0;
  const sql = [];
  const db = {
    all: () => hasColumn ? [{ name: "role" }] : [],
    run: (statement) => {
      sql.push(statement);
      if (statement.startsWith("ALTER TABLE")) { hasColumn = true; alters += 1; }
    }
  };
  const provider = { getClient: () => db };
  await ensureUserRole({ dbClient: "sqlite" }, provider);
  await ensureUserRole({ dbClient: "sqlite" }, provider);
  assert.equal(alters, 1);
  assert(sql.some((item) => item.includes("role NOT IN ('user', 'admin')")));
  assert(sql.some((item) => item.includes("username = 'yizcdl2357'")));
}

Promise.all([testMySQL(), testSQLite()])
  .then(() => console.log("Role migration contract tests passed"))
  .catch((error) => { console.error(error); process.exit(1); });
