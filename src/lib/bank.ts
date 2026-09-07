import { parseCsv, type CsvRow } from "./csv";

export type BankQuestion = {
  question_id: string;
  stem_template: string;
  ranges: Record<string, { min: number; max: number }>;
  choice_templates: { A: string; B: string; C: string; D: string };
  correct_choice: "A" | "B" | "C" | "D";
};

export type RosterStudent = {
  student_name: string;
  student_id: string;
};

export type ValidationIssue = { row?: number; message: string };

const ALLOWED_BANK_COLS = new Set([
  "question_id",
  "stem_template",
  "choice_a_template",
  "choice_b_template",
  "choice_c_template",
  "choice_d_template",
  "correct_choice",
  ...Array.from({ length: 8 }, (_, i) => `n${i + 1}_min`),
  ...Array.from({ length: 8 }, (_, i) => `n${i + 1}_max`),
]);

const PLACEHOLDER_RE = /\{n([1-8])\}/g;

export function findPlaceholders(text: string): number[] {
  const found = new Set<number>();
  for (const m of text.matchAll(PLACEHOLDER_RE)) {
    found.add(Number(m[1]));
  }
  // reject other braces
  const stripped = text.replace(PLACEHOLDER_RE, "");
  if (stripped.includes("{") || stripped.includes("}")) {
    throw new Error("Only {n1}…{n8} placeholders are allowed");
  }
  return [...found].sort((a, b) => a - b);
}

export function validateBankCsv(text: string): { ok: true; questions: BankQuestion[] } | { ok: false; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];
  let parsed;
  try {
    parsed = parseCsv(text);
  } catch (e) {
    return { ok: false, issues: [{ message: e instanceof Error ? e.message : String(e) }] };
  }

  for (const h of parsed.headers) {
    if (!ALLOWED_BANK_COLS.has(h)) {
      issues.push({ message: `Unknown bank column: ${h}` });
    }
  }
  const required = [
    "question_id",
    "stem_template",
    "choice_a_template",
    "choice_b_template",
    "choice_c_template",
    "choice_d_template",
    "correct_choice",
  ];
  for (const col of required) {
    if (!parsed.headers.includes(col)) issues.push({ message: `Missing column: ${col}` });
  }
  if (parsed.rows.length !== 10) {
    issues.push({ message: `Bank must have exactly 10 questions, got ${parsed.rows.length}` });
  }

  const ids = new Set<string>();
  const questions: BankQuestion[] = [];

  parsed.rows.forEach((row, idx) => {
    const rowNum = idx + 2;
    try {
      const q = rowToQuestion(row);
      if (ids.has(q.question_id)) {
        issues.push({ row: rowNum, message: `Duplicate question_id: ${q.question_id}` });
      }
      ids.add(q.question_id);
      assertBankInvariants(q);
      questions.push(q);
    } catch (e) {
      issues.push({ row: rowNum, message: e instanceof Error ? e.message : String(e) });
    }
  });

  if (issues.length) return { ok: false, issues };
  return { ok: true, questions };
}

function rowToQuestion(row: CsvRow): BankQuestion {
  const question_id = row.question_id?.trim();
  if (!question_id) throw new Error("question_id required");
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(question_id)) {
    throw new Error("question_id must match [A-Za-z0-9_-]{1,64}");
  }  const correct = row.correct_choice?.trim().toUpperCase();
  if (!["A", "B", "C", "D"].includes(correct ?? "")) {
    throw new Error("correct_choice must be A–D");
  }
  const stem_template = row.stem_template ?? "";
  const choice_templates = {
    A: row.choice_a_template ?? "",
    B: row.choice_b_template ?? "",
    C: row.choice_c_template ?? "",
    D: row.choice_d_template ?? "",
  };
  const used = new Set<number>([
    ...findPlaceholders(stem_template),
    ...findPlaceholders(choice_templates.A),
    ...findPlaceholders(choice_templates.B),
    ...findPlaceholders(choice_templates.C),
    ...findPlaceholders(choice_templates.D),
  ]);
  const ranges: BankQuestion["ranges"] = {};
  for (const n of used) {
    const minRaw = row[`n${n}_min`];
    const maxRaw = row[`n${n}_max`];
    if (minRaw === undefined || minRaw === "" || maxRaw === undefined || maxRaw === "") {
      throw new Error(`Missing n${n}_min/n${n}_max for placeholder {n${n}}`);
    }
    const min = Number(minRaw);
    const max = Number(maxRaw);
    if (!Number.isInteger(min) || !Number.isInteger(max) || min > max) {
      throw new Error(`Invalid range for n${n}`);
    }
    ranges[`n${n}`] = { min, max };
  }
  return {
    question_id,
    stem_template,
    ranges,
    choice_templates,
    correct_choice: correct as "A" | "B" | "C" | "D",
  };
}

function assertBankInvariants(q: BankQuestion): void {
  const keys = Object.keys(q.ranges);
  const product = keys.reduce((acc, k) => {
    const r = q.ranges[k]!;
    return acc * (r.max - r.min + 1);
  }, 1);

  const draws: Array<Record<string, number>> = [];
  if (product === 0) throw new Error("Empty range product");
  if (product <= 200) {
    enumerateRanges(q.ranges, {}, keys, 0, draws);
  } else {
    for (let i = 0; i < 32; i++) draws.push(sampleRanges(q.ranges, Math.random));
  }

  for (const vals of draws) {
    const rendered = renderQuestion(q, vals);
    const set = new Set(Object.values(rendered.choices));
    if (set.size !== 4) throw new Error(`Non-unique choices for ${q.question_id} with ${JSON.stringify(vals)}`);
    if (!["A", "B", "C", "D"].includes(q.correct_choice)) {
      throw new Error(`Invalid correct_choice for ${q.question_id}`);
    }
  }

  if (q.stem_template.length > 280) {
    // soft — still allow; PDF step may fail
  }
}

export function sampleRanges(
  ranges: BankQuestion["ranges"],
  rnd: () => number,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, r] of Object.entries(ranges)) {
    out[k] = r.min + Math.floor(rnd() * (r.max - r.min + 1));
  }
  return out;
}

function enumerateRanges(
  ranges: BankQuestion["ranges"],
  cur: Record<string, number>,
  keys: string[],
  idx: number,
  out: Array<Record<string, number>>,
): void {
  if (idx >= keys.length) {
    out.push({ ...cur });
    return;
  }
  const k = keys[idx]!;
  const r = ranges[k]!;
  for (let v = r.min; v <= r.max; v++) {
    cur[k] = v;
    enumerateRanges(ranges, cur, keys, idx + 1, out);
  }
}

export function renderTemplate(template: string, values: Record<string, number>): string {
  return template.replace(PLACEHOLDER_RE, (_, n: string) => {
    const key = `n${n}`;
    const v = values[key];
    if (v === undefined) throw new Error(`Missing value for {${key}}`);
    return String(v);
  });
}

export function renderQuestion(
  q: BankQuestion,
  values: Record<string, number>,
): { stem: string; choices: Record<"A" | "B" | "C" | "D", string> } {
  return {
    stem: renderTemplate(q.stem_template, values),
    choices: {
      A: renderTemplate(q.choice_templates.A, values),
      B: renderTemplate(q.choice_templates.B, values),
      C: renderTemplate(q.choice_templates.C, values),
      D: renderTemplate(q.choice_templates.D, values),
    },
  };
}

export function validateRosterCsv(text: string): { ok: true; students: RosterStudent[] } | { ok: false; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];
  let parsed;
  try {
    parsed = parseCsv(text);
  } catch (e) {
    return { ok: false, issues: [{ message: e instanceof Error ? e.message : String(e) }] };
  }
  for (const h of parsed.headers) {
    if (h !== "student_name" && h !== "student_id") {
      issues.push({ message: `Unknown roster column: ${h}` });
    }
  }
  if (!parsed.headers.includes("student_name") || !parsed.headers.includes("student_id")) {
    issues.push({ message: "Roster requires student_name, student_id" });
  }
  if (parsed.rows.length < 1 || parsed.rows.length > 50) {
    issues.push({ message: `Roster must have 1–50 students, got ${parsed.rows.length}` });
  }
  const ids = new Set<string>();
  const students: RosterStudent[] = [];
  parsed.rows.forEach((row, idx) => {
    const rowNum = idx + 2;
    const student_name = (row.student_name ?? "").trim();
    const student_id = (row.student_id ?? "").trim();
    if (!student_name || !student_id) {
      issues.push({ row: rowNum, message: "student_name and student_id required" });
      return;
    }
    if (ids.has(student_id)) {
      issues.push({ row: rowNum, message: `Duplicate student_id: ${student_id}` });
      return;
    }
    ids.add(student_id);
    students.push({ student_name, student_id });
  });
  if (issues.length) return { ok: false, issues };
  return { ok: true, students };
}
