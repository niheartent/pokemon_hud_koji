/* Real renderers and composed upstream: detect light/dark color regressions. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm'),acorn=require('acorn');
const {chromium,launchOptions}=require('./browser-runtime.cjs');
const out=path.join(__dirname,'HUD美化版-交付');
const template=fs.readFileSync(path.join(out,'剑盾版预览.html'),'utf8');
const local=fs.readFileSync(path.join(out,'宝可梦HUD-剑盾风格.js'),'utf8');
let pkg;
function visit(n){if(!n||!n.type)return;if(n.type==='VariableDeclarator'&&n.id.name==='PK_BEAUTY_PACKAGE')pkg=JSON.parse(local.slice(n.init.start,n.init.end));for(const value of Object.values(n)){if(Array.isArray(value))value.forEach(visit);else if(value&&value.type)visit(value);}}
visit(acorn.parse(local,{ecmaVersion:'latest'}));
const scope={PK_BEAUTY_PACKAGE:pkg};vm.createContext(scope);vm.runInContext(pkg.runtime,scope);
const updated=scope.pkBeautyBuildRemote(fs.readFileSync(path.join(__dirname,'../bw2/upstream-update-fixture.js'),'utf8'));
const fixture={人际关系:{小霞:65,小刚:42},战场:{规则:'野生霸主狂暴战｜胜负:击倒或收服',场景:'第1回合｜暴雨:水×1.5 火×0.5',场上:{'伯劳·钢铠鸦(我方)':'Lv.72 251/251｜攻181 防190 特攻82 特防143 速130｜特性:镜甲｜招式:勇鸟猛攻/急速折返｜阶级:攻+1 防-1','红色暴鲤龙(敌方)':'Lv.74 496/496｜特性:威吓｜招式:攀瀑/龙之舞｜阶级:防+1｜状态:霸主狂暴'},各方:{红色暴鲤龙:'战术:狂暴攻击｜后备0'}}};
const bridge='window.__COLOR_TEST={theme:function(value){swshDarkTheme=value;swshApplyTheme(document.getElementById("pkm-hud-inline"));},refresh:pkRefreshData};';
function htmlFor(code){code=code.replace('try{pkReadUpdateCache();}catch(e){}',bridge+'\ntry{pkReadUpdateCache();}catch(e){}');const start=template.lastIndexOf('<script>'),end=template.lastIndexOf('</script>');return template.slice(0,start+8)+'Object.assign(previewState,'+JSON.stringify(fixture)+');'+code.replaceAll('</script','<\\/script')+template.slice(end);}
function rgb(s){const nums=s.match(/[\d.]+/g).map(Number);return nums.slice(0,3).map(v=>v/255);}
function luminance(c){return rgb(c).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);}
function contrast(a,b){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
(async()=>{const browser=await chromium.launch({headless:true,...launchOptions}),results=[],errors=[];
try{
for(const [core,code] of [['bundled',local],['3.3.19',updated]])for(const width of [1000,360]){
 const context=await browser.newContext({viewport:{width,height:1100}}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{localStorage.setItem('pk_theme_hue','#ffee00');localStorage.setItem('pk_theme_light','100');});
 await page.route('**/*',r=>r.request().url().startsWith('http://colors.test')?r.fulfill({contentType:'text/html',body:htmlFor(code)}):r.request().resourceType()==='image'?r.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60"><circle cx="30" cy="30" r="20" fill="#60abd0"/></svg>'}):r.fulfill({contentType:'application/json',body:'{"data":[]}'}));
 await page.goto('http://colors.test');await page.locator('.swsh-trainer').waitFor();
 assert.equal(await page.locator('#pkm-hud-inline').evaluate(el=>el.style.getPropertyValue('--pk-bg')),'','old saved color engine must not inject inline colors');
 assert(await page.locator('#pkm-hud-inline').evaluate(el=>el.classList.contains('swsh-dark')),'new install defaults to dark');
 await page.locator('.swsh-trainer-details summary').click();
 for(const dark of [false,true]){
  await page.evaluate(value=>__COLOR_TEST.theme(value),dark);await page.mouse.move(width-1,1099);
  const surfaces=await page.evaluate(()=>{const root=document.getElementById('pkm-hud-inline'),probe=document.createElement('span');root.appendChild(probe);return [['.swsh-trainer','--swsh-surface'],['.swsh-trainer-details summary','--swsh-surface-soft'],['.fold-box','--swsh-surface'],['.fold-head','--swsh-surface-soft']].map(([selector,token])=>{probe.style.backgroundColor='var('+token+')';return {selector,actual:getComputedStyle(document.querySelector(selector)).backgroundColor,expected:getComputedStyle(probe).backgroundColor};}).map(row=>{probe.remove();return row;});});
  for(const surface of surfaces)assert.equal(surface.actual,surface.expected,'native must not overwrite '+surface.selector);
  const foldShadows=await page.locator('.fold-head').evaluateAll(heads=>heads.map(el=>getComputedStyle(el).boxShadow));
  for(const shadow of foldShadows)assert(shadow.includes(dark?'rgb(143, 185, 217)':'rgb(184, 46, 70)'),dark?'dark fold accent must be blue':'day fold accent must stay red');
  const gradient=await page.locator('.nb-cell').first().evaluate(el=>{const probe=document.createElement('span');probe.style.backgroundImage='linear-gradient(160deg,var(--swsh-nearby-top),var(--swsh-nearby-bottom))';el.appendChild(probe);const result={actual:getComputedStyle(el).backgroundImage,expected:getComputedStyle(probe).backgroundImage};probe.remove();return result;});assert.equal(gradient.actual,gradient.expected,'native must not overwrite nearby background');
  for(const key of ['bagfold','relfold']){const head=page.locator('[data-fold="'+key+'"]');if(await head.count()&&!await head.locator('..').locator('.fold-body').count())await head.click();}
  const scan=async(selectors,background)=>page.evaluate(({selectors,background})=>selectors.map(selector=>{const el=document.querySelector(selector);if(!el)throw Error('missing '+selector);const root=document.getElementById('pkm-hud-inline'),probe=document.createElement('span');probe.style.color='var('+background+')';root.appendChild(probe);const bg=getComputedStyle(probe).color;probe.remove();return {selector,fg:getComputedStyle(el).color,bg};}),{selectors,background});
  const checks=await scan(['.swsh-trainer-id strong','.swsh-money','.swsh-badges .k','.badge-region','.swsh-trainer-details-body .k','.swsh-trainer-details-body .v','.rel-name','.rel-val'],'--swsh-surface');
  checks.push(...await scan(['.swsh-trainer-details summary','.swsh-trainer-details summary span','.fold-head'],'--swsh-surface-soft'));
  for(const background of ['--swsh-nearby-top','--swsh-nearby-bottom'])checks.push(...await scan(['.nb-name','.nb-cnt'],background));
  await page.locator('[data-tab="3"]').click();await page.locator('.bt-card').first().waitFor();
  const battleSurfaces=await page.evaluate(()=>Array.from(document.querySelectorAll('.battle-frame,.bt-card,.bt-side')).map(el=>{const probe=document.createElement('span');probe.style.backgroundColor='var(--swsh-surface)';el.appendChild(probe);const result={actual:getComputedStyle(el).backgroundColor,expected:getComputedStyle(probe).backgroundColor};probe.remove();return result;}));
  for(const surface of battleSurfaces)assert.equal(surface.actual,surface.expected,'native must not overwrite battle surface');
  checks.push(...await scan(['.bt-pk','.bt-lv','.bt-tr','.bt-hpn','.bt-line','.bt-k','.bt-line .abi-link','.st-up','.st-dn','.bt-side-h','.bt-side-b'],'--swsh-surface'));
  checks.push(...await scan(['.bt-scene'],'--swsh-scene'),...await scan(['.bt-rule','.bt-tactic'],'--swsh-warning'));
  for(const check of checks){check.ratio=contrast(check.fg,check.bg);assert(check.ratio>=4.5,`${core} ${width} ${dark?'dark':'light'} ${check.selector}: ${check.ratio.toFixed(2)} (${check.fg}/${check.bg})`);}
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal overflow');
  const theme=dark?'dark':'light';await page.locator('.hud').screenshot({path:path.join(out,`颜色-${core}-${width}-${theme}-战场.png`)});
  await page.locator('[data-tab="1"]').click();await page.locator('#tab-1').evaluate(el=>el.scrollTop=0);await page.locator('.hud').screenshot({path:path.join(out,`颜色-${core}-${width}-${theme}-主页.png`)});
  if(!dark){
   await page.locator('.swsh-party-list>.card-frame').first().click();await page.locator('.detail-modal').waitFor();
   const detailChecks=await scan(['.detail-modal .dt-name','.detail-modal .dt-hold','.detail-modal .dt-lv','.detail-modal .row .k','.detail-modal .row .v'],'--swsh-detail-bg');
   detailChecks.push(...await scan(['.detail-modal .move-name'],'--swsh-detail-move'));
   for(const check of detailChecks){check.ratio=contrast(check.fg,check.bg);assert(check.ratio>=4.5,`detail ${core} ${width} ${check.selector}: ${check.ratio}`);}
   checks.push(...detailChecks);
   await page.locator('.detail-modal').screenshot({path:path.join(out,`颜色-${core}-${width}-light-详情.png`)});
   await page.locator('.detail-modal [data-close]').click();
  }
  results.push({core,width,theme,minContrast:Math.min(...checks.map(x=>x.ratio)),checks});
 }
 // Use the actual settings handler to persist day mode, then reload.
 await page.locator('[data-tab="4"]').click();await page.locator('#tab-4 [data-page="settings"]').click();
 assert.equal(await page.locator('.swsh-settings input[type="color"],.swsh-settings [data-theme-preset],.swsh-settings [data-theme-light],.swsh-settings [data-theme-color-reset],.swsh-settings [data-text-color]').count(),0,'obsolete native color controls must be absent');
 assert.equal(await page.locator('.swsh-settings .set-title').filter({hasText:/^(主题颜色|文字颜色|文本颜色|字体颜色)$/}).count(),0);
 assert.equal(await page.locator('[data-toggle="swsh-dark"]').count(),1);
 for(const dark of [false,true]){
  await page.locator('[data-toggle="swsh-dark"]').setChecked(dark);await page.mouse.move(width-1,1099);
  const settingsChecks=await page.evaluate(()=>{const root=document.getElementById('pkm-hud-inline'),probe=document.createElement('span');probe.style.color='var(--swsh-surface)';root.appendChild(probe);const bg=getComputedStyle(probe).color;probe.remove();return Array.from(document.querySelectorAll('.swsh-settings .set-title,.swsh-settings .set-opt,.swsh-settings .dim')).filter(el=>el.getClientRects().length&&el.textContent.trim()).map(el=>({fg:getComputedStyle(el).color,bg}));});
  for(const check of settingsChecks)assert(contrast(check.fg,check.bg)>=4.5,'settings text must contrast with its surface');
  await page.locator('.page-overlay.open').evaluate(el=>{const body=el.querySelector('.page-body');if(body)body.scrollTop=0;});
  await page.locator('.page-overlay.open .page').screenshot({path:path.join(out,`颜色-${core}-${width}-${dark?'dark':'light'}-设置.png`)});
 }
 await page.locator('[data-toggle="swsh-dark"]').uncheck();
 assert.equal(await page.evaluate(()=>localStorage.getItem('pk_swsh_dark_theme')),'0');await page.reload();await page.locator('.swsh-trainer').waitFor();assert(!(await page.locator('#pkm-hud-inline').evaluate(el=>el.classList.contains('swsh-dark'))),'saved day survives reload');
 assert.equal(await page.evaluate(()=>previewWrites),0);await context.close();
}
assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'颜色验证.json'),JSON.stringify({passed:true,defaultDark:true,savedDayPreserved:true,results,errors},null,2));console.log(JSON.stringify({passed:true,cases:results.length,minContrast:Math.min(...results.map(r=>r.minContrast)),defaultDark:true,savedDayPreserved:true}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
