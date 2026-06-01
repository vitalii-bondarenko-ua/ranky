import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getUserProjects } from "@/lib/data/projects";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const projects = await getUserProjects(session.user.id);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-[#f0efec]">My Projects</h1>
        <Link
          href="/dashboard/projects/new"
          className="rounded bg-amber-400 px-4 py-2 text-sm font-semibold text-[#0e0e0e] hover:bg-amber-300 transition-colors"
        >
          + New Project
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="border border-[#1e1e1e] bg-[#141414] rounded py-16 flex flex-col items-center gap-3">
          <p className="text-sm text-[#444]">No projects yet.</p>
          <Link
            href="/dashboard/projects/new"
            className="text-sm text-amber-400 hover:text-amber-300 transition-colors"
          >
            Create your first project →
          </Link>
        </div>
      ) : (
        <div className="border border-[#1e1e1e] rounded overflow-hidden">
          <table className="min-w-full divide-y divide-[#1e1e1e] text-sm">
            <thead className="bg-[#141414]">
              <tr>
                <th className="px-4 py-3 text-left text-[10px] tracking-[0.2em] uppercase text-[#666]">Title</th>
                <th className="px-4 py-3 text-left text-[10px] tracking-[0.2em] uppercase text-[#666]">Created</th>
                <th className="px-4 py-3 text-left text-[10px] tracking-[0.2em] uppercase text-[#666]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e1e1e] bg-[#0e0e0e]">
              {projects.map((p) => (
                <tr key={p.id} className="hover:bg-[#141414] transition-colors">
                  <td className="px-4 py-3 font-medium text-[#f0efec]">{p.title}</td>
                  <td className="px-4 py-3 text-[#666]">
                    {new Date(p.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/projects/${p.id}`}
                      className="rounded bg-[#1e1e1e] px-3 py-1 text-xs text-[#888] hover:bg-[#2a2a2a] hover:text-[#f0efec] transition-colors"
                    >
                      Manage
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
