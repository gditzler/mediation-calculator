# Mediation App

A desktop app for tracking negotiation rounds (demands, offers, brackets) and computing midpoints and variations.

Built with [Tauri v2](https://v2.tauri.app/), React, TypeScript, and SQLite.

## Features

- **Round tracking** — Record demands, offers, and bracket proposals across multiple negotiation rounds
- **Midpoint calculation** — Automatically compute midpoints for standard and bracket rounds
- **Speculative rounds** — Explore what-if scenarios that can be promoted to real rounds or discarded
- **Variations table** — Generate demand/offer pairs around a midpoint to visualize negotiation options
- **Convergence chart** — Visualize how demands and offers converge over rounds
- **Notes** — Markdown-enabled notes per mediation with autosave
- **Multi-tab workspace** — Work on multiple mediations simultaneously
- **Themes** — Six built-in themes

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://www.rust-lang.org/tools/install) (stable)
- [Tauri v2 prerequisites](https://v2.tauri.app/start/prerequisites/)

## Getting Started

```bash
# Install frontend dependencies
npm install

# Run in development mode
npx tauri dev

# Build production .app bundle
npx tauri build
```

## Running Tests

```bash
# Rust backend tests
cd src-tauri && cargo test

# Frontend type-check
npx tsc --noEmit
```

## Architecture

| Layer | Stack |
|-------|-------|
| Frontend | React 18, TypeScript, Tailwind CSS 4, Recharts, Vite |
| Backend | Rust, Tauri v2, rusqlite (bundled SQLite) |
| Data | SQLite with WAL mode, stored in OS app data directory |

## License

All rights reserved.
