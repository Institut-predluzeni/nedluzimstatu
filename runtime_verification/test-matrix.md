# Runtime Verification Test Matrix

This matrix is for later execution against running legacy containers.

Status meanings:

- `planned`: case is defined but not yet executed
- `captured`: response evidence has been recorded under `runtime_verification/captures/`
- `reviewed`: captured evidence has been analyzed and conclusions were written down

## A. `/zadosti` success baseline

| ID | Status | Target | Input | Purpose | Capture focus |
| --- | --- | --- | --- | --- | --- |
| RV-ZAD-001 | planned | `POST /zadosti` | `docs/fixtures/zadosti-simple-financni-urad.json` | simplest known-good baseline | status, response body, response headers |
| RV-ZAD-002 | planned | `POST /zadosti` | `docs/fixtures/zadosti-multi-instituce.json` | multi-recipient orchestration baseline | status, response body, timing |
| RV-ZAD-003 | planned | `POST /zadosti` | `docs/fixtures/zadosti-multi-pojistovny.json` | array fan-out for `pojistovna` | status, response body, duplicate attachment handling |
| RV-ZAD-004 | planned | `POST /zadosti` | `docs/fixtures/zadosti-obec-items.json` | `obec.items` baseline | status, response body |
| RV-ZAD-005 | planned | `POST /zadosti` | `runtime_verification/probes/zadosti-happy-path-mila-shrug-cz.json` | happy path with real recipient `mila@shrug.cz` | status, response body, timing, delivery-side evidence |

## B. Malformed payloads

| ID | Status | Target | Input | Purpose | Capture focus |
| --- | --- | --- | --- | --- | --- |
| RV-ZAD-101 | planned | `POST /zadosti` | `runtime_verification/probes/zadosti-malformed.json.txt` | invalid JSON parsing behavior | status, error body, content-type |
| RV-ZAD-102 | planned | `POST /zadosti` | same malformed body with `Content-Type: text/plain` | parser/content-type behavior | status, error body |

## C. Missing required fields

These cases are runtime-only because the source tree does not fully prove validation behavior.

| ID | Status | Target | Input | Purpose | Capture focus |
| --- | --- | --- | --- | --- | --- |
| RV-ZAD-201 | planned | `POST /zadosti` | `runtime_verification/probes/zadosti-missing-recipient-email.json` | missing mail recipient address | status, error body |
| RV-ZAD-202 | planned | `POST /zadosti` | `runtime_verification/probes/zadosti-missing-applicant.json` | missing `applicant` | status, error body |
| RV-ZAD-203 | planned | `POST /zadosti` | `runtime_verification/probes/zadosti-empty-recipients.json` | no selected recipients | status, response body |
| RV-ZAD-204 | planned | `POST /zadosti` | `runtime_verification/probes/zadosti-missing-reason.json` | missing `reason` | status, error body |
| RV-ZAD-205 | planned | `POST /zadosti` | `runtime_verification/probes/zadosti-obec-missing-items.json` | missing `items` for `obec` | status, response body |
| RV-ZAD-206 | planned | `POST /zadosti` | `runtime_verification/probes/zadosti-malformed-pojistovna.json` | malformed `pojistovna` shape | status, error body |

## D. Downstream failure behavior

| ID | Status | Target | Input | Purpose | Capture focus |
| --- | --- | --- | --- | --- | --- |
| RV-ZAD-301 | planned | `POST /zadosti` | any known-good fixture while transformation service is unreachable | transformation failure propagation | status, error body, timeout behavior |
| RV-ZAD-302 | planned | `POST /zadosti` | any known-good fixture while one transformation endpoint fails selectively | partial failure behavior | status, response body |
| RV-ZAD-303 | planned | `POST /zadosti` | any known-good fixture while mail provider is misconfigured/unreachable | mail provider failure propagation | status, error body |

Execution note:

- These are environment-driven cases. The harness can send the request, but failure induction depends on how the local containers are started.

## E. Transformation endpoint runtime checks

These cases verify behavior that is only inferred from source today.

| ID | Status | Target | Input | Purpose | Capture focus |
| --- | --- | --- | --- | --- | --- |
| RV-TRF-001 | planned | `POST /celni-sprava` | `runtime_verification/probes/transformation-celni-sprava-minimal.json` | minimal endpoint baseline | status, headers, PDF-like body, size, timing |
| RV-TRF-002 | planned | `POST /financni-urad` | `runtime_verification/probes/transformation-financni-urad-boolean-reason.json` | minimal endpoint baseline | status, headers, PDF-like body, size, timing |
| RV-TRF-003 | planned | `POST /obec` | `runtime_verification/probes/transformation-obec-items-boolean.json` | minimal endpoint baseline | status, headers, PDF-like body, size, timing |
| RV-TRF-004 | planned | `POST /ossz` | `runtime_verification/probes/transformation-ossz-minimal.json` | minimal endpoint baseline | status, headers, PDF-like body, size, timing |
| RV-TRF-005 | planned | `POST /pojistovna` | `runtime_verification/probes/transformation-pojistovna-minimal.json` | minimal endpoint baseline | status, headers, PDF-like body, size, timing |
| RV-TRF-006 | planned | `POST /financni-urad` | `runtime_verification/probes/transformation-financni-urad-string-reason.json` | `"true"` coercion behavior | status, PDF/text body |
| RV-TRF-007 | planned | `POST /financni-urad` | `runtime_verification/probes/transformation-financni-urad-number-reason.json` | `1` coercion behavior | status, PDF/text body |
| RV-TRF-008 | planned | `POST /financni-urad` | `runtime_verification/probes/transformation-financni-urad-null-reason.json` | `null` handling | status, PDF/text body |
| RV-TRF-009 | planned | `POST /obec` | `runtime_verification/probes/transformation-obec-permanent-address-variant.json` | direct spelling variant probe | status, PDF/text body |
| RV-TRF-010 | planned | `POST /financni-urad` | `runtime_verification/probes/transformation-financni-urad-reply-to-no-nesting.json` | direct nesting variant probe | status, PDF/text body |
| RV-TRF-011 | planned | `POST /financni-urad` | `runtime_verification/probes/transformation-financni-urad-company-registration-number.json` | optional company ID probe | status, PDF/text body |

## F. Spelling variant checks

| ID | Status | Target | Input | Purpose | Capture focus |
| --- | --- | --- | --- | --- | --- |
| RV-SPL-001 | planned | `POST /zadosti` | `docs/fixtures/zadosti-obec-items.json` | control case using `permanent_addres` | status, response body |
| RV-SPL-002 | planned | `POST /zadosti` | `runtime_verification/probes/zadosti-permanent-address-variant.json` | spelling variant using `permanent_address` | status, response body |
| RV-SPL-003 | planned | `POST /obec` | `runtime_verification/probes/transformation-obec-permanent-address-variant.json` | narrow transformation/runtime parser check | status, PDF/text body |
| RV-SPL-004 | planned | `POST /zadosti` | `runtime_verification/probes/zadosti-reply-to-no-nesting.json` | runtime handling of missing nested `reply_to.reply_to` | status, response body |
| RV-SPL-005 | planned | `POST /financni-urad` | `runtime_verification/probes/transformation-financni-urad-reply-to-no-nesting.json` | direct runtime handling of missing nested `reply_to.reply_to` | status, PDF/text body |

## Capture Review Checklist

For each captured run, record:

- exact URL used
- container version or image tag, if known
- request body file
- request headers
- response status
- response headers
- whether response body was text or binary
- short interpretation notes

## Recommended Result Storage

Use one capture directory per run:

- `runtime_verification/captures/2026-03-24T10-15-00-rv-zad-001/`
- `runtime_verification/captures/2026-03-24T10-20-00-rv-zad-101/`

Keep the matrix stable and store evidence under `captures/` rather than editing expected outcomes prematurely.
