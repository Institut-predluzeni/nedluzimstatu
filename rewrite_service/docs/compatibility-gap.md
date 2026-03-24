# Compatibility Gap

This document compares the current `rewrite_service` phase-1 skeleton against:

- reconstructed source contracts in [contracts-reconstruction.md](/Users/mila/code/playground/nedluzimstatu/docs/contracts-reconstruction.md)
- rewrite readiness notes in [rewrite-readiness.md](/Users/mila/code/playground/nedluzimstatu/docs/rewrite-readiness.md)
- fixture-driven rewrite tests in [app.test.ts](/Users/mila/code/playground/nedluzimstatu/rewrite_service/test/app.test.ts)
- runtime verification captures in [2026-03-24T11-09-39.232Z-mail-fixtures/summary.json](/Users/mila/code/playground/nedluzimstatu/runtime_verification/captures/2026-03-24T11-09-39.232Z-mail-fixtures/summary.json), [2026-03-24T11-18-51.314Z-mail-probes/summary.json](/Users/mila/code/playground/nedluzimstatu/runtime_verification/captures/2026-03-24T11-18-51.314Z-mail-probes/summary.json), and [2026-03-24T10-54-22.769Z-transformation-probes/summary.json](/Users/mila/code/playground/nedluzimstatu/runtime_verification/captures/2026-03-24T10-54-22.769Z-transformation-probes/summary.json).

The goal here is compatibility, not architecture purity.

## What Legacy Behaviors Are Already Matched

These behaviors are already implemented in the rewrite skeleton and are either covered by rewrite tests or directly visible in the current code.

### HTTP boundary for `POST /zadosti`

- Success returns `200` with an empty body.
  Evidence:
  [app.test.ts](/Users/mila/code/playground/nedluzimstatu/rewrite_service/test/app.test.ts#L37),
  [zadosti.ts](/Users/mila/code/playground/nedluzimstatu/rewrite_service/src/routes/zadosti.ts#L18),
  [zadosti.ts](/Users/mila/code/playground/nedluzimstatu/rewrite_service/src/services/zadosti.ts#L203).
- Missing `recipientEmail` returns `400`.
  Evidence:
  [app.test.ts](/Users/mila/code/playground/nedluzimstatu/rewrite_service/test/app.test.ts#L58),
  [zadosti.ts](/Users/mila/code/playground/nedluzimstatu/rewrite_service/src/services/zadosti.ts#L98),
  [zadosti.ts](/Users/mila/code/playground/nedluzimstatu/rewrite_service/src/services/zadosti.ts#L199).
- Malformed JSON returns `500`.
  Evidence:
  [app.test.ts](/Users/mila/code/playground/nedluzimstatu/rewrite_service/test/app.test.ts#L77),
  [app.ts](/Users/mila/code/playground/nedluzimstatu/rewrite_service/src/app.ts#L13).

### Attachment planning and recipient fan-out

- The rewrite supports all five legacy institution types:
  - `celni-sprava`
  - `financni-urad`
  - `obec`
  - `ossz`
  - `pojistovna`
  Evidence:
  [zadosti.ts](/Users/mila/code/playground/nedluzimstatu/rewrite_service/src/services/zadosti.ts#L22).
- `pojistovna` supports both a single object and an array.
  Evidence:
  [app.test.ts](/Users/mila/code/playground/nedluzimstatu/rewrite_service/test/app.test.ts#L115),
  [zadosti.ts](/Users/mila/code/playground/nedluzimstatu/rewrite_service/src/services/zadosti.ts#L146).
- Attachment order matches the legacy orchestration order reconstructed from source:
  - `celni-sprava`
  - `financni-urad`
  - `obec`
  - `ossz`
  - `pojistovna`
  Evidence:
  [app.test.ts](/Users/mila/code/playground/nedluzimstatu/rewrite_service/test/app.test.ts#L91),
  [zadosti.ts](/Users/mila/code/playground/nedluzimstatu/rewrite_service/src/services/zadosti.ts#L22).
- `obec` payload includes `items`, and missing `items` does not hard-fail.
  Evidence:
  [app.test.ts](/Users/mila/code/playground/nedluzimstatu/rewrite_service/test/app.test.ts#L184),
  [zadosti.ts](/Users/mila/code/playground/nedluzimstatu/rewrite_service/src/services/zadosti.ts#L134).

### Legacy attachment filenames and mail metadata

- Fixed legacy `from` is preserved.
  Evidence:
  [app.test.ts](/Users/mila/code/playground/nedluzimstatu/rewrite_service/test/app.test.ts#L162),
  [zadosti.ts](/Users/mila/code/playground/nedluzimstatu/rewrite_service/src/services/zadosti.ts#L14),
  [zadosti.ts](/Users/mila/code/playground/nedluzimstatu/rewrite_service/src/services/zadosti.ts#L181).
- Fixed legacy `subject` is preserved.
  Evidence:
  [app.test.ts](/Users/mila/code/playground/nedluzimstatu/rewrite_service/test/app.test.ts#L162),
  [zadosti.ts](/Users/mila/code/playground/nedluzimstatu/rewrite_service/src/services/zadosti.ts#L19),
  [zadosti.ts](/Users/mila/code/playground/nedluzimstatu/rewrite_service/src/services/zadosti.ts#L184).
- Current filename mapping matches the reconstructed legacy naming, including `Bezdluznost - CSSZ.pdf` and known insurance short names.
  Evidence:
  [app.test.ts](/Users/mila/code/playground/nedluzimstatu/rewrite_service/test/app.test.ts#L91),
  [app.test.ts](/Users/mila/code/playground/nedluzimstatu/rewrite_service/test/app.test.ts#L115),
  [zadosti.ts](/Users/mila/code/playground/nedluzimstatu/rewrite_service/src/services/zadosti.ts#L69).
- Text and HTML mail bodies are wired into the outgoing mail object.
  Evidence:
  [zadosti.ts](/Users/mila/code/playground/nedluzimstatu/rewrite_service/src/services/zadosti.ts#L185),
  [zadostText.ts](/Users/mila/code/playground/nedluzimstatu/rewrite_service/src/templates/zadostText.ts),
  [zadostHtml.ts](/Users/mila/code/playground/nedluzimstatu/rewrite_service/src/templates/zadostHtml.ts).

### Permissive request handling that aligns with runtime findings

- The current rewrite keeps permissive pass-through behavior for:
  - `reply_to.reply_to`
  - `permanent_addres`
  - optional `company_registration_number`
  - missing `items` for `obec`
- This is directionally aligned with observed runtime behavior where many partial inputs still returned `200`.
  Evidence:
  [zadosti.ts](/Users/mila/code/playground/nedluzimstatu/rewrite_service/src/services/zadosti.ts#L89),
  [2026-03-24T11-18-51.314Z-mail-probes/summary.json](/Users/mila/code/playground/nedluzimstatu/runtime_verification/captures/2026-03-24T11-18-51.314Z-mail-probes/summary.json).

## What Is Intentionally Stubbed

These are deliberate phase-1 omissions, not accidental gaps.

- PDF rendering is stubbed behind `TransformationAdapter`.
  The current adapter returns deterministic PDF-like buffers for stable tests, not real XSL/XSL-FO output.
  Evidence:
  [stubTransformationAdapter.ts](/Users/mila/code/playground/nedluzimstatu/rewrite_service/src/adapters/transformation/stubTransformationAdapter.ts).
- Mail delivery is stubbed behind `MailProvider`.
  The current rewrite uses test and logging providers, not SendGrid.
  Evidence:
  [inMemoryMailProvider.ts](/Users/mila/code/playground/nedluzimstatu/rewrite_service/src/adapters/mail/inMemoryMailProvider.ts),
  [loggingMailProvider.ts](/Users/mila/code/playground/nedluzimstatu/rewrite_service/src/adapters/mail/loggingMailProvider.ts).
- The rewrite currently implements only the new app boundary:
  - `GET /health`
  - `POST /zadosti`
  It does not expose standalone HTTP transformation endpoints returning `201` + PDF.

## What Still Differs From Legacy Runtime

These are real differences relative to the observed legacy runtime and should be treated as open compatibility gaps.

### Error response bodies and content types differ

- Legacy runtime returned JSON error bodies for at least these cases:
  - malformed JSON => `500` with JSON body
  - missing `recipientEmail` => `400` with JSON body
  Evidence:
  [rv-zad-101/meta.json](/Users/mila/code/playground/nedluzimstatu/runtime_verification/captures/2026-03-24T11-18-51.314Z-mail-probes/rv-zad-101/meta.json),
  [rv-zad-101/response-body.txt](/Users/mila/code/playground/nedluzimstatu/runtime_verification/captures/2026-03-24T11-18-51.314Z-mail-probes/rv-zad-101/response-body.txt),
  [rv-zad-201/meta.json](/Users/mila/code/playground/nedluzimstatu/runtime_verification/captures/2026-03-24T11-18-51.314Z-mail-probes/rv-zad-201/meta.json),
  [rv-zad-201/response-body.txt](/Users/mila/code/playground/nedluzimstatu/runtime_verification/captures/2026-03-24T11-18-51.314Z-mail-probes/rv-zad-201/response-body.txt).
- The rewrite currently returns empty bodies for those errors.
  Evidence:
  [app.test.ts](/Users/mila/code/playground/nedluzimstatu/rewrite_service/test/app.test.ts#L58),
  [app.test.ts](/Users/mila/code/playground/nedluzimstatu/rewrite_service/test/app.test.ts#L77),
  [app.ts](/Users/mila/code/playground/nedluzimstatu/rewrite_service/src/app.ts#L29),
  [zadosti.ts](/Users/mila/code/playground/nedluzimstatu/rewrite_service/src/services/zadosti.ts#L199).

### Real transformation output is not yet matched

- Legacy transformation endpoints return `201` and PDF bodies.
  Evidence:
  [2026-03-24T10-54-22.769Z-transformation-probes/summary.json](/Users/mila/code/playground/nedluzimstatu/runtime_verification/captures/2026-03-24T10-54-22.769Z-transformation-probes/summary.json).
- The rewrite currently produces placeholder PDF-like buffers only inside the app; it does not reproduce legacy PDF bytes, headers, or status codes.

### Real mail delivery behavior is not yet matched

- Legacy `/zadosti` was verified against a running service and returned `200` for the real-email happy path to `mila@shrug.cz`.
  Evidence:
  [2026-03-24T11-19-54.064Z-real-email-happy-path/summary.json](/Users/mila/code/playground/nedluzimstatu/runtime_verification/captures/2026-03-24T11-19-54.064Z-real-email-happy-path/summary.json).
- The rewrite currently does not send real mail, so delivery behavior, provider error propagation, and any SendGrid-specific constraints remain unmatched.

### Negative-case parity is only partial

- Runtime findings show permissive `200` behavior for:
  - missing `applicant`
  - empty `recipients`
  - malformed `pojistovna`
  - missing `items` for `obec`
  - `permanent_address` variant
  - missing `reply_to.reply_to` nesting
  - single vs array `pojistovna`
  - `company_registration_number` present
  Evidence:
  [2026-03-24T11-18-51.314Z-mail-probes/summary.json](/Users/mila/code/playground/nedluzimstatu/runtime_verification/captures/2026-03-24T11-18-51.314Z-mail-probes/summary.json).
- The rewrite code is intentionally permissive, but not all of those runtime cases are yet frozen by rewrite-local tests.

### Transformation HTTP API surface is absent

- The legacy service pair had directly reachable transformation endpoints used during runtime verification.
- The rewrite currently inlines document generation behind an adapter and does not expose `/celni-sprava`, `/financni-urad`, `/obec`, `/ossz`, or `/pojistovna` as HTTP routes.
- This is only compatible if those endpoints are purely internal and no external caller depends on them.

## Which Differences Are Acceptable In Phase 1

These differences are acceptable for a rewrite skeleton, but not automatically acceptable for production cutover.

- Stub PDF generation is acceptable in phase 1 because the current goal is orchestration shape, not final document fidelity.
- Fake/logging mail providers are acceptable in phase 1 because phase 1 explicitly avoids real SendGrid integration.
- Missing standalone transformation HTTP endpoints are acceptable in phase 1 if the target cutover architecture is a single service and there is no external dependency on the old internal endpoint surface.
- Empty error bodies for `400` and `500` are acceptable in phase 1 only as a temporary simplification for local development and tests.
  They are not yet proven safe for cutover because runtime evidence shows different response bodies and content types.
- Partial negative-case coverage in rewrite-local tests is acceptable in phase 1 because the runtime behavior is already captured separately, but those cases should be frozen before cutover.

## What Phase 2 Must Implement Before Cutover

### Required for compatibility cutover

- Replace `StubTransformationAdapter` with a real implementation that reproduces legacy documents closely enough for operational use.
- Replace the fake/logging mail provider with a real provider implementation and verify successful end-to-end delivery.
- Decide and implement the cutover policy for error responses:
  - either match legacy JSON error bodies and content types for known failure cases
  - or explicitly accept a documented compatibility break
- Freeze the runtime-verified permissive cases in rewrite-local tests:
  - missing `applicant`
  - empty `recipients`
  - malformed `pojistovna`
  - `permanent_address` variant
  - missing `reply_to.reply_to`
  - `company_registration_number`
- Verify failure propagation semantics for:
  - transformation failure
  - mail provider failure

### Decision needed before cutover

- Decide whether the replacement architecture must expose standalone transformation HTTP endpoints.
  If yes, phase 2 must implement them with the observed legacy behavior:
  - `201`
  - PDF body
  - endpoint names matching the legacy set
- Decide whether exact email body content must remain byte-for-byte stable or whether semantic equivalence is sufficient.
- Decide whether attachment bytes need golden-file comparison against legacy output for a representative fixture set.

## Bottom Line

The phase-1 rewrite is already a reasonable compatibility skeleton for the `/zadosti` orchestration path:

- success `200` behavior matches
- recipient fan-out matches
- naming rules match
- permissive request handling direction matches

It is not cutover-ready yet because the largest legacy-visible gaps are still open:

- real PDF generation
- real mail delivery
- error response body parity
- explicit decision on transformation endpoint exposure
