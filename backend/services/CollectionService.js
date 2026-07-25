class CollectionService {
  constructor(collectionUseCases) {
    this.collectionUseCases = collectionUseCases;
  }

  async collectParagraph(userId, paragraphId) {
    return this.collectionUseCases.collect({ userId, paragraphId });
  }

  async uncollectParagraph(userId, paragraphId) {
    return this.collectionUseCases.uncollect({ userId, paragraphId });
  }

  async getCollectionsByUser(userId) {
    return this.collectionUseCases.listByUser({ userId });
  }

  async getCollectionCount(paragraphId) {
    return this.collectionUseCases.count({ paragraphId });
  }

  async isCollected(userId, paragraphId) {
    return this.collectionUseCases.isCollected({ userId, paragraphId });
  }
}

module.exports = { CollectionService };
