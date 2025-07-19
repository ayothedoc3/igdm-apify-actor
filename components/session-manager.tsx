"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trash2, Plus, Settings, AlertCircle, CheckCircle, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Session {
  id: string
  name: string
  username: string
  sessionId: string
  type: "scraper" | "sender"
  status: "active" | "inactive"
  createdAt: string
}

export default function SessionManager() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [newSession, setNewSession] = useState({
    name: "",
    username: "",
    sessionId: "",
    type: "scraper" as "scraper" | "sender",
  })
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    setFetchLoading(true)
    try {
      const response = await fetch("/api/sessions")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()

      // Handle both success and error responses
      if (data.error) {
        throw new Error(data.error)
      }

      setSessions(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Failed to fetch sessions:", error)
      toast({
        title: "Database Connection Error",
        description: "Failed to fetch sessions. Please check your database connection.",
        variant: "destructive",
      })
      setSessions([])
    } finally {
      setFetchLoading(false)
    }
  }

  const addSession = async () => {
    if (!newSession.name || !newSession.username || !newSession.sessionId) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSession),
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: "Session added successfully",
        })
        setNewSession({ name: "", username: "", sessionId: "", type: "scraper" })
        fetchSessions()
      } else {
        throw new Error(result.error || "Failed to add session")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to add session",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const deleteSession = async (id: string) => {
    try {
      const response = await fetch(`/api/sessions/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Session deleted successfully",
        })
        fetchSessions()
      } else {
        throw new Error("Failed to delete session")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete session",
        variant: "destructive",
      })
    }
  }

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        <span>Loading sessions...</span>
      </div>
    )
  }

  const scraperSessions = sessions.filter((s) => s.type === "scraper")
  const senderSessions = sessions.filter((s) => s.type === "sender")

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              {scraperSessions.length > 0 ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-500" />
              )}
              <div>
                <p className="text-2xl font-bold">{scraperSessions.length}</p>
                <p className="text-sm text-gray-600">Scraper Sessions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              {senderSessions.length > 0 ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-500" />
              )}
              <div>
                <p className="text-2xl font-bold">{senderSessions.length}</p>
                <p className="text-sm text-gray-600">Sender Sessions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add New Session */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add New Instagram Session
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">📋 How to get Instagram Session ID:</h3>
            <ol className="text-sm text-blue-800 space-y-1">
              <li>1. Login to Instagram in your browser</li>
              <li>2. Open Developer Tools (F12)</li>
              <li>3. Go to Application/Storage → Cookies → instagram.com</li>
              <li>4. Copy the value of "sessionid" cookie</li>
            </ol>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Session Name</Label>
              <Input
                id="name"
                placeholder="e.g., Main Scraper Account"
                value={newSession.name}
                onChange={(e) => setNewSession({ ...newSession, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="username">Instagram Username</Label>
              <Input
                id="username"
                placeholder="username (without @)"
                value={newSession.username}
                onChange={(e) => setNewSession({ ...newSession, username: e.target.value.replace("@", "") })}
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="sessionId">Session ID (Cookie)</Label>
              <Input
                id="sessionId"
                placeholder="Instagram sessionid cookie value"
                value={newSession.sessionId}
                onChange={(e) => setNewSession({ ...newSession, sessionId: e.target.value })}
                type="password"
              />
            </div>
            <div>
              <Label htmlFor="type">Session Type</Label>
              <Select
                value={newSession.type}
                onValueChange={(value: "scraper" | "sender") => setNewSession({ ...newSession, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scraper">🔍 Scraper Account (for data collection)</SelectItem>
                  <SelectItem value="sender">📤 Sender Account (for sending DMs)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={addSession} disabled={loading} className="w-full">
            {loading ? "Adding Session..." : "Add Instagram Session"}
          </Button>
        </CardContent>
      </Card>

      {/* Existing Sessions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sessions.map((session) => (
          <Card key={session.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{session.name}</CardTitle>
                <Badge variant={session.type === "scraper" ? "default" : "secondary"}>
                  {session.type === "scraper" ? "🔍 Scraper" : "📤 Sender"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Username</p>
                <p className="font-medium">@{session.username}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <Badge variant={session.status === "active" ? "default" : "outline"}>{session.status}</Badge>
              </div>
              <div>
                <p className="text-sm text-gray-600">Added</p>
                <p className="text-sm">{new Date(session.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                  <Settings className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button variant="destructive" size="sm" onClick={() => deleteSession(session.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {sessions.length === 0 && !fetchLoading && (
        <div className="text-center py-8 text-gray-500">
          <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No Instagram sessions configured yet.</p>
          <p className="text-sm">Add your first Instagram session above to get started.</p>
        </div>
      )}
    </div>
  )
}
