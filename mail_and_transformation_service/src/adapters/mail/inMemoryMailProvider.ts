import type { OutgoingEmail } from "../../domain/types.js";
import type { MailProvider } from "./types.js";

export class InMemoryMailProvider implements MailProvider {
  public readonly sent: OutgoingEmail[] = [];

  async send(mail: OutgoingEmail): Promise<void> {
    this.sent.push(mail);
  }
}
