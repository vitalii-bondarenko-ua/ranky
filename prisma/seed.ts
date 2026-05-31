import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("admin123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@ranky.app" },
    update: {},
    create: {
      email: "admin@ranky.app",
      password,
      role: "ADMIN",
    },
  });

  console.log("Seeded admin:", admin.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
