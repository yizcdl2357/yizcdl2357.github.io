const crypto = require("crypto");

class AuthService {
  constructor(userRepository) {
    this.userRepository = userRepository;
    this.sessions = new Map();
  }

  async register(username, password) {
    const cleanUsername = (username || "").trim();
    if (!cleanUsername) return { ok: false, message: "请输入用户名" };
    if (!password) return { ok: false, message: "请输入密码" };
    if (await this.userRepository.findByUsername(cleanUsername)) {
      return { ok: false, message: "用户名已被使用" };
    }

    const user = await this.userRepository.create({
      id: crypto.randomUUID(),
      username: cleanUsername,
      passwordHash: this.hashPassword(password),
      createdAt: new Date().toISOString()
    });
    return { ok: true, message: "注册成功，请登录", user: this.publicUser(user) };
  }

  async login(username, password) {
    const cleanUsername = (username || "").trim();
    if (!cleanUsername) return { ok: false, message: "请输入用户名" };
    if (!password) return { ok: false, message: "请输入密码" };

    const user = await this.userRepository.findByUsername(cleanUsername);
    if (!user || user.passwordHash !== this.hashPassword(password)) {
      return { ok: false, message: "用户名或密码错误" };
    }

    const sessionId = crypto.randomUUID();
    this.sessions.set(sessionId, user.id);
    return { ok: true, message: "登录成功", sessionId, user: this.publicUser(user) };
  }

  logout(sessionId) {
    this.sessions.delete(sessionId);
    return { ok: true, message: "已退出登录" };
  }

  async getCurrentUser(sessionId) {
    if (!sessionId) return null;
    const userId = this.sessions.get(sessionId);
    return userId ? this.publicUser(await this.userRepository.findById(userId)) : null;
  }

  publicUser(user) {
    if (!user) return null;
    return { id: user.id, username: user.username, createdAt: user.createdAt };
  }

  hashPassword(password) {
    return crypto.createHash("sha256").update(password).digest("hex");
  }
}

module.exports = { AuthService };
