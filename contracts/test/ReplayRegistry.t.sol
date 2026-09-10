// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import "forge-std/Test.sol";
import "../src/ReplayRegistry.sol";
contract ReplayRegistryTest is Test {
    ReplayRegistry registry;
    function setUp() public { registry = new ReplayRegistry(); }
    function testAttestationStoresOnlyEvidence() public { bytes32 run = keccak256("run"); vm.prank(address(0xBEEF)); registry.attest(keccak256("dataset"), keccak256("strategy"), run, bytes32(uint256(9))); (,,, ,address sender,uint64 time) = registry.attestations(run); assertEq(sender, address(0xBEEF)); assertGt(time, 0); }
    function testDuplicateRunReverts() public { bytes32 run = keccak256("run"); registry.attest(bytes32(1), bytes32(2), run, bytes32(3)); vm.expectRevert(ReplayRegistry.DuplicateRunHash.selector); registry.attest(bytes32(1), bytes32(2), run, bytes32(3)); }
}
