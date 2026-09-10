# ReplayRegistry

`ReplayRegistry` is a non-custodial Shannon attestation registry. It accepts no value, holds no funds, and has no token, trading, or vault functionality.

Run its tests with `forge test` from this directory after installing Foundry and `forge-std`.

Deployment is intentionally manual: connect a Shannon browser wallet or provide a locally controlled deployment signer to Foundry, then run `forge script script/DeployReplayRegistry.s.sol:DeployReplayRegistry --rpc-url <Shannon RPC> --broadcast`. Record the emitted address only after the receipt is verified; BinaryReplay does not contain or claim a deployed address.
