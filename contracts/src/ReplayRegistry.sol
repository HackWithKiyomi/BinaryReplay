// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Non-custodial public evidence for a BinaryReplay benchmark.
/// @dev This contract has no payable functions, token logic, trading, or vault state.
contract ReplayRegistry {
    struct Attestation { bytes32 datasetHash; bytes32 strategyHash; bytes32 runHash; bytes32 marketId; address submitter; uint64 timestamp; }
    mapping(bytes32 => Attestation) public attestations;
    event BenchmarkAttested(bytes32 indexed runHash, bytes32 indexed datasetHash, bytes32 indexed strategyHash, bytes32 marketId, address submitter, uint64 timestamp);
    error DuplicateRunHash();

    function attest(bytes32 datasetHash, bytes32 strategyHash, bytes32 runHash, bytes32 marketId) external {
        if (attestations[runHash].timestamp != 0) revert DuplicateRunHash();
        Attestation memory entry = Attestation(datasetHash, strategyHash, runHash, marketId, msg.sender, uint64(block.timestamp));
        attestations[runHash] = entry;
        emit BenchmarkAttested(runHash, datasetHash, strategyHash, marketId, msg.sender, entry.timestamp);
    }
}
