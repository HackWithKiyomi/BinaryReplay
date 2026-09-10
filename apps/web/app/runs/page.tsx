import { listCompletedStrategyRuns } from "@binaryreplay/db";
import { RunsWorkbench } from "./workbench";

export const dynamic = "force-dynamic";
export default async function RunsPage() {
  try { return <RunsWorkbench runs={await listCompletedStrategyRuns() as any[]} />; }
  catch { return <main className="page"><p className="eyebrow">Research comparison</p><h1>Runs</h1><section className="empty"><strong>Run storage is unavailable.</strong><p>Configure PostgreSQL and apply migrations to compare persisted deterministic runs.</p></section></main>; }
}
