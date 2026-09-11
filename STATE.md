# BinaryReplay delivery state

## CURRENT_PHASE

P0-22 through P0-25: production validation, deployment preparation, evidence, and demo package.

## DONE

- P0 foundation through Proof Center implemented, including typed DreamDEX discovery, historical reconstruction, canonical datasets, deterministic replay, strategies, fixed-point simulator, metrics/labs, runs, capture, shadow, responsive UI, docs, and validation commands.
- Optional manual wallet and registry artifacts are isolated and make no deployment/transaction claim.

## PARTIAL

- Database-backed persistence is configured and its production-safe migrations have been applied; public deployment and public proof records remain manual work.
- Playwright and Foundry suites are prepared but their runtimes are not installed locally.

## BLOCKED

- No public deployment URL, video URL, GitHub remote, wallet-authorized test order, or deployed registry address has been supplied.

## TEST_STATUS

- Typecheck, security lint, unit tests, integration tests, and the production web build passed locally.
- Playwright Chromium route smoke passed all 10 anonymous routes and generated 10 screenshots. Foundry registry tests remain runtime-dependent.

## SHANNON_STATUS

- `pnpm smoke` passed against Shannon chain ID 50312, reading a live Trading market and a finalized market. The genuine canonical dataset, replay, strategy, and run hashes are recorded in `docs/SHANNON_EVIDENCE.md`. The current database has zero persisted datasets because `RECONSTRUCTION_WRITE_TOKEN` is intentionally not configured.

## DEPLOYMENT_STATUS

- Deployment configuration, environment example, and health endpoint are being prepared. Public host configuration is MANUAL_REQUIRED.

## MANUAL_ACTIONS

- Deploy web/optional worker, record screenshots/video, and add public URLs only after verification. A wallet-authorized test order and registry deployment remain optional manual actions.

## NEXT_TASK

- Run the prepared browser and Foundry suites in an environment with their required runtimes, then complete deployment and demo evidence.
