import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createServer } from 'vite';
const base = '/ViperCoin/';
const server = await createServer({ base, server: { middlewareMode: true, ws: false }, appType: 'custom' });
try {
  const { siteUrl } = await server.ssrLoadModule('/src/site.ts');
  assert.equal(siteUrl('rules/#feast'), `${base}rules/#feast`);
  assert.equal(siteUrl('monitor/'), `${base}monitor/`);
  assert.equal(siteUrl('/whitepaper.pdf'), `${base}whitepaper.pdf`);
  assert.equal(siteUrl('viper-logo.webp'), `${base}viper-logo.webp`);
  const html = fs.readFileSync('dist/index.html', 'utf8');
  assert(html.includes(`${base}assets/`));
  assert(html.includes(`${base}viper-logo.webp`));
  for (const page of ['monitor','whitepaper','rules']) assert.equal(fs.readFileSync(`dist/${page}/index.html`, 'utf8'), html);
  for (const file of ['WHITEPAPER.md','Viper_Coin_Whitepaper.tex','.nojekyll']) assert(fs.existsSync(`dist/${file}`));
  console.log('GitHub Pages checks passed: project base, assets, physical deep routes and white paper source.');
} finally { await server.close(); }
