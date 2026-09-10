# BinaryReplay contributor notes

- Preserve `marketId` on every persisted, cached, and replayed market record. A pool address is never a permanent market identity.
- Production adapters must use the installed DreamDEX SDK exports. Do not replace unavailable chain data with fabricated data.
- Verify on-chain lifecycle before a wallet write. This repository ships read-only replay and shadow-intent flows by default.
- Keep private keys and database URLs in local environment files only.
