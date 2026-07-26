class SQLiteParagraphRepository {
  constructor(db, tagRepository) {
    this.db = db;
    this.tagRepository = tagRepository;
  }

  create(paragraph) {
    this.db.run(
      "INSERT INTO paragraphs (id, content, author_id, theme, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
      [paragraph.id, paragraph.content, paragraph.authorId, paragraph.theme, paragraph.createdAt, paragraph.updatedAt]
    );

    for (const tagId of paragraph.tags) {
      this.db.run("INSERT OR IGNORE INTO paragraph_tags (paragraph_id, tag_id) VALUES (?, ?)", [paragraph.id, tagId]);
    }

    return this.findById(paragraph.id);
  }

  findById(id) {
    return this.withTags(this.db.get("SELECT * FROM paragraphs WHERE id = ?", [id]));
  }

  findByUserId(userId) {
    return this.withTagsBatch(this.db.all("SELECT * FROM paragraphs WHERE author_id = ? ORDER BY created_at DESC", [userId]));
  }

  search(keyword = "", theme = "", tags = []) {
    const clauses = [];
    const params = [];

    if (keyword) {
      clauses.push("content LIKE ?");
      params.push(`%${keyword}%`);
    }

    if (theme) {
      clauses.push("theme LIKE ?");
      params.push(`%${theme}%`);
    }

    if (tags && tags.length > 0) {
      clauses.push(`id IN (
        SELECT paragraph_id FROM paragraph_tags
        WHERE tag_id IN (${tags.map(() => "?").join(",")})
        GROUP BY paragraph_id
        HAVING COUNT(DISTINCT tag_id) = ?
      )`);
      params.push(...tags, tags.length);
    }

    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    return this.withTagsBatch(this.db.all(`SELECT * FROM paragraphs ${where} ORDER BY created_at DESC`, params));
  }

  deleteById(id) {
    this.db.run("DELETE FROM paragraph_tags WHERE paragraph_id = ?", [id]);
    this.db.run("DELETE FROM paragraphs WHERE id = ?", [id]);
  }

  withTags(row) {
    if (!row) return null;
    const tagRows = this.db.all(
      `SELECT tags.id, tags.name
       FROM paragraph_tags
       JOIN tags ON tags.id = paragraph_tags.tag_id
       WHERE paragraph_tags.paragraph_id = ?
       ORDER BY tags.rowid`,
      [row.id]
    );
    const user = this.db.get("SELECT username FROM users WHERE id = ?", [row.author_id]);

    return {
      id: row.id,
      content: row.content,
      authorId: row.author_id,
      authorName: user?.username || "系统示例",
      theme: row.theme,
      themeName: row.theme,
      tags: tagRows.map((tag) => tag.id),
      tagNames: tagRows.map((tag) => tag.name),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  withTagsBatch(rows) {
    return rows.map((row) => this.withTags(row));
  }
}

module.exports = { SQLiteParagraphRepository };
