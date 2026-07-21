function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => body += chunk);
    req.on("end", () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
  });
}

function sendJson(res, status, data, headers = {}) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", ...headers });
  res.end(JSON.stringify(data));
}

function getSessionId(req) {
  const cookie = req.headers.cookie || "";
  const match = cookie.match(/sessionId=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

module.exports = { readJson, sendJson, getSessionId };
