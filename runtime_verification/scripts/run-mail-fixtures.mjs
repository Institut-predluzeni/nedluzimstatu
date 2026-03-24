#!/usr/bin/env node

import { fixturePath, mailServiceEndpoint, readUtf8, sendRequest, startRun, writeCapture, writeErrorCapture, writeRunSummary } from "./_lib.mjs";

const CASES = [
  {
    id: "rv-zad-001",
    label: "simple-financni-urad",
    fixtureName: "zadosti-simple-financni-urad",
    notes: ["mail-service success path", "fixture baseline"],
  },
  {
    id: "rv-zad-002",
    label: "multi-instituce",
    fixtureName: "zadosti-multi-instituce",
    notes: ["mail-service success path", "multiple institutions"],
  },
  {
    id: "rv-zad-003",
    label: "multi-pojistovny",
    fixtureName: "zadosti-multi-pojistovny",
    notes: ["mail-service success path", "array pojistovna"],
  },
  {
    id: "rv-zad-004",
    label: "obec-items",
    fixtureName: "zadosti-obec-items",
    notes: ["mail-service success path", "obec items"],
  },
];

async function main() {
  const url = mailServiceEndpoint("zadosti");
  const runDir = startRun("mail-fixtures");
  const summary = {
    runType: "mail-fixtures",
    startedAt: new Date().toISOString(),
    targetUrl: url,
    captures: [],
  };

  for (const testCase of CASES) {
    const fixtureFile = fixturePath(testCase.fixtureName);
    const requestBody = readUtf8(fixtureFile);
    const requestHeaders = {
      "content-type": "application/json",
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
        captureName: testCase.id,
        label: testCase.label,
        url,
        endpoint: "/zadosti",
        method: "POST",
        requestHeaders,
        requestBody,
        requestBodySource: fixtureFile,
        response,
        notes: testCase.notes,
      });

      summary.captures.push({
        id: testCase.id,
        label: testCase.label,
        requestSource: fixtureFile,
        status: response.status,
        durationMs: response.durationMs,
        sizeBytes: response.sizeBytes,
        captureDir,
      });
    } catch (error) {
      const captureDir = writeErrorCapture({
        outputDir: runDir,
        captureName: testCase.id,
        label: testCase.label,
        url,
        endpoint: "/zadosti",
        method: "POST",
        requestHeaders,
        requestBody,
        requestBodySource: fixtureFile,
        error,
        notes: testCase.notes,
      });

      summary.captures.push({
        id: testCase.id,
        label: testCase.label,
        requestSource: fixtureFile,
        status: "transport-error",
        captureDir,
      });
    }
  }

  summary.finishedAt = new Date().toISOString();
  writeRunSummary(runDir, summary);
  console.log(JSON.stringify({ runDir, summaryFile: `${runDir}/summary.json` }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
