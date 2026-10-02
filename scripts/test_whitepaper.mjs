import { createServer } from 'vite';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import assert from 'node:assert/strict';
const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
try {
  const { default: Whitepaper } = await server.ssrLoadModule('/src/Whitepaper.tsx');
  const html = renderToStaticMarkup(React.createElement(Whitepaper));
  assert.equal((html.match(/<h2 /g) || []).length, 9);
  assert.equal((html.match(/<table>/g) || []).length, 3);
  assert(html.includes('id="9-monitor"'));
  assert(html.includes('Meme with a bite!'));
  assert(html.includes('id="8-privacy-and-selective-disclosure"'));
  assert(html.includes('Seal'));
  assert(html.includes('not a confidential-transfer coin'));
  assert(html.includes('5.0000%'));
  console.log('White paper render passed: 9 navigable sections, 3 tables, branding and reward rates.');
} finally { await server.close(); }
