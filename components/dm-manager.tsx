"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Calendar, Clock, Send, Pause, Play, BarChart3 } from "lucide-react"

interface Campaign {
  id: string
  name: string
  status: "scheduled" | "running" | "paused" | "completed"
  totalProfiles: number
  sentCount: number
  failedCount: number
  scheduledFor: string
  sessionName: string
  createdAt: string
}

interface QueuedDM {
  id: string
  profileUsername: string
  message: string
  sessionName: string
  scheduledFor: string
  status: "pending" | "sending" | "sent" | "failed"
  attempts: number
  error?: string
}

function DMManager() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [queuedDMs, setQueuedDMs] = useState<QueuedDM[]>([])
  const [stats, setStats] = useState({
    totalSent: 0,
    totalFailed: 0,
    totalPending: 0,
    successRate: 0,
  })

  useEffect(() => {
    fetchCampaigns()
    fetchQueuedDMs()
    fetchStats()
  }, [])

  const fetchCampaigns = async () => {
    try {
      const response = await fetch("/api/campaigns")
      const data = await response.json()
      setCampaigns(data)
    } catch (error) {
      console.error("Failed to fetch campaigns:", error)
    }
  }

  const fetchQueuedDMs = async () => {
    try {
      const response = await fetch("/api/dm-queue")
      const data = await response.json()
      setQueuedDMs(data)
    } catch (error) {
      console.error("Failed to fetch queued DMs:", error)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/dm-stats")
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error("Failed to fetch stats:", error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return (
          <Badge variant="outline">
            <Clock className="w-3 h-3 mr-1" />
            Scheduled
          </Badge>
        )
      case "running":
        return (
          <Badge variant="default">
            <Play className="w-3 h-3 mr-1" />
            Running
          </Badge>
        )
      case "paused":
        return (
          <Badge variant="secondary">
            <Pause className="w-3 h-3 mr-1" />
            Paused
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="default">
            <Send className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Send className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.totalSent}</p>
                <p className="text-sm text-gray-600">Messages Sent</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-blue-600">{stats.totalPending}</p>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-red-600">{stats.totalFailed}</p>
                <p className="text-sm text-gray-600">Failed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold text-purple-600">{stats.successRate}%</p>
                <p className="text-sm text-gray-600">Success Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Campaigns */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Active Campaigns
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold">{campaign.name}</h3>
                    {getStatusBadge(campaign.status)}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                  <div>
                    <p className="text-sm text-gray-600">Progress</p>
                    <div className="flex items-center gap-2">
                      <Progress value={(campaign.sentCount / campaign.totalProfiles) * 100} className="flex-1 h-2" />
                      <span className="text-sm font-medium">
                        {campaign.sentCount}/{campaign.totalProfiles}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Session</p>
                    <p className="font-medium">{campaign.sessionName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Scheduled For</p>
                    <p className="font-medium">{new Date(campaign.scheduledFor).toLocaleString()}</p>
                  </div>
                </div>

                {campaign.failedCount > 0 && (
                  <div className="text-sm text-red-600">{campaign.failedCount} messages failed to send</div>
                )}
              </div>
            ))}

            {campaigns.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No active campaigns. Schedule DMs from the Profiles tab to get started.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* DM Queue */}
      <Card>
        <CardHeader>
          <CardTitle>DM Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {queuedDMs.slice(0, 10).map((dm) => (
              <div key={dm.id} className="flex items-center justify-between p-3 border rounded">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">@{dm.profileUsername}</span>
                    <Badge
                      variant={dm.status === "sent" ? "default" : dm.status === "failed" ? "destructive" : "secondary"}
                    >
                      {dm.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-1">{dm.message}</p>
                  <div className="flex gap-4 text-xs text-gray-500 mt-1">
                    <span>Session: {dm.sessionName}</span>
                    <span>Scheduled: {new Date(dm.scheduledFor).toLocaleString()}</span>
                    {dm.attempts > 1 && <span>Attempts: {dm.attempts}</span>}
                  </div>
                </div>
                {dm.error && <div className="text-xs text-red-500 max-w-xs">{dm.error}</div>}
              </div>
            ))}

            {queuedDMs.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Send className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No messages in queue.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default DMManager
export { DMManager }
