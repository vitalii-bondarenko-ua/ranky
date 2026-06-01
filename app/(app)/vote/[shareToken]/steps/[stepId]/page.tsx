import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { getVotingStepForVote, getExistingVote } from "@/lib/data/votes";
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

  const existingVote = await getExistingVote(stepId, session.user.id);
  const existingRanking = existingVote
    ? (existingVote.rankings as string[])
    : null;

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
    />
  );
}
