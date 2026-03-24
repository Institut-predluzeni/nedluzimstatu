#!/usr/bin/env node

import path from "node:path";

import {
  DEFAULT_CAPTURE_DIR,
  fixturePath,
  mailServiceEndpoint,
  parseArgs,
  readUtf8,
  requireArg,
  sendRequest,
  writeCapture,
  writeErrorCapture,
} from "./_lib.mjs";

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const url = args.url ?? mailServiceEndpoint("zadosti");
  const fixture = requireArg(args, "fixture");
  const method = args.method ?? "POST";
  const contentType = args["content-type"] ?? "application/json";
  const accept = args.accept ?? "";
  const outputDir = args["output-dir"] ?? DEFAULT_CAPTURE_DIR;
  const fixtureFile = fixture.endsWith(".json") ? fixture : fixturePath(fixture);
  const label =
    args.label ??
    `fixture-${path.basename(fixtureFile, path.extname(fixtureFile))}`;
  const requestBody = readUtf8(fixtureFile);
  const requestHeaders = {};

  if (contentType) {
    requestHeaders["content-type"] = contentType;
  }
  if (accept) {
    requestHeaders.accept = accept;
  }

  let captureDir;
  let status = "transport-error";

  try {
    const response = await sendRequest({
      url,
      method,
      body: requestBody,
      contentType,
      accept,
    });

    captureDir = writeCapture({
      outputDir,
      label,
      url,
      endpoint: "/zadosti",
      method,
      requestHeaders,
      requestBody,
      requestBodySource: fixtureFile,
      response,
    });
    status = response.status;
  } catch (error) {
    captureDir = writeErrorCapture({
      outputDir,
      label,
      url,
      endpoint: "/zadosti",
      method,
      requestHeaders,
      requestBody,
      requestBodySource: fixtureFile,
      error,
    });
  }

  console.log(
    JSON.stringify(
      {
        fixture: path.basename(fixtureFile),
        url,
        status,
        captureDir,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
