# Replay engine

The React-free engine accepts a dataset, stable-orders events by timestamp/sequence/sourceId, and supports play, pause, step, seek, restart, and jumps. Its canonical result includes engine version and is hashable. UI scheduling never owns the domain state machine.
