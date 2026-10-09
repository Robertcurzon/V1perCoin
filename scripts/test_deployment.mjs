import './test_supply.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createServer } from 'vite';
const base = '/V1perCoin/';
const server = await createServer({ base, server: { middlewareMode: true, ws: false }, appType: 'custom' });
try {
  const { siteUrl } = await server.ssrLoadModule('/src/site.ts');
  assert.equal(siteUrl('rules/#feast'), `${base}rules/#feast`);
  assert.equal(siteUrl('monitor/'), `${base}monitor/`);
  assert.equal(siteUrl('/whitepaper.pdf'), `${base}whitepaper.pdf`);
  assert.equal(siteUrl('v1per-emblem.webp'), `${base}v1per-emblem.webp`);
  const html = fs.readFileSync('dist/index.html', 'utf8');
  assert(html.includes(`${base}assets/`));
  assert(html.includes(`${base}v1per-emblem.webp`));
  const pages = JSON.parse(fs.readFileSync('site-pages.json','utf8'));
  for (const [page, meta] of Object.entries(pages)) {
    const route = page === 'home' ? '' : `${page}/`;
    const content = fs.readFileSync(`dist/${route}index.html`, 'utf8');
    assert(content.includes(`${base}assets/`));
    const escape = value => value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
    assert(content.includes(`<title>${escape(meta.title)}</title>`));
    assert(content.includes(`property="og:title" content="${escape(meta.title)}"`));
    assert(content.includes(`property="og:description" content="${escape(meta.description)}"`));
    assert(content.includes('property="og:image" content="https://robertcurzon.github.io/V1perCoin/social-preview.png"'));
    assert(content.includes('name="twitter:card" content="summary_large_image"'));
    assert(content.includes(`rel="canonical" href="https://robertcurzon.github.io/V1perCoin/${route}"`));
    assert.equal((content.match(/property="og:title"/g)||[]).length,1);
  }
  assert(fs.existsSync('dist/social-preview.png'));
  for (const file of ['WHITEPAPER.md','Viper_Coin_Whitepaper.tex','.nojekyll']) assert(fs.existsSync(`dist/${file}`));
  console.log('GitHub Pages checks passed: project base, assets, physical deep routes and white paper source.');
} finally { await server.close(); }
