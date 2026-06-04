import { NextResponse } from "next/server";
import { dbService } from "@/lib/dbService";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const period = parseInt(searchParams.get("period") || "30", 10);

    const summary = await dbService.getAnalyticsSummary(id, period);
    return NextResponse.json(summary);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch analytics" }, { status: 500 });
  }
}
