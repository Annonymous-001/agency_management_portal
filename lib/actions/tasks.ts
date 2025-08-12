"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import * as z from "zod"

const taskSchema = z.object({
  title: z.string().min(2, "Title is required"),
  description: z.string().optional(),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "BLOCKED", "CANCELLED"]).default("PENDING"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  deadline: z.string().optional(),
  estimatedHours: z.string().optional(),
  actualHours: z.string().optional(),
  assigneeId: z.string().optional(),
  projectId: z.string().min(1, "Project is required"),
})

export async function getTasks() {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error("Unauthorized")

  let whereClause = {}

  // Filter tasks based on user role
  if (session.user.role === "PROJECT_MANAGER") {
    // Project managers see tasks from projects they manage
    whereClause = {
      Project: {
        managerId: session.user.id
      }
    }
  } else if (session.user.role === "TEAM_MEMBER") {
    // Team members see tasks assigned to them or from projects they're part of
    whereClause = {
      OR: [
        { assigneeId: session.user.id },
        {
          Project: {
            Team: {
              TeamMember: {
                some: {
                  userId: session.user.id,
                  isActive: true
                }
              }
            }
          }
        }
      ]
    }
  } else if (session.user.role === "CLIENT") {
    // Clients see tasks from their projects
    whereClause = {
      Project: {
        clientId: session.user.id
      }
    }
  }
  // Admin sees all tasks (no where clause needed)

  const tasks = await prisma.task.findMany({
    where: whereClause,
    include: {
      Project: {
        include: {
          User_Project_clientIdToUser: true,
        },
      },
      User: true, // assignee
      Creator: true, // creator
    },
    orderBy: { createdAt: "desc" },
  })
  
  const mappedTasks = tasks.map(task => ({
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    deadline: task.deadline ? task.deadline.toISOString() : null,
    estimatedHours: task.estimatedHours,
    actualHours: task.actualHours,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    completedAt: task.completedAt ? task.completedAt.toISOString() : null,
    assignee: task.User ? { id: task.User.id, name: task.User.name, avatar: task.User.name?.split(" ").map(n => n[0]).join("") } : null,
    creator: task.Creator ? { id: task.Creator.id, name: task.Creator.name, avatar: task.Creator.name?.split(" ").map(n => n[0]).join("") } : (task.createdBy ? { id: task.createdBy, name: "Unknown User", avatar: "U" } : null),
    project: task.Project ? { id: task.Project.id, name: task.Project.name } : null,
    client: task.Project?.User_Project_clientIdToUser ? { id: task.Project.User_Project_clientIdToUser.id, name: task.Project.User_Project_clientIdToUser.name } : null,
  }))

  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Tasks API Response:', JSON.stringify(mappedTasks, null, 2))
  }

  return mappedTasks
}

export async function getTasksForProjectManager() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "PROJECT_MANAGER") throw new Error("Unauthorized")
  
  return getTasks()
}

export async function createTask(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session || !["ADMIN", "PROJECT_MANAGER"].includes(session.user.role)) throw new Error("Unauthorized")
  const raw = Object.fromEntries(formData.entries())
  const data = taskSchema.parse(raw)
  const task = await prisma.task.create({
    data: {
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      deadline: data.deadline ? new Date(data.deadline) : undefined,
      estimatedHours: data.estimatedHours ? parseInt(data.estimatedHours) : undefined,
      actualHours: data.actualHours ? parseInt(data.actualHours) : undefined,
      assigneeId: data.assigneeId || null,
      projectId: data.projectId,
      createdBy: session.user.id,
    },
  })
  revalidatePath("/dashboard/admin/tasks")
  revalidatePath("/dashboard/project-manager/tasks")
  return task
}

export async function updateTask(id: string, formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session || !["ADMIN", "PROJECT_MANAGER"].includes(session.user.role)) throw new Error("Unauthorized")
  const raw = Object.fromEntries(formData.entries())
  const data = taskSchema.parse(raw)
  const task = await prisma.task.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      deadline: data.deadline ? new Date(data.deadline) : undefined,
      estimatedHours: data.estimatedHours ? parseInt(data.estimatedHours) : undefined,
      actualHours: data.actualHours ? parseInt(data.actualHours) : undefined,
      assigneeId: data.assigneeId || null,
      projectId: data.projectId,
    },
  })
  revalidatePath("/dashboard/admin/tasks")
  revalidatePath("/dashboard/project-manager/tasks")
  return task
}

export async function deleteTask(id: string) {
  const session = await getServerSession(authOptions)
  if (!session || !["ADMIN", "PROJECT_MANAGER"].includes(session.user.role)) throw new Error("Unauthorized")
  await prisma.task.delete({ where: { id } })
  revalidatePath("/dashboard/admin/tasks")
  revalidatePath("/dashboard/project-manager/tasks")
}

export async function getTaskFormOptions() {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error("Unauthorized")

  let projectWhereClause = {}
  let userWhereClause = {}

  // Filter options based on user role
  if (session.user.role === "PROJECT_MANAGER") {
    projectWhereClause = { managerId: session.user.id }
    userWhereClause = { role: { in: ["TEAM_MEMBER", "PROJECT_MANAGER"] } }
  } else if (session.user.role === "ADMIN") {
    // Admin can see all projects and users
  }

  const [projects, users] = await Promise.all([
    prisma.project.findMany({
      where: projectWhereClause,
      select: { id: true, name: true },
      orderBy: { name: "asc" }
    }),
    prisma.user.findMany({
      where: { ...userWhereClause, isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" }
    })
  ])

  return { projects, users }
}
