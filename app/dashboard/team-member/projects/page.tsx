import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Eye, CheckSquare } from "lucide-react"
import Link from "next/link"

export default async function TeamMemberProjectsPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "TEAM_MEMBER") {
    redirect("/auth/signin")
  }

  // TODO: Replace with server action to fetch user's assigned projects
  const projects = [
    {
      id: "1",
      name: "Website Redesign",
      description: "Complete redesign of company website with modern UI/UX",
      status: "IN_PROGRESS",
      progress: 75,
      tasksAssigned: 3,
      tasksCompleted: 1,
      dueDate: "2024-02-15",
    },
    {
      id: "2",
      name: "Mobile App Development",
      description: "Native mobile app for iOS and Android",
      status: "REVIEW",
      progress: 90,
      tasksAssigned: 2,
      tasksCompleted: 1,
      dueDate: "2024-03-01",
    },
  ]

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <DashboardHeader title="Projects" breadcrumbs={[{ label: "Team Member", href: "/dashboard/team-member" }]} />

      <div className="grid gap-4">
        {projects.map((project) => (
          <Card key={project.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  <CardDescription>{project.description}</CardDescription>
                </div>
                <Badge variant={project.status === "COMPLETED" ? "default" : "secondary"}>
                  {project.status.replace("_", " ")}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span>Overall Progress</span>
                    <span>{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    My Tasks: {project.tasksCompleted}/{project.tasksAssigned} completed
                  </span>
                  <span>Due: {new Date(project.dueDate).toLocaleDateString()}</span>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/team-member/projects/${project.id}`}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/team-member/tasks?project=${project.id}`}>
                      <CheckSquare className="h-4 w-4 mr-2" />
                      My Tasks
                    </Link>
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
