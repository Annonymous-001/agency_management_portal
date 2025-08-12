"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MessageSquare, Reply, Plus, Trash2, Check } from "lucide-react"
import { toast } from "sonner"
import { MessageForm } from "@/components/dashboard/message-form"

interface Message {
  id: string
  content: string
  fromAdmin: boolean
  fromName: string
  fromEmail: string
  toName: string
  toEmail: string
  read: boolean
  priority: string
  createdAt: string
  project: string
  projectId: string
  userId: string
  fromUserId: string
  isFromMe: boolean
}

export default function TeamMemberMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)

  useEffect(() => {
    loadMessages()
  }, [])

  const loadMessages = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/messages")
      if (!res.ok) throw new Error("Failed to fetch messages")
      const data = await res.json()
      setMessages(data ?? [])
    } catch {
      toast.error("Failed to load messages")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateMessage = async (formData: FormData) => {
    try {
      const res = await fetch("/api/messages", { method: "POST", body: formData })
      if (!res.ok) throw new Error("Failed to create message")
      await loadMessages()
    } catch (error: any) {
      throw new Error(error.message || "Failed to create message")
    }
  }

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/messages?id=${id}`, { method: "PUT" })
      if (!res.ok) throw new Error("Failed to mark as read")
      await loadMessages()
      toast.success("Marked as read")
    } catch {
      toast.error("Failed to mark as read")
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/messages?id=${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete message")
      await loadMessages()
      toast.success("Message deleted")
    } catch {
      toast.error("Failed to delete message")
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT": return "destructive"
      case "HIGH": return "destructive"
      case "NORMAL": return "default"
      case "LOW": return "secondary"
      default: return "outline"
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "URGENT": return "Urgent"
      case "HIGH": return "High"
      case "NORMAL": return "Normal"
      case "LOW": return "Low"
      default: return priority
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <DashboardHeader title="Messages" breadcrumbs={[{ label: "Team Member", href: "/dashboard/team-member" }]} />

      <div className="flex justify-between items-center">
        <p className="text-muted-foreground">Internal team communications</p>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Message
        </Button>
      </div>

      <MessageForm 
        open={formOpen} 
        onOpenChange={setFormOpen} 
        onSubmit={handleCreateMessage} 
      />

      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No messages found</p>
            <p className="text-sm text-muted-foreground mt-1">Start a conversation by sending a message</p>
          </div>
        ) : (
          messages.map((message) => (
            <Card key={message.id} className={!message.read ? "border-primary/50 bg-primary/5" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {message.isFromMe ? "You" : message.fromName?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {message.isFromMe ? (
                          <>You → {message.toName}</>
                        ) : (
                          <>{message.fromName} → You</>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {message.project} • {new Date(message.createdAt).toLocaleDateString()} at {new Date(message.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!message.read && <Badge variant="default">New</Badge>}
                    <Badge variant={getPriorityColor(message.priority)}>
                      {getPriorityLabel(message.priority)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4 whitespace-pre-wrap">{message.content}</p>
                <div className="flex gap-2">
                  {!message.read && !message.isFromMe && (
                    <Button variant="outline" size="sm" onClick={() => handleMarkAsRead(message.id)}>
                      <Check className="h-4 w-4 mr-2" />
                      Mark as Read
                    </Button>
                  )}
                  <Button variant="outline" size="sm">
                    <Reply className="h-4 w-4 mr-2" />
                    Reply
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(message.id)}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
