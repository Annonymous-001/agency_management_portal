"use client"

import type React from "react"

import { useState } from "react"
import { signIn, getSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Eye, EyeOff } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

export default function SignInPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        email: email.toLowerCase().trim(),
        password,
        redirect: false,
      })

      if (result?.error) {
        // Handle specific error messages
        switch (result.error) {
          case "Email and password are required":
            setError("Please enter both email and password")
            break
          case "Invalid credentials":
            setError("Invalid email or password")
            break
          case "Account is deactivated":
            setError("Your account has been deactivated. Please contact support.")
            break
          default:
            setError("An error occurred during sign in. Please try again.")
        }
      } else {
        // Get the session to determine redirect path
        const session = await getSession()
        if (session?.user.role) {
          switch (session.user.role) {
            case "CLIENT":
              router.push("/dashboard/client")
              break
            case "TEAM_MEMBER":
              router.push("/dashboard/team-member")
              break
            case "PROJECT_MANAGER":
              router.push("/dashboard/project-manager")
              break
            case "ADMIN":
              router.push("/dashboard/admin")
              break
            default:
              router.push("/")
          }
        }
      }
    } catch (error) {
      console.error("Sign-in error:", error)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoLogin = async (demoEmail: string) => {
    setEmail(demoEmail)
    setPassword("demo123")
    setIsLoading(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        email: demoEmail,
        password: "demo123",
        redirect: false,
      })

      if (result?.error) {
        setError("Demo login failed. Please try again.")
      } else {
        const session = await getSession()
        if (session?.user.role) {
          switch (session.user.role) {
            case "CLIENT":
              router.push("/dashboard/client")
              break
            case "TEAM_MEMBER":
              router.push("/dashboard/team-member")
              break
            case "PROJECT_MANAGER":
              router.push("/dashboard/project-manager")
              break
            case "ADMIN":
              router.push("/dashboard/admin")
              break
            default:
              router.push("/")
          }
        }
      }
    } catch (error) {
      console.error("Demo login error:", error)
      setError("Demo login failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Sign in</CardTitle>
          <CardDescription className="text-center">Enter your credentials to access your dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign in
            </Button>
          </form>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-3">Demo Accounts:</p>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => handleDemoLogin("admin@agency.com")}
                disabled={isLoading}
              >
                <span className="text-xs">👑 Admin</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => handleDemoLogin("manager@agency.com")}
                disabled={isLoading}
              >
                <span className="text-xs">📋 Project Manager</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => handleDemoLogin("dev1@agency.com")}
                disabled={isLoading}
              >
                <span className="text-xs">👨‍💻 Team Member</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => handleDemoLogin("client1@client.com")}
                disabled={isLoading}
              >
                <span className="text-xs">👤 Client</span>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              All demo accounts use password: <code className="bg-background px-1 rounded">demo123</code>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
