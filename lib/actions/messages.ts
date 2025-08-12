"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import * as z from "zod"

const messageSchema = z.object({
  content: z.string().min(1, "Message content is required"),
  projectId: z.string().min(1, "Project is required"),
  userId: z.string().min(1, "Recipient is required"),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
})

export async function getMessages() {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error("Unauthorized")
  // TypeScript: session is not null after this point
  const userId = session!.user.id;

  // Fetch all messages for the user (as before)
  const messages = await prisma.message.findMany({
    include: {
      Project: { select: { id: true, name: true } },
      Recipient: { select: { id: true, name: true, email: true } },
      FromUser: { select: { id: true, name: true, email: true } },
      Replies: {
        include: {
          Project: { select: { id: true, name: true } },
          Recipient: { select: { id: true, name: true, email: true } },
          FromUser: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    where: {
      OR: [
        { userId },
        { fromUserId: userId },
      ],
      parentId: null, // Only fetch top-level messages
    },
    orderBy: { createdAt: "desc" },
  })

  function mapMessage(message: any): any {
    return {
      id: message.id,
      content: message.content,
      fromAdmin: message.fromAdmin,
      fromName: message.fromAdmin ? "Admin" : (message.FromUser ? message.FromUser.name : "System"),
      fromEmail: message.FromUser ? message.FromUser.email : "",
      toName: message.Recipient ? message.Recipient.name : "Unknown",
      toEmail: message.Recipient ? message.Recipient.email : "",
      read: message.read,
      priority: message.priority,
      createdAt: message.createdAt,
      project: message.Project ? message.Project.name : "",
      projectId: message.projectId,
      userId: message.userId,
      fromUserId: message.fromUserId,
      isFromMe: message.fromUserId === userId,
      parentId: message.parentId,
      replies: (message.Replies || []).map(mapMessage),
    }
  }

  return messages.map(mapMessage)
}

export async function getUsersForMessaging() {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error("Unauthorized")
  
  // Get all users except current user
  const users = await prisma.user.findMany({
    where: {
      id: { not: session.user.id },
      isActive: true
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true
    },
    orderBy: { name: "asc" }
  })
  
  return users
}

export async function getProjectsForMessaging(userId?: string) {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error("Unauthorized")
  
  let projects
  
  if (userId) {
    // Get projects for a specific user (when admin selects a recipient)
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })
    
    if (!targetUser) throw new Error("User not found")
    
    if (targetUser.role === "CLIENT") {
      // Client can only see their own projects
      projects = await prisma.project.findMany({
        where: { clientId: userId },
        select: {
          id: true,
          name: true,
          status: true
        },
        orderBy: { name: "asc" }
      })
    } else if (targetUser.role === "PROJECT_MANAGER") {
      // Project managers can see projects they manage
      projects = await prisma.project.findMany({
        where: { managerId: userId },
        select: {
          id: true,
          name: true,
          status: true
        },
        orderBy: { name: "asc" }
      })
    } else if (targetUser.role === "TEAM_MEMBER") {
      // Team members can see projects they're assigned to
      const teamIds = await getTeamIdsForUser(userId)
      projects = await prisma.project.findMany({
        where: {
          teamId: { in: teamIds }
        },
        select: {
          id: true,
          name: true,
          status: true
        },
        orderBy: { name: "asc" }
      })
    } else {
      // For other roles (ADMIN), show all projects
      projects = await prisma.project.findMany({
        select: {
          id: true,
          name: true,
          status: true
        },
        orderBy: { name: "asc" }
      })
    }
  } else {
    // Original logic for current user's projects
    if (session.user.role === "ADMIN") {
      // Admin can see all projects
      projects = await prisma.project.findMany({
        select: {
          id: true,
          name: true,
          status: true
        },
        orderBy: { name: "asc" }
      })
    } else if (session.user.role === "CLIENT") {
      // Client can only see their own projects
      projects = await prisma.project.findMany({
        where: { clientId: session.user.id },
        select: {
          id: true,
          name: true,
          status: true
        },
        orderBy: { name: "asc" }
      })
    } else {
      // Team members and project managers can see projects they're assigned to
      projects = await prisma.project.findMany({
        where: {
          OR: [
            { managerId: session.user.id },
            { teamId: { in: await getTeamIdsForUser(session.user.id) } }
          ]
        },
        select: {
          id: true,
          name: true,
          status: true
        },
        orderBy: { name: "asc" }
      })
    }
  }
  
  return projects
}

async function getTeamIdsForUser(userId: string) {
  const teamMemberships = await prisma.teamMember.findMany({
    where: { userId, isActive: true },
    select: { teamId: true }
  })
  return teamMemberships.map(tm => tm.teamId)
}

export async function createMessage(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error("Unauthorized")

  const raw = Object.fromEntries(formData.entries())
  const data = messageSchema.extend({ parentId: z.string().optional() }).parse(raw)

  const message = await prisma.message.create({
    data: {
      content: data.content,
      projectId: data.projectId,
      userId: data.userId,
      fromUserId: session.user.id,
      priority: data.priority,
      fromAdmin: ["ADMIN", "PROJECT_MANAGER"].includes(session.user.role),
      read: false,
      parentId: data.parentId || null,
    },
  })

  revalidatePath("/dashboard/admin/messages")
  revalidatePath("/dashboard/client/messages")
  revalidatePath("/dashboard/project-manager/messages")
  revalidatePath("/dashboard/team-member/messages")

  return message
}

export async function markMessageAsRead(id: string) {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error("Unauthorized")
  
  const updatedMessage = await prisma.message.update({
    where: { id },
    data: { read: true },
  })
  
  revalidatePath("/dashboard/admin/messages")
  revalidatePath("/dashboard/client/messages")
  revalidatePath("/dashboard/project-manager/messages")
  revalidatePath("/dashboard/team-member/messages")
  
  return updatedMessage
}

export async function deleteMessage(id: string) {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error("Unauthorized")
  
  // Check if user can delete this message (sender or admin)
  const message = await prisma.message.findUnique({
    where: { id },
    select: { fromUserId: true }
  })
  
  if (!message) throw new Error("Message not found")
  
  const canDelete = session.user.role === "ADMIN" || message.fromUserId === session.user.id
  if (!canDelete) throw new Error("Unauthorized to delete this message")
  
  await prisma.message.delete({ where: { id } })
  
  revalidatePath("/dashboard/admin/messages")
  revalidatePath("/dashboard/client/messages")
  revalidatePath("/dashboard/project-manager/messages")
  revalidatePath("/dashboard/team-member/messages")
}
