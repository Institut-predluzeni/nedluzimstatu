import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";

const CURRENT_DIR = path.dirname(fileURLToPath(import.meta.url));
export const RUNTIME_VERIFICATION_DIR = path.resolve(CURRENT_DIR, "..");
export const REPO_ROOT = path.resolve(RUNTIME_VERIFICATION_DIR, "..");
export const DEFAULT_CAPTURE_DIR = path.join(RUNTIME_VERIFICATION_DIR, "captures");
export const DOC_FIXTURE_DIR = path.join(REPO_ROOT, "docs", "fixtures");
export const MAIL_SERVICE_URL_ENV = "MAIL_SERVICE_URL";
export const TRANSFORMATION_SERVICE_URL_ENV = "TRANSFORMATION_SERVICE_URL";

export function parseArgs(argv) {
  const args = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      continue;
    }

    const key = token.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      args[key] = "true";
      continue;
    }

    args[key] = next;
    index += 1;
  }

  return args;
}

export function requireArg(args, name) {
  const value = args[name];
  if (!value) {
    throw new Error(`Missing required argument --${name}`);
  }
  return value;
}

export function readUtf8(filePath) {
  return readFileSync(filePath, "utf8");
}

export function fixturePath(fixtureName) {
  return path.join(DOC_FIXTURE_DIR, `${fixtureName}.json`);
}

export function safeLabel(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function nowTimestamp() {
  return new Date().toISOString().replaceAll(":", "-");
}

export function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable ${name}`);
  }
  return value;
}

export function joinUrl(baseUrl, pathname) {
  return new URL(pathname, baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`).toString();
}

export function mailServiceEndpoint(pathname = "zadosti") {
  return joinUrl(requireEnv(MAIL_SERVICE_URL_ENV), pathname);
}

export function transformationEndpoint(endpointName) {
  return joinUrl(requireEnv(TRANSFORMATION_SERVICE_URL_ENV), endpointName);
}

export function looksLikePdf(bodyBuffer, contentType) {
  return contentType.includes("application/pdf") || bodyBuffer.subarray(0, 5).toString("utf8") === "%PDF-";
}

export async function sendRequest({
  url,
  method = "POST",
  body,
  contentType = "application/json",
  accept,
}) {
  const headers = {};
  if (contentType) {
    headers["content-type"] = contentType;
  }
  if (accept) {
    headers.accept = accept;
  }

  const startedAt = performance.now();
  const response = await fetch(url, {
    method,
    headers,
    body,
  });
  const durationMs = Math.round((performance.now() - startedAt) * 1000) / 1000;

  const arrayBuffer = await response.arrayBuffer();
  const responseHeaders = Object.fromEntries(response.headers.entries());
  const responseContentType = response.headers.get("content-type") ?? "";
  const bodyBuffer = Buffer.from(arrayBuffer);
  const isTextLike =
    responseContentType.startsWith("text/") ||
    responseContentType.includes("json") ||
    responseContentType.includes("xml") ||
    responseContentType.includes("html");
  const pdfLike = looksLikePdf(bodyBuffer, responseContentType);

  return {
    status: response.status,
    ok: response.ok,
    headers: responseHeaders,
    responseContentType,
    isTextLike,
    pdfLike,
    sizeBytes: bodyBuffer.byteLength,
    durationMs,
    bodyBuffer,
    bodyText: isTextLike ? bodyBuffer.toString("utf8") : null,
  };
}

export function startRun(runName, outputDir = DEFAULT_CAPTURE_DIR) {
  mkdirSync(outputDir, { recursive: true });
  const runDir = path.join(outputDir, `${nowTimestamp()}-${safeLabel(runName)}`);
  mkdirSync(runDir, { recursive: true });
  return runDir;
}

export function writeCapture({
  outputDir = DEFAULT_CAPTURE_DIR,
  captureName,
  label,
  url,
  method,
  endpoint,
  requestHeaders,
  requestBody,
  requestBodySource,
  response,
  notes = [],
}) {
  mkdirSync(outputDir, { recursive: true });

  const effectiveCaptureName = captureName ?? `${nowTimestamp()}-${safeLabel(label)}`;
  const captureDir = path.join(outputDir, effectiveCaptureName);
  mkdirSync(captureDir, { recursive: true });

  const requestBodyFile = "request-body.txt";
  const responseBodyFile = response.isTextLike ? "response-body.txt" : "response-body.bin";

  writeFileSync(path.join(captureDir, requestBodyFile), requestBody, "utf8");
  if (response.isTextLike) {
    writeFileSync(path.join(captureDir, responseBodyFile), response.bodyText ?? "", "utf8");
  } else {
    writeFileSync(path.join(captureDir, responseBodyFile), response.bodyBuffer);
  }

  writeFileSync(
    path.join(captureDir, "meta.json"),
    `${JSON.stringify(
      {
        label,
        url,
        endpoint,
        method,
        capturedAt: new Date().toISOString(),
        notes,
        request: {
          headers: requestHeaders,
          bodyFile: requestBodyFile,
          bodySource: requestBodySource,
        },
        response: {
          status: response.status,
          ok: response.ok,
          headers: response.headers,
          contentType: response.responseContentType,
          durationMs: response.durationMs,
          sizeBytes: response.sizeBytes,
          pdfLike: response.pdfLike,
          bodyFile: responseBodyFile,
          bodyKind: response.isTextLike ? "text" : "binary",
        },
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  return captureDir;
}

export function writeErrorCapture({
  outputDir = DEFAULT_CAPTURE_DIR,
  captureName,
  label,
  url,
  method,
  endpoint,
  requestHeaders,
  requestBody,
  requestBodySource,
  error,
  notes = [],
}) {
  mkdirSync(outputDir, { recursive: true });

  const effectiveCaptureName = captureName ?? `${nowTimestamp()}-${safeLabel(label)}`;
  const captureDir = path.join(outputDir, effectiveCaptureName);
  mkdirSync(captureDir, { recursive: true });

  const requestBodyFile = "request-body.txt";
  writeFileSync(path.join(captureDir, requestBodyFile), requestBody, "utf8");
  writeFileSync(path.join(captureDir, "error.txt"), `${error.stack ?? error.message ?? String(error)}\n`, "utf8");
  writeFileSync(
    path.join(captureDir, "meta.json"),
    `${JSON.stringify(
      {
        label,
        url,
        endpoint,
        method,
        capturedAt: new Date().toISOString(),
        notes,
        request: {
          headers: requestHeaders,
          bodyFile: requestBodyFile,
          bodySource: requestBodySource,
        },
        response: {
          transportError: true,
          errorName: error.name ?? "Error",
          errorMessage: error.message ?? String(error),
          bodyFile: "error.txt",
        },
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  return captureDir;
}

export function writeRunSummary(runDir, summary) {
  writeFileSync(path.join(runDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`, "utf8");
}
