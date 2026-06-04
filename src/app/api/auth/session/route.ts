import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { dbService } from "@/lib/dbService";

export async function GET() {
  try {
    const user = await getCurrentUser();
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
      },
      isSandbox,
    });
  } catch (error) {
    return NextResponse.json({ user: null, isSandbox: true });
  }
}
