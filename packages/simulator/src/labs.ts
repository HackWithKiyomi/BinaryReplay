import type { RunMetrics } from "./metrics";

export const LATENCY_PRESETS_MS = [0n, 100n, 250n, 500n, 1000n, 2000n] as const;
export const CAPITAL_PRESETS = [1n, 5n, 10n, 25n, 50n, 100n, 500n] as const;
export type LabRun = { metrics: RunMetrics };
export type LabRunner = (input: { latencyMs: bigint; initialCapital: bigint }) => LabRun;
export type LatencyComparison = { latencyMs: bigint; pnl: bigint | null; returnBps: bigint | null; fillRateBps: bigint; averageSlippageBps: bigint | null; missedFills: bigint };
export type LiquidityComparison = { initialCapital: bigint; pnl: bigint | null; returnBps: bigint | null; fillRateBps: bigint; averageSlippageBps: bigint | null; capitalUtilizationBps: bigint };

/** Re-runs the exact caller-provided strategy/dataset configuration, varying latency only. */
export function runLatencyLab(run: LabRunner, initialCapital: bigint): readonly LatencyComparison[] {
  const baseline = run({ latencyMs: 0n, initialCapital }).metrics;
  return LATENCY_PRESETS_MS.map((latencyMs) => { const metrics = latencyMs === 0n ? baseline : run({ latencyMs, initialCapital }).metrics; return { latencyMs, pnl: metrics.pnl, returnBps: metrics.returnBps, fillRateBps: metrics.fillRateBps, averageSlippageBps: metrics.averageSlippageBps, missedFills: baseline.fillCount - metrics.fillCount }; });
}
/** Re-runs the exact caller-provided strategy/dataset configuration, varying only starting collateral. */
export function runLiquidityLab(run: LabRunner, collateralUnit: bigint, latencyMs = 0n): readonly LiquidityComparison[] {
  if (collateralUnit <= 0n) throw new Error("collateralUnit must be positive");
  return CAPITAL_PRESETS.map((units) => { const initialCapital = units * collateralUnit; const metrics = run({ latencyMs, initialCapital }).metrics; return { initialCapital, pnl: metrics.pnl, returnBps: metrics.returnBps, fillRateBps: metrics.fillRateBps, averageSlippageBps: metrics.averageSlippageBps, capitalUtilizationBps: metrics.capitalUtilizationBps }; });
}
