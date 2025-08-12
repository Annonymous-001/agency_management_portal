import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { StatsCard } from "@/components/dashboard/stats-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckSquare, Clock, AlertCircle, FolderOpen } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default async function TeamMemberDashboard() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "TEAM_MEMBER") {
    redirect("/auth/signin")
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <DashboardHeader title="Dashboard" breadcrumbs={[{ label: "Team Member" }]} />

      <div className="grid auto-rows-min gap-4 md:grid-cols-4">
        <StatsCard title="Assigned Tasks" value={12} description="Total tasks assigned" icon={CheckSquare} />
        <StatsCard
          title="In Progress"
          value={5}
          description="Currently working on"
          icon={Clock}
          trend={{ value: 8, isPositive: true }}
        />
        <StatsCard title="Completed" value={7} description="Tasks completed" icon={CheckSquare} />
        <StatsCard title="Overdue" value={2} description="Tasks past deadline" icon={AlertCircle} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>My Tasks</CardTitle>
            <CardDescription>Your current task assignments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Implement user authentication</p>
                  <p className="text-xs text-muted-foreground">Website Redesign Project</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">In Progress</Badge>
                  <Badge variant="outline">High</Badge>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Design mobile wireframes</p>
                  <p className="text-xs text-muted-foreground">Mobile App Project</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="default">Pending</Badge>
                  <Badge variant="outline">Medium</Badge>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Code review and testing</p>
                  <p className="text-xs text-muted-foreground">E-commerce Platform</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">Overdue</Badge>
                  <Badge variant="outline">Urgent</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Projects</CardTitle>
            <CardDescription>Projects you're working on</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <FolderOpen className="h-4 w-4" />
                </div>
                <div className="grid gap-1">
                  <p className="text-sm font-medium leading-none">Website Redesign</p>
                  <p className="text-sm text-muted-foreground">3 tasks assigned</p>
                </div>
                <div className="ml-auto">
                  <Badge variant="secondary">In Progress</Badge>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <FolderOpen className="h-4 w-4" />
                </div>
                <div className="grid gap-1">
                  <p className="text-sm font-medium leading-none">Mobile App Development</p>
                  <p className="text-sm text-muted-foreground">2 tasks assigned</p>
                </div>
                <div className="ml-auto">
                  <Badge variant="outline">Review</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
