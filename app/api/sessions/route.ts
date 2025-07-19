import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")

    const db = getDatabase()

    let query = "SELECT * FROM sessions WHERE 1=1"
    const params: any[] = []

    if (type) {
      query += " AND type = ?"
      params.push(type)
    }

    query += " ORDER BY created_at DESC"

    const sessions = db.prepare(query).all(...params)
    return NextResponse.json(sessions || [])
  } catch (error) {
    console.error("Error fetching sessions:", error)
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, username, sessionId, type } = await request.json()

    if (!name || !username || !sessionId || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!["scraper", "sender"].includes(type)) {
      return NextResponse.json({ error: "Invalid session type" }, { status: 400 })
    }

    const db = getDatabase()

    const id = crypto.randomUUID()
    db.prepare(`
      INSERT INTO sessions (id, name, username, session_id, type, status, created_at)
      VALUES (?, ?, ?, ?, ?, 'active', datetime('now'))
    `).run(id, name, username, sessionId, type)

    return NextResponse.json({ success: true, id })
  } catch (error) {
    console.error("Error creating session:", error)
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 })
  }
}
