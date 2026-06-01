import { prisma } from "@/lib/prisma";

export async function getVotingStepForVote(stepId: string, shareToken: string) {
  const step = await prisma.votingStep.findUnique({
    where: { id: stepId },
    include: {
      project: { select: { shareToken: true, title: true } },
      votingItems: { orderBy: { order: "asc" } },
    },
  });

  if (!step || step.project.shareToken !== shareToken) return null;
  return step;
}

export async function getExistingVote(stepId: string, userId: string) {
  return prisma.vote.findUnique({
    where: { userId_stepId: { userId, stepId } },
  });
}

export async function getStepWithVotes(stepId: string) {
  return prisma.votingStep.findUnique({
    where: { id: stepId },
    include: {
      project: { select: { ownerId: true } },
      votingItems: { orderBy: { order: "asc" } },
      votes: {
        include: {
          user: { select: { id: true, username: true, image: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function getProjectResults(shareToken: string, userId: string) {
  const project = await prisma.project.findUnique({
    where: { shareToken },
    select: {
      id: true,
      title: true,
      description: true,
      ownerId: true,
      resultsPublic: true,
      participants: { select: { userId: true } },
      votingSteps: {
        where: { status: { in: ["ACTIVE", "CLOSED"] } },
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          order: true,
          pointsRules: true,
          votingItems: {
            orderBy: { order: "asc" },
            select: { id: true, title: true },
          },
          votes: {
            select: {
              userId: true,
              rankings: true,
              user: { select: { username: true, image: true } },
            },
          },
        },
      },
    },
  });

  if (!project) return null;

  const isOwner = project.ownerId === userId;
  const isParticipant = project.participants.some((p) => p.userId === userId);
  if (!isOwner && !(isParticipant && project.resultsPublic)) return null;

  return {
    title: project.title,
    description: project.description,
    steps: project.votingSteps.map((step) => ({
      id: step.id,
      title: step.title,
      order: step.order,
      pointsRules: step.pointsRules as { ranks?: number[] },
      items: step.votingItems,
      votes: step.votes.map((v) => ({
        userId: v.userId,
        username: v.user.username,
        image: v.user.image,
        rankings: v.rankings as string[],
      })),
    })),
  };
}
