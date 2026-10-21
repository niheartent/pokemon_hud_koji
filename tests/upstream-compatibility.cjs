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
 const bridge="previewState.队伍['1'].属性1='草';previewState.队伍['1'].属性2='钢';stat_data.队伍['1'].属性1='草';stat_data.队伍['1'].属性2='钢';previewState.人际关系={'测试人物':'同行伙伴'};stat_data.人际关系=previewState.人际关系;window.__UPSTREAM_TEST={resetCategories:function(){kojiBagCategoryOverrides={};localStorage.removeItem(kojiBagCategoryKey);},categories:function(){previewState.背包={'伤药':{类型:'道具',数量:3,图标:''},'测试长名称道具用来检查窄屏显示':{类型:'道具',数量:1,图标:''}};stat_data.背包=previewState.背包;activeBag='回复';bagCatEdit=false;bagDiscardMode=false;render();},category:function(){return {type:previewState.背包.伤药.类型,actual:itemCategoryOf('伤药',stat_data.背包.伤药.类型),stored:localStorage.getItem(kojiBagCategoryKey)};},references:function(){kojiReferenceReady();return {maps:MAPS.length,badges:Object.keys(BADGE_MAP).length,special:nearbyCategoryMeta({名字:'梦幻'}).mythical,translated:t2s('寶可夢'),category:itemCategoryOf('伤药','道具')};},phone:function(){var items=[{name:'手机',en:'Phone',desc:'可以安装手机壳的通讯设备'}];PKM_DB.item={data:items,idx:pkmDbBuildIndex(items,['name','en','jp'])};previewState.背包={'手机':{类型:'重要物品',数量:1,图标:'默认手机壳'}};stat_data.背包=previewState.背包;activeBag='重要物品';foldState.bagfold=true;render();},phoneValue:function(){return {saved:previewState.背包.手机.图标,current:stat_data.背包.手机.图标};},battleLock:function(enabled){stat_data.战场=enabled?{场景:'测试战斗'}:{};previewState.战场=stat_data.战场;render();},forceAura:function(n){setActiveAura(n);},sprite:async function(){return await hudBuildPokemonSpriteUrls({slug:'testslug'});},dexName:function(){var g=document.createElement('div');g.id='pokedex-grid';document.body.appendChild(g);renderDexGrid([{id:'892',ndex:'892',name:'武道熊师（连击流）'}],{},{},{'武道熊师':1});var name=g.querySelector('.dex-name').textContent;g.remove();return name;},aura:function(){stat_data.战场={};previewState.战场={};var raw='1.气场一：增强攻击‖2.气场二：增强防御‖3.空‖启用1';previewState.训练家.气场=raw;stat_data.训练家.气场=raw;render();},auraValue:function(){return {current:stat_data.训练家.气场,saved:previewState.训练家.气场,writes:previewWrites};},theme:function(dark){if(typeof swshApplyTheme==='function'){swshDarkTheme=dark;swshApplyTheme(document.getElementById('pkm-hud-inline'));}},formatted:function(){stat_data.任务={传说:'传说一；传说二\\n传说三',支线:'支线一；；\\n支线二'};stat_data.劲敌={测试劲敌:'信息｜已知宝可梦：皮卡丘'};return {tasks:tasksHTML(),rivals:rivalsHTML(),cmd:CMDS[0][1]};},battle:function(){stat_data.战场={场上:{'测试精灵（我方）':'Lv.50 100/100｜草／钢｜特性：茂盛｜招式：撞击'},各方:{测试训练家:'队列1. 测试队列（草·钢） Lv.50｜招式：撞击'}};previewState.战场=stat_data.战场;document.querySelector('#tab-3').innerHTML=battleHTML();},imageFallback:function(){var el=document.createElement('img');el.setAttribute('src',PKM_REPO_RAW+'UI/地图/合众.png');kojiMapImgErr(el);var first=el.getAttribute('src'),fallback=el.getAttribute('data-fallback');kojiMapImgErr(el);return {first:first,fallback:fallback,hidden:el.style.display};},core:PK_VER,open:openPage,repo:function(){return {url:pkmRepoFirst(PKM_REPO_RAW+'types.json'),icon:ITEM_IMG['阿尔宙斯手机']};},adaptation:function(){return {type:typeChipHTML('草'),detail:kojiDetailTypesHTML('草','钢'),move:moveGridItemHTML({name:'飞叶快刀',type:'草',cat:'物理'}),width:settingsHTML().indexOf('data-width-open')>=0};},portrait:function(){stat_data.人际关系={'测试人物':'同行伙伴'};PKM_PORTRAITS={'测试人物':true};},rel:relHTML,newFeatures:function(){activeBag='道具';if(typeof kojiBagCategoryOverrides!=='undefined')['伤药','写错的药','谜之道具','自创图片','自创效果'].forEach(function(n){kojiBagCategoryOverrides[n]='道具';});var items=[{name:'伤药',en:'Potion',desc:'恢复HP20'}];PKM_DB.item={data:items,idx:pkmDbBuildIndex(items,['name','en','jp'])};diyData.item={'自创图片':{img:'https://example.test/image.png'},'自创效果':{effect:'自创恢复效果'}};previewState.背包={'伤药':{类型:'道具',数量:1,图标:'wrong.png'},'写错的药':{类型:'道具',数量:1,图标:'potion.png'},'谜之道具':{类型:'道具',数量:1,图标:'unknown.png'},'自创图片':{类型:'道具',数量:1},'自创效果':{类型:'道具',数量:1}};stat_data.背包=previewState.背包;},cry:function(){FORM_CRY_MAP['test-form']=9999;return [pkmCryId({en:'test-form'},{ndex:25}),pkmCryId({en:'unknown'},{ndex:25})];}};loadDexList=function(region,cb){cb(Array.from({length:12},function(_,i){return {id:String(i+1),ndex:String(i+1),name:'测试精灵'+i};}));};";
 const start=template.lastIndexOf('<script>'),end=template.lastIndexOf('</script>'),boot=code.lastIndexOf('try{ensureHud();}catch(e){}'),script=code.slice(0,boot)+bridge+code.slice(boot);
 const html=template.slice(0,start+8)+script.replaceAll('</script','<\\/script')+template.slice(end),page=await browser.newPage({viewport:{width:1000,height:1400}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 async function closePage(){var key=await page.locator('.page-overlay.open').getAttribute('data-bw2-page-key');if(channel==='bw2'&&['bag','box','breeding','badge'].includes(key)){var button=page.locator('.bw2-page-close-button[data-page="'+key+'"]');if(await button.count())await button.click();else await page.locator('.tab-btn[data-tab="4"]').click();}else await page.locator('.page-overlay.open [data-page-close]').click();}

 await page.route('**/*',r=>{const u=r.request().url();if(u.includes('phone-cases.json'))return r.fulfill({json:{cases:['皮卡丘','耿鬼']}});if(u.includes('slug-fix.json'))return r.fulfill({json:{data:{testslug:'test-slug'}}});return r.fulfill({contentType:r.request().url().startsWith('http://localhost:3299')?'text/html':r.request().resourceType()==='image'?'image/svg+xml':'application/json',body:r.request().url().startsWith('http://localhost:3299')?html:r.request().resourceType()==='image'?'<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60"/>':'{"data":[]}'});});
 await page.goto('http://localhost:3299/'+channel);await page.locator(channel==='bw2'?'.bw2-console':'.swsh-team').waitFor().catch(e=>{console.error(errors);throw e;});assert.equal(await page.evaluate(()=>__UPSTREAM_TEST.core),version);
 if(/function parseAura\(/.test(raw)){
  for(const name of ['parseAura','auraRebuild','setActiveAura','openAuraPicker'])if(!independent)assert.equal(after[name],before[name],'native aura service '+name);
  const colors=[];
  for(const dark of channel==='swsh'?[false,true]:[true]){
   await page.evaluate(d=>{__UPSTREAM_TEST.theme(d);__UPSTREAM_TEST.aura();},dark);
   if(channel==='bw2')await page.locator('[data-bw2-trainer]').click();else await page.locator('.swsh-trainer-details').evaluate(el=>el.open=true);
   const entry=page.locator('#aura-entry');assert((await entry.innerText()).includes('气场一'));assert(!(await entry.innerText()).includes('气场二'));
   await page.locator('#aura-cycle').click();const picker=page.locator('.overlay.open .koji-aura-modal');await picker.waitFor();
   assert.equal(await picker.locator('[data-aura]').count(),3);assert(await picker.locator('[data-aura="3"]').isDisabled());
   await page.waitForTimeout(200);
   const samples=await picker.locator('.aura-slot').evaluateAll(els=>els.map(el=>{var c=getComputedStyle(el);return {fg:c.color,bg:c.backgroundColor};}));
   function lum(rgb){return rgb.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>v/255).map(v=>v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4)).reduce((x,v,i)=>x+v*[.2126,.7152,.0722][i],0);}
   for(const c of samples){const a=lum(c.fg),b=lum(c.bg),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);assert(ratio>=4.5,JSON.stringify({channel,dark,c,ratio}));}
   colors.push(samples[0].bg);
   if(channel==='swsh')assert.equal(await picker.locator('.aura-slot.active').evaluate(el=>getComputedStyle(el).borderColor),dark?'rgb(143, 185, 217)':'rgb(184, 46, 70)');
   await picker.screenshot({path:path.join(root,'artifacts','aura-'+target+'-'+(dark?'dark':'day')+'.png')});
   await picker.locator('[data-aura="2"]').focus();await page.keyboard.press('Enter');await page.waitForFunction(()=>__UPSTREAM_TEST.auraValue().saved.endsWith('启用2'));
   const value=await page.evaluate(()=>__UPSTREAM_TEST.auraValue());assert(value.current.endsWith('启用2'));assert(value.writes>0);assert.equal(await page.locator('.koji-aura-modal:visible').count(),0);
   await page.waitForFunction(()=>document.querySelector('#aura-entry').textContent.includes('气场二'));
  }
  if(channel==='swsh')assert.notEqual(colors[0],colors[1],'day and night aura colors must differ');
  if(channel==='bw2')await page.locator('[data-bw2-trainer]').click();else await page.locator('.swsh-trainer-details').evaluate(el=>el.open=false);
  const formatted=await page.evaluate(()=>__UPSTREAM_TEST.formatted());
  assert(formatted.tasks.includes('传说一<br>传说二<br>传说三'));assert(formatted.tasks.includes('支线一<br>支线二'));assert(!formatted.tasks.includes('<br><br>'));assert(formatted.rivals.includes('信息<br>已知宝可梦'));assert(!formatted.cmd.includes('洛托姆'));
 }
 if(/function inBattle\(/.test(raw)){
  const beforeLock=await page.evaluate(()=>__UPSTREAM_TEST.auraValue());await page.evaluate(()=>__UPSTREAM_TEST.battleLock(true));
  assert.equal(await page.locator('#aura-cycle').count(),0);assert.equal(await page.locator('#aura-busy').count(),1);
  await page.evaluate(()=>__UPSTREAM_TEST.forceAura(1));await page.waitForTimeout(80);
  assert.deepEqual(await page.evaluate(()=>__UPSTREAM_TEST.auraValue()),beforeLock);
  if(await page.locator('.overlay.open [data-close]').count())await page.locator('.overlay.open [data-close]').first().click();
  await page.evaluate(()=>__UPSTREAM_TEST.battleLock(false));assert.equal(await page.locator('#aura-cycle').count(),1);
 }
 if(/function loadPhoneCases\(/.test(raw)){
  for(const name of ['loadPhoneCases','phoneCaseIconURL','pickPhoneCase','hudBuildPokemonSpriteUrls','ensureSlugFix'])if(!independent)assert.equal(after[name],before[name],'native new service '+name);
  assert.equal((await page.evaluate(()=>__UPSTREAM_TEST.sprite())).slug,'test-slug');
  assert.equal(await page.evaluate(()=>__UPSTREAM_TEST.dexName()),'武道熊师');
  for(const dark of channel==='swsh'?[false,true]:[true]){
   await page.evaluate(d=>{__UPSTREAM_TEST.theme(d);__UPSTREAM_TEST.phone();__UPSTREAM_TEST.open('bag');},dark);
   const row=page.locator('.page-overlay.open .item-entry').filter({has:page.locator('.item-name',{hasText:'手机'})});
   await row.locator('.item-name').click();await page.locator('[data-phone-case-btn]').click();
   const picker=page.locator('.overlay.open .koji-phone-modal');await picker.waitFor();assert.equal(await picker.locator('[data-phone-pick]').count(),3);
   await page.waitForTimeout(200);
   const samples=await picker.locator('.phone-cell').evaluateAll(els=>els.map(el=>{var c=getComputedStyle(el);return {fg:c.color,bg:c.backgroundColor};}));
   for(const c of samples){const a=lum(c.fg),b=lum(c.bg);assert((Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=4.5,JSON.stringify({channel,dark,c}));}
   await picker.screenshot({path:path.join(root,'artifacts','phone-'+target+'-'+(dark?'dark':'day')+'.png')});
   await picker.locator('[data-phone-pick="皮卡丘"]').focus();await page.keyboard.press('Enter');
   await page.waitForFunction(()=>__UPSTREAM_TEST.phoneValue().saved==='皮卡丘');
   await page.waitForFunction(()=>Array.from(document.querySelectorAll('.page-overlay.open .item-entry img')).some(el=>decodeURIComponent(el.src).includes('皮卡丘.webp')));
   assert.equal((await page.evaluate(()=>__UPSTREAM_TEST.phoneValue())).current,'皮卡丘');
   if(channel==='swsh')await page.waitForFunction(()=>Array.from(document.querySelectorAll('#home-fold .item-entry img')).some(el=>decodeURIComponent(el.src).includes('皮卡丘.webp')));
   await row.locator('.item-name').click();await page.locator('[data-phone-case-btn]').click();await picker.locator('[data-phone-pick=""]').click();
   await page.waitForFunction(()=>__UPSTREAM_TEST.phoneValue().saved==='默认手机壳');
   await page.waitForFunction(()=>Array.from(document.querySelectorAll('.page-overlay.open .item-entry img')).some(el=>decodeURIComponent(el.src).includes('/手机.webp')));
   await closePage();
  }
 }
 if(/function ensureItemCategories\(/.test(raw)){
  const refs=await page.evaluate(()=>__UPSTREAM_TEST.references());assert(refs.maps>=8);assert(refs.badges>=8);assert(refs.special);assert.equal(refs.category,'回复');assert.equal(refs.translated,'宝可梦');
  for(const dark of channel==='swsh'?[false,true]:[true]){
   await page.setViewportSize({width:360,height:1400});
   await page.evaluate(d=>{__UPSTREAM_TEST.theme(d);__UPSTREAM_TEST.categories();__UPSTREAM_TEST.open('bag');},dark);
   const host=page.locator('.page-overlay.open'),mode=attr=>host.locator('['+attr+']');
   assert.equal(await host.locator('.bag-tab').count(),8);assert.equal(await host.locator('[data-bag-discard],[data-bag-recat]').count(),0);
   await mode('data-bag-cat-edit').click();await host.locator('[data-bag-recat="伤药"]').click();
   const picker=page.locator('.overlay.open .koji-phone-modal');await picker.waitFor();assert.equal(await picker.locator('[data-bag-recat-pick]').count(),8);
   await page.waitForTimeout(200);
   const samples=await picker.locator('.phone-cell').evaluateAll(els=>els.map(el=>{var c=getComputedStyle(el);return {fg:c.color,bg:c.backgroundColor};}));
   for(const c of samples){const a=lum(c.fg),b=lum(c.bg);assert((Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=4.5,JSON.stringify({channel,dark,c}));}
   await picker.screenshot({path:path.join(root,'artifacts','categories-'+target+'-'+(dark?'dark':'day')+'.png')});
   await picker.locator('[data-bag-recat-pick="道具"]').focus();await page.keyboard.press('Enter');await page.waitForFunction(()=>__UPSTREAM_TEST.category().type==='道具'&&__UPSTREAM_TEST.category().actual==='道具'&&document.querySelector('.koji-phone-modal').closest('.overlay').classList.contains('open')===false);
   assert(JSON.parse((await page.evaluate(()=>__UPSTREAM_TEST.category())).stored)['伤药']==='道具');
   await host.locator('[data-bag="道具"]').click();assert.equal(await host.locator('[data-bag-recat="伤药"]').count(),1);await host.locator('[data-bag-recat="伤药"]').click();await picker.waitFor();await picker.locator('[data-close]').click();
   await mode('data-bag-discard-mode').click();assert.equal(await host.locator('[data-bag-recat]').count(),0);assert.equal(await host.locator('[data-bag-discard]').count(),2);
   await mode('data-bag-discard-mode').click();assert.equal(await host.locator('[data-bag-discard]').count(),0);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));await closePage();
   // Re-test the default automatic category on the next theme.
   await page.evaluate(()=>__UPSTREAM_TEST.resetCategories());
  }
  await page.setViewportSize({width:1000,height:1400});
 }
 const writesAfterAura=await page.evaluate(()=>previewWrites);
 await page.locator('.card-frame[data-slot]').first().click();await page.locator(channel==='bw2'?'.bw2-detail':'.detail-modal').waitFor();
 const detail=page.locator(channel==='bw2'?'.bw2-detail':'.detail-modal');
 if(/function showTypeWeakness\(/.test(raw)){
  const chips=detail.locator('[data-type-weak]');assert.equal(await chips.count(),2);assert.equal(await chips.first().getAttribute('data-type-weak'),'草|钢');
  for(const action of ['click','Enter',' ']){
   if(action==='click')await chips.first().click();else{await chips.last().focus();await page.keyboard.press(action===' '?'Space':action);}
   const popup=page.locator('.pkm-hud-sub.open');await popup.waitFor();assert((await popup.locator('.modal-name').innerText()).includes('草 / 钢'));
   assert((await popup.locator('.modal-body').innerText()).includes('4× 克制'));
   assert((await popup.locator('.modal-body').innerText()).includes('火'));
   const poison=popup.locator('.modal-body>div').filter({hasText:'0× 无效'});assert((await poison.innerText()).includes('毒'));
   await popup.locator('[data-sub-close]').click();assert.equal(await detail.count(),1);
  }
 }else assert.equal(await detail.locator('[data-type-weak]').count(),0);
 await detail.locator('[data-close]').click();
 if(/function btTypeLine\(/.test(raw)){
  await page.locator('.tab-btn[data-tab="3"]').click();await page.evaluate(()=>__UPSTREAM_TEST.battle());
  const cards=page.locator('#tab-3 .bt-card');assert.equal(await cards.count(),2);
  assert.equal(await cards.first().locator('[data-type-weak="草|钢"]').count(),2);
  assert.equal(await cards.last().locator('[data-type-weak="草|钢"]').count(),2);
  assert.equal(await cards.first().locator('[data-ability="茂盛"]').count(),1);
  assert.equal(await cards.first().locator('[data-move="撞击"]').count(),1);
  for(const action of ['click','Enter',' ']){
   const chip=cards.nth(action==='click'?0:1).locator('[data-type-weak]').first();
   if(action==='click')await chip.click();else{await chip.focus();await page.keyboard.press(action===' '?'Space':action);}
   const popup=page.locator('.pkm-hud-sub.open');await popup.waitFor();
   assert((await popup.locator('.modal-name').innerText()).includes('草 / 钢'));
   assert((await popup.locator('.modal-body').innerText()).includes('4× 克制'));
   assert((await popup.locator('.modal-body>div').filter({hasText:'0× 无效'}).innerText()).includes('毒'));
   await popup.locator('[data-sub-close]').click();assert.equal(await cards.count(),2);
  }
  await page.locator('.tab-btn[data-tab="1"]').click();
 }
 if(/function mapImgErr\(/.test(raw)){
  const fallback=await page.evaluate(()=>__UPSTREAM_TEST.imageFallback());
  assert(fallback.first.startsWith('https://cdn.jsdelivr.net/gh/'));assert(fallback.fallback);assert.equal(fallback.hidden,'none');
  await page.evaluate(()=>__UPSTREAM_TEST.open('map'));
  const unova=page.locator('.page-overlay.open [data-map]').filter({hasText:'合众'});assert.equal(await unova.count(),1);await unova.click();
  assert((await page.locator('.page-overlay.open .map-img').first().getAttribute('data-src')).includes('合众'));
  await closePage();
 }
 for(const key of ['bag','box','badge','breeding','pokedex','settings','map','typechart']){await page.evaluate(key=>__UPSTREAM_TEST.open(key),key);await page.locator('.page-overlay.open .page').waitFor();await closePage();}
 const adapted=await page.evaluate(()=>__UPSTREAM_TEST.adaptation());assert(adapted.type.includes('class=\"type-ic\"'));assert(adapted.detail.includes('class=\"type-ic\"'));assert(adapted.move.includes('class=\"type-ic\"'));assert.equal(adapted.width,true);
 await page.evaluate(()=>__UPSTREAM_TEST.open('settings'));await page.locator('.page-overlay.open [data-width-open]').click();await page.locator('#hud-width-range').waitFor();await page.locator('[data-width-preset=\"800\"]').click();await page.locator('[data-width-apply]').click();assert.equal(await page.locator('.hud').evaluate(el=>el.style.maxWidth),'800px');await closePage();
 if(/function resolveBagItemClick\(/.test(raw)){
  await page.evaluate(()=>{__UPSTREAM_TEST.newFeatures();__UPSTREAM_TEST.open('bag');});
  const row=name=>page.locator('.page-overlay.open .item-entry').filter({has:page.locator('.item-name',{hasText:name})});
  for(const name of ['谜之道具','自创图片']){
   assert(await row(name).evaluate(el=>el.classList.contains('item-no-click')));
   await row(name).locator('.item-name').click();assert.equal(await page.locator('.overlay.open').count(),0);
   await row(name).locator('.item-icon-wrap').click();assert.equal(await page.locator('.overlay.open').count(),0);
   assert.equal(await row(name).locator('[data-bag-discard]').count(),/var bagDiscardMode/.test(raw)?0:1);
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
 }
 if(!/function pkmRepoOrder\(/.test(raw)&&/PKM_REPO_MIRROR/.test(raw)){const repo=await page.evaluate(()=>__UPSTREAM_TEST.repo());assert(repo.url.startsWith('https://raw.githubusercontent.com/'));assert(repo.icon.includes('阿尔宙斯手机'));assert(repo.url.includes('/Pokemon/main/types.json'));assert(repo.icon.includes('/UI/ui/阿尔宙斯手机.png'));await page.evaluate(()=>__UPSTREAM_TEST.open('settings'));assert.equal(await page.locator('[data-repo-fixed]').count(),1);await closePage();}
 if(/function relSettingsUpload\(/.test(raw)){
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
 assert.deepEqual(errors,[]);assert.equal(await page.evaluate(()=>previewWrites),writesAfterAura);await page.close();results.push({channel:target,core:version,businessFunctionsPreserved:independent?0:business.length,pages:10,errors});
}
fs.mkdirSync(path.join(root,'artifacts'),{recursive:true});fs.writeFileSync(path.join(root,'artifacts/upstream-browser-validation.json'),JSON.stringify({passed:true,results},null,2));console.log(JSON.stringify({passed:true,results}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
