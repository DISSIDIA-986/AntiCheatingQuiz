import { describe, expect, it } from "vitest";
import { validateBankCsv, validateRosterCsv } from "../src/lib/bank";
import { generateInstances } from "../src/lib/generate";
import { buildCombinedExamPdf, buildExamPdf } from "../src/lib/pdf";
import { PDFDocument } from "pdf-lib";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

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
    const bytes = await buildCombinedExamPdf(
      instances.map((instance) => ({
        instance,
        options: { gradeUrl: `https://example.test/s/${instance.instance_id}` },
      })),
    );
    const document = await PDFDocument.load(bytes);
    expect(document.getPageCount()).toBe(40);
    for (const page of document.getPages()) {
      expect(page.getSize()).toEqual({ width: 612, height: 792 });
    }
    expect(instances.map((instance) => instance.student_id)).toEqual(students.map((student) => student.student_id));
    expect(new Set(instances.map((instance) => instance.instance_id)).size).toBe(40);
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
