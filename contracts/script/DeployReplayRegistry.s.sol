// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import "forge-std/Script.sol";
import "../src/ReplayRegistry.sol";
contract DeployReplayRegistry is Script { function run() external returns (ReplayRegistry deployed) { vm.startBroadcast(); deployed = new ReplayRegistry(); vm.stopBroadcast(); } }
