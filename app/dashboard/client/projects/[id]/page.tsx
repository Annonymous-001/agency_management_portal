"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar, DollarSign, Users, Clock, FileText, MessageSquare } from "lucide-react"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"

export default function ClientProjectDetailsPage() {
  const { id } = useParams()
  const { data: session } = useSession()
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session && id) {
      loadProject()
    }
  }, [session, id])

  const loadProject = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/projects?id=${id}`)
      if (!res.ok) throw new Error("Failed to fetch project")
      const data = await res.json()
      setProject(data)
    } catch (error) {
      toast.error("Failed to load project")
    } finally {
      setLoading(false)
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "default"
      case "IN_PROGRESS":
        return "secondary"
      case "REVIEW":
        return "secondary"
      default:
        return "outline"
    }
  }

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "destructive"
      case "MEDIUM":
        return "secondary"
      case "URGENT":
        return "destructive"
      default:
        return "outline"
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <DashboardHeader 
          title="Project Details" 
          breadcrumbs={[
            { label: "Client", href: "/dashboard/client" },
            { label: "Projects", href: "/dashboard/client/projects" }
          ]} 
        />
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-96" />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <DashboardHeader 
          title="Project Not Found" 
          breadcrumbs={[
            { label: "Client", href: "/dashboard/client" },
            { label: "Projects", href: "/dashboard/client/projects" }
          ]} 
        />
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Project not found or you don't have access to it.</p>
            <Button asChild className="mt-4">
              <Link href="/dashboard/client/projects">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Projects
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <DashboardHeader 
        title={project.name} 
        breadcrumbs={[
          { label: "Client", href: "/dashboard/client" },
          { label: "Projects", href: "/dashboard/client/projects" }
        ]} 
      />

      <div className="flex gap-2 mb-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/client/projects">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/dashboard/client/projects/${project.id}/files`}>
            <FileText className="h-4 w-4 mr-2" />
            Files
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/dashboard/client/messages?project=${project.id}`}>
            <MessageSquare className="h-4 w-4 mr-2" />
            Messages
          </Link>
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Project Overview */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{project.name}</CardTitle>
                <CardDescription className="text-base mt-2">{project.description}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={getStatusVariant(project.status)} className="text-sm">
                  {project.status?.replace("_", " ")}
                </Badge>
                <Badge variant={getPriorityVariant(project.priority)} className="text-sm">
                  {project.priority}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Progress */}
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="font-medium">Project Progress</span>
                  <span>{project.progress !== undefined ? `${project.progress}%` : "0%"}</span>
                </div>
                <Progress value={project.progress || 0} className="h-3" />
              </div>

              {/* Key Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Due Date</p>
                    <p className="font-medium">
                      {project.dueDate ? new Date(project.dueDate).toLocaleDateString() : "Not set"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Budget</p>
                    <p className="font-medium">
                      ${project.budget?.toLocaleString() || 0} {project.currency || "USD"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Team Members</p>
                    <p className="font-medium">
                      {project.Team?.TeamMember?.length || 0} members
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Estimated Hours</p>
                    <p className="font-medium">
                      {project.estimatedHours || 0} hours
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Project Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Team Information */}
          <Card>
            <CardHeader>
              <CardTitle>Project Team</CardTitle>
              <CardDescription>Team members working on this project</CardDescription>
            </CardHeader>
            <CardContent>
              {project.Team?.TeamMember && project.Team.TeamMember.length > 0 ? (
                <div className="space-y-3">
                  {project.Team.TeamMember.map((member: any) => (
                    <div key={member.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {member.User.name?.charAt(0) || "U"}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{member.User.name}</p>
                        <p className="text-sm text-muted-foreground">{member.User.email}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {member.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No team members assigned yet.</p>
              )}
            </CardContent>
          </Card>

          {/* Project Manager */}
          <Card>
            <CardHeader>
              <CardTitle>Project Manager</CardTitle>
              <CardDescription>Person responsible for this project</CardDescription>
            </CardHeader>
            <CardContent>
              {project.User_Project_managerIdToUser ? (
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium">
                      {project.User_Project_managerIdToUser.name?.charAt(0) || "P"}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{project.User_Project_managerIdToUser.name}</p>
                    <p className="text-sm text-muted-foreground">{project.User_Project_managerIdToUser.email}</p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No project manager assigned yet.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Additional Information */}
        {(project.tags || project.notes) && (
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {project.tags && (
                <div>
                  <p className="text-sm font-medium mb-2">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {project.tags.split(',').map((tag: string, index: number) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag.trim()}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {project.notes && (
                <div>
                  <p className="text-sm font-medium mb-2">Notes</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{project.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 