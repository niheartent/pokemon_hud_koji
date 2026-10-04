/* A core can change CSS wholesale without changing either owned presentation. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),acorn=require('acorn');
const {chromium,launchOptions}=require('../src/swsh/browser-runtime.cjs');
const root=path.join(__dirname,'..'),raw=fs.readFileSync(path.join(root,'src/bw2/upstream-update-fixture.js'),'utf8');
function packageOf(code){let pkg;function visit(n){if(!n||!n.type)return;if(n.type==='VariableDeclarator'&&n.id.name==='PK_BEAUTY_PACKAGE')pkg=JSON.parse(code.slice(n.init.start,n.init.end));for(const value of Object.values(n))if(Array.isArray(value))value.forEach(visit);else if(value&&value.type)visit(value);}visit(acorn.parse(code,{ecmaVersion:'latest'}));return pkg;}
function recolor(source){const ast=acorn.parse(source,{ecmaVersion:'latest'}),run=ast.body[0].expression.callee.body.body.find(n=>n.type==='FunctionDeclaration'&&n.id.name==='runPkmHud'),edits=[];for(const s of run.body.body){if(s.type==='VariableDeclaration'){const d=s.declarations.find(d=>d.id.name==='css');if(d)edits.push({start:d.init.start,end:d.init.end,text:JSON.stringify('#pkm-hud-inline{--text:#ffff00;--frame:#ff00ff;font-family:Comic Sans MS;font-size:40px}.hud,.trainer-frame,.nb-cell{background:#ff00ff!important;color:#00ff00!important;font-family:Comic Sans MS!important}')} );}const e=s.expression;if(s.type==='ExpressionStatement'&&e?.type==='AssignmentExpression'&&e.left.name==='css'&&e.operator==='+=')edits.push({start:s.start,end:s.end,text:'css += ".page,.modal,.bt-card,.set-opt{background:lime!important;color:magenta!important;font-family:Comic Sans MS!important}";'});}assert(edits.length>=2);edits.sort((a,b)=>b.start-a.start);for(const edit of edits)source=source.slice(0,edit.start)+edit.text+source.slice(edit.end);return source;}
function removeUpstreamPresentation(source){
 const owned=acorn.parse(fs.readFileSync(path.join(root,'src/shared/presentation.js'),'utf8'),{ecmaVersion:'latest'}).body.map(n=>n.id.name);
 const run=acorn.parse(source,{ecmaVersion:'latest'}).body[0].expression.callee.body.body.find(n=>n.id?.name==='runPkmHud'),edits=[];
 function containsStyle(n){if(!n?.type||/^(Function|ArrowFunction)/.test(n.type))return false;const e=n.type==='AssignmentExpression'?n:null;if(e&&(e.left.name==='css'||e.left.property?.name==='textContent'&&e.right.name==='css'))return true;return Object.values(n).some(v=>Array.isArray(v)?v.some(containsStyle):v?.type&&containsStyle(v));}
 for(const n of run.body.body){if(n.type==='FunctionDeclaration'&&owned.includes(n.id.name)||n.type==='VariableDeclaration'&&n.declarations.some(d=>d.id.name==='css')||containsStyle(n))edits.push({start:n.start,end:n.end});}
 edits.sort((a,b)=>b.start-a.start);for(const e of edits)source=source.slice(0,e.start)+source.slice(e.end);return source;
}
const sources=[raw,require('../src/shared/upstream-core.cjs')()];
(async()=>{const browser=await chromium.launch({headless:true,...launchOptions}),results=[],errors=[];
try{for(const raw of sources){const changed=recolor(raw);for(const channel of ['bw2','swsh']){
 const dir=path.join(root,'src',channel),folder=channel==='bw2'?path.join(dir,'HUD黑白2版-第一版'):path.join(dir,'HUD美化版-交付');
 const code=fs.readFileSync(path.join(folder,channel==='bw2'?'宝可梦HUD-黑白2版.js':'宝可梦HUD-剑盾风格.js'),'utf8'),pkg=packageOf(code),scope={PK_BEAUTY_PACKAGE:pkg};
 assert.equal(pkg.styleOwnership,channel);vm.createContext(scope);vm.runInContext(pkg.runtime,scope);
 const template=fs.readFileSync(path.join(folder,channel==='bw2'?'第一版预览.html':'剑盾版预览.html'),'utf8');
 const snapshots=[];
 for(const source of [raw,changed,removeUpstreamPresentation(raw)]){
  let candidate=scope.pkBeautyBuildRemote(source);const boot=candidate.lastIndexOf('try{ensureHud();}catch(e){}');assert(boot>=0);candidate=candidate.slice(0,boot)+'window.__OWNED_PAGE=openPage;'+candidate.slice(boot);
  const start=template.lastIndexOf('<script>'),end=template.lastIndexOf('</script>'),html=template.slice(0,start+8)+candidate.replaceAll('</script','<\\/script')+template.slice(end);
  const page=await browser.newPage({viewport:{width:1000,height:1100}});page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{localStorage.setItem('pk_theme_hue','#ff00ff');localStorage.setItem('pk_theme_light','100');localStorage.setItem('pk_swsh_dark_theme','1');});
  await page.route('**/*',r=>r.request().url().startsWith('http://isolation.test')?r.fulfill({contentType:'text/html',body:html}):r.request().resourceType()==='image'?r.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg"/>'}):r.fulfill({contentType:'application/json',body:'{"data":[]}'}));
  await page.goto('http://isolation.test');await page.locator(channel==='bw2'?'.bw2-console':'.swsh-trainer').waitFor().catch(e=>{throw Error(channel+' '+raw.match(/var PK_VER='([^']+)'/)[1]+' variant '+snapshots.length+': '+JSON.stringify(errors)+' '+e.message);});
  snapshots.push(await page.evaluate(()=>{const app=document.getElementById('pkm-hud-inline');return {styles:Array.from(document.querySelectorAll('style')).filter(s=>s.textContent.includes('pkm-hud-inline')).map(s=>s.textContent),computed:['#pkm-hud-inline','.hud','.card-frame','.pk-name','.info-title','.tab-btn'].map(selector=>{const el=app.matches(selector)?app:app.querySelector(selector);if(!el)throw Error('missing '+selector);const s=getComputedStyle(el);return {selector,font:s.fontFamily,size:s.fontSize,color:s.color,background:s.backgroundImage,fill:s.backgroundColor,border:s.borderColor};}),theme:app.classList.contains('swsh-dark'),inlineText:app.style.getPropertyValue('--text')};}));
  if(source!==raw&&source!==changed){
   await page.locator('.card-frame[data-slot]').first().click();await page.locator(channel==='bw2'?'.bw2-detail':'.detail-modal').waitFor();await page.locator((channel==='bw2'?'.bw2-detail':'.detail-modal')+' [data-close]').click();
   for(const key of ['bag','box','badge','breeding','pokedex','settings','map','typechart']){await page.evaluate(key=>__OWNED_PAGE(key),key);await page.locator('.page-overlay.open .page').waitFor();await page.locator('.page-overlay.open [data-page-close]').click();}
   assert.equal(await page.locator('style[data-koji-owner="presentation"]').count(),1);
  }
  await page.close();
 }
 assert.deepEqual(snapshots[1],snapshots[0],channel+' must reject upstream visual changes');
 assert.deepEqual(snapshots[2],snapshots[0],channel+' must boot without upstream templates or CSS');
 assert(!snapshots[1].styles.join('').includes('Comic Sans MS'));
 results.push({channel,core:raw.match(/var PK_VER='([^']+)'/)[1],upstreamCssReplaced:true,computedTypographyAndColorsUnchanged:true,stylesExactlyEqual:true,upstreamTemplatesAndCssRemoved:true});
}}assert.deepEqual(errors,[]);fs.mkdirSync(path.join(root,'artifacts'),{recursive:true});fs.writeFileSync(path.join(root,'artifacts/style-isolation-tests.json'),JSON.stringify({passed:true,results,errors},null,2));console.log(JSON.stringify({passed:true,results}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
