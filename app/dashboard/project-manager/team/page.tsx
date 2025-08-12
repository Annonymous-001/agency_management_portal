import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Plus, Mail, UserCheck, Users, Calendar } from "lucide-react"
import { getTeamsForProjectManager, getAvailableUsersForProjectManager } from "@/lib/actions/teams"
import { AddTeamMemberForm } from "@/components/dashboard/add-team-member-form"
import { TaskFormWrapper } from "@/components/dashboard/task-form-wrapper"
import Link from "next/link"

export default async function ProjectManagerTeamPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "PROJECT_MANAGER") {
    redirect("/auth/signin")
  }

  // Fetch real team data
  const teamMembers = await getTeamsForProjectManager()
  const availableUsers = await getAvailableUsersForProjectManager()

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <DashboardHeader title="Team" breadcrumbs={[{ label: "Project Manager", href: "/dashboard/project-manager" }]} />

      <div className="flex justify-between items-center">
        <p className="text-muted-foreground">Manage your team members and their assignments</p>
        {teamMembers.length > 0 && availableUsers.length > 0 && (
          <AddTeamMemberForm 
            teamId={teamMembers[0].teamId}
            teamName={teamMembers[0].teamName}
            availableUsers={availableUsers}
            onSubmit={async (formData) => {
              'use server'
              const { addTeamMemberForProjectManager } = await import('@/lib/actions/teams')
              await addTeamMemberForProjectManager(formData)
            }}
            trigger={
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Team Member
              </Button>
            }
          />
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {teamMembers.length === 0 ? (
          <Card className="md:col-span-2">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No team members yet</h3>
                <p className="text-muted-foreground mb-4">
                  You don't have any team members assigned to your teams
                </p>
                <p className="text-sm text-muted-foreground">
                  Team members will appear here when they are added to teams you lead
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          teamMembers.map((member) => (
            <Card key={member.id}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={member.avatar || "/noavatar.png"} alt={`${member.name}'s avatar`} />
                  
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{member.name}</CardTitle>
                    <CardDescription>{member.email}</CardDescription>
                  </div>
                  <Badge variant="outline">{member.role.replace("_", " ")}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Active Tasks</p>
                      <p className="font-medium text-lg">{member.activeTasks}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Completed</p>
                      <p className="font-medium text-lg">{member.completedTasks}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-muted-foreground text-sm mb-2">Current Projects</p>
                    {member.currentProjects.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {member.currentProjects.map((project, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {project}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">No active projects</p>
                    )}
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Last active: {new Date(member.lastActive).toLocaleString()}
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/project-manager/messages?user=${member.userId}`}>
                        <Mail className="h-4 w-4 mr-2" />
                        Message
                      </Link>
                    </Button>
                    <TaskFormWrapper 
                      trigger={
                        <Button variant="outline" size="sm">
                          <UserCheck className="h-4 w-4 mr-2" />
                          Assign Task
                        </Button>
                      }
                    />
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
