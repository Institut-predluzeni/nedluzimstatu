import { describe, expect, test } from "vitest";

import { executeZadosti } from "../adapter/load-zadosti.ts";
import { expectedPojistovnaFilename, type ZadostiRequest } from "../baseline.ts";
import { loadFixture } from "../fixtures.ts";

function buildSinglePojistovnaPayload(
  recipient: Record<string, unknown>,
): ZadostiRequest {
  const base = loadFixture<ZadostiRequest>("zadosti-simple-financni-urad");

  return {
    ...base,
    recipients: {
      pojistovna: recipient,
    },
  };
}

describe("[source-grounded] edge-case compatibility", () => {
  test("[source-grounded] single recipients.pojistovna object triggers one /pojistovna call", () => {
    const input = buildSinglePojistovnaPayload({
      name: "Všeobecná zdravotní pojišťovna",
      address: {
        lines: "Orlicka 4",
        zip_code: "13000",
        city: "Praha 3",
      },
    });
    const { transformationCalls, mail } = executeZadosti(input);

    expect(transformationCalls).toHaveLength(1);
    expect(transformationCalls[0].endpoint).toBe("/pojistovna");
    expect(transformationCalls[0].attachment.filename).toBe("Bezdluznost - VZP.pdf");
    expect(mail.attachments).toHaveLength(1);
  });

  test("[source-grounded] array recipients.pojistovna triggers one /pojistovna call per item", () => {
    const input = loadFixture<ZadostiRequest>("zadosti-multi-pojistovny");
    const { transformationCalls } = executeZadosti(input);

    expect(transformationCalls).toHaveLength(2);
    expect(transformationCalls.map((call) => call.endpoint)).toEqual(["/pojistovna", "/pojistovna"]);
    expect(transformationCalls.map((call) => (call.payload as Record<string, unknown>).recipient)).toEqual(
      input.recipients.pojistovna,
    );
  });

  test("[source-grounded] keeps legacy reply_to.reply_to nesting unchanged", () => {
    const input = loadFixture<ZadostiRequest>("zadosti-simple-financni-urad");
    const { transformationCalls } = executeZadosti(input);

    expect(transformationCalls[0].payload).toMatchObject({
      reply_to: {
        reply_to: {
          in_person: true,
        },
      },
    });
    expect((transformationCalls[0].payload as Record<string, unknown>).reply_to).toEqual(input.reply_to);
  });

  test("[source-grounded] keeps the legacy typo permanent_addres unchanged", () => {
    const input = loadFixture<ZadostiRequest>("zadosti-obec-items");
    const { transformationCalls } = executeZadosti(input);
    const replyTo = (transformationCalls[0].payload as Record<string, unknown>).reply_to as Record<string, unknown>;

    expect(replyTo).toEqual({
      reply_to: {
        permanent_addres: true,
      },
    });
    expect(JSON.stringify(replyTo)).not.toContain("permanent_address");
  });

  test("[source-grounded] does not inject company_registration_number when it is absent", () => {
    // The optionality of the field in the full runtime is documented separately.
    // This test is narrower and source-grounded: zadosti.js forwards applicant unchanged.
    const withoutCompanyId = executeZadosti(loadFixture<ZadostiRequest>("zadosti-simple-financni-urad"));
    const withCompanyId = executeZadosti(loadFixture<ZadostiRequest>("zadosti-multi-instituce"));

    const applicantWithoutCompanyId = (withoutCompanyId.transformationCalls[0].payload as Record<string, unknown>)
      .applicant as Record<string, unknown>;
    const applicantWithCompanyId = (withCompanyId.transformationCalls[0].payload as Record<string, unknown>)
      .applicant as Record<string, unknown>;

    expect(applicantWithoutCompanyId).not.toHaveProperty("company_registration_number");
    expect(applicantWithCompanyId.company_registration_number).toBe("12345678");
  });

  test("[source-grounded] forwards obec.items unchanged", () => {
    const input = loadFixture<ZadostiRequest>("zadosti-obec-items");
    const { transformationCalls } = executeZadosti(input);

    expect(transformationCalls[0].endpoint).toBe("/obec");
    expect(transformationCalls[0].payload).toMatchObject({
      items: input.items,
    });
  });
});

describe("[source-grounded] attachment filename fallbacks", () => {
  test("[source-grounded] uses current fallback naming for an unknown insurance name", () => {
    const input = buildSinglePojistovnaPayload({
      name: "Moje testovaci pojistovna",
      address: {
        lines: "Testovaci 1",
        zip_code: "10000",
        city: "Praha",
      },
    });
    const { transformationCalls } = executeZadosti(input);

    expect(transformationCalls[0].attachment.filename).toBe(expectedPojistovnaFilename("Moje testovaci pojistovna"));
  });

  test("[source-grounded] uses current fallback naming for a null insurance name", () => {
    const input = buildSinglePojistovnaPayload({
      name: null,
      address: {
        lines: "Testovaci 1",
        zip_code: "10000",
        city: "Praha",
      },
    });
    const { transformationCalls } = executeZadosti(input);

    expect(transformationCalls[0].attachment.filename).toBe(expectedPojistovnaFilename(null));
  });
});
