import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {renderToStaticMarkup} from 'react-dom/server';
import React from 'react';
import {readFileSync} from 'node:fs';
const tickers=['SHIB','PEPE','SPX','FLOKI','PUMP','PENGU','BONK','WIF','DOGE','M'];
const accepted=JSON.parse(readFileSync('scripts/feast/config.json','utf8')).coins.map(c=>c.symbol);
assert.deepEqual([...tickers].sort(),[...accepted].sort());
const server=await createServer({base:'/V1perCoin/',server:{middlewareMode:true,hmr:false,ws:false},appType:'custom'});
try{
 const {default:FeastMenu}=await server.ssrLoadModule('/src/FeastMenu.tsx');
 for(const compact of [false,true]){
  const html=renderToStaticMarkup(React.createElement(FeastMenu,{compact}));
  assert(html.includes('data-menu-state="board"'));
  assert(html.includes('src="/V1perCoin/feast-menu.webp"'));
  assert(html.includes('hidden=""'));
  for(const ticker of tickers)assert(html.includes(`<li>${ticker}</li>`));
  assert(html.includes(`Feast menu: ${tickers.join(', ')}`));
 }
 const kit=readFileSync('design/social-kit.html','utf8');
 assert(kit.includes('../public/feast-menu.webp'));
 for(const ticker of tickers)assert(kit.includes(ticker));
 const brief=readFileSync('design/ART_BRIEF.md','utf8');assert(brief.includes('## 5. Feast menu'));assert(brief.includes('tickers stay in HTML'));
 console.log('Feast menu passed: accepted ticker parity, accessible fallback, optional image path, both sizes, social slot and owner prompt.');
}finally{await server.close();}
