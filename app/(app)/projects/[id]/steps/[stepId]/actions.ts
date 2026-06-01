"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

async function requireOwnerOrAdmin(stepId: string) {
  const session = await auth();
  if (!session) redirect("/login");

  if (session.user.role === "ADMIN") return session;

  const step = await prisma.votingStep.findUnique({
    where: { id: stepId },
    select: { project: { select: { ownerId: true } } },
  });
  if (!step || step.project.ownerId !== session.user.id) redirect("/projects");
  return session;
}

type ItemInput = {
  id?: string;
  title: string;
  description?: string;
  order: number;
};

type SaveStepInput = {
  stepId: string;
  projectId: string;
  title: string;
  items: ItemInput[];
  rankPoints: number[];
};

export type SaveStepState = { error?: string; success?: boolean };

export async function saveStep(input: SaveStepInput): Promise<SaveStepState> {
  await requireOwnerOrAdmin(input.stepId);

  const { stepId, projectId, title, items, rankPoints } = input;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.votingStep.update({
        where: { id: stepId },
        data: { title, pointsRules: { ranks: rankPoints } },
      });

      const existing = await tx.votingItem.findMany({
        where: { stepId },
        select: { id: true },
      });
      const existingIds = new Set(existing.map((i) => i.id));
      const incomingIds = new Set(items.filter((i) => i.id).map((i) => i.id!));
      const toDelete = [...existingIds].filter((id) => !incomingIds.has(id));

      if (toDelete.length > 0) {
        await tx.votingItem.deleteMany({ where: { id: { in: toDelete } } });
      }

      for (const item of items) {
        if (item.id) {
          await tx.votingItem.update({
            where: { id: item.id },
            data: {
              title: item.title,
              description: item.description ?? null,
              order: item.order,
            },
          });
        } else {
          await tx.votingItem.create({
            data: {
              stepId,
              title: item.title,
              description: item.description ?? null,
              order: item.order,
            },
          });
        }
      }
    });

    revalidatePath(`/projects/${projectId}/steps/${stepId}`);
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
  } catch {
    return { error: "Failed to save step. Please try again." };
  }
}
