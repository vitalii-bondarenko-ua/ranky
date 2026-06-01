"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function joinProject(projectId: string): Promise<void> {
  const session = await auth();
  if (!session) redirect("/login");

  await prisma.projectParticipant.upsert({
    where: { userId_projectId: { userId: session.user.id, projectId } },
    update: {},
    create: { userId: session.user.id, projectId },
  });
}
