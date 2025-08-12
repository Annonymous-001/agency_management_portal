"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Download, CreditCard } from "lucide-react"
import { toast } from "sonner"

interface Invoice {
  id: string
  invoiceNumber: string
  amount: number
  currency: string
  dueDate: string
  status: "PENDING" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED"
  notes?: string
  paidAt?: string
  paymentLink?: string
  receiptUrl?: string
  Project: {
    id: string
    name: string
  }
  User: {
    id: string
    name: string
    email: string
  }
}

export default function ClientInvoicesPage() {
  const { data: session } = useSession()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)


  const loadInvoices = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/invoices")
      if (!res.ok) throw new Error("Failed to fetch invoices")
      const data = await res.json()
      setInvoices(data ?? [])
    } catch (error) {
      toast.error("Failed to load invoices")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (session?.user?.id) {
      loadInvoices()
    }
  }, [session?.user?.id, loadInvoices])

  const handleDownloadReceipt = async (invoice: Invoice) => {
    try {
      if (!invoice.receiptUrl) {
        toast.error("Receipt URL not available")
        return
      }
  
      const response = await fetch(invoice.receiptUrl)
      if (!response.ok) {
        throw new Error("Failed to fetch receipt file")
      }
  
      const blob = await response.blob()
      const contentType = response.headers.get("content-type")
  
      // Determine file extension
      let extension = "pdf"
      if (contentType?.includes("jpeg") || contentType?.includes("jpg")) extension = "jpg"
      else if (contentType?.includes("png")) extension = "png"
      else if (contentType?.includes("gif")) extension = "gif"
      else if (contentType?.includes("pdf")) extension = "pdf"
  
      // Create blob URL and trigger download
      const blobUrl = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = blobUrl
      link.download = `receipt-${invoice.invoiceNumber || invoice.id}.${extension}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(blobUrl)
  
      toast.success("Receipt download started")
    } catch (error) {
      console.error("Download error:", error)
      toast.error("Failed to download receipt")
    }
  }
  

  const handlePayNow = (invoice: Invoice) => {
    if (invoice.paymentLink) {
      window.open(invoice.paymentLink, '_blank')
    } else {
      toast.error("Payment link not available")
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "PAID":
        return "default"
      case "OVERDUE":
        return "destructive"
      case "SENT":
        return "secondary"
      case "PENDING":
        return "outline"
      case "CANCELLED":
        return "destructive"
      default:
        return "secondary"
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <DashboardHeader title="Invoices" breadcrumbs={[{ label: "Client", href: "/dashboard/client" }]} />
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-8 w-32" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <div className="flex gap-2">
                    <Skeleton className="h-9 w-32" />
                    <Skeleton className="h-9 w-24" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )        )}
      </div>
    </div>
  )
}

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <DashboardHeader title="Invoices" breadcrumbs={[{ label: "Client", href: "/dashboard/client" }]} />

      <div className="grid gap-4">
        {invoices.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <p className="text-muted-foreground">No invoices found</p>
            </CardContent>
          </Card>
        ) : (
          invoices.map((invoice) => (
            <Card key={invoice.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{invoice.invoiceNumber}</CardTitle>
                    <CardDescription>{invoice.Project?.name || "No project"}</CardDescription>
                  </div>
                  <Badge variant={getStatusVariant(invoice.status)}>
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
                    {invoice.status === "PAID" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadReceipt(invoice)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Receipt
                      </Button>
                    )}
                    {invoice.status !== "PAID" && invoice.paymentLink && (
                      <Button
                        size="sm"
                        onClick={() => handlePayNow(invoice)}
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Pay Now
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
