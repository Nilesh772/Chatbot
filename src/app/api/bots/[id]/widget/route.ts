import { NextResponse } from "next/server";
import { dbService } from "@/lib/dbService";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const settings = await dbService.getWidgetSettings(id);
    const bot = await dbService.getBotById(id);

    if (!settings || !bot) {
      return NextResponse.json({ error: "Bot or settings not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...settings,
      botName: bot.name,
      avatarUrl: bot.avatarUrl,
      welcomeMessage: bot.welcomeMessage,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch widget settings" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = await request.json();

    const { botName, welcomeMessage, avatarUrl, ...widgetUpdates } = updates;

    // Update bot properties
    await dbService.updateBot(id, {
      name: botName,
      welcomeMessage,
      avatarUrl,
    });

    // Update widget settings
    const settings = await dbService.updateWidgetSettings(id, widgetUpdates);

    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update widget settings" }, { status: 500 });
  }
}
