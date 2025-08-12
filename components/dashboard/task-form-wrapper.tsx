"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { TaskForm } from "./task-form"
import { createTask, updateTask } from "@/lib/actions/tasks"
import { Plus } from "lucide-react"

interface TaskFormWrapperProps {
  task?: any
  trigger?: React.ReactNode
}

export function TaskFormWrapper({ 
  task, 
  trigger 
}: TaskFormWrapperProps) {
  const [open, setOpen] = useState(false)

  const handleSubmit = async (formData: FormData) => {
    if (task) {
      await updateTask(task.id, formData)
    } else {
      await createTask(formData)
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
          New Task
        </Button>
      )}
      
      <TaskForm
        open={open}
        onOpenChange={setOpen}
        task={task}
        onSubmit={handleSubmit}
      />
    </>
  )
}


