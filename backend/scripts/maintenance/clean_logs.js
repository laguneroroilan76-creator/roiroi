const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clean() {
  const logs = await prisma.activityLog.findMany({
    include: { user: true }
  });

  for (const log of logs) {
    if (log.details && log.user && log.user.name) {
      // Replace email with name if it exists at the start of the details
      const email = log.user.email;
      const name = log.user.name;
      
      if (log.details.includes(email)) {
        const newDetails = log.details.replace(email, name);
        await prisma.activityLog.update({
          where: { id: log.id },
          data: { details: newDetails }
        });
      }
    }
  }

  console.log('Activity logs cleaned successfully.');
  process.exit(0);
}

clean();
