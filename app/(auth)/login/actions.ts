"use server"

import { signIn } from "@/lib/auth"
import { AuthError } from "next-auth"

export type LoginState = {
  errors?: {
    email?: string
    password?: string
    general?: string
  }
}

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = (formData.get("email") ?? "") as string
  const password = (formData.get("password") ?? "") as string

  const errors: NonNullable<LoginState["errors"]> = {}

  if (!email) {
    errors.email = "Email is required"
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Enter a valid email"
  }

  if (!password) {
    errors.password = "Password is required"
  } else if (password.length < 6) {
    errors.password = "At least 6 characters"
  }

  if (Object.keys(errors).length > 0) return { errors }

  const redirectTo = (formData.get("redirectTo") ?? "") as string
  const destination = redirectTo.startsWith("/") ? redirectTo : "/dashboard"

  try {
    await signIn("credentials", { email, password, redirectTo: destination })
  } catch (err) {
    if (err instanceof AuthError) {
      return { errors: { general: "Invalid email or password" } }
    }
    throw err
  }

  return {}
}
