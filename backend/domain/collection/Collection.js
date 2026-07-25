const { DomainEvent } = require("../shared/DomainEvent");

class Collection {
  constructor({ id, userId, paragraphId, createdAt }) {
    this.id = id;
    this.userId = userId;
    this.paragraphId = paragraphId;
    this.createdAt = createdAt;
    this.events = [];
  }

  static create(data) {
    const collection = new Collection(data);
    collection.events.push(new DomainEvent("ParagraphCollected", { userId: data.userId, paragraphId: data.paragraphId }));
    return collection;
  }
}

module.exports = { Collection };
