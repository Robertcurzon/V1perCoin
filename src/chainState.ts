import { ObjectError, type ClientWithCoreApi } from '@mysten/sui/client';
import { normalizeStructTag } from '@mysten/sui/utils';
import { CurrencyBcs, VaultBcs, ClaimsBcs, ClockBcs, FeastBcs } from './chainSchemas';
import { launch } from './manifest';

export const INITIAL_SUPPLY = 1_000_000_000_000_000n;
export function validateState(c: ReturnType<typeof CurrencyBcs.parse>, v: ReturnType<typeof VaultBcs.parse>, p: ReturnType<typeof ClaimsBcs.parse>, f: ReturnType<typeof FeastBcs.parse>) {
  if (c.id !== launch.currencyId.toLowerCase() || v.id !== launch.vaultId.toLowerCase() || p.id !== launch.claimsId.toLowerCase() || f.id !== launch.feastId.toLowerCase()) throw new Error('Object contents do not match configured IDs.');
  if (c.decimals !== 6 || c.symbol !== 'V1PR' || c.name !== 'Viper Coin' || c.supply?.$kind !== 'BurnOnly' || c.metadata_cap_id.$kind !== 'Deleted' || c.regulated.$kind !== 'Unregulated') throw new Error('Currency must be V1PR, unregulated, burn-only, with metadata authority deleted.');
  if (v.founder !== launch.founder.toLowerCase() || v.community !== launch.community.toLowerCase()) throw new Error('Fee destinations differ from the manifest.');
  if (BigInt(v.rewards) + BigInt(v.reward_committed) + BigInt(v.reward_paid) !== BigInt(v.reward_funded)) throw new Error('Reward accounting does not reconcile.');
  if (BigInt(c.supply.BurnOnly) > INITIAL_SUPPLY || BigInt(v.locks_closed) > BigInt(v.locks_opened) || BigInt(p.claimed) > BigInt(p.approved) || BigInt(p.approved) > 10_000n || BigInt(p.inventory) > 100_000_000_000_000n - BigInt(p.claimed) * 10_000_000_000n) throw new Error('Supply, claim or interaction counters are inconsistent.');
  if (BigInt(f.inventory) + BigInt(f.claimed) + BigInt(f.burned) !== 100_000_000_000_000n || BigInt(f.allocated) > 100_000_000_000_000n || BigInt(f.claimed) > BigInt(f.allocated) || (!f.finalized && (BigInt(f.claimed) !== 0n || BigInt(f.burned) !== 0n || BigInt(f.start_ms) !== 0n)) || (f.finalized && BigInt(f.inventory) > BigInt(f.allocated) - BigInt(f.claimed))) throw new Error('Feast accounting does not reconcile.');
}
export function objectAbsent(error: unknown): boolean {
  return error instanceof ObjectError && (error.reason === 'notFound' || error.reason === 'deleted');
}
export async function verifyUpgradeCap(client: ClientWithCoreApi, id: string, signal: AbortSignal) {
  try { await client.core.getObject({ objectId: id, signal }); }
  catch (error) {
    if (objectAbsent(error) && (error as ObjectError).objectId?.toLowerCase() === id.toLowerCase()) return;
    throw new Error('Upgrade capability absence could not be verified. Network/unknown errors are not proof of immutability.');
  }
  throw new Error('Upgrade capability still exists; package immutability is required.');
}
export async function readChainState(client: ClientWithCoreApi, signal = AbortSignal.timeout(20_000)) {
  const [currency, vault, pool, clock, feast] = await Promise.all([
    client.core.getObject({ objectId: launch.currencyId, include: { content: true, previousTransaction: true }, signal }),
    client.core.getObject({ objectId: launch.vaultId, include: { content: true, previousTransaction: true }, signal }),
    client.core.getObject({ objectId: launch.claimsId, include: { content: true, previousTransaction: true }, signal }),
    client.core.getObject({ objectId: '0x6', include: { content: true }, signal }),
    client.core.getObject({ objectId: launch.feastId, include: { content: true, previousTransaction: true }, signal }),
    verifyUpgradeCap(client, launch.upgradeCapId, signal),
  ]);
  const expected = [`0x2::coin_registry::Currency<${launch.coinType}>`, `${launch.packageId}::lock_vault::Vault`, `${launch.packageId}::free_claims::Pool`, '0x2::clock::Clock', `${launch.packageId}::feast::Pool`];
  const objects = [currency.object, vault.object, pool.object, clock.object, feast.object];
  for (let i = 0; i < objects.length; i++) {
    if (normalizeStructTag(objects[i].type) !== normalizeStructTag(expected[i]) || objects[i].owner.$kind !== 'Shared') throw new Error('Object type or shared ownership differs from the release specification.');
  }
  const c = CurrencyBcs.parse(currency.object.content), v = VaultBcs.parse(vault.object.content), p = ClaimsBcs.parse(pool.object.content);
  const f = FeastBcs.parse(feast.object.content);
  validateState(c, v, p, f);
  const time = BigInt(ClockBcs.parse(clock.object.content).timestamp_ms);
  if (time > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('Chain clock is out of range.');
  return { c, v, p, f, time, objects: [objects[0], objects[1], objects[2], objects[4]].map((o, i) => ({ label: ['Currency / supply', 'Reward vault', 'Free claims', 'Feast claims'][i], id: o.objectId, version: o.version, digest: o.previousTransaction })) };
}
