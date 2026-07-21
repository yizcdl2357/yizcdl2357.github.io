const { sendJson, getSessionId } = require("./helpers");

class CollectionController {
  constructor(authService, collectionService) {
    this.authService = authService;
    this.collectionService = collectionService;
  }

  async collectParagraph(req, res, id) {
    const user = await this.authService.getCurrentUser(getSessionId(req));
    if (!user) return sendJson(res, 401, { ok: false, message: "请先登录" });
    sendJson(res, 200, await this.collectionService.collectParagraph(user.id, id));
  }

  async uncollectParagraph(req, res, id) {
    const user = await this.authService.getCurrentUser(getSessionId(req));
    if (!user) return sendJson(res, 401, { ok: false, message: "请先登录" });
    sendJson(res, 200, await this.collectionService.uncollectParagraph(user.id, id));
  }

  async listMyCollections(req, res) {
    const user = await this.authService.getCurrentUser(getSessionId(req));
    if (!user) return sendJson(res, 401, { ok: false, message: "请先登录" });
    sendJson(res, 200, { ok: true, paragraphs: await this.collectionService.getCollectionsByUser(user.id) });
  }

  async getCollectionCount(req, res, id) {
    sendJson(res, 200, { ok: true, collectionCount: await this.collectionService.getCollectionCount(id) });
  }
}

module.exports = { CollectionController };
