import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {checkPyth,verifyArchive} from './check_pyth.mjs';
const key='synthetic-fixture-only'; let requests=0;
const mock=async(url,options)=>{
  assert.equal(options.headers.Authorization,`Bearer ${key}`);requests++;
  const u=new URL(url),time=Number(u.pathname.split('/').at(-1))+1;
  return new Response(JSON.stringify({parsed:[{id:u.searchParams.get('ids'),price:{price:'100000000',expo:-8,publish_time:time}}]}));
};
const synthetic=await checkPyth({key,fetchImpl:mock,paceMs:0});assert.equal(requests,30);assert.equal(synthetic.mode,'synthetic-test');
assert.throws(()=>verifyArchive(synthetic),/live/);
await assert.rejects(()=>checkPyth({key:'',fetchImpl:mock,paceMs:0}),/unavailable/);
await assert.rejects(()=>checkPyth({key,fetchImpl:async()=>new Response('{}',{status:401}),paceMs:0}),/HTTP 401/);
await assert.rejects(()=>checkPyth({key,fetchImpl:async()=>new Response('{"parsed":[]}'),paceMs:0}),/Missing/);
await assert.rejects(()=>checkPyth({key,fetchImpl:async()=>new Response(key),paceMs:0}),/authentication/);
for(const delta of [-61,1])await assert.rejects(()=>checkPyth({key,fetchImpl:async url=>{
 const u=new URL(url),time=Number(u.pathname.split('/').at(-1))+1;
 return new Response(JSON.stringify({parsed:[{id:u.searchParams.get('ids'),price:{price:'100',expo:-8,publish_time:time+delta}}]}));
},paceMs:0}),/stale or future/);
const file=new URL('../../tests/fixtures/pyth-historical.json',import.meta.url);
if(existsSync(file)) {verifyArchive(JSON.parse(readFileSync(file)));console.log('Committed live Pyth archive: 30 points verified.');}
else console.log('Live Pyth archive absent: authenticated readiness remains a launch blocker.');
console.log('Pyth checker: 7 synthetic positive/negative cases passed; synthetic results are never live readiness evidence.');
