# Runtime Verification

This directory is a separate runtime observation harness for the real legacy `mail_service` and `transformation_service` containers.

It is intentionally separate from [contract_tests](/Users/mila/code/playground/nedluzimstatu/contract_tests):

- `contract_tests/` freezes source-grounded behavior from the local source tree.
- `runtime_verification/` is for checking the parts that are still unknown until the legacy services are actually running.

This scaffold does not implement the rewrite and does not assume success semantics that are not yet proven.

## Scope

Planned runtime verification areas:

- success response of `POST /zadosti`
- malformed payload handling
- missing required field handling
- transformation failure behavior
- mail provider failure behavior
- JSON-to-XSL conversion semantics
- spelling variant checks like `permanent_addres` vs `permanent_address`

Detailed cases are listed in [test-matrix.md](/Users/mila/code/playground/nedluzimstatu/runtime_verification/test-matrix.md).

## Directory Layout

- [scripts](/Users/mila/code/playground/nedluzimstatu/runtime_verification/scripts): small no-deps Node helpers for replaying payloads
- [probes](/Users/mila/code/playground/nedluzimstatu/runtime_verification/probes): raw and JSON probe payloads for runtime-only checks
- [captures](/Users/mila/code/playground/nedluzimstatu/runtime_verification/captures): saved request/response artifacts from local verification runs

## Prerequisites

- local legacy `mail_service` container reachable by URL
- local legacy `transformation_service` container reachable by URL
- Node.js 18+ for built-in `fetch`

Configure base URLs with environment variables:

```bash
export MAIL_SERVICE_URL=http://localhost:8080
export TRANSFORMATION_SERVICE_URL=http://localhost:8081
```

The harness treats these as base URLs and appends endpoint paths itself.

Typical resolved URLs:

- `http://localhost:8080/zadosti`
- `http://localhost:8081/celni-sprava`
- `http://localhost:8081/financni-urad`
- `http://localhost:8081/obec`
- `http://localhost:8081/ossz`
- `http://localhost:8081/pojistovna`

These URLs are examples only. Use whatever the local containers actually expose.

## Scripts

### Replay one fixture against `/zadosti`

```bash
node runtime_verification/scripts/replay-fixture.mjs \
  --fixture zadosti-simple-financni-urad
```

Optional flags:

- `--url http://localhost:8080/zadosti`
- `--output-dir runtime_verification/captures/manual`
- `--label local-zadosti-success`
- `--content-type application/json`
- `--accept application/json`

If `--url` is omitted, the script uses `MAIL_SERVICE_URL` and posts to `/zadosti`.

### Run all documented fixture captures for mail service

```bash
node runtime_verification/scripts/run-mail-fixtures.mjs
```

This creates a single run directory with stable per-case capture names and `summary.json`.

### Run mail-service probe cases

```bash
node runtime_verification/scripts/run-mail-probes.mjs
```

This covers:

- malformed JSON
- missing `recipientEmail`
- missing `applicant`
- empty `recipients`
- malformed `pojistovna`
- missing `items` for `obec`
- `permanent_addres` vs `permanent_address`
- `reply_to.reply_to` nesting
- single vs array `pojistovna`
- optional `company_registration_number`

### Run one real-email happy-path verification

This check is intentionally separate from the normal batch runs because it may send a real email to `mila@shrug.cz`.

```bash
node runtime_verification/scripts/run-real-email-happy-path.mjs \
  --allow-real-email true
```

It uses:

- [zadosti-happy-path-mila-shrug-cz.json](/Users/mila/code/playground/nedluzimstatu/runtime_verification/probes/zadosti-happy-path-mila-shrug-cz.json)

The script refuses to run without the explicit `--allow-real-email true` flag.

### Run transformation-service probes

```bash
node runtime_verification/scripts/run-transformation-probes.mjs
```

This captures for each endpoint:

- status code
- headers
- whether body looks like a PDF
- response size
- timing

### Replay any raw probe file against any URL

Use this for ad hoc experiments:

```bash
node runtime_verification/scripts/post-request.mjs \
  --url http://localhost:8080/zadosti \
  --body-file runtime_verification/probes/zadosti-malformed.json.txt \
  --content-type application/json \
  --label malformed-zadosti
```

Transformation probe example:

```bash
node runtime_verification/scripts/post-request.mjs \
  --url http://localhost:8081/financni-urad \
  --body-file runtime_verification/probes/transformation-financni-urad-string-reason.json \
  --content-type application/json \
  --accept application/pdf \
  --label financni-urad-string-reason
```

## What Gets Captured

Each batch run writes a timestamped directory under `runtime_verification/captures/` containing:

- `summary.json`
- one stable subdirectory per case, named by case ID such as `rv-zad-001/`

Each case directory contains:

- `meta.json`
- `request-body.txt`
- `response-body.txt` for text responses
- `response-body.bin` for binary responses such as PDFs

`meta.json` includes:

- request URL and method
- endpoint
- request headers
- response status
- response headers
- response size
- response timing
- whether the body looks PDF-like
- body file names
- timestamps
- notes

## Suggested Verification Order

1. Set `MAIL_SERVICE_URL` and `TRANSFORMATION_SERVICE_URL`.
2. Run `run-mail-fixtures.mjs`.
3. Run `run-mail-probes.mjs`.
4. Optionally run `run-real-email-happy-path.mjs --allow-real-email true`.
5. Run `run-transformation-probes.mjs`.
6. For downstream outage scenarios, rerun the same scripts while intentionally stopping or misconfiguring dependencies.
7. Record conclusions in [TODO-next.md](/Users/mila/code/playground/nedluzimstatu/runtime_verification/TODO-next.md).

## Boundaries

This scaffold is intentionally conservative:

- it does not assert expected success bodies up front
- it does not assume hidden base-image semantics
- it stores evidence first and conclusions later
- it is not part of the source-grounded compatibility suite
- real-email verification is opt-in and separated from the normal batch runs
