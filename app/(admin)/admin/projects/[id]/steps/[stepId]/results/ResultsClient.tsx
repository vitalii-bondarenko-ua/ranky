"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { RankedItem, UserResult } from "@/lib/scoring";

type View = "chart" | "table";
type DisplayMode = "total" | "reveal";

type RevealState = {
  voterIndex: number; // -1 = not started
  placeStep: number;  // 1=4th+, 2=+3rd, 3=+2nd, 4=all (1st revealed)
};

type Props = {
  rankedItems: RankedItem[];
  userResults: UserResult[];
  itemMap: Record<string, string>;
  totalVoters: number;
  maxPoints: number;
  initialView: View;
  initialMode: DisplayMode;
  pointsRules: { ranks: number[] };
};

// ─── Reveal Helpers ───────────────────────────────────────────────────────────

function getRevealedIndices(placeStep: number, totalItems: number): number[] {
  if (placeStep <= 0) return [];
  // placeStep 1 → start at index 3 (4th place), 2 → index 2, 3 → index 1, 4 → index 0
  const startIndex = Math.max(0, 4 - placeStep);
  return Array.from({ length: Math.max(0, totalItems - startIndex) }, (_, i) => i + startIndex);
}

function computeRevealScores(
  userResults: UserResult[],
  itemMap: Record<string, string>,
  pointsRules: { ranks: number[] },
  revealState: RevealState
): RankedItem[] {
  const scoreMap = new Map<string, number>(
    Object.keys(itemMap).map((id) => [id, 0])
  );

  for (let i = 0; i < revealState.voterIndex; i++) {
    userResults[i].rankedItemIds.forEach((itemId, pos) => {
      scoreMap.set(itemId, (scoreMap.get(itemId) ?? 0) + (pointsRules.ranks[pos] ?? 0));
    });
  }

  if (revealState.voterIndex >= 0 && revealState.voterIndex < userResults.length) {
    const voter = userResults[revealState.voterIndex];
    getRevealedIndices(revealState.placeStep, voter.rankedItemIds.length).forEach((pos) => {
      const itemId = voter.rankedItemIds[pos];
      scoreMap.set(itemId, (scoreMap.get(itemId) ?? 0) + (pointsRules.ranks[pos] ?? 0));
    });
  }

  return Array.from(scoreMap.entries())
    .map(([id, score]) => ({ id, title: itemMap[id] ?? id, description: null, score, rank: 0 }))
    .sort((a, b) => b.score - a.score)
    .map((item, index) => ({ ...item, rank: index + 1 }));
}

function nextState(cur: RevealState, total: number): RevealState | null {
  if (cur.voterIndex === -1) return total > 0 ? { voterIndex: 0, placeStep: 1 } : null;
  if (cur.placeStep < 4) return { voterIndex: cur.voterIndex, placeStep: cur.placeStep + 1 };
  if (cur.voterIndex < total - 1) return { voterIndex: cur.voterIndex + 1, placeStep: 1 };
  return null;
}

function prevState(cur: RevealState): RevealState | null {
  if (cur.voterIndex === -1) return null;
  if (cur.placeStep > 1) return { voterIndex: cur.voterIndex, placeStep: cur.placeStep - 1 };
  if (cur.voterIndex > 0) return { voterIndex: cur.voterIndex - 1, placeStep: 4 };
  return { voterIndex: -1, placeStep: 0 };
}

function nextButtonLabel(cur: RevealState, total: number): string {
  if (cur.voterIndex === -1) return "Start Reveal →";
  if (cur.placeStep === 1) return "Reveal 3rd →";
  if (cur.placeStep === 2) return "Reveal 2nd →";
  if (cur.placeStep === 3) return "Reveal 1st →";
  if (cur.voterIndex < total - 1) return "Next Voter →";
  return "Done";
}

// ─── Display Mode Toggle ──────────────────────────────────────────────────────

function DisplayModeToggle({
  mode,
  onChange,
}: {
  mode: DisplayMode;
  onChange: (m: DisplayMode) => void;
}) {
  return (
    <div className="flex border border-[#2a2a2a] overflow-hidden">
      {(["total", "reveal"] as const).map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          className={`px-4 py-1.5 text-[10px] tracking-[0.2em] uppercase font-mono transition-colors ${
            mode === m
              ? "bg-amber-400 text-[#0f0f0f] font-semibold"
              : "text-[#666] hover:text-[#f0efec]"
          }`}
        >
          {m === "total" ? "Total" : "Reveal"}
        </button>
      ))}
    </div>
  );
}

// ─── View Toggle ─────────────────────────────────────────────────────────────

function ViewToggle({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  return (
    <div className="flex border border-[#2a2a2a] overflow-hidden">
      {(["chart", "table"] as const).map((v) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={`px-4 py-1.5 text-[10px] tracking-[0.2em] uppercase font-mono transition-colors ${
            view === v
              ? "bg-amber-400 text-[#0f0f0f] font-semibold"
              : "text-[#666] hover:text-[#f0efec]"
          }`}
        >
          {v === "chart" ? "Bar Chart" : "Table"}
        </button>
      ))}
    </div>
  );
}

// ─── Reveal Controls ──────────────────────────────────────────────────────────

function RevealControls({
  reveal,
  totalVoters,
  onPrev,
  onNext,
}: {
  reveal: RevealState;
  totalVoters: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  const canGoBack = prevState(reveal) !== null;
  const canGoNext = nextState(reveal, totalVoters) !== null;
  const isDone = reveal.voterIndex === totalVoters - 1 && reveal.placeStep === 4;

  const stepLabel =
    reveal.voterIndex === -1
      ? "Press Start to begin"
      : reveal.placeStep === 1
      ? "4th place and below"
      : reveal.placeStep === 2
      ? "3rd place revealed"
      : reveal.placeStep === 3
      ? "2nd place revealed"
      : "1st place revealed";

  return (
    <div className="border border-[#1e1e1e] bg-[#0a0a0a] px-4 py-3 flex items-center gap-4">
      <button
        onClick={onPrev}
        disabled={!canGoBack}
        className="px-3 py-1.5 text-[10px] tracking-[0.2em] uppercase font-mono border border-[#2a2a2a] text-[#666] hover:text-[#f0efec] hover:border-[#444] transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
      >
        ← Back
      </button>

      <div className="flex-1 flex items-center justify-center gap-3 min-w-0">
        {isDone ? (
          <span className="text-[10px] font-mono text-amber-400">
            All {totalVoters} voters revealed
          </span>
        ) : (
          <>
            <span className="text-[10px] font-mono text-[#555]">{stepLabel}</span>
            {reveal.voterIndex >= 0 && (
              <span className="text-[10px] font-mono text-[#444] border border-[#2a2a2a] px-2 py-0.5 shrink-0">
                {reveal.voterIndex + 1} / {totalVoters}
              </span>
            )}
          </>
        )}
      </div>

      <button
        onClick={onNext}
        disabled={!canGoNext}
        className="px-3 py-1.5 text-[10px] tracking-[0.2em] uppercase font-mono border border-[#2a2a2a] text-[#f0efec] hover:border-amber-400 hover:text-amber-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
      >
        {nextButtonLabel(reveal, totalVoters)}
      </button>
    </div>
  );
}

// ─── Current Voter Panel ──────────────────────────────────────────────────────

function CurrentVoterPanel({
  voter,
  itemMap,
  placeStep,
}: {
  voter: UserResult;
  itemMap: Record<string, string>;
  placeStep: number;
}) {
  const initials = voter.username.slice(0, 2).toUpperCase();
  const totalItems = voter.rankedItemIds.length;
  const revealedSet = new Set(getRevealedIndices(placeStep, totalItems));

  const placeLabel = (pos: number) => {
    if (pos === 0) return "1st";
    if (pos === 1) return "2nd";
    if (pos === 2) return "3rd";
    return `${pos + 1}th`;
  };

  return (
    <div className="border border-[#1e1e1e] bg-[#0e0e0e] p-4 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        {voter.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={voter.image}
            alt={voter.username}
            className="w-8 h-8 rounded-full border border-[#2a2a2a] shrink-0"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-amber-400/10 border border-amber-400/20 flex items-center justify-center shrink-0">
            <span className="text-[9px] font-mono font-bold text-amber-400">{initials}</span>
          </div>
        )}
        <span className="text-sm font-mono text-[#f0efec] truncate">{voter.username}</span>
      </div>

      <ol className="space-y-1.5">
        {voter.rankedItemIds.map((itemId, pos) => {
          const revealed = revealedSet.has(pos);
          const title = itemMap[itemId] ?? itemId;
          const isTop3 = pos < 3;
          return (
            <li key={pos} className="flex items-center gap-3">
              <span
                className={`text-[10px] font-mono w-8 shrink-0 tabular-nums ${
                  isTop3 ? "text-amber-400/60" : "text-[#444]"
                }`}
              >
                {placeLabel(pos)}
              </span>
              {revealed ? (
                <span
                  className={`text-xs font-mono truncate ${
                    isTop3 ? "text-amber-400" : "text-[#888]"
                  }`}
                >
                  {title}
                </span>
              ) : (
                <span className="text-xs font-mono text-[#2a2a2a]">???</span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ─── Bar Chart ───────────────────────────────────────────────────────────────

function RankedBarChart({ items }: { items: RankedItem[] }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setAnimated(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const maxScore = Math.max(...items.map((i) => i.score), 1);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[480px] space-y-2">
        {items.map((item, index) => {
          const pct = maxScore > 0 ? (item.score / maxScore) * 100 : 0;
          const isFirst = item.rank === 1 && item.score > 0;
          return (
            <div key={item.id} className="flex items-center gap-3 group">
              <span
                className={`w-8 text-right text-[11px] font-mono font-bold shrink-0 ${
                  isFirst ? "text-amber-400" : "text-[#444]"
                }`}
              >
                #{item.rank}
              </span>
              <div className="flex-1 relative h-9 bg-[#0a0a0a] border border-[#1e1e1e] overflow-hidden">
                <div
                  className={`absolute inset-y-0 left-0 transition-[width] duration-700 ease-out ${
                    isFirst ? "bg-amber-400/30" : "bg-cyan-500/20"
                  }`}
                  style={{
                    width: animated ? `${pct}%` : "0%",
                    transitionDelay: `${index * 60}ms`,
                  }}
                />
                <div
                  className={`absolute inset-y-0 left-0 w-0.5 transition-[width] duration-700 ease-out ${
                    isFirst ? "bg-amber-400" : "bg-cyan-500"
                  }`}
                  style={{
                    width: animated ? `${Math.max(pct, pct > 0 ? 0.5 : 0)}%` : "0%",
                    transitionDelay: `${index * 60}ms`,
                  }}
                />
                <span className="absolute inset-0 flex items-center px-3 text-sm font-mono text-[#f0efec] truncate">
                  {item.title}
                </span>
              </div>
              <span
                className={`w-14 text-right text-sm font-mono font-bold tabular-nums shrink-0 ${
                  isFirst ? "text-amber-400" : "text-[#888]"
                }`}
              >
                {item.score}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Table ───────────────────────────────────────────────────────────────────

function RankedTable({
  items,
  revealedVoters,
  maxPoints,
}: {
  items: RankedItem[];
  revealedVoters: number;
  maxPoints: number;
}) {
  const maxPossible = maxPoints * revealedVoters;

  return (
    <div className="border border-[#1e1e1e] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[480px]">
          <thead className="sticky top-0 bg-[#0a0a0a] border-b border-[#2a2a2a]">
            <tr>
              <th className="py-2.5 px-4 text-left text-[10px] tracking-[0.15em] uppercase text-[#444] font-mono font-normal">
                Rank
              </th>
              <th className="py-2.5 px-4 text-left text-[10px] tracking-[0.15em] uppercase text-[#444] font-mono font-normal">
                Item
              </th>
              <th className="py-2.5 px-4 text-right text-[10px] tracking-[0.15em] uppercase text-[#444] font-mono font-normal">
                Points
              </th>
              <th className="py-2.5 px-4 text-right text-[10px] tracking-[0.15em] uppercase text-[#444] font-mono font-normal">
                % of Max
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const isFirst = item.rank === 1 && item.score > 0;
              const pctOfMax =
                maxPossible > 0
                  ? Math.round((item.score / maxPossible) * 100)
                  : 0;
              return (
                <tr
                  key={item.id}
                  className={`border-b border-[#111] ${
                    index % 2 === 0 ? "bg-[#0e0e0e]" : "bg-[#0a0a0a]"
                  } ${isFirst ? "bg-amber-400/5" : ""}`}
                >
                  <td
                    className={`py-3 px-4 text-sm font-mono font-bold ${
                      isFirst ? "text-amber-400" : "text-[#555]"
                    }`}
                  >
                    #{item.rank}
                  </td>
                  <td className="py-3 px-4 text-sm text-[#f0efec]">{item.title}</td>
                  <td
                    className={`py-3 px-4 text-right text-sm font-mono font-bold tabular-nums ${
                      isFirst ? "text-amber-400" : "text-[#f0efec]"
                    }`}
                  >
                    {item.score}
                  </td>
                  <td className="py-3 px-4 text-right text-sm font-mono tabular-nums text-[#666]">
                    {maxPossible > 0 ? `${pctOfMax}%` : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Individual Results Panel (total mode only) ───────────────────────────────

function UserCard({
  result,
  itemMap,
  topItemId,
  index,
}: {
  result: UserResult;
  itemMap: Record<string, string>;
  topItemId: string;
  index: number;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), index * 40);
    return () => clearTimeout(t);
  }, [index]);

  const initials = result.username.slice(0, 2).toUpperCase();
  const alignsWithOverall = result.rankedItemIds[0] === topItemId;

  return (
    <div
      className={`border border-[#1e1e1e] bg-[#0e0e0e] p-4 transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="flex items-center gap-3 mb-3">
        {result.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={result.image}
            alt={result.username}
            className="w-8 h-8 rounded-full object-cover border border-[#2a2a2a]"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-amber-400/10 border border-amber-400/20 flex items-center justify-center shrink-0">
            <span className="text-[10px] font-mono font-bold text-amber-400">{initials}</span>
          </div>
        )}
        <span className="text-sm font-mono text-[#f0efec] truncate">{result.username}</span>
        {alignsWithOverall && (
          <span title="Top pick matches overall #1" className="ml-auto text-[10px] text-amber-400 font-mono shrink-0">
            ★
          </span>
        )}
      </div>
      <ol className="space-y-1">
        {result.rankedItemIds.map((itemId, pos) => {
          const title = itemMap[itemId] ?? itemId;
          const isOverallTop = itemId === topItemId;
          return (
            <li key={itemId} className="flex items-baseline gap-2">
              <span className="text-[10px] font-mono text-[#444] w-5 shrink-0 tabular-nums">
                {pos + 1}.
              </span>
              <span className={`text-xs truncate ${isOverallTop ? "text-amber-400/80" : "text-[#888]"}`}>
                {title}
              </span>
              {isOverallTop && (
                <span className="text-[9px] font-mono text-amber-400/60 shrink-0">✓</span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function IndividualResultsPanel({
  userResults,
  itemMap,
  topItemId,
}: {
  userResults: UserResult[];
  itemMap: Record<string, string>;
  topItemId: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-[#1e1e1e]">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#111] transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-[10px] tracking-[0.2em] uppercase font-mono text-[#f0efec]">
            Individual Results
          </span>
          <span className="text-[10px] font-mono text-[#444] border border-[#2a2a2a] px-2 py-0.5">
            {userResults.length} voter{userResults.length !== 1 ? "s" : ""}
          </span>
        </div>
        <span className={`text-[#555] text-xs font-mono transition-transform duration-200 ${open ? "rotate-180" : "rotate-0"}`}>
          ▼
        </span>
      </button>
      {open && (
        <div className="border-t border-[#1e1e1e] p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {userResults.map((result, index) => (
              <UserCard
                key={result.userId}
                result={result}
                itemMap={itemMap}
                topItemId={topItemId}
                index={index}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="border border-[#1e1e1e] bg-[#0a0a0a] py-20 flex flex-col items-center gap-3">
      <span className="text-3xl text-[#2a2a2a] font-mono">◌</span>
      <p className="text-sm font-mono text-[#444]">No votes submitted yet for this step</p>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function ResultsClient({
  rankedItems,
  userResults,
  itemMap,
  totalVoters,
  maxPoints,
  initialView,
  initialMode,
  pointsRules,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [view, setView] = useState<View>(initialView);
  const [displayMode, setDisplayMode] = useState<DisplayMode>(initialMode);
  const [reveal, setReveal] = useState<RevealState>({ voterIndex: -1, placeStep: 0 });

  function handleViewChange(v: View) {
    setView(v);
    router.replace(`${pathname}?view=${v}&mode=${displayMode}`, { scroll: false });
  }

  function handleModeChange(m: DisplayMode) {
    setDisplayMode(m);
    setReveal({ voterIndex: -1, placeStep: 0 });
    router.replace(`${pathname}?view=${view}&mode=${m}`, { scroll: false });
  }

  const revealItems = useMemo(
    () => computeRevealScores(userResults, itemMap, pointsRules, reveal),
    [userResults, itemMap, pointsRules, reveal]
  );

  const displayItems = displayMode === "reveal" ? revealItems : rankedItems;

  const currentVoter =
    displayMode === "reveal" && reveal.voterIndex >= 0
      ? userResults[reveal.voterIndex]
      : null;

  const revealedVoterCount =
    displayMode === "reveal"
      ? reveal.voterIndex === -1
        ? 0
        : reveal.placeStep === 4
        ? reveal.voterIndex + 1
        : reveal.voterIndex
      : totalVoters;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-[10px] tracking-[0.2em] uppercase font-mono text-[#666]">
            {displayMode === "reveal" ? "Reveal Mode" : "Aggregated Results"}
          </span>
          <span className="text-[10px] font-mono text-[#444] border border-[#2a2a2a] px-2 py-0.5">
            {totalVoters} vote{totalVoters !== 1 ? "s" : ""}
          </span>
        </div>
        {totalVoters > 0 && (
          <div className="flex items-center gap-2">
            <DisplayModeToggle mode={displayMode} onChange={handleModeChange} />
            <ViewToggle view={view} onChange={handleViewChange} />
          </div>
        )}
      </div>

      {totalVoters === 0 ? (
        <EmptyState />
      ) : (
        <>
          {displayMode === "reveal" && (
            <RevealControls
              reveal={reveal}
              totalVoters={totalVoters}
              onPrev={() => {
                const p = prevState(reveal);
                if (p) setReveal(p);
              }}
              onNext={() => {
                const n = nextState(reveal, totalVoters);
                if (n) setReveal(n);
              }}
            />
          )}

          {displayMode === "reveal" && currentVoter ? (
            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
              <CurrentVoterPanel
                voter={currentVoter}
                itemMap={itemMap}
                placeStep={reveal.placeStep}
              />
              <div className="space-y-2">
                <span className="text-[10px] tracking-[0.15em] uppercase font-mono text-[#444]">
                  Running Total
                </span>
                {view === "chart" ? (
                  <RankedBarChart items={displayItems} key={`chart-${reveal.voterIndex}-${reveal.placeStep}`} />
                ) : (
                  <RankedTable items={displayItems} revealedVoters={revealedVoterCount} maxPoints={maxPoints} />
                )}
              </div>
            </div>
          ) : (
            view === "chart" ? (
              <RankedBarChart items={displayItems} key={`chart-${reveal.voterIndex}-${reveal.placeStep}`} />
            ) : (
              <RankedTable items={displayItems} revealedVoters={revealedVoterCount} maxPoints={maxPoints} />
            )
          )}
        </>
      )}

      {totalVoters > 0 && displayMode === "total" && (
        <IndividualResultsPanel
          userResults={userResults}
          itemMap={itemMap}
          topItemId={rankedItems[0]?.id ?? ""}
        />
      )}
    </div>
  );
}
