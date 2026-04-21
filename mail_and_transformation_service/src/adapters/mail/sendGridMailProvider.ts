import type { OutgoingEmail } from "../../domain/types.js";
import { MailProviderError, type MailProvider } from "./types.js";

type FetchLike = typeof fetch;

interface SendGridMailProviderOptions {
  apiKey: string;
  apiBaseUrl?: string;
  fetchImpl?: FetchLike;
}

function toSendGridRequestBody(mail: OutgoingEmail): string {
  return JSON.stringify({
    from: mail.from,
    personalizations: [
      {
        to: [mail.to],
      },
    ],
    subject: mail.subject,
    content: mail.content.map((part) => ({
      type: part.contentType,
      value: part.value,
    })),
    attachments: mail.attachments.map((attachment) => ({
      filename: attachment.filename,
      type: attachment.contentType,
      disposition: "attachment",
      content: attachment.content.toString("base64"),
    })),
  });
}

export class SendGridMailProvider implements MailProvider {
  private readonly apiKey: string;
  private readonly apiBaseUrl: string;
  private readonly fetchImpl: FetchLike;

  constructor(options: SendGridMailProviderOptions) {
    this.apiKey = options.apiKey;
    this.apiBaseUrl = options.apiBaseUrl ?? "https://api.sendgrid.com/v3";
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async send(mail: OutgoingEmail): Promise<void> {
    const response = await this.fetchImpl(`${this.apiBaseUrl}/mail/send`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${this.apiKey}`,
        "content-type": "application/json",
      },
      body: toSendGridRequestBody(mail),
    });

    if (response.ok) {
      return;
    }

    const body = await response.text();
    throw new MailProviderError("MAIL_PROVIDER_SEND_FAILED", {
      status: response.status,
      body,
    });
  }
}

export { toSendGridRequestBody };
