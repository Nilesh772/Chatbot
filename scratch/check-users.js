const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const prisma = new PrismaClient();

async function main() {
  try {
    const users = await prisma.user.findMany();
    const members = await prisma.teamMember.findMany();
    const roles = await prisma.role.findMany();

    console.log("=== USERS ===");
    console.log(JSON.stringify(users, null, 2));
    
    console.log("\n=== TEAM MEMBERS ===");
    console.log(JSON.stringify(members, null, 2));

    console.log("\n=== ROLES ===");
    console.log(JSON.stringify(roles, null, 2));

  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
