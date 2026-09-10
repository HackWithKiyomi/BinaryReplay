# DreamDEX integration

Tested against `@somnia-chain/markets-sdk` 0.28.1. Discovery uses typed binary market status/marketId fields; historical fills/candles are filtered by `marketId` and window. Live capture uses supported market/book/fill surfaces. Browser-wallet trading uses the SDK external-wallet trader only after on-chain preflight.
