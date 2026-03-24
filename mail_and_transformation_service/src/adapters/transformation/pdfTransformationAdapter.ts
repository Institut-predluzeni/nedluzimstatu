import type { AttachmentPlan, GeneratedAttachment } from "../../domain/types.js";
import { buildLetterDocument } from "./pdf/buildLetterDocument.js";
import { renderPdf } from "./pdf/renderPdf.js";
import type { TransformationAdapter } from "./types.js";

interface PdfTransformationAdapterOptions {
  now?: () => Date;
}

export class PdfTransformationAdapter implements TransformationAdapter {
  private readonly now: () => Date;

  constructor(options: PdfTransformationAdapterOptions = {}) {
    this.now = options.now ?? (() => new Date());
  }

  async generateAttachment(plan: AttachmentPlan): Promise<GeneratedAttachment> {
    const createdAt = this.now();
    const letter = buildLetterDocument(plan, createdAt);
    const content = await renderPdf(letter, {
      createdAt,
    });

    return {
      filename: plan.filename,
      contentType: "application/pdf",
      content,
    };
  }
}

export class RecordingTransformationAdapter extends PdfTransformationAdapter {
  public readonly plans: AttachmentPlan[] = [];

  override async generateAttachment(plan: AttachmentPlan): Promise<GeneratedAttachment> {
    this.plans.push(plan);
    return super.generateAttachment(plan);
  }
}
