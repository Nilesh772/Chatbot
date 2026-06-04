import { NextResponse } from "next/server";
import { dbService } from "@/lib/dbService";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const flows = await dbService.getFlowsByBotId(id);
    return NextResponse.json({ flows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch flows" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { name, isMain } = await request.json();
    
    if (!name) {
      return NextResponse.json({ error: "Flow name is required" }, { status: 400 });
    }

    const flow = await dbService.createFlow(id, name, !!isMain);
    return NextResponse.json({ success: true, flow });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create flow" }, { status: 500 });
  }
}
