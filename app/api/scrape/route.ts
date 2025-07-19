import { type NextRequest, NextResponse } from "next/server"
import { getDatabase, initializeTables } from "@/lib/database"
import { ApifyClient } from "apify-client"

const client = new ApifyClient({
  token: process.env.APIFY_API_TOKEN,
})

export async function POST(request: NextRequest) {
  try {
    const { usernames, scrapeType, maxItems, sessionId, sessionCookie, proxy, runOptions, advanced } =
      await request.json()

    if (!usernames || usernames.length === 0 || !sessionId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!process.env.APIFY_API_TOKEN) {
      return NextResponse.json({ error: "Apify API token not configured" }, { status: 500 })
    }

    const sql = getDatabase()
    await initializeTables()

    // Get session details
    const sessions = await sql`
      SELECT * FROM sessions 
      WHERE id = ${sessionId} AND type = 'scraper'
    `

    const session = sessions[0]
    if (!session) {
      return NextResponse.json({ error: "Invalid scraper session" }, { status: 400 })
    }

    // Use custom session cookie if provided, otherwise use session's cookie
    const finalSessionCookie = sessionCookie || session.session_id

    // Create scrape run record for each username
    const runIds = []
    for (const username of usernames) {
      const runId = crypto.randomUUID()
      await sql`
        INSERT INTO scrape_runs (id, target_username, scrape_type, max_items, session_id, session_name, status, created_at)
        VALUES (${runId}, ${username}, ${scrapeType}, ${maxItems}, ${sessionId}, ${session.name}, 'pending', NOW())
      `
      runIds.push(runId)
    }

    try {
      // Prepare Apify actor input
      const actorInput = {
        usernames: usernames,
        resultsType: scrapeType === "followers" ? "followers" : "following",
        resultsLimit: maxItems || 0,
        sessionCookie: finalSessionCookie,

        // Proxy configuration
        proxy: proxy.useApifyProxy
          ? {
              useApifyProxy: true,
              proxyConfiguration: {
                groups: proxy.proxyType === "residential" ? ["RESIDENTIAL"] : ["DATACENTER"],
                countryCode: proxy.proxyCountry,
              },
            }
          : {
              useApifyProxy: false,
              proxyUrls: proxy.customProxies || [],
            },

        // Advanced options
        includePrivateProfiles: advanced?.includePrivateProfiles || false,
        includeBusinessAccounts: advanced?.includeBusinessAccounts !== false,
        includeVerifiedAccounts: advanced?.includeVerifiedAccounts !== false,
        minFollowers: advanced?.minFollowers || 0,
        maxFollowers: advanced?.maxFollowers || 0,

        // Run options
        timeout: runOptions?.timeout || 3600,
        memory: runOptions?.memory || 1024,
      }

      // Start Apify actor
      const run = await client.actor("apify/instagram-scraper").call(actorInput, {
        timeout: runOptions?.timeout || 3600,
        memory: runOptions?.memory || 1024,
      })

      // Update all runs with Apify run ID
      for (const runId of runIds) {
        await sql`
          UPDATE scrape_runs 
          SET apify_run_id = ${run.id}, status = 'running' 
          WHERE id = ${runId}
        `
      }

      // Start monitoring the run
      setTimeout(() => monitorScrapeRun(runIds, run.id), 10000)

      return NextResponse.json({
        success: true,
        runIds,
        apifyRunId: run.id,
        message: `Scraping started for ${usernames.length} username(s). Results will appear in a few minutes.`,
      })
    } catch (apifyError) {
      console.error("Apify API error:", apifyError)

      // Update all runs status to failed
      for (const runId of runIds) {
        await sql`
          UPDATE scrape_runs 
          SET status = 'failed', error = ${apifyError.message || "Apify API error"} 
          WHERE id = ${runId}
        `
      }

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
    return NextResponse.json(
      {
        error: "Failed to start scraping",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

async function monitorScrapeRun(runIds: string[], apifyRunId: string) {
  const sql = getDatabase()

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
            // Use the first runId as the scrape_run_id (they're all from the same scrape)
            await sql`
              INSERT INTO profiles (id, username, full_name, profile_pic, bio, followers_count, following_count, scrape_run_id, status, created_at)
              VALUES (${profileId}, ${username}, ${fullName}, ${profilePic}, ${bio}, ${followersCount}, ${followingCount}, ${runIds[0]}, 'not_generated', NOW())
              ON CONFLICT (username) DO NOTHING
            `
            itemsProcessed++
          }
        } catch (insertError) {
          console.error("Error inserting profile:", insertError)
        }
      }

      // Update all runs status
      for (const runId of runIds) {
        await sql`
          UPDATE scrape_runs 
          SET status = 'completed', items_scraped = ${itemsProcessed}, completed_at = NOW() 
          WHERE id = ${runId}
        `
      }

      console.log(`Scraping completed: ${itemsProcessed} profiles saved`)
    } else {
      // Handle failure
      for (const runId of runIds) {
        await sql`
          UPDATE scrape_runs 
          SET status = 'failed', error = ${run.statusMessage || "Scraping failed"} 
          WHERE id = ${runId}
        `
      }
      console.error("Scraping failed:", run.statusMessage)
    }
  } catch (error) {
    console.error("Error monitoring scrape run:", error)
    for (const runId of runIds) {
      await sql`
        UPDATE scrape_runs 
        SET status = 'failed', error = ${error.message} 
        WHERE id = ${runId}
      `
    }
  }
}
