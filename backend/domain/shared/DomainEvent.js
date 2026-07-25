class DomainEvent {
  constructor(type, payload, occurredAt = new Date().toISOString()) {
    this.type = type;
    this.payload = Object.freeze({ ...payload });
    this.occurredAt = occurredAt;
    Object.freeze(this);
  }
}

module.exports = { DomainEvent };
