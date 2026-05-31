import { Syne } from "next/font/google"
import { RegisterForm } from "./RegisterForm"

const syne = Syne({ subsets: ["latin"], weight: ["700"] })

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-[#0e0e0e] flex items-center justify-center px-4">
      <div className="w-full max-w-sm animate-fade-up">
        <h1 className={`${syne.className} text-3xl text-[#f0efec] mb-1`}>
          Create account.
        </h1>
        <p className="text-[#444] text-sm mb-8">Join to start voting.</p>
        <RegisterForm />
      </div>
    </main>
  )
}