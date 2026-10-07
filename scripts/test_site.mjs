import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createServer } from 'vite';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
// Render the pre-launch Rules copy without browser-only wallet custom elements.
// These test doubles expose no account, transaction or deployed state.
const server = await createServer({
  plugins: [{
    name: 'wallet-presentation-test-doubles', enforce: 'pre',
    transform(code, id) {
      if (id.includes('/src/')) return code
        .replaceAll("from '@mysten/dapp-kit-react/ui'", "from '/test-connect-button'")
        .replaceAll("from '@mysten/dapp-kit-react'", "from '/test-wallet-hooks'");
    },
    resolveId(id) { if (['/test-connect-button','/test-wallet-hooks'].includes(id)) return `\0${id}`; },
    load(id) {
      if (id === '\0/test-connect-button') return "import React from 'react'; export const ConnectButton = () => React.createElement('button',null,'Connect Wallet');";
      if (id === '\0/test-wallet-hooks') return 'export const useCurrentAccount=()=>null, useCurrentClient=()=>({}), useDAppKit=()=>({});';
    },
  }],
  server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom',
});
try {
  const { validateSocialUrl, configuredSocials, site } = await server.ssrLoadModule('/src/site.ts');
  const blankSocials = {x:'',telegram:'',discord:''};
  assert.deepEqual(Object.keys(site.socials), Object.keys(blankSocials));
  assert.deepEqual(configuredSocials(blankSocials),[]);
  for (const [channel,url] of [['x','https://x.com/Viper'],['telegram','https://t.me/viper'],['discord','https://discord.gg/viper']]) assert.equal(validateSocialUrl(channel,url),url);
  for (const url of ['http://x.com/Viper','javascript:alert(1)','https://x.com.evil.test/Viper','https://x.com@evil.test/','https://name:password@x.com/Viper','https://x.com:444/Viper','https://evil.test/']) assert.throws(()=>validateSocialUrl('x',url));
  assert.throws(()=>validateSocialUrl('telegram','https://x.com/viper'));
  const { CommunityLinks } = await server.ssrLoadModule('/src/CommunityLinks.tsx');
  const fallback = renderToStaticMarkup(React.createElement(CommunityLinks,{socials:blankSocials}));
  assert.equal((fallback.match(/Coming soon/g)||[]).length,3);
  assert(fallback.includes('https://github.com/Robertcurzon/V1perCoin'));
  assert(!fallback.includes('discord.gg'));
  const configured = renderToStaticMarkup(React.createElement(CommunityLinks,{socials:{x:'https://x.com/viper',telegram:'',discord:''}}));
  assert(configured.includes('https://x.com/viper'));
  assert.equal((configured.match(/Coming soon/g)||[]).length,2);
  assert(configured.includes('Telegram') && !configured.includes('https://t.me/'));
  assert(configured.includes('Discord') && !configured.includes('https://discord.gg/'));
  globalThis.window = { location: { pathname: '/' } };
  const { default: App } = await server.ssrLoadModule('/src/App.tsx');
  const home = renderToStaticMarkup(React.createElement(App));
  delete globalThis.window;
  for (const anchor of ['ways-in','wallet','claims','claim-action','feast','lock','den']) assert(home.includes(`id="${anchor}"`),anchor);
  assert(home.includes('Apply for free tokens') && home.includes('CLAIMS NOT OPEN YET') && home.includes('FEAST NOT OPEN YET'));
  assert(home.includes('href="#claims"') && home.includes('href="#feast"') && home.includes('href="#den"'));
  assert(home.includes('header-wallet') && (home.match(/Connect Wallet/g)||[]).length >= 4);
  assert.equal((home.match(/Coming soon/g)||[]).length,3);
  const { default: Rules } = await server.ssrLoadModule('/src/Rules.tsx');
  const rules = renderToStaticMarkup(React.createElement(Rules));
  for (const anchor of ['status','timeline','feast','claims','claim-action','lock','burns','community','foundation','privacy','questions']) assert(rules.includes(`id="${anchor}"`),anchor);
  for (const text of ['1,440 one-minute average','No wallet cap','no contribution refund path','seven-day','10,000','whole completed','50%','40%','10%','Seal and Nautilus','wallet is not proof of one person']) assert(rules.includes(text),text);
  assert(rules.includes('HOW THE FREE') && rules.includes('BITE WORKS.') && rules.includes('THE FEAST,') && rules.includes('STEP BY STEP.'));
  assert(!rules.includes('02 / FREE COMMUNITY CLAIMS'));
  assert(rules.includes('Finalization day (F)'));
  assert(!fs.existsSync('public/viper-meme-feast.webp'));
  for (const file of ['src/App.tsx','src/index.css','design/social-kit.html']) assert(!fs.readFileSync(file,'utf8').includes('viper-meme-feast.webp'),file);
  console.log('Website checks passed: safe social URLs, configured-only channels, GitHub fallback and complete Rules anchors/disclosures.');
} finally { await server.close(); }
