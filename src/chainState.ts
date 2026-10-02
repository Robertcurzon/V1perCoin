import type { ClientWithCoreApi } from '@mysten/sui/client';
import { normalizeStructTag } from '@mysten/sui/utils';
import { CurrencyBcs, VaultBcs, ClaimsBcs, ClockBcs } from './chainSchemas';
import { launch } from './manifest';

export const INITIAL_SUPPLY = 1_000_000_000_000_000n;
export function validateState(c: ReturnType<typeof CurrencyBcs.parse>, v: ReturnType<typeof VaultBcs.parse>, p: ReturnType<typeof ClaimsBcs.parse>) {
  if (c.id !== launch.currencyId.toLowerCase() || v.id !== launch.vaultId.toLowerCase() || p.id !== launch.claimsId.toLowerCase()) throw new Error('Object contents do not match configured IDs.');
  if (c.decimals !== 6 || c.symbol !== 'V1PR' || c.name !== 'Viper Coin' || c.supply?.$kind !== 'BurnOnly' || c.metadata_cap_id.$kind !== 'Deleted' || c.regulated.$kind !== 'Unregulated') throw new Error('Currency must be V1PR, unregulated, burn-only, with metadata authority deleted.');
  if (v.founder !== launch.founder.toLowerCase() || v.community !== launch.community.toLowerCase()) throw new Error('Fee destinations differ from the manifest.');
  if (BigInt(v.rewards) + BigInt(v.reward_committed) + BigInt(v.reward_paid) !== BigInt(v.reward_funded)) throw new Error('Reward accounting does not reconcile.');
  if (BigInt(c.supply.BurnOnly) > INITIAL_SUPPLY || BigInt(v.locks_closed) > BigInt(v.locks_opened) || BigInt(p.claimed) > BigInt(p.approved) || BigInt(p.approved) > 10_000n || BigInt(p.inventory) > 100_000_000_000_000n - BigInt(p.claimed) * 10_000_000_000n) throw new Error('Supply, claim or interaction counters are inconsistent.');
}
export async function readChainState(client: ClientWithCoreApi, signal = AbortSignal.timeout(20_000)) {
  const [currency, vault, pool, clock] = await Promise.all([
    client.core.getObject({ objectId: launch.currencyId, include: { content: true, previousTransaction: true }, signal }),
    client.core.getObject({ objectId: launch.vaultId, include: { content: true, previousTransaction: true }, signal }),
    client.core.getObject({ objectId: launch.claimsId, include: { content: true, previousTransaction: true }, signal }),
    client.core.getObject({ objectId: '0x6', include: { content: true }, signal }),
  ]);
  const expected = [`0x2::coin_registry::Currency<${launch.coinType}>`, `${launch.packageId}::lock_vault::Vault`, `${launch.packageId}::free_claims::Pool`, '0x2::clock::Clock'];
  const objects = [currency.object, vault.object, pool.object, clock.object];
  for (let i = 0; i < objects.length; i++) {
    if (normalizeStructTag(objects[i].type) !== normalizeStructTag(expected[i]) || objects[i].owner.$kind !== 'Shared') throw new Error('Object type or shared ownership differs from the release specification.');
  }
  const c = CurrencyBcs.parse(currency.object.content), v = VaultBcs.parse(vault.object.content), p = ClaimsBcs.parse(pool.object.content);
  validateState(c, v, p);
  const time = BigInt(ClockBcs.parse(clock.object.content).timestamp_ms);
  if (time > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('Chain clock is out of range.');
  return { c, v, p, time, objects: objects.slice(0, 3).map((o, i) => ({ label: ['Currency / supply', 'Reward vault', 'Free claims'][i], id: o.objectId, version: o.version, digest: o.previousTransaction })) };
}
