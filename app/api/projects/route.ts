import { NextResponse } from "next/server"
import { 
  getProjects, 
  createProject, 
  updateProject, 
  deleteProject,
  getProject,
  searchProjects,
  updateProjectStatus,
  updateProjectBudget,
  updateProjectTimeline,
  updateProjectTeam
} from "@/lib/actions/projects"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const query = searchParams.get("q")
    const includeArchived = searchParams.get("includeArchived") === "true"
    const action = searchParams.get("action")

    // Get single project
    if (id) {
      if (action === "team-members") {
        const { getProjectTeamMembers } = await import("@/lib/actions/projects")
        const teamMembers = await getProjectTeamMembers(id)
        return NextResponse.json(teamMembers)
      }

      if (action === "available-users") {
        const { getAvailableTeamMembers } = await import("@/lib/actions/projects")
        const availableUsers = await getAvailableTeamMembers()
        return NextResponse.json(availableUsers)
      }

      const project = await getProject(id)
      return NextResponse.json(project)
    }

    // Search projects
    if (query) {
      const filters: any = {}
      const status = searchParams.get("status")
      const priority = searchParams.get("priority")
      const clientId = searchParams.get("clientId")
      const managerId = searchParams.get("managerId")

      if (status) filters.status = status
      if (priority) filters.priority = priority
      if (clientId) filters.clientId = clientId
      if (managerId) filters.managerId = managerId

      const projects = await searchProjects(query, filters)
      return NextResponse.json(projects)
    }

    // Get all projects
    const projects = await getProjects(includeArchived)
    return NextResponse.json(projects)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const project = await createProject(formData)
    return NextResponse.json(project)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const action = searchParams.get("action")
    
    if (!id) throw new Error("Missing project id")

    if (action === "status") {
      const { status, notes } = await request.json()
      const project = await updateProjectStatus(id, status, notes)
      return NextResponse.json(project)
    }

    if (action === "budget") {
      const { budget, spentAmount, currency } = await request.json()
      const project = await updateProjectBudget(id, budget, spentAmount, currency)
      return NextResponse.json(project)
    }

    if (action === "timeline") {
      const timelineData = await request.json()
      const project = await updateProjectTimeline(id, timelineData)
      return NextResponse.json(project)
    }

    if (action === "team") {
      const teamData = await request.json()
      await updateProjectTeam(id, teamData)
      return NextResponse.json({ success: true })
    }

    // Default full update
    const formData = await request.formData()
    const project = await updateProject(id, formData)
    return NextResponse.json(project)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) throw new Error("Missing project id")
    await deleteProject(id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
} 