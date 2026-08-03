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

class PublicationStatus {
  constructor(value = "approved") {
    this.value = String(value);
    if (!["pending", "approved", "rejected"].includes(this.value)) {
      throw new DomainError("Invalid paragraph status", "INVALID_PARAGRAPH_STATUS");
    }
    Object.freeze(this);
  }
}

class Paragraph {
  constructor(data) {
    this.id = data.id;
    this.content = data.content instanceof ParagraphContent ? data.content : new ParagraphContent(data.content);
    this.authorId = data.authorId;
    this.theme = data.theme instanceof ThemeName ? data.theme : new ThemeName(data.theme);
    this.tags = data.tags instanceof TagSet ? data.tags : new TagSet(data.tags || []);
    this.status = data.status instanceof PublicationStatus ? data.status : new PublicationStatus(data.status || "approved");
    this.reviewVersion = Number(data.reviewVersion || 0);
    this.submittedAt = data.submittedAt || data.createdAt;
    this.reviewedBy = data.reviewedBy || null;
    this.reviewedAt = data.reviewedAt || null;
    this.rejectionReason = data.rejectionReason || null;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.events = [];
  }

  static create(data) {
    const paragraph = new Paragraph(data);
    paragraph.events.push(new DomainEvent("ParagraphCreated", { paragraphId: paragraph.id, authorId: paragraph.authorId }));
    return paragraph;
  }

  static rehydrate(row) { return new Paragraph(row); }

  assertDeletableBy(user) {
    if (typeof user === "string") user = { id: user, role: "user" };
    if (this.status.value === "rejected") throw new DomainError("已拒绝语段需要保留", "REJECTED_RETENTION_REQUIRED");
    if (this.authorId !== user.id && !(user.role === "admin" && this.status.value === "approved")) {
      throw new DomainError("无权删除该语段", "PARAGRAPH_FORBIDDEN");
    }
  }

  updatePending({ content, theme, tags, expectedVersion, updatedAt }) {
    this.assertPending(expectedVersion);
    this.content = new ParagraphContent(content);
    this.theme = theme instanceof ThemeName ? theme : new ThemeName(theme);
    this.tags = tags instanceof TagSet ? tags : new TagSet(tags || []);
    this.updatedAt = updatedAt;
    this.reviewVersion += 1;
  }

  approve({ content, theme, tags, reviewerId, reviewedAt, expectedVersion }) {
    this.assertPending(expectedVersion);
    this.content = new ParagraphContent(content);
    this.theme = theme instanceof ThemeName ? theme : new ThemeName(theme);
    this.tags = tags instanceof TagSet ? tags : new TagSet(tags || []);
    this.status = new PublicationStatus("approved");
    this.reviewedBy = reviewerId;
    this.reviewedAt = reviewedAt;
    this.rejectionReason = null;
    this.updatedAt = reviewedAt;
    this.reviewVersion += 1;
  }

  reject({ reviewerId, reviewedAt, reason, expectedVersion }) {
    this.assertPending(expectedVersion);
    this.status = new PublicationStatus("rejected");
    this.reviewedBy = reviewerId;
    this.reviewedAt = reviewedAt;
    this.rejectionReason = String(reason || "").trim() || null;
    this.updatedAt = reviewedAt;
    this.reviewVersion += 1;
  }

  assertPending(expectedVersion) {
    if (this.status.value !== "pending") throw new DomainError("语段已不在待审状态", "INVALID_STATUS_TRANSITION");
    if (Number(expectedVersion) !== this.reviewVersion) throw new DomainError("审核版本冲突", "REVIEW_VERSION_CONFLICT");
  }

  markDeleted() { this.events.push(new DomainEvent("ParagraphDeleted", { paragraphId: this.id })); }

  toPersistence() {
    return {
      id: this.id, content: this.content.value, authorId: this.authorId, theme: this.theme.value,
      tags: this.tags.values, status: this.status.value, reviewVersion: this.reviewVersion,
      submittedAt: this.submittedAt, reviewedBy: this.reviewedBy, reviewedAt: this.reviewedAt,
      rejectionReason: this.rejectionReason, createdAt: this.createdAt, updatedAt: this.updatedAt
    };
  }
}

module.exports = { Paragraph, ParagraphContent, PublicationStatus };
