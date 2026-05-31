"use server"

import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { signIn } from "@/lib/auth"
import { AuthError } from "next-auth"

export type RegisterState = {
  errors?: {
    username?: string
    email?: string
    password?: string
    confirmPassword?: string
    general?: string
  }
}

export async function registerAction(
  _prev: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const username = (formData.get("username") ?? "") as string
  const email = (formData.get("email") ?? "") as string
  const password = (formData.get("password") ?? "") as string
  const confirmPassword = (formData.get("confirmPassword") ?? "") as string

  const errors: NonNullable<RegisterState["errors"]> = {}

  if (!username) {
    errors.username = "Username is required"
  } else if (username.length < 3) {
    errors.username = "At least 3 characters"
  } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    errors.username = "Letters, numbers, and underscores only"
  }

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

  if (!confirmPassword) {
    errors.confirmPassword = "Please confirm your password"
  } else if (password && confirmPassword !== password) {
    errors.confirmPassword = "Passwords do not match"
  }

  if (Object.keys(errors).length > 0) return { errors }

  const existingEmail = await prisma.user.findUnique({ where: { email } })
  if (existingEmail) {
    return { errors: { email: "Email already in use" } }
  }

  const existingUsername = await prisma.user.findUnique({ where: { username } })
  if (existingUsername) {
    return { errors: { username: "Username already taken" } }
  }

  const hashed = await bcrypt.hash(password, 12)
  await prisma.user.create({ data: { username, email, password: hashed } })

  try {
    await signIn("credentials", { email, password, redirectTo: "/dashboard" })
  } catch (err) {
    if (err instanceof AuthError) {
      return { errors: { general: "Account created — please sign in." } }
    }
    throw err
  }

  return {}
}
