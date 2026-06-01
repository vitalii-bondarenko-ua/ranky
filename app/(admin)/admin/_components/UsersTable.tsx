"use client";

import { useTransition } from "react";
import { updateUserRole } from "@/app/(admin)/admin/actions";
import type { Role } from "@prisma/client";

type User = {
  id: string;
  username: string;
  email: string;
  role: Role;
};

export default function UsersTable({
  users,
  currentUserId,
}: {
  users: User[];
  currentUserId: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleRoleChange(userId: string, role: Role) {
    startTransition(async () => {
      try {
        await updateUserRole(userId, role);
      } catch (e) {
        alert(e instanceof Error ? e.message : "Failed to update role.");
      }
    });
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-gray-500">Username</th>
            <th className="px-4 py-3 text-left font-medium text-gray-500">Email</th>
            <th className="px-4 py-3 text-left font-medium text-gray-500">Role</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {users.map((u) => (
            <tr key={u.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-900">{u.username}</td>
              <td className="px-4 py-3 text-gray-500">{u.email}</td>
              <td className="px-4 py-3">
                <select
                  defaultValue={u.role}
                  disabled={isPending || u.id === currentUserId}
                  onChange={(e) => handleRoleChange(u.id, e.target.value as Role)}
                  className="rounded border border-gray-300 px-2 py-1 text-sm disabled:opacity-50"
                >
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
