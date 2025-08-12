import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  // Redirect to appropriate dashboard based on role
  switch (session.user.role) {
    case "CLIENT":
      redirect("/dashboard/client")
    case "TEAM_MEMBER":
      redirect("/dashboard/team-member")
    case "PROJECT_MANAGER":
      redirect("/dashboard/project-manager")
    case "ADMIN":
      redirect("/dashboard/admin")
    default:
      redirect("/auth/signin")
  }
}
