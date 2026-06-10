import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

let prisma: PrismaClient;

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  if (!globalThis.prismaGlobal) {
    globalThis.prismaGlobal = new PrismaClient();
  }
  prisma = globalThis.prismaGlobal;
}

// Helper to check if the database is accessible
export async function checkDbConnection(): Promise<boolean> {
  try {
    // Check if the expected models exist in the Prisma client to prevent "Cannot read properties of undefined"
    const requiredModels = [
      "user",
      "account",
      "department",
      "role",
      "module",
      "rolePermission",
      "auditLog",
      "plan",
      "subscription",
      "bot",
      "flow",
      "widgetSettings",
      "conversation",
      "message",
      "lead",
      "analytics",
    ];

    for (const model of requiredModels) {
      if (!(prisma as any)[model]) {
        console.warn(`Prisma model '${model}' is missing from the generated Prisma Client. Falling back to sandbox database.`);
        return false;
      }
    }

    // Try to run a quick query to verify connection
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.warn("MySQL Database connection failed. Falling back to persistent sandbox database.", error);
    return false;
  }
}

export function isUniqueConstraintError(error: any): boolean {
  if (!error) return false;
  if (error.code === "P2002") return true;
  const errMsg = String(error.message || error).toLowerCase();
  return errMsg.includes("unique constraint") || errMsg.includes("duplicate entry") || errMsg.includes("already exists");
}

export { prisma };
