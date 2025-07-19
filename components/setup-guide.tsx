"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertCircle, ExternalLink, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SetupStatus {
  database: boolean
  apify: boolean
  openai: boolean
}

export default function SetupGuide() {
  const [setupStatus, setSetupStatus] = useState<SetupStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSetupStatus()
  }, [])

  const fetchSetupStatus = async () => {
    try {
      const response = await fetch("/api/setup-status")
      const data = await response.json()
      setSetupStatus(data)
    } catch (error) {
      console.error("Failed to fetch setup status:", error)
      setSetupStatus({ database: false, apify: false, openai: false })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Setup Status</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="ml-2">Checking setup status...</span>
        </CardContent>
      </Card>
    )
  }

  const setupSteps = [
    {
      title: "Database Setup",
      description: "Neon PostgreSQL database configured",
      status: setupStatus?.database ? "complete" : "pending",
      action: "Add Neon integration in Vercel dashboard",
      link: "https://vercel.com/integrations/neon",
    },
    {
      title: "Apify API Token",
      description: "Instagram scraping and DM automation",
      status: setupStatus?.apify ? "complete" : "pending",
      action: "Add APIFY_API_TOKEN environment variable",
      link: "https://console.apify.com/account/integrations",
    },
    {
      title: "OpenAI API Key",
      description: "AI-powered DM generation",
      status: setupStatus?.openai ? "complete" : "pending",
      action: "Add OPENAI_API_KEY environment variable",
      link: "https://platform.openai.com/api-keys",
    },
  ]

  const allComplete = setupSteps.every((step) => step.status === "complete")

  const getStatusIcon = (status: string) => {
    return status === "complete" ? (
      <CheckCircle className="w-5 h-5 text-green-500" />
    ) : (
      <AlertCircle className="w-5 h-5 text-yellow-500" />
    )
  }

  const getStatusBadge = (status: string) => {
    return status === "complete" ? (
      <Badge variant="default" className="bg-green-100 text-green-800">
        ✅ Complete
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
        ⚠️ Setup Required
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Production Setup Status
            <Button variant="outline" size="sm" onClick={fetchSetupStatus}>
              Refresh Status
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {setupSteps.map((step, index) => (
            <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(step.status)}
                <div>
                  <h3 className="font-medium">{step.title}</h3>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {getStatusBadge(step.status)}
                {step.status === "pending" && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={step.link} target="_blank" rel="noopener noreferrer">
                      {step.action}
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </a>
                  </Button>
                )}
              </div>
            </div>
          ))}

          {allComplete ? (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-medium text-green-900 mb-2">🚀 Production Ready!</h3>
              <p className="text-sm text-green-800">
                All integrations are configured. Your Instagram automation app is ready for production use with real
                data scraping, AI-powered DM generation, and automated sending.
              </p>
            </div>
          ) : (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-medium text-yellow-900 mb-2">⚙️ Setup Required</h3>
              <p className="text-sm text-yellow-800">
                Complete the remaining setup steps above to enable full production functionality.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {allComplete && (
        <Card>
          <CardHeader>
            <CardTitle>🎯 Quick Start Guide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <h4 className="font-medium">1. Add Instagram Sessions</h4>
              <p className="text-sm text-gray-600">
                Go to Quick Setup tab and add your Instagram accounts (both scraper and sender accounts)
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">2. Start Scraping</h4>
              <p className="text-sm text-gray-600">
                Use the Scraping tab to extract followers/following from target accounts
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">3. Generate & Send DMs</h4>
              <p className="text-sm text-gray-600">
                View scraped profiles, generate AI-powered DMs, and schedule automated sending
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
