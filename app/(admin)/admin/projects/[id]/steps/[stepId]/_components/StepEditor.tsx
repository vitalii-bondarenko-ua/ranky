"use client";

import { useState, useTransition } from "react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { saveStep } from "../actions";

type LocalItem = {
  localId: string;
  id?: string;
  title: string;
  description: string;
  descExpanded: boolean;
};

type PointsRules = { firstPlace: number; decrement: number };

type Props = {
  stepId: string;
  projectId: string;
  initialTitle: string;
  initialItems: { id: string; title: string; description: string | null; order: number }[];
  initialPointsRules: PointsRules;
};

function ordinal(n: number): string {
  if (n === 1) return "1st";
  if (n === 2) return "2nd";
  if (n === 3) return "3rd";
  return `${n}th`;
}

export default function StepEditor({
  stepId,
  projectId,
  initialTitle,
  initialItems,
  initialPointsRules,
}: Props) {
  const [title, setTitle] = useState(initialTitle);
  const [items, setItems] = useState<LocalItem[]>(() =>
    initialItems.map((item) => ({
      localId: item.id,
      id: item.id,
      title: item.title,
      description: item.description ?? "",
      descExpanded: false,
    }))
  );
  const [rules, setRules] = useState<PointsRules>(initialPointsRules);
  const [isPending, startTransition] = useTransition();
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [saveError, setSaveError] = useState("");

  function addItem() {
    setItems((prev) => [
      ...prev,
      { localId: crypto.randomUUID(), title: "", description: "", descExpanded: false },
    ]);
  }

  function removeItem(localId: string) {
    setItems((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((i) => i.localId !== localId);
    });
  }

  function updateItem(localId: string, field: "title" | "description", value: string) {
    setItems((prev) =>
      prev.map((i) => (i.localId === localId ? { ...i, [field]: value } : i))
    );
  }

  function toggleDesc(localId: string) {
    setItems((prev) =>
      prev.map((i) => (i.localId === localId ? { ...i, descExpanded: !i.descExpanded } : i))
    );
  }

  function onDragEnd(result: DropResult) {
    if (!result.destination) return;
    const from = result.source.index;
    const to = result.destination.index;
    if (from === to) return;
    setItems((prev) => {
      const next = Array.from(prev);
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  function handleSave() {
    setSaveStatus("idle");
    startTransition(async () => {
      const result = await saveStep({
        stepId,
        projectId,
        title: title.trim() || "Untitled Step",
        items: items.map((item, index) => ({
          id: item.id,
          title: item.title.trim() || `Item ${index + 1}`,
          description: item.description.trim() || undefined,
          order: index,
        })),
        pointsRules: rules,
      });
      if (result.success) {
        setSaveStatus("success");
        setTimeout(() => setSaveStatus("idle"), 2500);
      } else {
        setSaveStatus("error");
        setSaveError(result.error ?? "Failed to save.");
      }
    });
  }

  // Live preview computation
  const previewItems = items.map((item, index) => ({
    ...item,
    displayTitle: item.title.trim() || `Item ${index + 1}`,
    points: Math.max(0, rules.firstPlace - index * rules.decrement),
    rank: index + 1,
  }));

  const totalPoints = previewItems.reduce((sum, item) => sum + item.points, 0);

  let firstZeroRank = previewItems.length + 1;
  for (let i = 0; i < previewItems.length; i++) {
    if (previewItems[i].points === 0) {
      firstZeroRank = i + 1;
      break;
    }
  }
  const showZeroWarning = firstZeroRank <= previewItems.length;

  return (
    <div className="grid grid-cols-2 border border-[#1e1e1e]">
      {/* Left panel — editor controls */}
      <div className="border-r border-[#1e1e1e] p-6 space-y-8">
        {/* Step title */}
        <section>
          <label className="block text-[10px] tracking-[0.2em] uppercase text-[#666] mb-2">
            Step Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled Step"
            className="w-full bg-[#141414] border border-[#2a2a2a] px-3 py-2 text-sm text-[#f0efec] font-mono focus:outline-none focus:border-amber-400 transition-colors"
          />
        </section>

        {/* Voting items */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] tracking-[0.2em] uppercase text-[#666]">
              Voting Items
            </span>
            <button
              onClick={addItem}
              className="text-[10px] tracking-[0.15em] uppercase text-amber-400 hover:text-amber-300 transition-colors"
            >
              + Add Item
            </button>
          </div>

          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="items">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                  {items.map((item, index) => (
                    <Draggable key={item.localId} draggableId={item.localId} index={index}>
                      {(drag) => (
                        <div
                          ref={drag.innerRef}
                          {...drag.draggableProps}
                          className="border border-[#2a2a2a] bg-[#141414]"
                        >
                          <div className="flex items-center gap-2 px-3 py-2">
                            <span
                              {...drag.dragHandleProps}
                              className="text-[#444] cursor-grab active:cursor-grabbing select-none text-base leading-none shrink-0"
                            >
                              ⠿
                            </span>
                            <span className="text-[10px] text-amber-400 font-mono shrink-0 w-5 tabular-nums">
                              {index + 1}.
                            </span>
                            <input
                              type="text"
                              value={item.title}
                              onChange={(e) => updateItem(item.localId, "title", e.target.value)}
                              placeholder={`Item ${index + 1}`}
                              className="flex-1 min-w-0 bg-transparent text-sm text-[#f0efec] font-mono focus:outline-none placeholder-[#333]"
                            />
                            <button
                              onClick={() => toggleDesc(item.localId)}
                              title={item.descExpanded ? "Collapse description" : "Expand description"}
                              className="text-[11px] text-[#444] hover:text-[#888] shrink-0 leading-none px-1"
                            >
                              {item.descExpanded ? "▲" : "▼"}
                            </button>
                            {items.length > 1 && (
                              <button
                                onClick={() => removeItem(item.localId)}
                                title="Remove item"
                                className="text-[11px] text-[#444] hover:text-red-400 shrink-0 leading-none px-1"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                          {item.descExpanded && (
                            <div className="px-3 pb-3 border-t border-[#1e1e1e]">
                              <textarea
                                value={item.description}
                                onChange={(e) =>
                                  updateItem(item.localId, "description", e.target.value)
                                }
                                placeholder="Optional description..."
                                rows={2}
                                className="mt-2 w-full bg-transparent text-xs text-[#888] font-mono focus:outline-none resize-none placeholder-[#2a2a2a]"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </section>

        {/* Points rules */}
        <section>
          <span className="block text-[10px] tracking-[0.2em] uppercase text-[#666] mb-3">
            Points Rules
          </span>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-mono text-[#555] mb-1">
                First Place
              </label>
              <input
                type="number"
                min="0"
                value={rules.firstPlace}
                onChange={(e) =>
                  setRules((r) => ({ ...r, firstPlace: Math.max(0, parseInt(e.target.value) || 0) }))
                }
                className="w-full bg-[#141414] border border-[#2a2a2a] px-3 py-2 text-sm text-[#f0efec] font-mono focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-[#555] mb-1">
                Decrement / Rank
              </label>
              <input
                type="number"
                min="0"
                value={rules.decrement}
                onChange={(e) =>
                  setRules((r) => ({ ...r, decrement: Math.max(0, parseInt(e.target.value) || 0) }))
                }
                className="w-full bg-[#141414] border border-[#2a2a2a] px-3 py-2 text-sm text-[#f0efec] font-mono focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>
          </div>
          <div className="mt-3 border border-[#1e1e1e] bg-[#0a0a0a] px-3 py-2 flex items-center justify-between">
            <span className="text-[10px] tracking-[0.15em] uppercase text-[#444] font-mono">
              Total Distributed
            </span>
            <span className="text-sm font-mono text-amber-400 font-bold">{totalPoints} pts</span>
          </div>
        </section>

        {/* Save */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={isPending}
            className="bg-amber-400 text-[#0f0f0f] px-6 py-2 text-xs tracking-[0.15em] uppercase font-semibold hover:bg-amber-300 disabled:opacity-50 transition-colors"
          >
            {isPending ? "Saving…" : "Save Step"}
          </button>
          {saveStatus === "success" && (
            <span className="text-xs text-green-400 font-mono">✓ Saved</span>
          )}
          {saveStatus === "error" && (
            <span className="text-xs text-red-400 font-mono">{saveError}</span>
          )}
        </div>
      </div>

      {/* Right panel — live preview */}
      <div className="p-6">
        <div className="text-[10px] tracking-[0.2em] uppercase text-[#666] mb-4">
          Points Preview
        </div>

        {showZeroWarning && (
          <div className="mb-4 border border-amber-400/30 bg-amber-400/5 px-3 py-2 text-[11px] font-mono text-amber-400">
            ⚠ Points reach 0 at rank {firstZeroRank}
          </div>
        )}

        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[#2a2a2a]">
              <th className="py-2 pr-4 text-left text-[10px] tracking-[0.15em] uppercase text-[#444] font-mono font-normal">
                Rank
              </th>
              <th className="py-2 pr-4 text-left text-[10px] tracking-[0.15em] uppercase text-[#444] font-mono font-normal">
                Item
              </th>
              <th className="py-2 text-right text-[10px] tracking-[0.15em] uppercase text-[#444] font-mono font-normal">
                Points
              </th>
            </tr>
          </thead>
          <tbody>
            {previewItems.map((item, index) => (
              <tr
                key={item.localId}
                className={`border-b border-[#1a1a1a] ${index === 0 ? "bg-amber-400/5" : ""}`}
              >
                <td
                  className={`py-3 pr-4 text-sm font-mono font-bold tabular-nums ${
                    index === 0 ? "text-amber-400" : "text-[#555]"
                  }`}
                >
                  {ordinal(item.rank)}
                </td>
                <td
                  className={`py-3 pr-4 text-sm font-mono ${
                    index === 0 ? "text-[#f0efec]" : "text-[#888]"
                  }`}
                >
                  {item.displayTitle}
                </td>
                <td
                  className={`py-3 text-right text-sm font-mono font-bold tabular-nums ${
                    item.points > 0
                      ? index === 0
                        ? "text-amber-400"
                        : "text-[#f0efec]"
                      : "text-[#333]"
                  }`}
                >
                  {item.points}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-[#2a2a2a]">
              <td
                colSpan={2}
                className="py-3 text-[10px] tracking-[0.15em] uppercase text-[#444] font-mono"
              >
                Total
              </td>
              <td className="py-3 text-right text-sm font-mono font-bold text-amber-400 tabular-nums">
                {totalPoints}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
