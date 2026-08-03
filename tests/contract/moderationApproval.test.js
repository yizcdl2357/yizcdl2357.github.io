const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { CorpusUseCases } = require("../../backend/application/corpus/CorpusUseCases");

let persisted;
const original = { id:"p",content:"original content",authorId:"u",theme:"growth",tags:[],status:"pending",reviewVersion:0,createdAt:"now",updatedAt:"now" };
const useCases = new CorpusUseCases({
  paragraphRepository: { findByIdAny: async () => ({...original}), updateReview: async (row) => (persisted={...row}) },
  collectionRepository: {}, tagRepository: { validateTags: async (tags) => tags }, userRepository: {},
  clock: { now: () => "later" }, idGenerator: () => "id"
});

(async () => {
  const result = await useCases.review({ user:{id:"admin",role:"admin"}, paragraphId:"p", action:"approve", content:"edited content", theme:"technology", tags:["tech"], expectedVersion:0 });
  assert.equal(result.ok,true);
  assert.equal(persisted.content,"edited content");
  assert.equal(persisted.theme,"technology");
  assert.deepEqual(persisted.tags,["tech"]);
  assert.equal(persisted.status,"approved");
  const root = path.resolve(__dirname,"../..");
  assert.match(fs.readFileSync(path.join(root,"js/app.js"),"utf8"),/ModerationService\.approve\(review\.id,editedSnapshot\)/);
  assert.match(fs.readFileSync(path.join(root,"js/ui.js"),"utf8"),/clearReviewEditor\(\);[\s\S]*reviewEmpty/);
  assert.match(fs.readFileSync(path.join(root,"index.html"),"utf8"),/id="reviewEmpty" hidden>当前没有待审查语段/);
  console.log("Moderation approval contract tests passed");
})().catch((error) => { console.error(error); process.exit(1); });
