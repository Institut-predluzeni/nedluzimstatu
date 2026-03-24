import type { JsonValue, TransformationCall } from "./adapter/types.ts";
import { FIXTURE_NAMES, type FixtureName, loadFixtureMap } from "./fixtures.ts";

export interface ZadostiRequest {
  recipientEmail: string;
  recipientName: string;
  applicant: Record<string, JsonValue>;
  reply_to: Record<string, JsonValue>;
  reason: Record<string, JsonValue>;
  recipients: Record<string, JsonValue>;
  items?: Record<string, JsonValue>;
}

export interface FixtureBaseline {
  fixtureName: FixtureName;
  selectedRecipients: string[];
  expectedTransformationCalls: TransformationCall[];
  expectedAttachmentFilenames: string[];
}

const BASE_URL = "https://www.nedluzimstatu.cz/transformation-service";
const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/pdf",
} as const;

const fixtureInputs = loadFixtureMap<ZadostiRequest>();

function expectedCall(
  endpoint: string,
  payload: JsonValue,
  filename: string,
): TransformationCall {
  return {
    url: `${BASE_URL}/${endpoint}`,
    endpoint: `/${endpoint}`,
    headers: { ...DEFAULT_HEADERS },
    rawData: JSON.stringify(payload),
    payload,
    attachment: {
      filename,
      type: "application/pdf",
    },
  };
}

// Inferred only in the narrow sense that the hidden runtime may return richer helper objects.
// The filename mapping itself is source-grounded in mail_service/zadosti.js.
export function expectedPojistovnaFilename(longName: string | null | undefined): string {
  const knownShortNames: Record<string, string> = {
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

  if (longName == null) {
    return "Bezdluznost - zdravotni pojistovna.pdf";
  }

  return `Bezdluznost - ${knownShortNames[longName] ?? longName}.pdf`;
}

export const FIXTURE_BASELINES: FixtureBaseline[] = [
  {
    fixtureName: "zadosti-simple-financni-urad",
    selectedRecipients: ["financni-urad"],
    expectedTransformationCalls: [
      expectedCall(
        "financni-urad",
        {
          recipient: fixtureInputs["zadosti-simple-financni-urad"].recipients["financni-urad"] as JsonValue,
          applicant: fixtureInputs["zadosti-simple-financni-urad"].applicant,
          reply_to: fixtureInputs["zadosti-simple-financni-urad"].reply_to,
          reason: fixtureInputs["zadosti-simple-financni-urad"].reason,
        },
        "Bezdluznost - Financni urad.pdf",
      ),
    ],
    expectedAttachmentFilenames: ["Bezdluznost - Financni urad.pdf"],
  },
  {
    fixtureName: "zadosti-multi-instituce",
    selectedRecipients: ["celni-sprava", "financni-urad", "ossz"],
    expectedTransformationCalls: [
      expectedCall(
        "celni-sprava",
        {
          recipient: fixtureInputs["zadosti-multi-instituce"].recipients["celni-sprava"] as JsonValue,
          applicant: fixtureInputs["zadosti-multi-instituce"].applicant,
          reply_to: fixtureInputs["zadosti-multi-instituce"].reply_to,
          reason: fixtureInputs["zadosti-multi-instituce"].reason,
        },
        "Bezdluznost - Celni sprava.pdf",
      ),
      expectedCall(
        "financni-urad",
        {
          recipient: fixtureInputs["zadosti-multi-instituce"].recipients["financni-urad"] as JsonValue,
          applicant: fixtureInputs["zadosti-multi-instituce"].applicant,
          reply_to: fixtureInputs["zadosti-multi-instituce"].reply_to,
          reason: fixtureInputs["zadosti-multi-instituce"].reason,
        },
        "Bezdluznost - Financni urad.pdf",
      ),
      expectedCall(
        "ossz",
        {
          recipient: fixtureInputs["zadosti-multi-instituce"].recipients["ossz"] as JsonValue,
          applicant: fixtureInputs["zadosti-multi-instituce"].applicant,
          reply_to: fixtureInputs["zadosti-multi-instituce"].reply_to,
          reason: fixtureInputs["zadosti-multi-instituce"].reason,
        },
        "Bezdluznost - CSSZ.pdf",
      ),
    ],
    expectedAttachmentFilenames: [
      "Bezdluznost - Celni sprava.pdf",
      "Bezdluznost - Financni urad.pdf",
      "Bezdluznost - CSSZ.pdf",
    ],
  },
  {
    fixtureName: "zadosti-multi-pojistovny",
    selectedRecipients: ["pojistovna"],
    expectedTransformationCalls: [
      expectedCall(
        "pojistovna",
        {
          recipient: (fixtureInputs["zadosti-multi-pojistovny"].recipients["pojistovna"] as JsonValue[])[0],
          applicant: fixtureInputs["zadosti-multi-pojistovny"].applicant,
          reply_to: fixtureInputs["zadosti-multi-pojistovny"].reply_to,
          reason: fixtureInputs["zadosti-multi-pojistovny"].reason,
        },
        "Bezdluznost - VZP.pdf",
      ),
      expectedCall(
        "pojistovna",
        {
          recipient: (fixtureInputs["zadosti-multi-pojistovny"].recipients["pojistovna"] as JsonValue[])[1],
          applicant: fixtureInputs["zadosti-multi-pojistovny"].applicant,
          reply_to: fixtureInputs["zadosti-multi-pojistovny"].reply_to,
          reason: fixtureInputs["zadosti-multi-pojistovny"].reason,
        },
        "Bezdluznost - OZP.pdf",
      ),
    ],
    expectedAttachmentFilenames: [
      "Bezdluznost - VZP.pdf",
      "Bezdluznost - OZP.pdf",
    ],
  },
  {
    fixtureName: "zadosti-obec-items",
    selectedRecipients: ["obec"],
    expectedTransformationCalls: [
      expectedCall(
        "obec",
        {
          recipient: fixtureInputs["zadosti-obec-items"].recipients["obec"] as JsonValue,
          items: fixtureInputs["zadosti-obec-items"].items as JsonValue,
          applicant: fixtureInputs["zadosti-obec-items"].applicant,
          reply_to: fixtureInputs["zadosti-obec-items"].reply_to,
          reason: fixtureInputs["zadosti-obec-items"].reason,
        },
        "Bezdluznost - obec.pdf",
      ),
    ],
    expectedAttachmentFilenames: ["Bezdluznost - obec.pdf"],
  },
];

export function fixtureBaselineByName(fixtureName: FixtureName): FixtureBaseline {
  const baseline = FIXTURE_BASELINES.find((item) => item.fixtureName === fixtureName);

  if (!baseline) {
    throw new Error(`Unknown fixture baseline: ${fixtureName}`);
  }

  return baseline;
}

export function buildBaselineSummary() {
  return {
    scope: "source-grounded-only",
    notes: [
      "This artifact freezes only expectations directly supported by the current source tree and reconstructed docs.",
      "It intentionally excludes hidden runtime response semantics and hidden helper object shapes from the base images.",
    ],
    fixtures: FIXTURE_NAMES.map((fixtureName) => {
      const baseline = fixtureBaselineByName(fixtureName);
      return {
        fixtureName,
        classification: "source-grounded",
        selectedRecipients: baseline.selectedRecipients,
        expectedTransformationCalls: baseline.expectedTransformationCalls.map((call) => ({
          endpoint: call.endpoint,
          url: call.url,
          headers: call.headers,
          payload: call.payload,
          attachmentFilename: call.attachment.filename,
          attachmentType: call.attachment.type,
        })),
        expectedAttachmentFilenames: baseline.expectedAttachmentFilenames,
      };
    }),
  };
}
