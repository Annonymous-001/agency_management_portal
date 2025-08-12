import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { StatsCard } from "@/components/dashboard/stats-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FolderOpen, DollarSign, Activity } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { prisma } from "@/lib/prisma"

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "ADMIN") {
    redirect("/auth/signin")
  }

  // Fetch real data from database
  const [
    totalUsers,
    activeProjects,
    totalRevenue,
    userDistribution,
    recentProjects,
    recentInvoices,
    systemStats
  ] = await Promise.all([
    // Total users count
    prisma.user.count({ where: { isActive: true } }),
    
    // Active projects count
    prisma.project.count({ 
      where: { 
        status: { in: ["PENDING", "IN_PROGRESS", "REVIEW"] } 
      } 
    }),
    
    // Total revenue from paid invoices
    prisma.invoice.aggregate({
      where: { paid: true },
      _sum: { amount: true }
    }),
    
    // User distribution by role
    prisma.user.groupBy({
      by: ['role'],
      where: { isActive: true },
      _count: { role: true }
    }),
    
    // Recent projects
    prisma.project.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        User_Project_clientIdToUser: {
          select: { name: true, email: true }
        }
      }
    }),
    
    // Recent invoices
    prisma.invoice.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        Project: { select: { name: true } },
        User: { select: { name: true } }
      }
    }),
    
    // System stats
    prisma.$queryRaw<Array<{
      active_users: bigint
      active_projects: bigint
      pending_tasks: bigint
      pending_invoices: bigint
    }>>`
      SELECT 
        (SELECT COUNT(*) FROM "User" WHERE "isActive" = true) as active_users,
        (SELECT COUNT(*) FROM "Project" WHERE "status" IN ('PENDING', 'IN_PROGRESS', 'REVIEW')) as active_projects,
        (SELECT COUNT(*) FROM "Task" WHERE "status" = 'PENDING') as pending_tasks,
        (SELECT COUNT(*) FROM "Invoice" WHERE "paid" = false AND "status" = 'PENDING') as pending_invoices
    `
  ])

  const monthlyRevenue = totalRevenue._sum.amount || 0
  const stats = systemStats[0]

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <DashboardHeader title="Admin Dashboard" breadcrumbs={[{ label: "Admin" }]} />

      <div className="grid auto-rows-min gap-4 md:grid-cols-4">
        <StatsCard
          title="Total Users"
          value={totalUsers}
          description="Active users in system"
          icon={Users}
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="Active Projects"
          value={activeProjects}
          description="Projects in progress"
          icon={FolderOpen}
          trend={{ value: 8, isPositive: true }}
        />
        <StatsCard
          title="Monthly Revenue"
          value={`$${monthlyRevenue.toLocaleString()}`}
          description="Total revenue this month"
          icon={DollarSign}
          trend={{ value: 15, isPositive: true }}
        />
        <StatsCard 
          title="System Health" 
          value="99.9%" 
          description="Uptime this month" 
          icon={Activity} 
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>User Distribution</CardTitle>
            <CardDescription>Users by role</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {userDistribution.map((group) => (
                <div key={group.role} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${
                      group.role === 'CLIENT' ? 'bg-blue-500' :
                      group.role === 'TEAM_MEMBER' ? 'bg-green-500' :
                      group.role === 'PROJECT_MANAGER' ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`} />
                    <span className="text-sm capitalize">{group.role.replace('_', ' ')}s</span>
                  </div>
                  <span className="text-sm font-medium">{group._count.role}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest system activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentProjects.slice(0, 3).map((project) => (
                <div key={project.id} className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-blue-500 mt-2" />
                  <div className="space-y-1">
                    <p className="text-sm">Project {project.status.toLowerCase()}</p>
                    <p className="text-xs text-muted-foreground">{project.name}</p>
                  </div>
                </div>
              ))}
              {recentInvoices.slice(0, 2).map((invoice) => (
                <div key={invoice.id} className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-yellow-500 mt-2" />
                  <div className="space-y-1">
                    <p className="text-sm">Invoice {invoice.status.toLowerCase()}</p>
                    <p className="text-xs text-muted-foreground">
                      ${invoice.amount.toString()} for {invoice.Project.name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Current system metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Active Users</span>
                <Badge variant="secondary">{Number(stats?.active_users) || 0}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Active Projects</span>
                <Badge variant="secondary">{Number(stats?.active_projects) || 0}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Pending Tasks</span>
                <Badge variant="outline">{Number(stats?.pending_tasks) || 0}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Pending Invoices</span>
                <Badge variant="outline">{Number(stats?.pending_invoices) || 0}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
