# Gladice — Mediation Midpoint Calculator

**Date:** 2026-03-20
**Status:** Draft

## Overview

Gladice is a desktop application for legal mediators to track settlement negotiations. It replicates the core functionality of the [Steve Mehta Midpoint Calculator](https://stevemehta.com/midpoint-calculator/) — computing midpoints between opposing parties' positions — while adding persistent storage, round-by-round history, what-if branching, bracket support, and a convergence chart.

The app targets macOS first, with a cross-platform architecture that supports Windows in the future.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop shell | Tauri 2.0 (Rust) |
| Frontend | React + TypeScript |
| Styling | TailwindCSS with CSS custom properties for theming |
| Database | SQLite via tauri-plugin-sql |
| Charting | Recharts (React-native, composable, lightweight) |

Tauri provides a small bundle (~5-10MB), low memory footprint, and native OS integration. The Rust backend handles all database operations and business logic. The React frontend is purely presentational.

## Data Model

### mediations

| Field | Type | Notes |
|-------|------|-------|
| id | TEXT (UUID) | Primary key |
| plaintiff | TEXT | Autocomplete from history |
| defendant | TEXT | Autocomplete from history |
| defense_firm | TEXT | Autocomplete from history |
| counsel | TEXT | Autocomplete from history |
| mediator | TEXT | Autocomplete from history |
| status | TEXT | "in_progress", "settled", "impasse", "adjourned" |
| notes | TEXT | Markdown or raw text content |
| notes_format | TEXT | "markdown" or "raw" |
| created_at | TEXT (ISO 8601) | |
| updated_at | TEXT (ISO 8601) | |

### rounds

| Field | Type | Notes |
|-------|------|-------|
| id | TEXT (UUID) | Primary key |
| mediation_id | TEXT (UUID) | FK to mediations |
| round_number | INTEGER | Sequential within mediation |
| round_type | TEXT | "standard" or "bracket" |
| demand | REAL | Plaintiff's position (standard rounds) |
| offer | REAL | Defendant's position (standard rounds) |
| bracket_high | REAL | High end of bracket (bracket rounds) |
| bracket_low | REAL | Low end of bracket (bracket rounds) |
| bracket_proposed_by | TEXT | "plaintiff" or "defendant" (bracket rounds) |
| midpoint | REAL | Computed: (demand + offer) / 2 or (bracket_high + bracket_low) / 2 |
| is_speculative | INTEGER | 1 = what-if branch, 0 = committed |
| branch_from_round | INTEGER | Which committed round this branches from (null if committed) |
| created_at | TEXT (ISO 8601) | |

**Bracket rule:** Bracket rounds are only available after at least one standard round with both a demand and an offer exists. Either party (plaintiff or defendant) can propose a bracket.

### settings

| Field | Type | Notes |
|-------|------|-------|
| key | TEXT | Primary key (e.g., "theme") |
| value | TEXT | e.g., "nord-dark" |

## Architecture

### Backend (Rust / Tauri)

- **Database abstraction layer:** Trait-based interface over SQLite, so the storage backend can be swapped for a remote API in the future without changing the frontend.
- **Tauri commands** exposed to the frontend via `invoke()`:
  - CRUD for mediations (create, read, update, delete, list, search)
  - CRUD for rounds (add, edit, delete, promote speculative, discard speculative)
  - Autocomplete queries (distinct values for each metadata field)
  - Settings read/write
- **Business logic in Rust:** Midpoint calculation, round validation (bracket availability check), variation generation.

### Frontend (React + TypeScript)

- **State management:** React Context + useReducer for tab state and active mediation. No external state library needed.
- **Routing:** Tab-based, not URL-based. The landing page is a permanent "Home" tab. Each opened mediation gets its own tab with independent local state.
- **Styling:** TailwindCSS with CSS custom properties per theme. Theme changes apply immediately without restart.

### Component Structure

| Component | Purpose |
|-----------|---------|
| `TabBar` | Manages open tabs; Home tab always pinned, mediation tabs closeable |
| `LandingPage` | Search, filter by status, mediation list, "New Mediation" button |
| `MediationWorkspace` | Main workspace for a single mediation |
| `MetadataPanel` | Collapsible case details with autocomplete fields |
| `RoundsTable` | Growing table of committed rounds with inline editing |
| `SpeculativeRounds` | Amber-highlighted what-if rounds with promote/discard controls |
| `ConvergenceChart` | Full-width line chart showing demand/offer/midpoint over rounds |
| `VariationsTable` | "If demand is X, offer must be Y" quick-reference grid |
| `NotesEditor` | Markdown/raw toggle with rendered preview |
| `StatusBadge` | Color-coded status indicator with dropdown to change |
| `ThemeSelector` | Dropdown in top-right corner |

### Data Flow

1. Frontend calls Tauri `invoke()` commands.
2. Rust handles DB read/write, returns typed data.
3. Frontend renders from returned data.
4. Autocomplete fields query Rust on keystroke (debounced).
5. All changes autosave to SQLite.

## UI Layout

### Landing Page (Home Tab)

- **Top bar:** App name ("Gladice"), theme selector in top-right.
- **Tab bar:** Pinned "Home" tab, closeable mediation tabs.
- **Search bar:** SQL LIKE-based search across plaintiff, defendant, mediator, counsel, defense firm. Sufficient for the expected local dataset size (hundreds to low thousands of mediations).
- **Status filter:** Dropdown to filter by status (All, In Progress, Settled, Impasse, Adjourned).
- **"+ New Mediation" button:** Prominently placed next to search bar.
- **Mediation list:** Sortable table showing plaintiff, defendant, mediator, status (color-coded badge), last updated date. Clicking a row opens it in a new tab.

### Mediation Workspace (Per-Tab)

Top to bottom:

1. **Title row:** "{Plaintiff} v. {Defendant}" auto-generated title, clickable status badge, Save and Export buttons.
2. **Metadata panel (collapsible):** Grid of case detail fields (plaintiff, defendant, defense firm, counsel, mediator) with autocomplete. Collapsed view shows a summary line.
3. **Rounds table:** Column headers: Round, Demand/High, Offer/Low, Midpoint, Type indicator. Standard rounds show demand (red) and offer (blue). Bracket rounds show high/low with a "Bracket" label and who proposed it. "Add Round" and "What-If" buttons in the header. Inline editing via double-click.
4. **Convergence chart (full-width):** Line chart with demand (red line), offer (blue line), midpoint (dashed gray line). Bracket rounds shown as a range band. Speculative rounds shown as dashed lines. Legend at bottom.
5. **Bottom row (two-column):** Variations table (left) and Notes editor (right).

## Interaction Behaviors

### Round Entry

- "Add Round" opens an inline row at the bottom of the table.
- User chooses round type: Standard (demand/offer) or Bracket (high/low + who proposed).
- Bracket option only available after at least one demand and one offer exist.
- Midpoint auto-calculates as soon as both values are entered.
- Enter/Tab to confirm, Escape to cancel.

### Editing Rounds

- Double-click any value in the rounds table to edit inline.
- Midpoint recalculates automatically.
- This is for fixing mistakes, not exploration (use what-if branching for that).

### What-If Branching

- "What-If" button creates a visually distinct amber section branching from the last committed round.
- User can add multiple speculative rounds (standard or bracket).
- Each speculative round has promote (commit) or discard buttons.
- Promoting a round commits it and all preceding speculative rounds.
- Discarding removes the round and any speculative rounds after it.
- Chart shows speculative rounds as dashed lines.

### Variations Table

- Auto-updates based on the most recent round's midpoint.
- Shows demand/offer pairs that would produce the same midpoint.
- Increment size auto-adjusts based on value magnitude: `step = 10^(floor(log10(demand)) - 1)`. For example, a $350,000 demand uses $10,000 steps; a $35,000 demand uses $1,000 steps.

### Notes

- Toggle between Markdown (rendered preview) and Raw (plain text editor).
- Autosaves on blur or after 2 seconds of inactivity.
- In markdown mode, clicking rendered text switches to edit mode.

### Autosave

- All changes (rounds, metadata, notes, status) autosave to SQLite.
- The Save button provides manual save confirmation with visual feedback.
- Unsaved indicator shown if autosave fails.

### Tabs

- Home tab always pinned, cannot be closed.
- Clicking a mediation row on the landing page opens it in a new tab (or focuses existing tab if already open).
- Close button on each mediation tab.
- Tab label shows "{Plaintiff} v. {Defendant}".

## Themes

Six themes available, persisted to the settings table:

| Theme | Description |
|-------|-------------|
| Light | Clean whites/grays (default, Claude-inspired) |
| Dark | Dark grays/near-black |
| Solarized Light | Warm cream/beige tones |
| Solarized Dark | Deep blue-gray |
| Nord Light | Cool snow whites |
| Nord Dark | Arctic blue-dark |

Implemented via CSS custom properties. Theme selector in the top-right corner. Changes apply immediately.

## Midpoint Calculations

### Standard Round

```
midpoint = (demand + offer) / 2
```

### Bracket Round

```
midpoint = (bracket_high + bracket_low) / 2
```

Bracket rounds are available only after at least one standard round exists with both a demand and an offer. Either party can propose a bracket.

### Variations

Given a target midpoint, generate a table of (demand, offer) pairs:

```
For each demand in [current_demand - n*step, ..., current_demand + n*step]:
    offer_needed = 2 * midpoint - demand
```

Step size auto-adjusts based on magnitude of the demand value.

## Future Considerations

- **Cloud sync:** The trait-based database abstraction allows swapping SQLite for a remote API without frontend changes.
- **Windows support:** Tauri 2.0 supports Windows natively; no architectural changes needed.
- **Additional metadata fields:** The metadata panel and database schema are designed to be easily extended.
- **Export:** The Export button is stubbed in the UI but not functional in v1. Export formats (PDF, CSV) will be implemented in a future iteration.
