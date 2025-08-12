"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import * as z from "zod"
import { TeamRole } from "../generated/prisma"

const teamSchema = z.object({
  name: z.string().min(2, "Name is required"),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
})

export async function getTeams() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized")
  }
  const teams = await prisma.team.findMany({
    include: {
      TeamMember: {
        include: { User: true },
      },
      Project: true,
    },
    orderBy: { createdAt: "desc" },
  })
  // Map to shape for frontend
  return teams.map(team => ({
    id: team.id,
    name: team.name,
    description: team.description,
    isActive: team.isActive,
    memberCount: team.TeamMember.length,
    activeProjects: team.Project.filter(p => p.status !== "COMPLETED" && p.status !== "ARCHIVED" && p.status !== "CANCELLED").length,
    lead: team.TeamMember.find(m => m.role === "LEAD") ? {
      name: team.TeamMember.find(m => m.role === "LEAD")?.User?.name || "",
      avatar: team.TeamMember.find(m => m.role === "LEAD")?.User?.avatar || null
    } : null,
    members: team.TeamMember.map(m => ({
      name: m.User?.name || "",
      avatar: m.User?.avatar || null
    })),
  }))
}

export async function getTeamsForProjectManager() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "PROJECT_MANAGER") {
    throw new Error("Unauthorized")
  }
  
  // Get teams where the project manager is the team lead
  const teams = await prisma.team.findMany({
    where: {
      teamLeadId: session.user.id,
      isActive: true
    },
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
              lastLoginAt: true
            }
          }
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  // Get team member statistics and current projects
  const teamMembersWithStats = await Promise.all(
    teams.flatMap(team => 
      team.TeamMember.map(async (member) => {
        // Get task statistics for this team member
        const [activeTasks, completedTasks] = await Promise.all([
          prisma.task.count({
            where: {
              assigneeId: member.userId,
              status: { in: ["PENDING", "IN_PROGRESS"] },
              Project: {
                managerId: session.user.id
              }
            }
          }),
          prisma.task.count({
            where: {
              assigneeId: member.userId,
              status: "COMPLETED",
              Project: {
                managerId: session.user.id
              }
            }
          })
        ])

        // Get current projects for this team member
        const currentProjects = await prisma.project.findMany({
          where: {
            managerId: session.user.id,
            status: { notIn: ["COMPLETED", "ARCHIVED", "CANCELLED"] },
            OR: [
              // Projects where the team member's team is assigned
              { teamId: team.id },
              // Projects where the team member has assigned tasks
              { Task: { some: { assigneeId: member.userId } } }
            ]
          },
          select: {
            id: true,
            name: true
          },
          distinct: ['id'] // Avoid duplicates if both conditions match
        })

        return {
          id: member.id,
          userId: member.userId,
          name: member.User?.name || "Unknown",
          email: member.User?.email || "",
          avatar: member.User?.avatar || null,
          role: member.role,
          activeTasks,
          completedTasks,
          currentProjects: currentProjects.map(p => p.name),
          lastActive: member.User?.lastLoginAt || member.joinedAt,
          teamId: team.id,
          teamName: team.name
        }
      })
    )
  )

  return teamMembersWithStats
}

export async function getTeamMemberStats(userId: string) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "PROJECT_MANAGER") {
    throw new Error("Unauthorized")
  }

  const [activeTasks, completedTasks, currentProjects] = await Promise.all([
    prisma.task.count({
      where: {
        assigneeId: userId,
        status: { in: ["PENDING", "IN_PROGRESS"] },
        Project: {
          managerId: session.user.id
        }
      }
    }),
    prisma.task.count({
      where: {
        assigneeId: userId,
        status: "COMPLETED",
        Project: {
          managerId: session.user.id
        }
      }
    }),
    prisma.project.findMany({
      where: {
        managerId: session.user.id,
        status: { notIn: ["COMPLETED", "ARCHIVED", "CANCELLED"] },
        OR: [
          { Team: { TeamMember: { some: { userId, isActive: true } } } },
          { Task: { some: { assigneeId: userId } } }
        ]
      },
      select: { id: true, name: true }
    })
  ])

  return {
    activeTasks,
    completedTasks,
    currentProjects: currentProjects.map(p => p.name)
  }
}

export async function createTeam(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized")
  }
  const raw = {
    name: formData.get("name") as string,
    description: formData.get("description") as string,
    isActive: formData.get("isActive") === "true",
    members: formData.getAll("members"), // array of user IDs
    lead: formData.get("lead") as string,
  }
  const data = teamSchema.parse(raw)
  const memberIds = Array.isArray(raw.members) ? raw.members.map(v => String(v)) : [String(raw.members)].filter(Boolean)
  const leadId = raw.lead ? String(raw.lead) : ""
  const team = await prisma.team.create({
    data: {
      name: data.name,
      description: data.description,
      isActive: data.isActive,
      teamLeadId: leadId || null,
      TeamMember: {
        create: memberIds.map((userId: string) => ({
          userId,
          role: userId === leadId ? "LEAD" : "MEMBER",
          isActive: true,
        })),
      },
    },
    include: { TeamMember: true },
  })
  revalidatePath("/dashboard/admin/teams")
  return team
}

export async function updateTeam(id: string, formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized")
  }
  const raw = {
    name: formData.get("name") as string,
    description: formData.get("description") as string,
    isActive: formData.get("isActive") === "true",
    members: formData.getAll("members"),
    lead: formData.get("lead") as string,
  }
  const data = teamSchema.parse(raw)
  const memberIds = Array.isArray(raw.members) ? raw.members.map(v => String(v)) : [String(raw.members)].filter(Boolean)
  const leadId = raw.lead ? String(raw.lead) : ""
  // Fetch current members
  const currentMembers = await prisma.teamMember.findMany({ where: { teamId: id } })
  // Remove members not in new list
  const toRemove = currentMembers.filter(m => !memberIds.includes(m.userId)).map(m => m.id)
  // Upsert members (add new, update role for lead)
  await prisma.$transaction([
    prisma.team.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        isActive: data.isActive,
        teamLeadId: leadId || null,
      },
    }),
    ...toRemove.map(memberId => prisma.teamMember.delete({ where: { id: memberId } })),
    ...memberIds.map(userId =>
      prisma.teamMember.upsert({
        where: { userId_teamId: { userId, teamId: id } },
        update: { role: userId === leadId ? "LEAD" : "MEMBER", isActive: true },
        create: { userId, teamId: id, role: userId === leadId ? "LEAD" : "MEMBER", isActive: true },
      })
    ),
  ])
  revalidatePath("/dashboard/admin/teams")
  return prisma.team.findUnique({
    where: { id },
    include: { TeamMember: true },
  })
}

export async function deleteTeam(id: string) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized")
  }
  await prisma.team.delete({ where: { id } })
  revalidatePath("/dashboard/admin/teams")
}

const addMemberSchema = z.object({
  userId: z.string().min(1),
  teamId: z.string().min(1),
  role: z.enum(["MEMBER", "LEAD", "ADMIN"]).default("MEMBER"),
});

export async function addTeamMember(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized");
  const raw = {
    userId: formData.get("userId") as string,
    teamId: formData.get("teamId") as string,
    role: (formData.get("role") as string) || "MEMBER",
  };
  const data = addMemberSchema.parse(raw);
  // If setting as LEAD, demote any existing LEAD to MEMBER
  if (data.role === "LEAD") {
    await prisma.teamMember.updateMany({
      where: { teamId: data.teamId, role: "LEAD" },
      data: { role: "MEMBER" as TeamRole },
    });
  }
  const member = await prisma.teamMember.create({
    data: {
      userId: data.userId,
      teamId: data.teamId,
      role: data.role as TeamRole,
      isActive: true,
    },
  });
  revalidatePath("/dashboard/admin/teams");
  return member;
}

export async function updateTeamMemberRole(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized");
  const teamMemberId = formData.get("teamMemberId") as string;
  const role = (formData.get("role") as string) || "MEMBER";
  const teamId = formData.get("teamId") as string;
  // If setting as LEAD, demote any existing LEAD to MEMBER
  if (role === "LEAD") {
    await prisma.teamMember.updateMany({
      where: { teamId, role: "LEAD" },
      data: { role: "MEMBER" as TeamRole },
    });
  }
  const updated = await prisma.teamMember.update({
    where: { id: teamMemberId },
    data: { role: role as TeamRole },
  });
  revalidatePath("/dashboard/admin/teams");
  return updated;
}

export async function removeTeamMember(teamMemberId: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized");
  await prisma.teamMember.delete({ where: { id: teamMemberId } });
  revalidatePath("/dashboard/admin/teams");
}

export async function getTeamMemberOptions() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized")
  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      OR: [
        { role: "TEAM_MEMBER" },
        { role: "PROJECT_MANAGER" },
      ],
    },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })
  return users
}

export async function getAvailableUsersForProjectManager() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "PROJECT_MANAGER") throw new Error("Unauthorized")
  
  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      role: "TEAM_MEMBER",
      // Exclude users already in teams led by this project manager
      NOT: {
        TeamMember: {
          some: {
            Team: {
              teamLeadId: session.user.id
            }
          }
        }
      }
    },
    select: { 
      id: true, 
      name: true, 
      email: true 
    },
    orderBy: { name: "asc" },
  })
  return users
}

export async function addTeamMemberForProjectManager(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "PROJECT_MANAGER") throw new Error("Unauthorized")
  
  const raw = {
    userId: formData.get("userId") as string,
    teamId: formData.get("teamId") as string,
    role: (formData.get("role") as string) || "MEMBER",
  }
  
  // Verify the project manager is the team lead
  const team = await prisma.team.findUnique({
    where: { id: raw.teamId },
    select: { teamLeadId: true }
  })
  
  if (!team || team.teamLeadId !== session.user.id) {
    throw new Error("Unauthorized: You can only add members to teams you lead")
  }
  
  const data = addMemberSchema.parse(raw)
  
  // If setting as LEAD, demote any existing LEAD to MEMBER
  if (data.role === "LEAD") {
    await prisma.teamMember.updateMany({
      where: { teamId: data.teamId, role: "LEAD" },
      data: { role: "MEMBER" as TeamRole },
    })
  }
  
  const member = await prisma.teamMember.create({
    data: {
      userId: data.userId,
      teamId: data.teamId,
      role: data.role as TeamRole,
      isActive: true,
    },
  })
  
  revalidatePath("/dashboard/project-manager/team")
  return member
} 