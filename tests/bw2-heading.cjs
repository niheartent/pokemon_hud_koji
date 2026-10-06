const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium,launchOptions}=require('../src/bw2/browser-runtime.cjs');
const version=require('../src/bw2/package.json').version;
(async()=>{const browser=await chromium.launch({headless:true,...launchOptions}),results=[];
try{for(const variant of ['完整版','独立版'])for(const width of [360,950]){
const html=fs.readFileSync(path.join(__dirname,'../src/bw2','黑白2双版本-v'+version,variant,'预览与测试.html'),'utf8');
const page=await browser.newPage({viewport:{width,height:1300}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route('**/*',r=>r.fulfill({contentType:r.request().url().startsWith('http://heading.test')?'text/html':r.request().resourceType()==='image'?'image/svg+xml':'application/json',body:r.request().url().startsWith('http://heading.test')?html:r.request().resourceType()==='image'?'<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1100"/>':'{"data":[]}'}));
await page.goto('http://heading.test');await page.locator('.bw2-console').waitFor();await page.locator('.tab-btn[data-tab="2"]').click();
function style(el){const h=getComputedStyle(el),t=getComputedStyle(el.querySelector('strong'));return {height:Math.round(parseFloat(h.height)),padding:h.padding,backgroundColor:h.backgroundColor,backgroundImage:h.backgroundImage,borderColor:h.borderBottomColor,borderStyle:h.borderBottomStyle,color:t.color,fontFamily:t.fontFamily,fontSize:t.fontSize,fontWeight:t.fontWeight,letterSpacing:t.letterSpacing,lineHeight:t.lineHeight};}
const reference=await page.locator('.bw2-display-caption').evaluate(style);assert(reference.backgroundImage!=='none');
await page.locator('.tab-btn[data-tab="4"]').click();
for(const key of ['bag','box','breeding','badge','pokedex','settings','typechart','map']){
await page.locator('.bw2-menu-button[data-page="'+key+'"]').click();await page.locator('.page-overlay.open').waitFor();const header=page.locator('.page-overlay.open .page-head');assert.deepEqual(await header.evaluate(style),reference,variant+' '+width+' '+key);
assert.equal(await header.locator('.bw2-page-title').innerText(),{bag:'背包',box:'盒子',breeding:'繁育',badge:'徽章盒',pokedex:'图鉴',settings:'设置',typechart:'克制表',map:'地图'}[key]);
if(width===950&&variant==='完整版'&&key==='bag'){fs.mkdirSync('artifacts',{recursive:true});await header.screenshot({path:'artifacts/bw2-heading-bag.png'});}
if(['bag','box','breeding','badge'].includes(key))await page.locator('.bw2-page-close-button[data-page="'+key+'"]').click();else await page.locator('.page-overlay.open [data-page-close]').click();
}
assert.deepEqual(errors,[]);results.push({variant,width,matchedPages:8});await page.close();
}console.log(JSON.stringify({passed:true,results}));}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
