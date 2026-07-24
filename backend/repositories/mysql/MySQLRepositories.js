class MySQLUserRepository {
  constructor(db) {
    this.db = db;
  }

  async create(user) {
    await this.db.query(
      "INSERT INTO users (id, username, password_hash, created_at) VALUES (?, ?, ?, ?)",
      [user.id, user.username, user.passwordHash, user.createdAt]
    );
    return this.findById(user.id);
  }

  async findById(id) {
    return this.map(await this.first("SELECT * FROM users WHERE id = ?", [id]));
  }

  async findByUsername(username) {
    return this.map(await this.first("SELECT * FROM users WHERE username = ?", [username]));
  }

  async createSession(id, userId, createdAt) {
    await this.db.query(
      "INSERT INTO sessions (id, user_id, created_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE user_id = VALUES(user_id), created_at = VALUES(created_at)",
      [id, userId, createdAt]
    );
  }

  async findUserIdBySession(id) {
    const row = await this.first("SELECT user_id FROM sessions WHERE id = ?", [id]);
    return row?.user_id || null;
  }

  async deleteSession(id) {
    await this.db.query("DELETE FROM sessions WHERE id = ?", [id]);
  }

  async first(sql, params = []) {
    const [rows] = await this.db.query(sql, params);
    return rows[0] || null;
  }

  map(row) {
    if (!row) return null;
    return {
      id: row.id,
      username: row.username,
      passwordHash: row.password_hash,
      createdAt: row.created_at
    };
  }
}

class MySQLTagRepository {
  constructor(db) {
    this.db = db;
  }

  async findAll() {
    const [rows] = await this.db.query("SELECT id, name FROM tags ORDER BY sort_order, id");
    return rows;
  }

  async findByName(name) {
    const [rows] = await this.db.query("SELECT id, name FROM tags WHERE name = ?", [name]);
    return rows[0] || null;
  }

  async validateTags(tagIds) {
    const allowed = new Set((await this.findAll()).map((tag) => tag.id));
    return (tagIds || []).filter((tagId) => allowed.has(tagId));
  }
}

class MySQLParagraphRepository {
  constructor(db) {
    this.db = db;
  }

  async create(paragraph) {
    const connection = await this.db.getConnection();
    try {
      await connection.beginTransaction();
      await connection.query(
        "INSERT INTO paragraphs (id, content, author_id, theme, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
        [paragraph.id, paragraph.content, paragraph.authorId, paragraph.theme, paragraph.createdAt, paragraph.updatedAt]
      );

      for (const tagId of paragraph.tags) {
        await connection.query("INSERT IGNORE INTO paragraph_tags (paragraph_id, tag_id) VALUES (?, ?)", [paragraph.id, tagId]);
      }
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    return this.findById(paragraph.id);
  }

  async findById(id) {
    return this.withTags(await this.first("SELECT * FROM paragraphs WHERE id = ?", [id]));
  }

  async findByUserId(userId) {
    const [rows] = await this.db.query("SELECT * FROM paragraphs WHERE author_id = ? ORDER BY created_at DESC", [userId]);
    return Promise.all(rows.map((row) => this.withTags(row)));
  }

  async search(keyword = "", theme = "", tags = []) {
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
    const [rows] = await this.db.query(`SELECT * FROM paragraphs ${where} ORDER BY created_at DESC`, params);
    return Promise.all(rows.map((row) => this.withTags(row)));
  }

  async deleteById(id) {
    const connection = await this.db.getConnection();
    try {
      await connection.beginTransaction();
      await connection.query("DELETE FROM paragraph_tags WHERE paragraph_id = ?", [id]);
      await connection.query("DELETE FROM paragraphs WHERE id = ?", [id]);
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async first(sql, params = []) {
    const [rows] = await this.db.query(sql, params);
    return rows[0] || null;
  }

  async withTags(row) {
    if (!row) return null;
    const [tags] = await this.db.query(
      `SELECT tags.id, tags.name
       FROM paragraph_tags
       JOIN tags ON tags.id = paragraph_tags.tag_id
       WHERE paragraph_tags.paragraph_id = ?
       ORDER BY tags.sort_order, tags.id`,
      [row.id]
    );
    const [users] = await this.db.query("SELECT username FROM users WHERE id = ?", [row.author_id]);
    return {
      id: row.id,
      content: row.content,
      authorId: row.author_id,
      authorName: users[0]?.username || "系统示例",
      theme: row.theme,
      themeName: row.theme,
      tags: tags.map((tag) => tag.id),
      tagNames: tags.map((tag) => tag.name),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

class MySQLCollectionRepository {
  constructor(db) {
    this.db = db;
  }

  async create(collection) {
    await this.db.query(
      "INSERT IGNORE INTO collections (id, user_id, paragraph_id, created_at) VALUES (?, ?, ?, ?)",
      [collection.id, collection.userId, collection.paragraphId, collection.createdAt]
    );
  }

  async delete(userId, paragraphId) {
    await this.db.query("DELETE FROM collections WHERE user_id = ? AND paragraph_id = ?", [userId, paragraphId]);
  }

  async findByUserId(userId) {
    const [rows] = await this.db.query("SELECT * FROM collections WHERE user_id = ? ORDER BY created_at DESC", [userId]);
    return rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      paragraphId: row.paragraph_id,
      createdAt: row.created_at
    }));
  }

  async countByParagraphId(paragraphId) {
    const [rows] = await this.db.query("SELECT COUNT(*) AS count FROM collections WHERE paragraph_id = ?", [paragraphId]);
    return rows[0].count;
  }

  async exists(userId, paragraphId) {
    const [rows] = await this.db.query("SELECT id FROM collections WHERE user_id = ? AND paragraph_id = ?", [userId, paragraphId]);
    return Boolean(rows[0]);
  }

  async deleteByParagraphId(paragraphId) {
    await this.db.query("DELETE FROM collections WHERE paragraph_id = ?", [paragraphId]);
  }
}

module.exports = {
  MySQLUserRepository,
  MySQLParagraphRepository,
  MySQLCollectionRepository,
  MySQLTagRepository
};
