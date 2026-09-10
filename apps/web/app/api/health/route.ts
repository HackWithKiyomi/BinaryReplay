import { NextResponse } from "next/server";
import { databaseHealthCheck } from "@binaryreplay/db";
import { discoverLiveEventContracts } from "../../../lib/dreamdex";

export const dynamic = "force-dynamic";
export async function GET() {
  const checkedAt = new Date().toISOString();
  const databaseHealth = await (async () => { try { await databaseHealthCheck(); return "ok"; } catch { return "unconfigured_or_unavailable"; } })();
  const dreamdex = await (async () => { try { const markets = await discoverLiveEventContracts(1); return { status: "ok", latestMarketId: markets[0]?.marketId ?? null }; } catch { return { status: "unavailable", latestMarketId: null }; } })();
  const healthy = dreamdex.status === "ok";
  return NextResponse.json({ status: healthy ? "ok" : "degraded", checkedAt, application: "BinaryReplay", network: { name: "Somnia Shannon", chainId: 50312 }, database: databaseHealth, dreamdex, public: { appUrlConfigured: Boolean(process.env.NEXT_PUBLIC_APP_URL) } }, { status: healthy ? 200 : 503, headers: { "cache-control": "no-store" } });
}
