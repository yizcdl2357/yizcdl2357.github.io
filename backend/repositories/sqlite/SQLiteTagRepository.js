class SQLiteTagRepository {
  constructor(db) {
    this.db = db;
  }

  findAll() {
    return this.db.all("SELECT id, name FROM tags ORDER BY rowid");
  }

  findByName(name) {
    return this.db.get("SELECT id, name FROM tags WHERE name = ?", [name]);
  }

  validateTags(tagIds) {
    const allowed = new Set(this.findAll().map((tag) => tag.id));
    return (tagIds || []).filter((tagId) => allowed.has(tagId));
  }
}

module.exports = { SQLiteTagRepository };
