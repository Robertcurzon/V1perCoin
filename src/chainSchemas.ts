import { bcs } from '@mysten/sui/bcs';
export const PositionBcs = bcs.struct('Position', {
  id: bcs.Address, vault: bcs.Address, owner: bcs.Address,
  principal: bcs.u64(), reward: bcs.u64(), start_ms: bcs.u64(), duration_ms: bcs.u64(),
});
export const VaultBcs = bcs.struct('Vault', {
  id: bcs.Address, rewards: bcs.u64(), community: bcs.Address, founder: bcs.Address,
  paused: bcs.bool(), total_locked: bcs.u64(), reward_committed: bcs.u64(),
  reward_paid: bcs.u64(), reward_funded: bcs.u64(), community_paid: bcs.u64(), founder_paid: bcs.u64(), burned: bcs.u64(), pending_burn: bcs.u64(), locks_opened: bcs.u64(), locks_closed: bcs.u64(), opens_at_ms: bcs.u64(), feast_committed: bcs.u64(),
});
export const ClockBcs = bcs.struct('Clock', { id: bcs.Address, timestamp_ms: bcs.u64() });

export const ClaimsBcs = bcs.struct('Pool', {
  id: bcs.Address, inventory: bcs.u64(),
  eligibility: bcs.struct('Table', { id: bcs.Address, size: bcs.u64() }),
  approved: bcs.u64(), claimed: bcs.u64(), start_ms: bcs.u64(), end_ms: bcs.u64(),
});
export const CurrencyBcs = bcs.struct('Currency', {
  id: bcs.Address, decimals: bcs.u8(), name: bcs.string(), symbol: bcs.string(),
  description: bcs.string(), icon_url: bcs.string(),
  supply: bcs.option(bcs.enum('SupplyState', { Fixed: bcs.u64(), BurnOnly: bcs.u64(), Unknown: null })),
  regulated: bcs.enum('RegulatedState', {
    Regulated: bcs.struct('Regulated', { cap: bcs.Address, allow_global_pause: bcs.option(bcs.bool()), variant: bcs.u8() }),
    Unregulated: null, Unknown: null,
  }),
  treasury_cap_id: bcs.option(bcs.Address),
  metadata_cap_id: bcs.enum('MetadataCapState', { Claimed: bcs.Address, Unclaimed: null, Deleted: null }),
  extra_fields: bcs.vector(bcs.struct('Entry', {
    key: bcs.string(), value: bcs.struct('ExtraField', { typeName: bcs.string(), bytes: bcs.vector(bcs.u8()) }),
  })),
});

export const FeastAllocationBcs = bcs.struct('Allocation', { amount: bcs.u64(), claimed: bcs.u64(), lock_months: bcs.u64() });
export const FeastBcs = bcs.struct('Pool', {
  id: bcs.Address, inventory: bcs.u64(), allocations: bcs.struct('Table', { id: bcs.Address, size: bcs.u64() }),
  allocated: bcs.u64(), claimed: bcs.u64(), burned: bcs.u64(), finalized: bcs.bool(), start_ms: bcs.u64(),
  allocations_hash: bcs.vector(bcs.u8()), last_change_ms: bcs.u64(), locked_reward_required: bcs.u64(), reward_reserve: bcs.u64(), reservation_vault: bcs.option(bcs.Address),
});
