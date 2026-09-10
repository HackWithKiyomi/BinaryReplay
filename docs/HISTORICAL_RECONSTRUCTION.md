# Historical reconstruction

Each dataset targets one `marketId` and `[tradingStart, expiry]`. Source records remain immutable. Derived events are ordered deterministically. Pool address alone is never accepted as identity because pools can be recycled. Unknown order-book history and capture gaps lower quality rather than being synthesized.
