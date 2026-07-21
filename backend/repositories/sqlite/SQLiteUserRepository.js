class SQLiteUserRepository {
  constructor(db) {
    this.db = db;
  }

  create(user) {
    this.db.run(
      "INSERT INTO users (id, username, password_hash, created_at) VALUES (?, ?, ?, ?)",
      [user.id, user.username, user.passwordHash, user.createdAt]
    );
    return this.findById(user.id);
  }

  findById(id) {
    return this.map(this.db.get("SELECT * FROM users WHERE id = ?", [id]));
  }

  findByUsername(username) {
    return this.map(this.db.get("SELECT * FROM users WHERE username = ?", [username]));
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

module.exports = { SQLiteUserRepository };
