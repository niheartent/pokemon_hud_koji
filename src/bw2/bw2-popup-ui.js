/* Decorate changed surfaces, coalescing native DOM updates once per frame. */
function bw2BindPopupUI(app){
  if(!app||app._bw2PopupBound)return;app._bw2PopupBound=true;
  var svgNS='http://www.w3.org/2000/svg',pending=new Set(),observed=new WeakSet(),raf=0;
  var buttonSelector='.page-body button:not(.page-close),.bw2-upper-dialog .modal-body button:not(.close),.bw2-popup .act-btn';
  function rim(button){
    if(button.querySelector(':scope>.bw2-button-rim'))return;
    var svg=document.createElementNS(svgNS,'svg');svg.setAttribute('class','bw2-button-rim');svg.setAttribute('viewBox','0 0 100 40');svg.setAttribute('preserveAspectRatio','none');svg.setAttribute('aria-hidden','true');
    var polygon=document.createElementNS(svgNS,'polygon');polygon.setAttribute('points','6,1.5 94,1.5 98.5,20 94,38.5 6,38.5 1.5,20');svg.appendChild(polygon);button.insertBefore(svg,button.firstChild);
  }
  function decorate(node){
    if(!node.isConnected)return;hudDiagInc('bw2SurfaceScans');
    bw2SyncMoveColors(node);
    if(node.matches('.modal:not(.bw2-detail)'))node.classList.add('bw2-popup');
    node.querySelectorAll('.modal:not(.bw2-detail)').forEach(function(modal){modal.classList.add('bw2-popup');});
    if(node.matches(buttonSelector))rim(node);node.querySelectorAll(buttonSelector).forEach(rim);
  }
  function flush(){raf=0;var roots=Array.from(pending);pending.clear();roots.filter(function(node){return !roots.some(function(parent){return parent!==node&&parent.contains(node);});}).forEach(decorate);bw2RequestLayout();}
  function enqueue(node){
    if(!node||node.nodeType!==1||node.namespaceURI===svgNS)return;
    // Text, sprite and dex-cell hydration cannot create operation controls.
    // Avoid a scan (and quadratic root filtering) for every cell in a large dex.
    if(!node.matches('.modal,.page,button')&&!node.querySelector('.modal,button'))return;
    pending.add(node.closest('.page-body,.modal')||node);if(!raf)raf=WIN.requestAnimationFrame(flush);
  }
  var observer=typeof MutationObserver==='function'?hudScope.observe(new MutationObserver(function(records){
    records.forEach(function(record){
      if(record.type==='attributes'){bw2SyncMoveColors(record.target);return;}
      Array.from(record.addedNodes).forEach(function(node){if(node.nodeType===1&&node.namespaceURI!==svgNS)bw2SyncMoveColors(node);enqueue(node);});
    });
    [overlay,subOverlay,pageOverlay].forEach(observe);
  })):null;
  function observe(node){if(observer&&node&&!observed.has(node)){observed.add(node);observer.observe(node,{childList:true,subtree:true,attributes:true,attributeFilter:['data-mvtype','data-mvcat']});}}
  observe(app);var resize=typeof ResizeObserver==='function'?hudScope.observe(new ResizeObserver(bw2RequestLayout)):null;if(resize)resize.observe(app);
  hudScope.cleanup(function(){if(raf)WIN.cancelAnimationFrame(raf);if(bw2LayoutRaf)WIN.cancelAnimationFrame(bw2LayoutRaf);bw2LayoutRaf=0;pending.clear();app._bw2PopupBound=false;});enqueue(app);
}
