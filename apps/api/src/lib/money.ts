import Decimal from 'decimal.js';

/**
 * Branded USDC amount. Stored and passed as a string, never a JS number.
 * `toUsdc(...)` is the only blessed constructor.
 */
export type UsdcAmount = string & { readonly __brand: 'UsdcAmount' };

// Configure Decimal for money semantics: bank-safe rounding, plenty of precision.
Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_EVEN });

export const USDC_DECIMALS = 6;

/**
 * Normalise an input (string | number | Decimal) to a branded UsdcAmount with
 * 6 decimal places. Throws on non-finite input.
 */
export function toUsdc(input: string | number | Decimal): UsdcAmount {
  const d = new Decimal(input);
  if (!d.isFinite()) throw new Error(`Invalid USDC amount: ${input}`);
  return d.toFixed(USDC_DECIMALS) as UsdcAmount;
}

export function add(a: UsdcAmount, b: UsdcAmount): UsdcAmount {
  return toUsdc(new Decimal(a).plus(b));
}

export function sub(a: UsdcAmount, b: UsdcAmount): UsdcAmount {
  return toUsdc(new Decimal(a).minus(b));
}

export function mulBps(a: UsdcAmount, bps: number): UsdcAmount {
  return toUsdc(new Decimal(a).mul(bps).div(10000));
}

export function eq(a: UsdcAmount, b: UsdcAmount): boolean {
  return new Decimal(a).eq(new Decimal(b));
}

/** Convert a 6-decimal USDC string into the smallest-unit bigint (for EVM). */
export function toSmallestUnit(amount: UsdcAmount): bigint {
  const d = new Decimal(amount).mul(new Decimal(10).pow(USDC_DECIMALS));
  return BigInt(d.toFixed(0));
}

export const ZERO_USDC = toUsdc(0);
