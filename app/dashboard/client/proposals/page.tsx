import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Check, X } from "lucide-react"

export default async function ClientProposalsPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "CLIENT") {
    redirect("/auth/signin")
  }

  // TODO: Replace with server action to fetch user's proposals
  const proposals = [
    {
      id: "1",
      title: "Mobile App Development Proposal",
      status: "SENT",
      version: 1,
      validUntil: "2024-02-15",
      project: "Mobile App Development",
      createdAt: "2024-01-10",
    },
    {
      id: "2",
      title: "Website Redesign Phase 2",
      status: "APPROVED",
      version: 2,
      validUntil: "2024-01-30",
      project: "Website Redesign",
      createdAt: "2024-01-05",
    },
    {
      id: "3",
      title: "E-commerce Integration Proposal",
      status: "DRAFT",
      version: 1,
      validUntil: "2024-03-01",
      project: "E-commerce Platform",
      createdAt: "2024-01-12",
    },
  ]

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <DashboardHeader title="Proposals" breadcrumbs={[{ label: "Client", href: "/dashboard/client" }]} />

      <div className="grid gap-4">
        {proposals.map((proposal) => (
          <Card key={proposal.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{proposal.title}</CardTitle>
                  <CardDescription>
                    {proposal.project} • Version {proposal.version}
                  </CardDescription>
                </div>
                <Badge
                  variant={
                    proposal.status === "APPROVED"
                      ? "default"
                      : proposal.status === "REJECTED"
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {proposal.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Created: {new Date(proposal.createdAt).toLocaleDateString()}</span>
                  <span>Valid until: {new Date(proposal.validUntil).toLocaleDateString()}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                  {proposal.status === "SENT" && (
                    <>
                      <Button size="sm" variant="default">
                        <Check className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button size="sm" variant="destructive">
                        <X className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </>
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
