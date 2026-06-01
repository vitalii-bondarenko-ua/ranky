"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import Link from "next/link";
import { reorderSteps, activateStep, closeStep } from "@/app/(admin)/admin/projects/actions";

type Step = {
  id: string;
  title: string;
  status: "DRAFT" | "ACTIVE" | "CLOSED";
  order: number;
  itemCount: number;
};

export default function StepsList({
  projectId,
  initialSteps,
}: {
  projectId: string;
  initialSteps: Step[];
}) {
  const [steps, setSteps] = useState(initialSteps);
  const [isPending, startTransition] = useTransition();
  const [reorderError, setReorderError] = useState<string | null>(null);
  const prevInitialRef = useRef(initialSteps);

  useEffect(() => {
    if (prevInitialRef.current !== initialSteps) {
      prevInitialRef.current = initialSteps;
      setSteps(initialSteps);
    }
  }, [initialSteps]);

  function onDragEnd(result: DropResult) {
    if (!result.destination || isPending) return;
    const from = result.source.index;
    const to = result.destination.index;
    if (from === to) return;

    const reordered = Array.from(steps);
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);

    const prev = steps;
    setSteps(reordered);
    setReorderError(null);

    startTransition(async () => {
      try {
        await reorderSteps(projectId, reordered.map((s) => s.id));
      } catch {
        setSteps(prev);
        setReorderError("Failed to reorder steps. Please try again.");
      }
    });
  }

  function handleActivate(stepId: string) {
    startTransition(async () => {
      await activateStep(stepId, projectId);
      setSteps((prev) =>
        prev.map((s) => (s.id === stepId ? { ...s, status: "ACTIVE" as const } : s))
      );
    });
  }

  function handleClose(stepId: string) {
    startTransition(async () => {
      await closeStep(stepId, projectId);
      setSteps((prev) =>
        prev.map((s) => (s.id === stepId ? { ...s, status: "CLOSED" as const } : s))
      );
    });
  }

  if (steps.length === 0) {
    return <p className="text-sm text-[#444] py-4">No steps yet. Add one below.</p>;
  }

  return (
    <div>
      {reorderError && (
        <p className="mb-3 text-xs text-red-400">⚠ {reorderError}</p>
      )}
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="steps">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="space-y-2"
            >
              {steps.map((step, index) => (
                <Draggable key={step.id} draggableId={step.id} index={index}>
                  {(drag) => (
                    <div
                      ref={drag.innerRef}
                      {...drag.draggableProps}
                      className="flex items-center gap-3 rounded border border-[#1e1e1e] bg-[#141414] px-4 py-3"
                    >
                      <span
                        {...drag.dragHandleProps}
                        className="text-[#444] cursor-grab active:cursor-grabbing select-none text-lg leading-none"
                      >
                        ⠿
                      </span>

                      <span className="flex-1 text-sm text-[#f0efec]">{step.title}</span>

                      <span className="text-xs text-[#666]">{step.itemCount} items</span>

                      {step.status === "DRAFT" && (
                        <span className="rounded px-2 py-0.5 text-[10px] tracking-[0.1em] uppercase font-medium bg-[#2a2a2a] text-[#888]">
                          Draft
                        </span>
                      )}
                      {step.status === "ACTIVE" && (
                        <span className="rounded px-2 py-0.5 text-[10px] tracking-[0.1em] uppercase font-medium bg-green-950 text-green-400">
                          Active
                        </span>
                      )}
                      {step.status === "CLOSED" && (
                        <span className="rounded px-2 py-0.5 text-[10px] tracking-[0.1em] uppercase font-medium bg-red-950 text-red-400">
                          Closed
                        </span>
                      )}

                      {step.status === "DRAFT" && (
                        <button
                          onClick={() => handleActivate(step.id)}
                          disabled={isPending}
                          className="rounded bg-green-950 px-3 py-1 text-xs text-green-400 hover:bg-green-900 disabled:opacity-50"
                        >
                          Activate
                        </button>
                      )}
                      {step.status === "ACTIVE" && (
                        <button
                          onClick={() => handleClose(step.id)}
                          disabled={isPending}
                          className="rounded bg-red-950 px-3 py-1 text-xs text-red-400 hover:bg-red-900 disabled:opacity-50"
                        >
                          Close
                        </button>
                      )}
                      {step.status === "CLOSED" && (
                        <span className="px-3 py-1 text-xs text-[#444]">—</span>
                      )}

                      <Link
                        href={`/admin/projects/${projectId}/steps/${step.id}`}
                        className="rounded bg-[#1e1e1e] px-3 py-1 text-xs text-[#888] hover:bg-[#2a2a2a] hover:text-[#f0efec] transition-colors"
                      >
                        Edit
                      </Link>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}
