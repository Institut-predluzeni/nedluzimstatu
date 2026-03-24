import type { AttachmentPlan, GeneratedAttachment } from "../../domain/types.js";

export interface TransformationAdapter {
  generateAttachment(plan: AttachmentPlan): Promise<GeneratedAttachment>;
}
