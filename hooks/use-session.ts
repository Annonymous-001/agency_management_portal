"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import type { Role } from "@/lib/generated/prisma"

export function useAuthSession() {
  const { data: session, status, update } = useSession()
  const router = useRouter()

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  // Check if user account is active
  const isActive = session?.user?.isActive ?? false

  // Check if user has specific role
  const hasRole = (role: Role | Role[]) => {
    if (!session?.user?.role) return false
    if (Array.isArray(role)) {
      return role.includes(session.user.role)
    }
    return session.user.role === role
  }

  // Check if user is admin
  const isAdmin = hasRole("ADMIN")

  // Check if user is project manager or admin
  const isManagerOrAdmin = hasRole(["PROJECT_MANAGER", "ADMIN"])

  // Check if user is team member, project manager, or admin
  const isTeamMemberOrAbove = hasRole(["TEAM_MEMBER", "PROJECT_MANAGER", "ADMIN"])

  // Get user's dashboard path
  const getDashboardPath = () => {
    if (!session?.user?.role) return "/auth/signin"
    
    switch (session.user.role) {
      case "CLIENT":
        return "/dashboard/client"
      case "TEAM_MEMBER":
        return "/dashboard/team-member"
      case "PROJECT_MANAGER":
        return "/dashboard/project-manager"
      case "ADMIN":
        return "/dashboard/admin"
      default:
        return "/auth/signin"
    }
  }

  return {
    session,
    status,
    update,
    isActive,
    hasRole,
    isAdmin,
    isManagerOrAdmin,
    isTeamMemberOrAbove,
    getDashboardPath,
    user: session?.user,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
  }
} 