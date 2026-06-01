"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";

async function requireAdmin() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/projects");
  return session;
}

export async function deleteProject(projectId: string) {
  await requireAdmin();
  await prisma.project.delete({ where: { id: projectId } });
  revalidatePath("/admin");
}

export async function updateUserRole(userId: string, role: Role) {
  const session = await requireAdmin();
  if (session.user.id === userId) {
    throw new Error("You cannot change your own role.");
  }
  await prisma.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/admin");
}
