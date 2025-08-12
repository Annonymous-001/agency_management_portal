import { NextResponse } from "next/server"
import { getProjectFormOptions } from "@/lib/actions/projects"

export async function GET() {
  try {
    const options = await getProjectFormOptions()
    return NextResponse.json(options)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
} 