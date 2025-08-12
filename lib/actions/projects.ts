"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { 
  projectSchema, 
  projectUpdateSchema, 
  projectStatusUpdateSchema, 
  projectBudgetUpdateSchema,
  projectTimelineSchema,
  ProjectFormData 
} from "@/lib/validations/project"

export async function getProjects(includeArchived = false) {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/auth/signin")

  const whereClause = includeArchived ? {} : { status: { not: "ARCHIVED" as any } }

  // Admin: all
  if (session.user.role === "ADMIN") {
    const projects = await prisma.project.findMany({
      where: includeArchived
        ? {}
        : { status: { not: "ARCHIVED" as any } }, // Fix: ensure type compatibility
      include: {
        User_Project_clientIdToUser: true,
        User_Project_managerIdToUser: true,
        Team: {
          include: {
            TeamMember: {
              include: {
                User: true
              }
            }
          }
        },
        Task: {
          select: {
            id: true,
            status: true,
            priority: true
          }
        },
        ProjectMilestone: true,
        _count: {
          select: {
            Task: true,
            File: true,
            Invoice: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
    });
    return projects.map(project => ({
      ...project,
      budget: project.budget ? Number(project.budget) : null,
      spentAmount: project.spentAmount ? Number(project.spentAmount) : 0,
    }));
  }

  // Client: owned
  if (session.user.role === "CLIENT") {
    const projects = await prisma.project.findMany({
      where: includeArchived
        ? { clientId: session.user.id }
        : { clientId: session.user.id, status: { not: "ARCHIVED" as any } }, // Fix: ensure type compatibility
      include: { 
        User_Project_managerIdToUser: true, 
        Team: true,
        Task: {
          select: {
            id: true,
            status: true,
            priority: true
          }
        },
        ProjectMilestone: true,
        _count: {
          select: {
            Task: true,
            File: true,
            Invoice: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
    });
    return projects.map(project => ({
      ...project,
      budget: project.budget ? Number(project.budget) : null,
      spentAmount: project.spentAmount ? Number(project.spentAmount) : 0,
    }));
  }

  // Project Manager: managed
  if (session.user.role === "PROJECT_MANAGER") {
    const projects = await prisma.project.findMany({
      where: includeArchived
        ? { managerId: session.user.id }
        : { managerId: session.user.id, status: { not: "ARCHIVED" as any } }, // Fix: ensure type compatibility
      include: { 
        User_Project_clientIdToUser: true, 
        Team: {
          include: {
            TeamMember: {
              include: {
                User: true
              }
            }
          }
        },
        Task: {
          select: {
            id: true,
            status: true,
            priority: true
          }
        },
        ProjectMilestone: true,
        _count: {
          select: {
            Task: true,
            File: true,
            Invoice: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
    });
    return projects.map(project => ({
      ...project,
      budget: project.budget ? Number(project.budget) : null,
      spentAmount: project.spentAmount ? Number(project.spentAmount) : 0,
    }));
  }

  // Team Member: assigned projects
  if (session.user.role === "TEAM_MEMBER") {
    const projects = await prisma.project.findMany({
      where: {
        AND: [
          whereClause,
          {
            OR: [
              {
                Team: {
                  TeamMember: {
                    some: {
                      userId: session.user.id,
                      isActive: true as const
                    }
                  }
                }
              },
              {
                Task: {
                  some: {
                    assigneeId: session.user.id
                  }
                }
              }
            ]
          }
        ]
      },
      include: {
        User_Project_clientIdToUser: true,
        User_Project_managerIdToUser: true,
        Team: true,
        Task: {
          where: {
            assigneeId: session.user.id
          },
          select: {
            id: true,
            status: true,
            priority: true,
            title: true
          }
        },
        ProjectMilestone: true,
        _count: {
          select: {
            Task: true,
            File: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
    });
    return projects.map(project => ({
      ...project,
      budget: null, // Team members don't see budget info
      spentAmount: null,
    }));
  }

  return []
}

export async function getProject(id: string) {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/auth/signin")

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      User_Project_clientIdToUser: true,
      User_Project_managerIdToUser: true,
      Team: {
        include: {
          TeamMember: {
            include: {
              User: true
            }
          }
        }
      },
      Task: {
        include: {
          User: true,
          Creator: true
        },
        orderBy: { createdAt: "desc" }
      },
      ProjectMilestone: {
        orderBy: { dueDate: "asc" }
      },
      ProjectTimelineEvent: {
        orderBy: { eventDate: "asc" }
      },
      File: {
        include: {
          User: true
        },
        orderBy: { createdAt: "desc" }
      },
      Invoice: {
        orderBy: { createdAt: "desc" }
      },
      Message: {
        include: {
          FromUser: true,
          Recipient: true
        },
        orderBy: { createdAt: "desc" }
      },
      _count: {
        select: {
          Task: true,
          File: true,
          Invoice: true,
          Message: true
        }
      }
    }
  })

  if (!project) throw new Error("Project not found")

  // Check access permissions
  const hasAccess = 
    session.user.role === "ADMIN" ||
    project.clientId === session.user.id ||
    project.managerId === session.user.id ||
    (project.Team?.TeamMember.some(tm => tm.userId === session.user.id && tm.isActive)) ||
    project.Task.some(task => task.assigneeId === session.user.id)

  if (!hasAccess) throw new Error("Access denied")

  return {
    ...project,
    budget: project.budget ? Number(project.budget) : null,
    spentAmount: project.spentAmount ? Number(project.spentAmount) : 0,
  }
}

export async function createProject(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session || !["ADMIN", "PROJECT_MANAGER"].includes(session.user.role)) {
    throw new Error("Unauthorized")
  }
  
  const raw = Object.fromEntries(formData.entries())
  const data = projectSchema.parse(raw)
  
  const project = await prisma.project.create({
    data: {
      ...data,
      budget: data.budget ? Number(data.budget) : null,
      spentAmount: data.spentAmount ? Number(data.spentAmount) : 0,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      startDate: data.startDate ? new Date(data.startDate) : null,
      managerId: data.managerId,
      clientId: data.clientId,
      teamId: data.teamId || null,
      estimatedHours: data.estimatedHours || null,
      actualHours: data.actualHours || 0,
      tags: data.tags || null,
      notes: data.notes || null,
    },
  })
  
  revalidatePath("/dashboard/admin/projects")
  revalidatePath("/dashboard/project-manager/projects")
  return project
}

export async function updateProject(id: string, formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session || !["ADMIN", "PROJECT_MANAGER"].includes(session.user.role)) {
    throw new Error("Unauthorized")
  }
  
  const raw = Object.fromEntries(formData.entries())
  const data = projectSchema.parse(raw)
  
  const project = await prisma.project.update({
    where: { id },
    data: {
      ...data,
      budget: data.budget ? Number(data.budget) : null,
      spentAmount: data.spentAmount ? Number(data.spentAmount) : 0,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      startDate: data.startDate ? new Date(data.startDate) : null,
      managerId: data.managerId,
      clientId: data.clientId,
      teamId: data.teamId || null,
      estimatedHours: data.estimatedHours || null,
      actualHours: data.actualHours || 0,
      tags: data.tags || null,
      notes: data.notes || null,
    },
  })
  
  revalidatePath("/dashboard/admin/projects")
  revalidatePath("/dashboard/project-manager/projects")
  revalidatePath(`/dashboard/projects/${id}`)
  return project
}

export async function updateProjectStatus(id: string, status: string, notes?: string) {
  const session = await getServerSession(authOptions)
  if (!session || !["ADMIN", "PROJECT_MANAGER"].includes(session.user.role)) {
    throw new Error("Unauthorized")
  }

  const data = projectStatusUpdateSchema.parse({ id, status, notes })
  
  const project = await prisma.project.update({
    where: { id },
    data: {
      status: data.status,
      notes: data.notes || undefined,
      updatedAt: new Date(),
    },
  })
  
  revalidatePath("/dashboard/admin/projects")
  revalidatePath("/dashboard/project-manager/projects")
  revalidatePath(`/dashboard/projects/${id}`)
  return project
}

export async function updateProjectBudget(id: string, budget: number, spentAmount: number, currency = "USD") {
  const session = await getServerSession(authOptions)
  if (!session || !["ADMIN", "PROJECT_MANAGER"].includes(session.user.role)) {
    throw new Error("Unauthorized")
  }

  const data = projectBudgetUpdateSchema.parse({ id, budget, spentAmount, currency })
  
  const project = await prisma.project.update({
    where: { id },
    data: {
      budget: data.budget,
      spentAmount: data.spentAmount,
      currency: data.currency,
      updatedAt: new Date(),
    },
  })
  
  revalidatePath("/dashboard/admin/projects")
  revalidatePath("/dashboard/project-manager/projects")
  revalidatePath(`/dashboard/projects/${id}`)
  return project
}

export async function updateProjectTimeline(id: string, timelineData: any) {
  const session = await getServerSession(authOptions)
  if (!session || !["ADMIN", "PROJECT_MANAGER"].includes(session.user.role)) {
    throw new Error("Unauthorized")
  }

  const data = projectTimelineSchema.parse({ id, ...timelineData })
  
  const project = await prisma.project.update({
    where: { id },
    data: {
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      estimatedHours: data.estimatedHours || undefined,
      updatedAt: new Date(),
    },
  })
  
  revalidatePath("/dashboard/admin/projects")
  revalidatePath("/dashboard/project-manager/projects")
  revalidatePath(`/dashboard/projects/${id}`)
  return project
}

export async function deleteProject(id: string) {
  const session = await getServerSession(authOptions)
  if (!session || !["ADMIN", "PROJECT_MANAGER"].includes(session.user.role)) {
    throw new Error("Unauthorized")
  }
  
  await prisma.project.delete({ where: { id } })
  
  revalidatePath("/dashboard/admin/projects")
  revalidatePath("/dashboard/project-manager/projects")
}

export async function getProjectFormOptions() {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error("Unauthorized")

  const [clients, managers, teams] = await Promise.all([
    prisma.user.findMany({ 
      where: { role: "CLIENT", isActive: true }, 
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" }
    }),
    prisma.user.findMany({ 
      where: { role: "PROJECT_MANAGER", isActive: true }, 
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" }
    }),
    prisma.team.findMany({ 
      where: { isActive: true },
      select: { id: true, name: true, description: true },
      orderBy: { name: "asc" }
    })
  ])
  
  return { clients, managers, teams }
}

export async function searchProjects(query: string, filters?: any) {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/auth/signin")

  const searchWhere = {
    OR: [
      { name: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
      { tags: { contains: query, mode: "insensitive" } },
    ],
    ...filters,
  }

  // Apply role-based filtering
  let roleFilter = {}
  if (session.user.role === "CLIENT") {
    roleFilter = { clientId: session.user.id }
  } else if (session.user.role === "PROJECT_MANAGER") {
    roleFilter = { managerId: session.user.id }
  } else if (session.user.role === "TEAM_MEMBER") {
    roleFilter = {
      OR: [
        {
          Team: {
            TeamMember: {
              some: {
                userId: session.user.id,
                isActive: true
              }
            }
          }
        },
        {
          Task: {
            some: {
              assigneeId: session.user.id
            }
          }
        }
      ]
    }
  }

  const projects = await prisma.project.findMany({
    where: {
      AND: [searchWhere, roleFilter]
    },
    include: {
      User_Project_clientIdToUser: true,
      User_Project_managerIdToUser: true,
      Team: true,
      _count: {
        select: {
          Task: true,
          File: true
        }
      }
    },
    orderBy: { updatedAt: "desc" },
    take: 50
  })

  return projects.map(project => ({
    ...project,
    budget: project.budget ? Number(project.budget) : null,
    spentAmount: project.spentAmount ? Number(project.spentAmount) : 0,
  }))
}

export async function updateProjectTeam(projectId: string, teamData: any) {
  const session = await getServerSession(authOptions)
  if (!session || !["ADMIN", "PROJECT_MANAGER"].includes(session.user.role)) {
    throw new Error("Unauthorized")
  }

  const { action } = teamData

  switch (action) {
    case "add_members": {
      const { members } = teamData
      
      // First, ensure project has a team or create one
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { Team: true }
      })

      if (!project) throw new Error("Project not found")

      let teamId = project.teamId

      // Create team if it doesn't exist
      if (!teamId) {
        const newTeam = await prisma.team.create({
          data: {
            name: `${project.name} Team`,
            description: `Team for ${project.name} project`,
            isActive: true
          }
        })
        
        // Update project with team ID
        await prisma.project.update({
          where: { id: projectId },
          data: { teamId: newTeam.id }
        })
        
        teamId = newTeam.id
      }

      // Add team members
      await Promise.all(
        members.map((member: any) =>
          prisma.teamMember.upsert({
            where: {
              userId_teamId: {
                userId: member.userId,
                teamId: teamId!
              }
            },
            update: {
              role: member.role,
              isActive: true,
              leftAt: null
            },
            create: {
              userId: member.userId,
              teamId: teamId!,
              role: member.role,
              isActive: true
            }
          })
        )
      )
      break
    }

    case "remove_member": {
      const { memberId } = teamData
      
      await prisma.teamMember.update({
        where: { id: memberId },
        data: {
          isActive: false,
          leftAt: new Date()
        }
      })
      break
    }

    case "update_role": {
      const { memberId, role } = teamData
      
      await prisma.teamMember.update({
        where: { id: memberId },
        data: { role }
      })
      break
    }

    default:
      throw new Error("Invalid team action")
  }

  revalidatePath("/dashboard/admin/projects")
  revalidatePath("/dashboard/project-manager/projects")
  revalidatePath(`/dashboard/projects/${projectId}`)
}

export async function getProjectTeamMembers(projectId: string) {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error("Unauthorized")

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      Team: {
        include: {
          TeamMember: {
            where: { isActive: true },
            include: {
              User: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatar: true,
                  phone: true
                }
              }
            }
          }
        }
      }
    }
  })

  if (!project) throw new Error("Project not found")

  return project.Team?.TeamMember.map(tm => ({
    id: tm.id,
    userId: tm.User.id,
    name: tm.User.name,
    email: tm.User.email,
    avatar: tm.User.avatar,
    phone: tm.User.phone,
    role: tm.role,
    joinedAt: tm.joinedAt.toISOString(),
    isActive: tm.isActive
  })) || []
}

export async function getAvailableTeamMembers() {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error("Unauthorized")

  const users = await prisma.user.findMany({
    where: {
      role: { in: ["TEAM_MEMBER", "PROJECT_MANAGER"] },
      isActive: true
    },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      phone: true,
      role: true
    },
    orderBy: { name: "asc" }
  })

  return users
}

export async function createProjectMilestone(projectId: string, milestoneData: any) {
  const session = await getServerSession(authOptions)
  if (!session || !["ADMIN", "PROJECT_MANAGER"].includes(session.user.role)) {
    throw new Error("Unauthorized")
  }

  const milestone = await prisma.projectMilestone.create({
    data: {
      title: milestoneData.title,
      description: milestoneData.description,
      dueDate: new Date(milestoneData.dueDate),
      order: milestoneData.order || 0,
      projectId
    }
  })

  revalidatePath(`/dashboard/projects/${projectId}`)
  return milestone
}

export async function updateProjectMilestone(milestoneId: string, milestoneData: any) {
  const session = await getServerSession(authOptions)
  if (!session || !["ADMIN", "PROJECT_MANAGER"].includes(session.user.role)) {
    throw new Error("Unauthorized")
  }

  const milestone = await prisma.projectMilestone.update({
    where: { id: milestoneId },
    data: {
      title: milestoneData.title,
      description: milestoneData.description,
      dueDate: new Date(milestoneData.dueDate),
      order: milestoneData.order || 0,
      status: milestoneData.status
    }
  })

  revalidatePath(`/dashboard/projects/${milestone.projectId}`)
  return milestone
}

export async function deleteProjectMilestone(milestoneId: string) {
  const session = await getServerSession(authOptions)
  if (!session || !["ADMIN", "PROJECT_MANAGER"].includes(session.user.role)) {
    throw new Error("Unauthorized")
  }

  const milestone = await prisma.projectMilestone.delete({
    where: { id: milestoneId }
  })

  revalidatePath(`/dashboard/projects/${milestone.projectId}`)
  return milestone
}

export async function createProjectTimelineEvent(projectId: string, eventData: any) {
  const session = await getServerSession(authOptions)
  if (!session || !["ADMIN", "PROJECT_MANAGER"].includes(session.user.role)) {
    throw new Error("Unauthorized")
  }

  const event = await prisma.projectTimelineEvent.create({
    data: {
      title: eventData.title,
      description: eventData.description,
      eventDate: new Date(eventData.eventDate),
      type: eventData.type,
      projectId
    }
  })

  revalidatePath(`/dashboard/projects/${projectId}`)
  return event
}

export async function updateProjectTimelineEvent(eventId: string, eventData: any) {
  const session = await getServerSession(authOptions)
  if (!session || !["ADMIN", "PROJECT_MANAGER"].includes(session.user.role)) {
    throw new Error("Unauthorized")
  }

  const event = await prisma.projectTimelineEvent.update({
    where: { id: eventId },
    data: {
      title: eventData.title,
      description: eventData.description,
      eventDate: new Date(eventData.eventDate),
      type: eventData.type
    }
  })

  revalidatePath(`/dashboard/projects/${event.projectId}`)
  return event
}

export async function deleteProjectTimelineEvent(eventId: string) {
  const session = await getServerSession(authOptions)
  if (!session || !["ADMIN", "PROJECT_MANAGER"].includes(session.user.role)) {
    throw new Error("Unauthorized")
  }

  const event = await prisma.projectTimelineEvent.delete({
    where: { id: eventId }
  })

  revalidatePath(`/dashboard/projects/${event.projectId}`)
  return event
}
