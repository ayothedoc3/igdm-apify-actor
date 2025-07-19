import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/database"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(request: NextRequest) {
  try {
    const { profileId } = await request.json()

    if (!profileId) {
      return NextResponse.json({ error: "Profile ID required" }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 })
    }

    const db = getDatabase()
    const profile = db.prepare("SELECT * FROM profiles WHERE id = ?").get(profileId)

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    // Generate DM using AI
    const { text } = await generateText({
      model: openai("gpt-4o"),
      system: `You are a social media outreach expert. Generate personalized, friendly DM messages that are 2-3 sentences long. Be genuine and avoid being salesy. Focus on their content, interests, or achievements mentioned in their bio.`,
      prompt: `Generate a personalized Instagram DM for:
      Username: ${profile.username}
      Full Name: ${profile.full_name || ""}
      Bio: ${profile.bio || "No bio available"}
      Followers: ${profile.followers_count}
      
      The message should be:
      - Friendly and personalized based on their profile
      - 2-3 sentences maximum
      - Under 280 characters
      - Encourage engagement without being pushy
      - Reference something specific from their bio if possible`,
    })

    // Update profile with generated DM
    db.prepare('UPDATE profiles SET dm_draft = ?, status = "draft_ready" WHERE id = ?').run(text, profileId)

    return NextResponse.json({ success: true, message: text })
  } catch (error) {
    console.error("Error generating DM:", error)
    return NextResponse.json({ error: "Failed to generate DM" }, { status: 500 })
  }
}
