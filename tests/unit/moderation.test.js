const assert = require("assert");
const { Paragraph } = require("../../backend/domain/corpus/Paragraph");

const base = { id:"p",content:"valid content",authorId:"u",theme:"growth",tags:[],status:"pending",reviewVersion:0,createdAt:"now",updatedAt:"now" };
const approved = Paragraph.rehydrate({ ...base, status:"approved" });
approved.assertDeletableBy({ id:"admin", role:"admin" });
assert.throws(() => approved.assertDeletableBy({ id:"other", role:"user" }), /无权删除/);
const pending = Paragraph.rehydrate(base);
pending.updatePending({ content:"updated content",theme:"growth",tags:[],expectedVersion:0,updatedAt:"later" });
assert.equal(pending.reviewVersion,1);
assert.throws(() => pending.approve({reviewerId:"a",reviewedAt:"later",expectedVersion:0}), /审核版本冲突/);
const rejected = Paragraph.rehydrate({ ...base, status:"rejected" });
assert.throws(() => rejected.assertDeletableBy({id:"u",role:"user"}), /需要保留/);
console.log("Moderation unit tests passed");
