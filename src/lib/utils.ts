import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a number as Indian Rupees, e.g. 1234.5 -> "₹1,234.50".
 * Pass `decimals: 0` for whole-rupee display (KPIs, totals).
 */
export function formatINR(
  amount: number | null | undefined,
  { decimals = 2 }: { decimals?: number } = {}
): string {
  const value = Number.isFinite(amount as number) ? (amount as number) : 0;
  return `₹${value.toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

/**
 * Neutralizes CSV formula injection by prefixing values that Excel/Sheets would
 * interpret as a formula (=, +, -, @, tab, CR) with a single quote.
 */
export function csvSafe(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}
