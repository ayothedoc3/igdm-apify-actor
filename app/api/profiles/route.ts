import { NextResponse } from "next/server"
import { getDatabase, initializeTables } from "@/lib/database"

export async function GET() {
  try {
    const sql = getDatabase()

    // Initialize tables if they don't exist
    await initializeTables()

    const profiles = await sql`
      SELECT p.*, s.name as session_name
      FROM profiles p
      LEFT JOIN sessions s ON p.assigned_session_id = s.id
      ORDER BY p.created_at DESC
      LIMIT 1000
    `

    return NextResponse.json(profiles || [])
  } catch (error) {
    console.error("Error fetching profiles:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch profiles",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
