"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ProjectForm } from "./project-form"
import { createProject, updateProject } from "@/lib/actions/projects"
import { Plus } from "lucide-react"

interface ProjectFormWrapperProps {
  project?: any
  clients: Array<{ id: string; name: string | null; email?: string }>
  managers: Array<{ id: string; name: string | null; email?: string }>
  teams: Array<{ id: string; name: string; description?: string | null }>
  trigger?: React.ReactNode
  userRole?: "ADMIN" | "PROJECT_MANAGER"
  currentUserId?: string
}

export function ProjectFormWrapper({ 
  project, 
  clients, 
  managers, 
  teams, 
  trigger,
  userRole = "ADMIN",
  currentUserId
}: ProjectFormWrapperProps) {
  const [open, setOpen] = useState(false)

  const handleSubmit = async (formData: FormData) => {
    if (project) {
      await updateProject(project.id, formData)
    } else {
      await createProject(formData)
    }
  }

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)}>
          {trigger}
        </div>
      ) : (
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      )}
      
      <ProjectForm
        open={open}
        onOpenChange={setOpen}
        project={project}
        onSubmit={handleSubmit}
        clients={clients}
        managers={managers}
        teams={teams}
        userRole={userRole}
        currentUserId={currentUserId}
      />
    </>
  )
}
