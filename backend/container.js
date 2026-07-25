const { getConfig } = require("./config");
const { createDatabaseProvider } = require("./db/DatabaseProvider");
const { SQLiteUserRepository } = require("./repositories/sqlite/SQLiteUserRepository");
const { SQLiteParagraphRepository } = require("./repositories/sqlite/SQLiteParagraphRepository");
const { SQLiteCollectionRepository } = require("./repositories/sqlite/SQLiteCollectionRepository");
const { SQLiteTagRepository } = require("./repositories/sqlite/SQLiteTagRepository");
const {
  MySQLUserRepository,
  MySQLParagraphRepository,
  MySQLCollectionRepository,
  MySQLTagRepository
} = require("./repositories/mysql/MySQLRepositories");
const { AuthService } = require("./services/AuthService");
const { ParagraphService } = require("./services/ParagraphService");
const { CollectionService } = require("./services/CollectionService");
const { ThemeService } = require("./services/ThemeService");
const { OCRService } = require("./services/OCRService");
const { runMigrations } = require("./scripts/migrate");
const { AuthController } = require("./controllers/AuthController");
const { ParagraphController } = require("./controllers/ParagraphController");
const { CollectionController } = require("./controllers/CollectionController");
const { ToolController } = require("./controllers/ToolController");
const { IdentityUseCases } = require("./application/identity/IdentityUseCases");
const { CorpusUseCases } = require("./application/corpus/CorpusUseCases");
const { CollectionUseCases } = require("./application/collection/CollectionUseCases");
const { ThemeDetectionPolicy } = require("./domain/taxonomy/Taxonomy");
const { Sha256PasswordHasher } = require("./infrastructure/security/Sha256PasswordHasher");
const { CryptoIdGenerator, SystemClock } = require("./infrastructure/system/SystemAdapters");
const { BrowserOcrAdapter } = require("./infrastructure/ocr/BrowserOcrAdapter");
const {
  UserRepositoryAdapter,
  ParagraphRepositoryAdapter,
  CollectionRepositoryAdapter,
  TagRepositoryAdapter
} = require("./infrastructure/persistence/RepositoryAdapters");

async function createContainer() {
  const config = getConfig();
  const provider = createDatabaseProvider(config);
  await provider.connect();
  await runMigrations(config, provider);

  const db = provider.getClient();
  const repositories = config.dbClient === "mysql"
    ? {
        TagRepository: MySQLTagRepository,
        UserRepository: MySQLUserRepository,
        CollectionRepository: MySQLCollectionRepository,
        ParagraphRepository: MySQLParagraphRepository
      }
    : {
        TagRepository: SQLiteTagRepository,
        UserRepository: SQLiteUserRepository,
        CollectionRepository: SQLiteCollectionRepository,
        ParagraphRepository: SQLiteParagraphRepository
      };

  const legacyTagRepository = new repositories.TagRepository(db);
  const userRepository = new UserRepositoryAdapter(new repositories.UserRepository(db));
  const collectionRepository = new CollectionRepositoryAdapter(new repositories.CollectionRepository(db));
  const paragraphRepository = new ParagraphRepositoryAdapter(new repositories.ParagraphRepository(db, legacyTagRepository));
  const tagRepository = new TagRepositoryAdapter(legacyTagRepository);
  const themePolicy = new ThemeDetectionPolicy();
  const passwordHasher = new Sha256PasswordHasher();
  const idGenerator = new CryptoIdGenerator();
  const clock = new SystemClock();
  const ocrEngine = new BrowserOcrAdapter();

  const identityUseCases = new IdentityUseCases({ userRepository, passwordHasher, idGenerator, clock, systemUserId: config.systemUserId });
  const corpusUseCases = new CorpusUseCases({ paragraphRepository, tagRepository, collectionRepository, themePolicy, idGenerator, clock });
  const collectionUseCases = new CollectionUseCases({ collectionRepository, paragraphRepository, idGenerator, clock });
  const themeService = new ThemeService(themePolicy);
  const ocrService = new OCRService(ocrEngine);
  const authService = new AuthService(identityUseCases);
  const paragraphService = new ParagraphService(corpusUseCases);
  const collectionService = new CollectionService(collectionUseCases);

  return {
    config,
    provider,
    authController: new AuthController(authService, { secureCookies: config.secureCookies }),
    paragraphController: new ParagraphController(authService, paragraphService),
    collectionController: new CollectionController(authService, collectionService),
    toolController: new ToolController(themeService, ocrService)
  };
}

module.exports = { createContainer };
