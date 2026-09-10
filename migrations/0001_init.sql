CREATE TABLE IF NOT EXISTS workspace_parts (
  scope TEXT NOT NULL,
  part TEXT NOT NULL,
  data TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (scope, part)
);

CREATE TABLE IF NOT EXISTS image_sources (
  kind TEXT NOT NULL,
  item_key TEXT NOT NULL,
  source_url TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  content_type TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (kind, item_key)
);

CREATE TABLE IF NOT EXISTS app_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_workspace_parts_scope ON workspace_parts(scope);
