/// Fully funded, non-transferable lock positions. No administrator withdrawal path.
module viper::lock_vault;

use sui::balance::Balance;
use sui::clock::Clock;
use sui::coin::{Self, Coin};
use sui::coin_registry::Currency;
use sui::event;
use viper::v1pr::V1PR;

const ETerm: u64 = 1;
const EClosed: u64 = 2;
const ECapacity: u64 = 3;
const EPosition: u64 = 4;
const EAdmin: u64 = 5;
const EFunding: u64 = 6;
const MONTH_MS: u64 = 2_592_000_000;

public struct Vault has key {
    id: UID,
    rewards: Balance<V1PR>,
    community: address,
    founder: address,
    paused: bool,
    total_locked: u64,
    reward_committed: u64,
    reward_paid: u64,
    reward_funded: u64,
    community_paid: u64,
    founder_paid: u64,
    burned: u64,
    pending_burn: Balance<V1PR>,
    locks_opened: u64,
    locks_closed: u64,
}
public struct AdminCap has key, store { id: UID, vault: ID }
/// No `store`: users cannot transfer a position through public_transfer.
public struct Position has key {
    id: UID,
    vault: ID,
    owner: address,
    principal: Balance<V1PR>,
    reward: Balance<V1PR>,
    start_ms: u64,
    duration_ms: u64,
}
public struct Opened has copy, drop { vault: ID, timestamp_ms: u64, position: ID, owner: address, principal: u64, months: u64, reward: u64, maturity_ms: u64 }
public struct Closed has copy, drop { vault: ID, timestamp_ms: u64, position: ID, owner: address, principal: u64, earned: u64, community: u64, founder: u64, pending_burn: u64 }

public struct BurnsFlushed has copy, drop { vault: ID, amount: u64 }
public struct Funded has copy, drop { vault: ID, amount: u64 }
public struct PauseChanged has copy, drop { vault: ID, paused: bool }

public(package) fun create(fund: Coin<V1PR>, community: address, founder: address, ctx: &mut TxContext): (Vault, AdminCap) {
    assert!(fund.value() == viper::allocation::lock_rewards(), EFunding);
    assert!(community != @0x0 && founder != @0x0 && community != founder, EFunding);
    let vault = Vault {
        id: object::new(ctx), rewards: fund.into_balance(), community, founder, paused: false, total_locked: 0,
        reward_committed: 0, reward_paid: 0, reward_funded: viper::allocation::lock_rewards(), community_paid: 0, founder_paid: 0, burned: 0, pending_burn: sui::balance::zero(), locks_opened: 0, locks_closed: 0,
    };
    let cap = AdminCap { id: object::new(ctx), vault: object::id(&vault) };
    (vault, cap)
}

public fun rate_ppm(months: u64): u64 {
    assert!(months >= 1 && months <= 24, ETerm);
    viper::reward_schedule::rate_ppm(months)
}
public fun net_reward(principal: u64, months: u64): u64 {
    let rate = rate_ppm(months);
    (((principal as u128) * (rate as u128) * (months as u128) / 12_000_000) as u64)
}
/// Reserve exactly the complete term reward.
public fun full_reward(principal: u64, months: u64): u64 {
    net_reward(principal, months)
}
public fun exit_fee(principal: u64, duration_ms: u64, elapsed_ms: u64): u64 {
    assert!(duration_ms > 0, ETerm);
    let remaining = if (elapsed_ms >= duration_ms) 0 else duration_ms - elapsed_ms;
    (((principal as u128) * (500 * (remaining as u128)) / (10_000 * (duration_ms as u128))) as u64)
}
public fun fee_split(fee: u64): (u64, u64, u64) {
    let burn = (((fee as u128) * 50 / 100) as u64);
    let founder = fee / 10;
    (fee - burn - founder, burn, founder)
}

/// Full maximum reward is escrowed now, rather than promised against future deposits.
public fun open(vault: &mut Vault, principal: Coin<V1PR>, months: u64, clock: &Clock, ctx: &mut TxContext): Position {
    let reward = full_reward(principal.value(), months);
    let now = clock.timestamp_ms();
    let duration_ms = months * MONTH_MS;
    assert!(!vault.paused, EClosed);
    assert!(principal.value() > 0 && net_reward(principal.value(), months) > 0, ECapacity);
    assert!(reward <= vault.rewards.value(), ECapacity);
    vault.locks_opened = vault.locks_opened + 1;
    vault.reward_committed = vault.reward_committed + reward;
    vault.total_locked = vault.total_locked + principal.value();
    let position = Position {
        id: object::new(ctx), vault: object::id(vault), owner: ctx.sender(),
        principal: principal.into_balance(), reward: vault.rewards.split(reward),
        start_ms: now, duration_ms,
    };
    event::emit(Opened { vault: object::id(vault), timestamp_ms: now, position: object::id(&position), owner: ctx.sender(), principal: position.principal.value(), months, reward, maturity_ms: now + duration_ms });
    position
}
public fun deposit(vault: &mut Vault, principal: Coin<V1PR>, months: u64, clock: &Clock, ctx: &mut TxContext) {
    let position = open(vault, principal, months, clock, ctx);
    transfer::transfer(position, ctx.sender());
}
public fun set_paused(vault: &mut Vault, cap: &AdminCap, paused: bool) {
    assert!(cap.vault == object::id(vault), EAdmin);
    vault.paused = paused;
    event::emit(PauseChanged { vault: object::id(vault), paused });
}
/// Preview returns (principal, earned reward, total fee, Community, burn, founder).
public fun preview(position: &Position, clock: &Clock): (u64, u64, u64, u64, u64, u64) {
    let now = clock.timestamp_ms();
    let elapsed = if (now >= position.start_ms + position.duration_ms) position.duration_ms else now - position.start_ms;
    let principal = position.principal.value();
    let completed = elapsed / MONTH_MS;
    let earned = if (completed == 0) 0 else net_reward(principal, completed);
    let earned = if (earned > position.reward.value()) position.reward.value() else earned;
    let fee = exit_fee(principal, position.duration_ms, elapsed);
    let (community, burn, founder) = fee_split(fee);
    (principal, earned, fee, community, burn, founder)
}
public fun close(vault: &mut Vault, position: Position, clock: &Clock, ctx: &mut TxContext): Coin<V1PR> {
    assert!(position.vault == object::id(vault) && position.owner == ctx.sender(), EPosition);
    let (value, earned, _, community, burn, founder) = preview(&position, clock);
    let Position { id, vault: _, owner: _, mut principal, mut reward, start_ms: _, duration_ms: _ } = position;
    let position_id = id.to_inner();
    id.delete();
    let unused = reward.value() - earned;
    vault.rewards.join(reward.split(unused));
    vault.reward_committed = vault.reward_committed - earned - unused;
    vault.locks_closed = vault.locks_closed + 1;
    vault.reward_paid = vault.reward_paid + earned;
    vault.total_locked = vault.total_locked - value;
    vault.community_paid = vault.community_paid + community;
    vault.founder_paid = vault.founder_paid + founder;
    vault.pending_burn.join(principal.split(burn));
    if (community > 0) transfer::public_transfer(coin::from_balance(principal.split(community), ctx), vault.community);
    if (founder > 0) transfer::public_transfer(coin::from_balance(principal.split(founder), ctx), vault.founder);
    principal.join(reward);
    event::emit(Closed { vault: object::id(vault), timestamp_ms: clock.timestamp_ms(), position: position_id, owner: ctx.sender(), principal: value, earned, community, founder, pending_burn: burn });
    coin::from_balance(principal, ctx)
}
public fun withdraw(vault: &mut Vault, position: Position, clock: &Clock, ctx: &mut TxContext) {
    let payout = close(vault, position, clock, ctx);
    transfer::public_transfer(payout, ctx.sender());
}
/// Permissionless supply reduction, separated from exits to avoid Currency contention.
public fun flush_burns(vault: &mut Vault, currency: &mut Currency<V1PR>) {
    let amount = vault.pending_burn.value();
    currency.burn_balance(vault.pending_burn.split(amount));
    vault.burned = vault.burned + amount;
    if (amount > 0) event::emit(BurnsFlushed { vault: object::id(vault), amount });
}
public fun accounting(vault: &Vault): (u64, u64, u64, u64) {
    (vault.rewards.value(), vault.reward_committed, vault.reward_paid, vault.total_locked)
}

#[test]
fun exponential_curve_and_fee_boundaries() {
    let mut m = 1;
    let mut previous = 0;
    while (m <= 24) {
        let rate = rate_ppm(m);
        assert!(rate > previous && rate <= 100_000);
        assert!(exit_fee(1_000_000, m * MONTH_MS, 0) == 50_000);
        assert!(exit_fee(1_000_000, m * MONTH_MS, m * MONTH_MS / 10) == 45_000);
        assert!(exit_fee(1_000_000, m * MONTH_MS, m * MONTH_MS * 9 / 10) == 5_000);
        assert!(exit_fee(1_000_000, m * MONTH_MS, m * MONTH_MS) == 0);
        previous = rate;
        m = m + 1;
    };
    assert!(net_reward(1_000_000_000_000, 1) == 833_333_333);
    assert!(net_reward(1_000_000_000_000, 24) == 200_000_000_000);
    assert!(rate_ppm(1) == 10_000 && rate_ppm(12) == 30_078 && rate_ppm(24) == 100_000);
    let (c, b, f) = fee_split(18_000); assert!(c == 7_200 && b == 9_000 && f == 1_800);
    let (c, b, f) = fee_split(1); assert!(c == 1 && b == 0 && f == 0);
    assert!(full_reward(1_000_000_000_000, 24) == 200_000_000_000);
    assert!(exit_fee(18_446_744_073_709_551_615, 24 * MONTH_MS, 0) == 922_337_203_685_477_580);
}
#[test, expected_failure(abort_code = ETerm)]
fun invalid_term() { rate_ppm(25); }

#[test]
fun funded_exit_and_pause_preserve_principal() {
    let mut ctx = tx_context::dummy();
    let mut clock = sui::clock::create_for_testing(&mut ctx);
    let (mut currency, metadata) = viper::v1pr::test_currency(&mut ctx);
    let (mut vault, cap) = create(coin::mint_for_testing<V1PR>(viper::allocation::lock_rewards(), &mut ctx), @0xB, @0xA, &mut ctx);
    let position = open(&mut vault, coin::mint_for_testing<V1PR>(1_000_000_000_000, &mut ctx), 6, &clock, &mut ctx);
    let committed = full_reward(1_000_000_000_000, 6);
    let (free, reserved, paid, locked) = accounting(&vault); assert!(free == viper::allocation::lock_rewards() - committed && reserved == committed && paid == 0 && locked == 1_000_000_000_000);
    sui::clock::set_for_testing(&mut clock, 6 * MONTH_MS / 10);
    set_paused(&mut vault, &cap, true);
    let (_, earned, fee, _, burn, _) = preview(&position, &clock);
    assert!(fee == 45_000_000_000 && burn == 22_500_000_000);
    let payout = close(&mut vault, position, &clock, &mut ctx);
    assert!(payout.value() == 1_000_000_000_000 - fee + earned);
    let closed = event::events_by_type<Closed>();
    assert!(closed.length() == 1 && closed[0].vault == object::id(&vault) && closed[0].earned == earned && closed[0].pending_burn == burn && closed[0].timestamp_ms == 6 * MONTH_MS / 10);
    let pauses = event::events_by_type<PauseChanged>();
    assert!(pauses.length() == 1 && pauses[0].paused);
    let (free, reserved, paid, locked) = accounting(&vault); assert!(free == viper::allocation::lock_rewards() - earned && reserved == 0 && paid == earned && locked == 0);
    flush_burns(&mut vault, &mut currency);
    assert!(vault.pending_burn.value() == 0);
    coin::burn_for_testing(payout);
    std::unit_test::destroy(vault);
    std::unit_test::destroy(cap);
    std::unit_test::destroy(currency);
    std::unit_test::destroy(metadata);
    sui::clock::destroy_for_testing(clock);
}

public(package) fun share(vault: Vault) { transfer::share_object(vault); }

#[test]
fun all_terms_mature_with_exact_fee_and_no_extra_accrual() {
    let mut m = 1;
    while (m <= 24) { mature_term(m); m = m + 1; };
}
#[test_only]
fun mature_term(m: u64) {
    let mut ctx = tx_context::dummy();
    let mut clock = sui::clock::create_for_testing(&mut ctx);
    let (mut currency, metadata) = viper::v1pr::test_currency(&mut ctx);
    let (mut vault, cap) = create(coin::mint_for_testing<V1PR>(viper::allocation::lock_rewards(), &mut ctx), @0xB, @0xA, &mut ctx);
    let expected = full_reward(1_000_000_000, m);
    let position = open(&mut vault, coin::mint_for_testing<V1PR>(1_000_000_000, &mut ctx), m, &clock, &mut ctx);
    sui::clock::set_for_testing(&mut clock, m * MONTH_MS + 1);
    let (_, earned, fee, _, _, _) = preview(&position, &clock);
    assert!(earned == expected && fee == 0);
    let payout = close(&mut vault, position, &clock, &mut ctx);
    assert!(payout.value() == 1_000_000_000 + expected && payout.value() > 1_000_000_000);
    coin::burn_for_testing(payout);
    assert!(vault.total_locked == 0 && vault.reward_committed == 0);
    assert!(vault.rewards.value() + vault.reward_paid == viper::allocation::lock_rewards());
    std::unit_test::destroy(vault); std::unit_test::destroy(cap);
    std::unit_test::destroy(currency); std::unit_test::destroy(metadata);
    sui::clock::destroy_for_testing(clock);
}
#[test, expected_failure(abort_code = ECapacity)]
fun reward_capacity_cannot_be_overcommitted() {
    let mut ctx = tx_context::dummy();
    let clock = sui::clock::create_for_testing(&mut ctx);
    let (mut vault, _cap) = create(coin::mint_for_testing<V1PR>(viper::allocation::lock_rewards(), &mut ctx), @0xB, @0xA, &mut ctx);
    let _position = open(&mut vault, coin::mint_for_testing<V1PR>(3_000_000_000_000_000, &mut ctx), 24, &clock, &mut ctx);
    abort 999
}
#[test, expected_failure(abort_code = EClosed)]
fun paused_deposits_fail() {
    let mut ctx = tx_context::dummy();
    let clock = sui::clock::create_for_testing(&mut ctx);
    let (mut vault, cap) = create(coin::mint_for_testing<V1PR>(viper::allocation::lock_rewards(), &mut ctx), @0xB, @0xA, &mut ctx);
    set_paused(&mut vault, &cap, true);
    let _position = open(&mut vault, coin::mint_for_testing<V1PR>(1_000_000_000, &mut ctx), 24, &clock, &mut ctx);
    abort 999
}
#[test, expected_failure(abort_code = EPosition)]
fun wrong_vault_cannot_close_position() {
    let mut ctx = tx_context::dummy();
    let clock = sui::clock::create_for_testing(&mut ctx);
    let (_currency, _metadata) = viper::v1pr::test_currency(&mut ctx);
    let (mut first, _first_cap) = create(coin::mint_for_testing<V1PR>(viper::allocation::lock_rewards(), &mut ctx), @0xB, @0xA, &mut ctx);
    let (mut second, _second_cap) = create(coin::mint_for_testing<V1PR>(viper::allocation::lock_rewards(), &mut ctx), @0xB, @0xA, &mut ctx);
    let position = open(&mut first, coin::mint_for_testing<V1PR>(1_000_000_000, &mut ctx), 12, &clock, &mut ctx);
    let _payout = close(&mut second, position, &clock, &mut ctx);
    abort 999
}

/// Anyone may replenish rewards with existing V1PR. No mint or admin sweep.
public fun fund(vault: &mut Vault, coin: Coin<V1PR>) {
    event::emit(Funded { vault: object::id(vault), amount: coin.value() });
    vault.reward_funded = vault.reward_funded + coin.value();
    vault.rewards.join(coin.into_balance());
}
public fun funded(vault: &Vault): u64 { vault.reward_funded }

#[test, expected_failure(abort_code = EPosition)]
fun recorded_owner_is_enforced() {
    let mut ctx = tx_context::dummy();
    let clock = sui::clock::create_for_testing(&mut ctx);
    let (_currency, _metadata) = viper::v1pr::test_currency(&mut ctx);
    let (mut vault, _cap) = create(coin::mint_for_testing<V1PR>(viper::allocation::lock_rewards(), &mut ctx), @0xB, @0xA, &mut ctx);
    let mut position = open(&mut vault, coin::mint_for_testing<V1PR>(1_000_000_000, &mut ctx), 12, &clock, &mut ctx);
    position.owner = @0xA;
    let _payout = close(&mut vault, position, &clock, &mut ctx); abort 999
}
#[test, expected_failure(abort_code = EAdmin)]
fun another_vault_admin_cannot_pause() {
    let mut ctx = tx_context::dummy();
    let clock = sui::clock::create_for_testing(&mut ctx);
    let (mut first, _first_cap) = create(coin::mint_for_testing<V1PR>(viper::allocation::lock_rewards(), &mut ctx), @0xB, @0xA, &mut ctx);
    let (_second, second_cap) = create(coin::mint_for_testing<V1PR>(viper::allocation::lock_rewards(), &mut ctx), @0xB, @0xA, &mut ctx);
    set_paused(&mut first, &second_cap, true); abort 999
}
#[test]
fun replenishment_preserves_existing_commitments() {
    let mut ctx = tx_context::dummy();
    let mut clock = sui::clock::create_for_testing(&mut ctx);
    let (mut currency, metadata) = viper::v1pr::test_currency(&mut ctx);
    let (mut vault, cap) = create(coin::mint_for_testing<V1PR>(viper::allocation::lock_rewards(), &mut ctx), @0xB, @0xA, &mut ctx);
    let position = open(&mut vault, coin::mint_for_testing<V1PR>(1_000_000_000_000, &mut ctx), 24, &clock, &mut ctx);
    let reserved = full_reward(1_000_000_000_000, 24);
    fund(&mut vault, coin::mint_for_testing<V1PR>(1_000_000_000, &mut ctx));
    assert!(funded(&vault) == viper::allocation::lock_rewards() + 1_000_000_000);
    let funding = event::events_by_type<Funded>();
    assert!(funding.length() == 1 && funding[0].vault == object::id(&vault) && funding[0].amount == 1_000_000_000);
    assert!(vault.reward_committed == reserved && position.reward.value() == reserved);
    sui::clock::set_for_testing(&mut clock, 24 * MONTH_MS);
    let payout = close(&mut vault, position, &clock, &mut ctx);
    assert!(payout.value() == 1_000_000_000_000 + reserved);
    assert!(vault.rewards.value() + vault.reward_paid + vault.reward_committed == vault.reward_funded);
    coin::burn_for_testing(payout);
    std::unit_test::destroy(vault); std::unit_test::destroy(cap);
    std::unit_test::destroy(currency); std::unit_test::destroy(metadata);
    sui::clock::destroy_for_testing(clock);
}

#[test, expected_failure(abort_code = ECapacity)]
fun dust_lock_cannot_open_with_zero_net_reward() {
    let mut ctx = tx_context::dummy();
    let clock = sui::clock::create_for_testing(&mut ctx);
    let (mut vault, _cap) = create(coin::mint_for_testing<V1PR>(viper::allocation::lock_rewards(), &mut ctx), @0xB, @0xA, &mut ctx);
    let _position = open(&mut vault, coin::mint_for_testing<V1PR>(1, &mut ctx), 1, &clock, &mut ctx); abort 999
}

#[test]
fun completed_months_never_exceed_finished_shorter_lock() {
    let p = 1_000_000_000_000;
    let mut term = 1;
    while (term <= 24) {
        let mut completed = 0;
        while (completed < term) {
            let reward = if (completed == 0) 0 else net_reward(p, completed);
            let fee = exit_fee(p, term * MONTH_MS, completed * MONTH_MS);
            assert!(p - fee + reward <= p + reward);
            assert!(reward <= full_reward(p, term));
            completed = completed + 1;
        };
        term = term + 1;
    };
}

#[test_only]
fun assert_balanced(vault: &Vault) { assert!(vault.rewards.value() + vault.reward_committed + vault.reward_paid == vault.reward_funded); }
#[test]
fun multi_user_sequence_reconciles_every_step() {
    let mut scenario = sui::test_scenario::begin(@0xA);
    let mut clock = sui::clock::create_for_testing(scenario.ctx());
    let (mut currency, metadata) = viper::v1pr::test_currency(scenario.ctx());
    let (mut vault, cap) = create(coin::mint_for_testing<V1PR>(viper::allocation::lock_rewards(), scenario.ctx()), @0xC,@0xF,scenario.ctx());
    assert_balanced(&vault);
    let a = open(&mut vault,coin::mint_for_testing<V1PR>(1_000_000_000_000,scenario.ctx()),24,&clock,scenario.ctx()); assert_balanced(&vault);
    scenario.next_tx(@0xB);
    let b = open(&mut vault,coin::mint_for_testing<V1PR>(2_000_000_000_000,scenario.ctx()),12,&clock,scenario.ctx()); assert_balanced(&vault);
    fund(&mut vault,coin::mint_for_testing<V1PR>(1_000_000_000,scenario.ctx())); assert_balanced(&vault);
    sui::clock::set_for_testing(&mut clock,6*MONTH_MS);
    scenario.next_tx(@0xA);
    let pa = close(&mut vault,a,&clock,scenario.ctx()); assert_balanced(&vault);
    assert!(vault.pending_burn.value() > 0 && vault.burned == 0);
    scenario.next_tx(@0xD);
    flush_burns(&mut vault,&mut currency); assert_balanced(&vault);
    assert!(vault.pending_burn.value() == 0 && vault.burned > 0);
    set_paused(&mut vault,&cap,true);
    sui::clock::set_for_testing(&mut clock,12*MONTH_MS);
    scenario.next_tx(@0xB);
    let pb = close(&mut vault,b,&clock,scenario.ctx()); assert_balanced(&vault);
    assert!(vault.reward_committed == 0 && vault.total_locked == 0);
    coin::burn_for_testing(pa); coin::burn_for_testing(pb);
    std::unit_test::destroy(vault); std::unit_test::destroy(cap); std::unit_test::destroy(currency); std::unit_test::destroy(metadata);
    sui::clock::destroy_for_testing(clock); scenario.end();
}
