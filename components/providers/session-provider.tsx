"use client"

import type React from "react"
import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from "./theme-provider"
import { SessionRefresh } from "@/components/auth/session-refresh"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <SessionRefresh>
          {children}
        </SessionRefresh>
      </ThemeProvider>
    </SessionProvider>
  )
}
