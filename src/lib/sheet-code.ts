/** Crockford Base32 — no I, L, O, U (reduces misreads when typing). */
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

const ALIAS: Record<string, string> = {
  O: "0",
  I: "1",
  L: "1",
  U: "V",
};

export const SHEET_CODE_LEN = 12;

export function normalizeSheetCode(raw: string): string {
  let out = "";
  for (const ch of raw.trim().toUpperCase()) {
    if (ch === "-" || ch === " " || ch === "_") continue;
    const mapped = ALIAS[ch] ?? ch;
    if (ALPHABET.includes(mapped)) out += mapped;
  }
  return out;
}

export function formatSheetCode(code: string): string {
  const n = normalizeSheetCode(code);
  const parts: string[] = [];
  for (let i = 0; i < n.length; i += 4) parts.push(n.slice(i, i + 4));
  return parts.join("-");
}

export function isValidSheetCode(code: string): boolean {
  const n = normalizeSheetCode(code);
  return n.length === SHEET_CODE_LEN && [...n].every((c) => ALPHABET.includes(c));
}

/** Extract a sheet code from raw QR text (URL or bare code). Also accepts legacy 32-hex. */
export function extractSheetLookup(raw: string): string {
  const trimmed = raw.trim();
  const urlMatch = trimmed.match(/\/s\/([0-9A-Za-z-]{8,48})(?:[/?#]|$)/i);
  if (urlMatch?.[1]) {
    const n = normalizeSheetCode(urlMatch[1]);
    if (n) return n;
  }
  const n = normalizeSheetCode(trimmed);
  if (n.length === SHEET_CODE_LEN) return n;
  const hex = trimmed.toLowerCase().replace(/[^0-9a-f]/g, "");
  if (/^[0-9a-f]{32}$/.test(hex)) return hex;
  return n || trimmed;
}

export function randomSheetCode(length = SHEET_CODE_LEN): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i]! % ALPHABET.length]!;
  }
  return out;
}

export function sheetGradePath(code: string): string {
  return `/s/${normalizeSheetCode(code)}`;
}
