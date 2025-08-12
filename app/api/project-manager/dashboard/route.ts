import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    console.log("Session data:", { 
      hasSession: !!session, 
      userRole: session?.user?.role,
      userId: session?.user?.id 
    })
    
    if (!session || session.user.role !== "PROJECT_MANAGER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    // Get projects managed by this project manager
    const managedProjects = await prisma.project.findMany({
      where: {
        managerId: userId,
        status: { in: ["PENDING", "IN_PROGRESS", "REVIEW"] }
      },
      include: {
        Task: true,
        User_Project_clientIdToUser: true,
      
      },
      orderBy: { dueDate: 'asc' }
    })

    console.log("Managed projects found:", {
      count: managedProjects.length,
      projects: managedProjects.map(p => ({
        id: p.id,
        name: p.name,
        status: p.status,
        taskCount: p.Task.length,
        managerId: p.managerId
      }))
    })

    // Check if there are any projects at all for this user (regardless of status)
    const allProjectsForUser = await prisma.project.findMany({
      where: {
        managerId: userId
      },
      select: {
        id: true,
        name: true,
        status: true,
        progress:true,
        dueDate:true,
      }
    })

    console.log("All projects for this user (any status):", {
      count: allProjectsForUser.length,
      projects: allProjectsForUser
    })

    // Get team members working on these projects
    const teamMembers = await prisma.teamMember.findMany({
      where: {
        Team: {
          Project: {
            some: {
              managerId: userId
            }
          }
        },
        isActive: true
      },
      include: {
        User: true,
        Team: {
          include: {
            Project: {
              where: {
                managerId: userId
              }
            }
          }
        }
      }
    })

    console.log("Team members found:", {
      count: teamMembers.length,
      members: teamMembers.map(m => ({
        userId: m.userId,
        userName: m.User.name,
        userRole: m.User.role,
        teamId: m.teamId,
        isActive: m.isActive
      }))
    })

    // Get tasks for managed projects
    const tasks = await prisma.task.findMany({
      where: {
        Project: {
          managerId: userId
        }
      },
      include: {
        User: true,
        Project: true
      }
    })

    console.log("Tasks found:", {
      count: tasks.length,
      tasks: tasks.map(t => ({
        id: t.id,
        title: t.title,
        status: t.status,
        projectId: t.projectId,
        assigneeId: t.assigneeId
      }))
    })

    // Calculate stats
    const activeProjects = managedProjects.length
    const pendingTasks = tasks.filter(task => task.status === "PENDING").length
    const teamMembersCount = new Set(teamMembers.map(m => m.userId)).size
    
    console.log("Dashboard stats calculated:", {
      activeProjects,
      pendingTasks,
      teamMembersCount,
      managedProjectsCount: managedProjects.length,
      tasksCount: tasks.length,
      teamMembersArrayLength: teamMembers.length
    })

    // Calculate revenue from completed invoices for managed projects
    const revenue = await prisma.invoice.aggregate({
      where: {
        Project: {
          managerId: userId
        },
        paid: true,
        paidAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      },
      _sum: { amount: true }
    })

    // Calculate project growth (comparing to last month)
    const lastMonthProjects = await prisma.project.count({
      where: {
        managerId: userId,
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
          lt: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      }
    })

    const projectGrowth = lastMonthProjects > 0 
      ? Math.round(((activeProjects - lastMonthProjects) / lastMonthProjects) * 100)
      : activeProjects > 0 ? 100 : 0

    // Calculate revenue growth
    const lastMonthRevenue = await prisma.invoice.aggregate({
      where: {
        Project: {
          managerId: userId
        },
        paid: true,
        paidAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
          lt: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      },
      _sum: { amount: true }
    })

    const currentRevenue = Number(revenue._sum.amount) || 0
    const lastRevenue = Number(lastMonthRevenue._sum.amount) || 0
    const revenueGrowth = lastRevenue > 0 
      ? Math.round(((currentRevenue - lastRevenue) / lastRevenue) * 100)
      : currentRevenue > 0 ? 100 : 0

    // Process projects for display
    const projects = managedProjects.map(project => {
      const totalTasks = project.Task.length
      const completedTasks = project.Task.filter(task => task.status === "COMPLETED").length
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

      const now = new Date()
      const dueDate = project.dueDate ? new Date(project.dueDate) : null
      let dueInfo = "No due date"

      if (dueDate) {
        const diffTime = dueDate.getTime() - now.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        if (diffDays < 0) {
          dueInfo = `Overdue by ${Math.abs(diffDays)} days`
        } else if (diffDays === 0) {
          dueInfo = "Due today"
        } else if (diffDays === 1) {
          dueInfo = "Due tomorrow"
        } else if (diffDays < 7) {
          dueInfo = `Due in ${diffDays} days`
        } else {
          const weeks = Math.ceil(diffDays / 7)
          dueInfo = `Due in ${weeks} week${weeks > 1 ? 's' : ''}`
        }
      }

      const projectData = {
        id: project.id,
        name: project.name,
        status: project.status,
        progress,
        dueInfo
      }

      console.log(`Project ${project.name} processed:`, {
        totalTasks,
        completedTasks,
        progress,
        dueInfo
      })

      return projectData
    })

    // Process team performance
    const teamPerformance = teamMembers.map(member => {
      const memberTasks = tasks.filter(task => task.assigneeId === member.userId)
      const totalTasks = memberTasks.length
      const completedTasks = memberTasks.filter(task => task.status === "COMPLETED").length
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

      const memberData = {
        name: member.User.name || "Unknown",
        role: member.User.role || "Team Member",
        completionRate,
        completedTasks,
        totalTasks
      }

      console.log(`Team member ${member.User.name} processed:`, {
        userId: member.userId,
        totalTasks,
        completedTasks,
        completionRate
      })

      return memberData
    }).filter(member => member.totalTasks > 0) // Only show members with tasks

    const responseData = {
      stats: {
        activeProjects,
        teamMembers: teamMembersCount,
        pendingTasks,
        revenue: currentRevenue,
        projectGrowth,
        revenueGrowth
      },
      projects,
      teamPerformance
    }
    
    console.log("Sending dashboard response:", responseData)
    
    // If no data is found, provide some helpful debugging info
    if (activeProjects === 0) {
      console.warn("No projects found for project manager. This could mean:")
      console.warn("1. The user is not assigned as manager to any projects")
      console.warn("2. All projects are in COMPLETED or ARCHIVED status")
      console.warn("3. The managerId field is not set correctly on projects")
    }
    
    return NextResponse.json(responseData)
  } catch (error) {
    console.error("Error fetching project manager dashboard:", error)
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 })
  }
} 