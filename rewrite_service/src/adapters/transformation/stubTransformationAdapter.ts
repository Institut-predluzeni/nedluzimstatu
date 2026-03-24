import type { AttachmentPlan, GeneratedAttachment } from "../../domain/types.js";
import type { TransformationAdapter } from "./types.js";

function createDeterministicPdfBuffer(plan: AttachmentPlan): Buffer {
  const payloadJson = JSON.stringify(plan.payload);
  const body = [
    "%PDF-1.4",
    "% rewrite_service phase 1 stub",
    `endpoint=${plan.endpoint}`,
    `filename=${plan.filename}`,
    `payload=${payloadJson}`,
    "%%EOF",
    "",
  ].join("\n");

  return Buffer.from(body, "utf8");
}

export class StubTransformationAdapter implements TransformationAdapter {
  async generateAttachment(plan: AttachmentPlan): Promise<GeneratedAttachment> {
    return {
      filename: plan.filename,
      contentType: "application/pdf",
      content: createDeterministicPdfBuffer(plan),
    };
  }
}

export class RecordingTransformationAdapter extends StubTransformationAdapter {
  public readonly plans: AttachmentPlan[] = [];

  override async generateAttachment(plan: AttachmentPlan): Promise<GeneratedAttachment> {
    this.plans.push(plan);
    return super.generateAttachment(plan);
  }
}
