import { PDFDocument, StandardFonts, rgb, type PDFPage, type PDFFont } from "pdf-lib";
import QRCode from "qrcode";
import type { ExamInstanceMap } from "./generate";
import { formatSheetCode } from "./sheet-code";

const LETTER = { width: 612, height: 792 };
const MARGIN = 28;

function drawQrOnPage(page: PDFPage, text: string, x: number, y: number, size: number): void {
  const qr = QRCode.create(text, { errorCorrectionLevel: "M" });
  const n = qr.modules.size;
  // Quiet zone: 4 modules on each side (QR spec).
  const quiet = 4;
  const total = n + quiet * 2;
  const cell = size / total;
  const originX = x + quiet * cell;
  const originY = y + quiet * cell;
  page.drawRectangle({
    x,
    y,
    width: size,
    height: size,
    color: rgb(1, 1, 1),
    borderColor: rgb(0.75, 0.75, 0.75),
    borderWidth: 0.5,
  });
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      if (qr.modules.get(row, col)) {
        page.drawRectangle({
          x: originX + col * cell,
          y: originY + (n - 1 - row) * cell,
          width: cell,
          height: cell,
          color: rgb(0, 0, 0),
        });
      }
    }
  }
}

export type BuildPdfOptions = {
  /** Absolute URL opened by phone camera (e.g. https://host/s/CODE). */
  gradeUrl: string;
};

export async function buildExamPdf(
  instance: ExamInstanceMap,
  opts: BuildPdfOptions,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([LETTER.width, LETTER.height]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const qrSize = 92;
  const qrX = LETTER.width - MARGIN - qrSize;
  const qrY = LETTER.height - MARGIN - qrSize - 18;
  drawQrOnPage(page, opts.gradeUrl, qrX, qrY, qrSize);

  const codeLabel = formatSheetCode(instance.instance_id);
  page.drawText("Scan to grade", {
    x: Math.max(MARGIN, qrX - 2),
    y: qrY + qrSize + 6,
    size: 7,
    font,
    color: rgb(0.35, 0.35, 0.35),
  });
  page.drawText(codeLabel, {
    x: Math.max(MARGIN, qrX - 2),
    y: qrY - 12,
    size: 9,
    font: fontBold,
    color: rgb(0.15, 0.15, 0.15),
  });

  let y = LETTER.height - MARGIN - 8;
  page.drawText("Personalized Exam Sheet", {
    x: MARGIN,
    y,
    size: 12,
    font: fontBold,
  });
  y -= 14;
  const nameLine = ensurePdfText(`Name: ${truncate(instance.student_name, 42)}`, font);
  const idLine = ensurePdfText(`Student ID: ${truncate(instance.student_id, 28)}`, font);
  page.drawText(nameLine, { x: MARGIN, y, size: 9, font });
  y -= 12;
  page.drawText(idLine, { x: MARGIN, y, size: 9, font });
  y -= 12;
  page.drawText("Fill one bubble per question (A–D). Hand in this sheet.", {
    x: MARGIN,
    y,
    size: 8,
    font,
    color: rgb(0.25, 0.25, 0.25),
  });
  y -= 14;

  const left = MARGIN;
  const contentWidth = LETTER.width - MARGIN * 2 - qrSize - 8;

  for (let i = 0; i < instance.questions.length; i++) {
    const q = instance.questions[i]!;
    const stem = ensurePdfText(`${i + 1}. ${q.stem}`, font);
    const stemLines = wrapText(stem, font, 8, contentWidth);
    const choiceBlocks = (["A", "B", "C", "D"] as const).map((letter) =>
      wrapText(ensurePdfText(`${letter}) ${q.choices[letter]}`, font), font, 7.5, contentWidth - 14),
    );
    const blockHeight =
      stemLines.length * 9 + choiceBlocks.reduce((s, lines) => s + lines.length * 9 + 1, 0) + 6;
    if (y - blockHeight < MARGIN + 12) {
      throw new Error(
        `Exam sheet overflow for ${instance.student_id}: shorten question text (failed at Q${i + 1})`,
      );
    }
    for (const line of stemLines) {
      page.drawText(line, { x: left, y, size: 8, font });
      y -= 9;
    }
    for (const lines of choiceBlocks) {
      drawBubble(page, left, y - 1);
      let cy = y;
      for (const line of lines) {
        page.drawText(line, { x: left + 14, y: cy, size: 7.5, font });
        cy -= 9;
      }
      y = cy - 1;
    }
    y -= 3;
  }

  page.drawText(`Sheet ${codeLabel}`, {
    x: MARGIN,
    y: MARGIN - 2,
    size: 7,
    font,
    color: rgb(0.45, 0.45, 0.45),
  });

  return doc.save();
}

export async function buildCombinedExamPdf(
  sheets: Array<{ instance: ExamInstanceMap; options: BuildPdfOptions }>,
): Promise<Uint8Array> {
  if (sheets.length === 0) {
    throw new Error("Cannot build a combined PDF with zero student sheets");
  }
  const combined = await PDFDocument.create();
  for (const sheet of sheets) {
    const source = await PDFDocument.load(await buildExamPdf(sheet.instance, sheet.options));
    const [page] = await combined.copyPages(source, [0]);
    if (!page) throw new Error(`Could not combine sheet for ${sheet.instance.student_id}`);
    combined.addPage(page);
  }
  return combined.save();
}

function drawBubble(page: PDFPage, x: number, y: number): void {
  page.drawCircle({
    x: x + 3.5,
    y: y + 2.5,
    size: 4,
    borderColor: rgb(0, 0, 0),
    borderWidth: 0.8,
  });
}

function truncate(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, Math.max(0, max - 1))}…`;
}

function ensurePdfText(text: string, font: PDFFont): string {
  for (const character of text) {
    try {
      font.encodeText(character);
    } catch {
      const codePoint = character.codePointAt(0)?.toString(16).toUpperCase().padStart(4, "0");
      throw new Error(
        `PDF text contains unsupported character U+${codePoint}. Use Latin characters supported by Helvetica.`,
      );
    }
  }
  return text;
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const trial = cur ? `${cur} ${w}` : w;
    if (font.widthOfTextAtSize(trial, size) <= maxWidth) {
      cur = trial;
    } else {
      if (cur) lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [""];
}
