/**
 * Professional number-to-words converter for Bangladeshi Taka (BDT).
 * Uses South Asian numbering: Crore → Lakh → Thousand → Hundred.
 * Produces grammatically correct English with proper "and" placement.
 *
 * Examples:
 *   amountToWords(0)        → "Zero Taka Only"
 *   amountToWords(1050)     → "One Thousand and Fifty Taka Only"
 *   amountToWords(25500)    → "Twenty-Five Thousand Five Hundred Taka Only"
 *   amountToWords(123456)   → "One Lakh Twenty-Three Thousand Four Hundred and Fifty-Six Taka Only"
 *   amountToWords(1050.50)  → "One Thousand and Fifty Taka and Fifty Paisa Only"
 */

const ONES: readonly string[] = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];

const TENS: readonly string[] = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];

/** Converts 1–99 to words, using hyphens for 21–99 (e.g. "Twenty-Five") */
function twoDigits(n: number): string {
  if (n < 20) return ONES[n];
  const t = TENS[Math.floor(n / 10)];
  const o = n % 10;
  return o ? `${t}-${ONES[o]}` : t;
}

/** Converts 1–999 to words */
function threeDigits(n: number): string {
  if (n === 0) return "";
  if (n < 100) return twoDigits(n);

  const h = Math.floor(n / 100);
  const rest = n % 100;

  // "and" before the last two digits: "Five Hundred and Twelve"
  if (rest > 0) return `${ONES[h]} Hundred and ${twoDigits(rest)}`;
  return `${ONES[h]} Hundred`;
}

/**
 * Converts a whole number to its English word representation.
 * Uses the South Asian / Bangladeshi numbering system:
 *   Crore (1,00,00,000) → Lakh (1,00,000) → Thousand (1,000) → Hundred (100)
 *
 * Grammatical rules:
 *  - Hyphens for compound tens: "Twenty-Five", "Sixty-Three"
 *  - "and" before the final hundred-remainder: "Five Hundred and Twelve"
 *  - "and" before a standalone two-digit tail: "Two Thousand and Fifty"
 *  - No "and" between higher groups: "One Lakh Twenty-Three Thousand"
 */
export function numberToWords(num: number): string {
  if (!Number.isFinite(num) || num < 0) return "Zero";

  const n = Math.floor(num);
  if (n === 0) return "Zero";

  // Break into South Asian groups
  const crore = Math.floor(n / 10000000); // 1,00,00,000
  const lakh = Math.floor((n % 10000000) / 100000); // 1,00,000
  const thousand = Math.floor((n % 100000) / 1000); // 1,000
  const remainder = n % 1000; // 0–999

  const segments: string[] = [];

  if (crore > 0) segments.push(`${threeDigits(crore)} Crore`);
  if (lakh > 0) segments.push(`${twoDigits(lakh)} Lakh`);
  if (thousand > 0) segments.push(`${twoDigits(thousand)} Thousand`);

  // Decide if "and" is needed before the tail (< 1000 part)
  if (remainder > 0) {
    const needsAnd = segments.length > 0 && remainder < 100;
    if (needsAnd) {
      segments.push(`and ${twoDigits(remainder)}`);
    } else {
      segments.push(threeDigits(remainder));
    }
  }

  return segments.join(" ");
}

/**
 * Converts a BDT monetary amount to professional English words.
 *
 * @example
 *   amountToWords(1050)     → "One Thousand and Fifty Taka Only"
 *   amountToWords(0)        → "Zero Taka Only"
 *   amountToWords(1050.75)  → "One Thousand and Fifty Taka and Seventy-Five Paisa Only"
 *   amountToWords(100000)   → "One Lakh Taka Only"
 *   amountToWords(2534567)  → "Twenty-Five Lakh Thirty-Four Thousand Five Hundred and Sixty-Seven Taka Only"
 */
export function amountToWords(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) return "Zero Taka Only";

  const taka = Math.floor(amount);
  const paisa = Math.round((amount - taka) * 100);

  let result = `${numberToWords(taka)} Taka`;

  if (paisa > 0) {
    result += ` and ${numberToWords(paisa)} Paisa`;
  }

  return `${result} Only`;
}
