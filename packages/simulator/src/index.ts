import type { BookLevel, StrategyIntent } from "@binaryreplay/strategies";
export * from "./portfolio.js";
export * from "./metrics.js";
export * from "./labs.js";
export * from "./run-identity.js";
export type MarketExecutionState = "Listed" | "Trading" | "Locked" | "Resolved" | "Voided";
export type ExecutionStatus = "FILLED" | "PARTIALLY_FILLED" | "NOT_FILLED" | "REJECTED" | "EXPIRED";
export type BinaryBook = { yesBids: readonly BookLevel[]; yesAsks: readonly BookLevel[]; noBids: readonly BookLevel[]; noAsks: readonly BookLevel[] };
export type ExecutionContext = { marketId: string; virtualTime: bigint; expiry: bigint; marketStatus: MarketExecutionState; tickSize: bigint; lotSize: bigint; maxSlippageBps: bigint; latencyMs: bigint; book: BinaryBook };
export type SimulatedExecution = { status: ExecutionStatus; requestedQuantity: bigint; filledQuantity: bigint; unfilledQuantity: bigint; averagePrice: bigint | null; slippageBps: bigint | null; notional: bigint; executedAt: bigint; fills: readonly { price: bigint; quantity: bigint }[]; nextBook: BinaryBook; reason?: string };
const empty = (context: ExecutionContext, intent: StrategyIntent, status: ExecutionStatus, reason: string): SimulatedExecution => ({ status, requestedQuantity: intent.quantity ?? 0n, filledQuantity: 0n, unfilledQuantity: intent.quantity ?? 0n, averagePrice: null, slippageBps: null, notional: 0n, executedAt: context.virtualTime + context.latencyMs, fills: [], nextBook: context.book, reason });
const replaceLevels = (book: BinaryBook, key: keyof BinaryBook, levels: BookLevel[]): BinaryBook => ({ ...book, [key]: levels });
/** Exact-integer order-book matching. Prices and quantities are raw fixed-point integers; no floating point is used. */
export function simulateIntent(intent: StrategyIntent, context: ExecutionContext): SimulatedExecution {
  if (intent.action === "HOLD" || intent.action === "CANCEL") return empty(context, intent, "NOT_FILLED", "Intent does not request an executable order");
  if (context.tickSize <= 0n || context.lotSize <= 0n) return empty(context, intent, "REJECTED", "Execution configuration requires positive tick and lot sizes");
  const quantity = intent.quantity ?? 0n; if (quantity <= 0n || quantity % context.lotSize !== 0n) return empty(context, intent, "REJECTED", "Quantity must be a positive lot multiple");
  const executedAt = context.virtualTime + context.latencyMs; if (executedAt >= context.expiry) return empty(context, intent, "EXPIRED", "Latency moves execution to or beyond expiry");
  if (context.marketStatus !== "Trading") return empty(context, intent, "REJECTED", `Market state ${context.marketStatus} does not accept trading`);
  const buy = intent.action === "BUY_UP" || intent.action === "BUY_DOWN"; const side = intent.action.endsWith("UP") ? "yes" : "no"; const key = `${side}${buy ? "Asks" : "Bids"}` as keyof BinaryBook; const levels = [...context.book[key]]; const best = levels[0]?.price; if (best === undefined) return empty(context, intent, "NOT_FILLED", "No visible crossing liquidity");
  if (intent.limitPrice !== undefined && intent.limitPrice % context.tickSize !== 0n) return empty(context, intent, "REJECTED", "Limit price is not tick aligned");
  let remaining = quantity, notional = 0n; const fills: { price: bigint; quantity: bigint }[] = []; const updated: BookLevel[] = [];
  for (const level of levels) { const crosses = intent.limitPrice === undefined || (buy ? level.price <= intent.limitPrice : level.price >= intent.limitPrice); if (!crosses || remaining === 0n) { updated.push(level); continue; } const take = level.quantity < remaining ? level.quantity : remaining; fills.push({ price: level.price, quantity: take }); notional += level.price * take; remaining -= take; if (level.quantity > take) updated.push({ ...level, quantity: level.quantity - take }); }
  const filled = quantity - remaining; if (filled === 0n) return empty(context, intent, "NOT_FILLED", "Limit does not cross visible depth"); const averagePrice = notional / filled; const permitted = buy ? best * (10_000n + context.maxSlippageBps) / 10_000n : best * (10_000n - context.maxSlippageBps) / 10_000n; if (buy ? averagePrice > permitted : averagePrice < permitted) return empty(context, intent, "NOT_FILLED", "Visible-book slippage exceeds configured bound"); const slippageBps = (buy ? averagePrice - best : best - averagePrice) * 10_000n / best; return { status: remaining === 0n ? "FILLED" : "PARTIALLY_FILLED", requestedQuantity: quantity, filledQuantity: filled, unfilledQuantity: remaining, averagePrice, slippageBps, notional, executedAt, fills, nextBook: replaceLevels(context.book, key, updated) };
}
