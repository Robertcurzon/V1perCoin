/// Fixed-size, administrator-approved claims from existing inventory; no paid referrals.
module viper::free_claims;
use sui::balance::Balance;
use sui::coin::{Self, Coin};
use sui::clock::Clock;
use sui::event;
use sui::table::{Self, Table};
use viper::v1per::V1PER;

const EClaim: u64 = 1;
const EAdmin: u64 = 2;
const CLAIM: u64 = 10_000_000_000;
const DAY_MS: u64 = 86_400_000;
const NOTICE_MS: u64 = 7 * DAY_MS;
const WINDOW_MS: u64 = 14 * DAY_MS;
public struct Pool has key { id: UID, inventory: Balance<V1PER>, eligibility: Table<address, bool>, approved: u64, claimed: u64, start_ms: u64, end_ms: u64, schedule_deadline_ms: u64, abandoned: bool }
public struct AdminCap has key, store { id: UID, pool: ID }
public struct Scheduled has copy, drop { pool: ID, timestamp_ms: u64, start_ms: u64, end_ms: u64 }
public struct Claimed has copy, drop { pool: ID, timestamp_ms: u64, owner: address, amount: u64 }
public struct ClaimsBurned has copy, drop { pool: ID, timestamp_ms: u64, amount: u64 }

#[allow(lint(unused_object_with_fields))]
public(package) fun create(fund: Coin<V1PER>, clock: &Clock, ctx: &mut TxContext): (Pool, AdminCap) {
    assert!(fund.value() == viper::allocation::free_claims(), EClaim);
    let pool = Pool { id: object::new(ctx), inventory: fund.into_balance(), eligibility: table::new(ctx), approved: 0, claimed: 0, start_ms: 0, end_ms: 0, schedule_deadline_ms: clock.timestamp_ms()+60*86_400_000, abandoned: false };
    let cap = AdminCap { id: object::new(ctx), pool: object::id(&pool) };
    (pool, cap)
}
/// Schedule once with at least seven days of public notice; never extend or reopen.
public fun schedule(pool: &mut Pool, cap: &AdminCap, start_ms: u64, clock: &Clock) {
    assert!(cap.pool == object::id(pool), EAdmin);
    assert!(!pool.abandoned && clock.timestamp_ms() < pool.schedule_deadline_ms && pool.end_ms == 0 && start_ms<=pool.schedule_deadline_ms && start_ms >= clock.timestamp_ms() + NOTICE_MS, EClaim);
    pool.start_ms = start_ms; pool.end_ms = start_ms + WINDOW_MS;
    event::emit(Scheduled { pool: object::id(pool), timestamp_ms: clock.timestamp_ms(), start_ms, end_ms: pool.end_ms });
}
public fun approve(pool: &mut Pool, cap: &AdminCap, addresses: vector<address > , clock: &Clock) {
    assert!(cap.pool == object::id(pool), EAdmin);
    assert!(!pool.abandoned && ((pool.end_ms == 0 && clock.timestamp_ms() < pool.schedule_deadline_ms) || (pool.end_ms>0 && clock.timestamp_ms() < pool.start_ms)), EClaim);
    addresses.do!(|address| {
        assert!(address != @0x0 && pool.approved < 10_000 && !pool.eligibility.contains(address), EClaim);
        pool.eligibility.add(address, false);
        pool.approved = pool.approved + 1;
    });
}
#[allow(lint(self_transfer))]
public fun claim(pool: &mut Pool, clock: &Clock, ctx: &mut TxContext) {
    let sender = ctx.sender();
    assert!(pool.end_ms > 0 && clock.timestamp_ms() >= pool.start_ms && clock.timestamp_ms() < pool.end_ms && pool.eligibility.contains(sender), EClaim);
    assert!(!pool.eligibility[sender], EClaim);
    *pool.eligibility.borrow_mut(sender) = true;
    pool.claimed = pool.claimed + 1;
    event::emit(Claimed { pool: object::id(pool), timestamp_ms: clock.timestamp_ms(), owner: sender, amount: CLAIM });
    transfer::public_transfer(coin::from_balance(pool.inventory.split(CLAIM), ctx), sender);
}
/// Anyone may burn unclaimed inventory after the fixed 14-day window.
public fun burn_unclaimed(pool: &mut Pool, currency: &mut sui::coin_registry::Currency<V1PER>, clock: &Clock) {
    assert!((pool.end_ms > 0 && clock.timestamp_ms() >= pool.end_ms) || (pool.end_ms==0 && clock.timestamp_ms() >= pool.schedule_deadline_ms), EClaim);
    if(pool.end_ms==0) pool.abandoned=true;
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
    let mut clock = sui::clock::create_for_testing(scenario.ctx());
    let (mut pool, cap) = create(coin::mint_for_testing<V1PER>(viper::allocation::free_claims(), scenario.ctx()), &clock, scenario.ctx());
    approve(&mut pool, &cap, vector[@0xA], &clock);
    schedule(&mut pool, &cap, NOTICE_MS, &clock);
    sui::clock::set_for_testing(&mut clock, NOTICE_MS);
    claim(&mut pool, &clock, scenario.ctx());
    assert!(pool.claimed == 1 && remaining(&pool) == 99_990_000_000_000);
    let events = event::events_by_type<Claimed>();
    assert!(events.length() == 1 && events[0].pool == object::id(&pool) && events[0].owner == @0xA && events[0].amount == CLAIM);
    scenario.next_tx(@0xA);
    let payout = scenario.take_from_sender<Coin<V1PER>>();
    assert!(payout.value() == CLAIM);
    coin::burn_for_testing(payout);
    std::unit_test::destroy(pool); std::unit_test::destroy(cap);
    sui::clock::destroy_for_testing(clock); scenario.end();
}
#[test, expected_failure(abort_code = EClaim)]
fun repeated_claim_fails() {
    let mut scenario = sui::test_scenario::begin(@0xA);
    let mut clock = sui::clock::create_for_testing(scenario.ctx());
    let (mut pool, cap) = create(coin::mint_for_testing<V1PER>(viper::allocation::free_claims(), scenario.ctx()), &clock, scenario.ctx());
    approve(&mut pool, &cap, vector[@0xA], &clock);
    schedule(&mut pool, &cap, NOTICE_MS, &clock);
    sui::clock::set_for_testing(&mut clock, NOTICE_MS);
    claim(&mut pool, &clock, scenario.ctx());
    claim(&mut pool, &clock, scenario.ctx()); abort 999
}
#[test, expected_failure(abort_code = EClaim)]
fun claim_window_expiry_is_enforced() {
    let mut scenario = sui::test_scenario::begin(@0xA);
    let mut clock = sui::clock::create_for_testing(scenario.ctx());
    let (mut pool, cap) = create(coin::mint_for_testing<V1PER>(viper::allocation::free_claims(), scenario.ctx()), &clock, scenario.ctx());
    approve(&mut pool, &cap, vector[@0xA], &clock);
    schedule(&mut pool, &cap, NOTICE_MS, &clock);
    sui::clock::set_for_testing(&mut clock, NOTICE_MS + WINDOW_MS);
    claim(&mut pool, &clock, scenario.ctx()); abort 999
}
#[test, expected_failure(abort_code = EClaim)]
fun unapproved_claim_fails() {
    let mut scenario = sui::test_scenario::begin(@0xA);
    let mut clock = sui::clock::create_for_testing(scenario.ctx());
    let (mut pool, cap) = create(coin::mint_for_testing<V1PER>(viper::allocation::free_claims(), scenario.ctx()), &clock, scenario.ctx());
    schedule(&mut pool, &cap, NOTICE_MS, &clock);
    sui::clock::set_for_testing(&mut clock, NOTICE_MS);
    claim(&mut pool, &clock, scenario.ctx()); abort 999
}
#[test]
fun unclaimed_tokens_are_actually_burned() {
    let mut ctx = tx_context::dummy();
    let mut clock = sui::clock::create_for_testing(&mut ctx);
    let (mut currency, metadata) = viper::v1per::test_currency(&mut ctx);
    let (mut pool, cap) = create(coin::mint_for_testing<V1PER>(viper::allocation::free_claims(), &mut ctx), &clock, &mut ctx);
    schedule(&mut pool, &cap, NOTICE_MS, &clock);
    sui::clock::set_for_testing(&mut clock, NOTICE_MS + WINDOW_MS);
    burn_unclaimed(&mut pool, &mut currency, &clock);
    assert!(remaining(&pool) == 0 && currency.total_supply().destroy_some() == 900_000_000_000_000);
    let events = event::events_by_type<ClaimsBurned>();
    assert!(events.length() == 1 && events[0].amount == viper::allocation::free_claims() && events[0].timestamp_ms == NOTICE_MS + WINDOW_MS);
    std::unit_test::destroy(pool); std::unit_test::destroy(cap);
    std::unit_test::destroy(currency); std::unit_test::destroy(metadata);
    sui::clock::destroy_for_testing(clock);
}

#[test, expected_failure(abort_code = EAdmin)]
fun wrong_admin_cannot_approve() {
    let mut ctx = tx_context::dummy(); let clock = sui::clock::create_for_testing(&mut ctx);
    let (mut first, _cap) = create(coin::mint_for_testing<V1PER>(viper::allocation::free_claims(), &mut ctx), &clock, &mut ctx);
    let (_second, wrong) = create(coin::mint_for_testing<V1PER>(viper::allocation::free_claims(), &mut ctx), &clock, &mut ctx);
    approve(&mut first, &wrong, vector[@0xA], &clock); abort 999
}
#[test, expected_failure(abort_code = EClaim)]
fun approval_after_window_fails() {
    let mut ctx = tx_context::dummy(); let mut clock = sui::clock::create_for_testing(&mut ctx);
    let (mut pool, cap) = create(coin::mint_for_testing<V1PER>(viper::allocation::free_claims(), &mut ctx), &clock, &mut ctx);
    schedule(&mut pool, &cap, NOTICE_MS, &clock);
    sui::clock::set_for_testing(&mut clock, NOTICE_MS + WINDOW_MS); approve(&mut pool, &cap, vector[@0xA], &clock); abort 999
}
#[test, expected_failure(abort_code = EClaim)]
fun duplicate_approval_fails() {
    let mut ctx = tx_context::dummy(); let clock = sui::clock::create_for_testing(&mut ctx);
    let (mut pool, cap) = create(coin::mint_for_testing<V1PER>(viper::allocation::free_claims(), &mut ctx), &clock, &mut ctx);
    approve(&mut pool, &cap, vector[@0xA,@0xA], &clock); abort 999
}
#[test, expected_failure(abort_code = EClaim)]
fun over_capacity_approval_fails() {
    let mut ctx = tx_context::dummy(); let clock = sui::clock::create_for_testing(&mut ctx);
    let (mut pool, cap) = create(coin::mint_for_testing<V1PER>(viper::allocation::free_claims(), &mut ctx), &clock, &mut ctx);
    pool.approved = 10_000; approve(&mut pool, &cap, vector[@0xA], &clock); abort 999
}
#[test, expected_failure(abort_code = EClaim)]
fun zero_approval_fails() {
    let mut ctx = tx_context::dummy(); let clock = sui::clock::create_for_testing(&mut ctx);
    let (mut pool, cap) = create(coin::mint_for_testing<V1PER>(viper::allocation::free_claims(), &mut ctx), &clock, &mut ctx);
    approve(&mut pool, &cap, vector[@0x0], &clock); abort 999
}
#[test, expected_failure(abort_code = EClaim)]
fun premature_burn_fails() {
    let mut ctx = tx_context::dummy(); let clock = sui::clock::create_for_testing(&mut ctx);
    let (mut currency, _metadata) = viper::v1per::test_currency(&mut ctx);
    let (mut pool, _cap) = create(coin::mint_for_testing<V1PER>(viper::allocation::free_claims(), &mut ctx), &clock, &mut ctx);
    burn_unclaimed(&mut pool, &mut currency, &clock); abort 999
}

#[test, expected_failure(abort_code = EClaim)]
fun claim_before_scheduled_start_fails() {
    let mut ctx = tx_context::dummy(); let clock = sui::clock::create_for_testing(&mut ctx);
    let (mut pool, cap) = create(coin::mint_for_testing<V1PER>(viper::allocation::free_claims(), &mut ctx), &clock, &mut ctx);
    approve(&mut pool, &cap, vector[@0xA], &clock);
    schedule(&mut pool, &cap, NOTICE_MS, &clock);
    claim(&mut pool, &clock, &mut ctx); abort 999
}
#[test, expected_failure(abort_code = EClaim)]
fun approvals_freeze_at_start() {
    let mut ctx = tx_context::dummy(); let mut clock = sui::clock::create_for_testing(&mut ctx);
    let (mut pool, cap) = create(coin::mint_for_testing<V1PER>(viper::allocation::free_claims(), &mut ctx), &clock, &mut ctx);
    schedule(&mut pool, &cap, NOTICE_MS, &clock);
    sui::clock::set_for_testing(&mut clock, NOTICE_MS);
    approve(&mut pool, &cap, vector[@0xA], &clock); abort 999
}
#[test, expected_failure(abort_code = EClaim)]
fun schedule_cannot_be_extended() {
    let mut ctx = tx_context::dummy(); let clock = sui::clock::create_for_testing(&mut ctx);
    let (mut pool, cap) = create(coin::mint_for_testing<V1PER>(viper::allocation::free_claims(), &mut ctx), &clock, &mut ctx);
    schedule(&mut pool, &cap, NOTICE_MS, &clock);
    schedule(&mut pool, &cap, NOTICE_MS + DAY_MS, &clock); abort 999
}
#[test, expected_failure(abort_code = EClaim)]
fun insufficient_public_notice_fails() {
    let mut ctx = tx_context::dummy(); let clock = sui::clock::create_for_testing(&mut ctx);
    let (mut pool, cap) = create(coin::mint_for_testing<V1PER>(viper::allocation::free_claims(), &mut ctx), &clock, &mut ctx);
    schedule(&mut pool, &cap, NOTICE_MS - 1, &clock); abort 999
}
#[test]
fun claim_last_millisecond_then_burn() {
    let mut s = sui::test_scenario::begin(@0xA); let mut clock = sui::clock::create_for_testing(s.ctx());
    let (mut currency, metadata) = viper::v1per::test_currency(s.ctx());
    let (mut pool, cap) = create(coin::mint_for_testing<V1PER>(viper::allocation::free_claims(),s.ctx()),&clock,s.ctx());
    approve(&mut pool,&cap,vector[@0xA],&clock); schedule(&mut pool,&cap,NOTICE_MS,&clock);
    sui::clock::set_for_testing(&mut clock,NOTICE_MS+WINDOW_MS-1); claim(&mut pool,&clock,s.ctx());
    sui::clock::set_for_testing(&mut clock,NOTICE_MS+WINDOW_MS); burn_unclaimed(&mut pool,&mut currency,&clock);
    assert!(pool.claimed==1 && remaining(&pool)==0);
    s.next_tx(@0xA); coin::burn_for_testing(s.take_from_sender<Coin<V1PER>>());
    std::unit_test::destroy(pool); std::unit_test::destroy(cap); std::unit_test::destroy(currency); std::unit_test::destroy(metadata);
    sui::clock::destroy_for_testing(clock); s.end();
}

#[test]
fun unscheduled_pool_burns_at_60_days() {
    let mut ctx=tx_context::dummy();let mut clock=sui::clock::create_for_testing(&mut ctx);
    let (mut pool,cap)=create(coin::mint_for_testing<V1PER>(viper::allocation::free_claims(),&mut ctx),&clock,&mut ctx);
    let (mut currency,metadata)=viper::v1per::test_currency(&mut ctx);
    sui::clock::set_for_testing(&mut clock,pool.schedule_deadline_ms);burn_unclaimed(&mut pool,&mut currency,&clock);
    assert!(pool.abandoned && remaining(&pool)==0 && currency.total_supply().destroy_some()==900000000000000);
    std::unit_test::destroy(pool);std::unit_test::destroy(cap);std::unit_test::destroy(currency);std::unit_test::destroy(metadata);sui::clock::destroy_for_testing(clock);
}
#[test,expected_failure(abort_code=EClaim)]
fun unscheduled_burn_before_deadline_fails() {
    let mut ctx=tx_context::dummy();let mut clock=sui::clock::create_for_testing(&mut ctx);
    let (mut pool,_cap)=create(coin::mint_for_testing<V1PER>(viper::allocation::free_claims(),&mut ctx),&clock,&mut ctx);let (mut currency,_metadata)=viper::v1per::test_currency(&mut ctx);
    sui::clock::set_for_testing(&mut clock,pool.schedule_deadline_ms-1);burn_unclaimed(&mut pool,&mut currency,&clock);abort 999
}
#[test,expected_failure(abort_code=EClaim)]
fun schedule_at_abandonment_deadline_fails() {
    let mut ctx=tx_context::dummy();let mut clock=sui::clock::create_for_testing(&mut ctx);
    let (mut pool,cap)=create(coin::mint_for_testing<V1PER>(viper::allocation::free_claims(),&mut ctx),&clock,&mut ctx);
    sui::clock::set_for_testing(&mut clock,pool.schedule_deadline_ms);{let start=pool.schedule_deadline_ms+NOTICE_MS;schedule(&mut pool,&cap,start,&clock)};abort 999
}
