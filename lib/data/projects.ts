import { prisma } from "@/lib/prisma";

export async function getAdminProjects() {
  return prisma.project.findMany({
    select: { id: true, title: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
}
