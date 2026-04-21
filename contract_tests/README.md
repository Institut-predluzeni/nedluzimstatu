# Contract Tests

This package freezes the currently reconstructed compatibility contract of the legacy `mail_service/zadosti.js` orchestration.

It does not run the hidden legacy containers and it does not attempt a production rewrite.

## Install

From the repository root:

```bash
cd contract_tests
npm install
```

## Run

Generate the machine-readable baseline artifact:

```bash
npm run generate:baseline
```

Run the contract suite:

```bash
npm test
```

Watch mode:

```bash
npm run test:watch
```

## What The Suite Covers

- source-grounded request-to-internal-call mapping for `mail_service/zadosti.js`
- source-grounded exact transformation request payloads for the documented fixtures
- source-grounded fixed request headers sent to transformation endpoints
- source-grounded outgoing mail object construction for fields visible in source:
  - `from`
  - `to`
  - `subject`
  - body file reads
  - attachment count
  - attachment filenames
- shared payload-shape rules:
  - `/celni-sprava`, `/financni-urad`, `/ossz`, `/pojistovna` share the same payload shape
  - `/obec` includes `items`
- edge-case compatibility guards:
  - single vs array `recipients["pojistovna"]`
  - `reply_to.reply_to` nesting
  - legacy typo `permanent_addres`
  - optional `company_registration_number`
  - `obec.items`
  - fallback insurance attachment naming for known, unknown, and `null` names

All current tests are explicitly labeled `[source-grounded]`.
There are intentionally no `[inferred]` tests in this suite at the moment.

## What The Suite Intentionally Does Not Cover

- real HTTP status codes or response bodies of the legacy `/zadosti` container
- runtime shape of the hidden `mail-service` helper objects returned by `HTTP.post(...)` and `File.read(...)`
- real routing inside `filipjirsak/xslt-service`
- real PDF generation, PDF content, or transformation runtime behavior
- validation semantics that are not provable from the local source tree

Those belong to later runtime-verification tests against the actual legacy containers.

## Harness Notes

- The adapter executes `mail_service/zadosti.js` in a VM and stubs `HTTP.post` and `File.read`.
- The stub return-object shape is test-harness-specific and is not treated as part of the frozen legacy contract.
- Contract assertions intentionally target only:
  - requested transformation calls
  - forwarded payloads
  - headers
  - file reads
  - stable mail object fields visible directly in source
- Hidden base-image behavior is left for later runtime-verification tests.
