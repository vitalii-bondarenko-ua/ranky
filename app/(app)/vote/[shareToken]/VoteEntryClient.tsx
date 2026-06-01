"use client";

import Link from "next/link";
import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Syne } from "next/font/google";
import { joinProject } from "./actions";

const syne = Syne({ subsets: ["latin"], weight: ["700"] });

interface Participant {
  id: string;
  username: string;
  image: string | null;
}

interface VotingStep {
  id: string;
  title: string;
  order: number;
  myCompletion: { completed: boolean; submittedAt?: string } | null;
  votedParticipantIds: string[];
}

interface Props {
  project: {
    id: string;
    title: string;
    description: string | null;
    ownerId: string;
    isParticipant: boolean;
    participants: Participant[];
    votingSteps: VotingStep[];
  } | null;
  shareToken: string;
  userId: string;
}

function Avatar({ user, voted }: { user: Participant; voted: boolean }) {
  const initials = user.username.slice(0, 2).toUpperCase();
  return (
    <div className="relative shrink-0">
      {user.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={user.image}
          alt={user.username}
          className="w-7 h-7 rounded-full object-cover border border-[#2a2a2a]"
        />
      ) : (
        <div className="w-7 h-7 rounded-full bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
          <span className="text-[9px] font-mono font-bold text-amber-400">{initials}</span>
        </div>
      )}
      {voted && (
        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border border-[#0e0e0e] flex items-center justify-center">
          <span className="text-[7px] text-white font-bold">✓</span>
        </span>
      )}
    </div>
  );
}

function JoinScreen({
  project,
  shareToken,
}: {
  project: NonNullable<Props["project"]>;
  shareToken: string;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleJoin() {
    startTransition(async () => {
      await joinProject(project.id);
      router.refresh();
    });
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-16 space-y-10">
      <div className="space-y-3">
        <h1 className={`${syne.className} text-3xl text-[#f0efec]`}>
          {project.title}
        </h1>
        {project.description && (
          <p className="text-sm text-[#666] leading-relaxed">{project.description}</p>
        )}
      </div>

      <div className="border border-[#1e1e1e] bg-[#0e0e0e] p-6 space-y-4">
        <p className="text-sm text-[#888]">
          You&apos;ve been invited to participate in this voting project.
        </p>
        {project.participants.length > 0 && (
          <p className="text-xs text-[#555]">
            {project.participants.length} participant{project.participants.length !== 1 ? "s" : ""} already joined
          </p>
        )}
        <div className="flex gap-3 pt-1">
          <button
            onClick={handleJoin}
            disabled={isPending}
            className="px-6 py-2.5 bg-amber-400 text-[#0e0e0e] text-xs font-semibold tracking-[0.15em] uppercase hover:bg-amber-300 transition-colors disabled:opacity-50"
          >
            {isPending ? "Joining…" : "Join Project"}
          </button>
          <Link
            href="/projects"
            className="px-6 py-2.5 border border-[#2a2a2a] text-xs text-[#666] tracking-[0.15em] uppercase hover:border-[#444] hover:text-[#888] transition-colors"
          >
            Decline
          </Link>
        </div>
      </div>
    </main>
  );
}

function ParticipantsPanel({
  participants,
  steps,
}: {
  participants: Participant[];
  steps: VotingStep[];
}) {
  if (participants.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-[10px] tracking-[0.2em] uppercase text-[#666]">
        Participants · {participants.length}
      </h2>
      <div className="border border-[#1e1e1e] divide-y divide-[#1a1a1a]">
        {participants.map((p) => {
          const votedCount = steps.filter((s) =>
            s.votedParticipantIds.includes(p.id)
          ).length;
          const initials = p.username.slice(0, 2).toUpperCase();
          return (
            <div key={p.id} className="flex items-center gap-3 px-4 py-3 bg-[#0e0e0e]">
              {p.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.image}
                  alt={p.username}
                  className="w-7 h-7 rounded-full object-cover border border-[#2a2a2a] shrink-0"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-amber-400/10 border border-amber-400/20 flex items-center justify-center shrink-0">
                  <span className="text-[9px] font-mono font-bold text-amber-400">{initials}</span>
                </div>
              )}
              <span className="flex-1 text-sm text-[#f0efec] font-mono">{p.username}</span>
              {steps.length > 0 && (
                <span className="text-xs text-[#555] font-mono">
                  {votedCount}/{steps.length} voted
                </span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function VoteEntryClient({ project, shareToken, userId }: Props) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), 30_000);
    return () => clearInterval(id);
  }, [router]);

  if (!project) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16 text-center">
        <p className="text-[#666] text-sm">Project not found.</p>
        <Link
          href="/projects"
          className="mt-6 inline-block text-[10px] tracking-[0.2em] uppercase text-amber-400 hover:text-amber-300 transition-colors"
        >
          ← Back to dashboard
        </Link>
      </main>
    );
  }

  if (!project.isParticipant) {
    return <JoinScreen project={project} shareToken={shareToken} />;
  }

  const allCompleted =
    project.votingSteps.length > 0 &&
    project.votingSteps.every((s) => s.myCompletion?.completed);

  return (
    <main className="mx-auto max-w-2xl px-6 py-10 space-y-8">
      <div>
        <Link
          href="/projects"
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
              const myDone = !!step.myCompletion?.completed;
              const voteCount = step.votedParticipantIds.length;
              const total = project.participants.length;

              return (
                <li
                  key={step.id}
                  className="border border-[#1e1e1e] bg-[#0e0e0e] px-5 py-4 space-y-3"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-[10px] tracking-[0.15em] uppercase text-[#444]">
                          Step {step.order + 1}
                        </span>
                        {myDone ? (
                          <span className="inline-flex items-center px-2 py-0.5 text-[10px] tracking-[0.15em] uppercase border border-emerald-400/30 text-emerald-400">
                            Completed
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 text-[10px] tracking-[0.15em] uppercase border border-[#2a2a2a] text-[#666]">
                            Not started
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[#f0efec] truncate">{step.title}</p>
                    </div>

                    <Link
                      href={`/vote/${shareToken}/steps/${step.id}`}
                      className="shrink-0 text-[10px] tracking-[0.2em] uppercase text-amber-400 hover:text-amber-300 transition-colors whitespace-nowrap"
                    >
                      {myDone ? "Review →" : "Enter Step →"}
                    </Link>
                  </div>

                  {total > 0 && (
                    <div className="flex items-center gap-2 pt-1 border-t border-[#141414]">
                      <div className="flex -space-x-1.5">
                        {project.participants.map((p) => (
                          <Avatar
                            key={p.id}
                            user={p}
                            voted={step.votedParticipantIds.includes(p.id)}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-[#555] font-mono ml-1">
                        {voteCount}/{total} voted
                      </span>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <ParticipantsPanel participants={project.participants} steps={project.votingSteps} />
    </main>
  );
}
