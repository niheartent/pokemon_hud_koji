/* Narrow handheld shell: shared display/control hosts, with native domain APIs. */
var bw2ScalePercent=100;
var bw2BattleCollapsed=false;
try{var bw2SavedScale=Number(localStorage.getItem('pk_bw2_scale'));if(bw2SavedScale>=50&&bw2SavedScale<=150)bw2ScalePercent=bw2SavedScale;}catch(e){}
var bw2LayoutRaf=0;
function bw2RequestLayout(){if(bw2LayoutRaf)return;bw2LayoutRaf=WIN.requestAnimationFrame(function(){bw2LayoutRaf=0;bw2ResizeConsole();});}
function bw2ConsoleMetrics(root){var r=root.getBoundingClientRect(),upper=root.querySelector('.bw2-display-area').getBoundingClientRect(),lower=root.querySelector('.bw2-control-area').getBoundingClientRect();return {root:r,upper:upper,lower:lower,scale:r.width/root.offsetWidth};}
function bw2ResizeConsole(){
  var root=Array.from(document.querySelectorAll('.bw2-console')).find(function(node){return node.getBoundingClientRect().width>0;});if(!root)return;var app=root.parentElement,win=root.closest('#pkm-hud-win'),vp=vpSize();
  var available=win?vp.w*.94:app.clientWidth||vp.w-24,scale=Math.min(bw2ScalePercent/100,available/600);
  if(win)scale=Math.min(scale,vp.h*.86/812);scale=Math.max(.2,scale);
  if(root.style.zoom!==String(scale))root.style.zoom=String(scale);
  if(win){win.style.width=(600*scale)+'px';win.style.height=(812*scale)+'px';win.style.maxHeight='none';var l=parseFloat(win.style.left),t=parseFloat(win.style.top);if(!isNaN(l))win.style.left=Math.max(vp.ox,Math.min(l,vp.ox+vp.w-600*scale))+'px';if(!isNaN(t))win.style.top=Math.max(vp.oy,Math.min(t,vp.oy+vp.h-812*scale))+'px';}
  bw2SyncActionSize(app);bw2SyncNearbyCarousel(app);bw2SyncTrainerLayout(app);
  var metrics=bw2ConsoleMetrics(root);bw2SyncDetailScreens(app,metrics);bw2SyncPageScreens(app,metrics);bw2SyncInteractionScreens(app,metrics);
  try{if(window.frameElement)window.frameElement.style.height=(root.getBoundingClientRect().height+32)+'px';}catch(e){}
}
function bw2OpenScale(){
  clearBack();overlay.innerHTML='<div class="modal"><div class="modal-head"><div class="modal-name">界面等比缩放</div><button class="close" data-close>✕</button></div><div class="modal-body"><div class="dim">整套界面一起缩放，保持上下屏和按钮比例。超出可用空间时自动缩小。</div><div style="display:flex;align-items:center;justify-content:center;gap:12px;margin:16px 0"><button class="btn-small" data-inline-h-minus>－</button><input type="number" id="inline-h-num" aria-label="界面缩放百分比" value="'+bw2ScalePercent+'" min="50" max="150" step="5" style="width:85px;padding:8px;text-align:center"><span>%</span><button class="btn-small" data-inline-h-plus>＋</button></div><div class="action-btns"><button class="act-btn" data-inline-h-apply>应用</button><button class="act-btn" data-inline-h-reset>恢复 100%</button></div></div></div>';overlay.classList.add('open');
}
function bw2ScaleStep(d){var el=document.getElementById('inline-h-num');if(el)el.value=Math.max(50,Math.min(150,(Number(el.value)||100)+d));}
function bw2ScaleApply(reset){var el=document.getElementById('inline-h-num');bw2ScalePercent=reset?100:Math.max(50,Math.min(150,Number(el&&el.value)||100));try{localStorage.setItem('pk_bw2_scale',String(bw2ScalePercent));}catch(e){}overlay.classList.remove('open');bw2ResizeConsole();}
function bw2ConsoleHTML(){
  return '<div class="hud bw2-console" data-bw2-console>'+ 
    '<div class="bw2-console-lid"><div class="bw2-console-bezel" aria-hidden="true"><i></i><span>POKÉMON</span><i></i></div>'+ 
    '<section class="bw2-screen bw2-display-area" aria-label="上屏显示区"><div class="bw2-display-caption"><strong data-bw2-display-title>队伍</strong><span data-bw2-display-status></span></div>'+ 
    '<div class="hud-inner" id="hud-inner"><div class="tab-panel active" id="tab-1">'+bw2PanelHTML('1')+'</div><div class="tab-panel" id="tab-2"></div><div class="tab-panel" id="tab-3"></div></div></section></div>'+ 
    '<div class="bw2-console-hinge" aria-hidden="true"><i></i><span></span><i></i></div>'+ 
    '<div class="bw2-console-base"><section class="bw2-screen bw2-control-area" aria-label="下屏操作区"><div class="bw2-control-toolbar"><strong data-bw2-control-title>附近宝可梦 · 快捷选项</strong><button type="button" class="bw2-battle-toggle" data-bw2-battle-toggle hidden aria-controls="tab-4" aria-expanded="true">收起指令 ▾</button></div>'+ 
    '<div class="tab-panel active bw2-operation-panel" id="tab-4">'+bw2ControlHTML('1')+'</div>'+ 
    '<nav class="tab-bar" aria-label="主导航"><button class="tab-btn active" data-tab="1">主页</button><button class="tab-btn" data-tab="2">世界</button><button class="tab-btn" data-tab="3">战场</button><button class="tab-btn" data-tab="4">菜单</button></nav></section>'+ 
    '<div class="bw2-console-foot" aria-hidden="true"><span></span><i></i></div></div></div>';
}
function bw2ControlHTML(key){
  if(key==='2')return rivalsHTML()+relHTML();
  if(key==='3')return bw2CommandHTML()+hudCmdBarHTML();
  var nearby=key==='1'&&Object.keys(stat_data.附近宝可梦||{}).length?bw2NearbyCarouselHTML():'';
  if(key==='1'){var shortcuts=bw2MenuHTML(['bag','box','map','typechart']),holder=document.createElement('div');holder.innerHTML=shortcuts;var grid=holder.querySelector('.bw2-menu-grid');grid.insertAdjacentHTML('afterbegin','<div class="bw2-home-nearby">'+(nearby||'<div class="empty">附近暂无宝可梦</div>')+'</div>');return '<section class="bw2-menu-screen bw2-home-screen">'+grid.outerHTML+'</section>';}
  return menuHTML();
}
function bw2DisplayTab(app){var panel=app&&app.querySelector('.bw2-display-area .tab-panel.active');return panel?panel.id.replace('tab-',''):'1';}
function bw2SyncConsoleLabels(app){
  var title=app.querySelector('[data-bw2-display-title]'),status=app.querySelector('[data-bw2-display-status]'),tr=stat_data.训练家||{},key=bw2DisplayTab(app);
  function text(el,value){if(el&&el.textContent!==value)el.textContent=value;}
  text(title,{1:'队伍',2:'世界',3:'战场'}[key]||'队伍');
  text(status,(tr.名字||'训练家')+' · ¥'+num(tr.金钱,0).toLocaleString());
  bw2SyncBattleLayout(app);
  text(app.querySelector('[data-bw2-control-title]'),{'1':'附近宝可梦 · 快捷选项','2':'劲敌 · 人际关系','3':'战斗指令','4':'主菜单'}[hudActiveTab(app)]);
}
function bw2RefreshControls(app,key){
  key=key||hudActiveTab(app);var panel=app.querySelector('#tab-4');if(!panel)return;
  var signature=bw2PanelSignature('controls-'+key);if(panel._bw2Signature!==signature){var scroll=panel.scrollTop;panel.innerHTML=bw2ControlHTML(key);panel._bw2Signature=signature;panel.scrollTop=scroll;hudBindRefreshProgrammaticGuard(panel);pkImgFix(panel);resolvePkmImgs(panel);resolveItemImgs(panel);resolveNearbyTypes(panel);hudResolvePkidbImages(panel);}
  panel.classList.toggle('bw2-menu-full',key==='4');panel.classList.toggle('bw2-command-full',key==='3');bw2SyncConsoleLabels(app);
}
function bw2CommandHTML(){
  var keys=['training','dodge','initiative','guard','revive','mega','clash'];
  var tiles=CMDS.map(function(command,i){var label=command[0].replace(/^[^\p{L}\p{N}]+/u,'');return '<div class="bw2-command-tile"><button type="button" class="cmd-btn bw2-menu-button" data-cmd="'+esc(command[1])+'" title="'+esc(command[2])+'"><span class="bw2-menu-icon"><img src="'+BW2_COMMAND_ICONS[keys[i]]+'" alt=""></span><span class="menu-label">'+esc(label)+'</span></button><button type="button" class="cmd-tip bw2-command-help" data-tip="'+esc(label+'｜'+command[2])+'" aria-label="查看'+esc(label)+'说明">?</button></div>';}).join('');
  return '<section class="bw2-menu-screen bw2-command-screen"><div class="bw2-menu-grid bw2-command-grid">'+tiles+'<button type="button" class="menu-item bw2-menu-button bw2-command-typechart" data-page="typechart"><span class="bw2-menu-icon" style="color:#dfb457">'+swshIcon('typechart',38)+'</span><span class="menu-label">克制表</span></button></div><p class="bw2-command-hint">点击填入输入栏 · 将 XX 换成招式名后发送</p></section>';
}
function bw2SelectConsoleTab(app,key){
  bw2CloseInteractions();
  app.querySelectorAll('.tab-btn[data-tab]').forEach(function(button){button.classList.toggle('active',button.getAttribute('data-tab')===key);});
  if(key!=='4'){
    bw2RefreshPanel(app,key);
    app.querySelectorAll('.bw2-display-area .tab-panel').forEach(function(panel){panel.classList.toggle('active',panel.id==='tab-'+key);});
  }
  bw2RefreshControls(app,key);resizeFrame();
}
/* Keep the native detail event host, but render its two canvases in the console screens. */
function bw2DetailScreenValues(root,metrics){
  if(!root)return null;metrics=metrics||bw2ConsoleMetrics(root);
  var r=metrics.root,top=metrics.upper,bottom=metrics.lower,scale=metrics.scale;
  // A hidden console has no usable geometry. Never overwrite valid sizes with NaN.
  if(!Number.isFinite(scale)||scale<=0||top.width<=0||top.height<=0||bottom.height<=0)return null;
  top={top:(top.top-r.top)/scale,width:top.width/scale,height:top.height/scale};bottom={top:(bottom.top-r.top)/scale,width:bottom.width/scale,height:bottom.height/scale};
  var upperWidth=Math.max(1,top.width-2),lowerWidth=Math.max(1,bottom.width-2),headerHeight=36,sceneHeight=Math.max(1,top.height-headerHeight-8),dataHeight=Math.max(1,bottom.height-8);
  return {'--bw2-detail-top':top.top+2+'px','--bw2-detail-bottom':bottom.top+3+'px','--bw2-detail-upper-width':upperWidth+'px','--bw2-detail-lower-width':lowerWidth+'px','--bw2-detail-header-height':headerHeight+'px','--bw2-detail-scene-height':sceneHeight+'px','--bw2-detail-data-height':dataHeight+'px','--bw2-detail-upper-unit':Math.min(upperWidth,sceneHeight*386/268)/100+'px','--bw2-detail-lower-unit':Math.min(lowerWidth,dataHeight*386/248)/100+'px','--bw2-detail-scene-top':top.top+headerHeight+6+'px'};
}
function bw2SyncDetailScreens(app,metrics){
  var root=app.querySelector('.bw2-console'),detail=app.querySelector('.bw2-detail');if(!root||!detail)return;
  var values=bw2DetailScreenValues(root,metrics);if(!values)return;
  Object.keys(values).forEach(function(key){if(detail.style.getPropertyValue(key)!==values[key])detail.style.setProperty(key,values[key]);});
}

function bw2SyncActionSize(app){var root=app.querySelector('.bw2-console'),screen=root&&root.querySelector('.bw2-control-area');if(!screen)return;var value=Math.max(40,(screen.clientHeight-32-46-26-36)/4)+'px';if(root.style.getPropertyValue('--bw2-action-height')!==value)root.style.setProperty('--bw2-action-height',value);var preview=root.querySelector('#tab-1 .card-frame .pk-img');if(preview){var width=getComputedStyle(preview).width,height=getComputedStyle(preview).height;if(root.style.getPropertyValue('--bw2-party-preview-width')!==width)root.style.setProperty('--bw2-party-preview-width',width);if(root.style.getPropertyValue('--bw2-party-preview-height')!==height)root.style.setProperty('--bw2-party-preview-height',height);}}

function bw2NearbyCarouselHTML(){var previous=nearbyOpen;nearbyOpen=true;var html;try{html=nearbyHTML();}finally{nearbyOpen=previous;}var holder=document.createElement('div');holder.innerHTML=html;var grid=holder.querySelector('.nb-grid');if(grid){var cells=Array.from(grid.children),starts=[0],last=Math.max(0,cells.length-4);while(starts[starts.length-1]<last)starts.push(Math.min(starts[starts.length-1]+4,last));grid.dataset.bw2Starts=JSON.stringify(starts);grid.dataset.bw2Total=cells.length;if(cells.length>4){grid.parentElement.classList.add('bw2-nearby-arrows');[-1,1].forEach(function(step){var d=step<0?'M19 7 L7 18 L19 29':'M7 7 L19 18 L7 29',svg='<svg viewBox="0 0 26 36" aria-hidden="true"><path d="'+d+'" fill="none" stroke="#313b49" stroke-width="10" stroke-linejoin="round" stroke-linecap="round"/><path d="'+d+'" fill="none" stroke="#fff" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"/></svg>';grid.insertAdjacentHTML(step<0?'beforebegin':'afterend','<button type="button" class="bw2-nearby-arrow '+(step<0?'previous':'next')+'" data-bw2-nearby-step="'+step+'" aria-label="向'+(step<0?'左':'右')+'查看附近宝可梦">'+svg+'</button>');});}}return holder.innerHTML;}
function bw2NearbyOffsets(grid){if(grid._bw2Offsets)return grid._bw2Offsets;var starts=JSON.parse(grid.dataset.bw2Starts||'[0]'),cell=grid.querySelector('.nb-cell'),stride=cell?parseFloat(getComputedStyle(cell).width)+12:0;return starts.map(function(start){return start*stride;});}
function bw2NearbyIndex(grid){var offsets=bw2NearbyOffsets(grid),index=0;offsets.forEach(function(offset,i){if(Math.abs(grid.scrollLeft-offset)<Math.abs(grid.scrollLeft-offsets[index]))index=i;});return index;}
function bw2UpdateNearbyArrows(grid){var home=grid.closest('.bw2-home-nearby'),left=home.querySelector('.previous'),right=home.querySelector('.next'),index=bw2NearbyIndex(grid),last=bw2NearbyOffsets(grid).length-1;if(left&&left.disabled!==(index<=0))left.disabled=index<=0;if(right&&right.disabled!==(index>=last))right.disabled=index>=last;}
function bw2SyncNearbyCarousel(app){
  var home=app.querySelector('.bw2-home-nearby'),grid=home&&home.querySelector('.nb-grid');if(!grid)return;
  var edge=Math.max(60,Math.min(home.clientHeight-2,(home.clientWidth-52)/4));
  if(grid._bw2Edge!==edge){var index=grid._bw2Offsets?bw2NearbyIndex(grid):0;grid._bw2Edge=edge;grid.style.width=(4*edge+52)+'px';home.style.setProperty('--bw2-nearby-edge',edge+'px');grid.style.setProperty('--bw2-nearby-pad','8px');var starts=JSON.parse(grid.dataset.bw2Starts||'[0]');grid._bw2Offsets=starts.map(function(start){return start*(edge+12);});grid.scrollLeft=grid._bw2Offsets[index]||0;}
  if(!grid._bw2SnapReady){grid._bw2SnapReady=true;grid.classList.toggle('bw2-nearby-short',Number(grid.dataset.bw2Total)<4);var starts=JSON.parse(grid.dataset.bw2Starts||'[0]');Array.from(grid.children).forEach(function(cell,i){cell.style.scrollSnapAlign=starts.includes(i)?'start':'none';});}
  bw2UpdateNearbyArrows(grid);
}

/* Preserve the battle DOM and scroll position; only its available viewport changes. */
function bw2SyncBattleLayout(app){
  var root=app.querySelector('.bw2-console'),button=app.querySelector('[data-bw2-battle-toggle]');if(!root||!button)return;
  var battle=hudActiveTab(app)==='3',collapsed=battle&&bw2BattleCollapsed;
  root.classList.toggle('bw2-battle-expanded',collapsed);button.hidden=!battle;
  button.setAttribute('aria-expanded',String(!collapsed));button.textContent=collapsed?'展开指令 ▴':'收起指令 ▾';
}
