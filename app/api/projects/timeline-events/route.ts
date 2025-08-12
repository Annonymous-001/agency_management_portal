import { NextResponse } from "next/server"
import { 
  createProjectTimelineEvent,
  updateProjectTimelineEvent,
  deleteProjectTimelineEvent
} from "@/lib/actions/projects"

export async function POST(request: Request) {
  try {
    const { projectId, ...eventData } = await request.json()
    const event = await createProjectTimelineEvent(projectId, eventData)
    return NextResponse.json(event)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) throw new Error("Missing event id")
    
    const eventData = await request.json()
    const event = await updateProjectTimelineEvent(id, eventData)
    return NextResponse.json(event)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) throw new Error("Missing event id")
    
    await deleteProjectTimelineEvent(id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
} 