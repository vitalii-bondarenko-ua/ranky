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
