import Decimal from 'decimal.js';
import { env } from '../env';
import { toUsdc, type UsdcAmount } from '../lib/money';

/**
 * Pure attribution math. Given a chunk retrieval price, split it into the
 * researcher's share (default 85%) and the platform's share (default 15%)
 * using basis points from env. Never uses floats — all math in Decimal.
 *
 * Invariant: researcherShareUsdc + platformShareUsdc === priceUsdc (exactly,
 * at 6-decimal precision). The function rounds the researcher share
 * down-to-nearest-unit via Decimal.ROUND_DOWN so the platform picks up any
 * sub-microdollar rounding crumbs — this avoids over-paying researchers, and
 * keeps the double-entry invariant tight.
 */
export interface AttributionSplit {
  priceUsdc: UsdcAmount;
  researcherShareUsdc: UsdcAmount;
  platformShareUsdc: UsdcAmount;
}

export function splitPrice(priceUsdc: string): AttributionSplit {
  const price = new Decimal(priceUsdc);
  const researcherBps = new Decimal(env.RESEARCHER_SHARE_BPS);
  const platformBps = new Decimal(env.PLATFORM_SHARE_BPS);
  const denom = new Decimal(10000);

  if (!researcherBps.plus(platformBps).eq(denom)) {
    throw new Error(
      `Attribution bps must sum to 10000 (got ${researcherBps.toString()} + ${platformBps.toString()})`,
    );
  }

  // Round researcher share DOWN to 6 decimals; platform takes the remainder.
  const researcherRaw = price.mul(researcherBps).div(denom);
  const researcherShare = researcherRaw.toDecimalPlaces(6, Decimal.ROUND_DOWN);
  const platformShare = price.minus(researcherShare);

  return {
    priceUsdc: toUsdc(price),
    researcherShareUsdc: toUsdc(researcherShare),
    platformShareUsdc: toUsdc(platformShare),
  };
}

/**
 * Price for a single chunk retrieval. For the hackathon this is flat from
 * env — in production you'd vary by tier (open/validated/dark).
 */
export function priceForChunk(): UsdcAmount {
  return toUsdc(env.PRICE_PER_CHUNK_USDC);
}
