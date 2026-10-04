import assert from 'node:assert/strict';
import {createHash,randomBytes} from 'node:crypto';
import {mkdtempSync,writeFileSync,readFileSync,existsSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {ed25519} from '@noble/curves/ed25519.js';
import {secp256k1} from '@noble/curves/secp256k1.js';
import {toBase58} from '@mysten/sui/utils';
import bitcoinMessage from 'bitcoinjs-message';
import {score,verifyBinding,priceAt,earlyMultiplier,lockMultiplier,fullReward,hash,prepareReport,DAY,UNIT,POOL,DOGE_MESSAGE_PREFIX,suiLockMessage,bindingMessage,allocationCommitment} from './score.mjs';
import {reconcile} from './integrity.mjs';
import {transactionHash} from './networks.mjs';
import {acquirePrices} from './fetch_prices.mjs';
import {config,feed,start,treasury,wallets,suiKeys,binding,transfer,archive,evidence} from './fixtures.mjs';
const cases=[];const test=(name,fn)=>cases.push({name,fn});
const clone=x=>structuredClone(x),b=await binding(),t=transfer();
const run=(bindings=[b],ts=[t],p=archive(ts),e=evidence(ts),cfg=config)=>score(cfg,bindings,ts,p,e);
test('multipliers and capped allocation',async()=>{
 assert.deepEqual(earlyMultiplier(6),[41n,28n]);assert.deepEqual(lockMultiplier(12),[11n,10n]);
 for(const months of [0,12,24])for(const day of [1,5,6,18,19,21]) {
  const tt=transfer(day),r=await run([await binding(months)],[tt]);const [en,ed]=earlyMultiplier(day),[ln,ld]=lockMultiplier(months);
  assert.equal(BigInt(r.allocations[0].amountBaseUnits),10000n*UNIT*en*ln/(ed*ld));assert.ok(BigInt(r.summary.allocatedBaseUnits)<=POOL);
 }
 assert.equal((await run([b],[transfer(1,'100000000000000')])).summary.allocatedBaseUnits,String(POOL));
});
test('round trips net once at most',async()=>{
 const ts=Array.from({length:6},(_,i)=>({...t,index:i,confirmedAt:start+i}));
 const out=Array.from({length:5},(_,i)=>({coin:'fixture0',txHash:'0x'+(100+i).toString(16).padStart(64,'0'),amountBaseUnits:'1000000',destination:wallets[0].address,timestamp:start+i}));
 const r=await run([b],ts,archive(ts),evidence(ts,out));assert.equal(r.summary.receivedBaseUnits.fixture0,'1000000');assert.equal(r.summary.totalUsdScaled,'100000000');
 const returnedAll=await run([b],[t],archive([t]),evidence([t],[out[0]]));assert.equal(returnedAll.allocations.length,0);
});
test('receiving-wallet sources rejected',async()=>{const tt={...t,from:treasury};await assert.rejects(run([], [tt]),/Receiving-wallet/);});
test('fake receipt plus inflated aggregate rejected',async()=>{
 const e=evidence([t]);e.independent.records[0].outflowsBaseUnits='1000000';await assert.rejects(run([b],[t],archive([t]),e),/aggregate/);
 const e2=evidence([t]);e2.independent.records[0].endBalanceBaseUnits=e2.independent.records[0].startBalanceBaseUnits;await assert.rejects(run([b],[t],archive([t]),e2),/mismatch/);
});
test('itemized outflow uniqueness and time boundaries',()=>{
 const o={coin:'fixture0',txHash:'0x'+'ab'.repeat(32),amountBaseUnits:'1',destination:wallets[0].address,timestamp:start};
 const e=evidence([t],[o,{...o,txHash:o.txHash.toUpperCase()}]);assert.throws(()=>reconcile(config,[t],e.transferSource,e.independent),/Duplicate/);
 for(const timestamp of [start-1,start+21*DAY]){const x=evidence([t],[{...o,timestamp}]);assert.throws(()=>reconcile(config,[t],x.transferSource,x.independent),/outside/);}
});
test('snapshots strictly bracket window and differ',()=>{
 for(const mutate of [r=>r.startAnchor.timestamp=start,r=>r.endAnchor.timestamp=start+21*DAY-1,r=>r.endAnchor.blockHash=r.startAnchor.blockHash]){
  const e=evidence([t]);mutate(e.independent.records[0]);assert.throws(()=>reconcile(config,[t],e.transferSource,e.independent),/snapshots/);
 }
});
test('case variants never double count; index retained',async()=>{
 const lower={...t,txHash:'0x'+'ab'.repeat(32)},upper={...lower,txHash:'0x'+'AB'.repeat(32)};
 await assert.rejects(run([b],[lower,upper]),/Duplicate/);
 assert.equal((await run([b],[upper])).allocations[0].amountBaseUnits,(await run([b],[lower])).allocations[0].amountBaseUnits);
 assert.equal((await run([b],[lower,{...upper,index:1}])).summary.receivedBaseUnits.fixture0,'2000000');
 for(const [chain,tx] of [['ethereum','foo'],['dogecoin','abc'],['solana','0'.repeat(88)]])assert.throws(()=>transactionHash(chain,tx));
 assert.equal(transactionHash('solana',toBase58(new Uint8Array(64).fill(5))),toBase58(new Uint8Array(64).fill(5)));
});
test('source-only locks cannot grief destination',async()=>{
 const outsider=await binding(24,1,{sui:b.sui,sourceOnly:true});const tt=transfer(1,'1000000',1);
 const r=await run([b,outsider],[t,tt]);assert.equal(r.allocations[0].lockMonths,0);assert(r.bindingIssues.some(x=>x.reason.includes('source-only')));
});
test('Sui signed choice is authoritative; conflicts resolve liquid',async()=>{
 const a=await binding(12),other=await binding(24);const r=await run([a,other]);assert.equal(r.allocations[0].lockMonths,0);assert(r.bindingIssues.some(x=>x.reason.includes('conflicting')));
 assert.equal((await run([a])).allocations[0].lockMonths,12);
});
test('wrong Sui signing key ignored and reported',async()=>{
 const a=await binding(24);a.suiLockSignature=(await suiKeys[1].signPersonalMessage(new TextEncoder().encode(suiLockMessage(a.sui,24,start,config.bindingDeadline)))).signature;
 const r=await run([a]);assert.equal(r.allocations[0].lockMonths,0);assert.match(r.bindingIssues[0].reason,/invalid Sui/);
});
test('locked dust downgraded; generated Move parity fixture',async()=>{
 // Exact sub-cent receipt, late timing: 100 base units, a 12-month reward of 3 units.
 // Use tiny pool share alongside a large participant to force an actual dust row.
 const a=await binding(12),huge=transfer(21,'100000000000000',1),tiny=transfer(21,'1');
 const r=await run([a,await binding(0,1)],[tiny,huge]);
 const row=r.allocations.find(x=>x.sui===a.sui);
 assert(row&&BigInt(row.amountBaseUnits)>0n&&fullReward(row.amountBaseUnits,12)===0n);assert.equal(row.lockMonths,0);assert(r.bindingIssues.some(x=>x.reason.includes('dust')));
 const fixture={amountBaseUnits:row.amountBaseUnits,requestedMonths:12,lockMonths:row.lockMonths,fullReward:String(fullReward(row.amountBaseUnits,12))};
 const saved=JSON.parse(readFileSync(new URL('./snapshots/locked-dust.json',import.meta.url)));assert.deepEqual(fixture,saved);
});
test('price 98765e-10 exact single final floor and sub-1e-8',async()=>{
 const tt=transfer(21,'123456789');const r=await run([b],[tt],archive([tt],{price:'98765',expo:-10}));
 assert.equal(r.summary.totalUsdScaled,String(123456789n*98765n*100000000n/(1000000n*10000000000n)));
 const tiny=await run([b],[transfer(21,'1000000000000')],archive([transfer(21,'1000000000000')],{price:'1',expo:-10}));assert.equal(tiny.summary.totalUsdScaled,'10000');
 const p=priceAt(archive([t],{price:'2',average:'1'}).prices[`ethereum:${t.txHash}:0`],feed,start);assert.equal(p.used,p.average);
});
test('edited normalized price and raw hash fail closed',async()=>{
 const p=archive([t]);p.prices[`ethereum:${t.txHash}:0`].spot.price='2';await assert.rejects(run([b],[t],p),/match archive/);
 const p2=archive([t]);p2.rawArchive[0].rawResponse+=' ';await assert.rejects(run([b],[t],p2),/hash mismatch/);
 const p3=archive([t]);p3.rawArchive.pop();await assert.rejects(run([b],[t],p3),/match archive/);
});
test('binding cutoff signed and configured',async()=>{
 for(const a of [{...b,receivedAt:config.bindingDeadline+1},{...b,receivedAt:start-1},{...b,bindingDeadline:config.bindingDeadline+1}])assert.throws(()=>verifyBinding(a),/cutoff/);
 verifyBinding({...b,receivedAt:config.bindingDeadline});await assert.rejects(run([b],[t],archive([t]),evidence([t]),{...config,bindingDeadline:config.bindingDeadline+1}),/deadline/);
});
test('EVM valid message signed by wrong key rejected',async()=>{assert.throws(()=>verifyBinding({...b,signature:awaitedWrongEvm}),/signature/);});
const awaitedWrongEvm=await wallets[1].signMessage(b.message);
test('Solana valid message signed by wrong key rejected',()=>{
 const secret=randomBytes(32),wrong=randomBytes(32),source=toBase58(ed25519.getPublicKey(secret)),message=bindingMessage(source,b.sui,'solana',start);
 const sb={...b,chain:'solana',source,message,signature:toBase58(ed25519.sign(new TextEncoder().encode(message),secret))};verifyBinding(sb);
 assert.throws(()=>verifyBinding({...sb,signature:toBase58(ed25519.sign(new TextEncoder().encode(message),wrong))}),/signature/);
});
test('DOGE valid message signed by wrong key rejected; independent vector',()=>{
 const secret=randomBytes(32),wrong=randomBytes(32),sha=x=>createHash('sha256').update(x).digest(),pub=secp256k1.getPublicKey(secret,true),pkh=createHash('ripemd160').update(sha(pub)).digest(),payload=Buffer.concat([Buffer.from([30]),pkh]),source=toBase58(Buffer.concat([payload,sha(sha(payload)).subarray(0,4)]));
 const message=bindingMessage(source,b.sui,'dogecoin',start),db={...b,chain:'dogecoin',source,message,signature:bitcoinMessage.sign(message,secret,true,DOGE_MESSAGE_PREFIX).toString('base64')};
 assert(bitcoinMessage.verify(message,source,db.signature,DOGE_MESSAGE_PREFIX));verifyBinding(db);
 assert.throws(()=>verifyBinding({...db,signature:bitcoinMessage.sign(message,wrong,true,DOGE_MESSAGE_PREFIX).toString('base64')}),/Dogecoin/);
 verifyBinding(JSON.parse(readFileSync(new URL('./snapshots/dogecoin-binding-vector.json',import.meta.url))).binding);
});
test('M network replay and native format',async()=>{
 const mb=await binding(0,0,{chain:'memecore'});verifyBinding(mb);assert.throws(()=>verifyBinding({...mb,chain:'ethereum'}));
 const cfg={...config,coins:[{...config.coins[0],chain:'memecore',contract:'native',decimals:18},...config.coins.slice(1)]};
 const mt={...t,chain:'memecore',contract:'native',chainId:4352,receiptKind:'native-transfer',amountBaseUnits:'1000000000000000000'};
 assert.equal((await run([mb],[mt],archive([mt]),evidence([mt],[],cfg),cfg)).summary.totalUsdScaled,'100000000');
 await assert.rejects(run([mb],[{...mt,chainId:1}],archive([mt]),evidence([mt],[],cfg),cfg));
});
test('all assets reconcile independently including unbound',async()=>{
 const unbound={...t,index:1,from:wallets[2].address,amountBaseUnits:'10'},ts=[t,unbound],e=evidence(ts);
 const r=await run([b],ts,archive(ts),e);assert.equal(r.summary.treasuryReceivedBaseUnits.fixture0,'1000010');assert.equal(r.summary.receivedBaseUnits.fixture0,'1000000');assert.equal(r.summary.receivedBaseUnits.fixture9,'0');
 assert.throws(()=>reconcile(config,[t],e.transferSource,e.independent),/mismatch/);
 for(const transform of [x=>x.records.pop(),x=>x.records.push(x.records[0]),x=>x.source.provider='primary']){const v=clone(e);transform(v.independent);assert.throws(()=>reconcile(config,ts,v.transferSource,v.independent));}
});
test('unfinalized unsuccessful beyond anchor rejected',async()=>{
 for(const patch of [{finalized:false},{finalityRule:undefined},{receiptStatus:'failure'},{finalizedBlockNumber:9}])await assert.rejects(run([b],[{...t,...patch}]));
});
test('hashed bundle and CLI refuse before any output',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'v1per-scorer-'));
 try{
  const e=evidence([t]),inputs={config,bindings:[b],transfers:{source:e.transferSource,receipts:[t]},prices:archive([t]),reconciliation:e.independent};
  const raw=[JSON.stringify([t]),JSON.stringify(e.independent.records)];raw.forEach((text,i)=>writeFileSync(join(dir,`evidence${i}.json`),text));
  inputs.transfers.source.evidenceSha256=hash(raw[0]);inputs.reconciliation.source.evidenceSha256=hash(raw[1]);
  const files=Object.fromEntries(Object.keys(inputs).map(role=>[role,`${role}.json`]));for(const [role,input]of Object.entries(inputs))writeFileSync(join(dir,files[role]),JSON.stringify(input));
  const manifest=join(dir,'manifest.json');writeFileSync(manifest,JSON.stringify({files,evidenceFiles:['evidence0.json','evidence1.json']}));
  const report=await prepareReport(manifest);assert.equal(report.inputFiles.length,8);for(const f of report.inputFiles)assert.equal(f.sha256,hash(readFileSync(f.path)));
  writeFileSync(join(dir,'reconciliation.json'),JSON.stringify({...inputs.reconciliation,records:[]}));const out=join(dir,'output'),cli=spawnSync(process.execPath,['scripts/feast/score.mjs',manifest,out],{encoding:'utf8'});assert.notEqual(cli.status,0);assert.equal(existsSync(out),false);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('chained commitment binds row bytes and order',async()=>{
 const r=await run([b,await binding(0,1)],[t,transfer(1,'2000000',1)]);
 assert.equal(r.summary.allocationCommitment,allocationCommitment(r.allocations));assert.equal(r.summary.csvSha256,hash(r.csv));
 assert.notEqual(allocationCommitment([...r.allocations].reverse()),r.summary.allocationCommitment);assert.notEqual(allocationCommitment(r.allocations.map(a=>({...a,amountBaseUnits:String(BigInt(a.amountBaseUnits)+1n)}))),r.summary.allocationCommitment);
});
test('price fetch cache and serialized throttle across transfers',async()=>{
 let calls=0,waits=0,inFlight=0;const ts=[t,{...t,index:1}];
 const fetched=await acquirePrices({config,transfers:ts},{key:'test-only',intervalMs:17,sleep:async ms=>{assert.equal(ms,17);waits++;},fetchImpl:async url=>{
  assert.equal(++inFlight,1);calls++;const time=Number(url.pathname.split('/').at(-1))+1;await Promise.resolve();inFlight--;
  return {ok:true,text:async()=>JSON.stringify({parsed:[{id:feed,price:{price:'1',expo:-10,publish_time:time}}]})};
 }});
 assert.equal(calls,1441);assert.equal(waits,1441);assert.equal(fetched.rawArchive.length,1441);await run([b],ts,fetched);
});
test('binding destination, network, campaign and forged identity rejected',async()=>{
 assert.throws(()=>verifyBinding({...b,sui:suiKeys[1].toSuiAddress()}));
 assert.throws(()=>verifyBinding({...b,windowStart:start+1}));
 const identity=new Uint8Array(32);identity[0]=1;const forged=new Uint8Array(64);forged[0]=1;
 const source=toBase58(identity),message=bindingMessage(source,b.sui,'solana',start);
 assert.throws(()=>verifyBinding({...b,chain:'solana',source,message,signature:toBase58(forged)}));
 const other=await binding(0,0,{sui:suiKeys[1].toSuiAddress(),sourceOnly:true});await assert.rejects(run([b,other]),/source destinations/);
});
test('native DOGE receipt scoring and mixed-input/depth rejection',async()=>{
 const db=JSON.parse(readFileSync(new URL('./snapshots/dogecoin-binding-vector.json',import.meta.url))).binding;
 // Build a transient public receiving address independently; no wallet secret saved.
 const secret=randomBytes(32),sha=x=>createHash('sha256').update(x).digest(),pkh=createHash('ripemd160').update(sha(secp256k1.getPublicKey(secret,true))).digest(),payload=Buffer.concat([Buffer.from([30]),pkh]);
 const destination=toBase58(Buffer.concat([payload,sha(sha(payload)).subarray(0,4)]));assert.notEqual(destination,db.source);
 const cfg={...config,coins:[{...config.coins[0],chain:'dogecoin',contract:'native',decimals:8,treasury:destination},...config.coins.slice(1)]};
 const dt={...t,chain:'dogecoin',contract:'native',from:db.source,to:destination,txHash:'ef'.repeat(32),finalityRule:'60-confirmations',confirmations:60,inputAddresses:[db.source],amountBaseUnits:'100000000'};
 assert.equal((await run([db],[dt],archive([dt]),evidence([dt],[],cfg),cfg)).summary.totalUsdScaled,'100000000');
 for(const patch of [{confirmations:59},{inputAddresses:[]},{inputAddresses:[db.source,wallets[0].address]}])await assert.rejects(run([db],[{...dt,...patch}],archive([dt]),evidence([dt],[],cfg),cfg));
});
test('per-asset compensating discrepancies fail',()=>{
 const e=evidence([t]);e.independent.records[0].endBalanceBaseUnits=String(BigInt(e.independent.records[0].endBalanceBaseUnits)+1n);
 e.independent.records[1].endBalanceBaseUnits=String(BigInt(e.independent.records[1].endBalanceBaseUnits)-1n);
 assert.throws(()=>reconcile(config,[t],e.transferSource,e.independent),/mismatch/);
});
test('release config and snapshot fail closed until configured',async()=>{
 const prod=JSON.parse(readFileSync(new URL('./config.json',import.meta.url)));assert.equal(prod.windowStart,null);assert.equal(prod.bindingDeadline,null);assert(prod.coins.every(c=>!c.treasury));
 assert.equal(hash(readFileSync(new URL('./snapshots/coingecko-meme-2026-10-03.json',import.meta.url))),prod.snapshotSha256);
 for(const cfg of [{...config,liquidityProceedsPercent:24},{...config,finalityRules:{}},{...config,coins:config.coins.map((c,i)=>({...c,id:i===1?'fixture0':c.id}))}])await assert.rejects(run([b],[t],archive([t]),evidence([t]),cfg));
});
test('denominator 560 preserves fractional 24-month day-6 bonus',async()=>{
 const tiny=transfer(6,'1'),r=await run([await binding(24)],[tiny],archive([tiny],{price:'1000000'}));
 assert.equal(r.summary.totalUsdScaled,'1');assert.equal(r.allocations[0].amountBaseUnits,'183');
});
for(const {name,fn}of cases){await fn();console.log('PASS',name);}
console.log(`Feast security regressions: ${cases.length} cases passed.`);
