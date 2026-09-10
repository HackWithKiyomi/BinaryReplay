import { canonicalSerialize, sha256 } from "./index.js";

export const REPLAY_ENGINE_VERSION = "binaryreplay.engine.v1";
export const PLAYBACK_SPEEDS = [0.25, 0.5, 1, 2, 5, 10, 50, 100] as const;
export type PlaybackSpeed = (typeof PLAYBACK_SPEEDS)[number];
export type TimelineEvent = { sequence: string; timestamp: string; kind: "fill" | "book" | "lifecycle" | "resolution" | "custom"; sourceId: string; payload?: Record<string, unknown> };
export type ReplayDataset = { marketId: string; tradingStart: string; expiry: string; lockAt?: string; events: TimelineEvent[] };
export type DeterministicReplayState = { marketId: string; virtualTime: string; cursor: number; playing: boolean; speed: PlaybackSpeed; marketStatus: string; lastFillId: string | null; lastBookSourceId: string | null; finalEventId: string | null; appliedEventIds: string[] };

function exact(value: string) { if (!/^\d+$/.test(value)) throw new Error(`Replay time must be a non-negative integer string: ${value}`); return BigInt(value); }
function ordered(events: TimelineEvent[]) { return [...events].sort((a, b) => { const time = exact(a.timestamp) < exact(b.timestamp) ? -1 : exact(a.timestamp) > exact(b.timestamp) ? 1 : 0; return time || (exact(a.sequence) < exact(b.sequence) ? -1 : exact(a.sequence) > exact(b.sequence) ? 1 : a.sourceId.localeCompare(b.sourceId)); }); }
function speed(value: number): value is PlaybackSpeed { return (PLAYBACK_SPEEDS as readonly number[]).includes(value); }

/** React-free deterministic state machine. Call `advance` from any scheduler, including a UI animation loop or test. */
export class ReplayEngine {
  private readonly events: TimelineEvent[]; private state: DeterministicReplayState;
  constructor(readonly dataset: ReplayDataset, speedValue: PlaybackSpeed = 1) { if (!speed(speedValue)) throw new Error("Unsupported playback speed"); this.events = ordered(dataset.events); this.state = { marketId: dataset.marketId, virtualTime: dataset.tradingStart, cursor: 0, playing: false, speed: speedValue, marketStatus: "Listed", lastFillId: null, lastBookSourceId: null, finalEventId: null, appliedEventIds: [] }; }
  snapshot() { return structuredClone(this.state); }
  play() { this.state.playing = true; return this.snapshot(); }
  pause() { this.state.playing = false; return this.snapshot(); }
  setSpeed(value: PlaybackSpeed) { if (!speed(value)) throw new Error("Unsupported playback speed"); this.state.speed = value; return this.snapshot(); }
  restart() { const keepSpeed = this.state.speed; this.state = { marketId: this.dataset.marketId, virtualTime: this.dataset.tradingStart, cursor: 0, playing: false, speed: keepSpeed, marketStatus: "Listed", lastFillId: null, lastBookSourceId: null, finalEventId: null, appliedEventIds: [] }; return this.snapshot(); }
  step() { if (this.state.cursor >= this.events.length) return this.snapshot(); this.apply(this.events[this.state.cursor++]); return this.snapshot(); }
  seek(timestamp: string) { const target = exact(timestamp); this.restart(); this.state.virtualTime = timestamp; while (this.state.cursor < this.events.length && exact(this.events[this.state.cursor].timestamp) <= target) this.apply(this.events[this.state.cursor++]); return this.snapshot(); }
  advance(wallElapsedMs: number) { if (!this.state.playing || wallElapsedMs <= 0) return this.snapshot(); const increment = BigInt(Math.floor(wallElapsedMs * this.state.speed)); const target = (exact(this.state.virtualTime) + increment).toString(); this.seek(target); this.state.playing = true; return this.snapshot(); }
  jumpToNextFill() { const event = this.events.slice(this.state.cursor).find((item) => item.kind === "fill"); return event ? this.seek(event.timestamp) : this.snapshot(); }
  jumpToMarketLock() { const event = this.events.find((item) => item.kind === "lifecycle" && String(item.payload?.status).toLowerCase() === "locked"); return this.seek(event?.timestamp ?? this.dataset.lockAt ?? this.dataset.expiry); }
  jumpToFinalEvent() { const event = this.events.at(-1); return this.seek(event?.timestamp ?? this.dataset.expiry); }
  canonicalResult() { const result = { engineVersion: REPLAY_ENGINE_VERSION, datasetMarketId: this.dataset.marketId, speed: this.state.speed.toString(), state: { ...this.state, playing: false } }; return { canonical: canonicalSerialize(result), resultHash: sha256(result) }; }
  private apply(event: TimelineEvent) { this.state.virtualTime = event.timestamp; this.state.appliedEventIds.push(event.sourceId); this.state.finalEventId = event.sourceId; if (event.kind === "fill") this.state.lastFillId = event.sourceId; if (event.kind === "book") this.state.lastBookSourceId = event.sourceId; if (event.kind === "lifecycle" || event.kind === "resolution") this.state.marketStatus = String(event.payload?.status ?? (event.kind === "resolution" ? "Resolved" : this.state.marketStatus)); }
}
