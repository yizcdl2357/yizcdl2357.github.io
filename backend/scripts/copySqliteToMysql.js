const { getConfig } = require("../config");
const { SQLiteDatabaseProvider } = require("../db/SQLiteDatabaseProvider");
const { MySQLDatabaseProvider } = require("../db/MySQLDatabaseProvider");
const crypto = require("crypto");

function disabledPasswordHash() {
  return crypto.createHash("sha256").update("disabled-system-account").digest("hex");
}

async function main() {
  const config = getConfig();
  if (config.dbClient !== "mysql") {
    throw new Error("Set DB_CLIENT=mysql in .env before copying data to SQLPub.");
  }

  const sqlite = new SQLiteDatabaseProvider(config);
  const mysql = new MySQLDatabaseProvider(config);
  sqlite.connect();
  try {
    await mysql.connect();
    const target = mysql.getClient();

    const systemUserId = config.systemUserId;
    const tags = sqlite.all("SELECT id, name, rowid AS sort_order FROM tags ORDER BY rowid");
    const paragraphs = sqlite.all(
      "SELECT * FROM paragraphs WHERE author_id = ? ORDER BY created_at",
      [config.sourceSystemUserId]
    );
    const paragraphIds = new Set(paragraphs.map((paragraph) => paragraph.id));
    const paragraphTags = sqlite
      .all("SELECT * FROM paragraph_tags ORDER BY paragraph_id, tag_id")
      .filter((link) => paragraphIds.has(link.paragraph_id));

    const connection = await target.getConnection();
    try {
      await connection.beginTransaction();
    await connection.query(
      "INSERT IGNORE INTO users (id, username, password_hash, created_at) VALUES (?, ?, ?, ?)",
      [systemUserId, "系统示例", disabledPasswordHash(), new Date().toISOString()]
    );

    for (const tag of tags) {
      await connection.query(
        "INSERT INTO tags (id, name, sort_order) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name), sort_order = VALUES(sort_order)",
        [tag.id, tag.name, tag.sort_order]
      );
    }

    for (const paragraph of paragraphs) {
      await connection.query(
        "INSERT INTO paragraphs (id, content, author_id, theme, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE content = VALUES(content), author_id = VALUES(author_id), theme = VALUES(theme), updated_at = VALUES(updated_at)",
        [paragraph.id, paragraph.content, systemUserId, paragraph.theme, paragraph.created_at, paragraph.updated_at]
      );
    }

    for (const link of paragraphTags) {
      await connection.query(
        "INSERT IGNORE INTO paragraph_tags (paragraph_id, tag_id) VALUES (?, ?)",
        [link.paragraph_id, link.tag_id]
      );
    }
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    console.log(`Copied ${paragraphs.length} system paragraphs, ${tags.length} tags and ${paragraphTags.length} paragraph-tag links. Users and collections were not copied.`);
  } finally {
    await mysql.close();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
