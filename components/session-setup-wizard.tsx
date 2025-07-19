"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  CheckCircle,
  AlertTriangle,
  Copy,
  Eye,
  EyeOff,
  Chrome,
  ChromeIcon as Firefox,
  AppleIcon as Safari,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function SessionSetupWizard() {
  const [activeStep, setActiveStep] = useState(1)
  const [sessionData, setSessionData] = useState({
    scraper: { name: "", username: "", sessionId: "" },
    sender: { name: "", username: "", sessionId: "" },
  })
  const [showSessionId, setShowSessionId] = useState({ scraper: false, sender: false })
  const [loading, setLoading] = useState({ scraper: false, sender: false })
  const { toast } = useToast()

  const addSession = async (type: "scraper" | "sender") => {
    const data = sessionData[type]

    if (!data.name || !data.username || !data.sessionId) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields before adding the session",
        variant: "destructive",
      })
      return
    }

    setLoading({ ...loading, [type]: true })

    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          username: data.username,
          sessionId: data.sessionId,
          type: type,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Success! 🎉",
          description: `${type === "scraper" ? "Scraper" : "Sender"} session added successfully`,
        })

        // Clear the form
        setSessionData({
          ...sessionData,
          [type]: { name: "", username: "", sessionId: "" },
        })

        // Move to next step if this was scraper
        if (type === "scraper") {
          setActiveStep(2)
        }
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
      setLoading({ ...loading, [type]: false })
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: "Instructions copied to clipboard",
    })
  }

  const chromeInstructions = `1. Open Instagram.com in Chrome
2. Login to your account
3. Press F12 to open Developer Tools
4. Click "Application" tab
5. In left sidebar: Storage → Cookies → https://www.instagram.com
6. Find "sessionid" cookie and copy its Value`

  const firefoxInstructions = `1. Open Instagram.com in Firefox
2. Login to your account
3. Press F12 to open Developer Tools
4. Click "Storage" tab
5. In left sidebar: Cookies → https://www.instagram.com
6. Find "sessionid" cookie and copy its Value`

  const safariInstructions = `1. Open Instagram.com in Safari
2. Login to your account
3. Enable Developer menu: Safari → Preferences → Advanced → Show Develop menu
4. Develop → Show Web Inspector
5. Click "Storage" tab
6. In left sidebar: Cookies → https://www.instagram.com
7. Find "sessionid" cookie and copy its Value`

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-center space-x-4 mb-8">
        <div className={`flex items-center space-x-2 ${activeStep >= 1 ? "text-blue-600" : "text-gray-400"}`}>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${activeStep >= 1 ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          >
            {activeStep > 1 ? <CheckCircle className="w-5 h-5" /> : "1"}
          </div>
          <span className="font-medium">Scraper Account</span>
        </div>
        <div className="w-12 h-0.5 bg-gray-300"></div>
        <div className={`flex items-center space-x-2 ${activeStep >= 2 ? "text-blue-600" : "text-gray-400"}`}>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${activeStep >= 2 ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          >
            {activeStep > 2 ? <CheckCircle className="w-5 h-5" /> : "2"}
          </div>
          <span className="font-medium">Sender Account</span>
        </div>
        <div className="w-12 h-0.5 bg-gray-300"></div>
        <div className={`flex items-center space-x-2 ${activeStep >= 3 ? "text-green-600" : "text-gray-400"}`}>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${activeStep >= 3 ? "bg-green-600 text-white" : "bg-gray-200"}`}
          >
            {activeStep >= 3 ? <CheckCircle className="w-5 h-5" /> : "3"}
          </div>
          <span className="font-medium">Complete</span>
        </div>
      </div>

      {/* Step 1: Scraper Account */}
      {activeStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">🔍 Step 1: Add Scraper Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Scraper Account:</strong> This account will be used to collect follower/following data from
                target Instagram profiles. Use a secondary account for safety.
              </AlertDescription>
            </Alert>

            {/* Browser Instructions */}
            <div className="space-y-4">
              <h3 className="font-semibold">📋 How to get Instagram Session ID:</h3>
              <Tabs defaultValue="chrome" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="chrome" className="flex items-center gap-2">
                    <Chrome className="w-4 h-4" />
                    Chrome
                  </TabsTrigger>
                  <TabsTrigger value="firefox" className="flex items-center gap-2">
                    <Firefox className="w-4 h-4" />
                    Firefox
                  </TabsTrigger>
                  <TabsTrigger value="safari" className="flex items-center gap-2">
                    <Safari className="w-4 h-4" />
                    Safari
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="chrome" className="space-y-3">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="text-sm whitespace-pre-wrap">{chromeInstructions}</pre>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(chromeInstructions)}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Instructions
                  </Button>
                </TabsContent>

                <TabsContent value="firefox" className="space-y-3">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="text-sm whitespace-pre-wrap">{firefoxInstructions}</pre>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(firefoxInstructions)}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Instructions
                  </Button>
                </TabsContent>

                <TabsContent value="safari" className="space-y-3">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="text-sm whitespace-pre-wrap">{safariInstructions}</pre>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(safariInstructions)}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Instructions
                  </Button>
                </TabsContent>
              </Tabs>
            </div>

            {/* Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="scraperName">Session Name</Label>
                <Input
                  id="scraperName"
                  placeholder="e.g., Main Scraper Account"
                  value={sessionData.scraper.name}
                  onChange={(e) =>
                    setSessionData({
                      ...sessionData,
                      scraper: { ...sessionData.scraper, name: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="scraperUsername">Instagram Username</Label>
                <Input
                  id="scraperUsername"
                  placeholder="username (without @)"
                  value={sessionData.scraper.username}
                  onChange={(e) =>
                    setSessionData({
                      ...sessionData,
                      scraper: { ...sessionData.scraper, username: e.target.value.replace("@", "") },
                    })
                  }
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="scraperSessionId">Session ID (from browser cookies)</Label>
                <div className="relative">
                  <Input
                    id="scraperSessionId"
                    type={showSessionId.scraper ? "text" : "password"}
                    placeholder="Paste sessionid cookie value here"
                    value={sessionData.scraper.sessionId}
                    onChange={(e) =>
                      setSessionData({
                        ...sessionData,
                        scraper: { ...sessionData.scraper, sessionId: e.target.value },
                      })
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={() =>
                      setShowSessionId({
                        ...showSessionId,
                        scraper: !showSessionId.scraper,
                      })
                    }
                  >
                    {showSessionId.scraper ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>

            <Button onClick={() => addSession("scraper")} disabled={loading.scraper} className="w-full">
              {loading.scraper ? "Adding Scraper Account..." : "Add Scraper Account & Continue"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Sender Account */}
      {activeStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">📤 Step 2: Add Sender Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Sender Account:</strong> This account will send DMs to scraped profiles. Use your main account
                or a dedicated outreach account. You can add multiple sender accounts.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="senderName">Session Name</Label>
                <Input
                  id="senderName"
                  placeholder="e.g., Main DM Account"
                  value={sessionData.sender.name}
                  onChange={(e) =>
                    setSessionData({
                      ...sessionData,
                      sender: { ...sessionData.sender, name: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="senderUsername">Instagram Username</Label>
                <Input
                  id="senderUsername"
                  placeholder="username (without @)"
                  value={sessionData.sender.username}
                  onChange={(e) =>
                    setSessionData({
                      ...sessionData,
                      sender: { ...sessionData.sender, username: e.target.value.replace("@", "") },
                    })
                  }
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="senderSessionId">Session ID (from browser cookies)</Label>
                <div className="relative">
                  <Input
                    id="senderSessionId"
                    type={showSessionId.sender ? "text" : "password"}
                    placeholder="Paste sessionid cookie value here"
                    value={sessionData.sender.sessionId}
                    onChange={(e) =>
                      setSessionData({
                        ...sessionData,
                        sender: { ...sessionData.sender, sessionId: e.target.value },
                      })
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={() =>
                      setShowSessionId({
                        ...showSessionId,
                        sender: !showSessionId.sender,
                      })
                    }
                  >
                    {showSessionId.sender ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setActiveStep(1)} className="flex-1">
                Back to Scraper
              </Button>
              <Button onClick={() => addSession("sender")} disabled={loading.sender} className="flex-1">
                {loading.sender ? "Adding Sender Account..." : "Add Sender Account"}
              </Button>
            </div>

            <Button variant="ghost" onClick={() => setActiveStep(3)} className="w-full">
              Skip for now - I'll add sender accounts later
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Complete */}
      {activeStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">✅ Setup Complete!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-green-700 mb-2">Instagram Accounts Configured!</h2>
              <p className="text-gray-600 mb-6">Your Instagram automation system is now ready to use.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-blue-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl mb-2">🔍</div>
                  <h3 className="font-semibold mb-1">Next: Start Scraping</h3>
                  <p className="text-sm text-gray-600">Extract followers from target accounts</p>
                </CardContent>
              </Card>

              <Card className="border-purple-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl mb-2">🤖</div>
                  <h3 className="font-semibold mb-1">Then: Generate DMs</h3>
                  <p className="text-sm text-gray-600">AI creates personalized messages</p>
                </CardContent>
              </Card>

              <Card className="border-green-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl mb-2">📤</div>
                  <h3 className="font-semibold mb-1">Finally: Send DMs</h3>
                  <p className="text-sm text-gray-600">Automate your outreach campaigns</p>
                </CardContent>
              </Card>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setActiveStep(2)} className="flex-1">
                Add More Accounts
              </Button>
              <Button onClick={() => (window.location.href = "#scraping")} className="flex-1">
                Start Scraping Now! 🚀
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Safety Tips */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-800">🛡️ Safety Best Practices</CardTitle>
        </CardHeader>
        <CardContent className="text-yellow-800 space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">Account Safety:</h4>
              <ul className="space-y-1">
                <li>• Use secondary accounts for scraping</li>
                <li>• Don't use your main personal account</li>
                <li>• Keep session IDs private and secure</li>
                <li>• Monitor account health regularly</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Rate Limiting:</h4>
              <ul className="space-y-1">
                <li>• Start with small scraping batches (50-100)</li>
                <li>• Space out DM sending (1-2 per minute)</li>
                <li>• Use multiple sender accounts for scale</li>
                <li>• Monitor for Instagram warnings</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
