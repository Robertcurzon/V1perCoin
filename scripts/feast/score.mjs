import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { verifyMessage } from 'ethers';
import { ed25519 } from '@noble/curves/ed25519.js';
import { fromBase58 } from '@mysten/sui/utils';
import { secp256k1 } from '@noble/curves/secp256k1.js';
import { bcs } from '@mysten/sui/bcs';
import { verifyPersonalMessageSignature } from '@mysten/sui/verify';
import { normalizeAddress, assetKey, bindingMessage, lockMessage, suiLockMessage, transactionHash } from './networks.mjs';
import { FINALITY_RULES,requireFinality,reconcile } from './integrity.mjs';
export { bindingMessage, lockMessage, suiLockMessage } from './networks.mjs';
export const DOGE_MESSAGE_PREFIX = '\x19Dogecoin Signed Message:\n';
export function verifyDogeMessage(text, source, signature) {
  if (typeof signature !== 'string' || !/^[A-Za-z0-9+/]{87}=$/.test(signature)) return false;
  const bytes = Buffer.from(signature,'base64'), message = Buffer.from(text,'utf8');

  if (bytes.length !== 65 || bytes[0] < 27 || bytes[0] > 34 || message.length > 4096 || bytes.toString('base64') !== signature) return false;
  const sha = b => createHash('sha256').update(b).digest();
  const digest = sha(sha(Buffer.concat([Buffer.from(DOGE_MESSAGE_PREFIX),compactSize(message.length),message])));
  try {
    const flag = bytes[0]-27;
    const pub = secp256k1.Signature.fromBytes(bytes.subarray(1),'compact').addRecoveryBit(flag & 3).recoverPublicKey(digest).toBytes(Boolean(flag & 4));
    const pkh = createHash('ripemd160').update(sha(pub)).digest();
    return pkh.equals(Buffer.from(fromBase58(source)).subarray(1,21));
  } catch { return false; }
}
function compactSize(n) { if(n<253)return Buffer.from([n]);const b=Buffer.alloc(3);b[0]=253;b.writeUInt16LE(n,1);return b; }
export const DAY = 86400, USD = 100_000_000n, UNIT = 1_000_000n, POOL = 100_000_000n * UNIT;
export const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const fail = (message) => { throw new Error(message); };
function integer(n, label) { if (!Number.isSafeInteger(n) || n < 0) fail(`Invalid ${label}`); return n; }
export const sourceAddress = normalizeAddress;
export function verifyBinding(b) {
  const source = sourceAddress(b.chain,b.source);
  if (!/^0x[0-9a-fA-F]{64}$/.test(b.sui) || BigInt(b.sui) === 0n) fail('Invalid Sui destination');
  if (b.bindingDeadline !== b.windowStart + 23 * DAY || !Number.isSafeInteger(b.receivedAt) || b.receivedAt < b.windowStart || b.receivedAt > b.bindingDeadline) fail('Binding outside campaign cutoff');
  const message = bindingMessage(b.source,b.sui,b.chain,b.windowStart,b.bindingDeadline);
  if (b.message !== message) fail('Binding text does not match');
  if (b.chain === 'ethereum' || b.chain === 'memecore') { if (verifyMessage(message,b.signature).toLowerCase() !== source) fail('Invalid EVM signature'); }
  else if (b.chain === 'dogecoin') { if (!verifyDogeMessage(message,source,b.signature)) fail('Invalid Dogecoin signature'); }
  else if (!ed25519.verify(fromBase58(b.signature),new TextEncoder().encode(message),fromBase58(source),{zip215:false})) fail('Invalid Solana signature');
  return { ...b,source,sui:b.sui.toLowerCase() };
}
export function fullReward(amount, months) {
  const rates=[10000, 11052, 12216, 13503, 14924, 16496, 18233, 20153, 22275, 24620, 27213, 30078, 33245, 36746, 40615, 44892, 49619, 54844, 60618, 67001, 74056, 81854, 90473, 100000];
  if(!Number.isInteger(months)||months<1||months>24)fail('Invalid reward term');
  return BigInt(amount)*BigInt(rates[months-1])*BigInt(months)/(12n*1000000n);
}
export function allocationCommitment(rows) {
  let running=Buffer.alloc(32);
  for(const a of rows) running=Buffer.from(createHash('sha256').update(Buffer.concat([running,Buffer.from(bcs.Address.serialize(a.sui).toBytes()),Buffer.from(bcs.u64().serialize(a.amountBaseUnits).toBytes()),Buffer.from(bcs.u64().serialize(a.lockMonths).toBytes())])).digest());
  return running.toString('hex');
}
export function earlyMultiplier(day) {
  if (!Number.isInteger(day) || day < 1 || day > 21) fail('Invalid Feast day');
  return day <= 5 ? [3n,2n] : day >= 19 ? [1n,1n] : [BigInt(47-day),28n];
}
export function lockMultiplier(months) { if (months === 0) return [1n,1n]; if (months === 12) return [11n,10n]; if (months === 24) return [5n,4n]; fail('Invalid lock term'); }
const PRICE_DENOMINATOR=10n**30n;
function observation(o,feed,time) {
  if (o.feedId !== feed || !/^[1-9][0-9]*$/.test(o.price) || !Number.isInteger(o.expo) || o.expo < -30 || o.expo > 10 || !Number.isSafeInteger(o.publishTime) || o.publishTime > time || time-o.publishTime > 60) fail('Missing, stale, future or mismatched Pyth price');
  return BigInt(o.price)*10n**BigInt(o.expo+30);
}
export function priceAt(record,feed,time) {
  if (record.provider !== 'Pyth Benchmarks' || record.confirmedAt !== time || record.history?.length !== 1440) fail('Require Pyth spot and all 1440 preceding minute samples');
  const spot=observation(record.spot,feed,time)*1440n;
  let average=0n;
  for(let i=0;i<1440;i++) average+=observation(record.history[i],feed,time-(i+1)*60);
  return {spot,average,used:spot<average?spot:average,denominator:PRICE_DENOMINATOR*1440n};
}
export function validatePriceArchive(bundle) {
  if(!bundle || !Array.isArray(bundle.rawArchive) || !bundle.prices)fail('Authenticated raw price archive required');
  const archived=new Map();
  for(const entry of bundle.rawArchive) {
    if(typeof entry.rawResponse!=='string'||hash(entry.rawResponse)!==entry.sha256)fail('Price archive response hash mismatch');
    const url=new URL(entry.url);
    if(url.origin!=='https://benchmarks.pyth.network'||!/^\/v1\/updates\/price\/[0-9]+$/.test(url.pathname)||url.searchParams.getAll('ids').length!==1)fail('Invalid price archive request');
    const feed=url.searchParams.get('ids'),time=Number(url.pathname.split('/').at(-1))+1;
    const parsed=JSON.parse(entry.rawResponse).parsed?.filter(p=>p.id.replace(/^0x/,'')===feed);
    if(parsed?.length!==1)fail('Archive lacks unique requested feed');
    const p=parsed[0].price,o={feedId:feed,price:String(p.price),expo:p.expo,publishTime:p.publish_time};observation(o,feed,time);
    const k=`${feed}:${time}`;
    if(archived.has(k)&&JSON.stringify(archived.get(k))!==JSON.stringify(o))fail('Conflicting archived price');
    archived.set(k,o);
  }
  for(const record of Object.values(bundle.prices)) {
    if(!Array.isArray(record.history)||record.history.length!==1440)fail('Incomplete price history');
    [record.spot,...record.history].forEach((o,i)=>{
      const time=record.confirmedAt-i*60,actual=archived.get(`${o.feedId}:${time}`);
      if(!actual||JSON.stringify(actual)!==JSON.stringify(o))fail('Price used does not match archive');
    });
  }
  return bundle.prices;
}
export function validateConfig(config) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(config.snapshotDate) || !/^[a-f0-9]{64}$/.test(config.snapshotSha256) || config.coins?.length !== 10) fail('Require fixed dated snapshot and exactly ten coins');
  if (config.liquidityProceedsPercent !== 25) fail('The release commits exactly 25% of Feast proceeds to liquidity');
  integer(config.windowStart,'window start'); if (config.windowStart === 0) fail('Window not configured');
  integer(config.bindingDeadline,'binding deadline');
  if(config.bindingDeadline!==config.windowStart+23*DAY)fail('Binding deadline must be window end plus 48h');
  const seen = new Set(), ids = new Set(), treasuries = new Map();
  for (const c of config.coins) {
    if (typeof c.id !== 'string' || !/^[a-z0-9][a-z0-9-]*$/.test(c.id) || ids.has(c.id)) fail('Require distinct accepted-coin IDs');
    ids.add(c.id);
    if(config.finalityRules?.[c.chain]!==FINALITY_RULES[c.chain])fail('Explicit release finality rules required for every source network');
    assetKey(c.chain,c.contract); const treasury=sourceAddress(c.chain,c.treasury,true);
    if (treasuries.has(c.chain) && treasuries.get(c.chain)!==treasury) fail('All coins on a chain must use its published Treasury');treasuries.set(c.chain,treasury);
    if ((c.chain==='dogecoin' && c.decimals!==8) || (c.chain==='memecore' && c.decimals!==18)) fail('Wrong native asset decimals');
    if (!Number.isInteger(c.decimals)||c.decimals<0||c.decimals>30||!/^[a-f0-9]{64}$/.test(c.pythFeed)) fail('Invalid coin decimals/feed');
    const key=assetKey(c.chain,c.contract);if(seen.has(key))fail('Duplicate accepted coin');seen.add(key);
  }
}
export async function score(config,bindings,transfers,priceBundle,evidence) {
  validateConfig(config);
  const reconciliation=reconcile(config,transfers,evidence?.transferSource,evidence?.independent);
  const prices=validatePriceArchive(priceBundle);
  const bound=new Map(),choice=new Map(),choices=new Map(),bindingIssues=[];
  for(const raw of [...bindings].sort((a,b)=>JSON.stringify(a)<JSON.stringify(b)?-1:JSON.stringify(a)>JSON.stringify(b)?1:0)) {
    const b=verifyBinding(raw);if(b.windowStart!==config.windowStart||b.bindingDeadline!==config.bindingDeadline)fail('Binding belongs to another campaign');
    const k=`${b.chain}:${b.source}`;
    if(bound.has(k)&&bound.get(k).sui!==b.sui)fail('Conflicting source destinations');bound.set(k,b);
    if(!b.suiLockSignature) { if(b.lockMonths)bindingIssues.push({sui:b.sui,reason:'source-only lock ignored'});continue; }
    if(![0,12,24].includes(b.lockMonths)) {bindingIssues.push({sui:b.sui,reason:'unsupported signed lock ignored'});continue;}
    const text=suiLockMessage(b.sui,b.lockMonths,b.windowStart,b.bindingDeadline);
    try { await verifyPersonalMessageSignature(new TextEncoder().encode(text),b.suiLockSignature,{address:b.sui}); }
    catch {bindingIssues.push({sui:b.sui,reason:'invalid Sui lock signature ignored'});continue;}
    if(!choices.has(b.sui))choices.set(b.sui,new Set());choices.get(b.sui).add(b.lockMonths);
  }
  for(const [sui,terms] of choices) {const term=terms.size===1?[...terms][0]:0;choice.set(sui,term);if(terms.size>1)bindingIssues.push({sui,reason:'conflicting Sui-signed choices defaulted to liquid'});}
  const returns=new Map();
  for(const r of reconciliation.records)for(const o of r.outflows) {
    const k=`${assetKey(r.chain,r.contract)}:${o.destination}`;returns.set(k,(returns.get(k)??0n)+BigInt(o.amountBaseUnits));
  }
  const receiving=new Set(config.coins.map(c=>`${c.chain}:${sourceAddress(c.chain,c.treasury,true)}`));
  const weights=new Map(),totals=new Map(config.coins.map(c=>[c.id,0n])),treasuryTotals=new Map(config.coins.map(c=>[c.id,0n])),audit=[],seen=new Set();let totalUsd=0n;
  const ordered=[...transfers].sort((a,b)=>a.confirmedAt-b.confirmedAt||(transactionHash(a.chain,a.txHash)<transactionHash(b.chain,b.txHash)?-1:transactionHash(a.chain,a.txHash)>transactionHash(b.chain,b.txHash)?1:0)||a.index-b.index);
  for(const t of ordered) {
    integer(t.confirmedAt,'confirmation time');integer(t.index,'transfer index');requireFinality(t);
    const txHash=transactionHash(t.chain,t.txHash),key=`${t.chain}:${txHash}:${t.index}`;
    if(seen.has(key))fail('Duplicate transfer');seen.add(key);
    if(!/^[1-9][0-9]*$/.test(t.amountBaseUnits))fail('Invalid transfer');
    const c=config.coins.find(c=>assetKey(c.chain,c.contract)===assetKey(t.chain,t.contract));if(!c)fail('Unaccepted coin in transfer export');
    const source=sourceAddress(t.chain,t.from,true);
    if(receiving.has(`${t.chain}:${source}`))fail('Receiving-wallet sources cannot earn contributions');
    if(t.chain==='dogecoin'&&(!Array.isArray(t.inputAddresses)||!t.inputAddresses.length||!t.inputAddresses.every(a=>sourceAddress('dogecoin',a)===source)))fail('DOGE receipts require exclusively bound P2PKH inputs');
    if(t.chain==='memecore'&&t.receiptKind!=='native-transfer')fail('M receipts require native transfer');
    if(sourceAddress(t.chain,t.to,true)!==sourceAddress(c.chain,c.treasury,true))fail('Wrong Treasury destination');
    const inside=t.confirmedAt>=config.windowStart&&t.confirmedAt<config.windowStart+21*DAY;
    if(inside)treasuryTotals.set(c.id,treasuryTotals.get(c.id)+BigInt(t.amountBaseUnits));
    const b=bound.get(`${t.chain}:${source}`);
    if(!inside||!b) {audit.push({key,excluded:!b?'unbound source':'outside window'});continue;}
    const returnKey=`${assetKey(t.chain,t.contract)}:${source}`,returned=returns.get(returnKey)??0n;
    const gross=BigInt(t.amountBaseUnits),net=gross>returned?gross-returned:0n;returns.set(returnKey,returned>gross?returned-gross:0n);
    if(net===0n){audit.push({key,excluded:'netted receiving-wallet return',amountBaseUnits:t.amountBaseUnits});continue;}
    const p=priceAt(prices[key]??{},c.pythFeed,t.confirmedAt);
    const usd=net*p.used*USD/(p.denominator*10n**BigInt(c.decimals));
    const day=Math.floor((t.confirmedAt-config.windowStart)/DAY)+1,[en,ed]=earlyMultiplier(day),term=choice.get(b.sui)??0,[ln,ld]=lockMultiplier(term);
    // Floor the base quantity first; denominator 560 exactly carries every bonus.
    const base=usd*10000n*UNIT/USD,points=base*en*ln*560n/(ed*ld);
    weights.set(b.sui,(weights.get(b.sui)??0n)+points);totalUsd+=usd;totals.set(c.id,totals.get(c.id)+net);
    audit.push({key,sui:b.sui,coin:c.id,confirmedAt:t.confirmedAt,amountBaseUnits:String(net),grossAmountBaseUnits:t.amountBaseUnits,usd:String(usd),priceNumerator:String(p.used),priceDenominator:String(p.denominator),spotNumerator:String(p.spot),averageNumerator:String(p.average),baseQuantity:String(base),day,early:[String(en),String(ed)],lock:[String(ln),String(ld)],points:String(points)});
  }
  const totalPoints=[...weights.values()].reduce((a,b)=>a+b,0n);
  const allocations=[...weights.entries()].sort(([a],[b])=>a<b?-1:a>b?1:0).map(([sui,points])=>{
    const quantity=points/560n,proportional=totalPoints===0n?0n:POOL*points/totalPoints,amount=proportional<quantity?proportional:quantity;
    let lockMonths=choice.get(sui)??0;
    if(amount>0n&&lockMonths!==0&&fullReward(amount,lockMonths)===0n){bindingIssues.push({sui,reason:'locked dust defaulted to liquid'});lockMonths=0;}
    return {sui,amountBaseUnits:String(amount),lockMonths};
  }).filter(a=>BigInt(a.amountBaseUnits)>0n);
  const allocated=allocations.reduce((n,a)=>n+BigInt(a.amountBaseUnits),0n);if(allocated>POOL)fail('Allocation exceeds pool');
  const csv='sui_address,v1per_amount_base_units,lock_months\n'+allocations.map(a=>`${a.sui},${a.amountBaseUnits},${a.lockMonths}\n`).join('');
  audit.sort((a,b)=>a.key<b.key?-1:a.key>b.key?1:0);bindingIssues.sort((a,b)=>JSON.stringify(a)<JSON.stringify(b)?-1:JSON.stringify(a)>JSON.stringify(b)?1:0);
  return {csv,summary:{windowStart:config.windowStart,bindingDeadline:config.bindingDeadline,treasuryReceivedBaseUnits:Object.fromEntries([...treasuryTotals].map(([k,v])=>[k,String(v)])),csvSha256:hash(csv),allocationCommitment:allocationCommitment(allocations),allocationRows:allocations.length,totalUsdScaled:String(totalUsd),usdScale:String(USD),allocatedBaseUnits:String(allocated),burnAtFinalizeBaseUnits:String(POOL-allocated),clearingPrice:allocated===0n?null:{usdNumerator:String(totalUsd*UNIT),tokenDenominator:String(allocated*USD)},liquidityProceedsPercent:25,receivedBaseUnits:Object.fromEntries([...totals].map(([k,v])=>[k,String(v)]))},audit,bindingIssues,allocations};
}
export function readBundle(file) {
  const raw=readFileSync(file),bundle=JSON.parse(raw),base=dirname(resolve(file));
  if(!bundle.files || Object.keys(bundle.files).sort().join(',')!=='bindings,config,prices,reconciliation,transfers')fail('Require a five-file input manifest: config, bindings, transfers, prices, reconciliation');
  const input={},inputFiles=[{role:'manifest',path:resolve(file),sha256:hash(raw)}];
  for(const [role,path] of Object.entries(bundle.files)) {
    if(typeof path!=='string'||!path)fail('Input file path required');
    const absolute=resolve(base,path),bytes=readFileSync(absolute); input[role]=JSON.parse(bytes);
    inputFiles.push({role,path:absolute,sha256:hash(bytes)});
  }
  if(!Array.isArray(bundle.evidenceFiles)||bundle.evidenceFiles.length<2)fail('Archive primary and independent source evidence files');
  for(const path of bundle.evidenceFiles) {
    if(typeof path!=='string'||!path)fail('Evidence path required');
    const absolute=resolve(base,path);inputFiles.push({role:'evidence',path:absolute,sha256:hash(readFileSync(absolute))});
  }
  for(const source of [input.transfers.source,input.reconciliation.source])if(!inputFiles.some(f=>f.role==='evidence'&&f.sha256===source?.evidenceSha256))fail('Source evidence hash must match an archived input file');
  return {input,inputFiles};
}
export async function prepareReport(file) {
  const {input,inputFiles}=readBundle(file); validateConfig(input.config);
  if(!Array.isArray(input.transfers.receipts))fail('Transfers file requires receipts and source provenance');
  const result=await score(input.config,input.bindings,input.transfers.receipts,input.prices,{transferSource:input.transfers.source,independent:input.reconciliation});
  const reconciliation=reconcile(input.config,input.transfers.receipts,input.transfers.source,input.reconciliation);
  return {result,inputFiles,reconciliation};
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [file,out]=process.argv.slice(2);if(!file||!out)fail('Usage: node scripts/feast/score.mjs INPUT_MANIFEST.json OUTPUT_DIRECTORY');
  // All integrity checks precede directory creation or any CSV write.
  const {result,inputFiles,reconciliation}=await prepareReport(file);
  const repository=resolve(fileURLToPath(new URL('../..',import.meta.url)));
  if(execFileSync('git',['status','--porcelain','--','scripts/feast'],{cwd:repository,encoding:'utf8'}).trim()) fail('Commit a clean scoring release before publishing results');
  const scriptCommit=execFileSync('git',['rev-parse','HEAD'],{cwd:repository,encoding:'utf8'}).trim();
  mkdirSync(out,{recursive:true});writeFileSync(`${out}/allocations.csv`,result.csv);writeFileSync(`${out}/allocations.sha256`,result.summary.csvSha256+'\n');writeFileSync(`${out}/commitment.sha256`,result.summary.allocationCommitment+'\n');
  writeFileSync(`${out}/results.json`,JSON.stringify({...result.summary,scriptCommit,inputFiles,reconciliation,audit:result.audit,bindingIssues:result.bindingIssues},null,2)+'\n');
  console.log(JSON.stringify(result.summary));
}
