import { readFileSync } from "node:fs";
import path from "node:path";

export type FixtureName =
  | "zadosti-simple-financni-urad"
  | "zadosti-multi-instituce"
  | "zadosti-multi-pojistovny"
  | "zadosti-obec-items";

const FIXTURE_DIR = path.resolve(process.cwd(), "..", "docs", "fixtures");

export function loadFixture<T>(fixtureName: FixtureName): T {
  const fixturePath = path.join(FIXTURE_DIR, `${fixtureName}.json`);
  return JSON.parse(readFileSync(fixturePath, "utf8")) as T;
}
