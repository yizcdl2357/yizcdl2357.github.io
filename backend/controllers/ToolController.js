const { readJson, sendJson } = require("./helpers");

class ToolController {
  constructor(themeService, ocrService) {
    this.themeService = themeService;
    this.ocrService = ocrService;
  }

  async detectTheme(req, res) {
    const body = await readJson(req);
    const theme = this.themeService.detectTheme(body.content || "");
    sendJson(res, 200, { ok: true, theme });
  }

  async recognizeText(req, res) {
    const body = await readJson(req);
    sendJson(res, 200, this.ocrService.recognizeText(body.image || ""));
  }
}

module.exports = { ToolController };
