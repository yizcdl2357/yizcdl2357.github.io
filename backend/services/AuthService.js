class AuthService {
  constructor(identityUseCases) {
    this.identityUseCases = identityUseCases;
  }

  async register(username, password) {
    return this.identityUseCases.register({ username, password });
  }

  async login(username, password) {
    return this.identityUseCases.login({ username, password });
  }

  async logout(sessionId) {
    return this.identityUseCases.logout({ sessionId });
  }

  async getCurrentUser(sessionId) {
    return this.identityUseCases.getCurrentUser({ sessionId });
  }
}

module.exports = { AuthService };
