"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Plus, Edit, Users, UserPlus } from "lucide-react"
import { TeamForm } from "@/components/dashboard/team-form"
import { DeleteTeamDialog } from "@/components/dashboard/delete-team-dialog"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<any | null>(null)
  const [editingTeam, setEditingTeam] = useState<any | null>(null)

  useEffect(() => {
    loadTeams()
  }, [])

  const loadTeams = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/teams")
      if (!res.ok) throw new Error("Failed to fetch teams")
      const data = await res.json()
      setTeams(data ?? [])
    } catch (error) {
      toast.error("Failed to load teams")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTeam = async (formData: FormData) => {
    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        body: formData,
      })
      if (!res.ok) throw new Error("Failed to create team")
      await loadTeams()
    } catch (error) {
      throw error
    }
  }

  const handleUpdateTeam = async (formData: FormData) => {
    if (!editingTeam) return
    try {
      const res = await fetch(`/api/teams?id=${editingTeam.id}`, {
        method: "PUT",
        body: formData,
      })
      if (!res.ok) throw new Error("Failed to update team")
      await loadTeams()
      setEditingTeam(null)
    } catch (error) {
      throw error
    }
  }

  const handleDeleteTeam = async (teamId: string) => {
    try {
      const res = await fetch(`/api/teams?id=${teamId}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete team")
      await loadTeams()
    } catch (error) {
      throw error
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <DashboardHeader title="Teams" breadcrumbs={[{ label: "Admin", href: "/dashboard/admin" }]} />
        <div className="flex justify-between items-center">
          <p className="text-muted-foreground">Manage teams and their members</p>
          <Button disabled>
            <Plus className="h-4 w-4 mr-2" />
            Create Team
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <Skeleton className="h-6 w-32 mb-2" />
                    <Skeleton className="h-4 w-40 mb-2" />
                  </div>
                  <Skeleton className="h-5 w-20 rounded" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div>
                    <Skeleton className="h-4 w-24 mb-2" />
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                  <div>
                    <Skeleton className="h-4 w-24 mb-2" />
                    <div className="flex -space-x-2">
                      {[...Array(4)].map((_, j) => (
                        <Skeleton key={j} className="h-8 w-8 rounded-full border-2 border-background" />
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Skeleton className="h-8 w-20 rounded" />
                    <Skeleton className="h-8 w-20 rounded" />
                    <Skeleton className="h-8 w-20 rounded" />
                    <Skeleton className="h-8 w-20 rounded" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <DashboardHeader title="Teams" breadcrumbs={[{ label: "Admin", href: "/dashboard/admin" }]} />
      <div className="flex justify-between items-center">
        <p className="text-muted-foreground">Manage teams and their members</p>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Team
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {teams.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No teams found</p>
            </CardContent>
          </Card>
        ) : (
          teams.map((team) => (
            <Card key={team.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{team.name}</CardTitle>
                    <CardDescription>{team.description}</CardDescription>
                  </div>
                  <Badge variant={team.isActive ? "default" : "secondary"}>{team.isActive ? "Active" : "Inactive"}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Members</p>
                      <p className="font-medium text-lg">{team.memberCount}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Active Projects</p>
                      <p className="font-medium text-lg">{team.activeProjects}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm mb-2">Team Lead</p>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={team.lead?.avatar || "/placeholder-user.jpg"} alt={team.lead?.name} />
                      </Avatar>
                      <span className="font-medium">{team.lead?.name || "-"}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm mb-2">Members</p>
                    <div className="flex -space-x-2">
                      {team.members.slice(0, 4).map((member: any, index: number) => (
                        <Avatar key={index} className="h-8 w-8 border-2 border-background">
                          <AvatarImage src={member.avatar || "/placeholder-user.jpg"} alt={member.name} />
                        </Avatar>
                      ))}
                      {team.memberCount > 4 && (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium">
                          +{team.memberCount - 4}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Users className="h-4 w-4 mr-2" />
                      View Members
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingTeam(team)
                        setFormOpen(true)
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setSelectedTeam(team)
                        setDeleteDialogOpen(true)
                      }}
                    >
                      Delete
                    </Button>
                    <Button variant="outline" size="sm">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Member
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      <TeamForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) {
            setEditingTeam(null)
          }
        }}
        team={editingTeam || undefined}
        onSubmit={editingTeam ? handleUpdateTeam : handleCreateTeam}
      />
      {selectedTeam && (
        <DeleteTeamDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          team={selectedTeam}
          onDelete={handleDeleteTeam}
        />
      )}
    </div>
  )
}
