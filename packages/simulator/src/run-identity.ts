import { canonicalSerialize, sha256 } from "@binaryreplay/replay";

export type CompletedRunInput = { datasetId: string; datasetHash: string; marketId: string; strategyDefinitionId: string; strategyId: string; strategyVersion: string; strategyConfiguration: unknown; simulatorConfiguration: unknown; initialCapital: bigint; latencyMs: bigint; results: unknown; metrics: unknown };
export type CompletedRun = CompletedRunInput & { id: string; strategyHash: string; runHash: string; canonicalStrategyConfiguration: string; canonicalSimulatorConfiguration: string };

/** Stable identities deliberately exclude wall-clock timestamps and database IDs. */
export function finalizeRun(input: CompletedRunInput): CompletedRun {
  const canonicalStrategyConfiguration = canonicalSerialize(input.strategyConfiguration);
  const canonicalSimulatorConfiguration = canonicalSerialize(input.simulatorConfiguration);
  const strategyHash = sha256({ strategyId: input.strategyId, strategyVersion: input.strategyVersion, configuration: JSON.parse(canonicalStrategyConfiguration) });
  const runHash = sha256({ datasetHash: input.datasetHash, strategyHash, simulatorConfiguration: JSON.parse(canonicalSimulatorConfiguration), initialCapital: input.initialCapital.toString(), latencyMs: input.latencyMs.toString(), results: input.results, metrics: input.metrics });
  return { ...input, id: `run-${runHash.slice(0, 24)}`, strategyHash, runHash, canonicalStrategyConfiguration, canonicalSimulatorConfiguration };
}
