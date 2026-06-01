import type { Prisma } from "@prisma/client";

export type RankedItem = {
  id: string;
  title: string;
  description: string | null;
  score: number;
  rank: number;
};

export type UserResult = {
  userId: string;
  username: string;
  image: string | null;
  rankedItemIds: string[];
};

export function calculateStepScores(
  votes: Array<{
    user: { id: string; username: string; image: string | null };
    rankings: Prisma.JsonValue;
  }>,
  votingItems: Array<{ id: string; title: string; description: string | null; order: number }>,
  pointsRules: { ranks: number[] }
): { rankedItems: RankedItem[]; userResults: UserResult[] } {
  const scoreMap = new Map<string, number>(
    votingItems.map((item) => [item.id, 0])
  );

  for (const vote of votes) {
    const rankings = vote.rankings as string[];
    rankings.forEach((itemId, index) => {
      const pts = pointsRules.ranks[index] ?? 0;
      scoreMap.set(itemId, (scoreMap.get(itemId) ?? 0) + pts);
    });
  }

  const rankedItems: RankedItem[] = votingItems
    .map((item) => ({ ...item, score: scoreMap.get(item.id) ?? 0 }))
    .sort((a, b) => b.score - a.score)
    .map((item, index) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      score: item.score,
      rank: index + 1,
    }));

  const userResults: UserResult[] = votes.map((vote) => ({
    userId: vote.user.id,
    username: vote.user.username,
    image: vote.user.image,
    rankedItemIds: vote.rankings as string[],
  }));

  return { rankedItems, userResults };
}
