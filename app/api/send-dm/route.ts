import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/database"
import { ApifyClient } from "apify-client"

const client = new ApifyClient({
  token: process.env.APIFY_API_TOKEN,
})

export async function POST(request: NextRequest) {
  try {
    const { profileId, sessionId, schedule } = await request.json()

    if (!profileId || !sessionId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!process.env.APIFY_API_TOKEN) {
      return NextResponse.json({ error: "Apify API token not configured" }, { status: 500 })
    }

    const db = getDatabase()

    // Get profile and session
    const profile = db.prepare("SELECT * FROM profiles WHERE id = ?").get(profileId)
    const session = db.prepare('SELECT * FROM sessions WHERE id = ? AND type = "sender"').get(sessionId)

    if (!profile || !session) {
      return NextResponse.json({ error: "Profile or session not found" }, { status: 404 })
    }

    if (!profile.dm_draft) {
      return NextResponse.json({ error: "No DM draft available" }, { status: 400 })
    }

    // Create DM queue entry
    const queueId = crypto.randomUUID()
    const scheduledFor = schedule ? new Date(schedule) : new Date()

    db.prepare(`
      INSERT INTO dm_queue (id, profile_id, profile_username, message, session_id, session_name, scheduled_for, status, attempts, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', 0, datetime('now'))
    `).run(queueId, profileId, profile.username, profile.dm_draft, sessionId, session.name, scheduledFor.toISOString())

    // Update profile status
    db.prepare("UPDATE profiles SET assigned_session_id = ? WHERE id = ?").run(sessionId, profileId)

    // If not scheduled for later, process immediately
    if (!schedule) {
      setTimeout(() => processDMQueue(queueId), 2000)
    }

    return NextResponse.json({ success: true, queueId })
  } catch (error) {
    console.error("Error queuing DM:", error)
    return NextResponse.json({ error: "Failed to queue DM" }, { status: 500 })
  }
}

async function processDMQueue(queueId: string) {
  const db = getDatabase()

  try {
    const queueItem = db.prepare("SELECT * FROM dm_queue WHERE id = ?").get(queueId)
    if (!queueItem) return

    const session = db.prepare("SELECT * FROM sessions WHERE id = ?").get(queueItem.session_id)
    if (!session) return

    // Update status to sending
    db.prepare('UPDATE dm_queue SET status = "sending" WHERE id = ?').run(queueId)

    try {
      // Use your custom Apify actor for DM sending
      const run = await client.actor("your-username/igdm-apify-actor").call({
        sessionCookie: session.session_id,
        recipients: [queueItem.profile_username],
        message: queueItem.message,
        proxy: { useApifyProxy: true },
      })

      // Wait for completion with timeout
      const result = await Promise.race([
        client.run(run.id).waitForFinish(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout after 5 minutes")), 300000)),
      ])

      if (result.status === "SUCCEEDED") {
        // Update as sent
        db.prepare(`
          UPDATE dm_queue SET status = 'sent', sent_at = datetime('now'), apify_run_id = ? WHERE id = ?
        `).run(run.id, queueId)

        db.prepare(`
          UPDATE profiles SET status = 'sent', sent_at = datetime('now') WHERE id = ?
        `).run(queueItem.profile_id)

        console.log(`DM sent successfully to @${queueItem.profile_username}`)
      } else {
        throw new Error(result.statusMessage || "DM sending failed")
      }
    } catch (apifyError) {
      console.error("Apify DM error:", apifyError)

      // Handle failure
      db.prepare(`
        UPDATE dm_queue SET status = 'failed', error = ?, attempts = attempts + 1 WHERE id = ?
      `).run(apifyError.message || "DM sending failed", queueId)

      db.prepare(`
        UPDATE profiles SET status = 'failed', error = ? WHERE id = ?
      `).run(apifyError.message || "DM sending failed", queueItem.profile_id)
    }
  } catch (error) {
    console.error("Error processing DM queue:", error)
    db.prepare(`
      UPDATE dm_queue SET status = 'failed', error = ?, attempts = attempts + 1 WHERE id = ?
    `).run(error.message, queueId)
  }
}
