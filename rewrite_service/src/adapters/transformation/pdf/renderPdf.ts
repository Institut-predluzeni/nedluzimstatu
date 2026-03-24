import PDFDocument from "pdfkit";
import { Buffer } from "node:buffer";
import path from "node:path";

import type { LetterDocument, LetterSection } from "./buildLetterDocument.js";

interface RenderPdfOptions {
  createdAt: Date;
  regularFontPath?: string;
  boldFontPath?: string;
}

function getDefaultFontPath(fileName: string): string {
  return path.resolve(process.cwd(), "assets", "fonts", fileName);
}

function renderBlock(doc: PDFKit.PDFDocument, block: LetterSection): void {
  if (block.kind === "paragraph") {
    doc.font("regular").fontSize(11).text(block.text ?? "", {
      lineGap: 2,
    });
    doc.moveDown(0.8);
    return;
  }

  if (block.kind === "bullet-list") {
    for (const item of block.items ?? []) {
      doc.font("regular").fontSize(11).text(`• ${item}`, {
        indent: 14,
        lineGap: 2,
      });
    }
    doc.moveDown(0.8);
    return;
  }

  for (const line of block.lines ?? []) {
    doc.font("regular").fontSize(11).text(line, {
      lineGap: 1,
    });
  }
  doc.moveDown(0.8);
}

function renderAddress(doc: PDFKit.PDFDocument, lines: string[]): void {
  if (lines.length === 0) {
    return;
  }

  const [firstLine, ...rest] = lines;
  doc.font("bold").fontSize(11).text(firstLine ?? "", {
    lineGap: 1,
  });

  for (const line of rest) {
    doc.font("regular").fontSize(11).text(line, {
      lineGap: 1,
    });
  }

  doc.moveDown(0.8);
}

export async function renderPdf(
  letter: LetterDocument,
  options: RenderPdfOptions,
): Promise<Buffer> {
  const doc = new PDFDocument({
    size: "A4",
    margin: 50,
    compress: false,
    info: {
      Title: letter.title,
      Author: letter.author,
      Subject: letter.subject,
      Creator: "rewrite_service",
      Producer: "rewrite_service",
      CreationDate: options.createdAt,
      ModDate: options.createdAt,
    },
  });

  doc.registerFont("regular", options.regularFontPath ?? getDefaultFontPath("OpenSans-Regular.ttf"));
  doc.registerFont("bold", options.boldFontPath ?? getDefaultFontPath("OpenSans-Bold.ttf"));

  const chunks: Buffer[] = [];
  const result = new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (chunk: Buffer | Uint8Array) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    doc.on("end", () => {
      resolve(Buffer.concat(chunks));
    });
    doc.on("error", reject);
  });

  renderAddress(doc, letter.applicantLines);
  renderAddress(doc, letter.recipientLines);

  doc.font("regular").fontSize(11).text(letter.dateLine, {
    align: "right",
  });
  doc.moveDown(1);

  doc.font("bold").fontSize(12).text(letter.subject);
  doc.moveDown(1);

  for (const block of letter.body) {
    renderBlock(doc, block);
  }

  doc.font("bold").fontSize(11).text(letter.signature);

  doc.end();

  return result;
}
