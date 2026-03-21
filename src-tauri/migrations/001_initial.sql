CREATE TABLE IF NOT EXISTS mediations (
    id TEXT PRIMARY KEY,
    plaintiff TEXT NOT NULL DEFAULT '',
    defendant TEXT NOT NULL DEFAULT '',
    defense_firm TEXT NOT NULL DEFAULT '',
    counsel TEXT NOT NULL DEFAULT '',
    mediator TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'in_progress',
    notes TEXT NOT NULL DEFAULT '',
    notes_format TEXT NOT NULL DEFAULT 'markdown',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS rounds (
    id TEXT PRIMARY KEY,
    mediation_id TEXT NOT NULL,
    round_number INTEGER NOT NULL,
    round_type TEXT NOT NULL DEFAULT 'standard',
    demand REAL,
    offer REAL,
    bracket_high REAL,
    bracket_low REAL,
    bracket_proposed_by TEXT,
    midpoint REAL NOT NULL,
    is_speculative INTEGER NOT NULL DEFAULT 0,
    branch_from_round INTEGER,
    created_at TEXT NOT NULL,
    FOREIGN KEY (mediation_id) REFERENCES mediations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

INSERT OR IGNORE INTO settings (key, value) VALUES ('theme', 'light');
