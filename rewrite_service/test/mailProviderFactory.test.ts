import { describe, expect, test, vi } from "vitest";

import { createMailProvider } from "../src/adapters/mail/createMailProvider.js";
import { InMemoryMailProvider } from "../src/adapters/mail/inMemoryMailProvider.js";
import { LoggingMailProvider } from "../src/adapters/mail/loggingMailProvider.js";
import {
  SendGridMailProvider,
  toSendGridRequestBody,
} from "../src/adapters/mail/sendGridMailProvider.js";
import { MailProviderError } from "../src/adapters/mail/types.js";
import { loadConfig } from "../src/config.js";
import type { OutgoingEmail } from "../src/domain/types.js";

const exampleMail: OutgoingEmail = {
  from: {
    name: "Nedlužím státu",
    email: "formulare@nedluzimstatu.cz",
  },
  to: {
    name: "Mila",
    email: "mila@example.com",
  },
  subject: "Subject",
  content: [
    {
      contentType: "text/plain",
      value: "Plain body",
    },
    {
      contentType: "text/html",
      value: "<p>HTML body</p>",
    },
  ],
  attachments: [
    {
      filename: "example.pdf",
      contentType: "application/pdf",
      content: Buffer.from("%PDF-1.4\nexample\n%%EOF\n", "utf8"),
    },
  ],
};

describe("mail provider configuration", () => {
  test("loadConfig uses safe local defaults", () => {
    const config = loadConfig({});

    expect(config.mailProvider).toBe("log");
    expect(config.mailFrom).toEqual({
      email: "formulare@nedluzimstatu.cz",
      name: "Nedlužím státu",
    });
  });

  test("loadConfig supports sender and provider overrides", () => {
    const config = loadConfig({
      MAIL_PROVIDER: "sendgrid",
      MAIL_FROM_EMAIL: "custom@example.com",
      MAIL_FROM_NAME: "Custom Sender",
      SENDGRID_API_KEY: "sg-key",
    });

    expect(config.mailProvider).toBe("sendgrid");
    expect(config.mailFrom).toEqual({
      email: "custom@example.com",
      name: "Custom Sender",
    });
    expect(config.sendGridApiKey).toBe("sg-key");
  });

  test("createMailProvider selects logging, memory, and sendgrid providers", () => {
    expect(
      createMailProvider({
        port: 3000,
        mailProvider: "log",
        mailFrom: {
          email: "formulare@nedluzimstatu.cz",
          name: "Nedlužím státu",
        },
        sendGridApiBaseUrl: "https://api.sendgrid.com/v3",
      }),
    ).toBeInstanceOf(LoggingMailProvider);

    expect(
      createMailProvider({
        port: 3000,
        mailProvider: "memory",
        mailFrom: {
          email: "formulare@nedluzimstatu.cz",
          name: "Nedlužím státu",
        },
        sendGridApiBaseUrl: "https://api.sendgrid.com/v3",
      }),
    ).toBeInstanceOf(InMemoryMailProvider);

    expect(
      createMailProvider({
        port: 3000,
        mailProvider: "sendgrid",
        mailFrom: {
          email: "formulare@nedluzimstatu.cz",
          name: "Nedlužím státu",
        },
        sendGridApiKey: "test-key",
        sendGridApiBaseUrl: "https://api.sendgrid.com/v3",
      }),
    ).toBeInstanceOf(SendGridMailProvider);
  });

  test("sendgrid provider selection fails fast without API key", () => {
    expect(() =>
      createMailProvider({
        port: 3000,
        mailProvider: "sendgrid",
        mailFrom: {
          email: "formulare@nedluzimstatu.cz",
          name: "Nedlužím státu",
        },
        sendGridApiBaseUrl: "https://api.sendgrid.com/v3",
      }),
    ).toThrow("SENDGRID_API_KEY is required when MAIL_PROVIDER=sendgrid");
  });
});

describe("SendGridMailProvider", () => {
  test("maps outgoing mail to SendGrid payload", () => {
    const payload = JSON.parse(toSendGridRequestBody(exampleMail)) as Record<string, unknown>;

    expect(payload.from).toEqual(exampleMail.from);
    expect(payload.subject).toBe(exampleMail.subject);
    expect(payload.personalizations).toEqual([{ to: [exampleMail.to] }]);
    expect(payload.content).toEqual([
      {
        type: "text/plain",
        value: "Plain body",
      },
      {
        type: "text/html",
        value: "<p>HTML body</p>",
      },
    ]);
    expect(payload.attachments).toEqual([
      {
        filename: "example.pdf",
        type: "application/pdf",
        disposition: "attachment",
        content: Buffer.from("%PDF-1.4\nexample\n%%EOF\n", "utf8").toString("base64"),
      },
    ]);
  });

  test("sends mail via SendGrid HTTP API", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response("", {
        status: 202,
      }),
    );
    const provider = new SendGridMailProvider({
      apiKey: "test-key",
      apiBaseUrl: "https://api.sendgrid.com/v3",
      fetchImpl: fetchMock,
    });

    await provider.send(exampleMail);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("https://api.sendgrid.com/v3/mail/send");
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      method: "POST",
      headers: {
        authorization: "Bearer test-key",
        "content-type": "application/json",
      },
    });
  });

  test("throws MailProviderError on SendGrid failure", async () => {
    const provider = new SendGridMailProvider({
      apiKey: "test-key",
      apiBaseUrl: "https://api.sendgrid.com/v3",
      fetchImpl: vi.fn<typeof fetch>().mockResolvedValue(
        new Response('{"errors":[{"message":"bad request"}]}', {
          status: 400,
        }),
      ),
    });

    await expect(provider.send(exampleMail)).rejects.toBeInstanceOf(MailProviderError);
  });
});
