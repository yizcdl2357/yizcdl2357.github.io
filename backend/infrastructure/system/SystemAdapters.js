const crypto = require("crypto");

class CryptoIdGenerator {
  generate() {
    return crypto.randomUUID();
  }
}

class SystemClock {
  now() {
    return new Date().toISOString();
  }
}

module.exports = { CryptoIdGenerator, SystemClock };
