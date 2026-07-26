const { Paragraph, ParagraphContent } = require("../../domain/corpus/Paragraph");
const { ThemeName, TagSet } = require("../../domain/taxonomy/Taxonomy");
const { DomainError } = require("../../domain/shared/DomainError");

class CorpusUseCases {
  constructor({ paragraphRepository, tagRepository, collectionRepository, themePolicy, idGenerator, clock }) {
    this.paragraphRepository = paragraphRepository;
    this.tagRepository = tagRepository;
    this.collectionRepository = collectionRepository;
    this.themePolicy = themePolicy;
    this.idGenerator = idGenerator;
    this.clock = clock;
  }

  async create({ userId, content, theme, tags }) {
    try {
      const paragraphContent = new ParagraphContent(content);
      const detectedTheme = this.themePolicy.detect(content);
      const finalTheme = new ThemeName(theme || detectedTheme);
      const validTags = await this.tagRepository.validateTags(tags || []);
      const now = this.clock.now();
      const paragraph = Paragraph.create({
        id: this.idGenerator.generate(), content: paragraphContent, authorId: userId, theme: finalTheme,
        tags: new TagSet(validTags), createdAt: now, updatedAt: now
      });
      const saved = await this.paragraphRepository.create(paragraph.toPersistence());
      return { ok: true, message: "上传成功", paragraph: await this.attachCollectionCount(saved) };
    } catch (error) {
      if (error instanceof DomainError) return { ok: false, message: error.message };
      throw error;
    }
  }

  async getById({ paragraphId }) {
    const paragraph = await this.paragraphRepository.findById(paragraphId);
    return paragraph ? this.attachCollectionCount(paragraph) : null;
  }

  async search({ keyword = "", theme = "", tags = [] }) {
    const rows = await this.paragraphRepository.search(keyword, theme, tags);
    const enriched = await this.attachCollectionCounts(rows);
    return enriched.sort((a, b) => b.collectionCount - a.collectionCount || new Date(b.createdAt) - new Date(a.createdAt));
  }

  async listByUser({ userId }) {
    const rows = await this.paragraphRepository.findByUserId(userId);
    return this.attachCollectionCounts(rows);
  }

  async delete({ userId, paragraphId }) {
    const row = await this.paragraphRepository.findById(paragraphId);
    if (!row) return { ok: false, message: "语段不存在" };
    try {
      const paragraph = Paragraph.rehydrate(row);
      paragraph.assertDeletableBy(userId);
      paragraph.markDeleted();
    } catch (error) {
      if (error instanceof DomainError) return { ok: false, message: error.message };
      throw error;
    }
    await this.collectionRepository.deleteByParagraphId(paragraphId);
    await this.paragraphRepository.deleteById(paragraphId);
    return { ok: true, message: "删除成功" };
  }

  async attachCollectionCount(paragraph) {
    return { ...paragraph, collectionCount: await this.collectionRepository.countByParagraphId(paragraph.id) };
  }

  async attachCollectionCounts(paragraphs) {
    if (!paragraphs.length) return [];
    const counts = await this.collectionRepository.countByParagraphIds?.(paragraphs.map((paragraph) => paragraph.id));
    if (!counts) return Promise.all(paragraphs.map((paragraph) => this.attachCollectionCount(paragraph)));
    return paragraphs.map((paragraph) => ({ ...paragraph, collectionCount: counts.get(paragraph.id) || 0 }));
  }
}

module.exports = { CorpusUseCases };
