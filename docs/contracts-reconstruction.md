# 1. High-level architecture

`mail_service` exposes endpoint `/zadosti` via the convention "filename without `.js` becomes endpoint name". This is explicitly documented for `zadosti.js`, which returns a mail description object consumed by the mail-service runtime instead of writing the HTTP response itself. Evidence: `mail_service/README.md:2-6`, `mail_service/zadosti.js:43-49`, `mail_service/zadosti.js:50-166`.

Communication flow reconstructed from the repo:

1. Client calls `POST /zadosti` on `mail_service`.
2. `sendMail(data)` in `mail_service/zadosti.js` reads the request object and conditionally prepares PDF attachments by calling `HTTP.post()` to `https://www.nedluzimstatu.cz/transformation-service/{endpoint}`. Evidence: `mail_service/zadosti.js:5-14`, `mail_service/zadosti.js:52-149`.
3. Each transformation request is sent as JSON with headers `Content-Type: application/json` and `Accept: application/pdf`. Evidence: `mail_service/zadosti.js:11-14`.
4. `transformation_service` Docker image copies XSL templates into `/home/app/data/` of `filipjirsak/xslt-service:latest`; the repo contains no HTTP server code for routing, only templates and PDF renderer assets. Evidence: `transformation_service/Dockerfile:1-6`.
5. Each XSL template imports `common.xsl` and chains to `pdf.xsl`, which renders XHTML into XSL-FO/PDF. Evidence: `transformation_service/templates/celni-sprava.xsl:4-6`, `transformation_service/templates/financni-urad.xsl:3-5`, `transformation_service/templates/obec.xsl:4-6`, `transformation_service/templates/ossz.xsl:4-6`, `transformation_service/templates/pojistovna.xsl:4-6`, `transformation_service/templates/pdf.xsl:1-5`.
6. The mail body is read from `zadost.txt` and `zadost.html`. Evidence: `mail_service/zadosti.js:160-164`.
7. Delivery is delegated to SendGrid through `mail-service.repositories.default.api-key`. Evidence: `mail_service/application.yaml:1-4`, `mail_service/README.md:10-22`.

Role of SendGrid:

- `mail_service` is the mail orchestrator.
- SendGrid is only the outbound delivery backend.
- PDF generation is not handled by SendGrid; it is delegated to `transformation_service`.

Main endpoints and artifacts:

- External endpoint: `/zadosti` in `mail_service`.
- Internal transformation endpoints called by `mail_service`: `/celni-sprava`, `/financni-urad`, `/obec`, `/ossz`, `/pojistovna`.
- Main artifacts: `zadosti.js`, `zadost.txt`, `zadost.html`, XSL templates in `transformation_service/templates/`, `common.xsl`, `pdf.xsl`, SVG icons, `.fop/fop.xconf`, bundled Open Sans fonts.

# 2. Reconstructed external API contract for `/zadosti`

## Endpoint

- Path: `/zadosti` (`confirmed`)
  Evidence: `mail_service/README.md:2-4`.
- HTTP method: `POST` (`confirmed`)
  Evidence: `mail_service/zadosti.js:45-47`.
- Expected request content type: `application/json` (`inferred`)
  Reasoning: `sendMail(data)` expects a structured object with nested fields, and every internal call generated from it is JSON; no explicit parser or external content-type declaration is present in the repo.
- External HTTP response: unknown (`inferred`)
  Reasoning: the repository only shows the callback return value consumed by the mail-service runtime, not the actual HTTP response emitted to the caller. Evidence: `mail_service/README.md:3-6`, `mail_service/zadosti.js:48-49`, `mail_service/zadosti.js:151-166`.

## Reconstructed TypeScript request interface

```ts
interface ZadostiRequest {
  recipientEmail: string; // confirmed: used as outgoing email recipient
  recipientName: string; // confirmed: used as outgoing email recipient display name
  applicant: Applicant; // confirmed: forwarded to every transformation request
  reply_to: ReplyToEnvelope; // confirmed: forwarded to every transformation request
  reason: Reason; // confirmed: forwarded to every transformation request
  recipients: RecipientsMap; // confirmed: drives which PDFs are generated
  items?: ObecItems; // confirmed: forwarded only to /obec; inferred optional because /obec template handles absence
}

interface RecipientsMap {
  "celni-sprava"?: Recipient; // confirmed
  "financni-urad"?: Recipient; // confirmed
  "obec"?: Recipient; // confirmed
  "ossz"?: Recipient; // confirmed
  "pojistovna"?: Recipient | Recipient[]; // confirmed
}
```

## Field-by-field status and evidence

| Field | Status | Evidence |
| --- | --- | --- |
| `recipientEmail` | `confirmed` | Used for `to.email` in returned mail object: `mail_service/zadosti.js:156-159` |
| `recipientName` | `confirmed` | Used for `to.name` in returned mail object: `mail_service/zadosti.js:156-159` |
| `applicant` | `confirmed` | Forwarded in every internal transformation request: `mail_service/zadosti.js:57-62`, `75-80`, `93-99`, `112-117`, `131-136` |
| `reply_to` | `confirmed` | Forwarded in every internal transformation request: `mail_service/zadosti.js:60-61`, `78-79`, `97-98`, `115-116`, `134-135` |
| `reason` | `confirmed` | Forwarded in every internal transformation request: `mail_service/zadosti.js:60-61`, `78-79`, `98-99`, `116-117`, `135-136` |
| `recipients` | `confirmed` | All attachment generation branches read from `data.recipients[...]`: `mail_service/zadosti.js:52`, `70`, `88`, `107`, `125`, `143-148` |
| `recipients["celni-sprava"]` | `confirmed` | Branch guard and forwarded payload: `mail_service/zadosti.js:52-66` |
| `recipients["financni-urad"]` | `confirmed` | Branch guard and forwarded payload: `mail_service/zadosti.js:70-84` |
| `recipients["obec"]` | `confirmed` | Branch guard and forwarded payload: `mail_service/zadosti.js:88-103` |
| `recipients["ossz"]` | `confirmed` | Branch guard and forwarded payload: `mail_service/zadosti.js:107-121` |
| `recipients["pojistovna"]` | `confirmed` | Branch guard accepts either array or single object: `mail_service/zadosti.js:125-149` |
| `items` | `confirmed` | Passed only into `/obec`: `mail_service/zadosti.js:93-99` |
| `items` optionality | `inferred` | No top-level validation is visible, and `obec.xsl` explicitly handles missing/empty `items/*`: `transformation_service/templates/obec.xsl:9-23` |

## Minimal external contract summary

Observed external request shape:

```json
{
  "recipientEmail": "string",
  "recipientName": "string",
  "applicant": { "...": "see section 4" },
  "reply_to": { "...": "see section 4" },
  "reason": { "...": "see section 4" },
  "recipients": {
    "celni-sprava": { "...": "Recipient" },
    "financni-urad": { "...": "Recipient" },
    "obec": { "...": "Recipient" },
    "ossz": { "...": "Recipient" },
    "pojistovna": { "...": "Recipient | Recipient[]" }
  },
  "items": { "...": "see section 4, only for obec" }
}
```

Important boundary: the repo confirms the request object shape as consumed by `sendMail`; it does not confirm any external validation, error handling, or HTTP response body.

# 3. Reconstructed contracts for transformation endpoints

Interpretation rule used below:

- `mandatory` means "always sent by `mail_service` for that endpoint or read by XSL without an explicit existence guard".
- `optional` means "guarded by XSL or conditionally present".
- No validation layer is visible in the repo, so "mandatory" is an operational expectation, not a proven runtime schema validator.

## `/celni-sprava`

- Caller-side endpoint: `mail_service` posts to `${baseURL}/celni-sprava` (`confirmed`). Evidence: `mail_service/zadosti.js:52-66`.
- Binding to XSL file `templates/celni-sprava.xsl` (`inferred`).
  Evidence: same endpoint name in caller plus matching filename present in transformation image: `transformation_service/templates/celni-sprava.xsl`, `transformation_service/Dockerfile:5-6`.
- Transformation payload (`confirmed` from caller):

```ts
interface CelniSpravaRequest {
  recipient: Recipient;
  applicant: Applicant;
  reply_to: ReplyToEnvelope;
  reason: Reason;
}
```

- Mandatory fields used by template:
  - `applicant.name` (`confirmed`): `common.xsl:3`
  - `applicant.surname` (`confirmed`): `common.xsl:3`
  - `applicant.personal_identification_number` (`confirmed`): `common.xsl:43-47`
  - `applicant.address.city` (`confirmed`): `common.xsl:16`, `84-93`
  - `applicant.address.zip_code` (`confirmed`): `common.xsl:84-93`
  - `recipient.name` (`confirmed`): `common.xsl:70-76`
  - `recipient.address.city` (`confirmed`): `common.xsl:84-93`
  - `recipient.address.zip_code` (`confirmed`): `common.xsl:84-93`
  - one `reason.*` branch (`confirmed`): `common.xsl:27-30`, `124-135`
  - one `reply_to.reply_to.*` branch (`confirmed`): `common.xsl:32`, `137-154`
- Optional fields:
  - `applicant.company_registration_number` (`confirmed optional`): guarded by `exists(...)`, `common.xsl:48-53`
  - `applicant.address.lines` (`confirmed optional`): `common.xsl:84-99`
  - `applicant.phone`, `applicant.email`, `applicant.data_box` (`confirmed optional`): `common.xsl:64-66`, `101-122`
  - `recipient.address.lines` (`confirmed optional`): `common.xsl:84-99`
  - `recipient.phone`, `recipient.email`, `recipient.data_box` (`confirmed optional`): `common.xsl:78-80`, `101-122`
  - `reply_to.reply_to.contact_address.lines` (`confirmed optional`): `common.xsl:146-153`, `95-99`
- Response content type: `application/pdf` (`confirmed`)
  Evidence: request `Accept` header `mail_service/zadosti.js:11-14`; XSL output `media-type="application/pdf"` in `transformation_service/templates/celni-sprava.xsl:4`.
- Template-specific fields actually used:
  - No additional payload fields beyond the shared model.
  - The only endpoint-specific behavior is the introductory paragraph text in `celni-sprava.xsl:8-13`.
- Template chain:
  - `celni-sprava.xsl` imports `common.xsl` and points to `pdf.xsl`: `celni-sprava.xsl:4-6`.

## `/financni-urad`

- Caller-side endpoint: `mail_service/zadosti.js:70-84` (`confirmed`).
- Binding to XSL file `templates/financni-urad.xsl` (`inferred`), based on matching filename and deployment pattern.
- Transformation payload (`confirmed` from caller):

```ts
interface FinancniUradRequest {
  recipient: Recipient;
  applicant: Applicant;
  reply_to: ReplyToEnvelope;
  reason: Reason;
}
```

- Mandatory fields used by template:
  - Same shared mandatory fields as `/celni-sprava`.
- Optional fields:
  - Same shared optional fields as `/celni-sprava`.
- Response content type: `application/pdf` (`confirmed`)
  Evidence: `mail_service/zadosti.js:11-14`, `transformation_service/templates/financni-urad.xsl:3`.
- Template-specific fields actually used:
  - No additional payload fields beyond the shared model.
  - Endpoint-specific behavior is only the introductory paragraph text in `financni-urad.xsl:7-13`.
- Template chain:
  - `financni-urad.xsl` -> `common.xsl` -> `pdf.xsl`: `financni-urad.xsl:3-5`.

## `/obec`

- Caller-side endpoint: `mail_service/zadosti.js:88-103` (`confirmed`).
- Binding to XSL file `templates/obec.xsl` (`inferred`), based on matching filename and deployment pattern.
- Transformation payload (`confirmed` from caller):

```ts
interface ObecRequest {
  recipient: Recipient;
  items?: ObecItems;
  applicant: Applicant;
  reply_to: ReplyToEnvelope;
  reason: Reason;
}
```

- Mandatory fields used by template:
  - Same shared mandatory fields as `/celni-sprava`.
  - `items` is not mandatory; the template explicitly branches for absence of `items/*`: `obec.xsl:9-23`.
- Optional fields:
  - Same shared optional fields as `/celni-sprava`.
  - `items.dog` (`confirmed optional`): `obec.xsl:27-31`
  - `items.bins` (`confirmed optional`): `obec.xsl:33-37`
  - `items.offenses` (`confirmed optional`): `obec.xsl:39-43`
  - `items.flat` (`confirmed optional`): `obec.xsl:45-49`
  - `items.reason` (`confirmed optional`): `obec.xsl:51-56`
- Response content type: `application/pdf` (`confirmed`)
  Evidence: `mail_service/zadosti.js:11-14`, `transformation_service/templates/obec.xsl:4`.
- Fields actually used:
  - Shared fields from `common.xsl`
  - `items/*` only in `obec.xsl`
- Template-specific behavior:
  - If any `items/*` exists, the document adds a bullet list describing requested municipal debt categories.
  - If no `items/*` exists, the document falls back to a generic sentence.
- Template chain:
  - `obec.xsl` -> `common.xsl` -> `pdf.xsl`: `obec.xsl:4-6`.

## `/ossz`

- Caller-side endpoint: `mail_service/zadosti.js:107-121` (`confirmed`).
- Binding to XSL file `templates/ossz.xsl` (`inferred`), based on matching filename and deployment pattern.
- Transformation payload (`confirmed` from caller):

```ts
interface OsszRequest {
  recipient: Recipient;
  applicant: Applicant;
  reply_to: ReplyToEnvelope;
  reason: Reason;
}
```

- Mandatory fields used by template:
  - Same shared mandatory fields as `/celni-sprava`.
- Optional fields:
  - Same shared optional fields as `/celni-sprava`.
- Response content type: `application/pdf` (`confirmed`)
  Evidence: `mail_service/zadosti.js:11-14`, `transformation_service/templates/ossz.xsl:4`.
- Template-specific fields actually used:
  - No additional payload fields beyond the shared model.
  - Endpoint-specific behavior is only the introductory paragraph text in `ossz.xsl:8-13`.
- Template chain:
  - `ossz.xsl` -> `common.xsl` -> `pdf.xsl`: `ossz.xsl:4-6`.

## `/pojistovna`

- Caller-side endpoint: `mail_service/zadosti.js:125-149` (`confirmed`).
- Binding to XSL file `templates/pojistovna.xsl` (`inferred`), based on matching filename and deployment pattern.
- `mail_service` behavior:
  - If `data.recipients["pojistovna"]` is an array, one request is made per array element.
  - If it is a single object, one request is made with that object.
  Evidence: `mail_service/zadosti.js:143-148`.
- Transformation payload per request (`confirmed` from caller):

```ts
interface PojistovnaRequest {
  recipient: Recipient;
  applicant: Applicant;
  reply_to: ReplyToEnvelope;
  reason: Reason;
}
```

- Mandatory fields used by template:
  - Same shared mandatory fields as `/celni-sprava`.
  - `recipient.name` is additionally used by `mail_service` to derive the attachment file name: `mail_service/zadosti.js:138`.
- Optional fields:
  - Same shared optional fields as `/celni-sprava`.
- Response content type: `application/pdf` (`confirmed`)
  Evidence: `mail_service/zadosti.js:11-14`, `transformation_service/templates/pojistovna.xsl:4`.
- Template-specific fields actually used:
  - No additional payload fields beyond the shared model.
  - Endpoint-specific behavior is only the introductory paragraph text in `pojistovna.xsl:8-13`.
- Template chain:
  - `pojistovna.xsl` -> `common.xsl` -> `pdf.xsl`: `pojistovna.xsl:4-6`.

## Shared evidence from `common.xsl` and `pdf.xsl`

Shared payload fields used by all transformation endpoints:

| XPath / field | Evidence |
| --- | --- |
| `/json/applicant/name` + `/json/applicant/surname` | `common.xsl:3`, `35-37`, `56-67` |
| `/json/applicant/address/city` | `common.xsl:16`, `84-93` |
| `/json/applicant/address/lines` | `common.xsl:62`, `95-99` |
| `/json/applicant/address/zip_code` | `common.xsl:84-93` |
| `/json/applicant/personal_identification_number` | `common.xsl:43-47` |
| `/json/applicant/company_registration_number` | `common.xsl:48-53` |
| `/json/applicant/phone`, `/email`, `/data_box` | `common.xsl:64-66`, `101-122` |
| `/json/recipient/name` | `common.xsl:70-76` |
| `/json/recipient/address/lines`, `/zip_code`, `/city` | `common.xsl:76`, `84-99` |
| `/json/recipient/phone`, `/email`, `/data_box` | `common.xsl:78-80`, `101-122` |
| `/json/reason/*` | `common.xsl:27-30`, `124-135` |
| `/json/reply_to/reply_to/*` | `common.xsl:32`, `137-154` |

# 4. Shared domain models

The interfaces below preserve the field names exactly as observed in source, including the typo `permanent_addres`.

## `Address`

```ts
interface Address {
  lines?: string; // confirmed field name, inferred optional
  zip_code: string; // confirmed
  city: string; // confirmed
}
```

| Field | Status | Notes |
| --- | --- | --- |
| `lines` | `confirmed` field, `inferred` optionality | Rendered when present by `common.xsl:84-99` |
| `zip_code` | `confirmed` | Used directly in `substring(zip_code, ...)`: `common.xsl:84-93` |
| `city` | `confirmed` | Used directly in address rendering and date/place header: `common.xsl:16`, `84-93` |

## `Applicant`

```ts
interface Applicant {
  name: string; // confirmed
  surname: string; // confirmed
  address: Address; // confirmed
  personal_identification_number: string; // confirmed
  company_registration_number?: string; // confirmed field, optional by guard
  phone?: string; // confirmed field, inferred optional
  email?: string; // confirmed field, inferred optional
  data_box?: string; // confirmed field, inferred optional
}
```

| Field | Status | Notes |
| --- | --- | --- |
| `name` | `confirmed` | Combined with surname in `celeJmeno`: `common.xsl:3` |
| `surname` | `confirmed` | Combined with name in `celeJmeno`: `common.xsl:3` |
| `address` | `confirmed` | Rendered in header and used for place/date: `common.xsl:16`, `56-67`, `84-99` |
| `personal_identification_number` | `confirmed` | Printed in main body: `common.xsl:43-47` |
| `company_registration_number` | `confirmed` | Included only if present: `common.xsl:48-53` |
| `phone` | `confirmed` | Rendered only if present: `common.xsl:64`, `101-108` |
| `email` | `confirmed` | Rendered only if present: `common.xsl:65`, `110-115` |
| `data_box` | `confirmed` | Rendered only if present: `common.xsl:66`, `117-122` |

## `Recipient`

```ts
interface Recipient {
  name: string; // confirmed
  address: Address; // confirmed
  phone?: string; // confirmed field, inferred optional
  email?: string; // confirmed field, inferred optional
  data_box?: string; // confirmed field, inferred optional
}
```

| Field | Status | Notes |
| --- | --- | --- |
| `name` | `confirmed` | Rendered in addressee block: `common.xsl:70-76` |
| `address` | `confirmed` | Rendered in addressee block: `common.xsl:70-81`, `84-99` |
| `phone` | `confirmed` | Rendered only if present: `common.xsl:78`, `101-108` |
| `email` | `confirmed` | Rendered only if present: `common.xsl:79`, `110-115` |
| `data_box` | `confirmed` | Rendered only if present: `common.xsl:80`, `117-122` |

## `ReplyToEnvelope`

```ts
interface ReplyToEnvelope {
  reply_to: ReplyToMode; // confirmed
}

type ReplyToMode =
  | { data_box: string } // confirmed
  | { in_person: boolean | string | number | null } // confirmed field name, value type inferred
  | { permanent_addres: boolean | string | number | null } // confirmed typo, value type inferred
  | { contact_address: Address }; // confirmed
```

| Field | Status | Notes |
| --- | --- | --- |
| outer `reply_to` | `confirmed` | XSL reads `/json/reply_to/reply_to/*`: `common.xsl:32` |
| `data_box` | `confirmed` | Printed in reply paragraph: `common.xsl:137-139` |
| `in_person` | `confirmed` | Presence triggers fixed paragraph: `common.xsl:140-142` |
| `permanent_addres` | `confirmed` | Exact typo used in template: `common.xsl:143-145` |
| `contact_address` | `confirmed` | Renders address with applicant name: `common.xsl:146-153` |
| `contact_address.lines` | `confirmed` field, `inferred` optionality | Uses generic address template: `common.xsl:84-99` |
| `contact_address.zip_code` | `confirmed` | Uses generic address template: `common.xsl:84-93` |
| `contact_address.city` | `confirmed` | Uses generic address template: `common.xsl:84-93` |
| scalar value types for `in_person` / `permanent_addres` | `inferred` | Template only checks existence of the node, not its textual value |

## `Reason`

```ts
type Reason =
  | { job_office: boolean | string | number | null } // confirmed field name, value type inferred
  | { regional_office: boolean | string | number | null } // confirmed field name, value type inferred
  | { bank: boolean | string | number | null } // confirmed field name, value type inferred
  | { other: string }; // confirmed
```

| Field | Status | Notes |
| --- | --- | --- |
| `job_office` | `confirmed` | Mapped to fixed Czech sentence: `common.xsl:124-126` |
| `regional_office` | `confirmed` | Mapped to fixed Czech sentence: `common.xsl:127-129` |
| `bank` | `confirmed` | Mapped to fixed Czech sentence: `common.xsl:130-132` |
| `other` | `confirmed` | Directly outputs element text: `common.xsl:133-135` |
| scalar value types for the first three variants | `inferred` | Template only needs the branch element to exist |

## `ObecItems`

```ts
interface ObecItems {
  dog?: boolean | string | number | null; // confirmed field name, value type inferred
  bins?: boolean | string | number | null; // confirmed field name, value type inferred
  offenses?: boolean | string | number | null; // confirmed field name, value type inferred
  flat?: boolean | string | number | null; // confirmed field name, value type inferred
  reason?: string; // confirmed
}
```

| Field | Status | Notes |
| --- | --- | --- |
| `dog` | `confirmed` | Rendered when `xs:boolean(.)` is true: `obec.xsl:27-31` |
| `bins` | `confirmed` | Rendered when `xs:boolean(.)` is true: `obec.xsl:33-37` |
| `offenses` | `confirmed` | Rendered when `xs:boolean(.)` is true: `obec.xsl:39-43` |
| `flat` | `confirmed` | Rendered when `xs:boolean(.)` is true: `obec.xsl:45-49` |
| `reason` | `confirmed` | Rendered as free-text list item when node exists: `obec.xsl:51-56` |
| scalar value types for boolean-like fields | `inferred` | `xs:boolean(.)` suggests booleans or boolean-like text; exact JSON serialization contract is not visible |

# 5. Reconstructed outgoing email contract

## Returned object from `sendMail`

Observed return shape:

```ts
interface OutgoingMailContract {
  from: {
    name: "Nedlužím státu";
    email: "formulare@nedluzimstatu.cz";
  };
  to: {
    email: string;
    name: string;
  };
  subject: "Nedlužím státu: Vygenerovali jsme Vaše žádosti pro ověření bezdlužnosti";
  content: [
    MailBodyPart, // zadost.txt as text/plain
    MailBodyPart  // zadost.html as text/html
  ];
  attachments: TransformationAttachment[];
}
```

Evidence:

- `from`: `mail_service/zadosti.js:151-155`
- `to`: `mail_service/zadosti.js:156-159`
- `subject`: `mail_service/zadosti.js:160`
- `content`: `mail_service/zadosti.js:161-164`
- `attachments`: `mail_service/zadosti.js:51-149`, `165`

Exact runtime shape of `MailBodyPart` and `TransformationAttachment` is not fully visible, because `File.read(...)` and `HTTP.post(...)` are framework helpers from the base image, not defined in this repo. The logical contract is:

- `File.read("zadost.txt", "text/plain")`
- `File.read("zadost.html", "text/html")`
- `HTTP.post(url, { headers, data: JSON.stringify(payload) }, { filename, type: "application/pdf" })`

## Attachment naming and endpoint mapping

| Recipient type | Transformation endpoint | Attachment filename |
| --- | --- | --- |
| `celni-sprava` | `/celni-sprava` | `Bezdluznost - Celni sprava.pdf` |
| `financni-urad` | `/financni-urad` | `Bezdluznost - Financni urad.pdf` |
| `obec` | `/obec` | `Bezdluznost - obec.pdf` |
| `ossz` | `/ossz` | `Bezdluznost - CSSZ.pdf` |
| `pojistovna` | `/pojistovna` | ``Bezdluznost - ${pojistovnaShortName(pojistovna.name)}.pdf`` |

Evidence: `mail_service/zadosti.js:52-66`, `70-84`, `88-103`, `107-121`, `125-149`.

## `pojistovna` filename shortening

`mail_service` normalizes selected insurance-company names before constructing the attachment file name:

- `"Všeobecná zdravotní pojišťovna"` -> `VZP`
- `"VŠEOBECNÁ ZDRAVOTNÍ POJIŠŤOVNA ČESKÉ REPUBLIKY"` -> `VZP`
- `"Oborová zdravotní pojišťovna zaměstnanců bank, pojišťoven a stavebnictví"` -> `OZP`
- `"Oborová zdravotní pojišťovna"` -> `OZP`
- `"Česká průmyslová zdravotní pojišťovna"` -> `CPZP`
- `"Vojenská zdravotní pojišťovna České republiky"` -> `VoZP`
- `"Vojenská zdravotní pojišťovna"` -> `VoZP`
- `"Zaměstnanecká pojišťovna Škoda"` -> `ZPS`
- `"RBP, zdravotní pojišťovna"` -> `RBP-ZP`
- `"Revírní bratrská pokladna – zdravotní pojišťovna"` -> `RBP-ZP`
- `"Zdravotní pojišťovna ministerstva vnitra České republiky"` -> `ZP MV CR`
- `"Zdravotní pojišťovna Ministerstva vnitra ČR"` -> `ZP MV CR`
- `null` -> `zdravotni pojistovna`
- anything else -> original `name`

Evidence: `mail_service/zadosti.js:16-41`.

## Files that form the email body

- Plain text body: `mail_service/zadost.txt`
- HTML body: `mail_service/zadost.html`

These are the only body content files referenced by `sendMail`. Evidence: `mail_service/zadosti.js:161-164`.

# 6. Dependency map

## Cross-service dependencies

| Source file | Depends on | Dependency type |
| --- | --- | --- |
| `mail_service/zadosti.js` | `transformation_service` endpoints `/celni-sprava`, `/financni-urad`, `/obec`, `/ossz`, `/pojistovna` | Runtime HTTP dependency via `HTTP.post()` |
| `mail_service/zadosti.js` | `mail_service/zadost.txt` | Email plain-text body via `File.read()` |
| `mail_service/zadosti.js` | `mail_service/zadost.html` | Email HTML body via `File.read()` |
| `mail_service/application.yaml` | SendGrid API key | Mail delivery backend configuration |
| `transformation_service/templates/*.xsl` | `transformation_service/templates/common.xsl` | Shared XHTML generation |
| `transformation_service/templates/*.xsl` | `transformation_service/templates/pdf.xsl` | Shared PDF rendering chain |
| `transformation_service/templates/common.xsl` | `phone.svg`, `e-mail.svg`, `isds.svg` | Icon assets referenced from XHTML |
| `transformation_service/templates/pdf.xsl` | inline SVG templates for the three known icon files | FO rendering implementation |
| `transformation_service/templates/.fop/fop.xconf` | bundled Open Sans fonts under `.fop/fonts/` | FOP renderer configuration |

## Endpoint names tied to filenames

Confirmed on the caller side:

- `/celni-sprava` is called from `mail_service/zadosti.js:55`
- `/financni-urad` is called from `mail_service/zadosti.js:73`
- `/obec` is called from `mail_service/zadosti.js:91`
- `/ossz` is called from `mail_service/zadosti.js:110`
- `/pojistovna` is called from `mail_service/zadosti.js:129`

Inferred on the transformation side:

- `celni-sprava.xsl`
- `financni-urad.xsl`
- `obec.xsl`
- `ossz.xsl`
- `pojistovna.xsl`

Reasoning: the transformation image copies template files directly into the XSLT service data directory (`transformation_service/Dockerfile:5-6`), and no alternative routing code exists in this repo.

## Shared templates and assets

- `common.xsl` is shared by all five business templates.
- `pdf.xsl` is the common final rendering step for all five business templates.
- `phone.svg`, `e-mail.svg`, `isds.svg` are shared icon assets referenced by `common.xsl` and rendered by `pdf.xsl`.
- `.fop/fop.xconf` and `.fop/fonts/*` are shared PDF renderer assets, not endpoint-specific business templates.

# 7. Ambiguities and missing information

| Issue | What is missing | How to verify | Rewrite risk |
| --- | --- | --- | --- |
| Transformation routing implementation is absent | No server code shows how `/celni-sprava` etc. map to XSL filenames | Inspect the source or docs of `filipjirsak/xslt-service:latest`, or run the container and hit the endpoints locally | High: route-to-template binding is currently inferred, not proven from this repo |
| External HTTP response of `POST /zadosti` is absent | No controller/runtime code shows status codes, response body, or failure mode | Inspect `filipjirsak/mail-service` source or exercise the endpoint in a running environment | High: rewrite needs compatibility on success/error responses |
| External request content-type is not explicit | `sendMail` receives an object, but the HTTP parser layer is not present | Inspect base mail-service docs or runtime config | Medium |
| No validation layer is visible | There is no JSON schema, DTO, or explicit validation in repo | Inspect the frontend caller or base service definitions | High: required vs optional fields are usage-based, not contract-enforced |
| JSON-to-XML conversion rules are absent | XSL matches `/json/...`, but the JSON serialization rules of `xslt-service` are not present | Inspect `xslt-service` source or send controlled JSON samples through it | Medium |
| `reply_to.reply_to` double nesting may be accidental or contractual | Only the nested structure is visible in XSL; upstream rationale is unknown | Inspect the frontend payload generator or real captured requests | Medium |
| `permanent_addres` is likely a typo, but it is the only confirmed key | No alternative spelling exists in repo | Check real requests or frontend code; do not silently rename in rewrite without confirmation | High |
| Several `x:file-name` values are inconsistent with template names | `obec.xsl` and `pojistovna.xsl` declare `zadost-financni-urad.pdf`; `ossz.xsl` declares `zadost-celni-sprava.pdf` | Run the transformation service and inspect any emitted filename headers or internal logs | Medium |
| `pdf.xsl` references missing `financni-urad-json.xsl` via `x:previous-templates` | That file does not exist in this repo, so the meaning of the attribute is unclear | Inspect `xslt-service` semantics or the base image contents | Medium |
| README conflicts with repository state | `mail_service/README.md:21-22` says `application.yaml` is not in Git, but a placeholder file is present | Check repository history or deployment packaging conventions | Low |
| Hardcoded transformation base URL points to production | No environment override is visible in `zadosti.js` | Inspect deployment config or runtime overrides in the hosting platform | Medium |
| Exact accepted scalar types for `reason.job_office`, `reply_to.in_person`, `items.dog`, etc. are unclear | XSL only requires element existence or `xs:boolean(.)`, not specific JSON types | Replay real payloads or inspect frontend serializer | Medium |
| Exact runtime shape of `HTTP.post(...)` attachment descriptors is hidden | Framework helper implementation is outside this repo | Inspect `filipjirsak/mail-service` source or runtime docs | Medium |

## Explicit conflicts and inconsistencies found

1. `transformation_service/templates/obec.xsl:4` declares `x:file-name="zadost-financni-urad.pdf"`, which does not match the endpoint/template name.
2. `transformation_service/templates/pojistovna.xsl:4` declares `x:file-name="zadost-financni-urad.pdf"`, which also does not match.
3. `transformation_service/templates/ossz.xsl:4` declares `x:file-name="zadost-celni-sprava.pdf"`, which does not match.
4. `transformation_service/templates/pdf.xsl:5` references `x:previous-templates="financni-urad-json.xsl"`, but that file is not present.
5. `mail_service/README.md:21-22` says `application.yaml` is not in Git, but `mail_service/application.yaml` exists with placeholder token.

# 8. Proposed contract test fixtures

The fixtures below are intentionally minimal and only use fields evidenced by this repo. They are stored under `docs/fixtures/`.

| Fixture file | Purpose |
| --- | --- |
| `docs/fixtures/zadosti-simple-financni-urad.json` | simplest single-recipient request |
| `docs/fixtures/zadosti-multi-instituce.json` | one request generating multiple institution PDFs |
| `docs/fixtures/zadosti-multi-pojistovny.json` | one request generating multiple insurance attachments |
| `docs/fixtures/zadosti-obec-items.json` | municipal request exercising `items` |

## `zadosti-simple-financni-urad.json`

```json
{
  "recipientEmail": "jana.novakova@example.cz",
  "recipientName": "Jana Novakova",
  "applicant": {
    "name": "Jana",
    "surname": "Novakova",
    "address": {
      "lines": "Kvetna 12",
      "zip_code": "11000",
      "city": "Praha 1"
    },
    "personal_identification_number": "845101/1234",
    "email": "jana.novakova@example.cz",
    "phone": "+420777888999"
  },
  "reply_to": {
    "reply_to": {
      "in_person": true
    }
  },
  "reason": {
    "job_office": true
  },
  "recipients": {
    "financni-urad": {
      "name": "Financni urad pro hlavni mesto Prahu",
      "address": {
        "lines": "Stepanska 28",
        "zip_code": "11121",
        "city": "Praha 1"
      },
      "data_box": "pxmnyqw"
    }
  }
}
```

## `zadosti-multi-instituce.json`

```json
{
  "recipientEmail": "petr.svoboda@example.cz",
  "recipientName": "Petr Svoboda",
  "applicant": {
    "name": "Petr",
    "surname": "Svoboda",
    "address": {
      "lines": "Masarykova 45",
      "zip_code": "60200",
      "city": "Brno 2"
    },
    "personal_identification_number": "810212/5678",
    "company_registration_number": "12345678",
    "email": "petr.svoboda@example.cz",
    "phone": "777666555",
    "data_box": "ab12cd3"
  },
  "reply_to": {
    "reply_to": {
      "data_box": "ab12cd3"
    }
  },
  "reason": {
    "bank": true
  },
  "recipients": {
    "celni-sprava": {
      "name": "Celni urad pro Jihomoravsky kraj",
      "address": {
        "lines": "Krenova 17",
        "zip_code": "60200",
        "city": "Brno"
      }
    },
    "financni-urad": {
      "name": "Financni urad pro Jihomoravsky kraj",
      "address": {
        "lines": "Namesti Svobody 4",
        "zip_code": "60200",
        "city": "Brno"
      }
    },
    "ossz": {
      "name": "Mestska sprava socialniho zabezpeceni Brno",
      "address": {
        "lines": "Veveří 7",
        "zip_code": "60200",
        "city": "Brno"
      }
    }
  }
}
```

## `zadosti-multi-pojistovny.json`

```json
{
  "recipientEmail": "martina.dvorakova@example.cz",
  "recipientName": "Martina Dvorakova",
  "applicant": {
    "name": "Martina",
    "surname": "Dvorakova",
    "address": {
      "lines": "Smetanova 8",
      "zip_code": "30100",
      "city": "Plzen 3"
    },
    "personal_identification_number": "905303/4321",
    "email": "martina.dvorakova@example.cz"
  },
  "reply_to": {
    "reply_to": {
      "contact_address": {
        "lines": "P. O. Box 12",
        "zip_code": "30100",
        "city": "Plzen"
      }
    }
  },
  "reason": {
    "regional_office": true
  },
  "recipients": {
    "pojistovna": [
      {
        "name": "Všeobecná zdravotní pojišťovna",
        "address": {
          "lines": "Orlicka 4",
          "zip_code": "13000",
          "city": "Praha 3"
        }
      },
      {
        "name": "Oborová zdravotní pojišťovna",
        "address": {
          "lines": "Roškotova 1",
          "zip_code": "14000",
          "city": "Praha 4"
        }
      }
    ]
  }
}
```

## `zadosti-obec-items.json`

```json
{
  "recipientEmail": "lukas.havel@example.cz",
  "recipientName": "Lukas Havel",
  "applicant": {
    "name": "Lukas",
    "surname": "Havel",
    "address": {
      "lines": "Hlavni 99",
      "zip_code": "37001",
      "city": "Ceske Budejovice 1"
    },
    "personal_identification_number": "780707/1111",
    "phone": "604123456"
  },
  "reply_to": {
    "reply_to": {
      "permanent_addres": true
    }
  },
  "reason": {
    "other": "zadost o socialni bydleni"
  },
  "recipients": {
    "obec": {
      "name": "Magistrat mesta Ceske Budejovice",
      "address": {
        "lines": "nam. Premysla Otakara II. 1/1",
        "zip_code": "37092",
        "city": "Ceske Budejovice"
      },
      "email": "posta@c-budejovice.cz"
    }
  },
  "items": {
    "dog": true,
    "bins": true,
    "offenses": false,
    "flat": true,
    "reason": "mistni poplatek z pobytu"
  }
}
```
