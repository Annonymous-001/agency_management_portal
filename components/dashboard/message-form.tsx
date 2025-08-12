"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { toast } from "sonner"

const messageSchema = z.object({
  content: z.string().min(1, "Message content is required"),
  projectId: z.string().min(1, "Project is required"),
  userId: z.string().min(1, "Recipient is required"),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
})

type MessageFormData = z.infer<typeof messageSchema>

interface User {
  id: string
  name: string | null
  email: string
  role: string
}

interface Project {
  id: string
  name: string
  status: string
}

interface MessageFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (formData: FormData) => Promise<void>
  parentId?: string
  initialRecipient?: string
  initialProject?: string
}

export function MessageForm({ open, onOpenChange, onSubmit, parentId, initialRecipient, initialProject }: MessageFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loadingProjects, setLoadingProjects] = useState(false)

  const form = useForm<MessageFormData>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      content: "",
      projectId: initialProject || "",
      userId: initialRecipient || "",
      priority: "NORMAL",
    },
  })

  useEffect(() => {
    if (open) {
      loadUsers()
      if (initialRecipient) {
        handleRecipientChange(initialRecipient)
      }
      if (initialProject) {
        setTimeout(() => form.setValue("projectId", initialProject), 0)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const loadUsers = async () => {
    try {
      const usersRes = await fetch("/api/messages?type=users")
      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setUsers(usersData)
      }
    } catch (error) {
      toast.error("Failed to load users")
    }
  }

  const loadProjectsForUser = async (userId: string) => {
    try {
      setLoadingProjects(true)
      const projectsRes = await fetch(`/api/messages?type=projects&userId=${userId}`)
      if (projectsRes.ok) {
        const projectsData = await projectsRes.json()
        setProjects(projectsData)
      } else {
        toast.error("Failed to load projects for selected user")
      }
    } catch (error) {
      toast.error("Failed to load projects for selected user")
    } finally {
      setLoadingProjects(false)
    }
  }

  const handleRecipientChange = async (userId: string) => {
    // Clear the project selection when recipient changes
    form.setValue("projectId", "")
    
    if (userId) {
      await loadProjectsForUser(userId)
    } else {
      setProjects([])
    }
  }

  const handleSubmit = async (data: MessageFormData) => {
    try {
      setIsLoading(true)
      const formData = new FormData()
      formData.append("content", data.content)
      formData.append("projectId", data.projectId)
      formData.append("userId", data.userId)
      formData.append("priority", data.priority)
      if (parentId) {
        formData.append("parentId", parentId)
      }
      await onSubmit(formData)
      toast.success("Message sent successfully")
      onOpenChange(false)
      form.reset()
      setProjects([])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Send New Message</DialogTitle>
          <DialogDescription>
            Send a message to another user about a specific project
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipient</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value)
                      handleRecipientChange(value)
                    }} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select recipient" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name || user.email} ({user.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="projectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={loadingProjects || projects.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue 
                          placeholder={
                            loadingProjects 
                              ? "Loading projects..." 
                              : projects.length === 0 
                                ? "Select recipient first" 
                                : "Select project"
                          } 
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name} ({project.status})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                  {projects.length === 0 && form.getValues("userId") && !loadingProjects && (
                    <p className="text-sm text-muted-foreground">
                      No projects available for the selected recipient
                    </p>
                  )}
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="NORMAL">Normal</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter your message..." 
                      className="min-h-[120px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Sending..." : "Send Message"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 

interface InlineReplyFormProps {
  onSubmit: (content: string) => Promise<void>
  loading?: boolean
  onCancel?: () => void
}

export function InlineReplyForm({ onSubmit, loading, onCancel }: InlineReplyFormProps) {
  const [content, setContent] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    setSubmitting(true)
    await onSubmit(content)
    setContent("")
    setSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 mt-2">
      <Textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="Write a reply..."
        className="min-h-[60px]"
        disabled={submitting || loading}
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={submitting || loading || !content.trim()}>
          {submitting || loading ? "Sending..." : "Send"}
        </Button>
        {onCancel && (
          <Button type="button" size="sm" variant="outline" onClick={onCancel} disabled={submitting || loading}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
} 