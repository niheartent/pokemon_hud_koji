const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium,launchOptions}=require('../src/bw2/browser-runtime.cjs');
const version=require('../src/bw2/package.json').version;
(async()=>{const browser=await chromium.launch({headless:true,...launchOptions});const results=[];
try{for(const variant of ['完整版','独立版'])for(const width of [360,950]){
let html=fs.readFileSync(path.join(__dirname,'../src/bw2','黑白2双版本-v'+version,variant,'预览与测试.html'),'utf8');
html=html.replace('window.__BW2_TEST={','window.__TOGGLE={refresh:function(){bw2RefreshPanels();bw2RequestLayout();}};window.__BW2_TEST={');
const page=await browser.newPage({viewport:{width,height:1300}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route('**/*',r=>r.fulfill({contentType:r.request().url().startsWith('http://localhost:3248')?'text/html':r.request().resourceType()==='image'?'image/svg+xml':'application/json',body:r.request().url().startsWith('http://localhost:3248')?html:r.request().resourceType()==='image'?'<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60"/>':'{"data":[]}'}));
await page.goto('http://localhost:3248');await page.locator('.bw2-console').waitFor();await page.locator('.tab-btn[data-tab="4"]').click();
for(const key of ['bag','box','breeding','badge']){
const button=page.locator('.bw2-menu-button[data-page="'+key+'"]');
const before=await button.evaluate(el=>({label:el.querySelector('.menu-label').textContent,icon:el.querySelector('.bw2-menu-icon').innerHTML,bg:getComputedStyle(el).backgroundImage}));
await button.click();await page.locator('.page-overlay.open').waitFor();
assert.equal(await page.locator('.page-overlay.open [data-page-close]').count(),0);
assert.equal(await button.getAttribute('aria-expanded'),'true');assert.equal(await button.locator('.menu-label').innerText(),'关闭'+before.label);
assert.notEqual(await button.locator('.bw2-menu-icon').innerHTML(),before.icon);assert.notEqual(await button.evaluate(el=>getComputedStyle(el).backgroundImage),before.bg);
await page.evaluate(()=>__TOGGLE.refresh());assert.equal(await button.getAttribute('aria-expanded'),'true');
await button.locator('.bw2-menu-icon').click();assert.equal(await page.locator('.page-overlay.open').count(),0);
assert.equal(await button.getAttribute('aria-expanded'),'false');assert.equal(await button.locator('.menu-label').innerText(),before.label);assert.equal(await button.locator('.bw2-menu-icon').innerHTML(),before.icon);
}
await page.locator('[data-page="bag"]').click();await page.locator('[data-page="box"]').click();assert.equal(await page.locator('.bw2-page-close-button').count(),1);assert.equal(await page.locator('.bw2-page-close-button').getAttribute('data-page'),'box');
await page.locator('.tab-btn[data-tab="1"]').click();assert.equal(await page.locator('.page-overlay.open').count(),0);assert.equal(await page.locator('.bw2-page-close-button').count(),0);
assert.deepEqual(errors,[]);assert.equal(await page.evaluate(()=>previewWrites),0);results.push({variant,width,pages:4,refresh:true,switch:true});await page.close();
}console.log(JSON.stringify({passed:true,results}));}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
