const { Collection } = require("../../domain/collection/Collection");

class CollectionUseCases {
  constructor({ collectionRepository, paragraphRepository, idGenerator, clock }) {
    this.collectionRepository = collectionRepository;
    this.paragraphRepository = paragraphRepository;
    this.idGenerator = idGenerator;
    this.clock = clock;
  }

  async collect({ userId, paragraphId }) {
    if (!await this.paragraphRepository.findById(paragraphId)) return { ok: false, message: "语段不存在" };
    const collection = Collection.create({ id: this.idGenerator.generate(), userId, paragraphId, createdAt: this.clock.now() });
    await this.collectionRepository.create(collection);
    return { ok: true, collectionCount: await this.count({ paragraphId }), collected: true };
  }

  async uncollect({ userId, paragraphId }) {
    await this.collectionRepository.delete(userId, paragraphId);
    return { ok: true, collectionCount: await this.count({ paragraphId }), collected: false };
  }

  async listByUser({ userId }) {
    const collections = await this.collectionRepository.findByUserId(userId);
    const paragraphs = await Promise.all(collections.map((item) => this.paragraphRepository.findById(item.paragraphId)));
    return Promise.all(paragraphs.filter(Boolean).map(async (paragraph) => ({
      ...paragraph, collectionCount: await this.count({ paragraphId: paragraph.id })
    })));
  }

  count({ paragraphId }) {
    return this.collectionRepository.countByParagraphId(paragraphId);
  }

  isCollected({ userId, paragraphId }) {
    return this.collectionRepository.exists(userId, paragraphId);
  }
}

module.exports = { CollectionUseCases };
