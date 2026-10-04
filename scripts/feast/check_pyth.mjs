// Pre-opening live gate. Secrets are env-only; raw responses contain no headers.
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {hash} from './score.mjs';
export const TIMESTAMPS=['2026-09-29T12:00:00Z','2026-09-30T12:00:00Z','2026-10-01T12:00:00Z'].map(d=>Date.parse(d)/1000);
const config=JSON.parse(readFileSync(new URL('./config.json',import.meta.url)));
export function verifyArchive(archive) {
  if(archive.mode!=='live-authenticated' || archive.provider!=='Pyth Benchmarks' || archive.points?.length!==30 || archive.configSha256!==hash(JSON.stringify(config.coins.map(c=>({id:c.id,pythFeed:c.pythFeed})))) )throw Error('Not a complete live historical readiness archive');
  const expected=new Set(config.coins.flatMap(c=>TIMESTAMPS.map(t=>`${c.id}:${t}`)));
  for(const point of archive.points) {
    const coin=config.coins.find(c=>c.id===point.coin),key=`${point.coin}:${point.requestedAt}`;
    if(!coin||!expected.delete(key)||point.feedId!==coin.pythFeed||point.url!==`https://benchmarks.pyth.network/v1/updates/price/${point.requestedAt-1}?ids=${coin.pythFeed}`||hash(point.rawResponse)!==point.sha256)throw Error('Archive point identity or response hash mismatch');
    const matches=JSON.parse(point.rawResponse).parsed?.filter(p=>p.id.replace(/^0x/,'')===coin.pythFeed);
    if(matches?.length!==1)throw Error('Missing or duplicate archived feed');
    const p=matches[0].price;
    if(!p||!/^[1-9][0-9]*$/.test(String(p.price))||!Number.isInteger(p.expo)||p.expo < -30||p.expo>10||!Number.isSafeInteger(p.publish_time)||p.publish_time>point.requestedAt||point.requestedAt-p.publish_time>60)throw Error('Missing, invalid, stale or future historical point');
  }
  if(expected.size)throw Error('Missing historical coverage'); return archive;
}
export async function checkPyth({key=process.env.PYTH_BENCHMARKS_API_KEY,fetchImpl=fetch,paceMs=1100}={}) {
  if(!key)throw Error('PYTH_BENCHMARKS_API_KEY is unavailable. Configure authenticated historical access in the operator environment; do not paste or commit a key.');
  const points=[];
  for(const coin of config.coins)for(const requestedAt of TIMESTAMPS) {
    if(requestedAt>=Date.now()/1000)throw Error('Readiness timestamps must be in the past');
    const url=`https://benchmarks.pyth.network/v1/updates/price/${requestedAt-1}?ids=${coin.pythFeed}`;
    let response;
    try { response=await fetchImpl(url,{headers:{Authorization:`Bearer ${key}`},signal:AbortSignal.timeout(30_000)}); }
    catch {throw Error(`Pyth history unavailable for ${coin.id} at ${requestedAt}`);}
    if(!response.ok)throw Error(`Pyth history failed for ${coin.id} at ${requestedAt}: HTTP ${response.status}`);
    const rawResponse=await response.text();
    if(rawResponse.includes(key))throw Error('Response unexpectedly contains authentication material; archive refused');
    points.push({coin:coin.id,feedId:coin.pythFeed,requestedAt,url,rawResponse,sha256:hash(rawResponse)});
    if(paceMs)await new Promise(r=>setTimeout(r,paceMs));
  }
  const archive={mode:'live-authenticated',provider:'Pyth Benchmarks',retrievedAt:new Date().toISOString(),configSha256:hash(JSON.stringify(config.coins.map(c=>({id:c.id,pythFeed:c.pythFeed})))),points};
  verifyArchive(archive);
  // Mocks cannot be mistaken for live evidence or pass the archive verifier later.
  if(fetchImpl!==fetch)archive.mode='synthetic-test';
  return archive;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href) {
  const output=process.argv[2]||'tests/fixtures/pyth-historical.json';
  try {
    const archive=await checkPyth();writeFileSync(output,JSON.stringify(archive,null,2)+'\n');
    console.log(`PASS: 10 feeds × 3 fixed past timestamps; real archive ${output}`);
  } catch(error) {console.error(error.message);process.exitCode=1;}
}
