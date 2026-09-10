"use client";

import { useEffect, useMemo, useState } from "react";

type Dataset = { id: string; marketId: string; integrityHash: string; source: any; derived: any; quality?: any };
const speeds = [0.25, 0.5, 1, 2, 5, 10, 50, 100];

export function ReplayWorkbench({ dataset }: { dataset: Dataset }) {
  const events = dataset.derived?.replayEvents ?? [];
  const fills = dataset.source?.fills ?? [];
  const sourceBook = dataset.source?.bookSnapshots?.at(-1) ?? dataset.source?.book ?? null;
  const [cursor, setCursor] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [strategy, setStrategy] = useState("probability-threshold");
  const [quantity, setQuantity] = useState("1000000");
  const [threshold, setThreshold] = useState("500");
  const [latencyMs, setLatencyMs] = useState("0");
  const [capitalUnits, setCapitalUnits] = useState("1");
  const event = events[cursor];
  const quality = dataset.derived?.quality ?? dataset.quality;
  const metrics = dataset.derived?.runMetrics ?? null;
  const latencyComparison = dataset.derived?.latencyComparison ?? [];
  const liquidityComparison = dataset.derived?.liquidityComparison ?? [];
  const metricFields = ["initialCapital", "finalEquity", "pnl", "returnBps", "intentCount", "orderCount", "fillCount", "fillRateBps", "partialFillRateBps", "rejectionRateBps", "averageEntry", "averageSlippageBps", "maximumDrawdown", "turnover", "capitalUtilizationBps", "latencyImpact", "settlementAdjustedPnl"];
  // UI-only coordinates; deterministic replay/execution math stays bigint.
  const points = useMemo(() => fills.slice(0, 80).reverse().map((fill: any, index: number) => `${index * 4},${100 - Math.min(95, Number(fill.fillPrice ?? fill.price ?? 0) % 100)}`).join(" "), [fills]);

  useEffect(() => {
    if (!playing || cursor >= events.length - 1) return;
    const timer = window.setInterval(() => setCursor((value) => Math.min(events.length - 1, value + 1)), Math.max(35, 700 / speed));
    return () => window.clearInterval(timer);
  }, [playing, speed, cursor, events.length]);

  const seek = (next: number) => setCursor(Math.max(0, Math.min(events.length - 1, next)));
  const jump = (predicate: (item: any) => boolean) => {
    const next = events.findIndex((item: any, index: number) => index > cursor && predicate(item));
    seek(next === -1 ? events.length - 1 : next);
  };

  return <main className="page replay">
    <p className="eyebrow">Observed source data / derived replay state</p>
    <div className="replayHead"><div><h1>{dataset.source?.market?.symbol ?? dataset.marketId}</h1><p className="lead">{dataset.source?.market?.asset ?? "Event Contract"} · {dataset.source?.market?.interval ?? "window"} · {dataset.source?.market?.tradingStart} → {dataset.source?.market?.expiry}</p></div><span className={`quality ${quality?.grade?.toLowerCase() ?? "partial"}`}>{quality?.grade ?? "PARTIAL"}</span></div>
    <section className="replayGrid">
      <article className="card chart"><small>OBSERVED SOURCE · PROBABILITY / FILL PRICE</small><svg viewBox="0 0 320 110" preserveAspectRatio="none"><polyline points={points || "0,100 320,100"} /></svg><div className="clock">VIRTUAL CLOCK <b>{event?.timestamp ?? dataset.source?.market?.tradingStart}</b></div><input aria-label="Timeline scrubber" type="range" min="0" max={Math.max(0, events.length - 1)} value={cursor} onChange={(input) => seek(Number(input.target.value))} /><div className="controls"><button onClick={() => setPlaying(!playing)}>{playing ? "Pause" : "Play"}</button><button onClick={() => seek(cursor - 1)}>Step</button><button onClick={() => jump((item) => item.kind === "fill")}>Next fill</button><button onClick={() => jump((item) => item.kind === "lock")}>Market lock</button><button onClick={() => seek(events.length - 1)}>Final event</button><button onClick={() => { setPlaying(false); seek(0); }}>Restart</button><select aria-label="Playback speed" value={speed} onChange={(input) => setSpeed(Number(input.target.value))}>{speeds.map((value) => <option value={value} key={value}>{value}x</option>)}</select></div></article>
      <article className="card"><small>RECONSTRUCTED / LIVE BOOK</small><h3>Visible order book</h3>{sourceBook ? <><div className="metric"><span>Snapshot timestamp</span><span>{sourceBook.timestamp ?? "observed"}</span></div><div className="metric"><span>Bid levels</span><span>{sourceBook.bids?.length ?? 0}</span></div><div className="metric"><span>Ask levels</span><span>{sourceBook.asks?.length ?? 0}</span></div></> : <p className="muted">No order-book snapshot was returned by this data source. No missing depth is inferred.</p>}<div className="metric"><span>Observed fills</span><span>{fills.length}</span></div><div className="metric"><span>Final outcome</span><span>{dataset.source?.market?.resolution?.winningOutcome ?? "unavailable"}</span></div></article>
    </section>
    <section className="replayGrid">
      <article className="card"><small>OBSERVED SOURCE · TRADE TAPE</small>{fills.slice(0, 8).map((fill: any) => <div className="metric" key={fill.id}><span>{fill.timestamp}</span><span>{fill.fillPrice ?? fill.price} · {fill.quantity}</span></div>)}{!fills.length && <p className="muted">No observed fills in this capture.</p>}</article>
      <article className="card"><small>STRATEGY LAB · INTENTS ONLY</small><select aria-label="Reference strategy" value={strategy} onChange={(input) => setStrategy(input.target.value)}><option value="probability-threshold">Probability Threshold</option><option value="book-imbalance">Book Imbalance</option><option value="momentum">Momentum</option><option value="mean-reversion">Mean Reversion</option><option value="passive-maker">Passive Maker</option></select><input aria-label="Strategy quantity" value={quantity} onChange={(input) => setQuantity(input.target.value)} /><input aria-label="Strategy threshold basis points" value={threshold} onChange={(input) => setThreshold(input.target.value)} /><p className="muted">{strategy}; quantity {quantity}; threshold {threshold} bps. Configuration emits deterministic intents. The execution simulator, not the strategy, decides fills.</p></article>
    </section>
    <section className="replayGrid"><article className="card"><small>DERIVED EVENT STREAM</small>{events.slice(Math.max(0, cursor - 4), cursor + 5).map((item: any) => <div className={item === event ? "metric active" : "metric"} key={`${item.sequence}-${item.sourceId}`}><span>{item.timestamp} · {item.kind}</span><span>{item.sourceId}</span></div>)}</article><article className="card"><small>SIMULATOR</small><p className="muted">Fixed-point matching models visible depth, latency, ticks, lots, expiry, slippage, and partial fills. Strategy signals never become fills automatically.</p></article></section>
    <section className="card"><small>RUN METRICS · DETERMINISTIC, SETTLEMENT-AWARE</small>{metrics ? <div className="replayGrid">{metricFields.map((field) => <div className="metric" key={field}><span>{field}</span><span>{String(metrics[field] ?? "unavailable")}</span></div>)}</div> : <p className="muted">Metrics appear after a simulated run. Unfinalized markets intentionally do not report final equity, return, or settlement-adjusted PnL.</p>}</section>
    <section className="replayGrid"><article className="card"><small>LATENCY LAB · SAME DATASET, SAME STRATEGY</small><div className="controls">{["0", "100", "250", "500", "1000", "2000"].map((latency) => <button className={latency === latencyMs ? "active" : ""} onClick={() => setLatencyMs(latency)} key={latency}>{latency} ms</button>)}</div>{latencyComparison.length ? latencyComparison.map((row: any) => <div className="metric" key={row.latencyMs}><span>{row.latencyMs} ms · fill {row.fillRateBps} bps · slip {row.averageSlippageBps ?? "n/a"}</span><span>PnL {row.pnl ?? "n/a"} · missed {row.missedFills}</span></div>) : <p className="muted">Selected latency: {latencyMs} ms. PnL, return, fill rate, slippage, and missed fills are compared only after replaying against captured/reconstructed depth. No result is shown when that depth is unavailable.</p>}</article><article className="card"><small>LIQUIDITY / DEPTH STRESS · TEST COLLATERAL UNITS</small><div className="controls">{["1", "5", "10", "25", "50", "100", "500"].map((capital) => <button className={capital === capitalUnits ? "active" : ""} onClick={() => setCapitalUnits(capital)} key={capital}>{capital}</button>)}</div>{liquidityComparison.length ? liquidityComparison.map((row: any) => <div className="metric" key={row.initialCapital}><span>{row.initialCapital} · fill {row.fillRateBps} bps · slip {row.averageSlippageBps ?? "n/a"}</span><span>PnL {row.pnl ?? "n/a"} · use {row.capitalUtilizationBps} bps</span></div>) : <p className="muted">Selected capital: {capitalUnits} test collateral units. Replays use identical source liquidity and strategy configuration. Simulated performance does not guarantee future performance.</p>}</article></section>
    <section className="card integrity"><small>DATASET INTEGRITY</small><div className="metric"><span>marketId</span><span>{dataset.marketId}</span></div><div className="metric"><span>dataset hash</span><span>{dataset.integrityHash}</span></div>{quality?.checks?.map((check: any) => <div className="metric" key={check.key}><span>{check.key}</span><span>{check.status}</span></div>)}</section>
  </main>;
}
