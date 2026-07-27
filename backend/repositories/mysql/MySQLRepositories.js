class MySQLUserRepository {
  constructor(db) {
    this.db = db;
  }

  async create(user) {
    await this.db.query(
      "INSERT INTO users (id, username, role, password_hash, created_at) VALUES (?, ?, ?, ?, ?)",
      [user.id, user.username, user.role || "user", user.passwordHash, user.createdAt]
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
      role: row.role || "user",
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
        "INSERT INTO paragraphs (id,content,author_id,theme,status,submitted_at,review_version,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)",
        [paragraph.id,paragraph.content,paragraph.authorId,paragraph.theme,paragraph.status,paragraph.submittedAt,paragraph.reviewVersion,paragraph.createdAt,paragraph.updatedAt]
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

    return this.findByIdAny(paragraph.id);
  }

  async findById(id) {
    return this.withTags(await this.first("SELECT * FROM paragraphs WHERE id = ? AND status='approved'", [id]));
  }

  async findByIdAny(id) { return this.withTags(await this.first("SELECT * FROM paragraphs WHERE id=?", [id])); }
  async findNextPending() { return this.withTags(await this.first("SELECT * FROM paragraphs WHERE status='pending' ORDER BY submitted_at,id LIMIT 1")); }

  async findByUserId(userId) {
    return this.listWithRelationsSingleQuery("WHERE p.author_id = ?", [userId]);
  }

  async search(keyword = "", theme = "", tags = []) {
    const clauses = ["p.status='approved'"];
    const params = [];

    if (keyword) {
      clauses.push("p.content LIKE ?");
      params.push(`%${keyword}%`);
    }

    if (theme) {
      clauses.push("p.theme LIKE ?");
      params.push(`%${theme}%`);
    }

    if (tags && tags.length > 0) {
      clauses.push(`p.id IN (
        SELECT paragraph_id FROM paragraph_tags
        WHERE tag_id IN (${tags.map(() => "?").join(",")})
        GROUP BY paragraph_id
        HAVING COUNT(DISTINCT tag_id) = ?
      )`);
      params.push(...tags, tags.length);
    }

    const where = `WHERE ${clauses.join(" AND ")}`;
    return this.listWithRelationsSingleQuery(where, params);
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

  async updateReview(p, expectedVersion) {
    const [result] = await this.db.query(
      "UPDATE paragraphs SET content=?,theme=?,status=?,review_version=?,reviewed_by=?,reviewed_at=?,rejection_reason=?,updated_at=? WHERE id=? AND review_version=? AND status='pending'",
      [p.content,p.theme,p.status,p.reviewVersion,p.reviewedBy,p.reviewedAt,p.rejectionReason,p.updatedAt,p.id,expectedVersion]
    );
    if (!result.affectedRows) { const error = new Error("Review version conflict"); error.code = "REVIEW_VERSION_CONFLICT"; throw error; }
    await this.db.query("DELETE FROM paragraph_tags WHERE paragraph_id=?", [p.id]);
    for (const tag of p.tags) await this.db.query("INSERT IGNORE INTO paragraph_tags(paragraph_id,tag_id) VALUES(?,?)", [p.id,tag]);
    return this.findByIdAny(p.id);
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
      status: row.status || "approved",
      submittedAt: row.submitted_at || row.created_at,
      reviewVersion: Number(row.review_version || 0),
      reviewedBy: row.reviewed_by || null,
      reviewedAt: row.reviewed_at || null,
      rejectionReason: row.rejection_reason || null,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  async withTagsBatch(rows) {
    if (!rows.length) return [];
    const ids = rows.map((row) => row.id);
    const authorIds = [...new Set(rows.map((row) => row.author_id))];
    const [tagRows] = await this.db.query(
      `SELECT paragraph_tags.paragraph_id, tags.id, tags.name
       FROM paragraph_tags JOIN tags ON tags.id = paragraph_tags.tag_id
       WHERE paragraph_tags.paragraph_id IN (${ids.map(() => "?").join(",")})
       ORDER BY tags.sort_order, tags.id`, ids
    );
    const [userRows] = await this.db.query(
      `SELECT id, username FROM users WHERE id IN (${authorIds.map(() => "?").join(",")})`, authorIds
    );
    const tagsByParagraph = new Map();
    tagRows.forEach((tag) => {
      const list = tagsByParagraph.get(tag.paragraph_id) || [];
      list.push(tag);
      tagsByParagraph.set(tag.paragraph_id, list);
    });
    const usersById = new Map(userRows.map((user) => [user.id, user.username]));
    return rows.map((row) => {
      const tags = tagsByParagraph.get(row.id) || [];
      return {
        id: row.id,
        content: row.content,
        authorId: row.author_id,
        authorName: usersById.get(row.author_id) || "系统示例",
        theme: row.theme,
        themeName: row.theme,
        tags: tags.map((tag) => tag.id),
        tagNames: tags.map((tag) => tag.name),
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    });
  }

  async listWithRelations(where, params) {
    const [rows] = await this.db.query(
      `SELECT paragraphs.*, users.username AS author_name,
              GROUP_CONCAT(DISTINCT tags.id ORDER BY tags.sort_order, tags.id SEPARATOR '\\x1f') AS tag_ids,
              GROUP_CONCAT(DISTINCT tags.name ORDER BY tags.sort_order, tags.id SEPARATOR '\\x1f') AS tag_names,
              COUNT(DISTINCT collections.id) AS collection_count
       FROM paragraphs
       LEFT JOIN users ON users.id = paragraphs.author_id
       LEFT JOIN paragraph_tags ON paragraph_tags.paragraph_id = paragraphs.id
       LEFT JOIN tags ON tags.id = paragraph_tags.tag_id
       LEFT JOIN collections ON collections.paragraph_id = paragraphs.id
       ${where}
       GROUP BY paragraphs.id, paragraphs.content, paragraphs.author_id, paragraphs.theme,
                paragraphs.created_at, paragraphs.updated_at, users.username
       ORDER BY paragraphs.created_at DESC`,
      params
    );
    return rows.map((row) => ({
      id: row.id,
      content: row.content,
      authorId: row.author_id,
      authorName: row.author_name || "系统示例",
      theme: row.theme,
      themeName: row.theme,
      tags: row.tag_ids ? row.tag_ids.split("\x1f") : [],
      tagNames: row.tag_names ? row.tag_names.split("\x1f") : [],
      collectionCount: Number(row.collection_count || 0),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  async listWithRelationsSingleQuery(where, params) {
    const [rows] = await this.db.query(
      `SELECT p.*, u.username AS author_name, t.id AS tag_id, t.name AS tag_name,
              COALESCE(cc.collection_count, 0) AS collection_count
       FROM paragraphs p
       LEFT JOIN users u ON u.id = p.author_id
       LEFT JOIN paragraph_tags pt ON pt.paragraph_id = p.id
       LEFT JOIN tags t ON t.id = pt.tag_id
       LEFT JOIN (
         SELECT paragraph_id, COUNT(*) AS collection_count FROM collections GROUP BY paragraph_id
       ) cc ON cc.paragraph_id = p.id
       ${where}
       ORDER BY p.created_at DESC, t.sort_order, t.id`, params
    );
    const paragraphs = new Map();
    for (const row of rows) {
      if (!paragraphs.has(row.id)) {
        paragraphs.set(row.id, {
          id: row.id, content: row.content, authorId: row.author_id,
          authorName: row.author_name || "系统示例", theme: row.theme, themeName: row.theme,
          tags: [], tagNames: [], collectionCount: Number(row.collection_count || 0),
          status: row.status || "approved", submittedAt: row.submitted_at || row.created_at,
          reviewVersion: Number(row.review_version || 0), reviewedBy: row.reviewed_by || null,
          reviewedAt: row.reviewed_at || null, rejectionReason: row.rejection_reason || null,
          createdAt: row.created_at, updatedAt: row.updated_at
        });
      }
      if (row.tag_id) {
        paragraphs.get(row.id).tags.push(row.tag_id);
        paragraphs.get(row.id).tagNames.push(row.tag_name);
      }
    }
    return [...paragraphs.values()];
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

  async countByParagraphIds(ids) {
    if (!ids.length) return new Map();
    const [rows] = await this.db.query(
      `SELECT paragraph_id, COUNT(*) AS count FROM collections WHERE paragraph_id IN (${ids.map(() => "?").join(",")}) GROUP BY paragraph_id`, ids
    );
    return new Map(rows.map((row) => [row.paragraph_id, Number(row.count)]));
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
