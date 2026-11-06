const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium,launchOptions}=require('./browser-runtime.cjs');
const version=require('./package.json').version;
const html=fs.readFileSync(path.join(__dirname,'黑白2双版本-v'+version,'完整版','预览与测试.html'),'utf8');

function closeTo(actual,expected,label){assert.ok(Math.abs(actual-expected)<1.5,label+': '+actual+' vs '+expected);}

(async()=>{
 const browser=await chromium.launch({headless:true,...launchOptions}),page=await browser.newPage({viewport:{width:950,height:1350}}),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.route('**/*',route=>{
  const request=route.request(),url=request.url();
  if(url.startsWith('http://bw2-dex.test/'))return route.fulfill({contentType:'text/html',body:html});
  if(request.resourceType()==='image')return route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60"/>'});
  return route.fulfill({contentType:'application/json',body:'{"data":[]}'});
 });
 try{
  await page.goto('http://bw2-dex.test/');
  await page.locator('.bw2-console').waitFor();
  await page.locator('.tab-btn[data-tab="1"]').click();
  await page.locator('.card-frame').first().click();
  await page.locator('.bw2-detail').waitFor();
  const shellBefore=await page.locator('.bw2-console').evaluate(node=>{const r=node.getBoundingClientRect();return [r.left,r.top,r.width,r.height];});
  await page.locator('[data-bw2-info]').click();
  await page.locator('.bw2-dex-overlay.open .modal').waitFor();
  const geometry=await page.evaluate(()=>{
   const root=document.querySelector('.bw2-console'),overlay=root.querySelector('.bw2-dex-overlay'),modal=overlay.querySelector('.modal');
   const rect=node=>{const r=node.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
   return {root:rect(root),overlay:rect(overlay),modal:rect(modal),shell:[root.getBoundingClientRect().left,root.getBoundingClientRect().top,root.getBoundingClientRect().width,root.getBoundingClientRect().height],overlayTransform:getComputedStyle(overlay).transform,modalTransform:getComputedStyle(modal).transform};
  });
  for(const key of ['left','top','right','bottom'])closeTo(geometry.overlay[key],geometry.root[key],'Dex overlay covers both BW2 screens at '+key);
  for(const key of ['left','top','right','bottom'])closeTo(geometry.modal[key],geometry.root[key],'Dex content covers both BW2 screens at '+key);
  assert.deepEqual(geometry.shell,shellBefore,'opening the Dex does not resize the underlying console');
  assert.equal(geometry.overlayTransform,'none');assert.equal(geometry.modalTransform,'none');

  await page.evaluate(()=>{
   const body=document.querySelector('#pkm-body');
   body.innerHTML='<div id="pkm-moves-row" class="row"><span class="k">可学招式</span></div><div id="pkm-moves">'+
    '<div class="mv-row mv-head"><span class="mv-c1">等级</span><span class="mv-c2">招式名</span><span class="mv-c3">属性 / 类型</span></div>'+[
     ['草','藤鞭','1'],['火','火花','4']].map(([type,name,level])=>'<div class="mv-row"><span class="mv-c1">Lv.'+level+'</span><span class="mv-c2">'+name+'</span><span class="mv-c3"><span class="type-chip"><img class="type-ic" alt="">'+type+'</span><img class="move-cat-ic" alt="物理"></span></div>').join('')+'</div>';
  });
  const columns=await page.locator('#pkm-moves .mv-row').evaluateAll(rows=>rows.map(row=>['.mv-c3','.mv-c1','.mv-c2'].map(selector=>{const r=row.querySelector(selector).getBoundingClientRect();return {left:r.left,right:r.right,width:r.width};})));
  assert.equal(columns.length,3,'learnset has a header and two rows');
  for(let row=1;row<columns.length;row++)for(let col=0;col<3;col++)closeTo(columns[row][col].left,columns[0][col].left,'learnset column '+col+' remains aligned');
  assert.ok(columns[0][0].left<columns[0][1].left&&columns[0][1].left<columns[0][2].left,'type/category, level, and move name read left to right');
  const typeTag=await page.locator('#pkm-moves .type-chip').first().evaluate(node=>({width:parseFloat(getComputedStyle(node).width),fontSize:parseFloat(getComputedStyle(node).fontSize),first:node.firstElementChild&&node.firstElementChild.classList.contains('type-ic')}));
  assert.equal(typeTag.first,true,'type icon precedes its label');
  assert.ok(typeTag.width>0&&Math.abs(typeTag.width/typeTag.fontSize-5.65)<0.03,'type tags use the same fixed three-character-width token');
  await page.locator('.bw2-dex-overlay .close').click();
  await page.reload();await page.locator('.bw2-console').waitFor();
  await page.locator('.tab-btn[data-tab="1"]').click();
  const nearbyType=await page.locator('.nb-cell .nb-typebar .type-chip').first().evaluate(node=>({width:parseFloat(getComputedStyle(node).width),fontSize:parseFloat(getComputedStyle(node).fontSize),shrink:getComputedStyle(node).flexShrink,iconPosition:getComputedStyle(node.firstElementChild).position}));
  assert.ok(Math.abs(nearbyType.width/nearbyType.fontSize-5.65)<0.03,'nearby type tags keep the same fixed width: '+JSON.stringify(nearbyType));
  assert.equal(nearbyType.shrink,'0','nearby type tags cannot compress');
  assert.equal(nearbyType.iconPosition,'static','nearby type icon participates in left-to-right label layout');
  await page.locator('.nb-cell').first().click();
  await page.locator('.bw2-encounter').waitFor();
  const encounterGeometry=await page.evaluate(()=>{
   const root=document.querySelector('.bw2-console'),upper=root.querySelector('.bw2-display-area'),overlay=root.querySelector('.pkm-hud-overlay.open'),modal=overlay.querySelector('.bw2-encounter');
   const rect=node=>{const r=node.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom};};
   return {upper:rect(upper),overlay:rect(overlay),modal:rect(modal),className:overlay.className};
  });
  assert.ok(encounterGeometry.className.includes('bw2-upper-dialog'),'nearby action dialog uses upper-screen mode');
  for(const key of ['left','top','right','bottom'])closeTo(encounterGeometry.overlay[key],encounterGeometry.upper[key],'nearby action overlay occupies upper screen at '+key);
  for(const key of ['left','top','right','bottom'])closeTo(encounterGeometry.modal[key],encounterGeometry.upper[key],'nearby action surface occupies upper screen at '+key);
  await page.locator('.bw2-encounter [data-pkm-dex]').click();
  await page.locator('.bw2-dex-overlay.open .modal-name').waitFor();
  assert.equal((await page.locator('.bw2-dex-overlay .modal-name').innerText()).trim(),'咕咕','nearby Pokémon opens its matching Dex entry');
  const nearbyDexGeometry=await page.evaluate(()=>{
   const root=document.querySelector('.bw2-console'),overlay=root.querySelector('.bw2-dex-overlay'),modal=overlay.querySelector('.modal');
   const rect=node=>{const r=node.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom};};
   return {root:rect(root),overlay:rect(overlay),modal:rect(modal)};
  });
  for(const key of ['left','top','right','bottom'])closeTo(nearbyDexGeometry.overlay[key],nearbyDexGeometry.root[key],'nearby-to-Dex overlay switches to both screens at '+key);
  for(const key of ['left','top','right','bottom'])closeTo(nearbyDexGeometry.modal[key],nearbyDexGeometry.root[key],'nearby-to-Dex content switches to both screens at '+key);
  await page.locator('.bw2-dex-overlay .close').click();
  assert.equal(await page.locator('.bw2-console > .pkm-hud-overlay:not(.pkm-hud-sub)').evaluate(node=>node.classList.contains('bw2-dex-overlay')),false,'closing Dex detail clears full-screen mode');
  await page.reload();await page.locator('.bw2-console').waitFor();
  await page.locator('.tab-btn[data-tab="4"]').click();
  const menuShell=await page.locator('.bw2-console').evaluate(node=>{const r=node.getBoundingClientRect();return [r.left,r.top,r.width,r.height];});
  await page.locator('[data-page="pokedex"]').click();
  await page.locator('.page-overlay.open.bw2-full-page .page').waitFor();
  const pageGeometry=await page.evaluate(()=>{
   const root=document.querySelector('.bw2-console'),dex=root.querySelector('.page-overlay.open.bw2-full-page');
   const rect=node=>{const r=node.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom};};
   return {root:rect(root),dex:rect(dex),shell:[root.getBoundingClientRect().left,root.getBoundingClientRect().top,root.getBoundingClientRect().width,root.getBoundingClientRect().height]};
  });
  for(const key of ['left','top','right','bottom'])closeTo(pageGeometry.dex[key],pageGeometry.root[key],'menu Dex fills both BW2 screens at '+key);
  assert.deepEqual(pageGeometry.shell,menuShell,'opening the Dex menu does not scale the underlying console');
  // The page-list data endpoint is intentionally mocked in this browser test;
  // seed one representative entry so the real delegated click path is tested.
  await page.evaluate(()=>{const grid=document.querySelector('#pokedex-grid');if(grid)grid.innerHTML='<div class="dex-cell" data-name="咕咕" data-id="163"><span class="dex-name">咕咕</span></div>';});
  const dexCell=page.locator('.page-overlay.open .dex-cell[data-name]').first();
  await dexCell.waitFor();
  const dexName=await dexCell.getAttribute('data-name');
  await dexCell.click();
  await page.locator('.bw2-dex-overlay.open .modal').waitFor();
  assert.equal((await page.locator('.bw2-dex-overlay .modal-name').innerText()).trim(),dexName,'Dex-list entry opens the selected Pokémon');
  const dexEntryGeometry=await page.evaluate(()=>{
   const root=document.querySelector('.bw2-console'),overlay=root.querySelector('.bw2-dex-overlay'),modal=overlay.querySelector('.modal');
   const rect=node=>{const r=node.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom};};
   return {root:rect(root),overlay:rect(overlay),modal:rect(modal)};
  });
  for(const key of ['left','top','right','bottom'])closeTo(dexEntryGeometry.overlay[key],dexEntryGeometry.root[key],'Dex-list detail covers both screens at '+key);
  for(const key of ['left','top','right','bottom'])closeTo(dexEntryGeometry.modal[key],dexEntryGeometry.root[key],'Dex-list detail content covers both screens at '+key);
  await page.locator('.bw2-dex-overlay .close').click();
  assert.equal(await page.locator('.bw2-console > .pkm-hud-overlay:not(.pkm-hud-sub)').evaluate(node=>node.classList.contains('bw2-dex-overlay')),false,'closing Dex-list detail restores normal overlay mode');
  await page.locator('.page-overlay.open [data-page-close]').click();
  assert.deepEqual(errors,[],'Dex interactions produce no browser errors');
  console.log(JSON.stringify({passed:true,fullCanvasOverlay:true,underlyingShellUnchanged:true,learnsetColumnsAligned:true,nearbyUpperScreen:true,nearbyDexFullScreen:true,dexListFullScreen:true,errors}));
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
