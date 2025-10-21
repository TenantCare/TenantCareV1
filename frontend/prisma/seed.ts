import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create Owner User
  const ownerUser = await prisma.user.upsert({
    where: { email: "firosk7@gmail.com" },
    update: {},
    create: {
      name: "Owner User",
      email: "firosk7@gmail.com",
      role: "OWNER",
    },
  });

  // Create Owner Profile
  const owner = await prisma.owner.upsert({
    where: { id: ownerUser.id },
    update: {},
    create: {
      userId: ownerUser.id,
    },
  });

  // Create a Building
  const building = await prisma.building.create({
    data: {
      name: "Sunrise Residency",
      ownerId: owner.id,
    },
  });

  // Create Apartments under that building
  const apt1 = await prisma.apartment.create({
    data: {
      buildingId: building.id,
    },
  });

  const apt2 = await prisma.apartment.create({
    data: {
      buildingId: building.id,
    },
  });

  // Optional: Tenant + Admin users
  await prisma.user.upsert({
    where: { email: "tenant@example.com" },
    update: {},
    create: {
      name: "Tenant User",
      email: "tenant@example.com",
      role: "TENANT",
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@example.com",
      role: "ADMIN",
    },
  });

  console.log("🌱 Seed completed successfully");
  console.log({
    ownerUser,
    building,
    apartments: [apt1, apt2],
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
