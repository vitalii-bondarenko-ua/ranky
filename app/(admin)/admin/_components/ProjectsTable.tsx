"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteProject } from "@/app/(admin)/admin/actions";

type Project = {
  id: string;
  title: string;
  createdAt: Date;
};

export default function ProjectsTable({ projects }: { projects: Project[] }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    startTransition(async () => {
      await deleteProject(id);
    });
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-gray-500">Title</th>
            <th className="px-4 py-3 text-left font-medium text-gray-500">Created</th>
            <th className="px-4 py-3 text-left font-medium text-gray-500">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {projects.map((p) => (
            <tr key={p.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-900">{p.title}</td>
              <td className="px-4 py-3 text-gray-500">
                {new Date(p.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </td>
              <td className="px-4 py-3 flex gap-2">
                <button
                  onClick={() => router.push(`/dashboard/projects/${p.id}`)}
                  className="rounded bg-gray-100 px-3 py-1 text-gray-700 hover:bg-gray-200"
                >
                  View
                </button>
                <button
                  onClick={() => handleDelete(p.id, p.title)}
                  disabled={isPending}
                  className="rounded bg-red-100 px-3 py-1 text-red-700 hover:bg-red-200 disabled:opacity-50"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {projects.length === 0 && (
            <tr>
              <td colSpan={3} className="px-4 py-6 text-center text-gray-400">
                No projects yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
