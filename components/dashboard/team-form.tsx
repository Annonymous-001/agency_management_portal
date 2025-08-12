"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import * as z from "zod"
import { getTeamMemberOptions } from "@/lib/actions/teams"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"

const teamSchema = z.object({
  name: z.string().min(2, "Name is required"),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  members: z.array(z.string()).optional(),
  lead: z.string().optional(),
})

type TeamFormData = z.infer<typeof teamSchema>

interface TeamFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  team?: any
  onSubmit: (formData: FormData) => Promise<void>
}

export function TeamForm({ open, onOpenChange, team, onSubmit }: TeamFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [memberOptions, setMemberOptions] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    async function fetchMembers() {
      const users = await getTeamMemberOptions()
      // Ensure name is always a string, never null
      setMemberOptions(users.map(u => ({ id: u.id, name: u.name ?? "(No Name)" })))
    }
    if (open) fetchMembers()
  }, [open])

  const getMemberIds = (members: any) => {
    if (!Array.isArray(members)) return [];
    // If members are objects with id, map to id; if already string, return as is
    return members.map((m: any) => typeof m === "string" ? m : m.id).filter(Boolean);
  };
  const getLeadId = (lead: any) => {
    if (!lead) return "";
    return typeof lead === "string" ? lead : lead.id || "";
  };

  const form = useForm<TeamFormData>({
    resolver: zodResolver(teamSchema),
    defaultValues: team
      ? {
          name: team.name || "",
          description: team.description || "",
          isActive: team.isActive ?? true,
          members: getMemberIds(team.members),
          lead: getLeadId(team.lead),
        }
      : {
          name: "",
          description: "",
          isActive: true,
          members: [],
          lead: "",
        },
  })

  useEffect(() => {
    if (team) {
      form.reset({
        name: team.name || "",
        description: team.description || "",
        isActive: team.isActive ?? true,
        members: getMemberIds(team.members),
        lead: getLeadId(team.lead),
      })
    } else {
      form.reset({
        name: "",
        description: "",
        isActive: true,
        members: [],
        lead: "",
      })
    }
  }, [team, open])

  const handleSubmit = async (data: TeamFormData) => {
    try {
      setIsLoading(true)
      const formData = new FormData()
      formData.append("name", data.name)
      formData.append("description", data.description || "")
      formData.append("isActive", data.isActive ? "true" : "false")
      data.members?.forEach((id) => formData.append("members", id))
      if (data.lead) formData.append("lead", data.lead)
      await onSubmit(formData)
      toast.success(team ? "Team updated" : "Team created")
      onOpenChange(false)
      form.reset()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{team ? "Edit Team" : "Create Team"}</DialogTitle>
          <DialogDescription>
            {team ? "Update team details" : "Create a new team"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Team name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Team description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Active</FormLabel>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="members"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Members</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {memberOptions
                          .filter(option => (field.value ?? []).includes(option.id))
                          .map(option => (
                            <span key={option.id} className="inline-flex items-center rounded bg-muted px-2 py-1 text-xs font-medium">
                              {option.name || "(No Name)"}
                              <button type="button" className="ml-1 text-red-500" onClick={() => field.onChange((field.value ?? []).filter((id: string) => id !== option.id))}>
                                ×
                              </button>
                            </span>
                          ))}
                      </div>
                      <Select onValueChange={id => {
                        if (!(field.value ?? []).includes(id)) field.onChange([...(field.value ?? []), id])
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Add member..." />
                        </SelectTrigger>
                        <SelectContent>
                          {memberOptions
                            .filter(option => !(field.value ?? []).includes(option.id))
                            .map(option => (
                              <SelectItem key={option.id} value={option.id}>{option.name || "(No Name)"}</SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lead"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team Lead</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select lead" />
                      </SelectTrigger>
                      <SelectContent>
                        {memberOptions.map(option => (
                          <SelectItem key={option.id} value={option.id}>{option.name || "(No Name)"}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : team ? "Update Team" : "Create Team"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 