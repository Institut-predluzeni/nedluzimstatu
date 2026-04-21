import type { MailAddress } from "./domain/types.js";

export type MailProviderName = "log" | "memory" | "sendgrid";

export interface AppConfig {
  port: number;
  mailProvider: MailProviderName;
  mailFrom: Required<MailAddress>;
  corsOrigins: boolean | string[];
  sendGridApiKey?: string;
  sendGridApiBaseUrl: string;
}

const DEFAULT_MAIL_FROM = {
  name: "Nedlužím státu",
  email: "formulare@nedluzimstatu.cz",
} as const;

function parsePort(value: string | undefined): number {
  const parsed = Number(value ?? "3000");
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 3000;
}

function parseMailProvider(value: string | undefined): MailProviderName {
  const normalized = (value ?? "log").trim().toLowerCase();

  switch (normalized) {
    case "log":
    case "memory":
    case "sendgrid":
      return normalized as MailProviderName;
    default:
      return "log";
  }
}

function parseCorsOrigins(value: string | undefined): boolean | string[] {
  const normalized = value?.trim();

  if (!normalized || normalized === "*" || normalized.toLowerCase() === "true") {
    return true;
  }

  if (normalized.toLowerCase() === "false") {
    return false;
  }

  return normalized
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const sendGridApiKey = env.SENDGRID_API_KEY?.trim() || undefined;

  return {
    port: parsePort(env.PORT),
    mailProvider: parseMailProvider(env.MAIL_PROVIDER),
    mailFrom: {
      email: env.MAIL_FROM_EMAIL?.trim() || DEFAULT_MAIL_FROM.email,
      name: env.MAIL_FROM_NAME?.trim() || DEFAULT_MAIL_FROM.name,
    },
    corsOrigins: parseCorsOrigins(env.CORS_ORIGINS),
    sendGridApiBaseUrl: env.SENDGRID_API_BASE_URL?.trim() || "https://api.sendgrid.com/v3",
    ...(sendGridApiKey ? { sendGridApiKey } : {}),
  };
}
