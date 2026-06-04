import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { dbService } from "@/lib/dbService";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || "usr-admin"; // Fallback to sandbox admin for ease of preview

    // 1. Fetch bots
    const bots = await dbService.getBots(userId);

    // 2. Fetch all leads
    const leads = await dbService.getLeads();
    // Filter leads to only belong to user's bots
    const botIds = bots.map((b) => b.id);
    const userLeads = leads.filter((l) => botIds.includes(l.botId));

    // 3. Aggregate analytics (past 30 days) across all user bots
    let totalVisitors = 0;
    let totalChats = 0;

    for (const bot of bots) {
      const summary = await dbService.getAnalyticsSummary(bot.id, 30);
      totalVisitors += summary.visitors;
      totalChats += summary.chats;
    }

    const totalLeads = userLeads.length;
    const avgConversionRate = totalVisitors > 0 
      ? parseFloat(((totalLeads / totalVisitors) * 100).toFixed(1)) 
      : 0;

    // Latest 5 leads with Bot Names attached
    const recentLeads = userLeads.slice(0, 5).map((lead) => {
      const bot = bots.find((b) => b.id === lead.botId);
      return {
        ...lead,
        botName: bot ? bot.name : "Chatbot",
      };
    });

    return NextResponse.json({
      summary: {
        visitors: totalVisitors,
        chats: totalChats,
        leads: totalLeads,
        conversionRate: avgConversionRate,
      },
      bots: bots.map(b => ({
        id: b.id,
        name: b.name,
        avatarUrl: b.avatarUrl,
        createdAt: b.createdAt
      })),
      recentLeads,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch dashboard summary" },
      { status: 500 }
    );
  }
}
