/* Browser layout regression: idle lists must not snap away from their padding. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium,launchOptions}=require('./browser-runtime.cjs');
const html=fs.readFileSync(path.join(__dirname,'HUD美化版-交付/剑盾版预览.html'),'utf8');
(async()=>{const browser=await chromium.launch({headless:true,...launchOptions});const results=[];
try{for(const width of [430,900]){const page=await browser.newPage({viewport:{width,height:1200}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.route('**/*',r=>r.fulfill({contentType:r.request().url().startsWith('http://localhost:3208')?'text/html':r.request().resourceType()==='image'?'image/svg+xml':'application/json',body:r.request().url().startsWith('http://localhost:3208')?html:r.request().resourceType()==='image'?'<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60"/>':'{"data":[]}'}));
await page.goto('http://localhost:3208');const grid=page.locator('.nb-grid').first();await grid.waitFor();
for(const dark of [false,true]){
await page.locator('#pkm-hud-inline').evaluate((el,dark)=>el.classList.toggle('swsh-dark',dark),dark);
await grid.evaluate(el=>{el.scrollLeft=0;});await page.waitForTimeout(400);
const initial=await grid.evaluate(el=>({left:el.scrollLeft,max:el.scrollWidth-el.clientWidth,snap:getComputedStyle(el).scrollSnapType}));
assert.equal(initial.left,0,'idle list moved right');assert.equal(initial.snap,'none');assert(initial.max>0,'fixture must overflow');
const manual=Math.min(initial.max,30);await grid.evaluate((el,left)=>{el.scrollLeft=left;},manual);await page.waitForTimeout(400);
assert.equal(await grid.evaluate(el=>el.scrollLeft),manual,'manual scroll must remain');
await page.setViewportSize({width:width-20,height:1200});await grid.evaluate(el=>{el.scrollLeft=0;});await page.waitForTimeout(400);
assert.equal(await grid.evaluate(el=>el.scrollLeft),0,'resize moved idle list');
await page.setViewportSize({width,height:1200});results.push({width,dark,initial:0,manual});}
assert.deepEqual(errors,[]);await page.close();}
console.log(JSON.stringify({passed:true,results}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
