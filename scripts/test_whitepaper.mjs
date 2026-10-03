import { createServer } from 'vite';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import assert from 'node:assert/strict';
const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
try {
  const { default: Whitepaper } = await server.ssrLoadModule('/src/Whitepaper.tsx');
  const html = renderToStaticMarkup(React.createElement(Whitepaper));
  assert(html.includes('<iframe'));
  assert(html.includes('whitepaper.pdf#toolbar=0&amp;navpanes=0&amp;view=FitH'));
  assert(html.includes('title="Viper Coin (V1PR) white paper PDF"'));
  assert(html.includes('Download PDF'));
  assert(html.includes('Open PDF'));
  assert(!html.includes('paper-content'));
  console.log('White paper page passed: embedded PDF and direct open/download links.');
} finally { await server.close(); }
