import { NextResponse } from "next/server";
import { dbService } from "@/lib/dbService";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const leads = await dbService.getLeads(id);
    return NextResponse.json({ leads });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch leads" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const lead = await dbService.createLead(id, body);
    return NextResponse.json({ success: true, lead });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to save lead" }, { status: 500 });
  }
}
