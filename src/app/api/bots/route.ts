import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { dbService } from "@/lib/dbService";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || "usr-admin"; // Fallback to sandbox admin for ease of preview

    const bots = await dbService.getBots(userId);
    return NextResponse.json({ bots });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch bots" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || "usr-admin"; // Fallback to sandbox admin for ease of preview

    const { name, avatarUrl, welcomeMessage, template } = await request.json();

    if (!name) {
      return NextResponse.json({ error: "Bot name is required" }, { status: 400 });
    }

    const bot = await dbService.createBot(userId, name, avatarUrl, welcomeMessage);

    // If template was selected, apply it immediately
    if (template && template !== "scratch") {
      await dbService.applyFlowTemplate(bot.id, template);
    }

    return NextResponse.json({ success: true, bot });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create bot" }, { status: 500 });
  }
}
