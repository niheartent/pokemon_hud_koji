/* Real published updater -> current release. Isolated host, real IndexedDB. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium,launchOptions}=require('../src/swsh/browser-runtime.cjs');
const root=path.join(__dirname,'..'),upstream=process.env.UPSTREAM_CANDIDATE?fs.readFileSync(path.resolve(process.env.UPSTREAM_CANDIDATE),'utf8'):require('../src/shared/upstream-core.cjs')();
const expectedCore=upstream.match(/var PK_VER='([^']+)'/)[1];
const targets=[['swsh','1.5.1'],['swsh','1.6.0'],['bw2','0.3.10'],['bw2','0.4.0'],['swsh','1.6.2'],['swsh','1.6.3'],['bw2','0.4.1']];
if(process.env.UPSTREAM_CANDIDATE&&expectedCore!==require('../src/shared/upstream/manifest.json').version)for(const channel of ['swsh','bw2'])targets.push([channel,require(path.join(root,'src',channel,'package.json')).version]);
(async()=>{const browser=await chromium.launch({headless:true,...launchOptions}),results=[];
try{for(const [channel,oldUi] of targets){
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'updates',channel+'.json'),'utf8'));
 const release=fs.readFileSync(path.join(root,'versions',channel,manifest.ui,'hud.js'),'utf8');
 const old=fs.readFileSync(path.join(root,'versions',channel,oldUi,'hud.js'),'utf8');
 const folder=channel==='swsh'?path.join(root,'src/swsh/HUD美化版-交付'):path.join(root,'src/bw2','黑白2双版本-v'+manifest.ui,'完整版');
 const template=fs.readFileSync(path.join(folder,channel==='swsh'?'剑盾版预览.html':'预览与测试.html'),'utf8');
 for(const installedCore of [old.match(/var PK_VER='([^']+)'/)[1],'3.3.27']){
  // The second case simulates the reported cached core version; updater code is unchanged.
  let script=old.replace(/var PK_VER='[^']+';/,"var PK_VER='"+installedCore+"';");
  const boot=script.lastIndexOf('try{ensureHud();}catch(e){}');assert(boot>=0);
  script=script.slice(0,boot)+"window.__UPGRADE_TEST={check:pkCheckUpdate,install:pkDoUpdate,open:openPage,snapshot:function(){return kojiPrepared;},record:function(){return pkSlotRead('active');}};pkUpdateScript=function(){return Promise.resolve({ok:false});};"+script.slice(boot);
  const start=template.lastIndexOf('<script>'),end=template.lastIndexOf('</script>'),html=template.slice(0,start+8)+script.replaceAll('</script','<\\/script')+template.slice(end);
  const page=await browser.newPage({viewport:{width:1000,height:1400}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>{
   const url=r.request().url();
   if(url.startsWith('http://localhost:3219/'))return r.fulfill({contentType:'text/html',body:html});
   if(url.includes('/updates/'+channel+'.json'))return r.fulfill({contentType:'application/json',body:JSON.stringify(manifest)});
   if(url.startsWith(manifest.script))return r.fulfill({contentType:'text/javascript',body:release});
   if(url.includes('/pkm-hud/main/pkm-hud.js'))return r.fulfill({contentType:'text/javascript',body:upstream});
   return r.fulfill({contentType:r.request().resourceType()==='image'?'image/svg+xml':'application/json',body:r.request().resourceType()==='image'?'<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60"/>':'{"data":[]}'});
  });
  await page.goto('http://localhost:3219/'+channel+'/'+installedCore);await page.locator(channel==='swsh'?'.swsh-team':'.bw2-console').waitFor();
  await page.evaluate(()=>__UPGRADE_TEST.open('settings'));
  assert.equal(await page.evaluate(()=>__UPGRADE_TEST.check()),true);
  const ready=await page.evaluate(()=>__UPGRADE_TEST.snapshot());assert.equal(ready.ui,manifest.ui);assert.equal(ready.core,expectedCore);
  assert.equal(await page.evaluate(()=>__UPGRADE_TEST.install()),true);
  const record=await page.evaluate(()=>__UPGRADE_TEST.record());assert.equal(record.version,expectedCore);assert(record.content.includes("var PK_BEAUTY_VER='"+manifest.ui+"';"));
  await page.reload();await page.locator(channel==='swsh'?'.swsh-team':'.bw2-console').waitFor();
  await page.locator('.tab-btn[data-tab="4"]').click();await page.locator('#tab-4 [data-page="settings"]').click();await page.locator('.page-overlay.open').waitFor();
  const text=await page.locator('.page-overlay.open').innerText();assert(text.includes(manifest.ui));assert(text.includes(expectedCore));
  assert.deepEqual(errors,[]);await page.close();results.push({channel,from:oldUi,installedCore,to:manifest.ui,core:expectedCore,checkedInstalledAndReloaded:true});
 }
}
fs.writeFileSync(path.join(root,'artifacts/published-upgrade-tests.json'),JSON.stringify({passed:true,results,realHostWriteBackTested:false},null,2));console.log(JSON.stringify({passed:true,results}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
