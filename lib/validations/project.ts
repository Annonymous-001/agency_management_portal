import { z } from "zod"

export const projectSchema = z.object({
  name: z.string().min(2, "Project name is required"),
  description: z.string().min(5, "Description is required"),
  clientId: z.string().min(1, "Client is required"),
  managerId: z.string().min(1, "Manager is required"),
  teamId: z.string().optional(),
  budget: z.coerce.number().min(0, "Budget must be positive"),
  spentAmount: z.coerce.number().min(0, "Spent amount must be positive").default(0),
  currency: z.string().default("USD"),
  dueDate: z.string().min(1, "Due date is required"),
  startDate: z.string().optional(),
  estimatedHours: z.coerce.number().min(0, "Estimated hours must be positive").optional(),
  actualHours: z.coerce.number().min(0, "Actual hours must be positive").default(0),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  status: z.enum(["PENDING", "IN_PROGRESS", "REVIEW", "COMPLETED", "ARCHIVED", "CANCELLED"]).default("PENDING"),
  tags: z.string().optional(),
  notes: z.string().optional(),
})

export const projectUpdateSchema = projectSchema.partial().extend({
  id: z.string().min(1, "Project ID is required"),
})

export const projectStatusUpdateSchema = z.object({
  id: z.string().min(1, "Project ID is required"),
  status: z.enum(["PENDING", "IN_PROGRESS", "REVIEW", "COMPLETED", "ARCHIVED", "CANCELLED"]),
  notes: z.string().optional(),
})

export const projectBudgetUpdateSchema = z.object({
  id: z.string().min(1, "Project ID is required"),
  budget: z.coerce.number().min(0, "Budget must be positive"),
  spentAmount: z.coerce.number().min(0, "Spent amount must be positive"),
  currency: z.string().default("USD"),
})

export const projectTimelineSchema = z.object({
  id: z.string().min(1, "Project ID is required"),
  startDate: z.string().optional(),
  dueDate: z.string().min(1, "Due date is required"),
  estimatedHours: z.coerce.number().min(0, "Estimated hours must be positive").optional(),
})

export type ProjectFormData = z.infer<typeof projectSchema>
export type ProjectUpdateData = z.infer<typeof projectUpdateSchema>
export type ProjectStatusUpdateData = z.infer<typeof projectStatusUpdateSchema>
export type ProjectBudgetUpdateData = z.infer<typeof projectBudgetUpdateSchema>
export type ProjectTimelineData = z.infer<typeof projectTimelineSchema> 