"use client"

import { useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

interface SessionRefreshProps {
  children: React.ReactNode
  refreshInterval?: number // in milliseconds
  warningTime?: number // in milliseconds
}

export function SessionRefresh({ 
  children, 
  refreshInterval = 5 * 60 * 1000, // 5 minutes
  warningTime = 60 * 1000 // 1 minute before expiry
}: SessionRefreshProps) {
  const { data: session, update } = useSession()
  const router = useRouter()
  const refreshTimerRef = useRef<NodeJS.Timeout>()
  const warningTimerRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (!session) return

    // Clear existing timers
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current)
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current)
    }

    // Calculate session expiry time
    const sessionExpiry = session.expires ? new Date(session.expires).getTime() : Date.now() + (24 * 60 * 60 * 1000)
    const now = Date.now()
    const timeUntilExpiry = sessionExpiry - now

    // Set up refresh timer
    if (timeUntilExpiry > refreshInterval) {
      refreshTimerRef.current = setTimeout(async () => {
        try {
          await update()
        } catch (error) {
          console.error("Session refresh failed:", error)
          // Redirect to sign-in if refresh fails
          router.push("/auth/signin?error=session-expired")
        }
      }, refreshInterval)
    }

    // Set up warning timer
    if (timeUntilExpiry > warningTime) {
      warningTimerRef.current = setTimeout(() => {
        // Show warning to user (you can implement a toast notification here)
        console.warn("Session will expire soon")
      }, timeUntilExpiry - warningTime)
    }

    // Cleanup function
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current)
      }
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current)
      }
    }
  }, [session, update, router, refreshInterval, warningTime])

  return <>{children}</>
} 