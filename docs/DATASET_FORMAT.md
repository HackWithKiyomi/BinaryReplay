# BinaryReplay Dataset Format v1

A ReplayDataset represents exactly one DreamDEX Event Contract window. Its stable identity is `marketId`; `poolAddress` is retained only as generation context because pools can be recycled.

## Envelope

```json
{
  "manifest": { "formatVersion": "binaryreplay.dataset.v1" },
  "generatedAt": "2026-09-09T00:00:00.000Z",
  "datasetHash": "sha256 hex"
}
```

The manifest contains: network, string chain ID, `marketId`, symbol, asset, interval, trading start, expiry, resolution/winning outcome, source counts, replay event count, capture gaps, coverage metadata, and hashes of the immutable market/source/replay components.

All chain quantities, timestamps, block numbers, sequence values, and token IDs are decimal strings. This prevents loss of uint256 precision in JavaScript and preserves canonical serialization across environments.

## Canonical hashing

`datasetHash` is SHA-256, hex encoded, over UTF-8 canonical JSON of `manifest` only.

- Object keys are sorted lexicographically at every depth.
- Arrays retain their explicit semantic order: fills/events are chronological; capture gaps are chronological.
- `bigint` values are converted to base-10 strings before serialization.
- The source-component hashes are also SHA-256 over canonical JSON, so a changed fill, candle, resolution, or derived replay event changes the final dataset hash.
- `generatedAt`, `datasetHash`, database row IDs, random identifiers, and current wall-clock values are excluded from the hashed manifest.

Thus identical canonical datasets receive identical hashes even when generated at different times. A dataset that has an observed feed discontinuity must list it in `captureGaps` and mark coverage incomplete rather than hiding it.
