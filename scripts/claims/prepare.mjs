import { readFileSync,writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { verifyPersonalMessageSignature } from '@mysten/sui/verify';
export const DAY_MS=86400000, MAX_ADDRESSES=10000, CLAIM_BASE_UNITS='10000000000';
import { entryUrl,applicationMessage } from './messages.mjs';
export { entryUrl,applicationMessage } from './messages.mjs';
export async function prepare(input) {
  const start=input.startMs;
  if(!Number.isSafeInteger(start)||start<7*DAY_MS||!Array.isArray(input.applications)||!Array.isArray(input.reviews))throw Error('Invalid application input');
  const reviews=new Map();
  for(const r of input.reviews) {
    if(!/^0x[a-f0-9]{64}$/.test(r.address)||typeof r.accepted!=='boolean'||typeof r.reason!=='string'||!r.reason.trim()||!/^[a-f0-9]{64}$/.test(r.entryHash))throw Error('Every review needs an address, decision, reason and archived-entry SHA-256');
    const key=`${r.address}:${entryUrl(r.entryUrl)}`;
    if(reviews.has(key))throw Error('Duplicate review');reviews.set(key,r);
  }
  const candidates=[],excluded=[],seen=new Set();
  for(const a of input.applications) {
    const entry=entryUrl(a.entryUrl),key=`${a.address}:${entry}`;
    if(seen.has(key))throw Error('Duplicate application receipt'); seen.add(key);
    if(!Number.isSafeInteger(a.receivedAtMs)||a.receivedAtMs<start-7*DAY_MS||a.receivedAtMs>=start)throw Error('Application receipt is outside the seven-day window');
    await verifyPersonalMessageSignature(new TextEncoder().encode(applicationMessage(a.address,start,entry)),a.signature,{address:a.address});
    const review=reviews.get(key);if(!review)throw Error('Application is missing a published review');
    if(review.accepted)candidates.push({...a,entryUrl:entry,entryHash:review.entryHash,reason:review.reason});
    else excluded.push({address:a.address,entryUrl:entry,reason:review.reason});
  }
  if(reviews.size!==seen.size)throw Error('Review without matching application');
  candidates.sort((a,b)=>a.receivedAtMs-b.receivedAtMs||(a.address<b.address?-1:a.address>b.address?1:0)||(a.entryUrl<b.entryUrl?-1:a.entryUrl>b.entryUrl?1:0));
  const approved=[],wallets=new Set(),entries=new Set(),hashes=new Set();
  for(const c of candidates) {
    const reason=wallets.has(c.address)?'duplicate wallet':entries.has(c.entryUrl)||hashes.has(c.entryHash)?'duplicate community entry':approved.length>=MAX_ADDRESSES?'capacity reached':null;
    if(reason){excluded.push({address:c.address,entryUrl:c.entryUrl,reason});continue;}
    wallets.add(c.address);entries.add(c.entryUrl);hashes.add(c.entryHash);approved.push({...c,amountBaseUnits:CLAIM_BASE_UNITS});
  }
  return {startMs:start,endMs:start+14*DAY_MS,applicationStartMs:start-7*DAY_MS,maxAddresses:MAX_ADDRESSES,approved,excluded};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href) {
  const [inputFile,outputFile]=process.argv.slice(2);if(!inputFile||!outputFile)throw Error('Usage: node scripts/claims/prepare.mjs INPUT.json MANIFEST.json');
  const raw=readFileSync(inputFile),result=await prepare(JSON.parse(raw));
  writeFileSync(outputFile,JSON.stringify({...result,inputSha256:createHash('sha256').update(raw).digest('hex')},null,2)+'\n');
  console.log(`Prepared ${result.approved.length} approved addresses; ${result.excluded.length} excluded. No onchain approval was sent.`);
}
