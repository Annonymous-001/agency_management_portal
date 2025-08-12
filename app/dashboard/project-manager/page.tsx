"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { StatsCard } from "@/components/dashboard/stats-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FolderOpen, Users, CheckSquare, DollarSign, TrendingUp, AlertTriangle, RefreshCw } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"

export default function ProjectManagerDashboard() {
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/project-manager/dashboard", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store"
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`)
      }
      
      const data = await res.json()
      console.log("Dashboard data received:", data) // Debug log
      
      // Validate the data structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid data format received from API')
      }
      
      if (!data.stats || !data.projects || !data.teamPerformance) {
        console.warn("Missing expected data fields:", {
          hasStats: !!data.stats,
          hasProjects: !!data.projects,
          hasTeamPerformance: !!data.teamPerformance,
          actualData: data
        })
      }
      
      setDashboardData(data)
    } catch (error) {
      console.error("Error loading dashboard data:", error)
      toast.error(`Failed to load dashboard data: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <DashboardHeader title="Dashboard" breadcrumbs={[{ label: "Project Manager" }]} />

        <div className="grid auto-rows-min gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-6 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-5 w-20 rounded" />
                      </div>
                      <Skeleton className="h-2 w-full" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-between">
          <DashboardHeader title="Dashboard" breadcrumbs={[{ label: "Project Manager" }]} />
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadDashboardData}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={async () => {
                try {
                  const res = await fetch("/api/project-manager/dashboard")
                  const data = await res.json()
                  console.log("Manual API test:", { status: res.status, data })
                  alert(`API Status: ${res.status}\nData: ${JSON.stringify(data, null, 2)}`)
                } catch (error) {
                  console.error("Manual API test error:", error)
                  alert(`API Error: ${error}`)
                }
              }}
            >
              Test API
            </Button>
          </div>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">Failed to load dashboard data</p>
            <Button onClick={loadDashboardData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { stats, projects, teamPerformance } = dashboardData

  // Validate and provide fallbacks for stats
  const safeStats = {
    activeProjects: stats?.activeProjects || 0,
    teamMembers: stats?.teamMembers || 0,
    pendingTasks: stats?.pendingTasks || 0,
    revenue: stats?.revenue || 0,
    projectGrowth: stats?.projectGrowth || 0,
    revenueGrowth: stats?.revenueGrowth || 0
  }

  // Ensure arrays exist
  const safeProjects = Array.isArray(projects) ? projects : []
  const safeTeamPerformance = Array.isArray(teamPerformance) ? teamPerformance : []

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="flex items-center justify-between">
        <DashboardHeader title="Dashboard" breadcrumbs={[{ label: "Project Manager" }]} />
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadDashboardData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={async () => {
              try {
                const res = await fetch("/api/project-manager/dashboard")
                const data = await res.json()
                console.log("Manual API test:", { status: res.status, data })
                alert(`API Status: ${res.status}\nData: ${JSON.stringify(data, null, 2)}`)
              } catch (error) {
                console.error("Manual API test error:", error)
                alert(`API Error: ${error}`)
              }
            }}
          >
            Test API
          </Button>
        </div>
      </div>

      <div className="grid auto-rows-min gap-4 md:grid-cols-4">
        <StatsCard
          title="Active Projects"
          value={safeStats.activeProjects}
          description="Projects in progress"
          icon={FolderOpen}
          trend={{ value: safeStats.projectGrowth, isPositive: safeStats.projectGrowth > 0 }}
        />
        <StatsCard 
          title="Team Members" 
          value={safeStats.teamMembers} 
          description="Active team members" 
          icon={Users} 
        />
        <StatsCard 
          title="Pending Tasks" 
          value={safeStats.pendingTasks} 
          description="Tasks awaiting assignment" 
          icon={CheckSquare} 
        />
        <StatsCard
          title="Revenue"
          value={`$${safeStats.revenue.toLocaleString()}`}
          description="This month"
          icon={DollarSign}
          trend={{ value: safeStats.revenueGrowth, isPositive: safeStats.revenueGrowth > 0 }}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Project Overview</CardTitle>
            <CardDescription>Current project status and progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {safeProjects.length > 0 ? (
                safeProjects.map((project: any) => (
                  <div key={project.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{project.name || "Unnamed Project"}</p>
                      <Badge variant={
                        project.status === "IN_PROGRESS" ? "secondary" :
                        project.status === "REVIEW" ? "outline" :
                        project.status === "COMPLETED" ? "default" :
                        "destructive"
                      }>
                        {(project.status || "PENDING").replace("_", " ")}
                      </Badge>
                    </div>
                    <Progress value={project.progress || 0} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {project.progress || 0}% complete • {project.dueInfo || "No due date"}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  No projects found
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Team Performance</CardTitle>
            <CardDescription>Team member task completion rates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {safeTeamPerformance.length > 0 ? (
                safeTeamPerformance.map((member: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                        (member.completionRate || 0) >= 90 ? "bg-green-100" :
                        (member.completionRate || 0) >= 75 ? "bg-blue-100" :
                        "bg-yellow-100"
                      }`}>
                        {(member.completionRate || 0) >= 90 ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : (member.completionRate || 0) >= 75 ? (
                          <TrendingUp className="h-4 w-4 text-blue-600" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{member.name || "Unknown Member"}</p>
                        <p className="text-xs text-muted-foreground">{member.role || "Team Member"}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{member.completionRate || 0}%</p>
                      <p className="text-xs text-muted-foreground">{member.completedTasks || 0}/{member.totalTasks || 0} tasks</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  No team performance data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
