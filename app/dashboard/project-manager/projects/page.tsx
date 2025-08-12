import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Plus, Eye, Edit, Users, CheckSquare, Calendar, DollarSign } from "lucide-react"
import Link from "next/link"
import { getProjects, getProjectFormOptions } from "@/lib/actions/projects"
import { ProjectForm } from "@/components/projects/project-form"
import { ProjectFormWrapper } from "@/components/projects/project-form-wrapper"

export default async function ProjectManagerProjectsPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "PROJECT_MANAGER") {
    redirect("/auth/signin")
  }

  // Fetch real projects data
  const projects = await getProjects()
  const formOptions = await getProjectFormOptions()

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <DashboardHeader
        title="Projects"
        breadcrumbs={[{ label: "Project Manager", href: "/dashboard/project-manager" }]}
      />

      <div className="flex justify-between items-center">
        <p className="text-muted-foreground">Manage all your projects and track progress</p>
        <ProjectFormWrapper 
          clients={formOptions.clients}
          managers={formOptions.managers}
          teams={formOptions.teams}
          userRole="PROJECT_MANAGER"
          currentUserId={session.user.id}
        />
      </div>

      <div className="grid gap-4">
        {projects.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
                <p className="text-muted-foreground mb-4">
                  Get started by creating your first project
                </p>
                <ProjectFormWrapper 
                  clients={formOptions.clients}
                  managers={formOptions.managers}
                  teams={formOptions.teams}
                  userRole="PROJECT_MANAGER"
                  currentUserId={session.user.id}
                  trigger={
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Project
                    </Button>
                  }
                />
              </div>
            </CardContent>
          </Card>
        ) : (
          projects.map((project) => {
            // Handle different project types based on role
            const clientName = 'User_Project_clientIdToUser' in project 
              ? project.User_Project_clientIdToUser?.name 
              : 'Unknown'
            
            const teamMemberCount = 'Team' in project && project.Team 
              ? ('TeamMember' in project.Team ? project.Team.TeamMember?.length : 0)
              : 0
            
            const taskCount = '_count' in project ? project._count?.Task || 0 : 0

            return (
              <Card key={project.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      <CardDescription>{project.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          project.status === "COMPLETED"
                            ? "default"
                            : project.status === "IN_PROGRESS"
                              ? "secondary"
                              : project.status === "REVIEW"
                                ? "outline"
                                : "outline"
                        }
                      >
                        {project.status.replace("_", " ")}
                      </Badge>
                      <Badge
                        variant={
                          project.priority === "HIGH" || project.priority === "URGENT"
                            ? "destructive"
                            : project.priority === "MEDIUM"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {project.priority}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span>Progress</span>
                        <span>{project.progress}%</span>
                      </div>
                      <Progress value={project.progress} className="h-2" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Client</p>
                        <p className="font-medium">{clientName}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Due Date</p>
                        <p className="font-medium">
                          {project.dueDate ? new Date(project.dueDate).toLocaleDateString() : "Not set"}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Budget</p>
                        <p className="font-medium">
                          {project.budget ? (
                            <>
                              ${Number(project.spentAmount || 0).toLocaleString()} / ${Number(project.budget).toLocaleString()}
                            </>
                          ) : (
                            "Not set"
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Team & Tasks</p>
                        <p className="font-medium">
                          {teamMemberCount} members • {taskCount} tasks
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/project-manager/projects/${project.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Link>
                      </Button>
                      <ProjectFormWrapper 
                        project={project}
                        clients={formOptions.clients}
                        managers={formOptions.managers}
                        teams={formOptions.teams}
                        userRole="PROJECT_MANAGER"
                        currentUserId={session.user.id}
                        trigger={
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        }
                      />
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/project-manager/projects/${project.id}/team`}>
                          <Users className="h-4 w-4 mr-2" />
                          Team
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/project-manager/tasks?project=${project.id}`}>
                          <CheckSquare className="h-4 w-4 mr-2" />
                          Tasks
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
