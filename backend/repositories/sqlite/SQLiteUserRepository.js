class SQLiteUserRepository {
  constructor(db) {
    this.db = db;
  }

  create(user) {
    this.db.run(
      "INSERT INTO users (id, username, role, password_hash, created_at) VALUES (?, ?, ?, ?, ?)",
      [user.id, user.username, user.role || "user", user.passwordHash, user.createdAt]
    );
    return this.findById(user.id);
  }

  findById(id) {
    return this.map(this.db.get("SELECT * FROM users WHERE id = ?", [id]));
  }

  findByUsername(username) {
    return this.map(this.db.get("SELECT * FROM users WHERE username = ?", [username]));
  }

  createSession(id, userId, createdAt) {
    this.db.run(
      "INSERT OR REPLACE INTO sessions (id, user_id, created_at) VALUES (?, ?, ?)",
      [id, userId, createdAt]
    );
  }

  findUserIdBySession(id) {
    return this.db.get("SELECT user_id FROM sessions WHERE id = ?", [id])?.user_id || null;
  }

  deleteSession(id) {
    this.db.run("DELETE FROM sessions WHERE id = ?", [id]);
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

module.exports = { SQLiteUserRepository };
