#!/usr/bin/env node

import path from "node:path";

import {
  DEFAULT_CAPTURE_DIR,
  parseArgs,
  readUtf8,
  requireArg,
  sendRequest,
  writeCapture,
  writeErrorCapture,
} from "./_lib.mjs";

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const url = requireArg(args, "url");
  const bodyFile = requireArg(args, "body-file");
  const method = args.method ?? "POST";
  const contentType = args["content-type"] ?? "application/json";
  const accept = args.accept ?? "";
  const outputDir = args["output-dir"] ?? DEFAULT_CAPTURE_DIR;
  const label = args.label ?? path.basename(bodyFile, path.extname(bodyFile));
  const requestBody = readUtf8(bodyFile);
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
      method,
      requestHeaders,
      requestBody,
      requestBodySource: bodyFile,
      response,
    });
    status = response.status;
  } catch (error) {
    captureDir = writeErrorCapture({
      outputDir,
      label,
      url,
      method,
      requestHeaders,
      requestBody,
      requestBodySource: bodyFile,
      error,
    });
  }

  console.log(
    JSON.stringify(
      {
        label,
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
