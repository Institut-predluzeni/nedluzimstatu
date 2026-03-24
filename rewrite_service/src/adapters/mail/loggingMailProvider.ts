import type { OutgoingEmail } from "../../domain/types.js";
import type { MailProvider } from "./types.js";

export class LoggingMailProvider implements MailProvider {
  async send(mail: OutgoingEmail): Promise<void> {
    console.info("rewrite_service phase1 mail send", {
      to: mail.to,
      subject: mail.subject,
      attachmentCount: mail.attachments.length,
      attachmentFilenames: mail.attachments.map((attachment) => attachment.filename),
    });
  }
}
