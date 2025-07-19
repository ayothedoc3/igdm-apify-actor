import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/database"

export async function GET() {
  try {
    const db = getDatabase()

    const profiles = db
      .prepare(`
      SELECT p.*, s.name as session_name
      FROM profiles p
      LEFT JOIN sessions s ON p.assigned_session_id = s.id
      ORDER BY p.created_at DESC
      LIMIT 1000
    `)
      .all()

    return NextResponse.json(profiles || [])
  } catch (error) {
    console.error("Error fetching profiles:", error)
    return NextResponse.json({ error: "Failed to fetch profiles" }, { status: 500 })
  }
}
