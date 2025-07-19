import { NextResponse } from "next/server"

export async function GET() {
  try {
    const setupStatus = {
      database: !!process.env.DATABASE_URL,
      apify: !!process.env.APIFY_API_TOKEN,
      openai: !!process.env.OPENAI_API_KEY,
    }

    return NextResponse.json(setupStatus)
  } catch (error) {
    console.error("Error checking setup status:", error)
    return NextResponse.json({ error: "Failed to check setup status" }, { status: 500 })
  }
}
