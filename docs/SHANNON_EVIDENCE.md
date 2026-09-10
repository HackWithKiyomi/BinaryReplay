# Shannon evidence

## Network

- Network: Somnia Shannon
- Chain ID: `50312`
- SDK inspected/tested: `@somnia-chain/markets-sdk` `0.28.1`

## Read-only observations already verified during development

- Typed live binary discovery returned two `Trading` Event Contract windows.
- A finalized ETH Event Contract was read by `marketId`; its on-chain state reported resolved status.
- A past market window was read with its own `tradingStart`/`expiry`; supported resolution data was returned. Its fills/candles result was empty, which is recorded as missing coverage rather than synthesized history.

## Current read-only smoke PASS

`pnpm smoke` completed without wallet, signature, transaction, or database write.

- Live Trading marketId: `0x000000000000000000000000000000000000000000000000000000000001912a`
- Live on-chain status: `1` (`Trading`); market was not finalized or resolved.
- Live pool read: `0x230f5Ce9BF56e20a891847c3d4E597F2623b7bc6`; all four returned visible-book sides were empty. This is genuine observed absence of visible liquidity, not a synthetic book.
- Finalized marketId: `0x0000000000000000000000000000000000000000000000000000000000019128`
- Resolution event: block `484677043`, timestamp `1789040940`, winner outcome `0`, payout `10000000/10000000`.
- Supported historical retrieval: fills `0`, candles `0`; these empty results remain coverage limitations.
- Canonical datasetHash: `aaf3fab91fcb08d7e6665df4955c230b67a4f4cad12b027374802a3d37b6c0cb`
- Deterministic replay result hash: `a23fed27e6dfbbf412603d20359541ede298ad66ed1e86ff519fb47345b1ea1f`
- strategyHash: `0efa960275fbef2743e2a740230d23320798817cb44adab7c520b5d65c54e32f`
- runHash: `dfbbe3c0eef9a516725a3b18046cb4195a0b768090e8918a827ce64b2346a26c`

The run is a deterministic HOLD-only read-only smoke evaluation because the genuine historical source had no observed fills/candles/book price. It is not persisted and is not an on-chain trade.

## Required before public GO

1. Persist a genuine reconstructed dataset and completed run into PostgreSQL for the Proof Center.
2. Capture a non-empty book/fill window where available.
3. Deploy and record public app evidence only after verification.

The smoke script creates no trader, wallet, signature, or transaction.
