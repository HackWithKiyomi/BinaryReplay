# Setup

Install Node 22 and pnpm, run `pnpm install`, set `DATABASE_URL` in a local uncommitted environment file, apply SQL migrations in order, then run `pnpm dev`. Optional read URLs are `DREAMDEX_INDEXER_URL` and `SOMNIA_WS_RPC_URL`. `RECONSTRUCTION_WRITE_TOKEN` protects server persistence. Do not add `.env`, keys, or credentials to version control.
