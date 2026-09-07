import { describe, expect, it } from "vitest";
import { validateBankCsv, validateRosterCsv, renderQuestion } from "../src/lib/bank";
import { createRng, generateInstances, scoreAnswers } from "../src/lib/generate";
import { parseCsv, toCsv } from "../src/lib/csv";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const bankPath = resolve("samples/bank.csv");
const rosterPath = resolve("samples/students.csv");

describe("csv", () => {
  it("parses quoted fields", () => {
    const { rows } = parseCsv('a,b\n"x,y",z\n');
    expect(rows[0]).toEqual({ a: "x,y", b: "z" });
  });
  it("roundtrips", () => {
    const text = toCsv(["a", "b"], [["1", "2"]]);
    expect(text).toContain("a,b");
  });

  it("neutralizes spreadsheet formula injection", () => {
    const text = toCsv(["name"], [["=1+1"], ["+cmd"], ["@sum"]]);
    expect(text).toContain("'=1+1");
    expect(text).toContain("'+cmd");
    expect(text).toContain("'@sum");
  });
});

describe("bank + roster validation", () => {
  it("accepts sample bank", () => {
    const text = readFileSync(bankPath, "utf8");
    const res = validateBankCsv(text);
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.questions).toHaveLength(10);
  });

  it("rejects wrong count", () => {
    const text = readFileSync(bankPath, "utf8").split("\n").slice(0, 5).join("\n");
    const res = validateBankCsv(text);
    expect(res.ok).toBe(false);
  });

  it("accepts sample roster", () => {
    const res = validateRosterCsv(readFileSync(rosterPath, "utf8"));
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.students).toHaveLength(5);
  });

  it("rejects duplicate student ids", () => {
    const res = validateRosterCsv("student_name,student_id\nA,1\nB,1\n");
    expect(res.ok).toBe(false);
  });
});

describe("generate + score", () => {
  it("creates unique instance maps and scores with shuffle", () => {
    const bank = validateBankCsv(readFileSync(bankPath, "utf8"));
    const roster = validateRosterCsv(readFileSync(rosterPath, "utf8"));
    expect(bank.ok && roster.ok).toBe(true);
    if (!bank.ok || !roster.ok) return;
    const instances = generateInstances(bank.questions, roster.students, "exam-seed");
    expect(instances).toHaveLength(5);
    expect(new Set(instances.map((i) => i.instance_id)).size).toBe(5);

    const a = instances[0]!;
    const b = instances[1]!;
    // same question ids set
    expect(new Set(a.questions.map((q) => q.question_id))).toEqual(
      new Set(b.questions.map((q) => q.question_id)),
    );

    // perfect score via canonical mapping
    const answers: Record<string, "A" | "B" | "C" | "D" | ""> = {};
    for (const q of a.questions) {
      answers[q.question_id] = q.canonicalToPrint[q.correct_canonical];
    }
    const scored = scoreAnswers(a, answers);
    expect(scored.score_correct).toBe(10);
    expect(scored.score_pct).toBe(100);

    // blank = zero
    const blank = scoreAnswers(a, {});
    expect(blank.score_correct).toBe(0);
  });

  it("rng is deterministic", () => {
    const r1 = createRng("x");
    const r2 = createRng("x");
    expect([r1(), r1()]).toEqual([r2(), r2()]);
  });

  it("render substitutes numbers", () => {
    const bank = validateBankCsv(readFileSync(bankPath, "utf8"));
    if (!bank.ok) throw new Error("bank");
    const q = bank.questions[0]!;
    const rendered = renderQuestion(q, { n1: 4 });
    expect(rendered.stem).toContain("4");
  });
});
