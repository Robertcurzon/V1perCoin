import { fromBase58 } from '@mysten/sui/utils';
import type { FeastAllocationBcs } from './chainSchemas';
export const FEAST_DISCLOSURE = 'Coins sacrificed during the Feast are transferred to wallets controlled by the V1PR founder (the "V1PR Treasury"). They are not burned, held in trust, or governed by participants. The founder may hold, sell, reinvest or spend them at the founder\'s sole discretion. Participants receive V1PR only, with no claim on Treasury assets or future income. Treasury addresses and all received transfers are published for verification.';
export function treasuryAddressValid(chain: string, address: string): boolean {
  if (chain === 'ethereum') return /^0x[0-9a-fA-F]{40}$/.test(address) && BigInt(address) !== 0n;
  try { return chain === 'solana' && fromBase58(address).length === 32 && fromBase58(address).some(n => n !== 0); } catch { return false; }
}
export function treasuryExplorer(chain: string, address: string): string | null {
  if (!treasuryAddressValid(chain, address)) return null;
  return `${chain === 'ethereum' ? 'https://etherscan.io/address/' : 'https://solscan.io/account/'}${address}`;
}
export function vestedAllocation(a: ReturnType<typeof FeastAllocationBcs.parse>, elapsed: bigint): bigint {
  const amount = BigInt(a.amount), first = amount / 2n, duration = 60n * 86_400_000n;
  if (a.lock_months !== '0') return amount;
  const time = elapsed < 0n ? 0n : elapsed > duration ? duration : elapsed;
  return first + (amount - first) * time / duration;
}
