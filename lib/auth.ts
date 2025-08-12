import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "./prisma"
import type { Role } from  "./generated/prisma"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required")
        }

        try {
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email.toLowerCase().trim(),
            },
          })

          if (!user) {
            throw new Error("Invalid credentials")
          }

          if (!user.isActive) {
            throw new Error("Account is deactivated")
          }

          if (!user.password) {
            throw new Error("Invalid credentials")
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

          if (!isPasswordValid) {
            throw new Error("Invalid credentials")
          }

          // Update last login time
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          })

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            isActive: user.isActive,
            avatar: user.avatar,
            phone: user.phone,
          }
        } catch (error) {
          console.error("Authentication error:", error)
          throw error
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
    updateAge: 60 * 60, // 1 hour
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = user.role
        token.isActive = user.isActive
        token.avatar = user.avatar
        token.phone = user.phone
      }

      // Handle session update
      if (trigger === "update" && session) {
        token.role = session.user.role
        token.isActive = session.user.isActive
        token.avatar = session.user.avatar
        token.phone = session.user.phone
      }

      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as Role
        session.user.isActive = token.isActive as boolean
        session.user.avatar = token.avatar as string | null
        session.user.phone = token.phone as string | null
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin", // Redirect to signin page on error
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      // Log successful sign-in
      console.log(`User ${user.email} signed in successfully`)
    },
    async signOut({ session, token }) {
      // Log sign-out
      if (session?.user?.email) {
        console.log(`User ${session.user.email} signed out`)
      }
    },
  },
  debug: process.env.NODE_ENV === "development",
}
