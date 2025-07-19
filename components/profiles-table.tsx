"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MessageSquare, Edit, Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Profile {
  id: string
  username: string
  fullName: string
  profilePic: string
  bio: string
  followersCount: number
  followingCount: number
  status: "not_generated" | "draft_ready" | "sent" | "failed"
  dmDraft?: string
  sentAt?: string
  assignedSession?: string
  error?: string
  scrapeRunId: string
}

function ProfilesTable() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([])
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [senderSessions, setSenderSessions] = useState<any[]>([])
  const [editingDM, setEditingDM] = useState<{ profileId: string; draft: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchProfiles()
    fetchSenderSessions()
  }, [])

  const fetchProfiles = async () => {
    try {
      const response = await fetch("/api/profiles")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setProfiles(data || [])
    } catch (error) {
      console.error("Failed to fetch profiles:", error)
      setProfiles([])
    }
  }

  const fetchSenderSessions = async () => {
    try {
      const response = await fetch("/api/sessions?type=sender")
      const data = await response.json()
      setSenderSessions(data)
    } catch (error) {
      console.error("Failed to fetch sender sessions:", error)
    }
  }

  const generateDM = async (profileId: string) => {
    setLoading(true)
    try {
      const response = await fetch("/api/generate-dm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "DM generated successfully",
        })
        fetchProfiles()
      } else {
        throw new Error("Failed to generate DM")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate DM",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const generateBulkDMs = async () => {
    if (selectedProfiles.length === 0) {
      toast({
        title: "Error",
        description: "Please select profiles first",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/generate-dm/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileIds: selectedProfiles }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `Generated DMs for ${selectedProfiles.length} profiles`,
        })
        setSelectedProfiles([])
        fetchProfiles()
      } else {
        throw new Error("Failed to generate bulk DMs")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate bulk DMs",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const updateDMDraft = async (profileId: string, draft: string) => {
    try {
      const response = await fetch("/api/profiles/update-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId, draft }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "DM draft updated",
        })
        setEditingDM(null)
        fetchProfiles()
      } else {
        throw new Error("Failed to update draft")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update draft",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "not_generated":
        return <Badge variant="outline">💡 Not Generated</Badge>
      case "draft_ready":
        return <Badge variant="secondary">✍️ Draft Ready</Badge>
      case "sent":
        return <Badge variant="default">✅ Sent</Badge>
      case "failed":
        return <Badge variant="destructive">⚠️ Failed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const filteredProfiles = profiles.filter((profile) => {
    const matchesSearch =
      profile.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.fullName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === "all" || profile.status === filterStatus
    return matchesSearch && matchesFilter
  })

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-2">
          <Input
            placeholder="Search profiles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="not_generated">Not Generated</SelectItem>
              <SelectItem value="draft_ready">Draft Ready</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button onClick={generateBulkDMs} disabled={selectedProfiles.length === 0 || loading} variant="outline">
            <MessageSquare className="w-4 h-4 mr-2" />
            Generate DMs ({selectedProfiles.length})
          </Button>
        </div>
      </div>

      {/* Profiles Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Scraped Profiles ({filteredProfiles.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredProfiles.map((profile) => (
              <div key={profile.id} className="border rounded-lg p-4">
                <div className="flex items-start gap-4">
                  <Checkbox
                    checked={selectedProfiles.includes(profile.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedProfiles([...selectedProfiles, profile.id])
                      } else {
                        setSelectedProfiles(selectedProfiles.filter((id) => id !== profile.id))
                      }
                    }}
                  />

                  <Avatar className="w-12 h-12">
                    <AvatarImage src={profile.profilePic || "/placeholder.svg"} alt={profile.username} />
                    <AvatarFallback>{profile.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">@{profile.username}</h3>
                      {getStatusBadge(profile.status)}
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{profile.fullName}</p>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-2">{profile.bio}</p>
                    <div className="flex gap-4 text-xs text-gray-500">
                      <span>{profile.followersCount} followers</span>
                      <span>{profile.followingCount} following</span>
                    </div>

                    {profile.dmDraft && (
                      <div className="mt-3 p-3 bg-gray-50 rounded border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">DM Draft:</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingDM({ profileId: profile.id, draft: profile.dmDraft || "" })}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                        </div>
                        <p className="text-sm">{profile.dmDraft}</p>
                      </div>
                    )}

                    {profile.sentAt && (
                      <div className="mt-2 text-xs text-green-600">
                        Sent: {new Date(profile.sentAt).toLocaleString()}
                      </div>
                    )}

                    {profile.error && <div className="mt-2 text-xs text-red-600">Error: {profile.error}</div>}
                  </div>

                  <div className="flex flex-col gap-2">
                    {profile.status === "not_generated" && (
                      <Button size="sm" onClick={() => generateDM(profile.id)} disabled={loading}>
                        <MessageSquare className="w-4 h-4 mr-1" />
                        Generate DM
                      </Button>
                    )}

                    {profile.status === "draft_ready" && (
                      <div className="space-y-2">
                        <Select onValueChange={(sessionId) => {}}>
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Send Now" />
                          </SelectTrigger>
                          <SelectContent>
                            {senderSessions.map((session) => (
                              <SelectItem key={session.id} value={session.id}>
                                {session.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {filteredProfiles.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No profiles found. Try adjusting your search or filters.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit DM Dialog */}
      {editingDM && (
        <Dialog open={!!editingDM} onOpenChange={() => setEditingDM(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit DM Draft</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                value={editingDM.draft}
                onChange={(e) => setEditingDM({ ...editingDM, draft: e.target.value })}
                rows={4}
                placeholder="Edit your DM message..."
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setEditingDM(null)}>
                  Cancel
                </Button>
                <Button onClick={() => updateDMDraft(editingDM.profileId, editingDM.draft)}>Save Draft</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

export default ProfilesTable
export { ProfilesTable }
