import {readFileSync,writeFileSync} from 'node:fs';
const rates=JSON.parse(readFileSync('src/rewardSchedule.json'));
const month=2592000000n, cases=[];
for(const p of [1200n,1999n,1000000n,1000000000000n]) for(let term=1;term<=24;term++) {
 const duration=BigInt(term)*month;
 for(const elapsed of [...new Set([0n,1n,month-1n,month,duration/10n,duration*9n/10n,duration-1n,duration,duration+1n])]) {
  const time=elapsed>duration?duration:elapsed, completed=Number(time/month);
  const reserved=p*BigInt(rates[term-1])*BigInt(term)/12000000n;
  const earned=completed===0?0n:p*BigInt(rates[completed-1])*BigInt(completed)/12000000n;
  const fee=p*500n*(duration-time)/(10000n*duration),burn=fee/2n,founder=fee/10n;
  cases.push({principal:String(p),term,elapsedMs:String(elapsed),reserved:String(reserved),earned:String(earned),fee:String(fee),community:String(fee-burn-founder),burn:String(burn),founder:String(founder),net:String(p-fee+earned)});
 }
}
// JSON is canonical input to both the TS test and the generated Move fixture.
const json=JSON.stringify(cases,null,2)+'\n';
let move='/// Generated from tests/fixtures/economics.json; do not edit.\n#[test_only]\nmodule viper::economics_golden;\nuse viper::lock_vault;\n';
// Each test has its own VM/event budget; actual preview and close are exercised.
for(let i=0;i<cases.length;i+=50) {
 move+=`#[test]\nfun shared_json_golden_vectors_${i/50}() {\n`;
 move+='    let mut ctx=sui::tx_context::dummy(); let mut clock=sui::clock::create_for_testing(&mut ctx);\n';
 move+='    let (mut vault,cap)=lock_vault::create(sui::coin::mint_for_testing<viper::v1per::V1PER>(viper::allocation::lock_rewards(),&mut ctx),@0xC,@0xF,0,&mut ctx);\n';
 for(const c of cases.slice(i,i+50))move+=`    check(&mut vault,&mut clock,&mut ctx,${c.principal},${c.term},${c.elapsedMs},${c.reserved},${c.earned},${c.fee},${c.community},${c.burn},${c.founder},${c.net});\n`;
 move+='    std::unit_test::destroy(vault); std::unit_test::destroy(cap); sui::clock::destroy_for_testing(clock);\n}\n';
}
move+=`fun check(vault: &mut lock_vault::Vault, clock: &mut sui::clock::Clock, ctx: &mut TxContext, p: u64, term: u64, elapsed: u64, reserved: u64, earned: u64, fee: u64, community: u64, burn: u64, founder: u64, net: u64) {
    assert!(lock_vault::full_reward(p,term)==reserved);
    let start=clock.timestamp_ms();
    let position=lock_vault::open(vault,sui::coin::mint_for_testing<viper::v1per::V1PER>(p,ctx),term,clock,ctx);
    sui::clock::set_for_testing(clock,start+elapsed);
    let (actual_p,e,f,c,b,o)=lock_vault::preview(&position,clock);
    assert!(actual_p==p && e==earned && f==fee && c==community && b==burn && o==founder);
    let payout=lock_vault::close(vault,position,clock,ctx); assert!(payout.value()==net);
    sui::coin::burn_for_testing(payout);
}
`;
if(process.argv.includes('--check')) {
 if(readFileSync('tests/fixtures/economics.json','utf8')!==json || readFileSync('viper/sources/economics_golden.move','utf8')!==move)throw Error('Regenerate economics fixtures before committing');
} else {writeFileSync('tests/fixtures/economics.json',json);writeFileSync('viper/sources/economics_golden.move',move);}
console.log(`Golden vector parity: ${cases.length} actual Move/TS preview and payout cases.`);
