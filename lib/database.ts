import Database from "better-sqlite3"
import { join } from "path"

let db: Database.Database | null = null

export function getDatabase() {
  if (!db) {
    try {
      // Use DATABASE_URL if available, otherwise local file
      const dbPath = process.env.DATABASE_URL || join(process.cwd(), "instagram_automation.db")
      db = new Database(dbPath)

      // Enable WAL mode for better concurrent access
      db.pragma("journal_mode = WAL")

      // Initialize tables
      initializeTables(db)
    } catch (error) {
      console.error("Database initialization error:", error)
      throw new Error("Database connection failed. Please check your DATABASE_URL.")
    }
  }

  return db
}

function initializeTables(db: Database.Database) {
  try {
    // Sessions table
    db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        username TEXT NOT NULL,
        session_id TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('scraper', 'sender')),
        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
        created_at TEXT NOT NULL
      )
    `)

    // Scrape runs table
    db.exec(`
      CREATE TABLE IF NOT EXISTS scrape_runs (
        id TEXT PRIMARY KEY,
        target_username TEXT NOT NULL,
        scrape_type TEXT NOT NULL,
        max_items INTEGER NOT NULL,
        session_id TEXT NOT NULL,
        session_name TEXT NOT NULL,
        apify_run_id TEXT,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
        progress INTEGER DEFAULT 0,
        items_scraped INTEGER DEFAULT 0,
        error TEXT,
        created_at TEXT NOT NULL,
        completed_at TEXT
      )
    `)

    // Profiles table
    db.exec(`
      CREATE TABLE IF NOT EXISTS profiles (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        full_name TEXT,
        profile_pic TEXT,
        bio TEXT,
        followers_count INTEGER DEFAULT 0,
        following_count INTEGER DEFAULT 0,
        scrape_run_id TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'not_generated' CHECK (status IN ('not_generated', 'draft_ready', 'sent', 'failed')),
        dm_draft TEXT,
        assigned_session_id TEXT,
        sent_at TEXT,
        error TEXT,
        created_at TEXT NOT NULL
      )
    `)

    // DM Queue table
    db.exec(`
      CREATE TABLE IF NOT EXISTS dm_queue (
        id TEXT PRIMARY KEY,
        profile_id TEXT NOT NULL,
        profile_username TEXT NOT NULL,
        message TEXT NOT NULL,
        session_id TEXT NOT NULL,
        session_name TEXT NOT NULL,
        campaign_id TEXT,
        scheduled_for TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'failed')),
        attempts INTEGER DEFAULT 0,
        apify_run_id TEXT,
        error TEXT,
        created_at TEXT NOT NULL,
        sent_at TEXT
      )
    `)

    // Campaigns table
    db.exec(`
      CREATE TABLE IF NOT EXISTS campaigns (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        session_id TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'running', 'paused', 'completed')),
        scheduled_for TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `)

    // Follow-ups table
    db.exec(`
      CREATE TABLE IF NOT EXISTS follow_ups (
        id TEXT PRIMARY KEY,
        profile_id TEXT NOT NULL,
        original_message TEXT NOT NULL,
        follow_up_message TEXT NOT NULL,
        queue_id TEXT NOT NULL,
        sent_at TEXT,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
        created_at TEXT NOT NULL
      )
    `)

    // Create indexes for better performance
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles (status);
      CREATE INDEX IF NOT EXISTS idx_profiles_scrape_run ON profiles (scrape_run_id);
      CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles (username);
      CREATE INDEX IF NOT EXISTS idx_dm_queue_status ON dm_queue (status);
      CREATE INDEX IF NOT EXISTS idx_dm_queue_scheduled ON dm_queue (scheduled_for);
      CREATE INDEX IF NOT EXISTS idx_scrape_runs_status ON scrape_runs (status);
    `)

    console.log("Database tables initialized successfully")
  } catch (error) {
    console.error("Table initialization error:", error)
    throw error
  }
}
