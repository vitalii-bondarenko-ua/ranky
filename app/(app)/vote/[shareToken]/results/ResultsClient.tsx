"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Syne } from "next/font/google";

const syne = Syne({ subsets: ["latin"], weight: ["700"] });

interface Item { id: string; title: string; }
interface StepVote { userId: string; username: string; image: string | null; rankings: string[]; }
interface Step {
  id: string;
  title: string;
  order: number;
  pointsRules: { ranks?: number[] };
  items: Item[];
  votes: StepVote[];
}
interface ProjectData { title: string; description: string | null; steps: Step[]; }
interface Props { data: ProjectData; shareToken: string; }

interface Voter {
  userId: string;
  username: string;
  image: string | null;
  votesByStep: Record<string, string[]>;
}

type Mode = "picker" | "total" | "reveal";

function getAllVoters(steps: Step[]): Voter[] {
  const map = new Map<string, Voter>();
  for (const step of steps) {
    for (const v of step.votes) {
      if (!map.has(v.userId)) {
        map.set(v.userId, { userId: v.userId, username: v.username, image: v.image, votesByStep: {} });
      }
      map.get(v.userId)!.votesByStep[step.id] = v.rankings;
    }
  }
  return Array.from(map.values());
}

function calcScores(steps: Step[], openedIds: Set<string>): Record<string, Record<string, number>> {
  const out: Record<string, Record<string, number>> = {};
  for (const step of steps) {
    const ranks = step.pointsRules.ranks ?? [];
    const s: Record<string, number> = {};
    for (const item of step.items) s[item.id] = 0;
    for (const vote of step.votes) {
      if (!openedIds.has(vote.userId)) continue;
      vote.rankings.forEach((itemId, i) => {
        s[itemId] = (s[itemId] ?? 0) + (ranks[i] ?? 0);
      });
    }
    out[step.id] = s;
  }
  return out;
}

function RankLabel({ rank }: { rank: number }) {
  const cls =
    rank === 1 ? "text-amber-400" :
    rank === 2 ? "text-slate-400" :
    rank === 3 ? "text-orange-400" :
    "text-[#444]";
  return <span className={`w-5 shrink-0 text-center text-xs font-bold ${cls}`}>{rank}</span>;
}

function StepLeaderboard({
  step,
  scores,
  voterCount,
}: {
  step: Step;
  scores: Record<string, number>;
  voterCount: number;
}) {
  const sorted = [...step.items].sort((a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0));

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <h3 className="text-[10px] tracking-[0.2em] uppercase text-[#666]">
          Step {step.order + 1} · {step.title}
        </h3>
        <span className="text-[10px] text-[#444]">
          {voterCount} vote{voterCount !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="border border-[#1e1e1e] divide-y divide-[#1a1a1a]">
        {sorted.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-[#444]">No items in this step</div>
        ) : (
          sorted.map((item, index) => {
            const pts = scores[item.id] ?? 0;
            return (
              <div key={item.id} className="flex items-center gap-3 px-4 py-3 bg-[#0e0e0e]">
                <RankLabel rank={index + 1} />
                <span className="flex-1 text-sm text-[#f0efec]">{item.title}</span>
                {voterCount > 0 && (
                  <span className="text-xs font-mono text-[#666]">{pts} pts</span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function ModePicker({ onSelect }: { onSelect: (mode: "total" | "reveal") => void }) {
  return (
    <div className="space-y-4">
      <p className="text-[10px] tracking-[0.2em] uppercase text-[#666]">
        How would you like to view results?
      </p>
      <div className="grid sm:grid-cols-2 gap-3">
        <button
          onClick={() => onSelect("total")}
          className="border border-[#1e1e1e] bg-[#0e0e0e] p-6 text-left space-y-2 hover:border-amber-400/30 hover:bg-[#141414] transition-colors group"
        >
          <p className="text-sm font-semibold text-[#f0efec] group-hover:text-amber-400 transition-colors">
            Total Results
          </p>
          <p className="text-xs text-[#555] leading-relaxed">
            See the final aggregated leaderboard with all votes summed immediately.
          </p>
        </button>
        <button
          onClick={() => onSelect("reveal")}
          className="border border-[#1e1e1e] bg-[#0e0e0e] p-6 text-left space-y-2 hover:border-amber-400/30 hover:bg-[#141414] transition-colors group"
        >
          <p className="text-sm font-semibold text-[#f0efec] group-hover:text-amber-400 transition-colors">
            Reveal by Voter
          </p>
          <p className="text-xs text-[#555] leading-relaxed">
            Open each ballot one by one and watch scores accumulate live.
          </p>
        </button>
      </div>
    </div>
  );
}

function VoterCard({
  voter,
  steps,
  opened,
  onReveal,
}: {
  voter: Voter;
  steps: Step[];
  opened: boolean;
  onReveal: () => void;
}) {
  const initials = voter.username.slice(0, 2).toUpperCase();
  return (
    <div
      className={`border bg-[#0e0e0e] p-4 space-y-3 transition-colors ${
        opened ? "border-[#2a2a2a]" : "border-[#1e1e1e]"
      }`}
    >
      <div className="flex items-center gap-3">
        {voter.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={voter.image}
            alt={voter.username}
            className="w-7 h-7 rounded-full object-cover border border-[#2a2a2a] shrink-0"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-amber-400/10 border border-amber-400/20 flex items-center justify-center shrink-0">
            <span className="text-[9px] font-mono font-bold text-amber-400">{initials}</span>
          </div>
        )}
        <span className="flex-1 text-sm font-mono text-[#f0efec]">{voter.username}</span>
        {opened ? (
          <span className="text-[10px] tracking-[0.2em] uppercase text-emerald-400">Opened</span>
        ) : (
          <button
            onClick={onReveal}
            className="text-[10px] tracking-[0.2em] uppercase text-amber-400 hover:text-amber-300 transition-colors"
          >
            Reveal
          </button>
        )}
      </div>

      {opened && (
        <div className="space-y-4 pt-3 border-t border-[#1a1a1a]">
          {steps.map((step) => {
            const rankings = voter.votesByStep[step.id];
            const ranks = step.pointsRules.ranks ?? [];
            return (
              <div key={step.id} className="space-y-1.5">
                <p className="text-[10px] tracking-[0.15em] uppercase text-[#555]">{step.title}</p>
                {rankings ? (
                  rankings.map((itemId, index) => {
                    const item = step.items.find((i) => i.id === itemId);
                    const pts = ranks[index] ?? 0;
                    return (
                      <div key={itemId} className="flex items-center gap-2">
                        <RankLabel rank={index + 1} />
                        <span className="flex-1 text-xs text-[#aaa] truncate">
                          {item?.title ?? "Unknown item"}
                        </span>
                        <span className="text-[10px] font-mono text-[#555]">+{pts} pts</span>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-[#444] italic">No vote submitted</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RevealView({
  steps,
  voters,
  openedIds,
  scores,
  onReveal,
  onRevealAll,
}: {
  steps: Step[];
  voters: Voter[];
  openedIds: Set<string>;
  scores: Record<string, Record<string, number>>;
  onReveal: (userId: string) => void;
  onRevealAll: () => void;
}) {
  const openedCount = openedIds.size;
  const allOpened = voters.length > 0 && openedCount === voters.length;

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[10px] tracking-[0.2em] uppercase text-[#666]">
            Running Scores · {openedCount}/{voters.length} revealed
          </h2>
          {!allOpened && voters.length > 0 && (
            <button
              onClick={onRevealAll}
              className="text-[10px] tracking-[0.2em] uppercase text-[#555] hover:text-amber-400 transition-colors"
            >
              Reveal all
            </button>
          )}
        </div>
        {steps.map((step) => (
          <StepLeaderboard
            key={step.id}
            step={step}
            scores={scores[step.id] ?? {}}
            voterCount={openedCount}
          />
        ))}
      </div>

      <div className="space-y-3">
        <h2 className="text-[10px] tracking-[0.2em] uppercase text-[#666]">Ballots</h2>
        {voters.length === 0 ? (
          <div className="border border-[#1e1e1e] bg-[#0e0e0e] py-12 flex items-center justify-center">
            <p className="text-sm text-[#444]">No votes have been submitted yet.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {voters.map((voter) => (
              <VoterCard
                key={voter.userId}
                voter={voter}
                steps={steps}
                opened={openedIds.has(voter.userId)}
                onReveal={() => onReveal(voter.userId)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TotalView({
  steps,
  scores,
}: {
  steps: Step[];
  scores: Record<string, Record<string, number>>;
}) {
  if (steps.length === 0) {
    return (
      <div className="border border-[#1e1e1e] bg-[#0e0e0e] py-16 flex items-center justify-center">
        <p className="text-sm text-[#444]">No active voting steps yet.</p>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {steps.map((step) => (
        <StepLeaderboard
          key={step.id}
          step={step}
          scores={scores[step.id] ?? {}}
          voterCount={step.votes.length}
        />
      ))}
    </div>
  );
}

export default function ResultsClient({ data, shareToken }: Props) {
  const [mode, setMode] = useState<Mode>("picker");
  const [openedIds, setOpenedIds] = useState<Set<string>>(new Set());

  const voters = useMemo(() => getAllVoters(data.steps), [data.steps]);

  const allIds = useMemo(
    () => new Set(voters.map((v) => v.userId)),
    [voters]
  );

  const totalScores = useMemo(
    () => calcScores(data.steps, allIds),
    [data.steps, allIds]
  );

  const revealScores = useMemo(
    () => calcScores(data.steps, openedIds),
    [data.steps, openedIds]
  );

  function reveal(userId: string) {
    setOpenedIds((prev) => new Set([...prev, userId]));
  }

  function revealAll() {
    setOpenedIds(new Set(voters.map((v) => v.userId)));
  }

  function reset() {
    setMode("picker");
    setOpenedIds(new Set());
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10 space-y-8">
      <div>
        <Link
          href={`/vote/${shareToken}`}
          className="text-[10px] tracking-[0.2em] uppercase text-[#666] hover:text-amber-400 transition-colors"
        >
          ← Back to project
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className={`${syne.className} text-2xl text-[#f0efec]`}>{data.title}</h1>
          <p className="text-[10px] tracking-[0.2em] uppercase text-[#555]">Results</p>
        </div>
        {mode !== "picker" && (
          <button
            onClick={reset}
            className="shrink-0 mt-1 text-[10px] tracking-[0.2em] uppercase text-[#555] hover:text-amber-400 transition-colors"
          >
            Change view
          </button>
        )}
      </div>

      {mode === "picker" && (
        <ModePicker onSelect={(m) => { setMode(m); setOpenedIds(new Set()); }} />
      )}
      {mode === "total" && (
        <TotalView steps={data.steps} scores={totalScores} />
      )}
      {mode === "reveal" && (
        <RevealView
          steps={data.steps}
          voters={voters}
          openedIds={openedIds}
          scores={revealScores}
          onReveal={reveal}
          onRevealAll={revealAll}
        />
      )}
    </main>
  );
}
