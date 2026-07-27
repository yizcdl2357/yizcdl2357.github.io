CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  username VARCHAR(191) NOT NULL UNIQUE,
  role VARCHAR(16) NOT NULL DEFAULT 'user',
  password_hash VARCHAR(191) NOT NULL,
  created_at VARCHAR(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS paragraphs (
  id VARCHAR(64) PRIMARY KEY,
  content TEXT NOT NULL,
  author_id VARCHAR(64) NOT NULL,
  theme VARCHAR(191) NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'approved',
  submitted_at VARCHAR(32) NULL,
  review_version INT NOT NULL DEFAULT 0,
  reviewed_by VARCHAR(64) NULL,
  reviewed_at VARCHAR(32) NULL,
  rejection_reason TEXT NULL,
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_paragraphs_author
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tags (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(191) NOT NULL UNIQUE,
  sort_order INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS paragraph_tags (
  paragraph_id VARCHAR(64) NOT NULL,
  tag_id VARCHAR(64) NOT NULL,
  PRIMARY KEY (paragraph_id, tag_id),
  CONSTRAINT fk_paragraph_tags_paragraph
    FOREIGN KEY (paragraph_id) REFERENCES paragraphs(id) ON DELETE CASCADE,
  CONSTRAINT fk_paragraph_tags_tag
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS collections (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  paragraph_id VARCHAR(64) NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  UNIQUE KEY uniq_collection_user_paragraph (user_id, paragraph_id),
  CONSTRAINT fk_collections_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_collections_paragraph
    FOREIGN KEY (paragraph_id) REFERENCES paragraphs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  KEY idx_sessions_user (user_id),
  CONSTRAINT fk_sessions_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO tags (id, name, sort_order) VALUES
  ('opening', '开头', 1),
  ('ending', '结尾', 2),
  ('transition', '过渡', 3),
  ('practical', '应用文', 4),
  ('continuation', '读后续写', 5),
  ('argument', '议论', 6),
  ('quote', '名言', 7),
  ('action', '动作', 8),
  ('psychology', '心理活动', 9),
  ('advanced-expression', '高级表达', 10);
