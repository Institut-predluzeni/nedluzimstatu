import type { AttachmentPlan, RecipientEndpoint } from "../../../domain/types.js";

export interface LetterSection {
  kind: "paragraph" | "bullet-list" | "address-block";
  text?: string;
  items?: string[];
  lines?: string[];
}

export interface LetterDocument {
  title: string;
  author: string;
  dateLine: string;
  subject: string;
  applicantLines: string[];
  recipientLines: string[];
  body: LetterSection[];
  signature: string;
}

interface ContactAddress {
  lines?: unknown;
  zip_code?: unknown;
  city?: unknown;
}

interface ContactDetails {
  name?: unknown;
  surname?: unknown;
  address?: unknown;
  phone?: unknown;
  email?: unknown;
  data_box?: unknown;
  company_registration_number?: unknown;
  personal_identification_number?: unknown;
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

function formatZipCode(value: unknown): string | undefined {
  const zipCode = asString(value)?.replace(/\s+/g, "");

  if (!zipCode) {
    return undefined;
  }

  if (/^\d{5}$/.test(zipCode)) {
    return `${zipCode.slice(0, 3)} ${zipCode.slice(3)}`;
  }

  return zipCode;
}

function formatDateLine(date: Date, city: unknown): string {
  const sanitizedCity = asString(city)?.replace(/\s+\d+$/, "");
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const formattedDate = `${day}. ${month}. ${year}`;

  return sanitizedCity ? `${sanitizedCity} ${formattedDate}` : formattedDate;
}

function getFullName(value: unknown): string {
  const person = asRecord(value);
  return [asString(person.name), asString(person.surname)].filter(Boolean).join(" ") || "Neuvedený žadatel";
}

function formatPhone(value: unknown): string | undefined {
  const phone = asString(value)?.replace(/\s+/g, "");

  if (!phone) {
    return undefined;
  }

  const localMatch = phone.match(/^(\d{3})(\d{3})(\d{3})$/);
  if (localMatch) {
    return `${localMatch[1]} ${localMatch[2]} ${localMatch[3]}`;
  }

  const intlMatch = phone.match(/^\+420(\d{3})(\d{3})(\d{3})$/);
  if (intlMatch) {
    return `+420 ${intlMatch[1]} ${intlMatch[2]} ${intlMatch[3]}`;
  }

  return phone;
}

function getAddressLines(value: unknown): string[] {
  const address = asRecord(value) as ContactAddress;
  const lines: string[] = [];

  if (typeof address.lines === "string") {
    const trimmed = address.lines.trim();
    if (trimmed) {
      lines.push(trimmed);
    }
  } else if (Array.isArray(address.lines)) {
    for (const line of address.lines) {
      const asLine = asString(line);
      if (asLine) {
        lines.push(asLine);
      }
    }
  }

  const zipCode = formatZipCode(address.zip_code);
  const city = asString(address.city);
  const lastLine = [zipCode, city].filter(Boolean).join(" ");
  if (lastLine) {
    lines.push(lastLine);
  }

  return lines;
}

function getContactLines(value: unknown): string[] {
  const contact = asRecord(value) as ContactDetails;
  const lines: string[] = [];

  const fullName = getFullName(contact);
  if (fullName !== "Neuvedený žadatel") {
    lines.push(fullName);
  } else {
    const recipientName = asString(contact.name);
    if (recipientName) {
      lines.push(recipientName);
    }
  }

  lines.push(...getAddressLines(contact.address));

  const phone = formatPhone(contact.phone);
  if (phone) {
    lines.push(`Telefon: ${phone}`);
  }

  const email = asString(contact.email);
  if (email) {
    lines.push(`E-mail: ${email}`);
  }

  const dataBox = asString(contact.data_box);
  if (dataBox) {
    lines.push(`Datová schránka: ${dataBox}`);
  }

  return lines;
}

function hasTruthyValue(value: unknown): boolean {
  if (value === true) {
    return true;
  }

  if (value === false) {
    return false;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "" || normalized === "false" || normalized === "0" || normalized === "no") {
      return false;
    }

    return true;
  }

  return value != null;
}

function getReasonText(reason: unknown): string {
  const candidate = asRecord(reason);

  if ("job_office" in candidate) {
    return "jednání u úřadu práce (dle zákona č. 435/2004 Sb., o zaměstnanosti, v platném znění)";
  }

  if ("regional_office" in candidate) {
    return "jednání u krajského úřadu (dle zákona č. 108/2006 Sb., o sociálních službách)";
  }

  if ("bank" in candidate) {
    return "jednání u bankovní instituce";
  }

  if ("other" in candidate) {
    return String(candidate.other ?? "");
  }

  return "";
}

function getReplyToSections(replyTo: unknown, fullName: string): LetterSection[] {
  const outer = asRecord(replyTo);
  const envelope = "reply_to" in outer ? asRecord(outer.reply_to) : outer;

  if ("data_box" in envelope) {
    return [
      {
        kind: "paragraph",
        text: `Odpověď prosím zašlete do datové schránky ${String(envelope.data_box ?? "")}.`,
      },
    ];
  }

  if ("in_person" in envelope) {
    return [
      {
        kind: "paragraph",
        text: "Odpověď si vyzvednu osobně.",
      },
    ];
  }

  if ("permanent_addres" in envelope || "permanent_address" in envelope) {
    return [
      {
        kind: "paragraph",
        text: "Odpověď prosím doručte na adresu trvalého bydliště uvedenou v záhlaví žádosti.",
      },
    ];
  }

  if ("contact_address" in envelope) {
    return [
      {
        kind: "paragraph",
        text: "Odpověď prosím doručte na adresu:",
      },
      {
        kind: "address-block",
        lines: [fullName, ...getAddressLines(envelope.contact_address)],
      },
    ];
  }

  return [];
}

function getIdentitySuffix(applicant: unknown): string {
  const source = asRecord(applicant) as ContactDetails;
  const personalIdentificationNumber = asString(source.personal_identification_number);
  const companyRegistrationNumber = asString(source.company_registration_number);

  const parts: string[] = [];

  if (personalIdentificationNumber) {
    parts.push(`na základě rodného čísla ${personalIdentificationNumber}`);
  }

  if (companyRegistrationNumber) {
    parts.push(`a IČO ${companyRegistrationNumber}`);
  }

  if (parts.length === 0) {
    return "";
  }

  return `, ${parts.join(" ")}`;
}

function getInstitutionParagraph(endpoint: RecipientEndpoint, payload: Record<string, unknown>): LetterSection[] {
  if (endpoint === "obec") {
    const items = asRecord(payload.items);
    const itemLabels: string[] = [];

    if (hasTruthyValue(items.dog)) {
      itemLabels.push("poplatek za psa");
    }

    if (hasTruthyValue(items.bins)) {
      itemLabels.push("místní poplatek za svoz komunálního odpadu");
    }

    if (hasTruthyValue(items.offenses)) {
      itemLabels.push("přestupky");
    }

    if (hasTruthyValue(items.flat)) {
      itemLabels.push("nájemné a služby spojené s užíváním městského/obecního bytu");
    }

    const additionalReason = asString(items.reason);
    if (additionalReason) {
      itemLabels.push(additionalReason);
    }

    if (itemLabels.length === 0) {
      return [
        {
          kind: "paragraph",
          text: "žádám tímto o vystavení potvrzení, že magistrát/městský/obecní úřad neevidují vůči mé osobě žádné nedoplatky, případně žádám o jejich výpis.",
        },
      ];
    }

    return [
      {
        kind: "paragraph",
        text: "žádám tímto o vystavení potvrzení, že magistrát/městský/obecní úřad neevidují vůči mé osobě žádné nedoplatky, případně žádám o jejich výpis, a to za:",
      },
      {
        kind: "bullet-list",
        items: itemLabels,
      },
    ];
  }

  const identitySuffix = getIdentitySuffix(payload.applicant);

  switch (endpoint) {
    case "celni-sprava":
      return [
        {
          kind: "paragraph",
          text: `tímto žádám o vystavení potvrzení, že ze strany Celní správy České republiky vůči mé osobě nejsou evidovány žádné nedoplatky, případně žádám o jejich výpis v rozdělení na jistinu a příslušenství${identitySuffix}.`,
        },
      ];
    case "financni-urad":
      return [
        {
          kind: "paragraph",
          text: `tímto žádám o vystavení potvrzení, že orgány Finanční správy České republiky vůči mé osobě neevidují žádné nedoplatky, případně žádám o jejich výpis${identitySuffix}.`,
        },
      ];
    case "ossz":
      return [
        {
          kind: "paragraph",
          text: `tímto žádám o vystavení potvrzení, že orgány OSSZ (PSSZ) vůči mé osobě neevidují žádné nedoplatky, případně žádám o jejich výpis${identitySuffix}.`,
        },
      ];
    case "pojistovna":
      return [
        {
          kind: "paragraph",
          text: `tímto žádám o vystavení potvrzení, že zdravotní pojišťovna vůči mé osobě neeviduje žádné nedoplatky, případně žádám o jejich výpis v rozdělení na jistinu a příslušenství${identitySuffix}.`,
        },
      ];
  }
}

export function buildLetterDocument(plan: AttachmentPlan, renderedAt: Date): LetterDocument {
  const payload = asRecord(plan.payload);
  const applicant = asRecord(payload.applicant);
  const recipient = asRecord(payload.recipient);
  const fullName = getFullName(applicant);
  const reasonText = getReasonText(payload.reason);

  return {
    title: "Žádost o potvrzení bezdlužnosti",
    author: fullName,
    dateLine: formatDateLine(renderedAt, asRecord(applicant.address).city),
    subject: "Žádost o potvrzení bezdlužnosti (případně rozpisu aktuálního dluhu)",
    applicantLines: getContactLines(applicant),
    recipientLines: getContactLines(recipient),
    body: [
      {
        kind: "paragraph",
        text: "Vážená paní, vážený pane,",
      },
      ...getInstitutionParagraph(plan.endpoint, payload),
      {
        kind: "paragraph",
        text: `Potvrzení je vydáváno za účelem: ${reasonText}.`,
      },
      ...getReplyToSections(payload.reply_to, fullName),
      {
        kind: "paragraph",
        text: "S pozdravem",
      },
    ],
    signature: fullName,
  };
}
