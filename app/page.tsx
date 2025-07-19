"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import SessionManager from "@/components/session-manager"
import SessionSetupWizard from "@/components/session-setup-wizard"
import ScrapingInterface from "@/components/scraping-interface"
import ProfilesTable from "@/components/profiles-table"
import DMManager from "@/components/dm-manager"
import SetupGuide from "@/components/setup-guide"
import AnalyticsDashboard from "@/components/analytics-dashboard"
import { Instagram, Users, MessageSquare, Calendar, BarChart3, Settings, Zap } from "lucide-react"

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("quick-setup")

  useEffect(() => {
    const handleNavigateToTab = (event: CustomEvent) => {
      setActiveTab(event.detail)
    }

    window.addEventListener("navigate-to-tab", handleNavigateToTab as EventListener)

    return () => {
      window.removeEventListener("navigate-to-tab", handleNavigateToTab as EventListener)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Instagram Automation Hub</h1>
          <p className="text-lg text-gray-600">
            Orchestrate multiple Instagram accounts for scraping and DM automation
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-7 mb-6">
            <TabsTrigger value="quick-setup" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Quick Setup
            </TabsTrigger>
            <TabsTrigger value="setup" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Status
            </TabsTrigger>
            <TabsTrigger value="sessions" className="flex items-center gap-2">
              <Instagram className="w-4 h-4" />
              Sessions
            </TabsTrigger>
            <TabsTrigger value="scraping" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Scraping
            </TabsTrigger>
            <TabsTrigger value="profiles" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Profiles & DMs
            </TabsTrigger>
            <TabsTrigger value="scheduler" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Scheduler
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quick-setup">
            <Card>
              <CardHeader>
                <CardTitle>⚡ Quick Setup Wizard</CardTitle>
                <CardDescription>
                  Get started in 3 easy steps - configure your Instagram accounts for automation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SessionSetupWizard />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="setup">
            <SetupGuide />
          </TabsContent>

          <TabsContent value="sessions">
            <Card>
              <CardHeader>
                <CardTitle>Instagram Session Management</CardTitle>
                <CardDescription>Configure your Instagram accounts for scraping and sending DMs</CardDescription>
              </CardHeader>
              <CardContent>
                <SessionManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scraping">
            <Card>
              <CardHeader>
                <CardTitle>Profile Scraping</CardTitle>
                <CardDescription>Scrape followers or following from target Instagram accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrapingInterface />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profiles">
            <Card>
              <CardHeader>
                <CardTitle>Scraped Profiles & DM Management</CardTitle>
                <CardDescription>View scraped profiles, generate DMs, and manage sending</CardDescription>
              </CardHeader>
              <CardContent>
                <ProfilesTable />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scheduler">
            <Card>
              <CardHeader>
                <CardTitle>DM Scheduler</CardTitle>
                <CardDescription>Schedule and manage automated DM campaigns</CardDescription>
              </CardHeader>
              <CardContent>
                <DMManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Analytics Dashboard</CardTitle>
                <CardDescription>Monitor your automation performance and success rates</CardDescription>
              </CardHeader>
              <CardContent>
                <AnalyticsDashboard />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
