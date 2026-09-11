import postgres from "../node_modules/.pnpm/postgres@3.4.9/node_modules/postgres/src/index.js";

const requiredTables = ["market_windows", "source_orders", "source_fills", "source_candles", "replay_datasets", "replay_events", "strategy_runs", "simulated_orders", "simulated_fills", "run_metrics", "shadow_sessions", "shadow_intents", "verification_records"];
if (!process.env.DATABASE_URL) {
  console.error("FAIL database: DATABASE_URL is not configured");
  process.exitCode = 1;
} else {
  const db = postgres(process.env.DATABASE_URL, { max: 1, connect_timeout: 10 });
  try {
    const rows = await db.unsafe("select tablename from pg_tables where schemaname = 'public'");
    const tables = new Set(rows.map((row) => row.tablename));
    const missing = requiredTables.filter((name) => !tables.has(name));
    if (missing.length) {
      console.error(`FAIL database: missing tables ${missing.join(", ")}`);
      process.exitCode = 1;
    } else console.log(`PASS database: ${requiredTables.length} required tables present`);
  } catch {
    console.error("FAIL database: connection or schema inspection failed");
    process.exitCode = 1;
  } finally {
    await db.end({ timeout: 5 });
  }
}
