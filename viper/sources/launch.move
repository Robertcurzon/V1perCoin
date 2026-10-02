module viper::launch;
use viper::v1pr::LaunchCap;
public fun allocate(
    cap: LaunchCap, founder: address, community: address,
    public_reserve: address, liquidity: address, later_liquidity: address,
    clock: &sui::clock::Clock, ctx: &mut TxContext,
) {
    let mut supply = viper::v1pr::consume_launch_cap(cap, ctx);
    assert!(founder != @0x0 && community != @0x0 && public_reserve != @0x0 && liquidity != @0x0 && later_liquidity != @0x0 && founder != community, 101);
    let (vault, vault_admin) = viper::lock_vault::create(supply.split(150_000_000_000_000, ctx), community, founder, clock, ctx);
    viper::lock_vault::share(vault);
    transfer::public_transfer(vault_admin, ctx.sender());
    let (claims, claim_admin) = viper::free_claims::create(supply.split(100_000_000_000_000, ctx), clock, ctx);
    viper::free_claims::share(claims);
    transfer::public_transfer(claim_admin, ctx.sender());
    transfer::public_transfer(supply.split(100_000_000_000_000, ctx), public_reserve);
    transfer::public_transfer(supply.split(200_000_000_000_000, ctx), liquidity);
    transfer::public_transfer(supply.split(150_000_000_000_000, ctx), later_liquidity);
    transfer::public_transfer(supply.split(200_000_000_000_000, ctx), community);
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
