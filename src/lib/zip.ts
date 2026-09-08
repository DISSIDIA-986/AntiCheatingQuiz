import { zipSync, strToU8 } from "fflate";

export function zipPdfs(files: Array<{ name: string; bytes: Uint8Array }>): Uint8Array {
  const obj: Record<string, Uint8Array> = {};
  for (const f of files) {
    obj[f.name] = f.bytes;
  }
  // also include a tiny readme
  obj["README.txt"] = strToU8(
    "AntiCheatingQuiz exam sheets\nPrint single-sided Letter.\nEach QR opens a phone grading page for that student only.\n",
  );
  return zipSync(obj, { level: 6 });
}

export function safeFilename(name: string, id: string): string {
  const base = `${id}_${name}`.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 80);
  return `${base}.pdf`;
}
