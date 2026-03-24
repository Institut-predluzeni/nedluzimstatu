import type { OutgoingEmail } from "../../domain/types.js";

export interface MailProvider {
  send(mail: OutgoingEmail): Promise<void>;
}
