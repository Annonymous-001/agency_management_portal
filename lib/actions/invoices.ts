import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import * as z from "zod"

const invoiceSchema = z.object({
  amount: z.string().min(1, "Amount is required"),
  currency: z.string().default("USD"),
  dueDate: z.string().min(1, "Due date is required"),
  paid: z.boolean().optional(),
  status: z.enum(["PENDING", "SENT", "PAID", "OVERDUE", "CANCELLED"]).default("PENDING"),
  notes: z.string().optional(),
  clientId: z.string().min(1, "Client is required"),
  projectId: z.string().min(1, "Project is required"),
})

export async function getInvoices() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized")
  const invoices = await prisma.invoice.findMany({
    include: {
      Project: true,
      User: true, // client
    },
    orderBy: { createdAt: "desc" },
  })
  // Debug log
  console.log("[getInvoices] count:", invoices.length)
  if (invoices.length > 0) {
    console.log("[getInvoices] first invoice:", invoices[0])
  }
  return invoices.map(invoice => ({
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    amount: invoice.amount.toString(),
    currency: invoice.currency,
    dueDate: invoice.dueDate ? invoice.dueDate.toISOString() : null,
    paid: invoice.paid,
    paymentLink: invoice.paymentLink,
    receiptUrl: invoice.receiptUrl,
    status: invoice.status,
    notes: invoice.notes,
    client: invoice.User ? { id: invoice.User.id, name: invoice.User.name } : null,
    project: invoice.Project ? { id: invoice.Project.id, name: invoice.Project.name } : null,
    createdAt: invoice.createdAt,
    updatedAt: invoice.updatedAt,
    paidAt: invoice.paidAt,
  }))
}

export async function createInvoice(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized")
  const raw = Object.fromEntries(formData.entries())
  const parsed = {
    ...raw,
    paid: typeof raw.paid === "string" ? raw.paid === "true" : false,
  }
  const data = invoiceSchema.parse(parsed)
  const invoice = await prisma.invoice.create({
    data: {
      amount: parseFloat(data.amount),
      currency: data.currency,
      dueDate: new Date(data.dueDate),
      paid: data.paid ?? false,
      status: data.status,
      notes: data.notes,
      clientId: data.clientId,
      projectId: data.projectId,
    },
  })
  revalidatePath("/dashboard/admin/invoices")
  return invoice
}

export async function updateInvoice(id: string, formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized")
  const raw = Object.fromEntries(formData.entries())
  const parsed = {
    ...raw,
    paid: typeof raw.paid === "string" ? raw.paid === "true" : false,
  }
  const data = invoiceSchema.parse(parsed)
  const invoice = await prisma.invoice.update({
    where: { id },
    data: {
      amount: parseFloat(data.amount),
      currency: data.currency,
      dueDate: new Date(data.dueDate),
      paid: data.paid ?? false,
      status: data.status,
      notes: data.notes,
      clientId: data.clientId,
      projectId: data.projectId,
    },
  })
  revalidatePath("/dashboard/admin/invoices")
  return invoice
}

export async function deleteInvoice(id: string) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized")
  await prisma.invoice.delete({ where: { id } })
  revalidatePath("/dashboard/admin/invoices")
} 