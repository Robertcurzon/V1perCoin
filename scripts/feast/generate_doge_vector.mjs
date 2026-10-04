// Test fixture only. No private key is read, printed or persisted.
import {randomBytes,createHash} from 'node:crypto';
import {writeFileSync} from 'node:fs';
import bitcoinMessage from 'bitcoinjs-message';
import {secp256k1} from '@noble/curves/secp256k1.js';
import {toBase58} from '@mysten/sui/utils';
import {bindingMessage,lockMessage,verifyBinding,DOGE_MESSAGE_PREFIX} from './score.mjs';
const secret=randomBytes(32),sha=bytes=>createHash('sha256').update(bytes).digest();
const pub=secp256k1.getPublicKey(secret,true),pkh=createHash('ripemd160').update(sha(pub)).digest();
const payload=Buffer.concat([Buffer.from([30]),pkh]);
const source=toBase58(Buffer.concat([payload,sha(sha(payload)).subarray(0,4)]));
const binding={chain:'dogecoin',source,sui:'0x'+'aa'.repeat(32),windowStart:1000000,lockMonths:12};
binding.message=bindingMessage(source,binding.sui,binding.chain,binding.windowStart);
const sign=text=>bitcoinMessage.sign(text,secret,true,DOGE_MESSAGE_PREFIX).toString('base64');
binding.signature=sign(binding.message);binding.lockSignature=sign(lockMessage(binding.message,12));
for(const [text,sig] of [[binding.message,binding.signature],[lockMessage(binding.message,12),binding.lockSignature]]) {
 if(!bitcoinMessage.verify(text,source,sig,DOGE_MESSAGE_PREFIX))throw Error('Independent fixture verification failed');
}
verifyBinding(binding);secret.fill(0);
writeFileSync(new URL('./snapshots/dogecoin-binding-vector.json',import.meta.url),JSON.stringify({provenance:'Independent bitcoinjs-message 2.2.0 compact-signature vector, transient TEST key generated only in memory; Dogecoin Core message prefix. Independently verified before export.',binding},null,2)+'\n');
console.log('Regenerated independently verified DOGE campaign fixture; no key persisted.');
