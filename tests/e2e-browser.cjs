const { spawn, spawnSync } = require("node:child_process");
const { mkdtempSync, readFileSync, rmSync } = require("node:fs");
const { tmpdir } = require("node:os");
const { join } = require("node:path");
const { randomUUID } = require("node:crypto");
const http = require("node:http");
const WebSocket = require("ws");

const root = join(__dirname, "..");
const temp = mkdtempSync(join(tmpdir(), "anti-cheating-quiz-e2e-"));
const workerPort = 6100 + Math.floor(Math.random() * 300);
const chromePort = 9300 + Math.floor(Math.random() * 300);
const adminSecret = randomUUID();
const children = [];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForUrl(url, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {}
    await sleep(200);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

function spawnTracked(command, args, options = {}) {
  const child = spawn(command, args, { cwd: root, stdio: ["ignore", "pipe", "pipe"], ...options });
  children.push(child);
  return child;
}

async function createExam(baseUrl, title) {
  const response = await fetch(`${baseUrl}/api/admin/exams`, {
    method: "POST",
    headers: { "content-type": "application/json", "X-Admin-Secret": adminSecret },
    body: JSON.stringify({ title }),
  });
  assert(response.ok, `Could not create exam: ${response.status}`);
  return response.json();
}

async function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (response) => {
      let body = "";
      response.on("data", (chunk) => (body += chunk));
      response.on("end", () => resolve(JSON.parse(body)));
      response.on("error", reject);
    }).on("error", reject);
  });
}

async function connectCdp(url) {
  const pages = await getJson(`http://127.0.0.1:${chromePort}/json`);
  const socket = new WebSocket(pages[0].webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.once("open", resolve);
    socket.once("error", reject);
  });
  let nextId = 0;
  const pending = new Map();
  socket.on("message", (raw) => {
    const message = JSON.parse(raw);
    const waiter = pending.get(message.id);
    if (!waiter) return;
    pending.delete(message.id);
    message.error ? waiter.reject(new Error(message.error.message)) : waiter.resolve(message.result);
  });
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++nextId;
      pending.set(id, { resolve, reject });
      socket.send(JSON.stringify({ id, method, params }));
    });
  const evaluate = async (expression) => {
    const result = await send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
    return result.result.value;
  };
  const navigate = async (nextUrl) => {
    await send("Page.navigate", { url: nextUrl });
    await sleep(500);
  };
  await send("Page.enable");
  await send("Runtime.enable");
  await navigate(url);
  return { socket, send, evaluate, navigate };
}

async function poll(evaluate, expression, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const value = await evaluate(expression);
    if (value) return value;
    await sleep(100);
  }
  throw new Error(`Browser condition timed out: ${expression}`);
}

async function main() {
  const wrangler = join(root, "node_modules", ".bin", "wrangler");
  const migrate = spawnSync(
    wrangler,
    ["d1", "migrations", "apply", "anti-cheating-quiz", "--local", "--persist-to", temp],
    { cwd: root, env: { ...process.env, CI: "1" }, encoding: "utf8" },
  );
  assert(migrate.status === 0, `Migration failed:\n${migrate.stderr || migrate.stdout}`);

  spawnTracked(
    wrangler,
    ["dev", "--ip", "127.0.0.1", "--port", String(workerPort), "--persist-to", temp],
    {
      env: {
        ...process.env,
        ADMIN_SECRET: adminSecret,
        CLOUDFLARE_INCLUDE_PROCESS_ENV: "true",
      },
    },
  );
  const baseUrl = `http://127.0.0.1:${workerPort}`;
  await waitForUrl(baseUrl);

  const chromium =
    process.env.E2E_CHROMIUM_PATH ||
    process.env.REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE ||
    "/repl/tools/bin/chromium";
  spawnTracked(chromium, [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    `--remote-debugging-port=${chromePort}`,
    `--user-data-dir=${join(temp, "chrome")}`,
    "about:blank",
  ]);
  await waitForUrl(`http://127.0.0.1:${chromePort}/json`);

  const bankCsv = readFileSync(join(root, "samples", "bank.csv"), "utf8");
  const rosterCsv = readFileSync(join(root, "samples", "students.csv"), "utf8");
  const exam = await createExam(baseUrl, "Browser E2E");
  const browser = await connectCdp(`${baseUrl}${exam.path}`);
  const { evaluate, send, navigate } = browser;

  const initial = await evaluate(`({
    disabled: btnGen.disabled,
    text: genReadiness.textContent,
    columns: getComputedStyle(document.querySelector(".file-grid")).gridTemplateColumns
  })`);
  assert(initial.disabled && initial.text.includes("both CSV"), "Initial readiness is unclear");
  assert(initial.columns.trim().split(" ").length === 2, "Desktop upload cards are not two columns");

  await evaluate(`(() => {
    const add = (el, text, name) => {
      const transfer = new DataTransfer();
      transfer.items.add(new File([text], name, { type: "text/csv" }));
      el.files = transfer.files;
      el.dispatchEvent(new Event("change", { bubbles: true }));
    };
    add(bank, ${JSON.stringify(bankCsv)}, "bank.csv");
    window.__oneFileState = { disabled: btnGen.disabled, text: genReadiness.textContent };
    add(roster, ${JSON.stringify(rosterCsv)}, "roster.csv");
  })()`);
  const ready = await evaluate(`({
    one: window.__oneFileState,
    both: { disabled: btnGen.disabled, text: genReadiness.textContent }
  })`);
  assert(ready.one.disabled && ready.one.text.includes("roster"), "One-file guidance failed");
  assert(!ready.both.disabled && ready.both.text.includes("Ready"), "Two-file readiness failed");

  await evaluate("btnGen.click()");
  const busy = await evaluate(`({
    button: btnGen.disabled,
    bank: bank.disabled,
    roster: roster.disabled,
    force: forceGen.disabled
  })`);
  assert(Object.values(busy).every(Boolean), "Generation controls were not locked together");
  await poll(evaluate, `genMsg.textContent.includes("ZIP downloaded")`, 45_000);
  const summary = await poll(evaluate, `summary.textContent.includes("Instances: 5") && summary.textContent`);
  assert(summary.includes("Graded: 0"), "Generated summary is incorrect");

  const edgeExam = await createExam(baseUrl, "Browser failures");
  await navigate(`${baseUrl}${edgeExam.path}`);
  await evaluate(`(() => {
    const add = (el, name) => {
      const transfer = new DataTransfer();
      transfer.items.add(new File(["x"], name, { type: "text/csv" }));
      el.files = transfer.files;
      el.dispatchEvent(new Event("change", { bubbles: true }));
    };
    add(bank, "bank.csv"); add(roster, "roster.csv");
    window.__executed = false;
    window.fetch = async () => ({
      ok: false,
      status: 400,
      json: async () => ({
        error: "bank_invalid",
        issues: [{ row: 7, message: "<img id=attack onerror=window.__executed=true> missing answer" }]
      })
    });
    btnGen.click();
  })()`);
  await poll(evaluate, `genMsg.textContent.includes("Row 7")`);
  const injection = await evaluate(`({
    text: genMsg.textContent,
    image: Boolean(document.getElementById("attack")),
    executed: window.__executed,
    focused: document.activeElement.id,
    restored: !btnGen.disabled && !bank.disabled && !roster.disabled && !forceGen.disabled
  })`);
  assert(injection.text.includes("<img") && !injection.image && !injection.executed, "Server error HTML was not escaped");
  assert(injection.focused === "genMsg" && injection.restored, "Error recovery/focus failed");

  await evaluate(`(async () => {
    window.fetch = async () => { throw new Error("network offline"); };
    btnGen.click();
  })()`);
  await poll(evaluate, `genMsg.textContent.includes("network offline")`);
  assert(await evaluate("!btnGen.disabled"), "Network failure did not allow retry");

  const cancel = await evaluate(`(() => {
    let calls = 0;
    window.fetch = async () => { calls++; return { ok: true, blob: async () => new Blob(["zip"]) }; };
    window.confirm = () => false;
    forceGen.checked = true;
    btnGen.click();
    return new Promise((resolve) => setTimeout(() => resolve({ calls, disabled: btnGen.disabled }), 30));
  })()`);
  assert(cancel.calls === 0 && !cancel.disabled, "Cancelled replacement still generated papers");

  await send("Emulation.setDeviceMetricsOverride", {
    width: 375,
    height: 812,
    deviceScaleFactor: 1,
    mobile: true,
  });
  const mobile = await evaluate(`({
    width: innerWidth,
    columns: getComputedStyle(document.querySelector(".file-grid")).gridTemplateColumns,
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth
  })`);
  assert(mobile.width === 375 && mobile.columns.trim().split(" ").length === 1 && !mobile.overflow, "Mobile layout overflowed");

  const fortyRoster =
    "student_name,student_id\n" +
    Array.from({ length: 40 }, (_, i) => `Student ${i + 1},S${String(i + 1).padStart(3, "0")}`).join("\n") +
    "\n";
  const fullExam = await createExam(baseUrl, "40 Student E2E");
  const generated = await fetch(`${baseUrl}${fullExam.path}/api/generate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ bankCsv, rosterCsv: fortyRoster }),
  });
  if (!generated.ok) {
    throw new Error(`40-student generation failed: ${generated.status} ${await generated.text()}`);
  }
  assert((await generated.arrayBuffer()).byteLength > 40_000, "40-student ZIP is unexpectedly small");
  const fullSummary = await (await fetch(`${baseUrl}${fullExam.path}/api/summary`)).json();
  assert(fullSummary.instances === 40 && fullSummary.graded === 0, "40-student summary is incorrect");

  browser.socket.close();
  console.log("E2E passed: desktop/mobile UI, real ZIP generation, failures, cancellation, XSS safety, and 40-student load.");
}

main()
  .catch((error) => {
    console.error(error.stack || error);
    process.exitCode = 1;
  })
  .finally(async () => {
    for (const child of children.reverse()) child.kill("SIGTERM");
    await sleep(200);
    rmSync(temp, { recursive: true, force: true });
  });