import type { Dataset, ReplayEvent } from "@binaryreplay/shared";
import { createHash } from "node:crypto";
export * from "./quality.js";
export * from "./engine.js";

export function verifyDataset(dataset: Dataset): { valid: boolean; reason?: string } {
  if (!dataset.market.marketId || !dataset.events.every((event) => event.marketId === dataset.market.marketId)) return { valid: false, reason: "Market identity mismatch" };
  for (let i = 1; i < dataset.events.length; i++) if (dataset.events[i].sequence <= dataset.events[i - 1].sequence || dataset.events[i].timestamp < dataset.events[i - 1].timestamp) return { valid: false, reason: "Event ordering is not deterministic" };
  return { valid: true };
}

export function eventAt(events: ReplayEvent[], cursorMs: number): ReplayEvent | undefined {
  return [...events].filter((event) => event.timestamp <= cursorMs).at(-1);
}

export type ReplayDatasetManifest = { formatVersion: "binaryreplay.dataset.v1"; network: string; chainId: string; marketId: string; symbol: string; asset: string; interval: string | null; tradingStart: string; expiry: string; resolutionStatus: string; winningOutcome: number | null; sourceCounts: { orders: string; fills: string; candles: string; resolutionEvents: string }; eventCount: string; captureGaps: readonly { reason: string; fromBlock: string | null; toBlock: string | null; detectedAt: string }[]; coverage: { start: string; end: string; complete: boolean; notes: readonly string[] }; contentHashes: Record<string, string> };
export type DatasetEnvelope = { manifest: ReplayDatasetManifest; generatedAt: string; datasetHash: string };
type Canonical = null | boolean | string | number | Canonical[] | { [key: string]: Canonical };

/** Stable JSON: object keys are lexicographically sorted, arrays retain their explicit semantic order. */
export function canonicalize(value: unknown): Canonical {
  if (value === null || typeof value === "boolean" || typeof value === "string") return value;
  if (typeof value === "number") { if (!Number.isFinite(value)) throw new Error("Canonical datasets cannot contain non-finite numbers"); return value; }
  if (typeof value === "bigint") return value.toString();
  if (Array.isArray(value)) return value.map(canonicalize);
  if (typeof value === "object") return Object.fromEntries(Object.keys(value as object).sort().map((key) => [key, canonicalize((value as Record<string, unknown>)[key])])) as Canonical;
  throw new Error(`Unsupported canonical value: ${typeof value}`);
}
export function canonicalSerialize(value: unknown) { return JSON.stringify(canonicalize(value)); }
export function sha256(value: unknown) { return createHash("sha256").update(canonicalSerialize(value), "utf8").digest("hex"); }
/** `generatedAt` and `datasetHash` are intentionally excluded: only `manifest` is hashed. */
export function finalizeDataset(manifest: ReplayDatasetManifest, generatedAt = new Date().toISOString()): DatasetEnvelope { return { manifest, generatedAt, datasetHash: sha256(manifest) }; }
