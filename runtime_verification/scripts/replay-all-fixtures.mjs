#!/usr/bin/env node

import { fixturePath, mailServiceEndpoint, parseArgs } from "./_lib.mjs";

const FIXTURE_NAMES = [
  "zadosti-simple-financni-urad",
  "zadosti-multi-instituce",
  "zadosti-multi-pojistovny",
  "zadosti-obec-items",
];

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const url = args.url ?? mailServiceEndpoint("zadosti");
  const outputDir = args["output-dir"];
  const accept = args.accept ?? "";
  const contentType = args["content-type"] ?? "application/json";
  const method = args.method ?? "POST";

  for (const fixture of FIXTURE_NAMES) {
    const childArgs = [
      "runtime_verification/scripts/replay-fixture.mjs",
      "--url",
      url,
      "--fixture",
      fixturePath(fixture),
      "--method",
      method,
      "--content-type",
      contentType,
    ];

    if (outputDir) {
      childArgs.push("--output-dir", outputDir);
    }
    if (accept) {
      childArgs.push("--accept", accept);
    }

    const { spawnSync } = await import("node:child_process");
    const result = spawnSync(process.execPath, childArgs, {
      stdio: "inherit",
    });

    if (result.status !== 0) {
      process.exitCode = result.status ?? 1;
      return;
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
