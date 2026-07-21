PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS paragraphs (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  author_id TEXT NOT NULL,
  theme TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS paragraph_tags (
  paragraph_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  PRIMARY KEY (paragraph_id, tag_id),
  FOREIGN KEY (paragraph_id) REFERENCES paragraphs(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS collections (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  paragraph_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (user_id, paragraph_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (paragraph_id) REFERENCES paragraphs(id) ON DELETE CASCADE
);

INSERT OR IGNORE INTO tags (id, name) VALUES
  ('opening', '开头'),
  ('ending', '结尾'),
  ('transition', '过渡'),
  ('practical', '应用文'),
  ('continuation', '读后续写'),
  ('argument', '议论'),
  ('quote', '名言'),
  ('action', '动作'),
  ('psychology', '心理活动'),
  ('advanced-expression', '高级表达');
