import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { InMemoryMailProvider } from "../src/adapters/mail/inMemoryMailProvider.js";
import { MailProviderError, type MailProvider } from "../src/adapters/mail/types.js";
import { RecordingTransformationAdapter } from "../src/adapters/transformation/pdfTransformationAdapter.js";
import { buildApp } from "../src/app.js";
import type { ZadostiRequest } from "../src/domain/types.js";
import { loadFixture } from "./fixtures.js";

class FailingMailProvider implements MailProvider {
  async send(): Promise<void> {
    throw new MailProviderError("MAIL_PROVIDER_SEND_FAILED");
  }
}

describe("rewrite_service phase 3", () => {
  let transformationAdapter: RecordingTransformationAdapter;
  let mailProvider: InMemoryMailProvider;
  let app: ReturnType<typeof buildApp>;

  beforeEach(() => {
    transformationAdapter = new RecordingTransformationAdapter({
      now: () => new Date("2026-03-24T00:00:00.000Z"),
    });
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

  test("OPTIONS /zadosti handles browser CORS preflight", async () => {
    const response = await app.inject({
      method: "OPTIONS",
      url: "/zadosti",
      headers: {
        origin: "https://www.nedluzimstatu.cz",
        "access-control-request-method": "POST",
        "access-control-request-headers": "content-type",
      },
    });

    expect(response.statusCode).toBe(204);
    expect(response.headers["access-control-allow-origin"]).toBe(
      "https://www.nedluzimstatu.cz",
    );
    expect(response.headers["access-control-allow-methods"]).toContain("POST");
  });

  test("POST /zadosti includes CORS headers for browser callers", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/zadosti",
      payload: {
        recipientEmail: "mila@example.com",
        recipients: {},
      },
      headers: {
        origin: "https://www.nedluzimstatu.cz",
        "content-type": "application/json",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["access-control-allow-origin"]).toBe(
      "https://www.nedluzimstatu.cz",
    );
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

  test("mail from can be overridden by app config", async () => {
    await app.close();
    app = buildApp({
      transformationAdapter,
      mailProvider,
      mailFrom: {
        email: "custom@example.com",
        name: "Custom Sender",
      },
    });

    await app.inject({
      method: "POST",
      url: "/zadosti",
      payload: loadFixture<ZadostiRequest>("zadosti-simple-financni-urad"),
      headers: {
        "content-type": "application/json",
      },
    });

    expect(mailProvider.sent[0]?.from).toEqual({
      email: "custom@example.com",
      name: "Custom Sender",
    });
  });

  test("mail provider receives to, content, and generated attachments", async () => {
    const payload = loadFixture<ZadostiRequest>("zadosti-multi-instituce");

    await app.inject({
      method: "POST",
      url: "/zadosti",
      payload,
      headers: {
        "content-type": "application/json",
      },
    });

    expect(mailProvider.sent).toHaveLength(1);
    expect(mailProvider.sent[0]?.to).toEqual({
      email: payload.recipientEmail,
      name: payload.recipientName,
    });
    expect(mailProvider.sent[0]?.content.map((part) => part.contentType)).toEqual([
      "text/plain",
      "text/html",
    ]);
    expect(mailProvider.sent[0]?.attachments.map((attachment) => attachment.filename)).toEqual([
      "Bezdluznost - Celni sprava.pdf",
      "Bezdluznost - Financni urad.pdf",
      "Bezdluznost - CSSZ.pdf",
    ]);
    expect(mailProvider.sent[0]?.attachments.every((attachment) => attachment.content.byteLength > 1000)).toBe(
      true,
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

  test("mail provider failure returns 500", async () => {
    await app.close();
    app = buildApp({
      transformationAdapter,
      mailProvider: new FailingMailProvider(),
    });

    const response = await app.inject({
      method: "POST",
      url: "/zadosti",
      payload: loadFixture<ZadostiRequest>("zadosti-simple-financni-urad"),
      headers: {
        "content-type": "application/json",
      },
    });

    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({
      message: "Mail provider send failed",
    });
  });
});
