# rewrite_service phase 3

This is the first compatibility-focused rewrite skeleton for the legacy `mail_service` + `transformation_service` flow behind `nedluzimstatu.cz`.

It is intentionally not a redesign.

Current phase goal:

- preserve the legacy-visible HTTP boundary for `/zadosti`
- keep the code small and understandable
- keep only the seams that matter for cutover work
- keep explicit in-process PDF generation
- add real mail delivery behind an optional environment-driven provider

## Stack

- Node.js
- TypeScript
- Fastify
- Vitest

Fastify was chosen because it keeps the HTTP layer compact and gives simple in-process request testing via `inject()`.

## Current implementation includes

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
- real PDF generation behind a `TransformationAdapter`
- SendGrid-backed real delivery behind a `MailProvider`
- fake/logging mail providers remain available for tests and local development
- most `/zadosti` compatibility logic kept in one module so it can be read in one pass
- explicit institution-specific document builders for:
  - `celni-sprava`
  - `financni-urad`
  - `obec`
  - `ossz`
  - `pojistovna`
- shared PDF rendering via `pdfkit`

## Intentionally still stubbed

- direct reuse of legacy base images
- production delivery verification against a real mailbox

The current PDF implementation renders real PDF buffers in-process. It does not reuse the legacy XSLT/FOP runtime and does not try to match legacy PDF bytes exactly.

The only deliberate interfaces in the rewrite are:

- `TransformationAdapter`
- `MailProvider`

Everything else is kept as plain functions and constants to reduce indirection.

## Mail provider modes

Supported values for `MAIL_PROVIDER`:

- `log`
  Local-safe default. Does not send mail. Logs a compact summary only.
- `memory`
  Test-oriented provider. Keeps sent messages in memory only.
- `sendgrid`
  Real delivery via the SendGrid HTTP API. Requires `SENDGRID_API_KEY`.

## Compatibility assumptions currently preserved

- `POST /zadosti` success returns `200` with empty body
- malformed JSON returns `500` with empty body
- attachment filenames match current legacy naming
- insurance short-name mapping matches the legacy JavaScript behavior
- `reply_to.reply_to` nesting is preserved as-is
- `permanent_addres` is preserved and `permanent_address` is also tolerated
- optional `company_registration_number` is passed through as-is
- missing `items` for `obec` does not hard-fail in phase 1
- no internal HTTP calls are made between mail and transformation logic
- document text is built explicitly from the reconstructed contract, not through a black-box transformation container
- default sender stays at legacy values unless overridden by environment config

## Project layout

- [src/app.ts](/Users/mila/code/playground/nedluzimstatu/rewrite_service/src/app.ts): Fastify app wiring
- [src/server.ts](/Users/mila/code/playground/nedluzimstatu/rewrite_service/src/server.ts): local entrypoint
- [src/routes/zadosti.ts](/Users/mila/code/playground/nedluzimstatu/rewrite_service/src/routes/zadosti.ts): `/zadosti` route
- [src/routes/health.ts](/Users/mila/code/playground/nedluzimstatu/rewrite_service/src/routes/health.ts): health route
- [src/services/zadosti.ts](/Users/mila/code/playground/nedluzimstatu/rewrite_service/src/services/zadosti.ts): compatibility logic for normalization, attachment planning, naming, and mail composition
- [src/adapters/transformation/pdfTransformationAdapter.ts](/Users/mila/code/playground/nedluzimstatu/rewrite_service/src/adapters/transformation/pdfTransformationAdapter.ts): real PDF adapter
- [src/adapters/transformation/pdf](/Users/mila/code/playground/nedluzimstatu/rewrite_service/src/adapters/transformation/pdf): content builders and shared PDF renderer
- [src/adapters/mail/createMailProvider.ts](/Users/mila/code/playground/nedluzimstatu/rewrite_service/src/adapters/mail/createMailProvider.ts): provider selection
- [src/adapters/mail/sendGridMailProvider.ts](/Users/mila/code/playground/nedluzimstatu/rewrite_service/src/adapters/mail/sendGridMailProvider.ts): SendGrid-backed provider
- [src/adapters/mail](/Users/mila/code/playground/nedluzimstatu/rewrite_service/src/adapters/mail): mail-provider seam
- [src/config.ts](/Users/mila/code/playground/nedluzimstatu/rewrite_service/src/config.ts): env-based runtime config
- [src/templates](/Users/mila/code/playground/nedluzimstatu/rewrite_service/src/templates): legacy email body content
- [test](/Users/mila/code/playground/nedluzimstatu/rewrite_service/test): rewrite-skeleton tests

## Run locally

```bash
cd rewrite_service
npm install
npm run dev
```

Default port is `3000`.
Default mail mode is `log`, so local runs do not send real email unless you opt in.

Health check:

```bash
curl http://localhost:3000/health
```

### Run locally without sending mail

```bash
cd rewrite_service
MAIL_PROVIDER=log npm run dev
```

### Run locally with in-memory mail provider

```bash
cd rewrite_service
MAIL_PROVIDER=memory npm run dev
```

### Run with SendGrid

```bash
cd rewrite_service
MAIL_PROVIDER=sendgrid \
SENDGRID_API_KEY=your-key \
npm run dev
```

Optional sender override:

```bash
MAIL_FROM_EMAIL=custom@example.com
MAIL_FROM_NAME="Custom Sender"
```

If `MAIL_PROVIDER=sendgrid` and `SENDGRID_API_KEY` is missing, the service fails fast on startup.

## Environment variables

Required:

- `MAIL_PROVIDER=sendgrid` requires `SENDGRID_API_KEY`

Optional:

- `PORT`
  Default: `3000`
- `MAIL_PROVIDER`
  Default: `log`
  Supported: `log`, `memory`, `sendgrid`
- `MAIL_FROM_EMAIL`
  Default: `formulare@nedluzimstatu.cz`
- `MAIL_FROM_NAME`
  Default: `Nedlužím státu`
- `SENDGRID_API_BASE_URL`
  Default: `https://api.sendgrid.com/v3`

## Run tests

```bash
cd rewrite_service
npm install
npm test
npm run build
```

## Failure behavior

- malformed JSON => `500` with empty body
- missing `recipientEmail` => `400` with empty body
- mail provider failure => `500` with JSON body
  Current shape:
  `{"message":"Mail provider send failed"}`

The mail-provider failure response is explicit and simple, but it is still a compatibility decision that should be rechecked before cutover.

## Docker

The service is dockerized as a single image / single service deployment. The container runs the built Node.js app directly and does not depend on a second internal transformation or mail container.

### Build the image

From [rewrite_service](/Users/mila/code/playground/nedluzimstatu/rewrite_service):

```bash
docker build -t rewrite-service .
```

### Run locally in safe mode

```bash
docker run --rm \
  --name rewrite-service \
  -p 3000:3000 \
  -e MAIL_PROVIDER=log \
  rewrite-service
```

### Verify the healthcheck endpoint

From another terminal:

```bash
curl http://localhost:3000/health
```

To inspect the container health status:

```bash
docker ps
docker inspect --format='{{json .State.Health}}' rewrite-service
```

### Example production-style run

```bash
docker run --rm \
  --name rewrite-service \
  -p 3000:3000 \
  -e PORT=3000 \
  -e MAIL_PROVIDER=sendgrid \
  -e SENDGRID_API_KEY=your-key \
  -e MAIL_FROM_EMAIL=formulare@nedluzimstatu.cz \
  -e MAIL_FROM_NAME="Nedlužím státu" \
  rewrite-service
```

### Notes for Render / Fly.io / Railway / generic hosts

- The container listens on `0.0.0.0` and respects `PORT`.
- No secrets are baked into the image.
- Default startup command is the image `CMD`, so a separate custom start command is usually not needed.
- For local-safe deploy previews, keep `MAIL_PROVIDER=log`.

## What phase 3 should implement next

1. verify real SendGrid delivery against a controlled mailbox
2. compare generated PDFs against legacy runtime outputs for representative fixtures
3. decide whether legacy error JSON bodies must be preserved more closely
4. decide whether standalone transformation HTTP endpoints are needed at cutover
5. freeze more runtime-observed permissive edge cases in rewrite-local tests

## Non-goals in the current step

- production cutover
- infrastructure packaging
- tightening validation beyond the legacy-compatible minimum
- redesigning the external payload contract

## Current status

- `npm test` passes
- `npm run build` passes
- real PDF generation is in place
- real SendGrid-backed mail delivery is implemented behind env-based provider selection
- local and test execution remain safe by default because `MAIL_PROVIDER=log`
- the service can be packaged as a single production container image
