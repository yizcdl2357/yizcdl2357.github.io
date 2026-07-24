const crypto = require("crypto");

class ParagraphService {
  constructor(paragraphRepository, tagRepository, collectionRepository, themeService) {
    this.paragraphRepository = paragraphRepository;
    this.tagRepository = tagRepository;
    this.collectionRepository = collectionRepository;
    this.themeService = themeService;
  }

  async createParagraph(userId, content, theme, tags) {
    if (!content || !content.trim()) return { ok: false, message: "请输入语段内容" };
    if (content.trim().length < 5) return { ok: false, message: "语段内容过短" };

    const detectedTheme = this.themeService.detectTheme(content);
    const finalTheme = (theme || detectedTheme || "").trim();
    if (!finalTheme) return { ok: false, message: "请选择作文主题" };

    const validTags = await this.tagRepository.validateTags(tags || []);
    const now = new Date().toISOString();
    const paragraph = await this.paragraphRepository.create({
      id: crypto.randomUUID(),
      content: content.trim(),
      authorId: userId,
      theme: finalTheme,
      tags: validTags,
      createdAt: now,
      updatedAt: now
    });

    return { ok: true, message: "上传成功", paragraph: await this.attachCollectionCount(paragraph) };
  }

  async getParagraphById(id) {
    const paragraph = await this.paragraphRepository.findById(id);
    return paragraph ? this.attachCollectionCount(paragraph) : null;
  }

  async searchParagraphs(keyword, theme, tags) {
    const paragraphs = await this.paragraphRepository.search(keyword, theme, tags);
    const enriched = await Promise.all(paragraphs.map((paragraph) => this.attachCollectionCount(paragraph)));
    return enriched.sort((a, b) => {
      return b.collectionCount - a.collectionCount || new Date(b.createdAt) - new Date(a.createdAt);
    });
  }

  async getParagraphsByUser(userId) {
    const paragraphs = await this.paragraphRepository.findByUserId(userId);
    return Promise.all(paragraphs.map((paragraph) => this.attachCollectionCount(paragraph)));
  }

  async deleteParagraph(userId, paragraphId) {
    const paragraph = await this.paragraphRepository.findById(paragraphId);
    if (!paragraph) return { ok: false, message: "语段不存在" };
    if (paragraph.authorId !== userId) return { ok: false, message: "无权删除该语段" };

    await this.collectionRepository.deleteByParagraphId(paragraphId);
    await this.paragraphRepository.deleteById(paragraphId);
    return { ok: true, message: "删除成功" };
  }

  async attachCollectionCount(paragraph) {
    return {
      ...paragraph,
      collectionCount: await this.collectionRepository.countByParagraphId(paragraph.id)
    };
  }
}

module.exports = { ParagraphService };
