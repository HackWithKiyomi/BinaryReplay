# Architecture

`apps/web` presents server-rendered discovery and paged research views. `apps/worker` captures live SDK observations and runs read-only shadow sessions. `packages/replay`, `strategies`, and `simulator` are deterministic TypeScript cores independent from React. `packages/db` persists immutable source JSON separately from derived replay/run records. `marketId` is the identity boundary; a recycled pool never merges windows.
