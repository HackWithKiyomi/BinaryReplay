import { listCompletedStrategyRuns } from "@binaryreplay/db";
import { TerminalPage, EmptyData } from "../../(terminal)/page-view";
import { RunsWorkbench } from "../workbench";

export const dynamic = "force-dynamic";

export default async function Run({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;

  try {
    const runs = await listCompletedStrategyRuns();
    const run = runs.find((item) => item.id === runId);

    if (!run) {
      return <TerminalPage title={`Run ${runId}`} kicker="Result detail"><EmptyData action="Back to runs" href="/runs" /></TerminalPage>;
    }

    return <RunsWorkbench runs={[run] as any[]} />;
  } catch {
    return <TerminalPage title={`Run ${runId}`} kicker="Result detail"><section className="empty"><strong>Run storage is unavailable.</strong><p>Configure PostgreSQL and apply migrations to inspect this persisted run.</p></section></TerminalPage>;
  }
}
