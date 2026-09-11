import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import postgres from "../node_modules/.pnpm/postgres@3.4.9/node_modules/postgres/src/index.js";

let failed = false;
const report = (status, name, detail) => { console.log(`${status} ${name}${detail ? ` — ${detail}` : ""}`); if (status === "FAIL") failed = true; };
const requiredTables = ["market_windows", "replay_datasets", "replay_events", "strategy_runs", "simulated_orders", "simulated_fills", "run_metrics", "shadow_sessions", "verification_records"];

report(Number(process.versions.node.split(".")[0]) >= 20 ? "PASS" : "FAIL", "Node", process.version);
report(process.env.NEXT_PUBLIC_APP_URL ? "PASS" : "WARN", "Application URL", process.env.NEXT_PUBLIC_APP_URL ? "configured" : "defaults to http://localhost:3000 in local development");
report(process.env.DATABASE_URL ? "PASS" : "FAIL", "DATABASE_URL", process.env.DATABASE_URL ? "configured" : "not configured");
report(process.env.SOMNIA_CHAIN_ID === "50312" ? "PASS" : "WARN", "Somnia chain setting", process.env.SOMNIA_CHAIN_ID === "50312" ? "50312" : "using SDK Shannon default");
report(process.env.NEXT_PUBLIC_REPLAY_REGISTRY_ADDRESS ? "PASS" : "WARN", "Replay registry", process.env.NEXT_PUBLIC_REPLAY_REGISTRY_ADDRESS ? "configured" : "optional and not deployed");

try {
  const packageJson = JSON.parse(await readFile(new URL("../apps/web/node_modules/@somnia-chain/markets-sdk/package.json", import.meta.url), "utf8"));
  report(packageJson.version >= "0.28.0" ? "PASS" : "FAIL", "DreamDEX SDK", packageJson.version);
} catch { report("FAIL", "DreamDEX SDK", "not installed"); }

if (process.env.DATABASE_URL) {
  const db = postgres(process.env.DATABASE_URL, { max: 1, connect_timeout: 10 });
  try {
    const tables = new Set((await db.unsafe("select tablename from pg_tables where schemaname = 'public'")).map((row) => row.tablename));
    const missing = requiredTables.filter((name) => !tables.has(name));
    report(missing.length ? "FAIL" : "PASS", "PostgreSQL schema", missing.length ? `missing ${missing.join(", ")}` : "required tables present");
  } catch { report("FAIL", "PostgreSQL connectivity", "connection or schema query failed"); }
  finally { await db.end({ timeout: 5 }); }
}

try {
  const rpc = process.env.SOMNIA_RPC_URL || process.env.NEXT_PUBLIC_SOMNIA_RPC_URL || "https://dream-rpc.somnia.network";
  const response = await fetch(rpc, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_chainId", params: [] }), signal: AbortSignal.timeout(15_000) });
  const payload = await response.json();
  report(payload.result?.toLowerCase() === "0xc488" ? "PASS" : "FAIL", "Shannon RPC", payload.result === "0xc488" ? "chainId 50312" : "unexpected chain ID");
} catch { report("FAIL", "Shannon RPC", "unreachable"); }

try {
  const requireFromWeb = createRequire(new URL("../apps/web/package.json", import.meta.url));
  const sdk = await import(pathToFileURL(requireFromWeb.resolve("@somnia-chain/markets-sdk")).href);
  const chains = await import(pathToFileURL(requireFromWeb.resolve("@somnia-chain/markets-sdk/chains")).href);
  const exchange = new sdk.SomniaMarkets({ chain: chains.somniaShannon, indexerUrl: process.env.DREAMDEX_INDEXER_URL || "https://dev.smk.somnia.host/v1/graphql", wsRpcUrl: process.env.SOMNIA_WS_RPC_URL || "wss://api.infra.testnet.somnia.network/ws", addresses: sdk.SOMNIA_TESTNET_ADDRESSES });
  try {
    const [live, past] = await Promise.all([exchange.client.listLiveBinaryMarkets({ first: 1, status: "Trading" }), exchange.client.listPastBinaryMarkets({ first: 1 })]);
    report(live.length ? "PASS" : "WARN", "Live Event Contract discovery", live.length ? `market ${live[0].marketId}` : "no Trading window returned");
    report(past.length ? "PASS" : "WARN", "Historical Event Contract discovery", past.length ? `market ${past[0].marketId}` : "no finalized window returned");
  } finally { exchange.close(); }
} catch (error) { report("FAIL", "DreamDEX discovery", error instanceof Error ? error.message.replace(/https?:\/\/[^\s]+/g, "endpoint") : "SDK request failed"); }

process.exitCode = failed ? 1 : 0;
