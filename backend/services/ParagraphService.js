class ParagraphService {
  constructor(corpusUseCases) {
    this.corpusUseCases = corpusUseCases;
  }

  async createParagraph(userId, content, theme, tags) {
    return this.corpusUseCases.create({ userId, content, theme, tags });
  }

  async getParagraphById(id) {
    return this.corpusUseCases.getById({ paragraphId: id });
  }

  async searchParagraphs(keyword, theme, tags) {
    return this.corpusUseCases.search({ keyword, theme, tags });
  }

  async getParagraphsByUser(userId) {
    return this.corpusUseCases.listByUser({ userId });
  }

  async deleteParagraph(userId, paragraphId) {
    return this.corpusUseCases.delete({ userId, paragraphId });
  }
}

module.exports = { ParagraphService };
