import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Clock, Play, Pause, CheckCircle } from "lucide-react"

export default async function TeamMemberTasksPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "TEAM_MEMBER") {
    redirect("/auth/signin")
  }

  // TODO: Replace with server action to fetch user's tasks
  const tasks = [
    {
      id: "1",
      title: "Implement user authentication",
      description: "Set up NextAuth.js with database integration",
      status: "IN_PROGRESS",
      priority: "HIGH",
      deadline: "2024-01-20",
      estimatedHours: 16,
      actualHours: 12,
      project: "Website Redesign",
    },
    {
      id: "2",
      title: "Design mobile wireframes",
      description: "Create wireframes for all mobile app screens",
      status: "PENDING",
      priority: "MEDIUM",
      deadline: "2024-01-25",
      estimatedHours: 24,
      actualHours: 0,
      project: "Mobile App Development",
    },
    {
      id: "3",
      title: "Code review and testing",
      description: "Review code and perform comprehensive testing",
      status: "PENDING",
      priority: "URGENT",
      deadline: "2024-01-18",
      estimatedHours: 8,
      actualHours: 0,
      project: "Website Redesign",
    },
    {
      id: "4",
      title: "UI component library",
      description: "Create reusable UI components for the website",
      status: "COMPLETED",
      priority: "MEDIUM",
      deadline: "2024-01-15",
      estimatedHours: 12,
      actualHours: 14,
      project: "Website Redesign",
    },
  ]

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <DashboardHeader title="My Tasks" breadcrumbs={[{ label: "Team Member", href: "/dashboard/team-member" }]} />

      <div className="grid gap-4">
        {tasks.map((task) => (
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
                      task.status === "COMPLETED" ? "default" : task.status === "IN_PROGRESS" ? "secondary" : "outline"
                    }
                  >
                    {task.status.replace("_", " ")}
                  </Badge>
                  <Badge
                    variant={
                      task.priority === "URGENT" ? "destructive" : task.priority === "HIGH" ? "destructive" : "outline"
                    }
                  >
                    {task.priority}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{task.project}</span>
                  <span>Due: {new Date(task.deadline).toLocaleDateString()}</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Progress</span>
                    <span>
                      {task.actualHours}/{task.estimatedHours} hours
                    </span>
                  </div>
                  <Progress value={(task.actualHours / task.estimatedHours) * 100} className="h-2" />
                </div>

                <div className="flex gap-2">
                  {task.status === "PENDING" && (
                    <Button size="sm">
                      <Play className="h-4 w-4 mr-2" />
                      Start Task
                    </Button>
                  )}
                  {task.status === "IN_PROGRESS" && (
                    <>
                      <Button size="sm" variant="outline">
                        <Pause className="h-4 w-4 mr-2" />
                        Pause
                      </Button>
                      <Button size="sm">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Complete
                      </Button>
                    </>
                  )}
                  <Button variant="outline" size="sm">
                    <Clock className="h-4 w-4 mr-2" />
                    Log Time
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
