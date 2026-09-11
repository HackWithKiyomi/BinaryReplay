# Vercel deployment

1. Import this repository in Vercel and select the repository root as the project root.
2. Use `pnpm build` as the build command and deploy `apps/web` as the Next.js application output.
3. Add the server-only `DATABASE_URL` in Vercel Environment Variables. Use the managed provider's SSL connection string; do not expose it with a `NEXT_PUBLIC_` prefix.
4. Add public values only as needed: `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SOMNIA_CHAIN_ID=50312`, and `NEXT_PUBLIC_SOMNIA_RPC_URL=https://dream-rpc.somnia.network`.
5. Add server-only Shannon settings only when overriding defaults: `SOMNIA_CHAIN_ID=50312`, `SOMNIA_RPC_URL=https://dream-rpc.somnia.network`, `DREAMDEX_INDEXER_URL`, and `SOMNIA_WS_RPC_URL`.
6. Run `pnpm db:migrate` in a deployment job with the same server-only database variable. It records applied migrations and never resets or drops the database.
7. Verify `/api/health`, then run `pnpm smoke:shannon` from a network-enabled release environment.

`RECONSTRUCTION_WRITE_TOKEN` is optional but required for a server-side caller to persist a reconstructed dataset through the protected API. It must never be sent to a browser. `NEXT_PUBLIC_REPLAY_REGISTRY_ADDRESS` stays blank until a real contract is deployed and verified.

The web app has no server private key requirement. The optional wallet flow uses an injected user wallet and requires explicit manual signature on Shannon.
