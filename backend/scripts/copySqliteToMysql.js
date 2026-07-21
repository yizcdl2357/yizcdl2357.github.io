const { getConfig } = require("../config");
const { SQLiteDatabaseProvider } = require("../db/SQLiteDatabaseProvider");
const { MySQLDatabaseProvider } = require("../db/MySQLDatabaseProvider");

async function main() {
  const config = getConfig();
  if (config.dbClient !== "mysql") {
    throw new Error("Set DB_CLIENT=mysql in .env before copying data to SQLPub.");
  }

  const sqlite = new SQLiteDatabaseProvider(config);
  const mysql = new MySQLDatabaseProvider(config);
  sqlite.connect();
  await mysql.connect();
  const target = mysql.getClient();

  const users = sqlite.all("SELECT * FROM users ORDER BY created_at");
  const tags = sqlite.all("SELECT id, name, rowid AS sort_order FROM tags ORDER BY rowid");
  const paragraphs = sqlite.all("SELECT * FROM paragraphs ORDER BY created_at");
  const paragraphTags = sqlite.all("SELECT * FROM paragraph_tags ORDER BY paragraph_id, tag_id");
  const collections = sqlite.all("SELECT * FROM collections ORDER BY created_at");

  for (const user of users) {
    await target.query(
      "INSERT INTO users (id, username, password_hash, created_at) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE username = VALUES(username), password_hash = VALUES(password_hash), created_at = VALUES(created_at)",
      [user.id, user.username, user.password_hash, user.created_at]
    );
  }

  for (const tag of tags) {
    await target.query(
      "INSERT INTO tags (id, name, sort_order) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name), sort_order = VALUES(sort_order)",
      [tag.id, tag.name, tag.sort_order]
    );
  }

  for (const paragraph of paragraphs) {
    await target.query(
      "INSERT INTO paragraphs (id, content, author_id, theme, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE content = VALUES(content), author_id = VALUES(author_id), theme = VALUES(theme), created_at = VALUES(created_at), updated_at = VALUES(updated_at)",
      [paragraph.id, paragraph.content, paragraph.author_id, paragraph.theme, paragraph.created_at, paragraph.updated_at]
    );
  }

  for (const link of paragraphTags) {
    await target.query(
      "INSERT IGNORE INTO paragraph_tags (paragraph_id, tag_id) VALUES (?, ?)",
      [link.paragraph_id, link.tag_id]
    );
  }

  for (const collection of collections) {
    await target.query(
      "INSERT IGNORE INTO collections (id, user_id, paragraph_id, created_at) VALUES (?, ?, ?, ?)",
      [collection.id, collection.user_id, collection.paragraph_id, collection.created_at]
    );
  }

  await mysql.close();
  console.log(`Copied ${users.length} users, ${tags.length} tags, ${paragraphs.length} paragraphs, ${paragraphTags.length} paragraph-tag links, ${collections.length} collections.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
