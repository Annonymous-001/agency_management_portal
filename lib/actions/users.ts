"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"
import { z } from "zod"

// Validation schemas
const createUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["CLIENT", "ADMIN", "TEAM_MEMBER", "PROJECT_MANAGER"]),
  phone: z.string().optional(),
  timezone: z.string().default("UTC"),
})

const updateUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["CLIENT", "ADMIN", "TEAM_MEMBER", "PROJECT_MANAGER"]),
  phone: z.string().optional(),
  timezone: z.string().default("UTC"),
})

export async function getUsers() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized")
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: {
          Project_Project_clientIdToUser: true,
          Project_Project_managerIdToUser: true,
        }
      }
    }
  })

  return users.map(user => ({
    ...user,
    projectsCount: user._count.Project_Project_clientIdToUser + user._count.Project_Project_managerIdToUser
  }))
}

export async function createUser(formData: FormData) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized")
  }

  const rawData = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    role: formData.get("role") as string,
    phone: formData.get("phone") as string,
    timezone: formData.get("timezone") as string || "UTC",
  }

  const validatedData = createUserSchema.parse(rawData)

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: validatedData.email }
  })

  if (existingUser) {
    throw new Error("User with this email already exists")
  }

  const hashedPassword = await bcrypt.hash(validatedData.password, 12)

  const user = await prisma.user.create({
    data: {
      name: validatedData.name,
      email: validatedData.email,
      password: hashedPassword,
      role: validatedData.role,
      phone: validatedData.phone,
      timezone: validatedData.timezone,
      isActive: true,
    },
  })

  revalidatePath("/dashboard/admin/users")
  return user
}

export async function updateUser(id: string, formData: FormData) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized")
  }

  const rawData = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    role: formData.get("role") as string,
    phone: formData.get("phone") as string,
    timezone: formData.get("timezone") as string || "UTC",
  }

  const validatedData = updateUserSchema.parse(rawData)

  // Check if email is already taken by another user
  const existingUser = await prisma.user.findFirst({
    where: { 
      email: validatedData.email,
      id: { not: id }
    }
  })

  if (existingUser) {
    throw new Error("Email is already taken by another user")
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: {
      name: validatedData.name,
      email: validatedData.email,
      role: validatedData.role,
      phone: validatedData.phone,
      timezone: validatedData.timezone,
    },
  })

  revalidatePath("/dashboard/admin/users")
  return updatedUser
}

export async function toggleUserStatus(id: string) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized")
  }

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) throw new Error("User not found")

  // Prevent admin from deactivating themselves
  if (user.id === session.user.id) {
    throw new Error("Cannot deactivate your own account")
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: {
      isActive: !user.isActive,
    },
  })

  revalidatePath("/dashboard/admin/users")
  return updatedUser
}

export async function deleteUser(id: string) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized")
  }

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) throw new Error("User not found")

  // Prevent admin from deleting themselves
  if (user.id === session.user.id) {
    throw new Error("Cannot delete your own account")
  }

  // Check if user has associated data
  const userData = await prisma.user.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          Project_Project_clientIdToUser: true,
          Project_Project_managerIdToUser: true,
          Invoice: true,
          Task_Task_assigneeIdToUser: true,
          Task_Task_createdByToUser: true,
        }
      }
    }
  })

  if (userData && (
    userData._count.Project_Project_clientIdToUser > 0 ||
    userData._count.Project_Project_managerIdToUser > 0 ||
    userData._count.Invoice > 0 ||
    userData._count.Task_Task_assigneeIdToUser > 0 ||
    userData._count.Task_Task_createdByToUser > 0
  )) {
    throw new Error("Cannot delete user with associated projects, invoices, or tasks")
  }

  await prisma.user.delete({
    where: { id },
  })

  revalidatePath("/dashboard/admin/users")
}
