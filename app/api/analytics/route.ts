import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch real analytics data
    const [
      totalRevenue,
      activeProjects,
      projectStatusDistribution,
      monthlyRevenue,
      teamUtilization,
      avgProjectTime
    ] = await Promise.all([
      // Total revenue this year
      prisma.invoice.aggregate({
        where: { 
          paid: true,
          paidAt: {
            gte: new Date(new Date().getFullYear(), 0, 1) // Start of current year
          }
        },
        _sum: { amount: true }
      }),

      // Active projects count
      prisma.project.count({
        where: {
          status: { in: ["PENDING", "IN_PROGRESS", "REVIEW"] }
        }
      }),

      // Project status distribution
      prisma.project.groupBy({
        by: ['status'],
        _count: { status: true }
      }),

      // Monthly revenue for current year
      prisma.$queryRaw<Array<{
        month: string
        amount: bigint
      }>>`
        SELECT 
          TO_CHAR("paidAt", 'Month') as month,
          SUM(amount) as amount
        FROM "Invoice" 
        WHERE "paid" = true 
          AND "paidAt" >= DATE_TRUNC('year', CURRENT_DATE)
        GROUP BY TO_CHAR("paidAt", 'Month')
        ORDER BY MIN("paidAt")
      `,

      // Team utilization (active team members / total team members)
      prisma.$queryRaw<Array<{
        utilization: number
      }>>`
        SELECT 
          ROUND(
            (COUNT(CASE WHEN tm."isActive" = true THEN 1 END) * 100.0 / COUNT(*))
          ) as utilization
        FROM "TeamMember" tm
      `,

      // Average project completion time
      prisma.$queryRaw<Array<{
        avg_days: number
      }>>`
        SELECT 
          ROUND(AVG(
            EXTRACT(DAY FROM ("updatedAt" - "startDate"))
          )) as avg_days
        FROM "Project" 
        WHERE "status" = 'COMPLETED' 
          AND "startDate" IS NOT NULL
      `
    ])

    const revenue = totalRevenue._sum.amount || 0
    const utilization = teamUtilization[0]?.utilization || 0
    const avgDays = avgProjectTime[0]?.avg_days || 0

    // Calculate project status percentages
    const totalProjects = projectStatusDistribution.reduce((sum, item) => sum + item._count.status, 0)
    const statusData = projectStatusDistribution.map(item => ({
      status: item.status,
      count: item._count.status,
      percentage: totalProjects > 0 ? Math.round((item._count.status / totalProjects) * 100) : 0,
      color: item.status === 'IN_PROGRESS' ? 'bg-blue-500' :
             item.status === 'PENDING' ? 'bg-yellow-500' :
             item.status === 'REVIEW' ? 'bg-purple-500' :
             'bg-green-500'
    }))

    // Process monthly revenue data
    const maxRevenue = Math.max(...monthlyRevenue.map(m => Number(m.amount)), 1)
    const monthlyData = monthlyRevenue.map((month, index) => {
      const prevAmount = index > 0 ? Number(monthlyRevenue[index - 1].amount) : 0
      const currentAmount = Number(month.amount)
      const growth = prevAmount > 0 ? Math.round(((currentAmount - prevAmount) / prevAmount) * 100) : 0
      
      return {
        month: month.month.trim(),
        amount: currentAmount,
        growth,
        percentage: (currentAmount / maxRevenue) * 100
      }
    })

    return NextResponse.json({
      revenue,
      activeProjects,
      utilization,
      avgDays,
      monthlyData,
      statusData
    })
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
  }
} 