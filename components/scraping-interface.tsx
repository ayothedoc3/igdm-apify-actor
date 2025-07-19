"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Play, Clock, CheckCircle, AlertCircle, Plus, Trash2 } from "lucide-react"
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

interface ProxyConfig {
  useApifyProxy: boolean
  proxyType: "datacenter" | "residential" | "none"
  proxyCountry: string
  customProxies?: string[]
}

function ScrapingInterface() {
  const [sessions, setSessions] = useState<any[]>([])
  const [scrapeRuns, setScrapeRuns] = useState<ScrapeRun[]>([])
  const [scrapeConfig, setScrapeConfig] = useState({
    usernames: [""],
    scrapeType: "followers",
    maxItems: 100,
    sessionId: "",
    sessionCookie: "",
    proxy: {
      useApifyProxy: true,
      proxyType: "residential" as "datacenter" | "residential" | "none",
      proxyCountry: "US",
      customProxies: [] as string[],
    },
    runOptions: {
      timeout: 3600,
      memory: 1024,
    },
    advanced: {
      includePrivateProfiles: false,
      includeBusinessAccounts: true,
      includeVerifiedAccounts: true,
      minFollowers: 0,
      maxFollowers: 0,
      resultsFormat: "json",
    },
  })
  const [loading, setLoading] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
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

  const addUsername = () => {
    setScrapeConfig({
      ...scrapeConfig,
      usernames: [...scrapeConfig.usernames, ""],
    })
  }

  const removeUsername = (index: number) => {
    const newUsernames = scrapeConfig.usernames.filter((_, i) => i !== index)
    setScrapeConfig({
      ...scrapeConfig,
      usernames: newUsernames.length > 0 ? newUsernames : [""],
    })
  }

  const updateUsername = (index: number, value: string) => {
    const newUsernames = [...scrapeConfig.usernames]
    newUsernames[index] = value.replace("@", "")
    setScrapeConfig({
      ...scrapeConfig,
      usernames: newUsernames,
    })
  }

  const bulkEditUsernames = (text: string) => {
    const usernames = text
      .split(/[\n,]/)
      .map((u) => u.trim().replace("@", ""))
      .filter((u) => u.length > 0)
    setScrapeConfig({
      ...scrapeConfig,
      usernames: usernames.length > 0 ? usernames : [""],
    })
  }

  const removeEmptyFields = () => {
    const filteredUsernames = scrapeConfig.usernames.filter((u) => u.trim().length > 0)
    setScrapeConfig({
      ...scrapeConfig,
      usernames: filteredUsernames.length > 0 ? filteredUsernames : [""],
    })
  }

  const startScraping = async () => {
    const validUsernames = scrapeConfig.usernames.filter((u) => u.trim().length > 0)

    if (validUsernames.length === 0 || !scrapeConfig.sessionId) {
      toast({
        title: "Error",
        description: "Please provide at least one username and select a session",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usernames: validUsernames,
          scrapeType: scrapeConfig.scrapeType,
          maxItems: scrapeConfig.maxItems,
          sessionId: scrapeConfig.sessionId,
          sessionCookie: scrapeConfig.sessionCookie,
          proxy: scrapeConfig.proxy,
          runOptions: scrapeConfig.runOptions,
          advanced: scrapeConfig.advanced,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "Success",
          description: `Scraping started for ${validUsernames.length} username(s)`,
        })
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
            Instagram Follower and Following Scraper
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Settings</TabsTrigger>
              <TabsTrigger value="proxy">Proxy Configuration</TabsTrigger>
              <TabsTrigger value="advanced">Advanced Options</TabsTrigger>
              <TabsTrigger value="run-options">Run Options</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              {/* Instagram Usernames */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Instagram Usernames</Label>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={addUsername}>
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                    <Button variant="outline" size="sm" onClick={removeEmptyFields}>
                      Remove Empty
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  {scrapeConfig.usernames.map((username, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder="@username"
                        value={username}
                        onChange={(e) => updateUsername(index, e.target.value)}
                        className="flex-1"
                      />
                      {scrapeConfig.usernames.length > 1 && (
                        <Button variant="outline" size="sm" onClick={() => removeUsername(index)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-2">
                  <Label className="text-sm text-gray-600">Bulk Edit (comma or newline separated)</Label>
                  <Textarea
                    placeholder="@user1, @user2, @user3"
                    className="mt-1"
                    onChange={(e) => bulkEditUsernames(e.target.value)}
                  />
                </div>
              </div>

              {/* What to Scrape */}
              <div>
                <Label htmlFor="scrapeType">What to Scrape</Label>
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

              {/* Maximum Items */}
              <div>
                <Label htmlFor="maxItems">Maximum Items (0 = unlimited)</Label>
                <Select
                  value={scrapeConfig.maxItems.toString()}
                  onValueChange={(value) => setScrapeConfig({ ...scrapeConfig, maxItems: Number.parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Unlimited</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="200">200</SelectItem>
                    <SelectItem value="500">500</SelectItem>
                    <SelectItem value="1000">1,000</SelectItem>
                    <SelectItem value="5000">5,000</SelectItem>
                    <SelectItem value="10000">10,000</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Session Selection */}
              <div>
                <Label htmlFor="session">Scraper Session</Label>
                <Select
                  value={scrapeConfig.sessionId}
                  onValueChange={(value) => {
                    const session = sessions.find((s) => s.id === value)
                    setScrapeConfig({
                      ...scrapeConfig,
                      sessionId: value,
                      sessionCookie: session?.session_id || "",
                    })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select session" />
                  </SelectTrigger>
                  <SelectContent>
                    {sessions.map((session) => (
                      <SelectItem key={session.id} value={session.id}>
                        {session.name} (@{session.username})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Manual Session ID Override */}
              <div>
                <Label htmlFor="sessionCookie">Instagram Session ID (Override)</Label>
                <Input
                  id="sessionCookie"
                  type="password"
                  placeholder="Optional: Override with custom session ID"
                  value={scrapeConfig.sessionCookie}
                  onChange={(e) => setScrapeConfig({ ...scrapeConfig, sessionCookie: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty to use the selected session's cookie, or provide a custom session ID
                </p>
              </div>
            </TabsContent>

            <TabsContent value="proxy" className="space-y-4">
              {/* Proxy Configuration */}
              <div>
                <Label>Proxy Configuration</Label>
                <div className="space-y-3 mt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="useApifyProxy"
                      checked={scrapeConfig.proxy.useApifyProxy}
                      onCheckedChange={(checked) =>
                        setScrapeConfig({
                          ...scrapeConfig,
                          proxy: { ...scrapeConfig.proxy, useApifyProxy: !!checked },
                        })
                      }
                    />
                    <Label htmlFor="useApifyProxy">Use Apify Proxy</Label>
                  </div>

                  {scrapeConfig.proxy.useApifyProxy && (
                    <>
                      <div>
                        <Label>Proxy Type</Label>
                        <Select
                          value={scrapeConfig.proxy.proxyType}
                          onValueChange={(value: "datacenter" | "residential" | "none") =>
                            setScrapeConfig({
                              ...scrapeConfig,
                              proxy: { ...scrapeConfig.proxy, proxyType: value },
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="residential">
                              Residential - Best for avoiding blocks (Recommended)
                            </SelectItem>
                            <SelectItem value="datacenter">Datacenter - Faster but higher block rate</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Proxy Country</Label>
                        <Select
                          value={scrapeConfig.proxy.proxyCountry}
                          onValueChange={(value) =>
                            setScrapeConfig({
                              ...scrapeConfig,
                              proxy: { ...scrapeConfig.proxy, proxyCountry: value },
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="US">United States</SelectItem>
                            <SelectItem value="GB">United Kingdom</SelectItem>
                            <SelectItem value="CA">Canada</SelectItem>
                            <SelectItem value="AU">Australia</SelectItem>
                            <SelectItem value="DE">Germany</SelectItem>
                            <SelectItem value="FR">France</SelectItem>
                            <SelectItem value="JP">Japan</SelectItem>
                            <SelectItem value="BR">Brazil</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  {!scrapeConfig.proxy.useApifyProxy && (
                    <div>
                      <Label>Custom Proxy URLs (one per line)</Label>
                      <Textarea
                        placeholder="http://username:password@proxy1.com:8080&#10;http://username:password@proxy2.com:8080"
                        className="mt-1"
                        onChange={(e) => {
                          const proxies = e.target.value.split("\n").filter((p) => p.trim().length > 0)
                          setScrapeConfig({
                            ...scrapeConfig,
                            proxy: { ...scrapeConfig.proxy, customProxies: proxies },
                          })
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              {/* Advanced Options */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includePrivate"
                    checked={scrapeConfig.advanced.includePrivateProfiles}
                    onCheckedChange={(checked) =>
                      setScrapeConfig({
                        ...scrapeConfig,
                        advanced: { ...scrapeConfig.advanced, includePrivateProfiles: !!checked },
                      })
                    }
                  />
                  <Label htmlFor="includePrivate">Include Private Profiles</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeBusiness"
                    checked={scrapeConfig.advanced.includeBusinessAccounts}
                    onCheckedChange={(checked) =>
                      setScrapeConfig({
                        ...scrapeConfig,
                        advanced: { ...scrapeConfig.advanced, includeBusinessAccounts: !!checked },
                      })
                    }
                  />
                  <Label htmlFor="includeBusiness">Include Business Accounts</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeVerified"
                    checked={scrapeConfig.advanced.includeVerifiedAccounts}
                    onCheckedChange={(checked) =>
                      setScrapeConfig({
                        ...scrapeConfig,
                        advanced: { ...scrapeConfig.advanced, includeVerifiedAccounts: !!checked },
                      })
                    }
                  />
                  <Label htmlFor="includeVerified">Include Verified Accounts</Label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Minimum Followers (0 = no limit)</Label>
                    <Input
                      type="number"
                      value={scrapeConfig.advanced.minFollowers}
                      onChange={(e) =>
                        setScrapeConfig({
                          ...scrapeConfig,
                          advanced: { ...scrapeConfig.advanced, minFollowers: Number.parseInt(e.target.value) || 0 },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Maximum Followers (0 = no limit)</Label>
                    <Input
                      type="number"
                      value={scrapeConfig.advanced.maxFollowers}
                      onChange={(e) =>
                        setScrapeConfig({
                          ...scrapeConfig,
                          advanced: { ...scrapeConfig.advanced, maxFollowers: Number.parseInt(e.target.value) || 0 },
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="run-options" className="space-y-4">
              {/* Run Options */}
              <div>
                <Label>Timeout (seconds)</Label>
                <Select
                  value={scrapeConfig.runOptions.timeout.toString()}
                  onValueChange={(value) =>
                    setScrapeConfig({
                      ...scrapeConfig,
                      runOptions: { ...scrapeConfig.runOptions, timeout: Number.parseInt(value) },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1800">30 minutes</SelectItem>
                    <SelectItem value="3600">1 hour (Recommended)</SelectItem>
                    <SelectItem value="7200">2 hours</SelectItem>
                    <SelectItem value="14400">4 hours</SelectItem>
                    <SelectItem value="0">No timeout</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Memory (MB)</Label>
                <Select
                  value={scrapeConfig.runOptions.memory.toString()}
                  onValueChange={(value) =>
                    setScrapeConfig({
                      ...scrapeConfig,
                      runOptions: { ...scrapeConfig.runOptions, memory: Number.parseInt(value) },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="512">512 MB (0.125 CPU cores)</SelectItem>
                    <SelectItem value="1024">1 GB (0.25 CPU cores) - Recommended</SelectItem>
                    <SelectItem value="2048">2 GB (0.5 CPU cores)</SelectItem>
                    <SelectItem value="4096">4 GB (1 CPU core)</SelectItem>
                    <SelectItem value="8192">8 GB (2 CPU cores)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">More memory means more CPU horsepower and faster scraping</p>
              </div>
            </TabsContent>
          </Tabs>

          <Button onClick={startScraping} disabled={loading || sessions.length === 0} className="w-full" size="lg">
            {loading ? "Starting Scrape..." : "🚀 Start Scraping"}
          </Button>

          {sessions.length === 0 && (
            <p className="text-sm text-red-500 text-center">
              No scraper sessions available. Please add a scraper session first.
            </p>
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
                        {run.itemsScraped} / {run.maxItems === 0 ? "∞" : run.maxItems}
                      </span>
                    </div>
                    <Progress value={run.maxItems > 0 ? (run.itemsScraped / run.maxItems) * 100 : 0} className="h-2" />
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
                <p>No scraping jobs yet. Configure your settings above and start your first scrape.</p>
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
