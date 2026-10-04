/**
 * Lightweight RFC4122 v4 UUID generator for client-side primary keys.
 *
 * Used so the Agent App can generate the real farmers.id / batches.id
 * *before* the Supabase insert, instead of letting Postgres generate one
 * separately from the human-readable code shown on screen / printed on the
 * QR sticker (see farmer/new.tsx and batch/new.tsx) — previously those two
 * identifiers were unrelated, so a scan/lookup by the printed code could
 * never find the real row.
 *
 * Uses the platform crypto RNG when available (Hermes/JSC on recent Expo
 * SDKs expose `crypto.getRandomValues`); falls back to Math.random, which is
 * fine here since this is a primary key, not a security token.
 */
export function uuidv4(): string {
  const bytes = new Uint8Array(16);
  const g: any = globalThis as any;
  if (g.crypto && typeof g.crypto.getRandomValues === "function") {
    g.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
