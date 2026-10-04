import { addressValid, networks, type SourceChain } from '../scripts/feast/networks.mjs';
import type { FeastAllocationBcs } from './chainSchemas';
export const FEAST_DISCLOSURE = 'Feast proceeds are sent to V1PER Foundation receiving wallets controlled by the founder. Contributed coins are not burned, held in trust or governed by participants. The founder may hold, sell, reinvest or spend them at their discretion. Participants receive V1PER only, with no claim on Foundation assets or future income and no contribution refund path. Receiving addresses and transfers are published for verification.';
export function treasuryAddressValid(chain: string, address: string): boolean { return addressValid(chain,address,true); }
export function treasuryExplorer(chain: string, address: string): string | null {
  if (!treasuryAddressValid(chain,address)) return null;
  return `${networks[chain as SourceChain].explorer}${address}`;
}
export function vestedAllocation(a: ReturnType<typeof FeastAllocationBcs.parse>, elapsed: bigint): bigint {
  const amount = BigInt(a.amount), first = amount / 2n, duration = 60n * 86_400_000n;
  if (a.lock_months !== '0') return amount;
  const time = elapsed < 0n ? 0n : elapsed > duration ? duration : elapsed;
  return first + (amount - first) * time / duration;
}
