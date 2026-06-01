import { prisma } from "@/lib/prisma";

export async function getProjectByShareToken(shareToken: string, userId: string) {
  const project = await prisma.project.findUnique({
    where: { shareToken },
    select: {
      id: true,
      title: true,
      description: true,
      votingSteps: {
        where: { status: "ACTIVE" },
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          order: true,
          votes: {
            where: { userId },
            select: { createdAt: true },
          },
        },
      },
    },
  });

  if (!project) return null;

  return {
    id: project.id,
    title: project.title,
    description: project.description,
    votingSteps: project.votingSteps.map((s) => ({
      id: s.id,
      title: s.title,
      order: s.order,
      myCompletion: s.votes[0]
        ? { completed: true as const, submittedAt: s.votes[0].createdAt.toISOString() }
        : null,
    })),
  };
}

export async function getAdminProjects() {
  return prisma.project.findMany({
    select: { id: true, title: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getUserProjects(userId: string) {
  return prisma.project.findMany({
    where: { ownerId: userId },
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

export async function getStepWithItems(stepId: string) {
  return prisma.votingStep.findUnique({
    where: { id: stepId },
    include: {
      votingItems: { orderBy: { order: "asc" } },
      project: { select: { ownerId: true } },
    },
  });
}
