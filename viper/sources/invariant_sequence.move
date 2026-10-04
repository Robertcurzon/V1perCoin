#[test_only]
module viper::invariant_sequence;
use sui::coin::{Self,Coin};
use sui::coin_registry::Currency;
use viper::v1per::V1PER;
use viper::lock_vault::{Vault,Position,create,accounting,funded,open,net_reward,preview,close,fund,flush_burns,set_paused};
const MONTH_MS: u64=2_592_000_000;

#[test_only]
fun next_random(seed: &mut u64): u64 { *seed = (((*seed as u128)*1_664_525+1_013_904_223)%4_294_967_296) as u64; *seed }
#[test_only]
fun sequence_invariants(vault: &Vault, currency: &Currency<V1PER>, pool: &viper::feast::Pool, burn_shares: u64, payouts: &vector<u64>, allowed: &vector<u64>) {
    let (free,committed,paid,_)=accounting(vault); assert!(free+committed+paid==funded(vault));
    let (_,pending,burned)=viper::lock_vault::sequence_state(vault);
    let (_,_,_,feast_burned)=viper::feast::accounting(pool);
    assert!(currency.total_supply().destroy_some()==viper::allocation::initial_supply()-feast_burned-burned);
    assert!(pending+burned==burn_shares);
    let mut i=0; while(i < 5) { assert!(payouts[i]<=allowed[i]); i=i+1; };
}
#[test]
fun fixed_seed_600_operations_five_users() {
    let mut s=sui::test_scenario::begin(@0xA); let mut clock=sui::clock::create_for_testing(s.ctx());
    let (mut currency,metadata)=viper::v1per::test_currency(s.ctx());
    // One physical initial inventory, split and recycled: no extra mint during the sequence.
    let mut stock=coin::mint_for_testing<V1PER>(viper::allocation::initial_supply(),s.ctx());
    let (mut vault,cap)=create(stock.split(viper::allocation::lock_rewards(),s.ctx()),@0xC,@0x99,0,s.ctx());
    let (mut pool,fcap)=viper::feast::create(stock.split(viper::allocation::public_reserve(),s.ctx()),&clock,s.ctx());
    let users=vector[@0xA,@0xB,@0xD,@0xE,@0xF]; let terms=vector[1,3,6,12,24];
    let mut hash=vector[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
    let feast_terms=vector[12,24,0,0,12];let mut row=0;
    while (row < users.length()) {let mut bytes=hash;let amount=1_000_000_000u64;bytes.append(sui::bcs::to_bytes(&users[row]));bytes.append(sui::bcs::to_bytes(&amount));bytes.append(sui::bcs::to_bytes(&feast_terms[row]));hash=std::hash::sha2_256(bytes);row=row+1;};
    viper::feast::set_allocations(&mut pool,&fcap,users,vector[1_000_000_000,1_000_000_000,1_000_000_000,1_000_000_000,1_000_000_000],feast_terms,hash,5,true,&clock);
    sui::clock::set_for_testing(&mut clock,7*86_400_000);
    viper::feast::finalize(&mut pool,&fcap,&mut vault,&mut currency,hash,&clock);
    let mut positions: vector<Option<Position>> = vector[option::none(),option::none(),option::none(),option::none(),option::none()];
    let mut payouts=vector[0,0,0,0,0]; let mut allowed=vector[0,0,0,0,0];
    let mut burn_shares=0; let mut seed=0xC0FFEE; let mut i=0;
    let mut counts: vector<u64> = vector[0,0,0,0,0,0,0];
    sequence_invariants(&vault,&currency,&pool,burn_shares,&payouts,&allowed);
    while(i < 600) {
        let user=if(i < 5) i else next_random(&mut seed)%5;
        s.next_tx(users[user]);
        if(i < 5) {
            if(user==2 || user==3) {
                viper::feast::claim(&mut pool,&clock,s.ctx()); s.next_tx(users[user]);
                stock.join(s.take_from_sender<Coin<V1PER>>());
            } else {
                viper::feast::claim_locked(&mut pool,&mut vault,&clock,s.ctx()); s.next_tx(users[user]);
                positions.borrow_mut(user).fill(s.take_from_sender<Position>());
            };
            *counts.borrow_mut(5)=counts[5]+1;
        } else {
            let op=next_random(&mut seed)%6; let (paused,_,_)=viper::lock_vault::sequence_state(&vault);
            if(op==0 && !paused && positions[user].is_none()) {
                let term=terms[next_random(&mut seed)%5];
                let amount=1_000_000_000+next_random(&mut seed)%1_000_000_000;
                positions.borrow_mut(user).fill(open(&mut vault,stock.split(amount,s.ctx()),term,&clock,s.ctx()));
                *counts.borrow_mut(0)=counts[0]+1;
            } else if((op==1 || op==2) && positions[user].is_some()) {
                let position=positions.borrow_mut(user).extract();
                let (start,duration)=viper::lock_vault::sequence_time(&position);
                if(op==2 && clock.timestamp_ms() < start+duration) sui::clock::set_for_testing(&mut clock,start+duration);
                let (principal,earned,fee,_,burn,_)=preview(&position,&clock);
                let elapsed=clock.timestamp_ms()-start; let completed=if(elapsed>=duration) duration/MONTH_MS else elapsed/MONTH_MS;
                let limit=principal+if(completed==0) 0 else net_reward(principal,completed);
                let payout=close(&mut vault,position,&clock,s.ctx());
                assert!(payout.value()==principal-fee+earned && payout.value()<=limit);
                *payouts.borrow_mut(user)=payouts[user]+payout.value(); *allowed.borrow_mut(user)=allowed[user]+limit;
                burn_shares=burn_shares+burn; stock.join(payout); *counts.borrow_mut(op)=counts[op]+1;
            } else if(op==3) {
                fund(&mut vault,stock.split(1_000_000,s.ctx())); *counts.borrow_mut(3)=counts[3]+1;
            } else if(op==4) {
                flush_burns(&mut vault,&mut currency); *counts.borrow_mut(4)=counts[4]+1;
            } else {
                let (was_paused,_,_)=viper::lock_vault::sequence_state(&vault); let paused=!was_paused; set_paused(&mut vault,&cap,paused); *counts.borrow_mut(6)=counts[6]+1;
            };
        };
        sequence_invariants(&vault,&currency,&pool,burn_shares,&payouts,&allowed);
        sui::clock::increment_for_testing(&mut clock,next_random(&mut seed)%86_400_000);
        i=i+1;
    };
    // Coverage assertions make seed changes fail if an operation class disappears.
    let mut j=0; while(j < counts.length()) {assert!(counts[j]>0); j=j+1;};
    sui::clock::increment_for_testing(&mut clock,90*86_400_000);
    viper::feast::burn_unclaimed(&mut pool,&mut vault,&mut currency,&clock);
    sequence_invariants(&vault,&currency,&pool,burn_shares,&payouts,&allowed);
    positions.do!(|p| { if(p.is_some()) std::unit_test::destroy(p.destroy_some()) else p.destroy_none(); });
    std::unit_test::destroy(stock); std::unit_test::destroy(vault); std::unit_test::destroy(cap);
    std::unit_test::destroy(pool); std::unit_test::destroy(fcap); std::unit_test::destroy(currency); std::unit_test::destroy(metadata);
    sui::clock::destroy_for_testing(clock); s.end();
}
