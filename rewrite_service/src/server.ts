import { LoggingMailProvider } from "./adapters/mail/loggingMailProvider.js";
import { PdfTransformationAdapter } from "./adapters/transformation/pdfTransformationAdapter.js";
import { buildApp } from "./app.js";

const port = Number(process.env.PORT ?? "3000");

async function main(): Promise<void> {
  const app = buildApp({
    transformationAdapter: new PdfTransformationAdapter(),
    mailProvider: new LoggingMailProvider(),
  });

  await app.listen({
    port,
    host: "0.0.0.0",
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
