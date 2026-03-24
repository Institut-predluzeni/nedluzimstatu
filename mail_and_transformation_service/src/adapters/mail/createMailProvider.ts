import type { AppConfig } from "../../config.js";
import { InMemoryMailProvider } from "./inMemoryMailProvider.js";
import { LoggingMailProvider } from "./loggingMailProvider.js";
import { SendGridMailProvider } from "./sendGridMailProvider.js";
import type { MailProvider } from "./types.js";

export function createMailProvider(config: AppConfig): MailProvider {
  switch (config.mailProvider) {
    case "memory":
      return new InMemoryMailProvider();
    case "log":
      return new LoggingMailProvider();
    case "sendgrid":
      if (!config.sendGridApiKey) {
        throw new Error("SENDGRID_API_KEY is required when MAIL_PROVIDER=sendgrid");
      }

      return new SendGridMailProvider({
        apiKey: config.sendGridApiKey,
        apiBaseUrl: config.sendGridApiBaseUrl,
      });
  }
}
