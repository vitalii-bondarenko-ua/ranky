import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getProjectWithSteps } from "@/lib/data/projects";
import CopyLinkButton from "./_components/CopyLinkButton";
import StepsList from "./_components/StepsList";
import AddStepForm from "./_components/AddStepForm";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3005";

export default async function AdminProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const { id } = await params;
  const project = await getProjectWithSteps(id);
  if (!project) notFound();

  const shareUrl = `${BASE_URL}/vote/${project.shareToken}`;

  const steps = project.votingSteps.map((s) => ({
    id: s.id,
    title: s.title,
    status: s.status,
    order: s.order,
    itemCount: s._count.votingItems,
  }));

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 space-y-8">
      <div className="flex items-center gap-4">
        <Link
          href="/admin"
          className="text-[10px] tracking-[0.2em] uppercase text-[#666] hover:text-amber-400 transition-colors"
        >
          ← Admin
        </Link>
        <h1 className="text-xl font-semibold text-[#f0efec]">{project.title}</h1>
      </div>

      {project.description && (
        <p className="text-sm text-[#666]">{project.description}</p>
      )}

      <section>
        <h2 className="text-[10px] tracking-[0.2em] uppercase text-[#666] mb-3">
          Share link
        </h2>
        <CopyLinkButton url={shareUrl} />
      </section>

      <section>
        <h2 className="text-[10px] tracking-[0.2em] uppercase text-[#666] mb-3">
          Voting steps
        </h2>
        <StepsList projectId={project.id} initialSteps={steps} />
        <AddStepForm projectId={project.id} />
      </section>
    </main>
  );
}
