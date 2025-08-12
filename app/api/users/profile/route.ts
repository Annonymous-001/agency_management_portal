import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { uploadImage } from "@/lib/cloudinary"

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
})

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const userId = session.user.id
  const formData = await request.formData()
  const rawData = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    phone: formData.get("phone") as string,
  }
  let avatarUrl = undefined
  const avatarFile = formData.get("avatar") as File | null
  if (avatarFile && typeof avatarFile !== "string") {
    try {
      // Convert file to buffer and upload to Cloudinary
      const buffer = Buffer.from(await avatarFile.arrayBuffer())
      avatarUrl = await uploadImage(buffer, `avatars/${userId}`)
    } catch (error) {
      console.error('Error uploading image to Cloudinary:', error)
      return NextResponse.json({ error: "Failed to upload image" }, { status: 500 })
    }
  }
  try {
    const validated = profileSchema.parse(rawData)
    // Check if email is already taken by another user
    const existingUser = await prisma.user.findFirst({
      where: {
        email: validated.email,
        id: { not: userId },
      },
    })
    if (existingUser) {
      return NextResponse.json({ error: "Email is already taken by another user" }, { status: 400 })
    }
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: validated.name,
        email: validated.email,
        phone: validated.phone,
        ...(avatarUrl ? { avatar: avatarUrl } : {}),
      },
    })
    return NextResponse.json(updatedUser)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
} 