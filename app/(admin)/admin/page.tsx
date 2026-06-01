import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminProjects } from "@/lib/data/projects";
import { getAdminUsers } from "@/lib/data/users";
import ProjectsTable from "./_components/ProjectsTable";
import UsersTable from "./_components/UsersTable";

export default async function AdminPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const [projects, users] = await Promise.all([
    getAdminProjects(),
    getAdminUsers(),
  ]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 space-y-10">
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Projects</h2>
          <Link
            href="/admin/projects/new"
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + New Project
          </Link>
        </div>
        <ProjectsTable projects={projects} />
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Users</h2>
        <UsersTable users={users} currentUserId={session.user.id} />
      </section>
    </main>
  );
}
