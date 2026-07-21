const { readJson, sendJson, getSessionId } = require("./helpers");

class AuthController {
  constructor(authService) {
    this.authService = authService;
  }

  async register(req, res) {
    const body = await readJson(req);
    const result = await this.authService.register(body.username, body.password);
    sendJson(res, result.ok ? 200 : 400, result);
  }

  async login(req, res) {
    const body = await readJson(req);
    const result = await this.authService.login(body.username, body.password);
    const headers = result.ok ? { "Set-Cookie": `sessionId=${encodeURIComponent(result.sessionId)}; Path=/; HttpOnly` } : {};
    sendJson(res, result.ok ? 200 : 401, result, headers);
  }

  logout(req, res) {
    this.authService.logout(getSessionId(req));
    sendJson(res, 200, { ok: true, message: "已退出登录" }, { "Set-Cookie": "sessionId=; Path=/; Max-Age=0" });
  }

  async getCurrentUser(req, res) {
    sendJson(res, 200, { ok: true, user: await this.authService.getCurrentUser(getSessionId(req)) });
  }
}

module.exports = { AuthController };
