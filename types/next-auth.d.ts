import type { Role } from "@prisma/client"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      role: Role
      isActive: boolean
      avatar?: string | null
      phone?: string | null
    }
  }

  interface User {
    role: Role
    isActive: boolean
    avatar?: string | null
    phone?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: Role
    isActive: boolean
    avatar?: string | null
    phone?: string | null
  }
}
