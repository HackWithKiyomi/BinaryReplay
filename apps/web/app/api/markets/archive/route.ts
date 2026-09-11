import { NextRequest, NextResponse } from "next/server";
import { countHistoricalEventContracts, discoverHistoricalEventContracts, EventContractDiscoveryError } from "../../../../lib/dreamdex";
export const dynamic = "force-dynamic";
function parseInteger(value: string | null, fallback: number, minimum: number, maximum?: number) {
  if (value === null) return fallback;
  if (!/^(0|[1-9]\d*)$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= minimum && (maximum === undefined || parsed <= maximum) ? parsed : null;
}

export async function GET(request: NextRequest) {
  const limit = parseInteger(request.nextUrl.searchParams.get("limit"), 20, 1, 100);
  const offset = parseInteger(request.nextUrl.searchParams.get("offset"), 0, 0);

  if (limit === null || offset === null) {
    return NextResponse.json({ error: "limit must be an integer from 1 to 100 and offset must be a non-negative safe integer" }, { status: 400 });
  }

  try {
    const [markets, total] = await Promise.all([discoverHistoricalEventContracts(limit, offset), countHistoricalEventContracts()]);
    return NextResponse.json({ network: { name: "Somnia Shannon", chainId: 50312 }, kind: "DreamDEX Event Contract", phase: "historical/finalized", total, markets, nextOffset: offset + markets.length < total ? offset + markets.length : null });
  } catch (error) {
    return NextResponse.json({ error: error instanceof EventContractDiscoveryError ? error.message : "Unexpected discovery error", markets: [] }, { status: 503 });
  }
}
