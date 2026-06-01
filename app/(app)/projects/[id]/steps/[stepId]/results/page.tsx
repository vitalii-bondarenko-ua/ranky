import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getStepWithVotes, isProjectParticipant } from "@/lib/data/votes";
import { calculateStepScores } from "@/lib/scoring";
import ResultsClient from "@/app/(admin)/admin/projects/[id]/steps/[stepId]/results/ResultsClient";
import type { Prisma } from "@prisma/client";

function parsePointsRules(raw: Prisma.JsonValue): { ranks: number[] } {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const obj = raw as Record<string, Prisma.JsonValue>;
    if (Array.isArray(obj.ranks)) {
      return {
        ranks: (obj.ranks as Prisma.JsonValue[]).map((v) =>
          typeof v === "number" ? v : 0
        ),
      };
    }
  }
  return { ranks: [] };
}

export default async function StepResultsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; stepId: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id, stepId } = await params;
  const { view } = await searchParams;
  const step = await getStepWithVotes(stepId);
  if (!step || step.projectId !== id) notFound();

  const isAdmin = session.user.role === "ADMIN";
  const isOwner = step.project?.ownerId === session.user.id;

  if (!isAdmin && !isOwner) {
    if (!step.project?.resultsPublic) redirect("/projects");
    const participant = await isProjectParticipant(step.projectId, session.user.id);
    if (!participant) redirect("/projects");
  }

  const pointsRules = parsePointsRules(step.pointsRules);
  const { rankedItems, userResults } = calculateStepScores(
    step.votes,
    step.votingItems,
    pointsRules
  );

  const itemMap: Record<string, string> = {};
  for (const item of step.votingItems) {
    itemMap[item.id] = item.title;
  }

  const initialView = view === "table" ? "table" : "chart";

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/projects/${id}`}
          className="text-[10px] tracking-[0.2em] uppercase text-[#666] hover:text-amber-400 transition-colors"
        >
          ← Project
        </Link>
        <span className="text-[#2a2a2a]">/</span>
        <Link
          href={`/projects/${id}/steps/${stepId}`}
          className="text-[10px] tracking-[0.2em] uppercase text-[#666] hover:text-amber-400 transition-colors"
        >
          {step.title}
        </Link>
        <span className="text-[#2a2a2a]">/</span>
        <span className="text-[10px] tracking-[0.1em] uppercase text-[#444]">Results</span>
      </div>

      <ResultsClient
        rankedItems={rankedItems}
        userResults={userResults}
        itemMap={itemMap}
        totalVoters={step.votes.length}
        maxPoints={pointsRules.ranks[0] ?? 0}
        initialView={initialView}
      />
    </main>
  );
}
