/// Existing-inventory Feast claims. No minting or administrator sweep.
module viper::feast;
use sui::balance::Balance;
use sui::coin::{Self, Coin};
use sui::clock::Clock;
use sui::coin_registry::Currency;
use sui::event;
use sui::table::{Self, Table};
use viper::v1pr::V1PR;
use viper::lock_vault::Vault;
const EAdmin: u64 = 1;
const EState: u64 = 2;
const EAllocation: u64 = 3;
const EClaim: u64 = 4;
const DAY_MS: u64 = 86_400_000;
const VEST_MS: u64 = 60 * DAY_MS;
const WINDOW_MS: u64 = 90 * DAY_MS;
public struct Allocation has copy, drop, store { amount: u64, claimed: u64, lock_months: u64 }
public struct Pool has key {
    id: UID, inventory: Balance<V1PR>, allocations: Table<address, Allocation>,
    allocated: u64, claimed: u64, burned: u64, finalized: bool, start_ms: u64,
}
public struct AdminCap has key, store { id: UID, pool: ID }
public struct AllocationsSet has copy, drop { pool: ID, timestamp_ms: u64, allocated: u64 }
public struct Finalized has copy, drop { pool: ID, timestamp_ms: u64, allocated: u64, burned: u64 }
public struct Claimed has copy, drop { pool: ID, timestamp_ms: u64, owner: address, amount: u64, lock_months: u64 }
public struct ClaimsBurned has copy, drop { pool: ID, timestamp_ms: u64, amount: u64 }
public(package) fun create(fund: Coin<V1PR>, ctx: &mut TxContext): (Pool, AdminCap) {
    assert!(fund.value() == viper::allocation::public_reserve(), EAllocation);
    let pool = Pool { id: object::new(ctx), inventory: fund.into_balance(), allocations: table::new(ctx), allocated: 0, claimed: 0, burned: 0, finalized: false, start_ms: 0 };
    let cap = AdminCap { id: object::new(ctx), pool: object::id(&pool) };
    (pool, cap)
}
public fun set_allocations(pool: &mut Pool, cap: &AdminCap, addresses: vector<address>, amounts: vector<u64>, lock_months: vector<u64>, clock: &Clock) {
    assert!(cap.pool == object::id(pool), EAdmin);
    assert!(!pool.finalized, EState);
    assert!(addresses.length() == amounts.length() && addresses.length() == lock_months.length(), EAllocation);
    let mut i = 0;
    while (i < addresses.length()) {
        let address = addresses[i]; let amount = amounts[i]; let term = lock_months[i];
        assert!(address != @0x0 && amount > 0 && (term == 0 || term == 12 || term == 24), EAllocation);
        let mut j = 0;
        while (j < i) { assert!(addresses[j] != address, EAllocation); j = j + 1; };
        let old = if (pool.allocations.contains(address)) pool.allocations.remove(address).amount else 0;
        let remaining = viper::allocation::public_reserve() - (pool.allocated - old);
        assert!(amount <= remaining, EAllocation);
        pool.allocated = pool.allocated - old + amount;
        pool.allocations.add(address, Allocation { amount, claimed: 0, lock_months: term });
        i = i + 1;
    };
    event::emit(AllocationsSet { pool: object::id(pool), timestamp_ms: clock.timestamp_ms(), allocated: pool.allocated });
}
public fun finalize(pool: &mut Pool, cap: &AdminCap, currency: &mut Currency<V1PR>, clock: &Clock) {
    assert!(cap.pool == object::id(pool), EAdmin);
    assert!(!pool.finalized, EState);
    pool.finalized = true; pool.start_ms = clock.timestamp_ms();
    let amount = pool.inventory.value() - pool.allocated;
    currency.burn_balance(pool.inventory.split(amount)); pool.burned = pool.burned + amount;
    event::emit(Finalized { pool: object::id(pool), timestamp_ms: pool.start_ms, allocated: pool.allocated, burned: amount });
}
fun assert_window(pool: &Pool, clock: &Clock) {
    assert!(pool.finalized && clock.timestamp_ms() >= pool.start_ms && clock.timestamp_ms() < pool.start_ms + WINDOW_MS, EState);
}
public fun vested_amount(amount: u64, elapsed_ms: u64): u64 {
    let first = amount / 2;
    let elapsed = if (elapsed_ms >= VEST_MS) VEST_MS else elapsed_ms;
    first + (((amount - first) as u128) * (elapsed as u128) / (VEST_MS as u128) as u64)
}
#[allow(lint(self_transfer))]
public fun claim(pool: &mut Pool, clock: &Clock, ctx: &mut TxContext) {
    assert_window(pool, clock);
    let sender = ctx.sender(); assert!(pool.allocations.contains(sender), EClaim);
    let entry = pool.allocations.borrow_mut(sender); assert!(entry.lock_months == 0, EClaim);
    let vested = vested_amount(entry.amount, clock.timestamp_ms() - pool.start_ms);
    let amount = vested - entry.claimed; assert!(amount > 0, EClaim); entry.claimed = vested;
    pool.claimed = pool.claimed + amount;
    transfer::public_transfer(coin::from_balance(pool.inventory.split(amount), ctx), sender);
    event::emit(Claimed { pool: object::id(pool), timestamp_ms: clock.timestamp_ms(), owner: sender, amount, lock_months: 0 });
}
public fun claim_locked(pool: &mut Pool, vault: &mut Vault, clock: &Clock, ctx: &mut TxContext) {
    assert_window(pool, clock);
    let sender = ctx.sender(); assert!(pool.allocations.contains(sender), EClaim);
    let entry = pool.allocations.borrow_mut(sender);
    assert!(entry.lock_months != 0 && entry.claimed == 0, EClaim);
    let amount = entry.amount; let term = entry.lock_months; entry.claimed = amount;
    pool.claimed = pool.claimed + amount;
    viper::lock_vault::deposit(vault, coin::from_balance(pool.inventory.split(amount), ctx), term, clock, ctx);
    event::emit(Claimed { pool: object::id(pool), timestamp_ms: clock.timestamp_ms(), owner: sender, amount, lock_months: term });
}
public fun burn_unclaimed(pool: &mut Pool, currency: &mut Currency<V1PR>, clock: &Clock) {
    assert!(pool.finalized && clock.timestamp_ms() >= pool.start_ms + WINDOW_MS, EState);
    let amount = pool.inventory.value(); currency.burn_balance(pool.inventory.split(amount)); pool.burned = pool.burned + amount;
    if (amount > 0) event::emit(ClaimsBurned { pool: object::id(pool), timestamp_ms: clock.timestamp_ms(), amount });
}
public fun accounting(pool: &Pool): (u64,u64,u64,u64) { (pool.inventory.value(),pool.allocated,pool.claimed,pool.burned) }
public(package) fun share(pool: Pool) { transfer::share_object(pool); }
#[test_only]
fun setup(ctx: &mut TxContext): (Pool,AdminCap) { create(coin::mint_for_testing<V1PR>(viper::allocation::public_reserve(),ctx),ctx) }
#[test]
fun vesting_rounds_and_boundaries() {
    assert!(vested_amount(1_000,0) == 500);
    assert!(vested_amount(1_000,30*DAY_MS) == 750);
    assert!(vested_amount(1_000,60*DAY_MS) == 1_000);
    assert!(vested_amount(1_001,60*DAY_MS+1) == 1_001);
}
#[test]
fun liquid_claims_and_expiry_reconcile() {
    let mut s = sui::test_scenario::begin(@0xA); let mut clock = sui::clock::create_for_testing(s.ctx());
    let (mut currency, metadata) = viper::v1pr::test_currency(s.ctx()); let (mut pool, cap) = setup(s.ctx());
    set_allocations(&mut pool,&cap,vector[@0xA],vector[1_000],vector[0],&clock);
    finalize(&mut pool,&cap,&mut currency,&clock);
    let times = vector[0,30*DAY_MS,60*DAY_MS]; let expected = vector[500,250,250]; let mut i = 0;
    while (i < 3) {
        sui::clock::set_for_testing(&mut clock,times[i]); claim(&mut pool,&clock,s.ctx()); s.next_tx(@0xA);
        let coin = s.take_from_sender<Coin<V1PR>>(); assert!(coin.value() == expected[i]); coin::burn_for_testing(coin);
        assert!(pool.inventory.value()+pool.claimed+pool.burned == viper::allocation::public_reserve()); i = i+1;
    };
    sui::clock::set_for_testing(&mut clock,WINDOW_MS); burn_unclaimed(&mut pool,&mut currency,&clock);
    assert!(pool.inventory.value() == 0 && pool.claimed == 1_000);
    std::unit_test::destroy(pool);std::unit_test::destroy(cap);std::unit_test::destroy(currency);std::unit_test::destroy(metadata);sui::clock::destroy_for_testing(clock);s.end();
}
#[test_only]
fun check_locked_claim(term: u64) {
    let mut s = sui::test_scenario::begin(@0xA); let clock = sui::clock::create_for_testing(s.ctx());
    let (mut currency, metadata) = viper::v1pr::test_currency(s.ctx()); let (mut pool,cap) = setup(s.ctx());
    let (mut vault, vcap) = viper::lock_vault::create(coin::mint_for_testing<V1PR>(viper::allocation::lock_rewards(),s.ctx()),@0xC,@0xF,s.ctx());
    set_allocations(&mut pool,&cap,vector[@0xA],vector[1_000_000_000],vector[term],&clock); finalize(&mut pool,&cap,&mut currency,&clock);
    claim_locked(&mut pool,&mut vault,&clock,s.ctx()); s.next_tx(@0xA);
    let p = s.take_from_sender<viper::lock_vault::Position>();
    let (owner,duration,principal,reward) = viper::lock_vault::position_details(&p);
    assert!(owner == @0xA && duration == term*2_592_000_000 && principal == 1_000_000_000 && reward == viper::lock_vault::full_reward(principal,term));
    let coin = viper::lock_vault::close(&mut vault,p,&clock,s.ctx()); coin::burn_for_testing(coin); viper::lock_vault::flush_burns(&mut vault,&mut currency);
    assert!(pool.claimed == 1_000_000_000 && pool.inventory.value()+pool.claimed+pool.burned == viper::allocation::public_reserve());
    std::unit_test::destroy(pool);std::unit_test::destroy(cap);std::unit_test::destroy(vault);std::unit_test::destroy(vcap);std::unit_test::destroy(currency);std::unit_test::destroy(metadata);sui::clock::destroy_for_testing(clock);s.end();
}
#[test]
fun locked_claim_opens_correct_position() { check_locked_claim(24); }
#[test]
fun twelve_month_claim_opens_correct_position() { check_locked_claim(12); }
#[test, expected_failure(abort_code = EAdmin)]
fun wrong_admin_cannot_finalize() {
    let mut ctx = tx_context::dummy(); let clock = sui::clock::create_for_testing(&mut ctx);
    let (mut currency,_metadata) = viper::v1pr::test_currency(&mut ctx);
    let (mut pool,_cap) = setup(&mut ctx); let (_other,wrong) = setup(&mut ctx);
    finalize(&mut pool,&wrong,&mut currency,&clock); abort 999
}
#[test, expected_failure(abort_code = 3, location = viper::lock_vault)]
fun locked_claim_requires_full_reward_capacity() {
    let mut s = sui::test_scenario::begin(@0xA); let clock = sui::clock::create_for_testing(s.ctx());
    let (mut currency,_metadata) = viper::v1pr::test_currency(s.ctx()); let (mut pool,cap) = setup(s.ctx());
    let (mut vault,_vcap) = viper::lock_vault::create(coin::mint_for_testing<V1PR>(viper::allocation::lock_rewards(),s.ctx()),@0xC,@0xF,s.ctx());
    let _existing = viper::lock_vault::open(&mut vault,coin::mint_for_testing<V1PR>(750_000_000_000_000,s.ctx()),24,&clock,s.ctx());
    set_allocations(&mut pool,&cap,vector[@0xA],vector[1_000_000_000],vector[12],&clock);
    finalize(&mut pool,&cap,&mut currency,&clock);
    claim_locked(&mut pool,&mut vault,&clock,s.ctx()); abort 999
}
#[test, expected_failure(abort_code = 2, location = viper::lock_vault)]
fun locked_claim_respects_deposit_pause() {
    let mut s = sui::test_scenario::begin(@0xA); let clock = sui::clock::create_for_testing(s.ctx());
    let (mut currency,_metadata) = viper::v1pr::test_currency(s.ctx()); let (mut pool,cap) = setup(s.ctx());
    let (mut vault,vcap) = viper::lock_vault::create(coin::mint_for_testing<V1PR>(viper::allocation::lock_rewards(),s.ctx()),@0xC,@0xF,s.ctx());
    set_allocations(&mut pool,&cap,vector[@0xA],vector[1_000_000_000],vector[24],&clock);
    finalize(&mut pool,&cap,&mut currency,&clock);
    viper::lock_vault::set_paused(&mut vault,&vcap,true);
    claim_locked(&mut pool,&mut vault,&clock,s.ctx()); abort 999
}
#[test, expected_failure(abort_code = EAdmin)]
fun wrong_admin_fails() { let mut ctx = tx_context::dummy(); let clock = sui::clock::create_for_testing(&mut ctx); let (mut p,_c) = setup(&mut ctx);let (_q,c) = setup(&mut ctx);set_allocations(&mut p,&c,vector[@0xA],vector[1],vector[0],&clock);abort 999 }
#[test, expected_failure(abort_code = EAllocation)]
fun oversubscribed_fails() { let mut ctx = tx_context::dummy();let clock = sui::clock::create_for_testing(&mut ctx);let (mut p,c) = setup(&mut ctx);set_allocations(&mut p,&c,vector[@0xA,@0xB],vector[viper::allocation::public_reserve(),1],vector[0,0],&clock);abort 999 }
#[test, expected_failure(abort_code = EAllocation)]
fun zero_address_fails() { let mut ctx = tx_context::dummy();let clock = sui::clock::create_for_testing(&mut ctx);let (mut p,c) = setup(&mut ctx);set_allocations(&mut p,&c,vector[@0x0],vector[1],vector[0],&clock);abort 999 }
#[test, expected_failure(abort_code = EAllocation)]
fun duplicate_batch_fails() { let mut ctx = tx_context::dummy();let clock = sui::clock::create_for_testing(&mut ctx);let (mut p,c) = setup(&mut ctx);set_allocations(&mut p,&c,vector[@0xA,@0xA],vector[1,1],vector[0,0],&clock);abort 999 }
#[test, expected_failure(abort_code = EState)]
fun no_edits_after_finalize() { let mut ctx = tx_context::dummy();let clock = sui::clock::create_for_testing(&mut ctx);let (mut cur,_m) = viper::v1pr::test_currency(&mut ctx);let (mut p,c) = setup(&mut ctx);finalize(&mut p,&c,&mut cur,&clock);set_allocations(&mut p,&c,vector[@0xA],vector[1],vector[0],&clock);abort 999 }
#[test, expected_failure(abort_code = EState)]
fun premature_burn_fails() { let mut ctx = tx_context::dummy();let clock = sui::clock::create_for_testing(&mut ctx);let (mut cur,_m) = viper::v1pr::test_currency(&mut ctx);let (mut p,c) = setup(&mut ctx);finalize(&mut p,&c,&mut cur,&clock);burn_unclaimed(&mut p,&mut cur,&clock);abort 999 }
#[test, expected_failure(abort_code = EClaim)]
fun unallocated_claim_fails() { let mut ctx = tx_context::dummy();let clock = sui::clock::create_for_testing(&mut ctx);let (mut cur,_m) = viper::v1pr::test_currency(&mut ctx);let (mut p,c) = setup(&mut ctx);finalize(&mut p,&c,&mut cur,&clock);claim(&mut p,&clock,&mut ctx);abort 999 }

#[test, expected_failure(abort_code = EClaim)]
fun duplicate_liquid_claim_without_more_vesting_fails() {
    let mut s = sui::test_scenario::begin(@0xA);let clock = sui::clock::create_for_testing(s.ctx());let (mut cur,_m) = viper::v1pr::test_currency(s.ctx());let (mut p,c) = setup(s.ctx());
    set_allocations(&mut p,&c,vector[@0xA],vector[1_000],vector[0],&clock);finalize(&mut p,&c,&mut cur,&clock);claim(&mut p,&clock,s.ctx());claim(&mut p,&clock,s.ctx());abort 999
}
#[test, expected_failure(abort_code = EState)]
fun claim_at_expiry_fails() {
    let mut s = sui::test_scenario::begin(@0xA);let mut clock = sui::clock::create_for_testing(s.ctx());let (mut cur,_m) = viper::v1pr::test_currency(s.ctx());let (mut p,c) = setup(s.ctx());
    set_allocations(&mut p,&c,vector[@0xA],vector[1_000],vector[0],&clock);finalize(&mut p,&c,&mut cur,&clock);sui::clock::set_for_testing(&mut clock,WINDOW_MS);claim(&mut p,&clock,s.ctx());abort 999
}
#[test, expected_failure(abort_code = EClaim)]
fun repeated_locked_claim_fails() {
    let mut s = sui::test_scenario::begin(@0xA);let clock = sui::clock::create_for_testing(s.ctx());let (mut cur,_m) = viper::v1pr::test_currency(s.ctx());let (mut p,c) = setup(s.ctx());
    let (mut vault,_vcap) = viper::lock_vault::create(coin::mint_for_testing<V1PR>(viper::allocation::lock_rewards(),s.ctx()),@0xC,@0xF,s.ctx());
    set_allocations(&mut p,&c,vector[@0xA],vector[1_000_000_000],vector[12],&clock);finalize(&mut p,&c,&mut cur,&clock);claim_locked(&mut p,&mut vault,&clock,s.ctx());claim_locked(&mut p,&mut vault,&clock,s.ctx());abort 999
}
#[test]
fun expiry_burns_remaining_allocation() {
    let mut ctx = tx_context::dummy();let mut clock = sui::clock::create_for_testing(&mut ctx);let (mut cur,m) = viper::v1pr::test_currency(&mut ctx);let (mut p,c) = setup(&mut ctx);
    set_allocations(&mut p,&c,vector[@0xA],vector[1_000],vector[0],&clock);finalize(&mut p,&c,&mut cur,&clock);sui::clock::set_for_testing(&mut clock,WINDOW_MS);burn_unclaimed(&mut p,&mut cur,&clock);
    assert!(p.inventory.value() == 0 && p.burned == viper::allocation::public_reserve() && cur.total_supply().destroy_some() == viper::allocation::initial_supply()-p.burned);
    std::unit_test::destroy(p);std::unit_test::destroy(c);std::unit_test::destroy(cur);std::unit_test::destroy(m);sui::clock::destroy_for_testing(clock);
}
