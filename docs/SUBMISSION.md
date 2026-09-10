# BinaryReplay — Hackathon submission

## Project Name

BinaryReplay

## Tagline

Deterministic replay and honest execution research for Event Contracts.

## One-line Pitch

BinaryReplay turns genuine DreamDEX Event Contract observations into hashable replay datasets, realistic strategy simulations, and read-only live shadow evidence.

## Problem

Binary-market backtests often blur recycled pools, missing data, strategy signals, and real execution. That produces attractive but untrustworthy results.

## Solution

BinaryReplay preserves typed `marketId` windows, stores immutable source data separately from derived state, exposes gaps, and makes every replay/run identity reproducible.

## What BinaryReplay Does

Discovers live/finalized Event Contracts; reconstructs scoped history; captures live observations; replays deterministically; simulates execution/portfolio/settlement; compares latency/liquidity; persists runs; and shadows live decisions without trading.

## Why It Is Innovative

It treats provenance and execution realism as product features: source-versus-derived labels, canonical hashes, market-window isolation, and a no-fabrication policy are visible throughout the product.

## How DreamDEX Event Contracts Are Used

The installed SDK provides typed discovery, lifecycle, historical, live book/fill, and browser-wallet order surfaces. Replays are scoped to each contract window rather than a reusable pool.

## How Somnia Is Used

BinaryReplay targets Somnia Shannon, chain ID 50312, for read-only discovery/capture/shadow verification and optional user-approved test orders.

## Key Features

Canonical datasets; deterministic replay; typed strategies; bigint execution; settlement-aware PnL; latency/depth labs; run and proof hashes; shadow mode; manual test-order preflight; and optional non-custodial registry attestations.

## Architecture

Next.js UI, worker observers, PostgreSQL/Drizzle, deterministic TypeScript packages, and a minimal optional Solidity attestation registry.

## Technology Stack

TypeScript, Next.js, React, pnpm, PostgreSQL, Drizzle, Viem/Wagmi, DreamDEX SDK 0.28.1, Foundry, and Playwright.

## Real Testnet Evidence

Evidence appears only after genuine discovery/dataset/run/shadow or manual-order verification. The Proof Center intentionally shows empty states until then.

## Testing

`pnpm validate` runs deterministic validation; `pnpm smoke` performs read-only Shannon verification; browser tests exclude wallet transactions.

## Public Deployment URL

MANUAL_REQUIRED

## GitHub URL

MANUAL_REQUIRED

## Demo Video URL

MANUAL_REQUIRED

## SDK Feedback

See [SDK feedback](SDK_FEEDBACK.md).

## Known Limitations

Historical order-book history and public historical order streams depend on SDK availability. Simulated performance is not a future-performance claim. Manual order and registry deployment require explicit user-controlled wallet action.

## Future Roadmap

More capture adapters, richer book provenance, reproducible run bundles, comparison exports, and optional verified registry publication.
