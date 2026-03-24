# Compatibility Gap

This document compares the current `rewrite_service` phase-2 state against:

- reconstructed source contracts in [contracts-reconstruction.md](/Users/mila/code/playground/nedluzimstatu/docs/contracts-reconstruction.md)
- rewrite readiness notes in [rewrite-readiness.md](/Users/mila/code/playground/nedluzimstatu/docs/rewrite-readiness.md)
- rewrite-local tests in [app.test.ts](/Users/mila/code/playground/nedluzimstatu/rewrite_service/test/app.test.ts) and [pdfTransformationAdapter.test.ts](/Users/mila/code/playground/nedluzimstatu/rewrite_service/test/pdfTransformationAdapter.test.ts)
- runtime verification captures in [2026-03-24T11-09-39.232Z-mail-fixtures/summary.json](/Users/mila/code/playground/nedluzimstatu/runtime_verification/captures/2026-03-24T11-09-39.232Z-mail-fixtures/summary.json), [2026-03-24T11-18-51.314Z-mail-probes/summary.json](/Users/mila/code/playground/nedluzimstatu/runtime_verification/captures/2026-03-24T11-18-51.314Z-mail-probes/summary.json), and [2026-03-24T10-54-22.769Z-transformation-probes/summary.json](/Users/mila/code/playground/nedluzimstatu/runtime_verification/captures/2026-03-24T10-54-22.769Z-transformation-probes/summary.json).

The goal remains compatibility, not redesign.

## What Legacy Behaviors Are Already Matched

### HTTP boundary for `POST /zadosti`

- Success returns `200` with an empty body.
- Missing `recipientEmail` returns `400`.
- Malformed JSON returns `500`.
Evidence:
[app.test.ts](/Users/mila/code/playground/nedluzimstatu/rewrite_service/test/app.test.ts#L37),
[app.ts](/Users/mila/code/playground/nedluzimstatu/rewrite_service/src/app.ts#L13),
[zadosti.ts](/Users/mila/code/playground/nedluzimstatu/rewrite_service/src/services/zadosti.ts#L199).

### Attachment planning and naming

- All five legacy document types are supported:
  - `celni-sprava`
  - `financni-urad`
  - `obec`
  - `ossz`
  - `pojistovna`
- `pojistovna` supports single object and array fan-out.
- Attachment order matches the reconstructed legacy orchestration order.
- Attachment filenames match the legacy naming rules, including `Bezdluznost - CSSZ.pdf` and insurance short-name mapping.
Evidence:
[app.test.ts](/Users/mila/code/playground/nedluzimstatu/rewrite_service/test/app.test.ts#L91),
[zadosti.ts](/Users/mila/code/playground/nedluzimstatu/rewrite_service/src/services/zadosti.ts#L22),
[zadosti.ts](/Users/mila/code/playground/nedluzimstatu/rewrite_service/src/services/zadosti.ts#L69).

### Permissive payload handling

- `reply_to.reply_to` is preserved.
- direct `reply_to` shapes are also tolerated.
- `permanent_addres` is preserved.
- `permanent_address` is also tolerated.
- optional `company_registration_number` is rendered when present.
- missing `items` for `obec` does not hard-fail.
Evidence:
[buildLetterDocument.ts](/Users/mila/code/playground/nedluzimstatu/rewrite_service/src/adapters/transformation/pdf/buildLetterDocument.ts#L193),
[pdfTransformationAdapter.test.ts](/Users/mila/code/playground/nedluzimstatu/rewrite_service/test/pdfTransformationAdapter.test.ts#L77),
[2026-03-24T11-18-51.314Z-mail-probes/summary.json](/Users/mila/code/playground/nedluzimstatu/runtime_verification/captures/2026-03-24T11-18-51.314Z-mail-probes/summary.json).

### Real PDF generation now exists

- The rewrite now returns real PDF buffers, not placeholder `%PDF` text blobs.
- Generated output is non-empty, PDF-like, and rendered in-process without internal HTTP calls.
- Institution-specific body content is built explicitly from the reconstructed contract.
Evidence:
[pdfTransformationAdapter.ts](/Users/mila/code/playground/nedluzimstatu/rewrite_service/src/adapters/transformation/pdfTransformationAdapter.ts),
[renderPdf.ts](/Users/mila/code/playground/nedluzimstatu/rewrite_service/src/adapters/transformation/pdf/renderPdf.ts),
[buildLetterDocument.ts](/Users/mila/code/playground/nedluzimstatu/rewrite_service/src/adapters/transformation/pdf/buildLetterDocument.ts),
[pdfTransformationAdapter.test.ts](/Users/mila/code/playground/nedluzimstatu/rewrite_service/test/pdfTransformationAdapter.test.ts#L45).

### Mail composition still matches the reconstructed contract

- Fixed legacy `from` is preserved.
- Fixed legacy `subject` is preserved.
- Text and HTML mail bodies are still wired into the outgoing mail object.
Evidence:
[app.test.ts](/Users/mila/code/playground/nedluzimstatu/rewrite_service/test/app.test.ts#L162),
[zadosti.ts](/Users/mila/code/playground/nedluzimstatu/rewrite_service/src/services/zadosti.ts#L172),
[zadostText.ts](/Users/mila/code/playground/nedluzimstatu/rewrite_service/src/templates/zadostText.ts),
[zadostHtml.ts](/Users/mila/code/playground/nedluzimstatu/rewrite_service/src/templates/zadostHtml.ts).

## What Is Intentionally Still Stubbed

- Real mail delivery is still behind `MailProvider`.
  The rewrite currently uses test and logging providers, not SendGrid.
  Evidence:
  [inMemoryMailProvider.ts](/Users/mila/code/playground/nedluzimstatu/rewrite_service/src/adapters/mail/inMemoryMailProvider.ts),
  [loggingMailProvider.ts](/Users/mila/code/playground/nedluzimstatu/rewrite_service/src/adapters/mail/loggingMailProvider.ts).
- Standalone HTTP transformation endpoints are still not exposed.
  The rewrite generates attachments internally through the adapter instead of exposing `/celni-sprava`, `/financni-urad`, `/obec`, `/ossz`, `/pojistovna`.

## What Still Differs From Legacy Runtime

### Error response bodies and content types still differ

- Legacy runtime returned JSON error bodies for at least:
  - malformed JSON => `500`
  - missing `recipientEmail` => `400`
  Evidence:
  [rv-zad-101/meta.json](/Users/mila/code/playground/nedluzimstatu/runtime_verification/captures/2026-03-24T11-18-51.314Z-mail-probes/rv-zad-101/meta.json),
  [rv-zad-101/response-body.txt](/Users/mila/code/playground/nedluzimstatu/runtime_verification/captures/2026-03-24T11-18-51.314Z-mail-probes/rv-zad-101/response-body.txt),
  [rv-zad-201/meta.json](/Users/mila/code/playground/nedluzimstatu/runtime_verification/captures/2026-03-24T11-18-51.314Z-mail-probes/rv-zad-201/meta.json),
  [rv-zad-201/response-body.txt](/Users/mila/code/playground/nedluzimstatu/runtime_verification/captures/2026-03-24T11-18-51.314Z-mail-probes/rv-zad-201/response-body.txt).
- The rewrite still returns empty bodies for those errors.

### Generated PDFs are real, but not legacy-equivalent yet

- Legacy transformation endpoints returned `201` plus PDF bodies through the old runtime.
  Evidence:
  [2026-03-24T10-54-22.769Z-transformation-probes/summary.json](/Users/mila/code/playground/nedluzimstatu/runtime_verification/captures/2026-03-24T10-54-22.769Z-transformation-probes/summary.json).
- The rewrite now generates real PDFs, but they are newly rendered with `pdfkit`, not the old XSL/XSL-FO layout.
- This means the remaining gap is now document fidelity, not the absence of PDF generation.

### Real mail-provider behavior is still unmatched

- Legacy `/zadosti` was verified against a running service, including a dedicated real-email happy path to `mila@shrug.cz`.
  Evidence:
  [2026-03-24T11-19-54.064Z-real-email-happy-path/summary.json](/Users/mila/code/playground/nedluzimstatu/runtime_verification/captures/2026-03-24T11-19-54.064Z-real-email-happy-path/summary.json).
- The rewrite still does not send real mail, so delivery semantics and provider failure propagation remain open.

### Negative-case parity is still only partially frozen in rewrite-local tests

- Runtime findings showed permissive `200` behavior for:
  - missing `applicant`
  - empty `recipients`
  - malformed `pojistovna`
  - missing `items` for `obec`
  - `permanent_address` variant
  - missing `reply_to.reply_to` nesting
  - single vs array `pojistovna`
  - `company_registration_number` present
- The rewrite is intentionally permissive, but rewrite-local tests still do not freeze every one of those runtime-observed cases.

### Transformation HTTP API surface is still absent

- The legacy service pair exposed direct transformation endpoints used during runtime verification.
- The rewrite currently has no direct HTTP equivalent for those endpoints.
- This is only acceptable if nothing external depends on them.

## Which Differences Are Acceptable Right Now

- Using a new in-process PDF renderer is acceptable now because the rewrite no longer depends on the legacy black-box transformation runtime and already produces real attachments for compatibility work.
- Remaining PDF differences are acceptable at this stage as long as they are treated as fidelity gaps, not ignored.
- Fake/logging mail providers are still acceptable until delivery semantics are implemented.
- Missing standalone transformation HTTP endpoints are acceptable only if the replacement is intended to collapse the legacy pair into one deployable service.
- Empty error bodies for `400` and `500` remain acceptable only as a temporary simplification for the rewrite branch, not as an assumed cutover-safe behavior.

## What Must Happen Before Cutover

### Required implementation work

- Implement a real mail provider adapter and verify successful end-to-end delivery.
- Decide and implement the final compatibility policy for error responses:
  - match legacy JSON error bodies and content types
  - or accept an explicit compatibility break
- Freeze the runtime-observed permissive cases in rewrite-local tests.
- Verify failure propagation for:
  - mail provider failure
  - PDF generation failure

### Required comparison work for PDFs

- Compare rewrite-generated PDFs against legacy runtime output for a representative fixture set.
- Review:
  - body wording
  - presence of key fields
  - handling of `reason`
  - handling of `reply_to`
  - handling of `company_registration_number`
  - handling of `obec.items`
- Decide whether semantic equivalence is sufficient or whether closer visual/layout parity is required.

### Architectural decision still needed

- Decide whether standalone transformation endpoints must exist after cutover.
  If yes, the rewrite still needs an HTTP surface for:
  - `/celni-sprava`
  - `/financni-urad`
  - `/obec`
  - `/ossz`
  - `/pojistovna`

## Bottom Line

The largest phase-1 gap is now closed:

- the rewrite no longer uses placeholder PDF buffers
- the rewrite generates real attachments in-process

The main cutover blockers are now narrower and clearer:

- real mail delivery
- error response parity
- PDF fidelity review against legacy output
- decision on standalone transformation endpoint compatibility
