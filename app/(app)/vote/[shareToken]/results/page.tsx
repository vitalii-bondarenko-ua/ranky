import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getProjectResults } from "@/lib/data/votes";
import ResultsClient from "./ResultsClient";

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ shareToken: string }>;
}) {
  const { shareToken } = await params;
  const session = await auth();
  if (!session) redirect(`/login?redirect=/vote/${shareToken}/results`);

  const data = await getProjectResults(shareToken, session.user.id);
  if (!data) redirect(`/vote/${shareToken}`);

  return <ResultsClient data={data} shareToken={shareToken} />;
}
