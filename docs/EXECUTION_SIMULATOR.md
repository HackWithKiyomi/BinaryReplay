# Execution simulator

Prices and quantities are raw bigint fixed-point units. The simulator applies tick/lot checks, visible depth, crossing, partials, latency, expiry, status, and slippage. It reports FILLED, PARTIALLY_FILLED, NOT_FILLED, REJECTED, or EXPIRED without turning a signal into a guaranteed fill.
