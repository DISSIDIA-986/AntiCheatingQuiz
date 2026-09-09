import { zipSync, strToU8 } from "fflate";

export function zipPdfs(files: Array<{ name: string; bytes: Uint8Array }>): Uint8Array {
  const obj: Record<string, Uint8Array> = {};
  for (const f of files) {
    obj[f.name] = f.bytes;
  }
  // also include a tiny readme
  obj["README.txt"] = strToU8(
    "AntiCheatingQuiz exam sheets\nPrint single-sided Letter.\nEach QR opens a phone grading page for that student only.\nFor one-click class printing, also download the Combined PDF from the exam page.\n",
  );
  return zipSync(obj, { level: 6 });
}

export function safeFilename(name: string, id: string, instanceId = ""): string {
  const base = `${id}_${name}`.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 80);
  const unique = instanceId.replace(/[^a-zA-Z0-9_-]+/g, "").slice(0, 24);
  return `${base}${unique ? `_${unique}` : ""}.pdf`;
}
