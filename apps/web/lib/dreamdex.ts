import { SOMNIA_TESTNET_ADDRESSES, SomniaMarkets, type BinaryMarket, type BinaryMarketStatus } from "@somnia-chain/markets-sdk";
import { somniaShannon } from "@somnia-chain/markets-sdk/chains";

const INDEXER_URL = process.env.DREAMDEX_INDEXER_URL || "https://dev.smk.somnia.host/v1/graphql";
const WS_RPC_URL = process.env.SOMNIA_WS_RPC_URL || "wss://api.infra.testnet.somnia.network/ws";
const CHAIN_STATUS: Record<number, BinaryMarketStatus> = { 0: "Listed", 1: "Trading", 2: "Locked", 3: "Settling", 4: "Resolved", 5: "Voided" };

export type EventContractRecord = {
  marketId: `0x${string}`; symbol: string; asset: string; interval: string | null; intervalSec: string | null;
  outcomes: readonly [{ index: 0; label: "YES"; tokenId: string }, { index: 1; label: "NO"; tokenId: string }];
  tradingStart: string; expiry: string; venue: { operatorId: number | null; venueId: `0x${string}` | null };
  pool: { address: `0x${string}`; nonce: string | null }; status: BinaryMarketStatus;
  resolution: { resolved: boolean; voided: boolean; winningOutcome: number | null; payoutNumerators: string[] | null; payoutDenominator: string | null; resolvedAtBlock: string | null; resolvedAtTimestamp: string | null };
};
export class EventContractDiscoveryError extends Error { constructor(message: string, readonly cause?: unknown) { super(message); this.name = "EventContractDiscoveryError"; } }

/** One isolated Event Contract SDK client. No spot-market discovery path is used. */
export function dreamdex() {
  return new SomniaMarkets({ chain: somniaShannon, indexerUrl: INDEXER_URL, wsRpcUrl: WS_RPC_URL, addresses: SOMNIA_TESTNET_ADDRESSES });
}

function isTerminal(status: BinaryMarketStatus) { return status === "Finalized" || status === "Resolved" || status === "Voided"; }
export function toEventContractRecord(market: BinaryMarket): EventContractRecord {
  return { marketId: market.marketId, symbol: `${market.asset}-${market.interval ?? "EVENT"}-${market.marketId.slice(2, 10)}`, asset: market.asset, interval: market.interval ?? null, intervalSec: market.intervalSec ?? null, outcomes: [{ index: 0, label: "YES", tokenId: market.yesTokenId }, { index: 1, label: "NO", tokenId: market.noTokenId }], tradingStart: market.tradingStart, expiry: market.expiry, venue: { operatorId: market.operatorId ?? null, venueId: market.venueId ?? null }, pool: { address: market.poolAddress, nonce: market.nonce ?? null }, status: market.status, resolution: { resolved: isTerminal(market.status), voided: market.voided, winningOutcome: market.winningOutcome, payoutNumerators: market.payoutNumerators ?? null, payoutDenominator: market.payoutDenominator ?? null, resolvedAtBlock: market.resolvedAtBlock, resolvedAtTimestamp: market.resolvedAtTimestamp } };
}

export async function discoverLiveEventContracts(limit = 20): Promise<EventContractRecord[]> {
  const exchange = dreamdex();
  try {
    const activeStates: BinaryMarketStatus[] = ["Listed", "Trading", "Locked", "Settling"];
    const pages = await Promise.all(activeStates.map((status) => exchange.client.listLiveBinaryMarkets({ limit, status, orderBy: "closingSoon" })));
    const unique = new Map(pages.flat().filter((market) => !isTerminal(market.status)).map((market) => [market.marketId, market]));
    return [...unique.values()].sort((a, b) => {
      const left = BigInt(a.expiry);
      const right = BigInt(b.expiry);
      return left < right ? -1 : left > right ? 1 : 0;
    }).slice(0, limit).map(toEventContractRecord);
  }
  catch (cause) { throw new EventContractDiscoveryError("Shannon live Event Contract discovery failed", cause); }
  finally { exchange.close(); }
}

export async function discoverHistoricalEventContracts(limit = 20, offset = 0): Promise<EventContractRecord[]> {
  const exchange = dreamdex();
  try { return (await exchange.client.listPastBinaryMarkets({ limit, offset, orderBy: "newest" })).map(toEventContractRecord); }
  catch (cause) { throw new EventContractDiscoveryError("Shannon historical Event Contract discovery failed", cause); }
  finally { exchange.close(); }
}

/** Server-side historical Event Contract total; used for archive pagination without loading every window. */
export async function countHistoricalEventContracts() {
  const exchange = dreamdex();
  try { return await exchange.client.countBinaryMarkets({ phase: "past" }); }
  catch (cause) { throw new EventContractDiscoveryError("Shannon historical Event Contract count failed", cause); }
  finally { exchange.close(); }
}

/** Chain-head verification. Use immediately before optional wallet order submission. */
export async function verifyEventContract(marketId: `0x${string}`) {
  const exchange = dreamdex();
  try { const state = await exchange.client.getMarketOnchain(marketId); return { marketId, verifiedAt: new Date().toISOString(), status: CHAIN_STATUS[state.status] ?? "Listed", acceptsTrading: state.status === 1, finalized: state.finalized, resolved: state.isResolved, voided: state.isVoided, pool: state.pool, expiry: state.expiry.toString() }; }
  catch (cause) { throw new EventContractDiscoveryError(`On-chain verification failed for ${marketId}`, cause); }
  finally { exchange.close(); }
}
