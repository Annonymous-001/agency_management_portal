import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { StatsCard } from "@/components/dashboard/stats-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FolderOpen, FileText, Receipt, MessageSquare, Clock, CheckCircle } from "lucide-react"

export default async function ClientDashboard() {
  // const session = await getServerSession(authOptions)

  // if (!session || session.user.role !== "CLIENT") {
  //   redirect("/auth/signin")
  // }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <DashboardHeader title="Dashboard" breadcrumbs={[{ label: "Client" }]} />

      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <StatsCard
          title="Active Projects"
          value={3}
          description="Projects in progress"
          icon={FolderOpen}
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="Pending Invoices"
          value="$2,450"
          description="Awaiting payment"
          icon={Receipt}
          trend={{ value: -5, isPositive: false }}
        />
        <StatsCard title="Unread Messages" value={7} description="New messages" icon={MessageSquare} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Projects</CardTitle>
            <CardDescription>Your latest project updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <FolderOpen className="h-4 w-4" />
                </div>
                <div className="grid gap-1">
                  <p className="text-sm font-medium leading-none">Website Redesign</p>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                </div>
                <div className="ml-auto font-medium">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <FolderOpen className="h-4 w-4" />
                </div>
                <div className="grid gap-1">
                  <p className="text-sm font-medium leading-none">Mobile App Development</p>
                  <p className="text-sm text-muted-foreground">Review</p>
                </div>
                <div className="ml-auto font-medium">
                  <Clock className="h-4 w-4 text-yellow-600" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <FolderOpen className="h-4 w-4" />
                </div>
                <div className="grid gap-1">
                  <p className="text-sm font-medium leading-none">Brand Identity</p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
                <div className="ml-auto font-medium">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Messages</CardTitle>
            <CardDescription>Latest communications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <div className="grid gap-1">
                  <p className="text-sm font-medium leading-none">Project Update</p>
                  <p className="text-sm text-muted-foreground">The website redesign is progressing well...</p>
                  <p className="text-xs text-muted-foreground">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="grid gap-1">
                  <p className="text-sm font-medium leading-none">New Proposal</p>
                  <p className="text-sm text-muted-foreground">Please review the mobile app proposal...</p>
                  <p className="text-xs text-muted-foreground">1 day ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
