import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

async function main() {
  await prisma.user.upsert({
    where: { email: "owner@example.com" },
    update: {},
    create: {
      name: "Owner User",
      email: "owner@example.com",
      role: "OWNER",
    },
  })

  await prisma.user.upsert({
    where: { email: "tenant@example.com" },
    update: {},
    create: {
      name: "Tenant User",
      email: "tenant@example.com",
      role: "TENANT",
    },
  })

  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@example.com",
      role: "ADMIN",
    },
  })
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    prisma.$disconnect()
    process.exit(1)
  })
