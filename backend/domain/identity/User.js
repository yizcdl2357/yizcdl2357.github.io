const { DomainError } = require("../shared/DomainError");
const { DomainEvent } = require("../shared/DomainEvent");

class Username {
  constructor(value) {
    this.value = String(value || "").trim();
    if (!this.value) throw new DomainError("请输入用户名", "USERNAME_REQUIRED");
    Object.freeze(this);
  }
}

class Role {
  constructor(value = "user") {
    this.value = String(value || "user");
    if (!Role.values.includes(this.value)) throw new DomainError("Invalid user role", "INVALID_USER_ROLE");
    Object.freeze(this);
  }

  static get values() { return ["user", "admin"]; }
  static user() { return new Role("user"); }
}

class User {
  constructor({ id, username, role = "user", passwordHash, createdAt }) {
    this.id = id;
    this.username = username instanceof Username ? username : new Username(username);
    this.role = role instanceof Role ? role : new Role(role);
    this.passwordHash = passwordHash;
    this.createdAt = createdAt;
    this.events = [];
  }

  static register(data) {
    if (!data.passwordHash) throw new DomainError("请输入密码", "PASSWORD_REQUIRED");
    const user = new User({ ...data, role: Role.user() });
    user.events.push(new DomainEvent("UserRegistered", { userId: user.id }));
    return user;
  }

  canLogin(systemUserId) {
    return this.id !== systemUserId;
  }

  verifyPassword(password, hasher) {
    return hasher.hash(password) === this.passwordHash;
  }

  toPersistence() {
    return { id: this.id, username: this.username.value, role: this.role.value, passwordHash: this.passwordHash, createdAt: this.createdAt };
  }

  toPublic() {
    return { id: this.id, username: this.username.value, role: this.role.value, createdAt: this.createdAt };
  }
}

module.exports = { User, Username, Role };
