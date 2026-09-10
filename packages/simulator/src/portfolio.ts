import type { IntentAction } from "@binaryreplay/strategies";

export type Outcome = "UP" | "DOWN";
export type Settlement =
  | { status: "Open" }
  | { status: "Resolved"; winningOutcome: Outcome; payoutPerShare: bigint }
  | { status: "Voided"; payoutPerShare: bigint };

export type Position = { quantity: bigint; costBasis: bigint };
export type PortfolioState = {
  initialCapital: bigint;
  availableCapital: bigint;
  realizedPnl: bigint;
  up: Position;
  down: Position;
};
export type PortfolioFill = { action: IntentAction; quantity: bigint; notional: bigint };
export type PortfolioResult = { state: PortfolioState; accepted: boolean; reason?: string };
export type SettlementResult = { settlementApplied: boolean; settlementPnl: bigint | null; finalEquity: bigint | null; state: PortfolioState; reason?: string };

const zeroPosition = (): Position => ({ quantity: 0n, costBasis: 0n });
export const createPortfolio = (initialCapital: bigint): PortfolioState => ({ initialCapital, availableCapital: initialCapital, realizedPnl: 0n, up: zeroPosition(), down: zeroPosition() });
const positionFor = (state: PortfolioState, action: IntentAction) => action.endsWith("UP") ? state.up : state.down;
const withPosition = (state: PortfolioState, action: IntentAction, position: Position): PortfolioState => action.endsWith("UP") ? { ...state, up: position } : { ...state, down: position };

/** Applies a simulated execution to cash and inventory. It never writes source/replay data. */
export function applyPortfolioFill(state: PortfolioState, fill: PortfolioFill): PortfolioResult {
  if (fill.action === "HOLD" || fill.action === "CANCEL" || fill.quantity <= 0n || fill.notional < 0n) return { state, accepted: false, reason: "Not an executable portfolio fill" };
  const buy = fill.action.startsWith("BUY");
  const position = positionFor(state, fill.action);
  if (buy) {
    if (state.availableCapital < fill.notional) return { state, accepted: false, reason: "Insufficient available capital" };
    return { accepted: true, state: withPosition({ ...state, availableCapital: state.availableCapital - fill.notional }, fill.action, { quantity: position.quantity + fill.quantity, costBasis: position.costBasis + fill.notional }) };
  }
  if (position.quantity < fill.quantity) return { state, accepted: false, reason: "Cannot sell more contracts than the held position" };
  const releasedCost = position.costBasis * fill.quantity / position.quantity;
  const nextPosition = { quantity: position.quantity - fill.quantity, costBasis: position.costBasis - releasedCost };
  return { accepted: true, state: withPosition({ ...state, availableCapital: state.availableCapital + fill.notional, realizedPnl: state.realizedPnl + fill.notional - releasedCost }, fill.action, nextPosition) };
}

/** Event contracts pay `payoutPerShare` only to the resolved winner; a void refunds both outcome positions at that configured value. */
export function settlePortfolio(state: PortfolioState, settlement: Settlement): SettlementResult {
  if (settlement.status === "Open") return { state, settlementApplied: false, settlementPnl: null, finalEquity: null, reason: "Market is not finalized; no settlement outcome is invented" };
  if (settlement.payoutPerShare < 0n) return { state, settlementApplied: false, settlementPnl: null, finalEquity: null, reason: "Settlement payout must be non-negative" };
  const winningQuantity = settlement.status === "Voided" ? state.up.quantity + state.down.quantity : settlement.winningOutcome === "UP" ? state.up.quantity : state.down.quantity;
  const payout = winningQuantity * settlement.payoutPerShare;
  const finalEquity = state.availableCapital + payout;
  return { state: { ...state, availableCapital: finalEquity, up: zeroPosition(), down: zeroPosition() }, settlementApplied: true, settlementPnl: finalEquity - state.initialCapital - state.realizedPnl, finalEquity };
}
