"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  Edit3,
  Plus,
  PieChart,
  Target,
  Receipt
} from "lucide-react"

interface BudgetData {
  budget: number
  spentAmount: number
  currency: string
  estimatedHours?: number
  actualHours?: number
}

interface BudgetTrackerProps {
  projectId: string
  budgetData: BudgetData
  onBudgetUpdate: (projectId: string, budgetData: Partial<BudgetData>, notes?: string) => Promise<void>
  canEdit?: boolean
  showDetailed?: boolean
}

const currencySymbols = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  CAD: "C$",
  AUD: "A$",
  INR: "₹"
}

export function BudgetTracker({
  projectId,
  budgetData,
  onBudgetUpdate,
  canEdit = true,
  showDetailed = true
}: BudgetTrackerProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  // Edit form state
  const [editBudget, setEditBudget] = useState(budgetData.budget || 0)
  const [editCurrency, setEditCurrency] = useState(budgetData.currency || "USD")
  const [editEstimatedHours, setEditEstimatedHours] = useState(budgetData.estimatedHours || 0)
  
  // Expense form state
  const [expenseAmount, setExpenseAmount] = useState(0)
  const [expenseNotes, setExpenseNotes] = useState("")

  const { budget, spentAmount, currency, estimatedHours, actualHours } = budgetData
  const currencySymbol = currencySymbols[currency as keyof typeof currencySymbols] || currency
  
  // Calculate percentages and status
  const spentPercentage = budget > 0 ? (spentAmount / budget) * 100 : 0
  const remainingBudget = budget - spentAmount
  const hourlyRate = estimatedHours && budget ? budget / estimatedHours : 0
  const projectedCost = actualHours && hourlyRate ? actualHours * hourlyRate : spentAmount

  // Budget status
  const getBudgetStatus = () => {
    if (spentPercentage >= 100) return { status: "over", color: "text-red-600", bgColor: "bg-red-100", label: "Over Budget" }
    if (spentPercentage >= 90) return { status: "critical", color: "text-red-600", bgColor: "bg-red-50", label: "Critical" }
    if (spentPercentage >= 75) return { status: "warning", color: "text-yellow-600", bgColor: "bg-yellow-50", label: "Warning" }
    if (spentPercentage >= 50) return { status: "moderate", color: "text-blue-600", bgColor: "bg-blue-50", label: "On Track" }
    return { status: "good", color: "text-green-600", bgColor: "bg-green-50", label: "Under Budget" }
  }

  const budgetStatus = getBudgetStatus()

  const handleBudgetUpdate = async () => {
    try {
      setIsLoading(true)
      await onBudgetUpdate(projectId, {
        budget: editBudget,
        currency: editCurrency,
        estimatedHours: editEstimatedHours || undefined
      })
      toast.success("Budget updated successfully")
      setIsEditDialogOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update budget")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddExpense = async () => {
    if (expenseAmount <= 0) {
      toast.error("Please enter a valid expense amount")
      return
    }

    try {
      setIsLoading(true)
      const newSpentAmount = spentAmount + expenseAmount
      await onBudgetUpdate(projectId, {
        spentAmount: newSpentAmount
      }, expenseNotes)
      toast.success(`Added expense of ${currencySymbol}${expenseAmount.toFixed(2)}`)
      setIsExpenseDialogOpen(false)
      setExpenseAmount(0)
      setExpenseNotes("")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add expense")
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return `${currencySymbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  return (
    <div className="space-y-4">
      {/* Main Budget Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Budget Overview
              </CardTitle>
              <CardDescription>
                Track project budget and expenses
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant="secondary" 
                className={`${budgetStatus.bgColor} ${budgetStatus.color} border-0`}
              >
                {budgetStatus.label}
              </Badge>
              {canEdit && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsExpenseDialogOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Expense
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(true)}
                  >
                    <Edit3 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Budget Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Spent: {formatCurrency(spentAmount)}</span>
              <span>Budget: {formatCurrency(budget)}</span>
            </div>
            <Progress 
              value={spentPercentage} 
              className="h-3"
              style={{
                background: spentPercentage >= 100 ? '#fee2e2' : 
                           spentPercentage >= 90 ? '#fef3c7' : 
                           spentPercentage >= 75 ? '#fef3c7' : '#f0fdf4'
              }}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{spentPercentage.toFixed(1)}% spent</span>
              <span>
                {remainingBudget >= 0 ? 
                  `${formatCurrency(remainingBudget)} remaining` : 
                  `${formatCurrency(Math.abs(remainingBudget))} over budget`
                }
              </span>
            </div>
          </div>

          {/* Budget Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <Target className="w-5 h-5 mx-auto mb-1 text-blue-600" />
              <div className="text-lg font-semibold">{formatCurrency(budget)}</div>
              <div className="text-xs text-muted-foreground">Total Budget</div>
            </div>
            
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <Receipt className="w-5 h-5 mx-auto mb-1 text-orange-600" />
              <div className="text-lg font-semibold">{formatCurrency(spentAmount)}</div>
              <div className="text-xs text-muted-foreground">Total Spent</div>
            </div>
            
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              {remainingBudget >= 0 ? (
                <TrendingUp className="w-5 h-5 mx-auto mb-1 text-green-600" />
              ) : (
                <TrendingDown className="w-5 h-5 mx-auto mb-1 text-red-600" />
              )}
              <div className={`text-lg font-semibold ${remainingBudget >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(Math.abs(remainingBudget))}
              </div>
              <div className="text-xs text-muted-foreground">
                {remainingBudget >= 0 ? 'Remaining' : 'Over Budget'}
              </div>
            </div>
            
            {hourlyRate > 0 && (
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <PieChart className="w-5 h-5 mx-auto mb-1 text-purple-600" />
                <div className="text-lg font-semibold">{formatCurrency(hourlyRate)}</div>
                <div className="text-xs text-muted-foreground">Per Hour</div>
              </div>
            )}
          </div>

          {/* Budget Alerts */}
          {spentPercentage >= 75 && (
            <div className={`p-3 rounded-lg border ${budgetStatus.bgColor} ${budgetStatus.color}`}>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium">Budget Alert</span>
              </div>
              <p className="text-sm mt-1">
                {spentPercentage >= 100 
                  ? `This project is over budget by ${formatCurrency(Math.abs(remainingBudget))}`
                  : spentPercentage >= 90
                  ? `Only ${formatCurrency(remainingBudget)} remaining in budget`
                  : `${spentPercentage.toFixed(1)}% of budget has been spent`
                }
              </p>
            </div>
          )}

          {/* Hour Tracking */}
          {(estimatedHours || actualHours) && (
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Time Tracking</h4>
              <div className="grid grid-cols-2 gap-4">
                {estimatedHours && (
                  <div>
                    <div className="text-sm text-muted-foreground">Estimated Hours</div>
                    <div className="text-lg font-semibold">{estimatedHours}h</div>
                  </div>
                )}
                {actualHours && (
                  <div>
                    <div className="text-sm text-muted-foreground">Actual Hours</div>
                    <div className="text-lg font-semibold">{actualHours}h</div>
                    {estimatedHours && (
                      <div className={`text-xs ${actualHours > estimatedHours ? 'text-red-600' : 'text-green-600'}`}>
                        {actualHours > estimatedHours ? '+' : ''}{actualHours - estimatedHours}h vs estimate
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Budget Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Budget</DialogTitle>
            <DialogDescription>
              Update the project budget and settings
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="budget">Budget Amount</Label>
              <Input
                id="budget"
                type="number"
                step="0.01"
                value={editBudget}
                onChange={(e) => setEditBudget(Number(e.target.value))}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="currency">Currency</Label>
              <Select value={editCurrency} onValueChange={setEditCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(currencySymbols).map(([code, symbol]) => (
                    <SelectItem key={code} value={code}>
                      {symbol} {code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="estimatedHours">Estimated Hours (Optional)</Label>
              <Input
                id="estimatedHours"
                type="number"
                value={editEstimatedHours}
                onChange={(e) => setEditEstimatedHours(Number(e.target.value))}
                placeholder="0"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBudgetUpdate} disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Budget"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Expense Dialog */}
      <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Expense</DialogTitle>
            <DialogDescription>
              Record a new expense for this project
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="expense">Expense Amount ({currencySymbol})</Label>
              <Input
                id="expense"
                type="number"
                step="0.01"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(Number(e.target.value))}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={expenseNotes}
                onChange={(e) => setExpenseNotes(e.target.value)}
                placeholder="Description of the expense..."
                className="min-h-[80px]"
              />
            </div>

            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm">
                <div>Current Spent: {formatCurrency(spentAmount)}</div>
                <div>New Total: {formatCurrency(spentAmount + expenseAmount)}</div>
                <div>Budget: {formatCurrency(budget)}</div>
                <div className={`font-medium ${spentAmount + expenseAmount > budget ? 'text-red-600' : 'text-green-600'}`}>
                  Remaining: {formatCurrency(budget - (spentAmount + expenseAmount))}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExpenseDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddExpense} disabled={isLoading || expenseAmount <= 0}>
              {isLoading ? "Adding..." : "Add Expense"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 