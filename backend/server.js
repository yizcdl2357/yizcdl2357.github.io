const http = require("http");
const path = require("path");
const fs = require("fs");
const { createContainer } = require("./container");
const { sendJson } = require("./controllers/helpers");

class ApiServer {
  constructor(container) {
    this.container = container;
  }

  start() {
    const server = http.createServer((req, res) => this.registerRoutes(req, res));
    server.listen(this.container.config.port, () => {
      console.log(`API server listening on http://localhost:${this.container.config.port}`);
    });
  }

  async registerRoutes(req, res) {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const pathname = url.pathname;

      if (req.method === "POST" && pathname === "/api/auth/register") return this.container.authController.register(req, res);
      if (req.method === "POST" && pathname === "/api/auth/login") return this.container.authController.login(req, res);
      if (req.method === "POST" && pathname === "/api/auth/logout") return this.container.authController.logout(req, res);
      if (req.method === "GET" && pathname === "/api/auth/me") return this.container.authController.getCurrentUser(req, res);
      if (req.method === "POST" && pathname === "/api/themes/detect") return this.container.toolController.detectTheme(req, res);
      if (req.method === "POST" && pathname === "/api/ocr") return this.container.toolController.recognizeText(req, res);

      if (req.method === "GET" && pathname === "/api/paragraphs") return this.container.paragraphController.listParagraphs(req, res, url);
      if (req.method === "POST" && pathname === "/api/paragraphs") return this.container.paragraphController.createParagraph(req, res);
      if (req.method === "GET" && pathname === "/api/me/paragraphs") return this.container.paragraphController.listMyParagraphs(req, res);
      if (req.method === "GET" && pathname === "/api/me/collections") return this.container.collectionController.listMyCollections(req, res);

      const paragraphMatch = pathname.match(/^\/api\/paragraphs\/([^/]+)$/);
      if (paragraphMatch && req.method === "GET") return this.container.paragraphController.getParagraph(req, res, paragraphMatch[1]);
      if (paragraphMatch && req.method === "DELETE") return this.container.paragraphController.deleteParagraph(req, res, paragraphMatch[1]);

      const collectionMatch = pathname.match(/^\/api\/paragraphs\/([^/]+)\/collections$/);
      if (collectionMatch && req.method === "POST") return this.container.collectionController.collectParagraph(req, res, collectionMatch[1]);
      if (collectionMatch && req.method === "DELETE") return this.container.collectionController.uncollectParagraph(req, res, collectionMatch[1]);
      if (collectionMatch && req.method === "GET") return this.container.collectionController.getCollectionCount(req, res, collectionMatch[1]);

      if (req.method === "GET") return this.serveStatic(pathname, res);

      sendJson(res, 404, { ok: false, message: "Not found" });
    } catch (error) {
      sendJson(res, 500, { ok: false, message: error.message });
    }
  }

  serveStatic(pathname, res) {
    const root = this.container.config.rootDir;
    const filePath = path.join(root, pathname === "/" ? "index.html" : pathname);
    if (!filePath.startsWith(root) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      return sendJson(res, 404, { ok: false, message: "Not found" });
    }

    const ext = path.extname(filePath);
    const contentType = {
      ".html": "text/html; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".js": "application/javascript; charset=utf-8",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg"
    }[ext] || "application/octet-stream";

    res.writeHead(200, { "Content-Type": contentType });
    fs.createReadStream(filePath).pipe(res);
  }
}

if (require.main === module) {
  createContainer()
    .then((container) => new ApiServer(container).start())
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { ApiServer };
