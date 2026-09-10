# Deployment

Deploy `apps/web` to Vercel or a Node-compatible host and use managed PostgreSQL for `DATABASE_URL`. Apply `packages/db/migrations` before enabling persistence. The optional `apps/worker` is independently deployable to a persistent Node host; historical replay stays available if it is offline.

Use `.env.example` as the complete variable inventory. `DATABASE_URL` and `RECONSTRUCTION_WRITE_TOKEN` are server-only. `NEXT_PUBLIC_APP_URL`, public RPC configuration, and an optional verified registry address are public/manual values. Never configure keys in public variables.

After deployment, check `/api/health`: it reports public app metadata, database availability, and a real DreamDEX read check without leaking connection errors. Registry deployment is manual; see `contracts/README.md`. No deployed URL or contract address is claimed here.
