export type MarketLifecycle = "listed" | "trading" | "locked" | "resolved" | "voided";
export type MarketWindow = { marketId: string; symbol: string; question: string; lifecycle: MarketLifecycle; opensAt: string; locksAt: string; resolvesAt?: string; poolAddress?: `0x${string}` };
export type OrderBookLevel = { price: number; quantity: number };
export type ReplayEvent = { sequence: number; timestamp: number; marketId: string; kind: "book" | "trade" | "lifecycle"; bids?: OrderBookLevel[]; asks?: OrderBookLevel[]; lifecycle?: MarketLifecycle };
export type Dataset = { id: string; market: MarketWindow; events: ReplayEvent[]; source: "dreamdex"; capturedAt: string; integrityHash: string };
