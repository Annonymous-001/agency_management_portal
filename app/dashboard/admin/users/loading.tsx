import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Plus, Search } from "lucide-react"
import { Input } from "@/components/ui/input"

export default function AdminUsersLoading() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <DashboardHeader title="Users" breadcrumbs={[{ label: "Admin", href: "/dashboard/admin" }]} />

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4 flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input placeholder="Search users..." className="pl-10" disabled />
          </div>
        </div>
        <Button disabled>
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      <div className="grid gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div>
                    <Skeleton className="h-6 w-32 mb-2" />
                    <Skeleton className="h-4 w-40 mb-2" />
                    <div className="flex items-center gap-2 mt-1">
                      <Skeleton className="h-5 w-20 rounded" />
                      <Skeleton className="h-5 w-16 rounded" />
                    </div>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-4 w-28 mb-1" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Skeleton className="h-8 w-20 rounded" />
                <Skeleton className="h-8 w-28 rounded" />
                <Skeleton className="h-8 w-20 rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
