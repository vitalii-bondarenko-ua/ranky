"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";

async function requireAuth() {
  const session = await auth();
  if (!session) redirect("/login");
  return session;
}

async function requireOwnerOrAdmin(projectId: string) {
  const session = await requireAuth();
  if (session.user.role === "ADMIN") return session;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  });
  if (!project || project.ownerId !== session.user.id) redirect("/projects");
  return session;
}

export type ProjectFormState = { errors?: { title?: string; general?: string } };

export async function createProject(
  prevState: ProjectFormState,
  formData: FormData
): Promise<ProjectFormState> {
  const session = await requireAuth();
  const title = formData.get("title")?.toString().trim() ?? "";
  const description = formData.get("description")?.toString().trim() || undefined;

  if (!title) return { errors: { title: "Title is required" } };

  let projectId: string;
  try {
    const project = await prisma.$transaction(async (tx) => {
      const created = await tx.project.create({
        data: {
          title,
          description,
          shareToken: nanoid(10),
          ownerId: session.user.id,
        },
      });
      await tx.projectParticipant.create({
        data: { userId: session.user.id, projectId: created.id },
      });
      return created;
    });
    projectId = project.id;
  } catch {
    return { errors: { general: "Failed to create project. Please try again." } };
  }
  redirect(`/projects/${projectId}`);
}

export async function deleteProject(projectId: string) {
  await requireOwnerOrAdmin(projectId);
  await prisma.project.delete({ where: { id: projectId } });
  revalidatePath("/projects");
}

export type StepFormState = { errors?: { title?: string; general?: string }; success?: boolean };

export async function createStep(
  prevState: StepFormState,
  formData: FormData
): Promise<StepFormState> {
  const projectId = formData.get("projectId")?.toString() ?? "";
  await requireOwnerOrAdmin(projectId);

  const title = formData.get("title")?.toString().trim() ?? "";
  if (!title) return { errors: { title: "Title is required" } };

  try {
    const count = await prisma.votingStep.count({ where: { projectId } });
    await prisma.votingStep.create({
      data: { title, projectId, order: count, pointsRules: {} },
    });
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
  } catch {
    return { errors: { general: "Failed to create step." } };
  }
}

export async function reorderSteps(projectId: string, stepIds: string[]) {
  await requireOwnerOrAdmin(projectId);
  await prisma.$transaction(
    stepIds.map((id, index) =>
      prisma.votingStep.update({ where: { id }, data: { order: index } })
    )
  );
  revalidatePath(`/projects/${projectId}`);
}

export async function activateStep(stepId: string, projectId: string) {
  await requireOwnerOrAdmin(projectId);
  await prisma.votingStep.update({ where: { id: stepId }, data: { status: "ACTIVE" } });
  revalidatePath(`/projects/${projectId}`);
}

export async function closeStep(stepId: string, projectId: string) {
  await requireOwnerOrAdmin(projectId);
  await prisma.votingStep.update({ where: { id: stepId }, data: { status: "CLOSED" } });
  revalidatePath(`/projects/${projectId}`);
}
