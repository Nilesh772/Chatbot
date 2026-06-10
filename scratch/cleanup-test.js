const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Cleaning up test user...");
    
    // Get account ID for this user first
    const member = await prisma.teamMember.findUnique({
      where: { email: 'supertest@gmail.com' }
    });

    if (member) {
      // Delete team member
      await prisma.teamMember.delete({
        where: { email: 'supertest@gmail.com' }
      });
      // Delete user
      await prisma.user.delete({
        where: { email: 'supertest@gmail.com' }
      });
      // Delete account if created
      if (member.accountId && member.accountId !== 'acc-super-admin') {
        await prisma.account.delete({
          where: { id: member.accountId }
        }).catch(() => {});
      }
      console.log("Super Test User deleted successfully.");
    }
  } catch (e) {
    console.error("Error during cleanup:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
