import { LiveCaptureWorker } from "./live-capture.js";
const marketId = process.env.LIVE_MARKET_ID as `0x${string}` | undefined; const poolAddress = process.env.LIVE_POOL_ADDRESS as `0x${string}` | undefined;
if (!marketId || !poolAddress) throw new Error("LIVE_MARKET_ID and LIVE_POOL_ADDRESS are required");
const worker = new LiveCaptureWorker({ marketId, poolAddress, owners: process.env.LIVE_CAPTURE_OWNERS?.split(",").filter(Boolean) as `0x${string}`[] | undefined });
await worker.start(); process.once("SIGINT", () => void worker.stop()); process.once("SIGTERM", () => void worker.stop());
