#!/usr/bin/env node

import path from "node:path";

import { readUtf8, REPO_ROOT, sendRequest, startRun, transformationEndpoint, writeCapture, writeErrorCapture, writeRunSummary } from "./_lib.mjs";

const PROBE_DIR = path.join(REPO_ROOT, "runtime_verification", "probes");

const CASES = [
  {
    id: "rv-trf-001",
    label: "celni-sprava-minimal",
    endpoint: "/celni-sprava",
    file: path.join(PROBE_DIR, "transformation-celni-sprava-minimal.json"),
    notes: ["transformation probing", "minimal payload"],
  },
  {
    id: "rv-trf-002",
    label: "financni-urad-boolean-reason",
    endpoint: "/financni-urad",
    file: path.join(PROBE_DIR, "transformation-financni-urad-boolean-reason.json"),
    notes: ["transformation probing", "baseline boolean reason"],
  },
  {
    id: "rv-trf-003",
    label: "obec-items-boolean",
    endpoint: "/obec",
    file: path.join(PROBE_DIR, "transformation-obec-items-boolean.json"),
    notes: ["transformation probing", "minimal payload"],
  },
  {
    id: "rv-trf-004",
    label: "ossz-minimal",
    endpoint: "/ossz",
    file: path.join(PROBE_DIR, "transformation-ossz-minimal.json"),
    notes: ["transformation probing", "minimal payload"],
  },
  {
    id: "rv-trf-005",
    label: "pojistovna-minimal",
    endpoint: "/pojistovna",
    file: path.join(PROBE_DIR, "transformation-pojistovna-minimal.json"),
    notes: ["transformation probing", "minimal payload"],
  },
  {
    id: "rv-trf-006",
    label: "financni-urad-string-reason",
    endpoint: "/financni-urad",
    file: path.join(PROBE_DIR, "transformation-financni-urad-string-reason.json"),
    notes: ["JSON-to-XSL probing", "string reason"],
  },
  {
    id: "rv-trf-007",
    label: "financni-urad-number-reason",
    endpoint: "/financni-urad",
    file: path.join(PROBE_DIR, "transformation-financni-urad-number-reason.json"),
    notes: ["JSON-to-XSL probing", "number reason"],
  },
  {
    id: "rv-trf-008",
    label: "financni-urad-null-reason",
    endpoint: "/financni-urad",
    file: path.join(PROBE_DIR, "transformation-financni-urad-null-reason.json"),
    notes: ["JSON-to-XSL probing", "null reason"],
  },
  {
    id: "rv-trf-009",
    label: "obec-permanent-address-variant",
    endpoint: "/obec",
    file: path.join(PROBE_DIR, "transformation-obec-permanent-address-variant.json"),
    notes: ["variant probing", "permanent_address direct transformation"],
  },
  {
    id: "rv-trf-010",
    label: "financni-urad-reply-to-no-nesting",
    endpoint: "/financni-urad",
    file: path.join(PROBE_DIR, "transformation-financni-urad-reply-to-no-nesting.json"),
    notes: ["variant probing", "reply_to nesting direct transformation"],
  },
  {
    id: "rv-trf-011",
    label: "financni-urad-company-registration-number",
    endpoint: "/financni-urad",
    file: path.join(PROBE_DIR, "transformation-financni-urad-company-registration-number.json"),
    notes: ["variant probing", "company_registration_number present"],
  },
];

async function main() {
  const runDir = startRun("transformation-probes");
  const summary = {
    runType: "transformation-probes",
    startedAt: new Date().toISOString(),
    baseUrl: process.env.TRANSFORMATION_SERVICE_URL ?? null,
    captures: [],
  };

  for (const testCase of CASES) {
    const url = transformationEndpoint(testCase.endpoint.slice(1));
    const requestBody = readUtf8(testCase.file);
    const requestHeaders = {
      "content-type": "application/json",
      accept: "application/pdf",
    };

    try {
      const response = await sendRequest({
        url,
        method: "POST",
        body: requestBody,
        contentType: "application/json",
        accept: "application/pdf",
      });

      const captureDir = writeCapture({
        outputDir: runDir,
        captureName: testCase.id,
        label: testCase.label,
        url,
        endpoint: testCase.endpoint,
        method: "POST",
        requestHeaders,
        requestBody,
        requestBodySource: testCase.file,
        response,
        notes: testCase.notes,
      });

      summary.captures.push({
        id: testCase.id,
        label: testCase.label,
        endpoint: testCase.endpoint,
        requestSource: testCase.file,
        status: response.status,
        durationMs: response.durationMs,
        sizeBytes: response.sizeBytes,
        pdfLike: response.pdfLike,
        captureDir,
      });
    } catch (error) {
      const captureDir = writeErrorCapture({
        outputDir: runDir,
        captureName: testCase.id,
        label: testCase.label,
        url,
        endpoint: testCase.endpoint,
        method: "POST",
        requestHeaders,
        requestBody,
        requestBodySource: testCase.file,
        error,
        notes: testCase.notes,
      });

      summary.captures.push({
        id: testCase.id,
        label: testCase.label,
        endpoint: testCase.endpoint,
        requestSource: testCase.file,
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
