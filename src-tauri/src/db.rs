use crate::models::{Mediation, MediationSummary, Round};
use rusqlite::{params, Connection, Result as SqlResult};
use std::sync::Mutex;

pub struct Database {
    conn: Mutex<Connection>,
}

impl Database {
    pub fn new(db_path: &str) -> SqlResult<Self> {
        let conn = Connection::open(db_path)?;
        conn.execute_batch("PRAGMA journal_mode=WAL;")?;
        conn.execute_batch("PRAGMA foreign_keys=ON;")?;

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
        // 002: add mediation_date column to existing databases
        let _ = conn.execute_batch(include_str!("../migrations/002_add_mediation_date.sql"));
        // 003: add per-side timestamps and bracket_response to rounds
        let _ = conn.execute_batch(include_str!("../migrations/003_add_move_timestamps.sql"));
        Ok(())
    }

    // ── Mediations ──────────────────────────────────────────────────────

    pub fn create_mediation(&self, mediation: &Mediation) -> SqlResult<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO mediations (id, plaintiff, defendant, defense_firm, counsel, mediator, status, notes, notes_format, mediation_date, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
            params![
                mediation.id,
                mediation.plaintiff,
                mediation.defendant,
                mediation.defense_firm,
                mediation.counsel,
                mediation.mediator,
                mediation.status,
                mediation.notes,
                mediation.notes_format,
                mediation.mediation_date,
                mediation.created_at,
                mediation.updated_at,
            ],
        )?;
        Ok(())
    }

    pub fn get_mediation(&self, id: &str) -> SqlResult<Mediation> {
        let conn = self.conn.lock().unwrap();
        conn.query_row(
            "SELECT id, plaintiff, defendant, defense_firm, counsel, mediator, status, notes, notes_format, mediation_date, created_at, updated_at
             FROM mediations WHERE id = ?1",
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
                    mediation_date: row.get(9)?,
                    created_at: row.get(10)?,
                    updated_at: row.get(11)?,
                })
            },
        )
    }

    pub fn update_mediation(&self, mediation: &Mediation) -> SqlResult<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE mediations SET plaintiff = ?1, defendant = ?2, defense_firm = ?3, counsel = ?4, mediator = ?5, status = ?6, notes = ?7, notes_format = ?8, mediation_date = ?9, updated_at = ?10
             WHERE id = ?11",
            params![
                mediation.plaintiff,
                mediation.defendant,
                mediation.defense_firm,
                mediation.counsel,
                mediation.mediator,
                mediation.status,
                mediation.notes,
                mediation.notes_format,
                mediation.mediation_date,
                mediation.updated_at,
                mediation.id,
            ],
        )?;
        Ok(())
    }

    pub fn delete_mediation(&self, id: &str) -> SqlResult<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM mediations WHERE id = ?1", params![id])?;
        Ok(())
    }

    pub fn list_mediations(
        &self,
        search: Option<&str>,
        status: Option<&str>,
    ) -> SqlResult<Vec<MediationSummary>> {
        let conn = self.conn.lock().unwrap();

        let mut sql = String::from(
            "SELECT id, plaintiff, defendant, mediator, status, updated_at FROM mediations WHERE 1=1",
        );
        let mut param_values: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();

        if let Some(search_term) = search {
            if !search_term.is_empty() {
                let like = format!("%{}%", search_term);
                sql.push_str(
                    " AND (plaintiff LIKE ? OR defendant LIKE ? OR mediator LIKE ? OR counsel LIKE ? OR defense_firm LIKE ?)",
                );
                for _ in 0..5 {
                    param_values.push(Box::new(like.clone()));
                }
            }
        }

        if let Some(status_filter) = status {
            if !status_filter.is_empty() {
                sql.push_str(" AND status = ?");
                param_values.push(Box::new(status_filter.to_string()));
            }
        }

        sql.push_str(" ORDER BY updated_at DESC");

        let param_refs: Vec<&dyn rusqlite::types::ToSql> =
            param_values.iter().map(|p| p.as_ref()).collect();

        let mut stmt = conn.prepare(&sql)?;
        let rows = stmt.query_map(param_refs.as_slice(), |row| {
            Ok(MediationSummary {
                id: row.get(0)?,
                plaintiff: row.get(1)?,
                defendant: row.get(2)?,
                mediator: row.get(3)?,
                status: row.get(4)?,
                updated_at: row.get(5)?,
            })
        })?;

        let mut results = Vec::new();
        for row in rows {
            results.push(row?);
        }
        Ok(results)
    }

    pub fn autocomplete_field(
        &self,
        field: &str,
        prefix: &str,
    ) -> SqlResult<Vec<String>> {
        const ALLOWED_FIELDS: &[&str] = &[
            "plaintiff",
            "defendant",
            "defense_firm",
            "counsel",
            "mediator",
        ];

        if !ALLOWED_FIELDS.contains(&field) {
            return Ok(Vec::new());
        }

        let conn = self.conn.lock().unwrap();
        let sql = format!(
            "SELECT DISTINCT {} FROM mediations WHERE {} LIKE ?1 AND {} != '' ORDER BY {} LIMIT 10",
            field, field, field, field
        );
        let like = format!("{}%", prefix);
        let mut stmt = conn.prepare(&sql)?;
        let rows = stmt.query_map(params![like], |row| row.get::<_, String>(0))?;

        let mut results = Vec::new();
        for row in rows {
            results.push(row?);
        }
        Ok(results)
    }

    // ── Rounds ──────────────────────────────────────────────────────────

    pub fn add_round(&self, round: &Round) -> SqlResult<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO rounds (id, mediation_id, round_number, round_type, demand, offer, bracket_high, bracket_low, bracket_proposed_by, midpoint, is_speculative, branch_from_round, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
            params![
                round.id,
                round.mediation_id,
                round.round_number,
                round.round_type,
                round.demand,
                round.offer,
                round.bracket_high,
                round.bracket_low,
                round.bracket_proposed_by,
                round.midpoint,
                round.is_speculative as i32,
                round.branch_from_round,
                round.created_at,
            ],
        )?;
        Ok(())
    }

    pub fn get_rounds(&self, mediation_id: &str) -> SqlResult<Vec<Round>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, mediation_id, round_number, round_type, demand, offer, bracket_high, bracket_low, bracket_proposed_by, midpoint, is_speculative, branch_from_round, created_at
             FROM rounds WHERE mediation_id = ?1
             ORDER BY is_speculative ASC, round_number ASC",
        )?;
        let rows = stmt.query_map(params![mediation_id], |row| {
            let is_spec: i32 = row.get(10)?;
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
                is_speculative: is_spec != 0,
                branch_from_round: row.get(11)?,
                created_at: row.get(12)?,
            })
        })?;

        let mut results = Vec::new();
        for row in rows {
            results.push(row?);
        }
        Ok(results)
    }

    pub fn update_round(&self, round: &Round) -> SqlResult<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE rounds SET round_number = ?1, round_type = ?2, demand = ?3, offer = ?4, bracket_high = ?5, bracket_low = ?6, bracket_proposed_by = ?7, midpoint = ?8, is_speculative = ?9, branch_from_round = ?10
             WHERE id = ?11",
            params![
                round.round_number,
                round.round_type,
                round.demand,
                round.offer,
                round.bracket_high,
                round.bracket_low,
                round.bracket_proposed_by,
                round.midpoint,
                round.is_speculative as i32,
                round.branch_from_round,
                round.id,
            ],
        )?;
        Ok(())
    }

    pub fn delete_round(&self, id: &str) -> SqlResult<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM rounds WHERE id = ?1", params![id])?;
        Ok(())
    }

    pub fn promote_speculative_rounds(
        &self,
        mediation_id: &str,
        up_to_round: i32,
    ) -> SqlResult<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE rounds SET is_speculative = 0, branch_from_round = NULL
             WHERE mediation_id = ?1 AND is_speculative = 1 AND round_number <= ?2",
            params![mediation_id, up_to_round],
        )?;
        Ok(())
    }

    pub fn discard_speculative_rounds(
        &self,
        mediation_id: &str,
        from_round: i32,
    ) -> SqlResult<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "DELETE FROM rounds WHERE mediation_id = ?1 AND is_speculative = 1 AND round_number >= ?2",
            params![mediation_id, from_round],
        )?;
        Ok(())
    }

    // ── Settings ────────────────────────────────────────────────────────

    pub fn get_setting(&self, key: &str) -> SqlResult<Option<String>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT value FROM settings WHERE key = ?1")?;
        let mut rows = stmt.query_map(params![key], |row| row.get::<_, String>(0))?;
        match rows.next() {
            Some(row) => Ok(Some(row?)),
            None => Ok(None),
        }
    }

    pub fn set_setting(&self, key: &str, value: &str) -> SqlResult<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO settings (key, value) VALUES (?1, ?2)
             ON CONFLICT(key) DO UPDATE SET value = excluded.value",
            params![key, value],
        )?;
        Ok(())
    }
}
