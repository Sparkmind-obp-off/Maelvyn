import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'

type Row = Record<string, unknown>

/** Minimal D1-compatible shim over node:sqlite so tests exercise the REAL migrations and SQL. */
class Stmt {
  constructor(private db: DatabaseSync, public sql: string, public params: unknown[] = []) {}
  bind(...params: unknown[]) { return new Stmt(this.db, this.sql, params.map((p) => (p === undefined ? null : typeof p === 'boolean' ? (p ? 1 : 0) : p))) }
  private st() { return this.db.prepare(this.sql) }
  async first<T = Row>(col?: string): Promise<T | null> {
    const r = this.st().get(...(this.params as never[])) as Row | undefined
    if (!r) return null
    return (col ? r[col] : { ...r }) as T
  }
  async all<T = Row>() { return { results: (this.st().all(...(this.params as never[])) as Row[]).map((r) => ({ ...r })) as T[], success: true, meta: {} } }
  async run() { const r = this.st().run(...(this.params as never[])); return { success: true, meta: { changes: Number(r.changes), last_row_id: Number(r.lastInsertRowid) } } }
  runSync() { return this.st().run(...(this.params as never[])) }
}

export class D1Shim {
  db: DatabaseSync
  constructor() {
    this.db = new DatabaseSync(':memory:')
    this.db.exec('PRAGMA foreign_keys = ON;')
  }
  prepare(sql: string) { return new Stmt(this.db, sql) }
  async batch(stmts: Stmt[]) {
    this.db.exec('BEGIN')
    try {
      const out = stmts.map((s) => {
        const isRead = /^\s*(SELECT|WITH)/i.test(s.sql) || /RETURNING/i.test(s.sql)
        if (isRead) return { results: this.db.prepare(s.sql).all(...(s.params as never[])) as Row[], success: true }
        s.runSync(); return { success: true, results: [] }
      })
      this.db.exec('COMMIT')
      return out
    } catch (e) { this.db.exec('ROLLBACK'); throw e }
  }
  async exec(sql: string) { this.db.exec(sql); return { count: 1 } }
}

export function migratedDb(): D1Shim {
  const d = new D1Shim()
  d.db.exec(`CREATE TABLE d1_migrations (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE, applied_at TEXT)`)
  const dir = join(process.cwd(), 'migrations')
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.sql')).sort()) {
    d.db.exec(readFileSync(join(dir, f), 'utf8'))
    d.db.prepare(`INSERT INTO d1_migrations (name, applied_at) VALUES (?, datetime('now'))`).run(f)
  }
  return d
}
