# Runtime Verification TODO

Use this file after executing the runtime harness against real legacy containers.

## What Was Verified At Runtime

- Fill in links to run directories under `runtime_verification/captures/`
- Record which `/zadosti` fixture runs were executed
- Record whether the real-email happy-path check to `mila@shrug.cz` was executed
- Record which transformation endpoints were probed
- Record which variant/typo probes were executed

## What Still Remains Unknown

- actual success body contract of `POST /zadosti`
- whether the happy-path verification really resulted in delivered mail to `mila@shrug.cz`
- exact error semantics for malformed and incomplete requests
- whether `permanent_address` is ignored, rejected, or accepted
- whether missing `items` for `obec` is accepted or rejected
- whether transformation responses are always PDFs or sometimes text errors
- exact transformation failure propagation through `mail_service`
- exact mail provider failure propagation through `mail_service`

## What Should Be Folded Back Into Contract Tests

Only fold back findings that become hard evidence and are stable enough to freeze:

- confirmed `/zadosti` success response shape, if stable
- confirmed error status/body patterns, if stable
- confirmed acceptance or rejection of key spelling variants
- confirmed coercion behavior for JSON-to-XSL probes, if stable and intended

Do not fold back:

- environment-specific outages
- timing-sensitive failures
- one-off container misconfigurations

## What Matters Before Rewrite / Cutover

- confirm `/zadosti` success and failure HTTP semantics
- if using a real mailbox for verification, confirm actual delivery for the dedicated happy-path probe
- confirm real behavior for malformed JSON and missing fields
- confirm direct transformation endpoint behavior for all five endpoints
- confirm `permanent_addres` compatibility boundaries
- confirm single vs array `pojistovna` runtime behavior
- confirm whether `company_registration_number` changes output or validation
- capture at least one real failure trace for transformation unavailability
- capture at least one real failure trace for mail provider unavailability
