const http = require("http");
const path = require("path");
const fs = require("fs");
const { createContainer } = require("./container");
const { sendJson } = require("./controllers/helpers");
const { createRoutes, dispatchRoute } = require("./interfaces/http/routes");

class ApiServer {
  constructor(container) {
    this.container = container;
    this.routes = createRoutes(container);
  }

  start() {
    const server = http.createServer((req, res) => this.registerRoutes(req, res));
    this.server = server;
    server.listen(this.container.config.port, "0.0.0.0", () => {
      console.log(`API server listening on port ${this.container.config.port}`);
    });
    const shutdown = () => this.stop().finally(() => process.exit(0));
    process.once("SIGTERM", shutdown);
    process.once("SIGINT", shutdown);
    return server;
  }

  async stop() {
    if (this.server) {
      await new Promise((resolve) => this.server.close(resolve));
      this.server = null;
    }
    await this.container.provider.close();
  }

  async registerRoutes(req, res) {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const pathname = url.pathname;

      if (!this.applyCors(req, res)) return;
      if (req.method === "OPTIONS") {
        res.writeHead(204);
        return res.end();
      }
      if (req.method === "GET" && pathname === "/health") {
        await this.container.provider.getClient().query?.("SELECT 1");
        return sendJson(res, 200, { ok: true, service: "english-corpus-api" });
      }

      if (await dispatchRoute(this.routes, req, res, pathname, url)) return;

      if (req.method === "GET") return this.serveStatic(pathname, res);

      sendJson(res, 404, { ok: false, message: "Not found" });
    } catch (error) {
      sendJson(res, 500, { ok: false, message: error.message });
    }
  }

  applyCors(req, res) {
    const origin = (req.headers.origin || "").replace(/\/$/, "");
    if (!origin) return true;
    if (!this.container.config.corsOrigins.includes(origin)) {
      sendJson(res, 403, { ok: false, message: "Origin not allowed" });
      return false;
    }
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Vary", "Origin");
    return true;
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
      console.error(error.message);
      process.exit(1);
    });
}

module.exports = { ApiServer };
