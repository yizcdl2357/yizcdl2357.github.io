const assert = require("assert");
const { MySQLParagraphRepository } = require("../../backend/repositories/mysql/MySQLRepositories");

async function run() {
  const rows = [
    { id: "p1", content: "text", author_id: "u1", author_name: "alice", theme: "growth", tag_id: "t1", tag_name: "opening", collection_count: 2, created_at: "2026-01-02", updated_at: "2026-01-02" },
    { id: "p1", content: "text", author_id: "u1", author_name: "alice", theme: "growth", tag_id: "t2", tag_name: "ending", collection_count: 2, created_at: "2026-01-02", updated_at: "2026-01-02" },
    { id: "p2", content: "other", author_id: "u2", author_name: "bob", theme: "tech", tag_id: null, tag_name: null, collection_count: 0, created_at: "2026-01-01", updated_at: "2026-01-01" }
  ];
  let queryCount = 0;
  const repository = new MySQLParagraphRepository({ query: async () => { queryCount += 1; return [rows]; } });
  const result = await repository.search("text", "growth", ["t1"]);
  assert.equal(queryCount, 1);
  assert.deepEqual(result[0].tags, ["t1", "t2"]);
  assert.deepEqual(result[0].tagNames, ["opening", "ending"]);
  assert.equal(result[0].authorName, "alice");
  assert.equal(result[0].collectionCount, 2);
  assert.equal(result[1].collectionCount, 0);

  const emptyRepository = new MySQLParagraphRepository({ query: async () => [[]] });
  assert.deepEqual(await emptyRepository.search(), []);
  console.log("MySQL performance contract tests passed");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
