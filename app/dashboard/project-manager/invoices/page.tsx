import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Eye, Edit, Send, CheckCircle } from "lucide-react"

export default async function ProjectManagerInvoicesPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "PROJECT_MANAGER") {
    redirect("/auth/signin")
  }

  // TODO: Replace with server action to fetch invoices
  const invoices = [
    {
      id: "1",
      invoiceNumber: "INV-2024-001",
      amount: 5000,
      currency: "USD",
      dueDate: "2024-02-01",
      status: "SENT",
      project: "Website Redesign",
      client: "Acme Corp",
      notes: "First milestone payment",
    },
    {
      id: "2",
      invoiceNumber: "INV-2024-002",
      amount: 8000,
      currency: "USD",
      dueDate: "2024-01-15",
      status: "PAID",
      project: "Brand Identity",
      client: "Tech Startup",
      notes: "Final payment",
      paidAt: "2024-01-10",
    },
    {
      id: "3",
      invoiceNumber: "INV-2024-003",
      amount: 12500,
      currency: "USD",
      dueDate: "2024-01-20",
      status: "OVERDUE",
      project: "Mobile App Development",
      client: "Retail Company",
      notes: "Second milestone payment",
    },
  ]

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <DashboardHeader
        title="Invoices"
        breadcrumbs={[{ label: "Project Manager", href: "/dashboard/project-manager" }]}
      />

      <div className="flex justify-between items-center">
        <p className="text-muted-foreground">Manage project invoices and payments</p>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Invoice
        </Button>
      </div>

      <div className="grid gap-4">
        {invoices.map((invoice) => (
          <Card key={invoice.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{invoice.invoiceNumber}</CardTitle>
                  <CardDescription>
                    {invoice.project} • {invoice.client}
                  </CardDescription>
                </div>
                <Badge
                  variant={
                    invoice.status === "PAID" ? "default" : invoice.status === "OVERDUE" ? "destructive" : "secondary"
                  }
                >
                  {invoice.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">
                    ${invoice.amount.toLocaleString()} {invoice.currency}
                  </span>
                  <div className="text-right text-sm text-muted-foreground">
                    <p>Due: {new Date(invoice.dueDate).toLocaleDateString()}</p>
                    {invoice.paidAt && <p>Paid: {new Date(invoice.paidAt).toLocaleDateString()}</p>}
                  </div>
                </div>
                {invoice.notes && <p className="text-sm text-muted-foreground">{invoice.notes}</p>}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  {invoice.status === "SENT" && (
                    <Button size="sm">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark as Paid
                    </Button>
                  )}
                  {invoice.status === "OVERDUE" && (
                    <Button variant="destructive" size="sm">
                      <Send className="h-4 w-4 mr-2" />
                      Send Reminder
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
