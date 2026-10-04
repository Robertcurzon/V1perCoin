module viper::v1per;

use sui::coin::Coin;
use sui::coin_registry::{Self, Currency};

/// One billion V1PER with six display decimals.
const ELaunchSupply: u64 = 100;

/// One-time witness: package publication is the only creation path.
public struct V1PER has drop {}

fun init(witness: V1PER, ctx: &mut TxContext) {
    let (mut currency, mut treasury_cap) = coin_registry::new_currency_with_otw(
        witness,
        6,
        b"V1PER".to_string(),
        b"V1PER Coin".to_string(),
        b"Sui-first meme coin with a capped initial mint and burn-only supply".to_string(),
        b"".to_string(), // Set the hosted icon using MetadataCap before disabling upgrades.
        ctx,
    );

    let initial_coin = treasury_cap.mint(viper::allocation::initial_supply(), ctx);
    currency.make_supply_burn_only(treasury_cap);
    let metadata_cap = currency.finalize(ctx);

    // Custody and distribution are separate launch transactions. Publication
    // gives the publisher a sealed allocation capability and metadata authority.
    transfer::transfer(LaunchCap { id: object::new(ctx), supply: initial_coin.into_balance() }, ctx.sender());
    transfer::public_transfer(metadata_cap, ctx.sender());
}

/// Voluntary direct burn.
public fun burn(currency: &mut Currency<V1PER>, coin: Coin<V1PER>) {
    currency.burn(coin);
}

#[test]
fun initial_supply_is_sealed_in_launch_cap() {
    let mut scenario = sui::test_scenario::begin(@0xA);
    init(V1PER {}, scenario.ctx());
    scenario.next_tx(@0xA);

    let cap = scenario.take_from_sender<LaunchCap>();
    assert!(cap.supply.value() == viper::allocation::initial_supply(), 0);
    scenario.return_to_sender(cap);
    scenario.end();
}

/// Consumed by allocation: the entire initial supply is required, exactly once.
public struct LaunchCap has key { id: UID, supply: sui::balance::Balance<V1PER> }
public(package) fun consume_launch_cap(cap: LaunchCap, ctx: &mut TxContext): Coin<V1PER> {
    let LaunchCap { id, supply } = cap;
    assert!(supply.value() == viper::allocation::initial_supply(), ELaunchSupply);
    id.delete();
    sui::coin::from_balance(supply, ctx)
}
#[test_only]
public fun test_currency(ctx: &mut TxContext): (Currency<V1PER>, sui::coin_registry::MetadataCap<V1PER>) {
    let (builder, mut cap) = coin_registry::new_currency_with_otw(V1PER {}, 6, b"V1PER".to_string(), b"V1PER Coin".to_string(), b"".to_string(), b"".to_string(), ctx);
    let minted = cap.mint(viper::allocation::initial_supply(), ctx);
    sui::coin::burn_for_testing(minted);
    let (mut currency, metadata) = builder.finalize_unwrap_for_testing(ctx);
    currency.make_supply_burn_only(cap);
    (currency, metadata)
}

#[test_only]
public fun test_launch_cap(ctx: &mut TxContext): LaunchCap {
    LaunchCap { id: object::new(ctx), supply: sui::coin::mint_for_testing<V1PER>(viper::allocation::initial_supply(), ctx).into_balance() }
}

#[test]
fun voluntary_burn_reduces_total_supply() {
    let mut ctx=tx_context::dummy(); let (mut currency,metadata)=test_currency(&mut ctx);
    burn(&mut currency,sui::coin::mint_for_testing<V1PER>(123_456_789,&mut ctx));
    assert!(currency.total_supply().destroy_some()==viper::allocation::initial_supply()-123_456_789);
    std::unit_test::destroy(currency); std::unit_test::destroy(metadata);
}
