const { DomainEvent } = require("../shared/DomainEvent");

class Session {
  constructor({ id, userId, createdAt }) {
    this.id = id;
    this.userId = userId;
    this.createdAt = createdAt;
    this.events = [new DomainEvent("SessionStarted", { sessionId: id, userId })];
  }
}

module.exports = { Session };
