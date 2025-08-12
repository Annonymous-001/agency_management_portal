import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { uploadReceipt } from "@/lib/cloudinary"

export async function POST(request: NextRequest) {
    try {
      const session = await getServerSession(authOptions)
      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
  
      // Only admins and project managers can upload receipts
      if (session.user.role !== "ADMIN" && session.user.role !== "PROJECT_MANAGER") {
        return NextResponse.json({ error: "Access denied" }, { status: 403 })
      }
  
      const formData = await request.formData()
      const file = formData.get("file") as File
      const invoiceId = formData.get("invoiceId") as string
  
      if (!file || !invoiceId) {
        return NextResponse.json({ error: "Missing file or invoice ID" }, { status: 400 })
      }
  
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json({ error: "Invalid file type" }, { status: 400 })
      }
  
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: "File size too large" }, { status: 400 })
      }
  
      // Check if invoice exists
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId }
      })
  
      if (!invoice) {
        return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
      }
  
      // Convert file to buffer
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
  
      // Upload to Cloudinary with raw type for PDF support
      const uploadResult = await uploadReceipt(buffer, file.name, 'raw')
  
      if (!uploadResult.success) {
        return NextResponse.json({ error: uploadResult.error || "Failed to upload file" }, { status: 500 })
      }
  
      // Update invoice with receipt URL
      const updatedInvoice = await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          receiptUrl: uploadResult.url
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
  
      return NextResponse.json({
        success: true,
        receiptUrl: uploadResult.url,
        invoice: updatedInvoice
      })
  
    } catch (error: any) {
      console.error("Receipt upload error:", error)
      return NextResponse.json(
        { error: error.message || "Failed to upload receipt" },
        { status: 500 }
      )
    }
  }