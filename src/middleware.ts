import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET_KEY = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "super-secret-chatbot-key-12345"
);

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Redirect legacy /dashboard/agents to the unified /dashboard/team
  if (pathname.startsWith("/dashboard/agents")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard/team";
    return NextResponse.redirect(url);
  }

  // Only protect dashboard routes
  if (!pathname.startsWith("/dashboard")) {
    return NextResponse.next();
  }

  const token = request.cookies.get("chatbot_session")?.value;

  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  try {
    await jwtVerify(token, SECRET_KEY, {
      algorithms: ["HS256"],
    });

    return NextResponse.next();
  } catch (error) {
    console.error("Middleware session verification error:", error);
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    const response = NextResponse.redirect(url);
    response.cookies.delete("chatbot_session");
    return response;
  }
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
