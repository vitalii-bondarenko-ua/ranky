"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function submitVote(stepId: string, rankedItemIds: string[]): Promise<void> {
  const session = await auth();
  if (!session) redirect("/login");

  await prisma.vote.upsert({
    where: { userId_stepId: { userId: session.user.id, stepId } },
    update: { rankings: rankedItemIds },
    create: {
      userId: session.user.id,
      stepId,
      rankings: rankedItemIds,
    },
  });
}
