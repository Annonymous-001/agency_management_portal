import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { deleteInvoice, updateInvoice } from "@/lib/actions/invoices"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role') || session.user.role

    let whereClause: any = {}

    // Apply role-based filtering with different access patterns
    switch (role) {
      case "CLIENT":
        // Clients can only see their own invoices
        whereClause.clientId = session.user.id
        break
        
      case "PROJECT_MANAGER":
        // Project managers can see invoices for projects they manage
        whereClause.Project = {
          managerId: session.user.id
        }
        break
        
      case "TEAM_MEMBER":
        // Team members can see invoices for projects they're assigned to
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
        break
        
      case "ADMIN":
        // Admins can see all invoices (no where clause needed)
        break
        
      default:
        return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    const invoices = await prisma.invoice.findMany({
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

    return NextResponse.json(invoices)
  } catch (error: any) {
    console.error("Invoice fetch error:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch invoices" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only admins and project managers can create invoices
    if (session.user.role !== "ADMIN" && session.user.role !== "PROJECT_MANAGER") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const formData = await request.formData()
    const projectId = formData.get("projectId") as string
    const clientId = formData.get("clientId") as string
    const amount = parseFloat(formData.get("amount") as string)
    const dueDate = formData.get("dueDate") as string
    const notes = formData.get("notes") as string
    const paymentLink = formData.get("paymentLink") as string

    if (!projectId || !clientId || !amount || !dueDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const invoice = await prisma.invoice.create({
      data: {
        amount,
        dueDate: new Date(dueDate),
        notes,
        paymentLink,
        clientId,
        projectId,
        status: "PENDING"
      },
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
      }
    })

    return NextResponse.json(invoice)
  } catch (error: any) {
    console.error("Invoice creation error:", error)
    return NextResponse.json({ error: error.message || "Failed to create invoice" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "Missing invoice id" }, { status: 400 })
    }

    const formData = await request.formData()
    const projectId = formData.get("projectId") as string
    const clientId = formData.get("clientId") as string
    const amount = parseFloat(formData.get("amount") as string)
    const dueDate = formData.get("dueDate") as string
    const notes = formData.get("notes") as string
    const paymentLink = formData.get("paymentLink") as string
    const receiptUrl = formData.get("receiptUrl") as string
    const status = formData.get("status") as string
    const currency = formData.get("currency") as string

    if (!projectId || !clientId || !amount || !dueDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        amount,
        currency,
        dueDate: new Date(dueDate),
        notes,
        paymentLink,
        receiptUrl,
        status: status as any,
        clientId,
        projectId,
      },
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
      }
    })

    return NextResponse.json(invoice)
  } catch (error: any) {
    console.error("Invoice update error:", error)
    return NextResponse.json({ error: error.message || "Failed to update invoice" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "Missing invoice id" }, { status: 400 })
    }

    await prisma.invoice.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Invoice deletion error:", error)
    return NextResponse.json({ error: error.message || "Failed to delete invoice" }, { status: 500 })
  }
} 