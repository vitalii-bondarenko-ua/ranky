"use client";

import Link from "next/link";
import { Syne } from "next/font/google";

const syne = Syne({ subsets: ["latin"], weight: ["700"] });

interface VotingStep {
  id: string;
  title: string;
  order: number;
  myCompletion: { completed: boolean; submittedAt?: string } | null;
}

interface Props {
  project: {
    id: string;
    title: string;
    description: string | null;
    votingSteps: VotingStep[];
  } | null;
  shareToken: string;
}

type StepStatus = "not_started" | "completed";

function getStepStatus(myCompletion: VotingStep["myCompletion"]): StepStatus {
  if (!myCompletion) return "not_started";
  return "completed";
}

function StatusBadge({ status }: { status: StepStatus }) {
  if (status === "completed") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 text-[10px] tracking-[0.15em] uppercase border border-emerald-400/30 text-emerald-400">
        Completed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 text-[10px] tracking-[0.15em] uppercase border border-[#2a2a2a] text-[#666]">
      Not started
    </span>
  );
}

function stepButtonLabel(status: StepStatus): string {
  if (status === "completed") return "Review →";
  return "Enter Step →";
}

export default function VoteEntryClient({ project, shareToken }: Props) {
  if (!project) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16 text-center">
        <p className="text-[#666] text-sm">Project not found.</p>
        <Link
          href="/dashboard"
          className="mt-6 inline-block text-[10px] tracking-[0.2em] uppercase text-amber-400 hover:text-amber-300 transition-colors"
        >
          ← Back to dashboard
        </Link>
      </main>
    );
  }

  const allCompleted =
    project.votingSteps.length > 0 &&
    project.votingSteps.every((s) => s.myCompletion?.completed);

  return (
    <main className="mx-auto max-w-2xl px-6 py-10 space-y-8">
      <div>
        <Link
          href="/dashboard"
          className="text-[10px] tracking-[0.2em] uppercase text-[#666] hover:text-amber-400 transition-colors"
        >
          ← Dashboard
        </Link>
      </div>

      <div className="space-y-2">
        <h1 className={`${syne.className} text-2xl text-[#f0efec]`}>
          {project.title}
        </h1>
        {project.description && (
          <p className="text-sm text-[#666]">{project.description}</p>
        )}
      </div>

      {allCompleted && (
        <div className="border border-emerald-400/20 bg-emerald-400/5 px-4 py-3">
          <p className="text-sm text-emerald-400">
            You&apos;ve completed all steps.
          </p>
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-[10px] tracking-[0.2em] uppercase text-[#666]">
          Voting Steps
        </h2>

        {project.votingSteps.length === 0 ? (
          <p className="text-sm text-[#444] py-6 text-center border border-[#1e1e1e]">
            No active voting steps right now.
          </p>
        ) : (
          <ul className="space-y-2">
            {project.votingSteps.map((step) => {
              const status = getStepStatus(step.myCompletion);
              return (
                <li
                  key={step.id}
                  className="border border-[#1e1e1e] bg-[#0e0e0e] px-5 py-4 flex items-center justify-between gap-4 hover:-translate-y-0.5 transition-transform"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-[10px] tracking-[0.15em] uppercase text-[#444]">
                        Step {step.order}
                      </span>
                      <StatusBadge status={status} />
                    </div>
                    <p className="text-sm text-[#f0efec] truncate">{step.title}</p>
                  </div>

                  <Link
                    href={`/vote/${shareToken}/steps/${step.id}`}
                    className="shrink-0 text-[10px] tracking-[0.2em] uppercase text-amber-400 hover:text-amber-300 transition-colors whitespace-nowrap"
                  >
                    {stepButtonLabel(status)}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
