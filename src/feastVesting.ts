import type { ClientWithCoreApi, SuiClientTypes } from '@mysten/sui/client';
import { normalizeStructTag } from '@mysten/sui/utils';
import { FeastAllocationBcs, FeastBcs } from './chainSchemas';
import { launch } from './manifest';
// Read the complete, frozen allocation table once; subsequent totals use fresh chain time.
export async function readVestingSchedule(client: ClientWithCoreApi, pool: ReturnType<typeof FeastBcs.parse>, signal = AbortSignal.timeout(60_000)) {
  if (!pool.finalized) throw new Error('Vesting begins only after finalization.');
  let cursor: string | null = null;
  const seen = new Set<string>();
  const allocations: ReturnType<typeof FeastAllocationBcs.parse>[] = [];
  do {
    const page: SuiClientTypes.ListDynamicFieldsResponse = await client.core.listDynamicFields({ parentId: pool.allocations.id, limit: 100, cursor, signal });
    for (let i = 0; i < page.dynamicFields.length; i += 10) {
      const batch = page.dynamicFields.slice(i, i + 10);
      const values = await Promise.all(batch.map(async field => {
        if (field.$kind !== 'DynamicField' || field.name.type !== 'address' || normalizeStructTag(field.valueType) !== normalizeStructTag(`${launch.packageId}::feast::Allocation`) || seen.has(field.fieldId)) throw new Error('Allocation table entry does not match the release.');
        seen.add(field.fieldId);
        const value = await client.core.getDynamicField({ parentId: pool.allocations.id, name: field.name, signal });
        if (normalizeStructTag(value.dynamicField.value.type) !== normalizeStructTag(`${launch.packageId}::feast::Allocation`)) throw new Error('Allocation value type mismatch.');
        const allocation = FeastAllocationBcs.parse(value.dynamicField.value.bcs);
        if (BigInt(allocation.amount) === 0n || BigInt(allocation.claimed) > BigInt(allocation.amount) || !['0','12','24'].includes(allocation.lock_months)) throw new Error('Allocation counters are invalid.');
        return allocation;
      }));
      allocations.push(...values);
    }
    if (page.hasNextPage && (!page.cursor || page.cursor === cursor)) throw new Error('Allocation pagination made no progress.');
    cursor = page.hasNextPage ? page.cursor : null;
  } while (cursor);
  if (BigInt(allocations.length) !== BigInt(pool.allocations.size) || allocations.reduce((n,a) => n + BigInt(a.amount), 0n) !== BigInt(pool.allocated)) throw new Error('Complete allocation table does not reconcile.');
  return allocations;
}
