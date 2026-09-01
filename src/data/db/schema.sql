-- CAPA DE PERSISTENCIA — Esquema relacional de ZeroWaste Pantry.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS ingredients (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT    NOT NULL UNIQUE,
  category      TEXT    NOT NULL DEFAULT 'Otros',
  default_unit  TEXT    NOT NULL DEFAULT 'g'
);

CREATE TABLE IF NOT EXISTS pantry_items (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  ingredient_id INTEGER NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity      REAL    NOT NULL CHECK (quantity >= 0),
  unit          TEXT    NOT NULL,
  expiry_date   TEXT    NOT NULL,          -- ISO 'YYYY-MM-DD'
  added_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_pantry_expiry     ON pantry_items(expiry_date);
CREATE INDEX IF NOT EXISTS idx_pantry_ingredient ON pantry_items(ingredient_id);

CREATE TABLE IF NOT EXISTS recipes (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  title         TEXT    NOT NULL,
  description   TEXT    NOT NULL DEFAULT '',
  minutes       INTEGER NOT NULL DEFAULT 0,
  base_servings INTEGER NOT NULL DEFAULT 2 CHECK (base_servings > 0),
  steps         TEXT    NOT NULL DEFAULT '[]'   -- JSON array
);

CREATE TABLE IF NOT EXISTS recipe_ingredients (
  recipe_id     INTEGER NOT NULL REFERENCES recipes(id)     ON DELETE CASCADE,
  ingredient_id INTEGER NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity      REAL    NOT NULL CHECK (quantity > 0),
  unit          TEXT    NOT NULL,
  weight        REAL    NOT NULL DEFAULT 1,      -- protagonismo en la receta
  optional      INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (recipe_id, ingredient_id)
);

CREATE TABLE IF NOT EXISTS cooking_logs (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  recipe_id    INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  servings     INTEGER NOT NULL CHECK (servings > 0),
  cooked_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  consumed     TEXT    NOT NULL DEFAULT '[]',    -- JSON snapshot
  saved_items  INTEGER NOT NULL DEFAULT 0
);
