# Live capture

The optional worker watches genuine SDK updates, records snapshots/fills/explicit owner orders, detects duplicate IDs, stale feeds, reconnects, and block gaps. A gap is persisted and shown; it is not silently repaired. Historical replay does not require this worker.
