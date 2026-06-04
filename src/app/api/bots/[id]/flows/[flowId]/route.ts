import { NextResponse } from "next/server";
import { dbService } from "@/lib/dbService";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; flowId: string }> }
) {
  try {
    const { flowId } = await params;
    const flow = await dbService.getFlowById(flowId);
    if (!flow) {
      return NextResponse.json({ error: "Flow not found" }, { status: 404 });
    }
    return NextResponse.json({ flow });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch flow" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; flowId: string }> }
) {
  try {
    const { flowId } = await params;
    const { nodes, edges, name, isMain, template } = await request.json();

    let flow;
    if (template) {
      flow = await dbService.applyFlowTemplate(flowId, template);
    } else {
      flow = await dbService.updateFlow(flowId, { nodes, edges, name, isMain });
    }

    if (!flow) {
      return NextResponse.json({ error: "Flow not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, flow });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update flow" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; flowId: string }> }
) {
  try {
    const { flowId } = await params;
    const success = await dbService.deleteFlow(flowId);
    return NextResponse.json({ success });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete flow" }, { status: 500 });
  }
}
