import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { InMemoryMailProvider } from "../src/adapters/mail/inMemoryMailProvider.js";
import { RecordingTransformationAdapter } from "../src/adapters/transformation/stubTransformationAdapter.js";
import { buildApp } from "../src/app.js";
import type { ZadostiRequest } from "../src/domain/types.js";
import { loadFixture } from "./fixtures.js";

describe("rewrite_service phase 1", () => {
  let transformationAdapter: RecordingTransformationAdapter;
  let mailProvider: InMemoryMailProvider;
  let app: ReturnType<typeof buildApp>;

  beforeEach(() => {
    transformationAdapter = new RecordingTransformationAdapter();
    mailProvider = new InMemoryMailProvider();
    app = buildApp({
      transformationAdapter,
      mailProvider,
    });
  });

  afterEach(async () => {
    await app.close();
  });

  test("GET /health returns 200 and JSON", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/health",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ok" });
  });

  test.each([
    "zadosti-simple-financni-urad",
    "zadosti-multi-instituce",
    "zadosti-multi-pojistovny",
    "zadosti-obec-items",
  ] as const)("POST /zadosti returns 200 with empty body for fixture %s", async (fixtureName) => {
    const payload = loadFixture<ZadostiRequest>(fixtureName);

    const response = await app.inject({
      method: "POST",
      url: "/zadosti",
      payload,
      headers: {
        "content-type": "application/json",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toBe("");
  });

  test("missing recipientEmail returns 400", async () => {
    const payload = {
      recipientName: "Missing Email",
      recipients: {},
    };

    const response = await app.inject({
      method: "POST",
      url: "/zadosti",
      payload,
      headers: {
        "content-type": "application/json",
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.body).toBe("");
  });

  test("malformed JSON returns legacy-compatible 500", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/zadosti",
      payload: "{\"recipientEmail\":",
      headers: {
        "content-type": "application/json",
      },
    });

    expect(response.statusCode).toBe(500);
    expect(response.body).toBe("");
  });

  test("multi-recipient planning preserves legacy order and filenames", async () => {
    const payload = loadFixture<ZadostiRequest>("zadosti-multi-instituce");

    await app.inject({
      method: "POST",
      url: "/zadosti",
      payload,
      headers: {
        "content-type": "application/json",
      },
    });

    expect(transformationAdapter.plans.map((plan) => plan.endpoint)).toEqual([
      "celni-sprava",
      "financni-urad",
      "ossz",
    ]);
    expect(transformationAdapter.plans.map((plan) => plan.filename)).toEqual([
      "Bezdluznost - Celni sprava.pdf",
      "Bezdluznost - Financni urad.pdf",
      "Bezdluznost - CSSZ.pdf",
    ]);
  });

  test("pojistovna supports both single object and array", async () => {
    const singlePayload: ZadostiRequest = {
      recipientEmail: "mila@example.com",
      recipientName: "Mila",
      applicant: { name: "Jana" },
      reply_to: { reply_to: { in_person: true } },
      reason: { job_office: true },
      recipients: {
        pojistovna: {
          name: "Všeobecná zdravotní pojišťovna",
        },
      },
    };

    const singleResponse = await app.inject({
      method: "POST",
      url: "/zadosti",
      payload: singlePayload,
      headers: {
        "content-type": "application/json",
      },
    });

    expect(singleResponse.statusCode).toBe(200);
    expect(transformationAdapter.plans.map((plan) => plan.filename)).toEqual([
      "Bezdluznost - VZP.pdf",
    ]);

    transformationAdapter.plans.length = 0;

    const arrayPayload = loadFixture<ZadostiRequest>("zadosti-multi-pojistovny");
    const arrayResponse = await app.inject({
      method: "POST",
      url: "/zadosti",
      payload: arrayPayload,
      headers: {
        "content-type": "application/json",
      },
    });

    expect(arrayResponse.statusCode).toBe(200);
    expect(transformationAdapter.plans.map((plan) => plan.filename)).toEqual([
      "Bezdluznost - VZP.pdf",
      "Bezdluznost - OZP.pdf",
    ]);
  });

  test("mail uses fixed from and fixed subject", async () => {
    const payload = loadFixture<ZadostiRequest>("zadosti-simple-financni-urad");

    await app.inject({
      method: "POST",
      url: "/zadosti",
      payload,
      headers: {
        "content-type": "application/json",
      },
    });

    expect(mailProvider.sent).toHaveLength(1);
    expect(mailProvider.sent[0]?.from).toEqual({
      name: "Nedlužím státu",
      email: "formulare@nedluzimstatu.cz",
    });
    expect(mailProvider.sent[0]?.subject).toBe(
      "Nedlužím státu: Vygenerovali jsme Vaše žádosti pro ověření bezdlužnosti",
    );
  });

  test("obec payload includes items and permits missing items without hard failure", async () => {
    const payload = loadFixture<ZadostiRequest>("zadosti-obec-items");

    await app.inject({
      method: "POST",
      url: "/zadosti",
      payload,
      headers: {
        "content-type": "application/json",
      },
    });

    expect(transformationAdapter.plans[0]?.payload).toMatchObject({
      recipient: (payload.recipients as Record<string, unknown>).obec,
      items: payload.items,
    });

    transformationAdapter.plans.length = 0;
    const missingItemsPayload = {
      ...payload,
      items: undefined,
    };

    const response = await app.inject({
      method: "POST",
      url: "/zadosti",
      payload: missingItemsPayload,
      headers: {
        "content-type": "application/json",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(transformationAdapter.plans[0]?.endpoint).toBe("obec");
  });
});
