/* Real published code, real installer/IndexedDB, strict simulated Tauri backend.
 * Assert the character is saved BEFORE any navigation or card reopening. */
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {chromium,launchOptions}=require('../src/swsh/browser-runtime.cjs');
const root=path.join(__dirname,'..'),upstream=process.env.UPSTREAM_CANDIDATE?fs.readFileSync(path.resolve(process.env.UPSTREAM_CANDIDATE),'utf8'):require('../src/shared/upstream-core.cjs')();
function composeOld(old,raw){const acorn=require('acorn'),vm=require('vm');let pkg;function walk(n){if(!n||!n.type)return;if(n.type==='VariableDeclarator'&&n.id.name==='PK_BEAUTY_PACKAGE')pkg=JSON.parse(old.slice(n.init.start,n.init.end));for(const v of Object.values(n))if(Array.isArray(v))v.forEach(walk);else if(v&&v.type)walk(v);}walk(acorn.parse(old,{ecmaVersion:'latest'}));const scope={PK_BEAUTY_PACKAGE:pkg};vm.createContext(scope);vm.runInContext(pkg.runtime,scope);return scope.pkBeautyBuildRemote(raw);}
(async()=>{const browser=await chromium.launch({headless:true,...launchOptions}),results=[];try{
for(const [channel,from] of [['swsh','1.6.11'],['swsh','1.6.12'],['swsh','1.6.13'],['swsh','1.6.14'],['bw2','0.4.12'],['bw2','0.4.13'],['bw2','0.4.14'],['bw2','0.4.15'],['swsh','1.6.15'],['bw2','0.4.16']]){
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'updates',channel+'.json'))),release=fs.readFileSync(path.join(root,'versions',channel,manifest.ui,'hud.js'),'utf8');
 const old=fs.readFileSync(path.join(root,'versions',channel,from,'hud.js'),'utf8');
 const folder=channel==='swsh'?path.join(root,'src/swsh/HUD美化版-交付'):path.join(root,'src/bw2/黑白2双版本-v'+manifest.ui+'/完整版');
 const template=fs.readFileSync(path.join(folder,channel==='swsh'?'剑盾版预览.html':'预览与测试.html'),'utf8');
 for(const core of [manifest.core,'5.3.2']){
  const candidate=upstream.replace(/var PK_VER='[^']+';/,"var PK_VER='"+core+"';"),installed=process.env.UPSTREAM_CANDIDATE?composeOld(old,candidate):old.replace(/var PK_VER='[^']+';/,"var PK_VER='"+core+"';");
  const marker=installed.lastIndexOf('try{ensureHud();}catch(e){}');assert(marker>0);
  const bridge="window.__LIVE_WRITE_TEST={host:WIN,open:openPage,check:pkCheckUpdate,install:pkDoUpdate,write:function(s){return pkUpdateScript(s);},record:function(){return pkSlotRead('active');},snapshot:function(){return kojiPrepared;},tauri:function(){PK_IS_TAURI=true;}};";
  const script=installed.slice(0,marker)+bridge+installed.slice(marker),start=template.lastIndexOf('<script>'),end=template.lastIndexOf('</script>');
  const html=template.slice(0,start+8)+script.replaceAll('</script','<\\/script')+template.slice(end);
  const page=await browser.newPage({viewport:{width:1000,height:1400}}),errors=[];let navigations=0;
  page.on('pageerror',e=>errors.push(e.message));page.on('framenavigated',f=>{if(f===page.mainFrame())navigations++;});
  await page.route('**/*',r=>{
   const url=r.request().url();
   if(url.startsWith('http://localhost:3295/'))return r.fulfill({contentType:'text/html',body:html});
   if(url.includes('/updates/'+channel+'.json'))return r.fulfill({json:manifest});
   if(url.startsWith(manifest.script))return r.fulfill({contentType:'text/javascript',body:release});
   if(url.includes('/pkm-hud/main/pkm-hud.js'))return r.fulfill({contentType:'text/javascript',body:candidate});
   return r.fulfill({contentType:r.request().resourceType()==='image'?'image/svg+xml':'application/json',body:r.request().resourceType()==='image'?'<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"/>':'{"data":[]}'});
  });
  await page.goto('http://localhost:3295/');await page.locator(channel==='swsh'?'.swsh-team':'.bw2-console').waitFor();
  await page.evaluate(({installed})=>{
   const make=(avatar,name)=>({avatar,name,description:'fresh description',extensions:{custom:'keep',tavern_helper:{scripts:[{id:'disabled-hud',enabled:false,content:installed},{id:'hud',enabled:true,content:installed},{id:'other',content:'keep other script'}]}}});
   const other=make('unrelated-file.png','another card'),current=make('actual-storage-file.png','宝可梦战斗爽12.0'),cards={'unrelated-file':other,'actual-storage-file':current},ctx={characterId:0,characters:[JSON.parse(JSON.stringify(current))]},calls=[];
   const original=async function(command,args){
    calls.push({command,args:JSON.parse(JSON.stringify(args))});
    if(command==='get_all_characters')return JSON.parse(JSON.stringify([other,current]));
    if(command==='get_character'){if(!cards[args.name])throw Error('Not found: Character not found: '+args.name);return JSON.parse(JSON.stringify(cards[args.name]));}
    if(command==='update_character'){if(!cards[args.name])throw Error('Failed to update character: Not found: Character not found: '+args.name);cards[args.name].extensions=JSON.parse(JSON.stringify(args.dto.extensions));return JSON.parse(JSON.stringify(cards[args.name]));}
    if(command==='clear_character_cache')return;
    if(command==='unrelated_probe')return {untouched:true,args};
    throw Error('Unexpected command '+command);
   };
   __LIVE_WRITE_TEST.host.SillyTavern={getContext:()=>ctx};__LIVE_WRITE_TEST.host.__TAURI_INTERNALS__={invoke:original};__LIVE_WRITE_TEST.tauri();
   window.__BACKEND={cards,calls,ctx,original};
  },{installed});
  // Prove the real pre-fix implementation fails against storage-key identity.
  if(['1.6.11','1.6.12','1.6.13','0.4.12','0.4.13','0.4.14'].includes(from)){
   const baseline=await page.evaluate(()=>__LIVE_WRITE_TEST.write('var PK_VER=\'0.0.0\'; // pkm-hud-btn'));assert.equal(baseline.ok,false);
   assert(await page.evaluate(()=>__BACKEND.calls.some(c=>c.command==='update_character'&&!__BACKEND.cards[c.args.name])));
   await page.evaluate(()=>{__BACKEND.calls.length=0;});
  }
  await page.evaluate(()=>__LIVE_WRITE_TEST.open('settings'));
  const checked=await page.evaluate(()=>__LIVE_WRITE_TEST.check());assert.equal(checked,true,await page.locator('#pk-update-msg').innerText());
  assert.equal(await page.evaluate(()=>__BACKEND.calls.filter(c=>c.command==='update_character').length),0,'checking must not write');
  const probe=await page.evaluate(()=>__LIVE_WRITE_TEST.host.__TAURI_INTERNALS__.invoke('unrelated_probe',{sentinel:123}));assert.deepEqual(probe,{untouched:true,args:{sentinel:123}});
  await page.locator('.page-overlay.open [data-pk-do-update]').click();
  await page.waitForFunction(()=>document.querySelector('#pk-update-msg')?.textContent.includes('新版已写入当前角色卡并校验成功')).catch(async e=>{console.error(await page.locator('#pk-update-msg').innerText());throw e;});
  const prepared=await page.evaluate(()=>__LIVE_WRITE_TEST.snapshot()),record=await page.evaluate(()=>__LIVE_WRITE_TEST.record());assert(record,channel+' '+from+' missing active record');assert.equal(record.content,prepared.content);
  const state=await page.evaluate(()=>({cards:__BACKEND.cards,calls:__BACKEND.calls,cached:__BACKEND.ctx.characters[0],restored:__LIVE_WRITE_TEST.host.__TAURI_INTERNALS__.invoke===__BACKEND.original&&!__LIVE_WRITE_TEST.host.__kojiHudLiveInstallerV1}));
  const writes=state.calls.filter(c=>c.command==='update_character');assert.equal(writes.length,1);assert.equal(writes[0].args.name,'actual-storage-file');assert.deepEqual(Object.keys(writes[0].args.dto),['extensions']);
  assert.equal(state.cards['actual-storage-file'].extensions.tavern_helper.scripts.find(s=>s.id==='hud').content,prepared.content,'card saved in old running session');
  assert.equal(state.cards['unrelated-file'].extensions.tavern_helper.scripts[0].content,installed,'other HUD untouched');
  assert.equal(state.cached.extensions.tavern_helper.scripts.find(s=>s.id==='hud').content,prepared.content,'current context synchronized');
  assert.equal(state.cards['actual-storage-file'].description,'fresh description');assert.equal(state.cards['actual-storage-file'].extensions.custom,'keep');assert(state.restored,'temporary bridge restored');
  assert.equal(state.cards['actual-storage-file'].extensions.tavern_helper.scripts[0].content,installed,'disabled original HUD must not change');
  assert.equal(navigations,1,'must not reload to complete writeback');assert.deepEqual(errors,[]);await page.close();
  results.push({channel,from,to:manifest.ui,core,cardSavedWithoutReload:true,writeCount:writes.length,hostApiUnchanged:true,disabledHudUnchanged:true,liveInstallerRemoved:true});
 }
}
fs.writeFileSync(path.join(root,'artifacts/live-writeback-upgrade-tests.json'),JSON.stringify({passed:true,results,realHostWriteTested:false},null,2));console.log(JSON.stringify({passed:true,results}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
