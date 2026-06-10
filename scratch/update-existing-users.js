const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Updating existing users to Super Admin...");
    
    const result = await prisma.teamMember.updateMany({
      where: {
        email: {
          in: ['nilesh1234@gmail.com', 'nilesh123@gmail.com']
        }
      },
      data: {
        role: 'Super Admin',
        roleId: 'role-super-admin',
        accountId: 'acc-super-admin'
      }
    });

    console.log(`Successfully updated ${result.count} users to Super Admin.`);
  } catch (e) {
    console.error("Error updating users:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
