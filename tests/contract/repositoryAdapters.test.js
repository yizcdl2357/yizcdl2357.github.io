const assert = require("assert");
const { UserRepositoryAdapter, ParagraphRepositoryAdapter, CollectionRepositoryAdapter, TagRepositoryAdapter } = require("../../backend/infrastructure/persistence/RepositoryAdapters");

async function exercise(Adapter, methods) {
  const calls = [];
  const legacy = {};
  methods.forEach((name) => legacy[name] = (...args) => (calls.push([name, args]), `${name}-result`));
  const adapter = new Adapter(legacy);
  for (const name of methods) {
    const args = name.includes("Session") ? ["a", "b", "c"] : ["a", "b", []];
    assert.equal(await adapter[name](...args), `${name}-result`);
  }
  assert.equal(calls.length, methods.length);
}

Promise.all([
  exercise(UserRepositoryAdapter, ["create", "findById", "findByUsername", "createSession", "findUserIdBySession", "deleteSession"]),
  exercise(ParagraphRepositoryAdapter, ["create", "findById", "findByIdAny", "findByUserId", "search", "deleteById", "findNextPending", "updateReview"]),
  exercise(CollectionRepositoryAdapter, ["create", "delete", "findByUserId", "countByParagraphId", "exists", "deleteByParagraphId"]),
  exercise(TagRepositoryAdapter, ["findAll", "findByName", "validateTags"])
]).then(() => console.log("Repository adapter contract tests passed")).catch((error) => { console.error(error); process.exit(1); });
