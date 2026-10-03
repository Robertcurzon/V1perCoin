/// Existing-inventory Feast claims with reviewed, hash-bound allocations and escrow.
module viper::feast;
use sui::balance::{Self, Balance};
use sui::coin::{Self, Coin};
use sui::clock::Clock;
use sui::coin_registry::Currency;
use sui::event;
use sui::table::{Self, Table};
use viper::v1pr::V1PR;
use viper::lock_vault::{Self, Vault};
const EAdmin: u64 = 1;
const EState: u64 = 2;
const EAllocation: u64 = 3;
const EClaim: u64 = 4;
const EReview: u64 = 5;
const EHash: u64 = 6;
const EVault: u64 = 7;
const DAY_MS: u64 = 86_400_000;
const REVIEW_MS: u64 = 7 * DAY_MS;
const VEST_MS: u64 = 60 * DAY_MS;
const WINDOW_MS: u64 = 90 * DAY_MS;
public struct Allocation has copy, drop, store { amount: u64, claimed: u64, lock_months: u64 }
public struct Pool has key {
    id: UID, inventory: Balance<V1PR>, allocations: Table<address, Allocation>,
    allocated: u64, claimed: u64, burned: u64, finalized: bool, start_ms: u64,
    allocations_hash: vector<u8>, last_change_ms: u64, locked_reward_required: u64,
    reward_reserve: Balance<V1PR>, reservation_vault: Option<ID>,
}
public struct AdminCap has key, store { id: UID, pool: ID }
public struct AllocationsSet has copy, drop { pool: ID, timestamp_ms: u64, allocated: u64, allocations_hash: vector<u8> }
public struct Finalized has copy, drop { pool: ID, timestamp_ms: u64, allocated: u64, burned: u64, allocations_hash: vector<u8>, reserved_rewards: u64, vault: ID }
public struct Claimed has copy, drop { pool: ID, timestamp_ms: u64, owner: address, amount: u64, lock_months: u64 }
public struct ClaimsBurned has copy, drop { pool: ID, timestamp_ms: u64, amount: u64, released_rewards: u64 }
public(package) fun create(fund: Coin<V1PR>, ctx: &mut TxContext): (Pool, AdminCap) {
    assert!(fund.value() == viper::allocation::public_reserve(), EAllocation);
    let pool = Pool { id: object::new(ctx), inventory: fund.into_balance(), allocations: table::new(ctx), allocated: 0, claimed: 0, burned: 0, finalized: false, start_ms: 0,
        allocations_hash: vector[], last_change_ms: 0, locked_reward_required: 0, reward_reserve: balance::zero(), reservation_vault: option::none() };
    let cap = AdminCap { id: object::new(ctx), pool: object::id(&pool) };
    (pool, cap)
}
fun reward_for(amount: u64, term: u64): u64 { if (term == 0) 0 else lock_vault::full_reward(amount,term) }
public fun set_allocations(pool: &mut Pool, cap: &AdminCap, addresses: vector<address>, amounts: vector<u64>, lock_months: vector<u64>, allocations_hash: vector<u8>, clock: &Clock) {
    assert!(cap.pool == object::id(pool), EAdmin); assert!(!pool.finalized, EState);
    assert!(allocations_hash.length() == 32, EHash);
    assert!(addresses.length() == amounts.length() && addresses.length() == lock_months.length(), EAllocation);
    let mut i = 0;
    while (i < addresses.length()) {
        let address = addresses[i]; let amount = amounts[i]; let term = lock_months[i];
        assert!(address != @0x0 && amount > 0 && (term == 0 || term == 12 || term == 24), EAllocation);
        let reward = reward_for(amount,term); assert!(term == 0 || reward > 0, EAllocation);
        let mut j = 0; while (j < i) { assert!(addresses[j] != address, EAllocation); j = j + 1; };
        let old = if (pool.allocations.contains(address)) pool.allocations.remove(address) else Allocation {amount:0,claimed:0,lock_months:0};
        assert!(amount <= viper::allocation::public_reserve() - (pool.allocated - old.amount), EAllocation);
        pool.allocated = pool.allocated - old.amount + amount;
        pool.locked_reward_required = pool.locked_reward_required - reward_for(old.amount,old.lock_months) + reward;
        pool.allocations.add(address, Allocation { amount, claimed: 0, lock_months: term }); i = i + 1;
    };
    pool.allocations_hash = allocations_hash; pool.last_change_ms = clock.timestamp_ms();
    event::emit(AllocationsSet {pool:object::id(pool),timestamp_ms:pool.last_change_ms,allocated:pool.allocated,allocations_hash});
}
public fun finalize(pool: &mut Pool, cap: &AdminCap, vault: &mut Vault, currency: &mut Currency<V1PR>, allocations_hash: vector<u8>, clock: &Clock) {
    assert!(cap.pool == object::id(pool), EAdmin); assert!(!pool.finalized, EState);
    assert!(pool.allocations_hash.length() == 32 && allocations_hash == pool.allocations_hash, EHash);
    assert!(clock.timestamp_ms() >= pool.last_change_ms + REVIEW_MS, EReview);
    // This whole transaction aborts if capacity cannot cover every accepted lock.
    pool.reward_reserve.join(lock_vault::reserve_feast(vault,pool.locked_reward_required));
    pool.reservation_vault = option::some(object::id(vault));
    pool.finalized = true; pool.start_ms = clock.timestamp_ms();
    let amount = pool.inventory.value() - pool.allocated;
    currency.burn_balance(pool.inventory.split(amount)); pool.burned = pool.burned + amount;
    event::emit(Finalized {pool:object::id(pool),timestamp_ms:pool.start_ms,allocated:pool.allocated,burned:amount,allocations_hash,reserved_rewards:pool.reward_reserve.value(),vault:object::id(vault)});
}
fun assert_window(pool: &Pool, clock: &Clock) { assert!(pool.finalized && clock.timestamp_ms() >= pool.start_ms && clock.timestamp_ms() < pool.start_ms + WINDOW_MS, EState); }
fun assert_vault(pool: &Pool, vault: &Vault) { assert!(pool.reservation_vault.is_some() && *pool.reservation_vault.borrow() == object::id(vault), EVault); }
public fun vested_amount(amount: u64, elapsed_ms: u64): u64 {
    let first = amount / 2; let elapsed = if (elapsed_ms >= VEST_MS) VEST_MS else elapsed_ms;
    first + (((amount - first) as u128) * (elapsed as u128) / (VEST_MS as u128) as u64)
}
#[allow(lint(self_transfer))]
public fun claim(pool: &mut Pool, clock: &Clock, ctx: &mut TxContext) {
    assert_window(pool,clock); let sender = ctx.sender(); assert!(pool.allocations.contains(sender), EClaim);
    let entry = pool.allocations.borrow_mut(sender); assert!(entry.lock_months == 0, EClaim);
    let vested = vested_amount(entry.amount,clock.timestamp_ms()-pool.start_ms); let amount = vested-entry.claimed;
    assert!(amount > 0,EClaim); entry.claimed = vested; pool.claimed = pool.claimed + amount;
    transfer::public_transfer(coin::from_balance(pool.inventory.split(amount),ctx),sender);
    event::emit(Claimed {pool:object::id(pool),timestamp_ms:clock.timestamp_ms(),owner:sender,amount,lock_months:0});
}
public fun claim_locked(pool: &mut Pool, vault: &mut Vault, clock: &Clock, ctx: &mut TxContext) {
    assert_window(pool,clock); assert_vault(pool,vault); let sender = ctx.sender(); assert!(pool.allocations.contains(sender), EClaim);
    let entry = pool.allocations.borrow_mut(sender); assert!(entry.lock_months != 0 && entry.claimed == 0,EClaim);
    let amount = entry.amount; let term = entry.lock_months; entry.claimed = amount; pool.claimed = pool.claimed + amount;
    lock_vault::deposit_reserved(vault,coin::from_balance(pool.inventory.split(amount),ctx),pool.reward_reserve.split(reward_for(amount,term)),term,clock,ctx);
    event::emit(Claimed {pool:object::id(pool),timestamp_ms:clock.timestamp_ms(),owner:sender,amount,lock_months:term});
}
public fun burn_unclaimed(pool: &mut Pool, vault: &mut Vault, currency: &mut Currency<V1PR>, clock: &Clock) {
    assert!(pool.finalized && clock.timestamp_ms() >= pool.start_ms+WINDOW_MS,EState); assert_vault(pool,vault);
    let released_rewards = pool.reward_reserve.value();
    lock_vault::release_feast(vault,pool.reward_reserve.split(released_rewards));
    let amount = pool.inventory.value(); currency.burn_balance(pool.inventory.split(amount)); pool.burned = pool.burned + amount;
    if (amount > 0 || released_rewards > 0) event::emit(ClaimsBurned {pool:object::id(pool),timestamp_ms:clock.timestamp_ms(),amount,released_rewards});
}
public fun accounting(pool: &Pool): (u64,u64,u64,u64) { (pool.inventory.value(),pool.allocated,pool.claimed,pool.burned) }
public(package) fun share(pool: Pool) { transfer::share_object(pool); }
#[test_only]
fun hash(): vector<u8> { vector[7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7] }
#[test_only]
fun setup(ctx: &mut TxContext): (Pool,AdminCap) { create(coin::mint_for_testing<V1PR>(viper::allocation::public_reserve(),ctx),ctx) }
#[test_only]
fun test_vault(opens: u64, ctx: &mut TxContext): (Vault,lock_vault::AdminCap) { lock_vault::create(coin::mint_for_testing<V1PR>(viper::allocation::lock_rewards(),ctx),@0xC,@0xF,opens,ctx) }
#[test_only]
fun ready(pool: &mut Pool, cap: &AdminCap, vault: &mut Vault, currency: &mut Currency<V1PR>, clock: &mut Clock) {
    sui::clock::set_for_testing(clock,pool.last_change_ms+REVIEW_MS); finalize(pool,cap,vault,currency,hash(),clock);
}
#[test]
fun vesting_rounds_and_boundaries() {
    assert!(vested_amount(1_000,0)==500); assert!(vested_amount(1_000,30*DAY_MS)==750); assert!(vested_amount(1_001,60*DAY_MS+1)==1_001);
}
#[test]
fun liquid_claims_and_expiry_reconcile() {
    let mut s=sui::test_scenario::begin(@0xA); let mut clock=sui::clock::create_for_testing(s.ctx());
    let (mut currency,metadata)=viper::v1pr::test_currency(s.ctx()); let (mut pool,cap)=setup(s.ctx()); let (mut vault,vcap)=test_vault(0,s.ctx());
    set_allocations(&mut pool,&cap,vector[@0xA],vector[1_000],vector[0],hash(),&clock); ready(&mut pool,&cap,&mut vault,&mut currency,&mut clock);
    let start=pool.start_ms; let times=vector[0,30*DAY_MS,60*DAY_MS]; let amounts=vector[500,250,250]; let mut i=0;
    while (i < 3) { sui::clock::set_for_testing(&mut clock,start+times[i]); claim(&mut pool,&clock,s.ctx()); s.next_tx(@0xA);
        let coin=s.take_from_sender<Coin<V1PR>>(); assert!(coin.value()==amounts[i]); coin::burn_for_testing(coin);
        assert!(pool.inventory.value()+pool.claimed+pool.burned==viper::allocation::public_reserve()); i=i+1; };
    sui::clock::set_for_testing(&mut clock,start+WINDOW_MS); burn_unclaimed(&mut pool,&mut vault,&mut currency,&clock);
    std::unit_test::destroy(pool); std::unit_test::destroy(cap); std::unit_test::destroy(vault); std::unit_test::destroy(vcap);
    std::unit_test::destroy(currency); std::unit_test::destroy(metadata); sui::clock::destroy_for_testing(clock); s.end();
}
#[test_only]
fun check_reserved_claim(term: u64, before_opening: bool, exhaust: bool) {
    let mut s=sui::test_scenario::begin(@0xA); let mut clock=sui::clock::create_for_testing(s.ctx());
    let (mut currency,metadata)=viper::v1pr::test_currency(s.ctx()); let (mut pool,cap)=setup(s.ctx());
    let (mut vault,vcap)=test_vault(if(before_opening) 30*DAY_MS else 0,s.ctx());
    set_allocations(&mut pool,&cap,vector[@0xA],vector[1_000_000_000],vector[term],hash(),&clock);
    ready(&mut pool,&cap,&mut vault,&mut currency,&mut clock);
    let reserved=lock_vault::full_reward(1_000_000_000,term);
    let (available,committed,paid,_)=lock_vault::accounting(&vault); assert!(available+committed+paid==lock_vault::funded(&vault) && committed==reserved);
    if(exhaust) { let p=lock_vault::open(&mut vault,coin::mint_for_testing<V1PR>(available*5,s.ctx()),24,&clock,s.ctx()); std::unit_test::destroy(p); };
    lock_vault::set_paused(&mut vault,&vcap,true); claim_locked(&mut pool,&mut vault,&clock,s.ctx()); s.next_tx(@0xA);
    let position=s.take_from_sender<lock_vault::Position>(); let (owner,duration,principal,reward)=lock_vault::position_details(&position);
    assert!(owner==@0xA && duration==term*2_592_000_000 && principal==1_000_000_000 && reward==reserved);
    let (available,committed,paid,_)=lock_vault::accounting(&vault); assert!(available+committed+paid==lock_vault::funded(&vault));
    std::unit_test::destroy(position); std::unit_test::destroy(pool); std::unit_test::destroy(cap); std::unit_test::destroy(vault); std::unit_test::destroy(vcap);
    std::unit_test::destroy(currency); std::unit_test::destroy(metadata); sui::clock::destroy_for_testing(clock); s.end();
}
#[test] fun locked_claim_opens_correct_position() { check_reserved_claim(24,false,false); }
#[test] fun twelve_month_claim_opens_correct_position() { check_reserved_claim(12,false,false); }
#[test] fun reserved_claim_bypasses_pause_and_opening_date() { check_reserved_claim(24,true,false); }
#[test] fun reserved_claim_survives_capacity_exhaustion() { check_reserved_claim(12,false,true); }
#[test, expected_failure(abort_code=EReview)]
fun early_finalize_fails() {
    let mut ctx=tx_context::dummy(); let clock=sui::clock::create_for_testing(&mut ctx);
    let (mut pool,cap)=setup(&mut ctx); let (mut vault,_vcap)=test_vault(0,&mut ctx); let (mut currency,_metadata)=viper::v1pr::test_currency(&mut ctx);
    set_allocations(&mut pool,&cap,vector[@0xA],vector[1_000],vector[0],hash(),&clock);
    finalize(&mut pool,&cap,&mut vault,&mut currency,hash(),&clock); abort 999
}
#[test, expected_failure(abort_code=EHash)]
fun wrong_hash_finalize_fails() {
    let mut ctx=tx_context::dummy(); let mut clock=sui::clock::create_for_testing(&mut ctx);
    let (mut pool,cap)=setup(&mut ctx); let (mut vault,_vcap)=test_vault(0,&mut ctx); let (mut currency,_metadata)=viper::v1pr::test_currency(&mut ctx);
    set_allocations(&mut pool,&cap,vector[@0xA],vector[1_000],vector[0],hash(),&clock); sui::clock::set_for_testing(&mut clock,REVIEW_MS);
    let mut wrong=hash(); *wrong.borrow_mut(0)=8; finalize(&mut pool,&cap,&mut vault,&mut currency,wrong,&clock); abort 999
}
#[test, expected_failure(abort_code=EReview)]
fun edit_restarts_review_period() {
    let mut ctx=tx_context::dummy(); let mut clock=sui::clock::create_for_testing(&mut ctx);
    let (mut pool,cap)=setup(&mut ctx); let (mut vault,_vcap)=test_vault(0,&mut ctx); let (mut currency,_metadata)=viper::v1pr::test_currency(&mut ctx);
    set_allocations(&mut pool,&cap,vector[@0xA],vector[1_000],vector[0],hash(),&clock);
    sui::clock::set_for_testing(&mut clock,3*DAY_MS); set_allocations(&mut pool,&cap,vector[@0xA],vector[2_000],vector[0],hash(),&clock);
    sui::clock::set_for_testing(&mut clock,REVIEW_MS); finalize(&mut pool,&cap,&mut vault,&mut currency,hash(),&clock); abort 999
}
#[test, expected_failure(abort_code=3,location=viper::lock_vault)]
fun finalize_requires_full_reward_capacity() {
    let mut ctx=tx_context::dummy(); let mut clock=sui::clock::create_for_testing(&mut ctx);
    let (mut pool,cap)=setup(&mut ctx); let (mut vault,_vcap)=test_vault(0,&mut ctx); let (mut currency,_metadata)=viper::v1pr::test_currency(&mut ctx);
    let _position=lock_vault::open(&mut vault,coin::mint_for_testing<V1PR>(750_000_000_000_000,&mut ctx),24,&clock,&mut ctx);
    set_allocations(&mut pool,&cap,vector[@0xA],vector[1_000_000_000],vector[24],hash(),&clock); ready(&mut pool,&cap,&mut vault,&mut currency,&mut clock); abort 999
}
#[test]
fun expiry_releases_unclaimed_reward_reservations() {
    let mut ctx=tx_context::dummy(); let mut clock=sui::clock::create_for_testing(&mut ctx);
    let (mut pool,cap)=setup(&mut ctx); let (mut vault,vcap)=test_vault(0,&mut ctx); let (mut currency,metadata)=viper::v1pr::test_currency(&mut ctx);
    set_allocations(&mut pool,&cap,vector[@0xA],vector[1_000_000_000],vector[24],hash(),&clock); ready(&mut pool,&cap,&mut vault,&mut currency,&mut clock);
    sui::clock::set_for_testing(&mut clock,pool.start_ms+WINDOW_MS); burn_unclaimed(&mut pool,&mut vault,&mut currency,&clock);
    let (available,committed,paid,_)=lock_vault::accounting(&vault);
    assert!(committed==0 && paid==0 && available==lock_vault::funded(&vault) && pool.reward_reserve.value()==0 && pool.inventory.value()==0);
    assert!(currency.total_supply().destroy_some()==viper::allocation::initial_supply()-pool.burned);
    std::unit_test::destroy(pool); std::unit_test::destroy(cap); std::unit_test::destroy(vault); std::unit_test::destroy(vcap);
    std::unit_test::destroy(currency); std::unit_test::destroy(metadata); sui::clock::destroy_for_testing(clock);
}
#[test,expected_failure(abort_code=EAdmin)]
fun wrong_admin_fails() { let mut ctx=tx_context::dummy(); let clock=sui::clock::create_for_testing(&mut ctx); let (mut p,_c)=setup(&mut ctx); let (_q,c)=setup(&mut ctx); set_allocations(&mut p,&c,vector[@0xA],vector[1],vector[0],hash(),&clock); abort 999 }
#[test,expected_failure(abort_code=EAdmin)]
fun wrong_admin_cannot_finalize() { let mut ctx=tx_context::dummy(); let clock=sui::clock::create_for_testing(&mut ctx); let (mut p,_c)=setup(&mut ctx); let (_q,c)=setup(&mut ctx); let (mut v,_vc)=test_vault(0,&mut ctx); let (mut currency,_m)=viper::v1pr::test_currency(&mut ctx); finalize(&mut p,&c,&mut v,&mut currency,hash(),&clock); abort 999 }
#[test,expected_failure(abort_code=EAllocation)]
fun oversubscribed_fails() { let mut ctx=tx_context::dummy(); let clock=sui::clock::create_for_testing(&mut ctx); let (mut p,c)=setup(&mut ctx); set_allocations(&mut p,&c,vector[@0xA,@0xB],vector[viper::allocation::public_reserve(),1],vector[0,0],hash(),&clock); abort 999 }
#[test,expected_failure(abort_code=EAllocation)]
fun zero_address_fails() { let mut ctx=tx_context::dummy(); let clock=sui::clock::create_for_testing(&mut ctx); let (mut p,c)=setup(&mut ctx); set_allocations(&mut p,&c,vector[@0x0],vector[1],vector[0],hash(),&clock); abort 999 }
#[test,expected_failure(abort_code=EAllocation)]
fun duplicate_batch_fails() { let mut ctx=tx_context::dummy(); let clock=sui::clock::create_for_testing(&mut ctx); let (mut p,c)=setup(&mut ctx); set_allocations(&mut p,&c,vector[@0xA,@0xA],vector[1,1],vector[0,0],hash(),&clock); abort 999 }
#[test,expected_failure(abort_code=EState)]
fun no_edits_after_finalize() { let mut ctx=tx_context::dummy(); let mut clock=sui::clock::create_for_testing(&mut ctx); let (mut p,c)=setup(&mut ctx); let (mut v,_vc)=test_vault(0,&mut ctx); let (mut currency,_m)=viper::v1pr::test_currency(&mut ctx); set_allocations(&mut p,&c,vector[],vector[],vector[],hash(),&clock); ready(&mut p,&c,&mut v,&mut currency,&mut clock); set_allocations(&mut p,&c,vector[@0xA],vector[1],vector[0],hash(),&clock); abort 999 }
#[test,expected_failure(abort_code=EState)]
fun premature_burn_fails() { let mut ctx=tx_context::dummy(); let mut clock=sui::clock::create_for_testing(&mut ctx); let (mut p,c)=setup(&mut ctx); let (mut v,_vc)=test_vault(0,&mut ctx); let (mut currency,_m)=viper::v1pr::test_currency(&mut ctx); set_allocations(&mut p,&c,vector[],vector[],vector[],hash(),&clock); ready(&mut p,&c,&mut v,&mut currency,&mut clock); burn_unclaimed(&mut p,&mut v,&mut currency,&clock); abort 999 }
#[test,expected_failure(abort_code=EClaim)]
fun unallocated_claim_fails() { let mut ctx=tx_context::dummy(); let mut clock=sui::clock::create_for_testing(&mut ctx); let (mut p,c)=setup(&mut ctx); let (mut v,_vc)=test_vault(0,&mut ctx); let (mut currency,_m)=viper::v1pr::test_currency(&mut ctx); set_allocations(&mut p,&c,vector[],vector[],vector[],hash(),&clock); ready(&mut p,&c,&mut v,&mut currency,&mut clock); claim(&mut p,&clock,&mut ctx); abort 999 }
#[test,expected_failure(abort_code=EClaim)]
fun repeated_locked_claim_fails() { let mut s=sui::test_scenario::begin(@0xA); let mut clock=sui::clock::create_for_testing(s.ctx()); let (mut p,c)=setup(s.ctx()); let (mut v,_vc)=test_vault(0,s.ctx()); let (mut currency,_m)=viper::v1pr::test_currency(s.ctx()); set_allocations(&mut p,&c,vector[@0xA],vector[1_000_000_000],vector[12],hash(),&clock); ready(&mut p,&c,&mut v,&mut currency,&mut clock); claim_locked(&mut p,&mut v,&clock,s.ctx()); claim_locked(&mut p,&mut v,&clock,s.ctx()); abort 999 }
#[test,expected_failure(abort_code=EState)]
fun claim_at_expiry_fails() { let mut ctx=tx_context::dummy(); let mut clock=sui::clock::create_for_testing(&mut ctx); let (mut p,c)=setup(&mut ctx); let (mut v,_vc)=test_vault(0,&mut ctx); let (mut currency,_m)=viper::v1pr::test_currency(&mut ctx); set_allocations(&mut p,&c,vector[@0xA],vector[1_000],vector[0],hash(),&clock); ready(&mut p,&c,&mut v,&mut currency,&mut clock); sui::clock::set_for_testing(&mut clock,p.start_ms+WINDOW_MS); claim(&mut p,&clock,&mut ctx); abort 999 }
