import { createServer } from 'vite';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import assert from 'node:assert/strict';
const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
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
