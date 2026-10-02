/// Fixed-size, administrator-approved claims from existing inventory; no paid referrals.
module viper::free_claims;
use sui::balance::Balance;
use sui::coin::{Self, Coin};
use sui::clock::Clock;
use sui::event;
use sui::table::{Self, Table};
use viper::v1pr::V1PR;

const EClaim: u64 = 1;
const EAdmin: u64 = 2;
const CLAIM: u64 = 10_000_000_000;
const WINDOW_MS: u64 = 7_776_000_000; // 90 days
public struct Pool has key { id: UID, inventory: Balance<V1PR>, eligibility: Table<address, bool>, approved: u64, claimed: u64, end_ms: u64 }
public struct AdminCap has key, store { id: UID, pool: ID }
public struct Claimed has copy, drop { pool: ID, timestamp_ms: u64, owner: address, amount: u64 }
public struct ClaimsBurned has copy, drop { pool: ID, timestamp_ms: u64, amount: u64 }

public(package) fun create(fund: Coin<V1PR>, clock: &Clock, ctx: &mut TxContext): (Pool, AdminCap) {
    assert!(fund.value() == 100_000_000_000_000, EClaim);
    let pool = Pool { id: object::new(ctx), inventory: fund.into_balance(), eligibility: table::new(ctx), approved: 0, claimed: 0, end_ms: clock.timestamp_ms() + WINDOW_MS };
    let cap = AdminCap { id: object::new(ctx), pool: object::id(&pool) };
    (pool, cap)
}
public fun approve(pool: &mut Pool, cap: &AdminCap, addresses: vector<address>, clock: &Clock) {
    assert!(cap.pool == object::id(pool), EAdmin);
    assert!(clock.timestamp_ms() < pool.end_ms, EClaim);
    addresses.do!(|address| {
        assert!(address != @0x0 && pool.approved < 10_000 && !pool.eligibility.contains(address), EClaim);
        pool.eligibility.add(address, false);
        pool.approved = pool.approved + 1;
    });
}
public fun claim(pool: &mut Pool, clock: &Clock, ctx: &mut TxContext) {
    let sender = ctx.sender();
    assert!(clock.timestamp_ms() < pool.end_ms && pool.eligibility.contains(sender), EClaim);
    assert!(!pool.eligibility[sender], EClaim);
    *pool.eligibility.borrow_mut(sender) = true;
    pool.claimed = pool.claimed + 1;
    event::emit(Claimed { pool: object::id(pool), timestamp_ms: clock.timestamp_ms(), owner: sender, amount: CLAIM });
    transfer::public_transfer(coin::from_balance(pool.inventory.split(CLAIM), ctx), sender);
}
/// Anyone may burn unclaimed inventory after the fixed 90-day window.
public fun burn_unclaimed(pool: &mut Pool, currency: &mut sui::coin_registry::Currency<V1PR>, clock: &Clock) {
    assert!(clock.timestamp_ms() >= pool.end_ms, EClaim);
    let remaining = pool.inventory.value();
    currency.burn_balance(pool.inventory.split(remaining));
    if (remaining > 0) event::emit(ClaimsBurned { pool: object::id(pool), timestamp_ms: clock.timestamp_ms(), amount: remaining });
}
/// No administrator sweep or mint path.
public fun remaining(pool: &Pool): u64 { pool.inventory.value() }

public(package) fun share(pool: Pool) { transfer::share_object(pool); }

#[test]
fun approved_claim_receives_exact_amount() {
    let mut scenario = sui::test_scenario::begin(@0xA);
    let clock = sui::clock::create_for_testing(scenario.ctx());
    let (mut pool, cap) = create(coin::mint_for_testing<V1PR>(100_000_000_000_000, scenario.ctx()), &clock, scenario.ctx());
    approve(&mut pool, &cap, vector[@0xA], &clock);
    claim(&mut pool, &clock, scenario.ctx());
    assert!(pool.claimed == 1 && remaining(&pool) == 99_990_000_000_000);
    let events = event::events_by_type<Claimed>();
    assert!(events.length() == 1 && events[0].pool == object::id(&pool) && events[0].owner == @0xA && events[0].amount == CLAIM);
    scenario.next_tx(@0xA);
    let payout = scenario.take_from_sender<Coin<V1PR>>();
    assert!(payout.value() == CLAIM);
    coin::burn_for_testing(payout);
    std::unit_test::destroy(pool); std::unit_test::destroy(cap);
    sui::clock::destroy_for_testing(clock); scenario.end();
}
#[test, expected_failure(abort_code = EClaim)]
fun repeated_claim_fails() {
    let mut scenario = sui::test_scenario::begin(@0xA);
    let clock = sui::clock::create_for_testing(scenario.ctx());
    let (mut pool, cap) = create(coin::mint_for_testing<V1PR>(100_000_000_000_000, scenario.ctx()), &clock, scenario.ctx());
    approve(&mut pool, &cap, vector[@0xA], &clock);
    claim(&mut pool, &clock, scenario.ctx());
    claim(&mut pool, &clock, scenario.ctx()); abort 999
}
#[test, expected_failure(abort_code = EClaim)]
fun claim_window_expiry_is_enforced() {
    let mut scenario = sui::test_scenario::begin(@0xA);
    let mut clock = sui::clock::create_for_testing(scenario.ctx());
    let (mut pool, cap) = create(coin::mint_for_testing<V1PR>(100_000_000_000_000, scenario.ctx()), &clock, scenario.ctx());
    approve(&mut pool, &cap, vector[@0xA], &clock);
    sui::clock::set_for_testing(&mut clock, WINDOW_MS);
    claim(&mut pool, &clock, scenario.ctx()); abort 999
}
#[test, expected_failure(abort_code = EClaim)]
fun unapproved_claim_fails() {
    let mut scenario = sui::test_scenario::begin(@0xA);
    let clock = sui::clock::create_for_testing(scenario.ctx());
    let (mut pool, _cap) = create(coin::mint_for_testing<V1PR>(100_000_000_000_000, scenario.ctx()), &clock, scenario.ctx());
    claim(&mut pool, &clock, scenario.ctx()); abort 999
}
#[test]
fun unclaimed_tokens_are_actually_burned() {
    let mut ctx = tx_context::dummy();
    let mut clock = sui::clock::create_for_testing(&mut ctx);
    let (mut currency, metadata) = viper::v1pr::test_currency(&mut ctx);
    let (mut pool, cap) = create(coin::mint_for_testing<V1PR>(100_000_000_000_000, &mut ctx), &clock, &mut ctx);
    sui::clock::set_for_testing(&mut clock, WINDOW_MS);
    burn_unclaimed(&mut pool, &mut currency, &clock);
    assert!(remaining(&pool) == 0 && currency.total_supply().destroy_some() == 900_000_000_000_000);
    let events = event::events_by_type<ClaimsBurned>();
    assert!(events.length() == 1 && events[0].amount == 100_000_000_000_000 && events[0].timestamp_ms == WINDOW_MS);
    std::unit_test::destroy(pool); std::unit_test::destroy(cap);
    std::unit_test::destroy(currency); std::unit_test::destroy(metadata);
    sui::clock::destroy_for_testing(clock);
}
