import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Plus, Edit, UserPlus, Calendar, Clock } from "lucide-react"
import { getTasksForProjectManager } from "@/lib/actions/tasks"
import { TaskFormWrapper } from "@/components/dashboard/task-form-wrapper"

export default async function ProjectManagerTasksPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "PROJECT_MANAGER") {
    redirect("/auth/signin")
  }

  // Fetch real tasks data
  const tasks = await getTasksForProjectManager()

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <DashboardHeader title="Tasks" breadcrumbs={[{ label: "Project Manager", href: "/dashboard/project-manager" }]} />

      <div className="flex justify-between items-center">
        <p className="text-muted-foreground">Manage and assign tasks across all projects</p>
        <TaskFormWrapper />
      </div>

      <div className="grid gap-4">
        {tasks.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">No tasks yet</h3>
                <p className="text-muted-foreground mb-4">
                  Get started by creating your first task
                </p>
                <TaskFormWrapper 
                  trigger={
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Task
                    </Button>
                  }
                />
              </div>
            </CardContent>
          </Card>
        ) : (
          tasks.map((task) => (
            <Card key={task.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{task.title}</CardTitle>
                    <CardDescription>{task.description}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        task.status === "COMPLETED" 
                          ? "default" 
                          : task.status === "IN_PROGRESS" 
                            ? "secondary" 
                            : task.status === "BLOCKED"
                              ? "destructive"
                              : "outline"
                      }
                    >
                      {task.status.replace("_", " ")}
                    </Badge>
                    <Badge
                      variant={
                        task.priority === "HIGH" || task.priority === "URGENT"
                          ? "destructive" 
                          : task.priority === "MEDIUM" 
                            ? "secondary" 
                            : "outline"
                      }
                    >
                      {task.priority}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Project</p>
                      <p className="font-medium">{task.project?.name || "Unknown Project"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Deadline</p>
                      <p className="font-medium">
                        {task.deadline ? new Date(task.deadline).toLocaleDateString() : "Not set"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Hours</p>
                      <p className="font-medium">
                        {task.actualHours || 0}/{task.estimatedHours || 0}h
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Assignee</p>
                      {task.assignee ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">{task.assignee.avatar}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{task.assignee.name}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Unassigned</span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <TaskFormWrapper 
                      task={task}
                      trigger={
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      }
                    />
                    {!task.assignee && (
                      <TaskFormWrapper 
                        task={task}
                        trigger={
                          <Button variant="outline" size="sm">
                            <UserPlus className="h-4 w-4 mr-2" />
                            Assign
                          </Button>
                        }
                      />
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
