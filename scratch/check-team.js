const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const prisma = new PrismaClient();

async function main() {
  try {
    const members = await prisma.teamMember.findMany({
      include: {
        roleRelation: true
      }
    });
    console.log("TEAM MEMBERS IN DATABASE:");
    console.log(JSON.stringify(members, null, 2));
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
