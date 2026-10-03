export function validWhitepaperProof(proof: unknown, sourceSha256: string, pdfSha256: string): boolean {
  if (!proof || typeof proof !== 'object') return false;
  const p=proof as Record<string,unknown>;
  return /^[a-f0-9]{64}$/.test(sourceSha256) && /^[a-f0-9]{64}$/.test(pdfSha256) && p.sourceSha256===sourceSha256 && p.pdfSha256===pdfSha256;
}
