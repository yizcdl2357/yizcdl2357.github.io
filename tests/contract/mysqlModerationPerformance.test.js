const assert = require("assert");
const { MySQLParagraphRepository } = require("../../backend/repositories/mysql/MySQLRepositories");

(async () => {
  let calls = 0;
  let sql = "";
  const repository = new MySQLParagraphRepository({ query: async (statement) => {
    calls += 1; sql = statement;
    return [[{ id:"p",content:"text",author_id:"u",author_name:"name",theme:"growth",status:"approved",submitted_at:"now",review_version:0,created_at:"now",updated_at:"now",tag_id:"t",tag_name:"tag",collection_count:1 }]];
  } });
  const result = await repository.search();
  assert.equal(calls, 1);
  assert(sql.includes("p.status='approved'"));
  assert.equal(result[0].status, "approved");
  assert.equal(result[0].collectionCount, 1);
  console.log("MySQL moderation performance contract tests passed");
})().catch((error) => { console.error(error); process.exit(1); });
