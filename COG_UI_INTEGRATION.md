# Navigator UI COG Integration v0.1

This pilot changes the existing level-4 cooling live panel to consume the canonical cooling graph through Shaka Server.

## Data path

Navigator UI -> Shaka Server -> Shaka Core COG read-only endpoints.

## Canonical-first behavior

The sea-water pump screen reads:

- canonical object `AI-D4-BB-SeaWaterPump`
- canonical graph `NAV-COG-D4-BB-COOLING-v0.1`
- verified direct canonical relations
- the existing runtime Asset Instance in parallel for installed-state continuity

The browser client fails closed if a canonical object response contains any relation whose status is not `verified`.

## Out of scope

- no deployment
- no Render/Railway configuration changes
- no write operations
- no replacement of the canonical YAML source
- no promotion of deferred candidate relations
