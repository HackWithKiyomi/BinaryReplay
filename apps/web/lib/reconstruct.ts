import { database, findReplayDataset, replayDatasets } from "@binaryreplay/db";
import { assessCaptureQuality, finalizeDataset, sha256, type CaptureQuality, type ReplayDatasetManifest } from "@binaryreplay/replay";
import type { BinaryMarket, FillRow, OrderRow } from "@somnia-chain/markets-sdk";
import { dreamdex, EventContractDiscoveryError, toEventContractRecord } from "./dreamdex";

const PAGE_SIZE = 500;
const MAX_HISTORY_ROWS = 5_000;
type SourceCapture = { market: ReturnType<typeof toEventContractRecord>; openingPrice: string | null; resolution: unknown; fills: FillRow[]; candles: unknown[]; ordersByOwner: Record<string, OrderRow[]> };
export type HistoricalDataset = { id: string; marketId: `0x${string}`; capturedAt: string; integrityHash: string; datasetHash: string; manifest: ReplayDatasetManifest; quality: CaptureQuality; source: SourceCapture; derived: { replayEvents: { sequence: number; timestamp: string; kind: "fill" | "candle" | "resolution"; sourceId: string }[] } };

function inWindow(timestamp: string, market: BinaryMarket) { const value = Number(timestamp); return value >= Number(market.tradingStart) && value <= Number(market.expiry); }
function stableMarketRow<T extends { market: string; timestamp?: string; placedAtTimestamp?: string }>(row: T, market: BinaryMarket) { return row.market.toLowerCase() === market.marketId.toLowerCase() && inWindow(row.timestamp ?? row.placedAtTimestamp ?? "0", market); }

async function allFills(client: ReturnType<typeof dreamdex>["client"], market: BinaryMarket) {
  const rows: FillRow[] = [];
  for (let offset = 0; offset < MAX_HISTORY_ROWS; offset += PAGE_SIZE) { const page = await client.getFills(market.poolAddress, { since: Number(market.tradingStart), until: Number(market.expiry), limit: PAGE_SIZE, offset }); rows.push(...page.filter((row) => stableMarketRow(row, market))); if (page.length < PAGE_SIZE) break; }
  return rows.sort((a, b) => Number(a.timestamp) - Number(b.timestamp));
}
async function ownerOrders(client: ReturnType<typeof dreamdex>["client"], owner: string, market: BinaryMarket) {
  const rows: OrderRow[] = [];
  for (let offset = 0; offset < MAX_HISTORY_ROWS; offset += PAGE_SIZE) { const page = await client.getOrders(owner, { pool: market.poolAddress, limit: PAGE_SIZE, offset }); rows.push(...page.filter((row) => stableMarketRow(row, market))); if (page.length < PAGE_SIZE) break; }
  return rows.sort((a, b) => Number(a.placedAtTimestamp) - Number(b.placedAtTimestamp));
}

/** Immutable, target-window reconstruction. Raw SDK records stay under `source`; replay state is derived separately. */
export async function reconstructHistoricalDataset(marketId: `0x${string}`, owners: string[] = []): Promise<HistoricalDataset> {
  const exchange = dreamdex();
  try {
    const market = await exchange.client.getBinaryMarket(marketId);
    if (!market) throw new EventContractDiscoveryError(`Binary market ${marketId} was not found`);
    if (Number(market.expiry) > Math.floor(Date.now() / 1000)) throw new EventContractDiscoveryError("Only expired Event Contract windows may be reconstructed as historical datasets");
    const [openingPrices, resolution, fills, candles, ...orders] = await Promise.all([
      exchange.client.getOpeningPrices([market.marketId]), exchange.client.getMarketResolution(market.marketId), allFills(exchange.client, market),
      exchange.client.getCandles(market.poolAddress, 60, { from: Number(market.tradingStart), to: Number(market.expiry), limit: MAX_HISTORY_ROWS }).then((rows) => rows.filter((row) => Number(row.bucketStart) >= Number(market.tradingStart) && Number(row.bucketStart) <= Number(market.expiry))),
      ...owners.map((owner) => ownerOrders(exchange.client, owner, market))
    ]);
    const source: SourceCapture = { market: toEventContractRecord(market), openingPrice: openingPrices[market.marketId.toLowerCase()] ?? null, resolution, fills, candles, ordersByOwner: Object.fromEntries(owners.map((owner, index) => [owner, orders[index]])) };
    const replayEvents = [...fills.map((fill) => ({ timestamp: fill.timestamp, kind: "fill" as const, sourceId: fill.id })), ...candles.map((candle) => ({ timestamp: candle.bucketStart, kind: "candle" as const, sourceId: `candle:${candle.bucketStart}` })), ...(resolution.events as { id: string; timestamp: string }[]).filter((event) => inWindow(event.timestamp, market)).map((event) => ({ timestamp: event.timestamp, kind: "resolution" as const, sourceId: event.id }))].sort((a, b) => Number(a.timestamp) - Number(b.timestamp)).map((event, sequence) => ({ ...event, sequence }));
    const quality = assessCaptureQuality([{ key: "marketMetadata", status: "verified", detail: "Typed market row was retrieved by marketId." }, { key: "orders", status: owners.length ? "verified" : "unknown", detail: owners.length ? "Only explicitly configured owner histories are available from the SDK." : "The SDK exposes historical orders by owner; no owners were supplied." }, { key: "fills", status: fills.length < MAX_HISTORY_ROWS ? "verified" : "unknown", detail: fills.length < MAX_HISTORY_ROWS ? "All paged fills within the target market window were retrieved." : "Fill retrieval reached the configured safety cap." }, { key: "candles", status: candles.length < MAX_HISTORY_ROWS ? "verified" : "unknown", detail: candles.length < MAX_HISTORY_ROWS ? "All returned 60-second buckets were window-filtered." : "Candle retrieval reached the configured safety cap." }, { key: "lifecycle", status: resolution.events.length || market.status ? "verified" : "unknown", detail: "Lifecycle comes from typed market status and resolution events." }, { key: "resolution", status: market.status === "Finalized" || market.status === "Resolved" || market.status === "Voided" ? "verified" : "unknown", detail: "Resolution is verified only for terminal market status." }, { key: "knownGaps", status: "unknown", detail: "Historical indexer reconstruction has no live-capture gap ledger unless a capture session is attached." }]);
    const manifest: ReplayDatasetManifest = { formatVersion: "binaryreplay.dataset.v1", network: "Somnia Shannon", chainId: "50312", marketId: market.marketId, symbol: toEventContractRecord(market).symbol, asset: market.asset, interval: market.interval ?? null, tradingStart: market.tradingStart, expiry: market.expiry, resolutionStatus: market.status, winningOutcome: market.winningOutcome, sourceCounts: { orders: String(Object.values(source.ordersByOwner).flat().length), fills: String(fills.length), candles: String(candles.length), resolutionEvents: String(resolution.events.length) }, eventCount: String(replayEvents.length), captureGaps: [], coverage: { start: market.tradingStart, end: market.expiry, complete: quality.grade === "COMPLETE", notes: quality.checks.filter((check) => check.status !== "verified").map((check) => check.detail) }, contentHashes: { market: sha256(source.market), openingPrice: sha256(source.openingPrice), resolution: sha256(source.resolution), fills: sha256(source.fills), candles: sha256(source.candles), orders: sha256(source.ordersByOwner), replayEvents: sha256(replayEvents) } };
    const envelope = finalizeDataset(manifest); const capturedAt = envelope.generatedAt;
    return { id: `${market.marketId.slice(2, 14)}-${envelope.datasetHash.slice(0, 12)}`, marketId: market.marketId, capturedAt, integrityHash: envelope.datasetHash, datasetHash: envelope.datasetHash, manifest, quality, source, derived: { replayEvents } };
  } catch (cause) { if (cause instanceof EventContractDiscoveryError) throw cause; throw new EventContractDiscoveryError(`Historical reconstruction failed for ${marketId}`, cause); }
  finally { exchange.close(); }
}

/** Writes immutable source JSON and separately-derived replay JSON. Replay code never updates `source`. */
export async function persistHistoricalDataset(dataset: HistoricalDataset) {
  // The server recomputes this identity; callers cannot choose a source hash.
  if (finalizeDataset(dataset.manifest).datasetHash !== dataset.datasetHash || dataset.integrityHash !== dataset.datasetHash) throw new Error("Dataset integrity verification failed");
  const db = database();
  await db.insert(replayDatasets).values({ id: dataset.id, marketId: dataset.marketId, capturedAt: new Date(dataset.capturedAt), integrityHash: dataset.integrityHash, source: dataset.source, derived: { ...dataset.derived, manifest: dataset.manifest, quality: dataset.quality, datasetHash: dataset.datasetHash } }).onConflictDoNothing();
  return dataset.id;
}
export async function getPersistedDataset(id: string) { return findReplayDataset(id); }
