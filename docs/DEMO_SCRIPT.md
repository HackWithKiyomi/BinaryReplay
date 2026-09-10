# BinaryReplay demo script (2:40 target)

## 0:00–0:15 — Problem

“Binary-market research is easy to overstate when a recycled pool is confused with a market, history has gaps, and a strategy signal is treated as a fill. BinaryReplay makes those boundaries visible.” Show landing page.

## 0:15–0:35 — Live DreamDEX market

Open Live. “These are typed Shannon DreamDEX Event Contracts. Notice the `marketId`, status, and last-updated indicator. If connectivity fails, the page does not pretend cached data is live.”

## 0:35–0:52 — Archive and dataset

Open Archive, choose a finalized market, then open its replay. “History is scoped to this contract’s own trading window—not every generation of its pool. The dataset hash and quality label make coverage inspectable.”

## 0:52–1:18 — Replay

Scrub timeline, step through a fill, then play at 10x. “Observed source records and reconstructed state are labelled separately. We do not invent book depth that was never captured.”

## 1:18–1:40 — Strategy and execution

Select a reference strategy and configure quantity/threshold. “Strategies emit intents only. The fixed-point simulator applies tick and lot constraints, visible liquidity, partial fills, latency, and expiry.” Show tape and metrics.

## 1:40–1:58 — Latency/depth research

Select 0 ms then 1000 ms, then a larger collateral preset. “All non-latency variables stay fixed. This exposes strategies that depend on unrealistic speed or depth. It is research, not a profitability claim.”

## 1:58–2:17 — Runs and shadow

Open Runs, then Shadow. “Runs compare canonical inputs, parameters, and hashable results—not a leaderboard. Shadow mode reads a real Trading market and labels every decision SIMULATED — NOT ON-CHAIN.”

## 2:17–2:35 — Proof

Open Proof. “This is evidence only: network, chain ID, SDK, dataset/run hashes, quality, and—only if actually present—verified test-order evidence.”

## 2:35–2:40 — Close

“BinaryReplay turns Event Contract data into reproducible research with honest data provenance and execution assumptions.”

## Screenshot checklist

- [ ] Landing
- [ ] Live market with last-updated status
- [ ] Archive finalized market
- [ ] Replay timeline and chart
- [ ] Strategy Lab controls
- [ ] Latency comparison
- [ ] Run results
- [ ] Shadow mode
- [ ] Proof Center
- [ ] Mobile interface at 390px

Use only real evidence in recordings. If live data is unavailable, show the product’s honest unavailable state rather than substituting fixtures.
