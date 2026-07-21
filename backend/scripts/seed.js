const crypto = require("crypto");
const { getConfig } = require("../config");
const { createDatabaseProvider } = require("../db/DatabaseProvider");

const tags = [
  { id: "opening", name: "开头", sortOrder: 1 },
  { id: "ending", name: "结尾", sortOrder: 2 },
  { id: "transition", name: "过渡", sortOrder: 3 },
  { id: "practical", name: "应用文", sortOrder: 4 },
  { id: "continuation", name: "读后续写", sortOrder: 5 },
  { id: "argument", name: "议论", sortOrder: 6 },
  { id: "quote", name: "名言", sortOrder: 7 },
  { id: "action", name: "动作", sortOrder: 8 },
  { id: "psychology", name: "心理活动", sortOrder: 9 },
  { id: "advanced-expression", name: "高级表达", sortOrder: 10 }
];

const paragraphs = [
  {
    id: "sample-1",
    content: "Small efforts, when repeated day after day, can lead to remarkable changes. What truly matters is not how fast we move, but whether we keep moving in the right direction.",
    authorId: "system",
    theme: "成长",
    tags: ["opening", "quote"],
    createdAt: "2026-07-08T08:00:00.000Z",
    updatedAt: "2026-07-08T08:00:00.000Z"
  },
  {
    id: "sample-2",
    content: "Technology has made information more accessible than ever before. However, it also requires us to think independently, use digital tools wisely, and protect our attention from endless distractions.",
    authorId: "system",
    theme: "科技",
    tags: ["practical"],
    createdAt: "2026-07-08T08:05:00.000Z",
    updatedAt: "2026-07-08T08:05:00.000Z"
  },
  {
    id: "sample-3",
    content: "Protecting the environment is not only a slogan, but also a habit. By saving water, reducing waste and choosing public transport, each of us can make a visible difference.",
    authorId: "system",
    theme: "环保",
    tags: ["ending", "action"],
    createdAt: "2026-07-08T08:10:00.000Z",
    updatedAt: "2026-07-08T08:10:00.000Z"
  }
];

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

async function seedSqlite(db) {
  db.run(
    "INSERT OR IGNORE INTO users (id, username, password_hash, created_at) VALUES (?, ?, ?, ?)",
    ["system", "系统示例", hashPassword("system"), "2026-07-08T08:00:00.000Z"]
  );

  for (const tag of tags) {
    db.run("INSERT OR IGNORE INTO tags (id, name) VALUES (?, ?)", [tag.id, tag.name]);
  }

  for (const paragraph of paragraphs) {
    db.run(
      "INSERT OR IGNORE INTO paragraphs (id, content, author_id, theme, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
      [paragraph.id, paragraph.content, paragraph.authorId, paragraph.theme, paragraph.createdAt, paragraph.updatedAt]
    );
    for (const tagId of paragraph.tags) {
      db.run("INSERT OR IGNORE INTO paragraph_tags (paragraph_id, tag_id) VALUES (?, ?)", [paragraph.id, tagId]);
    }
  }
}

async function seedMysql(db) {
  await db.query(
    "INSERT IGNORE INTO users (id, username, password_hash, created_at) VALUES (?, ?, ?, ?)",
    ["system", "系统示例", hashPassword("system"), "2026-07-08T08:00:00.000Z"]
  );

  for (const tag of tags) {
    await db.query(
      "INSERT INTO tags (id, name, sort_order) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name), sort_order = VALUES(sort_order)",
      [tag.id, tag.name, tag.sortOrder]
    );
  }

  for (const paragraph of paragraphs) {
    await db.query(
      "INSERT IGNORE INTO paragraphs (id, content, author_id, theme, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
      [paragraph.id, paragraph.content, paragraph.authorId, paragraph.theme, paragraph.createdAt, paragraph.updatedAt]
    );
    for (const tagId of paragraph.tags) {
      await db.query("INSERT IGNORE INTO paragraph_tags (paragraph_id, tag_id) VALUES (?, ?)", [paragraph.id, tagId]);
    }
  }
}

async function main() {
  const config = getConfig();
  const provider = createDatabaseProvider(config);
  await provider.connect();
  const db = provider.getClient();

  if (config.dbClient === "mysql") {
    await seedMysql(db);
  } else {
    await seedSqlite(db);
  }

  await provider.close();
  console.log("Seed data copied.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
