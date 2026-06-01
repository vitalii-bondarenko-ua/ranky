"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createProject, type ProjectFormState } from "../actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-amber-400 text-[#0e0e0e] font-semibold py-3 text-xs tracking-[0.2em] uppercase disabled:opacity-50 transition-opacity"
    >
      {pending ? "Creating…" : "Create Project"}
    </button>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 text-xs text-amber-400 flex items-center gap-1">
      <span aria-hidden="true">⚠</span>
      {message}
    </p>
  );
}

export default function NewProjectForm() {
  const [state, action] = useActionState<ProjectFormState, FormData>(createProject, {});

  return (
    <form action={action} noValidate className="space-y-5">
      <div>
        <label
          htmlFor="title"
          className="block text-[10px] tracking-[0.2em] uppercase text-[#666] mb-2"
        >
          Title <span className="text-amber-400">*</span>
        </label>
        <input
          id="title"
          name="title"
          type="text"
          className="w-full bg-transparent border border-[#2a2a2a] px-3 py-2.5 text-sm text-[#555] outline-none focus:border-amber-400 transition-colors placeholder:text-[#f0efec]"
          placeholder="My voting project"
        />
        <FieldError message={state.errors?.title} />
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-[10px] tracking-[0.2em] uppercase text-[#666] mb-2"
        >
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          className="w-full bg-transparent border border-[#2a2a2a] px-3 py-2.5 text-sm text-[#555] outline-none focus:border-amber-400 transition-colors placeholder:text-[#f0efec] resize-none"
          placeholder="Optional description"
        />
      </div>

      {state.errors?.general && (
        <p className="text-xs text-red-400 flex items-center gap-1">
          <span aria-hidden="true">⚠</span>
          {state.errors.general}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
