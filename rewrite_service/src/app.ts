import Fastify, { type FastifyInstance } from "fastify";

import type { MailProvider } from "./adapters/mail/types.js";
import type { TransformationAdapter } from "./adapters/transformation/types.js";
import { registerHealthRoute } from "./routes/health.js";
import { registerZadostiRoute } from "./routes/zadosti.js";

export interface AppDeps {
  transformationAdapter: TransformationAdapter;
  mailProvider: MailProvider;
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
