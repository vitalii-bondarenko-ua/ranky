import { prisma } from "@/lib/prisma";

export async function getProjectByShareToken(shareToken: string, userId: string) {
  const project = await prisma.project.findUnique({
    where: { shareToken },
    select: {
      id: true,
      title: true,
      description: true,
      ownerId: true,
      participants: {
        select: {
          userId: true,
          user: { select: { id: true, username: true, image: true } },
        },
      },
      votingSteps: {
        where: { status: "ACTIVE" },
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          order: true,
          votes: {
            select: { userId: true, createdAt: true },
          },
        },
      },
    },
  });

  if (!project) return null;

  const isParticipant = project.participants.some((p) => p.userId === userId);
  const participantUserIds = new Set(project.participants.map((p) => p.userId));

  return {
    id: project.id,
    title: project.title,
    description: project.description,
    ownerId: project.ownerId,
    isParticipant,
    participants: project.participants.map((p) => ({
      id: p.user.id,
      username: p.user.username,
      image: p.user.image,
    })),
    votingSteps: project.votingSteps.map((s) => {
      const myVote = s.votes.find((v) => v.userId === userId);
      const participantVoterIds = s.votes
        .filter((v) => participantUserIds.has(v.userId))
        .map((v) => v.userId);
      return {
        id: s.id,
        title: s.title,
        order: s.order,
        myCompletion: myVote
          ? { completed: true as const, submittedAt: myVote.createdAt.toISOString() }
          : null,
        votedParticipantIds: participantVoterIds,
      };
    }),
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

export async function getParticipatedProjects(userId: string) {
  const rows = await prisma.projectParticipant.findMany({
    where: { userId, project: { ownerId: { not: userId } } },
    orderBy: { joinedAt: "desc" },
    select: {
      joinedAt: true,
      project: {
        select: {
          id: true,
          title: true,
          shareToken: true,
          _count: { select: { votingSteps: true } },
        },
      },
    },
  });

  return rows.map((r) => ({
    id: r.project.id,
    title: r.project.title,
    shareToken: r.project.shareToken,
    joinedAt: r.joinedAt,
    stepCount: r.project._count.votingSteps,
  }));
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
