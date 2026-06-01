"use client";

import { useState, useTransition } from "react";
import { createStep } from "@/app/(app)/dashboard/projects/actions";

export default function AddStepForm({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleOpen() {
    setTitle("");
    setError(null);
    setOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setError("Title is required");
      return;
    }
    setError(null);
    const fd = new FormData();
    fd.append("title", trimmed);
    fd.append("projectId", projectId);
    startTransition(async () => {
      const result = await createStep({}, fd);
      if (result.errors) {
        setError(result.errors.title ?? result.errors.general ?? "Failed to create step");
      } else {
        setTitle("");
        setOpen(false);
      }
    });
  }

  if (!open) {
    return (
      <button
        onClick={handleOpen}
        className="mt-4 text-sm text-amber-400 hover:text-amber-300 transition-colors"
      >
        + Add step
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 flex items-start gap-3 border border-[#1e1e1e] bg-[#141414] rounded p-4"
    >
      <div className="flex-1">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Step title"
          className="w-full bg-transparent border border-[#2a2a2a] px-3 py-2 text-sm text-[#f0efec] outline-none focus:border-amber-400 transition-colors placeholder:text-[#444]"
          autoFocus
        />
        {error && (
          <p className="mt-1.5 text-xs text-amber-400">⚠ {error}</p>
        )}
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="bg-amber-400 text-[#0e0e0e] px-4 py-2 text-xs font-semibold uppercase tracking-[0.1em] disabled:opacity-50"
      >
        {isPending ? "Adding…" : "Add"}
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="px-3 py-2 text-xs text-[#666] hover:text-[#f0efec] transition-colors"
      >
        Cancel
      </button>
    </form>
  );
}
