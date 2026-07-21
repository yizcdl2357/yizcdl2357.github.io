const crypto = require("crypto");

class CollectionService {
  constructor(collectionRepository, paragraphRepository) {
    this.collectionRepository = collectionRepository;
    this.paragraphRepository = paragraphRepository;
  }

  async collectParagraph(userId, paragraphId) {
    if (!await this.paragraphRepository.findById(paragraphId)) {
      return { ok: false, message: "语段不存在" };
    }

    await this.collectionRepository.create({
      id: crypto.randomUUID(),
      userId,
      paragraphId,
      createdAt: new Date().toISOString()
    });
    return { ok: true, collectionCount: await this.getCollectionCount(paragraphId), collected: true };
  }

  async uncollectParagraph(userId, paragraphId) {
    await this.collectionRepository.delete(userId, paragraphId);
    return { ok: true, collectionCount: await this.getCollectionCount(paragraphId), collected: false };
  }

  async getCollectionsByUser(userId) {
    const collections = await this.collectionRepository.findByUserId(userId);
    const paragraphs = await Promise.all(collections.map((collection) => {
      return this.paragraphRepository.findById(collection.paragraphId);
    }));

    return Promise.all(paragraphs.filter(Boolean).map(async (paragraph) => ({
      ...paragraph,
      collectionCount: await this.getCollectionCount(paragraph.id)
    })));
  }

  async getCollectionCount(paragraphId) {
    return this.collectionRepository.countByParagraphId(paragraphId);
  }

  async isCollected(userId, paragraphId) {
    return this.collectionRepository.exists(userId, paragraphId);
  }
}

module.exports = { CollectionService };
