"use client";

import { useState, useTransition } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import Link from "next/link";
import { submitVote } from "./actions";

interface VotingItem {
  id: string;
  title: string;
  description: string | null;
  order: number;
}

interface Props {
  step: {
    id: string;
    title: string;
    pointsRules: { ranks: number[] };
  };
  items: VotingItem[];
  existingRanking: string[] | null;
  shareToken: string;
  voterCount: number;
  totalParticipants: number;
}

function getPoints(rules: { ranks: number[] }, rank: number): number {
  return rules.ranks[rank - 1] ?? 0;
}

function reorder<T>(list: T[], from: number, to: number): T[] {
  const result = Array.from(list);
  const [removed] = result.splice(from, 1);
  result.splice(to, 0, removed);
  return result;
}

function GripIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <rect x="4" y="2" width="2" height="2" rx="1" />
      <rect x="4" y="7" width="2" height="2" rx="1" />
      <rect x="4" y="12" width="2" height="2" rx="1" />
      <rect x="10" y="2" width="2" height="2" rx="1" />
      <rect x="10" y="7" width="2" height="2" rx="1" />
      <rect x="10" y="12" width="2" height="2" rx="1" />
    </svg>
  );
}

function RankNumber({ rank }: { rank: number }) {
  if (rank === 1)
    return <span className="w-7 shrink-0 text-center text-sm font-black text-amber-400">{rank}</span>;
  if (rank === 2)
    return <span className="w-7 shrink-0 text-center text-sm font-black text-slate-400">{rank}</span>;
  if (rank === 3)
    return <span className="w-7 shrink-0 text-center text-sm font-black text-orange-400">{rank}</span>;
  return <span className="w-7 shrink-0 text-center text-sm font-black text-[#444]">{rank}</span>;
}

function PointsPill({ rank, points }: { rank: number; points: number }) {
  if (rank === 1)
    return <span className="shrink-0 px-2 py-0.5 text-[10px] font-bold border border-amber-400/30 bg-amber-400/10 text-amber-400">+{points} pts</span>;
  if (rank === 2)
    return <span className="shrink-0 px-2 py-0.5 text-[10px] font-bold border border-slate-400/30 bg-slate-400/10 text-slate-300">+{points} pts</span>;
  if (rank === 3)
    return <span className="shrink-0 px-2 py-0.5 text-[10px] font-bold border border-orange-400/30 bg-orange-400/10 text-orange-400">+{points} pts</span>;
  return <span className="shrink-0 px-2 py-0.5 text-[10px] font-bold border border-[#2a2a2a] bg-[#141414] text-[#555]">+{points} pts</span>;
}

export default function VotingClient({
  step,
  items: initialItems,
  existingRanking,
  shareToken,
  voterCount,
  totalParticipants,
}: Props) {
  const totalRanks = step.pointsRules.ranks.length;
  const requiredRanks = Math.min(totalRanks, initialItems.length);

  const [poolItems, setPoolItems] = useState<VotingItem[]>(() => {
    if (!existingRanking) return initialItems;
    const rankedSet = new Set(existingRanking);
    return initialItems.filter((item) => !rankedSet.has(item.id));
  });

  const [rankedItems, setRankedItems] = useState<VotingItem[]>(() => {
    if (!existingRanking) return [];
    const map = new Map(initialItems.map((item) => [item.id, item]));
    return existingRanking
      .map((id) => map.get(id))
      .filter((item): item is VotingItem => item !== undefined);
  });

  const [submitted, setSubmitted] = useState(!!existingRanking);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const emptySlots = totalRanks - rankedItems.length;
  const canSubmit = rankedItems.length >= requiredRanks && !isPending;

  function handleDragEnd(result: DropResult) {
    const { source, destination } = result;
    if (!destination) return;

    const src = source.droppableId;
    const dst = destination.droppableId;

    if (src === dst) {
      if (src === "ranking") {
        setRankedItems((prev) => reorder(prev, source.index, destination.index));
      } else {
        setPoolItems((prev) => reorder(prev, source.index, destination.index));
      }
      return;
    }

    if (src === "pool" && dst === "ranking") {
      if (rankedItems.length >= totalRanks) return;
      const item = poolItems[source.index];
      setPoolItems((prev) => prev.filter((_, i) => i !== source.index));
      setRankedItems((prev) => {
        const next = [...prev];
        next.splice(destination.index, 0, item);
        return next;
      });
    } else if (src === "ranking" && dst === "pool") {
      const item = rankedItems[source.index];
      setRankedItems((prev) => prev.filter((_, i) => i !== source.index));
      setPoolItems((prev) => {
        const next = [...prev];
        next.splice(destination.index, 0, item);
        return next;
      });
    }
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      try {
        await submitVote(step.id, rankedItems.map((i) => i.id));
        setSubmitted(true);
      } catch {
        setError("Something went wrong. Please try again.");
      }
    });
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10 space-y-8">
      <Link
        href={`/vote/${shareToken}`}
        className="text-[10px] tracking-[0.2em] uppercase text-[#666] hover:text-amber-400 transition-colors"
      >
        ← Back to steps
      </Link>

      <div className="space-y-1">
        <h1 className="text-xl font-bold text-[#f0efec]">{step.title}</h1>
        <p className="text-[10px] tracking-[0.15em] uppercase text-[#444]">
          {totalRanks} rank{totalRanks !== 1 ? "s" : ""} · top pick earns{" "}
          {step.pointsRules.ranks[0] ?? 0} pts
          {!submitted && " · drag items into the ranking"}
        </p>
        {totalParticipants > 0 && (
          <p className="text-[10px] tracking-[0.15em] uppercase text-[#555]">
            {voterCount}/{totalParticipants} participant{totalParticipants !== 1 ? "s" : ""} voted
          </p>
        )}
      </div>

      {submitted && existingRanking && (
        <div className="border border-[#2a2a2a] bg-[#0e0e0e] px-4 py-3">
          <p className="text-sm text-[#aaa]">
            You&apos;ve already submitted a ranking for this step.
          </p>
        </div>
      )}

      {submitted && !existingRanking && (
        <div className="border border-emerald-400/20 bg-emerald-400/5 px-4 py-3">
          <p className="text-sm text-emerald-400">Your ranking has been saved! ✓</p>
        </div>
      )}

      {error && (
        <div className="border border-red-400/20 bg-red-400/5 px-4 py-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid md:grid-cols-2 gap-6 items-start">

          {/* Left — item pool */}
          <div className="space-y-3">
            <h2 className="text-[10px] tracking-[0.2em] uppercase text-[#666]">
              Items
            </h2>

            <Droppable droppableId="pool" isDropDisabled={submitted}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={[
                    "space-y-2 min-h-12 border border-dashed transition-colors",
                    snapshot.isDraggingOver
                      ? "border-[#333] bg-[#0a0a0a]"
                      : "border-[#1a1a1a]",
                    poolItems.length === 0 ? "p-4" : "p-2",
                  ].join(" ")}
                >
                  {poolItems.length === 0 && (
                    <p className="text-center text-[10px] tracking-[0.15em] uppercase text-[#333]">
                      {submitted ? "All items ranked" : "All items added to ranking"}
                    </p>
                  )}

                  {poolItems.map((item, index) => (
                    <Draggable
                      key={item.id}
                      draggableId={item.id}
                      index={index}
                      isDragDisabled={submitted}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={[
                            "flex items-center gap-3 px-3 py-2.5 border bg-[#0e0e0e] transition-all",
                            snapshot.isDragging
                              ? "border-amber-400/30 shadow-lg shadow-black/40"
                              : "border-[#1e1e1e]",
                          ].join(" ")}
                        >
                          {!submitted && (
                            <span
                              {...provided.dragHandleProps}
                              className="text-[#333] hover:text-[#666] cursor-grab active:cursor-grabbing shrink-0"
                            >
                              <GripIcon />
                            </span>
                          )}
                          <span className="flex-1 text-sm text-[#f0efec] truncate">
                            {item.title}
                          </span>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>

          {/* Right — ranking table */}
          <div className="space-y-3">
            <h2 className="text-[10px] tracking-[0.2em] uppercase text-[#666]">
              Your Ranking
            </h2>

            {/* Table header */}
            <div className="flex items-center gap-3 px-3 pb-2 border-b border-[#1e1e1e]">
              <span className="w-7 text-center text-[10px] tracking-[0.15em] uppercase text-[#333]">#</span>
              <span className="flex-1 text-[10px] tracking-[0.15em] uppercase text-[#333]">Item</span>
              <span className="text-[10px] tracking-[0.15em] uppercase text-[#333]">Pts</span>
            </div>

            <Droppable droppableId="ranking" isDropDisabled={submitted}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={[
                    "transition-colors",
                    snapshot.isDraggingOver ? "bg-amber-400/5" : "",
                  ].join(" ")}
                >
                  {/* Placed items */}
                  {rankedItems.map((item, index) => {
                    const rank = index + 1;
                    const points = getPoints(step.pointsRules, rank);
                    return (
                      <Draggable
                        key={item.id}
                        draggableId={item.id}
                        index={index}
                        isDragDisabled={submitted}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={[
                              "flex items-center gap-3 px-3 py-2.5 border-b transition-all",
                              snapshot.isDragging
                                ? "border border-amber-400/30 bg-[#111] shadow-lg shadow-black/40"
                                : "border-[#1a1a1a] bg-[#0e0e0e]",
                              submitted ? "opacity-70" : "",
                            ].join(" ")}
                          >
                            <RankNumber rank={rank} />
                            <span className="flex-1 text-sm text-[#f0efec] truncate">
                              {item.title}
                            </span>
                            <PointsPill rank={rank} points={points} />
                            {!submitted && (
                              <span
                                {...provided.dragHandleProps}
                                className="text-[#333] hover:text-[#666] cursor-grab active:cursor-grabbing shrink-0"
                              >
                                <GripIcon />
                              </span>
                            )}
                          </div>
                        )}
                      </Draggable>
                    );
                  })}

                  {provided.placeholder}

                  {/* Empty slots — inside Droppable so the full area is droppable */}
                  {Array.from({ length: emptySlots }).map((_, i) => {
                    const rank = rankedItems.length + i + 1;
                    const points = getPoints(step.pointsRules, rank);
                    return (
                      <div
                        key={rank}
                        className="flex items-center gap-3 px-3 py-2.5 border-b border-[#141414]"
                      >
                        <RankNumber rank={rank} />
                        <span className="flex-1 text-xs text-[#2a2a2a] italic">
                          drag an item here
                        </span>
                        <PointsPill rank={rank} points={points} />
                      </div>
                    );
                  })}
                </div>
              )}
            </Droppable>
          </div>
        </div>
      </DragDropContext>

      {!submitted && (
        <div className="space-y-2">
          {!canSubmit && rankedItems.length < requiredRanks && (
            <p className="text-[10px] tracking-[0.15em] uppercase text-[#444] text-center">
              Rank {requiredRanks - rankedItems.length} more item
              {requiredRanks - rankedItems.length !== 1 ? "s" : ""} to submit
            </p>
          )}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full py-3 text-[11px] tracking-[0.2em] uppercase font-semibold bg-amber-400 text-[#0e0e0e] hover:bg-amber-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {isPending ? "Saving…" : "Submit Ranking"}
          </button>
        </div>
      )}
    </main>
  );
}
