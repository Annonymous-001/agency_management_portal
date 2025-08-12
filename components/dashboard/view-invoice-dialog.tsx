"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Download, CreditCard, Calendar, DollarSign, User, FolderOpen, FileText } from "lucide-react"
import { toast } from "sonner"

interface ViewInvoiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  invoice: any
}

export function ViewInvoiceDialog({ open, onOpenChange, invoice }: ViewInvoiceDialogProps) {
  if (!invoice) return null

  const handleDownloadInvoice = async () => {
    try {
      if (!invoice.receiptUrl) {
        toast.error("Receipt URL not available")
        return
      }
  
      const response = await fetch(invoice.receiptUrl)
      if (!response.ok) throw new Error("Failed to fetch receipt")
  
      const blob = await response.blob()
      const contentType = response.headers.get("content-type") || ""
  
      // Determine extension from content type
      let extension = "pdf"
      if (contentType.includes("jpeg") || contentType.includes("jpg")) extension = "jpg"
      else if (contentType.includes("png")) extension = "png"
      else if (contentType.includes("gif")) extension = "gif"
      else if (contentType.includes("pdf")) extension = "pdf"
  
      const blobUrl = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = blobUrl
      link.download = `${invoice.invoiceNumber || invoice.id}.${extension}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(blobUrl)
  
      toast.success("Receipt downloaded successfully")
    } catch (error) {
      toast.error("Failed to download receipt")
      console.error(error)
    }
  }

  const handlePayNow = () => {
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
      default:
        return "outline"
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Invoice Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Invoice Header */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">
                    Invoice #{invoice.invoiceNumber || invoice.id}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Created on {formatDate(invoice.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusVariant(invoice.status)}>
                    {invoice.status}
                  </Badge>
                  {invoice.status === "PAID" && (
                    <Badge variant="default">Paid</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Invoice Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Client Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Client Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{invoice.User?.name || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{invoice.User?.email || "-"}</p>
                </div>
              </CardContent>
            </Card>

            {/* Project Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FolderOpen className="h-4 w-4" />
                  Project Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Project Name</p>
                  <p className="font-medium">{invoice.Project?.name || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Project ID</p>
                  <p className="font-medium text-sm">{invoice.Project?.id || "-"}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Financial Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Financial Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="text-xl font-bold">
                    {formatCurrency(invoice.amount, invoice.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Currency</p>
                  <p className="font-medium">{invoice.currency || "USD"}</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Due Date</p>
                  <p className="font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(invoice.dueDate)}
                  </p>
                </div>
                {invoice.paidAt && (
                  <div>
                    <p className="text-sm text-muted-foreground">Paid Date</p>
                    <p className="font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {formatDate(invoice.paidAt)}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          {(invoice.notes || invoice.paymentLink || invoice.receiptUrl) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {invoice.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Notes</p>
                    <p className="text-sm bg-muted p-3 rounded-md">{invoice.notes}</p>
                  </div>
                )}
                
                {invoice.paymentLink && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Payment Link</p>
                    <p className="text-sm text-blue-600 break-all">{invoice.paymentLink}</p>
                  </div>
                )}
                
                {invoice.receiptUrl && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Receipt URL</p>
                    <p className="text-sm text-blue-600 break-all">{invoice.receiptUrl}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end">
          {invoice.status === "PAID" && invoice.receiptUrl && (
  <Button variant="outline" onClick={handleDownloadInvoice}>
    <Download className="h-4 w-4 mr-2" />
    Download Receipt
  </Button>
)}

            
            {invoice.status !== "PAID" && invoice.paymentLink && (
              <Button onClick={handlePayNow}>
                <CreditCard className="h-4 w-4 mr-2" />
                Pay Now
              </Button>
            )}
            
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
