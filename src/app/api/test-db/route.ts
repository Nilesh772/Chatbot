import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";

export async function GET(request: Request) {
  const log: string[] = [];
  try {
    log.push("Starting database and request diagnostic test...");
    
    // 1. Get Headers
    const headersObj: Record<string, string> = {};
    request.headers.forEach((val, key) => {
      headersObj[key] = val;
    });
    
    // 2. Get Cookies
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    const cookiesObj = allCookies.map(c => ({ name: c.name, value: c.value ? c.value.substring(0, 15) + "..." : null }));
    
    // 3. Test decrypt session
    const sessionToken = cookieStore.get("chatbot_session")?.value;
    log.push(`chatbot_session cookie exists: ${!!sessionToken}`);
    if (sessionToken) {
      try {
        const decrypted = await decrypt(sessionToken);
        log.push(`Decrypted session: ${JSON.stringify(decrypted)}`);
      } catch (err: any) {
        log.push(`Decryption failed: ${err.message}`);
      }
    }

    // 4. Test query raw
    await prisma.$queryRaw`SELECT 1`;
    log.push("Prisma successfully executed SELECT 1");

    // 5. Count tables
    try {
      const userCount = await prisma.user.count();
      log.push(`User count: ${userCount}`);
    } catch (e: any) {
      log.push(`Error counting users: ${e.message}`);
    }

    return NextResponse.json({
      success: true,
      log,
      cookies: cookiesObj,
      headers: headersObj,
      nodeEnv: process.env.NODE_ENV,
      appName: "ChetBot"
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message, stack: error.stack, log });
  }
}

