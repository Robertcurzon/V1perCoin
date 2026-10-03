import assert from 'node:assert/strict';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { prepare,applicationMessage,DAY_MS } from './prepare.mjs';
const startMs=20*DAY_MS;
async function application(key,entry,offset=1) {
 const address=key.toSuiAddress(),entryUrl=`https://example.com/${entry}`;
 const signature=(await key.signPersonalMessage(new TextEncoder().encode(applicationMessage(address,startMs,entryUrl)))).signature;
 return {address,entryUrl,receivedAtMs:startMs-7*DAY_MS+offset,signature};
}
const key=Ed25519Keypair.fromSecretKey(new Uint8Array(32).fill(9)),other=Ed25519Keypair.fromSecretKey(new Uint8Array(32).fill(10));
const a=await application(key,'original'),b=await application(other,'duplicate');
const review=a=>({...a,accepted:true,reason:'Original authorship reviewed',entryHash:'ab'.repeat(32)});
const input={startMs,applications:[b,a],reviews:[review(b),review(a)]};
const r=await prepare(input);assert.equal(r.approved.length,1);assert.equal(r.approved[0].amountBaseUnits,'10000000000');assert.equal(r.endMs,startMs+14*DAY_MS);assert.equal(r.maxAddresses,10000);assert.equal(r.excluded[0].reason,'duplicate community entry');
assert.deepEqual(await prepare(input),r);
await assert.rejects(prepare({...input,reviews:[]}));
await assert.rejects(prepare({...input,applications:[{...a,receivedAtMs:startMs}],reviews:[review(a)]}));
await assert.rejects(prepare({...input,applications:[{...a,address:b.address}],reviews:[review({...a,address:b.address})]}));
await assert.rejects(prepare({...input,startMs:startMs+1}));
console.log('Free-claim preparation passed: wallet proof, seven-day intake, immutable campaign binding, reviewed-entry deduplication and deterministic limits.');
