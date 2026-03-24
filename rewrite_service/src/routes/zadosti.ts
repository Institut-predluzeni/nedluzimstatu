import type { FastifyInstance, FastifyRequest } from "fastify";

import type { MailProvider } from "../adapters/mail/types.js";
import type { TransformationAdapter } from "../adapters/transformation/types.js";
import type { MailAddress } from "../domain/types.js";
import {
  composeMail,
  normalizeZadostiRequest,
  planAttachments,
  sendLegacyBadRequest,
  sendLegacySuccess,
} from "../services/zadosti.js";

interface ZadostiRouteDeps {
  transformationAdapter: TransformationAdapter;
  mailProvider: MailProvider;
  mailFrom?: Required<MailAddress>;
}

export function registerZadostiRoute(app: FastifyInstance, deps: ZadostiRouteDeps): void {
  app.post("/zadosti", async (request: FastifyRequest, reply) => {
    const normalized = normalizeZadostiRequest(request.body);

    if (!normalized) {
      return sendLegacyBadRequest(reply);
    }

    const attachmentPlans = planAttachments(normalized);
    const attachments = await Promise.all(
      attachmentPlans.map((plan) => deps.transformationAdapter.generateAttachment(plan)),
    );
    const mail = deps.mailFrom
      ? composeMail(normalized, attachments, { from: deps.mailFrom })
      : composeMail(normalized, attachments);

    await deps.mailProvider.send(mail);

    return sendLegacySuccess(reply);
  });
}
