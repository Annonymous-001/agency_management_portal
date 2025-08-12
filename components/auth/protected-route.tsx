"use client"

import { useAuthSession } from "@/hooks/use-session"
import { Loader2 } from "lucide-react"
import type { Role } from "@/lib/generated/prisma"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: Role | Role[]
  fallback?: React.ReactNode
  loadingFallback?: React.ReactNode
}

export function ProtectedRoute({ 
  children, 
  requiredRole, 
  fallback,
  loadingFallback 
}: ProtectedRouteProps) {
  const { 
    session, 
    status, 
    isActive, 
    hasRole, 
    isLoading 
  } = useAuthSession()

  // Show loading state
  if (isLoading || status === "loading") {
    return loadingFallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  // Check if user is authenticated
  if (!session || status === "unauthenticated") {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Authentication Required</h2>
          <p className="text-muted-foreground">Please sign in to access this page.</p>
        </div>
      </div>
    )
  }

  // Check if user account is active
  if (!isActive) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Account Deactivated</h2>
          <p className="text-muted-foreground">Your account has been deactivated. Please contact support.</p>
        </div>
      </div>
    )
  }

  // Check if user has required role
  if (requiredRole && !hasRole(requiredRole)) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
} 