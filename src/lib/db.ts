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
    // Try to run a quick query to verify connection
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.warn("MySQL Database connection failed. Falling back to persistent sandbox database.", error);
    return false;
  }
}

export { prisma };
