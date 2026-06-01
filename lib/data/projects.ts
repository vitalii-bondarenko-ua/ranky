import { prisma } from "@/lib/prisma";

export async function getAdminProjects() {
  return prisma.project.findMany({
    select: { id: true, title: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getProjectWithSteps(id: string) {
  return prisma.project.findUnique({
    where: { id },
    include: {
      votingSteps: {
        include: {
          _count: { select: { votingItems: true } },
        },
        orderBy: { order: "asc" },
      },
    },
  });
}
