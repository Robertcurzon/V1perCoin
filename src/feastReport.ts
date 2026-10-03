export interface FeastReport {
  csvSha256: string;
  scriptCommit: string;
  windowStart: number;
  receivedBaseUnits: Record<string,string>;
  treasuryReceivedBaseUnits: Record<string,string>;
  clearingPrice: { usdNumerator: string; tokenDenominator: string } | null;
}

// A valid file hash identifies bytes, but does not establish complete accounting.
export function parseFeastReport(value: unknown, coinIds: string[], windowStart: number): FeastReport {
  const fail = (): never => { throw new Error('Contribution report is incomplete or mismatched.'); };
  const record = (v: unknown): Record<string,unknown> => v !== null && typeof v === 'object' && !Array.isArray(v) ? v as Record<string,unknown> : fail();
  const integer = (v: unknown): bigint => typeof v === 'string' && /^(0|[1-9][0-9]*)$/.test(v) ? BigInt(v) : fail();
  const r = record(value), eligible = record(r.receivedBaseUnits), received = record(r.treasuryReceivedBaseUnits);
  if (new Set(coinIds).size !== coinIds.length || !Number.isSafeInteger(windowStart) || windowStart <= 0
      || typeof r.csvSha256 !== 'string' || !/^[a-f0-9]{64}$/.test(r.csvSha256)
      || typeof r.scriptCommit !== 'string' || !/^[a-f0-9]{40}$/.test(r.scriptCommit)
      || r.windowStart !== windowStart || r.liquidityProceedsPercent !== 25
      || r.usdScale !== '100000000'
      || Object.keys(eligible).length !== coinIds.length || Object.keys(received).length !== coinIds.length) fail();
  for (const id of coinIds) if (integer(eligible[id]) > integer(received[id])) fail();
  const allocated = integer(r.allocatedBaseUnits), burned = integer(r.burnAtFinalizeBaseUnits), usd = integer(r.totalUsdScaled);
  if (allocated + burned !== 100_000_000_000_000n) fail();
  if (allocated === 0n) { if (r.clearingPrice !== null) fail(); }
  else {
    const price = record(r.clearingPrice);
    if (usd === 0n || integer(price.usdNumerator) !== usd * 1_000_000n
        || integer(price.tokenDenominator) !== allocated * 100_000_000n) fail();
  }
  return r as unknown as FeastReport;
}
