import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,existsSync} from 'node:fs';
const forbidden = new RegExp(['V1'+'PR','v1'+'pr','Viper'+' Coin'].join('|'),'i');
const allowed = '- Branding: '+'Viper'+' Coin (V1'+'PR / v1'+'pr) renamed to V1PER Coin (V1PER / v1per).';
let exceptions=0;
// Added files are checked too, before the task commit. Avoid ignored build/tool caches.
const files=execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z'],{encoding:'utf8'}).split('\0').filter(Boolean);
for(const file of new Set(files)){
 if(!existsSync(file))continue;
 const bytes=readFileSync(file);if(bytes.includes(0))continue;
 const text=bytes.toString('utf8');
 for(const [i,line] of text.split('\n').entries()){
  if(file==='CHANGELOG.md'&&line===allowed){exceptions++;continue;}
  assert(!forbidden.test(line),`${file}:${i+1}: superseded name or ticker`);
 }
}
assert.equal(exceptions,1,'Exactly one changelog exception is required');
console.log('Brand guard passed: canonical name/module/ticker; exactly one changelog exception.');
