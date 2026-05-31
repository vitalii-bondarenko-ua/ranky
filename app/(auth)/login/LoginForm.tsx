"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import Link from "next/link"
import { loginAction } from "./actions"
import type { LoginState } from "./actions"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-amber-400 text-[#0e0e0e] font-semibold py-3 text-xs tracking-[0.2em] uppercase disabled:opacity-50 transition-opacity"
    >
      {pending ? "Signing in…" : "Sign In"}
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

export function LoginForm() {
  const [state, action] = useActionState<LoginState, FormData>(loginAction, {})

  return (
    <form action={action} noValidate className="space-y-5">
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
          autoComplete="current-password"
          className="w-full bg-transparent border border-[#2a2a2a] px-3 py-2.5 text-sm text-[#f0efec] outline-none focus:border-amber-400 transition-colors placeholder:text-[#444]"
        />
        <FieldError message={state.errors?.password} />
      </div>

      {state.errors?.general && (
        <p className="text-xs text-red-400 flex items-center gap-1">
          <span aria-hidden="true">⚠</span>
          {state.errors.general}
        </p>
      )}

      <SubmitButton />

      <p className="text-center text-xs text-[#444]">
        No account?{" "}
        <Link href="/register" className="text-amber-400 hover:text-amber-300 transition-colors">
          Register
        </Link>
      </p>
    </form>
  )
}
