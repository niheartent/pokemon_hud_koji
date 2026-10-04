/* Isolated fake host: unchanged reuse, invalidation, and native side effects. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('./browser-runtime.cjs');
const out=path.join(__dirname,'HUD美化版-交付');
let html=fs.readFileSync(path.join(out,'剑盾版预览.html'),'utf8');
html=html.replace('window.__SWSH_TEST={',`window.__OPT={refresh:function(){return refreshHudPanels(document.getElementById('pkm-hud-inline'));},cache:function(){return swshDecorationCache;},native:swshBaseViews,state:function(){return stat_data;}};window.__SWSH_TEST={`);
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jv14AAAAASUVORK5CYII=','base64');
(async()=>{const browser=await chromium.launch({headless:true,...require('./browser-runtime.cjs').launchOptions}),errors=[];
try{const page=await browser.newPage({viewport:{width:1000,height:1000}});page.on('pageerror',e=>errors.push(e.message));
await page.route('**/*',r=>r.request().url().startsWith('http://opt.test')?r.fulfill({contentType:'text/html',body:html}):r.request().resourceType()==='image'?r.fulfill({contentType:'image/png',body:png}):r.fulfill({contentType:'application/json',body:'{"data":[]}'}));
await page.goto('http://opt.test');await page.locator('.swsh-team').waitFor();await page.waitForTimeout(100);
const reuse=await page.evaluate(()=>{
  __OPT.refresh();var prior=__OPT.cache().menu,node=document.querySelector('#tab-4 .menu-item'),team=__OPT.native.teamHTML,calls=0;
  __OPT.native.teamHTML=function(){calls++;return team.apply(this,arguments);};
  __OPT.refresh();__OPT.refresh();
  return {cacheSame:prior===__OPT.cache().menu,nodeSame:node===document.querySelector('#tab-4 .menu-item'),nativeCalls:calls,svg:document.querySelectorAll('.swsh-party-list .card-bg-svg').length};
});assert.deepEqual(reuse,{cacheSame:true,nodeSame:true,nativeCalls:2,svg:0});
const mutation=await page.evaluate(()=>{var label=document.querySelector('#tab-4 .menu-label'),text=label.textContent;label.textContent='临时变更';__OPT.refresh();return document.querySelector('#tab-4 .menu-label').textContent===text&&label!==document.querySelector('#tab-4 .menu-label');});assert(mutation,'live changes must invalidate DOM reuse');
const icon=await page.evaluate(()=>{var before=__OPT.cache().menu;localStorage.setItem('pk_iconsize',JSON.stringify({'m-bag':42}));__OPT.refresh();return {changed:before!==__OPT.cache().menu,width:document.querySelector('#tab-4 [data-page="bag"] svg').getAttribute('width')};});assert.deepEqual(icon,{changed:true,width:'42'});
const added=await page.evaluate(()=>{var original=__OPT.native.worldHTML;__OPT.native.worldHTML=function(){return original.apply(this,arguments)+'<div data-upstream-new>新的上游内容</div>';};__OPT.refresh();return document.querySelector('[data-upstream-new]').textContent;});assert.equal(added,'新的上游内容');
// Drive a real data refresh through the fixture bridge, using its current native field.
const update=await page.evaluate(async()=>{var team=previewState.队伍;
  if(!team)throw new Error('missing fixture team');var first=Object.values(team)[0];first.HP='123/211';first.名字='优化验证新名字';
  await __SWSH_TEST.refresh();return document.querySelector('.swsh-party-list').textContent;
});assert(update.includes('优化验证新名字'),'new data must invalidate cache');assert(update.includes('123/211'),'HP change must render');
const imageChanged=await page.evaluate(async()=>{previewState.队伍['1'].图标='https://opt-assets.test/new-sprite.png';await __SWSH_TEST.refresh();return document.querySelector('.swsh-party-focus img').getAttribute('src');});assert.equal(imageChanged,'https://opt-assets.test/new-sprite.png','changed sprite must invalidate cache');
assert.equal(await page.evaluate(()=>previewWrites),0);assert.deepEqual(errors,[]);
const result={passed:true,scope:'隔离模拟宿主',unchangedDecorationReused:true,unchangedPanelNodesRetained:true,ownedBaseGenerationStillRuns:true,liveMutationInvalidates:true,iconSizeInvalidates:true,ownedTemplateAdditionsVisible:true,nameAndHpChangeVisible:true,spriteChangeVisible:true,unusedPartyBordersRemoved:true,presentationWrites:0,errors};
fs.writeFileSync(path.join(out,'优化验证.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});

