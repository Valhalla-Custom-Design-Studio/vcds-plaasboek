/**
 * VCDS™ Input Sanitizer — XSS + injection prevention
 * All user input MUST pass through these before rendering or storing.
 */

const DANGEROUS = /<[^>]*>|javascript:|data:|vbscript:|on\w+\s*=/gi;
const SQL_KEYWORDS = /\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|;--|exec|xp_)\b/gi;

export function sanitizeText(input: unknown): string {
  if (typeof input !== "string") return "";
  return input
    .replace(DANGEROUS, "")
    .replace(SQL_KEYWORDS, "")
    .trim()
    .slice(0, 10000);
}

export function sanitizeEmail(input: unknown): string {
  if (typeof input !== "string") return "";
  const cleaned = input.trim().toLowerCase().slice(0, 254);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) return "";
  return cleaned;
}

export function sanitizeNumber(input: unknown, min = 0, max = 999999): number {
  const n = Number(input);
  if (isNaN(n)) return min;
  return Math.min(Math.max(n, min), max);
}

export function sanitizeUrl(input: unknown): string {
  if (typeof input !== "string") return "";
  try {
    const url = new URL(input);
    if (!["http:", "https:"].includes(url.protocol)) return "";
    return url.toString();
  } catch { return ""; }
}
