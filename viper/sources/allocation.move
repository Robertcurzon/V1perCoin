/// All initial buckets in V1PER base units. No allocation authority lives here.
module viper::allocation;
const INITIAL_SUPPLY: u64 = 1_000_000_000_000_000;
const FREE_CLAIMS: u64 = 100_000_000_000_000;
const PUBLIC_RESERVE: u64 = 100_000_000_000_000;
const INITIAL_LIQUIDITY: u64 = 200_000_000_000_000;
const LATER_LIQUIDITY: u64 = 150_000_000_000_000;
const COMMUNITY: u64 = 200_000_000_000_000;
const LOCK_REWARDS: u64 = 150_000_000_000_000;
const OPERATIONS: u64 = 100_000_000_000_000;
public fun initial_supply(): u64 { INITIAL_SUPPLY }
public fun free_claims(): u64 { FREE_CLAIMS }
public fun public_reserve(): u64 { PUBLIC_RESERVE }
public fun initial_liquidity(): u64 { INITIAL_LIQUIDITY }
public fun later_liquidity(): u64 { LATER_LIQUIDITY }
public fun community(): u64 { COMMUNITY }
public fun lock_rewards(): u64 { LOCK_REWARDS }
public fun operations(): u64 { OPERATIONS }
#[test]
fun buckets_sum_to_supply() {
    assert!(FREE_CLAIMS + PUBLIC_RESERVE + INITIAL_LIQUIDITY + LATER_LIQUIDITY + COMMUNITY + LOCK_REWARDS + OPERATIONS == INITIAL_SUPPLY);
}
