import fc from 'fast-check';
import assert from 'node:assert/strict';
import {score,POOL} from './score.mjs';
import {config,wallets,suiKeys,binding,transfer,archive,evidence} from './fixtures.mjs';
const signed=await Promise.all(wallets.map((_,i)=>Promise.all([0,12,24].map(m=>binding(m,i)))));
async function run(amounts,day=1,term=0,reverse=false,price='100000000') {
 const ts=amounts.map((a,i)=>transfer(i===0?day:21,String(a),i)),bindings=signed.map((b,i)=>b[i===0?term:0]);
 return score(config,reverse?[...bindings].reverse():bindings,reverse?[...ts].reverse():ts,archive(ts,{price}),evidence(ts));
}
const amount=fc.bigInt({min:1n,max:10n**16n}),amounts=fc.tuple(amount,amount,amount),options={seed:0xC0FFEE,numRuns:100};
const own=r=>BigInt(r.allocations.find(a=>a.sui===suiKeys[0].toSuiAddress())?.amountBaseUnits??0);
await fc.assert(fc.asyncProperty(amounts,async a=>BigInt((await run(a)).summary.allocatedBaseUnits)<=POOL),options);
await fc.assert(fc.asyncProperty(amounts,amount,async(a,extra)=>own(await run([a[0]+extra,a[1],a[2]]))>=own(await run(a))),options);
await fc.assert(fc.asyncProperty(amounts,fc.integer({min:1,max:21}),fc.integer({min:1,max:21}),async(a,d,e)=>own(await run(a,Math.min(d,e)))>=own(await run(a,Math.max(d,e)))),options);
await fc.assert(fc.asyncProperty(amounts,fc.integer({min:0,max:2}),fc.integer({min:0,max:2}),async(a,m,n)=>own(await run(a,1,Math.max(m,n)))>=own(await run(a,1,Math.min(m,n)))),options);
// Independent rational reference: no scorer multipliers, points or audit fields used.
// Scale all bonus denominators together, then enumerate wallets and their quantities.
await fc.assert(fc.asyncProperty(amounts,fc.integer({min:1,max:21}),fc.integer({min:0,max:2}),fc.bigInt({min:1n,max:100000000n}),async(a,d,m,price)=>{
 const dayNumerator=d<=5?42:d>=19?28:47-d,termNumerator=[20,22,25][m];
 const quantities=a.map((n,i)=>{
  const dollarsScaled=n*price/1000000n;
  const base=dollarsScaled*10000n*1000000n/100000000n;
  return base*BigInt(i===0?dayNumerator:28)*BigInt(i===0?termNumerator:20);
 });
 const sum=quantities.reduce((a,b)=>a+b,0n),denominator=28n*20n,cap=100000000n*1000000n;
 const expected=new Map(quantities.map((q,i)=>[suiKeys[i].toSuiAddress(),(sum===0n?0n:q/denominator<cap*q/sum?q/denominator:cap*q/sum).toString()]));
 const r=await run(a,d,m,false,String(price));
 for(const wallet of suiKeys) assert.equal(r.allocations.find(x=>x.sui===wallet.toSuiAddress())?.amountBaseUnits??'0',expected.get(wallet.toSuiAddress()));return true;
}),options);
await fc.assert(fc.asyncProperty(amounts,fc.integer({min:1,max:21}),fc.integer({min:0,max:2}),async(a,d,m)=>{assert.deepEqual(await run(a,d,m),await run(a,d,m,true));return true;}),options);
console.log('Scorer properties: 6 × 100 fixed-seed cases passed; independent pre-bonus floor reference, cap, monotonicity and order.');
