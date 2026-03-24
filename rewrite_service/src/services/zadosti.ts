import type { FastifyReply } from "fastify";

import type {
  AttachmentPlan,
  GeneratedAttachment,
  NormalizedZadostiRequest,
  OutgoingEmail,
  RecipientEndpoint,
  ZadostiRequest,
} from "../domain/types.js";
import { zadostHtmlTemplate } from "../templates/zadostHtml.js";
import { zadostTextTemplate } from "../templates/zadostText.js";

const LEGACY_FROM = {
  name: "Nedlužím státu",
  email: "formulare@nedluzimstatu.cz",
} as const;

const LEGACY_SUBJECT =
  "Nedlužím státu: Vygenerovali jsme Vaše žádosti pro ověření bezdlužnosti";

const ATTACHMENT_ORDER: RecipientEndpoint[] = [
  "celni-sprava",
  "financni-urad",
  "obec",
  "ossz",
  "pojistovna",
];

const POJISTOVNA_SHORT_NAMES: Record<string, string> = {
  "Všeobecná zdravotní pojišťovna": "VZP",
  "VŠEOBECNÁ ZDRAVOTNÍ POJIŠŤOVNA ČESKÉ REPUBLIKY": "VZP",
  "Oborová zdravotní pojišťovna zaměstnanců bank, pojišťoven a stavebnictví": "OZP",
  "Oborová zdravotní pojišťovna": "OZP",
  "Česká průmyslová zdravotní pojišťovna": "CPZP",
  "Vojenská zdravotní pojišťovna České republiky": "VoZP",
  "Vojenská zdravotní pojišťovna": "VoZP",
  "Zaměstnanecká pojišťovna Škoda": "ZPS",
  "RBP, zdravotní pojišťovna": "RBP-ZP",
  "Revírní bratrská pokladna – zdravotní pojišťovna": "RBP-ZP",
  "Zdravotní pojišťovna ministerstva vnitra České republiky": "ZP MV CR",
  "Zdravotní pojišťovna Ministerstva vnitra ČR": "ZP MV CR",
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getRecipients(value: unknown): Record<string, unknown> {
  return isPlainObject(value) ? value : {};
}

function getOptionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function getPojistovnaShortName(longName: unknown): string {
  if (longName == null) {
    return "zdravotni pojistovna";
  }

  if (typeof longName !== "string") {
    return String(longName);
  }

  return POJISTOVNA_SHORT_NAMES[longName] ?? longName;
}

function getAttachmentFilename(endpoint: RecipientEndpoint, recipient: unknown): string {
  switch (endpoint) {
    case "celni-sprava":
      return "Bezdluznost - Celni sprava.pdf";
    case "financni-urad":
      return "Bezdluznost - Financni urad.pdf";
    case "obec":
      return "Bezdluznost - obec.pdf";
    case "ossz":
      return "Bezdluznost - CSSZ.pdf";
    case "pojistovna": {
      const name =
        isPlainObject(recipient) && "name" in recipient
          ? (recipient.name as unknown)
          : undefined;
      return `Bezdluznost - ${getPojistovnaShortName(name)}.pdf`;
    }
  }
}

function buildBasePayload(input: NormalizedZadostiRequest, recipient: unknown) {
  return {
    recipient,
    applicant: input.applicant,
    reply_to: input.reply_to,
    reason: input.reason,
  };
}

export function normalizeZadostiRequest(input: unknown): NormalizedZadostiRequest | null {
  const raw = (typeof input === "object" && input !== null ? input : {}) as ZadostiRequest;
  const recipientEmail = getOptionalString(raw.recipientEmail)?.trim();

  if (!recipientEmail) {
    return null;
  }

  const normalized: NormalizedZadostiRequest = {
    raw,
    recipientEmail,
    applicant: raw.applicant,
    reply_to: raw.reply_to,
    reason: raw.reason,
    recipients: getRecipients(raw.recipients),
    items: raw.items,
  };

  const recipientName = getOptionalString(raw.recipientName);
  if (recipientName !== undefined) {
    normalized.recipientName = recipientName;
  }

  return normalized;
}

export function planAttachments(input: NormalizedZadostiRequest): AttachmentPlan[] {
  const plans: AttachmentPlan[] = [];

  for (const endpoint of ATTACHMENT_ORDER) {
    const recipientSelection = input.recipients[endpoint];

    if (!recipientSelection) {
      continue;
    }

    if (endpoint === "obec") {
      plans.push({
        endpoint,
        filename: getAttachmentFilename(endpoint, recipientSelection),
        payload: {
          ...buildBasePayload(input, recipientSelection),
          items: input.items,
        },
      });
      continue;
    }

    if (endpoint === "pojistovna") {
      const recipients = Array.isArray(recipientSelection)
        ? recipientSelection
        : [recipientSelection];

      for (const recipient of recipients) {
        plans.push({
          endpoint,
          filename: getAttachmentFilename(endpoint, recipient),
          payload: buildBasePayload(input, recipient),
        });
      }

      continue;
    }

    plans.push({
      endpoint,
      filename: getAttachmentFilename(endpoint, recipientSelection),
      payload: buildBasePayload(input, recipientSelection),
    });
  }

  return plans;
}

export function composeMail(
  input: NormalizedZadostiRequest,
  attachments: GeneratedAttachment[],
): OutgoingEmail {
  const to =
    input.recipientName === undefined
      ? { email: input.recipientEmail }
      : { email: input.recipientEmail, name: input.recipientName };

  return {
    from: { ...LEGACY_FROM },
    to,
    subject: LEGACY_SUBJECT,
    content: [
      {
        contentType: "text/plain",
        value: zadostTextTemplate,
      },
      {
        contentType: "text/html",
        value: zadostHtmlTemplate,
      },
    ],
    attachments,
  };
}

export function sendLegacyBadRequest(reply: FastifyReply): FastifyReply {
  return reply.code(400).type("text/plain; charset=utf-8").send("");
}

export function sendLegacySuccess(reply: FastifyReply): FastifyReply {
  return reply.code(200).type("text/plain; charset=utf-8").send("");
}
