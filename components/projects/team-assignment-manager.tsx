"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { 
  Users, 
  Plus, 
  Trash2, 
  Edit3, 
  Crown, 
  Shield, 
  User,
  Mail,
  Phone,
  Clock,
  Search
} from "lucide-react"

interface TeamMember {
  id: string
  userId: string
  name: string
  email: string
  avatar?: string
  role: "LEAD" | "MEMBER" | "ADMIN"
  joinedAt: string
  isActive: boolean
  skills?: string[]
  phone?: string
}

interface AvailableUser {
  id: string
  name: string
  email: string
  avatar?: string
  role: "TEAM_MEMBER" | "PROJECT_MANAGER"
  phone?: string
  skills?: string[]
  isActive: boolean
}

interface TeamAssignmentManagerProps {
  projectId: string
  teamId?: string
  currentTeamMembers: TeamMember[]
  availableUsers: AvailableUser[]
  onTeamUpdate: (projectId: string, teamData: any) => Promise<void>
  canEdit?: boolean
}

const roleConfig = {
  LEAD: {
    label: "Team Lead",
    color: "bg-purple-100 text-purple-800 border-purple-200",
    icon: Crown,
    description: "Leads the team and manages tasks"
  },
  ADMIN: {
    label: "Admin",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: Shield,
    description: "Has administrative privileges"
  },
  MEMBER: {
    label: "Member",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: User,
    description: "Regular team member"
  }
}

export function TeamAssignmentManager({
  projectId,
  teamId,
  currentTeamMembers,
  availableUsers,
  onTeamUpdate,
  canEdit = true
}: TeamAssignmentManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditingMember, setIsEditingMember] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [memberRoles, setMemberRoles] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  // Filter available users that aren't already in the team
  const filteredAvailableUsers = availableUsers.filter(user => 
    !currentTeamMembers.some(member => member.userId === user.id) &&
    user.isActive &&
    (user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     user.email.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleAddMembers = async () => {
    if (selectedUsers.length === 0) {
      toast.error("Please select at least one team member")
      return
    }

    try {
      setIsLoading(true)
      
      const newMembers = selectedUsers.map(userId => ({
        userId,
        role: memberRoles[userId] || "MEMBER",
        isActive: true
      }))

      await onTeamUpdate(projectId, {
        action: "add_members",
        members: newMembers
      })

      toast.success(`Added ${selectedUsers.length} team member(s)`)
      setIsDialogOpen(false)
      setSelectedUsers([])
      setMemberRoles({})
      setSearchQuery("")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add team members")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    try {
      await onTeamUpdate(projectId, {
        action: "remove_member",
        memberId
      })
      toast.success(`Removed ${memberName} from team`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove team member")
    }
  }

  const handleUpdateMemberRole = async (memberId: string, newRole: string) => {
    try {
      await onTeamUpdate(projectId, {
        action: "update_role",
        memberId,
        role: newRole
      })
      toast.success("Team member role updated")
      setIsEditingMember(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update role")
    }
  }

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId)
      } else {
        return [...prev, userId]
      }
    })
  }

  const setUserRole = (userId: string, role: string) => {
    setMemberRoles(prev => ({
      ...prev,
      [userId]: role
    }))
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Team Members ({currentTeamMembers.length})
            </CardTitle>
            <CardDescription>
              Manage team assignments and roles for this project
            </CardDescription>
          </div>
          {canEdit && (
            <Button 
              onClick={() => setIsDialogOpen(true)}
              size="sm"
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Members
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {currentTeamMembers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No team members assigned to this project</p>
            {canEdit && (
              <Button 
                variant="outline" 
                onClick={() => setIsDialogOpen(true)}
                className="mt-2"
              >
                Add First Team Member
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {currentTeamMembers.map((member) => {
              const roleInfo = roleConfig[member.role as keyof typeof roleConfig]
              const RoleIcon = roleInfo.icon
              
              return (
                <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback>
                        {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{member.name}</h4>
                        <Badge 
                          variant="secondary" 
                          className={`flex items-center gap-1 ${roleInfo.color} border text-xs`}
                        >
                          <RoleIcon className="w-3 h-3" />
                          {roleInfo.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {member.email}
                        </span>
                        {member.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {member.phone}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Joined {new Date(member.joinedAt).toLocaleDateString()}
                        </span>
                      </div>
                      {member.skills && member.skills.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {member.skills.slice(0, 3).map((skill, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {member.skills.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{member.skills.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {canEdit && (
                    <div className="flex items-center gap-2">
                      {isEditingMember === member.id ? (
                        <div className="flex items-center gap-2">
                          <Select
                            value={member.role}
                            onValueChange={(value) => handleUpdateMemberRole(member.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(roleConfig).map(([key, config]) => (
                                <SelectItem key={key} value={key}>
                                  <div className="flex items-center gap-2">
                                    <config.icon className="w-4 h-4" />
                                    {config.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setIsEditingMember(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setIsEditingMember(member.id)}
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemoveMember(member.id, member.name)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>

      {/* Add Members Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Add Team Members</DialogTitle>
            <DialogDescription>
              Select users to add to the project team and assign their roles
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Available Users */}
            <div className="max-h-96 overflow-y-auto space-y-2">
              {filteredAvailableUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No available users found</p>
                </div>
              ) : (
                filteredAvailableUsers.map((user) => {
                  const isSelected = selectedUsers.includes(user.id)
                  const userRole = memberRoles[user.id] || "MEMBER"
                  
                  return (
                    <div 
                      key={user.id} 
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => toggleUserSelection(user.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleUserSelection(user.id)}
                            className="rounded"
                          />
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback>
                              {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-medium">{user.name}</h4>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>

                        {isSelected && (
                          <Select
                            value={userRole}
                            onValueChange={(value) => setUserRole(user.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(roleConfig).map(([key, config]) => (
                                <SelectItem key={key} value={key}>
                                  <div className="flex items-center gap-2">
                                    <config.icon className="w-4 h-4" />
                                    {config.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddMembers} 
              disabled={selectedUsers.length === 0 || isLoading}
            >
              {isLoading ? "Adding..." : `Add ${selectedUsers.length} Member(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
} 