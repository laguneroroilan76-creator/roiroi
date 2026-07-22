const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const company = await prisma.company.upsert({
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
    const existing = await prisma.department.findFirst({
      where: { name: dept.name }
    })

    if (existing) {
      await prisma.department.update({
        where: { id: existing.id },
        data: { isAdmin: dept.isAdmin ?? false }
      })
    } else {
      await prisma.department.create({
        data: {
          name: dept.name,
          isAdmin: dept.isAdmin ?? false
        }
      })
    }
  }

  console.log('Seed completed successfully')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
