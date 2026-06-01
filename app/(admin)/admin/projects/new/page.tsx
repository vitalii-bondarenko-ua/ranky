import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import NewProjectForm from "./NewProjectForm";

export default async function NewProjectPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin"
          className="text-[10px] tracking-[0.2em] uppercase text-[#666] hover:text-amber-400 transition-colors"
        >
          ← Admin
        </Link>
        <h1 className="text-xl font-semibold text-[#f0efec]">New Project</h1>
      </div>
      <NewProjectForm />
    </main>
  );
}
