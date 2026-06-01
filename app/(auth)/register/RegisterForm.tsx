"use client"

import { useActionState, useState } from "react"
import { useFormStatus } from "react-dom"
import Link from "next/link"
import { registerAction } from "./actions"
import type { RegisterState } from "./actions"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-amber-400 text-[#0e0e0e] font-semibold py-3 text-xs tracking-[0.2em] uppercase disabled:opacity-50 transition-opacity"
    >
      {pending ? "Creating account…" : "Create Account"}
    </button>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p className="mt-1.5 text-xs text-amber-400 flex items-center gap-1">
      <span aria-hidden="true">⚠</span>
      {message}
    </p>
  )
}

export function RegisterForm({ redirectTo }: { redirectTo?: string }) {
  const [state, action] = useActionState<RegisterState, FormData>(registerAction, {})
  const [confirmError, setConfirmError] = useState<string>()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const form = e.currentTarget
    const password = (form.elements.namedItem("password") as HTMLInputElement).value
    const confirm = (form.elements.namedItem("confirmPassword") as HTMLInputElement).value

    if (confirm && password !== confirm) {
      e.preventDefault()
      setConfirmError("Passwords do not match")
      return
    }
    setConfirmError(undefined)
  }

  return (
    <form action={action} onSubmit={handleSubmit} noValidate className="space-y-5">
      {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}
      <div>
        <label
          htmlFor="username"
          className="block text-[10px] tracking-[0.2em] uppercase text-[#666] mb-2"
        >
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          className="w-full bg-transparent border border-[#2a2a2a] px-3 py-2.5 text-sm text-[#f0efec] outline-none focus:border-amber-400 transition-colors placeholder:text-[#444]"
        />
        <FieldError message={state.errors?.username} />
      </div>

      <div>
        <label
          htmlFor="email"
          className="block text-[10px] tracking-[0.2em] uppercase text-[#666] mb-2"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          className="w-full bg-transparent border border-[#2a2a2a] px-3 py-2.5 text-sm text-[#f0efec] outline-none focus:border-amber-400 transition-colors placeholder:text-[#444]"
        />
        <FieldError message={state.errors?.email} />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-[10px] tracking-[0.2em] uppercase text-[#666] mb-2"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          className="w-full bg-transparent border border-[#2a2a2a] px-3 py-2.5 text-sm text-[#f0efec] outline-none focus:border-amber-400 transition-colors placeholder:text-[#444]"
        />
        <FieldError message={state.errors?.password} />
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-[10px] tracking-[0.2em] uppercase text-[#666] mb-2"
        >
          Confirm Password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          className="w-full bg-transparent border border-[#2a2a2a] px-3 py-2.5 text-sm text-[#f0efec] outline-none focus:border-amber-400 transition-colors placeholder:text-[#444]"
        />
        <FieldError message={confirmError ?? state.errors?.confirmPassword} />
      </div>

      {state.errors?.general && (
        <p className="text-xs text-red-400 flex items-center gap-1">
          <span aria-hidden="true">⚠</span>
          {state.errors.general}
        </p>
      )}

      <SubmitButton />

      <p className="text-center text-xs text-[#444]">
        Already have an account?{" "}
        <Link
          href={redirectTo ? `/login?redirect=${encodeURIComponent(redirectTo)}` : "/login"}
          className="text-amber-400 hover:text-amber-300 transition-colors"
        >
          Sign in
        </Link>
      </p>
    </form>
  )
}
