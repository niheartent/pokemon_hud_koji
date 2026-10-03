/* Breeding uses only the native egg, remaining-step and storage fields. */
function bw2BreedingHTML(){
  var b=stat_data.繁育||{},egg=String(b.蛋||'无蛋'),hasEgg=!/^(无蛋|无|-|空)$/.test(egg),steps=Math.max(0,num(b.剩余步数,0));
  var art='<svg viewBox="0 0 120 150" aria-hidden="true"><defs><linearGradient id="bw2-egg-shell" x2=".8" y2="1"><stop stop-color="#edf3df"/><stop offset="1" stop-color="#bdcbb0"/></linearGradient></defs><path d="M60 8C37 8 15 56 15 94c0 30 20 47 45 47s45-17 45-47C105 56 83 8 60 8Z" fill="url(#bw2-egg-shell)" stroke="#839c87" stroke-width="3"/><path d="m42 40 12-8 10 11-3 13-15 1Z M72 76l14-7 10 11-4 15-14 1Z M27 98l14-6 11 9-3 15-15 2Z" fill="#7d9d86"/><path d="M31 71c2-17 10-36 19-44" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="5" stroke-linecap="round"/></svg>';
  return '<section class="bw2-breeding '+(hasEgg?'has-egg':'no-egg')+'"><div class="bw2-breeding-overview"><div class="bw2-breeding-visual">'+art+'<span>'+ (hasEgg?'孵化中':'等待放入宝可梦蛋')+'</span></div><div class="bw2-breeding-summary"><span class="bw2-breeding-label">孵化状态</span><h2>'+esc(hasEgg?egg:'暂无宝可梦蛋')+'</h2><p>'+(hasEgg?'继续行进，等待新伙伴孵化。':'放入宝可梦蛋后，在这里查看孵化状态。')+'</p><div class="bw2-breeding-steps"><span>剩余步数</span><strong>'+steps+'<small>步</small></strong></div></div></div><div class="bw2-breeding-storage"><span class="bw2-breeding-label">存放</span><strong>'+esc(b.存放||'暂无存放记录')+'</strong></div></section>';
}

/* Screen routing and box presentation; native data and action handlers remain in charge. */
function bw2BoxHTML(){
  var boxes=stat_data.盒子||{},keys=Object.keys(boxes);if(keys.length&&!boxes[activeBox])activeBox=keys[0];
  var tabs=keys.map(function(key){return '<button type="button" class="bw2-box-tab'+(key===activeBox?' active':'')+'" data-bw2-box-tab="'+esc(key)+'" aria-pressed="'+(key===activeBox)+'">'+esc(key)+'</button>';}).join('');
  var select='<select id="box-select" hidden>'+keys.map(function(key){return '<option value="'+esc(key)+'"'+(key===activeBox?' selected':'')+'>'+esc(key)+'</option>';}).join('')+'</select>';
  var contents=boxes[activeBox]||{},entries=Object.keys(contents).filter(function(slot){var p=contents[slot];return p&&p.名字&&p.名字!=='空';});
  function card(slot){return cardHTML(cardFromPkm(contents[slot],slot,'box',activeBox)).replace('<div class="card-frame"','<div class="card-frame bw2-box-card" data-box="'+esc(activeBox)+'"');}
  var split=Math.ceil(entries.length/2),cards=entries.length?'<div class="grid bw2-box-team"><div class="col col-left">'+entries.slice(0,split).map(card).join('')+'</div><div class="col col-right">'+entries.slice(split).map(card).join('')+'</div></div>':'<div class="empty">这个盒子还没有宝可梦</div>';
  return '<section class="bw2-box-page"><div class="bw2-box-tools"><div class="bw2-box-tabs" aria-label="切换盒子">'+tabs+'</div><button class="btn-small" data-box-new>＋ 新建</button>'+(keys.length?'<button class="btn-small" data-box-del>删除盒子</button>':'')+select+'</div><div class="bw2-box-scroll">'+cards+'</div></section>';
}
function bw2SwitchBox(key){if(!stat_data.盒子||!stat_data.盒子[key]||currentPageKey!=='box')return;activeBox=key;pageOverlay.querySelector('.page-body').innerHTML=boxHTML();bindPageInteractions();pkImgFix(pageOverlay);resolvePkmImgs(pageOverlay);resolveItemImgs(pageOverlay);hudResolvePkidbImages(pageOverlay);}
function bw2PreparePage(key){
  bw2CloseInteractions();
  var upper=['box','bag','breeding','pokedex','badge'].indexOf(key)>=0,external=key==='map'||key==='typechart';
  pageOverlay.classList.toggle('bw2-upper-page',upper);pageOverlay.classList.toggle('bw2-full-page',key==='pokedex');pageOverlay.classList.toggle('bw2-external-page',external);pageOverlay.classList.toggle('bw2-host',external);pageOverlay.setAttribute('data-bw2-page-key',key);
  if(external&&pageOverlayHost){var style=getComputedStyle(pageOverlayHost);['--frame','--text','--dim','--hp','--male','--female','--bw2-original-grid'].forEach(function(name){pageOverlay.style.setProperty(name,style.getPropertyValue(name));});}
  if(!pageOverlay._bw2ExternalBound){pageOverlay._bw2ExternalBound=true;hudScope.listen(pageOverlay,'click',function(e){var image=e.target.closest&&e.target.closest('[data-tc-big]');if(!image||!pageOverlay.classList.contains('bw2-external-page'))return;e.preventDefault();e.stopImmediatePropagation();var zoomed=image.getAttribute('data-bw2-zoomed')==='1';image.setAttribute('data-bw2-zoomed',zoomed?'0':'1');image.style.maxWidth='none';image.style.width=zoomed?'100%':'200%';image.style.cursor=zoomed?'zoom-in':'zoom-out';},true);}
}
function bw2PagePopout(on){
  if(!pageOverlay)return;
  if(on){pageOverlay.classList.add('popout');if(pageOverlay.parentElement!==document.body)document.body.appendChild(pageOverlay);}
  else{pageOverlay.classList.remove('popout','map-focus');if(pageOverlayHost&&pageOverlay.parentElement!==pageOverlayHost)pageOverlayHost.appendChild(pageOverlay);}
  hudSyncModalIsolation();
}
function bw2SyncPageScreens(app,metrics){
  bw2NormalizeUpperPage();
  if(pageOverlay){var badgeGrid=pageOverlay.querySelector('.badge-grid'),rows=badgeGrid&&String(Math.ceil(badgeGrid.children.length/4));if(badgeGrid&&badgeGrid.style.getPropertyValue('--bw2-badge-rows')!==rows)badgeGrid.style.setProperty('--bw2-badge-rows',rows);}
  if(!pageOverlay||!pageOverlay.classList.contains('bw2-upper-page'))return;var root=app.querySelector('.bw2-console');if(!root)return;metrics=metrics||bw2ConsoleMetrics(root);var r=metrics.root,screen=metrics.upper,scale=metrics.scale;
  if(pageOverlay.classList.contains('bw2-full-page'))screen={left:screen.left,top:screen.top,width:screen.width,height:metrics.lower.bottom-screen.top};
  var values={'--bw2-page-left':(screen.left-r.left)/scale-root.clientLeft+'px','--bw2-page-top':(screen.top-r.top)/scale-root.clientTop+'px','--bw2-page-width':screen.width/scale+'px','--bw2-page-height':screen.height/scale+'px'};Object.keys(values).forEach(function(key){if(pageOverlay.style.getPropertyValue(key)!==values[key])pageOverlay.style.setProperty(key,values[key]);});
}
function bw2PageIsolation(){
  if(!pageOverlayHost||!pageOverlay)return;
  var signature=[pageOverlay.classList.contains('open'),pageOverlay.classList.contains('bw2-upper-page'),pageOverlay.classList.contains('bw2-external-page'),pageOverlay.parentElement===document.body,overlay&&overlay.classList.contains('open'),subOverlay&&subOverlay.classList.contains('open'),!!(overlay&&overlay.querySelector('.bw2-detail'))].join('|');
  if(pageOverlayHost._bw2IsolationSignature===signature)return;pageOverlayHost._bw2IsolationSignature=signature;
  if(pageOverlayHost)bw2SyncInteractionScreens(pageOverlayHost.parentElement);
  bw2NativeModalIsolation();if(!pageOverlayHost||!pageOverlay)return;
  var open=pageOverlay.classList.contains('open'),modal=overlay&&overlay.classList.contains('open')||subOverlay&&subOverlay.classList.contains('open');
  if(open&&!modal&&pageOverlay.classList.contains('bw2-upper-page')&&!pageOverlay.classList.contains('bw2-full-page')){pageOverlayHost.classList.remove('page-child-open');hudSetInert(pageOverlayHost.querySelector('.bw2-console-base'),false);hudSetInert(pageOverlayHost.querySelector('.bw2-console-hinge'),false);}
  var detail=overlay&&overlay.classList.contains('open')&&overlay.querySelector('.bw2-detail'),dialog=overlay&&overlay.classList.contains('open')&&overlay.classList.contains('bw2-upper-dialog')||subOverlay&&subOverlay.classList.contains('open')&&subOverlay.classList.contains('bw2-upper-dialog');
  if(dialog&&!detail&&!(open&&pageOverlay.classList.contains('bw2-full-page'))){pageOverlayHost.classList.remove('modal-child-open','page-child-open');hudSetInert(pageOverlayHost.querySelector('.bw2-console-base'),false);hudSetInert(pageOverlayHost.querySelector('.bw2-console-hinge'),false);}
  if(open&&pageOverlay.classList.contains('bw2-external-page'))hudSetInert(pageOverlayHost,true);
}
function bw2CloseInteractions(){
  clearDexGrid();
  if(overlay){overlay.classList.remove('open');overlay.innerHTML='';}if(subOverlay){subOverlay.classList.remove('open');subOverlay.innerHTML='';}
  if(pageOverlay){pageOverlay.classList.remove('open');bw2PagePopout(false);}currentPageKey='';bw2HeldContext=null;clearBack();
}
function bw2SyncInteractionScreens(app,metrics){
  if(!app)return;var root=app.querySelector('.bw2-console');if(!root)return;
  metrics=metrics||bw2ConsoleMetrics(root);var r=metrics.root,screen=metrics.upper,scale=metrics.scale;
  [overlay,subOverlay].forEach(function(layer){if(!layer)return;var modal=layer.querySelector('.modal'),upper=!!(modal&&!modal.classList.contains('bw2-detail'));if(layer.classList.contains('bw2-upper-dialog')!==upper)layer.classList.toggle('bw2-upper-dialog',upper);if(!upper)return;
    var values={'--bw2-dialog-left':(screen.left-r.left)/scale+'px','--bw2-dialog-top':(screen.top-r.top)/scale+'px','--bw2-dialog-width':screen.width/scale+'px','--bw2-dialog-height':screen.height/scale+'px'};Object.keys(values).forEach(function(key){if(layer.style.getPropertyValue(key)!==values[key])layer.style.setProperty(key,values[key]);});
  });
}

/* The console owns the operation-page frame; upstream sections supply content only. */
function bw2NormalizeUpperPage(){
  if(!pageOverlay||!pageOverlay.classList.contains('bw2-upper-page'))return;
  pageOverlay.querySelectorAll('.info-frame.plain-frame').forEach(function(section){section.classList.remove('plain-frame');section.classList.add('bw2-page-section');});
  if(pageOverlay.dataset.bw2PageKey==='pokedex'){
    var toolbar=pageOverlay.querySelector('.info-title:has([data-dex-thumb])');
    if(toolbar&&!toolbar.classList.contains('bw2-dex-toolbar')){toolbar.classList.add('bw2-dex-toolbar');Array.from(toolbar.childNodes).forEach(function(node){if(node.nodeType===3)node.remove();});toolbar.setAttribute('aria-label','图鉴显示方式');}
  }
}
