#!/usr/bin/env node

import path from "node:path";

import {
  mailServiceEndpoint,
  parseArgs,
  readUtf8,
  REPO_ROOT,
  sendRequest,
  startRun,
  writeCapture,
  writeErrorCapture,
  writeRunSummary,
} from "./_lib.mjs";

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args["allow-real-email"] !== "true") {
    throw new Error(
      "Refusing to run real-email happy-path verification without --allow-real-email true",
    );
  }

  const url = mailServiceEndpoint("zadosti");
  const probeFile = path.join(
    REPO_ROOT,
    "runtime_verification",
    "probes",
    "zadosti-happy-path-mila-shrug-cz.json",
  );
  const requestBody = readUtf8(probeFile);
  const requestHeaders = {
    "content-type": "application/json",
  };
  const runDir = startRun("real-email-happy-path");
  const summary = {
    runType: "real-email-happy-path",
    startedAt: new Date().toISOString(),
    targetUrl: url,
    warning: "This verification may send a real email to mila@shrug.cz.",
    captures: [],
  };

  try {
    const response = await sendRequest({
      url,
      method: "POST",
      body: requestBody,
      contentType: "application/json",
    });

    const captureDir = writeCapture({
      outputDir: runDir,
      captureName: "rv-zad-real-001",
      label: "happy-path-real-email-mila-shrug-cz",
      url,
      endpoint: "/zadosti",
      method: "POST",
      requestHeaders,
      requestBody,
      requestBodySource: probeFile,
      response,
      notes: [
        "real email verification",
        "happy path",
        "recipientEmail mila@shrug.cz",
      ],
    });

    summary.captures.push({
      id: "rv-zad-real-001",
      label: "happy-path-real-email-mila-shrug-cz",
      requestSource: probeFile,
      status: response.status,
      durationMs: response.durationMs,
      sizeBytes: response.sizeBytes,
      captureDir,
    });
  } catch (error) {
    const captureDir = writeErrorCapture({
      outputDir: runDir,
      captureName: "rv-zad-real-001",
      label: "happy-path-real-email-mila-shrug-cz",
      url,
      endpoint: "/zadosti",
      method: "POST",
      requestHeaders,
      requestBody,
      requestBodySource: probeFile,
      error,
      notes: [
        "real email verification",
        "happy path",
        "recipientEmail mila@shrug.cz",
      ],
    });

    summary.captures.push({
      id: "rv-zad-real-001",
      label: "happy-path-real-email-mila-shrug-cz",
      requestSource: probeFile,
      status: "transport-error",
      captureDir,
    });
  }

  summary.finishedAt = new Date().toISOString();
  writeRunSummary(runDir, summary);
  console.log(JSON.stringify({ runDir, summaryFile: `${runDir}/summary.json` }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
