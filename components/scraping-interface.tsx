"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Search, Play, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ScrapeRun {
  id: string
  targetUsername: string
  scrapeType: string
  maxItems: number
  status: "pending" | "running" | "completed" | "failed"
  progress: number
  itemsScraped: number
  sessionName: string
  createdAt: string
  completedAt?: string
  error?: string
}

function ScrapingInterface() {
  const [sessions, setSessions] = useState<any[]>([])
  const [scrapeRuns, setScrapeRuns] = useState<ScrapeRun[]>([])
  const [scrapeConfig, setScrapeConfig] = useState({
    targetUsername: "",
    scrapeType: "followers",
    maxItems: 100,
    sessionId: "",
  })
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchSessions()
    fetchScrapeRuns()
  }, [])

  const fetchSessions = async () => {
    try {
      const response = await fetch("/api/sessions?type=scraper")
      const data = await response.json()
      setSessions(data)
    } catch (error) {
      console.error("Failed to fetch sessions:", error)
    }
  }

  const fetchScrapeRuns = async () => {
    try {
      const response = await fetch("/api/scrape-runs")
      const data = await response.json()
      setScrapeRuns(data)
    } catch (error) {
      console.error("Failed to fetch scrape runs:", error)
    }
  }

  const startScraping = async () => {
    if (!scrapeConfig.targetUsername || !scrapeConfig.sessionId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scrapeConfig),
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "Success",
          description: `Scraping started for @${scrapeConfig.targetUsername}`,
        })
        setScrapeConfig({ ...scrapeConfig, targetUsername: "" })
        fetchScrapeRuns()
      } else {
        throw new Error("Failed to start scraping")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start scraping",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />
      case "running":
        return <Play className="w-4 h-4 text-blue-500" />
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "failed":
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Scraping Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Start New Scraping Job
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="targetUsername">Target Username</Label>
              <Input
                id="targetUsername"
                placeholder="@username to scrape"
                value={scrapeConfig.targetUsername}
                onChange={(e) => setScrapeConfig({ ...scrapeConfig, targetUsername: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="scrapeType">Scrape Type</Label>
              <Select
                value={scrapeConfig.scrapeType}
                onValueChange={(value) => setScrapeConfig({ ...scrapeConfig, scrapeType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="followers">Followers</SelectItem>
                  <SelectItem value="following">Following</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="maxItems">Max Items to Scrape</Label>
              <Select
                value={scrapeConfig.maxItems.toString()}
                onValueChange={(value) => setScrapeConfig({ ...scrapeConfig, maxItems: Number.parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="200">200</SelectItem>
                  <SelectItem value="500">500</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="session">Scraper Session</Label>
              <Select
                value={scrapeConfig.sessionId}
                onValueChange={(value) => setScrapeConfig({ ...scrapeConfig, sessionId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select session" />
                </SelectTrigger>
                <SelectContent>
                  {sessions.map((session) => (
                    <SelectItem key={session.id} value={session.id}>
                      {session.name} ({session.username})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={startScraping} disabled={loading || sessions.length === 0} className="w-full">
            {loading ? "Starting Scrape..." : "Start Scraping"}
          </Button>
          {sessions.length === 0 && (
            <p className="text-sm text-red-500">No scraper sessions available. Please add a scraper session first.</p>
          )}
        </CardContent>
      </Card>

      {/* Scrape Runs History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Scraping Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {scrapeRuns.map((run) => (
              <div key={run.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(run.status)}
                    <span className="font-medium">@{run.targetUsername}</span>
                    <Badge variant="outline">{run.scrapeType}</Badge>
                  </div>
                  <Badge
                    variant={
                      run.status === "completed" ? "default" : run.status === "failed" ? "destructive" : "secondary"
                    }
                  >
                    {run.status}
                  </Badge>
                </div>

                {run.status === "running" && (
                  <div className="mb-2">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>
                        {run.itemsScraped} / {run.maxItems}
                      </span>
                    </div>
                    <Progress value={run.progress} className="h-2" />
                  </div>
                )}

                <div className="flex justify-between text-sm text-gray-600">
                  <span>Session: {run.sessionName}</span>
                  <span>{new Date(run.createdAt).toLocaleString()}</span>
                </div>

                {run.status === "completed" && (
                  <div className="mt-2">
                    <Button variant="outline" size="sm">
                      View {run.itemsScraped} Profiles
                    </Button>
                  </div>
                )}

                {run.error && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                    Error: {run.error}
                  </div>
                )}
              </div>
            ))}

            {scrapeRuns.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No scraping jobs yet. Start your first scrape above.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ScrapingInterface
export { ScrapingInterface }
