# Security

Server mutations require a server-only token and recompute canonical hashes. ORM queries are parameterized. Inputs are bounded/validated, errors are generalized, and source datasets cannot be client-overwritten. Never use seed phrases, recovery phrases, or `NEXT_PUBLIC_*` secrets. Manual trading uses a connected browser wallet only.
