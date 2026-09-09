import { describe, expect, it } from "vitest";
import { validateBankCsv, validateRosterCsv } from "../src/lib/bank";
import { generateInstances, type ExamInstanceMap } from "../src/lib/generate";
import { buildCombinedExamPdf, buildExamPdf } from "../src/lib/pdf";
import { orderInstancesByRoster } from "../src/lib/roster-order";
import { formatSheetCode } from "../src/lib/sheet-code";
import { PDFDocument } from "pdf-lib";
import { inflateSync } from "node:zlib";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/** Pull printable WinAnsi / hex strings out of a PDF for identity checks. */
function extractPdfText(pdf: Uint8Array): string {
  const parts: Buffer[] = [];
  let i = 0;
  const buf = Buffer.from(pdf);
  while (true) {
    const a = buf.indexOf(Buffer.from("stream"), i);
    if (a < 0) break;
    const b = buf.indexOf(Buffer.from("endstream"), a);
    let raw = buf.subarray(a + 6, b);
    if (raw[0] === 0x0d && raw[1] === 0x0a) raw = raw.subarray(2);
    else if (raw[0] === 0x0a) raw = raw.subarray(1);
    try {
      parts.push(inflateSync(raw));
    } catch {
      parts.push(Buffer.from(raw));
    }
    i = b + 9;
  }
  const blob = Buffer.concat(parts).toString("latin1");
  const out: string[] = [];
  for (const m of blob.matchAll(/<([0-9A-Fa-f]+)>/g)) {
    const hex = m[1]!;
    let s = "";
    for (let p = 0; p + 1 < hex.length; p += 2) {
      s += String.fromCharCode(parseInt(hex.slice(p, p + 2), 16));
    }
    out.push(s);
  }
  return out.join("\n");
}

describe("pdf generation", () => {
  it("builds a Letter PDF for one student with 40 choice slots", async () => {
    const bank = validateBankCsv(readFileSync(resolve("samples/bank.csv"), "utf8"));
    expect(bank.ok).toBe(true);
    if (!bank.ok) return;
    const instances = generateInstances(
      bank.questions,
      [{ student_name: "Alex Rivera", student_id: "S1001" }],
      "pdf-seed",
      "gen-1",
    );
    expect(instances[0]!.questions).toHaveLength(10);
    expect(instances[0]!.questions.length * 4).toBe(40);
    const pdf = await buildExamPdf(instances[0]!, {
      gradeUrl: `https://example.test/s/${instances[0]!.instance_id}`,
    });
    expect(pdf.byteLength).toBeGreaterThan(1000);
    expect(String.fromCharCode(...pdf.slice(0, 4))).toBe("%PDF");
    const text = extractPdfText(pdf);
    expect(text).toContain("Name: Alex Rivera");
    expect(text).toContain("Student ID: S1001");
    expect(text).toContain(formatSheetCode(instances[0]!.instance_id));
  });

  it("builds PDFs for full sample roster", async () => {
    const bank = validateBankCsv(readFileSync(resolve("samples/bank.csv"), "utf8"));
    const roster = validateRosterCsv(readFileSync(resolve("samples/students.csv"), "utf8"));
    expect(bank.ok && roster.ok).toBe(true);
    if (!bank.ok || !roster.ok) return;
    const instances = generateInstances(bank.questions, roster.students, "pdf-all", "gen-pdf-all");
    for (const inst of instances) {
      const pdf = await buildExamPdf(inst, {
        gradeUrl: `https://example.test/s/${inst.instance_id}`,
      });
      expect(pdf.byteLength).toBeGreaterThan(1000);
    }
  });

  it("combines a 40-student roster into one Letter page per student in roster order", async () => {
    const bank = validateBankCsv(readFileSync(resolve("samples/bank.csv"), "utf8"));
    expect(bank.ok).toBe(true);
    if (!bank.ok) return;
    const students = Array.from({ length: 40 }, (_, index) => ({
      student_name: `Student ${index + 1}`,
      student_id: `S${String(index + 1).padStart(3, "0")}`,
    }));
    const instances = generateInstances(bank.questions, students, "pdf-40", "gen-pdf-40");
    // Shuffle map order to prove combine uses caller (roster) order, not insertion luck.
    const shuffled = [...instances].reverse();
    const ordered = orderInstancesByRoster(
      students,
      new Map(shuffled.map((instance) => [instance.student_id, instance])),
    );
    const bytes = await buildCombinedExamPdf(
      ordered.map((instance) => ({
        instance,
        options: { gradeUrl: `https://example.test/s/${instance.instance_id}` },
      })),
    );
    const document = await PDFDocument.load(bytes);
    expect(document.getPageCount()).toBe(40);
    for (const page of document.getPages()) {
      expect(page.getSize()).toEqual({ width: 612, height: 792 });
    }

    // Spot-check first, middle, last page identity + sheet code (QR payload is drawn, not text).
    const pageBytes = async (index: number) => {
      const one = await PDFDocument.create();
      const [copied] = await one.copyPages(document, [index]);
      one.addPage(copied!);
      return one.save();
    };
    for (const index of [0, 19, 39] as const) {
      const text = extractPdfText(await pageBytes(index));
      const student = students[index]!;
      const instance = ordered[index]!;
      expect(text).toContain(`Name: ${student.student_name}`);
      expect(text).toContain(`Student ID: ${student.student_id}`);
      expect(text).toContain(formatSheetCode(instance.instance_id));
      expect(text).toContain("Scan to grade");
    }
    expect(ordered.map((instance) => instance.student_id)).toEqual(
      students.map((student) => student.student_id),
    );
    expect(new Set(ordered.map((instance) => instance.instance_id)).size).toBe(40);
  });

  it("preserves supported Unicode in names, IDs, and question content", async () => {
    const bank = validateBankCsv(readFileSync(resolve("samples/bank.csv"), "utf8"));
    expect(bank.ok).toBe(true);
    if (!bank.ok) return;
    const [instance] = generateInstances(
      bank.questions,
      [{ student_name: "Zoë Álvarez", student_id: "ÉLÈVE-42" }],
      "pdf-unicode",
      "gen-pdf-unicode",
    );
    instance!.questions[0]!.stem += " — café déjà vu";
    const bytes = await buildCombinedExamPdf([
      { instance: instance!, options: { gradeUrl: `https://example.test/s/${instance!.instance_id}` } },
    ]);
    expect((await PDFDocument.load(bytes)).getPageCount()).toBe(1);
    const text = extractPdfText(bytes);
    expect(text).toContain("Zoë Álvarez");
    expect(text).toContain("ÉLÈVE-42");
    expect(text).toContain("café déjà vu");
  });

  it("rejects unsupported Unicode instead of silently corrupting student identity", async () => {
    const bank = validateBankCsv(readFileSync(resolve("samples/bank.csv"), "utf8"));
    expect(bank.ok).toBe(true);
    if (!bank.ok) return;
    const [instance] = generateInstances(
      bank.questions,
      [{ student_name: "李 東京", student_id: "S-UNICODE" }],
      "pdf-unsupported-unicode",
      "gen-pdf-unsupported-unicode",
    );
    await expect(
      buildExamPdf(instance!, { gradeUrl: `https://example.test/s/${instance!.instance_id}` }),
    ).rejects.toThrow(/unsupported character U\+/);
  });

  it("rejects an empty combined sheet list", async () => {
    await expect(buildCombinedExamPdf([])).rejects.toThrow(/zero student sheets/);
  });
});

describe("roster order helper", () => {
  it("fails when a roster student is missing a generated sheet", () => {
    const map = new Map<string, ExamInstanceMap>();
    expect(() => orderInstancesByRoster([{ student_id: "S1" }], map)).toThrow(/incomplete/);
  });
});

describe("edge cases", () => {
  it("rejects unknown bank columns", () => {
    const header =
      "question_id,stem_template,choice_a_template,choice_b_template,choice_c_template,choice_d_template,correct_choice,extra\n";
    const row = "q1,stem,a,b,c,d,A,nope\n".repeat(10);
    const res = validateBankCsv(header + row);
    expect(res.ok).toBe(false);
  });

  it("rejects empty roster", () => {
    const res = validateRosterCsv("student_name,student_id\n");
    expect(res.ok).toBe(false);
  });
});
