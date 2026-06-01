"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");
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
  pointsRules: { firstPlace: number; decrement: number };
};

export type SaveStepState = { error?: string; success?: boolean };

export async function saveStep(input: SaveStepInput): Promise<SaveStepState> {
  await requireAdmin();

  const { stepId, projectId, title, items, pointsRules } = input;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.votingStep.update({
        where: { id: stepId },
        data: { title, pointsRules },
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

    revalidatePath(`/admin/projects/${projectId}/steps/${stepId}`);
    revalidatePath(`/admin/projects/${projectId}`);
    return { success: true };
  } catch {
    return { error: "Failed to save step. Please try again." };
  }
}
