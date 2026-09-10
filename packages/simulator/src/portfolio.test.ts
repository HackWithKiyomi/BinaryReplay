import { describe, expect, it } from "vitest";
import { applyPortfolioFill, createPortfolio, settlePortfolio } from "./portfolio";
import { calculateRunMetrics } from "./metrics";
import { finalizeRun } from "./run-identity";

describe("event-contract portfolio settlement", () => {
  it("pays only a resolved winning outcome", () => {
    const opened = applyPortfolioFill(createPortfolio(100n), { action: "BUY_UP", quantity: 2n, notional: 80n }).state;
    const settled = settlePortfolio(opened, { status: "Resolved", winningOutcome: "UP", payoutPerShare: 50n });
    expect(settled.finalEquity).toBe(120n);
    expect(settled.settlementPnl).toBe(20n);
  });
  it("makes a resolved loser worthless and a void a configured refund", () => {
    const opened = applyPortfolioFill(createPortfolio(100n), { action: "BUY_DOWN", quantity: 2n, notional: 80n }).state;
    expect(settlePortfolio(opened, { status: "Resolved", winningOutcome: "UP", payoutPerShare: 50n }).finalEquity).toBe(20n);
    expect(settlePortfolio(opened, { status: "Voided", payoutPerShare: 40n }).finalEquity).toBe(100n);
  });
  it("does not manufacture final equity for an open market", () => {
    expect(settlePortfolio(createPortfolio(100n), { status: "Open" }).finalEquity).toBeNull();
  });
});

describe("deterministic metrics", () => {
  it("calculates exact integer rates and drawdown", () => {
    const state = createPortfolio(100n);
    const settlement = settlePortfolio(state, { status: "Resolved", winningOutcome: "UP", payoutPerShare: 50n });
    const execution = { status: "PARTIALLY_FILLED", filledQuantity: 2n, notional: 80n, slippageBps: 125n, fills: [{ price: 40n, quantity: 1n }, { price: 40n, quantity: 1n }] } as any;
    const rejected = { status: "REJECTED", filledQuantity: 0n, notional: 0n, slippageBps: null, fills: [] } as any;
    const metrics = calculateRunMetrics({ initialCapital: 100n, portfolio: state, settlement, intents: 5n, orders: 4n, executions: [execution, rejected], equityCurve: [100n, 80n, 110n], baselinePnl: 3n });
    expect(metrics.fillRateBps).toBe(2500n);
    expect(metrics.partialFillRateBps).toBe(2500n);
    expect(metrics.rejectionRateBps).toBe(2500n);
    expect(metrics.averageEntry).toBe(40n);
    expect(metrics.averageSlippageBps).toBe(125n);
    expect(metrics.fillCount).toBe(2n);
    expect(metrics.maximumDrawdown).toBe(20n);
  });
});

describe("run identity", () => {
  it("reproduces strategy and run hashes from identical canonical inputs", () => {
    const input = { datasetId: "dataset", datasetHash: "dataset-hash", marketId: "market", strategyDefinitionId: "definition", strategyId: "momentum", strategyVersion: "1.0.0", strategyConfiguration: { quantity: "10", threshold: "20" }, simulatorConfiguration: { tickSize: "1", lotSize: "1" }, initialCapital: 100n, latencyMs: 250n, results: { fills: 2 }, metrics: { pnl: "3" } };
    const first = finalizeRun(input), second = finalizeRun({ ...input, strategyConfiguration: { threshold: "20", quantity: "10" } });
    expect(first.strategyHash).toBe(second.strategyHash);
    expect(first.runHash).toBe(second.runHash);
  });
});
