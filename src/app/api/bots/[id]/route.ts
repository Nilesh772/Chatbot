import { NextResponse } from "next/server";
import { dbService } from "@/lib/dbService";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bot = await dbService.getBotById(id);
    if (!bot) {
      return NextResponse.json({ error: "Bot not found" }, { status: 404 });
    }
    return NextResponse.json({ bot });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch bot" }, { status: 500 });
  }
}

import { getCurrentUser } from "@/lib/auth";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = await request.json();
    
    let bot;
    if (updates.isActive === true) {
      const user = await getCurrentUser();
      const userId = user?.id || "usr-admin";
      bot = await dbService.setActiveBot(userId, id);
    } else {
      bot = await dbService.updateBot(id, updates);
    }

    if (!bot) {
      return NextResponse.json({ error: "Bot not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, bot });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update bot" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await dbService.deleteBot(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete bot" }, { status: 500 });
  }
}
