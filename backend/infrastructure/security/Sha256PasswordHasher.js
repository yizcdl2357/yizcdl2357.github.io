const crypto = require("crypto");

class Sha256PasswordHasher {
  hash(password) {
    return crypto.createHash("sha256").update(password).digest("hex");
  }
}

module.exports = { Sha256PasswordHasher };
