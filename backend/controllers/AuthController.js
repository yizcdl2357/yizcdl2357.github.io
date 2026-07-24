const { readJson, sendJson, getSessionId } = require("./helpers");

class AuthController {
  constructor(authService, options = {}) {
    this.authService = authService;
    this.secureCookies = Boolean(options.secureCookies);
  }

  async register(req, res) {
    const body = await readJson(req);
    const result = await this.authService.register(body.username, body.password);
    sendJson(res, result.ok ? 200 : 400, result);
  }

  async login(req, res) {
    const body = await readJson(req);
    const result = await this.authService.login(body.username, body.password);
    const headers = result.ok ? { "Set-Cookie": this.sessionCookie(result.sessionId) } : {};
    const { sessionId, ...publicResult } = result;
    sendJson(res, result.ok ? 200 : 401, publicResult, headers);
  }

  async logout(req, res) {
    await this.authService.logout(getSessionId(req));
    sendJson(res, 200, { ok: true, message: "已退出登录" }, { "Set-Cookie": this.sessionCookie("", 0) });
  }

  async getCurrentUser(req, res) {
    sendJson(res, 200, { ok: true, user: await this.authService.getCurrentUser(getSessionId(req)) });
  }

  sessionCookie(sessionId, maxAge) {
    const parts = [
      `sessionId=${encodeURIComponent(sessionId)}`,
      "Path=/",
      "HttpOnly",
      this.secureCookies ? "Secure" : "SameSite=Lax",
      this.secureCookies ? "SameSite=None" : ""
    ].filter(Boolean);
    if (maxAge !== undefined) parts.push(`Max-Age=${maxAge}`);
    return parts.join("; ");
  }
}

module.exports = { AuthController };
