const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  await prisma.company.upsert({
    where: { name: 'Adventures' },
    update: { status: 'Active' },
    create: { name: 'Adventures', status: 'Active' }
  })

  const departments = [
    { name: 'Admin', isAdmin: true },
    { name: 'Operations' },
    { name: 'Sales' },
    { name: 'Finance' },
    { name: 'Creatives' },
    { name: 'Accounting' },
    { name: 'Legal' }
  ]

  for (const dept of departments) {
    await prisma.department.upsert({
      where: { name: dept.name },
      update: { isAdmin: dept.isAdmin ?? false },
      create: { name: dept.name, isAdmin: dept.isAdmin ?? false }
    })
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
