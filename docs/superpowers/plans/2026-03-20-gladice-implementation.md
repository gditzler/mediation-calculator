# Gladice Mediation Calculator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Tauri 2.0 desktop app for legal mediators to track settlement negotiations with round-by-round history, what-if branching, bracket support, convergence charting, and persistent SQLite storage.

**Architecture:** Tauri 2.0 (Rust) backend handles database operations and business logic via trait-based abstractions. React + TypeScript frontend renders UI with TailwindCSS theming. SQLite stores all data locally, architected for future cloud swap.

**Tech Stack:** Tauri 2.0, Rust, React 18, TypeScript, TailwindCSS, Recharts, SQLite (tauri-plugin-sql), uuid

**Spec:** `docs/superpowers/specs/2026-03-20-gladice-mediation-calculator-design.md`

---

## File Structure

```
gladice/
├── src-tauri/
│   ├── Cargo.toml                    # Rust dependencies
│   ├── tauri.conf.json               # Tauri config (window, plugins, permissions)
│   ├── src/
│   │   ├── main.rs                   # Tauri entry point, register commands
│   │   ├── db.rs                     # Database trait + SQLite implementation
│   │   ├── models.rs                 # Rust structs: Mediation, Round, Settings
│   │   ├── commands/
│   │   │   ├── mod.rs                # Re-exports
│   │   │   ├── mediations.rs         # Tauri commands: CRUD mediations, search, autocomplete
│   │   │   ├── rounds.rs             # Tauri commands: CRUD rounds, promote, discard
│   │   │   └── settings.rs           # Tauri commands: get/set settings
│   │   └── calculations.rs           # Midpoint, variations, bracket validation
│   └── migrations/
│       └── 001_initial.sql           # CREATE TABLE statements
├── src/
│   ├── main.tsx                      # React entry point
│   ├── App.tsx                       # Root component: ThemeProvider + TabBar + content
│   ├── types.ts                      # TypeScript types mirroring Rust models
│   ├── api.ts                        # Tauri invoke() wrappers
│   ├── context/
│   │   ├── TabContext.tsx             # Tab state management (useReducer)
│   │   └── ThemeContext.tsx           # Theme state + CSS variable application
│   ├── components/
│   │   ├── TabBar.tsx                # Tab bar with pinned Home + closeable tabs
│   │   ├── LandingPage.tsx           # Search, filter, mediation list, new button
│   │   ├── MediationWorkspace.tsx    # Container for a single mediation tab
│   │   ├── MetadataPanel.tsx         # Collapsible case details with autocomplete
│   │   ├── AutocompleteInput.tsx     # Reusable autocomplete text input
│   │   ├── RoundsTable.tsx           # Committed rounds table with inline edit
│   │   ├── RoundInputRow.tsx         # Inline row for adding a new round
│   │   ├── SpeculativeRounds.tsx     # Amber what-if section
│   │   ├── ConvergenceChart.tsx      # Recharts line chart
│   │   ├── VariationsTable.tsx       # Demand/offer variation grid
│   │   ├── NotesEditor.tsx           # Markdown/raw toggle editor
│   │   ├── StatusBadge.tsx           # Color-coded status dropdown
│   │   └── ThemeSelector.tsx         # Theme picker dropdown
│   └── themes/
│       └── themes.ts                 # CSS variable definitions for all 6 themes
├── index.html                        # Vite entry HTML
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── vite.config.ts
└── tests/
    └── calculations.test.ts          # Frontend unit tests for any shared calc logic
```

---

## Task 1: Tauri + React Project Scaffold

**Files:**
- Create: `src-tauri/Cargo.toml`, `src-tauri/tauri.conf.json`, `src-tauri/src/main.rs`
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `tailwind.config.js`, `index.html`
- Create: `src/main.tsx`, `src/App.tsx`

- [ ] **Step 1: Initialize Tauri project**

Run:
```bash
npm create tauri-app@latest gladice-app -- --template react-ts --manager npm
```

This scaffolds both the Tauri Rust backend and React TypeScript frontend. Move the generated files into the project root (since we're already in the gladice directory).

```bash
cp -r gladice-app/* gladice-app/.* . 2>/dev/null || true
rm -rf gladice-app
```

- [ ] **Step 2: Install frontend dependencies**

```bash
npm install recharts react-markdown uuid
npm install -D @types/uuid tailwindcss @tailwindcss/vite
```

- [ ] **Step 3: Configure TailwindCSS**

Replace contents of `src/styles.css` with:

```css
@import "tailwindcss";
```

Add the TailwindCSS Vite plugin to `vite.config.ts`:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const host = process.env.TAURI_DEV_HOST;

export default defineConfig(async () => ({
  plugins: [react(), tailwindcss()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
}));
```

- [ ] **Step 4: Add Tauri SQL plugin**

```bash
cd src-tauri && cargo add tauri-plugin-sql --features sqlite && cd ..
```

Add to `src-tauri/tauri.conf.json` under `plugins`:

```json
{
  "plugins": {
    "sql": {
      "preload": {
        "db": "sqlite:gladice.db"
      }
    }
  }
}
```

- [ ] **Step 5: Create minimal App.tsx**

Replace `src/App.tsx` with:

```tsx
function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold">Gladice</h1>
        <p className="text-gray-500 mt-2">Mediation Midpoint Calculator</p>
      </div>
    </div>
  );
}

export default App;
```

- [ ] **Step 6: Verify the app builds and launches**

```bash
npm run tauri dev
```

Expected: A Tauri window opens showing "Gladice" heading with "Mediation Midpoint Calculator" subtitle on a light gray background.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: scaffold Tauri + React + TailwindCSS project"
```

---

## Task 2: Database Schema and Rust Models

**Files:**
- Create: `src-tauri/migrations/001_initial.sql`
- Create: `src-tauri/src/models.rs`
- Create: `src-tauri/src/db.rs`
- Modify: `src-tauri/src/main.rs`
- Modify: `src-tauri/Cargo.toml`

- [ ] **Step 1: Add Rust dependencies**

Add to `src-tauri/Cargo.toml` under `[dependencies]`:

```bash
cd src-tauri && cargo add serde --features derive && cargo add serde_json && cargo add uuid --features "v4 serde" && cargo add rusqlite --features bundled && cargo add chrono --features serde && cd ..
```

- [ ] **Step 2: Create migration SQL**

Create `src-tauri/migrations/001_initial.sql`:

```sql
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
```

- [ ] **Step 3: Create Rust models**

Create `src-tauri/src/models.rs`:

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Mediation {
    pub id: String,
    pub plaintiff: String,
    pub defendant: String,
    pub defense_firm: String,
    pub counsel: String,
    pub mediator: String,
    pub status: String,
    pub notes: String,
    pub notes_format: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Round {
    pub id: String,
    pub mediation_id: String,
    pub round_number: i32,
    pub round_type: String,
    pub demand: Option<f64>,
    pub offer: Option<f64>,
    pub bracket_high: Option<f64>,
    pub bracket_low: Option<f64>,
    pub bracket_proposed_by: Option<String>,
    pub midpoint: f64,
    pub is_speculative: bool,
    pub branch_from_round: Option<i32>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Setting {
    pub key: String,
    pub value: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MediationSummary {
    pub id: String,
    pub plaintiff: String,
    pub defendant: String,
    pub mediator: String,
    pub status: String,
    pub updated_at: String,
}
```

- [ ] **Step 4: Create database abstraction layer**

Create `src-tauri/src/db.rs`:

```rust
use rusqlite::{params, Connection, Result as SqlResult};
use std::sync::Mutex;

use crate::models::{Mediation, MediationSummary, Round, Setting};

pub struct Database {
    conn: Mutex<Connection>,
}

impl Database {
    pub fn new(db_path: &str) -> SqlResult<Self> {
        let conn = Connection::open(db_path)?;
        conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;")?;
        let db = Self {
            conn: Mutex::new(conn),
        };
        db.run_migrations()?;
        Ok(db)
    }

    fn run_migrations(&self) -> SqlResult<()> {
        let conn = self.conn.lock().unwrap();
        let sql = include_str!("../migrations/001_initial.sql");
        conn.execute_batch(sql)?;
        Ok(())
    }

    // -- Mediations --

    pub fn create_mediation(&self, med: &Mediation) -> SqlResult<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO mediations (id, plaintiff, defendant, defense_firm, counsel, mediator, status, notes, notes_format, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
            params![
                med.id, med.plaintiff, med.defendant, med.defense_firm,
                med.counsel, med.mediator, med.status, med.notes,
                med.notes_format, med.created_at, med.updated_at
            ],
        )?;
        Ok(())
    }

    pub fn get_mediation(&self, id: &str) -> SqlResult<Mediation> {
        let conn = self.conn.lock().unwrap();
        conn.query_row(
            "SELECT id, plaintiff, defendant, defense_firm, counsel, mediator, status, notes, notes_format, created_at, updated_at FROM mediations WHERE id = ?1",
            params![id],
            |row| {
                Ok(Mediation {
                    id: row.get(0)?,
                    plaintiff: row.get(1)?,
                    defendant: row.get(2)?,
                    defense_firm: row.get(3)?,
                    counsel: row.get(4)?,
                    mediator: row.get(5)?,
                    status: row.get(6)?,
                    notes: row.get(7)?,
                    notes_format: row.get(8)?,
                    created_at: row.get(9)?,
                    updated_at: row.get(10)?,
                })
            },
        )
    }

    pub fn update_mediation(&self, med: &Mediation) -> SqlResult<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE mediations SET plaintiff=?2, defendant=?3, defense_firm=?4, counsel=?5, mediator=?6, status=?7, notes=?8, notes_format=?9, updated_at=?10 WHERE id=?1",
            params![
                med.id, med.plaintiff, med.defendant, med.defense_firm,
                med.counsel, med.mediator, med.status, med.notes,
                med.notes_format, med.updated_at
            ],
        )?;
        Ok(())
    }

    pub fn delete_mediation(&self, id: &str) -> SqlResult<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM mediations WHERE id = ?1", params![id])?;
        Ok(())
    }

    pub fn list_mediations(&self, search: &str, status_filter: &str) -> SqlResult<Vec<MediationSummary>> {
        let conn = self.conn.lock().unwrap();
        let search_pattern = format!("%{}%", search);
        let sql = if status_filter.is_empty() || status_filter == "all" {
            "SELECT id, plaintiff, defendant, mediator, status, updated_at FROM mediations
             WHERE plaintiff LIKE ?1 OR defendant LIKE ?1 OR mediator LIKE ?1 OR counsel LIKE ?1 OR defense_firm LIKE ?1
             ORDER BY updated_at DESC"
        } else {
            "SELECT id, plaintiff, defendant, mediator, status, updated_at FROM mediations
             WHERE (plaintiff LIKE ?1 OR defendant LIKE ?1 OR mediator LIKE ?1 OR counsel LIKE ?1 OR defense_firm LIKE ?1)
             AND status = ?2
             ORDER BY updated_at DESC"
        };

        let mut stmt = conn.prepare(sql)?;
        let rows = if status_filter.is_empty() || status_filter == "all" {
            stmt.query_map(params![search_pattern], |row| {
                Ok(MediationSummary {
                    id: row.get(0)?,
                    plaintiff: row.get(1)?,
                    defendant: row.get(2)?,
                    mediator: row.get(3)?,
                    status: row.get(4)?,
                    updated_at: row.get(5)?,
                })
            })?
        } else {
            stmt.query_map(params![search_pattern, status_filter], |row| {
                Ok(MediationSummary {
                    id: row.get(0)?,
                    plaintiff: row.get(1)?,
                    defendant: row.get(2)?,
                    mediator: row.get(3)?,
                    status: row.get(4)?,
                    updated_at: row.get(5)?,
                })
            })?
        };

        rows.collect()
    }

    pub fn autocomplete_field(&self, field: &str, prefix: &str) -> SqlResult<Vec<String>> {
        let conn = self.conn.lock().unwrap();
        let allowed_fields = ["plaintiff", "defendant", "defense_firm", "counsel", "mediator"];
        if !allowed_fields.contains(&field) {
            return Ok(vec![]);
        }
        let sql = format!(
            "SELECT DISTINCT {} FROM mediations WHERE {} LIKE ?1 AND {} != '' ORDER BY {} LIMIT 10",
            field, field, field, field
        );
        let pattern = format!("{}%", prefix);
        let mut stmt = conn.prepare(&sql)?;
        let rows = stmt.query_map(params![pattern], |row| row.get(0))?;
        rows.collect()
    }

    // -- Rounds --

    pub fn add_round(&self, round: &Round) -> SqlResult<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO rounds (id, mediation_id, round_number, round_type, demand, offer, bracket_high, bracket_low, bracket_proposed_by, midpoint, is_speculative, branch_from_round, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
            params![
                round.id, round.mediation_id, round.round_number, round.round_type,
                round.demand, round.offer, round.bracket_high, round.bracket_low,
                round.bracket_proposed_by, round.midpoint, round.is_speculative,
                round.branch_from_round, round.created_at
            ],
        )?;
        Ok(())
    }

    pub fn get_rounds(&self, mediation_id: &str) -> SqlResult<Vec<Round>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, mediation_id, round_number, round_type, demand, offer, bracket_high, bracket_low, bracket_proposed_by, midpoint, is_speculative, branch_from_round, created_at
             FROM rounds WHERE mediation_id = ?1 ORDER BY is_speculative ASC, round_number ASC"
        )?;
        let rows = stmt.query_map(params![mediation_id], |row| {
            Ok(Round {
                id: row.get(0)?,
                mediation_id: row.get(1)?,
                round_number: row.get(2)?,
                round_type: row.get(3)?,
                demand: row.get(4)?,
                offer: row.get(5)?,
                bracket_high: row.get(6)?,
                bracket_low: row.get(7)?,
                bracket_proposed_by: row.get(8)?,
                midpoint: row.get(9)?,
                is_speculative: row.get(10)?,
                branch_from_round: row.get(11)?,
                created_at: row.get(12)?,
            })
        })?;
        rows.collect()
    }

    pub fn update_round(&self, round: &Round) -> SqlResult<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE rounds SET demand=?2, offer=?3, bracket_high=?4, bracket_low=?5, bracket_proposed_by=?6, midpoint=?7, round_type=?8 WHERE id=?1",
            params![
                round.id, round.demand, round.offer, round.bracket_high,
                round.bracket_low, round.bracket_proposed_by, round.midpoint, round.round_type
            ],
        )?;
        Ok(())
    }

    pub fn delete_round(&self, id: &str) -> SqlResult<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM rounds WHERE id = ?1", params![id])?;
        Ok(())
    }

    pub fn promote_speculative_rounds(&self, mediation_id: &str, up_to_round: i32) -> SqlResult<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE rounds SET is_speculative = 0, branch_from_round = NULL
             WHERE mediation_id = ?1 AND is_speculative = 1 AND round_number <= ?2",
            params![mediation_id, up_to_round],
        )?;
        Ok(())
    }

    pub fn discard_speculative_rounds(&self, mediation_id: &str, from_round: i32) -> SqlResult<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "DELETE FROM rounds WHERE mediation_id = ?1 AND is_speculative = 1 AND round_number >= ?2",
            params![mediation_id, from_round],
        )?;
        Ok(())
    }

    // -- Settings --

    pub fn get_setting(&self, key: &str) -> SqlResult<String> {
        let conn = self.conn.lock().unwrap();
        conn.query_row(
            "SELECT value FROM settings WHERE key = ?1",
            params![key],
            |row| row.get(0),
        )
    }

    pub fn set_setting(&self, key: &str, value: &str) -> SqlResult<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO settings (key, value) VALUES (?1, ?2)
             ON CONFLICT(key) DO UPDATE SET value = ?2",
            params![key, value],
        )?;
        Ok(())
    }
}
```

- [ ] **Step 5: Update main.rs to initialize database**

Replace `src-tauri/src/main.rs` with:

```rust
mod db;
mod models;

use db::Database;
use std::sync::Arc;

fn main() {
    let app = tauri::Builder::default()
        .setup(|app| {
            let app_dir = app.path().app_data_dir().expect("failed to get app data dir");
            std::fs::create_dir_all(&app_dir).expect("failed to create app data dir");
            let db_path = app_dir.join("gladice.db");
            let database = Database::new(db_path.to_str().unwrap())
                .expect("failed to initialize database");
            app.manage(Arc::new(database));
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

- [ ] **Step 6: Verify it compiles**

```bash
cd src-tauri && cargo check && cd ..
```

Expected: Compiles with no errors (warnings about unused code are fine at this stage).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add database schema, Rust models, and SQLite abstraction layer"
```

---

## Task 3: Calculation Logic and Tauri Commands

**Files:**
- Create: `src-tauri/src/calculations.rs`
- Create: `src-tauri/src/commands/mod.rs`
- Create: `src-tauri/src/commands/mediations.rs`
- Create: `src-tauri/src/commands/rounds.rs`
- Create: `src-tauri/src/commands/settings.rs`
- Modify: `src-tauri/src/main.rs`

- [ ] **Step 1: Create calculations module**

Create `src-tauri/src/calculations.rs`:

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Variation {
    pub demand: f64,
    pub offer_needed: f64,
}

pub fn compute_midpoint_standard(demand: f64, offer: f64) -> f64 {
    (demand + offer) / 2.0
}

pub fn compute_midpoint_bracket(high: f64, low: f64) -> f64 {
    (high + low) / 2.0
}

pub fn compute_variation_step(demand: f64) -> f64 {
    if demand <= 0.0 {
        return 1000.0;
    }
    let magnitude = demand.abs().log10().floor() as i32;
    10_f64.powi(magnitude - 1)
}

pub fn generate_variations(midpoint: f64, current_demand: f64, count: usize) -> Vec<Variation> {
    let step = compute_variation_step(current_demand);
    let mut variations = Vec::new();
    let half = count / 2;

    for i in 0..count {
        let offset = i as f64 - half as f64;
        let demand = current_demand + offset * step;
        if demand > 0.0 {
            let offer_needed = 2.0 * midpoint - demand;
            if offer_needed > 0.0 {
                variations.push(Variation {
                    demand,
                    offer_needed,
                });
            }
        }
    }

    variations
}

pub fn has_standard_round_with_both(rounds: &[(Option<f64>, Option<f64>, String)]) -> bool {
    rounds.iter().any(|(demand, offer, round_type)| {
        round_type == "standard" && demand.is_some() && offer.is_some()
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_midpoint_standard() {
        assert_eq!(compute_midpoint_standard(500_000.0, 100_000.0), 300_000.0);
    }

    #[test]
    fn test_midpoint_bracket() {
        assert_eq!(compute_midpoint_bracket(350_000.0, 250_000.0), 300_000.0);
    }

    #[test]
    fn test_variation_step_large() {
        assert_eq!(compute_variation_step(350_000.0), 10_000.0);
    }

    #[test]
    fn test_variation_step_medium() {
        assert_eq!(compute_variation_step(35_000.0), 1_000.0);
    }

    #[test]
    fn test_variation_step_small() {
        assert_eq!(compute_variation_step(3_500.0), 100.0);
    }

    #[test]
    fn test_generate_variations() {
        let variations = generate_variations(275_000.0, 350_000.0, 8);
        assert!(!variations.is_empty());
        for v in &variations {
            let mid = (v.demand + v.offer_needed) / 2.0;
            assert!((mid - 275_000.0).abs() < 0.01);
        }
    }

    #[test]
    fn test_has_standard_round() {
        let rounds = vec![
            (Some(500_000.0), Some(100_000.0), "standard".to_string()),
        ];
        assert!(has_standard_round_with_both(&rounds));

        let rounds_empty: Vec<(Option<f64>, Option<f64>, String)> = vec![];
        assert!(!has_standard_round_with_both(&rounds_empty));
    }
}
```

- [ ] **Step 2: Run calculation tests**

```bash
cd src-tauri && cargo test calculations && cd ..
```

Expected: All tests pass.

- [ ] **Step 3: Create mediations commands**

Create `src-tauri/src/commands/mod.rs`:

```rust
pub mod mediations;
pub mod rounds;
pub mod settings;
```

Create `src-tauri/src/commands/mediations.rs`:

```rust
use crate::db::Database;
use crate::models::{Mediation, MediationSummary};
use std::sync::Arc;
use tauri::State;
use uuid::Uuid;

#[tauri::command]
pub fn create_mediation(db: State<'_, Arc<Database>>) -> Result<Mediation, String> {
    let now = chrono::Utc::now().to_rfc3339();
    let med = Mediation {
        id: Uuid::new_v4().to_string(),
        plaintiff: String::new(),
        defendant: String::new(),
        defense_firm: String::new(),
        counsel: String::new(),
        mediator: String::new(),
        status: "in_progress".to_string(),
        notes: String::new(),
        notes_format: "markdown".to_string(),
        created_at: now.clone(),
        updated_at: now,
    };
    db.create_mediation(&med).map_err(|e| e.to_string())?;
    Ok(med)
}

#[tauri::command]
pub fn get_mediation(db: State<'_, Arc<Database>>, id: String) -> Result<Mediation, String> {
    db.get_mediation(&id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_mediation(db: State<'_, Arc<Database>>, mediation: Mediation) -> Result<(), String> {
    db.update_mediation(&mediation).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_mediation(db: State<'_, Arc<Database>>, id: String) -> Result<(), String> {
    db.delete_mediation(&id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_mediations(
    db: State<'_, Arc<Database>>,
    search: String,
    status_filter: String,
) -> Result<Vec<MediationSummary>, String> {
    db.list_mediations(&search, &status_filter)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn autocomplete_field(
    db: State<'_, Arc<Database>>,
    field: String,
    prefix: String,
) -> Result<Vec<String>, String> {
    db.autocomplete_field(&field, &prefix)
        .map_err(|e| e.to_string())
}
```

- [ ] **Step 4: Create rounds commands**

Create `src-tauri/src/commands/rounds.rs`:

```rust
use crate::calculations;
use crate::db::Database;
use crate::models::Round;
use std::sync::Arc;
use tauri::State;
use uuid::Uuid;

#[derive(serde::Deserialize)]
pub struct AddRoundInput {
    pub mediation_id: String,
    pub round_type: String,
    pub demand: Option<f64>,
    pub offer: Option<f64>,
    pub bracket_high: Option<f64>,
    pub bracket_low: Option<f64>,
    pub bracket_proposed_by: Option<String>,
    pub is_speculative: bool,
    pub branch_from_round: Option<i32>,
}

#[tauri::command]
pub fn add_round(
    db: State<'_, Arc<Database>>,
    input: AddRoundInput,
) -> Result<Round, String> {
    let existing = db.get_rounds(&input.mediation_id).map_err(|e| e.to_string())?;

    // Validate bracket availability
    if input.round_type == "bracket" {
        let round_data: Vec<_> = existing
            .iter()
            .map(|r| (r.demand, r.offer, r.round_type.clone()))
            .collect();
        if !calculations::has_standard_round_with_both(&round_data) {
            return Err("Bracket rounds require at least one standard round with both demand and offer".to_string());
        }
    }

    let midpoint = if input.round_type == "bracket" {
        let high = input.bracket_high.ok_or("bracket_high required")?;
        let low = input.bracket_low.ok_or("bracket_low required")?;
        calculations::compute_midpoint_bracket(high, low)
    } else {
        let demand = input.demand.ok_or("demand required")?;
        let offer = input.offer.ok_or("offer required")?;
        calculations::compute_midpoint_standard(demand, offer)
    };

    let next_round = existing.iter().map(|r| r.round_number).max().unwrap_or(0) + 1;
    let now = chrono::Utc::now().to_rfc3339();

    let round = Round {
        id: Uuid::new_v4().to_string(),
        mediation_id: input.mediation_id,
        round_number: next_round,
        round_type: input.round_type,
        demand: input.demand,
        offer: input.offer,
        bracket_high: input.bracket_high,
        bracket_low: input.bracket_low,
        bracket_proposed_by: input.bracket_proposed_by,
        midpoint,
        is_speculative: input.is_speculative,
        branch_from_round: input.branch_from_round,
        created_at: now,
    };

    db.add_round(&round).map_err(|e| e.to_string())?;
    Ok(round)
}

#[tauri::command]
pub fn get_rounds(
    db: State<'_, Arc<Database>>,
    mediation_id: String,
) -> Result<Vec<Round>, String> {
    db.get_rounds(&mediation_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_round(db: State<'_, Arc<Database>>, round: Round) -> Result<(), String> {
    db.update_round(&round).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_round(db: State<'_, Arc<Database>>, id: String) -> Result<(), String> {
    db.delete_round(&id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn promote_speculative_rounds(
    db: State<'_, Arc<Database>>,
    mediation_id: String,
    up_to_round: i32,
) -> Result<(), String> {
    db.promote_speculative_rounds(&mediation_id, up_to_round)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn discard_speculative_rounds(
    db: State<'_, Arc<Database>>,
    mediation_id: String,
    from_round: i32,
) -> Result<(), String> {
    db.discard_speculative_rounds(&mediation_id, from_round)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_variations(
    midpoint: f64,
    current_demand: f64,
    count: usize,
) -> Result<Vec<calculations::Variation>, String> {
    Ok(calculations::generate_variations(midpoint, current_demand, count))
}
```

- [ ] **Step 5: Create settings commands**

Create `src-tauri/src/commands/settings.rs`:

```rust
use crate::db::Database;
use std::sync::Arc;
use tauri::State;

#[tauri::command]
pub fn get_setting(db: State<'_, Arc<Database>>, key: String) -> Result<String, String> {
    db.get_setting(&key).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn set_setting(
    db: State<'_, Arc<Database>>,
    key: String,
    value: String,
) -> Result<(), String> {
    db.set_setting(&key, &value).map_err(|e| e.to_string())
}
```

- [ ] **Step 6: Register all commands in main.rs**

Update `src-tauri/src/main.rs`:

```rust
mod calculations;
mod commands;
mod db;
mod models;

use db::Database;
use std::sync::Arc;

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let app_dir = app.path().app_data_dir().expect("failed to get app data dir");
            std::fs::create_dir_all(&app_dir).expect("failed to create app data dir");
            let db_path = app_dir.join("gladice.db");
            let database =
                Database::new(db_path.to_str().unwrap()).expect("failed to initialize database");
            app.manage(Arc::new(database));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::mediations::create_mediation,
            commands::mediations::get_mediation,
            commands::mediations::update_mediation,
            commands::mediations::delete_mediation,
            commands::mediations::list_mediations,
            commands::mediations::autocomplete_field,
            commands::rounds::add_round,
            commands::rounds::get_rounds,
            commands::rounds::update_round,
            commands::rounds::delete_round,
            commands::rounds::promote_speculative_rounds,
            commands::rounds::discard_speculative_rounds,
            commands::rounds::get_variations,
            commands::settings::get_setting,
            commands::settings::set_setting,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

- [ ] **Step 7: Verify compilation and tests**

```bash
cd src-tauri && cargo check && cargo test && cd ..
```

Expected: Compiles cleanly, all calculation tests pass.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add calculation logic and Tauri commands for mediations, rounds, settings"
```

---

## Task 4: TypeScript Types and API Layer

**Files:**
- Create: `src/types.ts`
- Create: `src/api.ts`

- [ ] **Step 1: Create TypeScript types**

Create `src/types.ts`:

```typescript
export interface Mediation {
  id: string;
  plaintiff: string;
  defendant: string;
  defense_firm: string;
  counsel: string;
  mediator: string;
  status: "in_progress" | "settled" | "impasse" | "adjourned";
  notes: string;
  notes_format: "markdown" | "raw";
  created_at: string;
  updated_at: string;
}

export interface MediationSummary {
  id: string;
  plaintiff: string;
  defendant: string;
  mediator: string;
  status: string;
  updated_at: string;
}

export interface Round {
  id: string;
  mediation_id: string;
  round_number: number;
  round_type: "standard" | "bracket";
  demand: number | null;
  offer: number | null;
  bracket_high: number | null;
  bracket_low: number | null;
  bracket_proposed_by: "plaintiff" | "defendant" | null;
  midpoint: number;
  is_speculative: boolean;
  branch_from_round: number | null;
  created_at: string;
}

export interface AddRoundInput {
  mediation_id: string;
  round_type: "standard" | "bracket";
  demand?: number;
  offer?: number;
  bracket_high?: number;
  bracket_low?: number;
  bracket_proposed_by?: "plaintiff" | "defendant";
  is_speculative: boolean;
  branch_from_round?: number;
}

export interface Variation {
  demand: number;
  offer_needed: number;
}

export type ThemeName =
  | "light"
  | "dark"
  | "solarized-light"
  | "solarized-dark"
  | "nord-light"
  | "nord-dark";

export interface Tab {
  id: string;
  type: "home" | "mediation";
  mediationId?: string;
  label: string;
}
```

- [ ] **Step 2: Create API layer**

Create `src/api.ts`:

```typescript
import { invoke } from "@tauri-apps/api/core";
import type {
  Mediation,
  MediationSummary,
  Round,
  AddRoundInput,
  Variation,
} from "./types";

// Mediations
export const createMediation = () =>
  invoke<Mediation>("create_mediation");

export const getMediation = (id: string) =>
  invoke<Mediation>("get_mediation", { id });

export const updateMediation = (mediation: Mediation) =>
  invoke<void>("update_mediation", { mediation });

export const deleteMediation = (id: string) =>
  invoke<void>("delete_mediation", { id });

export const listMediations = (search: string, statusFilter: string) =>
  invoke<MediationSummary[]>("list_mediations", {
    search,
    statusFilter,
  });

export const autocompleteField = (field: string, prefix: string) =>
  invoke<string[]>("autocomplete_field", { field, prefix });

// Rounds
export const addRound = (input: AddRoundInput) =>
  invoke<Round>("add_round", { input });

export const getRounds = (mediationId: string) =>
  invoke<Round[]>("get_rounds", { mediationId });

export const updateRound = (round: Round) =>
  invoke<void>("update_round", { round });

export const deleteRound = (id: string) =>
  invoke<void>("delete_round", { id });

export const promoteSpeculativeRounds = (
  mediationId: string,
  upToRound: number
) =>
  invoke<void>("promote_speculative_rounds", {
    mediationId,
    upToRound,
  });

export const discardSpeculativeRounds = (
  mediationId: string,
  fromRound: number
) =>
  invoke<void>("discard_speculative_rounds", {
    mediationId,
    fromRound,
  });

export const getVariations = (
  midpoint: number,
  currentDemand: number,
  count: number
) =>
  invoke<Variation[]>("get_variations", {
    midpoint,
    currentDemand,
    count,
  });

// Settings
export const getSetting = (key: string) =>
  invoke<string>("get_setting", { key });

export const setSetting = (key: string, value: string) =>
  invoke<void>("set_setting", { key, value });
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No type errors.

- [ ] **Step 4: Commit**

```bash
git add src/types.ts src/api.ts
git commit -m "feat: add TypeScript types and Tauri API layer"
```

---

## Task 5: Theme System

**Files:**
- Create: `src/themes/themes.ts`
- Create: `src/context/ThemeContext.tsx`
- Create: `src/components/ThemeSelector.tsx`

- [ ] **Step 1: Define theme CSS variables**

Create `src/themes/themes.ts`:

```typescript
import type { ThemeName } from "../types";

interface ThemeTokens {
  "--bg-primary": string;
  "--bg-secondary": string;
  "--bg-card": string;
  "--bg-input": string;
  "--border": string;
  "--border-light": string;
  "--text-primary": string;
  "--text-secondary": string;
  "--text-muted": string;
  "--accent": string;
  "--accent-hover": string;
  "--demand": string;
  "--offer": string;
  "--status-in-progress-bg": string;
  "--status-in-progress-text": string;
  "--status-settled-bg": string;
  "--status-settled-text": string;
  "--status-impasse-bg": string;
  "--status-impasse-text": string;
  "--status-adjourned-bg": string;
  "--status-adjourned-text": string;
  "--speculative-bg": string;
  "--speculative-border": string;
  "--speculative-text": string;
}

export const themes: Record<ThemeName, ThemeTokens> = {
  light: {
    "--bg-primary": "#f9fafb",
    "--bg-secondary": "#ffffff",
    "--bg-card": "#ffffff",
    "--bg-input": "#f9fafb",
    "--border": "#e5e7eb",
    "--border-light": "#f3f4f6",
    "--text-primary": "#111827",
    "--text-secondary": "#374151",
    "--text-muted": "#9ca3af",
    "--accent": "#2563eb",
    "--accent-hover": "#1d4ed8",
    "--demand": "#dc2626",
    "--offer": "#2563eb",
    "--status-in-progress-bg": "#dbeafe",
    "--status-in-progress-text": "#1d4ed8",
    "--status-settled-bg": "#dcfce7",
    "--status-settled-text": "#166534",
    "--status-impasse-bg": "#fee2e2",
    "--status-impasse-text": "#991b1b",
    "--status-adjourned-bg": "#fef3c7",
    "--status-adjourned-text": "#92400e",
    "--speculative-bg": "#fffbeb",
    "--speculative-border": "#f59e0b",
    "--speculative-text": "#92400e",
  },
  dark: {
    "--bg-primary": "#111827",
    "--bg-secondary": "#1f2937",
    "--bg-card": "#1f2937",
    "--bg-input": "#374151",
    "--border": "#374151",
    "--border-light": "#4b5563",
    "--text-primary": "#f9fafb",
    "--text-secondary": "#d1d5db",
    "--text-muted": "#6b7280",
    "--accent": "#3b82f6",
    "--accent-hover": "#2563eb",
    "--demand": "#ef4444",
    "--offer": "#3b82f6",
    "--status-in-progress-bg": "#1e3a5f",
    "--status-in-progress-text": "#93c5fd",
    "--status-settled-bg": "#14532d",
    "--status-settled-text": "#86efac",
    "--status-impasse-bg": "#7f1d1d",
    "--status-impasse-text": "#fca5a5",
    "--status-adjourned-bg": "#78350f",
    "--status-adjourned-text": "#fcd34d",
    "--speculative-bg": "#422006",
    "--speculative-border": "#d97706",
    "--speculative-text": "#fcd34d",
  },
  "solarized-light": {
    "--bg-primary": "#fdf6e3",
    "--bg-secondary": "#eee8d5",
    "--bg-card": "#eee8d5",
    "--bg-input": "#fdf6e3",
    "--border": "#93a1a1",
    "--border-light": "#eee8d5",
    "--text-primary": "#073642",
    "--text-secondary": "#586e75",
    "--text-muted": "#93a1a1",
    "--accent": "#268bd2",
    "--accent-hover": "#2176b8",
    "--demand": "#dc322f",
    "--offer": "#268bd2",
    "--status-in-progress-bg": "#d5e8f0",
    "--status-in-progress-text": "#268bd2",
    "--status-settled-bg": "#d5e8ce",
    "--status-settled-text": "#859900",
    "--status-impasse-bg": "#f0d5d5",
    "--status-impasse-text": "#dc322f",
    "--status-adjourned-bg": "#f0e8d5",
    "--status-adjourned-text": "#b58900",
    "--speculative-bg": "#f5efc9",
    "--speculative-border": "#b58900",
    "--speculative-text": "#b58900",
  },
  "solarized-dark": {
    "--bg-primary": "#002b36",
    "--bg-secondary": "#073642",
    "--bg-card": "#073642",
    "--bg-input": "#002b36",
    "--border": "#586e75",
    "--border-light": "#073642",
    "--text-primary": "#fdf6e3",
    "--text-secondary": "#93a1a1",
    "--text-muted": "#586e75",
    "--accent": "#268bd2",
    "--accent-hover": "#2aa0f0",
    "--demand": "#dc322f",
    "--offer": "#268bd2",
    "--status-in-progress-bg": "#0a4a5c",
    "--status-in-progress-text": "#268bd2",
    "--status-settled-bg": "#2a4a00",
    "--status-settled-text": "#859900",
    "--status-impasse-bg": "#5c1a1a",
    "--status-impasse-text": "#dc322f",
    "--status-adjourned-bg": "#5c4a00",
    "--status-adjourned-text": "#b58900",
    "--speculative-bg": "#3b3000",
    "--speculative-border": "#b58900",
    "--speculative-text": "#b58900",
  },
  "nord-light": {
    "--bg-primary": "#eceff4",
    "--bg-secondary": "#e5e9f0",
    "--bg-card": "#e5e9f0",
    "--bg-input": "#eceff4",
    "--border": "#d8dee9",
    "--border-light": "#e5e9f0",
    "--text-primary": "#2e3440",
    "--text-secondary": "#3b4252",
    "--text-muted": "#7b88a1",
    "--accent": "#5e81ac",
    "--accent-hover": "#4c6e96",
    "--demand": "#bf616a",
    "--offer": "#5e81ac",
    "--status-in-progress-bg": "#d8e2f0",
    "--status-in-progress-text": "#5e81ac",
    "--status-settled-bg": "#d8e8d5",
    "--status-settled-text": "#a3be8c",
    "--status-impasse-bg": "#f0d8da",
    "--status-impasse-text": "#bf616a",
    "--status-adjourned-bg": "#f0e8d5",
    "--status-adjourned-text": "#d08770",
    "--speculative-bg": "#f5efd9",
    "--speculative-border": "#ebcb8b",
    "--speculative-text": "#d08770",
  },
  "nord-dark": {
    "--bg-primary": "#2e3440",
    "--bg-secondary": "#3b4252",
    "--bg-card": "#3b4252",
    "--bg-input": "#434c5e",
    "--border": "#4c566a",
    "--border-light": "#434c5e",
    "--text-primary": "#eceff4",
    "--text-secondary": "#d8dee9",
    "--text-muted": "#7b88a1",
    "--accent": "#88c0d0",
    "--accent-hover": "#8fbcbb",
    "--demand": "#bf616a",
    "--offer": "#88c0d0",
    "--status-in-progress-bg": "#2e4459",
    "--status-in-progress-text": "#88c0d0",
    "--status-settled-bg": "#2e4430",
    "--status-settled-text": "#a3be8c",
    "--status-impasse-bg": "#592e30",
    "--status-impasse-text": "#bf616a",
    "--status-adjourned-bg": "#593e2e",
    "--status-adjourned-text": "#d08770",
    "--speculative-bg": "#3d3526",
    "--speculative-border": "#ebcb8b",
    "--speculative-text": "#ebcb8b",
  },
};

export const themeNames: { value: ThemeName; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "solarized-light", label: "Solarized Light" },
  { value: "solarized-dark", label: "Solarized Dark" },
  { value: "nord-light", label: "Nord Light" },
  { value: "nord-dark", label: "Nord Dark" },
];

export function applyTheme(name: ThemeName) {
  const tokens = themes[name];
  const root = document.documentElement;
  for (const [key, value] of Object.entries(tokens)) {
    root.style.setProperty(key, value);
  }
}
```

- [ ] **Step 2: Create ThemeContext**

Create `src/context/ThemeContext.tsx`:

```tsx
import { createContext, useContext, useEffect, useState } from "react";
import type { ThemeName } from "../types";
import { applyTheme } from "../themes/themes";
import { getSetting, setSetting } from "../api";

interface ThemeContextValue {
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>("light");

  useEffect(() => {
    getSetting("theme")
      .then((val) => {
        const t = val as ThemeName;
        setThemeState(t);
        applyTheme(t);
      })
      .catch(() => applyTheme("light"));
  }, []);

  const setTheme = (t: ThemeName) => {
    setThemeState(t);
    applyTheme(t);
    setSetting("theme", t).catch(console.error);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
```

- [ ] **Step 3: Create ThemeSelector component**

Create `src/components/ThemeSelector.tsx`:

```tsx
import { useState, useRef, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { themeNames } from "../themes/themes";

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const currentLabel =
    themeNames.find((t) => t.value === theme)?.label ?? "Light";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="px-3 py-1.5 text-xs rounded-md"
        style={{
          background: "var(--bg-input)",
          color: "var(--text-secondary)",
          border: "1px solid var(--border)",
        }}
      >
        Theme: {currentLabel} ▾
      </button>
      {open && (
        <div
          className="absolute right-0 top-full mt-1 rounded-md shadow-lg z-50 py-1 min-w-[160px]"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
          }}
        >
          {themeNames.map((t) => (
            <button
              key={t.value}
              onClick={() => {
                setTheme(t.value);
                setOpen(false);
              }}
              className="block w-full text-left px-3 py-2 text-sm hover:opacity-80"
              style={{
                color:
                  theme === t.value
                    ? "var(--accent)"
                    : "var(--text-secondary)",
                fontWeight: theme === t.value ? 600 : 400,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Wire into App.tsx**

Update `src/App.tsx`:

```tsx
import { ThemeProvider } from "./context/ThemeContext";
import { ThemeSelector } from "./components/ThemeSelector";

function App() {
  return (
    <ThemeProvider>
      <div
        className="min-h-screen"
        style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}
      >
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{
            background: "var(--bg-secondary)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <span className="font-bold text-lg">Gladice</span>
          <ThemeSelector />
        </div>
        <div className="p-8 text-center" style={{ color: "var(--text-muted)" }}>
          App shell ready — components coming next.
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;
```

- [ ] **Step 5: Verify themes work**

```bash
npm run tauri dev
```

Expected: App shows with top bar. Clicking theme dropdown switches between all 6 themes. Colors update instantly.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add theme system with 6 themes and ThemeSelector component"
```

---

## Task 6: Tab System and Context

**Files:**
- Create: `src/context/TabContext.tsx`
- Create: `src/components/TabBar.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create TabContext**

Create `src/context/TabContext.tsx`:

```tsx
import { createContext, useContext, useReducer } from "react";
import type { Tab } from "../types";

interface TabState {
  tabs: Tab[];
  activeTabId: string;
}

type TabAction =
  | { type: "OPEN_MEDIATION"; mediationId: string; label: string }
  | { type: "CLOSE_TAB"; tabId: string }
  | { type: "SET_ACTIVE"; tabId: string }
  | { type: "UPDATE_LABEL"; tabId: string; label: string };

const HOME_TAB: Tab = { id: "home", type: "home", label: "Home" };

function tabReducer(state: TabState, action: TabAction): TabState {
  switch (action.type) {
    case "OPEN_MEDIATION": {
      const existing = state.tabs.find(
        (t) => t.type === "mediation" && t.mediationId === action.mediationId
      );
      if (existing) {
        return { ...state, activeTabId: existing.id };
      }
      const newTab: Tab = {
        id: `med-${action.mediationId}`,
        type: "mediation",
        mediationId: action.mediationId,
        label: action.label,
      };
      return {
        tabs: [...state.tabs, newTab],
        activeTabId: newTab.id,
      };
    }
    case "CLOSE_TAB": {
      if (action.tabId === "home") return state;
      const idx = state.tabs.findIndex((t) => t.id === action.tabId);
      const newTabs = state.tabs.filter((t) => t.id !== action.tabId);
      const newActive =
        state.activeTabId === action.tabId
          ? newTabs[Math.min(idx, newTabs.length - 1)]?.id ?? "home"
          : state.activeTabId;
      return { tabs: newTabs, activeTabId: newActive };
    }
    case "SET_ACTIVE":
      return { ...state, activeTabId: action.tabId };
    case "UPDATE_LABEL":
      return {
        ...state,
        tabs: state.tabs.map((t) =>
          t.id === action.tabId ? { ...t, label: action.label } : t
        ),
      };
    default:
      return state;
  }
}

interface TabContextValue {
  state: TabState;
  dispatch: React.Dispatch<TabAction>;
}

const TabContext = createContext<TabContextValue>({
  state: { tabs: [HOME_TAB], activeTabId: "home" },
  dispatch: () => {},
});

export function TabProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(tabReducer, {
    tabs: [HOME_TAB],
    activeTabId: "home",
  });

  return (
    <TabContext.Provider value={{ state, dispatch }}>
      {children}
    </TabContext.Provider>
  );
}

export const useTabs = () => useContext(TabContext);
```

- [ ] **Step 2: Create TabBar component**

Create `src/components/TabBar.tsx`:

```tsx
import { useTabs } from "../context/TabContext";

export function TabBar() {
  const { state, dispatch } = useTabs();

  return (
    <div
      className="flex items-center px-5 overflow-x-auto"
      style={{
        background: "var(--bg-secondary)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      {state.tabs.map((tab) => {
        const isActive = tab.id === state.activeTabId;
        return (
          <div
            key={tab.id}
            className="flex items-center gap-1 px-4 py-2.5 text-sm cursor-pointer whitespace-nowrap shrink-0"
            style={{
              color: isActive ? "var(--accent)" : "var(--text-muted)",
              fontWeight: isActive ? 600 : 400,
              borderBottom: isActive
                ? "2px solid var(--accent)"
                : "2px solid transparent",
            }}
            onClick={() => dispatch({ type: "SET_ACTIVE", tabId: tab.id })}
          >
            <span>{tab.label}</span>
            {tab.type === "mediation" && (
              <button
                className="ml-1 hover:opacity-70 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  dispatch({ type: "CLOSE_TAB", tabId: tab.id });
                }}
                style={{ color: "var(--text-muted)" }}
              >
                ✕
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: Update App.tsx to use TabProvider and TabBar**

Update `src/App.tsx`:

```tsx
import { ThemeProvider } from "./context/ThemeContext";
import { TabProvider, useTabs } from "./context/TabContext";
import { ThemeSelector } from "./components/ThemeSelector";
import { TabBar } from "./components/TabBar";

function AppContent() {
  const { state } = useTabs();
  const activeTab = state.tabs.find((t) => t.id === state.activeTabId);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}
    >
      <div
        className="flex items-center justify-between px-5 py-3"
        style={{
          background: "var(--bg-secondary)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <span className="font-bold text-lg">Gladice</span>
        <ThemeSelector />
      </div>
      <TabBar />
      <div className="flex-1">
        {activeTab?.type === "home" && (
          <div className="p-8 text-center" style={{ color: "var(--text-muted)" }}>
            Landing page coming next.
          </div>
        )}
        {activeTab?.type === "mediation" && (
          <div className="p-8 text-center" style={{ color: "var(--text-muted)" }}>
            Workspace for {activeTab.label} coming next.
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <TabProvider>
        <AppContent />
      </TabProvider>
    </ThemeProvider>
  );
}

export default App;
```

- [ ] **Step 4: Verify tabs work**

```bash
npm run tauri dev
```

Expected: Home tab always visible and pinned. Placeholder content shown for home tab.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add tab system with TabContext and TabBar component"
```

---

## Task 7: Landing Page

**Files:**
- Create: `src/components/LandingPage.tsx`
- Create: `src/components/StatusBadge.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create StatusBadge component**

Create `src/components/StatusBadge.tsx`:

```tsx
const statusConfig: Record<string, { label: string; bgVar: string; textVar: string }> = {
  in_progress: { label: "In Progress", bgVar: "--status-in-progress-bg", textVar: "--status-in-progress-text" },
  settled: { label: "Settled", bgVar: "--status-settled-bg", textVar: "--status-settled-text" },
  impasse: { label: "Impasse", bgVar: "--status-impasse-bg", textVar: "--status-impasse-text" },
  adjourned: { label: "Adjourned", bgVar: "--status-adjourned-bg", textVar: "--status-adjourned-text" },
};

interface StatusBadgeProps {
  status: string;
  onClick?: () => void;
  showDropdown?: boolean;
  onStatusChange?: (status: string) => void;
}

export function StatusBadge({ status, onClick, showDropdown, onStatusChange }: StatusBadgeProps) {
  const config = statusConfig[status] ?? statusConfig.in_progress;

  return (
    <div className="relative inline-block">
      <span
        className="px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer"
        style={{
          background: `var(${config.bgVar})`,
          color: `var(${config.textVar})`,
        }}
        onClick={onClick}
      >
        {config.label} {onClick ? "▾" : ""}
      </span>
      {showDropdown && onStatusChange && (
        <div
          className="absolute left-0 top-full mt-1 rounded-md shadow-lg z-50 py-1 min-w-[140px]"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          {Object.entries(statusConfig).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => onStatusChange(key)}
              className="block w-full text-left px-3 py-1.5 text-sm hover:opacity-80"
              style={{ color: `var(${cfg.textVar})` }}
            >
              {cfg.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create LandingPage component**

Create `src/components/LandingPage.tsx`:

```tsx
import { useState, useEffect, useCallback } from "react";
import { listMediations, createMediation } from "../api";
import { useTabs } from "../context/TabContext";
import { StatusBadge } from "./StatusBadge";
import type { MediationSummary } from "../types";

export function LandingPage() {
  const [mediations, setMediations] = useState<MediationSummary[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { dispatch } = useTabs();

  const loadMediations = useCallback(async () => {
    const results = await listMediations(search, statusFilter);
    setMediations(results);
  }, [search, statusFilter]);

  useEffect(() => {
    loadMediations();
  }, [loadMediations]);

  const handleNew = async () => {
    const med = await createMediation();
    dispatch({
      type: "OPEN_MEDIATION",
      mediationId: med.id,
      label: "New Mediation",
    });
  };

  const handleOpen = (med: MediationSummary) => {
    const label =
      med.plaintiff && med.defendant
        ? `${med.plaintiff} v. ${med.defendant}`
        : "Untitled Mediation";
    dispatch({
      type: "OPEN_MEDIATION",
      mediationId: med.id,
      label,
    });
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="p-6">
      {/* Search + filter bar */}
      <div className="flex gap-3 items-center mb-6">
        <input
          className="flex-1 px-4 py-2.5 rounded-lg text-sm outline-none"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
          }}
          placeholder="Search by plaintiff, defendant, mediator..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="px-4 py-2.5 rounded-lg text-sm outline-none"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            color: "var(--text-secondary)",
          }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">Status: All</option>
          <option value="in_progress">In Progress</option>
          <option value="settled">Settled</option>
          <option value="impasse">Impasse</option>
          <option value="adjourned">Adjourned</option>
        </select>
        <button
          className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white"
          style={{ background: "var(--accent)" }}
          onClick={handleNew}
        >
          + New Mediation
        </button>
      </div>

      {/* Table header */}
      <div
        className="grid px-4 py-2 text-xs font-semibold uppercase tracking-wide"
        style={{
          gridTemplateColumns: "2fr 2fr 1.5fr 1fr 1fr",
          color: "var(--text-muted)",
        }}
      >
        <div>Plaintiff</div>
        <div>Defendant</div>
        <div>Mediator</div>
        <div>Status</div>
        <div>Last Updated</div>
      </div>

      {/* Rows */}
      {mediations.map((med) => (
        <div
          key={med.id}
          className="grid px-4 py-3.5 rounded-lg mb-1.5 text-sm cursor-pointer"
          style={{
            gridTemplateColumns: "2fr 2fr 1.5fr 1fr 1fr",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
          }}
          onClick={() => handleOpen(med)}
        >
          <div className="font-medium">{med.plaintiff || "—"}</div>
          <div>{med.defendant || "—"}</div>
          <div>{med.mediator || "—"}</div>
          <div>
            <StatusBadge status={med.status} />
          </div>
          <div style={{ color: "var(--text-muted)" }}>
            {formatDate(med.updated_at)}
          </div>
        </div>
      ))}

      {mediations.length === 0 && (
        <div
          className="text-center py-12 text-sm"
          style={{ color: "var(--text-muted)" }}
        >
          No mediations found. Click "+ New Mediation" to get started.
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Wire LandingPage into App.tsx**

In `src/App.tsx`, replace the home tab placeholder:

```tsx
import { LandingPage } from "./components/LandingPage";
```

Replace the home placeholder `<div>` with:

```tsx
{activeTab?.type === "home" && <LandingPage />}
```

- [ ] **Step 4: Verify landing page works**

```bash
npm run tauri dev
```

Expected: Landing page shows search bar, status filter, "+ New Mediation" button. Clicking "New Mediation" creates a record and opens a new tab. The new mediation appears in the list on the landing page.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add LandingPage with search, status filter, and mediation list"
```

---

## Task 8: Mediation Workspace Shell and Metadata Panel

**Files:**
- Create: `src/components/MediationWorkspace.tsx`
- Create: `src/components/MetadataPanel.tsx`
- Create: `src/components/AutocompleteInput.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create AutocompleteInput component**

Create `src/components/AutocompleteInput.tsx`:

```tsx
import { useState, useRef, useEffect } from "react";
import { autocompleteField } from "../api";

interface AutocompleteInputProps {
  field: string;
  value: string;
  onChange: (val: string) => void;
  label: string;
}

export function AutocompleteInput({
  field,
  value,
  onChange,
  label,
}: AutocompleteInputProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleChange = (val: string) => {
    onChange(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (val.length > 0) {
        const results = await autocompleteField(field, val);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 200);
  };

  return (
    <div ref={ref} className="relative">
      <div
        className="text-xs font-semibold uppercase mb-1"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </div>
      <input
        className="w-full px-3 py-2 rounded-md text-sm outline-none"
        style={{
          background: "var(--bg-input)",
          border: "1px solid var(--border)",
          color: "var(--text-primary)",
        }}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => {
          if (suggestions.length > 0) setShowSuggestions(true);
        }}
      />
      {showSuggestions && (
        <div
          className="absolute left-0 right-0 top-full mt-1 rounded-md shadow-lg z-50 max-h-40 overflow-y-auto"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
          }}
        >
          {suggestions.map((s) => (
            <button
              key={s}
              className="block w-full text-left px-3 py-2 text-sm hover:opacity-80"
              style={{ color: "var(--text-primary)" }}
              onClick={() => {
                onChange(s);
                setShowSuggestions(false);
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create MetadataPanel component**

Create `src/components/MetadataPanel.tsx`:

```tsx
import { useState } from "react";
import { AutocompleteInput } from "./AutocompleteInput";
import type { Mediation } from "../types";

interface MetadataPanelProps {
  mediation: Mediation;
  onUpdate: (field: keyof Mediation, value: string) => void;
}

export function MetadataPanel({ mediation, onUpdate }: MetadataPanelProps) {
  const [collapsed, setCollapsed] = useState(false);

  const fields: { key: keyof Mediation; label: string; field: string }[] = [
    { key: "plaintiff", label: "Plaintiff", field: "plaintiff" },
    { key: "defendant", label: "Defendant", field: "defendant" },
    { key: "defense_firm", label: "Defense Firm", field: "defense_firm" },
    { key: "counsel", label: "Counsel", field: "counsel" },
    { key: "mediator", label: "Mediator", field: "mediator" },
  ];

  return (
    <div
      className="rounded-xl"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
      }}
    >
      <div
        className="flex items-center justify-between px-5 py-3 cursor-pointer"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? (
          <div className="flex items-center gap-4">
            <span
              className="text-sm font-semibold"
              style={{ color: "var(--text-secondary)" }}
            >
              Case Details
            </span>
            <span className="text-sm" style={{ color: "var(--text-muted)" }}>
              {[mediation.plaintiff, mediation.defendant, mediation.mediator]
                .filter(Boolean)
                .join(" · ") || "No details yet"}
            </span>
          </div>
        ) : (
          <span
            className="text-sm font-semibold"
            style={{ color: "var(--text-secondary)" }}
          >
            Case Details
          </span>
        )}
        <span
          className="text-xs cursor-pointer"
          style={{ color: "var(--accent)" }}
        >
          {collapsed ? "▸ Expand" : "▾ Collapse"}
        </span>
      </div>

      {!collapsed && (
        <div className="grid grid-cols-3 gap-3 px-5 pb-4">
          {fields.map(({ key, label, field }) => (
            <AutocompleteInput
              key={key}
              field={field}
              label={label}
              value={mediation[key] as string}
              onChange={(val) => onUpdate(key, val)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create MediationWorkspace shell**

Create `src/components/MediationWorkspace.tsx`:

```tsx
import { useState, useEffect, useCallback, useRef } from "react";
import { getMediation, updateMediation, getRounds } from "../api";
import { useTabs } from "../context/TabContext";
import { MetadataPanel } from "./MetadataPanel";
import { StatusBadge } from "./StatusBadge";
import type { Mediation, Round } from "../types";

interface MediationWorkspaceProps {
  mediationId: string;
  tabId: string;
}

export function MediationWorkspace({ mediationId, tabId }: MediationWorkspaceProps) {
  const [mediation, setMediation] = useState<Mediation | null>(null);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const { dispatch } = useTabs();
  const autosaveTimer = useRef<ReturnType<typeof setTimeout>>();

  const load = useCallback(async () => {
    const [med, rds] = await Promise.all([
      getMediation(mediationId),
      getRounds(mediationId),
    ]);
    setMediation(med);
    setRounds(rds);
    const label =
      med.plaintiff && med.defendant
        ? `${med.plaintiff} v. ${med.defendant}`
        : "New Mediation";
    dispatch({ type: "UPDATE_LABEL", tabId, label });
  }, [mediationId, tabId, dispatch]);

  useEffect(() => {
    load();
  }, [load]);

  const autosave = useCallback(
    (updated: Mediation) => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
      autosaveTimer.current = setTimeout(async () => {
        const now = new Date().toISOString();
        const toSave = { ...updated, updated_at: now };
        await updateMediation(toSave);
        setMediation(toSave);
        const label =
          toSave.plaintiff && toSave.defendant
            ? `${toSave.plaintiff} v. ${toSave.defendant}`
            : "New Mediation";
        dispatch({ type: "UPDATE_LABEL", tabId, label });
      }, 1000);
    },
    [tabId, dispatch]
  );

  const handleFieldUpdate = (field: keyof Mediation, value: string) => {
    if (!mediation) return;
    const updated = { ...mediation, [field]: value };
    setMediation(updated);
    autosave(updated);
  };

  const handleStatusChange = (status: string) => {
    setStatusDropdownOpen(false);
    handleFieldUpdate("status", status);
  };

  if (!mediation) {
    return (
      <div className="p-8 text-center" style={{ color: "var(--text-muted)" }}>
        Loading...
      </div>
    );
  }

  const title =
    mediation.plaintiff && mediation.defendant
      ? `${mediation.plaintiff} v. ${mediation.defendant}`
      : "New Mediation";

  return (
    <div className="p-5 flex flex-col gap-5">
      {/* Title row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold">{title}</h2>
          <StatusBadge
            status={mediation.status}
            onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
            showDropdown={statusDropdownOpen}
            onStatusChange={handleStatusChange}
          />
        </div>
        <div className="flex gap-2">
          <button
            className="px-4 py-1.5 rounded-md text-sm"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
            }}
            disabled
          >
            Export
          </button>
        </div>
      </div>

      {/* Metadata panel */}
      <MetadataPanel mediation={mediation} onUpdate={handleFieldUpdate} />

      {/* Placeholder for rounds, chart, variations, notes */}
      <div
        className="rounded-xl p-8 text-center text-sm"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          color: "var(--text-muted)",
        }}
      >
        Rounds table, chart, variations, and notes coming next.
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Wire MediationWorkspace into App.tsx**

In `src/App.tsx`, import and render:

```tsx
import { MediationWorkspace } from "./components/MediationWorkspace";
```

Replace the mediation placeholder with:

```tsx
{activeTab?.type === "mediation" && activeTab.mediationId && (
  <MediationWorkspace
    key={activeTab.mediationId}
    mediationId={activeTab.mediationId}
    tabId={activeTab.id}
  />
)}
```

- [ ] **Step 5: Verify workspace loads with metadata**

```bash
npm run tauri dev
```

Expected: Create a new mediation from the landing page. Tab opens to workspace. Metadata panel shows 5 fields. Typing in fields autosaves. Tab label updates when plaintiff/defendant are filled in. Status badge is clickable with dropdown.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add MediationWorkspace, MetadataPanel, and AutocompleteInput"
```

---

## Task 9: Rounds Table with Inline Editing

**Files:**
- Create: `src/components/RoundsTable.tsx`
- Create: `src/components/RoundInputRow.tsx`
- Modify: `src/components/MediationWorkspace.tsx`

- [ ] **Step 1: Create RoundInputRow component**

Create `src/components/RoundInputRow.tsx`:

```tsx
import { useState } from "react";

interface RoundInputRowProps {
  allowBracket: boolean;
  isSpeculative: boolean;
  branchFromRound: number | null;
  onSubmit: (data: {
    round_type: "standard" | "bracket";
    demand?: number;
    offer?: number;
    bracket_high?: number;
    bracket_low?: number;
    bracket_proposed_by?: "plaintiff" | "defendant";
  }) => void;
  onCancel: () => void;
}

export function RoundInputRow({
  allowBracket,
  isSpeculative,
  branchFromRound,
  onSubmit,
  onCancel,
}: RoundInputRowProps) {
  const [roundType, setRoundType] = useState<"standard" | "bracket">("standard");
  const [val1, setVal1] = useState("");
  const [val2, setVal2] = useState("");
  const [proposedBy, setProposedBy] = useState<"plaintiff" | "defendant">("plaintiff");

  const v1 = parseFloat(val1);
  const v2 = parseFloat(val2);
  const bothValid = !isNaN(v1) && !isNaN(v2) && v1 > 0 && v2 > 0;
  const midpoint = bothValid ? (v1 + v2) / 2 : null;

  const handleSubmit = () => {
    if (!bothValid) return;
    if (roundType === "standard") {
      onSubmit({ round_type: "standard", demand: v1, offer: v2 });
    } else {
      onSubmit({
        round_type: "bracket",
        bracket_high: v1,
        bracket_low: v2,
        bracket_proposed_by: proposedBy,
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      if (bothValid) handleSubmit();
    }
    if (e.key === "Escape") onCancel();
  };

  const inputStyle = {
    background: "var(--bg-input)",
    border: "1px solid var(--border)",
    color: "var(--text-primary)",
  };

  return (
    <div
      className="px-3 py-2 rounded-lg mt-2"
      style={{
        background: isSpeculative ? "var(--speculative-bg)" : "var(--bg-input)",
        border: isSpeculative
          ? "1px solid var(--speculative-border)"
          : "1px solid var(--border)",
      }}
    >
      <div className="flex items-center gap-3 mb-2">
        <select
          className="px-2 py-1 rounded text-xs outline-none"
          style={inputStyle}
          value={roundType}
          onChange={(e) => setRoundType(e.target.value as "standard" | "bracket")}
        >
          <option value="standard">Standard</option>
          {allowBracket && <option value="bracket">Bracket</option>}
        </select>
        {roundType === "bracket" && (
          <select
            className="px-2 py-1 rounded text-xs outline-none"
            style={inputStyle}
            value={proposedBy}
            onChange={(e) => setProposedBy(e.target.value as "plaintiff" | "defendant")}
          >
            <option value="plaintiff">Plaintiff</option>
            <option value="defendant">Defendant</option>
          </select>
        )}
        {isSpeculative && branchFromRound && (
          <span className="text-xs" style={{ color: "var(--speculative-text)" }}>
            What-If from Round {branchFromRound}
          </span>
        )}
      </div>
      <div className="grid gap-3 items-center" style={{ gridTemplateColumns: "0.5fr 1.5fr 1.5fr 1.5fr 0.5fr" }}>
        <div className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
          —
        </div>
        <input
          className="px-2 py-1.5 rounded text-sm text-right outline-none"
          style={inputStyle}
          placeholder={roundType === "standard" ? "Demand" : "Bracket High"}
          value={val1}
          onChange={(e) => setVal1(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
        <input
          className="px-2 py-1.5 rounded text-sm text-right outline-none"
          style={inputStyle}
          placeholder={roundType === "standard" ? "Offer" : "Bracket Low"}
          value={val2}
          onChange={(e) => setVal2(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className="text-sm text-right font-semibold" style={{ color: "var(--text-muted)" }}>
          {midpoint !== null ? `$${midpoint.toLocaleString()}` : "—"}
        </div>
        <div className="flex gap-1 justify-end">
          <button
            className="text-xs px-2 py-1 rounded"
            style={{ color: "var(--accent)" }}
            onClick={handleSubmit}
            disabled={!bothValid}
          >
            ✓
          </button>
          <button
            className="text-xs px-2 py-1 rounded"
            style={{ color: "var(--text-muted)" }}
            onClick={onCancel}
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create RoundsTable component**

Create `src/components/RoundsTable.tsx`:

```tsx
import { useState } from "react";
import { addRound, updateRound as apiUpdateRound } from "../api";
import { RoundInputRow } from "./RoundInputRow";
import type { Round, AddRoundInput } from "../types";

interface RoundsTableProps {
  mediationId: string;
  rounds: Round[];
  onRoundsChange: () => void;
}

export function RoundsTable({ mediationId, rounds, onRoundsChange }: RoundsTableProps) {
  const [addingRound, setAddingRound] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editVal1, setEditVal1] = useState("");
  const [editVal2, setEditVal2] = useState("");

  const committedRounds = rounds.filter((r) => !r.is_speculative);
  const hasStandardWithBoth = committedRounds.some(
    (r) => r.round_type === "standard" && r.demand != null && r.offer != null
  );

  const handleAdd = async (data: {
    round_type: "standard" | "bracket";
    demand?: number;
    offer?: number;
    bracket_high?: number;
    bracket_low?: number;
    bracket_proposed_by?: "plaintiff" | "defendant";
  }) => {
    const input: AddRoundInput = {
      mediation_id: mediationId,
      round_type: data.round_type,
      demand: data.demand,
      offer: data.offer,
      bracket_high: data.bracket_high,
      bracket_low: data.bracket_low,
      bracket_proposed_by: data.bracket_proposed_by,
      is_speculative: false,
    };
    await addRound(input);
    setAddingRound(false);
    onRoundsChange();
  };

  const startEdit = (round: Round) => {
    setEditingId(round.id);
    if (round.round_type === "standard") {
      setEditVal1(round.demand?.toString() ?? "");
      setEditVal2(round.offer?.toString() ?? "");
    } else {
      setEditVal1(round.bracket_high?.toString() ?? "");
      setEditVal2(round.bracket_low?.toString() ?? "");
    }
  };

  const saveEdit = async (round: Round) => {
    const v1 = parseFloat(editVal1);
    const v2 = parseFloat(editVal2);
    if (isNaN(v1) || isNaN(v2)) return;

    const updated: Round = {
      ...round,
      midpoint: (v1 + v2) / 2,
      ...(round.round_type === "standard"
        ? { demand: v1, offer: v2 }
        : { bracket_high: v1, bracket_low: v2 }),
    };
    await apiUpdateRound(updated);
    setEditingId(null);
    onRoundsChange();
  };

  const handleEditKeyDown = (e: React.KeyboardEvent, round: Round) => {
    if (e.key === "Enter") saveEdit(round);
    if (e.key === "Escape") setEditingId(null);
  };

  const formatCurrency = (val: number | null) =>
    val != null ? `$${val.toLocaleString()}` : "—";

  return (
    <div
      className="rounded-xl"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center justify-between px-5 py-3">
        <span className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
          Negotiation Rounds
        </span>
        <div className="flex gap-2">
          <button
            className="px-3 py-1 rounded-md text-xs"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
            onClick={() => setAddingRound(true)}
          >
            + Add Round
          </button>
        </div>
      </div>

      {/* Table header */}
      <div
        className="grid px-5 py-2 text-xs font-semibold uppercase tracking-wide"
        style={{
          gridTemplateColumns: "0.5fr 1.5fr 1.5fr 1.5fr 0.5fr",
          color: "var(--text-muted)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div>Round</div>
        <div className="text-right">Demand / High</div>
        <div className="text-right">Offer / Low</div>
        <div className="text-right">Midpoint</div>
        <div></div>
      </div>

      {/* Committed rows */}
      {committedRounds.map((round) => (
        <div
          key={round.id}
          className="grid px-5 py-3 text-sm items-center"
          style={{
            gridTemplateColumns: "0.5fr 1.5fr 1.5fr 1.5fr 0.5fr",
            borderBottom: "1px solid var(--border-light)",
          }}
          onDoubleClick={() => startEdit(round)}
        >
          <div className="font-semibold" style={{ color: "var(--text-secondary)" }}>
            {round.round_number}
            {round.round_type === "bracket" && (
              <span className="ml-1 text-xs" style={{ color: "var(--text-muted)" }}>
                B({round.bracket_proposed_by?.[0].toUpperCase()})
              </span>
            )}
          </div>

          {editingId === round.id ? (
            <>
              <input
                className="text-right px-2 py-1 rounded text-sm outline-none"
                style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--demand)" }}
                value={editVal1}
                onChange={(e) => setEditVal1(e.target.value)}
                onKeyDown={(e) => handleEditKeyDown(e, round)}
                autoFocus
              />
              <input
                className="text-right px-2 py-1 rounded text-sm outline-none"
                style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--offer)" }}
                value={editVal2}
                onChange={(e) => setEditVal2(e.target.value)}
                onKeyDown={(e) => handleEditKeyDown(e, round)}
              />
              <div className="text-right font-semibold" style={{ color: "var(--text-muted)" }}>
                {!isNaN(parseFloat(editVal1)) && !isNaN(parseFloat(editVal2))
                  ? formatCurrency((parseFloat(editVal1) + parseFloat(editVal2)) / 2)
                  : "—"}
              </div>
              <div className="flex gap-1 justify-end">
                <button className="text-xs" style={{ color: "var(--accent)" }} onClick={() => saveEdit(round)}>✓</button>
                <button className="text-xs" style={{ color: "var(--text-muted)" }} onClick={() => setEditingId(null)}>✕</button>
              </div>
            </>
          ) : (
            <>
              <div className="text-right font-medium" style={{ color: "var(--demand)" }}>
                {round.round_type === "standard"
                  ? formatCurrency(round.demand)
                  : formatCurrency(round.bracket_high)}
              </div>
              <div className="text-right font-medium" style={{ color: "var(--offer)" }}>
                {round.round_type === "standard"
                  ? formatCurrency(round.offer)
                  : formatCurrency(round.bracket_low)}
              </div>
              <div className="text-right font-semibold">
                {formatCurrency(round.midpoint)}
              </div>
              <div></div>
            </>
          )}
        </div>
      ))}

      {/* Add round input */}
      {addingRound && (
        <div className="px-5 pb-3">
          <RoundInputRow
            allowBracket={hasStandardWithBoth}
            isSpeculative={false}
            branchFromRound={null}
            onSubmit={handleAdd}
            onCancel={() => setAddingRound(false)}
          />
        </div>
      )}

      {committedRounds.length === 0 && !addingRound && (
        <div className="px-5 py-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
          No rounds yet. Click "+ Add Round" to begin.
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Wire RoundsTable into MediationWorkspace**

In `src/components/MediationWorkspace.tsx`, import `RoundsTable` and replace the placeholder div with:

```tsx
import { RoundsTable } from "./RoundsTable";
```

```tsx
<RoundsTable
  mediationId={mediationId}
  rounds={rounds}
  onRoundsChange={load}
/>
```

- [ ] **Step 4: Verify rounds work**

```bash
npm run tauri dev
```

Expected: Can add standard rounds, see demand/offer/midpoint. Can double-click to edit values. Midpoint recalculates on edit. Bracket option appears after first standard round with both values.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add RoundsTable with inline editing and RoundInputRow"
```

---

## Task 10: Speculative (What-If) Rounds

**Files:**
- Create: `src/components/SpeculativeRounds.tsx`
- Modify: `src/components/RoundsTable.tsx`
- Modify: `src/components/MediationWorkspace.tsx`

- [ ] **Step 1: Create SpeculativeRounds component**

Create `src/components/SpeculativeRounds.tsx`:

```tsx
import { useState } from "react";
import {
  addRound,
  promoteSpeculativeRounds,
  discardSpeculativeRounds,
} from "../api";
import { RoundInputRow } from "./RoundInputRow";
import type { Round, AddRoundInput } from "../types";

interface SpeculativeRoundsProps {
  mediationId: string;
  speculativeRounds: Round[];
  lastCommittedRound: number;
  allowBracket: boolean;
  onRoundsChange: () => void;
}

export function SpeculativeRounds({
  mediationId,
  speculativeRounds,
  lastCommittedRound,
  allowBracket,
  onRoundsChange,
}: SpeculativeRoundsProps) {
  const [addingSpeculative, setAddingSpeculative] = useState(false);

  const handleAdd = async (data: {
    round_type: "standard" | "bracket";
    demand?: number;
    offer?: number;
    bracket_high?: number;
    bracket_low?: number;
    bracket_proposed_by?: "plaintiff" | "defendant";
  }) => {
    const input: AddRoundInput = {
      mediation_id: mediationId,
      round_type: data.round_type,
      demand: data.demand,
      offer: data.offer,
      bracket_high: data.bracket_high,
      bracket_low: data.bracket_low,
      bracket_proposed_by: data.bracket_proposed_by,
      is_speculative: true,
      branch_from_round: lastCommittedRound,
    };
    await addRound(input);
    setAddingSpeculative(false);
    onRoundsChange();
  };

  const handlePromote = async (roundNumber: number) => {
    await promoteSpeculativeRounds(mediationId, roundNumber);
    onRoundsChange();
  };

  const handleDiscard = async (roundNumber: number) => {
    await discardSpeculativeRounds(mediationId, roundNumber);
    onRoundsChange();
  };

  const formatCurrency = (val: number | null) =>
    val != null ? `$${val.toLocaleString()}` : "—";

  if (speculativeRounds.length === 0 && !addingSpeculative) return null;

  return (
    <div
      className="rounded-lg ml-5 mr-5 mb-3"
      style={{
        background: "var(--speculative-bg)",
        borderLeft: "3px solid var(--speculative-border)",
      }}
    >
      <div className="px-4 py-2 flex items-center justify-between">
        <span
          className="text-xs font-semibold uppercase tracking-wide"
          style={{ color: "var(--speculative-text)" }}
        >
          What-If from Round {lastCommittedRound}
        </span>
        <button
          className="text-xs px-2 py-1 rounded"
          style={{
            background: "var(--speculative-bg)",
            border: "1px solid var(--speculative-border)",
            color: "var(--speculative-text)",
          }}
          onClick={() => setAddingSpeculative(true)}
        >
          + Add
        </button>
      </div>

      {speculativeRounds.map((round) => (
        <div
          key={round.id}
          className="grid px-4 py-2.5 text-sm items-center"
          style={{
            gridTemplateColumns: "0.5fr 1.5fr 1.5fr 1.5fr 0.5fr",
            borderBottom: "1px solid var(--speculative-border)",
            borderBottomWidth: "0.5px",
          }}
        >
          <div className="font-semibold" style={{ color: "var(--speculative-text)" }}>
            {round.round_number}?
          </div>
          <div className="text-right font-medium italic" style={{ color: "var(--demand)" }}>
            {round.round_type === "standard"
              ? formatCurrency(round.demand)
              : formatCurrency(round.bracket_high)}
          </div>
          <div className="text-right font-medium italic" style={{ color: "var(--offer)" }}>
            {round.round_type === "standard"
              ? formatCurrency(round.offer)
              : formatCurrency(round.bracket_low)}
          </div>
          <div className="text-right font-semibold italic">
            {formatCurrency(round.midpoint)}
          </div>
          <div className="flex gap-2 justify-end">
            <button
              className="text-xs"
              title="Commit this round"
              style={{ color: "var(--status-settled-text)" }}
              onClick={() => handlePromote(round.round_number)}
            >
              ✓
            </button>
            <button
              className="text-xs"
              title="Discard"
              style={{ color: "var(--demand)" }}
              onClick={() => handleDiscard(round.round_number)}
            >
              ✕
            </button>
          </div>
        </div>
      ))}

      {addingSpeculative && (
        <div className="px-4 pb-3">
          <RoundInputRow
            allowBracket={allowBracket}
            isSpeculative={true}
            branchFromRound={lastCommittedRound}
            onSubmit={handleAdd}
            onCancel={() => setAddingSpeculative(false)}
          />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Add What-If button to RoundsTable**

In `src/components/RoundsTable.tsx`, add a What-If button next to "+ Add Round":

```tsx
<button
  className="px-3 py-1 rounded-md text-xs"
  style={{
    background: "var(--speculative-bg)",
    border: "1px solid var(--speculative-border)",
    color: "var(--speculative-text)",
  }}
  onClick={() => onStartWhatIf?.()}
>
  + What-If
</button>
```

Add the prop to the interface:

```tsx
interface RoundsTableProps {
  mediationId: string;
  rounds: Round[];
  onRoundsChange: () => void;
  onStartWhatIf?: () => void;
}
```

- [ ] **Step 3: Wire SpeculativeRounds into MediationWorkspace**

In `src/components/MediationWorkspace.tsx`:

```tsx
import { SpeculativeRounds } from "./SpeculativeRounds";
```

Add state and logic:

```tsx
const [showWhatIf, setShowWhatIf] = useState(false);
const committedRounds = rounds.filter((r) => !r.is_speculative);
const speculativeRounds = rounds.filter((r) => r.is_speculative);
const lastCommittedRound = committedRounds.length > 0
  ? Math.max(...committedRounds.map((r) => r.round_number))
  : 0;
const hasStandardWithBoth = committedRounds.some(
  (r) => r.round_type === "standard" && r.demand != null && r.offer != null
);
```

Render below RoundsTable:

```tsx
<RoundsTable
  mediationId={mediationId}
  rounds={rounds}
  onRoundsChange={load}
  onStartWhatIf={() => setShowWhatIf(true)}
/>
{(showWhatIf || speculativeRounds.length > 0) && (
  <SpeculativeRounds
    mediationId={mediationId}
    speculativeRounds={speculativeRounds}
    lastCommittedRound={lastCommittedRound}
    allowBracket={hasStandardWithBoth}
    onRoundsChange={load}
  />
)}
```

- [ ] **Step 4: Verify what-if branching works**

```bash
npm run tauri dev
```

Expected: After adding committed rounds, clicking "What-If" shows amber speculative section. Can add speculative rounds. Promote (✓) commits them. Discard (✕) removes them.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add speculative what-if rounds with promote/discard"
```

---

## Task 11: Convergence Chart

**Files:**
- Create: `src/components/ConvergenceChart.tsx`
- Modify: `src/components/MediationWorkspace.tsx`

- [ ] **Step 1: Create ConvergenceChart component**

Create `src/components/ConvergenceChart.tsx`:

```tsx
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
} from "recharts";
import type { Round } from "../types";

interface ConvergenceChartProps {
  rounds: Round[];
}

export function ConvergenceChart({ rounds }: ConvergenceChartProps) {
  if (rounds.length === 0) return null;

  const committed = rounds.filter((r) => !r.is_speculative);
  const speculative = rounds.filter((r) => r.is_speculative);

  const chartData = committed.map((r) => ({
    name: `R${r.round_number}`,
    demand: r.round_type === "standard" ? r.demand : r.bracket_high,
    offer: r.round_type === "standard" ? r.offer : r.bracket_low,
    midpoint: r.midpoint,
    bracketHigh: r.round_type === "bracket" ? r.bracket_high : null,
    bracketLow: r.round_type === "bracket" ? r.bracket_low : null,
  }));

  const specData = speculative.map((r) => ({
    name: `R${r.round_number}?`,
    demand: r.round_type === "standard" ? r.demand : r.bracket_high,
    offer: r.round_type === "standard" ? r.offer : r.bracket_low,
    midpoint: r.midpoint,
  }));

  // Merge: last committed + speculative for continuity
  const fullData = [
    ...chartData,
    ...specData.map((d) => ({ ...d, isSpeculative: true })),
  ];

  const demandColor = getComputedStyle(document.documentElement)
    .getPropertyValue("--demand")
    .trim() || "#dc2626";
  const offerColor = getComputedStyle(document.documentElement)
    .getPropertyValue("--offer")
    .trim() || "#2563eb";
  const mutedColor = getComputedStyle(document.documentElement)
    .getPropertyValue("--text-muted")
    .trim() || "#9ca3af";

  return (
    <div
      className="rounded-xl p-5"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
    >
      <div
        className="text-sm font-semibold mb-4"
        style={{ color: "var(--text-secondary)" }}
      >
        Negotiation Convergence
      </div>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={fullData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
          <XAxis
            dataKey="name"
            tick={{ fill: mutedColor, fontSize: 12 }}
            axisLine={{ stroke: "var(--border)" }}
          />
          <YAxis
            tick={{ fill: mutedColor, fontSize: 12 }}
            axisLine={{ stroke: "var(--border)" }}
            tickFormatter={(val: number) =>
              val >= 1000 ? `$${(val / 1000).toFixed(0)}K` : `$${val}`
            }
          />
          <Tooltip
            formatter={(value: number) => [`$${value.toLocaleString()}`, ""]}
            contentStyle={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              color: "var(--text-primary)",
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="demand"
            stroke={demandColor}
            strokeWidth={2.5}
            dot={{ fill: demandColor, r: 4 }}
            name="Demand"
          />
          <Line
            type="monotone"
            dataKey="offer"
            stroke={offerColor}
            strokeWidth={2.5}
            dot={{ fill: offerColor, r: 4 }}
            name="Offer"
          />
          <Line
            type="monotone"
            dataKey="midpoint"
            stroke={mutedColor}
            strokeWidth={2}
            strokeDasharray="6 4"
            dot={{ fill: mutedColor, r: 3 }}
            name="Midpoint"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 2: Wire into MediationWorkspace**

In `src/components/MediationWorkspace.tsx`:

```tsx
import { ConvergenceChart } from "./ConvergenceChart";
```

Add below the SpeculativeRounds component:

```tsx
<ConvergenceChart rounds={rounds} />
```

- [ ] **Step 3: Verify chart renders**

```bash
npm run tauri dev
```

Expected: After adding 2+ rounds, chart appears showing demand (red) trending down, offer (blue) trending up, midpoint (gray dashed) between them. Speculative rounds appear as continuation of lines.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add convergence chart with Recharts"
```

---

## Task 12: Variations Table

**Files:**
- Create: `src/components/VariationsTable.tsx`
- Modify: `src/components/MediationWorkspace.tsx`

- [ ] **Step 1: Create VariationsTable component**

Create `src/components/VariationsTable.tsx`:

```tsx
import { useState, useEffect } from "react";
import { getVariations } from "../api";
import type { Variation, Round } from "../types";

interface VariationsTableProps {
  latestRound: Round | null;
}

export function VariationsTable({ latestRound }: VariationsTableProps) {
  const [variations, setVariations] = useState<Variation[]>([]);

  useEffect(() => {
    if (!latestRound) {
      setVariations([]);
      return;
    }
    const demand =
      latestRound.round_type === "standard"
        ? latestRound.demand
        : latestRound.bracket_high;
    if (demand == null) return;

    getVariations(latestRound.midpoint, demand, 8).then(setVariations).catch(console.error);
  }, [latestRound]);

  const formatCurrency = (val: number) => `$${val.toLocaleString()}`;

  if (!latestRound || variations.length === 0) {
    return (
      <div
        className="rounded-xl p-5"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        <div className="text-sm font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
          Variations
        </div>
        <div className="text-sm" style={{ color: "var(--text-muted)" }}>
          Add rounds to see variations.
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl p-5"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
    >
      <div className="text-sm font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>
        Variations from Round {latestRound.round_number}
      </div>
      <div className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
        If midpoint stays at {formatCurrency(latestRound.midpoint)}...
      </div>

      <div
        className="grid px-2 py-1.5 text-xs font-semibold uppercase"
        style={{
          gridTemplateColumns: "1fr 1fr",
          color: "var(--text-muted)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div>Demand</div>
        <div className="text-right">Offer Needed</div>
      </div>

      {variations.map((v, i) => (
        <div
          key={i}
          className="grid px-2 py-2 text-sm"
          style={{
            gridTemplateColumns: "1fr 1fr",
            borderBottom: "1px solid var(--border-light)",
          }}
        >
          <div style={{ color: "var(--demand)" }}>{formatCurrency(v.demand)}</div>
          <div className="text-right" style={{ color: "var(--offer)" }}>
            {formatCurrency(v.offer_needed)}
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Wire into MediationWorkspace**

In `src/components/MediationWorkspace.tsx`:

```tsx
import { VariationsTable } from "./VariationsTable";
```

Compute latest round:

```tsx
const allRoundsForVariations = [...committedRounds, ...speculativeRounds];
const latestRound = allRoundsForVariations.length > 0
  ? allRoundsForVariations[allRoundsForVariations.length - 1]
  : null;
```

Add in the bottom two-column grid:

```tsx
<div className="grid grid-cols-2 gap-5">
  <VariationsTable latestRound={latestRound} />
  {/* Notes editor will go here */}
  <div
    className="rounded-xl p-5"
    style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
  >
    Notes editor coming next.
  </div>
</div>
```

- [ ] **Step 3: Verify variations table works**

```bash
npm run tauri dev
```

Expected: After adding rounds, variations table shows demand/offer pairs that produce the same midpoint. Auto-updates when new rounds are added.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add variations table with auto-calculated demand/offer pairs"
```

---

## Task 13: Notes Editor

**Files:**
- Create: `src/components/NotesEditor.tsx`
- Modify: `src/components/MediationWorkspace.tsx`

- [ ] **Step 1: Create NotesEditor component**

Create `src/components/NotesEditor.tsx`:

```tsx
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import type { Mediation } from "../types";

interface NotesEditorProps {
  mediation: Mediation;
  onUpdate: (field: keyof Mediation, value: string) => void;
}

export function NotesEditor({ mediation, onUpdate }: NotesEditorProps) {
  const [editing, setEditing] = useState(false);
  const [localNotes, setLocalNotes] = useState(mediation.notes);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setLocalNotes(mediation.notes);
  }, [mediation.notes]);

  const handleChange = (val: string) => {
    setLocalNotes(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onUpdate("notes", val);
    }, 2000);
  };

  const handleBlur = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    onUpdate("notes", localNotes);
    setEditing(false);
  };

  const toggleFormat = () => {
    const newFormat = mediation.notes_format === "markdown" ? "raw" : "markdown";
    onUpdate("notes_format", newFormat);
  };

  const isMarkdown = mediation.notes_format === "markdown";

  return (
    <div
      className="rounded-xl p-5"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
          Notes
        </span>
        <div
          className="flex gap-0.5 rounded-md p-0.5"
          style={{ background: "var(--bg-input)" }}
        >
          <button
            className="px-2.5 py-1 rounded text-xs font-semibold"
            style={{
              background: isMarkdown ? "var(--bg-card)" : "transparent",
              color: isMarkdown ? "var(--text-secondary)" : "var(--text-muted)",
              boxShadow: isMarkdown ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
            }}
            onClick={() => {
              if (!isMarkdown) toggleFormat();
            }}
          >
            Markdown
          </button>
          <button
            className="px-2.5 py-1 rounded text-xs"
            style={{
              background: !isMarkdown ? "var(--bg-card)" : "transparent",
              color: !isMarkdown ? "var(--text-secondary)" : "var(--text-muted)",
              boxShadow: !isMarkdown ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
            }}
            onClick={() => {
              if (isMarkdown) toggleFormat();
            }}
          >
            Raw
          </button>
        </div>
      </div>

      {isMarkdown && !editing ? (
        <div
          className="px-3 py-3 rounded-md min-h-[120px] text-sm leading-relaxed cursor-text prose prose-sm max-w-none"
          style={{
            background: "var(--bg-input)",
            border: "1px solid var(--border)",
            color: "var(--text-secondary)",
          }}
          onClick={() => {
            setEditing(true);
            setTimeout(() => textareaRef.current?.focus(), 0);
          }}
        >
          {localNotes ? (
            <ReactMarkdown>{localNotes}</ReactMarkdown>
          ) : (
            <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
              Click to add notes...
            </span>
          )}
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          className="w-full px-3 py-3 rounded-md min-h-[120px] text-sm leading-relaxed outline-none resize-y"
          style={{
            background: "var(--bg-input)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
          }}
          value={localNotes}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          placeholder="Add notes..."
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Wire into MediationWorkspace**

In `src/components/MediationWorkspace.tsx`:

```tsx
import { NotesEditor } from "./NotesEditor";
```

Replace the notes placeholder in the bottom grid:

```tsx
<div className="grid grid-cols-2 gap-5">
  <VariationsTable latestRound={latestRound} />
  <NotesEditor mediation={mediation} onUpdate={handleFieldUpdate} />
</div>
```

- [ ] **Step 3: Verify notes editor works**

```bash
npm run tauri dev
```

Expected: Notes editor shows with Markdown/Raw toggle. In markdown mode, clicking shows editor, blurring renders markdown. Autosaves after 2 seconds. Switching to raw shows plain textarea.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add NotesEditor with markdown/raw toggle and autosave"
```

---

## Task 14: Final Integration and Polish

**Files:**
- Modify: `src/components/MediationWorkspace.tsx` (final assembly)
- Modify: `src-tauri/tauri.conf.json` (window title, size)

- [ ] **Step 1: Configure Tauri window**

In `src-tauri/tauri.conf.json`, set window properties:

```json
{
  "app": {
    "windows": [
      {
        "title": "Gladice",
        "width": 1200,
        "height": 800,
        "minWidth": 900,
        "minHeight": 600
      }
    ]
  }
}
```

- [ ] **Step 2: Verify full workspace flow end-to-end**

```bash
npm run tauri dev
```

Walk through the full flow:
1. Landing page loads with empty state
2. Click "+ New Mediation" — new tab opens
3. Fill in metadata fields — autosaves, tab label updates
4. Add standard rounds — table populates, midpoint calculates
5. Chart updates with each round
6. Add a bracket round (after first standard round) — shows in table with "B(P)" or "B(D)" indicator
7. Click "What-If" — amber section appears, add speculative rounds
8. Promote or discard speculative rounds
9. Variations table updates with each round
10. Notes editor works with markdown/raw toggle
11. Status badge changes mediation status
12. Switch themes — all components re-theme
13. Go back to Home tab — mediation appears in list with updated fields
14. Click mediation in list — focuses existing tab
15. Close mediation tab — returns to Home

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: configure window size and complete Gladice v1 integration"
```

---

## Task 15: Build Release Binary

**Files:** None new

- [ ] **Step 1: Build release**

```bash
npm run tauri build
```

Expected: Produces a `.dmg` or `.app` bundle in `src-tauri/target/release/bundle/`.

- [ ] **Step 2: Test the built app**

Open the generated `.app` from the bundle directory. Verify all features work outside of dev mode.

- [ ] **Step 3: Commit any build config changes**

```bash
git add -A
git commit -m "chore: verify release build configuration"
```
