import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { verifyMessage } from 'ethers';
import { ed25519 } from '@noble/curves/ed25519.js';
import { fromBase58 } from '@mysten/sui/utils';
import { secp256k1 } from '@noble/curves/secp256k1.js';
import { normalizeAddress, assetKey, bindingMessage, lockMessage } from './networks.mjs';
export { bindingMessage, lockMessage } from './networks.mjs';
export const DOGE_MESSAGE_PREFIX = '\x19Dogecoin Signed Message:\n';
export function verifyDogeMessage(text, source, signature) {
  if (typeof signature !== 'string' || !/^[A-Za-z0-9+/]{87}=$/.test(signature)) return false;
  const bytes = Buffer.from(signature,'base64'), message = Buffer.from(text,'utf8');
  // Canonical campaign messages fit the single-byte CompactSize encoding.
  if (bytes.length !== 65 || bytes[0] < 27 || bytes[0] > 34 || message.length >= 253 || bytes.toString('base64') !== signature) return false;
  const sha = b => createHash('sha256').update(b).digest();
  const digest = sha(sha(Buffer.concat([Buffer.from(DOGE_MESSAGE_PREFIX),Buffer.from([message.length]),message])));
  try {
    const flag = bytes[0]-27;
    const pub = secp256k1.Signature.fromBytes(bytes.subarray(1),'compact').addRecoveryBit(flag & 3).recoverPublicKey(digest).toBytes(Boolean(flag & 4));
    const pkh = createHash('ripemd160').update(sha(pub)).digest();
    return pkh.equals(Buffer.from(fromBase58(source)).subarray(1,21));
  } catch { return false; }
}
export const DAY = 86400, USD = 100_000_000n, UNIT = 1_000_000n, POOL = 100_000_000n * UNIT;
export const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const fail = (message) => { throw new Error(message); };
function integer(n, label) { if (!Number.isSafeInteger(n) || n < 0) fail(`Invalid ${label}`); return n; }
export const sourceAddress = normalizeAddress;
export function verifyBinding(b) {
  const source = sourceAddress(b.chain,b.source);
  if (!/^0x[0-9a-fA-F]{64}$/.test(b.sui) || BigInt(b.sui) === 0n || ![0,12,24].includes(b.lockMonths)) fail('Invalid Sui destination or lock choice');
  // Preserve exact source capitalization in the human-readable signed text.
  const message = bindingMessage(b.source,b.sui,b.chain,b.windowStart);
  if (b.message !== message) fail('Binding text does not match');
  for (const [text,signature] of [[message,b.signature],[lockMessage(message,b.lockMonths),b.lockSignature]]) {
    if (b.chain === 'ethereum' || b.chain === 'memecore') { if (verifyMessage(text,signature).toLowerCase() !== source) fail('Invalid EVM signature'); }
    else if (b.chain === 'dogecoin') {
      if (!verifyDogeMessage(text,source,signature)) fail('Invalid Dogecoin signature');
    }
    else { if (!ed25519.verify(fromBase58(signature),new TextEncoder().encode(text),fromBase58(source),{zip215:false})) fail('Invalid Solana signature'); }
  }
  return { ...b,source,sui:b.sui.toLowerCase() };
}
export function earlyMultiplier(day) {
  if (!Number.isInteger(day) || day < 1 || day > 21) fail('Invalid Feast day');
  return day <= 5 ? [3n,2n] : day >= 19 ? [1n,1n] : [BigInt(47-day),28n];
}
export function lockMultiplier(months) { if (months === 0) return [1n,1n]; if (months === 12) return [11n,10n]; if (months === 24) return [5n,4n]; fail('Invalid lock term'); }
function observation(o,feed,time) {
  if (o.feedId !== feed || !/^[1-9][0-9]*$/.test(o.price) || !Number.isInteger(o.expo) || o.expo < -30 || o.expo > 10 || !Number.isSafeInteger(o.publishTime) || o.publishTime > time || time-o.publishTime > 60) fail('Missing, stale, future or mismatched Pyth price');
  const shift = o.expo + 8; const value = shift >= 0 ? BigInt(o.price)*10n**BigInt(shift) : BigInt(o.price)/10n**BigInt(-shift);
  if (value === 0n) fail('Price rounds to zero'); return value;
}
export function priceAt(record,feed,time) {
  if (record.provider !== 'Pyth Benchmarks' || record.confirmedAt !== time || record.history?.length !== 1440) fail('Require Pyth spot and all 1440 preceding minute samples');
  const spot = observation(record.spot,feed,time);
  let sum = 0n;
  for (let i=0;i<1440;i++) sum += observation(record.history[i],feed,time-(i+1)*60);
  const average = sum/1440n; return {spot,average,used:spot<average?spot:average};
}
export function validateConfig(config) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(config.snapshotDate) || !/^[a-f0-9]{64}$/.test(config.snapshotSha256) || config.coins?.length !== 10) fail('Require fixed dated snapshot and exactly ten coins');
  if (config.liquidityProceedsPercent !== 25) fail('The release commits exactly 25% of Feast proceeds to liquidity');
  integer(config.windowStart,'window start'); if (config.windowStart === 0) fail('Window not configured');
  const seen = new Set(), ids = new Set(), treasuries = new Map();
  for (const c of config.coins) {
    if (typeof c.id !== 'string' || !/^[a-z0-9][a-z0-9-]*$/.test(c.id) || ids.has(c.id)) fail('Require distinct accepted-coin IDs');
    ids.add(c.id);
    assetKey(c.chain,c.contract); const treasury=sourceAddress(c.chain,c.treasury,true);
    if (treasuries.has(c.chain) && treasuries.get(c.chain)!==treasury) fail('All coins on a chain must use its published Treasury');treasuries.set(c.chain,treasury);
    if ((c.chain==='dogecoin' && c.decimals!==8) || (c.chain==='memecore' && c.decimals!==18)) fail('Wrong native asset decimals');
    if (!Number.isInteger(c.decimals)||c.decimals<0||c.decimals>30||!/^[a-f0-9]{64}$/.test(c.pythFeed)) fail('Invalid coin decimals/feed');
    const key=assetKey(c.chain,c.contract);if(seen.has(key))fail('Duplicate accepted coin');seen.add(key);
  }
}
export function score(config,bindings,transfers,prices) {
  validateConfig(config);
  const bound = new Map(), choice = new Map();
  for (const raw of bindings) { const b=verifyBinding(raw); if(b.windowStart!==config.windowStart)fail('Binding belongs to another campaign'); const key=`${b.chain}:${b.source}`;if(bound.has(key))fail('Duplicate source binding');if(choice.has(b.sui)&&choice.get(b.sui)!==b.lockMonths)fail('Conflicting lock choices for Sui wallet');bound.set(key,b);choice.set(b.sui,b.lockMonths); }
  const weights = new Map(), totals = new Map(config.coins.map(c=>[c.id,0n])), treasuryTotals = new Map(config.coins.map(c=>[c.id,0n])), audit = [], seen = new Set(); let totalUsd=0n;
  for (const t of transfers) {
    integer(t.confirmedAt,'confirmation time');integer(t.index,'transfer index');
    if (!t.txHash || typeof t.txHash !== 'string' || !/^[1-9][0-9]*$/.test(t.amountBaseUnits)) fail('Invalid transfer');
    const key=`${t.chain}:${t.txHash}:${t.index}`;if(seen.has(key))fail('Duplicate transfer');seen.add(key);
    const c=config.coins.find(c=>assetKey(c.chain,c.contract)===assetKey(t.chain,t.contract));
    if(!c)fail('Unaccepted coin in transfer export');
    if(t.chain==='dogecoin' && (!/^[a-fA-F0-9]{64}$/.test(t.txHash) || !Array.isArray(t.inputAddresses) || t.inputAddresses.length===0 || !Number.isSafeInteger(t.confirmations) || t.confirmations<60 || !t.inputAddresses.every(a=>sourceAddress('dogecoin',a)===sourceAddress('dogecoin',t.from)))) fail('DOGE receipts require a txid, output index and exclusively bound P2PKH inputs');
    if(t.chain==='memecore' && (t.chainId!==4352 || t.receiptStatus!=='success' || t.receiptKind!=='native-transfer' || t.finalized!==true)) fail('M receipts require a successful finalized native MemeCore mainnet transfer');
    if(sourceAddress(t.chain,t.to,true)!==sourceAddress(c.chain,c.treasury,true))fail('Wrong Treasury destination');
    if(t.confirmedAt>=config.windowStart && t.confirmedAt<config.windowStart+21*DAY) treasuryTotals.set(c.id,(treasuryTotals.get(c.id)??0n)+BigInt(t.amountBaseUnits));
    const b=bound.get(`${t.chain}:${sourceAddress(t.chain,t.from)}`);
    if(t.confirmedAt<config.windowStart||t.confirmedAt>=config.windowStart+21*DAY||!b) {audit.push({key,excluded:!b?'unbound source':'outside window'});continue;}
    const p=priceAt(prices[key]??{},c.pythFeed,t.confirmedAt), usd=BigInt(t.amountBaseUnits)*p.used/10n**BigInt(c.decimals);
    const day=Math.floor((t.confirmedAt-config.windowStart)/DAY)+1, [en,ed]=earlyMultiplier(day),[ln,ld]=lockMultiplier(b.lockMonths);
    // Common denominator 280 makes all declared multipliers exact, without floats.
    const points=usd*en*ln*280n/(ed*ld);
    weights.set(b.sui,(weights.get(b.sui)??0n)+points); totalUsd+=usd;
    totals.set(c.id,(totals.get(c.id)??0n)+BigInt(t.amountBaseUnits));
    audit.push({key,sui:b.sui,coin:c.id,confirmedAt:t.confirmedAt,amountBaseUnits:t.amountBaseUnits,spot:p.spot.toString(),average24h:p.average.toString(),priceUsed:p.used.toString(),usd:usd.toString(),day,early:[en.toString(),ed.toString()],lock:[ln.toString(),ld.toString()],points:points.toString()});
  }
  const totalPoints=[...weights.values()].reduce((a,b)=>a+b,0n);
  const allocations=[...weights.entries()].sort(([a],[b])=>a<b?-1:a>b?1:0).map(([sui,points])=>{
    const proportional=totalPoints===0n?0n:POOL*points/totalPoints;
    const cap=points*10_000n*UNIT/(USD*280n);const amount=proportional<cap?proportional:cap;
    return {sui,amountBaseUnits:amount.toString(),lockMonths:choice.get(sui)};
  }).filter(a=>BigInt(a.amountBaseUnits)>0n);
  const allocated=allocations.reduce((n,a)=>n+BigInt(a.amountBaseUnits),0n);if(allocated>POOL)fail('Allocation exceeds pool');
  const csv='sui_address,v1pr_amount_base_units,lock_months\n'+allocations.map(a=>`${a.sui},${a.amountBaseUnits},${a.lockMonths}\n`).join('');
  return {csv,summary:{windowStart:config.windowStart,treasuryReceivedBaseUnits:Object.fromEntries([...treasuryTotals].map(([k,v])=>[k,v.toString()])),csvSha256:hash(csv),totalUsdScaled:totalUsd.toString(),usdScale:USD.toString(),allocatedBaseUnits:allocated.toString(),burnAtFinalizeBaseUnits:(POOL-allocated).toString(),clearingPrice:allocated===0n?null:{usdNumerator:(totalUsd*UNIT).toString(),tokenDenominator:(allocated*USD).toString()},liquidityProceedsPercent:25,receivedBaseUnits:Object.fromEntries([...totals].map(([k,v])=>[k,v.toString()]))},audit,allocations};
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [file,out]=process.argv.slice(2);if(!file||!out)fail('Usage: node scripts/feast/score.mjs INPUT.json OUTPUT_DIRECTORY');
  const repository=resolve(fileURLToPath(new URL('../..',import.meta.url)));
  if(execFileSync('git',['status','--porcelain','--','scripts/feast'],{cwd:repository,encoding:'utf8'}).trim()) fail('Commit a clean scoring release before publishing results');
  const raw=readFileSync(file),input=JSON.parse(raw);const result=score(input.config,input.bindings,input.transfers,input.prices);
  mkdirSync(out,{recursive:true});writeFileSync(`${out}/allocations.csv`,result.csv);writeFileSync(`${out}/allocations.sha256`,result.summary.csvSha256+'\n');
  writeFileSync(`${out}/results.json`,JSON.stringify({...result.summary,scriptCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:repository,encoding:'utf8'}).trim(),inputSha256:hash(raw),configSha256:hash(JSON.stringify(input.config)),audit:result.audit},null,2)+'\n');
  console.log(JSON.stringify(result.summary));
}
