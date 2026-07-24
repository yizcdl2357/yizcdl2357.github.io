const crypto = require("crypto");

class AuthService {
  constructor(userRepository, systemUserId = "system") {
    this.userRepository = userRepository;
    this.systemUserId = systemUserId;
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
    if (!user || user.id === this.systemUserId || user.passwordHash !== this.hashPassword(password)) {
      return { ok: false, message: "用户名或密码错误" };
    }

    const sessionId = crypto.randomUUID();
    await this.userRepository.createSession(sessionId, user.id, new Date().toISOString());
    return { ok: true, message: "登录成功", sessionId, user: this.publicUser(user) };
  }

  async logout(sessionId) {
    if (sessionId) await this.userRepository.deleteSession(sessionId);
    return { ok: true, message: "已退出登录" };
  }

  async getCurrentUser(sessionId) {
    if (!sessionId) return null;
    const userId = await this.userRepository.findUserIdBySession(sessionId);
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
