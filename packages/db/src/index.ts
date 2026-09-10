import { drizzle } from "drizzle-orm/postgres-js";
import { eq, sql } from "drizzle-orm";
import postgres from "postgres";
export * from "./schema.js";
import { liveCaptureRecords, replayDatasets, runMetrics, shadowIntents, shadowSessions, strategyRuns } from "./schema.js";
export function database(url = process.env.DATABASE_URL) { if (!url) throw new Error("DATABASE_URL is required to persist a dataset"); return drizzle(postgres(url)); }
export async function databaseHealthCheck() { await database().execute(sql`select 1`); return true; }
export async function findReplayDataset(id: string) { const db = database(); return (await db.select().from(replayDatasets).where(eq(replayDatasets.id, id)).limit(1))[0] ?? null; }
export async function listReplayDatasets() { const db = database(); return db.select().from(replayDatasets); }
export async function saveLiveCaptureRecord(record: { id: string; marketId: string; capturedAt: string; kind: string; blockNumber?: string; payload: unknown }) { const db = database(); await db.insert(liveCaptureRecords).values({ ...record, capturedAt: new Date(record.capturedAt), blockNumber: record.blockNumber ?? null }).onConflictDoNothing(); }
const json = (value: unknown) => JSON.parse(JSON.stringify(value, (_key, item) => typeof item === "bigint" ? item.toString() : item));
export async function saveCompletedStrategyRun(run: { id: string; datasetId: string; datasetHash: string; marketId: string; strategyDefinitionId: string; strategyId: string; strategyVersion: string; strategyHash: string; runHash: string; initialCapital: bigint; latencyMs: bigint; strategyConfiguration: unknown; simulatorConfiguration: unknown; results: unknown; metrics: Record<string, unknown>; completedAt?: Date }) {
  const db = database();
  await db.insert(strategyRuns).values({ id: run.id, datasetId: run.datasetId, datasetHash: run.datasetHash, marketId: run.marketId, strategyDefinitionId: run.strategyDefinitionId, strategyId: run.strategyId, strategyVersion: run.strategyVersion, strategyHash: run.strategyHash, runHash: run.runHash, initialCapital: run.initialCapital.toString(), latencyMs: run.latencyMs.toString(), simulatorConfig: json(run.simulatorConfiguration), results: json(run.results), startedAt: run.completedAt ?? new Date(), status: "COMPLETED", config: json(run.strategyConfiguration), deterministicSeed: run.runHash, completedAt: run.completedAt ?? new Date() }).onConflictDoNothing();
  const rows = Object.entries(run.metrics).map(([metricKey, metricValue]) => ({ id: `${run.id}:${metricKey}`, strategyRunId: run.id, metricKey, metricValue: typeof metricValue === "bigint" ? metricValue.toString() : JSON.stringify(metricValue), metadata: {} }));
  if (rows.length) await db.insert(runMetrics).values(rows).onConflictDoNothing();
  return run.id;
}
export async function listCompletedStrategyRuns() { const db = database(); return db.select().from(strategyRuns).where(eq(strategyRuns.status, "COMPLETED")); }
export async function saveShadowSession(session: { id: string; marketId: string; strategyDefinitionId: string; status: string; config: unknown; endedAt?: Date }) { const db = database(); const values = { ...session, startedAt: new Date(), config: json(session.config), endedAt: session.endedAt ?? null }; await db.insert(shadowSessions).values(values).onConflictDoUpdate({ target: shadowSessions.id, set: { status: values.status, endedAt: values.endedAt, config: values.config } }); }
export async function saveShadowIntent(intent: { id: string; shadowSessionId: string; marketId: string; sequence: bigint; observedAt: bigint; side: string; quantity: bigint; referencePrice?: bigint; decision: unknown }) { const db = database(); await db.insert(shadowIntents).values({ ...intent, sequence: intent.sequence.toString(), observedAt: intent.observedAt.toString(), quantity: intent.quantity.toString(), referencePrice: intent.referencePrice?.toString() ?? null, decision: json(intent.decision) }).onConflictDoNothing(); }
export async function listShadowSessions() { const db = database(); return db.select().from(shadowSessions); }
export async function listShadowIntents(shadowSessionId: string) { const db = database(); return db.select().from(shadowIntents).where(eq(shadowIntents.shadowSessionId, shadowSessionId)); }
