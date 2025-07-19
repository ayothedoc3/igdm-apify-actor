import { neon } from "@neondatabase/serverless"

let sql: ReturnType<typeof neon> | null = null

export function getDatabase() {
  if (!sql) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is required")
    }

    try {
      sql = neon(process.env.DATABASE_URL)
      console.log("Database connection established")
    } catch (error) {
      console.error("Database connection error:", error)
      throw new Error("Failed to connect to database")
    }
  }

  return sql
}

export async function initializeTables() {
  const sql = getDatabase()

  try {
    // Sessions table
    await sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        username TEXT NOT NULL,
        session_id TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('scraper', 'sender')),
        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `

    // Scrape runs table
    await sql`
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
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        completed_at TIMESTAMP
      )
    `

    // Profiles table
    await sql`
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
        sent_at TIMESTAMP,
        error TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `

    // DM Queue table
    await sql`
      CREATE TABLE IF NOT EXISTS dm_queue (
        id TEXT PRIMARY KEY,
        profile_id TEXT NOT NULL,
        profile_username TEXT NOT NULL,
        message TEXT NOT NULL,
        session_id TEXT NOT NULL,
        session_name TEXT NOT NULL,
        campaign_id TEXT,
        scheduled_for TIMESTAMP NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'failed')),
        attempts INTEGER DEFAULT 0,
        apify_run_id TEXT,
        error TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        sent_at TIMESTAMP
      )
    `

    // Campaigns table
    await sql`
      CREATE TABLE IF NOT EXISTS campaigns (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        session_id TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'running', 'paused', 'completed')),
        scheduled_for TIMESTAMP NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `

    // Follow-ups table
    await sql`
      CREATE TABLE IF NOT EXISTS follow_ups (
        id TEXT PRIMARY KEY,
        profile_id TEXT NOT NULL,
        original_message TEXT NOT NULL,
        follow_up_message TEXT NOT NULL,
        queue_id TEXT NOT NULL,
        sent_at TIMESTAMP,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `

    // Create indexes for better performance
    await sql`CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles (status)`
    await sql`CREATE INDEX IF NOT EXISTS idx_profiles_scrape_run ON profiles (scrape_run_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles (username)`
    await sql`CREATE INDEX IF NOT EXISTS idx_dm_queue_status ON dm_queue (status)`
    await sql`CREATE INDEX IF NOT EXISTS idx_dm_queue_scheduled ON dm_queue (scheduled_for)`
    await sql`CREATE INDEX IF NOT EXISTS idx_scrape_runs_status ON scrape_runs (status)`

    console.log("Database tables initialized successfully")
  } catch (error) {
    console.error("Table initialization error:", error)
    throw error
  }
}
