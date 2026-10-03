// Operator-only authenticated Pyth history acquisition; never imported by the website.
import { readFileSync, writeFileSync } from 'node:fs';
import { validateConfig, hash } from './score.mjs';
import { assetKey } from './networks.mjs';
const [inputFile,outputFile]=process.argv.slice(2);
if(!inputFile||!outputFile)throw new Error('Usage: node scripts/feast/fetch_prices.mjs INPUT.json PRICES.json');
const input=JSON.parse(readFileSync(inputFile));validateConfig(input.config);
const key=process.env.PYTH_BENCHMARKS_API_KEY;
if(!key)throw new Error('Historical Pyth Benchmarks access is required. Set PYTH_BENCHMARKS_API_KEY only in the operator environment.');
const cache=new Map();const rawArchive=[];
async function at(feed,time) {
  const cacheKey=`${feed}:${time}`;if(cache.has(cacheKey))return cache.get(cacheKey);
  const url=new URL(`https://benchmarks.pyth.network/v1/updates/price/${time-1}`);url.searchParams.append('ids',feed);
  const response=await fetch(url,{headers:{Authorization:`Bearer ${key}`},signal:AbortSignal.timeout(30000)});
  if(!response.ok)throw new Error(`Pyth historical request failed: HTTP ${response.status}`);
  const raw=await response.text(),data=JSON.parse(raw),parsed=data.parsed?.find(p=>p.id.replace(/^0x/,'')===feed);
  if(!parsed||!parsed.price)throw new Error('Pyth response lacks the requested feed');
  const o={feedId:feed,price:String(parsed.price.price),expo:parsed.price.expo,publishTime:parsed.price.publish_time};
  if(o.publishTime>time||time-o.publishTime>60)throw new Error('Pyth observation is future-dated or stale; do not replace with an estimate');
  rawArchive.push({url:url.toString(),sha256:hash(raw),response:data});cache.set(cacheKey,o);return o;
}
const prices={};
for(const t of input.transfers) {
  if(t.confirmedAt<input.config.windowStart||t.confirmedAt>=input.config.windowStart+21*86400)continue;
  const coin=input.config.coins.find(c=>assetKey(c.chain,c.contract)===assetKey(t.chain,t.contract));if(!coin)throw new Error('Unknown coin');
  const spot=await at(coin.pythFeed,t.confirmedAt),history=[];
  for(let i=1;i<=1440;i++)history.push(await at(coin.pythFeed,t.confirmedAt-i*60));
  prices[`${t.chain}:${t.txHash}:${t.index}`]={provider:'Pyth Benchmarks',confirmedAt:t.confirmedAt,spot,history};
}
writeFileSync(outputFile,JSON.stringify({prices,rawArchive},null,2)+'\n');
