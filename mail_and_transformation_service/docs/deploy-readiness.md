# Deploy Readiness

## Container runtime assumptions

- Single container runs the whole app.
- No internal mail or transformation sidecar/service is required.
- App listens on `0.0.0.0` and respects `PORT`.
- Runtime image must include `assets/fonts` because PDF generation depends on them.
- Outbound network access is required if `MAIL_PROVIDER=sendgrid`.

## Required env vars

- `MAIL_PROVIDER=sendgrid` requires `SENDGRID_API_KEY`.

## Optional env vars

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
- `CORS_ORIGINS`
  Default: `*`
  Use a comma-separated origin list to restrict browser callers.

## Recommended healthcheck path

- `GET /health`
- Expect `200 OK`

## Logging expectations

- Default `MAIL_PROVIDER=log` writes compact mail-send summaries only.
- Application logs go to stdout/stderr.
- Startup failures, config failures, and uncaught runtime errors should be captured by the container platform.
- No structured log pipeline is built in yet.

## Rollback considerations

- Keep the legacy service pair deployable until rewrite cutover is proven.
- Rollback should mean switching traffic back to the legacy deployment, not debugging in production.
- Do not remove legacy SendGrid credentials or runtime verification artifacts before cutover confidence is established.
- Keep image tags immutable so rollback can target a known good build.

## Verify before first production cutover

- Container starts cleanly with production env vars.
- `GET /health` passes on the target platform.
- `POST /zadosti` happy path works against a controlled mailbox.
- SendGrid delivery works with real credentials and expected sender identity.
- Generated PDFs are acceptable against legacy samples for representative fixtures.
- Failure behavior is understood for:
  - missing `recipientEmail`
  - malformed JSON
  - SendGrid rejection or outage
- Monitoring/log access is available before sending production traffic.
