const assert = require("assert");
const { createRoutes } = require("../../backend/interfaces/http/routes");

const noop = async () => {};
const container = {
  authController: { register: noop, login: noop, logout: noop, getCurrentUser: noop },
  paragraphController: { listParagraphs: noop, createParagraph: noop, listMyParagraphs: noop, getParagraph: noop, deleteParagraph: noop },
  collectionController: { listMyCollections: noop, collectParagraph: noop, uncollectParagraph: noop, getCollectionCount: noop },
  toolController: { detectTheme: noop, recognizeText: noop }
};

const routes = createRoutes(container).map(([method, pattern]) => `${method} ${pattern.source}`);
const expected = [
  "POST ^\\/api\\/auth\\/register$", "POST ^\\/api\\/auth\\/login$", "POST ^\\/api\\/auth\\/logout$", "GET ^\\/api\\/auth\\/me$",
  "POST ^\\/api\\/themes\\/detect$", "POST ^\\/api\\/ocr$", "GET ^\\/api\\/paragraphs$", "POST ^\\/api\\/paragraphs$",
  "GET ^\\/api\\/me\\/paragraphs$", "GET ^\\/api\\/me\\/collections$", "GET ^\\/api\\/paragraphs\\/([^/]+)$",
  "DELETE ^\\/api\\/paragraphs\\/([^/]+)$", "POST ^\\/api\\/paragraphs\\/([^/]+)\\/collections$",
  "DELETE ^\\/api\\/paragraphs\\/([^/]+)\\/collections$", "GET ^\\/api\\/paragraphs\\/([^/]+)\\/collections$"
];
assert.deepStrictEqual(routes, expected);
console.log("HTTP route contract tests passed");
