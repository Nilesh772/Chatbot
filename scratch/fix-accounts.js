const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.development') });

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Starting DB accounts mapping check...");

    // 1. Get all users
    const users = await prisma.user.findMany();
    console.log(`Found ${users.length} users:`);
    for (const u of users) {
      console.log(`- User: ${u.email} (ID: ${u.id}) is linked to Account: ${u.accountId} with Role: ${u.role}`);
    }

    // 2. Get all accounts
    const accounts = await prisma.account.findMany();
    console.log(`\nFound ${accounts.length} accounts:`);
    for (const a of accounts) {
      console.log(`- Account: ${a.company} (ID: ${a.id}), Owner: ${a.owner}`);
    }

    // 3. Fix user account IDs in case they were incorrectly set to acc-super-admin
    // Wait! Let's check if Nilesh's or Nitin's user records have the wrong accountId in the database.
    // Nilesh: chaudharynilesh9727@gmail.com. His account ID should be 3cf9f534-3583-42d8-8e4c-3e43843bb755.
    // Nitin: nitin@gmail.com. His account ID should be a05a239a-9dc5-4eeb-923b-b8914c92c58d.
    for (const u of users) {
      if (u.email === 'chaudharynilesh9727@gmail.com' && u.accountId === 'acc-super-admin') {
        console.log(`Fixing user ${u.email} accountId to 3cf9f534-3583-42d8-8e4c-3e43843bb755`);
        await prisma.user.update({
          where: { id: u.id },
          data: { accountId: '3cf9f534-3583-42d8-8e4c-3e43843bb755' }
        });
        u.accountId = '3cf9f534-3583-42d8-8e4c-3e43843bb755';
      }
      if (u.email === 'nitin@gmail.com' && u.accountId === 'acc-super-admin') {
        console.log(`Fixing user ${u.email} accountId to a05a239a-9dc5-4eeb-923b-b8914c92c58d`);
        await prisma.user.update({
          where: { id: u.id },
          data: { accountId: 'a05a239a-9dc5-4eeb-923b-b8914c92c58d' }
        });
        u.accountId = 'a05a239a-9dc5-4eeb-923b-b8914c92c58d';
      }
    }

    // 4. Now fix bots and their child objects
    const bots = await prisma.bot.findMany();
    console.log(`\nFound ${bots.length} bots:`);
    for (const b of bots) {
      console.log(`- Bot: ${b.name} (ID: ${b.id}), Account: ${b.accountId}, User: ${b.userId}`);
      
      // If the bot's accountId is acc-super-admin, but it is owned by a specific user who has a different accountId,
      // update the bot's accountId and all associated tables to match the owner's accountId.
      if (b.accountId === 'acc-super-admin' && b.userId) {
        const owner = users.find(u => u.id === b.userId);
        if (owner && owner.accountId !== 'acc-super-admin') {
          const targetAccountId = owner.accountId;
          console.log(`  => Fixing Bot '${b.name}' accountId from 'acc-super-admin' to '${targetAccountId}' (Owner: ${owner.email})`);
          
          // Update Bot
          await prisma.bot.update({
            where: { id: b.id },
            data: { accountId: targetAccountId }
          });

          // Update Conversations
          const conversationsResult = await prisma.conversation.updateMany({
            where: { botId: b.id, accountId: 'acc-super-admin' },
            data: { accountId: targetAccountId }
          });
          console.log(`  => Updated ${conversationsResult.count} conversations`);

          // Update Leads
          const leadsResult = await prisma.lead.updateMany({
            where: { botId: b.id, accountId: 'acc-super-admin' },
            data: { accountId: targetAccountId }
          });
          console.log(`  => Updated ${leadsResult.count} leads`);

          // Update Analytics
          const analyticsResult = await prisma.analytics.updateMany({
            where: { botId: b.id, accountId: 'acc-super-admin' },
            data: { accountId: targetAccountId }
          });
          console.log(`  => Updated ${analyticsResult.count} analytics entries`);
        }
      }
    }

    console.log("\nAccount and bot mapping repair completed!");
  } catch (e) {
    console.error("Error running fix script:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
