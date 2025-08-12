import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { uploadProjectFile, deleteFile } from "@/lib/cloudinary"
import { prisma } from "@/lib/prisma"
import { getFileType } from "@/lib/utils"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const projectId = formData.get("projectId") as string
    const name = formData.get("name") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 })
    }

    // Check if user has access to the project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        User_Project_clientIdToUser: true,
        User_Project_managerIdToUser: true,
        Team: {
          include: {
            TeamMember: {
              where: { userId: session.user.id, isActive: true }
            }
          }
        }
      }
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Check access permissions
    const hasAccess = 
      session.user.role === "ADMIN" ||
      project.clientId === session.user.id ||
      project.managerId === session.user.id ||
      (Array.isArray(project.Team?.TeamMember) && project.Team.TeamMember.length > 0)

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File size too large. Maximum size is 10MB." }, { status: 400 })
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Determine resource type based on file type
    let resourceType: 'auto' | 'image' | 'video' | 'raw' = 'auto'
    if (file.type.startsWith('image/')) {
      resourceType = 'image'
    } else if (file.type.startsWith('video/')) {
      resourceType = 'video'
    } else {
      resourceType = 'raw'
    }

    // Upload to Cloudinary using the utility function
    const uploadResult = await uploadProjectFile(
      buffer,
      projectId,
      name || file.name,
      resourceType
    )

    // Extract file type using utility function
    const mimeType = file.type || ''
    const fileType = getFileType(file.name, mimeType)

    // Save file record to database
    const fileRecord = await prisma.file.create({
      data: {
        name: name || file.name,
        url: uploadResult.secure_url,
        type: fileType,
        size: uploadResult.bytes || file.size,
        mimeType: mimeType,
        userId: session.user.id,
        projectId: projectId
      }
    })

    return NextResponse.json(fileRecord)
  } catch (error: any) {
    console.error("File upload error:", error)
    return NextResponse.json({ error: error.message || "Failed to upload file" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get("id")

    if (!fileId) {
      return NextResponse.json({ error: "File ID is required" }, { status: 400 })
    }

    // Get file record
    const fileRecord = await prisma.file.findUnique({
      where: { id: fileId },
      include: {
        Project: {
          include: {
            User_Project_clientIdToUser: true,
            User_Project_managerIdToUser: true,
            Team: {
              include: {
                TeamMember: {
                  where: { userId: session.user.id, isActive: true }
                }
              }
            }
          }
        }
      }
    })

    if (!fileRecord) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // Check access permissions
    const hasAccess = 
      session.user.role === "ADMIN" ||
      fileRecord.userId === session.user.id ||
      fileRecord.Project.clientId === session.user.id ||
      fileRecord.Project.managerId === session.user.id ||
      (Array.isArray(fileRecord.Project.Team?.TeamMember) && fileRecord.Project.Team.TeamMember.length > 0)

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Extract public ID from Cloudinary URL
    const urlParts = fileRecord.url.split('/')
    const publicIdWithExtension = urlParts[urlParts.length - 1]
    const publicId = publicIdWithExtension.split('.')[0]

    // Delete from Cloudinary
    try {
      await deleteFile(publicId, 'raw')
    } catch (cloudinaryError) {
      console.error("Failed to delete from Cloudinary:", cloudinaryError)
      // Continue with database deletion even if Cloudinary deletion fails
    }

    // Delete from database
    await prisma.file.delete({
      where: { id: fileId }
    })

    return NextResponse.json({ message: "File deleted successfully" })
  } catch (error: any) {
    console.error("File deletion error:", error)
    return NextResponse.json({ error: error.message || "Failed to delete file" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")

    let whereClause: any = {}

    // Filter by project if specified
    if (projectId) {
      whereClause.projectId = projectId
    }

    // Apply role-based filtering
    if (session.user.role === "CLIENT") {
      whereClause.Project = {
        clientId: session.user.id
      }
    } else if (session.user.role === "PROJECT_MANAGER") {
      whereClause.Project = {
        managerId: session.user.id
      }
    } else if (session.user.role === "TEAM_MEMBER") {
      whereClause.Project = {
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
    // ADMIN can see all files

    const files = await prisma.file.findMany({
      where: whereClause,
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        Project: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json(files)
  } catch (error: any) {
    console.error("File fetch error:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch files" }, { status: 500 })
  }
} 