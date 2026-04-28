const prisma = require('./src/config/database');

async function fixLogs() {
  const logs = await prisma.activityLog.findMany({
    where: {
      details: {
        startsWith: 'Unknown User'
      }
    },
    include: {
      user: true
    }
  });

  console.log('Found logs to fix: ' + logs.length);

  for (const log of logs) {
    if (!log.user) continue;
    
    const newDetails = log.details.replace('Unknown User', log.user.name || 'User');
    await prisma.activityLog.update({
      where: { id: log.id },
      data: { details: newDetails }
    });
    console.log('Updated log: ' + newDetails);
  }
  
  await prisma.$disconnect();
}

fixLogs();
