import postgres from "../node_modules/.pnpm/postgres@3.4.9/node_modules/postgres/src/index.js";
import { createHash } from "node:crypto";

const canonicalize = (value) => {
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalize(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
};
if (!process.env.DATABASE_URL) {
  console.error("FAIL datasets: DATABASE_URL is not configured");
  process.exitCode = 1;
} else {
  const db = postgres(process.env.DATABASE_URL, { max: 1, connect_timeout: 10 });
  try {
    const datasets = await db.unsafe("select id, market_id, integrity_hash, source, derived from replay_datasets order by id");
    let invalid = 0;
    for (const dataset of datasets) {
      const material = { source: dataset.source, derived: dataset.derived };
      const actual = createHash("sha256").update(canonicalize(material)).digest("hex");
      if (actual !== dataset.integrity_hash) { invalid += 1; console.error(`FAIL dataset ${dataset.id}: integrity hash mismatch`); }
    }
    if (invalid) process.exitCode = 1;
    else console.log(`PASS datasets: ${datasets.length} persisted dataset hash${datasets.length === 1 ? "" : "es"} verified`);
  } catch {
    console.error("FAIL datasets: database query failed");
    process.exitCode = 1;
  } finally { await db.end({ timeout: 5 }); }
}
