import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { getVotingStepForVote, getExistingVote } from "@/lib/data/votes";
import { prisma } from "@/lib/prisma";
import VotingClient from "./VotingClient";

export default async function VoteStepPage({
  params,
}: {
  params: Promise<{ shareToken: string; stepId: string }>;
}) {
  const { shareToken, stepId } = await params;
  const session = await auth();
  if (!session) redirect(`/login?redirect=/vote/${shareToken}/steps/${stepId}`);

  const step = await getVotingStepForVote(stepId, shareToken);
  if (!step) notFound();

  const participation = await prisma.projectParticipant.findUnique({
    where: {
      userId_projectId: { userId: session.user.id, projectId: step.projectId },
    },
  });
  if (!participation) redirect(`/vote/${shareToken}`);

  const existingVote = await getExistingVote(stepId, session.user.id);
  const existingRanking = existingVote ? (existingVote.rankings as string[]) : null;

  const [voterCount, totalParticipants] = await Promise.all([
    prisma.vote.count({ where: { stepId } }),
    prisma.projectParticipant.count({ where: { projectId: step.projectId } }),
  ]);

  return (
    <VotingClient
      step={{
        id: step.id,
        title: step.title,
        pointsRules: step.pointsRules as { ranks: number[] },
      }}
      items={step.votingItems.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        order: item.order,
      }))}
      existingRanking={existingRanking}
      shareToken={shareToken}
      voterCount={voterCount}
      totalParticipants={totalParticipants}
    />
  );
}
