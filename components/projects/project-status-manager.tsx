"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Archive, 
  XCircle, 
  Eye,
  Play,
  Pause
} from "lucide-react"

type ProjectStatus = "PENDING" | "IN_PROGRESS" | "REVIEW" | "COMPLETED" | "ARCHIVED" | "CANCELLED"

interface ProjectStatusManagerProps {
  projectId: string
  currentStatus: ProjectStatus
  onStatusUpdate: (projectId: string, status: ProjectStatus, notes?: string) => Promise<void>
  canEdit?: boolean
  showHistory?: boolean
}

// Status transition rules
const statusTransitions: Record<ProjectStatus, ProjectStatus[]> = {
  PENDING: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["REVIEW", "PENDING", "CANCELLED"],
  REVIEW: ["COMPLETED", "IN_PROGRESS", "CANCELLED"],
  COMPLETED: ["ARCHIVED", "IN_PROGRESS"], // Allow reopening
  ARCHIVED: [], // Final state
  CANCELLED: ["PENDING"] // Allow reactivation
}

// Status configuration
const statusConfig = {
  PENDING: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: Clock,
    description: "Project is waiting to start"
  },
  IN_PROGRESS: {
    label: "In Progress",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: Play,
    description: "Project is actively being worked on"
  },
  REVIEW: {
    label: "Under Review",
    color: "bg-purple-100 text-purple-800 border-purple-200",
    icon: Eye,
    description: "Project is being reviewed"
  },
  COMPLETED: {
    label: "Completed",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle,
    description: "Project has been completed"
  },
  ARCHIVED: {
    label: "Archived",
    color: "bg-gray-100 text-gray-800 border-gray-200",
    icon: Archive,
    description: "Project has been archived"
  },
  CANCELLED: {
    label: "Cancelled",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: XCircle,
    description: "Project has been cancelled"
  }
}

export function ProjectStatusManager({ 
  projectId, 
  currentStatus, 
  onStatusUpdate, 
  canEdit = true,
  showHistory = false 
}: ProjectStatusManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<ProjectStatus>(currentStatus)
  const [notes, setNotes] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const currentConfig = statusConfig[currentStatus]
  const allowedTransitions = statusTransitions[currentStatus] || []
  const IconComponent = currentConfig.icon

  const handleStatusChange = async () => {
    if (selectedStatus === currentStatus) {
      setIsDialogOpen(false)
      return
    }

    try {
      setIsLoading(true)
      await onStatusUpdate(projectId, selectedStatus, notes)
      toast.success(`Project status updated to ${statusConfig[selectedStatus].label}`)
      setIsDialogOpen(false)
      setNotes("")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update status")
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusChangeMessage = (from: ProjectStatus, to: ProjectStatus) => {
    const messages = {
      "PENDING->IN_PROGRESS": "Start working on this project",
      "IN_PROGRESS->REVIEW": "Submit project for review",
      "REVIEW->COMPLETED": "Mark project as completed",
      "COMPLETED->ARCHIVED": "Archive this completed project",
      "IN_PROGRESS->PENDING": "Put project on hold",
      "REVIEW->IN_PROGRESS": "Continue working on project",
      "CANCELLED->PENDING": "Reactivate this project",
      "COMPLETED->IN_PROGRESS": "Reopen this project"
    } as const
    return (messages as Record<string, string>)[`${from}->${to}`] || `Change status to ${statusConfig[to].label}`
  }

  return (
    <div className="flex items-center gap-2">
      <Badge 
        variant="secondary" 
        className={`flex items-center gap-1 ${currentConfig.color} border`}
      >
        <IconComponent className="w-3 h-3" />
        {currentConfig.label}
      </Badge>

      {canEdit && allowedTransitions.length > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsDialogOpen(true)}
          className="text-xs"
        >
          Change Status
        </Button>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Project Status</DialogTitle>
            <DialogDescription>
              Current status: <span className="font-semibold">{currentConfig.label}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="status">New Status</Label>
              <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as ProjectStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={currentStatus} disabled>
                    {currentConfig.label} (Current)
                  </SelectItem>
                  {allowedTransitions.map((status) => {
                    const config = statusConfig[status]
                    const StatusIcon = config.icon
                    return (
                      <SelectItem key={status} value={status}>
                        <div className="flex items-center gap-2">
                          <StatusIcon className="w-4 h-4" />
                          <div>
                            <div className="font-medium">{config.label}</div>
                            <div className="text-xs text-muted-foreground">
                              {getStatusChangeMessage(currentStatus, status)}
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            {selectedStatus !== currentStatus && (
              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add a note about this status change..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1"
                />
              </div>
            )}

            {selectedStatus !== currentStatus && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span className="font-medium">Status Change:</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {getStatusChangeMessage(currentStatus, selectedStatus)}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleStatusChange} 
              disabled={isLoading}
            >
              {isLoading ? "Updating..." : "Update Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Status display component for read-only contexts
export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const config = statusConfig[status]
  const IconComponent = config.icon

  return (
    <Badge 
      variant="secondary" 
      className={`flex items-center gap-1 ${config.color} border`}
    >
      <IconComponent className="w-3 h-3" />
      {config.label}
    </Badge>
  )
}

// Progress indicator based on status
export function ProjectStatusProgress({ status }: { status: ProjectStatus }) {
  const progress = {
    PENDING: 0,
    IN_PROGRESS: 40,
    REVIEW: 80,
    COMPLETED: 100,
    ARCHIVED: 100,
    CANCELLED: 0
  }

  const color = {
    PENDING: "bg-yellow-500",
    IN_PROGRESS: "bg-blue-500",
    REVIEW: "bg-purple-500",
    COMPLETED: "bg-green-500",
    ARCHIVED: "bg-gray-500",
    CANCELLED: "bg-red-500"
  }

  return (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div 
        className={`h-2 rounded-full transition-all duration-300 ${color[status]}`}
        style={{ width: `${progress[status]}%` }}
      />
    </div>
  )
} 