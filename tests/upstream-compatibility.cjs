/* Pinned/candidate core: semantic guards, native behavior preservation and real boot. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),acorn=require('acorn');
const {chromium,launchOptions}=require('../src/swsh/browser-runtime.cjs');
const root=path.join(__dirname,'..'),raw=process.env.UPSTREAM_CANDIDATE?fs.readFileSync(path.resolve(process.env.UPSTREAM_CANDIDATE),'utf8'):require('../src/shared/upstream-core.cjs')();
const version=raw.match(/var PK_VER='([^']+)'/)[1];
function functions(code){const map={};walk(acorn.parse(code,{ecmaVersion:'latest'}),n=>{if(n.type==='FunctionDeclaration')map[n.id.name]=code.slice(n.start,n.end);});return map;}
function walk(n,f){if(!n||!n.type)return;f(n);for(const v of Object.values(n))if(Array.isArray(v))v.forEach(x=>walk(x,f));else if(v&&v.type)walk(v,f);}
const business=['ensureSpriteMap','spriteMapBase','slugCandidates','resolvePkmIconRepo','resolvePkmBgRepo','candsFor','pkmSrcSlugs','bindPkmSlider','pkmScheduleRender','updatePkmStats','updatePkmStatsNow','diagInfo'];
(async()=>{const browser=await chromium.launch({headless:true,...launchOptions}),results=[];
try{for(const channel of ['bw2','swsh']){
 const ui=require(path.join(root,'src',channel,'package.json')).version;
 const folder=channel==='bw2'?path.join(root,'src/bw2','黑白2双版本-v'+ui,'完整版'):path.join(root,'src/swsh/HUD美化版-交付');
 const local=fs.readFileSync(path.join(folder,channel==='bw2'?'宝可梦HUD-完整版.js':'宝可梦HUD-剑盾风格.js'),'utf8');let pkg;
 walk(acorn.parse(local,{ecmaVersion:'latest'}),n=>{if(n.type==='VariableDeclarator'&&n.id.name==='PK_BEAUTY_PACKAGE')pkg=JSON.parse(local.slice(n.init.start,n.init.end));});
 const scope={PK_BEAUTY_PACKAGE:pkg};vm.createContext(scope);vm.runInContext(pkg.runtime,scope);
 const code=scope.pkBeautyBuildRemote(raw),before=functions(raw),after=functions(code);
 for(const name of business){assert(before[name],'missing latest business interface '+name);assert.equal(after[name],before[name],channel+' changed native '+name);}
 if(channel==='swsh'){
  assert.doesNotThrow(()=>scope.pkBeautyBuildRemote(raw.replace('st.textContent=css;','try{if(true){st.textContent=css;}}catch(e){}')));
  assert.doesNotThrow(()=>scope.pkBeautyBuildRemote(raw.replace('st.textContent=css;',"function unusedShadow(){var css='shadow';var st={};st.textContent=css;}st.textContent=css;")));
  assert.doesNotThrow(()=>scope.pkBeautyBuildRemote(raw.replace('st.textContent=css;','st.textContent=css;st.textContent=css;')));
 }
 const template=fs.readFileSync(path.join(folder,channel==='bw2'?'预览与测试.html':'剑盾版预览.html'),'utf8');
 const bridge="window.__UPSTREAM_TEST={core:PK_VER,open:openPage};loadDexList=function(region,cb){cb(Array.from({length:12},function(_,i){return {id:String(i+1),ndex:String(i+1),name:'测试精灵'+i};}));};";
 const start=template.lastIndexOf('<script>'),end=template.lastIndexOf('</script>'),boot=code.lastIndexOf('try{ensureHud();}catch(e){}'),script=code.slice(0,boot)+bridge+code.slice(boot);
 const html=template.slice(0,start+8)+script.replaceAll('</script','<\\/script')+template.slice(end),page=await browser.newPage({viewport:{width:1000,height:1400}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>r.fulfill({contentType:r.request().url().startsWith('http://candidate.test')?'text/html':r.request().resourceType()==='image'?'image/svg+xml':'application/json',body:r.request().url().startsWith('http://candidate.test')?html:r.request().resourceType()==='image'?'<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60"/>':'{"data":[]}'}));
 await page.goto('http://candidate.test/'+channel);await page.locator(channel==='bw2'?'.bw2-console':'.swsh-team').waitFor();assert.equal(await page.evaluate(()=>__UPSTREAM_TEST.core),version);
 await page.locator('.card-frame[data-slot]').first().click();await page.locator(channel==='bw2'?'.bw2-detail':'.detail-modal').waitFor();await page.locator((channel==='bw2'?'.bw2-detail':'.detail-modal')+' [data-close]').click();
 for(const key of ['bag','box','badge','breeding','pokedex','settings','map','typechart']){await page.evaluate(key=>__UPSTREAM_TEST.open(key),key);await page.locator('.page-overlay.open .page').waitFor();await page.locator('.page-overlay.open [data-page-close]').click();}
 if(/function pkmRepoOrder\(/.test(raw)){
  await page.evaluate(()=>__UPSTREAM_TEST.open('settings'));
  assert.equal(await page.locator('input[data-repo-order]').count(),2);
  await page.locator('input[data-repo-order="jsdelivr"]').check();
  assert.equal(await page.evaluate(()=>localStorage.getItem('pk_repo_order')),'jsdelivr');
  await page.locator('input[data-repo-order="raw"]').check();
  assert.equal(await page.evaluate(()=>localStorage.getItem('pk_repo_order')),'raw');
  await page.locator('.page-overlay.open [data-page-close]').click();
 }
 assert.deepEqual(errors,[]);assert.equal(await page.evaluate(()=>previewWrites),0);await page.close();results.push({channel,core:version,businessFunctionsPreserved:business.length,pages:10,errors});
}
fs.mkdirSync(path.join(root,'artifacts'),{recursive:true});fs.writeFileSync(path.join(root,'artifacts/upstream-browser-validation.json'),JSON.stringify({passed:true,results},null,2));console.log(JSON.stringify({passed:true,results}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
