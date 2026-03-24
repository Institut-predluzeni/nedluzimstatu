# rewrite_service phase 1

This is the first compatibility-focused rewrite skeleton for the legacy `mail_service` + `transformation_service` flow behind `nedluzimstatu.cz`.

It is intentionally not a redesign.

Phase 1 goal:

- preserve the legacy-visible HTTP boundary for `/zadosti`
- keep the code small and understandable
- keep only the seams that matter for phase 2 replacement
- make later replacement of stubs straightforward

## Stack

- Node.js
- TypeScript
- Fastify
- Vitest

Fastify was chosen because it keeps the HTTP layer compact and gives simple in-process request testing via `inject()`.

## Phase 1 includes

- `GET /health`
- `POST /zadosti`
- legacy-compatible success behavior for `POST /zadosti`:
  - `200 OK`
  - empty response body
- explicit `recipientEmail` requirement:
  - missing `recipientEmail` => `400`
- compatibility-oriented permissive handling for the rest of the payload
- attachment planning for:
  - `celni-sprava`
  - `financni-urad`
  - `obec`
  - `ossz`
  - `pojistovna`
- support for:
  - single `pojistovna`
  - array `pojistovna`
- fixed legacy sender and subject
- text and HTML templates wired into composed email objects
- stub PDF generation behind a `TransformationAdapter`
- fake/logging mail providers behind a `MailProvider`
- most `/zadosti` compatibility logic kept in one module so it can be read in one pass

## Intentionally stubbed in phase 1

- real PDF rendering
- real XSL/XSL-FO execution
- real SendGrid integration
- direct reuse of legacy base images
- production mail delivery

The current `StubTransformationAdapter` returns deterministic PDF-like buffers so tests can stay stable and the orchestration path can be built now.

The only deliberate interfaces in phase 1 are:

- `TransformationAdapter`
- `MailProvider`

Everything else is kept as plain functions and constants to reduce indirection.

## Compatibility assumptions currently preserved

- `POST /zadosti` success returns `200` with empty body
- malformed JSON returns `500` with empty body
- attachment filenames match current legacy naming
- insurance short-name mapping matches the legacy JavaScript behavior
- `reply_to.reply_to` nesting is preserved as-is
- `permanent_addres` is not corrected or normalized
- optional `company_registration_number` is passed through as-is
- missing `items` for `obec` does not hard-fail in phase 1
- no internal HTTP calls are made between mail and transformation logic

## Project layout

- [src/app.ts](/Users/mila/code/playground/nedluzimstatu/rewrite_service/src/app.ts): Fastify app wiring
- [src/server.ts](/Users/mila/code/playground/nedluzimstatu/rewrite_service/src/server.ts): local entrypoint
- [src/routes/zadosti.ts](/Users/mila/code/playground/nedluzimstatu/rewrite_service/src/routes/zadosti.ts): `/zadosti` route
- [src/routes/health.ts](/Users/mila/code/playground/nedluzimstatu/rewrite_service/src/routes/health.ts): health route
- [src/services/zadosti.ts](/Users/mila/code/playground/nedluzimstatu/rewrite_service/src/services/zadosti.ts): compatibility logic for normalization, attachment planning, naming, and mail composition
- [src/adapters](/Users/mila/code/playground/nedluzimstatu/rewrite_service/src/adapters): external integration seams
- [src/templates](/Users/mila/code/playground/nedluzimstatu/rewrite_service/src/templates): legacy email body content
- [test](/Users/mila/code/playground/nedluzimstatu/rewrite_service/test): rewrite-skeleton tests

## Run locally

```bash
cd rewrite_service
npm install
npm run dev
```

Default port is `3000`.

Health check:

```bash
curl http://localhost:3000/health
```

## Run tests

```bash
cd rewrite_service
npm install
npm test
npm run build
```

## What phase 2 should implement next

1. replace the stub transformation adapter with real document generation
2. implement a real mail provider adapter
3. compare rewrite behavior against runtime verification evidence
4. decide which runtime-verified error semantics should be frozen more precisely
5. add richer compatibility tests once real PDF generation exists

## Non-goals for phase 1

- production cutover
- infrastructure packaging
- Dockerization
- tightening validation beyond the legacy-compatible minimum
- redesigning the external payload contract

## Current status

- `npm test` passes
- `npm run build` passes
