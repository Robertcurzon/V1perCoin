import { ObjectError, type ClientWithCoreApi } from '@mysten/sui/client';
import { normalizeStructTag, normalizeSuiAddress } from '@mysten/sui/utils';
import { CurrencyBcs, VaultBcs, ClaimsBcs, ClockBcs, FeastBcs } from './chainSchemas';
import { launch } from './manifest';

export const INITIAL_SUPPLY = 1_000_000_000_000_000n;
export function validateState(c: ReturnType<typeof CurrencyBcs.parse>, v: ReturnType<typeof VaultBcs.parse>, p: ReturnType<typeof ClaimsBcs.parse>, f: ReturnType<typeof FeastBcs.parse>, manifest = launch) {
  if (c.id !== manifest.currencyId.toLowerCase() || v.id !== manifest.vaultId.toLowerCase() || p.id !== manifest.claimsId.toLowerCase() || f.id !== manifest.feastId.toLowerCase()) throw new Error('Object contents do not match configured IDs.');
  if (c.decimals !== 6 || c.symbol !== 'V1PER' || c.name !== 'V1PER Coin' || c.supply?.$kind !== 'BurnOnly' || c.metadata_cap_id.$kind !== 'Deleted' || c.regulated.$kind !== 'Unregulated') throw new Error('Currency must be V1PER, unregulated, burn-only, with metadata authority deleted.');
  if (v.founder !== manifest.founder.toLowerCase() || v.community !== manifest.community.toLowerCase()) throw new Error('Fee destinations differ from the manifest.');
  if (BigInt(v.opens_at_ms) !== BigInt(manifest.vaultOpensAtMs) || BigInt(v.feast_committed) !== BigInt(f.reward_reserve) || BigInt(v.feast_committed) > BigInt(v.reward_committed)) throw new Error('Vault opening or Feast reservation differs from the release.');
  if (BigInt(v.rewards) + BigInt(v.reward_committed) + BigInt(v.reward_paid) !== BigInt(v.reward_funded)) throw new Error('Reward accounting does not reconcile.');
  if (BigInt(c.supply.BurnOnly) > INITIAL_SUPPLY || BigInt(v.locks_closed) > BigInt(v.locks_opened) || BigInt(p.claimed) > BigInt(p.approved) || BigInt(p.approved) > 10_000n || BigInt(p.inventory) > 100_000_000_000_000n - BigInt(p.claimed) * 10_000_000_000n) throw new Error('Supply, claim or interaction counters are inconsistent.');
  if ((BigInt(p.end_ms) === 0n && (BigInt(p.start_ms) !== 0n || BigInt(p.claimed) !== 0n)) || (BigInt(p.end_ms) > 0n && BigInt(p.end_ms) - BigInt(p.start_ms) !== 14n * 86_400_000n) || BigInt(p.eligibility.size) !== BigInt(p.approved)) throw new Error('Free-claim schedule or eligibility count is inconsistent.');
  if (BigInt(f.inventory) + BigInt(f.claimed) + BigInt(f.burned) !== 100_000_000_000_000n || BigInt(f.allocated) > 100_000_000_000_000n || BigInt(f.claimed) > BigInt(f.allocated) || (!f.finalized && (BigInt(f.claimed) !== 0n || (!f.abandoned && BigInt(f.burned) !== 0n) || BigInt(f.start_ms) !== 0n)) || (f.finalized && BigInt(f.inventory) > BigInt(f.allocated) - BigInt(f.claimed))) throw new Error('Feast accounting does not reconcile.');
  if(BigInt(p.schedule_deadline_ms)===0n || BigInt(f.finalize_deadline_ms)===0n || (p.abandoned && (BigInt(p.end_ms)!==0n || BigInt(p.inventory)!==0n)) || (f.abandoned && (f.finalized || BigInt(f.inventory)!==0n || BigInt(f.reward_reserve)!==0n)))throw new Error('Pool abandonment state is inconsistent.');
  if(f.finalized && (f.running_hash.join(',')!==f.allocations_hash.join(',') || BigInt(f.uploaded_rows)!==BigInt(f.committed_rows) || BigInt(f.uploaded_rows)!==BigInt(f.allocations.size)))throw new Error('Finalized allocation commitment differs from the table.');
  if (![0,32].includes(f.allocations_hash.length) || BigInt(f.reward_reserve) > BigInt(f.locked_reward_required) || (!f.finalized && (f.reservation_vault !== null || BigInt(f.reward_reserve) !== 0n)) || (f.finalized && (f.allocations_hash.length !== 32 || f.reservation_vault !== manifest.vaultId.toLowerCase() || BigInt(f.start_ms) < BigInt(f.last_change_ms) + 7n*86400000n))) throw new Error('Feast commitment or review timelock is inconsistent.');
}
export function objectAbsent(error: unknown): boolean {
  return error instanceof ObjectError && (error.reason === 'notFound' || error.reason === 'deleted');
}
export async function verifyUpgradeCap(client: ClientWithCoreApi, manifest: typeof launch, signal: AbortSignal) {
  const id=normalizeSuiAddress(manifest.upgradeCapId), packageId=normalizeSuiAddress(manifest.packageId);
  if(id===packageId)throw new Error('Package and UpgradeCap IDs must differ.');
  const include={effects:true,transaction:true,objectTypes:true} as const;
  const [published,immutable]=await Promise.all([
    client.core.getTransaction({digest:manifest.publishDigest,include,signal}),
    client.core.getTransaction({digest:manifest.immutableDigest,include,signal}),
  ]);
  if(!published.Transaction || !immutable.Transaction) throw new Error('Lifecycle transactions must succeed.');
  const p=published.Transaction,i=immutable.Transaction;
  if(p.digest!==manifest.publishDigest||i.digest!==manifest.immutableDigest||!p.status.success||!i.status.success)throw new Error('Lifecycle receipt mismatch.');
  // A single framework Publish creates one package and its one UpgradeCap.
  // Requiring the untouched creation reference excludes transferred/upgraded caps.
  const caps=p.effects.changedObjects.filter(o=>o.idOperation==='Created' && p.objectTypes[o.objectId] && normalizeStructTag(p.objectTypes[o.objectId])===normalizeStructTag('0x2::package::UpgradeCap'));
  const packages=p.effects.changedObjects.filter(o=>o.outputState==='PackageWrite' && o.idOperation==='Created');
  if(p.transaction.commands.filter(c=>'Publish' in c).length!==1 || p.transaction.commands.some(c=>!('Publish' in c || 'TransferObjects' in c)) || caps.length!==1 || normalizeSuiAddress(caps[0].objectId)!==id || caps[0].inputState!=='DoesNotExist' || caps[0].outputState!=='ObjectWrite' || packages.length!==1 || normalizeSuiAddress(packages[0].objectId)!==packageId)throw new Error('Publication does not create the configured package and UpgradeCap.');
  const deleted=i.effects.changedObjects.find(o=>normalizeSuiAddress(o.objectId)===id && o.idOperation==='Deleted' && o.inputState==='Exists' && o.outputState==='DoesNotExist');
  if(!deleted || deleted.inputVersion!==caps[0].outputVersion || deleted.inputDigest!==caps[0].outputDigest)throw new Error('Immutability must delete the untouched published UpgradeCap.');
  const calls=i.transaction.commands.filter(c=>'MoveCall' in c && normalizeSuiAddress(c.MoveCall.package)===normalizeSuiAddress('0x2') && c.MoveCall.module==='package' && c.MoveCall.function==='make_immutable');
  const call=calls.find(c=>{
    if(!('MoveCall' in c)||c.MoveCall.arguments.length!==1)return false;
    const arg=c.MoveCall.arguments[0];if(!('Input' in arg))return false;
    const input=i.transaction.inputs[arg.Input];
    return input && 'Object' in input && 'ImmOrOwnedObject' in input.Object && normalizeSuiAddress(input.Object.ImmOrOwnedObject.objectId)===id;
  });
  if(!call)throw new Error('Immutability receipt must call make_immutable on the same UpgradeCap.');
  try { await client.core.getObject({ objectId: id, signal }); }
  catch (error) {
    if (objectAbsent(error) && normalizeSuiAddress((error as ObjectError).objectId??'0x0')===id) return;
    throw new Error('Upgrade capability deletion unavailable; RPC errors fail closed.');
  }
  throw new Error('Upgrade capability still exists.');
}
export async function readChainState(client: ClientWithCoreApi, signal = AbortSignal.timeout(20_000), manifest = launch) {
  const [currency, vault, pool, clock, feast] = await Promise.all([
    client.core.getObject({ objectId: manifest.currencyId, include: { content: true, previousTransaction: true }, signal }),
    client.core.getObject({ objectId: manifest.vaultId, include: { content: true, previousTransaction: true }, signal }),
    client.core.getObject({ objectId: manifest.claimsId, include: { content: true, previousTransaction: true }, signal }),
    client.core.getObject({ objectId: '0x6', include: { content: true }, signal }),
    client.core.getObject({ objectId: manifest.feastId, include: { content: true, previousTransaction: true }, signal }),
    verifyUpgradeCap(client, manifest, signal),
  ]);
  const expected = [`0x2::coin_registry::Currency<${manifest.coinType}>`, `${manifest.packageId}::lock_vault::Vault`, `${manifest.packageId}::free_claims::Pool`, '0x2::clock::Clock', `${manifest.packageId}::feast::Pool`];
  const objects = [currency.object, vault.object, pool.object, clock.object, feast.object];
  for (let i = 0; i < objects.length; i++) {
    if (normalizeStructTag(objects[i].type) !== normalizeStructTag(expected[i]) || objects[i].owner.$kind !== 'Shared') throw new Error('Object type or shared ownership differs from the release specification.');
  }
  const c = CurrencyBcs.parse(currency.object.content), v = VaultBcs.parse(vault.object.content), p = ClaimsBcs.parse(pool.object.content);
  const f = FeastBcs.parse(feast.object.content);
  if (BigInt(p.end_ms) > 0n && BigInt(p.start_ms) !== BigInt(manifest.freeClaimsStartMs)) throw new Error('Free-claim dates differ from the published schedule.');
  validateState(c, v, p, f, manifest);
  const time = BigInt(ClockBcs.parse(clock.object.content).timestamp_ms);
  if (time > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('Chain clock is out of range.');
  return { c, v, p, f, time, objects: [objects[0], objects[1], objects[2], objects[4]].map((o, i) => ({ label: ['Currency / supply', 'Reward vault', 'Free claims', 'Feast claims'][i], id: o.objectId, version: o.version, digest: o.previousTransaction })) };
}
