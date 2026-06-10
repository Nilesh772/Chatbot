const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env (production)
dotenv.config({ path: path.join(__dirname, '..', '.env') });

console.log("Database URL from env:", process.env.DATABASE_URL);

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function main() {
  try {
    console.log("Testing connection...");
    await prisma.$queryRaw`SELECT 1`;
    console.log("Connection successful!");

    const users = await prisma.user.findMany({
      include: {
        roleRelation: true,
        department: true,
      }
    });
    console.log(`\nFound ${users.length} users in database:`);
    for (const u of users) {
      console.log(`- ID: ${u.id}`);
      console.log(`  Name: ${u.name}`);
      console.log(`  Email: ${u.email}`);
      console.log(`  Role: ${u.role}`);
      console.log(`  AccountId: ${u.accountId}`);
    }

    const accounts = await prisma.account.findMany();
    console.log(`\nFound ${accounts.length} accounts in database:`);
    for (const a of accounts) {
      console.log(`- ID: ${a.id}`);
      console.log(`  Company: ${a.company}`);
      console.log(`  Owner: ${a.owner}`);
    }
  } catch (error) {
    console.error("Error running test script:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
