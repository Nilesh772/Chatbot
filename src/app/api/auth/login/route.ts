import { NextResponse } from "next/server";
import { loginUser } from "@/lib/auth";
import { logAction } from "@/lib/auditLog";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await loginUser(email, password);

    // Audit successful login
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined;
    await logAction(user.email, "LOGIN", "session", user.id, ip);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: (user as any).image ?? null,
        role: user.role,
        accountId: user.accountId,
        permissions: (user as any).permissions || [],
      },
    });
  } catch (error: any) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { error: error.message || "Invalid credentials" },
      { status: 401 }
    );
  }
}
