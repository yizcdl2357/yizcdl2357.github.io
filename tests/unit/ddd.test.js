const assert = require("assert");
const { IdentityUseCases } = require("../../backend/application/identity/IdentityUseCases");
const { CorpusUseCases } = require("../../backend/application/corpus/CorpusUseCases");
const { CollectionUseCases } = require("../../backend/application/collection/CollectionUseCases");
const { ToolUseCases } = require("../../backend/application/tools/ToolUseCases");
const { ThemeDetectionPolicy } = require("../../backend/domain/taxonomy/Taxonomy");
const { Sha256PasswordHasher } = require("../../backend/infrastructure/security/Sha256PasswordHasher");

class FixedIds { constructor() { this.value = 0; } generate() { return `id-${++this.value}`; } }
class FixedClock { now() { return "2026-07-25T00:00:00.000Z"; } }

async function run() {
  const users = new Map();
  const sessions = new Map();
  const paragraphs = new Map();
  const collections = new Map();
  const ids = new FixedIds();
  const clock = new FixedClock();
  const userRepository = {
    create: async (user) => (users.set(user.id, user), user),
    findById: async (id) => users.get(id) || null,
    findByUsername: async (name) => [...users.values()].find((user) => user.username === name) || null,
    createSession: async (id, userId) => sessions.set(id, userId),
    findUserIdBySession: async (id) => sessions.get(id) || null,
    deleteSession: async (id) => sessions.delete(id)
  };
  const paragraphRepository = {
    create: async (row) => (paragraphs.set(row.id, { ...row, authorName: "tester", tagNames: [] }), paragraphs.get(row.id)),
    findById: async (id) => paragraphs.get(id) || null,
    findByUserId: async (userId) => [...paragraphs.values()].filter((p) => p.authorId === userId),
    search: async () => [...paragraphs.values()],
    deleteById: async (id) => paragraphs.delete(id)
  };
  const collectionRepository = {
    create: async (item) => collections.set(`${item.userId}:${item.paragraphId}`, item),
    delete: async (userId, paragraphId) => collections.delete(`${userId}:${paragraphId}`),
    findByUserId: async (userId) => [...collections.values()].filter((item) => item.userId === userId),
    countByParagraphId: async (id) => [...collections.values()].filter((item) => item.paragraphId === id).length,
    exists: async (userId, paragraphId) => collections.has(`${userId}:${paragraphId}`),
    deleteByParagraphId: async (id) => [...collections.entries()].forEach(([key, item]) => item.paragraphId === id && collections.delete(key))
  };
  const tagRepository = { validateTags: async (tags) => tags.filter((tag) => tag === "opening") };
  const identity = new IdentityUseCases({ userRepository, passwordHasher: new Sha256PasswordHasher(), idGenerator: ids, clock, systemUserId: "system" });
  const corpus = new CorpusUseCases({ paragraphRepository, tagRepository, collectionRepository, themePolicy: new ThemeDetectionPolicy(), idGenerator: ids, clock });
  const collection = new CollectionUseCases({ collectionRepository, paragraphRepository, idGenerator: ids, clock });

  assert.deepStrictEqual(await identity.register({ username: "", password: "x" }), { ok: false, message: "请输入用户名" });
  const registration = await identity.register({ username: "tester", password: "secret" });
  assert.equal(registration.ok, true);
  const login = await identity.login({ username: "tester", password: "secret" });
  assert.equal(login.ok, true);
  assert.equal((await identity.getCurrentUser({ sessionId: login.sessionId })).username, "tester");

  assert.deepStrictEqual(await corpus.create({ userId: registration.user.id, content: "", theme: "", tags: [] }), { ok: false, message: "请输入语段内容" });
  const created = await corpus.create({ userId: registration.user.id, content: "Effort creates growth.", theme: "", tags: ["opening", "invalid"] });
  assert.equal(created.ok, true);
  assert.equal(created.paragraph.theme, "成长");
  assert.deepStrictEqual(created.paragraph.tags, ["opening"]);
  assert.equal((await collection.collect({ userId: registration.user.id, paragraphId: created.paragraph.id })).collectionCount, 1);
  assert.equal((await collection.uncollect({ userId: registration.user.id, paragraphId: created.paragraph.id })).collectionCount, 0);
  assert.equal((await corpus.delete({ userId: "other", paragraphId: created.paragraph.id })).message, "无权删除该语段");
  assert.equal((await corpus.delete({ userId: registration.user.id, paragraphId: created.paragraph.id })).ok, true);

  const tools = new ToolUseCases({ themePolicy: new ThemeDetectionPolicy(), ocrEngine: { recognizeText: () => ({ ok: false, text: "", message: "OCR is handled in the browser in the current static frontend." }) } });
  assert.equal(tools.detectTheme({ content: "technology and digital tools" }), "科技");
  assert.equal(tools.recognizeText({ image: "" }).ok, false);
  console.log("DDD unit tests passed");
}

run().catch((error) => { console.error(error); process.exit(1); });
