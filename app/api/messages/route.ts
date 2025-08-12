import { NextResponse } from "next/server"
import { getMessages, createMessage, markMessageAsRead, deleteMessage, getUsersForMessaging, getProjectsForMessaging } from "@/lib/actions/messages"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const type = url.searchParams.get("type")
    const userId = url.searchParams.get("userId")
    
    if (type === "users") {
      const users = await getUsersForMessaging()
      return NextResponse.json(users)
    }
    
    if (type === "projects") {
      const projects = await getProjectsForMessaging(userId || undefined)
      return NextResponse.json(projects)
    }
    
    const messages = await getMessages()
    return NextResponse.json(messages)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const message = await createMessage(formData)
    return NextResponse.json(message)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get("id")
    if (!id) throw new Error("Missing message id")
    await markMessageAsRead(id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get("id")
    if (!id) throw new Error("Missing message id")
    await deleteMessage(id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
} 