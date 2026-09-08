import { Hono } from "hono";
import { validateBankCsv, validateRosterCsv } from "./lib/bank";
import { sha256Hex, randomToken } from "./lib/crypto";
import { generateInstances, scoreAnswers, type ExamInstanceMap, type Letter } from "./lib/generate";
import { buildExamPdf } from "./lib/pdf";
import { safeFilename, zipPdfs } from "./lib/zip";
import { toCsv } from "./lib/csv";
import { getTemplate, csvDownloadResponse } from "./lib/templates";
import { examAppHtml, homeHtml, helpHtml } from "./ui";

export type Env = {
  DB: D1Database;
  ADMIN_SECRET?: string;
  APP_NAME?: string;
};

type ExamRow = {
  id: string;
  token_hash: string;
  title: string;
  revoked: number;
};

const ALLOWED_STATUS = new Set([
  "ok",
  "needs_review",
  "unreadable_qr",
  "wrong_exam",
  "duplicate_upload",
]);

const MAX_JSON_BYTES = 1_500_000;
const MAX_TITLE_LEN = 120;

const app = new Hono<{ Bindings: Env }>();

function securityHeaders(res: Response, privateRoute: boolean): void {
  res.headers.set("Referrer-Policy", "no-referrer");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set(
    "Content-Security-Policy",
    "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
  );
  if (privateRoute) {
    res.headers.set("Cache-Control", "no-store, private");
    res.headers.set("Pragma", "no-cache");
  }
}

app.use("*", async (c, next) => {
  await next();
  securityHeaders(c.res, false);
});

app.get("/", (c) => c.html(homeHtml()));
app.get("/help", (c) => c.html(helpHtml()));
app.get("/templates/:id", (c) => {
  const file = getTemplate(c.req.param("id").replace(/\.csv$/i, ""));
  if (!file) return c.json({ error: "not found" }, 404);
  return csvDownloadResponse(file.filename, file.body);
});

app.get("/e/:token/", (c) => {
  const token = c.req.param("token");
  return c.redirect(`/e/${token}`, 302);
});

app.post("/api/admin/exams", async (c) => {
  const secret = c.req.header("X-Admin-Secret") ?? "";
  const expected = c.env.ADMIN_SECRET ?? "";
  if (!expected || secret !== expected) {
    return c.json({ error: "unauthorized" }, 401);
  }
  const body = await c.req.json().catch(() => ({} as { title?: string }));
  const title = String(body.title ?? "Exam").slice(0, MAX_TITLE_LEN);
  const token = randomToken();
  const token_hash = await sha256Hex(token);
  const id = randomToken();
  await c.env.DB.prepare(
    "INSERT INTO exams (id, token_hash, title) VALUES (?, ?, ?)",
  )
    .bind(id, token_hash, title)
    .run();
  return c.json({ exam_id: id, token, path: `/e/${token}` });
});

async function loadExamByToken(db: D1Database, token: string): Promise<ExamRow | null> {
  const token_hash = await sha256Hex(token);
  const row = await db
    .prepare("SELECT id, token_hash, title, revoked FROM exams WHERE token_hash = ?")
    .bind(token_hash)
    .first<ExamRow>();
  if (!row || row.revoked) return null;
  return row;
}

async function readJsonLimited<T>(c: { req: { raw: Request } }): Promise<T> {
  const raw = await c.req.raw.clone().arrayBuffer();
  if (raw.byteLength > MAX_JSON_BYTES) {
    throw new Error(`JSON body exceeds ${MAX_JSON_BYTES} bytes`);
  }
  return JSON.parse(new TextDecoder().decode(raw)) as T;
}

function canonicalToPrintedAnswers(
  map: ExamInstanceMap,
  canonical: Record<string, string>,
): Record<string, Letter | ""> {
  const out: Record<string, Letter | ""> = {};
  for (const q of map.questions) {
    const canon = (canonical[q.question_id] ?? "").toUpperCase();
    if (canon === "A" || canon === "B" || canon === "C" || canon === "D") {
      out[q.question_id] = q.canonicalToPrint[canon] ?? "";
    } else {
      out[q.question_id] = "";
    }
  }
  return out;
}

const e = new Hono<{ Bindings: Env; Variables: { exam: ExamRow; token: string } }>();

e.use("*", async (c, next) => {
  const token = c.req.param("token");
  if (!token) return c.json({ error: "not found" }, 404);
  const exam = await loadExamByToken(c.env.DB, token);
  if (!exam) return c.json({ error: "not found" }, 404);
  c.set("exam", exam);
  c.set("token", token);
  await next();
  securityHeaders(c.res, true);
});

e.get("/", (c) => c.html(examAppHtml(c.get("token"))));
e.get("", (c) => c.html(examAppHtml(c.get("token"))));
e.get("/help", (c) => c.html(helpHtml({ backHref: `/e/${c.get("token")}` })));
e.get("/help/", (c) => c.redirect(`/e/${c.get("token")}/help`, 302));

e.post("/api/generate", async (c) => {
  const exam = c.get("exam");
  let body: { bankCsv: string; rosterCsv: string; force?: boolean };
  try {
    body = await readJsonLimited(c);
  } catch (err) {
    return c.json({ error: "bad_request", message: err instanceof Error ? err.message : String(err) }, 400);
  }
  if ((body.bankCsv?.length ?? 0) > 400_000 || (body.rosterCsv?.length ?? 0) > 100_000) {
    return c.json({ error: "payload_too_large" }, 400);
  }

  const existing = await c.env.DB
    .prepare("SELECT COUNT(*) AS n FROM instances WHERE exam_id = ?")
    .bind(exam.id)
    .first<{ n: number }>();
  if ((existing?.n ?? 0) > 0 && !body.force) {
    return c.json(
      {
        error: "already_generated",
        message:
          "Papers already exist for this exam. Regenerating deletes grades and creates NEW QR codes — already-printed sheets will no longer match. Pass force=true only after confirming, or create a new exam link.",
        instances: existing?.n ?? 0,
      },
      409,
    );
  }

  const bank = validateBankCsv(body.bankCsv ?? "");
  if (!bank.ok) return c.json({ error: "bank_invalid", issues: bank.issues }, 400);
  const roster = validateRosterCsv(body.rosterCsv ?? "");
  if (!roster.ok) return c.json({ error: "roster_invalid", issues: roster.issues }, 400);

  const generationId = randomToken();
  let instances: ExamInstanceMap[];
  try {
    instances = generateInstances(bank.questions, roster.students, exam.id, generationId);
  } catch (err) {
    return c.json({ error: "generate_failed", message: err instanceof Error ? err.message : String(err) }, 400);
  }

  // Build ALL PDFs before touching existing exam rows (atomic replace).
  const files: Array<{ name: string; bytes: Uint8Array }> = [];
  for (const inst of instances) {
    try {
      const pdf = await buildExamPdf(inst);
      files.push({ name: safeFilename(inst.student_name, inst.student_id), bytes: pdf });
    } catch (err) {
      return c.json(
        { error: "pdf_failed", message: err instanceof Error ? err.message : String(err) },
        400,
      );
    }
  }

  const stmts = [
    c.env.DB.prepare("DELETE FROM grades WHERE exam_id = ?").bind(exam.id),
    c.env.DB.prepare("DELETE FROM instances WHERE exam_id = ?").bind(exam.id),
    ...instances.map((inst) =>
      c.env.DB.prepare(
        "INSERT INTO instances (id, exam_id, student_name, student_id, map_json) VALUES (?, ?, ?, ?, ?)",
      ).bind(inst.instance_id, exam.id, inst.student_name, inst.student_id, JSON.stringify(inst)),
    ),
    c.env.DB.prepare(
      `INSERT INTO exam_payloads (exam_id, bank_json, roster_json, generated_at)
       VALUES (?, ?, ?, datetime('now'))
       ON CONFLICT(exam_id) DO UPDATE SET bank_json=excluded.bank_json, roster_json=excluded.roster_json, generated_at=excluded.generated_at`,
    ).bind(
      exam.id,
      JSON.stringify({ generation_id: generationId, questions: bank.questions }),
      JSON.stringify(roster.students),
    ),
  ];
  await c.env.DB.batch(stmts);

  const zip = zipPdfs(files);
  return new Response(zip, {
    headers: {
      "content-type": "application/zip",
      "content-disposition": 'attachment; filename="exam-sheets.zip"',
      "referrer-policy": "no-referrer",
      "cache-control": "no-store, private",
    },
  });
});

e.get("/api/instances/:id", async (c) => {
  const exam = c.get("exam");
  const id = c.req.param("id");
  const row = await c.env.DB
    .prepare("SELECT map_json FROM instances WHERE id = ? AND exam_id = ?")
    .bind(id, exam.id)
    .first<{ map_json: string }>();
  if (!row) return c.json({ error: "not found" }, 404);
  const map = JSON.parse(row.map_json) as ExamInstanceMap;
  const grade = await c.env.DB
    .prepare(
      "SELECT answers_json, score_correct, score_pct, status FROM grades WHERE instance_id = ? AND exam_id = ?",
    )
    .bind(id, exam.id)
    .first<{ answers_json: string; score_correct: number; score_pct: number; status: string }>();

  let saved_answers: Record<string, Letter | ""> | null = null;
  if (grade) {
    const canonical = JSON.parse(grade.answers_json) as Record<string, string>;
    saved_answers = canonicalToPrintedAnswers(map, canonical);
  }

  return c.json({
    instance_id: map.instance_id,
    student_name: map.student_name,
    student_id: map.student_id,
    questions: map.questions.map((q) => ({
      question_id: q.question_id,
      stem: q.stem,
      choices: q.choices,
    })),
    grade: grade
      ? {
          saved_answers,
          score_correct: grade.score_correct,
          score_pct: grade.score_pct,
          status: grade.status,
        }
      : null,
  });
});

e.post("/api/instances/:id/grade", async (c) => {
  const exam = c.get("exam");
  const id = c.req.param("id");
  let body: { answers: Record<string, string>; status?: string };
  try {
    body = await readJsonLimited(c);
  } catch (err) {
    return c.json({ error: "bad_request", message: err instanceof Error ? err.message : String(err) }, 400);
  }
  const row = await c.env.DB
    .prepare("SELECT map_json FROM instances WHERE id = ? AND exam_id = ?")
    .bind(id, exam.id)
    .first<{ map_json: string }>();
  if (!row) return c.json({ error: "not found" }, 404);
  const map = JSON.parse(row.map_json) as ExamInstanceMap;
  const answers: Record<string, Letter | ""> = {};
  for (const [k, v] of Object.entries(body.answers ?? {})) {
    const up = String(v).toUpperCase();
    answers[k] = up === "A" || up === "B" || up === "C" || up === "D" ? up : "";
  }
  const scored = scoreAnswers(map, answers);
  const status = body.status ?? "ok";
  if (!ALLOWED_STATUS.has(status)) {
    return c.json({ error: "invalid_status", allowed: [...ALLOWED_STATUS] }, 400);
  }
  await c.env.DB.prepare(
    `INSERT INTO grades (instance_id, exam_id, answers_json, score_correct, score_pct, status, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(instance_id) DO UPDATE SET
       answers_json=excluded.answers_json,
       score_correct=excluded.score_correct,
       score_pct=excluded.score_pct,
       status=excluded.status,
       updated_at=excluded.updated_at`,
  )
    .bind(id, exam.id, JSON.stringify(scored.canonical), scored.score_correct, scored.score_pct, status)
    .run();
  return c.json({
    score_correct: scored.score_correct,
    score_pct: scored.score_pct,
    status,
  });
});

e.get("/api/summary", async (c) => {
  const exam = c.get("exam");
  const instances = await c.env.DB
    .prepare("SELECT COUNT(*) AS n FROM instances WHERE exam_id = ?")
    .bind(exam.id)
    .first<{ n: number }>();
  const graded = await c.env.DB
    .prepare("SELECT COUNT(*) AS n FROM grades WHERE exam_id = ?")
    .bind(exam.id)
    .first<{ n: number }>();
  return c.json({ instances: instances?.n ?? 0, graded: graded?.n ?? 0, title: exam.title });
});

e.get("/api/instances", async (c) => {
  const exam = c.get("exam");
  const rows = await c.env.DB
    .prepare(
      "SELECT id, student_name, student_id FROM instances WHERE exam_id = ? ORDER BY student_id",
    )
    .bind(exam.id)
    .all<{ id: string; student_name: string; student_id: string }>();
  return c.json({ instances: rows.results });
});

e.get("/api/results.csv", async (c) => {
  const exam = c.get("exam");
  const instRows = await c.env.DB
    .prepare("SELECT id, student_name, student_id, map_json FROM instances WHERE exam_id = ? ORDER BY student_id")
    .bind(exam.id)
    .all<{ id: string; student_name: string; student_id: string; map_json: string }>();
  const gradeRows = await c.env.DB
    .prepare("SELECT instance_id, answers_json, score_correct, score_pct, status FROM grades WHERE exam_id = ?")
    .bind(exam.id)
    .all<{ instance_id: string; answers_json: string; score_correct: number; score_pct: number; status: string }>();
  const gradeMap = new Map(gradeRows.results.map((g) => [g.instance_id, g]));

  const qids: string[] = [];
  if (instRows.results[0]) {
    const map = JSON.parse(instRows.results[0].map_json) as {
      questions: Array<{ question_id: string }>;
    };
    qids.push(...[...new Set(map.questions.map((q) => q.question_id))].sort());
  }
  const payload = await c.env.DB
    .prepare("SELECT bank_json FROM exam_payloads WHERE exam_id = ?")
    .bind(exam.id)
    .first<{ bank_json: string }>();
  let headersQ = qids;
  if (payload) {
    const raw = JSON.parse(payload.bank_json) as
      | Array<{ question_id: string }>
      | { questions: Array<{ question_id: string }> };
    const bank = Array.isArray(raw) ? raw : raw.questions;
    if (bank?.length) headersQ = bank.map((b) => b.question_id);
  }

  const headers = [
    "student_name",
    "student_id",
    ...headersQ.map((id) => `ans_${id}`),
    "score_correct",
    "score_pct",
    "status",
  ];
  const rows = instRows.results.map((inst) => {
    const g = gradeMap.get(inst.id);
    const answers = g ? (JSON.parse(g.answers_json) as Record<string, string>) : {};
    return [
      inst.student_name,
      inst.student_id,
      ...headersQ.map((qid) => answers[qid] ?? ""),
      g?.score_correct ?? "",
      g?.score_pct ?? "",
      g?.status ?? "ungraded",
    ];
  });
  const csv = toCsv(headers, rows);
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="results.csv"',
      "referrer-policy": "no-referrer",
      "cache-control": "no-store, private",
    },
  });
});

e.post("/api/revoke", async (c) => {
  const exam = c.get("exam");
  await c.env.DB.prepare("UPDATE exams SET revoked = 1 WHERE id = ?").bind(exam.id).run();
  return c.json({ revoked: true });
});

app.route("/e/:token", e);

export default app;
