const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.user.updateMany({
    data: {
      themeColor: '#0f172a'
    }
  });
  console.log(`Updated theme colors for ${result.count} users.`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
