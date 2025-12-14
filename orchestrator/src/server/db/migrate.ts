/**
 * Database migration script - creates tables if they don't exist.
 */

import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Database path - can be overridden via env for Docker
const DB_PATH = process.env.DATA_DIR
  ? join(process.env.DATA_DIR, 'jobs.db')
  : join(__dirname, '../../../data/jobs.db');

// Ensure data directory exists
const dataDir = dirname(DB_PATH);
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

const sqlite = new Database(DB_PATH);

const migrations = [
  `CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    source TEXT NOT NULL DEFAULT 'gradcracker',
    title TEXT NOT NULL,
    employer TEXT NOT NULL,
    employer_url TEXT,
    job_url TEXT NOT NULL UNIQUE,
    application_link TEXT,
    disciplines TEXT,
    deadline TEXT,
    salary TEXT,
    location TEXT,
    degree_required TEXT,
    starting TEXT,
    job_description TEXT,
    status TEXT NOT NULL DEFAULT 'discovered' CHECK(status IN ('discovered', 'processing', 'ready', 'applied', 'rejected', 'expired')),
    suitability_score REAL,
    suitability_reason TEXT,
    tailored_summary TEXT,
    pdf_path TEXT,
    notion_page_id TEXT,
    discovered_at TEXT NOT NULL DEFAULT (datetime('now')),
    processed_at TEXT,
    applied_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,

  `CREATE TABLE IF NOT EXISTS pipeline_runs (
    id TEXT PRIMARY KEY,
    started_at TEXT NOT NULL DEFAULT (datetime('now')),
    completed_at TEXT,
    status TEXT NOT NULL DEFAULT 'running' CHECK(status IN ('running', 'completed', 'failed')),
    jobs_discovered INTEGER NOT NULL DEFAULT 0,
    jobs_processed INTEGER NOT NULL DEFAULT 0,
    error_message TEXT
  )`,

  // Add source column for existing databases (safe to skip if already present)
  `ALTER TABLE jobs ADD COLUMN source TEXT NOT NULL DEFAULT 'gradcracker'`,
  `UPDATE jobs SET source = 'gradcracker' WHERE source IS NULL OR source = ''`,

  `CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status)`,
  `CREATE INDEX IF NOT EXISTS idx_jobs_discovered_at ON jobs(discovered_at)`,
  `CREATE INDEX IF NOT EXISTS idx_pipeline_runs_started_at ON pipeline_runs(started_at)`,
];

console.log('🔧 Running database migrations...');

for (const migration of migrations) {
  try {
    sqlite.exec(migration);
    console.log('✅ Migration applied');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const isDuplicateSourceColumn =
      migration.includes('ALTER TABLE jobs ADD COLUMN source') &&
      message.toLowerCase().includes('duplicate column name');

    if (isDuplicateSourceColumn) {
      console.log('↩️ Migration skipped (source column already exists)');
      continue;
    }

    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

sqlite.close();
console.log('🎉 Database migrations complete!');
