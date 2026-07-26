class SQLiteCollectionRepository {
  constructor(db) {
    this.db = db;
  }

  create(collection) {
    this.db.run(
      "INSERT OR IGNORE INTO collections (id, user_id, paragraph_id, created_at) VALUES (?, ?, ?, ?)",
      [collection.id, collection.userId, collection.paragraphId, collection.createdAt]
    );
  }

  delete(userId, paragraphId) {
    this.db.run("DELETE FROM collections WHERE user_id = ? AND paragraph_id = ?", [userId, paragraphId]);
  }

  findByUserId(userId) {
    return this.db.all("SELECT * FROM collections WHERE user_id = ? ORDER BY created_at DESC", [userId]).map((row) => ({
      id: row.id,
      userId: row.user_id,
      paragraphId: row.paragraph_id,
      createdAt: row.created_at
    }));
  }

  countByParagraphId(paragraphId) {
    return this.db.get("SELECT COUNT(*) AS count FROM collections WHERE paragraph_id = ?", [paragraphId]).count;
  }

  countByParagraphIds(ids) {
    const counts = new Map();
    ids.forEach((id) => counts.set(id, this.countByParagraphId(id)));
    return counts;
  }

  exists(userId, paragraphId) {
    return Boolean(this.db.get("SELECT id FROM collections WHERE user_id = ? AND paragraph_id = ?", [userId, paragraphId]));
  }

  deleteByParagraphId(paragraphId) {
    this.db.run("DELETE FROM collections WHERE paragraph_id = ?", [paragraphId]);
  }
}

module.exports = { SQLiteCollectionRepository };
