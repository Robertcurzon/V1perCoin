// Operator-only authenticated acquisition. Cache in-flight requests and serialize/throttle I/O.
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { validateConfig, hash } from './score.mjs';
import { assetKey, transactionHash } from './networks.mjs';
export async function acquirePrices(input,{key,fetchImpl=fetch,intervalMs=150,sleep=ms=>new Promise(r=>setTimeout(r,ms))}={}) {
 validateConfig(input.config);if(!key)throw Error('Historical Pyth access required: set PYTH_BENCHMARKS_API_KEY in the operator environment.');
 if(!Number.isFinite(intervalMs)||intervalMs<0)throw Error('Invalid request throttle');
 const cache=new Map(),rawArchive=[];let queue=Promise.resolve();
 function at(feed,time) {
  const k=`${feed}:${time}`;if(cache.has(k))return cache.get(k);
  const pending=queue.then(async()=>{
   await sleep(intervalMs);
   const url=new URL(`https://benchmarks.pyth.network/v1/updates/price/${time-1}`);url.searchParams.append('ids',feed);
   const response=await fetchImpl(url,{headers:{Authorization:`Bearer ${key}`},signal:AbortSignal.timeout(30000)});
   if(!response.ok)throw Error(`Pyth request failed: HTTP ${response.status}`);
   const rawResponse=await response.text(),parsed=JSON.parse(rawResponse).parsed?.filter(p=>p.id.replace(/^0x/,'')===feed);
   if(parsed?.length!==1||!parsed[0].price)throw Error('Pyth response lacks unique requested feed');
   const p=parsed[0].price,o={feedId:feed,price:String(p.price),expo:p.expo,publishTime:p.publish_time};
   if(!/^[1-9][0-9]*$/.test(o.price)||!Number.isInteger(o.expo)||o.expo< -30||o.expo>10||!Number.isSafeInteger(o.publishTime)||o.publishTime>time||time-o.publishTime>60)throw Error('Invalid Pyth observation');
   rawArchive.push({url:String(url),sha256:hash(rawResponse),rawResponse});return o;
  });cache.set(k,pending);queue=pending;return pending;
 }
 const prices={};
 for(const t of input.transfers) {
  if(t.confirmedAt<input.config.windowStart||t.confirmedAt>=input.config.windowStart+21*86400)continue;
  const coin=input.config.coins.find(c=>assetKey(c.chain,c.contract)===assetKey(t.chain,t.contract));if(!coin)throw Error('Unknown coin');
  const observations=await Promise.all(Array.from({length:1441},(_,i)=>at(coin.pythFeed,t.confirmedAt-i*60)));
  prices[`${t.chain}:${transactionHash(t.chain,t.txHash)}:${t.index}`]={provider:'Pyth Benchmarks',confirmedAt:t.confirmedAt,spot:observations[0],history:observations.slice(1)};
 }
 return {prices,rawArchive};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href) {
 const [inputFile,outputFile]=process.argv.slice(2);if(!inputFile||!outputFile)throw Error('Usage: fetch_prices.mjs INPUT.json PRICES.json');
 writeFileSync(outputFile,JSON.stringify(await acquirePrices(JSON.parse(readFileSync(inputFile)),{key:process.env.PYTH_BENCHMARKS_API_KEY}),null,2)+'\n');
}
