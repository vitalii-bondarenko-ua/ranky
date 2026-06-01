import Link from "next/link";
import { Syne } from "next/font/google";
import { auth, signOut } from "@/lib/auth";

const syne = Syne({ subsets: ["latin"], weight: ["700"] });

async function SignOutForm() {
  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <form action={handleSignOut}>
      <button
        type="submit"
        className="text-[10px] tracking-[0.2em] uppercase text-[#666] hover:text-amber-400 transition-colors"
      >
        Sign out
      </button>
    </form>
  );
}

export default async function Header() {
  const session = await auth();

  return (
    <header className="border-b border-[#1e1e1e] bg-[#0e0e0e]">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-6">
        <Link href="/" className={`${syne.className} text-lg text-[#f0efec]`}>
          Ranky
        </Link>

        <nav className="flex items-center gap-6">
          <Link
            href="/"
            className="text-[10px] tracking-[0.2em] uppercase text-[#666] hover:text-[#f0efec] transition-colors"
          >
            Home
          </Link>
          {session?.user && (
            <Link
              href="/projects"
              className="text-[10px] tracking-[0.2em] uppercase text-[#666] hover:text-[#f0efec] transition-colors"
            >
              Projects
            </Link>
          )}
          {session?.user?.role === "ADMIN" && (
            <Link
              href="/admin"
              className="text-[10px] tracking-[0.2em] uppercase text-[#666] hover:text-amber-400 transition-colors"
            >
              Admin
            </Link>
          )}
          {session?.user ? (
            <>
              <span className="text-[10px] tracking-[0.2em] uppercase text-[#444]">
                @{session.user.username}
              </span>
              <SignOutForm />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-[10px] tracking-[0.2em] uppercase text-[#666] hover:text-[#f0efec] transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="text-[10px] tracking-[0.2em] uppercase bg-amber-400 text-[#0e0e0e] px-4 py-2 font-semibold hover:bg-amber-300 transition-colors"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
