# Rewrite Readiness

This document evaluates what is already known from the local source tree well enough to support a safe rewrite, what still requires runtime verification, what can be locked down with contract tests, and what the smallest safe migration sequence looks like.

Source basis:

- [contracts-reconstruction.md](/Users/mila/code/playground/nedluzimstatu/docs/contracts-reconstruction.md)
- [contracts-summary.json](/Users/mila/code/playground/nedluzimstatu/docs/contracts-summary.json)
- [zadosti.js](/Users/mila/code/playground/nedluzimstatu/mail_service/zadosti.js)
- XSL templates under [transformation_service/templates](/Users/mila/code/playground/nedluzimstatu/transformation_service/templates)

## What Is Already Known Well Enough To Rewrite Safely

The following areas are evidenced strongly enough by source to treat as the current contract baseline for a compatibility rewrite:

### 1. External request object consumed by `/zadosti`

Known with high confidence:

- The external entrypoint is `/zadosti`, driven by `mail_service/zadosti.js`.
- The handler consumes a structured object with these top-level fields:
  - `recipientEmail`
  - `recipientName`
  - `applicant`
  - `reply_to`
  - `reason`
  - `recipients`
  - optional `items` used for municipal requests
- `recipients` controls which attachments are generated.
- `recipients["pojistovna"]` supports either one object or an array of objects.

Why this is safe enough:

- All of the above is directly referenced in [zadosti.js](/Users/mila/code/playground/nedluzimstatu/mail_service/zadosti.js#L50).
- There is no competing implementation in the repo.

### 2. Internal request shapes for transformation calls

Known with high confidence:

- Four transformation endpoints share the same payload shape:
  - `/celni-sprava`
  - `/financni-urad`
  - `/ossz`
  - `/pojistovna`
- Their request payload contains:
  - `recipient`
  - `applicant`
  - `reply_to`
  - `reason`
- `/obec` uses the same payload plus `items`.

Why this is safe enough:

- The exact forwarded payloads are visible in [zadosti.js](/Users/mila/code/playground/nedluzimstatu/mail_service/zadosti.js#L52).
- The XSL files confirm the fields actually consumed in [common.xsl](/Users/mila/code/playground/nedluzimstatu/transformation_service/templates/common.xsl), [obec.xsl](/Users/mila/code/playground/nedluzimstatu/transformation_service/templates/obec.xsl), and the endpoint-specific templates.

### 3. Shared domain models

Known with high confidence:

- `Applicant`
  - `name`, `surname`, `address`, `personal_identification_number`
  - optional `company_registration_number`, `phone`, `email`, `data_box`
- `Recipient`
  - `name`, `address`
  - optional `phone`, `email`, `data_box`
- `Address`
  - `zip_code`, `city`
  - optional `lines`
- `ReplyToEnvelope`
  - outer shape is `{ reply_to: ... }`
  - supported inner variants are `data_box`, `in_person`, `permanent_addres`, `contact_address`
- `Reason`
  - supported variants are `job_office`, `regional_office`, `bank`, `other`
- `ObecItems`
  - `dog`, `bins`, `offenses`, `flat`, `reason`

Why this is safe enough:

- These keys are read directly by XPath in [common.xsl](/Users/mila/code/playground/nedluzimstatu/transformation_service/templates/common.xsl#L3) and [obec.xsl](/Users/mila/code/playground/nedluzimstatu/transformation_service/templates/obec.xsl#L27).
- A compatibility rewrite can preserve these keys exactly, including the typo `permanent_addres`.

### 4. Outgoing email structure and content sources

Known with high confidence:

- Returned mail object contains:
  - `from`
  - `to`
  - `subject`
  - `content`
  - `attachments`
- Sender identity is fixed:
  - `Nedlužím státu`
  - `formulare@nedluzimstatu.cz`
- Recipient is mapped from `recipientEmail` and `recipientName`.
- Subject is fixed.
- Mail body is assembled from:
  - [zadost.txt](/Users/mila/code/playground/nedluzimstatu/mail_service/zadost.txt)
  - [zadost.html](/Users/mila/code/playground/nedluzimstatu/mail_service/zadost.html)
- Attachment naming rules are visible, including insurance short-name mapping.

Why this is safe enough:

- All of this is explicit in [zadosti.js](/Users/mila/code/playground/nedluzimstatu/mail_service/zadosti.js#L151).

### 5. Transformation output intent

Known with high confidence:

- Transformation requests are sent with `Accept: application/pdf`.
- XSL templates declare `media-type="application/pdf"`.
- `common.xsl` produces shared document structure and `pdf.xsl` renders it to PDF.

Why this is safe enough:

- Caller intent and template intent are aligned, even though the transformation runtime is not present in the repo.

## What Still Needs Runtime Verification

These items are still blockers for a fully safe production rewrite and should be verified against a running legacy environment or base image implementation.

### 1. Actual HTTP contract of `POST /zadosti`

Still unknown:

- Success status code
- Response body shape
- Error status codes
- Error body shape
- Behavior when one attachment generation fails but others succeed

Why it matters:

- A rewrite can match the request contract but still break callers if response semantics differ.

Verification method:

- Run or inspect the legacy `mail-service` runtime and capture real responses for:
  - success
  - malformed payload
  - missing required business fields
  - transformation failure
  - SendGrid failure

### 2. Transformation endpoint routing conventions

Still unknown:

- Whether `/celni-sprava` really resolves to `celni-sprava.xsl` by filename convention
- Whether there are aliases or alternate routes
- Whether `x:file-name` influences headers or downstream attachment behavior

Why it matters:

- The current documentation infers route-to-template binding from file names and image layout, not from server code.

Verification method:

- Run the legacy transformation container and hit each endpoint with a known-good payload.
- Confirm the actual template selected and whether any filename metadata leaks into headers or logs.

### 3. JSON parsing / JSON-to-XML conversion semantics in `xslt-service`

Still unknown:

- Exact conversion of JSON booleans, nulls, arrays, and objects into the `/json/...` tree consumed by XSL
- Whether presence-only fields like `job_office`, `in_person`, or `dog` require literal booleans, strings, or just node existence

Why it matters:

- The rewrite must preserve the same effective document output for the same input payloads.

Verification method:

- Replay the fixture payloads through the legacy transformation runtime.
- Add focused probes with `true`, `"true"`, `1`, and `null` for presence-like fields.

### 4. Optional vs required behavior at runtime

Still unknown:

- Which missing fields cause hard failures
- Which missing fields merely produce empty output
- Whether `zip_code` or `personal_identification_number` are enforced before XSL executes

Why it matters:

- Source only shows field usage, not validation policy.

Verification method:

- Negative test matrix against the legacy runtime:
  - missing `recipientEmail`
  - missing `recipientName`
  - missing `applicant.address.zip_code`
  - missing `applicant.personal_identification_number`
  - missing `reason`
  - missing `reply_to.reply_to`
  - empty `recipients`

### 5. Legacy typo and inconsistent metadata behavior

Still unknown:

- Whether `permanent_addres` is the only accepted key
- Whether `permanent_address` is silently ignored or also accepted somewhere upstream
- Whether inconsistent `x:file-name` values in `obec.xsl`, `ossz.xsl`, and `pojistovna.xsl` have any runtime effect
- Why `pdf.xsl` references missing `financni-urad-json.xsl`

Why it matters:

- These are the highest-probability sources of rewrite drift.

Verification method:

- Inspect real requests from upstream/frontend.
- Run live transformation calls and inspect output headers, metadata, and logs.

## What Can Be Covered By Contract Tests

Contract tests can lock down most of the observed behavior even before a redesign. The key is to test the rewrite against the reconstructed baseline, then later compare it against the running legacy system where verification is still needed.

### 1. Request-to-internal-call mapping in `/zadosti`

Can be covered fully from source:

- `recipients["celni-sprava"]` triggers one call to `/celni-sprava`
- `recipients["financni-urad"]` triggers one call to `/financni-urad`
- `recipients["obec"]` triggers one call to `/obec` and forwards `items`
- `recipients["ossz"]` triggers one call to `/ossz`
- single `recipients["pojistovna"]` object triggers one call
- array `recipients["pojistovna"]` triggers one call per item

Useful assertions:

- correct endpoint URL
- `Content-Type: application/json`
- `Accept: application/pdf`
- forwarded payload shape matches reconstructed contract exactly
- no extra fields are added by default

### 2. Mail object construction

Can be covered fully from source:

- fixed `from`
- `to` mapped from input
- fixed subject
- both body files included
- attachment count matches selected recipients
- attachment filenames match the current mapping

Useful assertions:

- `Bezdluznost - CSSZ.pdf` for `ossz`
- short-name mapping for known insurance names
- fallback naming behavior for unknown or null insurance names

### 3. Transformation request payload contracts

Can be covered well from source:

- shared payload shape for four endpoints
- `/obec` payload includes `items`
- no batching for non-`pojistovna` endpoints
- `reply_to` and `reason` are forwarded unchanged

Useful assertions:

- exact object snapshots for the four fixture payloads in [docs/fixtures](/Users/mila/code/playground/nedluzimstatu/docs/fixtures)

### 4. XSL field-usage contract

Can be covered well with fixture-based PDF or intermediate-output tests:

- `Applicant`, `Recipient`, `Reason`, `ReplyToEnvelope`, and `ObecItems` fields referenced by templates
- conditional rendering of:
  - `company_registration_number`
  - applicant and recipient contact fields
  - `items` list in `obec`
  - reply-to variants
  - reason variants

Best test strategy:

- If possible, render via the legacy transformation runtime and snapshot semantically meaningful output.
- If PDF snapshots are too brittle, compare normalized extracted text or an intermediate XHTML stage.

### 5. Baseline fixtures already available

Ready to use:

- [zadosti-simple-financni-urad.json](/Users/mila/code/playground/nedluzimstatu/docs/fixtures/zadosti-simple-financni-urad.json)
- [zadosti-multi-instituce.json](/Users/mila/code/playground/nedluzimstatu/docs/fixtures/zadosti-multi-instituce.json)
- [zadosti-multi-pojistovny.json](/Users/mila/code/playground/nedluzimstatu/docs/fixtures/zadosti-multi-pojistovny.json)
- [zadosti-obec-items.json](/Users/mila/code/playground/nedluzimstatu/docs/fixtures/zadosti-obec-items.json)

These are enough to cover the main branching behavior. Additional runtime-verification fixtures should be added for negative cases and spelling/typing edge cases.

## The Smallest Safe Migration Plan

The safest migration is not a redesign. It is a compatibility shell built around the current contracts, verified incrementally.

### Phase 1. Freeze the current contract as executable tests

Goal:

- Turn the reconstructed knowledge into a hard compatibility baseline before changing implementation.

Actions:

1. Create contract tests for `/zadosti` request mapping and outgoing mail object construction.
2. Create contract tests for all four fixture payloads.
3. Add targeted edge-case tests for:
   - single vs array `recipients["pojistovna"]`
   - `reply_to.reply_to` nesting
   - `permanent_addres`
   - optional `company_registration_number`
   - `obec.items`

Exit criterion:

- The tests describe current observed behavior without introducing any new contract assumptions.

### Phase 2. Verify unknowns against legacy runtime

Goal:

- Reduce the remaining high-risk inferences before a production cutover.

Actions:

1. Run the legacy `mail_service` and `transformation_service` containers.
2. Replay all fixture payloads.
3. Capture:
   - HTTP status and body for `/zadosti`
   - internal transformation request/response behavior
   - generated PDF headers or metadata, if exposed
4. Run negative probes for missing fields and spelling variants.

Exit criterion:

- High-risk ambiguities are either confirmed or explicitly documented as accepted compatibility choices.

### Phase 3. Build a compatibility rewrite behind the same contract

Goal:

- Re-implement behavior without changing externally visible contracts.

Actions:

1. Preserve the same `/zadosti` request shape.
2. Preserve the same transformation endpoint names and payload shapes.
3. Preserve the same email subject, sender identity, body sources, and attachment naming.
4. Preserve legacy field names exactly, including typos, until migration is complete.

Exit criterion:

- New implementation passes the contract suite and matches verified runtime behavior.

### Phase 4. Shadow and compare

Goal:

- Prove compatibility before switching production traffic.

Actions:

1. Run the rewrite in shadow mode for the same fixture payloads and selected real traffic samples.
2. Compare:
   - generated internal requests
   - mail object structure
   - attachment counts and filenames
   - PDF text output or normalized content

Exit criterion:

- No unexplained diffs remain for the supported contract surface.

### Phase 5. Cut over without redesign

Goal:

- Replace implementation only after compatibility is evidenced.

Actions:

1. Switch traffic to the rewrite.
2. Keep contract tests and verified fixtures as regression guards.
3. Defer any cleanup of typos, schema tightening, or API redesign until after the compatibility migration is stable.

## Practical Rewrite Boundary

Safe to rewrite now:

- mail orchestration logic
- request-to-attachment fan-out logic
- internal DTOs matching reconstructed fields
- email assembly logic
- template inventory and explicit endpoint mapping

Not safe to change yet:

- external `/zadosti` response semantics
- route names
- field names
- reply-to nesting
- insurance attachment naming behavior
- any behavior that depends on the hidden `mail-service` or `xslt-service` runtime

## Bottom Line

The current source is strong enough to start a compatibility rewrite of the request models, internal transformation contracts, mail assembly, and attachment naming rules. It is not yet strong enough to safely change response semantics, validation behavior, or transformation runtime assumptions without verifying them against the running legacy services first.
