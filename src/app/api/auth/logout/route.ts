import { NextResponse } from "next/server";
import { logoutUser, getCurrentUser } from "@/lib/auth";
import { logAction } from "@/lib/auditLog";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (user) {
      const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined;
      await logAction(user.email, "LOGOUT", "session", user.id, ip);
    }
  } catch (error) {
    console.error("Failed to log logout action:", error);
  }
  await logoutUser();
  return NextResponse.json({ success: true });
}
