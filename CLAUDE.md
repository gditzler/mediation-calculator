# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is this?

This is a **mediation app** — a Tauri v2 desktop app for tracking negotiation rounds (demands, offers, brackets) and computing midpoints/variations. It uses a React/TypeScript frontend with a Rust backend backed by SQLite.

## Build and Development Commands

```bash
# Run in development mode (starts both Vite dev server and Tauri window)
npx tauri dev

# Build production .app bundle
npx tauri build

# Run Rust backend tests
cd src-tauri && cargo test

# Run a specific Rust test
cd src-tauri && cargo test test_midpoint_standard

# Type-check the frontend
npx tsc --noEmit

# Install frontend dependencies
npm install
```

## Architecture

### Frontend (src/)

React 18 + TypeScript + Tailwind CSS 4 + Vite. No router — uses a tab-based navigation system.

- **`App.tsx`** — Root component: wraps `ThemeProvider` > `TabProvider` > renders `TabBar` + either `LandingPage` (home tab) or `MediationWorkspace` (mediation tab)
- **`api.ts`** — All Tauri `invoke()` calls, typed wrappers for every backend command. Every backend interaction goes through this file.
- **`types.ts`** — Shared TypeScript interfaces (`Mediation`, `Round`, `AddRoundInput`, `Variation`, `Tab`, etc.)
- **`context/TabContext.tsx`** — Tab state via `useReducer` with actions: `OPEN_MEDIATION`, `CLOSE_TAB`, `SET_ACTIVE`, `UPDATE_LABEL`
- **`context/ThemeContext.tsx`** — Theme persistence via backend `get_setting`/`set_setting` commands
- **`components/MediationWorkspace.tsx`** — Main workspace: metadata panel, rounds table, speculative rounds, convergence chart, variations table, notes editor

### Backend (src-tauri/)

Rust with Tauri v2, rusqlite (bundled SQLite), serde, chrono, uuid.

- **`lib.rs`** — App setup: initializes SQLite database in app data dir, registers all Tauri commands
- **`db.rs`** — Database layer: all SQL queries via rusqlite with `Mutex<Connection>`, WAL mode, foreign keys enabled
- **`models.rs`** — Serde structs: `Mediation`, `Round`, `Setting`, `MediationSummary`
- **`calculations.rs`** — Pure math: midpoint computation, variation generation, with unit tests
- **`commands/`** — Tauri command handlers: `mediations.rs` (CRUD + autocomplete), `rounds.rs` (CRUD + speculative round promote/discard + variations), `settings.rs` (key-value store)
- **`migrations/001_initial.sql`** — Schema: `mediations`, `rounds`, `settings` tables. Runs on every app start via `CREATE TABLE IF NOT EXISTS`

### Component Hierarchy

```
App → ThemeProvider → TabProvider → AppContent
  ├── TabBar
  ├── LandingPage (home tab)
  │   └── Search + status filter + mediation list
  └── MediationWorkspace (per mediation tab)
      ├── MetadataPanel (collapsible, with AutocompleteInput fields)
      ├── StatusBadge (dropdown)
      ├── RoundsTable → RoundInputRow
      ├── SpeculativeRounds → RoundInputRow (promote/discard buttons)
      ├── ConvergenceChart (Recharts)
      ├── VariationsTable
      └── NotesEditor (markdown/raw toggle, 2s autosave)
```

### Data Flow

Frontend calls `invoke("command_name", { args })` → Tauri routes to a `#[tauri::command]` handler in `commands/` → handler calls `Database` methods in `db.rs` → results serialized back to frontend via serde.

### Key Domain Concepts

- **Round types**: `"standard"` (demand + offer → midpoint) and `"bracket"` (bracket_high + bracket_low → midpoint, with `bracket_proposed_by`)
- **Speculative rounds**: What-if rounds (`is_speculative: true`) that branch from a real round. Can be promoted to real or discarded.
- **Variations**: Given a midpoint and current demand, generates demand/offer_needed pairs. Step size: `10^(floor(log10(demand)) - 1)`. Formula: `offer_needed = 2 * midpoint - demand`.
- **Mediation statuses**: `in_progress`, `settled`, `impasse`, `adjourned`

### Theme System

Six themes defined in `src/themes/themes.ts` as CSS custom property maps: `light`, `dark`, `solarized-light`, `solarized-dark`, `nord-light`, `nord-dark`. `applyTheme()` sets CSS variables on `document.documentElement`. Persisted via the backend `settings` table (key: `"theme"`).

### Database

SQLite stored at the OS app data directory (`tauri::path::app_data_dir()`). File: `gladice.db`. Uses WAL journal mode and foreign keys. Rounds cascade-delete when their mediation is deleted. All access serialized through `Arc<Mutex<Connection>>` in Tauri state.

### Autosave Patterns

- **Metadata fields**: 1-second debounce, updates tab label as "Plaintiff v. Defendant"
- **Notes editor**: 2-second debounce
- **Autocomplete fields**: 200ms debounce, backend validates field names against a whitelist
