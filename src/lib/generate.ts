import {
  type BankQuestion,
  renderQuestion,
  sampleRanges,
} from "./bank";
import type { RosterStudent } from "./bank";
import { randomSheetCode, SHEET_CODE_LEN } from "./sheet-code";

export type Letter = "A" | "B" | "C" | "D";

export type InstanceQuestion = {
  question_id: string;
  stem: string;
  choices: Record<Letter, string>;
  /** printed letter -> canonical letter */
  printToCanonical: Record<Letter, Letter>;
  /** canonical letter -> printed letter */
  canonicalToPrint: Record<Letter, Letter>;
  values: Record<string, number>;
  correct_canonical: Letter;
};

export type ExamInstanceMap = {
  instance_id: string;
  generation_id: string;
  student_name: string;
  student_id: string;
  /** printed order */
  questions: InstanceQuestion[];
};

function shuffle<T>(arr: T[], rnd: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export function createRng(seed: string): () => number {
  // xmur3 + mulberry32
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
  let t = a();
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateInstances(
  questions: BankQuestion[],
  students: RosterStudent[],
  examSeed: string,
  generationId: string,
  /** Prefer crypto IDs so force-regen never reuses printed QR codes. */
  newInstanceId: () => string = cryptoRandomId,
): ExamInstanceMap[] {
  if (questions.length !== 10) throw new Error("Need exactly 10 questions");
  if (!generationId) throw new Error("generationId required");
  return students.map((s, idx) => {
    // Content seed includes generationId so reshuffles differ per print run.
    // Instance IDs are NOT derived from this seed — old printed QRs must never
    // resolve to a new map after regenerate.
    const rnd = createRng(`${examSeed}:${generationId}:${s.student_id}:${idx}`);
    const instance_id = newInstanceId();
    const qOrder = shuffle(questions, rnd);
    const mapped: InstanceQuestion[] = qOrder.map((q) => {
      const values = sampleRanges(q.ranges, rnd);
      const rendered = renderQuestion(q, values);
      if (rendered.stem.length > 280) {
        throw new Error(`Stem too long for ${q.question_id} (${rendered.stem.length} > 280)`);
      }
      for (const [k, v] of Object.entries(rendered.choices)) {
        if (v.length > 100) {
          throw new Error(`Choice ${k} too long for ${q.question_id}`);
        }
      }
      const uniq = new Set(Object.values(rendered.choices));
      if (uniq.size !== 4) {
        throw new Error(`Non-unique choices after render for ${q.question_id}`);
      }
      const canonOrder: Letter[] = ["A", "B", "C", "D"];
      const printOrder = shuffle(canonOrder, rnd) as Letter[];
      const printToCanonical = {} as Record<Letter, Letter>;
      const canonicalToPrint = {} as Record<Letter, Letter>;
      const choices = {} as Record<Letter, string>;
      printOrder.forEach((canon, i) => {
        const print = canonOrder[i]!;
        choices[print] = rendered.choices[canon];
        printToCanonical[print] = canon;
        canonicalToPrint[canon] = print;
      });
      return {
        question_id: q.question_id,
        stem: rendered.stem,
        choices,
        printToCanonical,
        canonicalToPrint,
        values,
        correct_canonical: q.correct_choice,
      };
    });
    return {
      instance_id,
      generation_id: generationId,
      student_name: s.student_name,
      student_id: s.student_id,
      questions: mapped,
    };
  });
}

function cryptoRandomId(): string {
  return randomSheetCode(SHEET_CODE_LEN);
}

/** Test helper — deterministic sheet codes only for unit tests */
export function seededInstanceIdFactory(seed: string): () => string {
  const alphabet = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
  const rnd = createRng(seed);
  return () => {
    let out = "";
    for (let i = 0; i < SHEET_CODE_LEN; i++) {
      out += alphabet[Math.floor(rnd() * alphabet.length)]!;
    }
    return out;
  };
}

export function scoreAnswers(
  instance: ExamInstanceMap,
  answers: Record<string, Letter | "">,
): { score_correct: number; score_pct: number; canonical: Record<string, Letter | ""> } {
  let correct = 0;
  const canonical: Record<string, Letter | ""> = {};
  for (const q of instance.questions) {
    const printed = answers[q.question_id] ?? "";
    if (!printed) {
      canonical[q.question_id] = "";
      continue;
    }
    const canon = q.printToCanonical[printed as Letter];
    canonical[q.question_id] = canon ?? "";
    if (canon === q.correct_canonical) correct++;
  }
  return {
    score_correct: correct,
    score_pct: Math.round((correct / instance.questions.length) * 1000) / 10,
    canonical,
  };
}
