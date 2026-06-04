import { NextResponse } from "next/server";
import { dbService } from "@/lib/dbService";
import { flowEngine } from "@/lib/flowEngine";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let { id } = await params;
    
    if (id === "active") {
      const activeBot = await dbService.getActiveBot("usr-admin");
      if (!activeBot) {
        return NextResponse.json({ error: "No active bot found" }, { status: 404 });
      }
      id = activeBot.id;
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    const conversation = await dbService.findOrCreateConversation(id, sessionId);
    return NextResponse.json({ messages: conversation?.messages || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to load chat history" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let { id } = await params;
    
    if (id === "active") {
      const activeBot = await dbService.getActiveBot("usr-admin");
      if (!activeBot) {
        return NextResponse.json({ error: "No active bot found" }, { status: 404 });
      }
      id = activeBot.id;
    }

    const { sessionId, text, buttonIndex, payload } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    // 1. Find or create the conversation
    const conversation = await dbService.findOrCreateConversation(id, sessionId);

    if (!conversation) {
      return NextResponse.json({ error: "Failed to locate or create conversation" }, { status: 400 });
    }

    // 2. Save the user's message if they sent one
    if (text || buttonIndex !== undefined || payload) {
      const msgText = buttonIndex !== undefined ? `Selected option: ${text}` : text || "Submitted input";
      await dbService.addMessage(conversation.id, "user", msgText, { buttonIndex, payload });
    }

    // 3. Run the flow engine to get the next bot responses
    const flowResult = await flowEngine.executeStep(
      id,
      sessionId,
      text,
      buttonIndex
    );

    return NextResponse.json({
      success: true,
      messages: flowResult.messages,
      isEnd: flowResult.isEnd,
    });
  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json({ error: error.message || "Failed to process chat step" }, { status: 500 });
  }
}
