import { NextResponse } from "next/server"
import { 
  createProjectMilestone,
  updateProjectMilestone,
  deleteProjectMilestone
} from "@/lib/actions/projects"

export async function POST(request: Request) {
  try {
    const { projectId, ...milestoneData } = await request.json()
    const milestone = await createProjectMilestone(projectId, milestoneData)
    return NextResponse.json(milestone)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) throw new Error("Missing milestone id")
    
    const milestoneData = await request.json()
    const milestone = await updateProjectMilestone(id, milestoneData)
    return NextResponse.json(milestone)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) throw new Error("Missing milestone id")
    
    await deleteProjectMilestone(id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
} 