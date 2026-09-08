export function examAppHtml(token: string): string {
  const t = JSON.stringify(token);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="referrer" content="no-referrer" />
  <title>AntiCheatingQuiz</title>
  <style>
    :root {
      --bg: #f3efe6;
      --ink: #1c2430;
      --accent: #0f5c4c;
      --card: #fffdf8;
      --line: #d5cbb8;
      --warn: #8a3b12;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Source Serif 4", "Iowan Old Style", "Palatino Linotype", Palatino, serif;
      color: var(--ink);
      background:
        radial-gradient(1200px 500px at 10% -10%, #e7f0ea 0%, transparent 55%),
        linear-gradient(180deg, #f7f2e8 0%, var(--bg) 40%, #ebe4d6 100%);
      min-height: 100vh;
    }
    header {
      padding: 2rem 1.25rem 1rem;
      max-width: 920px;
      margin: 0 auto;
    }
    h1 {
      font-family: "Freight Sans", "Avenir Next", "Segoe UI", sans-serif;
      letter-spacing: -0.03em;
      font-size: clamp(1.8rem, 4vw, 2.6rem);
      margin: 0 0 0.35rem;
      color: var(--accent);
    }
    .sub { opacity: 0.8; max-width: 40rem; line-height: 1.45; }
    main {
      max-width: 920px;
      margin: 0 auto;
      padding: 0 1.25rem 3rem;
      display: grid;
      gap: 1.25rem;
    }
    section {
      background: var(--card);
      border: 1px solid var(--line);
      border-radius: 2px;
      padding: 1.1rem 1.2rem 1.25rem;
    }
    h2 {
      font-family: "Avenir Next", "Segoe UI", sans-serif;
      font-size: 1.05rem;
      margin: 0 0 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #355;
    }
    label { display: block; font-size: 0.92rem; margin: 0.55rem 0 0.25rem; }
    input[type=file], input[type=text] {
      width: 100%;
      max-width: 100%;
    }
    button {
      margin-top: 0.85rem;
      background: var(--accent);
      color: #f7fff9;
      border: 0;
      padding: 0.65rem 1rem;
      font: 600 0.95rem/1 "Avenir Next", "Segoe UI", sans-serif;
      cursor: pointer;
    }
    button.secondary { background: #2c3a4a; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    .msg { margin-top: 0.75rem; white-space: pre-wrap; font-family: ui-monospace, Menlo, monospace; font-size: 0.82rem; }
    .err { color: var(--warn); }
    .ok { color: var(--accent); }
    table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
    th, td { border-bottom: 1px solid var(--line); padding: 0.4rem 0.3rem; text-align: left; }
    .q { margin: 0.75rem 0; padding-bottom: 0.5rem; border-bottom: 1px dashed var(--line); }
    .bubbles label { display: inline-flex; align-items: center; gap: 0.25rem; margin-right: 0.85rem; font-family: "Avenir Next", sans-serif; }
    .nav { margin-top: 0.75rem; font-family: "Avenir Next", "Segoe UI", sans-serif; font-size: 0.95rem; }
    .nav a { color: var(--accent); margin-right: 1rem; }
    .downloads {
      margin: 0.75rem 0 0;
      padding: 0.75rem 0.85rem;
      background: #f7faf8;
      border: 1px dashed var(--line);
      font-family: "Avenir Next", "Segoe UI", sans-serif;
      font-size: 0.9rem;
    }
    .downloads strong { display: block; margin-bottom: 0.35rem; color: #355; font-size: 0.8rem; letter-spacing: 0.04em; text-transform: uppercase; }
    .downloads a { color: var(--accent); margin-right: 0.85rem; display: inline-block; margin-top: 0.25rem; }
    .warn-banner {
      margin: 0.85rem 0 0;
      padding: 0.65rem 0.8rem;
      background: #fef3f2;
      border: 1px solid #fecdca;
      color: #912018;
      font-family: "Avenir Next", "Segoe UI", sans-serif;
      font-size: 0.88rem;
      max-width: 40rem;
      line-height: 1.4;
    }
    label.check { display: flex; align-items: center; gap: 0.45rem; margin-top: 0.75rem; font-family: "Avenir Next", "Segoe UI", sans-serif; font-size: 0.9rem; }
    label.check input { width: auto; }
    .print-steps {
      margin: 0.85rem 0 0;
      padding-left: 1.25rem;
      font-family: "Avenir Next", "Segoe UI", sans-serif;
      font-size: 0.9rem;
      line-height: 1.45;
      color: #2c3a4a;
    }
    .print-steps li { margin: 0.35rem 0; }
  </style>
</head>
<body>
  <header>
    <h1>AntiCheatingQuiz</h1>
    <p class="sub">Create personalized paper exams, print them, then grade with your phone. Prototype — not a Scantron replacement.</p>
    <p class="warn-banner"><strong>Privacy:</strong> Anyone with this secret link can view student names/IDs, change grades, and download results. Use sample/fake data unless you accept that risk. Do not post the link publicly.</p>
    <p class="nav"><a href="/e/${token}/help">How to use (Help)</a></p>
  </header>
  <main>
    <section>
      <h2>1. Create &amp; print exam sheets</h2>
      <p class="sub">This is the paper exam step: the app builds <strong>one PDF per student</strong>. You download a zip, open each PDF (or all of them), and print on Letter paper from your computer.</p>
      <div class="downloads">
        <strong>Download CSV files first (keeps columns correct)</strong>
        <a href="/templates/question-bank-template.csv">Question bank template</a>
        <a href="/templates/question-bank-sample.csv">Question bank sample</a>
        <a href="/templates/student-list-template.csv">Student list template</a>
        <a href="/templates/student-list-sample.csv">Student list sample</a>
      </div>
      <label>Question bank CSV (exactly 10 MCQs)</label>
      <input id="bank" type="file" accept=".csv,text/csv" />
      <label>Student roster CSV</label>
      <input id="roster" type="file" accept=".csv,text/csv" />
      <label class="check"><input id="forceGen" type="checkbox" /> Replace existing papers (deletes prior grades)</label>
      <button id="btnGen">Create exam sheets (download ZIP)</button>
      <ol class="print-steps">
        <li>Click the button above → a zip file downloads (one PDF per student, named by ID).</li>
        <li>Unzip the file on your computer.</li>
        <li>Open a PDF → <strong>File → Print</strong> (or Cmd/Ctrl+P).</li>
        <li>Paper size: <strong>Letter</strong>, single-sided, actual size (100%, no “fit to page” if you can avoid it).</li>
        <li>Print every student’s sheet and hand each person <em>their</em> named copy.</li>
      </ol>
      <div id="genMsg" class="msg"></div>
    </section>
    <section>
      <h2>2. Grade (QR + manual)</h2>
      <p class="sub">Upload a photo of a sheet. The browser reads the QR locally; you confirm answers. Auto ink-reading is not required for this prototype.</p>
      <label>Sheet photo</label>
      <input id="photo" type="file" accept="image/*" capture="environment" />
      <button id="btnDecode" class="secondary">Read QR from photo</button>
      <label>Or paste instance id from QR</label>
      <input id="instanceId" type="text" placeholder="32-char hex from QR" />
      <button id="btnLoad">Load instance</button>
      <div id="gradeBox"></div>
      <div id="gradeMsg" class="msg"></div>
    </section>
    <section>
      <h2>3. Results</h2>
      <button id="btnCsv" class="secondary">Download class CSV</button>
      <div id="csvMsg" class="msg"></div>
      <div id="summary"></div>
    </section>
  </main>
  <script>
    const TOKEN = ${t};
    const base = location.origin + "/e/" + TOKEN;

    async function readFile(input) {
      const f = input.files && input.files[0];
      if (!f) throw new Error("Choose a file first");
      return await f.text();
    }

    function setMsg(el, text, ok) {
      el.textContent = text;
      el.className = "msg " + (ok ? "ok" : "err");
    }

    document.getElementById("btnGen").onclick = async () => {
      const msg = document.getElementById("genMsg");
      try {
        const bank = await readFile(document.getElementById("bank"));
        const roster = await readFile(document.getElementById("roster"));
        const force = document.getElementById("forceGen").checked;
        const res = await fetch(base + "/api/generate", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ bankCsv: bank, rosterCsv: roster, force }),
        });
        if (!res.ok) {
          const err = await res.json().catch(async () => ({ error: await res.text() }));
          if (res.status === 409 && err.error === "already_generated") {
            throw new Error(
              "Papers already exist. Tick “Replace existing papers” only if you really want to delete grades, then try again.\\n\\n" +
                JSON.stringify(err, null, 2),
            );
          }
          throw new Error(JSON.stringify(err, null, 2));
        }
        const blob = await res.blob();
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "exam-sheets.zip";
        a.click();
        setMsg(msg, "ZIP downloaded. Unzip → open each PDF → File → Print (Letter, single-sided). Hand each student their named sheet.", true);
        refreshSummary();
      } catch (e) {
        setMsg(msg, String(e.message || e), false);
      }
    };

    async function loadInstance(id) {
      const msg = document.getElementById("gradeMsg");
      const box = document.getElementById("gradeBox");
      box.innerHTML = "";
      const res = await fetch(base + "/api/instances/" + encodeURIComponent(id));
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const saved = (data.grade && data.grade.saved_answers) || {};
      const h = document.createElement("div");
      h.innerHTML = "<strong>" + escapeHtml(data.student_name) + "</strong> · " + escapeHtml(data.student_id);
      if (data.grade) {
        h.innerHTML += " · prior score " + data.grade.score_correct + "/10";
      }
      box.appendChild(h);
      data.questions.forEach((q, i) => {
        const div = document.createElement("div");
        div.className = "q";
        div.innerHTML = "<div><strong>" + (i+1) + ".</strong> " + escapeHtml(q.stem) + "</div>";
        const bub = document.createElement("div");
        bub.className = "bubbles";
        const current = saved[q.question_id] ?? "";
        ["A","B","C","D",""].forEach((L) => {
          const lab = document.createElement("label");
          const inp = document.createElement("input");
          inp.type = "radio";
          inp.name = "q_" + q.question_id;
          inp.value = L;
          inp.dataset.qid = q.question_id;
          if (L === current) inp.checked = true;
          lab.appendChild(inp);
          lab.appendChild(document.createTextNode(L === "" ? "blank" : L + ") " + q.choices[L]));
          bub.appendChild(lab);
        });
        div.appendChild(bub);
        box.appendChild(div);
      });
      const save = document.createElement("button");
      save.textContent = "Save grade";
      const confirmLab = document.createElement("label");
      confirmLab.className = "check";
      confirmLab.innerHTML = '<input id="confirmChecked" type="checkbox" /> I checked this sheet against the paper';
      box.appendChild(confirmLab);
      save.onclick = async () => {
        try {
          const answers = {};
          let blank = 0;
          data.questions.forEach((q) => {
            const sel = box.querySelector('input[data-qid="' + CSS.escape(q.question_id) + '"]:checked');
            const v = sel ? sel.value : "";
            answers[q.question_id] = v;
            if (!v) blank++;
          });
          if (!document.getElementById("confirmChecked").checked) {
            throw new Error("Tick “I checked this sheet against the paper” before saving.");
          }
          let status = "ok";
          if (blank > 0) {
            const proceed = window.confirm(
              blank + " question(s) are blank (score as wrong). Save as needs_review?\\n\\nOK = needs_review, Cancel = abort",
            );
            if (!proceed) return;
            status = "needs_review";
          }
          const r = await fetch(base + "/api/instances/" + encodeURIComponent(id) + "/grade", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ answers, status }),
          });
          if (!r.ok) throw new Error(await r.text());
          const out = await r.json();
          setMsg(msg, "Saved (" + status + "). Score " + out.score_correct + "/10 (" + out.score_pct + "%)", true);
          refreshSummary();
        } catch (e) {
          setMsg(msg, String(e.message || e), false);
        }
      };
      box.appendChild(save);
      setMsg(msg, data.grade ? "Instance loaded with prior answers. Edit and save." : "Instance loaded. Select bubbles and save.", true);
    }

    document.getElementById("btnLoad").onclick = async () => {
      try {
        const id = document.getElementById("instanceId").value.trim();
        if (!id) throw new Error("Enter instance id");
        await loadInstance(id);
      } catch (e) {
        setMsg(document.getElementById("gradeMsg"), String(e.message || e), false);
      }
    };

    document.getElementById("btnDecode").onclick = async () => {
      const msg = document.getElementById("gradeMsg");
      try {
        const f = document.getElementById("photo").files[0];
        if (!f) throw new Error("Choose a photo");
        const bmp = await createImageBitmap(f);
        let data = null;
        if ("BarcodeDetector" in window) {
          const detector = new BarcodeDetector({ formats: ["qr_code"] });
          const codes = await detector.detect(bmp);
          if (codes[0] && codes[0].rawValue) data = codes[0].rawValue.trim();
        }
        if (!data) {
          throw new Error("Could not read QR in-browser (try Chrome/Edge, better light, or paste the instance id from any QR app).");
        }
        document.getElementById("instanceId").value = data;
        await loadInstance(data);
      } catch (e) {
        setMsg(msg, String(e.message || e), false);
      }
    };

    document.getElementById("btnCsv").onclick = async () => {
      const msg = document.getElementById("csvMsg");
      try {
        const res = await fetch(base + "/api/results.csv");
        if (!res.ok) throw new Error(await res.text());
        const blob = await res.blob();
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "results.csv";
        a.click();
        setMsg(msg, "CSV downloaded.", true);
      } catch (e) {
        setMsg(msg, String(e.message || e), false);
      }
    };

    async function refreshSummary() {
      const el = document.getElementById("summary");
      try {
        const res = await fetch(base + "/api/summary");
        if (!res.ok) return;
        const data = await res.json();
        el.innerHTML = "<p>Instances: " + data.instances + " · Graded: " + data.graded + "</p>";
      } catch {}
    }

    function escapeHtml(s) {
      return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }
    refreshSummary();
  </script>
</body>
</html>`;
}

export function homeHtml(): string {
  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<meta name="referrer" content="no-referrer"/>
<title>AntiCheatingQuiz</title>
<style>
body{font-family:Georgia,serif;background:#f3efe6;color:#1c2430;padding:2rem;max-width:40rem;margin:auto;line-height:1.45}
h1{color:#0f5c4c;font-family:system-ui,sans-serif}
a{color:#0f5c4c}
code{background:#fff;padding:0.1rem 0.3rem}
</style></head>
<body>
<h1>AntiCheatingQuiz</h1>
<p>Private exam pages use a secret link your helper sends you (it looks like <code>/e/…</code>).</p>
<p><a href="/help">How to use — Help page</a></p>
</body></html>`;
}

/** Plain-language help for non-technical instructors . */
export function helpHtml(opts: { backHref?: string } = {}): string {
  const back = opts.backHref
    ? `<p class="nav"><a href="${opts.backHref}">← Back to exam workspace</a></p>`
    : `<p class="nav"><a href="/">← Home</a></p>`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="referrer" content="no-referrer" />
  <title>Help — AntiCheatingQuiz</title>
  <style>
    :root {
      --bg: #f3efe6;
      --ink: #1c2430;
      --accent: #0f5c4c;
      --card: #fffdf8;
      --line: #d5cbb8;
      --k-red: #b42318;
      --k-orange: #b54708;
      --k-yellow: #8a6d00;
      --k-green: #067647;
      --k-cyan: #0e7490;
      --k-blue: #175cd3;
      --k-purple: #6941c6;
      --bg-red: #fef3f2;
      --bg-orange: #fff6ed;
      --bg-yellow: #fefbe8;
      --bg-green: #ecfdf3;
      --bg-cyan: #ecfeff;
      --bg-blue: #eff8ff;
      --bg-purple: #f4f3ff;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif;
      color: var(--ink);
      background: linear-gradient(180deg, #f7f2e8 0%, var(--bg) 50%, #ebe4d6 100%);
      min-height: 100vh;
      line-height: 1.5;
    }
    main {
      max-width: 40rem;
      margin: 0 auto;
      padding: 2rem 1.25rem 3rem;
    }
    h1 {
      font-family: "Avenir Next", "Segoe UI", sans-serif;
      color: var(--accent);
      letter-spacing: -0.02em;
      font-size: 1.85rem;
      margin: 0 0 0.4rem;
    }
    .lead { opacity: 0.85; margin: 0 0 1rem; }
    .legend {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem 0.65rem;
      font-family: "Avenir Next", "Segoe UI", sans-serif;
      font-size: 0.78rem;
      margin: 0 0 1.35rem;
    }
    .legend span { white-space: nowrap; }
    .nav { font-family: "Avenir Next", "Segoe UI", sans-serif; margin-bottom: 1.5rem; }
    .nav a { color: var(--accent); }
    section {
      background: var(--card);
      border: 1px solid var(--line);
      border-left-width: 4px;
      padding: 1rem 1.15rem 1.1rem;
      margin-bottom: 1rem;
    }
    section.s-what { border-left-color: var(--k-purple); }
    section.s-prep { border-left-color: var(--k-orange); }
    section.s-create { border-left-color: var(--k-green); }
    section.s-exam { border-left-color: var(--k-cyan); }
    section.s-grade { border-left-color: var(--k-blue); }
    section.s-results { border-left-color: var(--k-yellow); }
    section.s-trouble { border-left-color: var(--k-red); }
    section.s-remember { border-left-color: var(--k-red); }
    h2 {
      font-family: "Avenir Next", "Segoe UI", sans-serif;
      font-size: 0.95rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin: 0 0 0.55rem;
    }
    .s-what h2 { color: var(--k-purple); }
    .s-prep h2 { color: var(--k-orange); }
    .s-create h2 { color: var(--k-green); }
    .s-exam h2 { color: var(--k-cyan); }
    .s-grade h2 { color: var(--k-blue); }
    .s-results h2 { color: var(--k-yellow); }
    .s-trouble h2, .s-remember h2 { color: var(--k-red); }
    ul { margin: 0.35rem 0 0; padding-left: 1.2rem; }
    li { margin: 0.4rem 0; }
    .note { font-size: 0.95rem; opacity: 0.85; margin-top: 0.6rem; }
    code {
      font-family: ui-monospace, Menlo, monospace;
      font-size: 0.88em;
      background: #fff;
      padding: 0.05rem 0.25rem;
      border: 1px solid var(--line);
    }
    k {
      font-family: "Avenir Next", "Segoe UI", sans-serif;
      font-style: normal;
      font-weight: 700;
      font-size: 0.92em;
      padding: 0.08rem 0.32rem;
      border-radius: 3px;
      white-space: nowrap;
    }
    .kr { color: var(--k-red); background: var(--bg-red); }
    .ko { color: var(--k-orange); background: var(--bg-orange); }
    .ky { color: var(--k-yellow); background: var(--bg-yellow); }
    .kg { color: var(--k-green); background: var(--bg-green); }
    .kc { color: var(--k-cyan); background: var(--bg-cyan); }
    .kb { color: var(--k-blue); background: var(--bg-blue); }
    .kp { color: var(--k-purple); background: var(--bg-purple); }
    .dl-box {
      margin: 0.75rem 0 0;
      padding: 0.7rem 0.8rem;
      background: #f7faf8;
      border: 1px dashed var(--line);
      font-family: "Avenir Next", "Segoe UI", sans-serif;
      font-size: 0.9rem;
      display: flex;
      flex-wrap: wrap;
      gap: 0.45rem 0.9rem;
    }
    .dl-box a {
      text-decoration: underline;
      text-underline-offset: 2px;
      padding: 0.08rem 0.32rem;
      border-radius: 3px;
      font-weight: 700;
    }
  </style>
</head>
<body>
<main>
  <h1>How to use</h1>
  <p class="lead">Short guide for running one class exam. No programming needed — upload two spreadsheets, create printable PDFs, print on paper, then enter answers.</p>
  <section class="s-create" style="margin-bottom:1rem">
    <h2>Quick answer — how do I create and print each student’s sheet?</h2>
    <ul>
      <li>Upload your <k class="ko">question bank</k> and <k class="ko">student list</k> CSVs.</li>
      <li>Click <k class="kg">Create exam sheets (download ZIP)</k>.</li>
      <li>Unzip the download — you get <k class="kg">one PDF per student</k> (name + ID on the page, plus a QR code).</li>
      <li>Open each PDF on your computer and use <k class="ky">File → Print</k> (Letter, single-sided).</li>
      <li>Hand each student <k class="kc">their own named sheet</k> in the exam room.</li>
    </ul>
    <p class="note">There is no special printer driver. Any normal office/home printer that can print a PDF is fine.</p>
  </section>
  <p class="legend" aria-label="Colour key">
    <span class="kr">Red = caution</span>
    <span class="ko">Orange = prepare files</span>
    <span class="ky">Yellow = print / results</span>
    <span class="kg">Green = generate</span>
    <span class="kc">Cyan = exam day</span>
    <span class="kb">Blue = grade</span>
    <span class="kp">Purple = big idea</span>
  </p>
  ${back}

  <section class="s-what">
    <h2>What this does</h2>
    <ul>
      <li>Gives <k class="kp">each student a different paper</k> (same 10 questions, but <k class="kp">numbers</k>, <k class="kp">order</k>, and <k class="kp">A–D</k> positions change).</li>
      <li>Makes “bathroom Instagram answer keys” less useful — “Q3 is B” is not the same for everyone.</li>
      <li>Lets you <k class="ky">print</k> the sheets, collect them, then <k class="kb">enter marks</k> and download a <k class="ky">results CSV</k> for Excel.</li>
    </ul>
  </section>

  <section class="s-prep">
    <h2>Before the exam — prepare two files</h2>
    <ul>
      <li><k class="ko">Question bank</k> — Excel/Sheets export as <k class="ko">CSV</k>. Exactly <k class="ko">10</k> multiple-choice questions.</li>
      <li><k class="ko">Student list</k> — CSV with two columns: <code>student_name</code> and <code>student_id</code>.</li>
      <li>Download the files below so column names stay exact (avoids upload errors).</li>
      <li>Put changeable numbers as <code>{n1}</code>, <code>{n2}</code> — the app fills random numbers per student.</li>
    </ul>
    <p class="dl-box">
      <a class="ko" href="/templates/question-bank-template.csv">Question bank template</a>
      <a class="kg" href="/templates/question-bank-sample.csv">Question bank sample (try first)</a>
      <a class="ko" href="/templates/student-list-template.csv">Student list template</a>
      <a class="kg" href="/templates/student-list-sample.csv">Student list sample</a>
    </p>
    <p class="note"><k class="ko">Template</k> = edit with your own content. <k class="kg">Sample</k> = ready to click Generate and see how it works.</p>
    <p class="note">If Excel complains when you open a CSV, that is normal. Save again as CSV UTF-8 if asked. Do not rename the header row.</p>
  </section>

  <section class="s-create">
    <h2>Step 1 — Create &amp; print the papers</h2>
    <ul>
      <li>Open the <k class="kr">secret exam link</k> you were sent (bookmark it; do not post it publicly).</li>
      <li>Under <k class="kg">Create &amp; print exam sheets</k>, choose your question bank, then your student list.</li>
      <li>Click <k class="kg">Create exam sheets (download ZIP)</k>.</li>
      <li>Unzip → open each PDF → <k class="ky">File → Print</k>.</li>
      <li>Settings: <k class="ky">Letter</k>, single-sided, 100% scale if possible. Keep the <k class="kb">QR code</k> visible and uncut.</li>
      <li>Print every student’s sheet and hand out the matching named copy in class.</li>
    </ul>
  </section>

  <section class="s-exam">
    <h2>Step 2 — Run the exam</h2>
    <ul>
      <li>Hand each student <k class="kc">their named sheet</k> (check the name at the top).</li>
      <li>Students fill <k class="kc">one bubble</k> per question (A, B, C, or D).</li>
      <li><k class="kc">Collect all sheets</k> at the end.</li>
    </ul>
  </section>

  <section class="s-grade">
    <h2>Step 3 — Grade</h2>
    <ul>
      <li>On the same web page, go to <k class="kb">Grade</k>.</li>
      <li><k class="kb">Easiest:</k> scan the sheet’s <k class="kb">QR code</k> with any phone QR app, paste into <k class="kb">Or paste instance id</k>, then <k class="kb">Load instance</k>.</li>
      <li>On some phones (Chrome/Edge), upload a photo and click <k class="kb">Read QR from photo</k>.</li>
      <li>Tap the answers they bubbled (or leave blank).</li>
      <li>Click <k class="kb">Save grade</k>. Repeat for each sheet.</li>
      <li>If you reopen a student, previous answers stay — fix one question without wiping the rest.</li>
    </ul>
  </section>

  <section class="s-results">
    <h2>Step 4 — Download results</h2>
    <ul>
      <li>Click <k class="ky">Download class CSV</k>.</li>
      <li>Open in <k class="ky">Excel</k> or Google Sheets.</li>
      <li>You will see each student’s name, ID, answers, and <k class="ky">score</k>.</li>
    </ul>
  </section>

  <section class="s-trouble">
    <h2>If something goes wrong</h2>
    <ul>
      <li><k class="kr">“Bank invalid”</k> — need exactly 10 questions; column names must match the sample.</li>
      <li><k class="kr">“Roster invalid”</k> — every row needs a name and a unique student ID; max about 50 students.</li>
      <li><k class="kr">“Shorten question text”</k> — too long for one page; shorten and generate again.</li>
      <li><k class="kr">QR not reading</k> — better light, or paste the code from any QR scanner app.</li>
      <li><k class="kr">Lost the secret link</k> — ask your helper for a new link; do not share the old one widely.</li>
    </ul>
  </section>

  <section class="s-remember">
    <h2>Please remember</h2>
    <ul>
      <li>This is a <k class="kr">prototype</k> — double-check marks before official grades.</li>
      <li>Do not put <k class="kr">real student lists</k> in public demos or screenshots.</li>
      <li>Keep your <k class="kr">exam link private</k> (anyone with the link can open that workspace).</li>
    </ul>
  </section>
</main>
</body>
</html>`;
}
