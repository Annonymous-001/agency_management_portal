import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"
import type { Role } from "./lib/generated/prisma"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const { pathname } = req.nextUrl

    // Redirect to appropriate dashboard after login
    if (pathname === "/" && token) {
      const dashboardPath = getDashboardPath(token.role as Role)
      return NextResponse.redirect(new URL(dashboardPath, req.url))
    }

    // Role-based route protection
    if (pathname.startsWith("/dashboard")) {
      const userRole = token?.role as Role
      const requiredRole = getRequiredRole(pathname)

      // Check if user account is active
      if (token && !token.isActive) {
        return NextResponse.redirect(new URL("/auth/signin?error=account-deactivated", req.url))
      }

      // Only allow access if userRole matches requiredRole (except ADMIN, who can access all)
      if (requiredRole && userRole !== requiredRole && userRole !== "ADMIN") {
        return NextResponse.redirect(new URL("/unauthorized", req.url))
      }

      // Additional role-based restrictions
      if (userRole === "CLIENT") {
        // Clients can only access client-specific routes
        if (!pathname.startsWith("/dashboard/client")) {
          return NextResponse.redirect(new URL("/unauthorized", req.url))
        }
      } else if (userRole === "TEAM_MEMBER") {
        // Team members can access team member routes and some project manager routes
        if (!pathname.startsWith("/dashboard/team-member") && 
            !pathname.startsWith("/dashboard/project-manager/projects") &&
            !pathname.startsWith("/dashboard/project-manager/tasks")) {
          return NextResponse.redirect(new URL("/unauthorized", req.url))
        }
      } else if (userRole === "PROJECT_MANAGER") {
        // Project managers can access team member routes and project manager routes
        if (!pathname.startsWith("/dashboard/team-member") && 
            !pathname.startsWith("/dashboard/project-manager")) {
          return NextResponse.redirect(new URL("/unauthorized", req.url))
        }
      }
      // ADMIN can access all routes
    }

    // API route protection
    if (pathname.startsWith("/api") && !pathname.startsWith("/api/auth")) {
      const userRole = token?.role as Role
      
      // Protect sensitive API routes
      if (pathname.startsWith("/api/admin") && userRole !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
      }
      
      if (pathname.startsWith("/api/users") && userRole !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        // Public routes
        if (pathname.startsWith("/auth") || 
            pathname === "/unauthorized" ||
            pathname.startsWith("/_next") ||
            pathname.startsWith("/favicon.ico") ||
            pathname === "/") {
          return true
        }

        // Protected routes require authentication
        return !!token
      },
    },
  },
)

function getDashboardPath(role: Role): string {
  switch (role) {
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

function getRequiredRole(pathname: string): Role | null {
  if (pathname.startsWith("/dashboard/client")) return "CLIENT"
  if (pathname.startsWith("/dashboard/team-member")) return "TEAM_MEMBER"
  if (pathname.startsWith("/dashboard/project-manager")) return "PROJECT_MANAGER"
  if (pathname.startsWith("/dashboard/admin")) return "ADMIN"
  return null
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
