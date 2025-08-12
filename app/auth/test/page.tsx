"use client"

import { useAuthSession } from "@/hooks/use-session"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { signOut } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function AuthTestPage() {
  const { session, status, isActive, hasRole, isAdmin, isManagerOrAdmin, isTeamMemberOrAbove, getDashboardPath } = useAuthSession()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push("/auth/signin")
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Test Page</CardTitle>
            <CardDescription>Testing authentication and authorization functionality</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Session Status</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span>Status:</span>
                  <Badge variant={status === "authenticated" ? "default" : "secondary"}>
                    {status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span>Account Active:</span>
                  <Badge variant={isActive ? "default" : "destructive"}>
                    {isActive ? "Yes" : "No"}
                  </Badge>
                </div>
              </div>
            </div>

            {session?.user && (
              <div>
                <h3 className="text-lg font-semibold mb-2">User Information</h3>
                <div className="space-y-2">
                  <div><strong>ID:</strong> {session.user.id}</div>
                  <div><strong>Email:</strong> {session.user.email}</div>
                  <div><strong>Name:</strong> {session.user.name || "Not set"}</div>
                  <div><strong>Role:</strong> <Badge>{session.user.role}</Badge></div>
                </div>
              </div>
            )}

            <div>
              <h3 className="text-lg font-semibold mb-2">Role Permissions</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span>Is Admin:</span>
                  <Badge variant={isAdmin ? "default" : "secondary"}>
                    {isAdmin ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span>Is Manager or Admin:</span>
                  <Badge variant={isManagerOrAdmin ? "default" : "secondary"}>
                    {isManagerOrAdmin ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span>Is Team Member or Above:</span>
                  <Badge variant={isTeamMemberOrAbove ? "default" : "secondary"}>
                    {isTeamMemberOrAbove ? "Yes" : "No"}
                  </Badge>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Dashboard Path</h3>
              <div className="flex items-center gap-2">
                <span>Your Dashboard:</span>
                <Badge variant="outline">{getDashboardPath()}</Badge>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={() => router.push(getDashboardPath())}>
                Go to Dashboard
              </Button>
              <Button variant="outline" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
} 