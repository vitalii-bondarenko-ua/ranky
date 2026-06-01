import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getProjectByShareToken } from "@/lib/data/projects";
import VoteEntryClient from "./VoteEntryClient";

export default async function VoteJoinPage({
  params,
}: {
  params: Promise<{ shareToken: string }>;
}) {
  const { shareToken } = await params;
  const session = await auth();

  if (!session) redirect(`/login?redirect=/vote/${shareToken}`);

  const project = await getProjectByShareToken(shareToken, session.user.id);

  return <VoteEntryClient project={project} shareToken={shareToken} />;
}
