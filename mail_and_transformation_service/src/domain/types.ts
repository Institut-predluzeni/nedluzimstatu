export type RecipientEndpoint =
  | "celni-sprava"
  | "financni-urad"
  | "obec"
  | "ossz"
  | "pojistovna";

export interface ZadostiRequest {
  recipientEmail?: unknown;
  recipientName?: unknown;
  applicant?: unknown;
  reply_to?: unknown;
  reason?: unknown;
  recipients?: unknown;
  items?: unknown;
  [key: string]: unknown;
}

export interface NormalizedZadostiRequest {
  raw: ZadostiRequest;
  recipientEmail: string;
  recipientName?: string;
  applicant?: unknown;
  reply_to?: unknown;
  reason?: unknown;
  recipients: Record<string, unknown>;
  items?: unknown;
}

export interface AttachmentPlan {
  endpoint: RecipientEndpoint;
  filename: string;
  payload: Record<string, unknown>;
}

export interface GeneratedAttachment {
  filename: string;
  contentType: string;
  content: Buffer;
}

export interface MailAddress {
  email: string;
  name?: string;
}

export interface OutgoingEmailContentPart {
  contentType: "text/plain" | "text/html";
  value: string;
}

export interface OutgoingEmail {
  from: MailAddress;
  to: MailAddress;
  subject: string;
  content: OutgoingEmailContentPart[];
  attachments: GeneratedAttachment[];
}
