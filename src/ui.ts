export function examAppHtml(token: string): string {
  const t = JSON.stringify(token);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="referrer" content="no-referrer" />
  <link rel="icon" href="data:," />
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
    button:focus-visible, a:focus-visible, input:focus-visible, summary:focus-visible {
      outline: 3px solid #d49b24;
      outline-offset: 3px;
    }
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
    .file-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.85rem;
      margin-top: 0.9rem;
    }
    .file-card {
      border: 1px solid var(--line);
      background: #f7faf8;
      padding: 0.85rem;
    }
    .file-card label { font-weight: 700; margin-top: 0; color: #2c3a4a; }
    .file-card p { margin: 0.35rem 0 0.65rem; font: 0.86rem/1.4 "Avenir Next", "Segoe UI", sans-serif; }
    .file-card a { color: var(--accent); }
    .readiness {
      margin: 0.85rem 0 0;
      font: 600 0.9rem/1.4 "Avenir Next", "Segoe UI", sans-serif;
      color: #596579;
    }
    .readiness.ready { color: var(--accent); }
    details.print-guide { margin-top: 0.9rem; border-top: 1px solid var(--line); padding-top: 0.75rem; }
    details.print-guide summary { cursor: pointer; color: var(--accent); font: 600 0.92rem/1.4 "Avenir Next", "Segoe UI", sans-serif; }
    .error-list { margin: 0.5rem 0 0; padding-left: 1.25rem; }
    .error-list li { margin: 0.3rem 0; }
    @media (max-width: 680px) {
      .file-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <header>
    <h1>AntiCheatingQuiz</h1>
    <p class="sub">Create personalized paper exams on your computer, print them, then <strong>scan each sheet’s QR with your phone</strong> to grade. Prototype — not a Scantron replacement.</p>
    <p class="warn-banner"><strong>Privacy:</strong> This private instructor link can view student names/IDs, grade sheets, and download results. Open it once on your phone before scanning sheet QRs, and do not share it with students.</p>
    <p class="nav"><a href="/e/${token}/help">How to use (Help)</a></p>
  </header>
  <main>
    <section>
      <h2>1. Create &amp; print exam sheets</h2>
      <p class="sub">Add your 10 questions and class roster. The app creates one personalized sheet per student, as both individual files and one combined print-ready PDF.</p>
      <div class="file-grid">
        <div class="file-card">
          <label for="bank">Question bank CSV</label>
          <p><a href="/templates/question-bank-template.csv">Download blank template</a> · <a href="/templates/question-bank-sample.csv">View sample</a><br/>Must contain exactly 10 multiple-choice questions.</p>
          <input id="bank" type="file" accept=".csv,text/csv" />
        </div>
        <div class="file-card">
          <label for="roster">Student roster CSV</label>
          <p><a href="/templates/student-list-template.csv">Download blank template</a> · <a href="/templates/student-list-sample.csv">View sample</a><br/>Add each student’s name and ID (up to 50 students).</p>
          <input id="roster" type="file" accept=".csv,text/csv" />
        </div>
      </div>
      <label class="check"><input id="forceGen" type="checkbox" /> Replace existing papers (deletes prior grades)</label>
      <p id="genReadiness" class="readiness" role="status" aria-live="polite">Choose both CSV files to continue.</p>
      <button id="btnGen" disabled>Create exam sheets (download ZIP)</button>
      <div id="genMsg" class="msg" role="status" aria-live="polite" tabindex="-1"></div>
      <div id="sheetDownloads" class="downloads" hidden>
        <strong>Print or download</strong>
        <a href="/e/${token}/api/exam-sheets.pdf">Combined PDF — print the whole roster</a>
        <span>Individual PDFs are in the ZIP downloaded during generation.</span>
      </div>
      <details class="print-guide">
        <summary>How to print</summary>
        <ol class="print-steps">
          <li>Open the combined PDF to print the whole roster in one action, or unzip the ZIP for individual files.</li>
          <li>Choose <strong>File → Print</strong> (or Cmd/Ctrl+P).</li>
          <li>Use <strong>Letter</strong> paper, single-sided, actual size (100%).</li>
          <li>Hand each student their named sheet.</li>
        </ol>
      </details>
    </section>
    <section>
      <h2>2. Grade on your phone</h2>
      <p class="sub"><strong>Normal path:</strong> first open this private exam link on your phone. For the next 12 hours, use the iPhone Camera (or any QR app), point at each sheet’s QR → Safari opens its grading page → tap the bubbles → Save. A sheet QR alone cannot show or change grades.</p>
      <p class="sub">Use the tools below only if the camera link fails (fallback on this computer).</p>
      <label for="photo">Sheet photo (optional fallback)</label>
      <input id="photo" type="file" accept="image/*" capture="environment" />
      <button id="btnDecode" class="secondary">Read QR from photo</button>
      <label for="instanceId">Or type/paste sheet code</label>
      <input id="instanceId" type="text" placeholder="e.g. 7K4M-2Q8R-XP6T" autocomplete="off" />
      <button id="btnLoad">Load sheet</button>
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

    function setMsg(el, text, ok, html) {
      if (html) el.innerHTML = text;
      else el.textContent = text;
      el.className = "msg " + (ok ? "ok" : "err");
    }

    const bankInput = document.getElementById("bank");
    const rosterInput = document.getElementById("roster");
    const genButton = document.getElementById("btnGen");
    const readiness = document.getElementById("genReadiness");
    let generating = false;

    function updateGenerationReadiness() {
      const hasBank = Boolean(bankInput.files && bankInput.files[0]);
      const hasRoster = Boolean(rosterInput.files && rosterInput.files[0]);
      genButton.disabled = generating || !hasBank || !hasRoster;
      bankInput.disabled = generating;
      rosterInput.disabled = generating;
      document.getElementById("forceGen").disabled = generating;
      readiness.className = "readiness" + (hasBank && hasRoster ? " ready" : "");
      if (generating) readiness.textContent = "Checking files and creating exam sheets…";
      else if (hasBank && hasRoster) readiness.textContent = "Ready — both files are selected.";
      else if (hasBank) readiness.textContent = "Question bank selected. Add the student roster.";
      else if (hasRoster) readiness.textContent = "Student roster selected. Add the question bank.";
      else readiness.textContent = "Choose both CSV files to continue.";
    }

    function friendlyGenerationError(err) {
      if (err && (err.error === "bank_invalid" || err.error === "roster_invalid")) {
        const source = err.error === "bank_invalid" ? "question bank" : "student roster";
        const issues = Array.isArray(err.issues) ? err.issues : [];
        const items = issues.map((issue) => {
          const where = issue && issue.row ? "Row " + issue.row + ": " : "";
          return "<li>" + escapeHtml(where + String((issue && issue.message) || "Check this file.")) + "</li>";
        }).join("");
        return "<strong>Please fix the " + source + " CSV, then try again.</strong>" +
          (items ? '<ul class="error-list">' + items + "</ul>" : "") +
          '<p>Tip: compare your file with the blank template or sample above.</p>';
      }
      if (err && err.error === "already_generated") {
        return "<strong>Exam sheets already exist.</strong><p>To keep current grades and printed QR codes, stop here. To start over, select “Replace existing papers,” then try again.</p>";
      }
      const message = err && (err.message || err.error);
      return "<strong>We could not create the exam sheets.</strong><p>" +
        escapeHtml(String(message || "Please check both CSV files and try again.")) + "</p>";
    }

    bankInput.addEventListener("change", updateGenerationReadiness);
    rosterInput.addEventListener("change", updateGenerationReadiness);
    updateGenerationReadiness();

    genButton.onclick = async () => {
      const msg = document.getElementById("genMsg");
      try {
        const bankFile = bankInput.files && bankInput.files[0];
        const rosterFile = rosterInput.files && rosterInput.files[0];
        if (!bankFile || !rosterFile) throw new Error("Choose both CSV files first.");
        const force = document.getElementById("forceGen").checked;
        if (force) {
          const ok = window.confirm(
            "Replace existing papers?\\n\\nThis DELETES current grades and creates NEW QR codes.\\nAlready-printed sheets will NOT match the new files.\\n\\nOK = replace, Cancel = abort",
          );
          if (!ok) return;
        }
        generating = true;
        updateGenerationReadiness();
        setMsg(msg, "Checking your files and creating personalized sheets. This may take a moment.", true);
        const bank = await bankFile.text();
        const roster = await rosterFile.text();
        const res = await fetch(base + "/api/generate", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ bankCsv: bank, rosterCsv: roster, force }),
        });
        if (!res.ok) {
          const err = await res.json().catch(async () => ({ error: await res.text() }));
          throw err;
        }
        const blob = await res.blob();
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "exam-sheets.zip";
        a.click();
        document.getElementById("sheetDownloads").hidden = false;
        setMsg(msg, "ZIP downloaded. Use the combined PDF below to print the whole roster in order (Letter, single-sided), or keep using the individual files in the ZIP.", true);
        refreshSummary();
      } catch (e) {
        setMsg(msg, friendlyGenerationError(e), false, true);
        msg.focus();
      } finally {
        generating = false;
        updateGenerationReadiness();
      }
    };

    async function loadInstance(raw) {
      const msg = document.getElementById("gradeMsg");
      const box = document.getElementById("gradeBox");
      box.innerHTML = "";
      const id = extractLookup(raw);
      if (!id) throw new Error("Enter a sheet code");
      // If QR decoded to a grade URL, jump there (same as phone camera).
      if (/^https?:\\/\\//i.test(String(raw).trim()) && /\\/s\\//i.test(String(raw))) {
        location.href = String(raw).trim();
        return;
      }
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
          let regrade = false;
          if (data.grade) {
            regrade = window.confirm(
              "This sheet already has a saved grade. Overwrite it with these answers?\\n\\nOK = regrade, Cancel = keep the existing grade",
            );
            if (!regrade) return;
          }
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
            body: JSON.stringify({ answers, status, regrade }),
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
      setMsg(msg, data.grade ? "Sheet loaded with prior answers. Edit and save." : "Sheet loaded. Select bubbles and save.", true);
    }

    function extractLookup(raw) {
      const t = String(raw || "").trim();
      const m = t.match(/\\/s\\/([0-9A-Za-z-]{8,48})/i);
      if (m) {
        const rawCode = m[1].replace(/[^0-9A-Za-z]/g, "");
        return /^[0-9a-fA-F]{32}$/.test(rawCode) ? rawCode.toLowerCase() : rawCode.toUpperCase();
      }
      return t.toUpperCase().replace(/[^0-9A-Z]/g, "") || t;
    }

    document.getElementById("btnLoad").onclick = async () => {
      try {
        const id = document.getElementById("instanceId").value.trim();
        if (!id) throw new Error("Enter sheet code");
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
          throw new Error("Could not read QR here. On iPhone: open Camera, scan the QR — it opens the grade page directly.");
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
        document.getElementById("sheetDownloads").hidden = data.instances < 1;
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

/** Phone-first grading page opened by scanning the sheet QR. */
export function sheetGradeHtml(code: string): string {
  const c = JSON.stringify(code);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="referrer" content="no-referrer" />
  <link rel="icon" href="data:," />
  <title>Grade sheet</title>
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
      font-family: "Avenir Next", "Segoe UI", system-ui, sans-serif;
      color: var(--ink);
      background: linear-gradient(180deg, #f7f2e8 0%, var(--bg) 100%);
      min-height: 100vh;
      padding: 1rem 1rem 3rem;
    }
    header { max-width: 40rem; margin: 0 auto 1rem; }
    h1 { font-size: 1.35rem; margin: 0 0 0.35rem; color: var(--accent); }
    .sub { opacity: 0.85; line-height: 1.4; font-size: 0.95rem; }
    #meta { font-size: 1.05rem; margin: 0.5rem 0 1rem; }
    .q {
      background: var(--card);
      border: 1px solid var(--line);
      border-radius: 6px;
      padding: 0.85rem 0.9rem;
      margin: 0 0 0.75rem;
    }
    .q .stem { font-family: "Source Serif 4", Palatino, serif; margin-bottom: 0.55rem; line-height: 1.35; }
    .opt {
      display: flex;
      align-items: flex-start;
      gap: 0.55rem;
      padding: 0.55rem 0.45rem;
      border-radius: 6px;
      margin: 0.2rem 0;
      border: 1px solid transparent;
    }
    .opt:has(input:checked) {
      background: #e7f3ee;
      border-color: #9bc4b4;
    }
    .opt input { width: 1.15rem; height: 1.15rem; margin-top: 0.1rem; flex-shrink: 0; }
    .opt span { line-height: 1.35; font-size: 0.95rem; }
    .actions {
      position: sticky;
      bottom: 0;
      background: rgba(243,239,230,0.96);
      padding: 0.75rem 0 0.25rem;
      max-width: 40rem;
      margin: 0 auto;
      border-top: 1px solid var(--line);
    }
    button {
      width: 100%;
      background: var(--accent);
      color: #f7fff9;
      border: 0;
      padding: 0.9rem 1rem;
      font: 700 1.05rem/1 "Avenir Next", "Segoe UI", sans-serif;
      border-radius: 8px;
      cursor: pointer;
    }
    label.check { display: flex; gap: 0.5rem; align-items: flex-start; margin: 0.65rem 0; font-size: 0.92rem; }
    .msg { margin-top: 0.65rem; white-space: pre-wrap; font-size: 0.9rem; }
    .err { color: var(--warn); }
    .ok { color: var(--accent); }
    #root { max-width: 40rem; margin: 0 auto; }
  </style>
</head>
<body>
  <header>
    <h1>Grade this sheet</h1>
    <p class="sub">Look at the paper. Tap the same A–D answers the student bubbled. Then save.</p>
  </header>
  <div id="root">
    <div id="meta">Loading…</div>
    <div id="qs"></div>
    <div class="actions">
      <label class="check"><input id="confirmChecked" type="checkbox" /> I checked this against the paper</label>
      <button id="btnSave" disabled>Save grade</button>
      <div id="msg" class="msg"></div>
    </div>
  </div>
  <script>
    const CODE = ${c};
    const api = location.origin + "/s/" + encodeURIComponent(CODE) + "/api";
    let data = null;

    function escapeHtml(s) {
      return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    }

    function setMsg(text, ok) {
      const el = document.getElementById("msg");
      el.textContent = text;
      el.className = "msg " + (ok ? "ok" : "err");
    }

    async function boot() {
      const res = await fetch(api);
      if (!res.ok) throw new Error("Could not load this sheet.");
      data = await res.json();
      document.getElementById("meta").innerHTML =
        "<strong>" + escapeHtml(data.student_name) + "</strong><br/>ID " + escapeHtml(data.student_id) +
        (data.grade ? "<br/>Previous score: " + data.grade.score_correct + "/10" : "");
      const box = document.getElementById("qs");
      const saved = (data.grade && data.grade.saved_answers) || {};
      data.questions.forEach((q, i) => {
        const div = document.createElement("div");
        div.className = "q";
        div.innerHTML = '<div class="stem"><strong>' + (i + 1) + ".</strong> " + escapeHtml(q.stem) + "</div>";
        const current = saved[q.question_id] ?? "";
        ["A","B","C","D",""].forEach((L) => {
          const lab = document.createElement("label");
          lab.className = "opt";
          const inp = document.createElement("input");
          inp.type = "radio";
          inp.name = "q_" + q.question_id;
          inp.value = L;
          inp.dataset.qid = q.question_id;
          if (L === current) inp.checked = true;
          const span = document.createElement("span");
          span.textContent = L === "" ? "Blank / no bubble" : L + ") " + q.choices[L];
          lab.appendChild(inp);
          lab.appendChild(span);
          div.appendChild(lab);
        });
        box.appendChild(div);
      });
      document.getElementById("btnSave").disabled = false;
    }

    document.getElementById("btnSave").onclick = async () => {
      try {
        if (!document.getElementById("confirmChecked").checked) {
          throw new Error("Tick “I checked this against the paper” first.");
        }
        const answers = {};
        let blank = 0;
        data.questions.forEach((q) => {
          const sel = document.querySelector('input[data-qid="' + CSS.escape(q.question_id) + '"]:checked');
          const v = sel ? sel.value : "";
          answers[q.question_id] = v;
          if (!v) blank++;
        });
        let status = "ok";
        let regrade = false;
        if (data.grade) {
          regrade = window.confirm(
            "This sheet already has a saved grade. Overwrite it with these answers?\\n\\nOK = regrade, Cancel = keep the existing grade",
          );
          if (!regrade) return;
        }
        if (blank > 0) {
          const proceed = window.confirm(
            blank + " blank answer(s) will score as wrong. Save as needs review?\\n\\nOK = save, Cancel = go back",
          );
          if (!proceed) return;
          status = "needs_review";
        }
        const r = await fetch(api + "/grade", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ answers, status, regrade }),
        });
        if (!r.ok) throw new Error(await r.text());
        const out = await r.json();
        setMsg("Saved. Score " + out.score_correct + "/10 (" + out.score_pct + "%). You can close this tab and scan the next sheet.", true);
      } catch (e) {
        setMsg(String(e.message || e), false);
      }
    };

    boot().catch((e) => setMsg(String(e.message || e), false));
  </script>
</body>
</html>`;
}

export function homeHtml(): string {
  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<meta name="referrer" content="no-referrer"/>
<link rel="icon" href="data:,"/>
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
  <link rel="icon" href="data:," />
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
      <li>Settings: <k class="ky">Letter</k>, single-sided, 100% scale if possible. Keep the large <k class="kb">QR code</k> (and the short code under it) uncut.</li>
      <li>Print every student’s sheet and hand out the matching named copy in class.</li>
      <li><k class="kr">Do not regenerate</k> after printing unless you plan to reprint everything — new files get new QR codes.</li>
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
    <h2>Step 3 — Grade (phone)</h2>
    <ul>
      <li><k class="kb">Easiest:</k> open the <k class="kb">iPhone Camera</k> (or any QR app) and point at the sheet’s <k class="kb">QR code</k>.</li>
      <li>A link opens in Safari — that page is <k class="kb">only for that student</k>.</li>
      <li>Tap the answers you see bubbled on the paper → tick “I checked…” → <k class="kb">Save grade</k>.</li>
      <li>Close the tab and scan the next sheet. Repeat until done.</li>
      <li>Fallback (if camera fails): on your computer exam page, type the short code printed under the QR (like <code>7K4M-2Q8R-XP6T</code>).</li>
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
      <li><k class="kr">QR not opening a page</k> — the QR must be from a newly generated ZIP (old prints only had a long ID). Reprint after updating, or type the short code under the QR.</li>
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
