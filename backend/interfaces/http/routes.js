function createRoutes(container) {
  return [
    ["POST", /^\/api\/auth\/register$/, (req, res) => container.authController.register(req, res)],
    ["POST", /^\/api\/auth\/login$/, (req, res) => container.authController.login(req, res)],
    ["POST", /^\/api\/auth\/logout$/, (req, res) => container.authController.logout(req, res)],
    ["GET", /^\/api\/auth\/me$/, (req, res) => container.authController.getCurrentUser(req, res)],
    ["POST", /^\/api\/themes\/detect$/, (req, res) => container.toolController.detectTheme(req, res)],
    ["POST", /^\/api\/ocr$/, (req, res) => container.toolController.recognizeText(req, res)],
    ["GET", /^\/api\/paragraphs$/, (req, res, match, url) => container.paragraphController.listParagraphs(req, res, url)],
    ["POST", /^\/api\/paragraphs$/, (req, res) => container.paragraphController.createParagraph(req, res)],
    ["GET", /^\/api\/me\/paragraphs$/, (req, res) => container.paragraphController.listMyParagraphs(req, res)],
    ["GET", /^\/api\/reviews\/next$/, (req, res) => container.paragraphController.nextReview(req, res)],
    ["PATCH", /^\/api\/reviews\/([^/]+)$/, (req, res, match) => container.paragraphController.review(req, res, match[1], "update")],
    ["POST", /^\/api\/reviews\/([^/]+)\/approve$/, (req, res, match) => container.paragraphController.review(req, res, match[1], "approve")],
    ["POST", /^\/api\/reviews\/([^/]+)\/reject$/, (req, res, match) => container.paragraphController.review(req, res, match[1], "reject")],
    ["GET", /^\/api\/me\/collections$/, (req, res) => container.collectionController.listMyCollections(req, res)],
    ["GET", /^\/api\/paragraphs\/([^/]+)$/, (req, res, match) => container.paragraphController.getParagraph(req, res, match[1])],
    ["DELETE", /^\/api\/paragraphs\/([^/]+)$/, (req, res, match) => container.paragraphController.deleteParagraph(req, res, match[1])],
    ["POST", /^\/api\/paragraphs\/([^/]+)\/collections$/, (req, res, match) => container.collectionController.collectParagraph(req, res, match[1])],
    ["DELETE", /^\/api\/paragraphs\/([^/]+)\/collections$/, (req, res, match) => container.collectionController.uncollectParagraph(req, res, match[1])],
    ["GET", /^\/api\/paragraphs\/([^/]+)\/collections$/, (req, res, match) => container.collectionController.getCollectionCount(req, res, match[1])]
  ];
}

async function dispatchRoute(routes, req, res, pathname, url) {
  for (const [method, pattern, handler] of routes) {
    if (method !== req.method) continue;
    const match = pathname.match(pattern);
    if (match) {
      await handler(req, res, match, url);
      return true;
    }
  }
  return false;
}

module.exports = { createRoutes, dispatchRoute };
