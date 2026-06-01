import Link from "next/link";
import { Syne } from "next/font/google";
import { auth } from "@/lib/auth";

const syne = Syne({ subsets: ["latin"], weight: ["700"] });

export default async function Home() {
  const session = await auth();
  const isLoggedIn = !!session;

  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-[#0e0e0e] px-6 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-[10px] tracking-[0.2em] uppercase text-[#444]">
          Ranked voting, simplified
        </p>

        <h1 className={`${syne.className} mt-6 text-5xl text-[#f0efec]`}>
          Let your team rank what matters.
        </h1>

        <p className="mt-6 text-sm leading-relaxed text-[#666]">
          Ranky lets admins create multi-step voting projects where participants
          drag and drop items into their preferred order. Scores are calculated
          automatically using configurable points rules — no spreadsheets needed.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href={isLoggedIn ? "/projects" : "/register"}
            className="w-full bg-amber-400 px-6 py-3 text-[10px] tracking-[0.2em] uppercase font-semibold text-[#0e0e0e] hover:bg-amber-300 transition-colors sm:w-auto"
          >
            Get started
          </Link>
          {!isLoggedIn && (
            <Link
              href="/login"
              className="w-full border border-[#2a2a2a] px-6 py-3 text-[10px] tracking-[0.2em] uppercase text-[#666] hover:border-[#444] hover:text-[#f0efec] transition-colors sm:w-auto"
            >
              Log in
            </Link>
          )}
        </div>
      </div>

      <div className="mx-auto mt-24 grid max-w-4xl grid-cols-1 gap-px sm:grid-cols-3 border border-[#1e1e1e]">
        <div className="bg-[#0e0e0e] p-8 border-b sm:border-b-0 sm:border-r border-[#1e1e1e]">
          <p className="text-[10px] tracking-[0.2em] uppercase text-amber-400 mb-3">01</p>
          <h3 className={`${syne.className} text-[#f0efec] mb-2`}>Multi-step voting</h3>
          <p className="text-xs text-[#444] leading-relaxed">
            Break complex decisions into focused voting rounds, each with its own items and scoring rules.
          </p>
        </div>

        <div className="bg-[#0e0e0e] p-8 border-b sm:border-b-0 sm:border-r border-[#1e1e1e]">
          <p className="text-[10px] tracking-[0.2em] uppercase text-amber-400 mb-3">02</p>
          <h3 className={`${syne.className} text-[#f0efec] mb-2`}>Drag & drop ranking</h3>
          <p className="text-xs text-[#444] leading-relaxed">
            Participants reorder items intuitively. No forms, no radio buttons — just drag.
          </p>
        </div>

        <div className="bg-[#0e0e0e] p-8">
          <p className="text-[10px] tracking-[0.2em] uppercase text-amber-400 mb-3">03</p>
          <h3 className={`${syne.className} text-[#f0efec] mb-2`}>Automatic scoring</h3>
          <p className="text-xs text-[#444] leading-relaxed">
            Configurable points rules aggregate all votes into a ranked leaderboard instantly.
          </p>
        </div>
      </div>
    </main>
  );
}
