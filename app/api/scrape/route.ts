import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/database"
import { ApifyClient } from "apify-client"

const client = new ApifyClient({
  token: process.env.APIFY_API_TOKEN,
})

export async function POST(request: NextRequest) {
  try {
    const { targetUsername, scrapeType, maxItems, sessionId } = await request.json()

    if (!targetUsername || !sessionId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!process.env.APIFY_API_TOKEN) {
      return NextResponse.json({ error: "Apify API token not configured" }, { status: 500 })
    }

    const db = getDatabase()

    // Get session details
    const session = db.prepare('SELECT * FROM sessions WHERE id = ? AND type = "scraper"').get(sessionId)
    if (!session) {
      return NextResponse.json({ error: "Invalid scraper session" }, { status: 400 })
    }

    // Create scrape run record
    const runId = crypto.randomUUID()
    db.prepare(`
      INSERT INTO scrape_runs (id, target_username, scrape_type, max_items, session_id, session_name, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'pending', datetime('now'))
    `).run(runId, targetUsername, scrapeType, maxItems, sessionId, session.name)

    try {
      // Start Apify actor
      const run = await client.actor("apify/instagram-scraper").call({
        usernames: [targetUsername],
        resultsType: scrapeType === "followers" ? "followers" : "following",
        resultsLimit: maxItems,
        proxy: { useApifyProxy: true },
      })

      // Update run with Apify run ID
      db.prepare('UPDATE scrape_runs SET apify_run_id = ?, status = "running" WHERE id = ?').run(run.id, runId)

      // Start monitoring the run
      setTimeout(() => monitorScrapeRun(runId, run.id), 10000)

      return NextResponse.json({
        success: true,
        runId,
        apifyRunId: run.id,
        message: "Scraping started successfully! Results will appear in a few minutes.",
      })
    } catch (apifyError) {
      console.error("Apify API error:", apifyError)

      // Update run status to failed
      db.prepare('UPDATE scrape_runs SET status = "failed", error = ? WHERE id = ?').run(
        apifyError.message || "Apify API error",
        runId,
      )

      return NextResponse.json(
        {
          error: "Failed to start scraping with Apify",
          details: apifyError.message,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error starting scrape:", error)
    return NextResponse.json({ error: "Failed to start scraping" }, { status: 500 })
  }
}

async function monitorScrapeRun(runId: string, apifyRunId: string) {
  const db = getDatabase()

  try {
    // Wait for the run to complete
    const run = await client.run(apifyRunId).waitForFinish()

    if (run.status === "SUCCEEDED") {
      // Get the dataset
      const dataset = await client.dataset(run.defaultDatasetId).listItems()

      let itemsProcessed = 0
      // Store profiles in database
      for (const item of dataset.items) {
        try {
          const profileId = crypto.randomUUID()

          // Handle different data structures from Apify
          const username = item.username || item.handle || item.user?.username || ""
          const fullName = item.fullName || item.name || item.user?.fullName || ""
          const profilePic = item.profilePicUrl || item.avatar || item.user?.profilePicUrl || ""
          const bio = item.biography || item.bio || item.user?.biography || ""
          const followersCount = item.followersCount || item.followers || item.user?.followersCount || 0
          const followingCount = item.followingCount || item.following || item.user?.followingCount || 0

          if (username) {
            db.prepare(`
              INSERT OR IGNORE INTO profiles (id, username, full_name, profile_pic, bio, followers_count, following_count, scrape_run_id, status, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'not_generated', datetime('now'))
            `).run(profileId, username, fullName, profilePic, bio, followersCount, followingCount, runId)
            itemsProcessed++
          }
        } catch (insertError) {
          console.error("Error inserting profile:", insertError)
        }
      }

      // Update run status
      db.prepare(
        'UPDATE scrape_runs SET status = "completed", items_scraped = ?, completed_at = datetime("now") WHERE id = ?',
      ).run(itemsProcessed, runId)

      console.log(`Scraping completed: ${itemsProcessed} profiles saved`)
    } else {
      // Handle failure
      db.prepare('UPDATE scrape_runs SET status = "failed", error = ? WHERE id = ?').run(
        run.statusMessage || "Scraping failed",
        runId,
      )
      console.error("Scraping failed:", run.statusMessage)
    }
  } catch (error) {
    console.error("Error monitoring scrape run:", error)
    db.prepare('UPDATE scrape_runs SET status = "failed", error = ? WHERE id = ?').run(error.message, runId)
  }
}
