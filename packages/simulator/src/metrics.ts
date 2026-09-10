import type { SimulatedExecution } from "./index";
import type { PortfolioState, SettlementResult } from "./portfolio";

export type RunMetrics = { initialCapital: bigint; finalEquity: bigint | null; pnl: bigint | null; returnBps: bigint | null; intentCount: bigint; orderCount: bigint; fillCount: bigint; fillRateBps: bigint; partialFillRateBps: bigint; rejectionRateBps: bigint; averageEntry: bigint | null; averageSlippageBps: bigint | null; maximumDrawdown: bigint; turnover: bigint; capitalUtilizationBps: bigint; latencyImpact: bigint | null; settlementAdjustedPnl: bigint | null };
export type MetricsInput = { initialCapital: bigint; portfolio: PortfolioState; settlement: SettlementResult; intents: bigint; orders: bigint; executions: readonly SimulatedExecution[]; equityCurve: readonly bigint[]; baselinePnl?: bigint };
const rate = (numerator: bigint, denominator: bigint) => denominator === 0n ? 0n : numerator * 10_000n / denominator;

/** All rates are integer basis points. `null` marks a value that cannot honestly be known before finalization. */
export function calculateRunMetrics(input: MetricsInput): RunMetrics {
  const filled = input.executions.filter((item) => item.filledQuantity > 0n);
  const fillCount = BigInt(filled.reduce((sum, item) => sum + (item.fills?.length ?? 0), 0));
  const partial = input.executions.filter((item) => item.status === "PARTIALLY_FILLED");
  const rejected = input.executions.filter((item) => item.status === "REJECTED");
  const totalQuantity = filled.reduce((sum, item) => sum + item.filledQuantity, 0n);
  const totalNotional = filled.reduce((sum, item) => sum + item.notional, 0n);
  const slippageQuantity = filled.filter((item) => item.slippageBps !== null).reduce((sum, item) => sum + item.filledQuantity, 0n);
  const totalSlippage = filled.reduce((sum, item) => sum + (item.slippageBps ?? 0n) * item.filledQuantity, 0n);
  const turnover = totalNotional;
  const averageEntry = totalQuantity === 0n ? null : totalNotional / totalQuantity;
  let peak = input.initialCapital, drawdown = 0n;
  for (const equity of input.equityCurve) { if (equity > peak) peak = equity; const next = peak - equity; if (next > drawdown) drawdown = next; }
  const finalEquity = input.settlement.finalEquity;
  const pnl = finalEquity === null ? null : finalEquity - input.initialCapital;
  return { initialCapital: input.initialCapital, finalEquity, pnl, returnBps: pnl === null || input.initialCapital === 0n ? null : rate(pnl, input.initialCapital), intentCount: input.intents, orderCount: input.orders, fillCount, fillRateBps: rate(BigInt(filled.length), input.orders), partialFillRateBps: rate(BigInt(partial.length), input.orders), rejectionRateBps: rate(BigInt(rejected.length), input.orders), averageEntry, averageSlippageBps: slippageQuantity === 0n ? null : totalSlippage / slippageQuantity, maximumDrawdown: drawdown, turnover, capitalUtilizationBps: rate(turnover, input.initialCapital), latencyImpact: input.baselinePnl === undefined || pnl === null ? null : pnl - input.baselinePnl, settlementAdjustedPnl: pnl };
}
