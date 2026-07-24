const { readJson, sendJson, getSessionId } = require("./helpers");

class ParagraphController {
  constructor(authService, paragraphService) {
    this.authService = authService;
    this.paragraphService = paragraphService;
  }

  async createParagraph(req, res) {
    const user = await this.authService.getCurrentUser(getSessionId(req));
    if (!user) return sendJson(res, 401, { ok: false, message: "请先登录" });

    const body = await readJson(req);
    const result = await this.paragraphService.createParagraph(user.id, body.content, body.theme, body.tags || []);
    sendJson(res, result.ok ? 200 : 400, result);
  }

  async getParagraph(req, res, id) {
    const paragraph = await this.paragraphService.getParagraphById(id);
    sendJson(res, paragraph ? 200 : 404, paragraph ? { ok: true, paragraph } : { ok: false, message: "语段不存在" });
  }

  async listParagraphs(req, res, url) {
    const tags = url.searchParams.get("tags");
    const result = await this.paragraphService.searchParagraphs(
      url.searchParams.get("keyword") || "",
      url.searchParams.get("theme") || "",
      tags ? tags.split(",").filter(Boolean) : []
    );
    sendJson(res, 200, { ok: true, paragraphs: result });
  }

  async listMyParagraphs(req, res) {
    const user = await this.authService.getCurrentUser(getSessionId(req));
    if (!user) return sendJson(res, 401, { ok: false, message: "请先登录" });
    sendJson(res, 200, { ok: true, paragraphs: await this.paragraphService.getParagraphsByUser(user.id) });
  }

  async deleteParagraph(req, res, id) {
    const user = await this.authService.getCurrentUser(getSessionId(req));
    if (!user) return sendJson(res, 401, { ok: false, message: "请先登录" });

    const result = await this.paragraphService.deleteParagraph(user.id, id);
    sendJson(res, result.ok ? 200 : 403, result);
  }
}

module.exports = { ParagraphController };
