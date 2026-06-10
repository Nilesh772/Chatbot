import { NextResponse } from "next/server";
import { getCurrentUser, getSessionPayload } from "@/lib/auth";
import { dbService } from "@/lib/dbService";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const session = await getSessionPayload();
    const isSandbox = await dbService.isSandboxMode();

    if (!user) {
      return NextResponse.json({ user: null, isSandbox });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: session?.role || "admin",        // expose role to client
        agentId: session?.agentId || undefined, // expose agentId if agent
      },
      isSandbox,
    });
  } catch (error) {
    return NextResponse.json({ user: null, isSandbox: true });
  }
}
