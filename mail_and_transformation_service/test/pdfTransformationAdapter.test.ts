import { describe, expect, test } from "vitest";

import { PdfTransformationAdapter } from "../src/adapters/transformation/pdfTransformationAdapter.js";
import { buildLetterDocument } from "../src/adapters/transformation/pdf/buildLetterDocument.js";
import type { AttachmentPlan } from "../src/domain/types.js";

const FIXED_NOW = new Date("2026-03-24T00:00:00.000Z");

function createBasePlan(overrides: Partial<AttachmentPlan> = {}): AttachmentPlan {
  return {
    endpoint: "financni-urad",
    filename: "Bezdluznost - Financni urad.pdf",
    payload: {
      recipient: {
        name: "Finanční úřad pro hlavní město Prahu",
        address: {
          lines: "Štěpánská 28",
          zip_code: "11000",
          city: "Praha 1",
        },
      },
      applicant: {
        name: "Jana",
        surname: "Nováková",
        personal_identification_number: "845101/1234",
        company_registration_number: "12345678",
        address: {
          lines: "Dlouhá 1",
          zip_code: "11000",
          city: "Praha 1",
        },
        email: "jana@example.com",
      },
      reply_to: {
        reply_to: {
          permanent_addres: true,
        },
      },
      reason: {
        bank: true,
      },
    },
    ...overrides,
  };
}

describe("PdfTransformationAdapter", () => {
  test("returns a non-empty PDF buffer", async () => {
    const adapter = new PdfTransformationAdapter({
      now: () => FIXED_NOW,
    });

    const attachment = await adapter.generateAttachment(createBasePlan());

    expect(attachment.contentType).toBe("application/pdf");
    expect(attachment.content.byteLength).toBeGreaterThan(1000);
    expect(attachment.content.subarray(0, 8).toString("latin1")).toMatch(/^%PDF-1\./);
    expect(attachment.content.toString("latin1")).toContain("%%EOF");
  });

  test("builds financni urad content with shared identity and reason text", () => {
    const letter = buildLetterDocument(createBasePlan(), FIXED_NOW);

    expect(letter.author).toBe("Jana Nováková");
    expect(letter.dateLine).toBe("Praha 24. 3. 2026");
    expect(letter.body[1]).toEqual({
      kind: "paragraph",
      text: "tímto žádám o vystavení potvrzení, že orgány Finanční správy České republiky vůči mé osobě neevidují žádné nedoplatky, případně žádám o jejich výpis, na základě rodného čísla 845101/1234 a IČO 12345678.",
    });
    expect(letter.body[2]).toEqual({
      kind: "paragraph",
      text: "Potvrzení je vydáváno za účelem: jednání u bankovní instituce.",
    });
    expect(letter.body[3]).toEqual({
      kind: "paragraph",
      text: "Odpověď prosím doručte na adresu trvalého bydliště uvedenou v záhlaví žádosti.",
    });
  });

  test("builds obec bullet list and tolerates missing items", () => {
    const withItems = buildLetterDocument(
      createBasePlan({
        endpoint: "obec",
        filename: "Bezdluznost - obec.pdf",
        payload: {
          ...createBasePlan().payload,
          items: {
            dog: true,
            bins: "true",
            offenses: false,
            flat: 1,
            reason: "další místní poplatek",
          },
        },
      }),
      FIXED_NOW,
    );

    expect(withItems.body[1]).toEqual({
      kind: "paragraph",
      text: "žádám tímto o vystavení potvrzení, že magistrát/městský/obecní úřad neevidují vůči mé osobě žádné nedoplatky, případně žádám o jejich výpis, a to za:",
    });
    expect(withItems.body[2]).toEqual({
      kind: "bullet-list",
      items: [
        "poplatek za psa",
        "místní poplatek za svoz komunálního odpadu",
        "nájemné a služby spojené s užíváním městského/obecního bytu",
        "další místní poplatek",
      ],
    });

    const withoutItems = buildLetterDocument(
      createBasePlan({
        endpoint: "obec",
        filename: "Bezdluznost - obec.pdf",
        payload: {
          ...createBasePlan().payload,
          items: undefined,
        },
      }),
      FIXED_NOW,
    );

    expect(withoutItems.body[1]).toEqual({
      kind: "paragraph",
      text: "žádám tímto o vystavení potvrzení, že magistrát/městský/obecní úřad neevidují vůči mé osobě žádné nedoplatky, případně žádám o jejich výpis.",
    });
  });

  test("accepts reply_to without nesting and permanent_address variant", () => {
    const directReplyTo = buildLetterDocument(
      createBasePlan({
        payload: {
          ...createBasePlan().payload,
          reply_to: {
            permanent_address: true,
          },
        },
      }),
      FIXED_NOW,
    );

    expect(directReplyTo.body[3]).toEqual({
      kind: "paragraph",
      text: "Odpověď prosím doručte na adresu trvalého bydliště uvedenou v záhlaví žádosti.",
    });
  });
});
