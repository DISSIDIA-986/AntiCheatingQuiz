import { Hono, type Context } from "hono";
import { validateBankCsv, validateRosterCsv } from "./lib/bank";
import { sha256Hex, randomToken } from "./lib/crypto";
import { generateInstances, scoreAnswers, type ExamInstanceMap, type Letter } from "./lib/generate";
import { buildCombinedExamPdf, buildExamPdf } from "./lib/pdf";
import { safeFilename, zipPdfs } from "./lib/zip";
import { toCsv } from "./lib/csv";
import { getTemplate, csvDownloadResponse } from "./lib/templates";
import { extractSheetLookup, randomSheetCode, sheetGradePath } from "./lib/sheet-code";
import { examAppHtml, homeHtml, helpHtml, sheetGradeHtml } from "./ui";

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
const GRADING_SESSION_COOKIE = "acq_grader";
const GRADING_SESSION_SECONDS = 12 * 60 * 60;

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
type ExamContext = Context<{ Bindings: Env; Variables: { exam: ExamRow; token: string } }>;

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

async function examWorkspaceResponse(c: ExamContext): Promise<Response> {
  const exam = c.get("exam");
  const session = randomToken();
  const tokenHash = await sha256Hex(session);
  await c.env.DB.batch([
    c.env.DB.prepare("DELETE FROM grading_sessions WHERE expires_at <= datetime('now')"),
    c.env.DB.prepare(
      "INSERT INTO grading_sessions (token_hash, exam_id, expires_at) VALUES (?, ?, datetime('now', '+12 hours'))",
    ).bind(tokenHash, exam.id),
  ]);
  const response = await c.html(examAppHtml(c.get("token")));
  const secure = new URL(c.req.url).protocol === "https:" ? "; Secure" : "";
  response.headers.append(
    "Set-Cookie",
    `${GRADING_SESSION_COOKIE}=${session}; Path=/; Max-Age=${GRADING_SESSION_SECONDS}; HttpOnly; SameSite=Strict${secure}`,
  );
  return response;
}

e.get("/", examWorkspaceResponse);
e.get("", examWorkspaceResponse);
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
  let sheetCodes: string[];
  try {
    sheetCodes = await mintUniqueSheetCodes(c.env.DB, roster.students.length);
  } catch (err) {
    return c.json({ error: "generate_failed", message: err instanceof Error ? err.message : String(err) }, 500);
  }
  let codeIdx = 0;
  let instances: ExamInstanceMap[];
  try {
    instances = generateInstances(
      bank.questions,
      roster.students,
      exam.id,
      generationId,
      () => sheetCodes[codeIdx++]!,
    );
  } catch (err) {
    return c.json({ error: "generate_failed", message: err instanceof Error ? err.message : String(err) }, 400);
  }

  const origin = new URL(c.req.url).origin;
  // Build ALL PDFs before touching existing exam rows (atomic replace).
  const files: Array<{ name: string; bytes: Uint8Array }> = [];
  for (const inst of instances) {
    try {
      const gradeUrl = `${origin}${sheetGradePath(inst.instance_id)}`;
      const pdf = await buildExamPdf(inst, { gradeUrl });
      files.push({ name: safeFilename(inst.student_name, inst.student_id, inst.instance_id), bytes: pdf });
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
        "INSERT INTO issued_instance_ids (instance_id) VALUES (?)",
      ).bind(inst.instance_id),
    ),
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

e.get("/api/exam-sheets.pdf", async (c) => {
  const exam = c.get("exam");
  try {
    const payload = await c.env.DB
      .prepare("SELECT roster_json FROM exam_payloads WHERE exam_id = ?")
      .bind(exam.id)
      .first<{ roster_json: string }>();
    if (!payload) return c.json({ error: "not_generated" }, 404);

    const rows = await c.env.DB
      .prepare("SELECT student_id, map_json FROM instances WHERE exam_id = ?")
      .bind(exam.id)
      .all<{ student_id: string; map_json: string }>();
    const byStudentId = new Map(rows.results.map((row) => [row.student_id, row.map_json]));
    const roster = JSON.parse(payload.roster_json) as Array<{ student_id: string }>;
    const instances = roster.map((student) => {
      const json = byStudentId.get(student.student_id);
      if (!json) throw new Error("Generated sheet set is incomplete");
      return JSON.parse(json) as ExamInstanceMap;
    });
    const origin = new URL(c.req.url).origin;
    const pdf = await buildCombinedExamPdf(
      instances.map((instance) => ({
        instance,
        options: { gradeUrl: `${origin}${sheetGradePath(instance.instance_id)}` },
      })),
    );
    return new Response(pdf, {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": 'attachment; filename="exam-sheets-combined.pdf"',
        "referrer-policy": "no-referrer",
        "cache-control": "no-store, private",
      },
    });
  } catch (err) {
    return c.json(
      { error: "pdf_failed", message: "Could not build the combined PDF from the generated sheets." },
      500,
    );
  }
});

e.get("/api/instances/:id", async (c) => {
  const exam = c.get("exam");
  const id = extractSheetLookup(c.req.param("id"));
  const payload = await loadGradePayload(c.env.DB, id, exam.id);
  if (!payload) return c.json({ error: "not found" }, 404);
  return c.json(payload);
});

e.post("/api/instances/:id/grade", async (c) => {
  const exam = c.get("exam");
  const id = extractSheetLookup(c.req.param("id"));
  let body: { answers: Record<string, string>; status?: string; regrade?: boolean };
  try {
    body = await readJsonLimited(c);
  } catch (err) {
    return c.json({ error: "bad_request", message: err instanceof Error ? err.message : String(err) }, 400);
  }
  const result = await saveGrade(c.env.DB, id, exam.id, body);
  if (!result.ok) {
    return c.json({ error: result.error, ...(result.extra ?? {}) }, result.status);
  }
  return c.json(result.body);
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
  await c.env.DB.batch([
    c.env.DB.prepare("UPDATE exams SET revoked = 1 WHERE id = ?").bind(exam.id),
    c.env.DB.prepare("DELETE FROM grading_sessions WHERE exam_id = ?").bind(exam.id),
  ]);
  return c.json({ revoked: true });
});

app.route("/e/:token", e);

function readCookie(request: Request, name: string): string {
  const cookies = request.headers.get("Cookie") ?? "";
  for (const part of cookies.split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) return decodeURIComponent(value.join("="));
  }
  return "";
}

async function isAuthorizedGrader(db: D1Database, request: Request, examId: string): Promise<boolean> {
  const token = readCookie(request, GRADING_SESSION_COOKIE);
  if (!token) return false;
  const tokenHash = await sha256Hex(token);
  const session = await db
    .prepare(
      `SELECT 1 AS ok
       FROM grading_sessions s
       JOIN exams e ON e.id = s.exam_id
       WHERE s.token_hash = ? AND s.exam_id = ?
         AND s.expires_at > datetime('now') AND e.revoked = 0`,
    )
    .bind(tokenHash, examId)
    .first<{ ok: number }>();
  return Boolean(session);
}

function gradingUnauthorized(c: { json: (body: object, status: 401) => Response }): Response {
  const response = c.json(
    {
      error: "instructor_authorization_required",
      message: "Open this exam's private instructor link on this device, then scan the sheet again.",
    },
    401,
  );
  securityHeaders(response, true);
  return response;
}

/** Phone-friendly single-sheet grading — QR opens this page after instructor login. */
app.get("/s/:code", async (c) => {
  const code = extractSheetLookup(c.req.param("code"));
  const row = await c.env.DB
    .prepare("SELECT id, exam_id FROM instances WHERE id = ?")
    .bind(code)
    .first<{ id: string; exam_id: string }>();
  if (!row) {
    const res = c.html(
      `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Sheet not found</title></head><body style="font-family:system-ui;padding:1.5rem;max-width:28rem"><h1>Sheet not found</h1><p>This QR may be from an old printout that was regenerated, or the code was mistyped.</p></body></html>`,
      404,
    );
    securityHeaders(res, true);
    return res;
  }
  if (!(await isAuthorizedGrader(c.env.DB, c.req.raw, row.exam_id))) {
    const res = c.html(
      `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><meta name="referrer" content="no-referrer"/><title>Instructor sign-in required</title></head><body style="font-family:system-ui;padding:1.5rem;max-width:28rem"><h1>Instructor sign-in required</h1><p>This sheet does not contain access to grades.</p><p>Open this exam’s private instructor link on this device, then scan the sheet again.</p></body></html>`,
      401,
    );
    securityHeaders(res, true);
    return res;
  }
  const res = c.html(sheetGradeHtml(row.id));
  securityHeaders(res, true);
  return res;
});

app.get("/s/:code/api", async (c) => {
  const code = extractSheetLookup(c.req.param("code"));
  const row = await c.env.DB
    .prepare("SELECT exam_id FROM instances WHERE id = ?")
    .bind(code)
    .first<{ exam_id: string }>();
  if (!row) return c.json({ error: "not found" }, 404);
  if (!(await isAuthorizedGrader(c.env.DB, c.req.raw, row.exam_id))) return gradingUnauthorized(c);
  const payload = await loadGradePayload(c.env.DB, code, row.exam_id);
  if (!payload) return c.json({ error: "not found" }, 404);
  const res = c.json(payload);
  securityHeaders(res, true);
  return res;
});

app.post("/s/:code/api/grade", async (c) => {
  const code = extractSheetLookup(c.req.param("code"));
  let body: { answers: Record<string, string>; status?: string; regrade?: boolean };
  try {
    body = await readJsonLimited(c);
  } catch (err) {
    return c.json({ error: "bad_request", message: err instanceof Error ? err.message : String(err) }, 400);
  }
  const row = await c.env.DB
    .prepare("SELECT id, exam_id FROM instances WHERE id = ?")
    .bind(code)
    .first<{ id: string; exam_id: string }>();
  if (!row) return c.json({ error: "not found" }, 404);
  if (!(await isAuthorizedGrader(c.env.DB, c.req.raw, row.exam_id))) return gradingUnauthorized(c);
  const result = await saveGrade(c.env.DB, row.id, row.exam_id, body);
  if (!result.ok) {
    return c.json({ error: result.error, ...(result.extra ?? {}) }, result.status);
  }
  const res = c.json(result.body);
  securityHeaders(res, true);
  return res;
});

async function mintUniqueSheetCodes(db: D1Database, count: number): Promise<string[]> {
  const codes: string[] = [];
  const used = new Set<string>();
  let attempts = 0;
  const maxAttempts = count * 40 + 40;
  while (codes.length < count && attempts < maxAttempts) {
    attempts++;
    const id = randomSheetCode();
    if (used.has(id)) continue;
    const exists = await db
      .prepare("SELECT 1 AS n FROM issued_instance_ids WHERE instance_id = ?")
      .bind(id)
      .first();
    if (exists) continue;
    used.add(id);
    codes.push(id);
  }
  if (codes.length < count) {
    throw new Error("Could not allocate unique sheet codes");
  }
  return codes;
}

async function loadGradePayload(db: D1Database, id: string, examId?: string) {
  const row = examId
    ? await db
        .prepare("SELECT map_json, exam_id FROM instances WHERE id = ? AND exam_id = ?")
        .bind(id, examId)
        .first<{ map_json: string; exam_id: string }>()
    : await db
        .prepare("SELECT map_json, exam_id FROM instances WHERE id = ?")
        .bind(id)
        .first<{ map_json: string; exam_id: string }>();
  if (!row) return null;
  const map = JSON.parse(row.map_json) as ExamInstanceMap;
  const grade = await db
    .prepare(
      "SELECT answers_json, score_correct, score_pct, status FROM grades WHERE instance_id = ? AND exam_id = ?",
    )
    .bind(id, row.exam_id)
    .first<{ answers_json: string; score_correct: number; score_pct: number; status: string }>();

  let saved_answers: Record<string, Letter | ""> | null = null;
  if (grade) {
    const canonical = JSON.parse(grade.answers_json) as Record<string, string>;
    saved_answers = canonicalToPrintedAnswers(map, canonical);
  }

  return {
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
  };
}

async function saveGrade(
  db: D1Database,
  id: string,
  examId: string,
  body: { answers: Record<string, string>; status?: string; regrade?: boolean },
): Promise<
  | { ok: true; body: { score_correct: number; score_pct: number; status: string } }
  | { ok: false; error: string; status: 400 | 404 | 409; extra?: Record<string, unknown> }
> {
  const row = await db
    .prepare("SELECT map_json FROM instances WHERE id = ? AND exam_id = ?")
    .bind(id, examId)
    .first<{ map_json: string }>();
  if (!row) return { ok: false, error: "not found", status: 404 };
  const map = JSON.parse(row.map_json) as ExamInstanceMap;
  const answers: Record<string, Letter | ""> = {};
  for (const [k, v] of Object.entries(body.answers ?? {})) {
    const up = String(v).toUpperCase();
    answers[k] = up === "A" || up === "B" || up === "C" || up === "D" ? up : "";
  }
  const scored = scoreAnswers(map, answers);
  const status = body.status ?? "ok";
  if (!ALLOWED_STATUS.has(status)) {
    return { ok: false, error: "invalid_status", status: 400, extra: { allowed: [...ALLOWED_STATUS] } };
  }
  const values = [
    id,
    examId,
    JSON.stringify(scored.canonical),
    scored.score_correct,
    scored.score_pct,
    status,
  ] as const;
  if (body.regrade === true) {
    await db
      .prepare(
        `INSERT INTO grades (instance_id, exam_id, answers_json, score_correct, score_pct, status, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
         ON CONFLICT(instance_id) DO UPDATE SET
           answers_json=excluded.answers_json,
           score_correct=excluded.score_correct,
           score_pct=excluded.score_pct,
           status=excluded.status,
           updated_at=excluded.updated_at`,
      )
      .bind(...values)
      .run();
  } else {
    const inserted = await db
      .prepare(
        `INSERT INTO grades (instance_id, exam_id, answers_json, score_correct, score_pct, status, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
         ON CONFLICT(instance_id) DO NOTHING`,
      )
      .bind(...values)
      .run();
    if ((inserted.meta.changes ?? 0) === 0) {
      return {
        ok: false,
        error: "regrade_confirmation_required",
        status: 409,
        extra: { message: "This sheet already has a grade. Confirm regrade to overwrite it." },
      };
    }
  }
  return {
    ok: true,
    body: {
      score_correct: scored.score_correct,
      score_pct: scored.score_pct,
      status,
    },
  };
}

export default app;
