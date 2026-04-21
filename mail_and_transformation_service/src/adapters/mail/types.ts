import type { OutgoingEmail } from "../../domain/types.js";

export interface MailProvider {
  send(mail: OutgoingEmail): Promise<void>;
}

export class MailProviderError extends Error {
  constructor(
    message: string,
    public readonly causeDetails?: {
      status?: number;
      body?: string;
    },
  ) {
    super(message);
    this.name = "MailProviderError";
  }
}
