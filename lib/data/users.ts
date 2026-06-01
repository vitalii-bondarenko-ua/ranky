import { prisma } from "@/lib/prisma";

export async function getAdminUsers() {
  return prisma.user.findMany({
    select: { id: true, username: true, email: true, role: true },
    orderBy: { createdAt: "asc" },
  });
}
