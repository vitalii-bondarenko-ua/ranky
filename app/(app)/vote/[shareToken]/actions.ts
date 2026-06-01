"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function joinProject(projectId: string): Promise<void> {
  const session = await auth();
  if (!session) redirect("/login");

  await prisma.projectParticipant.upsert({
    where: { userId_projectId: { userId: session.user.id, projectId } },
    update: {},
    create: { userId: session.user.id, projectId },
  });
}

export async function setResultsVisibility(
  projectId: string,
  visible: boolean
): Promise<void> {
  const session = await auth();
  if (!session) redirect("/login");

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true, shareToken: true },
  });

  if (!project || project.ownerId !== session.user.id) return;

  await prisma.project.update({
    where: { id: projectId },
    data: { resultsPublic: visible },
  });

  revalidatePath(`/vote/${project.shareToken}`);
}
