import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getStepWithItems } from "@/lib/data/projects";
import StepEditor from "./_components/StepEditor";
import type { Prisma } from "@prisma/client";

function parseRankPoints(raw: Prisma.JsonValue): number[] {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const obj = raw as Record<string, Prisma.JsonValue>;
    if (Array.isArray(obj.ranks)) {
      return (obj.ranks as Prisma.JsonValue[]).map((v) =>
        typeof v === "number" ? v : 0
      );
    }
  }
  return [];
}

export default async function AdminStepPage({
  params,
}: {
  params: Promise<{ id: string; stepId: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const { id, stepId } = await params;
  const step = await getStepWithItems(stepId);
  if (!step || step.projectId !== id) notFound();

  const initialItems = step.votingItems.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    order: item.order,
  }));

  const initialRankPoints = parseRankPoints(step.pointsRules);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/admin/projects/${id}`}
          className="text-[10px] tracking-[0.2em] uppercase text-[#666] hover:text-amber-400 transition-colors"
        >
          ← Project
        </Link>
        <span className="text-[#2a2a2a]">/</span>
        <h1 className="text-sm font-mono text-[#f0efec]">{step.title}</h1>
        <span className="text-[10px] tracking-[0.1em] uppercase text-[#444] ml-1">
          · Editor
        </span>
      </div>

      <StepEditor
        stepId={stepId}
        projectId={id}
        initialTitle={step.title}
        initialItems={initialItems}
        initialRankPoints={initialRankPoints}
      />
    </main>
  );
}
