import Fastify, { type FastifyInstance } from "fastify";

import { MailProviderError, type MailProvider } from "./adapters/mail/types.js";
import type { TransformationAdapter } from "./adapters/transformation/types.js";
import type { MailAddress } from "./domain/types.js";
import { registerHealthRoute } from "./routes/health.js";
import { registerZadostiRoute } from "./routes/zadosti.js";

export interface AppDeps {
  transformationAdapter: TransformationAdapter;
  mailProvider: MailProvider;
  mailFrom?: Required<MailAddress>;
}

function configureLegacyJsonParsing(app: FastifyInstance): void {
  app.removeContentTypeParser("application/json");
  app.addContentTypeParser(
    "application/json",
    { parseAs: "string" },
    (_request, body, done) => {
      try {
        const parsed = JSON.parse(body as string) as unknown;
        done(null, parsed);
      } catch (error) {
        const parsingError = new Error("LEGACY_INVALID_JSON");
        done(parsingError);
      }
    },
  );

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof Error && error.message === "LEGACY_INVALID_JSON") {
      void reply.code(500).type("text/plain; charset=utf-8").send("");
      return;
    }

    if (error instanceof MailProviderError) {
      void reply
        .code(500)
        .type("application/json; charset=utf-8")
        .send({ message: "Mail provider send failed" });
      return;
    }

    void reply.send(error);
  });
}

export function buildApp(deps: AppDeps): FastifyInstance {
  const app = Fastify({
    logger: false,
  });

  configureLegacyJsonParsing(app);

  registerHealthRoute(app);
  registerZadostiRoute(app, deps);

  return app;
}
