"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { RankedItem, UserResult } from "@/lib/scoring";

type View = "chart" | "table";
type DisplayMode = "total" | "reveal";

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

// ─── Partial Score Computation ────────────────────────────────────────────────

function computePartialItems(
  userResults: UserResult[],
  itemMap: Record<string, string>,
  pointsRules: { ranks: number[] },
  count: number
): RankedItem[] {
  const scoreMap = new Map<string, number>(
    Object.keys(itemMap).map((id) => [id, 0])
  );

  for (let i = 0; i < count; i++) {
    userResults[i].rankedItemIds.forEach((itemId, pos) => {
      const pts = pointsRules.ranks[pos] ?? 0;
      scoreMap.set(itemId, (scoreMap.get(itemId) ?? 0) + pts);
    });
  }

  return Array.from(scoreMap.entries())
    .map(([id, score]) => ({ id, title: itemMap[id] ?? id, description: null, score, rank: 0 }))
    .sort((a, b) => b.score - a.score)
    .map((item, index) => ({ ...item, rank: index + 1 }));
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
          {m === "total" ? "Total" : "By User"}
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
  revealedCount,
  totalVoters,
  currentUser,
  onPrev,
  onNext,
}: {
  revealedCount: number;
  totalVoters: number;
  currentUser: UserResult | null;
  onPrev: () => void;
  onNext: () => void;
}) {
  const initials = currentUser?.username.slice(0, 2).toUpperCase() ?? "";
  const allRevealed = revealedCount === totalVoters;

  return (
    <div className="border border-[#1e1e1e] bg-[#0a0a0a] px-4 py-3 flex items-center gap-4">
      <button
        onClick={onPrev}
        disabled={revealedCount === 0}
        className="px-3 py-1.5 text-[10px] tracking-[0.2em] uppercase font-mono border border-[#2a2a2a] text-[#666] hover:text-[#f0efec] hover:border-[#444] transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
      >
        ← Back
      </button>

      <div className="flex-1 flex items-center justify-center gap-3 min-w-0">
        {revealedCount === 0 ? (
          <span className="text-[10px] font-mono text-[#444]">
            Press &quot;Reveal Next&quot; to start
          </span>
        ) : currentUser ? (
          <>
            {currentUser.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentUser.image}
                alt={currentUser.username}
                className="w-6 h-6 rounded-full border border-[#2a2a2a] shrink-0"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-amber-400/10 border border-amber-400/20 flex items-center justify-center shrink-0">
                <span className="text-[9px] font-mono font-bold text-amber-400">
                  {initials}
                </span>
              </div>
            )}
            <span className="text-sm font-mono text-[#f0efec] truncate">
              {currentUser.username}
            </span>
            <span className="text-[10px] font-mono text-[#555] border border-[#2a2a2a] px-2 py-0.5 shrink-0">
              {revealedCount} / {totalVoters}
            </span>
          </>
        ) : (
          <span className="text-[10px] font-mono text-amber-400">
            All {totalVoters} voters revealed
          </span>
        )}
      </div>

      <button
        onClick={onNext}
        disabled={allRevealed}
        className="px-3 py-1.5 text-[10px] tracking-[0.2em] uppercase font-mono border border-[#2a2a2a] text-[#f0efec] hover:border-amber-400 hover:text-amber-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
      >
        {revealedCount === 0 ? "Reveal First →" : "Reveal Next →"}
      </button>
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
                  <td className="py-3 px-4 text-sm text-[#f0efec]">
                    {item.title}
                  </td>
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

// ─── Individual Results Panel ─────────────────────────────────────────────────

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
  const userTopItem = result.rankedItemIds[0];
  const alignsWithOverall = userTopItem === topItemId;

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
            <span className="text-[10px] font-mono font-bold text-amber-400">
              {initials}
            </span>
          </div>
        )}
        <span className="text-sm font-mono text-[#f0efec] truncate">
          {result.username}
        </span>
        {alignsWithOverall && (
          <span
            title="Top pick matches overall #1"
            className="ml-auto text-[10px] text-amber-400 font-mono shrink-0"
          >
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
              <span
                className={`text-xs truncate ${
                  isOverallTop ? "text-amber-400/80" : "text-[#888]"
                }`}
              >
                {title}
              </span>
              {isOverallTop && (
                <span className="text-[9px] font-mono text-amber-400/60 shrink-0">
                  ✓
                </span>
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
        <span
          className={`text-[#555] text-xs font-mono transition-transform duration-200 ${
            open ? "rotate-180" : "rotate-0"
          }`}
        >
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
      <p className="text-sm font-mono text-[#444]">
        No votes submitted yet for this step
      </p>
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
  const [revealedCount, setRevealedCount] = useState(0);

  function handleViewChange(v: View) {
    setView(v);
    router.replace(`${pathname}?view=${v}&mode=${displayMode}`, { scroll: false });
  }

  function handleModeChange(m: DisplayMode) {
    setDisplayMode(m);
    setRevealedCount(0);
    router.replace(`${pathname}?view=${view}&mode=${m}`, { scroll: false });
  }

  const partialItems = useMemo(
    () =>
      displayMode === "reveal"
        ? computePartialItems(userResults, itemMap, pointsRules, revealedCount)
        : rankedItems,
    [displayMode, revealedCount, userResults, itemMap, pointsRules, rankedItems]
  );

  const displayItems = partialItems;
  const currentUser =
    displayMode === "reveal" && revealedCount > 0
      ? userResults[revealedCount - 1]
      : null;
  const allRevealed = revealedCount === totalVoters;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-[10px] tracking-[0.2em] uppercase font-mono text-[#666]">
            {displayMode === "reveal" ? "Reveal by User" : "Aggregated Results"}
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
              revealedCount={revealedCount}
              totalVoters={totalVoters}
              currentUser={allRevealed ? null : currentUser}
              onPrev={() => setRevealedCount((c) => Math.max(0, c - 1))}
              onNext={() => setRevealedCount((c) => Math.min(totalVoters, c + 1))}
            />
          )}

          {view === "chart" ? (
            <RankedBarChart items={displayItems} key={`chart-${revealedCount}`} />
          ) : (
            <RankedTable
              items={displayItems}
              revealedVoters={displayMode === "reveal" ? revealedCount : totalVoters}
              maxPoints={maxPoints}
            />
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
