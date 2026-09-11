# BinaryReplay

## Tagline

Replay the market before risking the market.

## Short description

BinaryReplay is a deterministic research environment for DreamDEX Event Contracts on Somnia Shannon: it discovers genuine markets, scopes historical reconstruction to an immutable `marketId`, replays recorded events, and evaluates strategies with a precision-safe execution simulator.

## Full description

Rolling Event Contract pools are not permanent market identities. BinaryReplay preserves each contract window by `marketId`, keeps immutable source records separate from derived replay state, and makes capture gaps and unavailable order-book history visible instead of fabricating depth. Researchers can inspect live and finalized DreamDEX markets without a wallet, test typed reference strategies, compare latency and capital stress assumptions, and observe live shadow intents labelled **SIMULATED — NOT ON-CHAIN**.

## Problem and solution

Backtests often merge recycled liquidity pools, convert signals into unrealistic fills, or hide missing history. BinaryReplay scopes every historical request to the market trading window, reconstructs only from supported source data, uses deterministic fixed-point simulation, and hashes datasets and runs for repeatable verification.

## DreamDEX and Somnia

The application uses `@somnia-chain/markets-sdk` to discover live and past Binary Event Contracts, verify current on-chain state, retrieve supported historical resolution/fill/candle information, and read live order books where available. It targets Somnia Shannon, chain ID `50312`.

## Product features

- Anonymous live-market and finalized-market browsing
- Deterministic datasets, replay engine, strategies, fills, PnL, and run hashes
- Latency and liquidity/depth stress comparisons
- Read-only live shadow mode
- Proof Center and a read-only Shannon evidence report
- Optional, manually approved browser-wallet test-order flow; never automatic

## Architecture and stack

Next.js and React provide the web application. TypeScript packages isolate replay, strategy, simulator, shared types, and Drizzle/PostgreSQL persistence. DreamDEX SDK adapters are server-side. Canonical SHA-256 data and run identities provide verification.

## Real testnet evidence

See `docs/SHANNON_EVIDENCE.md` for current read-only Shannon findings, including genuine market IDs, a canonical dataset hash, replay hash, strategy hash, and run hash. No transaction is claimed unless independently verified.

## Real versus simulated disclosure

Market metadata, lifecycle, fills, candles, and book data are labelled source observations. Replay state, simulated fills, PnL, latency results, and all shadow intents are derived and are not on-chain execution.

## Links

- Public app URL: `MANUAL_REQUIRED`
- GitHub URL: `MANUAL_REQUIRED`
- Demo URL: `MANUAL_REQUIRED`

## SDK feedback, roadmap, and limitations

See `docs/SDK_FEEDBACK.md` and `docs/SHANNON_EVIDENCE.md`. Historical order-book snapshots and owner-scoped order history may not be available from the SDK; BinaryReplay displays that reduced coverage rather than inventing it. Future work includes persistently capturing more live windows and publishing optional non-custodial run attestations.
