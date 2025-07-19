import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/database"

export async function GET() {
  try {
    const db = getDatabase()

    const runs = db
      .prepare(`
      SELECT * FROM scrape_runs 
      ORDER BY created_at DESC 
      LIMIT 50
    `)
      .all()

    return NextResponse.json(runs || [])
  } catch (error) {
    console.error("Error fetching scrape runs:", error)
    return NextResponse.json({ error: "Failed to fetch scrape runs" }, { status: 500 })
  }
}
