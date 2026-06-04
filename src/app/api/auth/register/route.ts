import { NextResponse } from "next/server";
import { registerUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, name, password } = await request.json();

    if (!email || !name) {
      return NextResponse.json(
        { error: "Email and Name are required" },
        { status: 400 }
      );
    }

    const user = await registerUser(email, name, password);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error: any) {
    console.error("Register API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to register user" },
      { status: 400 }
    );
  }
}
