export type QualityGrade = "COMPLETE" | "PARTIAL" | "DEGRADED";
export type QualityCheck = { key: "marketMetadata" | "orders" | "fills" | "candles" | "lifecycle" | "resolution" | "knownGaps"; status: "verified" | "unknown" | "missing" | "gap"; detail: string };
export type CaptureQuality = { grade: QualityGrade; checks: QualityCheck[]; replayable: boolean };

/** Conservative by design: only positively verified source coverage can be COMPLETE. */
export function assessCaptureQuality(checks: QualityCheck[]): CaptureQuality {
  const degraded = checks.some((check) => check.status === "gap" || check.status === "missing");
  const partial = checks.some((check) => check.status === "unknown");
  return { grade: degraded ? "DEGRADED" : partial ? "PARTIAL" : "COMPLETE", checks, replayable: !checks.some((check) => check.key === "marketMetadata" && check.status !== "verified") };
}
