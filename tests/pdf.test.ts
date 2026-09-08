import { describe, expect, it } from "vitest";
import { validateBankCsv, validateRosterCsv } from "../src/lib/bank";
import { generateInstances } from "../src/lib/generate";
import { buildExamPdf } from "../src/lib/pdf";
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
    const pdf = await buildExamPdf(instances[0]!);
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
      const pdf = await buildExamPdf(inst);
      expect(pdf.byteLength).toBeGreaterThan(1000);
    }
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
