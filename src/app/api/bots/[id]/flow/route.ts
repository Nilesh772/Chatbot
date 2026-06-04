import { NextResponse } from "next/server";
import { dbService } from "@/lib/dbService";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const flow = await dbService.getFlowByBotId(id);
    if (!flow) {
      return NextResponse.json({ nodes: [], edges: [] });
    }
    return NextResponse.json(flow);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch flow" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { nodes, edges, template } = await request.json();

    let flow;
    if (template) {
      flow = await dbService.applyFlowTemplate(id, template);
    } else {
      const existingFlow = await dbService.getFlowByBotId(id);
      if (existingFlow) {
        flow = await dbService.updateFlow(existingFlow.id, { nodes: nodes || [], edges: edges || [] });
      }
    }

    return NextResponse.json({ success: true, flow });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update flow" }, { status: 500 });
  }
}
