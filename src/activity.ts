import { bcs } from '@mysten/sui/bcs';
import type { SuiClientTypes } from '@mysten/sui/client';
const Opened = bcs.struct('Opened', { vault: bcs.Address, timestamp_ms: bcs.u64(), position: bcs.Address, owner: bcs.Address, principal: bcs.u64(), months: bcs.u64(), reward: bcs.u64(), maturity_ms: bcs.u64() });
const Closed = bcs.struct('Closed', { vault: bcs.Address, timestamp_ms: bcs.u64(), position: bcs.Address, owner: bcs.Address, principal: bcs.u64(), earned: bcs.u64(), community: bcs.u64(), founder: bcs.u64(), burned: bcs.u64() });
const Funded = bcs.struct('Funded', { vault: bcs.Address, amount: bcs.u64() });
const PauseChanged = bcs.struct('PauseChanged', { vault: bcs.Address, paused: bcs.bool() });
const Claimed = bcs.struct('Claimed', { pool: bcs.Address, timestamp_ms: bcs.u64(), owner: bcs.Address, amount: bcs.u64() });
const ClaimsBurned = bcs.struct('ClaimsBurned', { pool: bcs.Address, timestamp_ms: bcs.u64(), amount: bcs.u64() });
export const EventSchemas = { Opened, Closed, Funded, PauseChanged, Claimed, ClaimsBurned };
export type Activity = { label: string; digest: string; index: number; checkpoint: string | null; amount?: string; owner?: string; time?: string; detail?: string };
export function decodeActivity(event: SuiClientTypes.EventEntry, packageId: string, vaultId: string, poolId: string): Activity | null {
  const [pkg, module, name] = event.eventType.split('::');
  if (pkg.toLowerCase() !== packageId.toLowerCase()) return null;
  const base = { digest: event.transactionDigest, index: event.eventIndex, checkpoint: event.checkpoint };
  if (module === 'lock_vault') {
    if (name === 'Opened') { const e = Opened.parse(event.bcs); return e.vault === vaultId.toLowerCase() ? { ...base, label: 'Lock opened', amount: e.principal, owner: e.owner, time: e.timestamp_ms, detail: `${e.months} months · reward reserved in full` } : null; }
    if (name === 'Closed') { const e = Closed.parse(event.bcs); return e.vault === vaultId.toLowerCase() ? { ...base, label: 'Lock closed', amount: e.principal, owner: e.owner, time: e.timestamp_ms, detail: `Burned ${e.burned} base units · earned ${e.earned} base units` } : null; }
    if (name === 'Funded') { const e = Funded.parse(event.bcs); return e.vault === vaultId.toLowerCase() ? { ...base, label: 'Reward pool funded', amount: e.amount, owner: event.sender } : null; }
    if (name === 'PauseChanged') { const e = PauseChanged.parse(event.bcs); return e.vault === vaultId.toLowerCase() ? { ...base, label: e.paused ? 'New locks paused' : 'New locks resumed', owner: event.sender } : null; }
  }
  if (module === 'free_claims' && (name === 'Claimed' || name === 'ClaimsBurned')) {
    if (name === 'Claimed') { const e = Claimed.parse(event.bcs); return e.pool === poolId.toLowerCase() ? { ...base, label: 'Free claim paid', amount: e.amount, owner: e.owner, time: e.timestamp_ms } : null; }
    const e = ClaimsBurned.parse(event.bcs); return e.pool === poolId.toLowerCase() ? { ...base, label: 'Unclaimed supply burned', amount: e.amount, time: e.timestamp_ms } : null;
  }
  return null;
}
