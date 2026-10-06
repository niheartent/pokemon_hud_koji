/* Pinned/candidate core: semantic guards, native behavior preservation and real boot. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),acorn=require('acorn');
const {chromium,launchOptions}=require('../src/swsh/browser-runtime.cjs');
const root=path.join(__dirname,'..'),raw=process.env.UPSTREAM_CANDIDATE?fs.readFileSync(path.resolve(process.env.UPSTREAM_CANDIDATE),'utf8'):require('../src/shared/upstream-core.cjs')();
const version=raw.match(/var PK_VER='([^']+)'/)[1];
function functions(code){const map={};walk(acorn.parse(code,{ecmaVersion:'latest'}),n=>{if(n.type==='FunctionDeclaration')map[n.id.name]=code.slice(n.start,n.end);});return map;}
function walk(n,f){if(!n||!n.type)return;f(n);for(const v of Object.values(n))if(Array.isArray(v))v.forEach(x=>walk(x,f));else if(v&&v.type)walk(v,f);}
const business=['ensureSpriteMap','spriteMapBase','slugCandidates','resolvePkmIconRepo','resolvePkmBgRepo','candsFor','pkmSrcSlugs','bindPkmSlider','pkmScheduleRender','updatePkmStats','updatePkmStatsNow','diagInfo'];
(async()=>{const browser=await chromium.launch({headless:true,...launchOptions}),results=[];
try{for(const target of (process.env.UPSTREAM_CANDIDATE?['bw2','swsh']:['bw2','swsh','bw2-independent'])){
 const channel=target==='bw2-independent'?'bw2':target,independent=target==='bw2-independent';
 const ui=require(path.join(root,'src',channel,'package.json')).version;
 const folder=channel==='bw2'?path.join(root,'src/bw2','黑白2双版本-v'+ui,independent?'独立版':'完整版'):path.join(root,'src/swsh/HUD美化版-交付');
 const local=fs.readFileSync(path.join(folder,channel==='bw2'?(independent?'宝可梦HUD-独立版.js':'宝可梦HUD-完整版.js'):'宝可梦HUD-剑盾风格.js'),'utf8');let pkg;
 walk(acorn.parse(local,{ecmaVersion:'latest'}),n=>{if(n.type==='VariableDeclarator'&&n.id.name==='PK_BEAUTY_PACKAGE')pkg=JSON.parse(local.slice(n.init.start,n.init.end));});
 const scope={PK_BEAUTY_PACKAGE:pkg};vm.createContext(scope);if(pkg)vm.runInContext(pkg.runtime,scope);
 const code=independent?local:scope.pkBeautyBuildRemote(raw),before=functions(raw),after=functions(code);
 for(const name of independent?[]:business){assert(before[name],'missing latest business interface '+name);assert.equal(after[name],before[name],channel+' changed native '+name);}
 if(channel==='swsh'){
  assert.doesNotThrow(()=>scope.pkBeautyBuildRemote(raw.replace('st.textContent=css;','try{if(true){st.textContent=css;}}catch(e){}')));
  assert.doesNotThrow(()=>scope.pkBeautyBuildRemote(raw.replace('st.textContent=css;',"function unusedShadow(){var css='shadow';var st={};st.textContent=css;}st.textContent=css;")));
  assert.doesNotThrow(()=>scope.pkBeautyBuildRemote(raw.replace('st.textContent=css;','st.textContent=css;st.textContent=css;')));
 }
 const template=fs.readFileSync(path.join(folder,channel==='bw2'?'预览与测试.html':'剑盾版预览.html'),'utf8');
 const bridge="previewState.人际关系={'测试人物':'同行伙伴'};stat_data.人际关系=previewState.人际关系;window.__UPSTREAM_TEST={core:PK_VER,open:openPage,portrait:function(){stat_data.人际关系={'测试人物':'同行伙伴'};PKM_PORTRAITS={'测试人物':true};},rel:relHTML,newFeatures:function(){var items=[{name:'伤药',en:'Potion',desc:'恢复HP20'}];PKM_DB.item={data:items,idx:pkmDbBuildIndex(items,['name','en','jp'])};diyData.item={'自创图片':{img:'https://example.test/image.png'},'自创效果':{effect:'自创恢复效果'}};previewState.背包={'伤药':{类型:'道具',数量:1,图标:'wrong.png'},'写错的药':{类型:'道具',数量:1,图标:'potion.png'},'谜之道具':{类型:'道具',数量:1,图标:'unknown.png'},'自创图片':{类型:'道具',数量:1},'自创效果':{类型:'道具',数量:1}};stat_data.背包=previewState.背包;},cry:function(){FORM_CRY_MAP['test-form']=9999;return [pkmCryId({en:'test-form'},{ndex:25}),pkmCryId({en:'unknown'},{ndex:25})];}};loadDexList=function(region,cb){cb(Array.from({length:12},function(_,i){return {id:String(i+1),ndex:String(i+1),name:'测试精灵'+i};}));};";
 const start=template.lastIndexOf('<script>'),end=template.lastIndexOf('</script>'),boot=code.lastIndexOf('try{ensureHud();}catch(e){}'),script=code.slice(0,boot)+bridge+code.slice(boot);
 const html=template.slice(0,start+8)+script.replaceAll('</script','<\\/script')+template.slice(end),page=await browser.newPage({viewport:{width:1000,height:1400}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 async function closePage(){var key=await page.locator('.page-overlay.open').getAttribute('data-bw2-page-key');if(channel==='bw2'&&['bag','box','breeding','badge'].includes(key)){var button=page.locator('.bw2-page-close-button[data-page="'+key+'"]');if(await button.count())await button.click();else await page.locator('.tab-btn[data-tab="4"]').click();}else await page.locator('.page-overlay.open [data-page-close]').click();}

 await page.route('**/*',r=>r.fulfill({contentType:r.request().url().startsWith('http://localhost:3299')?'text/html':r.request().resourceType()==='image'?'image/svg+xml':'application/json',body:r.request().url().startsWith('http://localhost:3299')?html:r.request().resourceType()==='image'?'<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60"/>':'{"data":[]}'}));
 await page.goto('http://localhost:3299/'+channel);await page.locator(channel==='bw2'?'.bw2-console':'.swsh-team').waitFor();assert.equal(await page.evaluate(()=>__UPSTREAM_TEST.core),version);
 await page.locator('.card-frame[data-slot]').first().click();await page.locator(channel==='bw2'?'.bw2-detail':'.detail-modal').waitFor();await page.locator((channel==='bw2'?'.bw2-detail':'.detail-modal')+' [data-close]').click();
 for(const key of ['bag','box','badge','breeding','pokedex','settings','map','typechart']){await page.evaluate(key=>__UPSTREAM_TEST.open(key),key);await page.locator('.page-overlay.open .page').waitFor();await closePage();}
 if(/function resolveBagItemClick\(/.test(raw)){
  await page.evaluate(()=>{__UPSTREAM_TEST.newFeatures();__UPSTREAM_TEST.open('bag');});
  const row=name=>page.locator('.page-overlay.open .item-entry').filter({has:page.locator('.item-name',{hasText:name})});
  for(const name of ['谜之道具','自创图片']){
   assert(await row(name).evaluate(el=>el.classList.contains('item-no-click')));
   await row(name).locator('.item-name').click();assert.equal(await page.locator('.overlay.open').count(),0);
   await row(name).locator('.item-icon-wrap').click();assert.equal(await page.locator('.overlay.open').count(),0);
   assert.equal(await row(name).locator('[data-bag-discard]').count(),1);
  }
  assert.equal(await row('写错的药').getAttribute('data-item-en'),'Potion');
  assert.equal(await row('伤药').getAttribute('data-item-en'),null,'correct name must take precedence');
  assert.equal(await row('自创效果').getAttribute('data-item'),'自创效果');
  await row('写错的药').locator('.item-name').click();await page.locator('.overlay.open').waitFor();
  assert((await page.locator('.overlay.open').innerText()).includes('恢复HP20'));
  await page.locator('.overlay.open [data-sub-close]').click();
  await closePage();
  await page.evaluate(()=>__UPSTREAM_TEST.open('typechart'));
  assert(await page.locator('#tc-def-wrap').isVisible());
  await page.locator('[data-tc-mode="atk"]').click();assert(await page.locator('#tc-atk-wrap').isVisible());
  await page.locator('#tc-atk-1').selectOption('水');
  const text=await page.locator('#tc-atk-result').innerText();assert(text.includes('火')&&text.includes('地面')&&text.includes('岩石'));
  await page.locator('[data-tc-mode="def"]').click();await page.locator('#tc-def-1').selectOption('一般');
  assert((await page.locator('#tc-result').innerText()).includes('格斗'));
  assert((await page.locator('[data-tc-big]').getAttribute('data-tc-big')).includes('属性相克表.webp'));
  await closePage();
  assert.deepEqual(await page.evaluate(()=>__UPSTREAM_TEST.cry()),[9999,25]);
 }
 if(/function pkmRepoOrder\(/.test(raw)&&!/function pkmRepoAutoDetect\(/.test(raw)){
  await page.evaluate(()=>__UPSTREAM_TEST.open('settings'));
  assert.equal(await page.locator('input[data-repo-order]').count(),2);
  await page.locator('input[data-repo-order="jsdelivr"]').check();
  assert.equal(await page.evaluate(()=>localStorage.getItem('pk_repo_order')),'jsdelivr');
  await page.locator('input[data-repo-order="raw"]').check();
  assert.equal(await page.evaluate(()=>localStorage.getItem('pk_repo_order')),'raw');
  await closePage();
 }
 if(/function pkmRepoAutoDetect\(/.test(raw)){
  await page.evaluate(()=>__UPSTREAM_TEST.open('settings'));
  assert.equal(await page.locator('input[data-repo-order]').count(),0);
  assert.equal(await page.locator('[data-repo-auto]').count(),1);
  await closePage();
  await page.evaluate(()=>{__UPSTREAM_TEST.portrait();__UPSTREAM_TEST.open('rel');});
  await page.locator('.page-overlay.open [data-rel-settings]').click();
  await page.locator('.relset-row[data-relset-name="测试人物"]').waitFor();
  page.once('dialog',d=>d.accept('https://example.test/portrait.png'));
  await page.locator('[data-relset-url]').click();
  assert((await page.evaluate(()=>localStorage.getItem('pk_rel_portraits'))).includes('https://example.test/portrait.png'));
  await page.locator('[data-relset-clear]').click();
  assert.equal(await page.locator('[data-relset-clear]').count(),0);
  await page.locator('[data-relset-upload]').click();
  await page.locator('#relset-file').setInputFiles({name:'portrait.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jN1cAAAAASUVORK5CYII=','base64')});
  await page.locator('[data-relset-clear]').waitFor();
  assert((await page.evaluate(()=>localStorage.getItem('pk_rel_portraits'))).includes('pkidb:'));
  await page.locator('[data-relset-clear]').click();
  await page.locator('.overlay.open [data-close]').click();
  await page.locator('.page-overlay.open [data-rel]').first().click();
  await page.locator('.overlay.open img[alt="测试人物"]').waitFor();
  await page.locator('.overlay.open [data-close]').click();
  await page.locator('.page-overlay.open [data-rel-del-open]').click();
  await page.locator('[data-reldel="测试人物"]').waitFor();
  await page.locator('[data-reldel="测试人物"]').click();
  assert((await page.locator('.overlay.open').innerText()).includes('确定删除'));
 }
 assert.deepEqual(errors,[]);assert.equal(await page.evaluate(()=>previewWrites),0);await page.close();results.push({channel:target,core:version,businessFunctionsPreserved:independent?0:business.length,pages:10,errors});
}
fs.mkdirSync(path.join(root,'artifacts'),{recursive:true});fs.writeFileSync(path.join(root,'artifacts/upstream-browser-validation.json'),JSON.stringify({passed:true,results},null,2));console.log(JSON.stringify({passed:true,results}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
