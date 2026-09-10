# SDK feedback

Tested SDK: 0.28.1. Used typed binary discovery, historical listing/count/resolution/fills/candles, live market/book/fill APIs, external-wallet trader, and documented faucet surface. Typed market IDs and order receipt decoding worked well for this design. Integration friction: public historical orders are owner-scoped and order-book snapshot history is not a general historical surface, so BinaryReplay labels those gaps instead of inventing data. A compact browser-wallet binary-order preflight example and an end-to-end live rollover example would reduce integration time.
