"use client"

import { useSession } from "next-auth/react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Home,
  FolderOpen,
  FileText,
  MessageSquare,
  Receipt,
  Users,
  CheckSquare,
  Settings,
  LogOut,
  ChevronUp,
  BarChart3,
  UserCheck,
  User,
} from "lucide-react"
import Link from "next/link"
import { signOut } from "next-auth/react"
import type { Role } from "@/lib/generated/prisma"
import { ThemeToggle } from "@/components/theme-toggle"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useRef } from "react"
import { Progress } from "@/components/ui/progress"

const navigationConfig = {
  CLIENT: [
    { title: "Dashboard", url: "/dashboard/client", icon: Home },
    { title: "My Projects", url: "/dashboard/client/projects", icon: FolderOpen },
    { title: "Files", url: "/dashboard/client/files", icon: FileText },
    { title: "Messages", url: "/dashboard/client/messages", icon: MessageSquare },
    { title: "Invoices", url: "/dashboard/client/invoices", icon: Receipt },
    { title: "Proposals", url: "/dashboard/client/proposals", icon: FileText },
  ],
  TEAM_MEMBER: [
    { title: "Dashboard", url: "/dashboard/team-member", icon: Home },
    { title: "My Tasks", url: "/dashboard/team-member/tasks", icon: CheckSquare },
    { title: "Projects", url: "/dashboard/team-member/projects", icon: FolderOpen },
    { title: "Messages", url: "/dashboard/team-member/messages", icon: MessageSquare },
  ],
  PROJECT_MANAGER: [
    { title: "Dashboard", url: "/dashboard/project-manager", icon: Home },
    { title: "Projects", url: "/dashboard/project-manager/projects", icon: FolderOpen },
    { title: "Tasks", url: "/dashboard/project-manager/tasks", icon: CheckSquare },
    { title: "Team", url: "/dashboard/project-manager/team", icon: Users },
    { title: "Proposals", url: "/dashboard/project-manager/proposals", icon: FileText },
    { title: "Invoices", url: "/dashboard/project-manager/invoices", icon: Receipt },
    { title: "Messages", url: "/dashboard/project-manager/messages", icon: MessageSquare },
  ],
  ADMIN: [
    { title: "Dashboard", url: "/dashboard/admin", icon: Home },
    { title: "Analytics", url: "/dashboard/admin/analytics", icon: BarChart3 },
    { title: "Users", url: "/dashboard/admin/users", icon: UserCheck },
    { title: "Projects", url: "/dashboard/admin/projects", icon: FolderOpen },
    { title: "Teams", url: "/dashboard/admin/teams", icon: Users },
    { title: "Tasks", url: "/dashboard/admin/tasks", icon: CheckSquare },
    { title: "Invoices", url: "/dashboard/admin/invoices", icon: Receipt },
    { title: "Messages", url: "/dashboard/admin/messages", icon: MessageSquare },
    { title: "Settings", url: "/dashboard/admin/settings", icon: Settings },
  ],
}

// ProfileDialog component with Cloudinary integration
function ProfileDialog({ open, onOpenChange, user }: { open: boolean; onOpenChange: (open: boolean) => void; user: any }) {
  const [formState, setFormState] = useState({
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    avatar: user.avatar || '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState(user.avatar || '')
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setFormState({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        avatar: user.avatar || '',
      })
      setAvatarPreview(user.avatar || '')
      setUploadProgress(0)
    }
  }, [open, user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, files } = e.target
    if (name === 'avatar' && files && files[0]) {
      const file = files[0]
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB')
        return
      }
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file')
        return
      }
      setFormState((prev) => ({ ...prev, avatar: file }))
      setAvatarPreview(URL.createObjectURL(file))
    } else {
      setFormState((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setUploadProgress(0)
    
    try {
      const formData = new FormData()
      formData.append('name', formState.name)
      formData.append('email', formState.email)
      formData.append('phone', formState.phone)
      
      if (formState.avatar instanceof File) {
        formData.append('avatar', formState.avatar)
      }

      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        body: formData,
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to update profile')
      }

      const updatedUser = await res.json()
      toast.success('Profile updated successfully')
      
      // Refresh the session to get updated user data
      window.location.reload()
      
      onOpenChange(false)
    } catch (error: any) {
      console.error('Profile update error:', error)
      toast.error(error.message || 'Failed to update profile')
    } finally {
      setIsLoading(false)
      setUploadProgress(0)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="flex flex-col items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage 
                src={avatarPreview || user.avatar || "/noavatar.png"} 
                alt={formState.name} 
              />
              <AvatarFallback>
                {formState.name ? formState.name[0].toUpperCase() : 'U'}
              </AvatarFallback>
            </Avatar>
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
              Change Avatar
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              name="avatar"
              accept="image/*"
              className="hidden"
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" value={formState.name} onChange={handleChange} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" value={formState.email} onChange={handleChange} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" value={formState.phone} onChange={handleChange} />
          </div>
          
          {isLoading && uploadProgress > 0 && (
            <div className="space-y-2">
              <Label>Upload Progress</Label>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}
          
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function AppSidebar() {
  const { data: session } = useSession()
  const [profileDialogOpen, setProfileDialogOpen] = useState(false)

  if (!session?.user) {
    return null
  }

  const userRole = session.user.role as Role
  const navigationItems = navigationConfig[userRole] || []

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Home className="h-4 w-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">Agency Pro</span>
            <span className="truncate text-xs text-muted-foreground">{userRole.replace("_", " ").toLowerCase()}</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {/* Add Profile link for all roles */}
              {/* <SidebarMenuItem key="Profile">
                <SidebarMenuButton asChild>
                  <Link href="/dashboard/profile">
                    <User className="h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </SidebarMenuButton> */}
              {/* </SidebarMenuItem> */}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center justify-between px-4 py-2">
              <span className="text-xs text-muted-foreground">Theme</span>
              <ThemeToggle />
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage 
                      src={session.user.avatar || "/noavatar.png"} 
                      alt={session.user.name || session.user.email} 
                    />
                    <AvatarFallback className="rounded-lg">
                      {session.user.name?.charAt(0).toUpperCase() || session.user.email.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{session.user.name || "User"}</span>
                    <span className="truncate text-xs">{session.user.email}</span>
                  </div>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                {/* Profile option */}
                <DropdownMenuItem onClick={() => setProfileDialogOpen(true)}>
                  <User className="h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {/* Profile dialog trigger */}
            <ProfileDialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen} user={session.user} />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
