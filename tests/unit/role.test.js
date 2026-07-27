const assert = require("assert");
const { User, Role } = require("../../backend/domain/identity/User");
const { IdentityUseCases } = require("../../backend/application/identity/IdentityUseCases");

async function run() {
  assert.throws(() => new Role("owner"), /Invalid user role/);
  const registered = User.register({ id: "u1", username: "alice", role: "admin", passwordHash: "hash", createdAt: "now" });
  assert.equal(registered.role.value, "user");
  assert.equal(new User({ id: "u2", username: "admin", role: "admin", passwordHash: "hash", createdAt: "now" }).toPublic().role, "admin");

  let saved;
  const useCases = new IdentityUseCases({
    userRepository: {
      findByUsername: async () => null,
      create: async (user) => (saved = user)
    },
    passwordHasher: { hash: (value) => `hash:${value}` },
    idGenerator: { generate: () => "new-user" },
    clock: { now: () => "now" },
    systemUserId: "system"
  });
  const result = await useCases.register({ username: "bob", password: "secret", role: "admin" });
  assert.equal(saved.role, "user");
  assert.equal(result.user.role, "user");
  console.log("Role unit tests passed");
}

run().catch((error) => { console.error(error); process.exit(1); });
