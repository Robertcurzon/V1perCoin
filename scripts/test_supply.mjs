import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,existsSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
const forbidden=new RegExp(['fixed','supply'].join('\\s+'),'i');
const files=execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z'],{encoding:'utf8'}).split('\0').filter(Boolean);
function tree(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?tree(join(dir,e.name)):[join(dir,e.name)]);}
if(existsSync('dist'))files.push(...tree('dist'));
for(const file of new Set(files)){
 if(!existsSync(file))continue;
 const bytes=readFileSync(file);if(bytes.includes(0))continue;
 assert(!forbidden.test(bytes.toString('utf8')),`${file}: incorrect supply wording`);
}
assert(readFileSync('docs/WHITEPAPER.md','utf8').includes('Deflationary supply: minted once, burn-only'));
console.log(`Supply wording guard passed: tracked sources${existsSync('dist')?' and built site':''}.`);
