import { createMailProvider } from "./adapters/mail/createMailProvider.js";
import { PdfTransformationAdapter } from "./adapters/transformation/pdfTransformationAdapter.js";
import { buildApp } from "./app.js";
import { loadConfig } from "./config.js";

async function main(): Promise<void> {
  const config = loadConfig();
  const app = buildApp({
    transformationAdapter: new PdfTransformationAdapter(),
    mailProvider: createMailProvider(config),
    mailFrom: config.mailFrom,
  });

  await app.listen({
    port: config.port,
    host: "0.0.0.0",
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
