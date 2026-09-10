# BinaryReplay

**Deterministic replay, backtesting, and live shadow execution for DreamDEX Event Contracts.**

Live app: `MANUAL_REQUIRED` · Demo video: `MANUAL_REQUIRED` · Screenshots: `MANUAL_REQUIRED`

BinaryReplay separates genuine Shannon/DreamDEX observations from derived replay state, then evaluates strategies and execution assumptions without claiming profitability.

## Problem and solution

Binary Event Contract data is window-specific even when pools recycle. BinaryReplay preserves `marketId`, scopes history to its trading window, hashes canonical datasets, and makes gaps visible. It offers replay, simulation, research comparisons, read-only shadow mode, and an optional manually approved Shannon test order.

## Key features

- Real SDK-based live/historical discovery and read-only Shannon validation
- Canonical datasets, source/derived separation, quality labels, and deterministic replay
- Typed strategy intents, bigint execution simulation, portfolio/metrics, stress labs
- Run/proof hashes, research comparison, shadow mode, and optional browser-wallet test order

## Architecture and stack

Next.js/TypeScript UI, worker observers, PostgreSQL/Drizzle persistence, React-free replay/simulator/strategy packages, and the installed DreamDEX SDK on Somnia Shannon (50312). See [architecture](docs/ARCHITECTURE.md).

## Setup, data, and verification

Use [setup](docs/SETUP.md), apply database migrations, then run `pnpm validate`. Run `pnpm smoke` separately for read-only Shannon verification. Environment values include `DATABASE_URL`, optional DreamDEX RPC/indexer URLs, and server-only `RECONSTRUCTION_WRITE_TOKEN`; never expose secrets as `NEXT_PUBLIC_*`.

### Database setup

Create PostgreSQL, set `DATABASE_URL` locally, and apply `packages/db/migrations` in numeric order. Source data is immutable; derived datasets/runs are separate records.

### Test commands

`pnpm validate` runs typecheck, security lint, deterministic tests, and production build. `pnpm smoke` performs only network-dependent read-only Shannon checks.

## DreamDEX and Somnia integration

DreamDEX SDK 0.28.1 supplies typed Event Contract discovery, market lifecycle, historical records, live book/fill observations, faucet support, and an external browser-wallet trader. Somnia Shannon is the target network (chain ID 50312). See [integration details](docs/DREAMDEX_INTEGRATION.md).

## Real versus simulated data

Market metadata, fills, candles, books, lifecycle, and receipts are observed records. Replay events, strategy intents, simulated orders/fills, PnL, and lab outputs are derived and labelled as such. A simulation is never evidence of an on-chain trade.

## Deployment

Public deployment URL: `MANUAL_REQUIRED`. Follow [deployment instructions](docs/DEPLOYMENT.md); no service or contract address is claimed until verified.

## Security and limitations

The application never needs a seed phrase or server private key. Real data is labelled observed; simulated fills/results are not on-chain. Historical coverage depends on SDK/indexer surfaces, shadow mode does not trade, and optional manual orders require explicit wallet confirmation. See [security](docs/SECURITY.md), [limitations](docs/SUBMISSION.md), and [SDK feedback](docs/SDK_FEEDBACK.md).

**Replay the market before risking the market.** BinaryReplay is a deterministic replay, backtesting, execution-simulation, and shadow-observation workstation for DreamDEX Event Contracts on Somnia Shannon (chain 50312).

## Product scope

Timeline Replay → Strategy Lab → Execution Simulator → Latency + Liquidity Stress Tests → Live Shadow Mode → Optional Real Shannon Test Order → Proof / Verification.

## Quick start

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`. `GET /api/markets/live` returns non-terminal current Event Contract windows; `GET /api/markets/archive` returns historical/finalized windows. Both call the SDK's binary/Event Contract surface and never fall back to generated prices or mock market records. Add `?verify=true` to the live endpoint to execute a fresh on-chain verification per returned `marketId`.

## Safety and market identity

- A market is always keyed by `marketId`, never only by `poolAddress`; DreamDEX pools can be recycled across rolling windows.
- Historical captures must preserve sequence, timestamp, `marketId`, and an integrity hash before replay.
- The indexed status is for discovery only. Any optional write must call `getMarketOnchain(marketId)` immediately beforehand and only accepts chain status `1` (`Trading`).
- Shadow mode is read-only. This repository does not hold private keys or make an order automatically.

## Historical reconstruction

`POST /api/datasets/reconstruct` accepts a historical `marketId`, optional known wallet owners, and `persist: true`. It reads the SDK's past-market, opening-price, resolution, fills, candle, and owner-order surfaces. Every pool-scoped query is bounded to that market's own `tradingStart`/`expiry`, and fills/orders are then filtered again by their stable `marketId`. This protects rolling markets from recycled-pool contamination.

Apply [`packages/db/migrations/0000_replay_datasets.sql`](./packages/db/migrations/0000_replay_datasets.sql) to PostgreSQL before requesting persistence. The immutable `source` JSON and derived replay JSON are stored in separate columns; replay code never mutates `source`.

The full Phase D domain schema is in [`0001_phase_d_domain.sql`](./packages/db/migrations/0001_phase_d_domain.sql). Chain quantities, block numbers, log indices, and chain timestamps use `numeric(78,0)` and are handled as decimal strings at the application boundary. They are never converted to JavaScript `number`.

Dataset serialization and hashing are specified in [`docs/DATASET_FORMAT.md`](./docs/DATASET_FORMAT.md).

## Capture quality and replay engine

Every reconstructed dataset carries an honest `COMPLETE`, `PARTIAL`, or `DEGRADED` quality result with checks for metadata, owner-visible orders, fills, candles, lifecycle, resolution, and known gaps. `COMPLETE` is reserved for positively verified coverage; an unobserved owner-order stream or unavailable live-gap ledger keeps the dataset visibly `PARTIAL`.

The React-free replay engine lives in `@binaryreplay/replay`. It implements deterministic `play`, `pause`, `step`, `seek`, `restart`, next-fill, market-lock, and final-event navigation at 0.25x through 100x. Its canonical result includes the engine version and configuration, making identical dataset/configuration runs hash identically.

## Strategy and simulation

`@binaryreplay/strategies` defines immutable, typed strategy inputs and `StrategyIntent` outputs. The reference Probability Threshold, Book Imbalance, Momentum, Mean Reversion, and Passive Maker strategies are demonstrations only and make no profitability claim. Intents are not fills.

`@binaryreplay/simulator` consumes an intent plus a reconstructed fixed-point book. It models visible depth, limit crossing, partial fills, remainder, latency, slippage bounds, tick/lot validation, market expiry, and lifecycle state. All price/quantity arithmetic uses raw `bigint` values; it returns only `FILLED`, `PARTIALLY_FILLED`, `NOT_FILLED`, `REJECTED`, or `EXPIRED` outcomes.

## Optional live capture worker

Run `pnpm --filter @binaryreplay/worker start` only when live recording is required. It is not needed for archive discovery or historical reconstruction. Set `LIVE_MARKET_ID`, `LIVE_POOL_ADDRESS`, `DATABASE_URL`, and optionally `LIVE_CAPTURE_OWNERS` first.

The worker uses `watchMarket(pool)` and the SDK's live store. It captures market-status snapshots, four-sided order-book snapshots keyed via `getLiveBinaryOrderBookByMarket(marketId)`, fill logs with block/log metadata, and user orders only for explicitly configured owners—the SDK does not expose a public all-orders live stream. The SDK does not provide candle-update events, so the worker does not invent a candle stream; historical candle queries are reconciled later by the Phase B pipeline.

Each record carries `lastBlock`, `headBlock`, and snapshot-seam metadata where available. Socket loss, block discontinuities, market-binding changes, stale feeds, and reconnects are persisted as explicit records. The SDK performs reconnect/backfill; BinaryReplay records the observed gap so a replay can flag it rather than silently assuming continuity.

## Validation

```bash
pnpm typecheck
pnpm test
pnpm build
```

## Manual actions required

See [STATE.md](./STATE.md). In short: a public deploy needs hosting credentials; durable capture needs PostgreSQL; an optional Shannon test order requires a connected wallet plus test funds; and hackathon submission/demo evidence needs a human submission.
