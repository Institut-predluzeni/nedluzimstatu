import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CURRENT_DIR = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(CURRENT_DIR, "..");
export const FIXTURE_DIR = path.join(REPO_ROOT, "docs", "fixtures");
export const MAIL_SERVICE_DIR = path.join(REPO_ROOT, "mail_service");
export const ZADOSTI_SCRIPT_PATH = path.join(MAIL_SERVICE_DIR, "zadosti.js");

export const FIXTURE_NAMES = [
  "zadosti-simple-financni-urad",
  "zadosti-multi-instituce",
  "zadosti-multi-pojistovny",
  "zadosti-obec-items",
] as const;

export type FixtureName = (typeof FIXTURE_NAMES)[number];

export function loadFixture<T>(fixtureName: FixtureName): T {
  const fixturePath = path.join(FIXTURE_DIR, `${fixtureName}.json`);
  const content = readFileSync(fixturePath, "utf8");
  return JSON.parse(content) as T;
}

export function loadFixtureMap<T>(): Record<FixtureName, T> {
  return Object.fromEntries(
    FIXTURE_NAMES.map((fixtureName) => [fixtureName, loadFixture<T>(fixtureName)]),
  ) as Record<FixtureName, T>;
}
