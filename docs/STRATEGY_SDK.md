# Strategy SDK

Strategies receive snapshot, virtual time, position, and bigint configuration; they emit immutable `StrategyIntent`s (`BUY/SELL UP/DOWN`, `HOLD`, `CANCEL`). Reference strategies are demonstrations only. An intent is never a fill and strategies cannot mutate datasets.
