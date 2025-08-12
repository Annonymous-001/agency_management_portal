"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { 
  Calendar, 
  Clock, 
  User, 
  Target, 
  FileText, 
  MessageSquare, 
  CheckSquare,
  AlertCircle,
  FolderOpen,
  Tag,
  Edit,
  ExternalLink
} from "lucide-react"
import Link from "next/link"

interface ViewTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: any
  userRole?: string
}

export function ViewTaskDialog({ open, onOpenChange, task, userRole = "ADMIN" }: ViewTaskDialogProps) {
  if (!task) return null

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "default"
      case "IN_PROGRESS":
        return "secondary"
      case "BLOCKED":
        return "destructive"
      case "CANCELLED":
        return "outline"
      case "PENDING":
        return "outline"
      default:
        return "outline"
    }
  }

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "destructive"
      case "HIGH":
        return "destructive"
      case "MEDIUM":
        return "secondary"
      case "LOW":
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

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatHours = (hours: number) => {
    if (!hours) return "-"
    return `${hours}h`
  }

  const calculateProgress = () => {
    if (!task.estimatedHours || !task.actualHours) return 0
    if (task.estimatedHours === 0) return 0
    return Math.round((Number(task.actualHours) / Number(task.estimatedHours)) * 100)
  }

  const progress = calculateProgress()
  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== "COMPLETED"
  const isDueSoon = task.deadline && new Date(task.deadline) > new Date() && new Date(task.deadline) < new Date(Date.now() + 24 * 60 * 60 * 1000) && task.status !== "COMPLETED"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            Task Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Task Header */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <CardTitle className="text-xl">{task.title}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Created on {formatDate(task.createdAt)}
                  </p>
                  {task.description && (
                    <p className="text-sm mt-2">{task.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusVariant(task.status)}>
                    {task.status?.replace("_", " ")}
                  </Badge>
                  <Badge variant={getPriorityVariant(task.priority)}>
                    {task.priority}
                  </Badge>
                  {isOverdue && (
                    <Badge variant="destructive">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Overdue
                    </Badge>
                  )}
                  {isDueSoon && !isOverdue && (
                    <Badge variant="secondary">
                      <Clock className="h-3 w-3 mr-1" />
                      Due Soon
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Progress Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="h-4 w-4" />
                Task Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span>Hours Progress</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-3" />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Actual: {formatHours(task.actualHours || 0)}</span>
                  <span>Estimated: {formatHours(task.estimatedHours || 0)}</span>
                </div>
              </div>
              
              {task.status === "COMPLETED" && task.completedAt && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckSquare className="h-4 w-4" />
                  Completed on {formatDateTime(task.completedAt)}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Task Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Assignment Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Assignment Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                                 <div>
                   <p className="text-sm text-muted-foreground">Assignee</p>
                   {task.assignee ? (
                     <div className="flex items-center gap-2 mt-1">
                       <Avatar className="h-6 w-6">
                         <AvatarFallback className="text-xs">
                           {task.assignee.name?.charAt(0)?.toUpperCase() || "U"}
                         </AvatarFallback>
                       </Avatar>
                       <span className="font-medium">{task.assignee.name}</span>
                     </div>
                   ) : (
                     <span className="text-muted-foreground">Unassigned</span>
                   )}
                 </div>
                 
                 <Separator />
                 
                 <div>
                   <p className="text-sm text-muted-foreground">Created By</p>
                   {task.creator ? (
                     <div className="flex items-center gap-2 mt-1">
                       <Avatar className="h-6 w-6">
                         <AvatarFallback className="text-xs">
                           {task.creator.name?.charAt(0)?.toUpperCase() || "U"}
                         </AvatarFallback>
                       </Avatar>
                       <span className="font-medium">{task.creator.name}</span>
                     </div>
                   ) : (
                     <div className="text-muted-foreground">
                       <span>System Generated</span>
                       {process.env.NODE_ENV === 'development' && (
                         <div className="text-xs mt-1 text-red-500">
                           No creator data available
                         </div>
                       )}
                     </div>
                   )}
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
              <CardContent className="space-y-3">
                                 <div>
                   <p className="text-sm text-muted-foreground">Project</p>
                   <p className="font-medium flex items-center gap-2">
                     <FolderOpen className="h-4 w-4" />
                     {task.project?.name || "-"}
                   </p>
                 </div>
                 
                 {task.client && (
                   <>
                     <Separator />
                     <div>
                       <p className="text-sm text-muted-foreground">Client</p>
                       <p className="font-medium">{task.client.name}</p>
                     </div>
                   </>
                 )}
              </CardContent>
            </Card>
          </div>

          {/* Timeline Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(task.createdAt)}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Deadline</p>
                  <p className="font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(task.deadline)}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(task.updatedAt)}
                  </p>
                </div>
                
                {task.completedAt && (
                  <div>
                    <p className="text-sm text-muted-foreground">Completed</p>
                    <p className="font-medium flex items-center gap-2">
                      <CheckSquare className="h-4 w-4" />
                      {formatDate(task.completedAt)}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Hours Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Hours Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Estimated Hours</p>
                  <p className="font-medium text-lg">
                    {formatHours(task.estimatedHours)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Actual Hours</p>
                  <p className="font-medium text-lg">
                    {formatHours(task.actualHours)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Hours Remaining</p>
                  <p className="font-medium text-lg">
                    {formatHours((task.estimatedHours || 0) - (task.actualHours || 0))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

                     {/* Additional Information */}
           {task.project && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Related Project Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                     <div>
                     <p className="text-sm text-muted-foreground">Project ID</p>
                     <p className="font-medium">{task.project.id}</p>
                   </div>
                   <div>
                     <p className="text-sm text-muted-foreground">Client</p>
                     <p className="font-medium">{task.client?.name || "-"}</p>
                   </div>
                   <div>
                     <p className="text-sm text-muted-foreground">Project Name</p>
                     <p className="font-medium">{task.project.name}</p>
                   </div>
                   <div>
                     <p className="text-sm text-muted-foreground">Task ID</p>
                     <p className="font-medium">{task.id}</p>
                   </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {userRole === "ADMIN" ? (
                  <>
                                         <Button variant="outline" size="sm" asChild>
                       <Link href={`/dashboard/admin/tasks?project=${task.project?.id}`}>
                         <Target className="h-4 w-4 mr-2" />
                         View Project Tasks
                       </Link>
                     </Button>
                     <Button variant="outline" size="sm" asChild>
                       <Link href={`/dashboard/admin/projects/${task.project?.id}`}>
                         <FolderOpen className="h-4 w-4 mr-2" />
                         View Project
                       </Link>
                     </Button>
                     <Button variant="outline" size="sm" asChild>
                       <Link href={`/dashboard/admin/messages?project=${task.project?.id}`}>
                         <MessageSquare className="h-4 w-4 mr-2" />
                         View Messages
                       </Link>
                     </Button>
                  </>
                ) : userRole === "CLIENT" ? (
                  <>
                                         <Button variant="outline" size="sm" asChild>
                       <Link href={`/dashboard/client/projects/${task.project?.id}`}>
                         <FolderOpen className="h-4 w-4 mr-2" />
                         View Project
                       </Link>
                     </Button>
                     <Button variant="outline" size="sm" asChild>
                       <Link href={`/dashboard/client/messages?project=${task.project?.id}`}>
                         <MessageSquare className="h-4 w-4 mr-2" />
                         View Messages
                       </Link>
                     </Button>
                  </>
                ) : (
                  <>
                                         <Button variant="outline" size="sm" asChild>
                       <Link href={`/dashboard/project-manager/tasks?project=${task.project?.id}`}>
                         <Target className="h-4 w-4 mr-2" />
                         View Project Tasks
                       </Link>
                     </Button>
                     <Button variant="outline" size="sm" asChild>
                       <Link href={`/dashboard/project-manager/projects/${task.project?.id}`}>
                         <FolderOpen className="h-4 w-4 mr-2" />
                         View Project
                       </Link>
                     </Button>
                     <Button variant="outline" size="sm" asChild>
                       <Link href={`/dashboard/project-manager/projects/${task.project?.id}/team`}>
                         <User className="h-4 w-4 mr-2" />
                         View Team
                       </Link>
                     </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 