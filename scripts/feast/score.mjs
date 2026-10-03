import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { verifyMessage } from 'ethers';
import { ed25519 } from '@noble/curves/ed25519.js';
import { fromBase58 } from '@mysten/sui/utils';
export const DAY = 86400, USD = 100_000_000n, UNIT = 1_000_000n, POOL = 100_000_000n * UNIT;
export const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const fail = (message) => { throw new Error(message); };
function integer(n, label) { if (!Number.isSafeInteger(n) || n < 0) fail(`Invalid ${label}`); return n; }
export function sourceAddress(chain,address) {
  if (chain === 'ethereum' && /^0x[0-9a-fA-F]{40}$/.test(address) && BigInt(address) !== 0n) return address.toLowerCase();
  if (chain === 'solana') { try { if (fromBase58(address).length === 32) return address; } catch { /* reject invalid base58 */ } }
  fail('Unsupported chain or invalid address');
}
export function bindingMessage(source, sui) { return `Bind ${source} to Sui ${sui} for the V1PR Feast`; }
export function lockMessage(message,months) { return `${message}\nLock choice: ${months} months`; }
export function verifyBinding(b) {
  const source = sourceAddress(b.chain,b.source);
  if (!/^0x[0-9a-fA-F]{64}$/.test(b.sui) || BigInt(b.sui) === 0n || ![0,12,24].includes(b.lockMonths)) fail('Invalid Sui destination or lock choice');
  // Preserve exact source capitalization in the human-readable signed text.
  const message = bindingMessage(b.source,b.sui);
  if (b.message !== message) fail('Binding text does not match');
  for (const [text,signature] of [[message,b.signature],[lockMessage(message,b.lockMonths),b.lockSignature]]) {
    if (b.chain === 'ethereum') { if (verifyMessage(text,signature).toLowerCase() !== source) fail('Invalid Ethereum signature'); }
    else { if (!ed25519.verify(fromBase58(signature),new TextEncoder().encode(text),fromBase58(source))) fail('Invalid Solana signature'); }
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
  integer(config.windowStart,'window start'); if (config.windowStart === 0) fail('Window not configured');
  const seen = new Set(), treasuries = new Map();
  for (const c of config.coins) {
    sourceAddress(c.chain,c.contract); const treasury=sourceAddress(c.chain,c.treasury);
    if (treasuries.has(c.chain) && treasuries.get(c.chain)!==treasury) fail('All coins on a chain must use its published Treasury');treasuries.set(c.chain,treasury);
    if (!Number.isInteger(c.decimals)||c.decimals<0||c.decimals>30||!/^[a-f0-9]{64}$/.test(c.pythFeed)) fail('Invalid coin decimals/feed');
    const key=`${c.chain}:${sourceAddress(c.chain,c.contract)}`;if(seen.has(key))fail('Duplicate accepted coin');seen.add(key);
  }
}
export function score(config,bindings,transfers,prices) {
  validateConfig(config);
  const bound = new Map(), choice = new Map();
  for (const raw of bindings) { const b=verifyBinding(raw), key=`${b.chain}:${b.source}`;if(bound.has(key))fail('Duplicate source binding');if(choice.has(b.sui)&&choice.get(b.sui)!==b.lockMonths)fail('Conflicting lock choices for Sui wallet');bound.set(key,b);choice.set(b.sui,b.lockMonths); }
  const weights = new Map(), totals = new Map(), audit = [], seen = new Set(); let totalUsd=0n;
  for (const t of transfers) {
    integer(t.confirmedAt,'confirmation time');integer(t.index,'transfer index');
    if (!t.txHash || typeof t.txHash !== 'string' || !/^[1-9][0-9]*$/.test(t.amountBaseUnits)) fail('Invalid transfer');
    const key=`${t.chain}:${t.txHash}:${t.index}`;if(seen.has(key))fail('Duplicate transfer');seen.add(key);
    const c=config.coins.find(c=>c.chain===t.chain&&sourceAddress(c.chain,c.contract)===sourceAddress(t.chain,t.contract));
    if(!c)fail('Unaccepted coin in transfer export');
    if(sourceAddress(t.chain,t.to)!==sourceAddress(c.chain,c.treasury))fail('Wrong Treasury destination');
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
  const allocations=[...weights.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([sui,points])=>{
    const proportional=totalPoints===0n?0n:POOL*points/totalPoints;
    const cap=points*10_000n*UNIT/(USD*280n);const amount=proportional<cap?proportional:cap;
    return {sui,amountBaseUnits:amount.toString(),lockMonths:choice.get(sui)};
  }).filter(a=>BigInt(a.amountBaseUnits)>0n);
  const allocated=allocations.reduce((n,a)=>n+BigInt(a.amountBaseUnits),0n);if(allocated>POOL)fail('Allocation exceeds pool');
  const csv='sui_address,v1pr_amount_base_units,lock_months\n'+allocations.map(a=>`${a.sui},${a.amountBaseUnits},${a.lockMonths}\n`).join('');
  return {csv,summary:{csvSha256:hash(csv),totalUsdScaled:totalUsd.toString(),usdScale:USD.toString(),allocatedBaseUnits:allocated.toString(),burnAtFinalizeBaseUnits:(POOL-allocated).toString(),clearingPrice:allocated===0n?null:{usdNumerator:(totalUsd*UNIT).toString(),tokenDenominator:(allocated*USD).toString()},liquidityProceedsPercent:25,receivedBaseUnits:Object.fromEntries([...totals].map(([k,v])=>[k,v.toString()]))},audit,allocations};
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [file,out]=process.argv.slice(2);if(!file||!out)fail('Usage: node scripts/feast/score.mjs INPUT.json OUTPUT_DIRECTORY');
  const raw=readFileSync(file),input=JSON.parse(raw);const result=score(input.config,input.bindings,input.transfers,input.prices);
  mkdirSync(out,{recursive:true});writeFileSync(`${out}/allocations.csv`,result.csv);writeFileSync(`${out}/allocations.sha256`,result.summary.csvSha256+'\n');
  writeFileSync(`${out}/results.json`,JSON.stringify({...result.summary,inputSha256:hash(raw),configSha256:hash(JSON.stringify(input.config)),audit:result.audit},null,2)+'\n');
  console.log(JSON.stringify(result.summary));
}
