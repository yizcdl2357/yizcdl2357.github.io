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

  const tagRepository = new repositories.TagRepository(db);
  const userRepository = new repositories.UserRepository(db);
  const collectionRepository = new repositories.CollectionRepository(db);
  const paragraphRepository = new repositories.ParagraphRepository(db, tagRepository);
  const themeService = new ThemeService();
  const ocrService = new OCRService();
  const authService = new AuthService(userRepository);
  const paragraphService = new ParagraphService(paragraphRepository, tagRepository, collectionRepository, themeService);
  const collectionService = new CollectionService(collectionRepository, paragraphRepository);

  return {
    config,
    authController: new AuthController(authService),
    paragraphController: new ParagraphController(authService, paragraphService),
    collectionController: new CollectionController(authService, collectionService),
    toolController: new ToolController(themeService, ocrService)
  };
}

module.exports = { createContainer };
