import { NextResponse } from "next/server";
import { dbService } from "@/lib/dbService";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let { id } = await params;
    
    if (id === "active") {
      const activeBot = await dbService.getActiveBot("usr-admin");
      if (!activeBot) {
        return NextResponse.json(
          { error: "No active bot found" },
          { status: 404, headers: corsHeaders }
        );
      }
      id = activeBot.id;
    }
    
    const bot = await dbService.getBotById(id);
    if (!bot) {
      return NextResponse.json(
        { error: "Bot not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Track visitor analytics metric
    await dbService.trackAnalytics((bot as any).accountId || "acc-super-admin", id, "visitor", 1);

    const settings = await dbService.getWidgetSettings(id);

    if (!settings || !bot) {
      return NextResponse.json(
        { error: "Bot or settings not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json({
      botId: id,
      botName: bot.name,
      avatarUrl: bot.avatarUrl,
      welcomeMessage: bot.welcomeMessage,
      widgetColor: settings.widgetColor,
      headerColor: settings.headerColor,
      position: settings.position,
      bubbleStyle: settings.bubbleStyle,
      font: settings.font,
      borderRadius: settings.borderRadius,
      launcherIcon: settings.launcherIcon,
      launcherBgTransparent: settings.launcherBgTransparent,
      launcherIconSize: settings.launcherIconSize,
      headerTextColor: (settings as any).headerTextColor,
      leftMessageBgColor: (settings as any).leftMessageBgColor,
      leftMessageTextColor: (settings as any).leftMessageTextColor,
      rightMessageBgColor: (settings as any).rightMessageBgColor,
      rightMessageTextColor: (settings as any).rightMessageTextColor,
      widgetBgColor: (settings as any).widgetBgColor,
      launcherGreeting: (settings as any).launcherGreeting,
      launcherGreetingEnabled: (settings as any).launcherGreetingEnabled,
      launcherAnimation: (settings as any).launcherAnimation,
    }, {
      headers: corsHeaders
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to load widget details" },
      { status: 500, headers: corsHeaders }
    );
  }
}
