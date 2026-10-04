const fs = require('node:fs');
const pages = require('../site-pages.json');
const base = process.env.VITE_BASE_PATH || '/';
const publicUrl = process.env.VITE_PUBLIC_SITE_URL || 'https://robertcurzon.github.io/ViperCoin/';
const socialDomains = { X: ['x.com','twitter.com'], TELEGRAM: ['t.me','telegram.me'], DISCORD: ['discord.gg','discord.com'] };
for (const [channel, domains] of Object.entries(socialDomains)) {
  const value = process.env[`VITE_SOCIAL_${channel}`] || '';
  if (!value.trim()) continue;
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.port || !domains.includes(url.hostname)) throw Error(`Invalid ${channel} community URL.`);
}
const origin = new URL(publicUrl);
if (origin.protocol !== 'https:' || origin.username || origin.password || origin.search || origin.hash) throw Error('Public site URL must be an absolute HTTPS URL without credentials, query or fragment.');
if (!origin.pathname.endsWith('/')) origin.pathname += '/';
const imageUrl = new URL('social-preview.png', origin).href;
const escape = value => value.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const template = fs.readFileSync('dist/index.html', 'utf8');
for (const [page, meta] of Object.entries(pages)) {
  const title = escape(meta.title), description = escape(meta.description);
  const route = page === 'home' ? '' : `${page}/`;
  const canonical = escape(new URL(route, origin).href);
  const html = template.replace(/<title>.*?<\/title>/, `<title>${title}</title>`)
    .replace(/<meta name="description" content="[^"]*"\s*\/>/, `<meta name="description" content="${description}" />`)
    .replace(/<meta (?:property="og:[^"]+"|name="twitter:[^"]+") content="[^"]*"\s*\/>\s*/g, '')
    .replace(/<link rel="canonical" href="[^"]*"\s*\/>\s*/g, '')
    .replace('</head>', `<meta property="og:title" content="${title}" />\n<meta property="og:description" content="${description}" />\n<meta property="og:image" content="${escape(imageUrl)}" />\n<meta property="og:image:width" content="1200" />\n<meta property="og:image:height" content="630" />\n<meta property="og:url" content="${canonical}" />\n<meta property="og:type" content="website" />\n<meta property="og:image:alt" content="Viper Coin (V1PR). Memes with bite. Built on Sui." />\n<meta name="twitter:card" content="summary_large_image" />\n<meta name="twitter:title" content="${title}" />\n<meta name="twitter:description" content="${description}" />\n<meta name="twitter:image" content="${escape(imageUrl)}" />\n<link rel="canonical" href="${canonical}" />\n</head>`);
  fs.mkdirSync(`dist/${route}`, { recursive: true });
  fs.writeFileSync(`dist/${route}index.html`, html);
}
if (!base.startsWith('/') || !base.endsWith('/')) throw Error('Vite base must start and end with /.');
fs.writeFileSync('dist/.nojekyll', '');
