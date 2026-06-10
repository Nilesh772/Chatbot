import { NextResponse } from "next/server";
import { registerUser } from "@/lib/auth";
import { isUniqueConstraintError } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { email, name, password, company } = await request.json();

    if (!email || !name || !company) {
      return NextResponse.json(
        { error: "Company name, email and name are required" },
        { status: 400 }
      );
    }

    const user = await registerUser(email, name, password, company);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        accountId: user.accountId,
        permissions: user.permissions || [],
      },
    });
  } catch (error: any) {
    console.error("Register API error:", error);
    if (isUniqueConstraintError(error)) {
      return NextResponse.json(
        { error: "A user with this email already exists." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to register user" },
      { status: 400 }
    );
  }
}
