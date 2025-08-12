"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { StatsCard } from "@/components/dashboard/stats-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, TrendingDown, Users, DollarSign, FolderOpen, Clock } from "lucide-react"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"

export default function AdminAnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/analytics")
      if (!res.ok) throw new Error("Failed to fetch analytics")
      const data = await res.json()
      setAnalyticsData(data)
    } catch (error) {
      toast.error("Failed to load analytics")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <DashboardHeader title="Analytics" breadcrumbs={[{ label: "Admin", href: "/dashboard/admin" }]} />

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
                  {[...Array(6)].map((_, j) => (
                    <div key={j} className="flex items-center justify-between">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-16" />
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

  if (!analyticsData) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <DashboardHeader title="Analytics" breadcrumbs={[{ label: "Admin", href: "/dashboard/admin" }]} />
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Failed to load analytics data</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { revenue, activeProjects, utilization, avgDays, monthlyData, statusData } = analyticsData

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <DashboardHeader title="Analytics" breadcrumbs={[{ label: "Admin", href: "/dashboard/admin" }]} />

      <div className="grid auto-rows-min gap-4 md:grid-cols-4">
        <StatsCard
          title="Total Revenue"
          value={`$${revenue.toLocaleString()}`}
          description="This year"
          icon={DollarSign}
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="Active Projects"
          value={activeProjects}
          description="Currently running"
          icon={FolderOpen}
          trend={{ value: 8, isPositive: true }}
        />
        <StatsCard
          title="Team Utilization"
          value={`${utilization}%`}
          description="Average across teams"
          icon={Users}
          trend={{ value: 5, isPositive: true }}
        />
        <StatsCard
          title="Avg. Project Time"
          value={`${avgDays} days`}
          description="From start to completion"
          icon={Clock}
          trend={{ value: -3, isPositive: false }}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Month</CardTitle>
            <CardDescription>Monthly revenue breakdown for this year</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {monthlyData.length > 0 ? (
                monthlyData.map((data: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-16 text-sm font-medium">{data.month}</div>
                      <div className="flex-1">
                        <Progress value={data.percentage} className="h-2" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">${data.amount.toLocaleString()}</span>
                      <div className={`flex items-center ${data.growth > 0 ? "text-green-600" : "text-red-600"}`}>
                        {data.growth > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        <span className="text-xs">{Math.abs(data.growth)}%</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No revenue data available for this year
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Project Status Distribution</CardTitle>
            <CardDescription>Current status of all projects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {statusData.length > 0 ? (
                statusData.map((data: any, index: number) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className={`h-3 w-3 rounded-full ${data.color}`} />
                        <span className="capitalize">{data.status.replace('_', ' ')}</span>
                      </div>
                      <span className="font-medium">{data.count} projects</span>
                    </div>
                    <Progress value={data.percentage} className="h-2" />
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No projects found
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
