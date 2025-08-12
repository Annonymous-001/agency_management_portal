"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { 
  Calendar, 
  DollarSign, 
  User, 
  Users, 
  Clock, 
  Target, 
  FileText, 
  MessageSquare, 
  FolderOpen,
  Tag,
  Edit,
  ExternalLink
} from "lucide-react"
import Link from "next/link"

interface ViewProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project: any
  userRole?: string
}

export function ViewProjectDialog({ open, onOpenChange, project, userRole = "ADMIN" }: ViewProjectDialogProps) {
  if (!project) return null

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "default"
      case "IN_PROGRESS":
        return "secondary"
      case "ON_HOLD":
        return "outline"
      case "CANCELLED":
        return "destructive"
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

  const formatCurrency = (amount: number, currency: string = "USD") => {
    if (!amount) return "-"
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const formatHours = (hours: number) => {
    if (!hours) return "-"
    return `${hours}h`
  }

  const calculateBudgetUsage = () => {
    if (!project.budget || !project.spentAmount) return 0
    return Math.round((Number(project.spentAmount) / Number(project.budget)) * 100)
  }

  const budgetUsage = calculateBudgetUsage()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Project Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Project Header */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <CardTitle className="text-xl">{project.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Created on {formatDate(project.createdAt)}
                  </p>
                  {project.description && (
                    <p className="text-sm mt-2">{project.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusVariant(project.status)}>
                    {project.status?.replace("_", " ")}
                  </Badge>
                  <Badge variant={getPriorityVariant(project.priority)}>
                    {project.priority}
                  </Badge>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Progress Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="h-4 w-4" />
                Project Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span>Overall Progress</span>
                  <span>{project.progress !== undefined ? `${project.progress}%` : "0%"}</span>
                </div>
                <Progress value={project.progress || 0} className="h-3" />
              </div>
              
              {project.budget && (
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span>Budget Usage</span>
                    <span>{budgetUsage}%</span>
                  </div>
                  <Progress value={budgetUsage} className="h-3" />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Spent: {formatCurrency(Number(project.spentAmount || 0), project.currency)}</span>
                    <span>Budget: {formatCurrency(Number(project.budget), project.currency)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Project Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Team Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Team Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Client</p>
                  <p className="font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {project.User_Project_clientIdToUser?.name || "-"}
                  </p>
                  {project.User_Project_clientIdToUser?.email && (
                    <p className="text-sm text-muted-foreground ml-6">
                      {project.User_Project_clientIdToUser.email}
                    </p>
                  )}
                </div>
                
                <Separator />
                
                <div>
                  <p className="text-sm text-muted-foreground">Project Manager</p>
                  <p className="font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {project.User_Project_managerIdToUser?.name || "-"}
                  </p>
                  {project.User_Project_managerIdToUser?.email && (
                    <p className="text-sm text-muted-foreground ml-6">
                      {project.User_Project_managerIdToUser.email}
                    </p>
                  )}
                </div>
                
                {project.Team && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground">Assigned Team</p>
                      <p className="font-medium flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {project.Team.name}
                      </p>
                      {project.Team.description && (
                        <p className="text-sm text-muted-foreground ml-6">
                          {project.Team.description}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Timeline Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(project.startDate)}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Due Date</p>
                  <p className="font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(project.dueDate)}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(project.updatedAt)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Financial Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Financial Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Budget</p>
                  <p className="font-medium text-lg">
                    {formatCurrency(Number(project.budget || 0), project.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Spent</p>
                  <p className="font-medium text-lg">
                    {formatCurrency(Number(project.spentAmount || 0), project.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Remaining</p>
                  <p className="font-medium text-lg">
                    {formatCurrency(
                      Number(project.budget || 0) - Number(project.spentAmount || 0), 
                      project.currency
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Currency</p>
                  <p className="font-medium">{project.currency || "USD"}</p>
                </div>
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
                    {formatHours(project.estimatedHours)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Actual Hours</p>
                  <p className="font-medium text-lg">
                    {formatHours(project.actualHours)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Hours Remaining</p>
                  <p className="font-medium text-lg">
                    {formatHours((project.estimatedHours || 0) - (project.actualHours || 0))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          {(project.tags || project.notes || project.isTemplate) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {project.tags && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Tags
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {project.tags.split(',').map((tag: string, index: number) => (
                        <Badge key={index} variant="outline">
                          {tag.trim()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {project.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Notes</p>
                    <p className="text-sm bg-muted p-3 rounded-md whitespace-pre-wrap">
                      {project.notes}
                    </p>
                  </div>
                )}
                
                {project.isTemplate && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Template Information</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Template Project</Badge>
                      {project.templateId && (
                        <span className="text-sm text-muted-foreground">
                          Template ID: {project.templateId}
                        </span>
                      )}
                    </div>
                  </div>
                )}
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
                      <Link href={`/dashboard/admin/projects/${project.id}`}>
                        <FileText className="h-4 w-4 mr-2" />
                        View Files
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/admin/messages?project=${project.id}`}>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        View Messages
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/admin/tasks?project=${project.id}`}>
                        <Target className="h-4 w-4 mr-2" />
                        View Tasks
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/admin/invoices?project=${project.id}`}>
                        <DollarSign className="h-4 w-4 mr-2" />
                        View Invoices
                      </Link>
                    </Button>
                  </>
                ) : userRole === "CLIENT" ? (
                  <>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/client/projects/${project.id}`}>
                        <FileText className="h-4 w-4 mr-2" />
                        View Details
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/client/projects/${project.id}/files`}>
                        <FileText className="h-4 w-4 mr-2" />
                        View Files
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/client/messages?project=${project.id}`}>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        View Messages
                      </Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/project-manager/projects/${project.id}`}>
                        <FileText className="h-4 w-4 mr-2" />
                        View Details
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/project-manager/tasks?project=${project.id}`}>
                        <Target className="h-4 w-4 mr-2" />
                        View Tasks
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/project-manager/projects/${project.id}/team`}>
                        <Users className="h-4 w-4 mr-2" />
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