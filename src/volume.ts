import { normalizeStructTag, normalizeSuiAddress } from '@mysten/sui/utils';
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
export function readDexVolume(data: unknown, pairId: string, coinType: string): number {
  if (!record(data) || !Array.isArray(data.pairs)) throw new Error('Volume provider returned no pair data.');
  for (const pair of data.pairs) {
    if (!record(pair) || pair.chainId !== 'sui' || typeof pair.pairAddress !== 'string') continue;
    if (normalizeSuiAddress(pair.pairAddress) !== normalizeSuiAddress(pairId)) continue;
    const matchesToken = [pair.baseToken, pair.quoteToken].some((token) => {
      if (!record(token) || typeof token.address !== 'string') return false;
      try { return normalizeStructTag(token.address) === normalizeStructTag(coinType); } catch { return false; }
    });
    if (!matchesToken) throw new Error('Volume pair does not contain the verified V1PER coin type.');
    if (!record(pair.volume) || typeof pair.volume.h24 !== 'number' || !Number.isFinite(pair.volume.h24) || pair.volume.h24 < 0) throw new Error('24-hour USD volume is unavailable.');
    return pair.volume.h24;
  }
  throw new Error('Verified Sui pair is not indexed by the volume provider.');
}
