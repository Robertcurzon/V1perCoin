import { createServer } from 'vite';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import assert from 'node:assert/strict';
const server = await createServer({ plugins: [{name:'wallet-ui-double',enforce:'pre',transform(code,id){if(id.includes('/src/'))return code.replaceAll("from '@mysten/dapp-kit-react/ui'", "from '/test-connect-button'");},resolveId(id){if(id==='/test-connect-button')return '\0'+id;},load(id){if(id==='\0/test-connect-button')return "import React from 'react'; export const ConnectButton=()=>React.createElement('button',null,'Connect Wallet');";}}], server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
try {
  const { default: Whitepaper } = await server.ssrLoadModule('/src/Whitepaper.tsx');
  const html = renderToStaticMarkup(React.createElement(Whitepaper));
  assert(!html.includes('<iframe'));
  assert(html.includes('Checking the current white paper PDF'));
  assert(html.includes('LaTeX source'));
  assert(!html.includes('Download PDF'));
  const { validWhitepaperProof } = await server.ssrLoadModule('/src/whitepaperProof.ts');
  const source='a'.repeat(64),pdf='b'.repeat(64);
  assert(validWhitepaperProof({sourceSha256:source,pdfSha256:pdf},source,pdf));
  for(const proof of [null,{}, {sourceSha256:pdf,pdfSha256:pdf},{sourceSha256:source,pdfSha256:source}]) assert(!validWhitepaperProof(proof,source,pdf));
  console.log('White paper page passed: current source/PDF fingerprint match required before embed or download; stale copies stay hidden.');
} finally { await server.close(); }
