// Routes documented by the explorer operator: docs.blockberry.one/docs/suiscan-routes.
export function explorerUrl(network: string, kind: 'coin' | 'object' | 'account' | 'tx', value: string): string | null {
  if (!['mainnet', 'testnet'].includes(network)) return null;
  const address = /^0x[0-9a-fA-F]{64}$/;
  const valid = kind === 'tx' ? /^[1-9A-HJ-NP-Za-km-z]{43,44}$/.test(value)
    : kind === 'coin' ? /^0x[0-9a-fA-F]{64}::[A-Za-z_][A-Za-z0-9_]*::[A-Za-z_][A-Za-z0-9_]*$/.test(value)
    : address.test(value) && BigInt(value) !== 0n;
  if (!valid) return null;
  const suffix = kind === 'coin' ? '/txs' : kind === 'account' ? '/portfolio' : '';
  return `https://suiscan.xyz/${network}/${kind}/${encodeURIComponent(value)}${suffix}`;
}
export function shortId(value: string) { return `${value.slice(0, 8)}…${value.slice(-6)}`; }
export function dataIsStale(receivedAt: number, now: number) {
  return !Number.isFinite(receivedAt) || receivedAt <= 0 || now - receivedAt > 90_000 || receivedAt > now + 5_000;
}
