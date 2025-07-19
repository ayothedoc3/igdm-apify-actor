import { NextResponse } from "next/server"
import { getDatabase, initializeTables } from "@/lib/database"

export async function GET() {
  try {
    const sql = getDatabase()

    // Initialize tables if they don't exist
    await initializeTables()

    const runs = await sql`
      SELECT * FROM scrape_runs 
      ORDER BY created_at DESC 
      LIMIT 50
    `

    return NextResponse.json(runs || [])
  } catch (error) {
    console.error("Error fetching scrape runs:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch scrape runs",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
