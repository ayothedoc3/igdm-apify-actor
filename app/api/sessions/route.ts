import { type NextRequest, NextResponse } from "next/server"
import { getDatabase, initializeTables } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")

    const sql = getDatabase()

    // Initialize tables if they don't exist
    await initializeTables()

    let sessions
    if (type) {
      sessions = await sql`
        SELECT * FROM sessions 
        WHERE type = ${type}
        ORDER BY created_at DESC
      `
    } else {
      sessions = await sql`
        SELECT * FROM sessions 
        ORDER BY created_at DESC
      `
    }

    return NextResponse.json(sessions || [])
  } catch (error) {
    console.error("Error fetching sessions:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch sessions",
        details: error.message,
      },
      { status: 500 },
    )
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

    const sql = getDatabase()

    // Initialize tables if they don't exist
    await initializeTables()

    const id = crypto.randomUUID()

    await sql`
      INSERT INTO sessions (id, name, username, session_id, type, status, created_at)
      VALUES (${id}, ${name}, ${username}, ${sessionId}, ${type}, 'active', NOW())
    `

    return NextResponse.json({ success: true, id })
  } catch (error) {
    console.error("Error creating session:", error)
    return NextResponse.json(
      {
        error: "Failed to create session",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
