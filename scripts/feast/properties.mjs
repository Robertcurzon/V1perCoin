import fc from 'fast-check';
import assert from 'node:assert/strict';
import {Wallet} from 'ethers';
import {score,bindingMessage,lockMessage,POOL,UNIT,USD,DAY} from './score.mjs';
const treasury='0x'+'bc'.repeat(20),feed='ab'.repeat(32),start=1_000_000;
const config={snapshotDate:'2026-10-03',snapshotSha256:'cc'.repeat(32),finalityRules:{ethereum:'finalized-block'},windowStart:start,liquidityProceedsPercent:25,coins:Array.from({length:10},(_,i)=>({id:`fixture${i}`,chain:'ethereum',contract:'0x'+(i+1).toString(16).padStart(40,'0'),decimals:6,pythFeed:feed,treasury}))};
const wallets=[1,2,3].map(i=>new Wallet('0x'+String(i).repeat(64))), destinations=[1,2,3].map(i=>'0x'+(i+10).toString(16).repeat(64));
const signed=await Promise.all(wallets.map(async(w,i)=>Promise.all([0,12,24].map(async lockMonths=>{
 const message=bindingMessage(w.address,destinations[i],'ethereum',start);
 return {chain:'ethereum',windowStart:start,source:w.address,sui:destinations[i],lockMonths,message,signature:await w.signMessage(message),lockSignature:await w.signMessage(lockMessage(message,lockMonths))};
}))));
function run(amounts,day=1,term=0,reverse=false) {
 const transfers=amounts.map((a,i)=>({chain:'ethereum',finalityRule:'finalized-block',chainId:1,blockNumber:10,finalizedBlockNumber:20,finalized:true,receiptStatus:'success',contract:config.coins[0].contract,txHash:`fixture${i}`,index:0,from:wallets[i].address,to:treasury,confirmedAt:start+((i===0?day:21)-1)*DAY,amountBaseUnits:String(a),finalized:true,receiptStatus:'success',commitment:'finalized'}));
 const prices=Object.fromEntries(transfers.map(t=>{const observation=time=>({feedId:feed,price:'100000000',expo:-8,publishTime:time});return [`ethereum:${t.txHash}:0`,{provider:'Pyth Benchmarks',confirmedAt:t.confirmedAt,spot:observation(t.confirmedAt),history:Array.from({length:1440},(_,i)=>observation(t.confirmedAt-(i+1)*60))}];}));
 const bindings=signed.map((b,i)=>b[i===0?term:0]);
 return score(config,reverse?bindings.reverse():bindings,reverse?transfers.reverse():transfers,prices);
}
const amount=fc.bigInt({min:1n,max:10n**16n}),amounts=fc.tuple(amount,amount,amount);
const own=r=>BigInt(r.allocations.find(a=>a.sui===destinations[0])?.amountBaseUnits??'0');
const options={seed:0xC0FFEE,numRuns:100};
fc.assert(fc.property(amounts,a=>BigInt(run(a).summary.allocatedBaseUnits)<=POOL),options);
fc.assert(fc.property(amounts,amount,(a,extra)=>own(run([a[0]+extra,a[1],a[2]]))>=own(run(a))),options);
fc.assert(fc.property(amounts,fc.integer({min:1,max:21}),fc.integer({min:1,max:21}),(a,d,e)=>own(run(a,Math.min(d,e)))>=own(run(a,Math.max(d,e)))),options);
fc.assert(fc.property(amounts,fc.integer({min:0,max:2}),fc.integer({min:0,max:2}),(a,m,n)=>own(run(a,1,Math.max(m,n)))>=own(run(a,1,Math.min(m,n)))),options);
fc.assert(fc.property(amounts,fc.integer({min:1,max:21}),fc.integer({min:0,max:2}),(a,d,m)=>{
 const r=run(a,d,m);
 return r.allocations.every(allocation=>{
  const points=r.audit.filter(t=>t.sui===allocation.sui).reduce((sum,t)=>sum+BigInt(t.points),0n);
  // Bonus-adjusted minimum price is an upper bound on token quantity.
  return BigInt(allocation.amountBaseUnits)<=points*10_000n*UNIT/(USD*280n);
 });
}),options);
fc.assert(fc.property(amounts,fc.integer({min:1,max:21}),fc.integer({min:0,max:2}),(a,d,m)=>{
 const forward=run(a,d,m),reverse=run(a,d,m,true);
 assert.deepEqual(forward,reverse);return forward.csv===reverse.csv;
}),options);
console.log('Scorer properties: 6 × 100 fixed-seed cases passed (cap, USD/time/term monotonicity, bonus-adjusted floor, input order).');
