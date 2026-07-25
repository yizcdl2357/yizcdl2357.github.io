const { DomainError } = require("../shared/DomainError");
const { DomainEvent } = require("../shared/DomainEvent");
const { ThemeName, TagSet } = require("../taxonomy/Taxonomy");

class ParagraphContent {
  constructor(value) {
    this.value = String(value || "").trim();
    if (!this.value) throw new DomainError("请输入语段内容", "CONTENT_REQUIRED");
    if (this.value.length < 5) throw new DomainError("语段内容过短", "CONTENT_TOO_SHORT");
    Object.freeze(this);
  }
}

class Paragraph {
  constructor({ id, content, authorId, theme, tags, createdAt, updatedAt }) {
    this.id = id;
    this.content = content instanceof ParagraphContent ? content : new ParagraphContent(content);
    this.authorId = authorId;
    this.theme = theme instanceof ThemeName ? theme : new ThemeName(theme);
    this.tags = tags instanceof TagSet ? tags : new TagSet(tags);
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.events = [];
  }

  static create(data) {
    const paragraph = new Paragraph(data);
    paragraph.events.push(new DomainEvent("ParagraphCreated", { paragraphId: paragraph.id, authorId: paragraph.authorId }));
    return paragraph;
  }

  assertDeletableBy(userId) {
    if (this.authorId !== userId) throw new DomainError("无权删除该语段", "PARAGRAPH_FORBIDDEN");
  }

  markDeleted() {
    this.events.push(new DomainEvent("ParagraphDeleted", { paragraphId: this.id }));
  }

  toPersistence() {
    return {
      id: this.id,
      content: this.content.value,
      authorId: this.authorId,
      theme: this.theme.value,
      tags: this.tags.values,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  static rehydrate(row) {
    return new Paragraph(row);
  }
}

module.exports = { Paragraph, ParagraphContent };
