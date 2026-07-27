class ParagraphService {
  constructor(corpusUseCases) { this.corpusUseCases = corpusUseCases; }
  createParagraph(user, content, theme, tags) { return this.corpusUseCases.create({ userId: user.id, userRole: user.role, content, theme, tags }); }
  getParagraphById(id) { return this.corpusUseCases.getById({ paragraphId: id }); }
  searchParagraphs(keyword, theme, tags) { return this.corpusUseCases.search({ keyword, theme, tags }); }
  getParagraphsByUser(userId) { return this.corpusUseCases.listByUser({ userId }); }
  deleteParagraph(user, paragraphId) { return this.corpusUseCases.delete({ user, paragraphId }); }
  claimNext(user) { return this.corpusUseCases.claimNext({ user }); }
  review(user, id, action, data) { return this.corpusUseCases.review({ user, paragraphId: id, action, ...data }); }
}
module.exports = { ParagraphService };
