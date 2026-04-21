import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, test } from "vitest";

import { executeZadosti } from "../adapter/load-zadosti.ts";
import type { TransformationCall } from "../adapter/types.ts";
import { buildBaselineSummary, FIXTURE_BASELINES, type ZadostiRequest } from "../baseline.ts";
import { FIXTURE_NAMES, FIXTURE_DIR, loadFixture, type FixtureName } from "../fixtures.ts";

describe("[source-grounded] /zadosti orchestration", () => {
  test.each(FIXTURE_BASELINES)(
    "[source-grounded] maps fixture $fixtureName to the exact internal transformation calls",
    ({ fixtureName, expectedTransformationCalls, expectedAttachmentFilenames, selectedRecipients }) => {
      const input = loadFixture<ZadostiRequest>(fixtureName);
      const { transformationCalls, mail, fileReads } = executeZadosti(input);

      expect(transformationCalls).toEqual(expectedTransformationCalls);
      expect(transformationCalls.map((call) => call.attachment.filename)).toEqual(expectedAttachmentFilenames);
      expect(transformationCalls.map((call) => call.endpoint)).toEqual(
        expectedTransformationCalls.map((call) => call.endpoint),
      );

      const selectedRecipientEntries = Object.keys(input.recipients);
      expect(selectedRecipientEntries).toEqual(selectedRecipients);

      for (const call of transformationCalls) {
        expect(call.headers).toEqual({
          "Content-Type": "application/json",
          Accept: "application/pdf",
        });
        expect(call.rawData).toBe(JSON.stringify(call.payload));
      }

      expect(fileReads).toEqual([
        { path: "zadost.txt", contentType: "text/plain" },
        { path: "zadost.html", contentType: "text/html" },
      ]);

      expect(mail.from).toEqual({
        name: "Nedlužím státu",
        email: "formulare@nedluzimstatu.cz",
      });
      expect(mail.to).toEqual({
        email: input.recipientEmail,
        name: input.recipientName,
      });
      expect(mail.subject).toBe("Nedlužím státu: Vygenerovali jsme Vaše žádosti pro ověření bezdlužnosti");

      // Source-grounded and adapter-minimal:
      // assert only counts here, not the hidden helper object shapes produced by the real base image runtime.
      expect(mail.content).toHaveLength(2);
      expect(mail.attachments).toHaveLength(expectedTransformationCalls.length);
    },
  );

  test("[source-grounded] does not call non-selected transformation endpoints", () => {
    const input = loadFixture<ZadostiRequest>("zadosti-simple-financni-urad");
    const { transformationCalls } = executeZadosti(input);

    expect(transformationCalls.map((call) => call.endpoint)).toEqual(["/financni-urad"]);
    expect(transformationCalls.find((call) => call.endpoint === "/celni-sprava")).toBeUndefined();
    expect(transformationCalls.find((call) => call.endpoint === "/obec")).toBeUndefined();
    expect(transformationCalls.find((call) => call.endpoint === "/ossz")).toBeUndefined();
    expect(transformationCalls.find((call) => call.endpoint === "/pojistovna")).toBeUndefined();
  });

  test("[source-grounded] keeps baseline-summary.json aligned with the explicit source-grounded baselines", () => {
    const summaryPath = path.join(FIXTURE_DIR, "..", "..", "contract_tests", "generated", "baseline-summary.json");
    const generated = JSON.parse(readFileSync(summaryPath, "utf8"));

    expect(generated).toEqual(buildBaselineSummary());
  });
});

describe("[source-grounded] shared transformation payload mapping", () => {
  test.each(FIXTURE_NAMES)("[source-grounded] does not add extra fields for fixture %s", (fixtureName: FixtureName) => {
    const input = loadFixture<ZadostiRequest>(fixtureName);
    const { transformationCalls } = executeZadosti(input);

    for (const call of transformationCalls) {
      const payloadKeys = Object.keys(call.payload as Record<string, unknown>);
      if (call.endpoint === "/obec") {
        expect(payloadKeys).toEqual(["recipient", "items", "applicant", "reply_to", "reason"]);
      } else {
        expect(payloadKeys).toEqual(["recipient", "applicant", "reply_to", "reason"]);
      }
    }
  });

  test("[source-grounded] shared endpoints keep the same payload shape while /obec includes items", () => {
    const multiInstituce = executeZadosti(loadFixture<ZadostiRequest>("zadosti-multi-instituce"));
    const obec = executeZadosti(loadFixture<ZadostiRequest>("zadosti-obec-items"));
    const multiPojistovny = executeZadosti(loadFixture<ZadostiRequest>("zadosti-multi-pojistovny"));

    const sharedCallKeys = [
      ...multiInstituce.transformationCalls,
      ...multiPojistovny.transformationCalls,
    ].map((call) => Object.keys(call.payload as Record<string, unknown>));

    expect(sharedCallKeys).toEqual([
      ["recipient", "applicant", "reply_to", "reason"],
      ["recipient", "applicant", "reply_to", "reason"],
      ["recipient", "applicant", "reply_to", "reason"],
      ["recipient", "applicant", "reply_to", "reason"],
      ["recipient", "applicant", "reply_to", "reason"],
    ]);

    expect(Object.keys(obec.transformationCalls[0].payload as Record<string, unknown>)).toEqual([
      "recipient",
      "items",
      "applicant",
      "reply_to",
      "reason",
    ]);
  });

  test("[source-grounded] forwards reply_to and reason unchanged", () => {
    const fixture = loadFixture<ZadostiRequest>("zadosti-multi-pojistovny");
    const { transformationCalls } = executeZadosti(fixture);

    expect(transformationCalls).toHaveLength(2);
    for (const call of transformationCalls) {
      expect((call.payload as Record<string, unknown>).reply_to).toEqual(fixture.reply_to);
      expect((call.payload as Record<string, unknown>).reason).toEqual(fixture.reason);
    }
  });
});
