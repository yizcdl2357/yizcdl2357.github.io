const assert = require("assert");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../..");
const dbFile = path.join(root, "data", "moderation-e2e.sqlite");
const base = "http://127.0.0.1:3133";

async function request(method, route, cookie, body) {
  const response = await fetch(base + route, {
    method,
    headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...(cookie ? { Cookie: cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined
  });
  return { status: response.status, cookie: response.headers.get("set-cookie"), data: await response.json() };
}

async function waitForServer() {
  for (let i = 0; i < 50; i += 1) {
    try { if ((await fetch(base + "/health")).ok) return; } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Server did not start");
}

async function startServer() {
  const child = spawn(process.execPath, ["backend/server.js"], {
    cwd: root, env: { ...process.env, DB_FILE: "./data/moderation-e2e.sqlite", PORT: "3133" }, stdio: "ignore"
  });
  await waitForServer();
  return child;
}

async function run() {
  fs.rmSync(dbFile, { force: true });
  let server = await startServer();
  const suffix = Date.now();
  await request("POST", "/api/auth/register", "", { username: "yizcdl2357", password: "AdminPass123!" });
  await request("POST", "/api/auth/register", "", { username: `moderation_${suffix}`, password: "UserPass123!" });
  server.kill();
  await new Promise((resolve) => server.once("exit", resolve));

  // A second startup proves migrations can run repeatedly and performs the admin role backfill.
  server = await startServer();
  try {
    const adminLogin = await request("POST", "/api/auth/login", "", { username: "yizcdl2357", password: "AdminPass123!" });
    const userLogin = await request("POST", "/api/auth/login", "", { username: `moderation_${suffix}`, password: "UserPass123!" });
    const adminCookie = adminLogin.cookie.split(";", 1)[0];
    const userCookie = userLogin.cookie.split(";", 1)[0];
    assert.equal(adminLogin.data.user.role, "admin");

    const first = (await request("POST", "/api/paragraphs", userCookie, { content: "First pending paragraph for strict moderation.", theme: "test", tags: [] })).data.paragraph;
    assert.equal(first.status, "pending");
    assert(!(await request("GET", "/api/paragraphs", userCookie)).data.paragraphs.some((item) => item.id === first.id));
    assert((await request("GET", "/api/me/paragraphs", userCookie)).data.paragraphs.some((item) => item.id === first.id && item.status === "pending"));
    assert.equal((await request("GET", "/api/reviews/next", userCookie)).status, 403);
    assert.equal((await request("GET", "/api/reviews/next", adminCookie)).data.submission.id, first.id);

    const edited = await request("PATCH", `/api/reviews/${first.id}`, adminCookie, { content: "First modified paragraph is now approved.", theme: "test", tags: [], expectedVersion: 0 });
    assert.equal(edited.data.paragraph.reviewVersion, 1);
    assert.equal((await request("POST", `/api/reviews/${first.id}/approve`, adminCookie, { expectedVersion: 0 })).status, 409);
    assert.equal((await request("POST", `/api/reviews/${first.id}/approve`, adminCookie, { expectedVersion: 1 })).data.paragraph.status, "approved");
    assert((await request("GET", "/api/paragraphs", userCookie)).data.paragraphs.some((item) => item.id === first.id));

    const second = (await request("POST", "/api/paragraphs", userCookie, { content: "Second pending paragraph must be rejected.", theme: "test", tags: [] })).data.paragraph;
    assert.equal((await request("GET", "/api/reviews/next", adminCookie)).data.submission.id, second.id);
    assert.equal((await request("POST", `/api/reviews/${second.id}/reject`, adminCookie, { expectedVersion: 0, reason: "needs revision" })).data.paragraph.status, "rejected");
    assert.equal((await request("DELETE", `/api/paragraphs/${second.id}`, userCookie)).status, 409);
    assert((await request("GET", "/api/me/paragraphs", userCookie)).data.paragraphs.some((item) => item.id === second.id && item.status === "rejected"));

    const third = (await request("POST", "/api/paragraphs", userCookie, { content: "Third pending paragraph is removed by its author.", theme: "test", tags: [] })).data.paragraph;
    assert.equal((await request("DELETE", `/api/paragraphs/${third.id}`, userCookie)).status, 200);

    const adminParagraph = (await request("POST", "/api/paragraphs", adminCookie, { content: "Administrator paragraph publishes immediately.", theme: "test", tags: [] })).data.paragraph;
    assert.equal(adminParagraph.status, "approved");
    assert.equal((await request("DELETE", `/api/paragraphs/${adminParagraph.id}`, userCookie)).status, 403);
    assert.equal((await request("DELETE", `/api/paragraphs/${first.id}`, adminCookie)).status, 200);
    assert.equal((await request("DELETE", `/api/paragraphs/${adminParagraph.id}`, adminCookie)).status, 200);
    console.log("Moderation SQLite HTTP E2E passed");
  } finally {
    server.kill();
    await new Promise((resolve) => server.once("exit", resolve));
    fs.rmSync(dbFile, { force: true });
  }
}

run().catch((error) => { console.error(error); process.exit(1); });
