"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";

async function requireAdmin() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/projects");
  return session;
}

export type ProjectFormState = { errors?: { title?: string; general?: string } };

export async function createProject(
  prevState: ProjectFormState,
  formData: FormData
): Promise<ProjectFormState> {
  const session = await requireAdmin();
  const title = formData.get("title")?.toString().trim() ?? "";
  const description = formData.get("description")?.toString().trim() || undefined;

  if (!title) return { errors: { title: "Title is required" } };

  let projectId: string;
  try {
    const project = await prisma.project.create({
      data: {
        title,
        description,
        shareToken: nanoid(10),
        ownerId: session.user.id,
      },
    });
    projectId = project.id;
  } catch {
    return { errors: { general: "Failed to create project. Please try again." } };
  }
  redirect(`/admin/projects/${projectId}`);
}

export type StepFormState = { errors?: { title?: string; general?: string }; success?: boolean };

export async function createStep(
  prevState: StepFormState,
  formData: FormData
): Promise<StepFormState> {
  await requireAdmin();
  const title = formData.get("title")?.toString().trim() ?? "";
  const projectId = formData.get("projectId")?.toString() ?? "";

  if (!title) return { errors: { title: "Title is required" } };

  try {
    const count = await prisma.votingStep.count({ where: { projectId } });
    await prisma.votingStep.create({
      data: { title, projectId, order: count, pointsRules: {} },
    });
    revalidatePath(`/admin/projects/${projectId}`);
    return { success: true };
  } catch {
    return { errors: { general: "Failed to create step." } };
  }
}

export async function reorderSteps(projectId: string, stepIds: string[]) {
  await requireAdmin();
  await prisma.$transaction(
    stepIds.map((id, index) =>
      prisma.votingStep.update({ where: { id }, data: { order: index } })
    )
  );
  revalidatePath(`/admin/projects/${projectId}`);
}

export async function activateStep(stepId: string, projectId: string) {
  await requireAdmin();
  await prisma.votingStep.update({ where: { id: stepId }, data: { status: "ACTIVE" } });
  revalidatePath(`/admin/projects/${projectId}`);
}

export async function closeStep(stepId: string, projectId: string) {
  await requireAdmin();
  await prisma.votingStep.update({ where: { id: stepId }, data: { status: "CLOSED" } });
  revalidatePath(`/admin/projects/${projectId}`);
}
