#!/usr/bin/env node

import path from "node:path";

import { mailServiceEndpoint, readUtf8, REPO_ROOT, sendRequest, startRun, writeCapture, writeErrorCapture, writeRunSummary } from "./_lib.mjs";

const PROBE_DIR = path.join(REPO_ROOT, "runtime_verification", "probes");

const CASES = [
  {
    id: "rv-zad-101",
    label: "malformed-json",
    file: path.join(PROBE_DIR, "zadosti-malformed.json.txt"),
    notes: ["mail-service error probing", "malformed JSON"],
  },
  {
    id: "rv-zad-201",
    label: "missing-recipient-email",
    file: path.join(PROBE_DIR, "zadosti-missing-recipient-email.json"),
    notes: ["mail-service error probing", "missing recipientEmail"],
  },
  {
    id: "rv-zad-202",
    label: "missing-applicant",
    file: path.join(PROBE_DIR, "zadosti-missing-applicant.json"),
    notes: ["mail-service error probing", "missing applicant"],
  },
  {
    id: "rv-zad-203",
    label: "empty-recipients",
    file: path.join(PROBE_DIR, "zadosti-empty-recipients.json"),
    notes: ["mail-service error probing", "empty recipients"],
  },
  {
    id: "rv-zad-204",
    label: "malformed-pojistovna",
    file: path.join(PROBE_DIR, "zadosti-malformed-pojistovna.json"),
    notes: ["mail-service error probing", "malformed pojistovna"],
  },
  {
    id: "rv-zad-205",
    label: "obec-missing-items",
    file: path.join(PROBE_DIR, "zadosti-obec-missing-items.json"),
    notes: ["mail-service error probing", "missing items for obec"],
  },
  {
    id: "rv-var-001",
    label: "permanent-addres-control",
    file: path.join(REPO_ROOT, "docs", "fixtures", "zadosti-obec-items.json"),
    notes: ["variant probing", "control spelling permanent_addres"],
  },
  {
    id: "rv-var-002",
    label: "permanent-address-variant",
    file: path.join(PROBE_DIR, "zadosti-permanent-address-variant.json"),
    notes: ["variant probing", "spelling permanent_address"],
  },
  {
    id: "rv-var-003",
    label: "reply-to-no-nesting",
    file: path.join(PROBE_DIR, "zadosti-reply-to-no-nesting.json"),
    notes: ["variant probing", "reply_to nesting"],
  },
  {
    id: "rv-var-004",
    label: "pojistovna-single",
    file: path.join(PROBE_DIR, "zadosti-pojistovna-single.json"),
    notes: ["variant probing", "single pojistovna"],
  },
  {
    id: "rv-var-005",
    label: "pojistovna-array",
    file: path.join(REPO_ROOT, "docs", "fixtures", "zadosti-multi-pojistovny.json"),
    notes: ["variant probing", "array pojistovna"],
  },
  {
    id: "rv-var-006",
    label: "company-registration-number-present",
    file: path.join(REPO_ROOT, "docs", "fixtures", "zadosti-multi-instituce.json"),
    notes: ["variant probing", "company_registration_number present"],
  },
];

async function main() {
  const url = mailServiceEndpoint("zadosti");
  const runDir = startRun("mail-probes");
  const summary = {
    runType: "mail-probes",
    startedAt: new Date().toISOString(),
    targetUrl: url,
    captures: [],
  };

  for (const testCase of CASES) {
    const requestBody = readUtf8(testCase.file);
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
        requestBodySource: testCase.file,
        response,
        notes: testCase.notes,
      });

      summary.captures.push({
        id: testCase.id,
        label: testCase.label,
        requestSource: testCase.file,
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
        requestBodySource: testCase.file,
        error,
        notes: testCase.notes,
      });

      summary.captures.push({
        id: testCase.id,
        label: testCase.label,
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
