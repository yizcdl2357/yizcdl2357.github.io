class UserRepositoryAdapter {
  constructor(repository) { this.repository = repository; }
  create(data) { return this.repository.create(data); }
  findById(id) { return this.repository.findById(id); }
  findByIdAny(id) { return this.repository.findByIdAny(id); }
  findByUsername(username) { return this.repository.findByUsername(username); }
  createSession(id, userId, createdAt) { return this.repository.createSession(id, userId, createdAt); }
  findUserIdBySession(id) { return this.repository.findUserIdBySession(id); }
  deleteSession(id) { return this.repository.deleteSession(id); }
}

class ParagraphRepositoryAdapter {
  constructor(repository) { this.repository = repository; }
  create(data) { return this.repository.create(data); }
  findById(id) { return this.repository.findById(id); }
  findByIdAny(id) { return this.repository.findByIdAny(id); }
  findByUserId(id) { return this.repository.findByUserId(id); }
  search(keyword, theme, tags) { return this.repository.search(keyword, theme, tags); }
  deleteById(id) { return this.repository.deleteById(id); }
  findNextPending() { return this.repository.findNextPending(); }
  updateReview(data, version) { return this.repository.updateReview(data, version); }
}

class CollectionRepositoryAdapter {
  constructor(repository) { this.repository = repository; }
  create(data) { return this.repository.create(data); }
  delete(userId, paragraphId) { return this.repository.delete(userId, paragraphId); }
  findByUserId(userId) { return this.repository.findByUserId(userId); }
  countByParagraphId(paragraphId) { return this.repository.countByParagraphId(paragraphId); }
  countByParagraphIds(ids) { return this.repository.countByParagraphIds?.(ids); }
  exists(userId, paragraphId) { return this.repository.exists(userId, paragraphId); }
  deleteByParagraphId(paragraphId) { return this.repository.deleteByParagraphId(paragraphId); }
}

class TagRepositoryAdapter {
  constructor(repository) { this.repository = repository; }
  findAll() { return this.repository.findAll(); }
  findByName(name) { return this.repository.findByName(name); }
  validateTags(tags) { return this.repository.validateTags(tags); }
}

module.exports = { UserRepositoryAdapter, ParagraphRepositoryAdapter, CollectionRepositoryAdapter, TagRepositoryAdapter };
