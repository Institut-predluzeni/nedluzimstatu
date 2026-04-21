import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildBaselineSummary } from "../baseline.ts";

const CURRENT_DIR = path.dirname(fileURLToPath(import.meta.url));
const GENERATED_DIR = path.resolve(CURRENT_DIR, "..", "generated");
const OUTPUT_PATH = path.join(GENERATED_DIR, "baseline-summary.json");

mkdirSync(GENERATED_DIR, { recursive: true });
writeFileSync(OUTPUT_PATH, `${JSON.stringify(buildBaselineSummary(), null, 2)}\n`, "utf8");
