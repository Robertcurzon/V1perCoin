import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium} from 'playwright';
import {preview} from 'vite';
import {PNG} from 'pngjs';
// Rasterize backgrounds with text temporarily hidden. This includes gradients and
// illustrations that a nearest-solid-ancestor calculation would miss.
const server=await preview({base:'/V1perCoin/',preview:{host:'127.0.0.1',port:0}});
const origin=server.resolvedUrls.local[0];
const browser=await chromium.launch({headless:true});
const failures=[],results=[];
mkdirSync('tmp/overnight',{recursive:true});mkdirSync('tmp/site-review',{recursive:true});
const collect=element=>{
 for(const word of document.querySelectorAll('.v1per')) {
  if(word.textContent!=='V1PER')throw Error('Wordmark text mismatch: '+word.outerHTML);
  const rootStyle=getComputedStyle(word);let visible=word.getClientRects().length>0;
  for(let p=word;p;p=p.parentElement){const s=getComputedStyle(p);if(s.display==='none'||s.visibility!=='visible'||Number(s.opacity)===0)visible=false;}
  if(visible){const digit=word.querySelector('.one'),s=digit&&getComputedStyle(digit),r=digit?.getBoundingClientRect();
   if(!digit||!r.width||!r.height||s.display==='none'||s.visibility!=='visible'||Number(s.opacity)===0||s.color===rootStyle.color)throw Error('Hidden or indistinct brand digit: '+word.outerHTML);
  }
 }
 const root=element??document.querySelector('dialog:modal')??document,entries=[];
 const canvas=document.createElement('canvas');canvas.width=canvas.height=1;const ctx=canvas.getContext('2d');
 const color=css=>{ctx.clearRect(0,0,1,1);ctx.fillStyle=css;ctx.fillRect(0,0,1,1);return [...ctx.getImageData(0,0,1,1).data];};
 const parent=e=>e.parentElement || e.getRootNode().host;
 const shown=e=>{for(let p=e;p;p=parent(p)){const c=getComputedStyle(p);if(c.display==='none'||c.visibility!=='visible'||Number(c.opacity)===0)return false;}return true;};
 const record=(el,text,rect)=>{
  if(!text.trim()||!shown(el)||!rect.width||!rect.height)return;
  const s=getComputedStyle(el);if(el.classList.contains('one') && s.color===getComputedStyle(el.parentElement).color)throw Error('Brand digit must differ from its letters: '+el.parentElement.outerHTML);
  const rgba=color(s.color);
  let opacity=rgba[3]/255;for(let p=el;p;p=parent(p))opacity*=Number(getComputedStyle(p).opacity);
  const size=parseFloat(s.fontSize),weight=Number(s.fontWeight)||400;
  entries.push({text:text.trim().slice(0,100),selector:el.tagName.toLowerCase()+'.'+el.className,fontSize:size,color:rgba.slice(0,3),opacity,required:size>=24||(size>=18.6667&&weight>=700)?3:4.5,rect:{x:rect.x+scrollX,y:rect.y+scrollY,width:rect.width,height:rect.height}});
 };
 function walk(node){
  if(node.nodeType===Node.TEXT_NODE){const range=document.createRange();range.selectNodeContents(node);for(const rect of range.getClientRects())record(node.parentElement,node.textContent,rect);return;}
  if(node.nodeType!==Node.ELEMENT_NODE&&node.nodeType!==Node.DOCUMENT_NODE&&node.nodeType!==Node.DOCUMENT_FRAGMENT_NODE)return;
  if(node.nodeType===Node.ELEMENT_NODE){
   if(['STYLE','SCRIPT','NOSCRIPT'].includes(node.tagName))return;
   if(node.tagName==='INPUT'&&!['range','checkbox','radio','hidden','submit','button'].includes(node.type)){
    const r=node.getBoundingClientRect();record(node,node.value||node.placeholder,{x:r.x+14,y:r.y+10,width:r.width-28,height:r.height-20});
   }
   if(node.shadowRoot)walk(node.shadowRoot);
  }
  for(const child of node.childNodes)walk(child);
 }
 walk(root);return entries;
};
const hide=()=>{
 const css='* { color: transparent !important; -webkit-text-fill-color: transparent !important; text-shadow: none !important; caret-color: transparent !important; } input::placeholder,textarea::placeholder { color: transparent !important; }';
 const add=root=>{const style=document.createElement('style');style.dataset.contrastHide='true';style.textContent=css;root.append(style);for(const el of root.querySelectorAll('*'))if(el.shadowRoot)add(el.shadowRoot);};add(document.head);for(const el of document.querySelectorAll('*'))if(el.shadowRoot)add(el.shadowRoot);
};
const restore=()=>{const remove=root=>{for(const style of root.querySelectorAll('[data-contrast-hide]'))style.remove();for(const el of root.querySelectorAll('*'))if(el.shadowRoot)remove(el.shadowRoot);};remove(document);};
function luminance(rgb){return rgb.map(c=>{const n=c/255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4;}).reduce((sum,n,i)=>sum+n*[.2126,.7152,.0722][i],0);}
function measure(entries,png,offset,context){
 for(const entry of entries){
  let minimum=Infinity;
  const r=entry.rect;
  // Sample a grid inside each rendered text-line rectangle, including the digit.
  for(const fx of [.08,.25,.5,.75,.92])for(const fy of [.25,.5,.75]){
   const x=Math.floor(r.x+r.width*fx-offset.x),y=Math.floor(r.y+r.height*fy-offset.y);
   if(x<0||y<0||x>=png.width||y>=png.height)continue;
   const i=(y*png.width+x)*4,bg=[...png.data.subarray(i,i+3)];
   const fg=entry.color.map((n,i)=>n*entry.opacity+bg[i]*(1-entry.opacity));
   const a=luminance(fg),b=luminance(bg),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);minimum=Math.min(minimum,ratio);
  }
  if(minimum!==Infinity&&minimum+0.001<entry.required)failures.push({...context,...entry,ratio:Number(minimum.toFixed(3))});
 }
}
// The white PDF page and all three prescribed brand backgrounds must also pass.
for(const [foreground,background] of [
 ['#E9ECDF','#101510'],['#BDF332','#101510'],['#101510','#BDF332'],['#A3155E','#BDF332'],['#101510','#FFFFFF'],['#A3155E','#FFFFFF']
]) {
 const rgb=hex=>hex.slice(1).match(/../g).map(n=>parseInt(n,16)),a=luminance(rgb(foreground)),b=luminance(rgb(background));
 assert((Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=4.5,foreground+' on '+background);
}
async function scan(page,context,target=null,fullPage=true){
 const entries=target?await target.evaluate(collect):await page.evaluate(collect,null);await page.evaluate(hide);
 let buffer;try{buffer=await page.screenshot({fullPage,animations:'disabled'});}finally{await page.evaluate(restore);}
 const offset=fullPage?{x:0,y:0}:await page.evaluate(()=>({x:scrollX,y:scrollY}));
 measure(entries,PNG.sync.read(buffer),offset,context);return entries.length;
}
try{
 // All links must fit between the phone and desktop breakpoints too.
 for(const width of [658,800,801,1100,1280]){
  const page=await browser.newPage({viewport:{width,height:900},deviceScaleFactor:1});
  await page.goto(origin,{waitUntil:'networkidle'});
  const header=page.locator('.shared-header'),h=await header.boundingBox();
  for(const link of await page.getByRole('navigation',{name:'Main navigation'}).getByRole('link').all()){
   const r=await link.boundingBox();
   assert(r.x>=0 && r.x+r.width<=width && r.y>=h.y && r.y+r.height<=h.y+h.height, `Navigation must fit at ${width}px`);
  }
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.close();
 }
 for(const width of [1440,390])for(const route of ['','free-tokens/','feast/','lock/','community/','tokenomics/','rules/','monitor/','whitepaper/']){
  const page=await browser.newPage({viewport:{width,height:1000},deviceScaleFactor:1,reducedMotion:'reduce'});
  console.log('Checking contrast',width,'/'+route);
  // The site uses a local fallback font if Google Fonts cannot be reached. Avoid
  // unbounded network waits; the local render is the same state visitors receive.
  await page.goto(new URL(route,origin).href,{waitUntil:'networkidle'});await page.locator('main').waitFor();await page.evaluate(()=>document.fonts.ready);
  if(route==='') {
   const sections=await page.locator('main > section').evaluateAll(nodes=>nodes.map(e=>e.id||e.className));
   assert.deepEqual(sections,['hero','ways-in']);
   for(const text of ['Not launched yet','token transactions are closed'])assert((await page.locator('main').innerText()).includes(text),text);

  }
  await page.evaluate(()=>{for(const el of document.querySelectorAll('details'))el.open=true;});
  const count=await scan(page,{width,route:'/'+route,state:'default'});
  const nodes=page.locator('a,button,summary,input,select,textarea');let hovered=0;
  for(let i=0;i<await nodes.count();i++){
   const node=nodes.nth(i);if(!await node.isVisible())continue;
   if(await node.evaluate(el=>el.classList.contains('skip-link')))await node.focus();
   await node.hover({force:true});
   await scan(page,{width,route:'/'+route,state:'hover',target:i},node,false);hovered++;
   if(await node.evaluate(el=>el.classList.contains('skip-link')))await node.evaluate(el=>el.blur());
  }
  {
   await page.evaluate(()=>scrollTo(0,document.body.scrollHeight/2));
   const header=page.locator('.shared-header');
   assert.equal(await header.evaluate(el=>getComputedStyle(el).position),'fixed');
   assert.equal(Math.round((await header.boundingBox()).y),0);
   assert.equal(await page.locator('.menu-toggle').count(),0);
   const navigation=page.getByRole('navigation',{name:'Main navigation'});
   assert.equal(await navigation.getByRole('link').count(),8);
   for(const link of await navigation.getByRole('link').all()) {
    assert(await link.isVisible());
    const r=await link.boundingBox(),h=await header.boundingBox();
    assert(r.x>=0 && r.x+r.width<=width && r.y>=h.y && r.y+r.height<=h.y+h.height, 'Navigation must remain within the banner');
   }
   assert(await header.locator('.brand img').evaluate(el=>el.complete&&el.naturalWidth>0));
   assert(await header.evaluate(el=>getComputedStyle(el).backgroundImage.includes('black-snakeskin')));
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No horizontal page overflow');
   await scan(page,{width,route,state:'visible navigation'},header,false);
   if(route)assert(await page.getByRole('link',{name:'← Back to home',exact:true}).isVisible());
  }
  if(route==='free-tokens/')assert(await page.getByRole('button',{name:'CLAIMS NOT OPEN YET',exact:true}).isDisabled());
  for(const image of await page.locator('.page-art img,.hero-image').all()){
   await image.scrollIntoViewIfNeeded();
   await image.evaluate(el=>el.decode());
   assert(await image.evaluate(el=>el.complete&&el.naturalWidth>0),'Page artwork must load when brought into view');
  }
  if(route==='feast/'){
   assert((await page.locator('main').innerText()).includes('with no refunds'));
   assert(await page.getByRole('button',{name:'FEAST NOT OPEN YET',exact:true}).isDisabled());
   const slots=page.locator('.feast-art');assert.equal(await slots.count(),1);
   // Reuse an existing project asset as an isolated decode/load fixture. This
   // creates no illustration and is never saved as the owner's menu artwork.
   await page.route('**/feast-menu.webp',route=>route.fulfill({path:'public/social-preview.png',contentType:'image/png'}));
   await page.reload({waitUntil:'networkidle'});
   await page.waitForFunction(()=>document.querySelectorAll('.feast-art[data-menu-state="art"]').length===1);
   for(const image of await page.locator('.feast-art img').all())assert(await image.isVisible());
   assert.equal(await page.getByRole('list',{name:'Accepted Feast coins'}).count(),1);
   await page.unroute('**/feast-menu.webp');
   await page.route('**/feast-menu.webp',route=>route.fulfill({status:404,body:''}));
   await page.reload({waitUntil:'networkidle'});
   await page.waitForFunction(()=>document.querySelectorAll('.feast-art[data-menu-state="board"]').length===1);
   for(const image of await page.locator('.feast-art img').all())assert(!await image.isVisible());
   await page.unroute('**/feast-menu.webp');

  }
  if(route==='') {
   await page.getByRole('link',{name:'Free tokens',exact:true}).click();
   await page.waitForURL('**/free-tokens/');
   await page.getByRole('link',{name:'← Back to home',exact:true}).click();
   await page.waitForURL(origin);
   await page.goto(origin+'#den',{waitUntil:'networkidle'});
   await page.waitForURL('**/community/');
  }
  if(route==='rules/') {
   await page.goto(new URL('rules/#privacy',origin).href,{waitUntil:'networkidle'});
   assert.equal(await page.locator('#privacy').getAttribute('open'),'');
   await page.locator('#privacy summary').click();
   assert.equal(await page.locator('#privacy').getAttribute('open'),null);
  }
  if(process.argv.includes('--capture')){
   await page.goto(new URL(route,origin).href,{waitUntil:'networkidle'});
   for(const image of await page.locator('.page-art img,.hero-image').all()){
    await image.scrollIntoViewIfNeeded();await image.evaluate(el=>el.decode());
   }
   await page.evaluate(()=>scrollTo(0,0));
   await page.screenshot({path:`tmp/site-review/after-${route.replace('/','')||'home'}-${width}.jpg`,type:'jpeg',quality:85,fullPage:true,animations:'disabled'});
  }
  results.push({width,route:'/'+route,textRuns:count,hoveredControls:hovered});console.log(JSON.stringify(results.at(-1)));await page.close();
 }
 writeFileSync('tmp/overnight/contrast-results.json',JSON.stringify({results,failures},null,2)+'\n');
 if(failures.length)console.error(JSON.stringify(failures.slice(0,25),null,2));
 assert.equal(failures.length,0,`WCAG AA contrast failures (${failures.length}); see tmp/overnight/contrast-results.json`);
 console.log('Contrast passed: all nine routes, 1440/390, text/hover, fixed header, page navigation and legacy links, navigation and closed actions; 4.5 body / 3 large.');
}finally{await browser.close();await new Promise(r=>server.httpServer.close(r));}
