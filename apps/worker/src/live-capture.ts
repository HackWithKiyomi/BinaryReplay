import { saveLiveCaptureRecord } from "@binaryreplay/db";
import { SOMNIA_TESTNET_ADDRESSES, SomniaMarkets, type BinaryOrderBook, type LiveFill, type LiveOrder } from "@somnia-chain/markets-sdk";
import { somniaShannon } from "@somnia-chain/markets-sdk/chains";

function dreamdex() { return new SomniaMarkets({ chain: somniaShannon, indexerUrl: process.env.DREAMDEX_INDEXER_URL || "https://dev.smk.somnia.host/v1/graphql", wsRpcUrl: process.env.SOMNIA_WS_RPC_URL || "wss://api.infra.testnet.somnia.network/ws", addresses: SOMNIA_TESTNET_ADDRESSES }); }

export type LiveCaptureRecord = { id: string; marketId: string; capturedAt: string; kind: "snapshot" | "fill" | "order" | "gap" | "stale" | "reconnected"; blockNumber?: string; payload: unknown };
export type CaptureSink = { append(record: LiveCaptureRecord): Promise<void> };
export const postgresCaptureSink: CaptureSink = { append: saveLiveCaptureRecord };
export const memoryCaptureSink = () => { const records: LiveCaptureRecord[] = []; return { records, append: async (record: LiveCaptureRecord) => { records.push(record); } }; };
const json = (value: unknown): unknown => JSON.parse(JSON.stringify(value, (_, v) => typeof v === "bigint" ? v.toString() : v));
const book = (value: BinaryOrderBook) => json(value);

/** Optional long-running observer. The SDK reconnects/backfills; this class records every detected gap rather than hiding it. */
export class LiveCaptureWorker {
  private readonly exchange = dreamdex(); private stopWatch?: () => void; private unsubscribe?: () => void; private timer?: ReturnType<typeof setInterval>;
  private lastBlock = 0; private lastEventAt = 0; private staleReported = false; private wasConnected?: boolean; private readonly seen = new Set<string>();
  constructor(private readonly config: { marketId: `0x${string}`; poolAddress: `0x${string}`; owners?: `0x${string}`[]; staleAfterMs?: number }, private readonly sink: CaptureSink = postgresCaptureSink) {}
  async start() { const client = this.exchange.client; const watched = await client.watchMarket(this.config.poolAddress); this.stopWatch = () => watched.stop(); for (const owner of this.config.owners ?? []) await client.watchUser(owner); this.unsubscribe = client.subscribeLive(() => void this.capture()); this.timer = setInterval(() => void this.checkStale(), Math.min(this.config.staleAfterMs ?? 30_000, 10_000)); await this.capture(); }
  async stop() { if (this.timer) clearInterval(this.timer); this.unsubscribe?.(); this.stopWatch?.(); this.exchange.close(); }
  private async append(record: LiveCaptureRecord) { if (this.seen.has(record.id)) return; this.seen.add(record.id); await this.sink.append(record); }
  private async gap(reason: string, payload: unknown) { const now = new Date().toISOString(); await this.append({ id: `gap:${this.config.marketId}:${reason}:${now}`, marketId: this.config.marketId, capturedAt: now, kind: "gap", payload: json(payload) }); }
  private async checkStale() { if (!this.lastEventAt || Date.now() - this.lastEventAt <= (this.config.staleAfterMs ?? 30_000) || this.staleReported) return; this.staleReported = true; await this.append({ id: `stale:${this.config.marketId}:${this.lastBlock}`, marketId: this.config.marketId, capturedAt: new Date().toISOString(), kind: "stale", blockNumber: String(this.lastBlock), payload: { lastEventAt: new Date(this.lastEventAt).toISOString(), thresholdMs: this.config.staleAfterMs ?? 30_000 } }); }
  private async capture() { const client = this.exchange.client; const health = client.getLiveStatus(); const now = new Date().toISOString(); if (this.wasConnected === false && health.wsConnected) await this.append({ id: `reconnected:${this.config.marketId}:${health.lastBlock}`, marketId: this.config.marketId, capturedAt: now, kind: "reconnected", blockNumber: String(health.lastBlock), payload: json(health) }); if (this.wasConnected === true && !health.wsConnected) await this.gap("socket-disconnected", health); if (this.lastBlock && health.lastBlock > this.lastBlock + 1) await this.gap("block-gap", { fromExclusive: this.lastBlock, toInclusive: health.lastBlock, health }); this.wasConnected = health.wsConnected; this.lastBlock = Math.max(this.lastBlock, health.lastBlock); this.lastEventAt = Date.now(); this.staleReported = false;
    const market = client.getLiveMarketByPool(this.config.poolAddress); if (!market || market.marketType !== "BINARY" || market.marketId.toLowerCase() !== this.config.marketId.toLowerCase()) { await this.gap("market-binding-mismatch", { expectedMarketId: this.config.marketId, observed: market?.id ?? null, health }); return; }
    const snapshot = { marketId: market.marketId, status: market.status, tradingStart: market.tradingStart, expiry: market.expiry, tail: health, book: book(client.getLiveBinaryOrderBookByMarket(this.config.marketId, { depth: 50 })) }; await this.append({ id: `snapshot:${this.config.marketId}:${health.lastBlock}`, marketId: this.config.marketId, capturedAt: now, kind: "snapshot", blockNumber: String(health.lastBlock), payload: snapshot });
    for (const fill of client.getLiveFills(this.config.poolAddress, { limit: 400 }).filter((row) => row.market_id.toLowerCase() === this.config.marketId.toLowerCase())) await this.append({ id: `fill:${fill.id}`, marketId: this.config.marketId, capturedAt: now, kind: "fill", blockNumber: String(fill.blockNumber), payload: json(fill satisfies LiveFill) });
    for (const owner of this.config.owners ?? []) for (const order of client.getLiveUserOrders(this.config.poolAddress, owner, { limit: 100 }).filter((row) => row.market_id.toLowerCase() === this.config.marketId.toLowerCase())) await this.append({ id: `order:${order.id}:${order.status}:${order.filledQuantity}`, marketId: this.config.marketId, capturedAt: now, kind: "order", payload: json(order satisfies LiveOrder) });
  }
}
