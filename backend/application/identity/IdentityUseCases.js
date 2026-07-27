const { User, Username } = require("../../domain/identity/User");
const { Session } = require("../../domain/identity/Session");
const { DomainError } = require("../../domain/shared/DomainError");

class IdentityUseCases {
  constructor({ userRepository, passwordHasher, idGenerator, clock, systemUserId }) {
    this.userRepository = userRepository;
    this.passwordHasher = passwordHasher;
    this.idGenerator = idGenerator;
    this.clock = clock;
    this.systemUserId = systemUserId;
  }

  async register({ username, password }) {
    let cleanUsername;
    try {
      cleanUsername = new Username(username);
    } catch (error) {
      return this.failure(error);
    }
    if (!password) return { ok: false, message: "请输入密码" };
    if (await this.userRepository.findByUsername(cleanUsername.value)) {
      return { ok: false, message: "用户名已被使用" };
    }
    const user = User.register({
      id: this.idGenerator.generate(),
      username: cleanUsername,
      passwordHash: this.passwordHasher.hash(password),
      createdAt: this.clock.now()
    });
    const saved = await this.userRepository.create(user.toPersistence());
    return { ok: true, message: "注册成功，请登录", user: this.publicUser(saved) };
  }

  async login({ username, password }) {
    let cleanUsername;
    try {
      cleanUsername = new Username(username);
    } catch (error) {
      return this.failure(error);
    }
    if (!password) return { ok: false, message: "请输入密码" };
    const row = await this.userRepository.findByUsername(cleanUsername.value);
    if (!row) return { ok: false, message: "用户名或密码错误" };
    const user = new User(row);
    if (!user.canLogin(this.systemUserId) || !user.verifyPassword(password, this.passwordHasher)) {
      return { ok: false, message: "用户名或密码错误" };
    }
    const session = new Session({ id: this.idGenerator.generate(), userId: user.id, createdAt: this.clock.now() });
    await this.userRepository.createSession(session.id, session.userId, session.createdAt);
    return { ok: true, message: "登录成功", sessionId: session.id, user: user.toPublic() };
  }

  async logout({ sessionId }) {
    if (sessionId) await this.userRepository.deleteSession(sessionId);
    return { ok: true, message: "已退出登录" };
  }

  async getCurrentUser({ sessionId }) {
    if (!sessionId) return null;
    const userId = await this.userRepository.findUserIdBySession(sessionId);
    return userId ? this.publicUser(await this.userRepository.findById(userId)) : null;
  }

  publicUser(user) {
    if (!user) return null;
    return { id: user.id, username: user.username?.value || user.username, role: user.role?.value || user.role || "user", createdAt: user.createdAt };
  }

  failure(error) {
    if (error instanceof DomainError) return { ok: false, message: error.message };
    throw error;
  }
}

module.exports = { IdentityUseCases };
