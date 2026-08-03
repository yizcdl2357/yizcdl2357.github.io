const { Paragraph, ParagraphContent } = require("../../domain/corpus/Paragraph");
const { ThemeName, TagSet } = require("../../domain/taxonomy/Taxonomy");
const { DomainError } = require("../../domain/shared/DomainError");

class CorpusUseCases {
  constructor({ paragraphRepository, tagRepository, collectionRepository, themePolicy, idGenerator, clock }) {
    Object.assign(this, { paragraphRepository, tagRepository, collectionRepository, themePolicy, idGenerator, clock });
  }

  async create({ userId, userRole = "user", content, theme, tags }) {
    try {
      const paragraphContent = new ParagraphContent(content);
      const finalTheme = new ThemeName(theme || this.themePolicy.detect(content));
      const now = this.clock.now();
      const paragraph = Paragraph.create({
        id: this.idGenerator.generate(), content: paragraphContent, authorId: userId,
        theme: finalTheme, tags: new TagSet(await this.tagRepository.validateTags(tags || [])),
        status: userRole === "admin" ? "approved" : "pending", submittedAt: now, createdAt: now, updatedAt: now
      });
      const saved = await this.paragraphRepository.create(paragraph.toPersistence());
      return { ok: true, message: saved.status === "pending" ? "已提交审核" : "上传成功", paragraph: await this.attachCollectionCount(saved) };
    } catch (error) { return this.failure(error, false); }
  }

  async getById({ paragraphId }) {
    const row = await this.paragraphRepository.findById(paragraphId);
    return row ? this.attachCollectionCount(row) : null;
  }

  async search({ keyword = "", theme = "", tags = [] }) {
    const rows = await this.attachCollectionCounts(await this.paragraphRepository.search(keyword, theme, tags));
    return rows.sort((a, b) => b.collectionCount - a.collectionCount || new Date(b.createdAt) - new Date(a.createdAt));
  }

  async listByUser({ userId }) {
    return this.attachCollectionCounts(await this.paragraphRepository.findByUserId(userId));
  }

  async delete({ user, userId, paragraphId }) {
    const row = this.paragraphRepository.findByIdAny
      ? await this.paragraphRepository.findByIdAny(paragraphId)
      : await this.paragraphRepository.findById(paragraphId);
    if (!row) return { ok: false, code: "SUBMISSION_NOT_FOUND", message: "语段不存在" };
    try {
      const paragraph = Paragraph.rehydrate(row);
      paragraph.assertDeletableBy(user || { id: userId, role: "user" });
      paragraph.markDeleted();
    } catch (error) { return this.failure(error, false); }
    await this.collectionRepository.deleteByParagraphId(paragraphId);
    await this.paragraphRepository.deleteById(paragraphId);
    return { ok: true, message: "删除成功" };
  }

  async claimNext({ user }) {
    if (user.role !== "admin") return { ok: false, code: "ADMIN_REQUIRED", message: "需要管理员权限" };
    return { ok: true, submission: await this.paragraphRepository.findNextPending() };
  }

  async review({ user, paragraphId, action, expectedVersion, content, theme, tags, reason }) {
    if (user.role !== "admin") return { ok: false, code: "ADMIN_REQUIRED", message: "需要管理员权限" };
    const row = await this.paragraphRepository.findByIdAny(paragraphId);
    if (!row) return { ok: false, code: "SUBMISSION_NOT_FOUND", message: "待审语段不存在" };
    try {
      const paragraph = Paragraph.rehydrate(row);
      const now = this.clock.now();
      if (action === "update") paragraph.updatePending({ content, theme, tags: await this.tagRepository.validateTags(tags || []), expectedVersion, updatedAt: now });
      else if (action === "approve") paragraph.approve({
        content,
        theme,
        tags: await this.tagRepository.validateTags(tags || []),
        reviewerId: user.id,
        reviewedAt: now,
        expectedVersion
      });
      else paragraph.reject({ reviewerId: user.id, reviewedAt: now, reason, expectedVersion });
      const saved = await this.paragraphRepository.updateReview(paragraph.toPersistence(), expectedVersion);
      return { ok: true, paragraph: saved };
    } catch (error) {
      if (error.code === "REVIEW_VERSION_CONFLICT") return { ok:false, code:error.code, message:"审核版本冲突" };
      return this.failure(error);
    }
  }

  async attachCollectionCount(row) {
    return { ...row, collectionCount: await this.collectionRepository.countByParagraphId(row.id) };
  }

  async attachCollectionCounts(rows) {
    if (!rows.length) return [];
    if (rows.every((row) => Number.isFinite(row.collectionCount))) return rows;
    const counts = await this.collectionRepository.countByParagraphIds?.(rows.map((row) => row.id));
    if (!counts) return Promise.all(rows.map((row) => this.attachCollectionCount(row)));
    return rows.map((row) => ({ ...row, collectionCount: counts.get(row.id) || 0 }));
  }

  failure(error, includeCode = true) {
    if (error instanceof DomainError) return includeCode
      ? { ok: false, code: error.code, message: error.message }
      : { ok: false, message: error.message };
    throw error;
  }
}

module.exports = { CorpusUseCases };
