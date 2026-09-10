# Shadow mode

Shadow mode watches a genuine Trading market and persists intents separately with `SIMULATED — NOT ON-CHAIN`. It contains no signer or broadcast path. On pool rollover it detects the successor `marketId`, closes the old session, and begins a new state boundary.
