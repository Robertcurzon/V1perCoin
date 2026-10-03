module viper::launch;
use viper::v1pr::LaunchCap;
const ECustody: u64 = 101;
fun validate_custody(addresses: vector<address>) {
    let mut i = 0;
    while (i < addresses.length()) {
        assert!(addresses[i] != @0x0, ECustody);
        let mut j = i + 1;
        while (j < addresses.length()) { assert!(addresses[i] != addresses[j], ECustody); j = j + 1; };
        i = i + 1;
    };
}
public fun allocate(
    cap: LaunchCap, founder: address, community: address,
    public_reserve: address, liquidity: address, later_liquidity: address,
    clock: &sui::clock::Clock, ctx: &mut TxContext,
) {
    let mut supply = viper::v1pr::consume_launch_cap(cap, ctx);
    validate_custody(vector[founder, community, public_reserve, liquidity, later_liquidity]);
    let (vault, vault_admin) = viper::lock_vault::create(supply.split(viper::allocation::lock_rewards(), ctx), community, founder, ctx);
    viper::lock_vault::share(vault);
    transfer::public_transfer(vault_admin, ctx.sender());
    let (claims, claim_admin) = viper::free_claims::create(supply.split(viper::allocation::free_claims(), ctx), clock, ctx);
    viper::free_claims::share(claims);
    transfer::public_transfer(claim_admin, ctx.sender());
    transfer::public_transfer(supply.split(viper::allocation::public_reserve(), ctx), public_reserve);
    transfer::public_transfer(supply.split(viper::allocation::initial_liquidity(), ctx), liquidity);
    transfer::public_transfer(supply.split(viper::allocation::later_liquidity(), ctx), later_liquidity);
    transfer::public_transfer(supply.split(viper::allocation::community(), ctx), community);
    assert!(supply.value() == viper::allocation::operations(), ECustody);
    transfer::public_transfer(supply, founder);
}

#[test]
fun allocation_matches_entire_initial_supply() {
    let mut scenario = sui::test_scenario::begin(@0xF);
    let clock = sui::clock::create_for_testing(scenario.ctx());
    let cap = viper::v1pr::test_launch_cap(scenario.ctx());
    allocate(cap, @0xA, @0xB, @0xC, @0xD, @0xE, &clock, scenario.ctx());
    scenario.next_tx(@0xF);
    let vault = scenario.take_shared<viper::lock_vault::Vault>();
    let (free, committed, paid, locked) = viper::lock_vault::accounting(&vault);
    assert!(free == 150_000_000_000_000 && committed == 0 && paid == 0 && locked == 0);
    sui::test_scenario::return_shared(vault);
    let claims = scenario.take_shared<viper::free_claims::Pool>();
    assert!(viper::free_claims::remaining(&claims) == 100_000_000_000_000);
    sui::test_scenario::return_shared(claims);
    let recipients = vector[@0xA, @0xB, @0xC, @0xD, @0xE];
    let amounts = vector[100_000_000_000_000, 200_000_000_000_000, 100_000_000_000_000, 200_000_000_000_000, 150_000_000_000_000];
    let mut i = 0;
    while (i < 5) {
        scenario.next_tx(recipients[i]);
        let coin = scenario.take_from_sender<sui::coin::Coin<viper::v1pr::V1PR>>();
        assert!(coin.value() == amounts[i]);
        sui::coin::burn_for_testing(coin);
        i = i + 1;
    };
    sui::clock::destroy_for_testing(clock); scenario.end();
}

#[test, expected_failure(abort_code = ECustody)]
fun allocate_zero_custody_fails() {
    let mut ctx = tx_context::dummy(); let clock = sui::clock::create_for_testing(&mut ctx);
    allocate(viper::v1pr::test_launch_cap(&mut ctx), @0xA,@0xB,@0x0,@0xD,@0xE,&clock,&mut ctx); abort 999
}
#[test, expected_failure(abort_code = ECustody)]
fun allocate_duplicate_custody_fails() {
    let mut ctx = tx_context::dummy(); let clock = sui::clock::create_for_testing(&mut ctx);
    allocate(viper::v1pr::test_launch_cap(&mut ctx), @0xA,@0xB,@0xC,@0xC,@0xE,&clock,&mut ctx); abort 999
}
