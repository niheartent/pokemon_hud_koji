(function(){

var WIN=(function(){try{if(window.parent&&window.parent!==window&&window.parent.document&&window.parent.document.body){return window.parent;}}catch(e){}return window;})();
var document=WIN.document;
/* ★★★ 发布新版只需改下面这一块：版本号 + 更新公告 ★★★ */
var PK_VER='3.3.1';
var PK_BEAUTY_VER='0.3.10';
var BW2_STANDALONE=true;

/*PK_NOTICE_BEGIN
主题深浅改为点击展开滑条，避免误触
PK_NOTICE_END*/

















function runPkmHud(boot){

var HUD_SCOPE_KEY='__pkmHudScope_v180';
try{var __oldScope=WIN[HUD_SCOPE_KEY];if(__oldScope&&typeof __oldScope.destroy==='function')__oldScope.destroy();}catch(e){}
function createHudScope(){
  var timers=new Set(),intervals=new Set(),cleanups=[],observers=new Set(),controllers=new Set(),dead=false;
  return {
    setTimeout:function(fn,ms){if(dead)return 0;var args=[].slice.call(arguments,2),id=WIN.setTimeout(function(){timers.delete(id);if(!dead)try{fn.apply(null,args);}catch(e){hudDiagError('timer',e);}},ms);timers.add(id);return id;},
    clearTimeout:function(id){try{WIN.clearTimeout(id);}catch(e){}timers.delete(id);},
    setInterval:function(fn,ms){if(dead)return 0;var args=[].slice.call(arguments,2),id=WIN.setInterval(function(){if(!dead)try{fn.apply(null,args);}catch(e){hudDiagError('interval',e);}},ms);intervals.add(id);return id;},
    clearInterval:function(id){try{WIN.clearInterval(id);}catch(e){}intervals.delete(id);},
    listen:function(target,type,fn,opt){if(!target||typeof target.addEventListener!=='function')return fn;target.addEventListener(type,fn,opt);cleanups.push(function(){try{target.removeEventListener(type,fn,opt);}catch(e){}});return fn;},
    emitter:function(src,type,fn){if(!src||typeof src.on!=='function')return fn;try{src.on(type,fn);cleanups.push(function(){try{if(typeof src.off==='function')src.off(type,fn);else if(typeof src.removeListener==='function')src.removeListener(type,fn);else if(typeof src.removeEventListener==='function')src.removeEventListener(type,fn);}catch(e){}});}catch(e){hudDiagError('eventSource bind',e);}return fn;},
    observe:function(ob){if(ob)observers.add(ob);return ob;},
    controller:function(c){if(c)controllers.add(c);return c;},
    uncontroller:function(c){controllers.delete(c);},
    cleanup:function(fn){if(typeof fn==='function')cleanups.push(fn);},
    destroy:function(){if(dead)return;dead=true;timers.forEach(function(id){try{WIN.clearTimeout(id);}catch(e){}});intervals.forEach(function(id){try{WIN.clearInterval(id);}catch(e){}});observers.forEach(function(o){try{o.disconnect();}catch(e){}});controllers.forEach(function(c){try{c.abort();}catch(e){}});for(var i=cleanups.length-1;i>=0;i--)try{cleanups[i]();}catch(e){}timers.clear();intervals.clear();observers.clear();controllers.clear();cleanups.length=0;},
    get destroyed(){return dead;},get timerCount(){return timers.size;},get intervalCount(){return intervals.size;},get observerCount(){return observers.size;},get controllerCount(){return controllers.size;}
  };
}
var hudDiag={startedAt:Date.now(),errors:[],events:[],counters:Object.create(null),activeRequests:0,maxActiveRequests:0};
function hudDiagInc(k,n){hudDiag.counters[k]=(Number(hudDiag.counters[k])||0)+(n==null?1:Number(n)||0);return hudDiag.counters[k];}
function hudDiagEvent(type,detail){hudDiag.events.push({at:Date.now(),type:String(type||'event'),detail:String(detail||'').slice(0,600)});if(hudDiag.events.length>60)hudDiag.events.splice(0,hudDiag.events.length-60);}
function hudDiagError(area,e){var row={at:Date.now(),area:String(area||'unknown'),name:String(e&&e.name||'Error'),message:String(e&&e.message||e||'').slice(0,900)};hudDiag.errors.push(row);if(hudDiag.errors.length>60)hudDiag.errors.splice(0,hudDiag.errors.length-60);hudDiagInc('errors');return row;}
var hudScope=createHudScope();
try{WIN[HUD_SCOPE_KEY]=hudScope;}catch(e){}
hudScope.cleanup(function(){try{if(WIN[HUD_SCOPE_KEY]===hudScope)delete WIN[HUD_SCOPE_KEY];}catch(e){}});
function hudNewAbortController(){
  try{var C=WIN.AbortController||(typeof AbortController!=='undefined'?AbortController:null);if(C)return new C();}catch(e){}
  return {signal:null,abort:function(){}};
}
function hudFetch(url,opt){
  opt=opt&&typeof opt==='object'?Object.assign({},opt):{};
  var timeout=Math.max(1000,Math.min(120000,Number(opt.timeout)||30000)),outerSignal=opt.signal;delete opt.timeout;
  var ctl=hudScope.controller(hudNewAbortController()),done=false,tm=0,timedOut=false;
  if(outerSignal){if(outerSignal.aborted){try{ctl.abort();}catch(e){}}else try{outerSignal.addEventListener('abort',function(){try{ctl.abort();}catch(e){}},{once:true});}catch(e){}}
  if(ctl.signal)opt.signal=ctl.signal;else delete opt.signal;
  hudDiagInc('fetch');hudDiag.activeRequests++;hudDiag.maxActiveRequests=Math.max(hudDiag.maxActiveRequests,hudDiag.activeRequests);
  var req=WIN.fetch(url,opt);
  var guarded;if(ctl.signal){tm=WIN.setTimeout(function(){if(done)return;timedOut=true;try{ctl.abort();}catch(e){}},timeout);guarded=req;}
  else{guarded=Promise.race([req,new Promise(function(_,rej){tm=WIN.setTimeout(function(){if(done)return;timedOut=true;var e=new Error('请求超时');e.name='TimeoutError';rej(e);},timeout);})]);}
  return guarded.catch(function(e){if(timedOut&&e&&e.name==='AbortError'){try{e.message='请求超时';}catch(_){} }hudDiagError('fetch '+String(url).slice(0,180),e);throw e;}).finally(function(){done=true;if(tm)WIN.clearTimeout(tm);hudScope.uncontroller(ctl);hudDiag.activeRequests=Math.max(0,hudDiag.activeRequests-1);});
}


var HUD_CACHE_DB='pk_hud_cache_v2',HUD_CACHE_STORE='kv',HUD_CACHE_TTL=90*24*60*60*1000,HUD_CACHE_MAX_ENTRIES=2500,hudCacheDbP=null,hudCacheMem=Object.create(null),hudCacheReady=false,hudCacheLastTouch=Object.create(null);
function hudIsCacheKey(k){k=String(k||'');return /^(?:pk_sprite_|pk_icon_|pk_slug_|pk_ndex_|pk_dexthumb_|pk_mv_|pk_pm_|pk_ab_|pk_fid_|pk_item_|pk_itemimg_|pk_ps_|pk_psf_|pk_gh_)/.test(k)||['pk_dexlist','pk_itemlist','pk_abilist'].indexOf(k)>=0;}
function hudCacheDb(){if(hudCacheDbP)return hudCacheDbP;hudCacheDbP=new Promise(function(res,rej){try{var idb=WIN.indexedDB||window.indexedDB;if(!idb)throw new Error('IndexedDB 不可用');var rq=idb.open(HUD_CACHE_DB,1),done=false,tm=WIN.setTimeout(function(){if(done)return;done=true;hudCacheDbP=null;rej(new Error('HUD cache IndexedDB 打开超时'));},5000);rq.onupgradeneeded=function(){if(!rq.result.objectStoreNames.contains(HUD_CACHE_STORE))rq.result.createObjectStore(HUD_CACHE_STORE,{keyPath:'k'});};rq.onblocked=function(){if(done)return;done=true;WIN.clearTimeout(tm);hudCacheDbP=null;rej(new Error('HUD cache IndexedDB 被阻塞'));};rq.onsuccess=function(){if(done){try{rq.result.close();}catch(e){}return;}done=true;WIN.clearTimeout(tm);var db=rq.result;db.onversionchange=function(){try{db.close();}catch(e){}hudCacheDbP=null;};res(db);};rq.onerror=function(){if(done)return;done=true;WIN.clearTimeout(tm);hudCacheDbP=null;rej(rq.error||new Error('HUD cache IndexedDB 打开失败'));};}catch(e){hudCacheDbP=null;rej(e);}});return hudCacheDbP;}
function hudCachePut(k,v){var now=Date.now();hudCacheMem[k]=v;hudCacheLastTouch[k]=now;return hudCacheDb().then(function(db){return new Promise(function(res,rej){var tx=db.transaction(HUD_CACHE_STORE,'readwrite');tx.objectStore(HUD_CACHE_STORE).put({k:k,v:v,t:now});var tm=WIN.setTimeout(function(){try{tx.abort();}catch(e){}rej(new Error('cache 写入超时'));},5000);tx.oncomplete=function(){WIN.clearTimeout(tm);res(true);};tx.onerror=tx.onabort=function(){WIN.clearTimeout(tm);rej(tx.error||new Error('cache 写入失败'));};});}).catch(function(e){hudDiagError('cache put',e);return false;});}
function hudCacheTouch(k){var now=Date.now(),last=Number(hudCacheLastTouch[k]||0);if(!Object.prototype.hasOwnProperty.call(hudCacheMem,k)||now-last<6*60*60*1000)return;hudCacheLastTouch[k]=now;hudCachePut(k,hudCacheMem[k]);}
function hudCachePutMany(rows){rows=(rows||[]).filter(function(r){return r&&r.length>=2&&r[0]!=null;});if(!rows.length)return Promise.resolve(true);var now=Date.now();rows.forEach(function(r){hudCacheMem[r[0]]=r[1];hudCacheLastTouch[r[0]]=now;});return hudCacheDb().then(function(db){return new Promise(function(res,rej){var tx=null,done=false,tm=0;function fin(ok,v){if(done)return;done=true;if(tm)WIN.clearTimeout(tm);ok?res(v):rej(v);}try{tx=db.transaction(HUD_CACHE_STORE,'readwrite');var st=tx.objectStore(HUD_CACHE_STORE);rows.forEach(function(r){st.put({k:r[0],v:r[1],t:now});});tm=WIN.setTimeout(function(){try{tx.abort();}catch(e){}fin(false,new Error('cache 批量写入超时'));},8000);tx.oncomplete=function(){fin(true,true);};tx.onerror=function(){fin(false,tx.error||new Error('cache 批量写入失败'));};tx.onabort=function(){if(!done)fin(false,tx.error||new Error('cache 批量写入中止'));};}catch(e){fin(false,e);}});}).catch(function(e){hudDiagError('cache putMany',e);return false;});}
function hudCacheDeleteKeys(keys){keys=(keys||[]).filter(Boolean);keys.forEach(function(k){delete hudCacheMem[k];delete hudCacheLastTouch[k];});if(!keys.length)return Promise.resolve(true);return hudCacheDb().then(function(db){return new Promise(function(res,rej){var tx=null,done=false,tm=0;function fin(ok,v){if(done)return;done=true;if(tm)WIN.clearTimeout(tm);ok?res(v):rej(v);}try{tx=db.transaction(HUD_CACHE_STORE,'readwrite');var st=tx.objectStore(HUD_CACHE_STORE);keys.forEach(function(k){st.delete(k);});tm=WIN.setTimeout(function(){try{tx.abort();}catch(e){}fin(false,new Error('cache delete timeout'));},5000);tx.oncomplete=function(){fin(true,true);};tx.onerror=function(){fin(false,tx.error||new Error('cache delete failed'));};tx.onabort=function(){if(!done)fin(false,tx.error||new Error('cache delete aborted'));};}catch(e){fin(false,e);}});}).catch(function(e){hudDiagError('cache delete',e);return false;});}
function hudCacheDeletePrefixes(prefixes){
  prefixes=prefixes||[];Object.keys(hudCacheMem).forEach(function(k){if(prefixes.some(function(p){return k.indexOf(p)===0;})){delete hudCacheMem[k];delete hudCacheLastTouch[k];}});
  return hudCacheDb().then(function(db){return new Promise(function(res,rej){var tx=null,done=false,tm=0;function fin(ok,v){if(done)return;done=true;if(tm)WIN.clearTimeout(tm);ok?res(v):rej(v);}try{tx=db.transaction(HUD_CACHE_STORE,'readwrite');var st=tx.objectStore(HUD_CACHE_STORE),rq=st.openCursor();tm=WIN.setTimeout(function(){try{tx.abort();}catch(e){}fin(false,new Error('cache clear timeout'));},6000);rq.onsuccess=function(){var c=rq.result;if(!c)return;var k=String(c.key||'');if(prefixes.some(function(p){return k.indexOf(p)===0;}))c.delete();c.continue();};rq.onerror=function(){fin(false,rq.error||new Error('cache clear failed'));};tx.oncomplete=function(){fin(true,true);};tx.onerror=function(){fin(false,tx.error||new Error('cache clear tx failed'));};tx.onabort=function(){if(!done)fin(false,tx.error||new Error('cache clear aborted'));};}catch(e){fin(false,e);}});}).catch(function(e){hudDiagError('cache clear',e);return false;});
}

var hudCacheInitPromise=null;
function hudCacheInit(){
  if(hudCacheInitPromise)return hudCacheInitPromise;
  
  try{
    var legacy=[];
    for(var i=0;i<localStorage.length;i++){
      var k=localStorage.key(i);if(!hudIsCacheKey(k))continue;
      if(k.indexOf('pk_dexthumb_')===0){try{localStorage.removeItem(k);}catch(e){}continue;}
      var raw=localStorage.getItem(k),v=raw;try{v=JSON.parse(raw);}catch(e){}
      hudCacheMem[k]=v;legacy.push([k,v]);
    }
    if(legacy.length)hudCachePutMany(legacy).then(function(ok){if(ok)legacy.forEach(function(x){try{localStorage.removeItem(x[0]);}catch(e){}});});
  }catch(e){hudDiagError('cache legacy migrate',e);}
  hudCacheInitPromise=hudCacheDb().then(function(db){return new Promise(function(res,rej){
    var tx=null,done=false,tm=0;
    function fin(ok,v){if(done)return;done=true;if(tm)WIN.clearTimeout(tm);ok?res(v):rej(v);}
    try{
      tx=db.transaction(HUD_CACHE_STORE,'readonly');var rq=tx.objectStore(HUD_CACHE_STORE).getAll();
      tm=WIN.setTimeout(function(){try{tx.abort();}catch(e){}fin(false,new Error('HUD cache 预加载超时'));},5000);
      rq.onsuccess=function(){var rows=(rq.result||[]),now=Date.now(),remove=[];rows.sort(function(a,b){return Number(b&&b.t||0)-Number(a&&a.t||0);});var kept=0;rows.forEach(function(r){if(!r||r.k==null)return;var t=Number(r.t||now),expired=(now-t)>HUD_CACHE_TTL;if(String(r.k).indexOf('pk_dexthumb_')===0||expired||kept>=HUD_CACHE_MAX_ENTRIES){remove.push(String(r.k));return;}kept++;hudCacheLastTouch[r.k]=t;if(hudCacheMem[r.k]===undefined)hudCacheMem[r.k]=r.v;});hudCacheReady=true;hudDiagInc('cachePruned',remove.length);fin(true,true);if(remove.length)hudScope.setTimeout(function(){hudCacheDeleteKeys(remove);},0);};
      rq.onerror=function(){fin(false,rq.error||new Error('HUD cache 预加载失败'));};
      tx.onabort=function(){if(!done)fin(false,tx.error||new Error('HUD cache 预加载中止'));};
    }catch(e){fin(false,e);}
  });}).catch(function(e){hudDiagError('cache preload',e);return false;});
  return hudCacheInitPromise;
}
hudCacheInitPromise=hudCacheInit();
hudScope.cleanup(function(){try{var q=hudCacheDbP;if(q&&typeof q.then==='function')q.then(function(db){try{db.close();}catch(e){}}).catch(function(){});}catch(e){}hudCacheDbP=null;});


var HUD_DIY_ASSET_DB='pk_diy_assets_v1',HUD_DIY_ASSET_STORE='assets',HUD_DIY_SCHEME='pkidb://',hudDiyAssetDbP=null,hudDiyBlobByRef=Object.create(null),hudDiyRefByBlob=Object.create(null),hudDiyResolvePending=Object.create(null),hudVisualRefreshTimer=0;
function hudDiyAssetDb(){if(hudDiyAssetDbP)return hudDiyAssetDbP;hudDiyAssetDbP=new Promise(function(res,rej){try{var idb=WIN.indexedDB||window.indexedDB;if(!idb)throw new Error('IndexedDB 不可用');var rq=idb.open(HUD_DIY_ASSET_DB,1),done=false,tm=WIN.setTimeout(function(){if(done)return;done=true;hudDiyAssetDbP=null;rej(new Error('DIY 图片库打开超时'));},6000);rq.onupgradeneeded=function(){if(!rq.result.objectStoreNames.contains(HUD_DIY_ASSET_STORE)){var st=rq.result.createObjectStore(HUD_DIY_ASSET_STORE,{keyPath:'id'});try{st.createIndex('created_at','created_at',{unique:false});}catch(e){}}};rq.onblocked=function(){if(done)return;done=true;WIN.clearTimeout(tm);hudDiyAssetDbP=null;rej(new Error('DIY 图片库被阻塞'));};rq.onsuccess=function(){if(done){try{rq.result.close();}catch(e){}return;}done=true;WIN.clearTimeout(tm);var db=rq.result;db.onversionchange=function(){try{db.close();}catch(e){}hudDiyAssetDbP=null;};res(db);};rq.onerror=function(){if(done)return;done=true;WIN.clearTimeout(tm);hudDiyAssetDbP=null;rej(rq.error||new Error('DIY 图片库打开失败'));};}catch(e){hudDiyAssetDbP=null;rej(e);}});return hudDiyAssetDbP;}
function hudBlobHash(blob){try{var c=WIN.crypto||crypto;if(!c||!c.subtle)return Promise.resolve('asset_'+Date.now()+'_'+Math.random().toString(36).slice(2));return blob.arrayBuffer().then(function(ab){return c.subtle.digest('SHA-256',ab);}).then(function(d){return 'sha256_'+Array.prototype.slice.call(new Uint8Array(d),0,16).map(function(x){return x.toString(16).padStart(2,'0');}).join('');});}catch(e){return Promise.resolve('asset_'+Date.now()+'_'+Math.random().toString(36).slice(2));}}
function hudDataUrlBlob(v){var m=String(v||'').match(/^data:(image\/[^;,]+);base64,(.*)$/s);if(!m)throw new Error('不是图片 DataURL');var bin=atob(m[2].replace(/\s+/g,'')),a=new Uint8Array(bin.length);for(var i=0;i<bin.length;i++)a[i]=bin.charCodeAt(i);return new Blob([a],{type:m[1]||'image/png'});}
function hudDiyAssetStoreBlob(blob){if(!blob||!/^image\//i.test(String(blob.type||'')))return Promise.reject(new Error('仅支持图片'));return hudBlobHash(blob).then(function(id){return hudDiyAssetDb().then(function(db){return new Promise(function(res,rej){var tx=db.transaction(HUD_DIY_ASSET_STORE,'readwrite');tx.objectStore(HUD_DIY_ASSET_STORE).put({id:id,blob:blob,type:blob.type||'image/png',size:Number(blob.size||0),created_at:Date.now()});var tm=WIN.setTimeout(function(){try{tx.abort();}catch(e){}rej(new Error('DIY 图片写入超时'));},7000);tx.oncomplete=function(){WIN.clearTimeout(tm);var ref=HUD_DIY_SCHEME+id;try{var old=hudDiyBlobByRef[ref];if(old)URL.revokeObjectURL(old);var u=URL.createObjectURL(blob);hudDiyBlobByRef[ref]=u;hudDiyRefByBlob[u]=ref;}catch(e){}res(ref);};tx.onerror=tx.onabort=function(){WIN.clearTimeout(tm);rej(tx.error||new Error('DIY 图片写入失败'));};});});});}
function hudDiyAssetGet(ref){var id=String(ref||'').indexOf(HUD_DIY_SCHEME)===0?String(ref).slice(HUD_DIY_SCHEME.length):'';if(!id)return Promise.resolve(null);return hudDiyAssetDb().then(function(db){return new Promise(function(res,rej){var tx=db.transaction(HUD_DIY_ASSET_STORE,'readonly'),rq=tx.objectStore(HUD_DIY_ASSET_STORE).get(id);var tm=WIN.setTimeout(function(){try{tx.abort();}catch(e){}rej(new Error('DIY 图片读取超时'));},6000);rq.onsuccess=function(){WIN.clearTimeout(tm);res(rq.result||null);};rq.onerror=function(){WIN.clearTimeout(tm);rej(rq.error||new Error('DIY 图片读取失败'));};});});}
function hudHydrateDiyDomOnly(){
  try{hudResolvePkidbImages(document);}catch(e){hudDiagError('DIY hydrate document',e);}
  try{if(overlay)hudResolvePkidbImages(overlay);}catch(e){hudDiagError('DIY hydrate overlay',e);}
  try{if(pageOverlay)hudResolvePkidbImages(pageOverlay);}catch(e){hudDiagError('DIY hydrate page',e);}
  hudDiagInc('diyDomHydrates');
  return true;
}
function hudScheduleVisualRefresh(){
  if(hudVisualRefreshTimer)return;
  hudVisualRefreshTimer=hudScope.setTimeout(function(){
    hudVisualRefreshTimer=0;
    // pkidb:// -> blob: is a view-layer hydration only. Do not rebuild the HUD here:
    // rebuilding creates a new refresh button and can feed legacy external .click() bridges.
    hudHydrateDiyDomOnly();
  },80);
}
function hudDiyAssetResolve(ref){ref=String(ref||'');if(ref.indexOf(HUD_DIY_SCHEME)!==0)return Promise.resolve(ref);if(hudDiyBlobByRef[ref])return Promise.resolve(hudDiyBlobByRef[ref]);if(hudDiyResolvePending[ref])return hudDiyResolvePending[ref];hudDiyResolvePending[ref]=hudDiyAssetGet(ref).then(function(rec){if(!rec||!rec.blob)return '';var u=URL.createObjectURL(rec.blob);hudDiyBlobByRef[ref]=u;hudDiyRefByBlob[u]=ref;hudScheduleVisualRefresh();return u;}).catch(function(e){hudDiagError('DIY asset resolve',e);return '';}).finally(function(){delete hudDiyResolvePending[ref];});return hudDiyResolvePending[ref];}
function hudDiyAssetResolveSync(ref){ref=String(ref||'');if(ref.indexOf(HUD_DIY_SCHEME)!==0)return ref;if(hudDiyBlobByRef[ref])return hudDiyBlobByRef[ref];hudDiyAssetResolve(ref);return '';}

function hudDiyAssetCanonicalRef(value){
  var v=String(value||'').trim();
  if(!v)return '';
  if(v.indexOf(HUD_DIY_SCHEME)===0)return v;
  if(/^blob:/i.test(v)&&hudDiyRefByBlob[v])return String(hudDiyRefByBlob[v]||'');
  return v;
}
async function hudDiyAssetPersistValue(value){
  var v=hudDiyAssetCanonicalRef(value);if(!v)return '';
  if(v.indexOf(HUD_DIY_SCHEME)===0){
    var rec=await hudDiyAssetGet(v);
    if(!rec||!rec.blob)throw new Error('HUD 本地图片引用已丢失');
    return v;
  }
  if(/^data:image\//i.test(v))return await hudDiyAssetStoreBlob(hudDataUrlBlob(v));
  if(/^blob:/i.test(v)){
    var known=hudDiyRefByBlob[v];
    if(known){
      var knownRec=await hudDiyAssetGet(known);
      if(knownRec&&knownRec.blob)return known;
    }
    
    var wins=[];
    try{wins.push(window);}catch(e){}
    try{if(WIN&&wins.indexOf(WIN)<0)wins.push(WIN);}catch(e){}
    var last=null;
    for(var i=0;i<wins.length;i++){
      var w=wins[i];
      try{
        if(!w||typeof w.fetch!=='function')continue;
        var r=await w.fetch(v,{credentials:'omit',referrerPolicy:'no-referrer'});
        if(!r.ok)throw new Error('HTTP '+r.status);
        var b=await r.blob();
        if(!/^image\//i.test(String(b.type||'')))throw new Error('blob 不是图片');
        return await hudDiyAssetStoreBlob(b);
      }catch(e){last=e;}
    }
    throw last||new Error('HUD blob 已失效');
  }
  
  return v;
}
function hudDiyAssetToDataUrl(ref){ref=String(ref||'');if(/^data:image\//i.test(ref))return Promise.resolve(ref);if(ref.indexOf(HUD_DIY_SCHEME)!==0)return Promise.resolve(ref);return hudDiyAssetGet(ref).then(function(rec){if(!rec||!rec.blob)throw new Error('本地 DIY 图片引用已丢失');return new Promise(function(res,rej){var rd=new FileReader();rd.onload=function(){res(String(rd.result||''));};rd.onerror=function(){rej(new Error('DIY 图片读取失败'));};rd.readAsDataURL(rec.blob);});});}
function hudDiyImgAttrs(ref){ref=String(ref||'').trim();if(ref.indexOf(HUD_DIY_SCHEME)===0){var u=hudDiyAssetResolveSync(ref);return (u?'src="'+esc(u)+'" ':'src="" ')+'data-pkidb="'+esc(ref)+'"';}return 'src="'+esc(ref)+'"';}
function hudDiyImgTag(ref,extra){ref=String(ref||'').trim();extra=extra||'';if(ref.indexOf(HUD_DIY_SCHEME)===0){var u=hudDiyAssetResolveSync(ref);if(u)return '<img src="'+esc(u)+'" '+extra+'>';return '<img data-pkidb="'+esc(ref)+'" '+extra+'>';}return '<img src="'+esc(ref)+'" '+extra+'>';}
function hudResolvePkidbImages(root){try{var list=(root||document).querySelectorAll('img[data-pkidb]');for(var i=0;i<list.length;i++)(function(el){var ref=el.getAttribute('data-pkidb');hudDiyAssetResolve(ref).then(function(u){if(u&&el&&el.isConnected)el.src=u;});})(list[i]);}catch(e){hudDiagError('DIY hydrate DOM',e);}}
hudScope.cleanup(function(){try{var q=hudDiyAssetDbP;if(q&&typeof q.then==='function')q.then(function(db){try{db.close();}catch(e){}}).catch(function(){});}catch(e){}hudDiyAssetDbP=null;Object.keys(hudDiyBlobByRef).forEach(function(r){try{URL.revokeObjectURL(hudDiyBlobByRef[r]);}catch(e){}});hudDiyBlobByRef={};hudDiyRefByBlob={};});
var css="#pkm-hud-win,#pkm-hud-inline{--frame:#7d95b5;--text:#c6d1e4;--dim:#8ba0b8;--hp:#32CD32;--male:#00BFFF;--female:#FF4500}:where(#pkm-hud-win,#pkm-hud-inline) *{box-sizing:border-box;margin:0;padding:0}:where(#pkm-hud-btn){box-sizing:border-box}#pkm-hud-win,#pkm-hud-inline{font-family:\"Segoe UI\",\"Helvetica Neue\",\"PingFang SC\",\"Microsoft YaHei\",monospace;color:var(--text)}.hud{--hud-pad:clamp(10px,3vw,14px);max-width:600px;margin:16px auto;padding:var(--hud-pad);border-radius:10px;position:relative;background-color:#0f1626;box-shadow:0 8px 24px rgba(0,0,0,.6);display:flex;flex-direction:column;overflow:hidden}.hud::before{content:\"\";position:absolute;top:0;left:0;right:0;bottom:0;border-radius:inherit;z-index:0;pointer-events:none;background-image:repeating-linear-gradient(0deg,rgba(150,180,220,.14) 0 2px,transparent 2px 10px,rgba(255,255,255,.05) 10px 11px,transparent 11px 20px,rgba(255,255,255,.05) 20px 21px,transparent 21px 30px,rgba(255,255,255,.05) 30px 31px,transparent 31px 40px,rgba(255,255,255,.05) 40px 41px,transparent 41px 50px),repeating-linear-gradient(90deg,rgba(150,180,220,.14) 0 2px,transparent 2px 10px,rgba(255,255,255,.05) 10px 11px,transparent 11px 20px,rgba(255,255,255,.05) 20px 21px,transparent 21px 30px,rgba(255,255,255,.05) 30px 31px,transparent 31px 40px,rgba(255,255,255,.05) 40px 41px,transparent 41px 50px)}.hud-inner{position:relative;z-index:1;flex:0 0 auto;height:560px;overflow:hidden}@media(max-width:430px){.hud-inner{height:470px}}.tab-panel{display:none;height:100%;max-height:none;overflow-y:auto;overflow-x:hidden;padding-right:4px;overscroll-behavior:contain;-webkit-overscroll-behavior:contain}.tab-panel.active{display:block}.tab-panel::-webkit-scrollbar{width:5px}.tab-panel::-webkit-scrollbar-thumb{background:rgba(170,204,255,.4);border-radius:3px}.tab-bar{position:relative;z-index:2;flex:0 0 auto;display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:10px}.tab-btn{padding:6px 0;font-family:inherit;font-size:.78rem;font-weight:800;text-align:center;border:1px solid var(--frame);background:rgba(170,204,255,.12);color:var(--text);border-radius:4px;cursor:pointer}.tab-btn.active{background:rgba(43,74,111,.8);color:#fff}.menu-item{position:relative;background:rgba(43,74,111,.35);border:1px solid var(--frame);border-radius:0;cursor:pointer;transition:background .15s,transform .08s}.menu-item:hover{background:rgba(170,204,255,.10)}.menu-item:active{transform:translateY(2px)}.menu-label{font-size:.78rem;font-weight:800;color:var(--text);text-shadow:1px 1px 0 #000}.card-bg-svg{position:absolute;inset:0;width:100%;height:100%;z-index:0;pointer-events:none}.page-overlay{position:absolute;inset:0;background:rgba(10,16,30,.45);backdrop-filter:blur(7px);-webkit-backdrop-filter:blur(7px);display:none;align-items:center;justify-content:center;z-index:500;padding:12px}.page-overlay.open{display:flex}.page{position:relative;width:100%;max-width:600px;max-height:100%;overflow-y:auto;background-color:#0f1626;border:2px solid var(--frame);border-radius:10px;box-shadow:0 0 14px rgba(170,204,255,.5)}.page-overlay.popout{position:fixed;inset:0;z-index:2147483601;padding:10px;align-items:safe center;justify-content:center}.page-overlay.popout.map-focus{z-index:2147483647;background:radial-gradient(circle at 50% 46%,rgba(19,35,58,.20) 0,rgba(7,12,24,.64) 58%,rgba(4,8,18,.78) 100%);backdrop-filter:blur(12px) saturate(.74) brightness(.66);-webkit-backdrop-filter:blur(12px) saturate(.74) brightness(.66);isolation:isolate;overscroll-behavior:contain}.page-overlay.popout.map-focus:before{content:\"\";position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,rgba(12,22,38,.10),rgba(3,7,16,.22));z-index:0}.page-overlay.popout.map-focus .page{position:relative;z-index:1;filter:none;backdrop-filter:none;-webkit-backdrop-filter:none;box-shadow:0 18px 60px rgba(0,0,0,.58),0 0 0 1px rgba(124,196,248,.10)}.hud.page-child-open>:not(.page-overlay),.hud.modal-child-open>:not(.overlay){pointer-events:none!important}.page-overlay.popout .page{box-sizing:border-box;max-width:min(94vw,900px);max-height:86vh;overflow:hidden}.page-overlay.popout .page-body{max-height:calc(86vh - 44px);overflow:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch}.page-overlay.popout .page::before{background-image:none}.page::before{content:\"\";position:absolute;top:0;left:0;right:0;bottom:0;border-radius:8px;z-index:0;pointer-events:none;background-image:repeating-linear-gradient(0deg,rgba(150,180,220,.14) 0 2px,transparent 2px 10px,rgba(255,255,255,.05) 10px 11px,transparent 11px 20px,rgba(255,255,255,.05) 20px 21px,transparent 21px 30px,rgba(255,255,255,.05) 30px 31px,transparent 31px 40px,rgba(255,255,255,.05) 40px 41px,transparent 41px 50px),repeating-linear-gradient(90deg,rgba(150,180,220,.14) 0 2px,transparent 2px 10px,rgba(255,255,255,.05) 10px 11px,transparent 11px 20px,rgba(255,255,255,.05) 20px 21px,transparent 21px 30px,rgba(255,255,255,.05) 30px 31px,transparent 31px 40px,rgba(255,255,255,.05) 40px 41px,transparent 41px 50px)}.page-head{z-index:2;display:flex;align-items:center;justify-content:flex-end;padding:4px 10px;border-bottom:1px solid rgba(170,204,255,.3);background:rgba(43,74,111,.7);position:sticky;top:0}.page-close{background:none;border:none;color:var(--text);font-size:1.3rem;cursor:pointer;opacity:.8}.page-close:hover{opacity:1}.page-body{position:relative;z-index:1;padding:14px}.grid{display:flex;gap:clamp(6px,2vw,12px);align-items:flex-start}.col{flex:1 1 0;display:flex;flex-direction:column;gap:clamp(8px,2vw,12px);min-width:0}.col+.col{margin-top:clamp(8px,3.5vw,18px)}.card-frame,.empty-frame{position:relative;background:transparent;filter:drop-shadow(0 0 6px rgba(125,149,181,.15))}.card-frame{cursor:pointer;transition:transform .12s ease,filter .12s ease}.card-frame:hover{transform:translateY(-2px);filter:drop-shadow(0 0 10px rgba(125,149,181,.3))}.empty-frame{filter:none}.card-inner,.empty-inner{position:relative;z-index:1;min-height:clamp(52px,13.5vw,68px)}.card-inner{display:flex;flex-direction:column;gap:clamp(2px,.6vw,4px);padding:clamp(4px,1vw,6px) clamp(10px,2.2vw,14px)}.empty-inner{display:flex;align-items:center;justify-content:center}.empty-txt{color:var(--dim);font-size:clamp(.68rem,2.6vw,.78rem);letter-spacing:2px;opacity:.7}.pk-top{display:flex;align-items:center;gap:clamp(5px,1.5vw,8px);flex:1;min-height:0}.pk-side{display:flex;flex-direction:column;align-items:flex-start;flex-shrink:0;padding:0}.pk-img{width:clamp(26px,8vw,34px);height:clamp(26px,8vw,34px);background-size:contain;background-repeat:no-repeat;background-position:center;image-rendering:pixelated;filter:drop-shadow(0 2px 3px rgba(0,0,0,.5))}.pk-img.no-img{display:flex;align-items:center;justify-content:center;color:var(--dim);font-size:1rem;filter:none}.pk-img.fainted{filter:grayscale(1) brightness(.6) drop-shadow(0 2px 3px rgba(0,0,0,.5))}.pk-info{flex:1;display:flex;flex-direction:column;justify-content:center;gap:clamp(1px,.4vw,2px);min-width:0}.name-row{display:flex;justify-content:space-between;align-items:center;gap:6px}.pk-name{font-weight:800;font-size:clamp(.74rem,2.8vw,.88rem);color:var(--text);text-shadow:1px 1px 0 #000;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.shiny{color:#ffe066;text-shadow:0 0 4px rgba(255,224,102,.8);margin-left:3px}.gender-sym{font-weight:800;font-size:clamp(.85rem,3vw,.95rem);line-height:1;flex-shrink:0}.gender-sym.m{color:var(--male);text-shadow:0 0 5px rgba(0,191,255,.9)}.gender-sym.f{color:var(--female);text-shadow:0 0 5px rgba(255,69,0,.9)}.bar-row{display:flex;align-items:center;gap:clamp(3px,1vw,5px)}.bar-stack{flex:1;display:flex;flex-direction:column;gap:1px;min-width:0}.hp-label{font-size:clamp(.56rem,2vw,.62rem);font-weight:800;color:var(--text);opacity:.9;letter-spacing:1px;flex-shrink:0;text-shadow:0 0 2px rgba(0,0,0,.6)}.hp-bar{width:100%;height:clamp(3px,1vw,5px);background:rgba(0,0,0,.72);border-radius:999px;overflow:hidden;box-shadow:inset 0 1px 2px rgba(0,0,0,.6)}.hp-fill{height:100%;border-radius:999px;transition:width .35s}.hp-fill.hp-high{background:linear-gradient(180deg,#4ade80,#32CD32);box-shadow:0 0 4px rgba(50,205,50,.7)}.hp-fill.hp-mid{background:linear-gradient(180deg,#facc15,#eab308);box-shadow:0 0 4px rgba(250,204,21,.7)}.hp-fill.hp-low{background:linear-gradient(180deg,#f87171,#ef4444);box-shadow:0 0 4px rgba(239,68,68,.7)}.exp-bar{width:100%;height:clamp(2px,.55vw,3px);background:rgba(0,0,0,.72);border-radius:999px;overflow:hidden;box-shadow:inset 0 1px 2px rgba(0,0,0,.6)}.exp-fill{height:100%;border-radius:999px;background:linear-gradient(180deg,#7cc4f8,#4a9dd8);box-shadow:0 0 3px rgba(124,196,248,.6);transition:width .35s}.bottom-row{display:flex;justify-content:space-between;align-items:center;width:100%}.pk-level,.hp-num{font-size:clamp(.66rem,2.5vw,.78rem);font-weight:800;color:var(--text);text-shadow:1px 1px 0 #000;line-height:1}.hp-num{text-align:right}.info-frame{position:relative;z-index:1;background:transparent;filter:drop-shadow(0 0 6px rgba(125,149,181,.15));margin-bottom:clamp(10px,2.5vw,14px)}.info-inner{position:relative;z-index:1;padding:clamp(10px,2.5vw,14px) clamp(12px,3vw,16px) clamp(10px,2.5vw,14px) clamp(8px,2.5vw,12px)}.info-title{font-weight:800;font-size:clamp(.8rem,3vw,.95rem);color:var(--text);margin-bottom:8px;letter-spacing:1px;text-shadow:1px 1px 0 #000}.info-row{display:flex;align-items:baseline;justify-content:space-between;gap:10px;padding:5px 0;border-bottom:1px dashed rgba(170,204,255,.25);font-size:clamp(.78rem,2.6vw,.88rem);color:var(--text)}.info-row:last-child{border-bottom:none}.info-row .k{color:var(--dim);flex-shrink:0;font-weight:600}.info-row .v{text-align:right;word-break:break-word}.info-row-click{cursor:pointer;border-radius:4px;transition:background .15s}.info-row-click:hover{background:rgba(170,204,255,.10)}.cu-total{display:flex;justify-content:space-between;gap:10px;padding:6px 0 4px;font-size:.9rem;font-weight:800;color:var(--text)}.cu-bar{height:7px;border-radius:4px;background:rgba(170,204,255,.15);overflow:hidden;margin:6px 0 10px}.cu-bar>i{display:block;height:100%}.cmd-panel{border:1px solid var(--frame);border-radius:6px;background:rgba(43,74,111,.22);margin-bottom:10px;padding:0 10px 8px}.cmd-panel>summary{cursor:pointer;font-size:.82rem;font-weight:800;padding:7px 0;list-style:none}.cmd-panel>summary::-webkit-details-marker{display:none}.src-fold{border:1px solid var(--frame);border-radius:6px;background:rgba(43,74,111,.22);margin:8px 0 10px;padding:0 10px 8px}.src-fold>summary{cursor:pointer;font-size:.82rem;font-weight:800;padding:7px 0;list-style:none;color:var(--text)}.src-fold>summary::-webkit-details-marker{display:none}.cmd-btn{flex:1;min-width:0;text-align:left;padding:6px 10px;font-family:inherit;font-size:.8rem;color:var(--text);background:rgba(43,74,111,.6);border:1px solid var(--frame);border-radius:4px;cursor:pointer}.cmd-btn:hover{filter:brightness(1.2)}.cmd-tip{flex:0 0 30px;padding:6px 0;font-family:inherit;font-size:.8rem;font-weight:800;color:var(--dim);background:rgba(170,204,255,.12);border:1px solid var(--frame);border-radius:4px;cursor:pointer}.info-row.cmd{justify-content:space-between;gap:10px;padding-right:clamp(10px,2.5vw,14px)}.info-row.cmd .v{text-align:right}.info-row.block{flex-direction:column;align-items:flex-start;gap:2px}.info-row.block .v{text-align:left;word-break:break-word}.heart{color:#f05060;font-size:.95rem;margin-left:2px}#badge-cycle{cursor:pointer;border-radius:4px;padding:0 4px}#badge-cycle:hover{background:rgba(170,204,255,.14)}.badge-line{display:flex;align-items:center;gap:6px;width:100%;margin-top:3px;padding-left:10px}#badge-entry .v{width:100%}.badge-region{font-size:.72rem;color:var(--dim);flex-shrink:0}.badge-cnt{display:none}.badge-row{display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end;margin-left:auto}.badge-cell{width:22px;height:22px;display:inline-flex;align-items:center;justify-content:center}.badge-cell img{width:22px;height:22px;object-fit:contain}.badge-cell.off img{filter:grayscale(1) brightness(.45);opacity:.45}.badge-more{font-size:.7rem;color:var(--dim)}.badge-tabs{display:flex;gap:4px;overflow-x:auto;padding-bottom:6px;margin-bottom:8px}.badge-tab{flex:0 0 auto;padding:2px 12px;font-family:inherit;font-size:.72rem;border:1px solid var(--frame);background:rgba(170,204,255,.12);color:var(--text);border-radius:4px;cursor:pointer}.badge-tab.active{background:rgba(43,74,111,.8);color:#fff}.badge-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.badge-item{display:flex;flex-direction:column;align-items:center;gap:2px}.badge-item img{width:44px;height:44px;object-fit:contain}.badge-item.off img{filter:grayscale(1) brightness(.45);opacity:.4}.badge-name{font-size:.66rem;color:var(--text);text-align:center;line-height:1.3}.badge-item.off .badge-name{color:var(--dim)}.heart.empty{color:#888;opacity:.35}.nearby-item{display:flex;align-items:center;gap:8px;padding:6px 8px;border-bottom:1px dashed rgba(170,204,255,.25);font-size:.85rem;border-radius:6px;cursor:pointer;transition:background .12s}.nearby-item:hover{background:rgba(170,204,255,.08)}.nearby-item:last-child{border-bottom:none}.nearby-info{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}.nearby-name{font-weight:800;font-size:.85rem;color:var(--text)}.nearby-sub{font-size:.75rem;color:var(--dim)}.ailment{display:inline-block;font-size:.62rem;padding:0 4px;border-radius:3px;margin-left:4px;color:#fff;font-weight:800;background:rgba(170,204,255,.35)}.ailment.par{background:#f8d830;color:#333}.ailment.psn{background:#a040a0}.ailment.brn{background:#f08030}.ailment.slp{background:#6890f0}.ailment.frz{background:#98d8d8;color:#123}.ailment.cnf{background:#f85888}.ailment.fnt{background:#6b7280;color:#fff}.gender-side{display:inline-flex;align-items:center;gap:3px;flex-shrink:0}.types{display:flex;flex-wrap:wrap;gap:6px;justify-content:flex-end}.type-chip{color:#fff;padding:1px 8px;border-radius:8px;font-size:.72rem;font-weight:800;line-height:1.4;text-shadow:0 1px 1px rgba(0,0,0,.3);white-space:nowrap}.task-item{padding:5px 0;font-size:.85rem;border-bottom:1px dashed rgba(170,204,255,.25);color:var(--text)}.task-item:last-child{border-bottom:none}.task-tag{display:inline-block;font-size:.68rem;padding:0 5px;border-radius:3px;color:#fff;margin-bottom:3px}.task-tag.main{background:#e05050}.task-tag.legend{background:#d8b830}.task-tag.random{background:#999}.task-text{line-height:1.55;color:#dce9ff;word-break:break-word}.event-item{padding:2px 0;border-bottom:none}.event-type{font-weight:800;font-size:.82rem;color:var(--text)}.event-item p{font-size:.8rem;color:#dce9ff;font-weight:400;letter-spacing:.2px;margin-top:1px;line-height:1.45}.world-frame .info-inner{padding-top:5px;padding-bottom:5px}.world-frame .info-title{margin-bottom:3px}.rel-item{display:flex;align-items:center;gap:6px;padding:5px 0;font-size:.82rem;color:var(--text)}.rel-name{width:60px;text-align:left;flex-shrink:0;color:var(--dim);font-weight:600}.rel-bar{flex:1;height:8px;background:rgba(0,0,0,.4);border-radius:4px;overflow:hidden}.rel-fill{height:100%;background:#f08888;border-radius:4px}.rel-val{width:30px;text-align:right;flex-shrink:0;color:var(--dim)}.empty{text-align:center;padding:10px 0;color:var(--dim);letter-spacing:2px;font-size:.82rem}.bag-tabs{display:flex;gap:4px;margin-bottom:5px;justify-content:flex-end}.bag-tab{flex:0 0 auto;padding:2px 14px;font-family:inherit;font-size:.72rem;text-align:center;border:1px solid var(--frame);background:rgba(170,204,255,.12);color:var(--text);border-radius:4px;cursor:pointer}.bag-tab.active{background:rgba(43,74,111,.8);color:#fff}.bag-list{display:flex;flex-direction:column;gap:6px;max-height:min(280px,46vh);overflow-y:auto;padding-right:4px}.item-entry{display:flex;align-items:center;gap:8px;padding:6px 0;padding-right:clamp(8px,2vw,12px);border-bottom:1px dashed rgba(170,204,255,.25)}.fold-inner .item-entry:last-child{padding-right:clamp(8px,2vw,12px)}.item-entry:last-child{border-bottom:none}.item-icon-wrap{width:28px;height:28px;flex-shrink:0;display:flex;align-items:center;justify-content:center}.item-icon{width:28px;height:28px;object-fit:contain;flex-shrink:0}.item-icon.placeholder{display:flex;align-items:center;justify-content:center;color:var(--dim);background:rgba(170,204,255,.12);border-radius:4px;width:28px;height:28px}.item-name{flex:1;font-size:.85rem;color:var(--text)}.item-count{font-size:.85rem;color:var(--dim)}.bag-list>.item-entry{display:grid;grid-template-columns:28px minmax(0,1fr) 36px 58px;column-gap:8px;align-items:center;padding-right:clamp(8px,2vw,12px)}.bag-list>.item-entry .item-icon-wrap{width:28px;min-width:28px}.bag-list>.item-entry .item-name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.bag-list>.item-entry .item-count{width:36px;min-width:36px;text-align:right;justify-self:end}.bag-list>.item-entry>[data-bag-discard]{width:58px;min-width:58px;justify-self:end;text-align:center;padding-left:6px;padding-right:6px}.box-select{background:rgba(43,74,111,.7);color:#fff;border:1px solid var(--frame);border-radius:4px;padding:1px 14px;font-family:inherit;font-size:.75rem;margin-bottom:5px;width:auto;min-width:120px;text-align:center;text-align-last:center;float:right}.box-cell{display:flex;flex-direction:column;align-items:center;padding:6px;cursor:pointer;border-radius:6px;transition:background .12s}.box-cell:hover{background:rgba(170,204,255,.08)}.box-icon{width:48px;height:48px}.btn-small{padding:4px 10px;font-family:inherit;font-size:.78rem;border:1px solid var(--frame);background:rgba(43,74,111,.7);color:#fff;border-radius:4px;cursor:pointer;flex-shrink:0}.btn-small:hover{filter:brightness(1.15)}.overlay{position:absolute;inset:0;background:rgba(10,16,30,.45);backdrop-filter:blur(7px);-webkit-backdrop-filter:blur(7px);display:none;align-items:center;justify-content:center;z-index:1000;padding:12px}.overlay.open{display:flex}.modal{max-width:420px;width:100%;border:2px solid var(--frame);border-radius:8px;background-color:#0f1626;box-shadow:0 0 14px rgba(170,204,255,.5);overflow:hidden;max-height:100%;overflow-y:auto}.modal-head{display:flex;align-items:center;gap:10px;padding:12px;border-bottom:1px solid rgba(170,204,255,.3);background:rgba(43,74,111,.7)}.modal-name{font-weight:800;font-size:1.05rem;color:var(--text)}.close{margin-left:auto;background:none;border:none;color:var(--text);font-size:1.2rem;cursor:pointer;opacity:.8}.close:hover{opacity:1}.modal-body{padding:10px 14px 14px}.pkm-big{position:relative;display:flex;align-items:center;justify-content:center;min-height:130px;padding:6px 0;border-bottom:1px dashed rgba(170,204,255,.25)}.pkm-big-img{width:120px;height:120px;object-fit:contain;filter:drop-shadow(0 3px 8px rgba(0,0,0,.6));cursor:pointer}.pkm-shiny-tag{position:absolute;top:6px;right:10px;font-size:.68rem;font-weight:800;color:#ffe066;text-shadow:0 0 6px rgba(255,224,102,.8);pointer-events:none}.pkm-shiny-tag.off{color:#8ba0b8;text-shadow:none}.abi-link{text-decoration:underline;text-underline-offset:2px;cursor:pointer}.abi-link:hover{color:#7cc4f8}.pkm-forms{display:flex;flex-wrap:wrap;gap:6px;padding:6px 0;border-bottom:1px dashed rgba(170,204,255,.25)}.pkm-form-btn.active{background:rgba(43,74,111,.9);border-color:#7cc4f8}.row{display:flex;justify-content:space-between;gap:10px;padding:6px 0;border-bottom:1px dashed rgba(170,204,255,.25);font-size:.85rem;color:var(--text)}.row:last-child{border-bottom:none}.row .k{color:var(--dim);flex-shrink:0}.row .v{text-align:right}.row.block{flex-direction:column;align-items:flex-start;gap:2px}.row.block .v{text-align:left;word-break:break-word}.ball-icon{width:26px;height:26px;vertical-align:middle;image-rendering:pixelated;margin-right:2px}.moves{display:grid;grid-template-columns:1fr 1fr;gap:6px;flex:1;min-width:0}.move-cell{border:1px solid;border-radius:6px;padding:4px 6px;display:flex;flex-direction:column;gap:2px}.move-name{font-weight:800;font-size:.8rem;color:var(--text)}.move-type{display:inline-block;color:#fff;padding:0 5px;border-radius:8px;font-size:.66rem;line-height:1.4}.move-cat-ic{width:13px;height:13px;object-fit:contain;vertical-align:-2px}.dim{color:var(--dim)}.action-img{width:64px;height:64px}.action-btns{display:flex;flex-direction:column;gap:8px}.act-btn{display:block;width:100%;padding:9px;font-family:inherit;font-size:.9rem;font-weight:800;cursor:pointer;border-radius:6px;border:2px solid var(--frame);background:rgba(43,74,111,.7);color:#fff;transition:filter .15s,transform .08s}.act-btn:hover{filter:brightness(1.15)}.act-btn:active{transform:translateY(1px)}.env-strip{display:flex;flex-direction:column;gap:4px;padding:6px 10px;margin-bottom:10px;border:1px solid var(--frame);border-radius:6px;background:rgba(25,40,65,.5);font-size:.72rem;color:var(--text)}.env-strip .env-line{display:flex;flex-wrap:wrap;align-items:center;gap:4px 12px;min-width:0}.env-strip .env-item{min-width:0;word-break:break-word;line-height:1.45}.pk-lv-wrap{display:inline-flex;align-items:center;gap:5px;font-size:clamp(.66rem,2.5vw,.78rem)}.dex-search{margin-bottom:6px;padding-left:clamp(6px,2vw,12px)}.dex-search input{width:100%;max-width:260px;padding:5px 10px;font-family:inherit;font-size:.8rem;background:rgba(43,74,111,.5);border:1px solid var(--frame);border-radius:4px;color:var(--text)}.dex-search input:focus{outline:none;border-color:#7cc4f8}.dex-cell.dex-hit{box-shadow:0 0 0 2px #7cc4f8;border-color:#7cc4f8}.dex-count{font-size:.8rem;color:var(--dim);margin-bottom:8px;padding-left:clamp(6px,2vw,12px)}.pokedex{display:grid;grid-template-columns:repeat(auto-fill,minmax(86px,1fr));gap:6px;max-height:440px;overflow-y:auto;padding-left:clamp(6px,2vw,12px);padding-right:4px;min-width:0}.info-inner:has(.pokedex) .info-title{position:sticky;top:0;z-index:6}.dex-cell{display:flex;flex-direction:column;align-items:center;gap:2px;padding:8px 4px;border-radius:6px;border:1px solid var(--frame);background:rgba(43,74,111,.25);min-width:0;overflow:hidden;cursor:pointer}.dex-cell:hover{filter:brightness(1.2)}.dex-cell[data-noclick]{cursor:default}.dex-cell.caught{background:rgba(50,205,50,.12);border-color:rgba(50,205,50,.6)}.dex-cell.seen{background:rgba(170,204,255,.08);border-color:rgba(170,204,255,.35)}.dex-cell.unknown{background:rgba(0,0,0,.25);border-color:rgba(255,255,255,.08)}.dex-no{font-size:.6rem;color:var(--dim);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}.dex-name{font-size:.72rem;font-weight:800;text-align:center;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}.dex-cell.unknown .dex-name{color:rgba(150,170,190,.5)}.dex-cell.unknown .dex-types{visibility:hidden}.dex-img{width:100%;height:44px;display:flex;align-items:center;justify-content:center}.dex-img img{width:100%;height:100%;object-fit:contain}.dex-cell.unknown .dex-img img{filter:brightness(0) opacity(.45) !important}.pokedex.list-only{grid-template-columns:1fr;gap:3px}.pokedex.list-only .dex-cell{flex-direction:row;align-items:center;gap:8px;padding:3px 8px;text-align:left}.pokedex.list-only .dex-img{display:none}.pokedex.list-only .dex-no{flex:0 0 auto;min-width:42px;text-align:left}.pokedex.list-only .dex-name{text-align:left}.dex-tabs-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;margin-bottom:8px;padding-bottom:6px;padding-left:8%;padding-right:4%}.dex-tabs-scroll::-webkit-scrollbar{display:none}.dex-tabs-grid{display:grid;grid-template-columns:repeat(7,max-content);gap:4px;width:max-content}.dex-thumb-btn{padding:0 6px;font-size:.68rem;line-height:1.5;font-family:inherit;border:1px solid var(--frame);background:rgba(43,74,111,.7);color:#fff;border-radius:4px;cursor:pointer;float:right;margin-left:6px}.dex-filter-bar{display:flex;flex-wrap:nowrap;gap:4px;margin-bottom:6px;padding-left:8%;padding-right:4%;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none}.dex-filter-bar::-webkit-scrollbar{display:none}.dex-filter-btn{flex:0 0 auto;white-space:nowrap;padding:3px 9px;font-size:.72rem;line-height:1.5;font-family:inherit;border:1px solid var(--frame);background:rgba(43,74,111,.5);color:var(--dim);border-radius:4px;cursor:pointer}.dex-filter-btn:hover{filter:brightness(1.2)}.dex-filter-btn.active{color:#fff;background:rgba(43,74,111,.92);border-color:#7cc4f8}.dex-filter-btn[data-f=\"caught\"].active{background:rgba(50,205,50,.25);border-color:rgba(50,205,50,.7);color:#d5ffd5}.dex-filter-btn[data-f=\"seen\"].active{background:rgba(170,204,255,.25);border-color:rgba(170,204,255,.6);color:#e6f0ff}.dex-filter-btn[data-f=\"unknown\"].active{background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.35);color:#e8e8e8}.item-badge{height:1em;width:auto;image-rendering:pixelated;object-fit:contain;flex-shrink:0;transform:scale(1.5);transform-origin:center}.info-title{margin-left:8%}.info-row.cmd,.info-row:last-child,.task-item:last-child,.event-item:last-child{padding-right:7%}.card-inner{padding-left:8%;padding-right:7%}.bottom-row{padding:0}.empty-inner{padding-left:8%}.dex-search,.dex-count,.pokedex{padding-left:8%}.battle-list .bt-item{padding-left:8%}.battle-list .bt-text{padding-left:0}.grid{margin-bottom:clamp(12px,3vw,18px)}.badge-tabs{padding-left:9%;padding-right:4%;scrollbar-width:none}.badge-tabs::-webkit-scrollbar{display:none}.set-title{font-weight:800;font-size:.85rem;color:var(--text);margin-bottom:8px}.set-opts{display:flex;flex-direction:column;gap:7px;margin-bottom:10px}.set-opt{display:flex;align-items:center;gap:6px;font-size:.85rem;color:var(--text);cursor:pointer}.set-opt input{margin:0;accent-color:#7cc4f8}.detail-modal{max-width:560px;position:relative}.detail-modal .modal-body{padding-bottom:64px}.dt-top{width:100%;display:flex;align-items:center;gap:2px;justify-content:center}.dt-ball{width:24px;height:24px}.dt-name{font-weight:800;font-size:clamp(.95rem,3.2vw,1.15rem);color:var(--text);text-shadow:1px 1px 0 #000;white-space:nowrap}.dt-big{width:96px;height:96px;background-size:contain;background-repeat:no-repeat;background-position:center;image-rendering:pixelated}.dt-sprite{display:flex;justify-content:center;align-items:center;margin:8px 0}.dt-hold{margin-top:0;font-size:.8rem;color:var(--text);text-align:center}.tr-env{font-size:.72rem;font-weight:400;letter-spacing:0;text-shadow:none;color:var(--dim);display:inline-flex;flex-wrap:wrap;gap:2px 8px;min-width:0;max-width:100%}.tr-env span{min-width:0;overflow-wrap:anywhere;word-break:break-word}.battle-frame{border:1px solid var(--frame);border-radius:10px;background:rgba(43,74,111,.22);overflow:hidden;filter:none}.battle-frame .info-inner{padding:8px 12px}.battle-frame .info-title{margin-left:0}.plain-frame{border:1px solid var(--frame);border-radius:10px;background:rgba(43,74,111,.22);overflow:hidden;filter:none}.plain-frame .info-inner{padding:8px 12px}.plain-frame .info-title{margin-left:0}.plain-frame .info-row{padding-left:0}.plain-frame .info-row.cmd,.plain-frame .info-row:last-child,.plain-frame .task-item:last-child,.plain-frame .event-item:last-child{padding-right:0}@media(orientation:landscape){.dt-top{justify-content:center}}.nb-grid{display:flex;flex-wrap:nowrap;align-items:stretch;gap:9px;padding:0 4% 4px 5%;overscroll-behavior-x:contain;overflow-x:auto;overflow-y:hidden;-webkit-overflow-scrolling:touch;scroll-snap-type:x proximity;scrollbar-width:thin;scrollbar-color:rgba(170,204,255,.4) transparent}.nb-grid::-webkit-scrollbar{height:5px}.nb-grid::-webkit-scrollbar-thumb{background:rgba(170,204,255,.4);border-radius:3px}.nb-grid::-webkit-scrollbar-track{background:transparent}.nb-grid::after{content:\"\";flex:0 0 6px}.nb-grid>.nb-cell{flex:0 0 auto;width:clamp(92px,26vw,118px);scroll-snap-align:start}.nb-cell,.nearby-grid .nearby-cell{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:5px;padding:9px 6px 9px;border:1px solid rgba(125,149,181,.32);border-radius:13px;background:linear-gradient(180deg,rgba(42,66,101,.52),rgba(13,20,35,.92));box-shadow:inset 0 0 0 1px rgba(255,255,255,.025),0 4px 11px rgba(0,0,0,.34);cursor:pointer;min-width:0;overflow:hidden;isolation:isolate;transition:transform .14s ease,box-shadow .14s ease,filter .14s ease}.nb-cell::before,.nearby-grid .nearby-cell::before{content:\"\";position:absolute;inset:1px;border-radius:12px;pointer-events:none;background:linear-gradient(135deg,rgba(255,255,255,.045),transparent 38%,rgba(255,255,255,.015));z-index:0}.nb-aura{position:absolute;inset:-20%;pointer-events:none;z-index:0;opacity:0;background:radial-gradient(circle at 35% 35%,var(--nb-soft1),transparent 45%),radial-gradient(circle at 75% 70%,var(--nb-soft2),transparent 42%)}.nb-edge{position:absolute;left:0;right:0;top:0;height:4px;background:linear-gradient(90deg,var(--nb-accent1),rgba(255,255,255,.85),var(--nb-accent2));opacity:.92;pointer-events:none;z-index:3}.nb-cell:hover,.nearby-grid .nearby-cell:hover{transform:translateY(-2px);filter:brightness(1.06);box-shadow:inset 0 0 0 1px rgba(255,255,255,.05),0 9px 20px rgba(0,0,0,.4),0 0 0 1px var(--nb-soft2)}.nb-cell.is-legendary,.nearby-grid .nearby-cell.is-legendary{border-color:var(--nb-accent1);box-shadow:inset 0 0 0 1px rgba(255,255,255,.08),0 0 0 1px var(--nb-soft1),-4px 0 18px var(--nb-glow1),4px 0 20px var(--nb-glow2)}.nb-cell.is-legendary .nb-aura,.nearby-grid .nearby-cell.is-legendary .nb-aura{opacity:.8;animation:nbLegendAura 2.8s ease-in-out infinite}.nb-cell.is-mythical,.nearby-grid .nearby-cell.is-mythical{border-color:rgba(255,120,169,.72);box-shadow:inset 0 0 0 1px rgba(255,255,255,.06),0 0 15px rgba(255,120,169,.18),0 0 20px rgba(185,140,255,.12)}.nb-cell.is-ultra,.nearby-grid .nearby-cell.is-ultra{border-color:rgba(0,229,255,.78);box-shadow:inset 0 0 0 1px rgba(124,58,237,.18),0 0 16px rgba(0,229,255,.16)}.nb-cell.is-boss,.nearby-grid .nearby-cell.is-boss{border-color:rgba(255,154,61,.72)}.nb-cell.is-mega,.nearby-grid .nearby-cell.is-mega{border-color:rgba(88,200,255,.74);box-shadow:inset 0 0 0 1px rgba(139,92,246,.16),0 0 15px rgba(88,200,255,.14)}.nb-cell.is-dynamax,.nearby-grid .nearby-cell.is-dynamax{border-color:rgba(255,92,172,.72)}.nb-cell.is-dynamax .nb-edge,.nearby-grid .nearby-cell.is-dynamax .nb-edge{animation:nbDmaxEdge 1.8s ease-in-out infinite}.nb-cell.is-shiny::after,.nearby-grid .nearby-cell.is-shiny::after{content:\"\";position:absolute;inset:-35%;pointer-events:none;z-index:2;background:linear-gradient(112deg,transparent 38%,rgba(255,238,150,.16) 48%,rgba(255,255,255,.23) 50%,rgba(255,238,150,.13) 53%,transparent 63%);transform:translateX(-42%);animation:nbShinySweep 3.8s ease-in-out infinite}.nb-thumb-wrap{position:relative;z-index:2;display:flex;align-items:center;justify-content:center;width:100%;min-height:50px;padding-top:2px}.nearby-pic{filter:drop-shadow(0 2px 4px rgba(0,0,0,.38))}.nb-icon{width:clamp(44px,12vw,58px);height:clamp(44px,12vw,58px)}.nb-name-row{position:relative;z-index:4;display:flex;align-items:center;justify-content:center;gap:4px;max-width:100%;min-width:0}.nb-name{font-size:.73rem;font-weight:900;text-align:center;line-height:1.2;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;text-shadow:1px 1px 0 #000}.nb-name-icons{display:inline-flex;align-items:center;gap:3px;justify-content:center;flex-shrink:0}.nb-pillbar{position:relative;z-index:4;display:flex;flex-wrap:wrap;justify-content:center;gap:4px;min-height:18px;width:100%}.nb-typebar{position:relative;z-index:4;display:flex;flex-wrap:nowrap;justify-content:center;gap:4px;min-height:16px;width:100%}.nb-pill{display:inline-flex;align-items:center;gap:3px;max-width:100%;padding:2px 6px;border-radius:999px;font-size:.56rem;font-weight:850;line-height:1.3;color:#eef6ff;background:rgba(125,149,181,.15);border:1px solid rgba(170,204,255,.2);box-shadow:inset 0 0 0 1px rgba(255,255,255,.02)}.nb-pill-ic{font-size:.57rem;font-weight:950}.nb-pill.legendary{background:linear-gradient(90deg,rgba(255,255,255,.055),var(--nb-pill-soft,rgba(255,213,79,.22)));border-color:var(--nb-pill1,#ffd54f);box-shadow:inset -8px 0 16px rgba(255,255,255,.025)}.nb-pill.legendary .nb-pill-ic{color:var(--nb-pill2,#fff0a8)}.nb-pill.mythical{background:linear-gradient(90deg,rgba(255,120,169,.22),rgba(185,140,255,.13));border-color:#ff8ab5}.nb-pill.ultra{border-radius:3px;clip-path:polygon(6% 0,94% 0,100% 50%,94% 100%,6% 100%,0 50%);background:linear-gradient(90deg,rgba(0,229,255,.22),rgba(124,58,237,.18));border-color:#00e5ff}.nb-pill.boss{border-radius:5px;background:linear-gradient(180deg,rgba(255,154,61,.27),rgba(220,38,38,.12));border-color:#ff9a3d}.nb-pill.mega{border-radius:5px;background:linear-gradient(90deg,rgba(88,200,255,.23),rgba(139,92,246,.20));border-color:#69cfff}.nb-pill.dynamax{background:linear-gradient(90deg,rgba(255,92,172,.26),rgba(225,29,72,.15));border-color:#ff5cac}.nb-pill.shiny{background:linear-gradient(90deg,rgba(255,228,122,.28),rgba(230,184,0,.12));border-color:#ffe47a;color:#fff7d0}.nb-cnt{position:relative;z-index:4;font-size:.66rem;color:#dfe9ff;font-weight:750;letter-spacing:.3px}.nb-toggle{float:right;font-size:.68rem;font-weight:500;color:var(--dim);cursor:pointer;margin-right:2%}.nb-toggle:hover{color:#7cc4f8}.nb-rare-count{display:inline-flex;align-items:center;margin-left:7px;padding:1px 6px;border-radius:999px;border:1px solid rgba(255,228,122,.22);background:rgba(255,228,122,.08);color:#ffeaa0;font-size:.58rem;font-weight:800;vertical-align:1px}.nearby-frame{margin-top:clamp(8px,2vw,12px)}.nearby-frame .info-inner{padding-top:5px;padding-bottom:5px}.nearby-frame .info-title{margin-bottom:4px}.nearby-frame .nb-cell{padding:7px 6px 6px}.nearby-frame .nb-cell .nb-thumb-wrap{min-height:42px;padding-top:0}.nearby-frame .nb-cell .nb-pillbar:empty{display:none}@keyframes nbLegendAura{0%,100%{opacity:.52;transform:scale(.96)}50%{opacity:.9;transform:scale(1.04)}}@keyframes nbDmaxEdge{0%,100%{opacity:.7;filter:brightness(.95)}50%{opacity:1;filter:brightness(1.25)}}@keyframes nbShinySweep{0%,68%{transform:translateX(-48%);opacity:0}76%{opacity:.85}90%,100%{transform:translateX(48%);opacity:0}}@media(prefers-reduced-motion:reduce){.nb-cell.is-legendary .nb-aura,.nearby-grid .nearby-cell.is-legendary .nb-aura,.nb-cell.is-dynamax .nb-edge,.nearby-grid .nearby-cell.is-dynamax .nb-edge,.nb-cell.is-shiny::after,.nearby-grid .nearby-cell.is-shiny::after{animation:none!important}}.fold-box{border:1px solid var(--frame);border-radius:6px;margin-bottom:10px;background:rgba(25,40,65,.35);overflow:hidden}.fold-head{display:flex;align-items:center;justify-content:space-between;padding:7px 12px;font-size:.82rem;font-weight:800;cursor:pointer;background:rgba(43,74,111,.5)}.fold-head:hover{background:rgba(170,204,255,.14)}.fold-arrow{font-size:.8rem;opacity:.8}.fold-inner{padding:8px 12px 10px}.bt-scene{font-size:.78rem;line-height:1.5;color:#dce9ff;padding:6px 10px;margin-bottom:8px;border-left:3px solid var(--frame);background:rgba(43,74,111,.3);border-radius:0 6px 6px 0;word-break:break-word}.bt-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px;margin-bottom:10px}.bt-card{position:relative;min-width:0;padding:7px 9px;border:1px solid var(--frame);border-left:4px solid var(--bt-accent,var(--frame));border-radius:6px;background:linear-gradient(160deg,rgba(43,74,111,.55),rgba(15,22,38,.75));box-shadow:0 2px 6px rgba(0,0,0,.45)}.bt-card.self{border-left-color:#4ade80;box-shadow:0 0 8px rgba(74,222,128,.18)}.bt-card.ally{border-left-color:#7cc4f8}.bt-card.foe{border-left-color:#f05060;background:linear-gradient(160deg,rgba(120,40,48,.5),rgba(20,14,20,.75))}.bt-card.neu{border-left-color:#8ba0b8}.bt-head{display:flex;align-items:baseline;justify-content:space-between;gap:6px}.bt-pk{font-weight:800;font-size:.85rem;color:var(--text);text-shadow:1px 1px 0 #000;word-break:break-all}.bt-lv{font-size:.72rem;color:var(--dim);flex-shrink:0}.bt-tr{font-size:.68rem;color:var(--dim);margin-top:1px}.bt-hp{display:flex;align-items:center;gap:5px;margin:4px 0 3px}.bt-hp .hp-bar{flex:1}.bt-hpn{font-size:.66rem;color:var(--text);flex-shrink:0}.bt-line{font-size:.7rem;line-height:1.45;color:#dce9ff;margin-top:2px;word-break:break-word}.bt-k{color:var(--dim);margin-right:4px}.st-up{color:#4ade80}.st-dn{color:#f87171}.ailment.bad{background:#c03028;color:#fff}.bt-side{border:1px dashed rgba(170,204,255,.35);border-radius:6px;margin-bottom:8px;overflow:hidden}.bt-side-h{padding:4px 10px;font-size:.76rem;font-weight:800;background:rgba(43,74,111,.5)}.bt-side-b{padding:5px 10px;font-size:.74rem;line-height:1.5;color:#dce9ff;word-break:break-word}.bt-types{display:inline-flex;flex-wrap:wrap;gap:3px;margin-left:6px}.bt-tactic{font-size:.74rem;line-height:1.5;color:#ffe9a8;padding:4px 10px;margin-bottom:6px;border-left:3px solid #d8b830;background:rgba(120,95,20,.2);border-radius:0 6px 6px 0;word-break:break-word}.bt-meta{display:flex;flex-wrap:wrap;gap:4px 10px;margin-top:6px;padding-top:6px;font-size:.7rem;color:var(--dim);border-top:1px dashed rgba(170,204,255,.25)}.detail-modal.one .modal-body{padding-bottom:14px}.dt-more-btn{display:block;width:100%;margin-top:6px;padding:5px 10px;font-family:inherit;font-size:.74rem;font-weight:800;color:#7cc4f8;background:rgba(43,74,111,.45);border:1px dashed rgba(124,196,248,.5);border-radius:4px;cursor:pointer}.dt-more-btn:hover{background:rgba(124,196,248,.18)}.dt-move-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:6px;margin-top:8px}.dt-move-cell{display:flex;align-items:center;gap:6px;min-width:0;padding:7px 8px;border:1px solid var(--frame);border-radius:6px;background:rgba(43,74,111,.4);cursor:pointer;transition:filter .12s}.dt-move-cell:hover{filter:brightness(1.15)}.dt-move-cell .move-type{width:3.4em;min-width:3.4em;height:22px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;font-size:.6rem;font-weight:800;color:#fff;text-shadow:0 1px 1px rgba(0,0,0,.3);box-sizing:border-box;flex-shrink:0;white-space:nowrap}.dt-move-cell .move-name{flex:1;min-width:0;text-align:left;font-weight:800;font-size:.8rem;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.bt-empty{display:flex;align-items:center;justify-content:center;height:100%;color:var(--dim);letter-spacing:3px;font-size:.86rem;text-align:center}.tab-panel .bt-empty{height:auto;min-height:140px}.bt-rule{font-size:.78rem;line-height:1.5;color:#ffe9a8;padding:6px 10px;margin-bottom:6px;border-left:3px solid #d8b830;background:rgba(120,95,20,.28);border-radius:0 6px 6px 0;word-break:break-word}.fold-inner{min-width:0;overflow-x:hidden}.fold-inner .bag-list{max-height:none}.fold-body{max-height:200px;overflow-y:auto}.fold-body::-webkit-scrollbar{width:5px}.fold-body::-webkit-scrollbar-thumb{background:rgba(170,204,255,.4);border-radius:3px}.pk-left{display:flex;align-items:center;gap:4px;min-width:0;flex:1 1 auto;font-size:clamp(.74rem,2.8vw,.88rem)}.mega-ic{height:1em;width:auto;flex:0 0 auto;image-rendering:pixelated}#pkm-hud-btn{position:fixed;z-index:2147483647;width:54px;height:54px;border-radius:50%;cursor:pointer;background:radial-gradient(circle at 30% 30%,#5a7db0,#2b4a6f);border:2px solid #7d95b5;box-shadow:0 4px 14px rgba(0,0,0,.5),0 0 12px rgba(124,196,248,.35);display:flex;align-items:center;justify-content:center;transition:box-shadow .15s;font-size:26px;color:#fff;user-select:none;-webkit-user-select:none;touch-action:none}#pkm-hud-btn:hover{box-shadow:0 6px 20px rgba(0,0,0,.6),0 0 18px rgba(124,196,248,.6)}#pkm-hud-btn img{width:46px;height:46px;object-fit:cover;border-radius:50%;pointer-events:none}#pkm-hud-mapfab{position:fixed;z-index:2147483647;width:44px;height:44px;border-radius:50%;border:2px solid #7d95b5;background:radial-gradient(circle at 30% 30%,#5a7db0,#2b4a6f);color:#fff;font-size:22px;cursor:pointer;display:none;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(0,0,0,.5),0 0 12px rgba(124,196,248,.35);user-select:none;-webkit-user-select:none;touch-action:none}#pkm-hud-mapfab.show{display:flex}#pkm-hud-mask{position:fixed;inset:0;z-index:2147483500;background:rgba(8,12,24,.55);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);display:block;opacity:0;visibility:hidden;transition:opacity .18s ease,visibility 0s linear .18s;pointer-events:none}#pkm-hud-mask.open{opacity:1;visibility:visible;transition:opacity .18s ease,visibility 0s;pointer-events:auto}#pkm-hud-win{position:fixed;left:0;top:0;z-index:2147483600;width:min(94vw,650px);max-height:86vh;overflow-y:auto;display:block;border-radius:12px;overscroll-behavior:contain;-webkit-overscroll-behavior:contain;opacity:0;visibility:hidden;transform:translateY(14px) scale(.98);transform-origin:center;transition:opacity .18s ease,transform .18s ease,visibility 0s linear .18s;pointer-events:none}#pkm-hud-win.open{opacity:1;visibility:visible;transform:none;transition:opacity .18s ease,transform .18s ease,visibility 0s;pointer-events:auto}#pkm-hud-win .hud{margin:0;max-width:none;width:100%}#pkm-hud-close{position:absolute;right:8px;top:8px;z-index:10;width:32px;height:32px;border-radius:50%;border:1px solid var(--frame);background:rgba(43,74,111,.92);color:#fff;font-size:16px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center}#pkm-hud-close:hover{background:rgba(150,60,60,.9)}#pkm-hud-inline{position:relative;display:block;margin:8px 0 4px;max-width:100%}#pkm-hud-inline .hud{max-width:600px;margin:0 auto;border-radius:8px}#pkm-hud-inline{--pkm-inline-h:500px}#pkm-hud-inline .hud-inner{height:var(--pkm-inline-h,500px)}@media(max-width:430px){#pkm-hud-inline{--pkm-inline-h:400px}}#pkm-hud-inline .tab-panel{overscroll-behavior:auto;-webkit-overscroll-behavior:auto}#pkm-hud-inline .tab-btn{padding:10px 0;min-height:44px;font-size:.8rem;touch-action:manipulation}.map-tabs{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px}.map-tab{flex:0 0 auto;padding:2px 12px;font-family:inherit;font-size:.72rem;border:1px solid var(--frame);background:rgba(170,204,255,.12);color:var(--text);border-radius:4px;cursor:pointer}.map-tab.active{background:rgba(43,74,111,.8);color:#fff}.map-wrap{position:relative;width:100%;height:auto;min-height:140px;overflow:hidden;border:0;border-radius:8px;background:#0a1020;touch-action:none;cursor:grab}.map-wrap.dragging{cursor:grabbing}.map-stage{position:relative;width:100%;height:100%;transform-origin:0 0}.map-img{display:block;width:100%;height:100%;object-fit:fill;pointer-events:none;user-select:none;-webkit-user-select:none;-webkit-user-drag:none}.map-pin{position:absolute;width:14px;height:14px;margin:-7px 0 0 -7px;border-radius:50%;background:#7cc4f8;border:2px solid #fff;box-shadow:0 0 10px rgba(124,196,248,.9);animation:map-pin-pulse 1.2s ease-in-out infinite;pointer-events:none;z-index:2}.map-pin-label{position:absolute;transform:translate(-50%,-135%);white-space:nowrap;padding:1px 6px;border-radius:4px;background:rgba(15,22,38,.92);border:1px solid var(--frame);font-size:.68rem;font-weight:800;color:#fff;pointer-events:none;z-index:2}.map-no-loc{padding:10px;text-align:center;color:var(--dim);font-size:.78rem;letter-spacing:1px}.map-page{display:flex;flex-direction:column;gap:8px;margin:-14px -14px 0}.map-toolbar{display:flex;align-items:center;gap:8px;padding:0 12px}.map-toolbar .map-tabs{flex:1;margin-bottom:0}.map-controls{display:flex;align-items:center;gap:6px;padding:2px 12px;min-height:34px;position:relative;flex-wrap:nowrap;overflow:hidden}.map-size-btn{flex:0 0 auto;padding:3px 10px;font-family:inherit;font-size:.72rem;font-weight:800;border:1px solid var(--frame);background:rgba(170,204,255,.12);color:var(--text);border-radius:4px;cursor:pointer;white-space:nowrap}.map-size-btn:active{background:rgba(43,74,111,.8);color:#fff}.map-eye{flex:0 0 auto;padding:4px 14px;font-family:inherit;font-size:.85rem;font-weight:800;border:1px solid var(--frame);background:rgba(170,204,255,.12);color:var(--text);border-radius:4px;cursor:pointer;user-select:none;-webkit-user-select:none;touch-action:none}.map-eye:active{background:rgba(43,74,111,.8);color:#fff}.map-eye.on{background:rgba(43,74,111,.8);color:#fff;border-color:#7cc4f8}.map-zoom-hint{padding:4px 12px;font-size:.68rem;color:var(--dim);text-align:center;letter-spacing:1px}.map-spot-label{position:absolute;transform:translate(-50%,-50%);white-space:nowrap;padding:1px 5px;border-radius:4px;background:rgba(15,22,38,.85);border:1px solid rgba(124,196,248,.5);font-size:.62rem;font-weight:800;color:#fff;pointer-events:auto;cursor:pointer;z-index:3;display:none}.map-spot-label.top{z-index:99;background:rgba(43,74,111,.95);border-color:#7cc4f8;box-shadow:0 0 8px rgba(124,196,248,.6)}.map-wrap.show-all.show-town .map-spot-label[data-cat=\"town\"],.map-wrap.show-all.show-road .map-spot-label[data-cat=\"road\"],.map-wrap.show-all.show-special .map-spot-label[data-cat=\"special\"]{display:block}.map-filter{display:none;align-items:center;gap:4px;min-width:0;white-space:nowrap}.map-filter.show{display:flex}.map-size-pop{display:none;position:absolute;inset:0;align-items:center;gap:8px;padding:0 12px;background:#0f1626;z-index:5}.map-size-pop.open{display:flex}.map-size-pop input[type=range]{flex:1;min-width:60px;accent-color:#7cc4f8}.map-size-pop .dim{flex:0 0 auto;white-space:nowrap}.map-size-done{flex:0 0 auto;padding:2px 10px;font-family:inherit;font-size:.75rem;font-weight:800;border:1px solid var(--frame);background:rgba(43,74,111,.8);color:#fff;border-radius:4px;cursor:pointer}.map-labels{position:absolute;left:0;top:0;width:100%;height:100%;overflow:hidden;pointer-events:none}@keyframes map-pin-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.3)}}#pkm-hud-btn .fab-update-dot{position:absolute;top:-3px;right:-3px;width:16px;height:16px;border-radius:50%;background:#e05050;border:2px solid #0f1626;box-shadow:0 0 8px rgba(224,80,80,.9);animation:pkm-fab-pulse 1.2s ease-in-out infinite;pointer-events:none;z-index:2}@keyframes pkm-fab-pulse{0%,100%{transform:scale(1);box-shadow:0 0 8px rgba(224,80,80,.9)}50%{transform:scale(1.3);box-shadow:0 0 16px rgba(224,80,80,1)}}.tr-right{display:inline-flex;align-items:center;gap:6px;margin-left:auto;flex-shrink:1;min-width:0;max-width:100%;flex-wrap:wrap;justify-content:flex-end}.hud-refresh-btn{display:inline-flex;align-items:center;justify-content:center;width:1.45em;height:1.45em;padding:0;border:none;background:transparent;cursor:pointer;flex-shrink:0;align-self:center;line-height:1;font-family:inherit;font-size:inherit;color:inherit}.hud-refresh-btn img{width:2em;height:2em;object-fit:contain;display:block;pointer-events:none;margin-top:-0.23em}.hud-refresh-btn:hover{filter:brightness(1.2)}.hud-refresh-btn:disabled{opacity:.6;cursor:default}.hud-refresh-btn.spin img{animation:pkm-refresh-spin .6s linear}.hud-refresh-ok{color:#4ade80;font-size:1.25em;line-height:1;font-weight:800;margin-top:-0.24em}@keyframes pkm-refresh-spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}#pkm-hud-win .trainer-frame .info-title{padding-right:28px}.map-island-label{position:absolute;transform:translate(-50%,-50%);white-space:nowrap;padding:1px 6px;border-radius:4px;background:rgba(15,22,38,.68);border:1px solid rgba(74,222,128,.5);color:#c6d1e4;font-size:.62rem;font-weight:800;pointer-events:auto;cursor:pointer;z-index:3}.map-island-label .il-dot{display:inline-block;width:6px;height:6px;border-radius:50%;background:#4ade80;margin-right:3px;vertical-align:1px;opacity:.8}.map-island-label.no-sub{cursor:default}.map-island-label.hl{border-color:#fff;background:rgba(255,255,255,.14);color:#fff;box-shadow:0 0 6px 1px rgba(255,255,255,.5);animation:island-hl-pulse 1.1s ease-in-out infinite}@keyframes island-hl-pulse{0%,100%{box-shadow:0 0 3px 1px rgba(255,255,255,.4)}50%{box-shadow:0 0 10px 4px rgba(255,255,255,.7)}}.map-back-btn{flex:0 0 auto;padding:4px 12px;font-family:inherit;font-size:.75rem;font-weight:800;border:1px solid var(--frame);background:rgba(43,74,111,.85);color:#fff;border-radius:4px;cursor:pointer;white-space:nowrap}.map-back-btn:hover{background:rgba(124,196,248,.28)}.map-pad-toggle{flex:0 0 auto;width:32px;height:32px;margin-right:6px;border-radius:7px;border:1px solid var(--frame);background:rgba(43,74,111,.86);color:#fff;font-size:16px;line-height:1;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;touch-action:manipulation;user-select:none;-webkit-user-select:none}.map-pad-toggle:hover{background:rgba(124,196,248,.22)}.map-pad-toggle.on{background:rgba(124,196,248,.26);border-color:#7cc4f8;box-shadow:0 0 8px rgba(124,196,248,.35)}.map-viewer-frame{position:relative;max-width:100%;margin:0 auto;border:1px solid rgba(125,149,181,.72);border-radius:10px;background:#0a1020;box-shadow:0 3px 14px rgba(0,0,0,.35);overflow:hidden}.map-viewer-frame .map-wrap{margin:0!important;border-radius:8px;background:#0a1020;max-width:100%}.map-viewer-frame.manual-open .map-wrap{border-radius:8px 8px 0 0}.map-manual-controls{display:none;align-items:center;justify-content:space-between;gap:12px;min-height:86px;padding:7px 12px 9px;border-top:1px solid rgba(125,149,181,.6);background:linear-gradient(180deg,rgba(24,39,64,.96),rgba(12,22,38,.98));touch-action:manipulation;user-select:none;-webkit-user-select:none}.map-viewer-frame.manual-open .map-manual-controls{display:flex}.map-dpad{display:grid;grid-template-columns:36px 36px 36px;grid-template-rows:25px 30px 25px;gap:2px;align-items:center;justify-items:center;flex:0 0 auto}.map-dpad-core{grid-column:2;grid-row:2;width:16px;height:16px;border-radius:50%;border:1px solid rgba(125,149,181,.55);background:rgba(124,196,248,.10);box-shadow:inset 0 0 5px rgba(0,0,0,.5)}.map-manual-btn{display:flex;align-items:center;justify-content:center;padding:0;border:1px solid var(--frame);background:rgba(43,74,111,.82);color:#fff;border-radius:7px;font-family:inherit;font-weight:900;cursor:pointer;touch-action:manipulation;user-select:none;-webkit-user-select:none;box-shadow:0 2px 5px rgba(0,0,0,.28)}.map-manual-btn:hover{filter:brightness(1.16)}.map-manual-btn:active{transform:translateY(1px);background:rgba(124,196,248,.28)}.map-dpad .map-manual-btn{width:34px;height:27px;font-size:16px}.map-dpad [data-map-pan=\"up\"]{grid-column:2;grid-row:1}.map-dpad [data-map-pan=\"left\"]{grid-column:1;grid-row:2}.map-dpad [data-map-pan=\"right\"]{grid-column:3;grid-row:2}.map-dpad [data-map-pan=\"down\"]{grid-column:2;grid-row:3}.map-zoom-pad{display:flex;align-items:center;justify-content:flex-end;gap:8px;flex:0 0 auto;margin-left:auto}.map-zoom-pad .map-manual-btn{width:44px;height:44px;font-size:24px;line-height:1}@media(max-width:600px){.page-overlay.popout{padding:max(6px,env(safe-area-inset-top)) 4px max(6px,env(safe-area-inset-bottom));align-items:center;align-items:safe center;justify-content:center}.page-overlay.popout .page{box-sizing:border-box;width:96vw;max-width:96vw;max-height:90vh;max-height:90dvh}.page-overlay.popout .page-head{min-height:44px;padding:5px 6px}.page-overlay.popout .page-body{padding:10px 8px 12px;max-height:calc(90vh - 44px);max-height:calc(90dvh - 44px);overflow:auto;overflow-x:hidden}.map-page{margin:-10px -8px 0;gap:6px}.map-toolbar{padding:0 8px;gap:4px;min-width:0}.map-toolbar .map-tabs{flex-wrap:nowrap;overflow-x:auto;min-width:0;scrollbar-width:none;-webkit-overflow-scrolling:touch}.map-toolbar .map-tabs::-webkit-scrollbar{display:none}.map-tab{padding:4px 10px;min-height:30px}.map-controls{padding:2px 8px;overflow-x:auto}.map-zoom-hint{padding:4px 8px;font-size:.62rem;line-height:1.45;letter-spacing:.4px}.map-pad-toggle,.page-close{width:36px;height:36px;font-size:17px}.map-manual-controls{min-height:82px;padding:6px 9px 8px}.map-dpad{grid-template-columns:38px 38px 38px;grid-template-rows:24px 30px 24px}.map-dpad .map-manual-btn{width:36px;height:28px;font-size:17px}.map-zoom-pad{gap:6px}.map-zoom-pad .map-manual-btn{width:42px;height:42px;font-size:23px}}@media(hover:none){.card-frame:hover,.nearby-card:hover,.nb-cell:hover{transform:none!important;filter:none!important}.page-overlay,.overlay{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}}@media(hover:none){.page-overlay.popout.map-focus{backdrop-filter:blur(9px) saturate(.76) brightness(.68)!important;-webkit-backdrop-filter:blur(9px) saturate(.76) brightness(.68)!important}}@media(prefers-reduced-motion:reduce){#pkm-hud-win,#pkm-hud-mask,.card-frame,.nearby-card,.nb-cell,.hp-fill,.exp-fill{transition:none!important}.map-pin,.fab-update-dot,.map-island-label.hl{animation:none!important}}.pkm-hud-sub{z-index:1100;background:rgba(6,10,20,.32);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px)}.bw2-host{--bw2-original-grid:repeating-linear-gradient(0deg,rgba(150,180,220,.14) 0 2px,transparent 2px 10px,rgba(255,255,255,.05) 10px 11px,transparent 11px 20px,rgba(255,255,255,.05) 20px 21px,transparent 21px 30px,rgba(255,255,255,.05) 30px 31px,transparent 31px 40px,rgba(255,255,255,.05) 40px 41px,transparent 41px 50px),repeating-linear-gradient(90deg,rgba(150,180,220,.14) 0 2px,transparent 2px 10px,rgba(255,255,255,.05) 10px 11px,transparent 11px 20px,rgba(255,255,255,.05) 20px 21px,transparent 21px 30px,rgba(255,255,255,.05) 30px 31px,transparent 31px 40px,rgba(255,255,255,.05) 40px 41px,transparent 41px 50px);}\n:is(#pkm-hud-win,#pkm-hud-inline){\n  --bw2-font-ui:\"Segoe UI\",\"Helvetica Neue\",\"PingFang SC\",\"Microsoft YaHei\",monospace;\n  --bw2-text:#c6d1e4;\n  --bw2-muted:#8ba0b8;\n  --bw2-border:#7d95b5;\n  --frame:var(--bw2-border);\n  --text:var(--bw2-text);\n  --dim:var(--bw2-muted);\n  font-family:var(--bw2-font-ui);\n}\n.bw2-host{\n  --bw2-ink:#111a2b;\n  --bw2-paper:#d8e1e6;\n  --bw2-cyan:#45d5e5;\n  --bw2-red:#ba1024;\n  color:#dce4ef;\n}\n\n.bw2-host .hud{border-radius:6px;border:1px solid #8897b2}\n.bw2-host .hud-inner{padding:16px}\n.bw2-host [hidden]{display:none!important}\n.bw2-host .refresh-ic{color:#dceaf3}\n.bw2-host .grid{gap:15px;margin:0 0 18px}\n.bw2-host .col-right{padding-top:24px}\n.bw2-host .card-frame{cursor:pointer}\n.bw2-host .card-frame:focus-visible{outline:2px solid var(--bw2-cyan);outline-offset:3px}\n.bw2-host .card-frame:hover .card-bg-svg polygon{stroke:#45d5e5;fill:#215f70;fill-opacity:.7}\n.bw2-host .tab-bar{background:#090f19;border-top:1px solid #8192ab;border-radius:0;padding:7px;gap:7px}\n.bw2-host .tab-btn{border-radius:2px;border:1px solid #64728a;background:#263048;color:#c6d0de}\n.bw2-host .tab-btn.active{background:#cbdde4;color:#152332;border-color:#4fd7e3}\n.bw2-host .bw2-menu-screen{background:#dce1de;background-image:var(--bw2-original-grid);padding:14px;color:#232b2d;border:2px solid #829294}\n.bw2-host .bw2-menu-screen *{text-shadow:none;box-sizing:border-box}\n.bw2-host .bw2-menu-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px 12px}\n.bw2-host .bw2-menu-button{position:relative;min-height:58px;display:flex;align-items:center;gap:12px;padding:8px 16px;text-align:left;color:#f1f3f1;background:linear-gradient(45deg,#282c2d 33%,#414544 33%);border:0;border-radius:0;clip-path:polygon(0 0,29% 0,34% 12%,100% 12%,100% 100%,0 100%);cursor:pointer}\n.bw2-host .bw2-menu-button:after{content:'';position:absolute;inset:4px;border:1px solid #929e9b;pointer-events:none;clip-path:polygon(0 0,28% 0,33% 13%,100% 13%,100% 100%,0 100%)}\n.bw2-host .bw2-menu-icon{color:var(--bw2-accent);flex:0 0 40px;display:flex;align-items:center;justify-content:center}\n.bw2-host .swsh-icon{display:inline-block;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;vertical-align:middle}\n.bw2-host .swsh-icon-detail{stroke-width:1.35}\n.bw2-host .bw2-menu-button .menu-label{font-size:17px;font-weight:800}\n.bw2-host .bw2-menu-button:focus-visible{outline:none;box-shadow:inset 0 0 0 3px #40d7e7}\n\n.bw2-host .bw2-detail *{text-shadow:none;box-sizing:border-box}\n.bw2-host .bw2-detail{width:min(100%,390px)!important;max-width:390px!important;background-image:none;border:2px solid #7f91a3;border-radius:3px;color:#e3ebf3;box-shadow:0 12px 35px #0006;display:flex;flex-direction:column;overflow:hidden;font-family:'Microsoft YaHei','SimHei',sans-serif}\n.bw2-host .bw2-detail [hidden]{display:none!important}\n.bw2-host .bw2-detail .modal-body{padding:0 2px;overflow:auto;max-height:none;min-height:0;flex:1 1 auto;background:transparent;scrollbar-width:thin}\n.bw2-host .bw2-detail-canvas{position:relative;container-type:inline-size;isolation:isolate}\n.bw2-host .bw2-detail-upper{position:relative;aspect-ratio:386/292;width:100%;color:#42484d}\n.bw2-host .bw2-upper-outline,.bw2-host .bw2-scene-geometry{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0}\n.bw2-host .bw2-upper-paper,.bw2-host .bw2-paper-shape{fill:#cbd3d7}\n.bw2-host .bw2-rim-shadow{fill:none;stroke:#63717f;stroke-width:4;vector-effect:non-scaling-stroke;stroke-linejoin:miter}\n.bw2-host .bw2-rim-white{fill:none;vector-effect:non-scaling-stroke;stroke-linejoin:miter}\n.bw2-host .bw2-top-cap{fill:#869399;stroke-width:1}\n.bw2-host .bw2-top-cap-lines{fill:none;stroke:#53626f;stroke-width:1.2}\n.bw2-host .bw2-title-band{position:absolute;left:0;right:0;top:5.48%;height:6.85%;display:flex;align-items:center;background:#a12820;box-shadow:0 1px #612a2b,0 -1px #c0584d;color:#fff}\n.bw2-host .bw2-detail .modal-name{width:100%;font-family:monospace;font-weight:800;line-height:1;white-space:nowrap;display:flex;align-items:center;justify-content:space-between}\n.bw2-host .bw2-detail .modal-name span{font-family:'Microsoft YaHei',sans-serif;font-weight:500}\n.bw2-host .bw2-upper-content{position:absolute;z-index:2;left:12.5%;right:9%;top:23.6%;bottom:7%;scrollbar-width:thin}\n.bw2-host .bw2-detail .row{padding:3px 0;display:flex;justify-content:space-between;gap:8px;font-size:4.1cqw;border-bottom:1px solid #8296a52d;color:#41464c}\n.bw2-host .bw2-detail .row .k{color:inherit;flex-shrink:0;opacity:1}\n.bw2-host .bw2-detail .row .v{text-align:right;color:inherit}\n.bw2-host .bw2-detail .abi-link{color:inherit;text-decoration:underline;text-underline-offset:2px}\n.bw2-host .bw2-detail .ivs{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:3px}\n.bw2-host .bw2-detail .iv{font-size:3.1cqw;background:#b3c9d2;color:#223e4d;border:1px solid #829baa;border-radius:0;padding:1px 3px}\n.bw2-host .bw2-summary-scene{position:relative;aspect-ratio:386/268;width:100%;margin:0;background:none}\n.bw2-host .bw2-level-shade{fill-opacity:1}\n.bw2-host .bw2-mark-base{fill:#7d888d;fill-opacity:.8}\n.bw2-host .bw2-scene-nameplate{position:absolute;z-index:2;left:62%;top:.4%;width:37.7%;height:19.4%;padding:.6cqw .7cqw;color:#454b50;display:flex;flex-direction:column;align-items:flex-start;justify-content:flex-start;gap:0}\n.bw2-host .bw2-scene-nameplate .dt-top{margin:0;text-align:left;display:flex;justify-content:flex-start;gap:2px;align-items:center;width:100%;line-height:1.15;min-height:5.3cqw}\n.bw2-host .bw2-scene-nameplate .dt-name{flex:1;font-size:var(--bw2-name-font,4.1cqw)!important;font-weight:600;color:#454b50!important;white-space:nowrap;min-width:0}\n.bw2-host .bw2-scene-nameplate .gender{font-size:4cqw;margin-left:auto;flex-shrink:0}\n.bw2-host .bw2-scene-nameplate .gender-sym{flex:none;font-size:3.6cqw;line-height:1}\n.bw2-host .bw2-name-meta{display:grid;grid-template-columns:minmax(0,1fr) 24.5cqw;gap:.4cqw;align-items:center;margin-left:-.3cqw;width:calc(100% + .3cqw);height:6.8cqw}\n.bw2-host .bw2-scene-nameplate .bw2-detail-level{font-size:3.75cqw;font-weight:700;margin:0;line-height:1.1;display:flex;gap:.3cqw;align-items:baseline;white-space:nowrap;color:#454b50}\n.bw2-host .bw2-state-badges{display:flex;flex-wrap:nowrap;justify-content:flex-end;align-items:center;gap:.25cqw;min-width:0;width:24.5cqw;height:100%}\n.bw2-host .bw2-state-badge{position:relative;display:inline-flex;flex:none;width:4.7cqw;height:4.7cqw;margin:0;padding:0;color:#5d526b}\n.bw2-host .bw2-state-badge svg{width:100%;height:100%;fill:none;stroke:currentColor;stroke-width:1.1}\n.bw2-host .bw2-state-badge img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;image-rendering:pixelated}\n.bw2-host .bw2-state-badge.shiny{color:#986b00}.bw2-host .bw2-state-badge.legendary{color:#876400}.bw2-host .bw2-state-badge.mythical{color:#a52f7f}.bw2-host .bw2-state-badge.ultra{color:#256b83}.bw2-host .bw2-state-badge.dynamax{color:#b52765}\n.bw2-host .bw2-detail-level b{font-weight:700;font-variant-numeric:tabular-nums}\n.bw2-host .bw2-scene-nameplate .item-icon{width:4.7cqw!important;height:4.7cqw!important;font-size:3.5cqw;flex-shrink:0}\n.bw2-host .bw2-basic-ball{width:4.7cqw;height:4.7cqw;flex-shrink:0}\n.bw2-host .bw2-scene-sprite{position:absolute;z-index:2;left:49%;top:24%;width:51%;height:49%;pointer-events:none}\n.bw2-host .bw2-scene-sprite .dt-sprite{position:absolute;inset:0;margin:0;display:flex;align-items:center;justify-content:center}\n.bw2-host .bw2-scene-sprite .dt-big{width:100%!important;height:100%!important;background-size:contain!important;background-repeat:no-repeat;background-position:center}\n.bw2-host .bw2-scene-markings{position:absolute;z-index:2;left:63.212%;top:72.388%;width:32.642%;height:5.597%;display:flex;align-items:center;justify-content:space-evenly;background:none}\n.bw2-host .bw2-mark{width:10%;height:90%;stroke:#d6d3b8;stroke-width:1;fill:none}\n.bw2-host .bw2-mark.marked{fill:#ded596}\n.bw2-host .bw2-scene-held{position:absolute;z-index:2;left:59.326%;top:77.985%;width:40.415%;height:21.269%;background:none;color:#454b50;margin:0;padding:0;border:0;border-radius:0;cursor:pointer;font:inherit;text-align:left;appearance:none}\n.bw2-host .bw2-scene-held:focus-visible,.bw2-host .bw2-trait-heading:focus-visible{outline:2px solid #45d5e5;outline-offset:-2px}\n.bw2-host .bw2-scene-held .dt-hold{font-size:4cqw;line-height:1.3;margin:0;padding:1% 4%;text-align:left;color:inherit;display:flex;flex-direction:column;gap:1px;font-weight:600}\n.bw2-host .bw2-held-item{display:flex;gap:1cqw;align-items:center;min-width:0}\n.bw2-host .bw2-scene-held .bw2-held-icon{display:inline-flex;flex:none;align-items:center;justify-content:center;width:6cqw!important;height:6cqw!important;object-fit:contain;image-rendering:pixelated;font-size:3.8cqw}\n.bw2-host .bw2-held-name{min-width:0;font-size:3.8cqw;line-height:1.2;overflow-wrap:anywhere}\n.bw2-host .bw2-detail-moves{position:absolute}\n.bw2-host .bw2-detail .dt-move-grid{grid-template-columns:1fr;margin:0}\n.bw2-host .bw2-detail .dt-move-cell{position:relative;isolation:isolate;border-radius:0;background:none;border:0;color:#f3f5f7;min-height:0;clip-path:polygon(6.67% 0,93.33% 0,100% 50%,93.33% 100%,6.67% 100%,0 50%);display:grid;grid-template-columns:auto 1fr;grid-template-rows:1fr 1fr;gap:0 4px;align-items:center}\n.bw2-host .bw2-move-frame{position:absolute;inset:0;width:100%;height:100%;z-index:-1;pointer-events:none}\n.bw2-host .bw2-move-frame polygon{fill:#343434;stroke:var(--bw2-move-color,#888);stroke-linejoin:miter;vector-effect:non-scaling-stroke}\n.bw2-host .bw2-detail .dt-move-cell .move-name{color:#fff}\n.bw2-host .bw2-detail .dt-move-cell .type-chip,.bw2-host .bw2-detail .dt-move-cell .move-type{border-radius:0;line-height:1.2;text-align:center;border:1px solid #0003}\n.bw2-host .bw2-move-meta{grid-column:1/-1;display:grid;gap:4px;align-items:center;line-height:1.2;color:#e5e5e5;white-space:nowrap}\n.bw2-host .bw2-move-kind{text-align:center}\n.bw2-host .bw2-move-category{display:flex;align-items:center;justify-content:center}\n.bw2-host .bw2-move-category svg{stroke-width:1.5}\n.bw2-host .bw2-detail .dt-more-btn{position:absolute;top:100%;left:6cqw;right:0;width:auto;height:5cqw;min-height:0;margin:1cqw 0 0;padding:0 4px;line-height:1.1;color:#ccd9e6;border-radius:2px;background:#27364c;font-size:3.2cqw}\n.bw2-host .bw2-detail .action-btns{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px;margin-top:6px}\n.bw2-host .bw2-detail .act-btn{background:#2d4157;color:#e0edf4;border:1px solid #7b92a6;border-radius:2px;padding:5px;font-size:12px}\n.bw2-host .bw2-stats-table{position:absolute;font-weight:600}\n.bw2-host .bw2-stat-row{display:grid}\n.bw2-host .bw2-stat-label{color:#e3eaf0;padding-right:3cqw;white-space:nowrap}\n.bw2-host .bw2-stat-value{position:relative;color:#434950;padding-left:1.8cqw;line-height:1.1;font-variant-numeric:tabular-nums}\n.bw2-host .bw2-trait-label-face{fill:#7f898d}\n.bw2-host .bw2-trait-divider-shadow{fill:none;stroke:#5e686e;stroke-width:2.5}\n.bw2-host .bw2-trait-divider-white{fill:none;stroke-width:1.5}\n.bw2-host .bw2-trait-heading{display:grid;grid-template-columns:44% 1fr;gap:0;border:0;border-radius:0;background:none;margin:0;padding:0;width:100%;font-family:inherit;color:inherit;cursor:pointer;font-weight:600;align-items:center;line-height:1.15;text-align:left;appearance:none}\n.bw2-host .bw2-trait-label{color:#eef3f4;text-align:center;padding-right:1cqw}\n.bw2-host .bw2-trait-name{padding-left:3.4cqw;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n.bw2-host .bw2-held-actions{padding:0 14px 14px;display:grid;grid-template-columns:1fr 1fr;gap:8px}\n.bw2-host .bw2-upper-content{inset:0;overflow:hidden}\n.bw2-host .bw2-stats-table{left:3.7948%;right:3.7948%;top:18.493%;width:auto;font-size:3.9cqw;line-height:1.2}\n.bw2-host .bw2-stat-row{grid-template-columns:repeat(2,minmax(0,1fr));height:5.181cqw;align-items:center}\n.bw2-host .bw2-stat-label{justify-self:center;width:4em;padding:0;text-align:left}\n.bw2-host .bw2-stats-table .bw2-stat-value,.bw2-host .bw2-stats-table .bw2-field-value{padding:0;text-align:center;line-height:1.1}\n.bw2-host .bw2-detail-types{position:absolute;z-index:2;left:8%;top:3%;width:50%;height:7.46%;display:flex;align-items:center}\n.bw2-host .bw2-detail-types .types{display:flex;flex-wrap:nowrap;justify-content:flex-start;gap:1.6cqw;padding-left:0;margin:0}\n.bw2-host .bw2-detail-types .type-chip{font-size:3.1cqw;width:12.7cqw;min-width:12.7cqw;height:5.2cqw;padding:0 1.3cqw;border-radius:0;display:flex;align-items:center;justify-content:center;line-height:1;border:1px solid #0003}\n.bw2-host .bw2-field-value{color:#434950;padding-left:1.8cqw;font-variant-numeric:tabular-nums}\n.bw2-host .bw2-trait-heading{height:5.699cqw;font-size:3.8cqw;flex-shrink:0}\n.bw2-host .bw2-detail-moves{left:8%;top:13%;width:50%}\n.bw2-host .bw2-detail .dt-move-cell{aspect-ratio:300/68;padding:.6cqw 4.4cqw}\n.bw2-host .bw2-detail .dt-move-cell .move-name{font-size:3.5cqw;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}\n.bw2-host .bw2-detail .dt-move-cell .type-chip,.bw2-host .bw2-detail .dt-move-cell .move-type{font-size:3cqw;padding:0 1cqw;width:12cqw;min-width:12cqw;height:4.6cqw;display:flex;align-items:center;justify-content:center}\n.bw2-host .bw2-move-meta{grid-template-columns:12cqw 1fr;font-size:3.4cqw}\n.bw2-host .bw2-move-actions{position:absolute;z-index:2;left:14.25%;top:86.2%;width:40%;height:9%;display:flex;align-items:stretch;gap:1cqw}\n.bw2-host .bw2-box-action,.bw2-host .bw2-detail .dt-more-btn{position:static;flex:1;min-width:0;min-height:0;width:auto;height:100%;margin:0;padding:0 1cqw;border:1px solid #91a5b3;border-radius:0;background:#cbd3d7;color:#35434d;font-family:inherit;font-size:3.1cqw;font-weight:600;line-height:1.1;white-space:nowrap;cursor:pointer}\n.bw2-host .bw2-box-action:disabled{opacity:.5;cursor:default}\n.bw2-host .bw2-move-actions button:focus-visible,.bw2-host .bw2-detail-close:focus-visible,.bw2-host [data-bw2-info]:focus-visible{outline:2px solid #45d5e5;outline-offset:-2px}\n.bw2-host .bw2-detail .bw2-detail-close{z-index:3;right:.5%;top:2.05%;margin:0;padding:0;border:0;background:none;color:#fff1df;cursor:pointer}\n.bw2-host .bw2-scene-nameplate [data-bw2-info]{cursor:pointer}\n.bw2-host .bw2-title-band{z-index:3;padding:0 2cqw;gap:1cqw}\n.bw2-host .bw2-detail .modal-name{flex:1;min-width:0;height:100%;padding:0;font-size:3.8cqw;letter-spacing:1.2px}\n.bw2-host .bw2-detail .modal-name span{font-size:3.2cqw;line-height:1.2;letter-spacing:.3px;margin-right:0}\n.bw2-host .bw2-detail .bw2-detail-close{position:static;flex:none;align-self:center;display:flex;align-items:center;justify-content:center;width:8.3cqw;height:8.3cqw;min-height:0;font-family:Arial,sans-serif;font-size:5.8cqw;line-height:1}\n.bw2-host .bw2-detail .dt-move-grid{gap:.75cqw}\n.bw2-host .bw2-box-action{position:relative;isolation:isolate;display:flex;align-items:center;justify-content:center;background:none;border:0;padding:0 3.3cqw}\n.bw2-host .bw2-box-frame{position:absolute;inset:0;width:100%;height:100%;z-index:-1;pointer-events:none}\n.bw2-host .bw2-box-frame polygon{fill:#cbd3d7;stroke:#91a5b3;stroke-linejoin:miter;vector-effect:non-scaling-stroke}\n.bw2-host .bw2-move-actions.has-more .bw2-box-action{padding:0 1.3cqw;font-size:2.8cqw}\n.bw2-host .bw2-detail-intimacy .bw2-field-value{position:relative;line-height:1.1;font-variant-numeric:tabular-nums}\n.bw2-host .bw2-detail-experience{position:absolute;z-index:2;left:12.18%;top:69.863%;width:69.17%;height:8.904%;color:#354650;font-size:3.5cqw;font-weight:600}\n.bw2-host .bw2-exp-frame{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible}\n.bw2-host .bw2-exp-label{position:absolute;inset:0 auto 0 0;width:44%;padding-left:0;padding-right:1cqw;display:flex;align-items:center;justify-content:center;font-size:3.8cqw;color:#eef3f4}\n.bw2-host .bw2-exp-progress{position:absolute;left:38.951%;right:.52cqw;top:.52cqw;bottom:.52cqw;padding:0;background:none;overflow:hidden;clip-path:none}\n.bw2-host .bw2-exp-fill{fill:#96c6d4}\n.bw2-host .bw2-exp-numbers{position:absolute;inset:0;display:flex;justify-content:center;align-items:center;gap:.7cqw;padding:0 3.2cqw;font-size:3.5cqw;line-height:1.1;white-space:nowrap;color:#2e414c;font-variant-numeric:tabular-nums}\n.bw2-host .bw2-exp-current,.bw2-host .bw2-exp-remaining{margin:0;padding:0;background:none;font-size:inherit;font-weight:600;line-height:inherit}\n.bw2-host .bw2-exp-slash{font-weight:400}\n\n.bw2-host:has(.bw2-detail) .pkm-hud-sub .modal{width:min(100%,460px);max-width:460px}\n.bw2-host .bw2-detail-header{position:relative;aspect-ratio:386/36;width:100%}\n.bw2-host .bw2-header-cap{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}\n.bw2-host .bw2-detail-header .bw2-title-band{top:44.444%;height:55.556%}\n.bw2-host .bw2-summary-scene{margin-top:1.04cqw}\n.bw2-host .bw2-detail-data{margin-top:2.6cqw;aspect-ratio:386/248}\n.bw2-host .bw2-detail-data .bw2-stats-table{top:4.0323%}\n.bw2-host .bw2-detail-data .bw2-detail-experience{top:64.5161%}\n.bw2-host .bw2-detail-moves{z-index:4}\n.bw2-host .bw2-detail-types,.bw2-host .bw2-move-actions{z-index:4}\n.bw2-host .bw2-scene-nameplate,.bw2-host .bw2-scene-held,.bw2-host .bw2-scene-markings{z-index:3}\n.bw2-host .bw2-detail{background-color:#121625;border-color:rgba(201,230,251,.55)}\n.bw2-host .bw2-detail-canvas{background:#121625}\n.bw2-host .bw2-screen-face,.bw2-host .bw2-lower-face{fill:#9088f1;fill-opacity:.25}\n.bw2-host .bw2-rim-shadow{stroke-opacity:0}\n.bw2-host .bw2-rim-white{stroke:#c9e6fb;stroke-opacity:.55;stroke-width:2}\n.bw2-host .bw2-trait-divider-white{stroke:#c9e6fb;stroke-opacity:.55}\n.bw2-host .bw2-top-cap{stroke:rgba(201,230,251,.55)}\n.bw2-host .bw2-level-shade{fill:#121625}\n.bw2-host .bw2-detail-data .bw2-detail-experience{left:12.1761658%;width:69.1709845%;height:8.8709677%}\n.bw2-host .bw2-detail-data .bw2-trait-heading{height:calc(var(--bw2-detail-data-height) * 22 / 248)}\n.bw2-host :is(.bw2-experience-strip,.bw2-trait-strip){filter:drop-shadow(0 1.5px 1.2px #080f1b88)}\n.bw2-host :is(.bw2-experience-strip,.bw2-trait-strip)>.bw2-rim-white{stroke:#a3b3be;stroke-opacity:1;stroke-width:2.2;vector-effect:non-scaling-stroke}\n.bw2-host :is(.bw2-strip-highlight,.bw2-move-highlight){fill:none;stroke:#f2f8fb;stroke-opacity:.48;stroke-width:1;vector-effect:non-scaling-stroke;pointer-events:none}\n.bw2-host :is(.bw2-strip-depth,.bw2-move-depth){fill:none;stroke:#263343;stroke-opacity:.5;stroke-width:1.2;vector-effect:non-scaling-stroke;pointer-events:none}\n.bw2-host .bw2-move-highlight{stroke:var(--bw2-move-color,#888);stroke-opacity:.65}\n.bw2-host .bw2-detail .dt-move-cell{filter:drop-shadow(0 2px 2px #080d1866)}\n.bw2-host .bw2-detail .dt-move-cell .bw2-move-frame{filter:none}\n.bw2-host .bw2-detail-data .bw2-detail-strips{--bw2-strip-height:calc(var(--bw2-detail-data-height) * 22 / 248);--bw2-strip-gap:calc(var(--bw2-detail-data-height) * 6 / 248);position:absolute;left:12.1761658%;top:64.516129%;width:69.1709845%;display:grid;grid-template-rows:repeat(3,var(--bw2-strip-height));gap:var(--bw2-strip-gap)}\n.bw2-host .bw2-detail-data .bw2-detail-strips>.bw2-detail-experience,.bw2-host .bw2-detail-data .bw2-detail-strips>.bw2-trait-heading{position:relative;isolation:isolate;inset:auto;width:100%;height:100%;margin:0;padding:0;min-height:0}\n.bw2-host .bw2-trait-frame{position:absolute;inset:0;width:100%;height:100%;z-index:-1;pointer-events:none;overflow:visible}\n.bw2-host .bw2-move-category{color:var(--bw2-move-color,#888)}\n.bw2-host .bw2-move-category svg{width:4.8cqw;height:3.84cqw;fill:none;stroke:none;filter:drop-shadow(0 1px 1px #0005)}\n.bw2-host :is(.dt-move-cell,.move-cell)[data-mvtype]{border-color:var(--bw2-move-color,#888)!important}\n.bw2-host :is(.dt-move-cell,.move-cell)[data-mvtype] :is(.type-chip,.move-type){background-color:var(--bw2-move-color,#888)!important}\n.bw2-host .bw2-colored-category{color:var(--bw2-move-color,#888);fill:none;stroke:none;filter:drop-shadow(0 1px 1px #0005)}\n.bw2-host .bw2-scene-shadow{position:absolute;inset:0;z-index:1;pointer-events:none;clip-path:none}\n.bw2-host .bw2-shadow-sprite{position:absolute;left:49%;top:24%;width:51%;height:49%;transform:translate(-7.8cqw,-4.2cqw);-webkit-filter:brightness(0)!important;filter:brightness(0)!important}\n.bw2-host .bw2-shadow-sprite .dt-sprite{position:absolute;inset:0;margin:0;display:flex;align-items:center;justify-content:center}\n.bw2-host .bw2-shadow-sprite .dt-big{width:100%!important;height:100%!important;background-size:contain!important;background-repeat:no-repeat;background-position:center;filter:none}\n.bw2-host .bw2-scene-sprite .dt-big{filter:none}\n\n.bw2-host .bw2-summary-scene{isolation:isolate}\n.bw2-host .bw2-scene-panels{position:absolute;inset:0;width:100%;height:100%;z-index:3;pointer-events:none}\n.bw2-host .pkm-hud-overlay{background:rgba(8,12,22,.68);backdrop-filter:none;-webkit-backdrop-filter:none}\n.bw2-host .bw2-popup{--text:#3e494d;--dim:#596a70;--frame:rgba(201,230,251,.55);position:relative;isolation:isolate;display:flex;flex-direction:column;width:100%;max-width:460px;max-height:100%;min-height:70px;padding:0;border:0;border-radius:0;background:none;box-shadow:none;overflow:hidden;color:var(--text);font-family:'Microsoft YaHei','SimHei',sans-serif}\n.bw2-host .bw2-popup *{box-sizing:border-box;text-shadow:none}\n.bw2-host .bw2-popup>.modal-head,.bw2-host .bw2-popup>.modal-body,.bw2-host .bw2-popup>.action-btns{position:relative;z-index:2;flex-shrink:0}\n.bw2-host .bw2-popup>.modal-head{display:flex;align-items:center;gap:12px;min-height:44px;margin:12px 12px 0;padding:6px 8px 6px 12px;border:1px solid rgba(201,230,251,.35);background:#252a2b}\n.bw2-host .bw2-popup .modal-name{flex:1;min-width:0;color:#e7eceb;font-size:17px;font-weight:800;line-height:1.4;overflow-wrap:anywhere}\n.bw2-host .bw2-popup .close{display:flex;align-items:center;justify-content:center;flex:0 0 32px;min-width:32px;min-height:32px;margin:0;padding:0;border:0;border-radius:0;background:none;color:#e58b75;font-size:24px;font-family:Arial,sans-serif;line-height:1;opacity:1;cursor:pointer}\n.bw2-host .bw2-popup>.modal-body{flex:1 1 auto;min-height:0;margin:10px 12px 12px;padding:12px;border:1px solid rgba(201,230,251,.35);background:#cbd3d7;color:#3e494d;overflow:auto;overscroll-behavior:contain;scrollbar-width:thin;scrollbar-color:#7f9099 #cbd3d7;font-size:14px;line-height:1.6}\n.bw2-host .bw2-popup .row{display:flex;align-items:stretch;gap:0;margin:0 0 8px;padding:0;border:1px solid #a9b4ba;background:#d8dfe2;color:#3e494d;font-size:14px;line-height:1.6}\n.bw2-host .bw2-popup .row:last-child{margin-bottom:0}\n.bw2-host .bw2-popup .row .k{flex:0 0 104px;display:flex;align-items:center;padding:7px 10px;background:#858f94;color:#f2f5f5;font-weight:700;white-space:normal}\n.bw2-host .bw2-popup .row .v{flex:1;min-width:0;padding:7px 10px;overflow-wrap:anywhere;text-align:left}\n.bw2-host .bw2-popup .row.block{flex-direction:column;align-items:stretch;gap:0}\n.bw2-host .bw2-popup .row.block .k,.bw2-host .bw2-popup .row.block .v{flex:0 0 auto}\n.bw2-host .bw2-popup .row.block .k{padding:4px 10px}\n.bw2-host .bw2-popup .dim,.bw2-host .bw2-popup .empty,.bw2-host .bw2-popup .modal-sub{color:#596a70;text-shadow:none}\n.bw2-host .bw2-popup .empty{padding:14px 8px;text-align:center;font-size:14px;line-height:1.6}\n.bw2-host .bw2-popup .abi-link{color:#315f77;text-underline-offset:3px}\n.bw2-host .bw2-popup .action-btns{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:12px}\n.bw2-host .bw2-popup>.action-btns{margin:0 12px 12px;padding:0}\n.bw2-host .bw2-popup .action-btns>.act-btn:only-child{grid-column:1/-1}\n.bw2-host .bw2-popup .act-btn{position:relative;isolation:isolate;display:flex;align-items:center;justify-content:center;width:100%;min-height:42px;padding:9px 18px;border:0;border-radius:0;background:none;color:#edf1f1;font-family:inherit;font-size:14px;font-weight:700;line-height:1.5;white-space:normal;overflow-wrap:anywhere;box-shadow:none;cursor:pointer}\n.bw2-host .bw2-popup .act-btn:disabled{opacity:.5;cursor:default}\n.bw2-host .bw2-popup :is(button,input,select,textarea):focus-visible{outline:2px solid #32b7ed;outline-offset:2px}\n.bw2-host .bw2-popup :is(input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=file]):not([type=color]),select,textarea){max-width:100%;border:1px solid #8d9da6!important;border-radius:0!important;background:#e5eaec!important;color:#35444d!important;font-family:inherit;line-height:1.5;box-shadow:none!important}\n.bw2-host .bw2-popup :is(input[type=checkbox],input[type=radio],input[type=range]){accent-color:#3680a0}\n.bw2-host .bw2-popup :is(.pkm-form-btn,.btn-small){border-radius:0;box-shadow:none}\n.bw2-host .bw2-popup :is(.pkm-big,.pkm-forms){border-bottom-style:solid;border-color:#a9b4ba}\n.bw2-host .bw2-popup .dt-move-grid{gap:8px}\n.bw2-host .bw2-popup .dt-move-cell{border-radius:0;border:1px solid #a17bbb;background:#414544;box-shadow:none}\n.bw2-host .bw2-popup .dt-move-cell .move-name{color:#edf1f1}\n.bw2-host .bw2-popup .dt-move-cell .move-type{border-radius:0;text-shadow:none}\n@container bw2-layout (max-width:420px){.bw2-host .bw2-popup>.modal-head{margin:10px 10px 0}.bw2-host .bw2-popup>.modal-body{margin:8px 10px 10px;padding:10px}.bw2-host .bw2-popup>.action-btns{margin:0 10px 10px}.bw2-host .bw2-popup .row .k{flex-basis:88px}.bw2-host .bw2-popup .action-btns{gap:8px}}\n.bw2-host .bw2-upper-dialog>.bw2-encounter>.modal-body{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:16px;overflow:hidden;background:#cbd3d7}\n.bw2-host .bw2-encounter-portrait{position:relative;display:flex;align-items:center;justify-content:center;min-width:0;min-height:0;padding:18px;background:#283445;background-image:var(--bw2-original-grid);border:2px solid #91a5b6;border-radius:4px;box-shadow:inset 0 1px #fff5,0 3px 6px #0003;overflow:hidden}\n.bw2-host .bw2-encounter-portrait .action-img{width:100%;height:100%;min-height:0;background-size:contain;background-position:center;background-repeat:no-repeat;image-rendering:pixelated}\n.bw2-host .bw2-encounter-side{display:flex;flex-direction:column;justify-content:center;gap:16px;min-width:0;min-height:0}\n.bw2-host .bw2-encounter-info{display:flex;flex-direction:column;gap:10px;padding:14px;background:linear-gradient(#536475,#293241);border:1px solid #91a5b6;border-radius:4px;box-shadow:inset 0 1px #fff4,0 3px 6px #0003;color:#e3ebf3}\n.bw2-host .bw2-encounter-info .nearby-name{font-size:18px;font-weight:800;line-height:1.4;color:#e3ebf3;overflow-wrap:anywhere}\n.bw2-host .bw2-encounter-info .nearby-sub{font-size:14px;color:#c6d1e4}\n.bw2-host .bw2-encounter-info .nb-pillbar{display:flex;flex-wrap:wrap;gap:5px}\n.bw2-host .bw2-encounter-side .action-btns{display:grid;grid-template-columns:1fr;gap:10px;margin:0}\n.bw2-host .bw2-encounter-side .act-btn{min-height:44px;font-size:16px}\n.bw2-host .hud.bw2-console{container-type:inline-size;position:relative;isolation:isolate;display:flex;flex-direction:column;padding:0;border:1px solid #87929a;border-radius:12px;background:#303a40;box-shadow:0 14px 28px #0006,inset 0 1px #c3cbd14d;overflow:hidden}\n.bw2-host .bw2-console::before{display:none}\n.bw2-host .bw2-console-lid,.bw2-host .bw2-console-base{position:relative;z-index:1;display:flex;flex-direction:column;min-width:0;min-height:0;padding:0 7px;background:linear-gradient(100deg,#454e54,#343e44 32%,#3c464c 80%,#4a5359);box-shadow:inset 1px 0 #d1d8de22,inset -1px 0 #0d141777}\n.bw2-host .bw2-console-lid{padding-bottom:7px;border-radius:11px 11px 2px 2px}\n.bw2-host .bw2-console-base{padding-top:7px;border-radius:2px 2px 11px 11px}\n.bw2-host .bw2-console-bezel{flex:0 0 19px;display:flex;align-items:center;justify-content:center;gap:18px;color:#a8b0b5;font-size:8px;font-weight:700;letter-spacing:2px}\n.bw2-host .bw2-console-bezel i{display:block;width:4px;height:4px;border-radius:50%;background:#172127;border:1px solid #6b787f}\n.bw2-host .bw2-screen{position:relative;display:flex;flex-direction:column;flex:1 1 auto;min-width:0;min-height:0;background-color:#121625;background-image:var(--bw2-original-grid);border:1px solid #8996a0;box-shadow:0 0 0 2px #192126;overflow:hidden}\n.bw2-host .bw2-display-caption{display:flex;align-items:center;justify-content:space-between;gap:12px;flex:0 0 32px;min-width:0;padding:0 12px;background:#171e2acc;border-bottom:1px solid #c9e6fb44;color:#c9d4e2;font-size:12px}\n.bw2-host .bw2-display-caption strong{color:#e1e9ef;font-size:14px;letter-spacing:2px}\n.bw2-host .bw2-display-caption span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-variant-numeric:tabular-nums}\n.bw2-host .bw2-console .hud-inner{height:auto!important;flex:1 1 auto;min-height:0;overflow:hidden}\n.bw2-host .bw2-display-area .tab-panel{height:100%;padding:0 3px 0 0;overflow:auto;scrollbar-width:thin;scrollbar-color:#7c8fa4 #121625}\n.bw2-host .bw2-display-area .grid{margin:0;gap:16px}\n.bw2-host .bw2-display-area .col-right{padding-top:0}\n.bw2-host .bw2-console-hinge{position:relative;z-index:2;flex:0 0 20px;margin:0 1px;display:flex;align-items:center;justify-content:space-between;gap:5px;border-top:1px solid #111c21;border-bottom:1px solid #111c21;background:linear-gradient(180deg,#68747c 0,#47545c 17%,#2c363e 55%,#1c282e 80%,#485760 100%);box-shadow:inset 0 1px #dae1e24d,0 1px #afb7bd33}\n.bw2-host .bw2-console-hinge i{flex:0 0 29px;height:100%;border-left:1px solid #b2bcc233;border-right:1px solid #10191dbb;border-radius:4px;background:linear-gradient(180deg,#637078,#35424a 40%,#1c282e 80%,#45535b)}\n.bw2-host .bw2-console-hinge span{width:52px;height:2px;background:#121c22;border-top:1px solid #a6b1b933;opacity:.75}\n.bw2-host .bw2-control-toolbar{display:flex;align-items:center;gap:8px;flex:0 0 32px;padding:0 10px;background:#252a2b;color:#e7eceb;border-bottom:1px solid #c9e6fb44}\n.bw2-host .bw2-control-toolbar>strong{flex:1;min-width:0;font-size:11px;letter-spacing:1.6px;font-weight:800}\n.bw2-host .bw2-control-toolbar .refresh-ic{margin:0;color:#dce4e8}\n.bw2-host .bw2-control-area #tab-4{display:block;flex:1 1 auto;min-height:0;height:auto;overflow:auto;scrollbar-width:thin;scrollbar-color:#7c8fa4 #121625}\n.bw2-host .bw2-control-area .bw2-menu-screen{margin:0;border:1px solid #85969a}\n.bw2-host .bw2-control-area .bw2-menu-button{padding:5px 10px;gap:9px}\n.bw2-host .bw2-control-area .bw2-menu-icon{flex-basis:28px}\n.bw2-host .bw2-control-area .bw2-menu-icon svg{width:27px;height:27px}\n.bw2-host .bw2-control-area .bw2-menu-button .menu-label{font-size:14px}\n.bw2-host .bw2-control-area .tab-bar{flex:0 0 40px;margin:0}\n.bw2-host .bw2-control-area .tab-btn{padding:3px 0;font-size:12px;line-height:1.4}\n.bw2-host .bw2-console-foot{display:flex;align-items:center;justify-content:flex-end;gap:4px;flex:0 0 10px;padding:0 7px}\n.bw2-host .bw2-console-foot span{width:14px;height:2px;background:#19262d;border-top:1px solid #a2afb52b}\n.bw2-host .bw2-console-foot i{width:3px;height:3px;border-radius:50%;background:#62a7b8;box-shadow:0 0 2px #62a7b866}\n.bw2-host .bw2-console>.pkm-hud-overlay,.bw2-host .bw2-console>.pkm-hud-page-overlay{inset:7px;padding:7px;overflow:hidden;background:rgba(8,12,22,.68);backdrop-filter:none;-webkit-backdrop-filter:none}\n.bw2-host .bw2-console .pkm-hud-page-overlay .page{display:flex;flex-direction:column;max-width:100%;max-height:100%;min-height:0;border:1px solid rgba(201,230,251,.55);border-radius:2px;background-color:#121625;box-shadow:none;overflow:hidden}\n.bw2-host .bw2-console .page-head{position:relative;flex:0 0 38px;min-height:38px;padding:4px 10px;background:#252a2b;border-bottom:1px solid #c9e6fb55}\n.bw2-host .bw2-console .page-body{flex:1 1 auto;min-height:0;padding:12px;overflow:auto;overscroll-behavior:contain}\n.bw2-host .bw2-console .page-close{display:flex;align-items:center;justify-content:center;min-width:30px;min-height:30px;color:#e58b75;opacity:1}\n.bw2-host .bw2-console .map-focus .map-viewer-frame{min-height:190px;max-height:100%}\n.bw2-host .bw2-console :is(button,input,select,textarea):focus-visible{outline:2px solid #45d5e5;outline-offset:2px}\n#pkm-hud-win:has(.bw2-console)>#pkm-hud-close{top:1px;right:8px;width:18px;height:17px;min-height:0;padding:0;border:0;border-radius:0;background:none;color:#e58b75;font-size:16px;line-height:17px}\n#pkm-hud-win:has(.bw2-console)>#pkm-hud-close:hover{background:#ffffff12}\n.bw2-host .bw2-control-area .nearby-frame{margin:0 0 8px}\n.bw2-host .bw2-control-area .nearby-frame .nb-grid{gap:8px}\n.bw2-host .bw2-control-area .nb-grid>.nb-cell{width:calc((100% - 24px)/4);min-width:68px}\n.bw2-host .bw2-control-area .nearby-frame .nb-cell{gap:3px;padding:5px 3px;border-radius:5px}\n.bw2-host .bw2-control-area .nearby-frame .nb-icon{width:45px;height:45px}\n.bw2-host .bw2-control-area .nearby-frame .nb-name{font-size:11px}\n.bw2-host .bw2-control-area .nearby-frame .type-tag{font-size:10px}\n@container bw2-layout (max-width:430px){.bw2-host .bw2-console-lid{height:356px}.bw2-host .bw2-console-base{height:374px}.bw2-host .bw2-control-area .nearby-frame .nb-icon{width:38px;height:38px}}\n@container bw2-layout (max-width:430px){.bw2-host .hud.bw2-console{border-radius:9px}.bw2-host .bw2-console-lid,.bw2-host .bw2-console-base{padding-left:5px;padding-right:5px}.bw2-host .bw2-console .hud-inner{padding:10px 7px 7px}.bw2-host .bw2-display-area .grid{gap:10px}.bw2-host .bw2-display-area .col{gap:10px}.bw2-host .bw2-display-area .col+.col{margin-top:12px}.bw2-host .bw2-console-hinge{flex-basis:17px}.bw2-host .bw2-control-area #tab-4{padding:7px}.bw2-host .bw2-control-area .bw2-menu-grid{gap:6px}.bw2-host .bw2-control-area .bw2-menu-button{padding:5px 7px;gap:5px}.bw2-host .bw2-control-area .bw2-menu-button .menu-label{font-size:13px}.bw2-host .bw2-display-caption{padding:0 8px}.bw2-host .bw2-console>.pkm-hud-overlay,.bw2-host .bw2-console>.pkm-hud-page-overlay{inset:5px;padding:5px}}\n\n@container bw2-layout (max-width:340px){.bw2-host .bw2-console-lid{height:380px}}\n.bw2-host .bw2-display-area #tab-1{position:relative}\n.bw2-host .bw2-display-area #badge-entry{display:flex;flex-direction:row;align-items:center;gap:6px;padding:3px 0;min-width:0}\n.bw2-host .bw2-display-area #badge-entry>.k{flex:0 0 auto;margin:0}\n.bw2-host .bw2-display-area #badge-entry>.v{flex:1;min-width:0}\n.bw2-host .bw2-display-area .badge-line{margin:0;padding:0;gap:5px;flex-wrap:nowrap}\n.bw2-host .bw2-display-area .badge-row{flex:1;min-width:0;flex-wrap:nowrap;overflow-x:auto;justify-content:flex-start;scrollbar-width:none}\n.bw2-host .bw2-display-area .badge-row>*{flex-shrink:0}\n.bw2-host .bw2-display-area .badge-region{font-size:10px}\n.bw2-host .bw2-display-area .badge-more{display:none}\n.bw2-host .bw2-console>.pkm-hud-overlay.open:has(>.bw2-detail){inset:0;padding:0;background:transparent;backdrop-filter:none;pointer-events:none}\n.bw2-host .bw2-console .bw2-detail{position:absolute;inset:0;width:100%!important;max-width:none!important;height:100%;max-height:none!important;border:0;border-radius:0;box-shadow:none;background:transparent;pointer-events:none;overflow:visible}\n.bw2-host .bw2-console .bw2-detail>.modal-body,.bw2-host .bw2-console .bw2-detail-canvas{display:contents}\n.bw2-host .bw2-console .bw2-detail-header,.bw2-host .bw2-console .bw2-summary-scene,.bw2-host .bw2-console .bw2-detail-data{position:absolute;left:50%;transform:translateX(-50%);margin:0;container-type:inline-size;pointer-events:auto}\n.bw2-host .bw2-console .bw2-detail-header{top:var(--bw2-detail-top);width:var(--bw2-detail-upper-width)}\n.bw2-host .bw2-console .bw2-summary-scene{top:var(--bw2-detail-scene-top);width:var(--bw2-detail-upper-width)}\n.bw2-host .bw2-console .bw2-detail-data{top:var(--bw2-detail-bottom);width:var(--bw2-detail-lower-width)}\n.bw2-host .bw2-console:has(>.pkm-hud-overlay.open>.bw2-detail) .bw2-screen{background-color:#121625}\n.bw2-host .bw2-console:has(>.pkm-hud-overlay.open>.bw2-detail) .bw2-screen>*{visibility:hidden}\n.bw2-host .bw2-display-area:has(#tab-1.active)>.bw2-display-caption{display:none}\n.bw2-host .bw2-console .hud-inner{padding:8px 10px}\n.bw2-host .bw2-display-area .col{gap:8px}\n.bw2-host .bw2-display-area .col+.col{margin-top:12px}\n.bw2-host .bw2-console-hinge{flex-basis:16px}\n.bw2-host .bw2-control-area #tab-4{padding:8px}\n.bw2-host .bw2-control-area .bw2-menu-screen{padding:6px}\n.bw2-host .bw2-display-area [data-badge-open]{min-height:24px}\n.bw2-host .bw2-display-area .refresh-ic{min-width:24px;min-height:24px}\n.bw2-host .bw2-console .bw2-detail-close{min-width:28px;min-height:24px}\n@container bw2-layout (max-width:430px){.bw2-host .bw2-console .hud-inner{padding:6px}.bw2-host .bw2-console-hinge{flex-basis:14px}.bw2-host .bw2-display-area .col{gap:8px}.bw2-host .bw2-display-area .col+.col{margin-top:10px}.bw2-host .bw2-control-area #tab-4{padding:6px}}\n.bw2-host .bw2-control-area .tab-bar{flex-basis:46px;min-height:46px;padding:5px 9px 7px;gap:8px;background:linear-gradient(#424d53,#273239);border-top:1px solid #aebdc455;box-shadow:inset 0 2px 4px #0008}\n.bw2-host .bw2-control-area .tab-btn{position:relative;min-height:32px;border:1px solid #83929a;border-bottom:3px solid #172027;border-radius:4px 4px 9px 9px;background:linear-gradient(#55646e,#34424b);box-shadow:inset 0 1px #e6efff33,0 2px 3px #0006;color:#e3eaf0;letter-spacing:1px;font-weight:700}\n.bw2-host .bw2-control-area .tab-btn.active{background:linear-gradient(#bad1d5,#83a5af);color:#162a35;border-color:#a6c7ce;border-bottom-color:#4c717c;box-shadow:inset 0 2px 4px #152b3544,0 1px #a9ccd577}\n.bw2-host .bw2-control-area .tab-btn:active{transform:translateY(1px);box-shadow:inset 0 2px 4px #0005}\n.bw2-host .bw2-control-area #tab-4.bw2-menu-full{display:flex;padding:6px;overflow:hidden}\n.bw2-host .bw2-menu-full .bw2-menu-screen{flex:1;min-height:0;display:flex;padding:6px}\n.bw2-host .bw2-menu-full .bw2-menu-grid{width:100%;height:100%;grid-template-rows:repeat(4,minmax(0,1fr));gap:6px 8px}\n.bw2-host .bw2-menu-full .bw2-menu-button{min-height:0;height:100%;padding:4px 9px}\n.bw2-host .bw2-console .bw2-detail-header{height:var(--bw2-detail-header-height);aspect-ratio:auto}\n.bw2-host .bw2-console .bw2-summary-scene{height:var(--bw2-detail-scene-height);aspect-ratio:auto;--bw2-detail-unit:var(--bw2-detail-upper-unit)}\n.bw2-host .bw2-console .bw2-detail-data{height:var(--bw2-detail-data-height);aspect-ratio:auto;--bw2-detail-unit:var(--bw2-detail-lower-unit)}\n.bw2-host .bw2-console .bw2-detail .modal-name{font-size:clamp(13px,3.8cqw,20px)}\n.bw2-host .bw2-console .bw2-detail .modal-name span{font-size:clamp(12px,3.2cqw,17px)}\n.bw2-host .bw2-console .bw2-detail-header .bw2-title-band{top:12px;height:24px}\n.bw2-host .bw2-console .bw2-detail-close{width:32px;height:24px;font-size:26px}\n.bw2-host .bw2-console .bw2-detail-moves{height:70%}\n.bw2-host .bw2-console .bw2-detail .dt-move-grid{height:100%;grid-template-rows:repeat(4,minmax(0,1fr));gap:calc(.75 * var(--bw2-detail-unit))}\n.bw2-host .bw2-console .bw2-detail .dt-move-cell{aspect-ratio:auto;height:100%;padding:calc(.6 * var(--bw2-detail-unit)) 4.4cqw}\n.bw2-host .bw2-console .bw2-detail .dt-move-cell .move-name{font-size:calc(3.5 * var(--bw2-detail-unit))}\n.bw2-host .bw2-console .bw2-detail .dt-move-cell .move-type,.bw2-host .bw2-console .bw2-detail .dt-move-cell .type-chip{font-size:calc(3 * var(--bw2-detail-unit));height:calc(4.6 * var(--bw2-detail-unit))}\n.bw2-host .bw2-console .bw2-move-meta{font-size:calc(3.4 * var(--bw2-detail-unit))}\n.bw2-host .bw2-console .bw2-name-meta{height:calc(6.8 * var(--bw2-detail-unit))}\n.bw2-host .bw2-console .bw2-scene-nameplate .dt-top{min-height:calc(5.3 * var(--bw2-detail-unit))}\n.bw2-host .bw2-console .bw2-scene-nameplate .dt-name{font-size:clamp(12px,var(--bw2-name-font),calc(4.1 * var(--bw2-detail-unit)))!important}\n.bw2-host .bw2-console .bw2-scene-nameplate .bw2-detail-level{font-size:calc(3.75 * var(--bw2-detail-unit))}\n.bw2-host .bw2-console .bw2-basic-ball,.bw2-host .bw2-console .bw2-state-badge,.bw2-host .bw2-console .bw2-scene-nameplate .item-icon{width:calc(4.7 * var(--bw2-detail-unit))!important;height:calc(4.7 * var(--bw2-detail-unit))!important}\n.bw2-host .bw2-console .bw2-scene-held .dt-hold{font-size:calc(4 * var(--bw2-detail-unit))}\n.bw2-host .bw2-console .bw2-held-name{font-size:calc(3.8 * var(--bw2-detail-unit))}\n.bw2-host .bw2-console .bw2-stats-table{font-size:calc(3.9 * var(--bw2-detail-unit))}\n.bw2-host .bw2-console .bw2-stat-row{height:calc(var(--bw2-detail-data-height) * 20 / 248)}\n.bw2-host .bw2-console .bw2-trait-heading{height:calc(var(--bw2-detail-data-height) * 22 / 248);font-size:calc(3.8 * var(--bw2-detail-unit))}\n.bw2-host .bw2-console .bw2-exp-label{font-size:calc(3.8 * var(--bw2-detail-unit))}\n.bw2-host .bw2-console .bw2-exp-numbers{font-size:calc(3.5 * var(--bw2-detail-unit))}\n.bw2-host .bw2-control-area #tab-4.bw2-command-full{display:flex;flex-direction:column;gap:6px;padding:6px}\n.bw2-host .bw2-command-screen{display:flex;flex-direction:column;flex:1 0 274px;min-height:274px;padding:6px!important}\n.bw2-host .bw2-command-grid{flex:1;min-height:0;grid-template-rows:repeat(4,minmax(0,1fr));gap:6px 8px}\n.bw2-host .bw2-command-tile{position:relative;min-width:0;min-height:0}\n.bw2-host .bw2-command-tile>.bw2-menu-button{width:100%;height:100%;min-height:0;padding:5px 34px 5px 9px}\n.bw2-host .bw2-command-screen .bw2-menu-icon{flex-basis:30px}\n.bw2-host .bw2-command-screen .bw2-menu-icon img{width:30px;height:30px;object-fit:contain}\n.bw2-host .bw2-command-screen .menu-label{font-size:14px;white-space:nowrap;min-width:0}\n.bw2-host .bw2-command-help{position:absolute;z-index:2;right:6px;top:50%;transform:translateY(-50%);width:24px;height:28px;min-width:24px;min-height:24px;padding:0;border:1px solid #a5b4b066;border-radius:0;background:#282e2f;color:#d4dedc;font-size:15px;font-weight:700;cursor:pointer}\n.bw2-host .bw2-command-hint{flex:none;margin:5px 0 0;font-size:10px;color:#536164;text-align:center;line-height:1.4}\n.bw2-host .bw2-command-tile .bw2-cmd-filled{background:#3c6664;color:#fff}\n@container bw2-layout (max-width:430px){.bw2-host .bw2-command-screen{flex-basis:268px;min-height:268px}.bw2-host .bw2-command-grid{gap:6px}.bw2-host .bw2-command-screen .bw2-menu-icon{flex-basis:22px}.bw2-host .bw2-command-screen .bw2-menu-icon img{width:22px;height:22px}.bw2-host .bw2-command-screen .menu-label{font-size:12px;letter-spacing:0}.bw2-host .bw2-command-tile>.bw2-menu-button{padding-left:6px;padding-right:30px;gap:5px}.bw2-host .bw2-command-help{right:4px}.bw2-host .bw2-command-hint{font-size:9px}}\n.bw2-host .bw2-control-area #tab-4:is(.bw2-menu-full,.bw2-command-full){padding:6px;gap:0}\n.bw2-host .bw2-control-area .bw2-command-screen{flex:1 0 274px;min-height:274px}\n.bw2-host .bw2-control-area .bw2-command-hint{display:none}\n.bw2-host .bw2-control-area .bw2-command-grid{gap:6px 8px;height:100%}\n.bw2-host .bw2-control-area .bw2-menu-grid{gap:12px 14px}\n.bw2-host .bw2-menu-full .bw2-menu-grid,.bw2-host .bw2-command-grid{grid-template-rows:repeat(4,var(--bw2-action-height,54px));align-content:space-between}\n.bw2-host .bw2-control-area #tab-4:not(.bw2-menu-full):not(.bw2-command-full) .bw2-menu-grid{grid-template-rows:repeat(2,var(--bw2-action-height,54px))}\n.bw2-host .bw2-control-area .nearby-frame{border:1px solid #c9e6fb66;border-radius:3px;background:#9088f126;filter:none;margin-bottom:12px}\n.bw2-host .bw2-control-area .nearby-frame>svg{display:none}\n.bw2-host .bw2-control-area .nearby-frame .info-inner{padding:8px}\n.bw2-host .bw2-control-area .nearby-frame .info-title{margin:0 0 7px;padding:0;font-size:12px}\n.bw2-host .bw2-control-area .nearby-frame .nb-grid{padding:0 0 4px}\n@container bw2-layout (max-width:430px){.bw2-host .bw2-control-area .bw2-menu-grid{gap:12px}}\n.bw2-host .bw2-console:has(.tab-btn[data-tab=\"1\"].active) .bw2-control-toolbar{display:flex}\n.bw2-host .bw2-control-area #tab-4:has(.bw2-home-screen){display:flex;overflow:hidden}\n.bw2-host .bw2-home-screen{flex:1;min-height:0;overflow:hidden}\n.bw2-host .bw2-home-screen>.bw2-menu-grid{left:6px;right:6px;bottom:10px}\n.bw2-host .bw2-home-nearby{left:7px;right:7px;top:7px;bottom:calc(2 * var(--bw2-action-height,54px) + 31px)}\n.bw2-host .bw2-home-nearby .nearby-frame{height:100%;margin:0;border:0;border-radius:0;background:none;overflow:hidden}\n.bw2-host .bw2-home-nearby .nearby-frame .info-inner{height:100%;padding:0;overflow:hidden}\n.bw2-host .bw2-home-nearby .info-title{display:none}\n.bw2-host .bw2-home-nearby .nb-grid{box-sizing:border-box;overflow-x:auto;overflow-y:hidden;scrollbar-color:#758895 #c6cfce}\n.bw2-host .bw2-home-nearby .nb-cell{box-sizing:border-box;overflow:hidden}\n.bw2-host .bw2-home-nearby .nb-thumb-wrap{flex:none;padding:0}\n.bw2-host .bw2-command-typechart .bw2-menu-icon{flex-basis:28px}\n.bw2-host .bw2-command-typechart .bw2-menu-icon svg{width:27px;height:27px}\n.bw2-host .bw2-command-typechart .menu-label{font-size:14px}\n@container bw2-layout (max-width:430px){.bw2-host .bw2-home-screen>.bw2-menu-grid{gap:12px}.bw2-host .bw2-command-typechart .menu-label{font-size:13px}}\n.bw2-host .bw2-home-nearby :is(.nb-name,.nb-count){color:#e3eaf0;text-shadow:none}\n@container bw2-layout (max-width:430px){.bw2-host .bw2-home-screen>.bw2-menu-grid{bottom:6px}}\n.bw2-host .bw2-control-area .bw2-command-full>.bw2-command-screen{flex:1 1 0;min-height:0}\n.bw2-host .bw2-control-area .bw2-menu-button{box-sizing:border-box!important;height:var(--bw2-action-height,54px)!important;min-height:var(--bw2-action-height,54px)!important;max-height:var(--bw2-action-height,54px)!important}\n.bw2-host .bw2-home-nearby .nb-grid{height:100%;scrollbar-width:none;-ms-overflow-style:none;scroll-behavior:smooth}\n.bw2-host .bw2-home-nearby .nb-grid::-webkit-scrollbar{display:none;width:0;height:0}\n.bw2-host .bw2-home-nearby .nb-cell{flex:0 0 var(--bw2-nearby-edge,112px)!important;width:var(--bw2-nearby-edge,112px)!important;min-width:var(--bw2-nearby-edge,112px)!important;height:var(--bw2-nearby-edge,112px)!important;max-height:var(--bw2-nearby-edge,112px);aspect-ratio:1;gap:2px;padding:4px 3px}\n.bw2-host .bw2-home-nearby .nb-name{line-height:1.1}\n.bw2-host .bw2-home-nearby .nb-count{line-height:1.1}\n.bw2-host .bw2-home-nearby .nb-type-chip,.bw2-host .bw2-home-nearby .type-chip{padding:2px 4px;min-width:0}\n.bw2-host .bw2-home-nearby .bw2-nearby-arrows{position:relative}\n.bw2-host .bw2-home-nearby .bw2-nearby-arrows .nb-grid{width:100%;margin:0}\n.bw2-host .bw2-nearby-arrow{position:absolute;z-index:5;top:50%;bottom:auto;transform:translateY(-50%);display:flex;align-items:center;justify-content:center;width:40px;height:48px;padding:0;border:0;border-radius:0;background:transparent!important;box-shadow:none!important;color:#fff;cursor:pointer;touch-action:manipulation}\n.bw2-host .bw2-nearby-arrow svg{width:28px;height:36px;overflow:visible;filter:drop-shadow(0 2px 3px #000a);transition:filter .15s,transform .15s}\n.bw2-host .bw2-nearby-arrow:hover:not(:disabled) svg{filter:drop-shadow(0 2px 4px #000d);transform:scale(1.08)}\n.bw2-host .bw2-nearby-arrow:active:not(:disabled) svg{transform:scale(.94)}\n.bw2-host .bw2-nearby-arrow:focus-visible{outline:2px solid #fff;outline-offset:-2px}\n.bw2-host .bw2-nearby-arrow.previous{left:0}\n.bw2-host .bw2-nearby-arrow.next{right:0}\n.bw2-host .bw2-nearby-arrow:disabled{opacity:.4;cursor:default}\n.bw2-host .hud.bw2-console{container-name:bw2-layout;width:600px!important;max-width:none!important;height:812px!important;max-height:none!important;margin:0 auto;flex:none}\n.bw2-host .bw2-console-lid{height:410px;flex:0 0 410px;min-height:0}\n.bw2-host .bw2-console-base{height:384px;flex:0 0 384px;min-height:0}\n#pkm-hud-inline.bw2-host{padding:16px 0;overflow:visible}\n#pkm-hud-win:has(.bw2-console){overflow:visible!important;max-height:none!important}\n.bw2-host .bw2-control-area #tab-4:has(.bw2-home-screen){padding:6px;gap:0}\n.bw2-host .bw2-home-screen{display:flex;position:relative;padding:6px!important}\n.bw2-host .bw2-home-screen>.bw2-menu-grid{position:static;width:100%;height:100%;grid-template-rows:repeat(4,var(--bw2-action-height,54px))!important;align-content:space-between;gap:12px 14px}\n.bw2-host .bw2-home-nearby{position:relative;inset:auto;grid-column:1 / -1;grid-row:1 / span 2;min-height:0;overflow:hidden}\n.bw2-host .bw2-home-nearby .nb-thumb-wrap{height:52px;min-height:52px!important}\n.bw2-host .bw2-home-nearby .nb-icon{width:52px!important;height:52px!important}\n.bw2-host .bw2-home-nearby .nb-name{font-size:13px}\n.bw2-host .bw2-home-nearby .nb-count{font-size:12px}\n.bw2-host .bw2-home-nearby .nb-type-chip,.bw2-host .bw2-home-nearby .type-chip{font-size:11px}\n.bw2-host .bw2-control-area{overflow:clip}\n.bw2-host .bw2-home-nearby .nb-grid{scroll-snap-type:x mandatory}\n.bw2-host .bw2-home-nearby .nb-cell{scroll-snap-align:none}\n.bw2-host .bw2-console>.pkm-hud-page-overlay.bw2-upper-page{inset:auto;left:var(--bw2-page-left,8px);top:var(--bw2-page-top,20px);width:var(--bw2-page-width,584px);height:var(--bw2-page-height,383px);padding:0;background:#121625;align-items:stretch;justify-content:stretch;overflow:hidden}\n.bw2-host .bw2-console>.bw2-upper-page>.page{width:100%;height:100%;max-width:none;max-height:none;border-radius:0}\n.bw2-host .bw2-page-title{flex:1;min-width:0;font-size:15px;color:#e7eceb}\n.bw2-host .bw2-upper-page .page-head{display:flex;align-items:center;gap:10px}\n.bw2-host .bw2-upper-page .page-body{padding:10px}\n.bw2-host .bw2-upper-page[data-bw2-page-key=\"box\"] .page-body{display:flex;overflow:hidden}\n.bw2-host .bw2-box-page{display:flex;flex-direction:column;flex:1;min-width:0;min-height:0;gap:10px}\n.bw2-host .bw2-box-tools{display:flex;align-items:center;gap:6px;flex:none;min-width:0}\n.bw2-host .bw2-box-tabs{display:flex;flex:1;min-width:0;gap:6px;overflow-x:auto;white-space:nowrap;scrollbar-width:thin}\n.bw2-host .bw2-box-tab{flex:none;min-height:30px;padding:5px 10px;border:1px solid #8996a0;background:#323c4d;color:#dce6ef;cursor:pointer;font-family:inherit;font-size:12px;font-weight:700}\n.bw2-host .bw2-box-tab.active{background:#a9c4cb;color:#263a44;border-color:#d2e6ee}\n.bw2-host .bw2-box-scroll{flex:1;min-height:0;overflow:auto;overscroll-behavior:contain;scrollbar-width:thin;scrollbar-color:#7c8fa4 #121625;padding:0 3px 5px 0}\n.bw2-host .bw2-box-team{margin:0;gap:16px}\n.bw2-host .bw2-box-team .col{gap:8px}\n.bw2-host .bw2-box-team .col-right{padding-top:24px}\n.bw2-host .bw2-box-team .col+.col{margin-top:0}\n.bw2-host .bw2-box-card{flex:none;cursor:pointer}\n.bw2-host .bw2-box-tools [hidden]{display:none!important}\n.bw2-external-page.pkm-hud-page-overlay.popout{font-family:\"Segoe UI\",\"Microsoft YaHei\",sans-serif;color:var(--text);padding:10px;background:#080c16bb;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}\n.bw2-external-page.pkm-hud-page-overlay.popout .page{display:flex;flex-direction:column;width:100%;max-width:min(94vw,900px);height:auto;max-height:86vh!important;overflow:hidden;border:1px solid #c9e6fb88;border-radius:2px;background:#121625;background-image:var(--bw2-original-grid)}\n.bw2-external-page .page-head{display:flex;align-items:center;gap:10px;flex:none;min-height:44px;padding:5px 12px;background:#252a2b;border-bottom:1px solid #c9e6fb55}\n.bw2-external-page .page-close{flex:none;width:32px;min-height:32px;color:#e58b75;font-size:24px}\n.bw2-external-page .page-body{flex:1;min-height:0;max-height:calc(86vh - 44px)!important;padding:12px;overflow:auto;overscroll-behavior:contain}\n.bw2-external-page [data-tc-big]{width:100%;max-width:none;border-radius:0!important}\n.bw2-host .bw2-console>.pkm-hud-overlay.bw2-upper-dialog{inset:auto;left:var(--bw2-dialog-left,8px);top:var(--bw2-dialog-top,20px);width:var(--bw2-dialog-width,584px);height:var(--bw2-dialog-height,383px);padding:0;background:#121625;align-items:stretch;justify-content:stretch}\n.bw2-host .bw2-upper-dialog>.bw2-popup{width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;min-height:0;border:1px solid #c9e6fb88;background:#121625}\n.bw2-host .bw2-upper-dialog>.bw2-popup>.modal-head{margin:0;padding:5px 12px;min-height:38px;border:0;border-bottom:1px solid #c9e6fb55}\n.bw2-host .bw2-upper-dialog>.bw2-popup>.modal-body{margin:0;padding:12px;border:0;min-height:0;max-height:none;flex:1;overflow:auto}\n.bw2-host .bw2-console:has(>.pkm-hud-overlay.open>.bw2-detail)>.pkm-hud-page-overlay,.bw2-host .bw2-console:has(>.bw2-upper-dialog.open)>.pkm-hud-page-overlay{visibility:hidden;pointer-events:none!important}\n.bw2-host .bw2-console:has(>.bw2-upper-dialog.open) .bw2-display-area>*{visibility:hidden}\n.bw2-host .bw2-console:has(>.pkm-hud-sub.bw2-upper-dialog.open) .bw2-detail-header,.bw2-host .bw2-console:has(>.pkm-hud-sub.bw2-upper-dialog.open) .bw2-summary-scene{visibility:hidden}\n.bw2-host .bw2-console .page{overflow:hidden}\n.bw2-host .bw2-upper-page :is(.bag-list,#pokedex-grid,.pokedex){height:auto!important;max-height:none!important;overflow:visible!important;padding-right:0}\n.bw2-host .bw2-upper-page[data-bw2-page-key=\"bag\"] .info-title{display:none}\n.bw2-host .bw2-upper-dialog .modal-body :is(.bag-list,#pokedex-grid,.pokedex){height:auto!important;max-height:none!important;overflow:visible!important}\n.bw2-host .bw2-console .page-body button:not(.page-close),.bw2-host .bw2-upper-dialog .modal-body button:not(.close),.bw2-external-page .page-body button{border:1px solid #a3b3be!important;border-radius:0!important;background:#414544!important;color:#e3eaf0!important;min-height:30px;padding:5px 10px;font-family:inherit;font-weight:700;clip-path:polygon(6px 0,calc(100% - 6px) 0,100% 50%,calc(100% - 6px) 100%,6px 100%,0 50%);box-shadow:none!important}\n.bw2-host .bw2-console .page-body button:is(.active,.on,[aria-pressed=\"true\"]),.bw2-host .bw2-upper-dialog .modal-body button:is(.active,.on),.bw2-external-page .page-body button:is(.active,.on){background:#a9c4cb!important;color:#263a44!important}\n.bw2-host .bw2-command-help{clip-path:polygon(4px 0,calc(100% - 4px) 0,100% 50%,calc(100% - 4px) 100%,4px 100%,0 50%)}\n@media screen and (max-width:600px){.bw2-external-page.pkm-hud-page-overlay.popout{padding:6px 4px}.bw2-external-page.pkm-hud-page-overlay.popout .page{width:96vw;max-width:96vw;max-height:90dvh!important}.bw2-external-page .page-body{max-height:calc(90dvh - 44px)!important}}\n.bw2-host .bw2-home-nearby .nb-grid{display:flex;justify-content:flex-start;align-items:center;gap:12px!important;padding:0 var(--bw2-nearby-pad,12px)!important;scroll-padding-left:var(--bw2-nearby-pad,12px)}\n.bw2-host .bw2-home-nearby .nb-grid{margin:0 auto!important}\n.bw2-host .bw2-home-nearby .nb-grid::after{display:none}\n.bw2-host .bw2-home-nearby .nb-grid.bw2-nearby-short{justify-content:center;scroll-snap-type:none;overflow-x:hidden}\n.bw2-host .bw2-console .page-body button:not(.page-close),.bw2-host .bw2-upper-dialog .modal-body button:not(.close),.bw2-host .bw2-popup .act-btn,.bw2-external-page .page-body button{position:relative;isolation:isolate;border:0!important;clip-path:none!important;background:transparent!important;filter:drop-shadow(0 2px 2px #08101a55);box-shadow:none!important}\n.bw2-button-rim{position:absolute;inset:0;width:100%;height:100%;z-index:-1;pointer-events:none;overflow:visible}\n.bw2-button-rim polygon{fill:#414544;stroke:#a3b3be;stroke-width:2.4;stroke-linejoin:miter;vector-effect:non-scaling-stroke}\nbutton:is(.active,.on,[aria-pressed=\"true\"])>.bw2-button-rim polygon{fill:#a9c4cb;stroke:#d2e6ee}\nbutton:hover:not(:disabled)>.bw2-button-rim polygon{fill:#3b5664;stroke:#c9e6fb}\n.bw2-host .bw2-move-frame polygon{stroke-width:2.3}\n.bw2-host .bw2-box-frame polygon{stroke-width:2.2}\n.bw2-host :is(.bw2-move-frame,.bw2-box-frame){filter:drop-shadow(0 2px 2px #080d1880)}\n.bw2-host .bw2-menu-button{box-shadow:inset 0 0 0 3px #758080, inset 0 -4px 5px #0003}\n.bw2-host .bw2-menu-button:after{border-width:2px}\n.bw2-host .bw2-upper-page[data-bw2-page-key=\"badge\"] .page-body{display:flex;overflow:hidden}\n.bw2-host .bw2-upper-page[data-bw2-page-key=\"badge\"] .info-frame{flex:1;min-width:0;min-height:0;overflow:hidden}\n.bw2-host .bw2-upper-page[data-bw2-page-key=\"badge\"] .info-inner{height:100%;min-height:0;display:flex;flex-direction:column;gap:8px;padding:8px}\n.bw2-host .bw2-upper-page[data-bw2-page-key=\"badge\"] .info-title{flex:none;margin:0;padding:0;font-size:14px;line-height:1.4}\n.bw2-host .bw2-upper-page .badge-tabs{flex:none;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px;padding:0;margin:0;overflow:visible}\n.bw2-host .bw2-upper-page .badge-tab{min-width:0;font-size:11px;padding:4px 6px}\n.bw2-host .bw2-upper-page .badge-grid{flex:1;min-height:0!important;grid-template-columns:repeat(4,minmax(0,1fr));grid-template-rows:repeat(var(--bw2-badge-rows,2),minmax(0,1fr));gap:6px;align-items:center;overflow:hidden}\n.bw2-host .bw2-upper-page .badge-item{min-width:0;min-height:0;gap:2px}\n.bw2-host .bw2-upper-page .badge-item img{width:36px;height:36px}\n.bw2-host .bw2-upper-page .badge-name{font-size:11px;line-height:1.25}\n.bw2-host .badge-tab.active:hover>.bw2-button-rim polygon{fill:#b9d6dc;stroke:#e0f0f7}\n.bw2-host .bw2-upper-page .info-frame{border:0;border-radius:0;box-shadow:none;filter:none;background:none;margin:0;overflow:visible}\n.bw2-host .bw2-upper-page:not([data-bw2-page-key=\"badge\"]) .info-inner{padding:0}\n.bw2-host .bw2-upper-page[data-bw2-page-key=\"pokedex\"] .info-title.bw2-dex-toolbar{position:static;display:flex;justify-content:flex-end;align-items:center;min-height:32px;margin:0 0 14px;padding:0;background:none;border:0;z-index:auto}\n.bw2-host .bw2-upper-page .dex-thumb-btn{float:none;margin:0;min-height:32px;padding:5px 12px}\n.bw2-host .bw2-upper-page .dex-tabs-scroll{padding:0;margin:0 0 14px;overflow:visible}\n.bw2-host .bw2-upper-page .dex-tabs-grid{width:100%;min-width:0;grid-template-columns:repeat(7,minmax(0,1fr));gap:8px}\n.bw2-host .bw2-upper-page .dex-tabs-grid>[data-dexregion]{min-width:0;min-height:32px;font-size:11px;padding:5px 4px;white-space:nowrap}\n.bw2-host .bw2-upper-page .dex-search{padding:0;margin:0 0 12px}\n.bw2-host .bw2-upper-page .dex-search input{box-sizing:border-box;width:100%;max-width:320px;min-height:30px;border-radius:0}\n.bw2-host .bw2-upper-page .dex-filter-bar{display:flex;flex-wrap:wrap;gap:8px;padding:0;margin:0 0 10px;overflow:visible}\n.bw2-host .bw2-upper-page .dex-count{padding:0;margin:0 0 12px}\n.bw2-host .bw2-upper-page .pokedex{padding:0;gap:8px}\n.bw2-host{--bw2-scroll-thumb:#7c8fa4;--bw2-scroll-track:#121625}\n.bw2-host,.bw2-host *,#pkm-hud-win:has(.bw2-console){scrollbar-width:thin!important;scrollbar-color:#7c8fa4 #121625!important}\n.bw2-host ::-webkit-scrollbar{width:8px;height:8px}\n.bw2-host ::-webkit-scrollbar-track,.bw2-host ::-webkit-scrollbar-corner{background:#121625}\n.bw2-host ::-webkit-scrollbar-thumb{background:#7c8fa4;border:2px solid #121625;border-radius:4px}\n.bw2-host ::-webkit-scrollbar-thumb:hover{background:#9bb1c5}\n.bw2-host ::-webkit-scrollbar-button{display:none;width:0;height:0}\n.bw2-host :is(.bw2-home-nearby .nb-grid,.badge-row,.dex-tabs-scroll,.dex-filter-bar){scrollbar-width:none!important}\n.bw2-host :is(.bw2-home-nearby .nb-grid,.badge-row,.dex-tabs-scroll,.dex-filter-bar)::-webkit-scrollbar{display:none;width:0;height:0}\n.bw2-host .bw2-battle-toggle{flex:none;min-height:24px;padding:3px 10px;border:1px solid #9eafb9;border-bottom:2px solid #172027;border-radius:3px;background:linear-gradient(#566670,#35434b);box-shadow:inset 0 1px #fff3,0 2px 3px #0005;color:#e3ebf3;font:700 11px 'Microsoft YaHei',sans-serif;cursor:pointer}\n.bw2-host .bw2-battle-toggle[hidden]{display:none}\n.bw2-host .bw2-battle-expanded .bw2-console-lid{position:absolute;inset:0 0 90px;height:auto;min-height:0;padding-bottom:0;z-index:3}\n.bw2-host .bw2-battle-expanded .bw2-console-hinge{display:none}\n.bw2-host .bw2-battle-expanded .bw2-console-base{position:absolute;inset:auto 0 0;height:90px;min-height:0;padding-top:0;z-index:3}\n.bw2-host .bw2-battle-expanded .bw2-control-area{border-top:0;box-shadow:0 0 0 2px #192126}\n.bw2-host .bw2-battle-expanded .bw2-control-area #tab-4{display:none}\n.bw2-host .bw2-battle-expanded .bw2-display-area{border-bottom:0}\n.bw2-host .bw2-breeding{display:flex;flex-direction:column;gap:14px;color:#e3ebf3;min-width:0}\n.bw2-host .bw2-breeding-overview{display:grid;grid-template-columns:210px minmax(0,1fr);gap:18px;min-height:240px}\n.bw2-host .bw2-breeding-visual{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:18px 12px;border:2px solid #899eac;border-radius:4px;background:radial-gradient(ellipse at center,#445c65,#263443);box-shadow:inset 0 1px #fff4,0 4px 8px #0004}\n.bw2-host .bw2-breeding-visual svg{width:105px;height:132px;filter:drop-shadow(0 5px 5px #0b152666)}\n.bw2-host .bw2-breeding-visual span{font-size:12px;color:#c7d6de;text-align:center}\n.bw2-host .bw2-breeding.no-egg .bw2-breeding-visual svg{opacity:.6;filter:grayscale(.6) drop-shadow(0 5px 5px #0b152666)}\n.bw2-host .bw2-breeding-summary{display:flex;flex-direction:column;justify-content:center;gap:10px;min-width:0}\n.bw2-host .bw2-breeding-label{color:#a9cbd4;font-size:12px;font-weight:700;letter-spacing:1px}\n.bw2-host .bw2-breeding-summary h2{margin:0;font-size:22px;line-height:1.4;color:#e3ebf3;overflow-wrap:anywhere}\n.bw2-host .bw2-breeding-summary p{margin:0;color:#aabccc;font-size:13px;line-height:1.7}\n.bw2-host .bw2-breeding-steps{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:8px;padding:12px 14px;border:1px solid #6f8395;border-left:3px solid #a9cbd4;background:#283747;box-shadow:inset 0 1px #fff1;color:#c6d1e4;font-size:13px}\n.bw2-host .bw2-breeding-steps strong{font-size:28px;line-height:1;font-variant-numeric:tabular-nums;color:#e3ebf3}\n.bw2-host .bw2-breeding-steps small{margin-left:6px;font-size:12px;font-weight:400;color:#aabccc}\n.bw2-host .bw2-breeding-storage{display:flex;align-items:flex-start;gap:18px;padding:14px;border:1px solid #6f8395;border-left:3px solid #a9cbd4;background:#283747;box-shadow:inset 0 1px #fff1}\n.bw2-host .bw2-breeding-storage strong{min-width:0;flex:1;color:#d4e0ea;font-size:14px;font-weight:500;line-height:1.5;overflow-wrap:anywhere}\n.bw2-host .bw2-full-page .page{height:100%}\n.bw2-host .bw2-full-page .dex-search input{max-width:none}\n.bw2-external-page[data-bw2-page-key=\"typechart\"].pkm-hud-page-overlay.popout .page{width:75%;max-width:min(70.5vw,675px);max-height:64.5vh!important}\n.bw2-external-page[data-bw2-page-key=\"typechart\"] .page-body{max-height:calc(64.5vh - 44px)!important}\n@media screen and (max-width:600px){.bw2-external-page[data-bw2-page-key=\"typechart\"].pkm-hud-page-overlay.popout .page{width:72vw;max-width:72vw;max-height:67.5dvh!important}.bw2-external-page[data-bw2-page-key=\"typechart\"] .page-body{max-height:calc(67.5dvh - 44px)!important}}\n.bw2-host .bw2-profile{box-sizing:border-box;position:relative;z-index:12;display:flex;flex-direction:column;min-width:0;flex:none;margin:0 0 8px;border:1px solid #9aabb8;background:#1c2739;color:#e1e8f0;overflow:hidden}\n.bw2-host .bw2-profile-summary{flex:none;min-width:0;padding:4px 12px;box-sizing:border-box}\n.bw2-host .bw2-profile-heading{display:flex;align-items:center;gap:7px;padding-bottom:2px;line-height:1.2;border-bottom:1px solid #8294a440;white-space:nowrap}\n.bw2-host .bw2-profile-heading strong{font-size:19px;color:#eef5fb}\n.bw2-host .bw2-profile-heading b{margin-left:auto;font-size:15px}\n.bw2-host .bw2-profile-label{font-size:11px;letter-spacing:2px;color:#8dcddb}\n.bw2-host .bw2-profile-environment{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:2px 0;font-size:11px;color:#b8c6d8}\n.bw2-host .bw2-profile-environment>span:first-child{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.bw2-host .bw2-profile-environment>span:last-child{flex:none}\n.bw2-host .bw2-profile-toggle{display:flex;justify-content:space-between;align-items:center;width:100%;min-height:24px;gap:10px;padding:2px 0;margin:0;border:0;border-top:1px solid #8294a440;border-radius:0;background:none;color:#e1e8f0;font:700 14px/1.4 'Microsoft YaHei',sans-serif;text-align:left;cursor:pointer}\n.bw2-host .bw2-profile-toggle small{color:#9faec4;font-size:10px;font-weight:400;white-space:nowrap}\n.bw2-host .bw2-profile-field,.bw2-host .bw2-profile #badge-entry{box-sizing:border-box;display:flex;align-items:center;gap:10px;min-width:0;margin:0 0 7px;padding:7px 10px;border:1px solid #8294a430;border-left:3px solid #8dc5d3;background:#34465c55;font-size:14px;line-height:1.65}\n.bw2-host .bw2-profile-field>.k{flex:none;margin:0;padding:0;color:#a8d1df;font-weight:700}\n.bw2-host .bw2-profile-field>.v{flex:1;min-width:0;margin:0;padding:0;color:#e1e8f0;text-align:right;overflow-wrap:anywhere}\n.bw2-host .bw2-profile-field.is-block{display:block}\n.bw2-host .bw2-profile-field.is-block>.k{display:block}\n.bw2-host .bw2-profile-field.is-block>.v{display:block;margin-top:4px;text-align:left}\n.bw2-host .bw2-profile-body{flex:1;min-height:0;min-width:0;padding:0 12px 10px;overflow-y:auto;overflow-x:hidden;box-sizing:border-box}\n.bw2-host .bw2-profile-body>.bw2-profile-field:last-child{margin-bottom:0}\n.bw2-host .bw2-profile .badge-line{display:flex;align-items:center;gap:5px;margin:0;padding:0;min-width:0}\n.bw2-host .bw2-profile .badge-row{flex:1;min-width:0;flex-wrap:nowrap;overflow-x:auto;overflow-y:hidden}\n.bw2-host .bw2-profile .badge-row>*{flex:none}\n.bw2-host .bw2-profile .badge-region{font-size:10px}\n.bw2-host .bw2-profile .badge-more{display:none}\n.bw2-host .bw2-display-area #tab-1{overflow:hidden}\n.bw2-host .bw2-display-area #tab-1:has(.bw2-profile.is-open)>.grid{visibility:hidden}\n\n.bw2-host .bw2-profile-heading .refresh-ic{font-size:22px;line-height:1;min-height:24px}\n.bw2-host .bw2-profile #badge-entry{padding-top:3px;padding-bottom:3px;margin-bottom:2px}\n";





/* Core versions and beauty versions advance independently. */


/* Shared by local builds and browser update checks. Parse only when composing a core. */


/* Runs inside the HUD scope. The package is embedded by build_swsh_hud.py. */










/* Redrawn from the user-provided LZA icons; SVG geometry only. */
/* One attribute palette drives borders, chips and category artwork. */
function bw2SyncMoveColors(root){
  if(!root||!root.querySelectorAll)return;
  var selector='.dt-move-cell,.move-cell[data-mvtype]',nodes=Array.from(root.querySelectorAll(selector));
  if(root.matches&&root.matches(selector))nodes.unshift(root);
  nodes.forEach(function(node){
    var color=typeColor(node.getAttribute('data-mvtype')||'');
    if(node.style.getPropertyValue('--bw2-move-color')!==color)node.style.setProperty('--bw2-move-color',color);
    var cat=(node.getAttribute('data-mvcat')||'').trim(),art=BW2_MOVE_CATEGORY_ART[cat];
    node.querySelectorAll('img.move-cat-ic').forEach(function(img){
      if(!art)return;var svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
      svg.setAttribute('class','move-cat-ic bw2-colored-category');svg.setAttribute('viewBox','0 0 50 40');svg.setAttribute('role','img');svg.setAttribute('aria-label',cat);svg.innerHTML=art;img.replaceWith(svg);
    });
  });
}
var BW2_MOVE_CATEGORY_ART={"特殊":"<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"3.8\"><ellipse cx=\"25\" cy=\"20\" rx=\"19.2\" ry=\"14.1\"/><ellipse cx=\"25\" cy=\"20\" rx=\"12.3\" ry=\"8.9\"/><ellipse cx=\"25\" cy=\"20\" rx=\"5.1\" ry=\"3.4\"/></g>","物理":"<path fill=\"currentColor\" fill-rule=\"evenodd\" d=\"M25 1L30 11L43 6L38 16L50 20L38 24L43 34L30 29L25 39L20 29L7 34L12 24L0 20L12 16L7 6L20 11Z M25 9L22 16L14 12L17 18L10 20L17 22L14 28L22 24L25 31L28 24L36 28L33 22L40 20L33 18L36 12L28 16Z\"/>","变化":"<path fill=\"currentColor\" fill-rule=\"evenodd\" d=\"M46 20A21 16 0 1 1 4 20A21 16 0 1 1 46 20Z M31 9C23 7 20 12 23 18C26 24 32 26 26 32C36 32 42 26 41 19C41 13 37 9 31 9Z\"/>"};

/* PNG exports of the existing Sword/Shield icon artwork. */
var BW2_COMMAND_ICONS={"training":"data:image/png;base64,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","dodge":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAIOklEQVR4nOyde2wURRzHf7PbB1UsdwVRURONj2DiW/FBBAN3BQQVglJNQEuvEE1EMWgUUBIf/wDRCAaNhHInilFJjMQEpPTa/oGgAR8BXwgmBAQkIrfX8gr1dsffFDXYdu+g+7hlf79P0u7ezeRub+c7v5n5zfxmNWBIowFDGhYAcVgAxGEBEIcFQBwWAHFYAMRhARCHBUAcFgBxWADEYQEQhwVAHBYAcVgAxGEBEIcFQBwWAHFYAMRhARCHBUAcFgBxWADEYQEQhwVAnBJgPKEpaYwXEqaCgD2a1N8eWV/5CwQQAYzrNC3P1gghPz71PSHE7FhdZAEEDBaAB6RTxn6QcFG3BCnWQYk2JV5beQgCAgvAZZpX/HmxNPW9ebLsF2BNiiX6b4IAwJ1Al4nVDtiHhx/zZBkkQduYTmbmQABgC+ABjcuyl+u63ICnF+fNGIAmgS2AB4yeHtmVs7Tr8TSdN6OQY8A0tzYnDw2FIsEWwEOklKI5ZczG2/wqvtTzZM1h3nnxRHQBjhYk+AgLwAdUDcd2fxUUahLQYqDleGjMtH4Z8AkWgE+sa2irKtEs5RuIF8i6D0cJNX6NElgAPtLZJLxrzMHO3ysQkCaBBVAETjYJ+icoiQsLZPW8SeBRQBFQ5r0D9MKjBGwusNnY5uUogS1AEQlCk8ACCADFbBK4CQgAxWwSfLUALcm22yXIWvwbLFh83ZACy0PC8NPKC/K1v6B04djEeQfBAb4JoKnBuElo8C0wroGdgV+NvpHBNTXChF7iWy3Ewp8MjKtg7b2y6mjbSHCAn2Y4CowHWFeBA/yzACC/A8Z1zJz2OTjANwFooq0BW61GYNxkppp6Bgf47gdofO/wwJKO3GBL51FAV4QUA7CSLMbTQQVyHpDSmlRdX/UFOP1OYAJBU+rQHUJqq/H0ggJZW8vLxQPDJkcMcAGOCygyZ+AOxqGenBeri8530x3MFqCItC5tH2CWmmqhyIi8GQX8LsGaWF3X/ytwGRZAkSiWye8KC8BnlMlvSRlzJYiXIQCLQlgAPhIEk9/9q1xg06rfKo63V15n6dY54DIWmAdG1w3YDmc5QTH5XXEsgHTKmIWzEq+Dt+wWllYTm9ZvM5xlBM3kd8WRANYvPzhIEyX7wB824M05ranSoBBEk98VR34AHfQbfIxiuLFQhn+WXs/E05vxulqqE9E3oEg0NxjDTd38qMco4VNR4WG6NqW6NlqU8DBHApAgsz72I9vyJXbG42mWqkED1Wu8qnvTSeNatBr14DMtqcxYS8IaKFA70OTPqa6Pzoci4sgfnzmvarNalAA+gO3iynzpJbqlbuTALm8nmpZnZoOPrH1TlltSfJg3kzL5wroTfflFLfyTl+KQtcnD55dBbgZ+1BCc8nV9FIBW5oAA0RhLRFP58mFtV9G4d/X0EZqECSPro5+BDxTaH0AKub5PmfawX738QoTGD5BOZh/D2/uOTfJxHFDeGk/0/wl8uRZDLX27qcvbObRiLwZtm5jQTMnGE5GleGixSa7An9qoeuXgB7qciv9PreG70eQP4z2CPGbDB9noiRNyC55e0XMO8SUKxZdY/NaUcRlO340XFuyJ1Uc/hYASOldwekX71WCaSgSVNllW4sjgEWA6Cd2qnHht5Q7sOU4A5UXumSnNqezzwHQS2skg7Ig9hYfFNslSgnZPdaIf+TWKoZ4NRBEsw8M0m+QjaCRu92tkEFRCvTAz0zfyOFb1jTbJffHnr1N+DCBMqAWgQqb69BH3oZ2zWzp9KTqx1ny9VJYCUUK/NLvT46bpY/C03SbLkGxpNglEIbE2n0cG9pBaEpZOGTNRCItskkmODBwLQEX66LncE15NBrkNzl7enSf5KE7RjnEj4uZfvJgskyCO4f8tHVCypOj7A+BQawceHEWoBg2cfbwllog43stg1SqpR49kt6swbvCAou8PoHb8gJAVvgKnoB8FF6g6nLnNq8JXqM+OHs0MAQc4EoAlcmGN+b8FXAAtSQQ8BkXg6DscCUDPwQ8QSuRGcAETzK3gMZZlbQMHOBLAiOn996K9fBbCxQZdtL0ELjCq/vz9WEWfAY/APsCszu9wQOADQ1xFauUCrBVgE5yhOlV9ysVtbi/Xcvv+aKZ2rKKy/fuhNZceB4fQ8gMkDbVGf5JNcjvo+pBOpxEhyOzSkU5l5oJ94ZvKU0it8BUkLEDLcuN+S4CKy+vx96KD5slYomoJECT0AlifMm7UJKiHL1TYZGmIJ6LTgSihbgKUGxZ/4FqwL/xWtWYACBNaAagIHTXXbxubJ2BXR5k1wYkbNQyEdpOosr7Z9/Fg5yZtV2sExk6JtgNxQmkBmpOZF4B7/KdF6DqBhXr8OOs/I15f9RYwnYRKANzjP3NCI4C1Kw9VlnVo6qHNl9hkacXCd7S1ehgJTR+gtEN/DuwLf6cuYCIw3QiNAISQ1TZJbZbQxo2oi2aB6UZoBIAzeTaPWhUPjqrrtxOYHgmNAM499whO9oj/7bIlJdTGE5FCT+IiTfjCw1PGTGnJCl3XmkZOjXwDTF54q1ji8FM7iMMCIA4LgDi9mg1sTf1xYc4qXSgEjILCu18zp434Ge/pCj93E+uVBTBlySK8ULXREhe+q8hrpJTzm1KGb17LXjYBYhwwnqFJEQef6G0f4AQwoaCXApDsXfMQtZ8w+ESvOoG6yD1tyTL1HLtq9MGT3mTJXf7rBK4Gn2BPIHHYD0AcFgBxWADEYQEQhwVAHBYAcVgAxGEBEIcFQBwWAHFYAMRhARCHBUAcFgBxWADEYQEQhwVAHBYAcVgAxGEBEOdvAAAA//8gklU1AAAABklEQVQDABgF48NSOuXQAAAAAElFTkSuQmCC","initiative":"data:image/png;base64,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","guard":"data:image/png;base64,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","revive":"data:image/png;base64,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","mega":"data:image/png;base64,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","clash":"data:image/png;base64,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"};

/* Outlined HUD pictograms. Geometry is shared by both themes. */
function swshIcon(key,size){
  var art={bag:'<g transform="rotate(-12 24 24)"><path d="M15 18.5v-3.2c0-6 3.7-10 9-10s9 4 9 10v3.2"/><path d="M13.5 18c-3 .2-5 2.5-5 5.7V38c0 3 2.4 5.4 5.4 5.4h20.2c3 0 5.4-2.4 5.4-5.4V23.7c0-3.2-2-5.5-5-5.7"/><path d="M16.2 17.8c1.9-3.4 4.3-4.9 7.8-4.9s5.9 1.5 7.8 4.9M13.8 19.2v7.1c0 3.3 3 5.8 6.1 5.8h8.2c3.2 0 6.1-2.5 6.1-5.8v-7.1"/><path class="swsh-icon-detail" d="M20.4 21.5c1.8-1.3 5.4-1.3 7.2 0M20 26h8m-4-5v9M8.5 25l-3 2.3v9.2l3 2.2M39.5 25l3 2.3v9.2l-3 2.2"/></g>',box:'<g transform="rotate(-5 24 24)"><rect x="5" y="9" width="38" height="26" rx="5"/><path d="M5 29h38M12 35v4h24v-4M12 39h24"/><circle cx="16" cy="19" r="4.8"/><path class="swsh-icon-detail" d="M16 14.2v9.6m-4.8-4.8h9.6M27 17h10m-10 5h7"/></g>',breeding:'<path d="M24 5c8 0 15 13 15 24a15 15 0 0 1-30 0C9 18 16 5 24 5z"/><path class="swsh-icon-detail" d="M15 28c1 6.2 4.3 9.4 9 9.4m7-22 2.2 4.7m-14.1 2.4 2.3-2.6 2.5 2.1 2.3-2.1 2.6 2.6"/>',pokedex:'<g transform="rotate(-15 24 24)"><rect x="10" y="6" width="31" height="35" rx="5"/><path d="M10 15H7.5a3 3 0 0 0-3 3v19a3 3 0 0 0 3 3H10M15 17h21v13H15z"/><circle cx="23" cy="23.5" r="4.5"/><path class="swsh-icon-detail" d="M16 11h12m4 0h3M15 34h11m4 0h6M16 38h5m4 0h4"/></g>',badge:'<path d="M24 5 29 11 37 9 36 19 42 24 36 29 37 39 29 37 24 43 19 37 11 39 12 29 6 24 12 19 11 9 19 11z"/><path d="M24 14 29 19 34 24 29 29 24 34 19 29 14 24 19 19z"/><path class="swsh-icon-detail" d="M24 17v14m-7-7h14"/>',map:'<g transform="rotate(-8 24 24)"><path d="M5 11 17 7l14 4 12-4v31l-12 4-14-4-12 4zM17 7v31M31 11v31"/><circle cx="25" cy="21" r="4"/><path class="swsh-icon-detail" d="m24.5 25 5 8m-11-6-5 6m23-14 3-2"/></g>',settings:'<path d="M8.9 4.52 10.25 2.05 13.75 2.05 15.1 4.52 17.79 3.73 20.27 6.21 19.48 8.9 21.95 10.25 21.95 13.75 19.48 15.1 20.27 17.79 17.79 20.27 15.1 19.48 13.75 21.95 10.25 21.95 8.9 19.48 6.21 20.27 3.73 17.79 4.52 15.1 2.05 13.75 2.05 10.25 4.52 8.9 3.73 6.21 6.21 3.73z" transform="scale(2)"/><circle cx="24" cy="24" r="5.4"/><circle class="swsh-icon-detail" cx="24" cy="24" r="2.2"/>',typechart:'<circle cx="12.5" cy="24" r="8"/><circle cx="35.5" cy="24" r="8"/><path d="M20.5 24h7m-3-3 3 3-3 3"/><path class="swsh-icon-detail" d="M9 24h7m-3.5-3.5v7M32 24h7"/>'};
  var px=Math.max(14,Math.min(48,Number(size)||24));
  return '<svg class="swsh-icon swsh-icon-'+key+'" width="'+px+'" height="'+px+'" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(art[key]||art.pokedex)+'</svg>';
}

/* Shared detail identity view. Reuse core classifications and item assets;
   presentation formatting does not alter stored names, forms or inventories. */
function bw2DetailIdentity(c,p){
  p=p||{};var raw=Object.assign({},p,{名字:c.species||p.名字||c.name,昵称:c.name,是否闪光:p.是否闪光!=null?p.是否闪光:c.shiny});
  var meta=nearbyCategoryMeta(raw),text=nearbyAllText(raw)+' '+String(c.name||'');
  function flag(keys){return keys.some(function(key){return nearbyTruthy(p[key]);});}
  var kinds=[];
  function add(kind,label,art,img){kinds.push({kind:kind,label:label,art:art,img:img||''});}
  if(meta.shiny||flag(['是否闪光','闪光','shiny']))add('shiny','闪光','<path d="M6 1 7.4 4.6 11 6 7.4 7.4 6 11 4.6 7.4 1 6 4.6 4.6Z"/>','https://raw.githubusercontent.com/msikma/pokesprite/master/misc/special-attribute/shiny-stars.png');
  if(meta.legendary||flag(['是否神兽','神兽','是否传说','legendary']))add('legendary','神兽','<path d="M1 3 4 6 6 1 8 6 11 3 10 10H2Z"/>');
  if(meta.mythical||flag(['是否幻兽','幻兽','mythical']))add('mythical','幻兽','<path d="m6 1 5 5-5 5-5-5Z"/><circle cx="6" cy="6" r="1.5"/>');
  if(meta.ultra||flag(['是否究极异兽','究极异兽','是否异兽','ultraBeast']))add('ultra','究极异兽','<path d="m3 1 3 3 3-3 2 5-2 5-3-3-3 3-2-5Z"/>');
  if(meta.mega||/超级|超級/i.test(String(c.species||''))||flag(['是否Mega','是否mega','Mega','mega','是否超级进化']))add('mega','Mega 进化','<path d="M2 1C10 1 2 11 10 11M10 1C2 1 10 11 2 11M3 3h6M3 9h6"/>','https://img.baibai.cv/f/YNBKTy/1788349081288.png');
  var gmax=/超极巨|超極巨|gigantamax|gmax|g-max/i.test(text)||flag(['是否超极巨化','超极巨化','gigantamax']);
  if(gmax||meta.dynamax||flag(['是否极巨化','极巨化','dynamax']))add('dynamax',gmax?'超极巨化':'极巨化','<path d="m1 9 3-3 2 2 2-5 3 2M3 2h2M7 1h2M2 11h8"/>','https://img.baibai.cv/f/GKpwto/1788410257587.png');
  if(meta.boss||flag(['是否霸主','是否头目','霸主','头目','boss','alpha']))add('boss',/头目|頭目|首领|首領|alpha/i.test(text)?'头目／霸主':'霸主','<path d="M1 4 4 5 6 1 8 5 11 4 9 10H3Z"/>','https://img.baibai.cv/f/yeRrTj/1788410175968.png');
  if(/原始回归|原始回歸|primal/i.test(text)||flag(['是否原始回归','原始回归','primal']))add('primal','原始回归','<path d="M2 9V3L6 1l4 2v6l-4 2Z M4 9V4h3l1 2-1 1H4"/>');
  if(/太晶化|太晶|terastal/i.test(text)||flag(['是否太晶化','太晶化','terastal']))add('tera','太晶化','<path d="M3 1h6l2 4-5 6-5-6ZM1 5h10M3 1l3 10L9 1"/>');
  var display=String(c.name||c.species||'—').trim(),prefix=/^(?:究极异兽|究極異獸|超级进化|超級進化|超进化|超進化|超极巨化|超極巨化|超极巨|超極巨|极巨化|極巨化|极巨|極巨|原始回归|原始回歸|太晶化|太晶|头目|頭目|霸主|首领|首領|闪光|閃光|神兽|神獸|幻兽|幻獸|Mega|MAGE|超级|超級)[\s·:_-]*/i;
  // "超级" describes the actual Mega form, so retain it in the display name.
  if(!p.昵称){var superPrefix='';while(prefix.test(display)){var match=display.match(prefix),next=display.replace(prefix,'').trim();if(!next)break;if(/^(?:超级|超級)/.test(match[0]))superPrefix+=match[0].trim();display=next;}display=superPrefix+display;}
  var units=Array.from(display).reduce(function(sum,char){return sum+(/[\u2e80-\uffff]/.test(char)?1:/\s/.test(char)?.3:.6);},0);
  return {name:display,nameFont:Math.min(4.1,25/Math.max(1,units)).toFixed(3)+'cqw',badges:kinds};
}
function bw2DetailBadgesHTML(identity){
  return identity.badges.slice(0,5).map(function(badge){return '<span class="bw2-state-badge '+badge.kind+'" data-bw2-badge="'+badge.kind+'" role="img" title="'+esc(badge.label)+'" aria-label="'+esc(badge.label)+'"><svg viewBox="0 0 12 12" aria-hidden="true">'+badge.art+'</svg>'+(badge.img?'<img src="'+esc(badge.img)+'" alt="" onerror="this.remove()">':'')+'</span>';}).join('');
}
function bw2HeldIconHTML(c){
  var name=c.item;if(!name||name==='无')return '';
  var diy=diyGet('item',name),ref=diy&&diy.img?String(diy.img).trim():'',cls='item-icon bw2-held-icon';
  if(ref&&(ref.indexOf(HUD_DIY_SCHEME)===0||/^(?:https?:\/\/|data:image\/|blob:)/i.test(ref)))return hudDiyImgTag(ref,'class="'+cls+'" alt="'+esc(name)+'" onerror="itemImgErr(this)"');
  var url=itemImgOf(name)||(itemCache[name]&&itemCache[name].img);
  if(url)return '<img class="'+cls+'" src="'+esc(url)+'" alt="'+esc(name)+'" onerror="itemImgErr(this)">';
  // Unknown Chinese names need the core's cached item lookup for their image.
  // Delay until the returned detail markup is mounted; never fetch per frame.
  if(!c.itemEn&&!itemIconName(name))hudScope.setTimeout(function(){bw2ResolveHeldIcon(name);},0);
  return '<span class="'+cls+' placeholder item-wiki" data-item="'+esc(name)+'" data-item-en="'+esc(c.itemEn||'')+'" data-cls="'+cls+'" aria-label="'+esc(name)+'图标">?</span>';
}
function bw2ResolveHeldIcon(name){
  var row=document.querySelector('.bw2-detail .bw2-held-item');
  if(!row||row._bw2IconLoading||row.querySelector('.bw2-held-name').textContent!==name||row.querySelector('img'))return;
  row._bw2IconLoading=true;
  fetchItem(name,'',function(data){
    if(!row.isConnected)return;
    var url=data&&data.img;
    if(!url&&typeof itemListCache!=='undefined'&&itemListCache){var maps=itemListMaps(itemListCache),en=maps.cn2en&&maps.cn2en[name];if(en&&pkmItemSource==='serebii')url=serebiiItemUrl(en);}
    var target=row.querySelector('.item-icon');if(!url||!target||row.querySelector('img'))return;
    var img=document.createElement('img');img.className='item-icon bw2-held-icon';img.alt=name;img.referrerPolicy='origin';img.src=url;img.onerror=function(){itemImgErr(this);};target.replaceWith(img);
  });
}

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

/* BW2 v0.1: presentation adapter over the unmodified domain APIs. */
var bw2TrainerExpanded=false,bw2RefreshTimer=0;
// Corrected reference outlines: horizontal/vertical edges and 45-degree cuts.
// The single detail view retains each contour; the upper and lower shapes stay distinct.
var BW2_SCREEN_POINTS=[[2,1],[316,1],[326,11],[326,27],[385,86],[385,247],[41,247],[19,225],[19,206],[2,189]];
// Separate lower contour based on Desktop/下多边形底.png (1330 x 888).
// Its long right diagonal stays distinct; the left corner matches the upper
// contour after translating its four corner points upward by 25 logical pixels.
var BW2_LOWER_SCREEN_POINTS=[[2,1],[191,1],[232,42],[232,56],[385,209],[385,266],[41,266],[19,244],[19,225],[2,208]];
var bw2DetailSeq=0,bw2HeldContext=null;
function bw2ScreenPath(){return BW2_SCREEN_POINTS.map(function(p,i){return(i?'L':'M')+p[0]+' '+p[1];}).join('')+'Z';}
function bw2LowerScreenPath(){return BW2_LOWER_SCREEN_POINTS.map(function(p,i){return(i?'L':'M')+p[0]+' '+p[1];}).join('')+'Z';}
try{bw2TrainerExpanded=localStorage.getItem('pk_bw2_trainer_expanded')==='1';}catch(e){}

/* VIEW: compact trainer retains refresh, environment, money and badge controls. */
function bw2TrainerHTML(){
  var tr=stat_data.训练家||{},ev=stat_data.环境||{},hearts='';
  for(var i=0;i<num(tr.活力上限,3);i++)hearts+='<span class="heart'+(i<num(tr.活力,3)?'':' empty')+'">♥</span>';
  var badges=document.createElement('div');badges.innerHTML=badgeRowHTML();badges.firstElementChild.className='bw2-profile-field bw2-profile-badges';
  function field(label,value,block){return '<div class="bw2-profile-field'+(block?' is-block':'')+'"><span class="k">'+label+'</span><span class="v">'+esc(value)+'</span></div>';}
  return '<section class="bw2-profile'+(bw2TrainerExpanded?' is-open':'')+'"><div class="bw2-profile-summary"><div class="bw2-profile-heading"><span class="bw2-profile-label">TRAINER</span><strong>'+esc(tr.名字||'???')+'</strong><span>'+hearts+'</span>'+refreshBtnHTML()+'<b>¥'+num(tr.金钱,0).toLocaleString()+'</b></div><div class="bw2-profile-environment"><span>'+esc(ev.当前地点||'地点未知')+'</span><span>'+esc(ev.日期||'')+' '+esc(ev.时间||'')+'</span></div>'+badges.innerHTML+'<button class="bw2-profile-toggle" data-bw2-trainer aria-expanded="'+bw2TrainerExpanded+'"><span class="bw2-profile-toggle-label">'+(bw2TrainerExpanded?'− 收起资料':'＋ 训练家资料')+'</span><small>身份 · 声望 · 气场 · 可命令等级</small></button></div><div class="bw2-profile-body"'+(bw2TrainerExpanded?'':' hidden')+'>'+field('身份',tr.身份||'-')+field('声望',tr.声望||'-')+field('气场',tr.气场||'-',true)+field('可命令等级','Lv.'+num(tr.可命令等级,0))+'</div></section>';
}

/* VIEW: preserve every original menu route; reuse the embedded SVG icon set. */
function bw2MenuHTML(keys){
  var colors={bag:'#32b7ed',box:'#ffa83d',rel:'#e9c945',rivals:'#b287df',breeding:'#9ebc62',pokedex:'#ef526c',typechart:'#dfb457',badge:'#edbd48',map:'#46beb8',settings:'#55d288'};
  var entries=keys?keys.map(function(key){return MENU.find(function(m){return m.key===key;});}).filter(Boolean):MENU;
  return '<section class="bw2-menu-screen"><div class="bw2-menu-grid">'+entries.map(function(m){return '<button type="button" class="menu-item bw2-menu-button" data-page="'+esc(m.key)+'" style="--bw2-accent:'+colors[m.key]+'"><span class="bw2-menu-icon">'+swshIcon(m.key,38)+'</span><span class="menu-label">'+esc(m.label)+'</span></button>';}).join('')+'</div></section>';
}

/* Encounter view keeps the native category helpers and action event protocol. */
function bw2ActionHTML(raw,key){
  var meta=nearbyCategoryMeta(raw),p=meta.pokemon;
  var buttons=[['对战','对战','⚔️'],['捕捉','捕捉','🔴'],['观察','观察','👀']].map(function(action){return '<button type="button" class="act-btn" data-action="'+action[0]+'" data-key="'+esc(key)+'">'+action[2]+' '+action[1]+'</button>';}).join('');
  return '<div class="modal bw2-encounter"><div class="modal-head"><div class="modal-name">选择行动</div><button class="close" data-close>✕</button></div><div class="modal-body"><div class="bw2-encounter-portrait '+nearbyCellClasses(meta)+'" style="'+nearbyCellStyle(meta)+'"><div class="nb-edge"></div>'+pkImgHTML(p.名字,p.图标,meta.shiny,'action-img')+'</div><div class="bw2-encounter-side"><div class="bw2-encounter-info"><div class="nearby-name">'+esc(p.名字)+' <span class="nb-name-icons">'+nearbyNameIconsHTML(meta)+'</span></div><div class="nb-pillbar">'+nearbyPillsHTML(meta)+nearbyTypeBarHTML(meta)+'</div><div class="nearby-sub">数量 ×'+num(p.数量,1)+'</div></div><div class="action-btns">'+buttons+'</div></div></div></div>';
}

/* DETAIL: retain upstream links, fields and mutation buttons; replace layout only. */
function bw2DetailHTML(c){
  var holder=document.createElement('div');holder.innerHTML=bw2DetailFieldsHTML(c);
  function html(sel){var el=holder.querySelector(sel);return el?el.outerHTML:'';}
  var moves='',p=getCardPkm(c)||{},xp=parseHP(c.exp),remaining=xp.max>0?Math.max(0,xp.max-xp.cur):null;
  var ivValues={},ivAliases={hp:'HP',攻击:'攻击',atk:'攻击',attack:'攻击',防御:'防御',def:'防御',defense:'防御',特攻:'特攻',spa:'特攻',spatk:'特攻',特防:'特防',spd:'特防',spdef:'特防',速度:'速度',spe:'速度',speed:'速度'};
  String(c.iv||'').split(/[,，;；\n]/).forEach(function(part){
    var match=part.trim().match(/^([^:：]+)[:：]\s*(.+)$/);if(!match)return;
    var key=ivAliases[match[1].trim().toLowerCase()];if(key)ivValues[key]=match[2].trim();
  });
  var statRows=['HP','攻击','防御','特攻','特防','速度'].map(function(key){
    return '<div class="bw2-stat-row" data-bw2-iv="'+key+'"><span class="bw2-stat-label">• '+key+'</span><span class="bw2-stat-value">'+esc(ivValues[key]||'—')+'</span></div>';
  }).join('');
  var trait=holder.querySelector('.row [data-ability]'),traitName=trait?trait.outerHTML:esc(c.ability||'—');
  var nature=holder.querySelector('.row [data-nature]'),natureName=nature?nature.outerHTML:esc(c.nature||'—');
  var intimacyRaw=c.intimacy;if((intimacyRaw==null||intimacyRaw==='')&&p.亲密度===0)intimacyRaw=0;
  var intimacy=intimacyRaw==null||intimacyRaw===''?'—':String(intimacyRaw)+'/255';
  // Intimacy is the seventh row of the same grid, sharing the IV alignment.
  var dataTop='<div class="bw2-stats-table" aria-label="个体值与亲密度">'+statRows+'<div class="bw2-stat-row bw2-detail-intimacy"><span class="bw2-stat-label">• 亲密度</span><span class="bw2-field-value">'+esc(intimacy)+'</span></div></div>';
  var experience='<div class="bw2-detail-experience"><svg class="bw2-exp-frame" viewBox="47 0 267 22" preserveAspectRatio="none" aria-hidden="true">'+infoStrip(0,22,'bw2-experience-strip',xp.max>0?Math.max(0,Math.min(1,xp.cur/xp.max)):0,'bw2-exp-'+(++bw2DetailSeq))+'</svg><span class="bw2-exp-label">经验</span><span class="bw2-exp-progress bw2-field-value" role="progressbar" aria-label="经验"'+(xp.max>0?' aria-valuemin="0" aria-valuemax="'+xp.max+'" aria-valuenow="'+Math.max(0,Math.min(xp.cur,xp.max))+'"':'')+'><span class="bw2-exp-numbers" aria-label="经验 / 还需经验"><b class="bw2-exp-current">'+(xp.max>0?esc(xp.cur):esc(c.exp||'—'))+'</b><span class="bw2-exp-slash"> / </span><b class="bw2-exp-remaining">'+(remaining===null?'—':esc(remaining))+'</b></span></span></div>';
  var battleTop=dataTop+'<section class="bw2-detail-strips">'+experience+'<button type="button" class="bw2-trait-heading"'+(c.ability?' data-ability="'+esc(c.ability)+'"':' disabled')+'><svg class="bw2-trait-frame" viewBox="47 0 267 22" preserveAspectRatio="none" aria-hidden="true">'+infoStrip(0,22,'bw2-trait-strip')+'</svg><span class="bw2-trait-label">特性</span><span class="bw2-trait-name">'+traitName+'</span></button><button type="button" class="bw2-trait-heading"'+(c.nature?' data-nature="'+esc(c.nature)+'"':' disabled')+'><svg class="bw2-trait-frame" viewBox="47 0 267 22" preserveAspectRatio="none" aria-hidden="true">'+infoStrip(0,22,'bw2-trait-strip')+'</svg><span class="bw2-trait-label">性格</span><span class="bw2-trait-name">'+natureName+'</span></button></section>';
  var moveNodes=holder.querySelectorAll('.dt-move-cell');
  // The card has move categories, not PP; keep the original category data.
  moveNodes.forEach(function(node){var cat=(node.getAttribute('data-mvcat')||'').trim();
    node.insertAdjacentHTML('afterbegin','<svg class="bw2-move-frame" viewBox="0 0 300 68" preserveAspectRatio="none" aria-hidden="true"><polygon points="20,2 280,2 298,34 280,66 20,66 2,34"/><path class="bw2-move-highlight" d="M3 34L20 3H280"/><path class="bw2-move-depth" d="M20 65H280L297 34"/></svg>');
    var categoryArt=BW2_MOVE_CATEGORY_ART[cat]||'';
    var meta=document.createElement('div');meta.className='bw2-move-meta';meta.innerHTML='<span class="bw2-move-category" title="'+esc(cat||'类别未知')+'" data-bw2-move-category="'+esc(cat)+'"><svg viewBox="0 0 50 40" aria-hidden="true">'+categoryArt+'</svg></span><span class="bw2-move-kind">'+esc(cat||'—')+'</span>';node.appendChild(meta);
  });
  bw2SyncMoveColors(holder);moves=html('.dt-move-grid');
  var more=html('.dt-more-btn').replace(/全部技能/g,'全部'),boxAction=c.where==='box'&&c.boxName?'<button type="button" class="bw2-box-action" data-pkm-withdraw>取出到队伍</button>':'<button type="button" class="bw2-box-action" data-pkm-store'+(c.where==='team'?'':' disabled')+'>存入盒子</button>';
  boxAction=boxAction.replace(/(<button[^>]*>)/,'$1<svg class="bw2-box-frame" viewBox="0 0 160 26" preserveAspectRatio="none" aria-hidden="true"><polygon points="13,1 147,1 159,13 147,25 13,25 1,13"/></svg>');
  var identity=bw2DetailIdentity(c,p),gi=genderOf(c.gender),ballNode=holder.querySelector('.dt-top .item-icon'),ballHeader=ballNode?ballNode.outerHTML:'';
  if(c.ball==='精灵球'||c.ball==='普通精灵球')ballHeader='<svg class="bw2-basic-ball" width="18" height="18" viewBox="0 0 20 20" aria-label="精灵球"><circle cx="10" cy="10" r="9" fill="#f5f5ef" stroke="#555f65"/><path d="M1 10a9 9 0 0 1 18 0Z" fill="#e14748"/><path d="M1 10h18" stroke="#555f65" stroke-width="2"/><circle cx="10" cy="10" r="3" fill="#f5f5ef" stroke="#555f65"/></svg>';
  var nameHeader='<div class="dt-top">'+ballHeader+'<span class="dt-name" data-bw2-info role="button" tabindex="0" title="'+esc(c.name)+' · 查看精灵资料" style="--bw2-name-font:'+identity.nameFont+'">'+esc(identity.name)+'</span><span class="gender-sym '+gi.cls+'">'+gi.sym+'</span></div>';
  // Outline shapes reproduce the frame; only actual saved markings are filled.
  var markings=String(p.标记||''),symbols=['●','▲','■','♥','★','◆'];
  var markPaths=['<circle cx="6" cy="6" r="4"/>','<path d="M6 1 11 10H1Z"/>','<rect x="2" y="2" width="8" height="8"/>','<path d="M6 11 1.5 6C-1 1 4-1 6 3 8-1 13 1 10.5 6Z"/>','<path d="m6 1 1.4 3 3.4.5-2.4 2.4.6 3.4-3-1.6-3 1.6.6-3.4L1.2 4.5 4.6 4Z"/>','<path d="m6 1 5 5-5 5-5-5Z"/>'];
  var marks=markPaths.map(function(art,i){return '<svg viewBox="0 0 12 12" class="bw2-mark'+(markings.indexOf(symbols[i])>=0?' marked':'')+'" aria-hidden="true">'+art+'</svg>';}).join('');
  var lowerPath=bw2LowerScreenPath();
  // The marking cap ends on the lower contour's (385,209) corner.
  // Its baseline and the item box share the same endpoints, without a gap.
  var platePath='M239 1H385V53H239Z',heldPath='M229 209H385V266H229Z',markPath='M244 194H370L385 209H229Z';
  function rim(path){return '<path class="bw2-rim-shadow" d="'+path+'"/><path class="bw2-rim-white" d="'+path+'"/>';}
  var scene='<section class="bw2-detail-scene bw2-summary-scene" data-bw2-region="pokemon">'+
    '<svg class="bw2-scene-geometry" viewBox="0 0 386 268" preserveAspectRatio="none" aria-hidden="true"><g class="bw2-lower-background"><path class="bw2-lower-face" d="'+lowerPath+'"/>'+rim(lowerPath)+'</g></svg><svg class="bw2-scene-panels" viewBox="0 0 386 268" preserveAspectRatio="none" aria-hidden="true"><g class="bw2-name-plane"><path class="bw2-paper-shape" d="'+platePath+'"/><path class="bw2-level-shade" d="M330 22H385V53H299Z"/>'+rim(platePath)+'</g><g class="bw2-held-plane"><path class="bw2-paper-shape" d="'+heldPath+'"/><path class="bw2-mark-base" d="'+markPath+'"/>'+rim(markPath)+rim(heldPath)+'</g></svg>'+
    '<div class="bw2-detail-types" aria-label="精灵属性">'+typesHTML(c.attr1,c.attr2)+'</div><div class="bw2-detail-moves">'+moves+'</div><div class="bw2-move-actions'+(more?' has-more':'')+'">'+boxAction+more+'</div>'+
    '<div class="bw2-scene-nameplate">'+nameHeader+'<div class="bw2-name-meta"><span class="bw2-detail-level"><span>Lv.</span><b>'+esc(c.level)+'</b></span><span class="bw2-state-badges" title="'+esc(identity.badges.map(function(b){return b.label;}).join('、'))+'" aria-label="特殊标记：'+esc(identity.badges.map(function(b){return b.label;}).join('、'))+'">'+bw2DetailBadgesHTML(identity)+'</span></div></div>'+
    '<div class="bw2-scene-shadow" aria-hidden="true"><div class="bw2-shadow-sprite">'+html('.dt-sprite')+'</div></div><div class="bw2-scene-sprite">'+html('.dt-sprite')+'</div>'+
    '<div class="bw2-scene-markings" title="'+(markings?'精灵标记':'尚未记录精灵标记')+'">'+marks+'</div><button type="button" class="bw2-scene-held" data-bw2-held aria-label="'+(c.item&&c.item!=='无'?'查看并管理携带道具':'选择携带道具')+'"><span class="dt-hold"><span>携带道具</span><span class="bw2-held-item">'+bw2HeldIconHTML(c)+'<span class="bw2-held-name">'+esc(c.item&&c.item!=='无'?c.item:'无 · 选择携带')+'</span></span></span></button></section>';
  var clipId='bw2-screen-'+(++bw2DetailSeq),screenPath=bw2ScreenPath();
  // All bars share the gray face; chevrons belong only to ability/nature.
  // Experience fill follows the slanted track in SVG, without a rectangular gap.
  function infoStrip(y,height,kind,progress,clipId){
    var mid=y+height/2,bottom=y+height,path='M55 '+y+'H306L314 '+mid+'L306 '+bottom+'H55L47 '+mid+'Z';
    var experience=typeof progress==='number',fill='';
    if(experience){
      var track='M151 '+y+'H306L314 '+mid+'L306 '+bottom+'H151L159 '+mid+'Z',tip=151+163*progress,cap=Math.min(8,163*progress);
      fill='<defs><clipPath id="'+clipId+'"><path d="'+track+'"/></clipPath></defs>'+(progress>0?'<path class="bw2-exp-fill" clip-path="url(#'+clipId+')" d="M151 '+y+'H'+(tip-cap)+'L'+tip+' '+mid+'L'+(tip-cap)+' '+bottom+'H151Z"/>':'');
    }
    var dividers=experience?'':'<path class="bw2-trait-divider-shadow" d="M158 '+y+'L166 '+mid+'L158 '+bottom+'M164 '+y+'L172 '+mid+'L164 '+bottom+'"/><path class="bw2-trait-divider-white" d="M160 '+y+'L168 '+mid+'L160 '+bottom+'M166 '+y+'L174 '+mid+'L166 '+bottom+'"/>';
    return '<g class="'+kind+'"><path class="bw2-paper-shape" d="'+path+'"/>'+fill+'<path class="bw2-trait-label-face" d="M55 '+y+'H151L159 '+mid+'L151 '+bottom+'H55L47 '+mid+'Z"/>'+rim(path)+'<path class="bw2-strip-highlight" d="M48 '+mid+'L55 '+(y+1)+'H306"/><path class="bw2-strip-depth" d="M55 '+(bottom-1)+'H306L313 '+mid+'"/>'+dividers+'</g>';
  }
  function traitStrip(y){return infoStrip(y,22,'bw2-trait-strip');}
  // The paper panel is clipped by the calibrated upper face; the grid is continuous.
  var upperGeometry='<defs><clipPath id="'+clipId+'"><path d="'+screenPath+'"/></clipPath></defs><path class="bw2-screen-face" d="'+screenPath+'"/><g clip-path="url(#'+clipId+')"><g class="bw2-battle-plane"><path class="bw2-paper-shape" d="M180 5H386V155H180Z"/>'+rim('M180 5H386V155H180Z')+'</g></g><g class="bw2-main-outline">'+rim(screenPath)+'</g>';
  var header='<header class="bw2-detail-header"><svg class="bw2-header-cap" viewBox="0 0 386 36" preserveAspectRatio="none" aria-hidden="true"><path class="bw2-top-cap" d="M1 1H150L165 16H1Z"/><path class="bw2-top-cap-lines" d="M1 3H149M1 6H152M1 9H155M1 12H158"/></svg><div class="bw2-title-band"><div class="modal-name">Pokémon info <span>/ 详细信息</span></div><button type="button" class="close bw2-detail-close" data-close aria-label="关闭详情" title="关闭详情">×</button></div></header>';
  // Geometry belongs to the route markup: the first paint must already be complete.
  var detailRoot=overlay&&overlay.closest('.bw2-console'),detailValues=bw2DetailScreenValues(detailRoot),detailStyle=detailValues?Object.keys(detailValues).map(function(key){return key+':'+detailValues[key];}).join(';'):'';
  return '<div class="modal detail-modal one bw2-detail" style="'+detailStyle+'" data-bw2-detail="overview"><div class="modal-body"><div class="bw2-detail-canvas"><div class="bw2-detail-grid" aria-hidden="true"></div>'+header+scene+'<section class="bw2-detail-upper bw2-detail-data" data-bw2-region="values"><svg class="bw2-upper-outline" viewBox="0 0 386 248" preserveAspectRatio="none" aria-hidden="true">'+upperGeometry+'</svg><div class="bw2-upper-content">'+battleTop+'</div></section></div></div></div>';

}

/* PERF P01: dirty/signature per page; defer hidden pages and scan only changed DOM. */
function bw2PanelHTML(key){
  if(key==='1')return trainerHTML()+teamHTML();
  if(key==='2')return envStripHTML()+tasksHTML()+worldHTML();
  if(key==='3')return battleHTML();
  return menuHTML();
}
function bw2PanelSignature(key){
  // Depend only on the data each view reads. Hidden views catch up on activation.
  if(key==='trainer')return JSON.stringify([stat_data.训练家,stat_data.环境,pickRegion(parseBadges())]);
  if(key==='party')return JSON.stringify([stat_data.队伍,stat_data.战场&&stat_data.战场.场上,pkmSource,diyStorageRawSeen]);
  if(key==='1')return bw2PanelSignature('trainer')+'|'+bw2PanelSignature('party');
  if(key==='2')return JSON.stringify([stat_data.环境&&stat_data.环境.赛程,stat_data.任务,stat_data.世界事件]);
  if(key==='3')return JSON.stringify(stat_data.战场||{});
  if(key==='controls-1')return JSON.stringify([stat_data.附近宝可梦,pkmSource,diyStorageRawSeen]);
  if(key==='controls-2')return JSON.stringify([stat_data.劲敌,stat_data.人际关系]);
  if(key==='controls-3')return JSON.stringify([hudPendingActions,hudCmdOpen]);
  return key;
}
function bw2RememberHome(panel){panel._bw2TrainerSignature=bw2PanelSignature('trainer');panel._bw2PartySignature=bw2PanelSignature('party');panel._bw2Signature=bw2PanelSignature('1');}
function bw2Hydrate(root){bw2SyncMoveColors(root);hudBindRefreshProgrammaticGuard(root);pkImgFix(root);resolvePkmImgs(root);resolveItemImgs(root);resolveNearbyTypes(root);hudResolvePkidbImages(root);}
function bw2RefreshPanel(app,key){
  if(key==='4'){bw2RefreshControls(app,key);return;}
  var panel=app.querySelector('#tab-'+key);if(!panel)return;
  var signature=bw2PanelSignature(key);if(panel._bw2Signature===signature)return;
  var scroll=panel.scrollTop;
  if(key==='1'&&panel.querySelector('.bw2-profile')&&panel.querySelector('.grid')){
    var trainerSig=bw2PanelSignature('trainer'),partySig=bw2PanelSignature('party');
    if(panel._bw2TrainerSignature!==trainerSig){var old=panel.querySelector('.bw2-profile'),body=old.querySelector('.bw2-profile-body'),top=body.scrollTop;old.outerHTML=trainerHTML();panel.querySelector('.bw2-profile-body').scrollTop=top;bw2Hydrate(panel.querySelector('.bw2-profile'));}
    if(panel._bw2PartySignature!==partySig){panel.querySelector('.grid').outerHTML=teamHTML();bw2Hydrate(panel.querySelector('.grid'));for(var i=0;i<cards.length;i++)preloadMoves(cards[i].skills);}
    bw2RememberHome(panel);
  }else{panel.innerHTML=bw2PanelHTML(key);bw2Hydrate(panel);if(key==='1')bw2RememberHome(panel);}
  panel._bw2Signature=signature;panel.scrollTop=scroll;
  hudDiagInc('bw2PageRenders');
}
function bw2RefreshPanels(app){
  app=app||document.getElementById(winMode==='0'?'pkm-hud-inline':'pkm-hud-slot');if(!app)return false;
  cards=buildCards();
  bw2RefreshPanel(app,bw2DisplayTab(app));bw2RefreshControls(app);hudDiagInc('bw2RefreshChecks');return true;
}

/* EVENTS: scoped capture handles only new controls; upstream domain events stay intact. */
function bw2BindUI(app){
  if(app._bw2Bound)return;app._bw2Bound=true;app.classList.add('bw2-host');
  bw2BindPopupUI(app);
  hudScope.listen(WIN,'resize',bw2RequestLayout);
  hudScope.cleanup(function(){if(pageOverlay&&pageOverlay.parentElement===document.body)pageOverlay.remove();});
  hudScope.listen(app,'click',function(e){
    var target=e.target;if(target&&target.nodeType!==1)target=target.parentElement;if(!target||!target.closest)return;
    var battleToggle=target.closest('[data-bw2-battle-toggle]');if(battleToggle){e.preventDefault();e.stopPropagation();bw2BattleCollapsed=!bw2BattleCollapsed;bw2SyncBattleLayout(app);bw2ResizeConsole();return;}
    var boxTab=target.closest('[data-bw2-box-tab]');if(boxTab){e.preventDefault();e.stopPropagation();bw2SwitchBox(boxTab.getAttribute('data-bw2-box-tab'));return;}
    var nearbyStep=target.closest('[data-bw2-nearby-step]');if(nearbyStep){e.preventDefault();e.stopPropagation();var nearbyGrid=nearbyStep.parentElement.querySelector('.nb-grid');if(nearbyGrid){var offsets=bw2NearbyOffsets(nearbyGrid),index=bw2NearbyIndex(nearbyGrid)+Number(nearbyStep.dataset.bw2NearbyStep);index=Math.max(0,Math.min(offsets.length-1,index));nearbyGrid.scrollTo({left:offsets[index],behavior:'smooth'});}return;}
    var quickCommand=target.closest('.bw2-command-screen [data-cmd]');
    if(quickCommand){e.preventDefault();e.stopPropagation();var commandLabel=quickCommand.querySelector('.menu-label'),labelText=quickCommand._bw2CommandLabel||commandLabel.textContent;quickCommand._bw2CommandLabel=labelText;
      if(fillInput(quickCommand.getAttribute('data-cmd'))){commandLabel.textContent='已填入';quickCommand.classList.add('bw2-cmd-filled');hudScope.setTimeout(function(){if(quickCommand.isConnected){commandLabel.textContent=labelText;quickCommand.classList.remove('bw2-cmd-filled');}},1200);}
      else hudMsg('无法访问输入栏。指令：'+quickCommand.getAttribute('data-cmd'));return;
    }
    var toggle=target.closest('[data-bw2-trainer]');
    if(toggle){e.preventDefault();e.stopPropagation();bw2ToggleTrainer(toggle);return;}
    var info=target.closest('[data-bw2-info]');
    if(info){e.preventDefault();e.stopPropagation();bw2OpenInfo(currentDetailCard);return;}
    var held=target.closest('[data-bw2-held]');
    if(held){e.preventDefault();e.stopPropagation();bw2OpenHeldItem(currentDetailCard);return;}
    var heldAction=target.closest('[data-bw2-held-action]'),equip=target.closest('[data-bw2-equip-item]');
    if((heldAction||equip)&&bw2HeldContext){
      e.preventDefault();e.stopPropagation();var context=bw2HeldContext;
      if(heldAction&&heldAction.getAttribute('data-bw2-held-action')==='pick'){bw2OpenHeldPicker(context.card);return;}
      if(equip)equipPkm(context.card,equip.getAttribute('data-bw2-equip-item'));else unequipPkmByCard(context.card);
      subOverlay.classList.remove('open');subOverlay.innerHTML='';bw2HeldContext=null;bw2ReopenDetail(context.card);return;
    }
    if(target.closest('[data-bw2-movebox]')&&currentDetailCard){e.preventDefault();e.stopPropagation();subOverlay.classList.remove('open');openMoveBoxPicker(currentDetailCard);return;}
    var tab=target.closest('.tab-btn[data-tab]');
    if(tab){e.preventDefault();e.stopPropagation();bw2SelectConsoleTab(app,tab.getAttribute('data-tab'));}
  },true);
  hudScope.listen(app,'keydown',function(e){if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-bw2-info]')){e.preventDefault();bw2OpenInfo(currentDetailCard);}});
  hudScope.listen(app,'scroll',function(e){if(e.target.matches&&e.target.matches('.bw2-home-nearby .nb-grid'))bw2UpdateNearbyArrows(e.target);},true);
}
/* Ancillary identity and encounter fields remain accessible through the name. */
function bw2OpenInfo(card){
  if(!card)return;var holder=document.createElement('div');holder.innerHTML=bw2DetailFieldsHTML(card);
  var rows=Array.prototype.slice.call(holder.querySelectorAll('.modal-body>.row')).filter(function(row){var k=row.querySelector('.k');return k&&['属性','个体值','特性','性格','亲密度','经验','经验值'].indexOf(k.textContent.trim())<0;}).map(function(row){return row.outerHTML;}).join('');
  if(card.where==='box'&&card.boxName)rows+='<div class="action-btns"><button class="act-btn" data-bw2-movebox>切换盒子</button></div>';
  var p=getCardPkm(card)||{};
  ['图鉴编号','全国图鉴编号','全国编号','原训练家','主人','训练家ID','IDNo','相遇日期','获得日期','相遇地点','获得地点','相遇等级','个性'].forEach(function(k){if(p[k]!=null&&p[k]!=='')rows+='<div class="row"><span class="k">'+esc(k)+'</span><span class="v">'+esc(p[k])+'</span></div>';});
  subOverlay.innerHTML='<div class="modal"><div class="modal-head"><div class="modal-name">'+esc(card.species)+' · 资料</div><button class="close" data-sub-close aria-label="关闭资料">✕</button></div><div class="modal-body">'+rows+'</div></div>';subOverlay.classList.add('open');
}
/* Held-item UI routes to the original guarded mutation/persistence/undo APIs. */
function bw2OpenHeldItem(card){
  if(!card)return;bw2HeldContext={card:card};
  var p=getCardPkm(card),name=p&&p.携带道具;
  if(!name||name==='无'){bw2OpenHeldPicker(card);return;}
  showItemInfo(name,true,p.携带道具英文||'');
  var modal=subOverlay.querySelector('.modal');if(modal)modal.insertAdjacentHTML('beforeend','<div class="action-btns bw2-held-actions"><button type="button" class="act-btn" data-bw2-held-action="unequip">卸下道具</button><button type="button" class="act-btn" data-bw2-held-action="pick">更换携带道具</button></div>');
}
function bw2OpenHeldPicker(card){
  var items=Object.keys(stat_data.背包||{}).filter(function(name){return stat_data.背包[name]&&getBagCount(name)>0&&stat_data.背包[name].类型!=='重要物品';});
  subOverlay.innerHTML='<div class="modal"><div class="modal-head"><div class="modal-name">选择携带道具</div><button class="close" data-sub-close>✕</button></div><div class="modal-body"><div class="action-btns">'+(items.length?items.map(function(name){return '<button type="button" class="act-btn" data-bw2-equip-item="'+esc(name)+'">'+esc(name)+' ×'+getBagCount(name)+'</button>';}).join(''):'<div class="empty">暂无可携带的库存道具</div>')+'</div></div></div>';subOverlay.classList.add('open');
}
function bw2ReopenDetail(card){
  var p=getCardPkm(card);if(!p)return;
  currentDetailCard=cardFromPkm(p,card.slot,card.where,card.boxName);overlay.innerHTML=detailHTML(currentDetailCard);overlay.classList.add('open');
  pkImgFix(overlay);resolvePkmImgs(overlay);resolveMoveTypes(overlay);resolveItemImgs(overlay);hudResolvePkidbImages(overlay);
  resizeFrame();
}

/* PERF P04: merge host-event bursts; never alter persistence queue or asset guards. */
function bw2ScheduleRefresh(){
  if(bw2RefreshTimer)hudScope.clearTimeout(bw2RefreshTimer);
  bw2RefreshTimer=hudScope.setTimeout(function(){bw2RefreshTimer=0;pkRefreshData();try{pkmAutoSnap=pkmStateSnapshot(stat_data);}catch(e){}},350);
}

function bw2SyncTrainerLayout(app){
  if(!app)return;app.querySelectorAll('.bw2-profile').forEach(function(frame){var summary=frame.querySelector('.bw2-profile-summary'),panel=frame.closest('.tab-panel'),collapsed=summary.offsetHeight+2;
    var expanded=collapsed;if(panel){var r=frame.getBoundingClientRect(),p=panel.getBoundingClientRect(),scale=r.width/frame.offsetWidth;expanded=Math.max(collapsed,Math.floor((p.bottom-r.top)/scale)-2);}
    frame._bw2ClosedHeight=collapsed;frame._bw2OpenHeight=expanded;
    var height=(frame.classList.contains('is-open')?expanded:collapsed)+'px';if(!frame._bw2TrainerAnimation&&frame.style.height!==height)frame.style.height=height;
  });
}
function bw2ToggleTrainer(toggle){
  var frame=toggle.closest('.bw2-profile'),body=frame.querySelector('.bw2-profile-body'),expanded=!bw2TrainerExpanded;bw2TrainerExpanded=expanded;
  try{localStorage.setItem('pk_bw2_trainer_expanded',String(expanded?1:0));}catch(e){}
  var from=frame.offsetHeight;if(frame._bw2TrainerAnimation){frame._bw2TrainerAnimation.cancel();frame._bw2TrainerAnimation=null;}
  bw2SyncTrainerLayout(frame.closest('.bw2-host'));body.hidden=false;frame.classList.add('is-open');
  toggle.setAttribute('aria-expanded',String(expanded));toggle.querySelector('.bw2-profile-toggle-label').textContent=expanded?'− 收起资料':'＋ 训练家资料';
  var to=expanded?frame._bw2OpenHeight:frame._bw2ClosedHeight;frame.style.height=to+'px';
  var finish=function(){frame.classList.toggle('is-open',expanded);body.hidden=!expanded;frame._bw2TrainerAnimation=null;bw2ResizeConsole();};
  if(WIN.matchMedia('(prefers-reduced-motion: reduce)').matches){finish();return;}
  var animation=frame.animate([{height:from+'px'},{height:to+'px'}],{duration:240,easing:'cubic-bezier(.22,.75,.25,1)'});frame._bw2TrainerAnimation=animation;animation.onfinish=finish;
}





try{
  var _deadIds=['pkm-hud-btn','pkm-hud-mapfab','pkm-hud-mask','pkm-hud-win'];
  for(var _di=0;_di<_deadIds.length;_di++){
    var _de=document.getElementById(_deadIds[_di]);
    if(_de&&_de.parentNode){_de.parentNode.removeChild(_de);}
  }
}catch(e){}
try{
  var _ss=document.querySelectorAll('style');
  for(var _si=0;_si<_ss.length;_si++){
    var _st=_ss[_si];
    if(_st.textContent&&_st.textContent.indexOf('pkm-hud-btn')>=0&&_st.parentNode){_st.parentNode.removeChild(_st);}
  }
}catch(e){}
try{WIN.__pkmHudLoaded=true;}catch(e){}
try{
  if(WIN.__pkmHudAssetLocksHandler){WIN.removeEventListener('pkworkshop:asset-locks-changed',WIN.__pkmHudAssetLocksHandler);}
  if(WIN.__pkmHudAssetStorageHandler){WIN.removeEventListener('storage',WIN.__pkmHudAssetStorageHandler);}
  WIN.__pkmHudAssetLocksHandler=function(){try{pkmHudRenderCurrent();}catch(e){hudDiagError('asset lock refresh',e);}};
  WIN.__pkmHudAssetStorageHandler=function(e){try{if(e&&e.key==='pk_pokemon_asset_locks_v1')pkmHudRenderCurrent();}catch(ex){hudDiagError('asset lock storage',ex);}};
  hudScope.listen(WIN,'pkworkshop:asset-locks-changed',WIN.__pkmHudAssetLocksHandler);
  hudScope.listen(WIN,'storage',WIN.__pkmHudAssetStorageHandler);
}catch(e){hudDiagError('asset lock bind',e);}

var st=document.createElement('style');
st.type='text/css';
st.textContent=css;
(document.head||document.body).appendChild(st);

var PK_IS_TAURI=false;
try{
  var _ua2=(navigator.userAgent||'');
  var _isTauri=!!(WIN.__TAURI_INTERNALS__||WIN.__TAURI__)||/^tauri:/.test(WIN.location.protocol)||/tauri\.localhost/.test(WIN.location.hostname)||/Tauri/i.test(_ua2);
  var _isHarmony=/ArkWeb/i.test(_ua2)||/HarmonyOS/i.test(_ua2)||/OpenHarmony/i.test(_ua2);
  PK_IS_TAURI=_isTauri;
  if(_isTauri||_isHarmony){
    var _rm=document.createElement('meta');
    _rm.name='referrer';
    _rm.content='no-referrer';
    var _hd=document.head||document.documentElement;
    if(_hd)_hd.insertBefore(_rm,_hd.firstChild);
  }
}catch(e){}

var MENU=[{"key":"settings","label":"设置","emoji":"⚙️","img":""},{"key":"badge","label":"徽章盒","emoji":"🏅","img":""},{"key":"pokedex","label":"图鉴","emoji":"📖","img":""},{"key":"breeding","label":"繁育","emoji":"🥚","img":""},{"key":"bag","label":"背包","emoji":"🎒","img":""},{"key":"box","label":"盒子","emoji":"📦","img":""},{"key":"map","label":"地图","emoji":"🗺️","img":""},{"key":"typechart","label":"克制表","emoji":"⚡","img":""}];

var DEFAULT_STAT={"训练家":{"名字":"","活力":3,"活力上限":3,"金钱":0,"徽章":"","身份":"","声望":"0 无名","气场":"无","可命令等级":10},"队伍":{"1":{"名字":"空"},"2":{"名字":"空"},"3":{"名字":"空"},"4":{"名字":"空"},"5":{"名字":"空"},"6":{"名字":"空"}},"附近宝可梦":{},"背包":{},"盒子":{},"人际关系":{},"任务":{"主线":"","支线":"","传说":""},"劲敌":{},"通讯录":{},"繁育":{"蛋":"","剩余步数":0,"存放":""},"世界事件":{"附近遭遇":"","地区新闻":"","区域动态":""},"战场":{"场景":"","规则":"","场上":{},"各方":{}},"环境":{"当前地点":"","日期":"","时间":"","赛程":""}};

function cloneStat(){try{if(typeof WIN.structuredClone==='function')return WIN.structuredClone(DEFAULT_STAT);}catch(e){}return JSON.parse(JSON.stringify(DEFAULT_STAT));}
function mergeStat(extra){
  var out=cloneStat();
  function m(a,b){for(var k in b){if(b[k]&&typeof b[k]==='object'&&!Array.isArray(b[k])&&a[k]&&typeof a[k]==='object'){m(a[k],b[k]);}else{a[k]=b[k];}}}
  if(extra)m(out,extra);
  return out;
}
function loadFromMvu(){
  try{
    var mv=WIN.Mvu||window.Mvu;
    if(!mv||!mv.getMvuData)return null;
    var d=null;
    try{
      var f=window.frameElement;
      if(f&&f.closest){
        var m=f.closest('.mes');
        var id=m?parseInt(m.getAttribute('mesid')||''):NaN;
        if(!isNaN(id))d=mv.getMvuData({type:'message',message_id:id});
      }
    }catch(e){}
    if(!(d&&d.stat_data&&d.stat_data.训练家)){
      try{
        var mes=WIN.document.querySelectorAll('.mes');
        for(var i=mes.length-1;i>=0;i--){
          var mid=parseInt(mes[i].getAttribute('mesid')||'');
          if(isNaN(mid))continue;
          var dd=mv.getMvuData({type:'message',message_id:mid});
          if(dd&&dd.stat_data&&dd.stat_data.训练家){d=dd;break;}
        }
      }catch(e){}
    }
    return (d&&d.stat_data&&d.stat_data.训练家)?mergeStat(d.stat_data):null;
  }catch(e){return null;}
}
function loadFromText(text){
  try{
    if(!text)return null;
    var re=/\u005B([^\u005D]+)\u005D([\s\S]*?)\u005B\/\1\u005D/g,blocks={},bm;
    while((bm=re.exec(text))!==null){
      var oo={};
      bm[2].trim().split('\n').forEach(function(line){
        var idx=line.indexOf(':');
        if(idx<0)return;
        oo[line.slice(0,idx).trim()]=line.slice(idx+1).trim();
      });
      blocks[bm[1]]=oo;
    }
    if(!blocks['训练家信息'])return null;
    var out=cloneStat(),tr=blocks['训练家信息'];
    var np=(tr['名字']||'').split('|');
    out.训练家.名字=np[0].trim();
    if(np[1]){var vv=np[1].match(/(\d+)\/(\d+)/);if(vv){out.训练家.活力=parseInt(vv[1],10);out.训练家.活力上限=parseInt(vv[2],10);}}
    var mp=(tr['金钱']||'0').split('|');
    out.训练家.金钱=parseInt(mp[0],10)||0;
    if(mp[1]){var pp=mp[1].match(/(\d+)/);if(pp)out.训练家.PP=parseInt(pp[1],10);}
    out.训练家.徽章=tr['徽章']||'';
    out.训练家.身份=tr['身份']||'';
    out.训练家.声望=tr['声望']||'0 无名';
    out.训练家.气场=tr['气场']||'无';
    out.训练家.可命令等级=parseInt(tr['可命令等级']||'0',10)||0;
    var team=blocks['队伍状态']||{};
    for(var i=1;i<=6;i++){
      var nm=team['队伍'+i+'_名字'];
      if(!nm||nm==='空')continue;
      out.队伍[String(i)]={名字:nm,英文名:'',昵称:'',等级:parseInt(team['队伍'+i+'_等级']||'1',10)||1,性别:team['队伍'+i+'_性别']||'',是否闪光:team['队伍'+i+'_是否闪光']==='是',图标:team['队伍'+i+'_图标']||'',HP:team['队伍'+i+'_HP']||'0/0',经验:team['队伍'+i+'_经验']||'0/0',属性1:team['队伍'+i+'_属性1']||'',属性2:team['队伍'+i+'_属性2']||'无',技能:team['队伍'+i+'_技能']||'',性格:team['队伍'+i+'_性格']||'',特性:team['队伍'+i+'_特性']||'',携带道具:team['队伍'+i+'_携带道具']||'无',携带道具英文:'',亲密度:parseInt(team['队伍'+i+'_亲密度']||'0',10)||0,个体值:team['队伍'+i+'_个体值']||'',精灵球:team['队伍'+i+'_精灵球']||'',精灵球英文:team['队伍'+i+'_精灵球英文']||'',孵化剩余:team['队伍'+i+'_孵化剩余']||''};
    }
    var near=blocks['附近宝可梦']||{},ng={};
    for(var k in near){var mt=k.match(/附近(\d+)_(.+)/);if(mt){ng[mt[1]]=ng[mt[1]]||{};ng[mt[1]][mt[2]]=near[k];}}
    for(var g in ng){var dd=ng[g],rawShiny=(dd['是否闪光']!=null?dd['是否闪光']:dd['闪光']),attr=String(dd['属性']||dd['类型']||'').split(/[\/、,，|]+/).map(function(x){return x.trim();}).filter(Boolean);out.附近宝可梦[g]=Object.assign({},dd,{名字:dd['名字']||dd['名称']||'',英文名:dd['英文名']||dd['EnglishName']||'',数量:parseInt(dd['数量']||dd['count']||'1',10)||1,是否闪光:/^(?:是|true|1|yes|y|闪光|異色|异色)$/i.test(String(rawShiny||'').trim()),状态:dd['状态']||dd['标签']||dd['特征']||'普通',图标:dd['图标']||dd['图片']||dd['icon']||'',属性1:dd['属性1']||dd['类型1']||attr[0]||'',属性2:dd['属性2']||dd['类型2']||attr[1]||'无',标签:dd['标签']||'',特征:dd['特征']||'',稀有度:dd['稀有度']||dd['分类']||'',形态:dd['形态']||dd['特殊形态']||''});}
    for(var bk in blocks){if(bk.indexOf('背包_')===0){var cat=bk.replace('背包_','');var its=blocks[bk];for(var it in its){var ps=its[it].split(',');out.背包[it]={类型:cat,数量:parseInt(ps[0],10)||0,图标:(ps[1]||'').trim()};}}}
    var rel=blocks['人际关系']||{};
    for(var rn in rel){var rv=rel[rn].match(/(\d+)/);out.人际关系[rn]={好感度:rv?parseInt(rv[1],10):0};}
    return out;
  }catch(e){return null;}
}
function loadStatDataLight(){
  var d=loadFromMvu();
  if(d)return d;
  try{var backup=JSON.parse(localStorage.getItem('pk_mvu_backup_'+chatKey())||'null');if(backup&&backup.训练家)return backup;}catch(e){}
  try{
    var el=WIN.document.querySelector('.statusbar-data-source')||document.querySelector('.statusbar-data-source');
    if(el){
      var t=loadFromText(el.value||el.textContent||'');
      if(t)return t;
    }
  }catch(e){}
  return DEFAULT_STAT;
}
function loadStatData(){
  var d=loadFromMvu();
  if(d){try{localStorage.setItem('pk_mvu_backup_'+chatKey(),JSON.stringify(d));}catch(e){}return d;}
  return loadStatDataLight();
}

var stat_data=loadStatData();

var hudLocationIndex=new Map(),hudLocationIndexDirty=true,hudStateRevCounter=1,hudStateFingerprint='';
function hudRebuildLocationIndex(){
  var idx=new Map();
  function add(id,loc){id=String(id||'');if(!id)return;var a=idx.get(id);if(!a){a=[];idx.set(id,a);}a.push(loc);}
  try{var t=(stat_data&&stat_data.队伍)||{};for(var i=1;i<=6;i++){var p=t[String(i)],id=hudPokemonId(p);if(id)add(id,{type:'team',slot:String(i),pokemon:pkmHudClone(p)});}var bs=(stat_data&&stat_data.盒子)||{};Object.keys(bs).forEach(function(b){var box=bs[b]||{};Object.keys(box).forEach(function(sl){var p2=box[sl],id2=hudPokemonId(p2);if(id2)add(id2,{type:'box',box:String(b),slot:String(sl),pokemon:pkmHudClone(p2)});});});}catch(e){hudDiagError('location index',e);}
  hudLocationIndex=idx;hudLocationIndexDirty=false;hudDiagInc('locationIndexRebuild');return idx;
}
function hudComputeStateFingerprint(){try{var raw=JSON.stringify({队伍:(stat_data&&stat_data.队伍)||{},盒子:(stat_data&&stat_data.盒子)||{}}),h=2166136261;for(var i=0;i<raw.length;i++){h^=raw.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(16)+':'+raw.length;}catch(e){return '';}}
function hudMarkStateDirty(reason){hudLocationIndexDirty=true;hudStateRevCounter++;if(hudStateRevCounter>2147483000)hudStateRevCounter=1;hudStateFingerprint=hudComputeStateFingerprint();if(reason)hudDiagEvent('state',reason);}
function hudExternalStateChanged(){
  try{var fp=hudComputeStateFingerprint();if(fp!==hudStateFingerprint){hudStateFingerprint=fp;hudLocationIndexDirty=true;hudStateRevCounter++;if(hudStateRevCounter>2147483000)hudStateRevCounter=1;return true;}}catch(e){}return false;
}
function hudEnsureLocationIndex(){if(hudLocationIndexDirty)hudRebuildLocationIndex();return hudLocationIndex;}
try{hudExternalStateChanged();hudRebuildLocationIndex();}catch(e){}


var __pkmHudPersistQueue=Promise.resolve();

var __pkmHudPersistEpoch=0;
function pkmHudClone(v){try{if(typeof WIN.structuredClone==='function')return WIN.structuredClone(v);}catch(e){}try{return JSON.parse(JSON.stringify(v));}catch(e2){return v;}}
function pkmHudMvuTarget(){
  try{
    var mv=WIN.Mvu||window.Mvu;
    if(!mv||typeof mv.getMvuData!=='function')return null;
    try{
      var latest=mv.getMvuData({type:'message',message_id:'latest'});
      if(latest&&latest.stat_data&&latest.stat_data.队伍){
        return {mv:mv,data:latest,opt:{type:'message',message_id:'latest'}};
      }
    }catch(e){}
    var mes=[];
    try{mes=WIN.document.querySelectorAll('.mes');}catch(e){}
    for(var i=mes.length-1;i>=0;i--){
      var id=parseInt(mes[i].getAttribute('mesid')||'',10);
      if(isNaN(id))continue;
      try{
        var d=mv.getMvuData({type:'message',message_id:id});
        if(d&&d.stat_data&&d.stat_data.队伍){
          return {mv:mv,data:d,opt:{type:'message',message_id:id}};
        }
      }catch(e){}
    }
  }catch(e){}
  return null;
}
function pkmHudPersistStatData(opt){
  opt=opt||{};
  pkmLastLocalWrite=Date.now();
  try{var _ic=hudPhoneIdentityCore();if(_ic&&typeof _ic.guardStatData==='function'){var _gr=_ic.guardStatData(stat_data,{source:'hud-persist'});if(_gr&&_gr.recovered)hudDiagEvent('identity-guard','restored '+_gr.recovered+' missing ID(s) before MVU persist');}}catch(e){hudDiagError('identity guard before persist',e);}
  hudMarkStateDirty(opt.force?'authoritative-persist':'local-persist');
  var epoch=(opt.epoch==null?__pkmHudPersistEpoch:Number(opt.epoch)||0);
  var snap=pkmHudClone(stat_data);
  __pkmHudPersistQueue=__pkmHudPersistQueue.catch(function(){return false;}).then(function(){
    
    if(!opt.force&&epoch!==__pkmHudPersistEpoch)return false;
    var t=pkmHudMvuTarget();
    if(!t||!t.mv||typeof t.mv.replaceMvuData!=='function')return false;
    var n=pkmHudClone(t.data)||{};
    n.stat_data=snap;
    var p;
    try{p=t.mv.replaceMvuData(n,t.opt);}catch(e){return false;}
    return Promise.resolve(p).then(function(){
      try{localStorage.setItem('pk_mvu_backup_'+chatKey(),JSON.stringify(snap));}catch(e){}
      try{hudRebuildLocationIndex();}catch(e){}
      try{pkmAutoSnap=pkmStateSnapshot(snap);}catch(e){}
      return true;
    }).catch(function(){return false;});
  });
  return __pkmHudPersistQueue;
}
function pkmHudAuthoritativeAssetMutation(opt){
  opt=opt&&typeof opt==='object'?opt:{};
  var action=String(opt.action||''),id=String(opt.pokemonId||opt.pokemon_id||'').trim();
  if(!id)return Promise.reject(new Error('缺少永久精灵ID'));
  if(action!=='remove-box-by-id'&&action!=='replace-box-by-id')return Promise.reject(new Error('HUD 不支持该资产变动：'+action));
  var loc=hudFindPokemonLocations(id);
  if(loc.length>1)return Promise.reject(new Error('HUD 检测到 '+loc.length+' 个同一精灵ID实体，已拒绝自动修改'));
  if(!loc.length)return Promise.resolve({ok:true,notFound:true,pokemonId:id});
  var hit=loc[0];
  if(hit.type!=='box')return Promise.reject(new Error('同ID精灵当前位于队伍，不能由云仓自动清理'));
  stat_data.盒子=stat_data.盒子||{};
  var box=stat_data.盒子[String(hit.box)];
  if(!box)return Promise.reject(new Error('HUD 盒子位置已变化，请重新扫描'));
  var current=box[String(hit.slot)];
  if(!current||hudPokemonId(current)!==id)return Promise.reject(new Error('HUD 精灵位置已变化，请重新扫描'));
  var replacement=(opt.replacement&&typeof opt.replacement==='object')?pkmHudClone(opt.replacement):{名字:'空'};
  box[String(hit.slot)]=replacement;
  __pkmHudPersistEpoch++;
  var authoritativeEpoch=__pkmHudPersistEpoch;
  return pkmHudPersistStatData({force:true,epoch:authoritativeEpoch}).then(function(ok){
    if(!ok)throw new Error('HUD 权威资产状态写回 MVU 失败');
    try{pkmHudRenderCurrent();}catch(e){}
    return {ok:true,pokemonId:id,type:'box',box:String(hit.box),slot:String(hit.slot),replacement:pkmHudClone(replacement),stateRevision:hudStateRevision()};
  });
}
function pkmHudRenderCurrent(){
  try{render();resizeFrame();return true;}catch(e){return false;}
}

var winMode='0';
try{winMode=localStorage.getItem('pk_winmode')||'0';}catch(e){winMode='0';}
function lsGet(key,fb){
  if(hudIsCacheKey(key)){
    if(Object.prototype.hasOwnProperty.call(hudCacheMem,key)){hudCacheTouch(key);return pkmHudClone(hudCacheMem[key]);}
    try{var raw=localStorage.getItem(key);if(raw!=null){var v=raw;try{v=JSON.parse(raw);}catch(e){}hudCacheMem[key]=v;hudCachePut(key,v).then(function(ok){if(ok)try{localStorage.removeItem(key);}catch(e){}});return pkmHudClone(v);}}catch(e){hudDiagError('cache legacy read',e);}
    return fb;
  }
  try{var v2=JSON.parse(localStorage.getItem(key));return (v2==null)?fb:v2;}catch(e){return fb;}
}
function lsSet(key,v){
  if(hudIsCacheKey(key)){hudCachePut(key,pkmHudClone(v));return;}
  try{localStorage.setItem(key,JSON.stringify(v));}catch(e){hudDiagError('localStorage set '+key,e);}
}
var DIY_INPUT_STYLE='width:100%;box-sizing:border-box;padding:6px 10px;margin-bottom:6px;font-family:inherit;font-size:.85rem;background:rgba(43,74,111,.5);border:1px solid var(--frame);border-radius:4px;color:var(--text);outline:none;display:block';
var diyType='move';
var diyStorageRawSeen='';
var hudDiyNameIndex=new Map();
var hudDiyMigrationPromise=null,hudDiyMigrationTimer=0;
var hudDiyLastVisualFingerprint='',hudDiyVisualRefreshTimer=0,hudDiyVisualRefreshForce=false;
function diyNormalizeData(d){
  d=(d&&typeof d==='object')?d:{};
  d.move=(d.move&&typeof d.move==='object')?d.move:{};
  d.ability=(d.ability&&typeof d.ability==='object')?d.ability:{};
  d.item=(d.item&&typeof d.item==='object')?d.item:{};
  d.pokemon=(d.pokemon&&typeof d.pokemon==='object')?d.pokemon:{};
  return d;
}
function hudDiyIndexKey(n){return String(n||'').trim().toLowerCase();}
function hudBuildDiyIndex(){
  var idx=new Map(),bucket=(diyData&&diyData.pokemon)||{};
  function put(n,rootKey,root,stage,stageIndex){if(!n)return;var keys=[String(n).trim(),baseName(String(n).trim())];for(var q=0;q<keys.length;q++){var k=hudDiyIndexKey(keys[q]);if(k&&!idx.has(k))idx.set(k,{rootKey:String(rootKey),root:root,stage:stage,stageIndex:stageIndex});}}
  Object.keys(bucket).forEach(function(rootKey){var root=bucket[rootKey];if(!root)return;put(rootKey,rootKey,root,root,-1);put(root.name,rootKey,root,root,-1);if(Array.isArray(root.chain))root.chain.forEach(function(st,i){if(st)put(st.name,rootKey,root,st,i);});});
  hudDiyNameIndex=idx;hudDiagInc('diyIndexRebuild');return idx;
}
function hudDiyLookup(name){if(!name)return null;var k=hudDiyIndexKey(String(name).trim()),x=hudDiyNameIndex.get(k);if(x)return x;var b=hudDiyIndexKey(baseName(String(name).trim()));return hudDiyNameIndex.get(b)||null;}
function diyLoad(){
  try{var raw=localStorage.getItem('pk_diy')||'';diyStorageRawSeen=raw;var d=raw?JSON.parse(raw):null;if(d&&typeof d==='object')return diyNormalizeData(d);}catch(e){hudDiagError('DIY load',e);}
  return {move:{},ability:{},item:{},pokemon:{}};
}
var diyData=diyLoad();
hudBuildDiyIndex();
diyPreloadImages();
hudScope.setTimeout(function(){hudMigrateInlineDiyAssets();},120);

function hudLegacyDiySnapshot(){
  // Never expose the live diyData object. Older Phone Suite bridges historically hydrated
  // pkidb:// references by mutating the returned object to blob:, which could race with
  // HUD canonicalization and cause a pkidb <-> blob refresh loop.
  try{return JSON.parse(JSON.stringify(diyData||{move:{},ability:{},item:{},pokemon:{}}));}
  catch(e){return {move:{},ability:{},item:{},pokemon:{}};}
}
try{WIN.__pkmDiyData=function(){return hudLegacyDiySnapshot();};}catch(e){}
try{if(window!==WIN)window.__pkmDiyData=function(){return hudLegacyDiySnapshot();};}catch(e){}
var diyDelStep=0,diyDelType='move',diyDelName='';
var diyEditingName='';
var diyClearStep=0;
function diySyncFromStorage(force){
  try{
    var raw=localStorage.getItem('pk_diy')||'';
    if(!force&&raw===diyStorageRawSeen)return false;
    diyStorageRawSeen=raw;
    var d=raw?JSON.parse(raw):null;
    if(d&&typeof d==='object'){diyData=diyNormalizeData(d);hudBuildDiyIndex();diyPreloadImages();return true;}
  }catch(e){hudDiagError('DIY sync',e);}
  return false;
}
function diyCanonicalizeRuntimeUrls(v){
  if(typeof v==='string')return hudDiyRefByBlob[v]||v;
  if(Array.isArray(v))return v.map(diyCanonicalizeRuntimeUrls);
  if(v&&typeof v==='object'){Object.keys(v).forEach(function(k){v[k]=diyCanonicalizeRuntimeUrls(v[k]);});}
  return v;
}
function diySave(opt){
  opt=opt||{};
  try{
    diyData=diyNormalizeData(diyCanonicalizeRuntimeUrls(diyData));
    var raw=JSON.stringify(diyData);
    localStorage.setItem('pk_diy',raw);diyStorageRawSeen=raw;hudBuildDiyIndex();
  }catch(e){hudDiagError('DIY save',e);}
  diyPreloadImages();
  if(!opt.skipAssetMigration)hudScheduleDiyMigration(40);
}
function hudScheduleDiyMigration(delay){
  if(hudDiyMigrationTimer)hudScope.clearTimeout(hudDiyMigrationTimer);
  hudDiyMigrationTimer=hudScope.setTimeout(function(){
    hudDiyMigrationTimer=0;
    Promise.resolve(hudMigrateInlineDiyAssets()).catch(function(e){hudDiagError('DIY scheduled migrate',e);});
  },Math.max(20,Number(delay)||40));
}
function hudDiyVisualFingerprint(){
  var raw='';
  try{raw=localStorage.getItem('pk_diy')||'';}catch(e){}
  if(!raw){try{raw=JSON.stringify(diyData||{});}catch(e){raw='';}}
  var h=2166136261;
  for(var i=0;i<raw.length;i++){h^=raw.charCodeAt(i);h=Math.imul(h,16777619);}
  return (h>>>0).toString(16)+':'+raw.length;
}
function hudRefreshDiyVisuals(force){
  var synced=false;
  try{synced=diySyncFromStorage(false);}catch(e){}
  var fp=hudDiyVisualFingerprint();
  // Always hydrate existing <img data-pkidb> nodes, but rebuild panels only when
  // the canonical DIY data actually changed (or an explicit caller forces it).
  hudHydrateDiyDomOnly();
  if(!force&&!synced&&fp===hudDiyLastVisualFingerprint){hudDiagInc('diyVisualRendersSkipped');return false;}
  hudDiyLastVisualFingerprint=fp;
  try{hudBuildDiyIndex();diyPreloadImages();}catch(e){}
  try{pkmHudRenderCurrent();hudDiagInc('diyVisualRenders');}catch(e){hudDiagError('DIY visual render',e);return false;}
  hudHydrateDiyDomOnly();
  return true;
}
function hudScheduleDiyVisualRefresh(force){
  hudDiyVisualRefreshForce=hudDiyVisualRefreshForce||!!force;
  if(hudDiyVisualRefreshTimer)return;
  hudDiyVisualRefreshTimer=hudScope.setTimeout(function(){
    var f=hudDiyVisualRefreshForce;hudDiyVisualRefreshForce=false;hudDiyVisualRefreshTimer=0;
    hudRefreshDiyVisuals(f);
  },70);
}
hudDiyLastVisualFingerprint=hudDiyVisualFingerprint();
try{hudScope.listen(WIN,'pkworkshop:diy-imported',function(){
  try{
    diySyncFromStorage(true);hudBuildDiyIndex();diyPreloadImages();
    Promise.resolve(hudMigrateInlineDiyAssets()).then(function(){hudScheduleDiyVisualRefresh(true);},function(){hudScheduleDiyVisualRefresh(true);});
  }catch(e){hudDiagError('Workshop DIY sync event',e);}
});}catch(e){}
try{hudScope.listen(WIN,'pkworkshop:diy-runtime-hydrated',function(){
  // This event means image URLs were hydrated, not that DIY data changed.
  // Re-resolve DOM images only; never rebuild the HUD or animate the manual refresh button.
  hudHydrateDiyDomOnly();hudDiagInc('diyRuntimeHydratedEvents');
});}catch(e){}
try{hudScope.listen(WIN,'storage',function(e){if(e&&e.key==='pk_diy'){try{diySyncFromStorage(true);}catch(_){}hudScheduleDiyVisualRefresh(false);}});}catch(e){}
function hudMigrateInlineDiyAssets(){
  if(hudDiyMigrationPromise)return hudDiyMigrationPromise;
  try{var ps=(WIN.__PokemonPhoneSuite||window.__PokemonPhoneSuite),lib=ps&&ps.diyLibrary;if(lib&&Number(lib.schema||0)>=2){diyPreloadImages();hudHydrateDiyDomOnly();hudDiagInc('diyExternalOwnerMigrationSkips');return Promise.resolve(false);}}catch(e){}
  hudDiyMigrationPromise=(async function(){
    var jobs=[],changed=false;
    function one(obj,key){
      if(!obj||!obj[key])return;
      var v=String(obj[key]||'');
      if(/^data:image\//i.test(v))jobs.push(hudDiyAssetStoreBlob(hudDataUrlBlob(v)).then(function(ref){obj[key]=ref;changed=true;}));
      else if(v.indexOf(HUD_DIY_SCHEME)===0)hudDiyAssetResolve(v);
      else if(/^blob:/i.test(v))jobs.push(hudDiyAssetPersistValue(v).then(function(ref){if(ref&&ref!==v){obj[key]=ref;changed=true;}}).catch(function(e){hudDiagError('DIY blob migrate',e);}));
    }
    try{
      Object.keys((diyData&&diyData.pokemon)||{}).forEach(function(k){var o=diyData.pokemon[k];one(o,'img');if(o&&Array.isArray(o.chain))o.chain.forEach(function(st){one(st,'img');});});
      Object.keys((diyData&&diyData.item)||{}).forEach(function(k){one(diyData.item[k],'img');});
    }catch(e){hudDiagError('DIY asset scan',e);}
    if(!jobs.length)return false;
    try{
      await Promise.all(jobs);
      if(changed){diySave({skipAssetMigration:true});hudDiagEvent('DIY','内联图片（DataURL/blob）已迁入 IndexedDB');}
      return changed;
    }catch(e){hudDiagError('DIY asset migrate',e);return false;}
  })().finally(function(){hudDiyMigrationPromise=null;});
  return hudDiyMigrationPromise;
}

function diyPreloadImages(){
  try{
    var seen={};
    function add(u){
      u=String(u==null?'':u).trim();
      if(!u||seen[u])return;seen[u]=1;
      if(u.indexOf(HUD_DIY_SCHEME)===0){hudDiyAssetResolve(u);return;}
      if(!/^(?:https?:\/\/|data:image\/)/i.test(u))return;
      try{var im=new Image();try{im.referrerPolicy='no-referrer';}catch(e2){}im.onerror=function(){try{im.onerror=null;}catch(e3){}};im.src=u;}catch(e4){}
    }
    var p=diyData.pokemon||{};
    for(var k in p){
      var o=p[k];
      if(!o)continue;
      add(o.img);
      if(o.chain){for(var i=0;i<o.chain.length;i++){var st=o.chain[i];if(st)add(st.img);}}
    }
    var it=diyData.item||{};
    for(var k2 in it){var io=it[k2];if(io)add(io.img);}
  }catch(e){}
}
function diyRefreshTeam(){
  try{
    cards=buildCards();
    var grid=document.querySelector('#tab-1 .grid');
    if(grid){grid.outerHTML=teamHTML();}
    pkImgFix(document);resolvePkmImgs(document);resolveItemImgs(document);hudResolvePkidbImages(document);resizeFrame();
  }catch(e){hudDiagError('DIY team refresh',e);}
}


var PKM_ASSET_LOCKS_KEY='pk_pokemon_asset_locks_v1';
function hudPhoneIdentityCore(){try{return (WIN.__PokemonPhoneSuite&&WIN.__PokemonPhoneSuite.pokemonIdentity)||(window.__PokemonPhoneSuite&&window.__PokemonPhoneSuite.pokemonIdentity)||null;}catch(e){return null;}}
function hudPokemonId(p){try{var c=hudPhoneIdentityCore();if(c&&typeof c.readId==='function')return String(c.readId(p)||'');}catch(e){}p=p&&typeof p==='object'?p:{};return String(p.精灵ID||p.pokemonId||p.pokemon_id||p.培育实例ID||p.nurseryInstanceId||p.instanceId||'').trim();}
function hudPokemonReferenceId(ref){try{var c=hudPhoneIdentityCore();if(c&&typeof c.referenceId==='function')return String(c.referenceId(ref)||'');}catch(e){}ref=ref&&typeof ref==='object'?ref:{};return String(ref.pokemonId||ref.pokemon_id||ref.instanceId||hudPokemonId(ref.pokemon)||'').trim();}
function hudIsCloudStub(p){return !!(p&&typeof p==='object'&&(p.云端引用===true||p.云端引用===1||String(p.云端状态||'').toLowerCase()==='cold'||String(p.云端状态||'').toLowerCase()==='cloud'));}
function hudAssetChatKey(){try{var ST=WIN&&WIN.SillyTavern,ctx=ST&&ST.getContext?ST.getContext():null,id=ctx&&((typeof ctx.getCurrentChatId==='function'&&ctx.getCurrentChatId())||ctx.chatId);if(id!==undefined&&id!==null&&String(id)!=='')return 'chat:'+String(id);}catch(e){}return '';}
function hudAssetLocks(){try{var x=JSON.parse(WIN.localStorage.getItem(PKM_ASSET_LOCKS_KEY)||'null'),ck=hudAssetChatKey();if(!x||!Array.isArray(x.locks))return [];if(ck&&x.chatKey&&String(ck)!==String(x.chatKey))return [];return x.locks;}catch(e){return [];}}
function hudPokemonLockById(id){id=String(id||'');if(!id)return null;var a=hudAssetLocks();for(var i=0;i<a.length;i++)if(String(a[i]&&a[i].pokemonId||'')===id)return a[i];return null;}
function hudPokemonLock(p){return hudPokemonLockById(hudPokemonId(p));}
function hudAssertPokemonMutable(p,action){if(!p||!p.名字||p.名字==='空')return true;try{var c=hudPhoneIdentityCore();if(c&&typeof c.inspect==='function'){var ii=c.inspect(p);if(ii.conflict){hudMsg('这只精灵包含互相冲突的永久ID，已禁止'+String(action||'修改')+'；请先到小手机 → 培育中心 → 数据完整性处理。');return false;}if(ii.id&&!ii.valid){hudMsg('这只精灵的永久ID格式异常，已禁止'+String(action||'修改')+'；请先到小手机的数据完整性工具检查。');return false;}}}catch(e){hudDiagError('pokemon identity mutable guard',e);return false;}if(hudIsCloudStub(p)){hudMsg('这是得文云仓的冷存引用，不能在 HUD 中直接'+String(action||'修改')+'。请到小手机 → 培育中心 → 得文云仓正式取回。');return false;}var l=hudPokemonLock(p);if(l){var label=String(l.type||'资产事务');hudMsg('这只精灵正在执行「'+label+'」，HUD 已暂时锁定'+String(action||'修改')+'操作。请先在小手机完成/恢复该事务。');return false;}return true;}
function hudPhoneAssetBridge(){try{return (WIN.__PokemonPhoneSuite&&WIN.__PokemonPhoneSuite.pokemonAssets)||(window.__PokemonPhoneSuite&&window.__PokemonPhoneSuite.pokemonAssets)||null;}catch(e){return null;}}
function hudEnsurePokemonIdentity(p){
  if(!p||typeof p!=='object'||!p.名字||p.名字==='空')return '';
  try{var c=hudPhoneIdentityCore();if(c){var id0=typeof c.readId==='function'?String(c.readId(p)||''):'';if(id0)return id0;if(typeof c.guardStatData==='function'){var tmp={队伍:{'1':p},盒子:{}};c.guardStatData(tmp,{source:'hud-ensure'});id0=typeof c.readId==='function'?String(c.readId(p)||''):'';if(id0)return id0;}if(typeof c.ensureRuntime==='function'){id0=String(c.ensureRuntime(p,{source:'hud-ensure'})||'');if(id0)return id0;}if(Number(c.schema||0)>=3)return '';if(typeof c.ensure==='function')return String(c.ensure(p)||'');}}catch(e){hudDiagError('pokemon identity core ensure',e);}
  var id=hudPokemonId(p);if(id)return id;
  try{var a=hudPhoneAssetBridge();if(a&&typeof a.makePokemonId==='function'&&typeof a.stampIdentity==='function'){id=String(a.makePokemonId()||'');if(id)a.stampIdentity(p,id);}}catch(e){}
  return hudPokemonId(p);
}
function hudRecordAssetMutation(p,opt){
  try{
    if(!p||typeof p!=='object')return false;
    hudEnsurePokemonIdentity(p);
    var a=hudPhoneAssetBridge();
    if(a&&typeof a.recordMutation==='function')return !!a.recordMutation(p,opt||{});
  }catch(e){}
  return false;
}
function hudFindPokemonLocations(id){id=String(id||'');if(!id)return [];var a=hudEnsureLocationIndex().get(id)||[];return a.map(function(x){return pkmHudClone(x);});}
function hudStateRevision(){return 'r'+String(hudStateRevCounter)+':'+String(hudStateFingerprint||hudComputeStateFingerprint()||'0');}


function hudDiyCanonicalData(){
  try{
    var raw=localStorage.getItem('pk_diy')||'';
    if(raw){var d=JSON.parse(raw);if(d&&typeof d==='object')return diyNormalizeData(d);}
  }catch(e){}
  try{diySyncFromStorage(false);}catch(e){}
  return diyNormalizeData(pkmHudClone(diyData||{}));
}
function hudResolveDiyPokemonInfo(input){
  var p=(input&&typeof input==='object')?input:{名字:String(input||'')},name=String(p.名字||p.name||'').trim();
  if(!name)return {isDiy:false,name:'',rootKey:'',stageIndex:-1,image:''};
  try{diySyncFromStorage(false);}catch(e){}
  var hit=hudDiyLookup(name);if(!hit)return {isDiy:false,name:name,rootKey:'',stageIndex:-1,image:''};
  var root=hit.root||{},stage=hit.stage||root,img=String(stage.img||root.img||'').trim();
  if(!img&&root.chain&&root.chain.length){for(var z=0;z<root.chain.length;z++){if(root.chain[z]&&root.chain[z].img){img=String(root.chain[z].img);break;}}}
  return {isDiy:true,name:name,rootKey:String(hit.rootKey||''),stageIndex:Number(hit.stageIndex),stageName:String(stage.name||name),image:img,root:pkmHudClone(root),stage:pkmHudClone(stage)};
}


(function(){
  var api={
    version:'2.12.0',
    capabilities:{nearbyVisualV3:true,nearbyDiagnostics:true,pokemonIdentity:true,pokemonIdentityCore:true,pokemonIdentityMigrationV3:true,identityGuard:true,pokemonReferenceV2:true,assetLocks:true,cloudStubs:true,stateRevision:true,locations:true,assetMutationBridge:true,authoritativeAssetMutation:true,diyCanonicalData:true,diyPokemonResolver:true,spriteProviders:true,dynamicSpriteUrls:true,diyBundleInstallV2:true,diyWorldbookSync:false,diyAssetCanonicalRef:true,diyAssetPersistence:true,diyAssetHydrationV2:true,diyHydrationDomOnlyV1:true,programmaticRefreshGuardV1:true,silentMvuRefresh:true,pendingWriteBarrier:true,diyExternalOwnerV1:true,diyExternalOwnerV2:true,diyEditorUi:false,diyWorldbookOnlyCompatV1:false,diyWorldbookWriter:false,diyReadOnlyRuntimeV1:true},
    getStatData:function(){return pkmHudClone(stat_data);},
    getNearbyDiagnostics:function(){try{return pkmHudClone(nearbyDiagnostics());}catch(e){return [];}},
    getTeam:function(){return pkmHudClone((stat_data&&stat_data.队伍)||{});},
    getBoxes:function(){return pkmHudClone((stat_data&&stat_data.盒子)||{});},
    getPokemon:function(id){var a=hudFindPokemonLocations(id);return a.length?pkmHudClone(a[0]):null;},
    findPokemonLocations:function(id){return hudFindPokemonLocations(id);},
    getPokemonLock:function(id){var x=hudPokemonLockById(id);return x?pkmHudClone(x):null;},
    isCloudStub:function(p){return hudIsCloudStub(p);},
    ensurePokemonIdentity:function(p){return hudEnsurePokemonIdentity(p);},
    getPokemonIdentity:function(p){try{var c=hudPhoneIdentityCore();return c&&typeof c.inspect==='function'?pkmHudClone(c.inspect(p)):{id:hudPokemonId(p)};}catch(e){return {id:hudPokemonId(p)};}},
    getPokemonReferenceId:function(ref){return hudPokemonReferenceId(ref);},
    getPokemonIdentityDiagnostics:function(){try{var c=hudPhoneIdentityCore();return c&&typeof c.diagnose==='function'?c.diagnose():Promise.resolve(null);}catch(e){return Promise.resolve(null);}},
    scanLegacyPokemonIdentity:function(){try{var c=hudPhoneIdentityCore();return c&&typeof c.scanLegacy==='function'?c.scanLegacy():Promise.resolve(null);}catch(e){return Promise.resolve(null);}},
    recordAssetMutation:function(p,opt){return hudRecordAssetMutation(p,opt||{});},
    applyAssetMutation:function(opt){return pkmHudAuthoritativeAssetMutation(opt||{});},
    getStateRevision:function(){return hudStateRevision();},
    getDiyData:function(){try{var s=(WIN.__PokemonPhoneSuite||window.__PokemonPhoneSuite),lib=s&&s.diyLibrary;if(lib&&typeof lib.ready==='function'&&lib.ready()&&typeof lib.getCanonicalDataSync==='function')return pkmHudClone(lib.getCanonicalDataSync());}catch(e){}try{diySyncFromStorage(false);}catch(e){}return pkmHudClone(diyData||{});},
    getDiyDataCanonical:function(){try{var s=(WIN.__PokemonPhoneSuite||window.__PokemonPhoneSuite),lib=s&&s.diyLibrary;if(lib&&typeof lib.ready==='function'&&lib.ready()&&typeof lib.getCanonicalDataSync==='function')return pkmHudClone(lib.getCanonicalDataSync());}catch(e){}return pkmHudClone(hudDiyCanonicalData());},
    getDiyPokemonInfo:function(input){return pkmHudClone(hudResolveDiyPokemonInfo(input));},
    canonicalizeImageRef:function(value){return hudDiyAssetCanonicalRef(value);},
    persistImageValue:function(value){return hudDiyAssetPersistValue(value);},
    resolveImageRef:function(value){return hudDiyAssetResolve(String(value||''));},
    refreshDiyAssets:function(){return Promise.resolve(hudMigrateInlineDiyAssets()).then(function(){hudRefreshDiyVisuals(false);return true;},function(){hudRefreshDiyVisuals(false);return false;});},
    hydrateDiyDomOnly:function(){return hudHydrateDiyDomOnly();},
    getSpriteProviders:function(){return pkmHudClone(hudSpriteProviders());},
    buildPokemonSpriteUrls:function(opt){return pkmHudClone(hudBuildPokemonSpriteUrls(opt||{}));},
    reloadDiy:function(){try{diySyncFromStorage(true);return hudRefreshDiyVisuals(true);}catch(e){return false;}},
    installDiyBundle:function(bundle,opt){
      opt=opt&&typeof opt==='object'?opt:{};bundle=bundle&&typeof bundle==='object'?bundle:{};if(bundle.diy&&typeof bundle.diy==='object')bundle=bundle.diy;else if(bundle.bundle&&typeof bundle.bundle==='object')bundle=bundle.bundle;
      /* v2.4.0：HUD 是只读消费者。所有 DIY / 世界书写入都必须交给 Phone Suite。 */
      var suite=null,lib=null;try{suite=(WIN.__PokemonPhoneSuite||window.__PokemonPhoneSuite);lib=suite&&suite.diyLibrary;}catch(e){}
      if(!opt.skipLocalInstall&&lib&&typeof lib.installBundle==='function'){
        return Promise.resolve(typeof lib.ensure==='function'?lib.ensure():true).then(function(){return lib.installBundle(pkmHudClone(bundle),{source:String(opt.source||'hud-compat'),overwrite:true,sourceRecord:{kind:String(opt.source||'hud-compat')}});}).then(function(rr){try{diySyncFromStorage(true);hudBuildDiyIndex();diyPreloadImages();hudRefreshDiyVisuals(true);}catch(e){}return {count:Number(rr&&rr.count||0),pokemon:Number(rr&&rr.pokemon||0),changed:Number(rr&&rr.changed||0),installed:rr&&rr.installed||[],worldbookQueued:0,worldbookScheduled:false,externalOwner:true,readOnlyHud:true};});
      }
      if(opt.skipLocalInstall){try{diySyncFromStorage(true);hudBuildDiyIndex();diyPreloadImages();hudRefreshDiyVisuals(true);}catch(e){}return {count:0,pokemon:0,changed:0,installed:[],worldbookQueued:0,worldbookScheduled:false,externalOwner:true,localInstallSkipped:true,readOnlyHud:true};}
      return Promise.reject(new Error('HUD v2.4.0 已切换为 DIY 只读运行时；请安装/启用 Phone Suite v1.43+ 后再写入 DIY。'));
    },
    persist:function(){return pkmHudPersistStatData();},
    flushPendingWrites:function(){return __pkmHudPersistQueue.catch(function(){return false;});},
    refreshView:function(){return pkmHudRenderCurrent();},
    refreshFromMvuSilent:function(){try{return hudRefreshFromMvuSilent();}catch(e){return false;}},
    refreshFromMvu:function(){try{hudRefresh();return true;}catch(e){return false;}},
    setTeamSlot:function(slot,pokemon){
      slot=String(parseInt(slot,10)||'');if(!slot||Number(slot)<1||Number(slot)>6)return Promise.reject(new Error('无效队伍位置'));
      stat_data.队伍=stat_data.队伍||{};var cur=stat_data.队伍[slot],incoming=pokemon||{名字:'空'};
      if(incoming&&incoming.名字&&incoming.名字!=='空'){if(!hudAssertPokemonMutable(incoming,'外部写入'))return Promise.reject(new Error('目标精灵永久ID冲突或当前不可写'));hudEnsurePokemonIdentity(incoming);}
      if(cur&&cur.名字&&cur.名字!=='空'&&(hudPokemonLock(cur)||hudIsCloudStub(cur)))return Promise.reject(new Error('当前队伍位置的精灵正在资产事务中或是云仓引用，拒绝外部覆盖'));
      if(incoming&&incoming.名字&&incoming.名字!=='空'&&(hudPokemonLock(incoming)||hudIsCloudStub(incoming)))return Promise.reject(new Error('目标精灵正在资产事务中或是云仓引用，拒绝通过通用 HUD API 移动'));
      stat_data.队伍[slot]=pkmHudClone(incoming);return pkmHudPersistStatData().then(function(){pkmHudRenderCurrent();return true;});
    }
  };
  try{WIN.__pkmHudApi=api;}catch(e){}
  try{if(window!==WIN)window.__pkmHudApi=api;}catch(e){}
})();

function diyGet(type,name){if(!name)return null;var t=diyData[type]||{};return t[name]||null;}
function diyHas(type,name){
  if(!name)return false;
  if(type==='pokemon')return !!hudDiyLookup(name);
  var p=diyData[type]||{};return !!(p[name]||p[baseName(name)]);
}
function diyLabel(type){return {move:'技能',ability:'特性',item:'道具',pokemon:'精灵'}[type]||'';}
function diyVal(id){var e=document.getElementById(id);return e?e.value.trim():'';}
function diyInput(id,ph){return '<input type="text" id="'+id+'" placeholder="'+esc(ph)+'" style="'+DIY_INPUT_STYLE+'">';}
function diyArea(id,ph){return '<textarea id="'+id+'" placeholder="'+esc(ph)+'" style="'+DIY_INPUT_STYLE+'min-height:56px;resize:vertical"></textarea>';}
function diyStatInput(id,ph){return '<input type="text" id="'+id+'" placeholder="'+esc(ph)+'" style="flex:1;min-width:0;box-sizing:border-box;padding:6px 8px;font-family:inherit;font-size:.85rem;background:rgba(43,74,111,.5);border:1px solid var(--frame);border-radius:4px;color:var(--text);outline:none">';}
function diyStatsText(st){
  if(!st)return '';
  if(typeof st==='string')return st;
  return 'HP '+(st.hp||'-')+' · 攻击 '+(st.atk||'-')+' · 防御 '+(st.def||'-')+' · 特攻 '+(st.spa||'-')+' · 特防 '+(st.spd||'-')+' · 速度 '+(st.spe||'-');
}

function diyVisionDefaults(){return {provider:'openai',baseUrl:'',apiKey:'',model:'',proxyBase:'',proxyToken:'',maxTokens:'2048',rememberSecrets:false};}
var DIY_VISION_CFG_KEY='pk_vision_cfg',DIY_VISION_SESSION_SECRET='pk_vision_secret_session_v2',DIY_VISION_SAVED_SECRET='pk_vision_secret_saved_v2';
function diyVisionDefaultBase(provider){
  if(provider==='gemini')return 'https://generativelanguage.googleapis.com/v1beta';
  if(provider==='claude')return 'https://api.anthropic.com';
  return 'https://api.openai.com/v1';
}
function diyVisionDefaultPrompt(){
  return '请描述这张图片中宝可梦（精灵）的外观：包括体型、主要配色、花纹/斑纹、头部特征、眼睛、四肢、尾巴、翅膀、装饰物等。用简洁的中文写一段详细的外观描述，直接输出描述，不要多余说明。';
}
function diyVisionCfg(){
  var d=diyVisionDefaults(),c=null;
  try{c=JSON.parse(localStorage.getItem(DIY_VISION_CFG_KEY)||'null');if(c&&typeof c==='object'){['provider','baseUrl','model','proxyBase','maxTokens','rememberSecrets'].forEach(function(k){if(c[k]!=null)d[k]=c[k];});}}catch(e){}
  
  try{if(c&&(c.apiKey||c.proxyToken)){sessionStorage.setItem(DIY_VISION_SESSION_SECRET,JSON.stringify({apiKey:String(c.apiKey||''),proxyToken:String(c.proxyToken||'')}));var clean=Object.assign({},c);delete clean.apiKey;delete clean.proxyToken;localStorage.setItem(DIY_VISION_CFG_KEY,JSON.stringify(clean));}}catch(e){}
  var sec=null;
  try{sec=JSON.parse((d.rememberSecrets?localStorage.getItem(DIY_VISION_SAVED_SECRET):sessionStorage.getItem(DIY_VISION_SESSION_SECRET))||'null');}catch(e){}
  if(!sec){try{sec=JSON.parse(sessionStorage.getItem(DIY_VISION_SESSION_SECRET)||'null');}catch(e){}}
  if(sec){d.apiKey=String(sec.apiKey||'');d.proxyToken=String(sec.proxyToken||'');}
  if(!d.baseUrl)d.baseUrl=diyVisionDefaultBase(d.provider);
  return d;
}
function diyVisionSave(cfg){
  cfg=Object.assign(diyVisionDefaults(),cfg||{});
  var pub={provider:cfg.provider,baseUrl:cfg.baseUrl,model:cfg.model,proxyBase:cfg.proxyBase,maxTokens:cfg.maxTokens,rememberSecrets:!!cfg.rememberSecrets};
  var sec={apiKey:String(cfg.apiKey||''),proxyToken:String(cfg.proxyToken||'')};
  try{localStorage.setItem(DIY_VISION_CFG_KEY,JSON.stringify(pub));sessionStorage.setItem(DIY_VISION_SESSION_SECRET,JSON.stringify(sec));if(pub.rememberSecrets)localStorage.setItem(DIY_VISION_SAVED_SECRET,JSON.stringify(sec));else localStorage.removeItem(DIY_VISION_SAVED_SECRET);}catch(e){hudDiagError('vision secret save',e);}
}
function diyVisionSet(key,val){var c=diyVisionCfg();c[key]=val;diyVisionSave(c);}
var diyVisionModelsCache=[];
function diyVisionProviderChange(v){
  var c=diyVisionCfg();
  c.provider=v;c.baseUrl='';c.model='';
  diyVisionSave(c);
  diyVisionModelsCache=[];
  var b=document.getElementById('vision-base');
  if(b){b.value='';b.placeholder='API 地址，如 '+diyVisionDefaultBase(v);}
  var m=document.getElementById('vision-model');
  if(m){m.value='';m.placeholder='点击右侧选择模型';}
  var pnl=document.getElementById('vision-model-panel');
  if(pnl){pnl.style.display='none';pnl.innerHTML='';}
  diyVisionModelsMsg('已切换服务商，可重新点「选择模型」获取列表');
}
function diyVisionBtnHTML(){
  return '<div class="info-frame plain-frame"><div class="info-inner"><div class="info-title">AI 识图</div><div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><button type="button" class="btn-small" data-vision-settings style="background:rgba(43,74,111,.7)">🤖 AI 识图设置</button><span class="dim" style="font-size:.72rem">配置 API 后，可在精灵表单里点「AI识图」自动生成外观描述</span></div></div></div>';
}
function openVisionSettings(){
  clearBack();
  var c=diyVisionCfg();
  var provSel='<select id="vision-provider" style="'+DIY_INPUT_STYLE+'">'+
    '<option value="openai"'+(c.provider==='openai'?' selected':'')+'>OpenAI 兼容（GPT-4o 等 / 中转站）</option>'+
    '<option value="gemini"'+(c.provider==='gemini'?' selected':'')+'>Google Gemini</option>'+
    '<option value="claude"'+(c.provider==='claude'?' selected':'')+'>Anthropic Claude</option>'+
    '</select>';
  var modelRow='<div style="display:flex;gap:6px;align-items:flex-start;margin-bottom:6px">'+
    '<input type="text" id="vision-model" placeholder="点击右侧选择模型" value="'+esc(c.model)+'" style="flex:1;min-width:0;box-sizing:border-box;padding:6px 10px;font-family:inherit;font-size:.85rem;background:rgba(43,74,111,.5);border:1px solid var(--frame);border-radius:4px;color:var(--text);outline:none;margin-bottom:0">'+
    '<button type="button" class="btn-small" data-vision-pick style="flex-shrink:0;background:rgba(43,74,111,.7)">🎯 选择模型</button>'+
    '</div>'+
    '<div id="vision-model-panel" style="display:none;max-height:200px;overflow-y:auto;border:1px solid var(--frame);border-radius:4px;background:rgba(25,40,65,.55);margin-bottom:6px"></div>'+
    '<div id="vision-models-msg" class="dim" style="font-size:.72rem;margin-bottom:6px">点「选择模型」拉取可用模型，选择后自动填入左侧输入框；也可直接手填。</div>';
  overlay.innerHTML='<div class="modal" style="max-width:480px"><div class="modal-head"><div class="modal-name">AI 识图设置</div><button class="close" data-close>✕</button></div><div class="modal-body">'+
    '<div class="set-title" style="margin-left:0">服务商</div>'+provSel+
    '<div class="set-title" style="margin-left:0">API 地址</div><input type="text" id="vision-base" placeholder="API 地址，如 '+esc(diyVisionDefaultBase(c.provider))+'" value="'+esc(c.baseUrl)+'" style="'+DIY_INPUT_STYLE+'">'+
    '<div class="set-title" style="margin-left:0">API Key</div><input type="password" id="vision-key" placeholder="API Key（必填）" value="'+esc(c.apiKey)+'" style="'+DIY_INPUT_STYLE+'">'+
    '<div class="set-title" style="margin-left:0">模型</div>'+modelRow+
    '<div class="set-title" style="margin-left:0">最大回复长度（tokens，默认 2048，被截断就调大）</div><input type="text" id="vision-max-tokens" placeholder="2048" value="'+esc(c.maxTokens)+'" style="'+DIY_INPUT_STYLE+'">'+
    '<label class="set-opt" style="margin:6px 0"><input type="checkbox" id="vision-remember-secret"'+(c.rememberSecrets?' checked':'')+'>在本设备长期保存 API Key / 代理令牌</label>'+ 
    '<div class="dim" style="font-size:.72rem;margin-top:2px">默认仅保存到当前浏览器会话；关闭页面后 Key 会消失。只有勾选上方选项才写入长期本地存储。只有点「AI识图」时才会把图片发给所填 API。</div>'+
    '<details style="margin:8px 0"><summary class="dim" style="cursor:pointer;font-size:.78rem">🛡 跨域代理（可选：直连被 CORS 拦截时使用本机 proxy.py）</summary>'+
    '<div class="set-title" style="margin-left:0;margin-top:8px">代理地址</div><input type="text" id="vision-proxy-base" placeholder="http://127.0.0.1:8765" value="'+esc(c.proxyBase)+'" style="'+DIY_INPUT_STYLE+'">'+
    '<div class="set-title" style="margin-left:0">代理令牌（proxy.py 启动后打印，可留空）</div><input type="password" id="vision-proxy-token" placeholder="留空" value="'+esc(c.proxyToken)+'" style="'+DIY_INPUT_STYLE+'">'+
    '</details>'+
    '<div class="action-btns" style="margin-top:10px"><button class="act-btn" data-vision-save>✔ 完成</button><button class="act-btn" data-close>返回</button></div>'+
    '</div></div>';
  overlay.classList.add('open');
  var vp=document.getElementById('vision-provider');
  if(vp)vp.addEventListener('change',function(){diyVisionProviderChange(vp.value);});
  var vb=document.getElementById('vision-base');
  if(vb)vb.addEventListener('input',function(){diyVisionSet('baseUrl',vb.value.trim());});
  var vk=document.getElementById('vision-key');
  if(vk)vk.addEventListener('input',function(){diyVisionSet('apiKey',vk.value.trim());});
  var vm=document.getElementById('vision-model');
  if(vm)vm.addEventListener('input',function(){diyVisionSet('model',vm.value.trim());});
  var pb=document.getElementById('vision-proxy-base');
  if(pb)pb.addEventListener('input',function(){diyVisionSet('proxyBase',pb.value.trim());});
  var pt=document.getElementById('vision-proxy-token');
  if(pt)pt.addEventListener('input',function(){diyVisionSet('proxyToken',pt.value.trim());});
  var mt=document.getElementById('vision-max-tokens');
  if(mt)mt.addEventListener('input',function(){diyVisionSet('maxTokens',mt.value.trim());});
  var pk=document.querySelector('[data-vision-pick]');
  if(pk)pk.addEventListener('click',function(e){e.stopPropagation();diyVisionPickModels();});
  var pnl=document.getElementById('vision-model-panel');
  if(pnl)pnl.addEventListener('click',function(e){var it=e.target.closest('[data-model]');if(it){diyVisionPickSelect(it.getAttribute('data-model'));}});
}
function diyVisionSaveFromModal(){
  var cfg=diyVisionCfg();
  var prov=document.getElementById('vision-provider');
  var base=document.getElementById('vision-base');
  var key=document.getElementById('vision-key');
  var model=document.getElementById('vision-model');
  var pb=document.getElementById('vision-proxy-base');
  var pt=document.getElementById('vision-proxy-token');
  var mt=document.getElementById('vision-max-tokens');
  var rs=document.getElementById('vision-remember-secret');
  if(prov)cfg.provider=prov.value;
  if(base)cfg.baseUrl=base.value.trim();
  if(key)cfg.apiKey=key.value.trim();
  if(model)cfg.model=model.value.trim();
  if(pb)cfg.proxyBase=pb.value.trim();
  if(pt)cfg.proxyToken=pt.value.trim();
  if(mt)cfg.maxTokens=mt.value.trim();
  cfg.rememberSecrets=!!(rs&&rs.checked);
  diyVisionSave(cfg);
  overlay.classList.remove('open');
  clearBack();
}
function diyVisionPickModels(){
  var cfg=diyVisionCfg();
  var prov=document.getElementById('vision-provider');
  var base=document.getElementById('vision-base');
  var key=document.getElementById('vision-key');
  if(prov)cfg.provider=prov.value;
  if(base)cfg.baseUrl=base.value.trim();
  if(key)cfg.apiKey=key.value.trim();
  if(!cfg.apiKey){diyVisionModelsMsg('请先填写 API Key');return;}
  if(diyVisionModelsCache.length){
    diyVisionRenderModelsPanel(diyVisionModelsCache);
    diyVisionModelsMsg('已缓存 '+diyVisionModelsCache.length+' 个模型，点击即可选择');
    return;
  }
  var btn=document.querySelector('[data-vision-pick]');
  if(btn){btn.textContent='⏳ 读取中…';btn.disabled=true;}
  var pnl=document.getElementById('vision-model-panel');
  if(pnl){pnl.innerHTML='<div class="dim" style="padding:8px 10px;font-size:.78rem">正在读取可用模型…</div>';pnl.style.display='';}
  diyVisionFetchModels(diyVisionModelsURL(cfg),cfg,function(list){
    diyVisionModelsCache=list||[];
    if(btn){btn.textContent='🎯 选择模型';btn.disabled=false;}
    diyVisionRenderModelsPanel(diyVisionModelsCache);
    diyVisionModelsMsg(diyVisionModelsCache.length?('已读取 '+diyVisionModelsCache.length+' 个模型，点击即可选择'):'未读取到模型，可手动填写');
  },function(err){
    if(btn){btn.textContent='🎯 选择模型';btn.disabled=false;}
    if(pnl){pnl.style.display='none';pnl.innerHTML='';}
    diyVisionModelsMsg('读取失败：'+err);
  });
}
function diyVisionRenderModelsPanel(list){
  var pnl=document.getElementById('vision-model-panel');
  if(!pnl)return;
  if(!list||!list.length){pnl.style.display='none';pnl.innerHTML='';return;}
  pnl.innerHTML=list.map(function(m){
    return '<div data-model="'+esc(m)+'" style="padding:6px 10px;font-size:.82rem;cursor:pointer;border-bottom:1px dashed rgba(170,204,255,.2);word-break:break-all">'+esc(m)+'</div>';
  }).join('');
  pnl.style.display='';
}
function diyVisionPickSelect(m){
  var inp=document.getElementById('vision-model');
  if(inp){inp.value=m;diyVisionSet('model',m);}
  var pnl=document.getElementById('vision-model-panel');
  if(pnl){pnl.style.display='none';}
  diyVisionModelsMsg('已选择模型：'+m);
}
function diyVisionModelsMsg(t){
  var el=document.getElementById('vision-models-msg');
  if(el)el.textContent=t;
}
function diyVisionModelsURL(cfg){
  if(cfg.provider==='gemini')return String(cfg.baseUrl).replace(/\/+$/,'')+'/models?key='+encodeURIComponent(cfg.apiKey);
  if(cfg.provider==='claude')return String(cfg.baseUrl).replace(/\/+$/,'')+'/v1/models';
  return String(cfg.baseUrl).replace(/\/+$/,'')+'/models';
}
function diyVisionFetchModels(url,cfg,cb,errCb){
  diyVisionDoFetch(cfg,url,'GET',null,function(j){cb&&cb(diyVisionParseModels(j));},errCb);
}
function diyVisionParseModels(j){
  var out=[];
  try{
    if(j&&Array.isArray(j.data)){for(var i=0;i<j.data.length;i++){var id=j.data[i]&&j.data[i].id;if(id)out.push(String(id));}}
    if(j&&Array.isArray(j.models)){for(var i=0;i<j.models.length;i++){var n=j.models[i]&&j.models[i].name;if(n)out.push(String(n).replace(/^models\//,''));}}
  }catch(e){}
  var seen={},res=[];
  for(var k=0;k<out.length;k++){var s=String(out[k]).trim();if(s&&!seen[s]){seen[s]=1;res.push(s);}}
  return res;
}
function diyEvoEnsureDescShown(p){
  if(!diyEvoDescShow[p]){
    diyEvoDescShow[p]=true;
    var w=document.getElementById('evo-desc-wrap-'+p);
    if(w){w.innerHTML=diyEvoDescHTML(p);diyEvoDescAutosize(p);}
    var b=document.getElementById('evo-desc-btn-'+p);
    if(b)b.textContent='✕ 收起外观描述';
  }
}
function diyEvoUpload(p){
  p=parseInt(p,10);
  var f=document.getElementById('evo-img-file-'+p);
  if(f)f.click();
}
function diyEvoFileChange(input){
  var p=parseInt(String(input.id).replace('evo-img-file-',''),10);
  if(!input.files||!input.files.length)return;
  var file=input.files[0];
  if(!/^image\//.test(file.type||'')){diyMsg('请选择图片或 GIF 文件');return;}
  if(file.size>8*1024*1024){diyMsg('文件超过 8MB，请压缩后再上传（建议 ≤2MB）');return;}
  hudDiyAssetStoreBlob(file).then(function(ref){var t=document.getElementById('evo-img-'+p);if(t)t.value=ref;hudMsg('本地图片/GIF 已保存到 IndexedDB，不再占用 localStorage；点「AI识图」可自动生成外观描述');}).catch(function(e){hudDiagError('DIY evo image store',e);diyMsg('图片保存失败：'+String(e&&e.message||e));});
}
function diyItemUpload(){var f=document.getElementById('diy-item-img-file');if(f)f.click();}
function diyItemFileChange(input){
  if(!input.files||!input.files.length)return;
  var file=input.files[0];
  if(!/^image\//.test(file.type||'')){diyMsg('请选择图片或 GIF 文件');return;}
  if(file.size>8*1024*1024){diyMsg('文件超过 8MB，请压缩后再上传（建议 ≤2MB）');return;}
  hudDiyAssetStoreBlob(file).then(function(ref){var t=document.getElementById('diy-img');if(t)t.value=ref;hudMsg('本地图片已保存到 IndexedDB，不再占用 localStorage');}).catch(function(e){hudDiagError('DIY item image store',e);diyMsg('图片保存失败：'+String(e&&e.message||e));});
}
function diyEvoVision(p){
  p=parseInt(p,10);
  var src=diyVal('evo-img-'+p);
  if(!src){diyMsg('请先上传图片或填写图片链接，再点「AI识图」');return;}
  openVisionPrompt(p,src);
}
function openVisionPrompt(p,src){
  clearBack();
  var sv=String(src||'');
  var imgHtml=(sv.indexOf(HUD_DIY_SCHEME)===0||/^data:image\//i.test(sv)||/^https?:\/\//i.test(sv))?'<div style="text-align:center;margin-bottom:8px"><img '+hudDiyImgAttrs(sv)+' style="max-width:120px;max-height:120px;object-fit:contain;image-rendering:pixelated;border:1px solid var(--frame);border-radius:4px;background:rgba(43,74,111,.3)" onerror="this.remove()"></div>':'';
  overlay.innerHTML='<div class="modal" style="max-width:480px"><div class="modal-head"><div class="modal-name">AI 识图 · 生成外观描述</div><button class="close" data-close>✕</button></div><div class="modal-body">'+
    imgHtml+
    '<div class="set-title" style="margin-left:0">识别提示词（可留空，留空用默认）</div>'+
    '<textarea id="vision-run-prompt" placeholder="'+esc(diyVisionDefaultPrompt())+'" style="'+DIY_INPUT_STYLE+'min-height:72px;resize:vertical"></textarea>'+
    '<div id="vision-run-msg" class="dim" style="font-size:.75rem;margin-bottom:6px">点击「开始识图」后会把图片和提示词发给已配置的 API。</div>'+
    '<div class="action-btns" style="margin-top:8px"><button class="act-btn" data-vision-run>▶ 开始识图</button><button class="act-btn" data-close>返回</button></div>'+
    '</div></div>';
  overlay.classList.add('open');
  hudResolvePkidbImages(overlay);
  var run=document.querySelector('[data-vision-run]');
  if(run)run.addEventListener('click',function(e){e.stopPropagation();diyVisionRunFromPrompt(p);});
}
function diyVisionRunFromPrompt(p){
  var src=diyVal('evo-img-'+p);
  var promptEl=document.getElementById('vision-run-prompt');
  var prompt=promptEl?promptEl.value:'';
  var btn=document.querySelector('[data-vision-run]');
  var msg=document.getElementById('vision-run-msg');
  if(btn){btn.textContent='⏳ 识图中…';btn.disabled=true;}
  if(msg){msg.textContent='正在调用 API 识图…';msg.style.color='';}
  diyVisionRecognize(src,prompt,function(text){
    if(btn){btn.textContent='▶ 开始识图';btn.disabled=false;}
    diyEvoEnsureDescShown(p);
    var ta=document.getElementById('evo-desc-'+p);
    if(ta){ta.value=text;diyEvoDescCache[p]=text;}
    if(msg){msg.textContent='✔ 识别成功，已填入「外观描述」：'+text;msg.style.color='#4ade80';}
  },function(err){
    if(btn){btn.textContent='▶ 开始识图';btn.disabled=false;}
    if(msg){msg.textContent='✘ 识图失败：'+err;msg.style.color='#f87171';}
  });
}
function diyVisionRecognize(src,prompt,cb,errCb){
  var cfg=diyVisionCfg();
  if(!cfg.apiKey){errCb&&errCb('未填写 API Key（在 DIY 页面「AI 识图设置」里填写）');return;}
  if(!cfg.model){errCb&&errCb('未选择模型（在 AI 识图设置里点「选择模型」）');return;}
  var s=String(src||''),pr=String(prompt||'').trim()||diyVisionDefaultPrompt();
  if(s.indexOf(HUD_DIY_SCHEME)===0){hudDiyAssetToDataUrl(s).then(function(data){diyVisionRecognizeResolved(cfg,data,pr,cb,errCb);}).catch(function(e){errCb&&errCb(String(e&&e.message||e));});return;}
  diyVisionRecognizeResolved(cfg,s,pr,cb,errCb);
}
function diyVisionRecognizeResolved(cfg,s,pr,cb,errCb){
  var isData=/^data:image\//i.test(s);
  try{if(cfg.provider==='gemini')diyVisionGemini(cfg,s,isData,pr,cb,errCb);else if(cfg.provider==='claude')diyVisionClaude(cfg,s,isData,pr,cb,errCb);else diyVisionOpenAI(cfg,s,isData,pr,cb,errCb);}catch(e){errCb&&errCb(e&&e.message?e.message:String(e));}
}
function diyVisionOpenAI(cfg,src,isData,prompt,cb,errCb){
  var url=String(cfg.baseUrl).replace(/\/+$/,'')+'/chat/completions';
  var content=[{type:'text',text:prompt},{type:'image_url',image_url:{url:src}}];
  diyVisionFetch(url,{model:cfg.model,messages:[{role:'user',content:content}],max_tokens:(parseInt(cfg.maxTokens,10)||2048)},cfg,cb,errCb);
}
function diyVisionGemini(cfg,src,isData,prompt,cb,errCb){
  var base=String(cfg.baseUrl).replace(/\/+$/,'');
  var url=base+'/models/'+encodeURIComponent(cfg.model)+':generateContent?key='+encodeURIComponent(cfg.apiKey);
  function go(dataUrl,mime){
    var parts=[{text:prompt},{inline_data:{mime_type:mime||'image/png',data:String(dataUrl).replace(/^data:image\/[^;]+;base64,/,'')}}];
    diyVisionFetch(url,{contents:[{parts:parts}],generationConfig:{maxOutputTokens:(parseInt(cfg.maxTokens,10)||2048)}},cfg,cb,errCb);
  }
  if(isData){
    var m=(src.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/)||[])[1]||'image/png';
    go(src,m);
  }else{
    hudFetch(src).then(function(r){if(!r.ok)throw new Error('图片下载失败 HTTP '+r.status);return r.blob();}).then(function(b){
      var rd=new FileReader();
      rd.onload=function(){go(String(rd.result||''),b.type||'image/png');};
      rd.onerror=function(){errCb&&errCb('图片读取失败');};
      rd.readAsDataURL(b);
    }).catch(function(e){errCb&&errCb('Gemini 需要 base64：链接图片抓取失败（可能跨域），请改用上传本地图片。'+(e&&e.message?(' '+e.message):''));});
  }
}
function diyVisionClaude(cfg,src,isData,prompt,cb,errCb){
  var url=String(cfg.baseUrl).replace(/\/+$/,'')+'/v1/messages';
  var content=[];
  if(isData){
    var m=(src.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/)||[])[1]||'image/png';
    content.push({type:'image',source:{type:'base64',media_type:m,data:src.replace(/^data:image\/[^;]+;base64,/,'')}});
  }else{
    content.push({type:'image',source:{type:'url',url:src}});
  }
  content.push({type:'text',text:prompt});
  diyVisionFetch(url,{model:cfg.model,max_tokens:(parseInt(cfg.maxTokens,10)||2048),messages:[{role:'user',content:content}]},cfg,cb,errCb);
}
function diyVisionProxyBase(cfg){
  var b=String(cfg.proxyBase||'').trim();
  if(!b)return '';
  return b.replace(/\/+$/,'');
}
var diyVisionActiveCtl=null;
function diyVisionCancel(){if(diyVisionActiveCtl){try{diyVisionActiveCtl.abort();}catch(e){}diyVisionActiveCtl=null;}}
function diyVisionDoFetch(cfg,url,method,body,onJson,onErr){
  diyVisionCancel();var proxy=diyVisionProxyBase(cfg),ctl=hudNewAbortController();diyVisionActiveCtl=ctl;
  var req;
  if(proxy){var ph={'Content-Type':'application/json'};if(cfg.proxyToken)ph['X-Fusion-Token']=cfg.proxyToken;var proxyKey=(cfg.provider==='gemini')?'':cfg.apiKey;req=hudFetch(proxy+'/request',{method:'POST',headers:ph,credentials:'omit',referrerPolicy:'no-referrer',body:JSON.stringify({url:url,method:method,key:proxyKey,body:body}),signal:ctl.signal,timeout:90000});}
  else{var h={'Content-Type':'application/json'};if(cfg.provider==='claude'){h['x-api-key']=cfg.apiKey;h['anthropic-version']='2023-06-01';}else if(cfg.provider==='openai'){h['Authorization']='Bearer '+cfg.apiKey;}req=hudFetch(url,{method:method,headers:h,credentials:'omit',referrerPolicy:'no-referrer',body:(method==='POST'?JSON.stringify(body):undefined),signal:ctl.signal,timeout:90000});}
  req.then(function(r){return r.text().then(function(t){var j=null;try{j=JSON.parse(t);}catch(e){}if(!r.ok)throw new Error('HTTP '+r.status+'：'+String(t).slice(0,300));return j;});}).then(function(j){onJson&&onJson(j);}).catch(function(e){var msg=e&&e.name==='AbortError'?'请求已取消或超时':(e&&e.message?e.message:String(e));if(/Failed to fetch|NetworkError|Network request failed|Load failed|TypeError/i.test(msg))msg='网络请求失败：多半是 CORS/跨域被拦截、网络不可达或混合内容。可改用「AI 识图设置」里的跨域代理（本机 proxy.py），或换支持浏览器直连的 API 地址。';onErr&&onErr(msg);}).finally(function(){if(diyVisionActiveCtl===ctl)diyVisionActiveCtl=null;});
}
function diyVisionFetch(url,body,cfg,cb,errCb){
  diyVisionDoFetch(cfg,url,'POST',body,function(j){
    var t=diyVisionExtract(j);
    if(!t){errCb&&errCb('返回内容为空（请检查模型名/API 地址）');return;}
    cb&&cb(t);
  },errCb);
}
function diyVisionExtract(j){
  try{
    if(j&&j.choices&&j.choices[0]&&j.choices[0].message&&j.choices[0].message.content)return String(j.choices[0].message.content).trim();
    if(j&&j.candidates&&j.candidates[0]&&j.candidates[0].content&&j.candidates[0].content.parts){
      var ps=j.candidates[0].content.parts;
      for(var i=0;i<ps.length;i++){if(ps[i]&&ps[i].text)return String(ps[i].text).trim();}
    }
    if(j&&j.content&&j.content[0]&&j.content[0].text)return String(j.content[0].text).trim();
  }catch(e){}
  return '';
}
var TYPE_LIST=['一般','格斗','飞行','毒','地面','岩石','虫','幽灵','钢','火','水','草','电','超能力','冰','龙','恶','妖精'];
var CN_NUM=['','一','二','三','四','五','六','七','八','九','十'];
var diyTypeCount=2;var diyEvoCount=1;var diyEvoTypeCounts=[];var diyEvoBranchCounts=[];var diyEvoAbiCats=[];var diyEvoDescShow=[];var diyEvoDescCache=[];var diyMoveCount=1;var diyMoveRows=[];
function diyTypeSelectHTML(i){
  var opts='<option value="">无</option>'+TYPE_LIST.map(function(t){return '<option value="'+t+'">'+t+'</option>';}).join('');
  return '<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px"><span style="font-size:.78rem;color:var(--dim);flex-shrink:0;min-width:44px">属性'+(CN_NUM[i]||i)+'</span><select id="diy-type-'+i+'" style="flex:1;min-width:0;box-sizing:border-box;padding:6px 8px;font-family:inherit;font-size:.85rem;background:rgba(43,74,111,.5);border:1px solid var(--frame);border-radius:4px;color:var(--text);outline:none">'+opts+'</select></div>';
}
function diyTypesHTML(){
  var out='';
  for(var i=1;i<=diyTypeCount;i++){out+=diyTypeSelectHTML(i);}
  return out;
}
function diyAddType(){
  var vals=[];
  for(var i=1;i<=diyTypeCount;i++){var e=document.getElementById('diy-type-'+i);vals.push(e?e.value:'');}
  diyTypeCount++;
  var tc=document.getElementById('diy-types');
  if(tc)tc.innerHTML=diyTypesHTML();
  for(var j=0;j<vals.length;j++){var e2=document.getElementById('diy-type-'+(j+1));if(e2)e2.value=vals[j];}
}
var abiListCache=null,abiListLoading=false,abiListCbs=[];
function fetchAbiList(cb){
  if(abiListCache){cb&&cb(abiListCache);return;}
  var _c=lsGet('pk_abilist',null);if(_c&&_c.length){abiListCache=_c;cb&&cb(_c);return;}
  if(abiListLoading){cb&&abiListCbs.push(cb);return;}
  abiListLoading=true;
  pkmDbLoad('abil','abilities.json',['name'],function(store){
    var data=store&&store.data?store.data:[];
    var list=[],seen={};
    for(var i=0;i<data.length;i++){
      var n=String(data[i]&&data[i].name||'').trim();
      if(n&&!seen[n]){seen[n]=1;list.push(n);}
    }
    list.sort();
    abiListCache=list;abiListLoading=false;
    if(list.length){lsSet('pk_abilist',list);}
    var cbs=abiListCbs;abiListCbs=[];
    for(var i=0;i<cbs.length;i++){try{cbs[i](list);}catch(e){}}
    if(cb)cb(list);
  });
}
var diyAbilityCat='';
function diyAbilityWrapHTML(){
  if(diyAbilityCat==='diy'){
    var diy=Object.keys(diyData.ability||{}).sort();
    var diyHtml=diy.length?diy.map(function(n){return '<option value="'+esc(n)+'">'+esc(n)+'</option>';}).join(''):'<option value="" disabled>暂无DIY特性</option>';
    return '<select id="diy-ability" style="'+DIY_INPUT_STYLE+'"><option value="">无</option>'+diyHtml+'</select>';
  }
  if(diyAbilityCat==='orig'){
    var orig=abiListCache||[];
    var origHtml=orig.length?orig.map(function(n){return '<option value="'+esc(n)+'">'+esc(n)+'</option>';}).join(''):'<option value="" disabled>加载中...</option>';
    return '<input id="diy-ability-search" placeholder="搜索原有特性" style="'+DIY_INPUT_STYLE+'"><select id="diy-ability" style="'+DIY_INPUT_STYLE+'"><option value="">无</option>'+origHtml+'</select>';
  }
  return '';
}

function diyFilterAbility(){
  var q=(document.getElementById('diy-ability-search')||{}).value||'';
  q=q.trim().toLowerCase();
  var sel=document.getElementById('diy-ability');
  if(!sel)return;
  var opts=sel.querySelectorAll('option');
  for(var i=0;i<opts.length;i++){
    var o=opts[i];
    if(!o.value){o.hidden=false;continue;}
    o.hidden=(q && o.value.toLowerCase().indexOf(q)<0);
  }
}
function diyLoadAbiOptions(){
  fetchAbiList(function(list){
    if(diyAbilityCat!=='orig')return;
    var sel=document.getElementById('diy-ability');
    if(!sel)return;
    var cur=sel.value;
    sel.innerHTML='<option value="">无</option>'+(list&&list.length?list.map(function(n){return '<option value="'+esc(n)+'">'+esc(n)+'</option>';}).join(''):'<option value="" disabled>加载失败</option>');
    sel.value=cur;
  });
}
var diyLorebook='宝可梦 战斗爽MVU-大世界终极版';
try{var _dl=localStorage.getItem('pk_diy_lorebook2');if(_dl)diyLorebook=_dl;}catch(e){}
var diyLoreMode='select';
try{var _dlm=localStorage.getItem('pk_diy_loremode');if(_dlm==='input')diyLoreMode='input';}catch(e){}
var lorebookListCache=null;

function tryParentLorebooks(){
  try{
    var w=WIN;
    if(!w)return null;
    var arr=null;
    if(w.world_names&&Array.isArray(w.world_names))arr=w.world_names;
    else if(w.lorebookNames&&Array.isArray(w.lorebookNames))arr=w.lorebookNames;
    else if(w.lorebooks&&Array.isArray(w.lorebooks))arr=w.lorebooks;
    else if(w.power_user&&w.power_user.lorebooks&&Array.isArray(w.power_user.lorebooks))arr=w.power_user.lorebooks;
    if(!arr)return null;
    return arr.map(function(x){return typeof x==='string'?x:(x&&x.name?x.name:'');}).filter(function(x){return x;});
  }catch(e){return null;}
}
function fetchLorebookList(cb){
  if(lorebookListCache){cb&&cb(lorebookListCache);return;}
  var names=[];
  try{
    var w=WIN,ST=w&&w.SillyTavern,ctx=ST&&ST.getContext?ST.getContext():null;
    if(ctx&&typeof ctx.getWorldInfoNames==='function'){
      var gl=ctx.getWorldInfoNames();
      if(Array.isArray(gl))gl.forEach(function(n){if(n)names.push(String(n));});
    }
  }catch(e){}
  try{
    var par=tryParentLorebooks();
    if(par)par.forEach(function(n){if(names.indexOf(n)<0)names.push(n);});
  }catch(e){}
  try{
    [].slice.call(document.querySelectorAll('#world_info,select[name="world_info"],#world_info_select,#world_editor_select')).forEach(function(sel){
      Array.prototype.slice.call(sel.options||[]).forEach(function(o){
        var v=String(o.value||o.text||'').trim();
        if(v&&v!=='---'&&!/^select/i.test(v)&&names.indexOf(v)<0)names.push(v);
      });
    });
  }catch(e){}
  var out=['当前世界信息'];
  names.forEach(function(n){
    var s=String(n==null?'':n).trim();
    if(!s||/^\d+$/.test(s))return;
    if(out.indexOf(s)<0)out.push(s);
  });
  lorebookListCache=out;
  cb&&cb(lorebookListCache);
}



function diyLoreText(type,obj){
  if(type==='move'){
    var t='技能：'+obj.name+'\n属性：'+(obj.type||'-')+'\n分类：'+(obj.cat||'-')+'\n威力：'+(obj.power||'-')+'\n命中：'+(obj.acc||'-');
    if(obj.desc)t+='\n描述：'+obj.desc;
    if(obj.eff)t+='\n详细效果：'+obj.eff;
    return t;
  }
  if(type==='ability'){
    var a='特性：'+obj.name+'\n介绍：'+(obj.text||'-');
    if(obj.detail)a+='\n详细效果：'+obj.detail;
    return a;
  }
  if(type==='item'){
    return '道具：'+obj.name+'\n介绍：'+(obj.text||'-');
  }
  var types=(obj.types&&obj.types.length)?obj.types:(obj.type?[obj.type]:[]);
  var p='精灵：'+obj.name+'\n属性：'+(types.length?types.join('/'):'-')+'\n特性：'+(obj.ability||'-');
  if(obj.moves&&obj.moves.length)p+='\n专属技能：'+diyMovesTextLore(obj);
  if(obj.item)p+='\n相关道具：'+obj.item;
  if(obj.stats)p+='\n种族值：'+diyStatsText(obj.stats);
  if(obj.desc)p+='\n外观描述：'+obj.desc;
if(obj.chain&&obj.chain.length>1)p+='\n进化链：'+diyChainText(obj);
  return p;
}
function diyLorebookValue(){
  if(diyLoreMode==='input'){
    var custom=document.getElementById('diy-lorebook-custom');
    var cv=custom?custom.value.trim():'';
    return cv||diyLorebook;
  }
  var sel=document.getElementById('diy-lorebook');
  return (sel&&sel.value)?sel.value:diyLorebook;
}
function diySetLoreMode(mode){
  diyLoreMode=(mode==='input')?'input':'select';
  try{localStorage.setItem('pk_diy_loremode',diyLoreMode);}catch(e){}
  var selWrap=document.getElementById('diy-lore-select-wrap');
  var inWrap=document.getElementById('diy-lore-input-wrap');
  var btnSel=document.getElementById('diy-lore-mode-select');
  var btnIn=document.getElementById('diy-lore-mode-input');
  var on='border-color:#7cc4f8;color:#fff;background:rgba(43,74,111,.9)';
  if(selWrap)selWrap.style.display=(diyLoreMode==='select')?'':'none';
  if(inWrap)inWrap.style.display=(diyLoreMode==='input')?'':'none';
  if(btnSel)btnSel.style.cssText=(diyLoreMode==='select')?on:'';
  if(btnIn)btnIn.style.cssText=(diyLoreMode==='input')?on:'';
}
function diyFillLorebookOptions(){
  var sel=document.getElementById('diy-lorebook');
  if(!sel)return;
  fetchLorebookList(function(list){
    if(!sel||!document.body.contains(sel))return;
    var cur=sel.value||diyLorebook;
    var h='<option value="">—— 请选择世界书 ——</option>';
    (list||[]).forEach(function(n){
      var s=String(n==null?'':n).trim();
      if(!s||/^\d+$/.test(s))return;
      h+='<option value="'+esc(s)+'"'+(s===cur?' selected':'')+'>'+esc(s)+'</option>';
    });
    sel.innerHTML=h;
  });
}
function diyLorebookHTML(){
  var selActive=diyLoreMode==='select';
  var modeBtn='<div style="display:flex;gap:6px;margin-bottom:6px">'+
    '<button type="button" id="diy-lore-mode-select" class="btn-small" style="'+(selActive?'border-color:#7cc4f8;color:#fff;background:rgba(43,74,111,.9)':'')+'">📖 选择世界书</button>'+
    '<button type="button" id="diy-lore-mode-input" class="btn-small" style="'+(!selActive?'border-color:#7cc4f8;color:#fff;background:rgba(43,74,111,.9)':'')+'">⌨ 手动输入</button>'+
    '</div>';
  var selectHtml='<div id="diy-lore-select-wrap"'+(selActive?'':' style="display:none"')+'><select id="diy-lorebook" style="'+DIY_INPUT_STYLE+'"><option value="">—— 正在读取世界书列表… ——</option></select></div>';
  var inputHtml='<div id="diy-lore-input-wrap"'+(selActive?' style="display:none"':'')+'><input type="text" id="diy-lorebook-custom" placeholder="世界书文件名，如 宝可梦DIY" value="'+esc(diyLorebook)+'" style="'+DIY_INPUT_STYLE+'"></div>';
  return '<div class="info-frame plain-frame"><div class="info-inner"><div class="info-title">写入世界书(推荐自建外挂世界书，方便删除，删除缓存不会删除世界书条目，只会关闭)</div>'+modeBtn+selectHtml+inputHtml+'</div></div>';
}
function diyLoreCreateCmd(type,name,obj,book){
  var text=diyLoreText(type,obj);
  var one=text.replace(/\"/g,'＂').replace(/\|/g,'｜');
  var title=('自创'+diyLabel(type)+'：'+name).replace(/\"/g,'＂').replace(/\|/g,'｜');
  var book2=book.replace(/\"/g,'＂').replace(/\|/g,'｜');
  return '/createentry file="'+book2+'" '+one+' | /setvar key=uid {{pipe}} | /setentryfield file="'+book2+'" uid={{pipe}} field=comment '+title+' | /getvar uid | /setentryfield file="'+book2+'" uid={{pipe}} field=constant true';
}
function diyWriteLorebook(type,name,oldName,silent){
  var obj=diyGet(type,name);
  if(!obj){if(!silent)diyDoneMsg();return;}
  var book=diyLorebookValue();
if(!book){if(!silent)diyMsg('已保存 DIY（未填写世界书文件名，未写入）');return;}
  var text=diyLoreText(type,obj);
  var one=text.replace(/\"/g,'＂').replace(/\|/g,'｜');
  var title=('自创'+diyLabel(type)+'：'+name).replace(/\"/g,'＂').replace(/\|/g,'｜');
  var book2=book.replace(/\"/g,'＂').replace(/\|/g,'｜');
  if(oldName && oldName===name){
    var cmdUpd='/findentry file="'+book2+'" field=comment "'+title+'" | /setentryfield file="'+book2+'" uid={{pipe}} field=content '+one;
    sendMessage(cmdUpd);
    if(!silent)diyMsg('已保存编辑，并已更新世界书「'+book+'」中对应条目内容');
    return;
  }
  var dis='';
  if(oldName){
    var oldTitle=('自创'+diyLabel(type)+'：'+oldName).replace(/\"/g,'＂').replace(/\|/g,'｜');
    dis='/findentry file="'+book2+'" field=comment "'+oldTitle+'" | /setentryfield file="'+book2+'" uid={{pipe}} field=disable true | ';
  }
  sendMessage(dis+diyLoreCreateCmd(type,name,obj,book));
  if(!silent)diyMsg('已保存 DIY，并已写入世界书「'+book+'」（蓝灯常驻）');
}
function diyDisableLorebook(type,name){
  try{
    var book=diyLorebookValue();
if(!book)return;
    var title=('自创'+diyLabel(type)+'：'+name).replace(/"/g,'＂').replace(/\|/g,'｜');
    var book2=book.replace(/"/g,'＂').replace(/\|/g,'｜');
    var cmd='/findentry file="'+book2+'" field=comment "'+title+'" | /setentryfield file="'+book2+'" uid={{pipe}} field=disable true';
    sendMessage(cmd);
  }catch(e){}
}

var RANDOM_MODE_TITLE='[随机模式] 随机宝可梦';
var RANDOM_MODE_POSITION=1;
var RANDOM_MODE_ORDER=860;
var RANDOM_MODE_DEFAULT_CONTENT='<Random_Pokemon_Enforcement>\n[最高优先级覆写] 高于原作队伍设定、本地图鉴与场景生态。\n物种抽取（一律D100骰，按序取自<Dice_Sequence>，禁自行编造或跳骰）:\n  世代骰(D100，值=该代全国图鉴区间): 1~11=1-151 12~22=152-251 23~33=252-386 34~44=387-493 45~55=494-649 56~66=650-721 67~77=722-809 78~88=810-905 89~100=906-1025\n  编号骰(D100): 全国图鉴编号 = 该代起始号 + ⌊骰 × (该代末号−起始号+1) ÷ 100⌋ − 1 → 取该编号物种\nNPC队伍: 逐只抽满全队后，读其属性·速度·特性分布反推战术体系，再逐只配性格·特性·道具·四招服务该体系。等级·数量·搭档数·机制数照<WorldSettingGuide>，搭档补种族照<Pokemon_Partner>。战术逻辑·性格·口癖照原人设保留\n野外遭遇与附近宝可梦: 无视气候·地形·海陆·昼夜与地区图鉴，抽出即用\n禁修正: 抽到鲤鱼王即鲤鱼王，禁因不符身份或生态而暗改\n</Random_Pokemon_Enforcement>';
var randomModeEnabled=false;
try{randomModeEnabled=(localStorage.getItem('pk_randommode')==='1');}catch(e){randomModeEnabled=false;}
function randomModeContent(){
  try{var c=localStorage.getItem('pk_randommode_content');if(c&&c.trim())return c;}catch(e){}
  return RANDOM_MODE_DEFAULT_CONTENT;
}
function randomModeSaveContent(c){try{localStorage.setItem('pk_randommode_content',c);}catch(e){}}
function randomModeSetOn(v){
  randomModeEnabled=!!v;
  try{localStorage.setItem('pk_randommode',randomModeEnabled?'1':'0');}catch(e){}
}
function randomModeSyncUI(){
  try{
    var chk=document.querySelector('input[data-toggle="randommode"]');
    if(chk)chk.checked=randomModeEnabled;
    var ed=document.getElementById('random-mode-editor');
    if(ed)ed.style.display=randomModeEnabled?'':'none';
  }catch(e){}
}
function randomModeBook(){
  var book=diyLorebookValue();
  return book?book.replace(/"/g,'＂').replace(/\|/g,'｜'):'';
}
function randomModeTitleEsc(){
  return RANDOM_MODE_TITLE.replace(/"/g,'＂').replace(/\|/g,'｜');
}
function randomModeMatchingUids(){
  var found=[];
  function scan(d){
    if(!d||typeof d!=='object')return;
    var es=(d.entries)||(d.world_info&&d.world_info.entries);
    if(!es)return;
    function hit(e){
      return e&&String(e.comment||'')===RANDOM_MODE_TITLE;
    }
    if(Array.isArray(es)){
      for(var i=0;i<es.length;i++){var e=es[i];if(hit(e)&&e.uid!=null)found.push(e.uid);}
    }else{
      for(var k in es){var e2=es[k];if(hit(e2))found.push(e2.uid!=null?e2.uid:k);}
    }
  }
  try{scan(JSON.parse(localStorage.getItem('world_info')||'null'));}catch(e){}
  try{
    var w=WIN;
    if(w&&w!==window){
      var wd=null;
      try{wd=w.world_info;}catch(e){}
      if(!wd){try{wd=JSON.parse(w.localStorage.getItem('world_info')||'null');}catch(e){}}
      scan(wd);
    }
  }catch(e){}
  var seen={},out=[];
  for(var j=0;j<found.length;j++){var u=String(found[j]);if(!seen[u]){seen[u]=1;out.push(u);}}
  return out;
}
function randomModeDisableCmd(book,uids){
  return uids.map(function(u){return '/setentryfield file="'+book+'" uid='+u+' field=disable true';}).join(' | ');
}
function randomModeMsg(msg){
  var el=document.getElementById('entertain-msg');
  if(el){el.textContent=msg;return;}
  hudMsg(msg);
}
function randomModeOn(){
  var book=randomModeBook();
  if(!book){randomModeSyncUI();randomModeMsg('请先在「DIY → 写入世界书」里选择世界书文件名');return;}
  var one=randomModeContent().replace(/\"/g,'＂').replace(/\|/g,'｜');
  var title=randomModeTitleEsc();
  var pre='';
  var uids=randomModeMatchingUids();
  if(uids.length)pre=randomModeDisableCmd(book,uids)+' | ';
  var cmd=pre+'/createentry file="'+book+'" '+one+' | /setvar key=uid {{pipe}} | /setentryfield file="'+book+'" uid={{pipe}} field=comment '+title+' | /getvar uid | /setentryfield file="'+book+'" uid={{pipe}} field=constant true | /getvar uid | /setentryfield file="'+book+'" uid={{pipe}} field=position '+RANDOM_MODE_POSITION+' | /getvar uid | /setentryfield file="'+book+'" uid={{pipe}} field=order '+RANDOM_MODE_ORDER;
  sendMessage(cmd);
  randomModeSetOn(true);
  randomModeSyncUI();
  randomModeMsg('随机模式已开启：已写入世界书「'+diyLorebookValue()+'」（蓝灯常驻·高权重，顺序'+RANDOM_MODE_ORDER+'）');
}
function randomModeOff(){
  var book=randomModeBook();
  if(!book){randomModeSyncUI();randomModeMsg('请先在「DIY → 写入世界书」里选择世界书文件名');return;}
  var title=randomModeTitleEsc();
  var uids=randomModeMatchingUids();
  var cmd=uids.length?randomModeDisableCmd(book,uids):('/findentry file="'+book+'" field=comment "'+title+'" | /setentryfield file="'+book+'" uid={{pipe}} field=disable true');
  sendMessage(cmd);
  randomModeSetOn(false);
  randomModeSyncUI();
  randomModeMsg('随机模式已关闭：已关闭世界书「'+diyLorebookValue()+'」对应条目');
}
function randomModePushContent(content,msg){
  var book=randomModeBook();
  if(!book){randomModeMsg('请先在「DIY → 写入世界书」里选择世界书文件名');return;}
  var one=content.replace(/\"/g,'＂').replace(/\|/g,'｜');
  var title=randomModeTitleEsc();
  var cmd='/findentry file="'+book+'" field=comment "'+title+'" | /setentryfield file="'+book+'" uid={{pipe}} field=content '+one;
  sendMessage(cmd);
  randomModeMsg(msg);
}
function randomModeApply(){
  var ta=document.getElementById('random-mode-content');
  var content=ta?ta.value:randomModeContent();
  randomModeSaveContent(content);
  randomModePushContent(content,'已更新世界书「'+diyLorebookValue()+'」中随机模式条目内容');
}
function randomModeRestore(){
  var ta=document.getElementById('random-mode-content');
  if(ta)ta.value=RANDOM_MODE_DEFAULT_CONTENT;
  randomModeSaveContent(RANDOM_MODE_DEFAULT_CONTENT);
  randomModePushContent(RANDOM_MODE_DEFAULT_CONTENT,'已恢复随机模式默认内容，并更新世界书「'+diyLorebookValue()+'」');
}
function randomModeHTML(){
  var randChk=randomModeEnabled?' checked':'';
  var randContent=esc(randomModeContent());
  var editor='<div id="random-mode-editor"'+(randomModeEnabled?'':' style="display:none"')+'>'+
    '<div class="set-opts"><textarea id="random-mode-content" style="'+DIY_INPUT_STYLE+'min-height:120px;resize:vertical">'+randContent+'</textarea></div>'+
    '<div class="set-opts" style="flex-direction:row;flex-wrap:wrap"><button type="button" class="act-btn" data-random-apply style="flex:1;min-width:0">✅ 确认并更新世界书条目</button><button type="button" class="act-btn" data-random-restore style="flex:1;min-width:0">↺ 变回原内容</button></div>'+
    '<div class="dim" style="font-size:.72rem;margin:4px 0 6px">写入目标为「DIY → 写入世界书」所选的世界书；条目常驻（蓝灯），权重已调高（插入位置1·顺序'+RANDOM_MODE_ORDER+'，高于机制与随机遭遇条目）。开启后可修改规则文本，点「确认」更新世界书对应条目；「变回原内容」一键恢复默认规则并更新。</div>'+
    '</div>';
  return '<div class="set-title" style="margin-top:0">随机模式</div>'+
    '<div class="set-opts"><label class="set-opt"><input type="checkbox" data-toggle="randommode"'+randChk+'>随机宝可梦模式（开启→写入世界书条目，关闭→关闭该条目）</label></div>'+
    editor;
}
function entertainmentModeHTML(){
  return '<div class="set-title">娱乐模式</div>'+
    '<div class="set-opts"><button type="button" class="act-btn" data-entertain-open>🎮 娱乐模式</button></div>'+
    '<div class="dim" style="font-size:.72rem;margin:4px 0 6px">点击弹出娱乐模式面板，内含随机宝可梦模式等玩法，后续可继续扩充。</div>';
}
function openEntertainmentMode(){
  clearBack();
  overlay.innerHTML='<div class="modal" style="max-width:560px"><div class="modal-head"><div class="modal-name">娱乐模式</div><button class="close" data-close>✕</button></div><div class="modal-body">'+randomModeHTML()+'<div id="entertain-msg" class="dim" style="font-size:.78rem;margin-top:8px;color:#ffe9a8;min-height:1em"></div><div class="action-btns" style="margin-top:10px"><button class="act-btn" data-close>完成</button></div></div></div>';
  overlay.classList.add('open');
  bindRandomMode(overlay);
}
function diyFormHTML(type){
  diyTypeCount=2;
  diyAbilityCat='';
  if(type==='pokemon'){diyEvoCount=1;diyEvoTypeCounts=[];diyEvoBranchCounts=[];diyEvoAbiCats=[];diyEvoDescShow=[];diyEvoDescCache=[];diyMoveCount=1;diyMoveRows=[];}
  var btns=diyBtnsHTML();
  if(type==='move'){
    return '<div class="set-title" style="margin-left:8px">新增技能</div>'+diyInput('diy-name','技能名称（必填）')+diyInput('diy-type','属性，如 电')+diyInput('diy-cat','分类，如 物理')+diyInput('diy-power','威力，如 80')+diyInput('diy-acc','命中，如 100')+diyArea('diy-desc','描述')+diyArea('diy-eff','详细效果')+btns;
  }
  if(type==='ability'){
  return '<div class="set-title" style="margin-left:8px">新增特性</div>'+diyInput('diy-name','特性名称（必填）')+diyArea('diy-effect','介绍')+diyArea('diy-detail','详细效果')+btns;
}
  if(type==='item'){
    return '<div class="set-title" style="margin-left:8px">新增道具</div>'+diyInput('diy-name','道具名称（必填）')+diyArea('diy-effect','介绍')+diyInput('diy-img','图片链接（可选，或点下方上传本地图片）')+'<div style="display:flex;gap:6px;align-items:center;margin-bottom:6px;flex-wrap:wrap"><button type="button" class="btn-small" data-diy-item-upload style="background:rgba(43,74,111,.7)">📁 上传本地图片</button><span class="dim" style="font-size:.7rem">支持 PNG/JPG/GIF，建议 ≤2MB</span></div><input type="file" id="diy-item-img-file" accept="image/*" style="display:none">'+btns;
  }
  return diyPkmFormHTML()+btns;
}
function diyEncode(s){
  try{return btoa(unescape(encodeURIComponent(s)));}catch(e){return '';}
}
function diyDecode(c){
  try{return decodeURIComponent(escape(atob(String(c==null?'':c).replace(/[\s\n\r]+/g,'').trim())));}catch(e){return '';}
}
function diyCopyText(txt,done){
  try{
    if(navigator.clipboard&&navigator.clipboard.writeText){
      navigator.clipboard.writeText(txt).then(function(){done&&done(true);},function(){diyCopyFallback(txt,done);});
    }else{diyCopyFallback(txt,done);}
  }catch(e){diyCopyFallback(txt,done);}
}
function diyShare(type,name){
  var obj=diyGet(type,name);
  if(!obj){diyMsg('未找到该自创内容');return;}
  var payload={v:2,t:type,n:name,d:obj};
  if(type==='pokemon'){
    var extras={ability:{},move:{},item:{}};
    function pick(kind,a){if(a&&!extras[kind][a]){var o=diyGet(kind,a);if(o)extras[kind][a]=o;}}
    function scanAbi(st){if(!st)return;pick('ability',st.ability);}
    scanAbi(obj);
    if(obj.chain&&obj.chain.length){for(var i=0;i<obj.chain.length;i++){scanAbi(obj.chain[i]);}}
    pick('item',obj.item);
    if(Array.isArray(obj.moves)){for(var m=0;m<obj.moves.length;m++){pick('move',obj.moves[m]&&obj.moves[m].move);}}
    var x={};
    if(Object.keys(extras.ability).length)x.ability=extras.ability;
    if(Object.keys(extras.move).length)x.move=extras.move;
    if(Object.keys(extras.item).length)x.item=extras.item;
    if(Object.keys(x).length)payload.x=x;
  }
  var code=diyLabel(type)+':'+name+'|'+diyEncode(JSON.stringify(payload));
  if(!code){diyMsg('生成分享码失败');return;}
  clearBack();
  overlay.innerHTML='<div class="modal"><div class="modal-head"><div class="modal-name">分享'+esc(diyLabel(type))+'：'+esc(name)+'</div><button class="close" data-close>✕</button></div><div class="modal-body"><div class="row block"><span class="k">分享码（对方粘贴导入即可）</span><span class="v" style="word-break:break-all;user-select:all">'+esc(code)+'</span></div><div class="action-btns" style="margin-top:10px"><button class="act-btn" data-copy-code="'+esc(code)+'">📋 复制分享码</button></div></div></div>';
  overlay.classList.add('open');
}
function diyImportHTML(){
  return '<div class="info-frame plain-frame"><div class="info-inner"><div class="info-title">导入分享码</div><div style="display:flex;gap:6px"><input type="text" id="diy-import-code" placeholder="粘贴分享码，自动加入自创并写入世界书" style="flex:1;min-width:0;box-sizing:border-box;padding:6px 10px;font-family:inherit;font-size:.85rem;background:rgba(43,74,111,.5);border:1px solid var(--frame);border-radius:4px;color:var(--text);outline:none"><button class="btn-small" data-diy-import>导入</button></div></div></div>';
}
function diyImport(){
  var code=diyVal('diy-import-code');
  if(!code){diyMsg('请先粘贴分享码');return;}
  var c=String(code),ci=c.lastIndexOf('|');if(ci>=0){c=c.slice(ci+1);}
var raw=diyDecode(c);
  if(!raw){diyMsg('分享码无效或格式错误');return;}
  var o=null;
  try{o=JSON.parse(raw);}catch(e){o=null;}
  if(!o||typeof o!=='object'||!o.t||!o.n||!o.d||typeof o.d!=='object'){diyMsg('分享码内容不完整');return;}
  if(['move','ability','item','pokemon'].indexOf(o.t)<0){diyMsg('分享码类型不受支持');return;}
  var t=o.t,n=String(o.n);
  diyData[t]=diyData[t]||{};
  diyData[t][n]=o.d;
  var bundledNames=[];
  ['ability','move','item'].forEach(function(kind){
    if(o.x&&o.x[kind]&&typeof o.x[kind]==='object'){
      diyData[kind]=diyData[kind]||{};
      var ks=Object.keys(o.x[kind]);
      for(var i2=0;i2<ks.length;i2++){
        var n2=ks[i2],v2=o.x[kind][n2];
        if(v2&&typeof v2==='object'){bundledNames.push({type:kind,name:n2});if(!diyData[kind][n2]){diyData[kind][n2]=v2;}}
      }
    }
  });
  diySave();
  diyType=t;
  var f=document.getElementById('diy-form');if(f)f.innerHTML=diyFormHTML(diyType);
  var l=document.getElementById('diy-list');if(l)l.innerHTML=diyListHTML(diyType);
  var tabs=document.querySelectorAll('[data-diy-tab]');
  for(var i=0;i<tabs.length;i++){tabs[i].classList.toggle('active',tabs[i].getAttribute('data-diy-tab')===t);}
  var inp=document.getElementById('diy-import-code');if(inp)inp.value='';
  
  diyWriteLorebook(t,n);
  var bundledDelay=600;
  for(var k=0;k<bundledNames.length;k++){
    (function(row,d){hudScope.setTimeout(function(){diyWriteLorebook(row.type,row.name,'',true);},d);})(bundledNames[k],bundledDelay);
    bundledDelay+=600;
  }
  diyRefreshTeam();
}
function diyChainText(obj){
  var c=obj.chain;
  if(!c||c.length<=1)return '';
  var s='';
  for(var i=0;i<c.length;i++){
    var st=c[i];
    s+='\n  '+(i+1)+'. '+st.name+'（属性：'+(st.types&&st.types.length?st.types.join('/'):'-')+'，特性：'+(st.ability||'-')+'，种族值：'+diyStatsText(st.stats)+'）';
    if(st.desc){s+='　外观描述：'+st.desc;}
    if(st.evos&&st.evos.length){s+='　进化分支：'+st.evos.map(function(e){return (e.cond||'?')+'→'+(e.to||'?');}).join('、');}
  }
  return s;
}
function diyEvoTypesHTML(p){
  var n=diyEvoTypeCounts[p]||2;
  var opts='<option value="">无</option>'+TYPE_LIST.map(function(t){return '<option value="'+t+'">'+t+'</option>';}).join('');
  var selStyle='flex:1;min-width:0;box-sizing:border-box;padding:6px 8px;font-family:inherit;font-size:.85rem;background:rgba(43,74,111,.5);border:1px solid var(--frame);border-radius:4px;color:var(--text);outline:none';
  var h='';
  for(var i=1;i<=n;i++){h+='<select id="evo-type-'+p+'-'+i+'" style="'+selStyle+'">'+opts+'</select>';}
  h+='<button class="btn-small" data-diy-evo-add-type="'+p+'" style="background:rgba(43,74,111,.7)">＋ 添加属性</button>';
  return h;
}
function diyEvoAddType(p){
  p=parseInt(p,10);
  var cnt=diyEvoTypeCounts[p]||2;
  var vals=[];
  for(var i=1;i<=cnt;i++){var e=document.getElementById('evo-type-'+p+'-'+i);vals.push(e?e.value:'');}
  diyEvoTypeCounts[p]=cnt+1;
  var tc=document.getElementById('evo-types-'+p);
  if(tc){tc.innerHTML=diyEvoTypesHTML(p);}
  for(var j=0;j<vals.length;j++){var e2=document.getElementById('evo-type-'+p+'-'+(j+1));if(e2)e2.value=vals[j];}
}
function diyEvoAbiWrapHTML(p){
  var cat=diyEvoAbiCats[p]||'';
  if(cat==='diy'){
    var diy=Object.keys(diyData.ability||{}).sort();
    var diyHtml=diy.length?diy.map(function(n){return '<option value="'+esc(n)+'">'+esc(n)+'</option>';}).join(''):'<option value="" disabled>暂无DIY特性</option>';
    return '<select id="evo-abi-'+p+'" style="'+DIY_INPUT_STYLE+'"><option value="">无</option>'+diyHtml+'</select>';
  }
  if(cat==='orig'){
    var orig=abiListCache||[];
    var origHtml=orig.length?orig.map(function(n){return '<option value="'+esc(n)+'">'+esc(n)+'</option>';}).join(''):'<option value="" disabled>加载中...</option>';
    return '<input id="evo-abi-search-'+p+'" placeholder="搜索原有特性" style="'+DIY_INPUT_STYLE+'"><select id="evo-abi-'+p+'" style="'+DIY_INPUT_STYLE+'"><option value="">无</option>'+origHtml+'</select>';
  }
  return '';
}
function diyEvoAbiHTML(p){
  var cat=diyEvoAbiCats[p]||'';
  var sel='<option value="">选择特性类型</option><option value="orig"'+(cat==='orig'?' selected':'')+'>原有特性</option><option value="diy"'+(cat==='diy'?' selected':'')+'>DIY特性</option>';
  return '<select id="evo-abi-cat-'+p+'" style="'+DIY_INPUT_STYLE+'">'+sel+'</select><div id="evo-abi-wrap-'+p+'">'+diyEvoAbiWrapHTML(p)+'</div>';
}
function diyStageFallbackLabel(p){return '形态'+(p+1);}
function diyMoveSelOpts(sel){
  var diy=Object.keys(diyData.move||{}).sort();
  var opts='<option value="">无</option>';
  for(var k=0;k<diy.length;k++){var n=diy[k];opts+='<option value="'+esc(n)+'"'+(n===sel?' selected':'')+'>'+esc(n)+'</option>';}
  return opts;
}
function diyMoveFormOptions(sel){
  var h='';
  for(var p=0;p<diyEvoCount;p++){
    h+='<option value="'+p+'"'+(String(p)===String(sel)?' selected':'')+'>'+esc(diyStageFallbackLabel(p))+'</option>';
  }
  return h;
}
function diyMoveFormLabelOptions(sel){
  var h='';
  for(var p=0;p<diyEvoCount;p++){
    var nm=diyVal('evo-name-'+p);
    var label=nm||diyStageFallbackLabel(p);
    h+='<option value="'+p+'"'+(String(p)===String(sel)?' selected':'')+'>'+esc(label)+'</option>';
  }
  return h;
}
function diyMoveRowHTML(i){
  var r=diyMoveRows[i]||{};
  var st='box-sizing:border-box;padding:6px 8px;font-family:inherit;font-size:.85rem;background:rgba(43,74,111,.5);border:1px solid var(--frame);border-radius:4px;color:var(--text);outline:none';
  var form='<select id="diy-move-form-'+i+'" style="flex:1 1 0;min-width:0;'+st+'">'+diyMoveFormOptions(r.form)+'</select>';
  var lv='<input type="text" id="diy-move-level-'+i+'" placeholder="等级" value="'+esc(r.level||'')+'" style="flex:0 0 auto;width:52px;'+st+'">';
  var sel='<select id="diy-move-'+i+'" style="flex:1 1 0;min-width:0;'+st+'">'+diyMoveSelOpts(r.move)+'</select>';
  return '<div style="display:flex;gap:6px;margin-bottom:6px;align-items:center">'+form+lv+sel+'<button class="btn-small" data-diy-move-del="'+i+'" style="background:rgba(43,74,111,.7);flex:0 0 auto">✕</button></div>';
}
function diyMovesHTML(){
  if(!diyMoveCount)return '<div class="dim" style="font-size:.72rem;margin-bottom:6px">暂无专属技能（点下方＋添加）</div>';
  var h='';
  for(var i=0;i<diyMoveCount;i++){h+=diyMoveRowHTML(i);}
  return h;
}
function diyMoveCapture(){
  diyMoveRows=[];
  for(var i=0;i<diyMoveCount;i++){
    diyMoveRows[i]={form:diyVal('diy-move-form-'+i),level:diyVal('diy-move-level-'+i),move:diyVal('diy-move-'+i)};
  }
}
function diyMoveAdd(){
  diyMoveCapture();
  diyMoveRows.push({form:'0',level:'',move:''});
  diyMoveCount=diyMoveRows.length;
  var c=document.getElementById('diy-moves');
  if(c){c.innerHTML=diyMovesHTML();diyMoveFormRefresh();}
}
function diyMoveDel(i){
  i=parseInt(i,10);
  diyMoveCapture();
  if(i>=0&&i<diyMoveRows.length)diyMoveRows.splice(i,1);
  diyMoveCount=diyMoveRows.length;
  var c=document.getElementById('diy-moves');
  if(c){c.innerHTML=diyMovesHTML();diyMoveFormRefresh();}
}
function diyMoveFormRefresh(){
  for(var i=0;i<diyMoveCount;i++){
    var sel=document.getElementById('diy-move-form-'+i);
    if(!sel)continue;
    var cur=sel.value;
    sel.innerHTML=diyMoveFormLabelOptions(cur);
  }
}
function diyMoveFormLabel(p,names){
  var nm=(names&&names[p])||'';
  return nm||diyStageFallbackLabel(p);
}
function diyMoveText(m){
  var s='';
  if(m&&m.form)s+='【'+m.form+'】';
  if(m&&m.level)s+='Lv.'+m.level+' ';
  return s+(m?m.move:'');
}
function diyMovesText(obj){
  if(!obj||!Array.isArray(obj.moves)||!obj.moves.length)return '';
  return obj.moves.map(diyMoveText).join('、');
}
function diyMoveTextLore(m){
  var s='';
  if(m&&m.form)s+='【'+m.form+'】';
  if(m&&m.level)s+='Lv.'+m.level+' 可习得 ';
  return s+(m?m.move:'');
}
function diyMovesTextLore(obj){
  if(!obj||!Array.isArray(obj.moves)||!obj.moves.length)return '';
  return obj.moves.map(diyMoveTextLore).join('、');
}
function diyPkmItemHTML(){
  var diy=Object.keys(diyData.item||{}).sort();
  var opts='<option value="">无</option>';
  for(var k=0;k<diy.length;k++){var n=diy[k];opts+='<option value="'+esc(n)+'">'+esc(n)+'</option>';}
  return '<select id="diy-pkm-item" style="'+DIY_INPUT_STYLE+'">'+opts+'</select>';
}
function diyEvoFilterAbility(p){
  var q=(document.getElementById('evo-abi-search-'+p)||{}).value||'';
  q=q.trim().toLowerCase();
  var sel=document.getElementById('evo-abi-'+p);
  if(!sel)return;
  var opts=sel.querySelectorAll('option');
  for(var i=0;i<opts.length;i++){
    var o=opts[i];
    if(!o.value){o.hidden=false;continue;}
    o.hidden=(q&&o.value.toLowerCase().indexOf(q)<0);
  }
}
function diyEvoLoadAbiOptions(p){
  fetchAbiList(function(list){
    if(diyEvoAbiCats[p]!=='orig')return;
    var sel=document.getElementById('evo-abi-'+p);
    if(!sel)return;
    var cur=sel.value;
    sel.innerHTML='<option value="">无</option>'+(list&&list.length?list.map(function(n){return '<option value="'+esc(n)+'">'+esc(n)+'</option>';}).join(''):'<option value="" disabled>加载失败</option>');
    sel.value=cur;
  });
}
function diyEvoLoadAbi(){
  fetchAbiList(function(list){
    if(!list||!list.length)return;
    for(var p=0;p<diyEvoCount;p++){
      if(diyEvoAbiCats[p]==='orig'){
        var sel=document.getElementById('evo-abi-'+p);
        if(sel){var cur=sel.value;sel.innerHTML='<option value="">无</option>'+list.map(function(n){return '<option value="'+esc(n)+'">'+esc(n)+'</option>';}).join('');sel.value=cur;}
      }
    }
  });
}
function diyEvoBranchesHTML(p){
  var n=diyEvoBranchCounts[p]||0;
  var st='flex:1;min-width:0;box-sizing:border-box;padding:6px 10px;font-family:inherit;font-size:.85rem;background:rgba(43,74,111,.5);border:1px solid var(--frame);border-radius:4px;color:var(--text);outline:none';
  if(!n)return '<div class="dim" style="font-size:.72rem">暂无进化分支（可进化为多个形态）</div>';
  var h='';
  for(var b=0;b<n;b++){
    h+='<div style="display:flex;gap:6px;margin-bottom:6px;align-items:center"><input type="text" id="evo-cond-'+p+'-'+b+'" placeholder="进化条件，如 水之石 / 亲密度" style="'+st+'"><input type="text" id="evo-to-'+p+'-'+b+'" placeholder="进化成（精灵名）" style="'+st+'"><button class="btn-small" data-diy-evo-delbranch="'+p+'|'+b+'">✕</button></div>';
  }
  return h;
}
function diyEvoAddBranch(p){
  p=parseInt(p,10);
  if(!diyEvoBranchCounts[p])diyEvoBranchCounts[p]=0;
  diyEvoBranchCounts[p]++;
  var c=document.getElementById('evo-branches-'+p);
  if(c){c.innerHTML=diyEvoBranchesHTML(p);}
}
function diyEvoDelBranch(p,b){
  p=parseInt(p,10);b=parseInt(b,10);
  var n=diyEvoBranchCounts[p]||0;
  var keep=[];
  for(var i=0;i<n;i++){if(i===b)continue;keep.push({cond:diyVal('evo-cond-'+p+'-'+i),to:diyVal('evo-to-'+p+'-'+i)});}
  diyEvoBranchCounts[p]=keep.length;
  var c=document.getElementById('evo-branches-'+p);
  if(c){c.innerHTML=diyEvoBranchesHTML(p);}
  for(var j=0;j<keep.length;j++){
    var c1=document.getElementById('evo-cond-'+p+'-'+j);if(c1)c1.value=keep[j].cond;
    var c2=document.getElementById('evo-to-'+p+'-'+j);if(c2)c2.value=keep[j].to;
  }
}
function diyEvoDescHTML(p){
  if(!diyEvoDescShow[p])return '';
  var v=diyEvoDescCache[p]||'';
  var st='width:100%;box-sizing:border-box;padding:8px 10px;font-family:inherit;font-size:.85rem;line-height:1.6;background:rgba(43,74,111,.5);border:1px solid var(--frame);border-radius:4px;color:var(--text);outline:none;min-height:140px;resize:vertical';
  return '<textarea id="evo-desc-'+p+'" placeholder="外观描述，如 全身覆盖蓝色鳞片…" style="'+st+'">'+esc(v)+'</textarea>';
}
function diyEvoDescAutosize(p){
  var ta=document.getElementById('evo-desc-'+p);
  if(!ta)return;
  ta.style.height='auto';
  var h=Math.max(140,Math.min(ta.scrollHeight+2,420));
  ta.style.height=h+'px';
}
function diyEvoToggleDesc(p){
  p=parseInt(p,10);
  if(diyEvoDescShow[p]){
    var e=document.getElementById('evo-desc-'+p);
    if(e)diyEvoDescCache[p]=e.value;
  }
  diyEvoDescShow[p]=!diyEvoDescShow[p];
  var c=document.getElementById('evo-desc-wrap-'+p);
  if(c){c.innerHTML=diyEvoDescHTML(p);if(diyEvoDescShow[p])diyEvoDescAutosize(p);}
  var btn=document.getElementById('evo-desc-btn-'+p);
  if(btn){btn.textContent=diyEvoDescShow[p]?'✕ 收起外观描述':'＋ 外观描述';}
}
function diyEvoSyncNext(){
  for(var p=0;p<diyEvoCount-1;p++){
    var next=document.getElementById('evo-name-'+(p+1));
    var sp=document.getElementById('evo-next-'+p);
    if(sp&&next){sp.textContent='进化为：'+(next.value.trim()||'（请填下一页精灵名）');}
  }
}
function diyEvoAddPage(){
  var vals={};
  for(var p=0;p<diyEvoCount;p++){
    var ids=['name','abi','img'];
    for(var a=0;a<ids.length;a++){vals['evo-'+ids[a]+'-'+p]=diyVal('evo-'+ids[a]+'-'+p);}
    var tc=diyEvoTypeCounts[p]||2;
    for(var ti=1;ti<=tc;ti++){vals['evo-type-'+p+'-'+ti]=diyVal('evo-type-'+p+'-'+ti);}
    var st=['hp','atk','def','spa','spd','spe'];
    for(var b2=0;b2<st.length;b2++){vals['evo-'+st[b2]+'-'+p]=diyVal('evo-'+st[b2]+'-'+p);}
    var bn=diyEvoBranchCounts[p]||0;
    for(var b=0;b<bn;b++){
      vals['evo-cond-'+p+'-'+b]=diyVal('evo-cond-'+p+'-'+b);
      vals['evo-to-'+p+'-'+b]=diyVal('evo-to-'+p+'-'+b);
    }
    if(diyEvoDescShow[p]){var de=document.getElementById('evo-desc-'+p);if(de)diyEvoDescCache[p]=de.value;}
  }
  var pitemVal=diyVal('diy-pkm-item');
  diyMoveCapture();
  diyEvoCount++;
  var f=document.getElementById('diy-form');
  if(f){f.innerHTML=diyPkmFormHTML()+diyBtnsHTML();}
  for(var id in vals){var el=document.getElementById(id);if(el)el.value=vals[id];}
  var itSel=document.getElementById('diy-pkm-item');if(itSel)itSel.value=pitemVal;
  for(var q=0;q<diyEvoCount;q++){if(diyEvoDescShow[q])diyEvoDescAutosize(q);}
  diyEvoSyncNext();
  diyMoveFormRefresh();
  diyEvoLoadAbi();
}
function diyBtnsHTML(){
  return '<div style="display:flex;gap:8px;margin-top:4px"><button class="btn-small" style="background:#2e7d32;border-color:#4ade80;color:#fff" data-diy-add>✔ 确认</button><button class="btn-small" style="background:#b71c1c;border-color:#f05060;color:#fff" data-diy-clear>✖ 清空</button></div>';
}
function diyPkmFormHTML(){
  var cn=['一','二','三','四','五','六','七','八','九','十'];
  var h='<div class="set-title" style="margin-left:8px">新增精灵</div><div style="display:flex;align-items:center;gap:8px;margin:0 0 8px 8px"><button class="btn-small" data-diy-evo-add>＋ 进化链</button><span class="dim" style="font-size:.72rem">请按页数填写精灵信息（当前 '+diyEvoCount+' 页）</span></div>';
  for(var p=0;p<diyEvoCount;p++){
    if(!diyEvoTypeCounts[p])diyEvoTypeCounts[p]=2;
    if(!diyEvoBranchCounts[p])diyEvoBranchCounts[p]=0;
    var title=diyEvoCount===1?'精灵信息':'第'+(cn[p]||(p+1))+'页'+(p===0?'（基础形态）':'（进化形态）');
    h+='<div class="fold-box" style="margin-bottom:8px"><div class="fold-head" style="cursor:default">'+title+'</div><div class="fold-inner">';
    h+=diyInput('evo-name-'+p,'精灵名称（必填）');
    h+='<div class="set-title" style="margin-left:0;font-size:.78rem">属性</div><div id="evo-types-'+p+'" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:6px">'+diyEvoTypesHTML(p)+'</div>';
    h+='<div class="set-title" style="margin-left:0;font-size:.78rem">特性</div><div style="margin-bottom:6px">'+diyEvoAbiHTML(p)+'</div>';
    h+='<div class="set-title" style="margin-left:0;font-size:.78rem">种族值</div><div style="display:flex;gap:6px;margin-bottom:6px">'+diyStatInput('evo-hp-'+p,'HP')+diyStatInput('evo-atk-'+p,'攻击')+diyStatInput('evo-def-'+p,'防御')+'</div><div style="display:flex;gap:6px;margin-bottom:6px">'+diyStatInput('evo-spa-'+p,'特攻')+diyStatInput('evo-spd-'+p,'特防')+diyStatInput('evo-spe-'+p,'速度')+'</div>';
    h+='<div class="set-title" style="margin-left:0;font-size:.78rem">图片</div>';
    h+=diyInput('evo-img-'+p,'图片链接（可选，或点下方上传本地图片/GIF）');
    h+='<div style="display:flex;gap:6px;align-items:center;margin-bottom:6px;flex-wrap:wrap"><button type="button" class="btn-small" data-diy-evo-upload="'+p+'" style="background:rgba(43,74,111,.7)">📁 上传本地图/GIF</button><button type="button" class="btn-small" data-diy-evo-vision="'+p+'" style="background:rgba(43,74,111,.7)">🤖 AI识图填入外观</button><span class="dim" style="font-size:.7rem">支持 PNG/JPG/GIF，建议 ≤2MB</span></div>';
    h+='<input type="file" id="evo-img-file-'+p+'" accept="image/*" style="display:none">';
    h+='<div class="set-title" style="margin-left:0;font-size:.78rem">外观描述</div><button id="evo-desc-btn-'+p+'" class="btn-small" data-diy-evo-adddesc="'+p+'" style="background:rgba(43,74,111,.7);margin-bottom:6px">'+(diyEvoDescShow[p]?'✕ 收起外观描述':'＋ 外观描述')+'</button><div id="evo-desc-wrap-'+p+'" style="margin-bottom:6px">'+diyEvoDescHTML(p)+'</div>';
    h+='<div class="set-title" style="margin-left:0;font-size:.78rem">进化分支</div><div id="evo-branches-'+p+'">'+diyEvoBranchesHTML(p)+'</div><button class="btn-small" data-diy-evo-addbranch="'+p+'" style="background:rgba(43,74,111,.7);margin-bottom:6px">＋ 进化分支</button>';
    h+='</div></div>';
  }
  h+='<div class="fold-box" style="margin-bottom:8px"><div class="fold-head" style="cursor:default">专属技能与相关道具（整只精灵通用）</div><div class="fold-inner">';
  h+='<div class="set-title" style="margin-left:0;font-size:.78rem">专属技能（填写等级并选择DIY技能，点＋可添加多个）</div><div id="diy-moves">'+diyMovesHTML()+'</div><button class="btn-small" data-diy-move-add style="background:rgba(43,74,111,.7);margin-bottom:6px">＋ 添加技能</button>';
  h+='<div class="set-title" style="margin-left:0;font-size:.78rem">相关道具（选已DIY的道具，可不选）</div><div style="margin-bottom:6px">'+diyPkmItemHTML()+'</div>';
  h+='</div></div>';
  return h;
}
function diyListHTML(type){
  var t=diyData[type]||{},ks=Object.keys(t);
  var head='<div class="set-title" style="margin-left:8px">已自创的'+diyLabel(type)+(ks.length?'（'+ks.length+'）':'')+'</div>';
  if(!ks.length)return head+'<div class="empty">暂无</div>';
  return head+ks.map(function(name){
    return '<div class="nearby-item" style="cursor:default"><div class="nearby-info"><div class="nearby-name" data-diy-view="'+esc(name)+'" style="cursor:pointer;color:#7cc4f8">'+esc(name)+'</div></div><button class="btn-small" data-diy-share="'+esc(name)+'" style="display:none" aria-hidden="true">分享</button><button class="btn-small" data-diy-del="'+esc(name)+'">✕</button></div>';
  }).join('');
}
function diyHTML(){
  var tabs=['move','ability','item','pokemon'].map(function(t){
    return '<button class="bag-tab'+(diyType===t?' active':'')+'" data-diy-tab="'+t+'">'+diyLabel(t)+'</button>';
  }).join('');
  return diyLorebookHTML()+diyVisionBtnHTML()+frameP('DIY 自创','<div class="bag-tabs">'+tabs+'</div><div id="diy-form">'+diyFormHTML(diyType)+'</div><div id="diy-list">'+diyListHTML(diyType)+'</div>')+diyImportHTML();
}
function diyBuildObj(type,name){
  var obj;
  if(type==='move'){
    obj={name:name,type:diyVal('diy-type'),cat:diyVal('diy-cat'),power:diyVal('diy-power'),acc:diyVal('diy-acc'),desc:diyVal('diy-desc'),eff:diyVal('diy-eff')};
  }else if(type==='ability'){
    obj={name:name,text:diyVal('diy-effect'),detail:diyVal('diy-detail')};
  }else if(type==='item'){
    obj={name:name,text:diyVal('diy-effect'),img:diyVal('diy-img')};
  }else{
    var chain=[];
    for(var p=0;p<diyEvoCount;p++){
      var pn=diyVal('evo-name-'+p);
      if(!pn)continue;
      var pts=[];
      var tcn=diyEvoTypeCounts[p]||2;for(var ti=1;ti<=tcn;ti++){var tv=diyVal('evo-type-'+p+'-'+ti);if(tv)pts.push(tv);}
      var st={name:pn,types:pts,ability:diyVal('evo-abi-'+p),stats:{hp:diyVal('evo-hp-'+p),atk:diyVal('evo-atk-'+p),def:diyVal('evo-def-'+p),spa:diyVal('evo-spa-'+p),spd:diyVal('evo-spd-'+p),spe:diyVal('evo-spe-'+p)},img:diyVal('evo-img-'+p)};
      var _dv=(diyEvoDescShow[p]?diyVal('evo-desc-'+p):(diyEvoDescCache[p]||'')).trim();
      if(_dv)st.desc=_dv;
      var evs=[];
var bn=diyEvoBranchCounts[p]||0;
for(var b=0;b<bn;b++){var cond=diyVal('evo-cond-'+p+'-'+b),to=diyVal('evo-to-'+p+'-'+b);if(cond||to)evs.push({cond:cond,to:to});}
if(evs.length)st.evos=evs;
      chain.push(st);
    }
    var stageNames=[];
    for(var sp=0;sp<diyEvoCount;sp++){stageNames.push(diyVal('evo-name-'+sp));}
    var moves=[];
    for(var m=0;m<diyMoveCount;m++){
      var mv2=diyVal('diy-move-'+m);
      if(mv2){
        var fi=parseInt(diyVal('diy-move-form-'+m),10);
        if(isNaN(fi)||fi<0)fi=0;
        moves.push({form:diyMoveFormLabel(fi,stageNames),level:diyVal('diy-move-level-'+m),move:mv2});
      }
    }
    var pitem=diyVal('diy-pkm-item');
    var base=chain[0]||{name:name,types:[],ability:'',stats:{},img:'',desc:''};
    obj={name:base.name,types:base.types,ability:base.ability,stats:base.stats,img:base.img,desc:base.desc,chain:chain};
    if(moves.length)obj.moves=moves;
    if(pitem)obj.item=pitem;
  }
  return obj;
}
function diyAdd(type){
  var name=diyVal(type==='pokemon'?'evo-name-0':'diy-name');
  if(!name){diyMsg('名字不能为空');return;}
  var obj=diyBuildObj(type,name);
  diyData[type]=diyData[type]||{};
  var editing=diyEditingName;
  if(editing && diyData[type][editing]){
    if(name!==editing){delete diyData[type][editing];}
    diyData[type][name]=obj;
    diySave();
    diyEditingName='';
    var f=document.getElementById('diy-form');if(f)f.innerHTML=diyFormHTML(type);
    var l=document.getElementById('diy-list');if(l)l.innerHTML=diyListHTML(type);
    diyWriteLorebook(type,name,editing);
    diyRefreshTeam();
    return;
  }
  diyData[type][name]=obj;
  diySave();
  var f2=document.getElementById('diy-form');if(f2)f2.innerHTML=diyFormHTML(type);
  var l2=document.getElementById('diy-list');if(l2)l2.innerHTML=diyListHTML(type);
  diyWriteLorebook(type,name);
  diyRefreshTeam();
}
function diyMsg(t){
  overlay.innerHTML='<div class="modal"><div class="modal-head"><div class="modal-name">DIY</div><button class="close" data-close>✕</button></div><div class="modal-body"><div class="row"><span class="v">'+esc(t)+'</span></div></div></div>';
  overlay.classList.add('open');
}
function diyDoneMsg(){
  overlay.innerHTML='<div class="modal"><div class="modal-head"><div class="modal-name">DIY</div><button class="close" data-close>✕</button></div><div class="modal-body"><div class="row"><span class="v">请自行添加世界书信息</span></div><div class="action-btns"><button class="act-btn" data-close>我知道了</button></div></div></div>';
  overlay.classList.add('open');
}
function diyView(type,name){
  var obj=diyGet(type,name);
  if(!obj)return;
  var body='';
  if(type==='move'){
    body=infoRow('属性',esc(obj.type||'-'))+infoRow('分类',esc(obj.cat||'-'))+infoRow('威力',esc(obj.power||'-'))+infoRow('命中',esc(obj.acc||'-'));
    if(obj.desc)body+='<div class="row block"><span class="k">描述</span><span class="v">'+esc(obj.desc).replace(/\n/g,'<br>')+'</span></div>';
    if(obj.eff)body+='<div class="row block"><span class="k">详细效果</span><span class="v">'+esc(obj.eff).replace(/\n/g,'<br>')+'</span></div>';
  }else if(type==='pokemon'){
  if(obj.img)body='<div style="text-align:center;margin-bottom:8px"><img '+hudDiyImgAttrs(obj.img)+' style="max-width:96px;max-height:96px;object-fit:contain;image-rendering:pixelated" onerror="this.remove()"></div>';
  var types=(obj.types&&obj.types.length)?obj.types:(obj.type?[obj.type]:[]);
  if(types.length)body+='<div class="row"><span class="k">属性</span><div class="types">'+types.map(function(t){return typeChipHTML(t);}).join('')+'</div></div>';
  body+=infoRow('特性',esc(obj.ability||'-'));
  if(obj.moves&&obj.moves.length)body+=infoRow('专属技能',esc(diyMovesText(obj)));
  if(obj.item)body+=infoRow('相关道具',esc(obj.item));
  if(obj.stats)body+='<div class="row block"><span class="k">种族值</span><span class="v">'+esc(diyStatsText(obj.stats))+'</span></div>';
  if(obj.desc)body+='<div class="row block"><span class="k">外观描述</span><span class="v">'+esc(obj.desc).replace(/\n/g,'<br>')+'</span></div>';
if(obj.chain&&obj.chain.length>1){body+='<div class="row block"><span class="k">进化链</span><span class="v">'+obj.chain.map(function(st,i){return esc((i+1)+'. '+st.name+'（属性：'+(st.types&&st.types.length?st.types.join('/'):'-')+'，特性：'+(st.ability||'-')+'，种族值：'+diyStatsText(st.stats)+'）'+(st.desc?('　外观描述：'+st.desc):'')+(st.evos&&st.evos.length?('　进化分支：'+st.evos.map(function(e){return (e.cond||'?')+'→'+(e.to||'?');}).join('、')):''));}).join('<br>')+'</span></div>';}
}else if(type==='ability'){
  body='<div class="row block"><span class="k">介绍</span><span class="v">'+esc(obj.text||'-').replace(/\n/g,'<br>')+'</span></div>'+((obj.detail&&obj.detail!==obj.text)?'<div class="row block"><span class="k">详细效果</span><span class="v">'+esc(obj.detail).replace(/\n/g,'<br>')+'</span></div>':'');
}else{
  if(obj.img){
    body='<div style="text-align:center;margin-bottom:8px"><img '+hudDiyImgAttrs(obj.img)+' style="max-width:96px;max-height:96px;object-fit:contain;image-rendering:pixelated" onerror="this.remove()"></div>';
  }
  body+='<div class="row block"><span class="k">介绍</span><span class="v">'+esc(obj.text||'-').replace(/\n/g,'<br>')+'</span></div>';
}
  overlay.innerHTML='<div class="modal"><div class="modal-head"><div class="modal-name">'+esc(name)+'</div><button class="close" data-close>✕</button></div><div class="modal-body">'+body+'<div class="action-btns" style="margin-top:10px"><button class="act-btn" data-diy-copy="'+esc(name)+'" data-diy-copy-type="'+type+'">📋 一键复制</button><button class="act-btn" data-diy-edit="'+esc(name)+'" data-diy-edit-type="'+type+'">✏️ 编辑</button></div></div></div>';
  overlay.classList.add('open');
  hudResolvePkidbImages(overlay);
}
function diyEvoSetAbiAfterLoad(p,ability){
  fetchAbiList(function(list){
    var sel=document.getElementById('evo-abi-'+p);
    if(!sel)return;
    var h='<option value="">无</option>'+(list&&list.length?list.map(function(n){return '<option value="'+esc(n)+'">'+esc(n)+'</option>';}).join(''):'<option value="" disabled>加载失败</option>');
    sel.innerHTML=h;
    sel.value=ability;
  });
}
function diyEdit(type,name){
  var obj=diyGet(type,name);
  if(!obj){diyMsg('未找到该自创内容');return;}
  diyType=type;
  diyEditingName=name;
  overlay.classList.remove('open');
  var tabs=document.querySelectorAll('[data-diy-tab]');
  for(var i=0;i<tabs.length;i++){tabs[i].classList.toggle('active',tabs[i].getAttribute('data-diy-tab')===type);}
  var f=document.getElementById('diy-form');
  if(!f)return;
  if(type==='pokemon'){
    var chain=(obj.chain&&obj.chain.length)?obj.chain:[obj];
    diyEvoCount=chain.length;
    diyEvoTypeCounts=[];diyEvoBranchCounts=[];diyEvoAbiCats=[];diyEvoDescShow=[];diyEvoDescCache=[];
    for(var p=0;p<chain.length;p++){
      var st=chain[p]||{};
      diyEvoTypeCounts[p]=Math.max(2,(st.types&&st.types.length)?st.types.length:1);
      diyEvoBranchCounts[p]=(st.evos&&st.evos.length)?st.evos.length:0;
      diyEvoDescShow[p]=!!(st.desc&&String(st.desc).trim());
      diyEvoDescCache[p]=st.desc||'';
      var abi=st.ability||'';
      diyEvoAbiCats[p]=abi?(diyData.ability&&diyData.ability[abi]?'diy':'orig'):'';
    }
    var mvArr=Array.isArray(obj.moves)?obj.moves:[];
    diyMoveRows=mvArr.map(function(m){
      var formLabel=(m&&m.form)||'';
      var fi=0;
      for(var fp=0;fp<chain.length;fp++){
        var fname=(chain[fp]&&chain[fp].name)||'';
        var ffall=diyStageFallbackLabel(fp);
        if(formLabel===fname||formLabel===ffall){fi=fp;break;}
      }
      return {form:String(fi),level:(m&&m.level)||'',move:(m&&m.move)||''};
    });
    diyMoveCount=diyMoveRows.length;
    f.innerHTML=diyPkmFormHTML()+diyBtnsHTML();
    var itSel=document.getElementById('diy-pkm-item');if(itSel)itSel.value=obj.item||'';
    for(var q=0;q<chain.length;q++){
      var s=chain[q]||{};
      var nm=document.getElementById('evo-name-'+q);if(nm)nm.value=s.name||'';
      if(s.types){for(var ti=0;ti<s.types.length;ti++){var te=document.getElementById('evo-type-'+q+'-'+(ti+1));if(te)te.value=s.types[ti];}}
      var st2=s.stats||{};
      ['hp','atk','def','spa','spd','spe'].forEach(function(k){var e=document.getElementById('evo-'+k+'-'+q);if(e)e.value=st2[k]||'';});
      var im=document.getElementById('evo-img-'+q);if(im)im.value=s.img||'';
      if(s.desc){var de=document.getElementById('evo-desc-'+q);if(de)de.value=s.desc;}
      var cat=document.getElementById('evo-abi-cat-'+q);if(cat)cat.value=diyEvoAbiCats[q]||'';
      var abiSel=document.getElementById('evo-abi-'+q);
      if(abiSel){
        if(diyEvoAbiCats[q]==='diy'){abiSel.value=s.ability||'';}
        else if(diyEvoAbiCats[q]==='orig'&&s.ability){diyEvoSetAbiAfterLoad(q,s.ability);}
      }
      if(s.evos&&s.evos.length){for(var b=0;b<s.evos.length;b++){var ce=document.getElementById('evo-cond-'+q+'-'+b);if(ce)ce.value=s.evos[b].cond||'';var to=document.getElementById('evo-to-'+q+'-'+b);if(to)to.value=s.evos[b].to||'';}}
    }
    diyEvoSyncNext();
    diyMoveFormRefresh();
  }else{
    f.innerHTML=diyFormHTML(type);
    var set=function(id,v){var e=document.getElementById(id);if(e)e.value=v||'';};
    if(type==='move'){set('diy-name',obj.name);set('diy-type',obj.type);set('diy-cat',obj.cat);set('diy-power',obj.power);set('diy-acc',obj.acc);set('diy-desc',obj.desc);set('diy-eff',obj.eff);}
    else if(type==='ability'){set('diy-name',obj.name);set('diy-effect',obj.text);set('diy-detail',obj.detail);}
    else if(type==='item'){set('diy-name',obj.name);set('diy-effect',obj.text);set('diy-img',obj.img);}
  }
  var addBtn=document.querySelector('[data-diy-add]');
  if(addBtn)addBtn.textContent='✔ 保存修改';
  resizeFrame();
}
function diyCopy(type,name){
  var obj=diyGet(type,name);
  if(!obj)return;
  var txt='';
  if(type==='move'){
    txt='技能：'+name+'\n属性：'+(obj.type||'-')+'\n分类：'+(obj.cat||'-')+'\n威力：'+(obj.power||'-')+'\n命中：'+(obj.acc||'-');
    if(obj.desc)txt+='\n描述：'+obj.desc;
    if(obj.eff)txt+='\n详细效果：'+obj.eff;
  }else if(type==='ability'){
  txt='特性：'+name+'\n介绍：'+(obj.text||'-');
  if(obj.detail)txt+='\n详细效果：'+obj.detail;
}else if(type==='item'){
  txt='道具：'+name+'\n介绍：'+(obj.text||'-');
}else{
  var types=(obj.types&&obj.types.length)?obj.types:(obj.type?[obj.type]:[]);
  txt='精灵：'+name+'\n属性：'+(types.length?types.join('/'):'-')+'\n特性：'+(obj.ability||'-');
  if(obj.moves&&obj.moves.length)txt+='\n专属技能：'+diyMovesTextLore(obj);
  if(obj.item)txt+='\n相关道具：'+obj.item;
  if(obj.stats)txt+='\n种族值：'+diyStatsText(obj.stats);
  if(obj.desc)txt+='\n外观描述：'+obj.desc;
if(obj.chain&&obj.chain.length>1)txt+='\n进化链：'+diyChainText(obj);
}
  function done(ok){var b=document.querySelector('[data-diy-copy]');if(b)b.textContent=ok?'✔ 已复制':'复制失败';}
  try{
    if(navigator.clipboard&&navigator.clipboard.writeText){
      navigator.clipboard.writeText(txt).then(function(){done(true);},function(){diyCopyFallback(txt,done);});
    }else{diyCopyFallback(txt,done);}
  }catch(e){diyCopyFallback(txt,done);}
}
function diyCopyFallback(txt,done){
  try{
    var ta=document.createElement('textarea');ta.value=txt;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();var ok=document.execCommand('copy');document.body.removeChild(ta);done(!!ok);
  }catch(e){done(false);}
}
function diyDelStart(type,name){
  diyDelType=type;diyDelName=name;diyDelStep=1;
  diyConfirmModal();
}
function diyConfirmModal(){
  overlay.innerHTML='<div class="modal"><div class="modal-head"><div class="modal-name">确认删除（'+diyDelStep+'/2）</div><button class="close" data-close>✕</button></div><div class="modal-body"><div class="row"><span class="v">确认删除自创'+diyLabel(diyDelType)+'「'+esc(diyDelName)+'」？</span></div><div class="action-btns"><button class="act-btn" data-diy-confirm>✔ 确认（第 '+diyDelStep+' 次）</button><button class="act-btn" data-close>取消</button></div></div></div>';
  overlay.classList.add('open');
}
function diyDelConfirm(){
  diyDelStep++;
  if(diyDelStep>=3){
    var type=diyDelType, name=diyDelName;
    var t=diyData[type]||{};
    if(t[name]){delete t[name];diySave();}
    diyDisableLorebook(type,name);
    overlay.classList.remove('open');
    var l=document.getElementById('diy-list');if(l)l.innerHTML=diyListHTML(diyType);
    diyRefreshTeam();
  }else{
    diyConfirmModal();
  }
}
function diyClearStart(){
  diyClearStep=1;
  diyClearConfirmModal();
}
function diyClearConfirmModal(){
  overlay.innerHTML='<div class="modal"><div class="modal-head"><div class="modal-name">确认清空（'+diyClearStep+'/2）</div><button class="close" data-close>✕</button></div><div class="modal-body"><div class="row"><span class="v">确认清空当前填写的'+diyLabel(diyType)+'内容？</span></div><div class="action-btns"><button class="act-btn" data-diy-clear-confirm>✔ 确认（第 '+diyClearStep+' 次）</button><button class="act-btn" data-close>取消</button></div></div></div>';
  overlay.classList.add('open');
}
function diyClearConfirm(){
  diyClearStep++;
  if(diyClearStep>=3){
    var f=document.getElementById('diy-form');
    if(f)f.innerHTML=diyFormHTML(diyType);
    overlay.classList.remove('open');
  }else{
    diyClearConfirmModal();
  }
}


var TYPE_COLORS={一般:'#A8A878',格斗:'#C03028',飞行:'#A890F0',毒:'#A040A0',地面:'#E0C068',岩石:'#B8A038',虫:'#A8B820',幽灵:'#705898',钢:'#B8B8D0',火:'#F08030',水:'#6890F0',草:'#78C850',电:'#F8D030',超能力:'#F85888',冰:'#98D8D8',龙:'#7038F8',恶:'#705848',妖精:'#EE99AC','normal':'#A8A878','fighting':'#C03028','flying':'#A890F0','poison':'#A040A0','ground':'#E0C068','rock':'#B8A038','bug':'#A8B820','ghost':'#705898','steel':'#B8B8D0','fire':'#F08030','water':'#6890F0','grass':'#78C850','electric':'#F8D030','psychic':'#F85888','ice':'#98D8D8','dragon':'#7038F8','dark':'#705848','fairy':'#EE99AC'};
var TYPE_CN={'normal':'一般','fighting':'格斗','flying':'飞行','poison':'毒','ground':'地面','rock':'岩石','bug':'虫','ghost':'幽灵','steel':'钢','fire':'火','water':'水','grass':'草','electric':'电','psychic':'超能力','ice':'冰','dragon':'龙','dark':'恶','fairy':'妖精'};
var MOVE_TYPE={};
var ITEM_CN={'路卡利欧进化石':'lucarionite','力量头巾':'choice-band','讲究头带':'choice-band','讲究眼镜':'choice-specs','讲究围巾':'choice-scarf','生命宝珠':'life-orb','剩饭':'leftovers','吃剩的东西':'leftovers','气势披带':'focus-sash','突击背心':'assault-vest','进化奇石':'eviolite','弱点保险':'weakness-policy','达人带':'expert-belt','黑色污泥':'black-sludge','护符金币':'amulet-coin','先制之爪':'quick-claw','凸凸头盔':'rocky-helmet','红牌':'red-card','逃生按钮':'eject-button'};
var BALL_EN={'精灵球':'poke-ball','超级球':'great-ball','高级球':'ultra-ball','大师球':'master-ball','纪念球':'premier-ball','治愈球':'heal-ball','捕网球':'net-ball','巢穴球':'nest-ball','潜水球':'dive-ball','黑暗球':'dusk-ball','计时球':'timer-ball','先机球':'quick-ball','重复球':'repeat-ball','豪华球':'luxury-ball','狩猎球':'safari-ball','等级球':'level-ball','诱饵球':'lure-ball','月亮球':'moon-ball','友友球':'friend-ball','甜蜜球':'love-ball','沉重球':'heavy-ball','速度球':'fast-ball','竞赛球':'sport-ball','公园球':'park-ball','梦境球':'dream-ball','究极球':'beast-ball','贵重球':'cherish-ball','GS球':'gs-ball'};
var ITEM_ICON={'一般Z':'normalium-z','格斗Z':'fightinium-z','飞行Z':'flyinium-z','毒Z':'poisonium-z','地面Z':'groundium-z','岩石Z':'rockium-z','虫Z':'buginium-z','幽灵Z':'ghostium-z','钢Z':'steelium-z','火Z':'firium-z','水Z':'waterium-z','草Z':'grassium-z','电Z':'electrium-z','超能力Z':'psychium-z','冰Z':'icium-z','龙Z':'dragonium-z','恶Z':'darkinium-z','妖精Z':'fairium-z','皮卡丘Z':'pikanium-z','小智皮卡丘Z':'pikashunium-z','卡比兽Z':'snorlium-z','伊布Z':'eevium-z','阿罗拉雷丘Z':'aloraichium-z','狙射树枭Z':'decidium-z','炽焰咆哮虎Z':'incinium-z','西狮海壬Z':'primarium-z','杖尾鳞甲龙Z':'kommonium-z','露奈雅拉Z':'lunalium-z','鬃岩狼人Z':'lycanium-z','玛夏多Z':'marshadium-z','梦幻Z':'mewnium-z','谜拟QZ':'mimikium-z','谜拟ＱＺ':'mimikium-z','索尔迦雷欧Z':'solganium-z','卡璞Z':'tapunium-z','究极奈克洛兹玛Z':'ultranecrozium-z','极巨腕带':'dynamax-band','钥石':'key-stone','极巨汤':'max-soup','许愿星块':'wishing-piece'};

var BERRY_CN={'樱子果':'cheri-berry','零余果':'chesto-berry','桃桃果':'pecha-berry','莓莓果':'rawst-berry','利木果':'aspear-berry','苹野果':'leppa-berry','橙橙果':'oran-berry','柿仔果':'persim-berry','木子果':'lum-berry','文柚果':'sitrus-berry','勿花果':'figy-berry','异奇果':'wiki-berry','芒芒果':'mago-berry','乐芭果':'aguav-berry','芭亚果':'iapapa-berry','蔓莓果':'razz-berry','墨莓果':'bluk-berry','蕉香果':'nanab-berry','西梨果':'wepear-berry','凰梨果':'pinap-berry','榴石果':'pomeg-berry','藻根果':'kelpsy-berry','比巴果':'qualot-berry','哈密果':'hondew-berry','葡萄果':'grepa-berry','茄番果':'tamato-berry','玉黍果':'cornn-berry','岳竹果':'magost-berry','茸丹果':'rabuta-berry','檬柠果':'nomel-berry','刺角果':'spelon-berry','霹霹果':'pamtre-berry','刺耳果':'watmel-berry','巧可果':'durin-berry','千香果':'belue-berry','烛木果':'occa-berry','罗子果':'passho-berry','番荔果':'wacan-berry','莲蒲果':'rindo-berry','苦通果':'yache-berry','腰木果':'chople-berry','通通果':'kebia-berry','福禄果':'shuca-berry','扁樱果':'coba-berry','草蚕果':'payapa-berry','佛柑果':'tanga-berry','莓榴果':'charti-berry','刺梨果':'kasib-berry','蜜腰果':'haban-berry','灯浆果':'colbur-berry','枝荔果':'babiri-berry','香罗果':'chilan-berry','释陀果':'liechi-berry','奇秘果':'ganlon-berry','沙鳞果':'salac-berry','龙火果':'petaya-berry','杏仔果':'apicot-berry','兰萨果':'lansat-berry','星桃果':'starf-berry','谜芝果':'enigma-berry','奇拉果':'micle-berry','嘉珍果':'custap-berry','雾莲果':'jaboca-berry','洛玫果':'rowap-berry','亚开果':'roseli-berry','香藻果':'kee-berry','玛瑙果':'maranga-berry'};
var BERRY_BASE={};
for(var b in BERRY_CN){BERRY_BASE[BERRY_CN[b].replace(/-berry$/,'')]=1;}
var PKM_ITEM_SEREBII_BASE='https://raw.githubusercontent.com/xianjiu0926/Pokemon/main/item-sprites/';
var pkmItemSource='serebii';
function toHalfWidth(s){return String(s==null?'':s).replace(/[！-～]/g,function(c){return String.fromCharCode(c.charCodeAt(0)-65248);});}
function normItemName(s){return toHalfWidth(String(s==null?'':s)).replace(/[\s\u3000]+/g,'');}
function serebiiItemSlug(s){return String(s==null?'':s).toLowerCase().replace(/\.(png|gif|jpe?g|webp)$/,'').replace(/[^a-z0-9.]+/g,'');}

function serebiiItemUrl(slug){var s=serebiiItemSlug(slug);return s?PKM_ITEM_SEREBII_BASE+s+'.png':'';}
function itemSlugOf(name,iconField){
  var n=String(name||'');
  var s=String(iconField||'').trim();
  if(!s){s=itemIconName(n);}
  return serebiiItemSlug(s);
}
function itemIconName(name){
  var n=String(name||'');
  if(ITEM_ICON[n])return ITEM_ICON[n];
  if(BALL_EN[n])return BALL_EN[n];
  if(BERRY_CN[n])return BERRY_CN[n];
  if(ITEM_CN[n])return ITEM_CN[n];
  for(var k in ITEM_ICON){if(n.indexOf(k)>=0)return ITEM_ICON[k];}
  for(var k2 in BALL_EN){if(n.indexOf(k2)>=0)return BALL_EN[k2];}
  for(var k3 in BERRY_CN){if(n.indexOf(k3)>=0)return BERRY_CN[k3];}
  for(var k4 in ITEM_CN){if(n.indexOf(k4)>=0)return ITEM_CN[k4];}
  var slug=normSlug(n);
  if(/berry$/.test(slug))return slug;
  if(BERRY_BASE[slug])return slug+'-berry';
  return '';
}
var ITEM_IMG={
  'Mega手镯':'https://img.baibai.cv/f/8RNLcz/Mega%E6%89%8B%E9%95%AF.png',
  'Z强力手环':'https://img.baibai.cv/f/Mrq8Ty/Z%E5%BC%BA%E5%8A%9B%E6%89%8B%E7%8E%AF.png',
  'Z手环':'https://img.baibai.cv/f/GnNWTo/Z%E6%89%8B%E7%8E%AF.png',
  '洛托姆手机':'https://img.baibai.cv/f/EbNahX/%E6%B4%9B%E6%89%98%E5%A7%86%E6%89%8B%E6%9C%BA.png',
  '太晶珠':'https://img.baibai.cv/f/o5LbuO/%E5%A4%AA%E6%99%B6%E7%8F%A0.png',
  '钥石':'https://img.baibai.cv/f/NrK6Ig/%E9%92%A5%E7%9F%B3.png',
  '极巨腕带':'https://img.baibai.cv/f/xLb5TM/%E6%9E%81%E5%B7%A8%E8%85%95%E5%B8%A6.png',
  '宝可梦图鉴':'https://img.baibai.cv/f/1dNbu2/%E5%9B%BE%E9%89%B4.png'
};

function itemImgOf(name){
  if(!name)return undefined;
  var n=String(name);
  var hn=normItemName(n);
  if(ITEM_IMG[hn]!==undefined)return ITEM_IMG[hn];
  if(ITEM_IMG[n]!==undefined)return ITEM_IMG[n];
  var ks=Object.keys(ITEM_IMG).sort(function(a,b){return b.length-a.length;});
  for(var i=0;i<ks.length;i++){
    if(ITEM_IMG[ks[i]]&&hn.indexOf(ks[i])>=0)return ITEM_IMG[ks[i]];
  }
  for(var j=0;j<ks.length;j++){
    if(ITEM_IMG[ks[j]]&&n.indexOf(ks[j])>=0)return ITEM_IMG[ks[j]];
  }
  return undefined;
}
var PS_ITEM_OUTLINE=false;
var PS_MIRRORS=[
  'https://cdn.jsdelivr.net/gh/msikma/pokesprite@master/',
  'https://fastly.jsdelivr.net/gh/msikma/pokesprite@master/',
  'https://raw.gitmirror.com/msikma/pokesprite/master/',
  'https://raw.githubusercontent.com/msikma/pokesprite/master/'
];
var PA_MIRRORS=[
  'https://cdn.jsdelivr.net/gh/PokeAPI/sprites@master/sprites/items/',
  'https://fastly.jsdelivr.net/gh/PokeAPI/sprites@master/sprites/items/',
  'https://raw.gitmirror.com/PokeAPI/sprites/master/sprites/items/',
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/'
];
var PS_CAT={
  'poke-ball':'ball','great-ball':'ball','ultra-ball':'ball','master-ball':'ball','premier-ball':'ball','heal-ball':'ball','net-ball':'ball','nest-ball':'ball','dive-ball':'ball','dusk-ball':'ball','timer-ball':'ball','quick-ball':'ball','repeat-ball':'ball','luxury-ball':'ball','safari-ball':'ball','level-ball':'ball','lure-ball':'ball','moon-ball':'ball','friend-ball':'ball','love-ball':'ball','heavy-ball':'ball','fast-ball':'ball','sport-ball':'ball','park-ball':'ball','dream-ball':'ball','beast-ball':'ball','cherish-ball':'ball','gs-ball':'ball',
  'normalium-z':'z-crystals','fightinium-z':'z-crystals','flyinium-z':'z-crystals','poisonium-z':'z-crystals','groundium-z':'z-crystals','rockium-z':'z-crystals','buginium-z':'z-crystals','ghostium-z':'z-crystals','steelium-z':'z-crystals','firium-z':'z-crystals','waterium-z':'z-crystals','grassium-z':'z-crystals','electrium-z':'z-crystals','psychium-z':'z-crystals','icium-z':'z-crystals','dragonium-z':'z-crystals','darkinium-z':'z-crystals','fairium-z':'z-crystals','pikanium-z':'z-crystals','pikashunium-z':'z-crystals','snorlium-z':'z-crystals','eevium-z':'z-crystals','aloraichium-z':'z-crystals','decidium-z':'z-crystals','incinium-z':'z-crystals','primarium-z':'z-crystals','kommonium-z':'z-crystals','lunalium-z':'z-crystals','lycanium-z':'z-crystals','marshadium-z':'z-crystals','mewnium-z':'z-crystals','mimikium-z':'z-crystals','solganium-z':'z-crystals','tapunium-z':'z-crystals','ultranecrozium-z':'z-crystals',
  'dynamax-band':'key-item','key-stone':'key-item','max-soup':'key-item','wishing-piece':'key-item'
};
function ballNorm(s){var m={'pokeball':'poke-ball','greatball':'great-ball','ultraball':'ultra-ball','masterball':'master-ball','safariball':'safari-ball','premierball':'premier-ball','healball':'heal-ball','netball':'net-ball','nestball':'nest-ball','diveball':'dive-ball','duskball':'dusk-ball','timerball':'timer-ball','quickball':'quick-ball','repeatball':'repeat-ball','luxuryball':'luxury-ball','levelball':'level-ball','lureball':'lure-ball','moonball':'moon-ball','friendball':'friend-ball','loveball':'love-ball','heavyball':'heavy-ball','fastball':'fast-ball','sportball':'sport-ball','parkball':'park-ball','dreamball':'dream-ball','beastball':'beast-ball','cherishball':'cherish-ball','gsball':'gs-ball'};return m[s]||s;}
function normSlug(s){return String(s==null?'':s).toLowerCase().replace(/é/g,'e').replace(/\.(png|gif|jpe?g|webp)$/,'').replace(/'/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');}
function psCat(slug){
  if(PS_CAT[slug])return PS_CAT[slug];
  if(/-z$/.test(slug))return 'z-crystals';
  if(/ite(-[xy])?$/.test(slug))return 'mega-stone';
  if(/^tm-/.test(slug))return 'tm';
  if(/^tr-/.test(slug))return 'tr';
  if(/^hm-/.test(slug))return 'hm';
  if(/^(town-map|bicycle|escape-rope|exp-share|itemfinder|poke-flute|good-rod|super-rod|vs-seeker|pokeradar|mega-ring|z-ring|tera-orb)$/.test(slug))return 'key-item';
  if(/^(potion|super-potion|hyper-potion|max-potion|full-restore|revive|max-revive|antidote|burn-heal|ice-heal|awakening|paralyze-heal|full-heal|ether|max-ether|elixir|max-elixir|fresh-water|soda-pop|lemonade|moomoo-milk|energy-powder|energy-root|heal-powder|revival-herb|berry-juice|sacred-ash|sweet-heart|rare-candy|hp-up|protein|iron|calcium|zinc|carbos|pp-up|pp-max)$/.test(slug))return 'medicine';
  if(/^(fire-stone|water-stone|thunder-stone|leaf-stone|moon-stone|sun-stone|shiny-stone|dusk-stone|dawn-stone|ice-stone|oval-stone|everstone)$/.test(slug))return 'evo-item';
  if(/berry$/.test(slug))return 'berry';
  if(/-plate$/.test(slug))return 'plate';
  if(/-gem$/.test(slug))return 'gem';
  if(/-memory$/.test(slug))return 'memory';
  if(/-mint$/.test(slug))return 'mint';
  if(/-fossil$/.test(slug))return 'fossil';
  if(/-incense$/.test(slug))return 'incense';
  if(/-flute$/.test(slug))return 'flute';
  if(/-shard$/.test(slug))return 'shard';
  if(/-scarf$/.test(slug))return 'scarf';
  if(/-mail$/.test(slug))return 'mail';
  if(/-mulch$/.test(slug))return 'mulch';
  if(/-apricorn$/.test(slug))return 'apricorn';
  return '';
}
function psItemUrl(slug,kind){
  var s=ballNorm(normSlug(slug));
  var cat=psCat(s);
  if(cat==='ball')s=s.replace(/-ball$/,'');
  else if(cat==='tm')s=s.replace(/^tm-/,'');
  else if(cat==='tr')s=s.replace(/^tr-/,'');
  else if(cat==='hm')s=s.replace(/^hm-/,'');
  else if(cat==='z-crystals')s+=(kind==='held'?'--held':'--bag');
  else if(cat==='plate')s=s.replace(/-plate$/,'');
  else if(cat==='gem')s=s.replace(/-gem$/,'');
  else if(cat==='memory')s=s.replace(/-memory$/,'');
  else if(cat==='mint')s=s.replace(/-mint$/,'');
  else if(cat==='fossil')s=s.replace(/-fossil$/,'');
  else if(cat==='incense')s=s.replace(/-incense$/,'');
  else if(cat==='flute')s=s.replace(/-flute$/,'');
  else if(cat==='shard')s=s.replace(/-shard$/,'');
  else if(cat==='scarf')s=s.replace(/-scarf$/,'');
  else if(cat==='mail')s=s.replace(/-mail$/,'');
  else if(cat==='mulch')s=s.replace(/-mulch$/,'');
  else if(cat==='apricorn')s=s.replace(/-apricorn$/,'');
  else if(cat==='berry')s=s.replace(/-berry$/,'');
  if(cat==='tm'||cat==='tr'||cat==='hm')return PKM_ITEM_SEREBII_BASE+'tm-'+s+'.png';
  if(cat)return PS_MIRRORS[0]+(PS_ITEM_OUTLINE?'items-outline/':'items/')+cat+'/'+s+'.png';
  return PA_MIRRORS[0]+s+'.png';
}
function itemImgErr(el){
  var src=String(el.getAttribute('src')||'');
  var fb=el.getAttribute('data-fallback');
  if(fb&&fb!==src){el.setAttribute('src',fb);el.removeAttribute('data-fallback');return;}
  var isPS=(src.indexOf('pokesprite')>=0);
  var all=isPS?PS_MIRRORS:PA_MIRRORS;
  var cur=-1,rel='';
  for(var i=0;i<all.length;i++){
    if(src.indexOf(all[i])===0){cur=i;rel=src.slice(all[i].length);break;}
  }
  if(cur<0){el.outerHTML='<span class="item-icon placeholder">?</span>';return;}
  if(cur<all.length-1){el.src=all[cur+1]+rel;return;}
  if(isPS){
    var parts=rel.split('/');
    var dir=parts[1]||'';
    var slug=(parts[parts.length-1]||'').replace(/\.(png|gif|jpe?g|webp)$/,'').replace(/--(held|bag)$/,'');
    if(dir==='tm')slug='tm-'+slug;
    else if(dir==='tr')slug='tr-'+slug;
    else if(dir==='hm')slug='hm-'+slug;
    else if(dir==='ball')slug+='-ball';
    else if(dir==='plate')slug+='-plate';
    else if(dir==='gem')slug+='-gem';
    else if(dir==='memory')slug+='-memory';
    else if(dir==='mint')slug+='-mint';
    else if(dir==='fossil')slug+='-fossil';
    else if(dir==='incense')slug+='-incense';
    else if(dir==='flute')slug+='-flute';
    else if(dir==='shard')slug+='-shard';
    else if(dir==='scarf')slug+='-scarf';
    else if(dir==='mail')slug+='-mail';
    else if(dir==='mulch')slug+='-mulch';
    else if(dir==='apricorn')slug+='-apricorn';
    else if(dir==='berry')slug+='-berry';
    el.src=PA_MIRRORS[0]+ballNorm(slug)+'.png';
  }else{
    el.outerHTML='<span class="item-icon placeholder">?</span>';
  }
}

var NAME_EN={'蛋':'egg','皮卡丘':'pikachu','伊布':'eevee','喷火龙':'charizard','路卡利欧':'lucario','烈咬陆鲨':'garchomp','巨金怪':'metagross','班基拉斯':'tyranitar','快龙':'dragonite'};
var NAME_EN_DEX={'蛋':0,'皮卡丘':25,'伊布':133,'喷火龙':6,'路卡利欧':448,'烈咬陆鲨':445,'巨金怪':376,'班基拉斯':248,'快龙':149};

var pkmSlugCache={};
var pkmDexCache={};
var pkmSpriteCache={};
function spriteCacheKey(name,shiny){var p=pkmFormParse(name),b=(p&&p.base)||'';if(!b)return '';return (pkmSource||'pk')+':'+(shiny?'s2:':'n2:')+(p.form?p.form+'|':'')+b;}
function cachedSpriteCss(name,shiny){
  var k=spriteCacheKey(name,shiny);
  if(!k)return '';
  if(pkmSpriteCache[k]!==undefined)return pkmSpriteCache[k];
  try{
    var v=lsGet('pk_sprite_'+k,'');
    if(v){pkmSpriteCache[k]=v;return v;}
  }catch(e){}
  return '';
}
function setCachedSprite(name,shiny,url){
  var k=spriteCacheKey(name,shiny);
  if(!k||!url)return;
  var css="url('"+url+"')";
  pkmSpriteCache[k]=css;
  try{lsSet('pk_sprite_'+k,css);}catch(e){}
}

var pkmIconCache={};
function cachedIconCss(icon,shiny){
  var k=(pkmSource||'pk')+':'+(shiny?'is:':'in:')+String(icon||'').trim().toLowerCase();
  if(!k)return '';
  if(pkmIconCache[k]!==undefined)return pkmIconCache[k];
  try{var v=lsGet('pk_icon_'+k,'');if(v){pkmIconCache[k]=v;return v;}}catch(e){}
  return '';
}
function setCachedIcon(icon,shiny,url){
  var k=(pkmSource||'pk')+':'+(shiny?'is:':'in:')+String(icon||'').trim().toLowerCase();
  if(!k||!url)return;
  var css="url('"+url+"')";
  pkmIconCache[k]=css;
  try{lsSet('pk_icon_'+k,css);}catch(e){}
}
function pkImgSmart(species,icon,shiny){
  var diyRef=diyPokemonImageRef(species);
  if(diyRef){
    if(diyRef.indexOf(HUD_DIY_SCHEME)===0){var du=hudDiyAssetResolveSync(diyRef);if(du)return {img:du};return {imgRef:diyRef};}
    return {img:diyRef};
  }
  if(diyHas('pokemon',species))return null;
  var rawIcon=String(icon||'').trim();
  if(rawIcon.indexOf(HUD_DIY_SCHEME)===0){var ru=hudDiyAssetResolveSync(rawIcon);if(ru)return {img:ru};return {imgRef:rawIcon};}
  if(/^(?:https?:\/\/|data:image\/)/i.test(rawIcon)){return {img:rawIcon};}
  if(pkmSource==='pokeos'){
    if(/^[a-z0-9-]+\.gif$/i.test(rawIcon)){var ic=cachedIconCss(rawIcon,shiny);if(ic)return {bg:ic};return {icon:rawIcon};}
    var c=cachedSpriteCss(species,shiny);if(c)return {bg:c};
    return null;
  }
  if(/^[a-z0-9-]+\.(gif|png)$/i.test(rawIcon)){var ic2=cachedIconCss(rawIcon,shiny);if(ic2)return {bg:ic2};return {icon:rawIcon};}
  var c2=cachedSpriteCss(species,shiny);if(c2)return {bg:c2};
  return null;
}

function pkImgHTML(species,icon,shiny,cls){
  cls=cls||'';
  var r=pkImgSmart(species,icon,shiny);
  if(r&&r.img){
    return '<div class="pk-img '+cls+'"><img src="'+esc(r.img)+'" referrerpolicy="origin" alt="" style="width:100%;height:100%;object-fit:contain;image-rendering:pixelated" onerror="this.remove();this.parentNode.classList.add(\'no-img\');this.parentNode.textContent=\'?\'"></div>';
  }
  if(r&&r.imgRef){
    return '<div class="pk-img '+cls+'"><img data-pkidb="'+esc(r.imgRef)+'" alt="" style="width:100%;height:100%;object-fit:contain;image-rendering:pixelated"></div>';
  }
  if(r&&r.bg){
    return '<div class="pk-img '+cls+'" style="background-image:'+r.bg+'"></div>';
  }
  if(r&&r.icon){
    return '<div class="pk-img '+cls+' no-img" data-icon="'+esc(r.icon)+'" data-shiny="'+(shiny?'1':'0')+'">?</div>';
  }
  return '<div class="pk-img '+cls+' no-img" data-pkm="'+esc(species)+'" data-shiny="'+(shiny?'1':'0')+'">?</div>';
}
function diyPokemonImageRef(name){
  if(!name)return '';
  try{diySyncFromStorage(false);}catch(e){}
  var hit=hudDiyLookup(name);
  if(hit){var root=hit.root||{},stage=hit.stage||root,img=String(stage.img||root.img||'').trim();if(!img&&Array.isArray(root.chain)){for(var i=0;i<root.chain.length;i++){if(root.chain[i]&&root.chain[i].img){img=String(root.chain[i].img);break;}}}if(img)return img;}
  return '';
}

function fetchPkmSlug(name,cb){
  if(!name){cb&&cb('');return;}
  var b=pkmFormParse(name).base;
  if(!b){cb&&cb('');return;}
  if(NAME_EN[b]){if(NAME_EN_DEX[b]){pkmDexCache[b]=String(NAME_EN_DEX[b]);lsSet('pk_ndex_'+b,String(NAME_EN_DEX[b]));}cb&&cb(NAME_EN[b]);return;}
  if(pkmSlugCache[b]){cb&&cb(pkmSlugCache[b]);return;}
  var _c=lsGet('pk_slug_'+b,'');
  if(_c){pkmSlugCache[b]=_c;cb&&cb(_c);return;}
  function finish(slug){
    pkmSlugCache[b]=slug;
    if(slug)lsSet('pk_slug_'+b,slug);
    cb&&cb(slug);
  }
  function parsePage(title,onFail){
    hudFetch('https://wiki.52poke.com/api.php?action=parse&page='+encodeURIComponent(title)+'&format=json&prop=wikitext&variant=zh-hans&redirects=1&origin=*')
      .then(function(r){return r.ok?r.json():Promise.reject();})
      .then(function(j){
        var wt=(j&&j.parse&&j.parse.wikitext)?j.parse.wikitext['*']:'';
        var d=wt?parsePkmn(wt):null;
        var slug=(d&&d.enname)?String(d.enname).toLowerCase().replace(/[^a-z0-9-]+/g,'-').replace(/^-+|-+$/g,''):'';
        if(d&&d.ndex){pkmDexCache[b]=String(d.ndex);lsSet('pk_ndex_'+b,String(d.ndex));}
        if(slug){finish(slug);}else{onFail();}
      })
      .catch(onFail);
  }
  function searchThen(){
    hudFetch('https://wiki.52poke.com/api.php?action=query&list=search&srsearch='+encodeURIComponent(t2s(b))+'&srnamespace=0&srlimit=6&format=json&origin=*')
      .then(function(r){return r.json();})
      .then(function(j){
        var rs=(j&&j.query&&j.query.search)||[];
        var i=0;
        function tryNext(){
          if(i>=rs.length){finish('');return;}
          parsePage(rs[i++].title,tryNext);
        }
        tryNext();
      })
      .catch(function(){finish('');});
  }
  pkmDbLoad('dex','dex-list.json',['en','name'],function(store){
    var hit=store&&pkmDbLookup('dex',b);
    if(hit&&hit.en){
      pkmDexCache[b]=String(hit.no);
      lsSet('pk_ndex_'+b,String(hit.no));
      finish(hit.en);
      return;
    }
    parsePage(t2s(b),searchThen);
  });
}
function resolvePkmImgs(scope){
  var els=(scope||document).querySelectorAll('.pk-img[data-pkm],.pk-img[data-icon]');
  for(var i=0;i<els.length;i++){
    (function(el){
      if(el.getAttribute('data-icon')){resolvePkmIcon(el,el.getAttribute('data-icon'),el.getAttribute('data-shiny')==='1');return;}
      var name=el.getAttribute('data-pkm');
      var shiny=el.getAttribute('data-shiny')==='1';
      if(diyHas('pokemon',name))return;
var c=cachedSpriteCss(name,shiny);
if(c){el.style.backgroundImage=c;el.classList.remove('no-img');el.textContent='';el.removeAttribute('data-pkm');return;}
fetchPkmSlug(name,function(slug){
        if(slug){resolvePkmBg(el,slug,shiny,name);}
      });
    })(els[i]);
  }
}
var SLUG_FIX={'hooh':'ho-oh','mrmime':'mr-mime','porygonz':'porygon-z','typenull':'type-null','jangmoo':'jangmo-o','hakamoo':'hakamo-o','kommoo':'kommo-o','tapukoko':'tapu-koko','tapulele':'tapu-lele','tapubulu':'tapu-bulu','tapufini':'tapu-fini','nidoranf':'nidoran-f','nidoranm':'nidoran-m','mimejr':'mime-jr','mrrime':'mr-rime','ironmoth':'iron-moth','ironbundle':'iron-bundle','ironhands':'iron-hands','ironjugulis':'iron-jugulis','ironthorns':'iron-thorns','ironvaliant':'iron-valiant','ironleaves':'iron-leaves','ironboulder':'iron-boulder','ironcrown':'iron-crown','irontreads':'iron-treads','greattusk':'great-tusk','screamtail':'scream-tail','brutebonnet':'brute-bonnet','fluttermane':'flutter-mane','slitherwing':'slither-wing','sandyshocks':'sandy-shocks','roaringmoon':'roaring-moon','wochien':'wo-chien','chienpao':'chien-pao','tinglu':'ting-lu','chiyu':'chi-yu','walkingwake':'walking-wake','gougingfire':'gouging-fire','ragingbolt':'raging-bolt'};
function fixSlug(n){return SLUG_FIX[n]||n;}
function slugCandidates(n){
  var out=[n];
  var noH=n.replace(/[-:]/g,'');
  if(noH!==n)out.push(noH);
  var m=n.match(/^([a-z]+)(\d+)$/);
  if(m)out.push(m[1]+'-'+m[2]);
  if(/oo$/.test(n)&&n.length>3)out.push(n.slice(0,-1)+'-'+n.slice(-1));
  var sf=['galar','alola','hisui','paldea','mega','gmax','complete','attack','defense','speed','zen','school','busted','dawn','dusk','ultra','origin','sky','therian','crowned','white','black','ice','shadow','hero','stellar','terastal','rapid','single','resolute','wash','heat','mow','frost','fan','pau','sensu','baile','sunny','rainy','snowy','amped','low-key','pom-pom'];
  for(var i=0;i<sf.length;i++){
    var idx=n.indexOf(sf[i]);
    if(idx>0&&n.charAt(idx-1)!=='-'){out.push(n.slice(0,idx)+'-'+n.slice(idx));}
  }
  var seen={},res=[];
  for(var j=0;j<out.length;j++){if(!seen[out[j]]){seen[out[j]]=1;res.push(out[j]);}}
  return res;
}
function pkmDefaultFormBase(n){
  var m=String(n||'').match(/^(.+?)-(shield|normal|altered|land|confined|ordinary|aria|disguised|solo|standard|incarnate|neutral|amped|midday)$/);
  return m?m[1]:'';
}
var PKM_SPRITE_BASE='https://play.pokemonshowdown.com/sprites/';
var PA_POKE_MIRRORS=[
  'https://cdn.jsdelivr.net/gh/PokeAPI/sprites@master/sprites/pokemon/',
  'https://fastly.jsdelivr.net/gh/PokeAPI/sprites@master/sprites/pokemon/',
  'https://raw.gitmirror.com/PokeAPI/sprites/master/sprites/pokemon/',
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/'
];

var PKM_POKEOS_W=128;
var PKM_POKEOS_S3='s3.pokeos.com/pokeos-uploads/assets/pokemon/home/';
var PKM_POKEOS_PROXY='https://wsrv.nl/?url=';
var pkmSource='pokeos';
try{var _psrc=localStorage.getItem('pk_source');pkmSource=(_psrc==='showdown')?'showdown':'pokeos';}catch(e){}function pkmFormParse(name){
  var t=String(name||'').trim(),form='';
  if(/^(超极巨化|超极巨)/.test(t)){form='-gmax';t=t.replace(/^(超极巨化|超极巨)/,'');}
  else if(/^(原始回归|原始)/.test(t)){form='-mega';t=t.replace(/^(原始回归|原始)/,'');}
  else if(/^(Mega|mega|超级)/.test(t)){form='-mega';t=t.replace(/^(Mega|mega|超级)/,'');}
  else if(/^(阿罗拉|阿羅拉)/.test(t)){form='-regional-a';t=t.replace(/^(阿罗拉|阿羅拉)/,'');}
  else if(/^(伽勒尔|伽勒爾)/.test(t)){form='-regional-g';t=t.replace(/^(伽勒尔|伽勒爾)/,'');}
  else if(/^(洗翠)/.test(t)){form='-regional-h';t=t.replace(/^(洗翠)/,'');}
  else if(/^(帕底亚|帕底亞)/.test(t)){form='-regional-p';t=t.replace(/^(帕底亚|帕底亞)/,'');}
  if(form==='-mega'){
    if(/[XxＸ]$/.test(t)){form='-mega-x';t=t.replace(/[XxＸ]$/,'');}
    else if(/[YyＹ]$/.test(t)){form='-mega-y';t=t.replace(/[YyＹ]$/,'');}
    else if(/[ZzＺ]$/.test(t)){form='-mega-z';t=t.replace(/[ZzＺ]$/,'');}
  }else if(form==='-regional-p'){
    if(/斗战/.test(t)){form='-regional-p-combat';t=t.replace(/斗战(种)?/,'');}
    else if(/火炽/.test(t)){form='-regional-p-blaze';t=t.replace(/火炽(种)?/,'');}
    else if(/水澜/.test(t)){form='-regional-p-aqua';t=t.replace(/水澜(种)?/,'');}
  }
  if(!form){
    var keys=[['黄昏之鬃','-dusk'],['拂晓之翼','-dawn'],['灵兽形态','-therian'],['起源形态','-origin'],['天空形态','-sky'],['解放形态','-unbound'],['完全体','-complete'],['觉悟形态','-resolute'],['舞步形态','-pirouette'],['攻击形态','-attack'],['防御形态','-defense'],['速度形态','-speed'],['白昼形态','-midday'],['黑夜形态','-midnight'],['黄昏形态','-dusk'],['太阳形态','-sunny'],['雨水形态','-rainy'],['雪云形态','-snowy'],['晴天形态','-sunshine'],['全能形态','-hero'],['化身形态',''],['小智版','-ash'],['剑之王','-crowned'],['盾之王','-crowned'],['骑白马','-ice'],['骑黑马','-shadow'],['焰白','-white'],['暗黑','-black'],['究极','-ultra'],['灵兽','-therian'],['起源','-origin'],['天空','-sky'],['解放','-unbound'],['完全','-complete'],['觉悟','-resolute'],['舞步','-pirouette'],['攻击','-attack'],['防御','-defense'],['速度','-speed'],['白昼','-midday'],['黄昏','-dusk'],['晴天','-sunshine'],['全能','-hero'],['小智','-ash'],['加热','-heat'],['清洗','-wash'],['结冰','-frost'],['旋转','-fan'],['切割','-mow'],['10%形态','-10'],['50%形态','-50'],['10％形态','-10'],['50％形态','-50'],['10%','-10'],['50%','-50'],['10％','-10'],['50％','-50']];
    keys.sort(function(a,b){return b[0].length-a[0].length;});
    for(var i=0;i<keys.length;i++){var k=keys[i][0];if(t.indexOf(k)>=0){t=t.replace(k,'');form=keys[i][1];break;}}
  }
  t=t.replace(/[（(][^）)]*[）)]/g,'').replace(/(的)?样子/g,'');
  var base=baseName(t);if(!base)base=t;
  return {base:base,form:form};
}

var PKM_EN_DEX={"bulbasaur":1,"ivysaur":2,"venusaur":3,"charmander":4,"charmeleon":5,"charizard":6,"squirtle":7,"wartortle":8,"blastoise":9,"caterpie":10,"metapod":11,"butterfree":12,"weedle":13,"kakuna":14,"beedrill":15,"pidgey":16,"pidgeotto":17,"pidgeot":18,"rattata":19,"raticate":20,"spearow":21,"fearow":22,"ekans":23,"arbok":24,"pikachu":25,"raichu":26,"sandshrew":27,"sandslash":28,"nidoran-f":29,"nidorina":30,"nidoqueen":31,"nidoran-m":32,"nidorino":33,"nidoking":34,"clefairy":35,"clefable":36,"vulpix":37,"ninetales":38,"jigglypuff":39,"wigglytuff":40,"zubat":41,"golbat":42,"oddish":43,"gloom":44,"vileplume":45,"paras":46,"parasect":47,"venonat":48,"venomoth":49,"diglett":50,"dugtrio":51,"meowth":52,"persian":53,"psyduck":54,"golduck":55,"mankey":56,"primeape":57,"growlithe":58,"arcanine":59,"poliwag":60,"poliwhirl":61,"poliwrath":62,"abra":63,"kadabra":64,"alakazam":65,"machop":66,"machoke":67,"machamp":68,"bellsprout":69,"weepinbell":70,"victreebel":71,"tentacool":72,"tentacruel":73,"geodude":74,"graveler":75,"golem":76,"ponyta":77,"rapidash":78,"slowpoke":79,"slowbro":80,"magnemite":81,"magneton":82,"farfetchd":83,"doduo":84,"dodrio":85,"seel":86,"dewgong":87,"grimer":88,"muk":89,"shellder":90,"cloyster":91,"gastly":92,"haunter":93,"gengar":94,"onix":95,"drowzee":96,"hypno":97,"krabby":98,"kingler":99,"voltorb":100,"electrode":101,"exeggcute":102,"exeggutor":103,"cubone":104,"marowak":105,"hitmonlee":106,"hitmonchan":107,"lickitung":108,"koffing":109,"weezing":110,"rhyhorn":111,"rhydon":112,"chansey":113,"tangela":114,"kangaskhan":115,"horsea":116,"seadra":117,"goldeen":118,"seaking":119,"staryu":120,"starmie":121,"mr-mime":122,"scyther":123,"jynx":124,"electabuzz":125,"magmar":126,"pinsir":127,"tauros":128,"magikarp":129,"gyarados":130,"lapras":131,"ditto":132,"eevee":133,"vaporeon":134,"jolteon":135,"flareon":136,"porygon":137,"omanyte":138,"omastar":139,"kabuto":140,"kabutops":141,"aerodactyl":142,"snorlax":143,"articuno":144,"zapdos":145,"moltres":146,"dratini":147,"dragonair":148,"dragonite":149,"mewtwo":150,"mew":151,"chikorita":152,"bayleef":153,"meganium":154,"cyndaquil":155,"quilava":156,"typhlosion":157,"totodile":158,"croconaw":159,"feraligatr":160,"sentret":161,"furret":162,"hoothoot":163,"noctowl":164,"ledyba":165,"ledian":166,"spinarak":167,"ariados":168,"crobat":169,"chinchou":170,"lanturn":171,"pichu":172,"cleffa":173,"igglybuff":174,"togepi":175,"togetic":176,"natu":177,"xatu":178,"mareep":179,"flaaffy":180,"ampharos":181,"bellossom":182,"marill":183,"azumarill":184,"sudowoodo":185,"politoed":186,"hoppip":187,"skiploom":188,"jumpluff":189,"aipom":190,"sunkern":191,"sunflora":192,"yanma":193,"wooper":194,"quagsire":195,"espeon":196,"umbreon":197,"murkrow":198,"slowking":199,"misdreavus":200,"unown":201,"wobbuffet":202,"girafarig":203,"pineco":204,"forretress":205,"dunsparce":206,"gligar":207,"steelix":208,"snubbull":209,"granbull":210,"qwilfish":211,"scizor":212,"shuckle":213,"heracross":214,"sneasel":215,"teddiursa":216,"ursaring":217,"slugma":218,"magcargo":219,"swinub":220,"piloswine":221,"corsola":222,"remoraid":223,"octillery":224,"delibird":225,"mantine":226,"skarmory":227,"houndour":228,"houndoom":229,"kingdra":230,"phanpy":231,"donphan":232,"porygon2":233,"stantler":234,"smeargle":235,"tyrogue":236,"hitmontop":237,"smoochum":238,"elekid":239,"magby":240,"miltank":241,"blissey":242,"raikou":243,"entei":244,"suicune":245,"larvitar":246,"pupitar":247,"tyranitar":248,"lugia":249,"ho-oh":250,"celebi":251,"treecko":252,"grovyle":253,"sceptile":254,"torchic":255,"combusken":256,"blaziken":257,"mudkip":258,"marshtomp":259,"swampert":260,"poochyena":261,"mightyena":262,"zigzagoon":263,"linoone":264,"wurmple":265,"silcoon":266,"beautifly":267,"cascoon":268,"dustox":269,"lotad":270,"lombre":271,"ludicolo":272,"seedot":273,"nuzleaf":274,"shiftry":275,"taillow":276,"swellow":277,"wingull":278,"pelipper":279,"ralts":280,"kirlia":281,"gardevoir":282,"surskit":283,"masquerain":284,"shroomish":285,"breloom":286,"slakoth":287,"vigoroth":288,"slaking":289,"nincada":290,"ninjask":291,"shedinja":292,"whismur":293,"loudred":294,"exploud":295,"makuhita":296,"hariyama":297,"azurill":298,"nosepass":299,"skitty":300,"delcatty":301,"sableye":302,"mawile":303,"aron":304,"lairon":305,"aggron":306,"meditite":307,"medicham":308,"electrike":309,"manectric":310,"plusle":311,"minun":312,"volbeat":313,"illumise":314,"roselia":315,"gulpin":316,"swalot":317,"carvanha":318,"sharpedo":319,"wailmer":320,"wailord":321,"numel":322,"camerupt":323,"torkoal":324,"spoink":325,"grumpig":326,"spinda":327,"trapinch":328,"vibrava":329,"flygon":330,"cacnea":331,"cacturne":332,"swablu":333,"altaria":334,"zangoose":335,"seviper":336,"lunatone":337,"solrock":338,"barboach":339,"whiscash":340,"corphish":341,"crawdaunt":342,"baltoy":343,"claydol":344,"lileep":345,"cradily":346,"anorith":347,"armaldo":348,"feebas":349,"milotic":350,"castform":351,"kecleon":352,"shuppet":353,"banette":354,"duskull":355,"dusclops":356,"tropius":357,"chimecho":358,"absol":359,"wynaut":360,"snorunt":361,"glalie":362,"spheal":363,"sealeo":364,"walrein":365,"clamperl":366,"huntail":367,"gorebyss":368,"relicanth":369,"luvdisc":370,"bagon":371,"shelgon":372,"salamence":373,"beldum":374,"metang":375,"metagross":376,"regirock":377,"regice":378,"registeel":379,"latias":380,"latios":381,"kyogre":382,"groudon":383,"rayquaza":384,"jirachi":385,"deoxys":386,"turtwig":387,"grotle":388,"torterra":389,"chimchar":390,"monferno":391,"infernape":392,"piplup":393,"prinplup":394,"empoleon":395,"starly":396,"staravia":397,"staraptor":398,"bidoof":399,"bibarel":400,"kricketot":401,"kricketune":402,"shinx":403,"luxio":404,"luxray":405,"budew":406,"roserade":407,"cranidos":408,"rampardos":409,"shieldon":410,"bastiodon":411,"burmy":412,"wormadam":413,"mothim":414,"combee":415,"vespiquen":416,"pachirisu":417,"buizel":418,"floatzel":419,"cherubi":420,"cherrim":421,"shellos":422,"gastrodon":423,"ambipom":424,"drifloon":425,"drifblim":426,"buneary":427,"lopunny":428,"mismagius":429,"honchkrow":430,"glameow":431,"purugly":432,"chingling":433,"stunky":434,"skuntank":435,"bronzor":436,"bronzong":437,"bonsly":438,"mime-jr":439,"happiny":440,"chatot":441,"spiritomb":442,"gible":443,"gabite":444,"garchomp":445,"munchlax":446,"riolu":447,"lucario":448,"hippopotas":449,"hippowdon":450,"skorupi":451,"drapion":452,"croagunk":453,"toxicroak":454,"carnivine":455,"finneon":456,"lumineon":457,"mantyke":458,"snover":459,"abomasnow":460,"weavile":461,"magnezone":462,"lickilicky":463,"rhyperior":464,"tangrowth":465,"electivire":466,"magmortar":467,"togekiss":468,"yanmega":469,"leafeon":470,"glaceon":471,"gliscor":472,"mamoswine":473,"porygon-z":474,"gallade":475,"probopass":476,"dusknoir":477,"froslass":478,"rotom":479,"uxie":480,"mesprit":481,"azelf":482,"dialga":483,"palkia":484,"heatran":485,"regigigas":486,"giratina":487,"cresselia":488,"phione":489,"manaphy":490,"darkrai":491,"shaymin":492,"arceus":493,"victini":494,"snivy":495,"servine":496,"serperior":497,"tepig":498,"pignite":499,"emboar":500,"oshawott":501,"dewott":502,"samurott":503,"patrat":504,"watchog":505,"lillipup":506,"herdier":507,"stoutland":508,"purrloin":509,"liepard":510,"pansage":511,"simisage":512,"pansear":513,"simisear":514,"panpour":515,"simipour":516,"munna":517,"musharna":518,"pidove":519,"tranquill":520,"unfezant":521,"blitzle":522,"zebstrika":523,"roggenrola":524,"boldore":525,"gigalith":526,"woobat":527,"swoobat":528,"drilbur":529,"excadrill":530,"audino":531,"timburr":532,"gurdurr":533,"conkeldurr":534,"tympole":535,"palpitoad":536,"seismitoad":537,"throh":538,"sawk":539,"sewaddle":540,"swadloon":541,"leavanny":542,"venipede":543,"whirlipede":544,"scolipede":545,"cottonee":546,"whimsicott":547,"petilil":548,"lilligant":549,"basculin-red-striped":550,"sandile":551,"krokorok":552,"krookodile":553,"darumaka":554,"darmanitan":555,"maractus":556,"dwebble":557,"crustle":558,"scraggy":559,"scrafty":560,"sigilyph":561,"yamask":562,"cofagrigus":563,"tirtouga":564,"carracosta":565,"archen":566,"archeops":567,"trubbish":568,"garbodor":569,"zorua":570,"zoroark":571,"minccino":572,"cinccino":573,"gothita":574,"gothorita":575,"gothitelle":576,"solosis":577,"duosion":578,"reuniclus":579,"ducklett":580,"swanna":581,"vanillite":582,"vanillish":583,"vanilluxe":584,"deerling":585,"sawsbuck":586,"emolga":587,"karrablast":588,"escavalier":589,"foongus":590,"amoonguss":591,"frillish":592,"jellicent":593,"alomomola":594,"joltik":595,"galvantula":596,"ferroseed":597,"ferrothorn":598,"klink":599,"klang":600,"klinklang":601,"tynamo":602,"eelektrik":603,"eelektross":604,"elgyem":605,"beheeyem":606,"litwick":607,"lampent":608,"chandelure":609,"axew":610,"fraxure":611,"haxorus":612,"cubchoo":613,"beartic":614,"cryogonal":615,"shelmet":616,"accelgor":617,"stunfisk":618,"mienfoo":619,"mienshao":620,"druddigon":621,"golett":622,"golurk":623,"pawniard":624,"bisharp":625,"bouffalant":626,"rufflet":627,"braviary":628,"vullaby":629,"mandibuzz":630,"heatmor":631,"durant":632,"deino":633,"zweilous":634,"hydreigon":635,"larvesta":636,"volcarona":637,"cobalion":638,"terrakion":639,"virizion":640,"tornadus":641,"thundurus":642,"reshiram":643,"zekrom":644,"landorus":645,"kyurem":646,"keldeo":647,"meloetta":648,"genesect":649,"chespin":650,"quilladin":651,"chesnaught":652,"fennekin":653,"braixen":654,"delphox":655,"froakie":656,"frogadier":657,"greninja":658,"bunnelby":659,"diggersby":660,"fletchling":661,"fletchinder":662,"talonflame":663,"scatterbug":664,"spewpa":665,"vivillon":666,"litleo":667,"pyroar":668,"flabebe":669,"floette":670,"florges":671,"skiddo":672,"gogoat":673,"pancham":674,"pangoro":675,"furfrou":676,"espurr":677,"meowstic":678,"honedge":679,"doublade":680,"aegislash":681,"spritzee":682,"aromatisse":683,"swirlix":684,"slurpuff":685,"inkay":686,"malamar":687,"binacle":688,"barbaracle":689,"skrelp":690,"dragalge":691,"clauncher":692,"clawitzer":693,"helioptile":694,"heliolisk":695,"tyrunt":696,"tyrantrum":697,"amaura":698,"aurorus":699,"sylveon":700,"hawlucha":701,"dedenne":702,"carbink":703,"goomy":704,"sliggoo":705,"goodra":706,"klefki":707,"phantump":708,"trevenant":709,"pumpkaboo":710,"gourgeist":711,"bergmite":712,"avalugg":713,"noibat":714,"noivern":715,"xerneas":716,"yveltal":717,"zygarde":718,"diancie":719,"hoopa":720,"volcanion":721,"rowlet":722,"dartrix":723,"decidueye":724,"litten":725,"torracat":726,"incineroar":727,"popplio":728,"brionne":729,"primarina":730,"pikipek":731,"trumbeak":732,"toucannon":733,"yungoos":734,"gumshoos":735,"grubbin":736,"charjabug":737,"vikavolt":738,"crabrawler":739,"crabominable":740,"oricorio":741,"cutiefly":742,"ribombee":743,"rockruff":744,"lycanroc":745,"wishiwashi":746,"mareanie":747,"toxapex":748,"mudbray":749,"mudsdale":750,"dewpider":751,"araquanid":752,"fomantis":753,"lurantis":754,"morelull":755,"shiinotic":756,"salandit":757,"salazzle":758,"stufful":759,"bewear":760,"bounsweet":761,"steenee":762,"tsareena":763,"comfey":764,"oranguru":765,"passimian":766,"wimpod":767,"golisopod":768,"sandygast":769,"palossand":770,"pyukumuku":771,"type-null":772,"silvally":773,"minior":774,"komala":775,"turtonator":776,"togedemaru":777,"mimikyu":778,"bruxish":779,"drampa":780,"dhelmise":781,"jangmo-o":782,"hakamo-o":783,"kommo-o":784,"tapu-koko":785,"tapu-lele":786,"tapu-bulu":787,"tapu-fini":788,"cosmog":789,"cosmoem":790,"solgaleo":791,"lunala":792,"nihilego":793,"buzzwole":794,"pheromosa":795,"xurkitree":796,"celesteela":797,"kartana":798,"guzzlord":799,"necrozma":800,"magearna":801,"marshadow":802,"poipole":803,"naganadel":804,"stakataka":805,"blacephalon":806,"zeraora":807,"meltan":808,"melmetal":809,"grookey":810,"thwackey":811,"rillaboom":812,"scorbunny":813,"raboot":814,"cinderace":815,"sobble":816,"drizzile":817,"inteleon":818,"skwovet":819,"greedent":820,"rookidee":821,"corvisquire":822,"corviknight":823,"blipbug":824,"dottler":825,"orbeetle":826,"nickit":827,"thievul":828,"gossifleur":829,"eldegoss":830,"wooloo":831,"dubwool":832,"chewtle":833,"drednaw":834,"yamper":835,"boltund":836,"rolycoly":837,"carkol":838,"coalossal":839,"applin":840,"flapple":841,"appletun":842,"silicobra":843,"sandaconda":844,"cramorant":845,"arrokuda":846,"barraskewda":847,"toxel":848,"toxtricity":849,"sizzlipede":850,"centiskorch":851,"clobbopus":852,"grapploct":853,"sinistea":854,"polteageist":855,"hatenna":856,"hattrem":857,"hatterene":858,"impidimp":859,"morgrem":860,"grimmsnarl":861,"obstagoon":862,"perrserker":863,"cursola":864,"sirfetchd":865,"mr-rime":866,"runerigus":867,"milcery":868,"alcremie":869,"falinks":870,"pincurchin":871,"snom":872,"frosmoth":873,"stonjourner":874,"eiscue":875,"indeedee":876,"morpeko":877,"cufant":878,"copperajah":879,"dracozolt":880,"arctozolt":881,"dracovish":882,"arctovish":883,"duraludon":884,"dreepy":885,"drakloak":886,"dragapult":887,"zacian":888,"zamazenta":889,"eternatus":890,"kubfu":891,"urshifu":892,"zarude":893,"regieleki":894,"regidrago":895,"glastrier":896,"spectrier":897,"calyrex":898,"wyrdeer":899,"kleavor":900,"ursaluna":901,"basculegion":902,"sneasler":903,"overqwil":904,"enamorus":905,"sprigatito":906,"floragato":907,"meowscarada":908,"fuecoco":909,"crocalor":910,"skeledirge":911,"quaxly":912,"quaxwell":913,"quaquaval":914,"lechonk":915,"oinkologne":916,"tarountula":917,"spidops":918,"nymble":919,"lokix":920,"pawmi":921,"pawmo":922,"pawmot":923,"tandemaus":924,"maushold":925,"fidough":926,"dachsbun":927,"smoliv":928,"dolliv":929,"arboliva":930,"squawkabilly":931,"nacli":932,"naclstack":933,"garganacl":934,"charcadet":935,"armarouge":936,"ceruledge":937,"tadbulb":938,"bellibolt":939,"wattrel":940,"kilowattrel":941,"maschiff":942,"mabosstiff":943,"shroodle":944,"grafaiai":945,"bramblin":946,"brambleghast":947,"toedscool":948,"toedscruel":949,"klawf":950,"capsakid":951,"scovillain":952,"rellor":953,"rabsca":954,"flittle":955,"espathra":956,"tinkatink":957,"tinkatuff":958,"tinkaton":959,"wiglett":960,"wugtrio":961,"bombirdier":962,"finizen":963,"palafin":964,"varoom":965,"revavroom":966,"cyclizar":967,"orthworm":968,"glimmet":969,"glimmora":970,"greavard":971,"houndstone":972,"flamigo":973,"cetoddle":974,"cetitan":975,"veluza":976,"dondozo":977,"tatsugiri":978,"annihilape":979,"clodsire":980,"farigiraf":981,"dudunsparce":982,"kingambit":983,"great-tusk":984,"scream-tail":985,"brute-bonnet":986,"flutter-mane":987,"slither-wing":988,"sandy-shocks":989,"iron-treads":990,"iron-bundle":991,"iron-hands":992,"iron-jugulis":993,"iron-moth":994,"iron-thorns":995,"frigibax":996,"arctibax":997,"baxcalibur":998,"gimmighoul":999,"gholdengo":1000,"wo-chien":1001,"chien-pao":1002,"ting-lu":1003,"chi-yu":1004,"roaring-moon":1005,"iron-valiant":1006,"koraidon":1007,"miraidon":1008,"walking-wake":1009,"iron-leaves":1010,"dipplin":1011,"poltchageist":1012,"sinistcha":1013,"okidogi":1014,"munkidori":1015,"fezandipiti":1016,"ogerpon":1017,"archaludon":1018,"hydrapple":1019,"gouging-fire":1020,"raging-bolt":1021,"iron-boulder":1022,"iron-crown":1023,"terapagos":1024,"pecharunt":1025};function resolvePkmIconRepo(el,icon,shiny){
  var fn=String(icon||'').toLowerCase().replace(/\.(gif|png)$/,'');
  if(!fn){el.classList.add('no-img');el.style.backgroundImage='none';el.textContent='?';el.removeAttribute('data-icon');return;}
  fn=fixSlug(fn);
  fn=fn.replace(/-(regional-a|regional-g|regional-h|regional-p)$/,function(_,x){
    return ({'regional-a':'-alola','regional-g':'-galar','regional-h':'-hisui','regional-p':'-paldea'})[x];
  });
  var sel=(pkmSource==='showdown')?'showdown':'pokeos';
  var other=(sel==='showdown')?'pokeos':'showdown';
  var order=[['animated',sel],['animated',other],['static',sel],['static',other]];
  function candsFor(src){
    var base=pkmDefaultFormBase(fn);
    var a=src==='pokeos'?[fn]:slugCandidates(fn);
    if(base&&base!==fn){var b=src==='pokeos'?[base]:slugCandidates(base);for(var i=0;i<b.length;i++){if(a.indexOf(b[i])<0)a.push(b[i]);}}
    return a;
  }
  var si=0,ci=0,cands=candsFor(order[0][1]);
  function apply(u){el.style.backgroundImage="url('"+u+"')";el.classList.remove('no-img');el.textContent='';el.removeAttribute('data-icon');setCachedIcon(icon,shiny,u);}
  function fail(){el.classList.add('no-img');el.style.backgroundImage='none';el.textContent='?';el.removeAttribute('data-icon');}
  function next(){
    if(!cands||ci>=cands.length){ci=0;cands=null;si++;}
    if(si>=order.length){fail();return;}
    if(!cands){cands=candsFor(order[si][1]);}
    var o=order[si];
    var u=pkmRepoUrl(o[0],o[1],cands[ci],shiny);
    ci++;
    var im=noRefImg();
    im.onload=function(){apply(u);};
    im.onerror=next;
    im.src=u;
  }
  next();
}
function resolvePkmIcon(el,icon,shiny){
  resolvePkmIconRepo(el,icon,shiny);
}function hudSpriteProviders(){
  var sb=String(PKM_SPRITE_BASE||'https://play.pokemonshowdown.com/sprites/');
  var pm=(PA_POKE_MIRRORS&&PA_POKE_MIRRORS.length)?PA_POKE_MIRRORS.slice():[
    'https://cdn.jsdelivr.net/gh/PokeAPI/sprites@master/sprites/pokemon/',
    'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/'
  ];
  var pkosEnc=encodeURIComponent(PKM_POKEOS_S3+'animated/');
  var pkosEncS=encodeURIComponent(PKM_POKEOS_S3+'animated/shiny/');
  var out=[
    {id:'hud-pokeos-home128',name:'HUD · pokeos HOME 动图 128px',site:'pokeos',kind:'gif',dynamic:true,normalTemplate:PKM_POKEOS_PROXY+pkosEnc+'{id}.gif&w='+PKM_POKEOS_W+'&n=-1',shinyTemplate:PKM_POKEOS_PROXY+pkosEncS+'{id}.gif&w='+PKM_POKEOS_W+'&n=-1',baseUrl:'https://assets.pokeos.com/pokemon/home/animated/'},
    {id:'hud-showdown-ani',name:'HUD · Pokémon Showdown 动态 GIF',site:'Pokémon Showdown',kind:'gif',dynamic:true,normalTemplate:sb+'ani/{slug}.gif',shinyTemplate:sb+'ani-shiny/{slug}.gif',baseUrl:sb},
    {id:'hud-showdown-gen5',name:'HUD · Pokémon Showdown Gen5 PNG',site:'Pokémon Showdown',kind:'png',dynamic:false,normalTemplate:sb+'gen5/{slug}.png',shinyTemplate:sb+'gen5-shiny/{slug}.png',baseUrl:sb}
  ];
  for(var i=0;i<pm.length;i++){
    var id=i===0?'hud-pokeapi-jsdelivr':(i===1?'hud-pokeapi-fastly':(i===2?'hud-pokeapi-gitmirror':'hud-pokeapi-raw'));
    var nm=i===0?'HUD · PokeAPI jsDelivr':(i===1?'HUD · PokeAPI Fastly':(i===2?'HUD · PokeAPI GitMirror':'HUD · PokeAPI Raw GitHub'));
    out.push({id:id,name:nm,site:'PokeAPI sprites',kind:'png',dynamic:false,normalTemplate:pm[i]+'{id}.png',shinyTemplate:pm[i]+'shiny/{id}.png',baseUrl:pm[i]});
  }
  return out;
}
function hudBuildPokemonSpriteUrls(opt){
  opt=opt&&typeof opt==='object'?opt:{};
  var providerId=String(opt.providerId||'hud-showdown-ani');
  var rawSlug=String(opt.slug||opt.pokemonSlug||opt.englishName||opt.name||'').trim();
  var slug=fixSlug(normSlug(rawSlug));
  var cands=slug?slugCandidates(slug):[];
  if(!cands.length&&slug)cands=[slug];
  var id=parseInt(opt.pokemonApiId||opt.id||opt.speciesDex||opt.dex||0,10)||0;
  var providers=hudSpriteProviders(),p=null;
  for(var i=0;i<providers.length;i++){if(providers[i].id===providerId){p=providers[i];break;}}
  if(!p)p=providers[0];
  function fill(tpl,s){return String(tpl||'').replace(/\{slug\}/g,s||'').replace(/\{id\}/g,String(id||''));}
  var primarySlug=cands[0]||slug,normal=fill(p.normalTemplate,primarySlug),shiny=fill(p.shinyTemplate,primarySlug);
  var normalCandidates=[],shinyCandidates=[];
  if(String(p.normalTemplate||'').indexOf('{slug}')>=0){
    for(var j=0;j<cands.length;j++){normalCandidates.push(fill(p.normalTemplate,cands[j]));shinyCandidates.push(fill(p.shinyTemplate,cands[j]));}
  }else if(id){normalCandidates=[normal];shinyCandidates=[shiny];}
  return {providerId:p.id,providerName:p.name,site:p.site||'',kind:p.kind||'',dynamic:!!p.dynamic,slug:primarySlug,pokemonApiId:id,normal:normal,shiny:shiny,normalCandidates:normalCandidates,shinyCandidates:shinyCandidates};
}
function noRefImg(){var im=new Image();try{im.referrerPolicy='no-referrer';}catch(e){}return im;}
var PKM_SPRITE_REPO_BASE='https://raw.githubusercontent.com/xianjiu0926/Pokemon/main/pokemon-sprites/';
function pkmRepoFormSuf(f){
  var m={'-regional-a':'-alola','-regional-g':'-galar','-regional-h':'-hisui','-regional-p':'-paldea'};
  return (f in m)?m[f]:(f||'');
}
function pkmRepoUrl(kind,src,slug,shiny){
  return PKM_SPRITE_REPO_BASE+kind+'/'+src+'/'+(shiny?'shiny':'normal')+'/'+slug+(kind==='animated'?'.gif':'.png');
}
function pkmSrcSlugs(src,slug,form){
  if(src==='pokeos'){return [slug+form];}
  var sf=String(form||'').replace('-mega-x','-megax').replace('-mega-y','-megay').replace('-mega-z','-megaz');
  return slugCandidates(slug+sf);
}
function resolvePkmBgRepo(el,slug,shiny,name){
  var p=name?pkmFormParse(name):{base:'',form:''};
  var paSuf=pkmRepoFormSuf(p.form);
  var sel=(pkmSource==='showdown')?'showdown':'pokeos';
  var other=(sel==='showdown')?'pokeos':'showdown';
  var order=[['animated',sel],['animated',other],['static',sel],['static',other]];
  var useBase=false,si=0,ci=0,cands=pkmSrcSlugs(order[0][1],slug,paSuf);
  function apply(url){
    el.style.backgroundImage="url('"+url+"')";
    el.classList.remove('no-img');
    el.textContent='';
    el.removeAttribute('data-pkm');
    if(name){setCachedSprite(name,shiny,url);}
  }
  function fail(){el.classList.add('no-img');el.style.backgroundImage='none';el.textContent='?';}
  function next(){
    if(!cands||ci>=cands.length){ci=0;cands=null;si++;}
    if(si>=order.length){
      if(paSuf&&!useBase){useBase=true;si=0;ci=0;cands=null;}
      else{fail();return;}
    }
    if(!cands){cands=pkmSrcSlugs(order[si][1],slug,useBase?'':paSuf);}
    var o=order[si];
    var u=pkmRepoUrl(o[0],o[1],cands[ci],shiny);
    ci++;
    var im=noRefImg();
    im.onload=function(){apply(u);};
    im.onerror=next;
    im.src=u;
  }
  next();
}function resolvePkmBg(el,slug,shiny,name){
  resolvePkmBgRepo(el,slug,shiny,name);
}
function pkImgFix(scope){
  var els=(scope||document).querySelectorAll('.pk-img');
  for(var i=0;i<els.length;i++){
    (function(el){
      var bg=el.style.backgroundImage||'';
      var m=bg.match(/url\u0028['"]?([^'")]+)['"]?\u0029/);
      if(!m)return;
      var u=m[1];
      if(u.indexOf('play.pokemonshowdown.com/sprites/ani')<0)return;
      var fn=u.split('/').pop().replace(/\.(png|gif)$/,'');
      var shiny=u.indexOf('/ani-shiny/')>=0;
      resolvePkmBg(el,fn,shiny);
    })(els[i]);
  }
}
var BADGE_MIRRORS=[
  'https://cdn.jsdelivr.net/gh/feixianer/pokemon-badges@main/',
  'https://fastly.jsdelivr.net/gh/feixianer/pokemon-badges@main/',
  'https://raw.gitmirror.com/feixianer/pokemon-badges/main/',
  'https://raw.githubusercontent.com/feixianer/pokemon-badges/main/'
];
var BADGE_DIR={'关都':'guandu','城都':'chengdu','丰缘':'fengyuan','神奥':'shenao','合众':'hezhong','卡洛斯':'kaluosi','伽勒尔':'jialeer','帕底亚':'padiya'};
var BADGE_MAP={'关都':[[1,'岩石','灰色徽章','深灰市'],[2,'水','蓝色徽章','华蓝市'],[3,'电','橙色徽章','枯叶市'],[4,'草','彩虹徽章','玉虹市'],[5,'毒','粉红徽章','浅红市'],[6,'超能力','金黄徽章','金黄市'],[7,'火','深红徽章','红莲镇'],[8,'地面','绿色徽章','常青市']],'城都':[[1,'飞行','飞翼徽章','桔梗市'],[2,'虫','昆虫徽章','桧皮镇'],[3,'一般','常规徽章','满金市'],[4,'幽灵','幻影徽章','圆珠市'],[5,'格斗','打击徽章','湛蓝市'],[6,'钢','钢铁徽章','浅葱市'],[7,'冰','冰雪徽章','卡吉镇'],[8,'龙','升龙徽章','烟墨市']],'丰缘':[[1,'岩石','岩石徽章','卡那兹市'],[2,'格斗','拳击徽章','武斗镇'],[3,'电','电力徽章','紫堇市'],[4,'火','烈焰徽章','釜炎镇'],[5,'一般','天秤徽章','橙华市'],[6,'飞行','白羽徽章','茵郁市'],[7,'超能力','心灵徽章','绿岭市'],[8,'水','雨滴徽章','琉璃市']],'神奥':[[1,'岩石','石炭徽章','黑金市'],[2,'草','森林徽章','百代市'],[3,'格斗','铺石徽章','帷幕市'],[4,'水','湿地徽章','野原市'],[5,'幽灵','遗迹徽章','家缘市'],[6,'钢','矿山徽章','水脉市'],[7,'冰','冰河徽章','雪峰市'],[8,'电','灯塔徽章','滨海市']],'合众':[[1,'草/火/水','三元徽章','三曜市'],[2,'一般','基础徽章','七宝市'],[3,'毒','毒烟徽章','立涌市'],[4,'虫','甲虫徽章','飞云市'],[5,'电','伏特徽章','雷文市'],[6,'地面','震动徽章','帆巴市'],[7,'飞行','喷射徽章','吹寄市'],[8,'冰','冰柱徽章','雪花市'],[9,'龙','传说徽章','双龙市'],[10,'水','海浪徽章','青海波市']],'卡洛斯':[[1,'虫','虫虫徽章','白檀市'],[2,'岩石','崖壁徽章','遥香市'],[3,'格斗','战斗徽章','娑罗市'],[4,'草','植物徽章','比翼市'],[5,'电','电压徽章','密阿雷市'],[6,'妖精','妖精徽章','香薰市'],[7,'超能力','幻彩徽章','百刻市'],[8,'冰','冰山徽章','映雪市']],'伽勒尔':[[1,'草','草之徽章','草路镇'],[2,'水','水之徽章','水舟镇'],[3,'火','火之徽章','机擎市'],[4,'格斗','格斗徽章','溯传镇'],[5,'幽灵','幽灵徽章','溯传镇'],[6,'妖精','妖精徽章','舞姿镇'],[7,'岩石','岩石徽章','战竞镇'],[8,'冰','冰之徽章','战竞镇'],[9,'恶','恶之徽章','尖钉镇'],[10,'龙','龙之徽章','拳关市']],'帕底亚':[[1,'虫','虫之徽章','圆模镇'],[2,'草','草之徽章','深钵镇'],[3,'水','水之徽章','玻瓶市'],[4,'电','电之徽章','酿光市'],[5,'一般','一般徽章','锦汇市'],[6,'冰','冰之徽章','霜抹山'],[7,'幽灵','幽灵徽章','冰柜镇'],[8,'超能力','超能徽章','焙固镇']]};
var badgeSel=null;
var badgeMinHCache=0;
function badgeMinH(){if(badgeMinHCache)return badgeMinHCache;var d=document.createElement('div');d.className='badge-grid';d.style.cssText='position:absolute;visibility:hidden;left:-9999px;top:0;width:100%;';var tab=BADGE_MAP['合众']||[];var rec={region:'合众',list:[],cnt:0};d.innerHTML=tab.map(function(e,i){return badgeImg('合众',e,badgeGot(rec,e,i),true);}).join('');document.body.appendChild(d);badgeMinHCache=d.offsetHeight||0;if(d.parentNode)d.parentNode.removeChild(d);return badgeMinHCache;}
function cityKey(s){var t=String(s||'').trim();if(t.length>1&&'市镇岛村町山'.indexOf(t.charAt(t.length-1))>=0)t=t.slice(0,-1);var A={'超能':'超能力','念力':'超能力','普通':'一般','电气':'电','鬼':'幽灵','暗':'恶','仙子':'妖精','武斗':'格斗','钢铁':'钢','岩':'岩石','昆虫':'虫','冰系':'冰','大地':'地面'};if(A[t])t=A[t];return t;}
function badgeCands(e){var out=[];String(e[1]).split('/').forEach(function(t){out.push(cityKey(t));});out.push(cityKey(e[2]));out.push(cityKey(String(e[2]).replace('徽章','')));out.push(cityKey(e[3]));return out;}
function badgeUrl(region,no){var d=BADGE_DIR[region];return d?BADGE_MIRRORS[0]+d+'/'+no+'.png':'';}
function badgeImgErr(el){
  var src=String(el.getAttribute('src')||'');
  var cur=-1,rel='';
  for(var i=0;i<BADGE_MIRRORS.length;i++){
    if(src.indexOf(BADGE_MIRRORS[i])===0){cur=i;rel=src.slice(BADGE_MIRRORS[i].length);break;}
  }
  if(cur<0){el.style.visibility='hidden';return;}
  if(cur<BADGE_MIRRORS.length-1){el.src=BADGE_MIRRORS[cur+1]+rel;return;}
  el.style.visibility='hidden';
}
try{WIN.badgeImgErr=badgeImgErr;WIN.itemImgErr=itemImgErr;}catch(e){}
if(WIN!==window){try{window.badgeImgErr=badgeImgErr;window.itemImgErr=itemImgErr;}catch(e){}}
function parseBadges(){var raw=String((stat_data.训练家&&stat_data.训练家.徽章)||''),out=[];raw.split('｜').join('|').split('|').forEach(function(seg){seg=String(seg).trim();if(!seg)return;var i=seg.indexOf(':');if(i<0)i=seg.indexOf('：');var region=(i<0?seg:seg.slice(0,i)).trim();var body=(i<0?'':seg.slice(i+1)).trim();var list=[],cnt=0;body.split('，').join(',').split('、').join(',').split(',').forEach(function(x){x=String(x).trim();if(!x)return;if(!isNaN(Number(x))){cnt=Number(x);}else{list.push(x);}});if(region)out.push({region:region,list:list,cnt:cnt});});return out;}
function badgeGot(r,e,idx){if(r.list.length){var c=badgeCands(e);for(var i=0;i<r.list.length;i++){if(c.indexOf(cityKey(r.list[i]))>=0)return true;}return false;}return idx<r.cnt;}
function badgeCount(r){var t=BADGE_MAP[r.region]||[];if(r.list.length)return r.list.length;return t.length?Math.min(r.cnt,t.length):r.cnt;}

function pickRegion(rs){if(!rs.length)return '';var saved=null;try{saved=JSON.parse(localStorage.getItem('pk_badge_sel')||'null');}catch(e){}if(saved&&saved.region){for(var i=0;i<rs.length;i++){if(rs[i].region===saved.region)return saved.region;}}return rs[rs.length-1].region;}
function badgeImg(region,e,got,big){var u=badgeUrl(region,e[0]),cls=got?'':' off';if(!u)return '<span class="badge-cell'+cls+'">·</span>';if(big)return '<div class="badge-item'+cls+'"><img src="'+esc(u)+'" onerror="badgeImgErr(this)"><span class="badge-name">'+esc(e[2])+'<br>'+esc(e[3])+'</span></div>';return '<span class="badge-cell'+cls+'" title="'+esc(e[2]+' · '+e[3]+' · '+e[1])+'"><img src="'+esc(u)+'" onerror="badgeImgErr(this)"></span>';}
function badgeRowHTML(){var rs=parseBadges();if(!rs.length)return '<div class="info-row" id="badge-entry"><span class="k">徽章</span><span class="v"><span class="dim">尚无徽章</span></span></div>';var reg=pickRegion(rs),cur=rs[0],i;for(i=0;i<rs.length;i++){if(rs[i].region===reg)cur=rs[i];}var tab=BADGE_MAP[cur.region]||[],cells='';if(tab.length){for(i=0;i<tab.length;i++){cells+=badgeImg(cur.region,tab[i],badgeGot(cur,tab[i],i),false);}}else{cells='<span class="dim">'+esc(cur.list.join(' '))+'</span>';}var more=rs.length>1?'<span class="badge-more">+'+(rs.length-1)+'个地区</span>':'';return '<div class="info-row block" id="badge-entry"><span class="k">徽章</span><span class="v"><div class="badge-line"><span class="badge-region" id="badge-cycle" title="点击切换地区">'+esc(cur.region)+(rs.length>1?' ⇄':'')+'<span class="badge-cnt"> '+badgeCount(cur)+'/'+(tab.length||badgeCount(cur))+'</span></span><span class="badge-row">'+cells+'</span>'+more+'<button class="btn-small" data-badge-open style="margin-left:auto;padding:2px 8px;font-size:.7rem">🏅 查看</button></div></span></div>';}
function badgePageHTML(){var rs=parseBadges(),regions=Object.keys(BADGE_MAP);var cur=badgeSel||pickRegion(rs)||regions[0];if(regions.indexOf(cur)<0)cur=regions[0];var tabs=regions.map(function(r){return '<button class="badge-tab'+(r===cur?' active':'')+'" data-bregion="'+esc(r)+'">'+esc(r)+'</button>';}).join('');var rec=null;rs.forEach(function(r){if(r.region===cur)rec=r;});if(!rec)rec={region:cur,list:[],cnt:0};var tab=BADGE_MAP[cur]||[],cells=tab.map(function(e,i){return badgeImg(cur,e,badgeGot(rec,e,i),true);}).join('');var mh=badgeMinH();return frame('徽章盒 '+esc(cur)+' '+badgeCount(rec)+'/'+tab.length,'<div class="badge-tabs">'+tabs+'</div><div class="badge-grid" style="min-height:'+mh+'px">'+cells+'</div>');}
function baseName(s){var t=String(s||'').trim(),i=t.indexOf('-');if(i>0)t=t.slice(0,i);var pre=['搭档','头目','霸主','闪光','原始回归','原始','超极巨化','超极巨','极巨化','极巨','太晶化','太晶','阿罗拉','伽勒尔','洗翠','帕底亚','Mega','mega'],go=true;while(go){go=false;for(var k=0;k<pre.length;k++){if(t.indexOf(pre[k])===0&&t.length>pre[k].length){t=t.slice(pre[k].length).trim();go=true;}}}return t;}
function addSpecies(o,n){n=baseName(n);if(n)o[n]=1;}
function ownedSpecies(){var o={},t=stat_data.队伍||{},k;for(k in t){if(t[k]&&t[k].名字&&t[k].名字!=='空')addSpecies(o,t[k].名字);}var b=stat_data.盒子||{};for(var bx in b){var sl=b[bx]||{};for(var p in sl){if(sl[p]&&sl[p].名字&&sl[p].名字!=='空')addSpecies(o,sl[p].名字);}}return o;}
function chatKey(){try{var w=WIN,ST=w&&w.SillyTavern,ctx=ST&&ST.getContext?ST.getContext():null;var cid=(ctx&&ctx.chatId)||'';return String(cid).replace(/[^a-zA-Z0-9_-]/g,'_');}catch(e){return '';}}
function seenKey(){return 'pk_seen_'+String((stat_data.训练家&&stat_data.训练家.名字)||'default')+'_'+chatKey();}
function loadSeen(){try{var o=JSON.parse(localStorage.getItem(seenKey())||'{}');return (o&&typeof o==='object')?o:{};}catch(e){return {};}}
function seenFullKey(){return 'pk_seenfull2_'+String((stat_data.训练家&&stat_data.训练家.名字)||'default')+'_'+chatKey();}
function loadSeenFull(){try{var o=JSON.parse(localStorage.getItem(seenFullKey())||'{}');return (o&&typeof o==='object')?o:{};}catch(e){return {};}}
function addFull(o,n,ic){
  var t=t2s(String(n||'').trim());
  var pre=['搭档','头目','霸主','闪光','太晶化','太晶','极巨化','极巨'],go=true;
  while(go){go=false;for(var k=0;k<pre.length;k++){if(t.indexOf(pre[k])===0&&t.length>pre[k].length){t=t.slice(pre[k].length).trim();go=true;}}}
  if(t)o[t]=1;
  var si=String(ic||'').toLowerCase(),rg='';
  if(si.indexOf('-alola')>=0||t.indexOf('阿罗拉')>=0||t.indexOf('阿羅拉')>=0)rg='阿罗拉';
  else if(si.indexOf('-galar')>=0||t.indexOf('伽勒尔')>=0||t.indexOf('伽勒爾')>=0)rg='伽勒尔';
  else if(si.indexOf('-hisui')>=0||t.indexOf('洗翠')>=0)rg='洗翠';
  else if(si.indexOf('-paldea')>=0||t.indexOf('帕底亚')>=0||t.indexOf('帕底亞')>=0)rg='帕底亚';
  if(rg){var b=baseName(t);if(b&&b!==t)o[b+'-'+rg]=1;}
}
function ownedFull(){
  var o={},t=stat_data.队伍||{},k;
  for(k in t){if(t[k]&&t[k].名字&&t[k].名字!=='空')addFull(o,t[k].名字,t[k].图标);}
  var b=stat_data.盒子||{};
  for(var bx in b){var sl=b[bx]||{};for(var p in sl){if(sl[p]&&sl[p].名字&&sl[p].名字!=='空')addFull(o,sl[p].名字,sl[p].图标);}}
  return o;
}
function recordSeen(){
  var s=loadSeen(),sf=loadSeenFull(),o=ownedSpecies(),of=ownedFull(),k;
  for(k in o){s[k]=1;}
  for(k in of){sf[k]=1;}
  var nb=stat_data.附近宝可梦||{};
  for(k in nb){if(nb[k]&&nb[k].名字){addSpecies(s,nb[k].名字);addFull(sf,nb[k].名字,nb[k].图标);}}
  var f=(stat_data.战场&&stat_data.战场.场上)||{};
  for(k in f){var sg=String(k).split('·');if(sg.length>1){var n=sg[1].split('(')[0].split('（')[0];addSpecies(s,n);addFull(sf,n,'');}}
  try{localStorage.setItem(seenKey(),JSON.stringify(s));}catch(e){}
  try{localStorage.setItem(seenFullKey(),JSON.stringify(sf));}catch(e){}
}
function hitSpecies(set,name){if(!name)return false;if(set[name])return true;if(name.length<2)return false;for(var k in set){if(k.indexOf(name)===0&&k.length>name.length){if(!/[\u4e00-\u9fff]/.test(k.slice(name.length)))return true;}}return false;}
function formSeen(set,f,base){
  if(f.region){
    var rk={'alola':'阿罗拉','galar':'伽勒尔','hisui':'洗翠','paldea':'帕底亚'}[f.region]||'';
    var rt={'alola':'阿羅拉','galar':'伽勒爾','hisui':'洗翠','paldea':'帕底亞'}[f.region]||'';
    if(!rk)return !!set[f.name];
    for(var k in set){
      if((k.indexOf(rk)>=0||(rt&&k.indexOf(rt)>=0))&&k.indexOf(base)>=0)return true;
    }
    return false;
  }
  if(f.formKey){
    if(set[f.name])return true;
    return false;
  }
  if(set[base])return true;
  for(var k2 in set){
    if(k2.indexOf(base)===0&&k2.length>base.length&&!/[\u4e00-\u9fff]/.test(k2.slice(base.length))){
      if(k2.indexOf('阿罗拉')<0&&k2.indexOf('阿羅拉')<0&&k2.indexOf('伽勒尔')<0&&k2.indexOf('伽勒爾')<0&&k2.indexOf('洗翠')<0&&k2.indexOf('帕底亚')<0&&k2.indexOf('帕底亞')<0)return true;
    }
  }
  return false;
}
function num(v,d){var n=parseInt(v,10);return isNaN(n)?d:n;}
function esc(s){s=String(s==null?'':s);s=s.replace(/&/g,'&amp;');s=s.replace(/</g,'&lt;');s=s.replace(/>/g,'&gt;');return s;}
function parseHP(s){var p=String(s||'0/0').split('/');return{cur:num(p[0],0),max:num(p[1],0)};}
function genderOf(g){var s=String(g||'');if(s==='♂'||s==='雄性'||s==='男'||s==='公'||s==='M'||s==='m'||s==='male')return{sym:'♂',cls:'m'};if(s==='♀'||s==='雌性'||s==='女'||s==='母'||s==='F'||s==='f'||s==='female')return{sym:'♀',cls:'f'};return{sym:'',cls:'none'};}
function statusTag(s){s=String(s||'').trim();if(!s||s==='无'||s==='正常')return '';var m={'麻痹':'par','剧毒':'psn','中毒':'psn','灼伤':'brn','烧伤':'brn','睡眠':'slp','冰冻':'frz','混乱':'cnf','畏缩':'cnf'},c='bad';for(var k in m){if(s.indexOf(k)>=0){c=m[k];break;}}return '<span class="ailment '+c+'">'+esc(s)+'</span>';}
function battleStatusFor(pkm){
  try{
    var field=(stat_data.战场&&stat_data.战场.场上)||{};
    var name=String(pkm.名字||'');
    if(!name)return '';
    var bare=name.replace(/^(头目|霸主|搭档)\s*/,'');
    for(var key in field){
      if(key.indexOf('我方')<0)continue;
      if(key.indexOf(name)<0&&(!bare||key.indexOf(bare)<0))continue;
      var segs=String(field[key]||'').split(/[｜|]/);
      for(var j=0;j<segs.length;j++){
        var s=segs[j].trim();
        if(s.indexOf('状态')===0){
          var st=s.replace(/^状态[：:\s]*/,'').trim();
          return (st&&st!=='无')?st:'';
        }
      }
      return '';
    }
  }catch(e){}
  return '';
}
function cardFromPkm(p,slot,where,boxName){var hp=parseHP(p.HP);return{slot:slot||'',where:where||'team',boxName:boxName||'',empty:false,name:p.昵称||p.名字,species:p.名字,level:num(p.等级,1),hpCur:hp.cur,hpMax:hp.max,gender:p.性别||'',shiny:!!p.是否闪光,status:battleStatusFor(p),icon:p.图标||'',exp:p.经验||'',attr1:p.属性1||'',attr2:p.属性2||'',skills:p.技能||'',nature:p.性格||'',ability:p.特性||'',item:p.携带道具||'',itemEn:p.携带道具英文||'',iv:p.个体值||'',ball:p.精灵球||'',ballEn:p.精灵球英文||'',partner:p.搭档倾向||'',intimacy:p.亲密度||'',hatch:p.孵化剩余||''};}
function buildCards(){var out=[];for(var i=1;i<=6;i++){var p=(stat_data.队伍&&stat_data.队伍[String(i)])||{名字:'空'};if(p.名字&&p.名字!=='空'){out.push(cardFromPkm(p,i,'team',''));}else{out.push({slot:i,empty:true});}}return out;}

var svgFrame='<svg class="card-bg-svg" viewBox="0 0 100 100" preserveAspectRatio="none"><polygon points="7,1.5 98.5,1.5 98.5,74 93,98.5 1.5,98.5 1.5,26" fill="rgba(127,116,232,0.25)" stroke="#7d95b5" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round"/></svg>';

function cardHTML(c){
  if(c.empty){return '<div class="empty-frame">'+svgFrame+'<div class="empty-inner"><span class="empty-txt">空位 '+c.slot+'</span></div></div>';}
  var gi=genderOf(c.gender);var ail=statusTag(c.status);var pct=c.hpMax>0?Math.max(0,Math.min(100,c.hpCur/c.hpMax*100)):0;var hpCls=pct>=50?'hp-high':pct>=20?'hp-mid':'hp-low';
  var dead=c.hpMax>0&&c.hpCur<=0;
  var fnt=dead?'<span class="ailment fnt">圈圈眼</span>':'';
  var ex=parseHP(c.exp);var expPct=ex.max>0?Math.max(0,Math.min(100,ex.cur/ex.max*100)):0;
  var img=pkImgHTML(c.species,c.icon,c.shiny,(dead?'fainted':''));
  var itName=(c.item&&c.item!=='无')?c.item:'';
  var isMega=/mega|超级|超进化|超級|超進化/i.test(c.name+' '+c.species);
  var isGmax=/极巨|極巨|gmax|dynamax/i.test(c.name+' '+c.species);
  var isGigantamax=/超极巨|超極巨|gmax|gigantamax/i.test(c.name+' '+c.species);
  var isTotem=/霸主|头目|頭目/i.test(c.name+' '+c.species);
var diyIt=itName?diyGet('item',itName):null;
var diyImg=(diyIt&&diyIt.img)?String(diyIt.img).trim():'';
var diyImgOk=diyImg&&(diyImg.indexOf(HUD_DIY_SCHEME)===0||/^data:image\//i.test(diyImg)||/^https?:\/\//i.test(diyImg)||/^blob:/i.test(diyImg));
var ov=itemImgOf(itName);
var itemImg;
if(!itName){itemImg='';}
else if(diyImgOk){itemImg=hudDiyImgTag(diyImg,'class="item-badge" onerror="itemImgErr(this)"');}
else if(ov!==undefined){itemImg=ov?'<img class="item-badge" src="'+esc(ov)+'" onerror="itemImgErr(this)">':'<span class="item-badge">?</span>';}
else{itemImg='<span class="item-badge item-wiki" data-item="'+esc(itName)+'" data-item-en="'+esc(c.itemEn||'')+'" data-cls="item-badge">?</span>';}
  return '<div class="card-frame" data-slot="'+c.slot+'">'+(isGmax?'<svg class="card-bg-svg" viewBox="0 0 100 100" preserveAspectRatio="none"><polygon points="7,1.5 98.5,1.5 98.5,74 93,98.5 1.5,98.5 1.5,26" fill="#D70645" fill-opacity="0.65" stroke="#7d95b5" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round"/></svg>':svgFrame)+'<div class="card-inner"><div class="pk-top"><div class="pk-side">'+img+'</div><div class="pk-info"><div class="name-row"><span class="pk-left"><span class="pk-name">'+esc(c.name)+'</span></span><span class="gender-side">'+(ail||'')+fnt+(isMega?'<img class="mega-ic" style="font-size:clamp(.74rem,2.8vw,.88rem)" src="https://img.baibai.cv/f/YNBKTy/1788349081288.png" onerror="this.remove()">':'')+(isGigantamax?'<img class="mega-ic" style="font-size:clamp(.74rem,2.8vw,.88rem)" src="https://img.baibai.cv/f/GKpwto/1788410257587.png" onerror="this.remove()">':'')+'<span class="gender-sym '+gi.cls+'">'+gi.sym+'</span></span></span></div><div class="bar-row"><span class="hp-label">HP</span><div class="bar-stack"><div class="hp-bar"><div class="hp-fill '+hpCls+'" style="width:'+pct+'%"></div></div><div class="exp-bar"><div class="exp-fill" style="width:'+expPct+'%"></div></div></div></div></div></div><div class="bottom-row"><span class="pk-lv-wrap"><span class="pk-level">Lv.'+c.level+'</span>'+itemImg+'</span><span class="hp-num">'+c.hpCur+'/'+c.hpMax+'</span></div></div></div>';
}
function frame(title,content){return '<div class="info-frame plain-frame"><div class="info-inner"><div class="info-title">'+title+'</div>'+content+'</div></div>';}function frameP(title,content){return '<div class="info-frame plain-frame"><div class="info-inner"><div class="info-title">'+title+'</div>'+content+'</div></div>';}
function infoRow(k,v){return '<div class="info-row"><span class="k">'+k+'</span><span class="v">'+v+'</span></div>';}

function teamHTML(){var cards=buildCards();var left=cards.slice(0,3).map(cardHTML).join('');var right=cards.slice(3,6).map(cardHTML).join('');return '<div class="grid"><div class="col col-left">'+left+'</div><div class="col col-right">'+right+'</div></div>';}
function trainerHTML(){return bw2TrainerHTML();}
function envStripHTML(){var e=stat_data.环境||{};if(!e.赛程)return '';return '<div class="env-strip"><div class="env-line"><span class="env-item">🏁 '+esc(e.赛程)+'</span></div></div>';}

function nearbyLookup(str){var o={};String(str||'').split('|').forEach(function(x){x=String(x||'').trim();if(x)o[x]=1;});return o;}
var NEARBY_TYPE_COLORS={一般:'#A8A878',火:'#F08030',水:'#6890F0',草:'#78C850',电:'#F8D030',冰:'#98D8D8',格斗:'#C03028',毒:'#A040A0',地面:'#E0C068',飞行:'#A890F0',超能力:'#F85888',虫:'#A8B820',岩石:'#B8A038',幽灵:'#705898',龙:'#7038F8',恶:'#705848',钢:'#B8B8D0',妖精:'#EE99AC'};

var nearbyTypeCache={},nearbyTypePending={};
function nearbyCleanType(v){
  var s=String(v==null?'':v).trim();
  if(!s)return '';
  s=t2s(s);
  if(NEARBY_TYPE_COLORS[s])return s;
  s=s.replace(/\[|\]|\{|\}/g,'').replace(/\|.*$/,'').replace(/\s+/g,'').trim();
  if(NEARBY_TYPE_COLORS[s])return s;
  var ks=Object.keys(NEARBY_TYPE_COLORS).sort(function(a,b){return b.length-a.length;});
  for(var i=0;i<ks.length;i++){if(s.indexOf(ks[i])>=0)return ks[i];}
  return '';
}
function nearbyTypeChipsHTML(t1,t2){
  return (t1?typeChipHTML(t1):'')+(t2?typeChipHTML(t2):'');
}
function nearbyTypeBarHTML(m){
  var out=(m.type1?typeChipHTML(m.type1):'')+(m.type2?typeChipHTML(m.type2):'');
  if(!m.type1)out+='<span data-nb-type="'+esc(m.name)+'" data-nb-en="'+esc((m.pokemon&&m.pokemon.英文名)||'')+'" data-nb-cn="'+esc((m.pokemon&&m.pokemon.名字)||'')+'" data-nb-type-mode="chip"></span>';
  return out;
}
function nearbyTypeCacheKeyOf(p){
  var cn=String((p&&p.名字)||'').trim();
  if(cn)return cn;
  var en=nearbyEnSlug((p&&p.英文名)||'');
  if(en)return 'en:'+en;
  return '';
}
function nearbyEnSlug(en){
  var s=String(en||'').toLowerCase();
  s=s.replace(/['‘’`]/g,'').replace(/[.·]/g,'-').replace(/♀/g,'-f').replace(/♂/g,'-m');
  s=s.replace(/[éèêë]/g,'e').replace(/[áàâä]/g,'a').replace(/[íìîï]/g,'i').replace(/[óòôö]/g,'o').replace(/[úùûü]/g,'u').replace(/[ñ]/g,'n').replace(/[ç]/g,'c');
  s=s.replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
  return s;
}
function nearbyPickForm(d,cn,en){
  if(!d||!d.forms||!d.forms.length)return null;
  var forms=d.forms;
  if(forms.length===1)return forms[0];
  var s=t2s(String(cn||'')+' '+String(en||'')).toLowerCase();
  s=s
    .replace(/\bmega\b/g,' 超级 ')
    .replace(/\bgigantamax\b|\bgmax\b|\bg-max\b/g,' 超极巨 ')
    .replace(/\bprimal\b/g,' 原始 ')
    .replace(/\balolan\b|\balola\b/g,' 阿罗拉 ')
    .replace(/\bgalarian\b|\bgalar\b/g,' 伽勒尔 ')
    .replace(/\bhisuian\b|\bhisui\b/g,' 洗翠 ')
    .replace(/\bpaldean\b|\bpaldea\b/g,' 帕底亚 ')
    .replace(/dusk\s*mane/g,' 黄昏之鬃 ')
    .replace(/dawn\s*wings/g,' 拂晓之翼 ')
    .replace(/ice\s*rider/g,' 骑白马 ')
    .replace(/shadow\s*rider/g,' 骑黑马 ')
    .replace(/crowned\s*sword/g,' 剑之王 ')
    .replace(/crowned\s*shield/g,' 盾之王 ')
    .replace(/\bsky\s*forme\b/g,' 天空形态 ')
    .replace(/zen\s*mode/g,' 达摩模式 ');
  var best=null,bestScore=0,i;
  for(i=1;i<forms.length;i++){
    var nm=t2s(String(forms[i].name||''));
    var score=0;
    if(forms[i].region){
      if(forms[i].region==='alola'&&s.indexOf('阿罗拉')>=0)score+=3;
      else if(forms[i].region==='galar'&&s.indexOf('伽勒尔')>=0)score+=3;
      else if(forms[i].region==='hisui'&&s.indexOf('洗翠')>=0)score+=3;
      else if(forms[i].region==='paldea'&&s.indexOf('帕底亚')>=0)score+=3;
    }
    var kw=['超级','原始','超极巨','加热','清洗','结冰','旋转','切割','热辣','啪滋','呼拉','轻盈','黄昏之鬃','拂晓之翼','究极','骑白马','骑黑马','剑之王','盾之王','天空','舞步','斗战','火炽','水澜','达摩模式'];
    for(var k=0;k<kw.length;k++){if(s.indexOf(kw[k])>=0&&nm.indexOf(kw[k])>=0)score+=4;}
    var cnT=String(cn||''),enL=String(en||'').toLowerCase();
    if(/[ＸXx]$/.test(cnT)&&/[ＸXx]$/.test(nm))score+=2;
    if(/[ＹYy]$/.test(cnT)&&/[ＹYy]$/.test(nm))score+=2;
    if(/(^|\s)x$/.test(enL)&&/[ＸXx]$/.test(nm))score+=2;
    if(/(^|\s)y$/.test(enL)&&/[ＹYy]$/.test(nm))score+=2;
    if(score>bestScore){bestScore=score;best=forms[i];}
  }
  return bestScore>0?best:forms[0];
}
function nearbyFetchTypes(name,en,cn,cb){
  name=String(name==null?'':name).trim();
  en=String(en==null?'':en).trim();
  cn=String(cn==null?'':cn).trim();
  if(!name&&!en){cb&&cb('','');return;}
  var cacheKey=nearbyTypeCacheKeyOf({名字:cn||name,英文名:en})||name;
  if(nearbyTypeCache[cacheKey]){var c=nearbyTypeCache[cacheKey];cb&&cb(c.type1,c.type2);return;}
  var key='nbtype_v8_'+cacheKey;
  try{var raw=lsGet(key,'');if(raw){var o=JSON.parse(raw);if(o&&typeof o==='object'){o={type1:String(o.type1||''),type2:String(o.type2||'')};nearbyTypeCache[cacheKey]=o;cb&&cb(o.type1,o.type2);return;}}}catch(e){}
  if(nearbyTypePending[cacheKey]){nearbyTypePending[cacheKey].push(cb);return;}
  nearbyTypePending[cacheKey]=cb?[cb]:[];
  function fin(t1,t2){
    var o={type1:t1||'',type2:t2||''};
    nearbyTypeCache[cacheKey]=o;
    if(t1||t2){try{lsSet(key,JSON.stringify(o));}catch(e){}}
    var q=nearbyTypePending[cacheKey]||[];nearbyTypePending[cacheKey]=null;
    for(var i=0;i<q.length;i++){try{q[i]&&q[i](o.type1,o.type2);}catch(e){}}
  }
  function viaName(nm,next){
    if(!nm){next();return;}
    try{
      fetchPokemon(nm,function(d){
        var f=nearbyPickForm(d,cn,en);
        if(!f){next();return;}
        var a=nearbyCleanType(f.type1),b=nearbyCleanType(f.type2);
        if(a||b){fin(a,b);}else{next();}
      });
    }catch(e){next();}
  }
  var tries=[en,cn,name],seen={},uniq=[];
  for(var z=0;z<tries.length;z++){var t=tries[z];if(t&&!seen[t]){seen[t]=1;uniq.push(t);}}
  var ti=0;
  function step(){if(ti>=uniq.length){fin('','');return;}viaName(uniq[ti++],step);}
  function viaRepo(next){
    pkmDbLoad('dex','dex-list.json',['en','name'],function(store){
      var hit=null;
      var es=nearbyEnSlug(en);
      if(es)hit=pkmDbLookup('dex',es);
      if(!hit&&cn)hit=pkmDbLookup('dex',cn);
      if(!hit&&name)hit=pkmDbLookup('dex',name);
      if(hit&&hit.types&&hit.types.length){fin(nearbyCleanType(hit.types[0]),nearbyCleanType(hit.types[1]||''));}
      else{next();}
    });
  }
  viaRepo(step);
}
function resolveNearbyTypes(scope){
  var root=scope||document;if(!root.querySelectorAll)return;
  var els=root.querySelectorAll('[data-nb-type]');
  for(var i=0;i<els.length;i++){(function(el){
    if(el._nbTypeDone)return;el._nbTypeDone=1;
    var name=el.getAttribute('data-nb-type');
    var en=el.getAttribute('data-nb-en')||'';
    var cn=el.getAttribute('data-nb-cn')||'';
    nearbyFetchTypes(name,en,cn,function(t1,t2){
      if(!t1&&!t2){if(el.parentNode)el.parentNode.removeChild(el);return;}
      el.innerHTML=nearbyTypeChipsHTML(t1,t2);
      var card=el.closest?el.closest('.nb-primary-normal'):null;
      if(card){
        var c1=nearbyTypeColor(t1||'一般'),c2=t2?nearbyTypeColor(t2):c1;
        card.style.setProperty('--nb-accent1',c1);card.style.setProperty('--nb-accent2',c2);
        card.style.setProperty('--nb-soft1',nearbyHexToRgba(c1,.28));card.style.setProperty('--nb-soft2',nearbyHexToRgba(c2,.20));
        card.style.setProperty('--nb-glow1',nearbyHexToRgba(c1,.38));card.style.setProperty('--nb-glow2',nearbyHexToRgba(c2,.28));
      }
    });
  })(els[i]);}
}
var NEARBY_LEGENDARY_SET=nearbyLookup('急冻鸟|闪电鸟|火焰鸟|超梦|洛奇亚|凤王|雷公|炎帝|水君|雷吉洛克|雷吉艾斯|雷吉斯奇鲁|拉帝亚斯|拉帝欧斯|盖欧卡|固拉多|烈空坐|由克希|艾姆利多|亚克诺姆|帝牙卢卡|帕路奇亚|席多蓝恩|雷吉奇卡斯|骑拉帝纳|克雷色利亚|勾帕路翁|代拉基翁|毕力吉翁|龙卷云|雷电云|土地云|莱希拉姆|捷克罗姆|酋雷姆|哲尔尼亚斯|伊裴尔塔尔|基格尔德|卡璞·鸣鸣|卡璞·蝶蝶|卡璞·哞哞|卡璞·鳍鳍|科斯莫古|科斯莫姆|索尔迦雷欧|露奈雅拉|奈克洛兹玛|属性：空|银伴战兽|苍响|藏玛然特|无极汰那|熊徒弟|武道熊师|雷吉艾勒奇|雷吉铎拉戈|雪暴马|灵幽马|蕾冠王|眷恋云|古剑豹|古鼎鹿|古简蜗|古玉鱼|故勒顿|密勒顿|够赞狗|愿增猿|吉雉鸡|厄诡椪|太乐巴戈斯');
var NEARBY_MYTHICAL_SET=nearbyLookup('梦幻|时拉比|基拉祈|代欧奇希斯|玛纳霏|霏欧纳|达克莱伊|谢米|阿尔宙斯|比克提尼|凯路迪欧|美洛耶塔|盖诺赛克特|蒂安希|胡帕|波尔凯尼恩|玛机雅娜|玛夏多|捷拉奥拉|美录坦|美录梅塔|萨戮德|桃歹郎');
var NEARBY_ULTRA_SET=nearbyLookup('虚吾伊德|爆肌蚊|费洛美螂|电束木|铁火辉夜|纸御剑|恶食大王|毒贝比|四颚针龙|垒磊石|砰头小丑');
function nearbyTruthy(v){if(v===true||v===1)return true;if(v===false||v===0||v==null)return false;var s=String(v).trim().toLowerCase();if(!s)return false;if(/^(?:否|false|0|no|n|普通|非闪光|非異色|非异色)$/.test(s))return false;return /^(?:是|true|1|yes|y|闪光|異色|异色|shiny)$/.test(s)||/闪光|異色|异色|shiny/.test(s);}
function nearbyList(v){if(v==null)return [];if(Array.isArray(v))return v.map(function(x){return String(x||'').trim();}).filter(Boolean);if(typeof v==='object')return Object.keys(v).filter(function(k){return v[k];});return String(v).split(/[\/、,，|;+；]+/).map(function(x){return x.trim();}).filter(Boolean);}
function nearbyNormalizeEntry(raw){raw=(raw&&typeof raw==='object')?raw:{};var p=Object.assign({},raw),nm=String(p.名字||p.名称||p.name||p.species||'').trim(),en=String(p.英文名||p.EnglishName||p.englishName||p.name_en||'').trim(),types=[];[p.属性1,p.类型1].some(function(x){if(String(x||'').trim()){types.push(String(x).trim());return true;}return false;});[p.属性2,p.类型2].some(function(x){if(String(x||'').trim()&&String(x).trim()!=='无'){types.push(String(x).trim());return true;}return false;});if(!types.length){var mixed=nearbyList(p.属性||p.类型||p.types);types=mixed.slice(0,2);}var tags=[];[p.状态,p.标签,p.特征,p.稀有度,p.分类,p.形态,p.特殊形态,p.form,p.tags].forEach(function(v){nearbyList(v).forEach(function(x){if(tags.indexOf(x)<0)tags.push(x);});});p.名字=nm;p.英文名=en;p.数量=Math.max(1,parseInt(p.数量||p.count||p.数量上限||1,10)||1);p.是否闪光=nearbyTruthy(p.是否闪光!=null?p.是否闪光:(p.闪光!=null?p.闪光:p.shiny));p.状态=String(p.状态||p.status||'普通');p.图标=String(p.图标||p.图片||p.icon||p.img||'');p.属性1=types[0]||'';p.属性2=types[1]||'无';p._nearbyTags=tags;return p;}
function nearbyNormName(name){var t=String(name||'').trim();try{if(typeof baseName==='function')t=baseName(t);}catch(e){}t=t.replace(/[（(][^（）()]*[）)]/g,'').trim();var sp=t.indexOf(' ');if(sp>0)t=t.slice(0,sp).trim();return t;}
function nearbyTypeColor(tp){return NEARBY_TYPE_COLORS[String(tp||'').trim()]||'#7d95b5';}
function nearbyHexToRgba(hex,a){hex=String(hex||'').replace('#','');if(hex.length===3)hex=hex.replace(/(.)/g,'$1$1');var n=parseInt(hex,16);if(!isFinite(n))return 'rgba(125,149,181,'+(a||1)+')';var r=(n>>16)&255,g=(n>>8)&255,b=n&255;return 'rgba('+r+','+g+','+b+','+(a==null?1:a)+')';}
function nearbyAllText(p){p=(p&&Array.isArray(p._nearbyTags))?p:nearbyNormalizeEntry(p);return [p.名字,p.英文名,p.状态,(p._nearbyTags||[]).join(' ')].join(' ');}
function nearbyCategoryMeta(raw){var p=nearbyNormalizeEntry(raw),nm=nearbyNormName(p.名字),txt=nearbyAllText(p),shiny=p.是否闪光,boss=/霸主|头目|頭目|首领|首領|boss|alpha/i.test(txt),mega=/(?:^|[\s·_-])mega(?:[\s·_-]|$)|\bmage\b|mega进化|mega進化|超级进化|超級進化|超进化|超進化/i.test(txt)||/^(?:Mega|mega|MAGE|mage)/.test(String(p.名字||'')),dynamax=/超极巨|超極巨|极巨化|極巨化|极巨|極巨|dynamax|gigantamax|g-max/i.test(txt),ultra=/异兽|異獸|究极异兽|究極異獸|ultra\s*beast|\bUB\b/i.test(txt)||!!NEARBY_ULTRA_SET[nm],mythical=/幻兽|幻獸|mythical/i.test(txt)||!!NEARBY_MYTHICAL_SET[nm],legendary=!mythical&&!ultra&&(/神兽|神獸|传说宝可梦|傳說寶可夢|legendary/i.test(txt)||!!NEARBY_LEGENDARY_SET[nm]),t1=String(p.属性1||'').trim(),t2=String(p.属性2||'').trim();if(t2==='无')t2='';if(!t1){var _nt=nearbyTypeCache[nearbyTypeCacheKeyOf(p)];if(_nt){t1=_nt.type1||'';if(!t2)t2=_nt.type2||'';}}var c1=nearbyTypeColor(t1||(legendary?'龙':'一般')),c2=t2?nearbyTypeColor(t2):c1,primary=legendary?'legendary':mythical?'mythical':ultra?'ultra':boss?'boss':mega?'mega':dynamax?'dynamax':shiny?'shiny':'normal';if(primary==='mythical'){c1='#ff78a9';c2='#b98cff';}else if(primary==='ultra'){c1='#00e5ff';c2='#7c3aed';}else if(primary==='boss'){c1='#ff9a3d';c2='#dc2626';}else if(primary==='mega'){c1='#58c8ff';c2='#8b5cf6';}else if(primary==='dynamax'){c1='#ff5cac';c2='#e11d48';}else if(primary==='shiny'){c1='#ffe47a';c2='#e6b800';}return {pokemon:p,name:nm,text:txt,legendary:legendary,mythical:mythical,ultra:ultra,boss:boss,mega:mega,dynamax:dynamax,shiny:shiny,type1:t1,type2:t2,primary:primary,accent1:c1,accent2:c2,soft1:nearbyHexToRgba(c1,.28),soft2:nearbyHexToRgba(c2,.20),glow1:nearbyHexToRgba(c1,.38),glow2:nearbyHexToRgba(c2,.28)};}
function nearbyCardPriority(raw){var m=nearbyCategoryMeta(raw),s=0;if(m.legendary)s+=700;if(m.mythical)s+=640;if(m.ultra)s+=580;if(m.boss)s+=440;if(m.mega)s+=360;if(m.dynamax)s+=300;if(m.shiny)s+=240;s+=(Number(m.pokemon&&m.pokemon.数量)||0);return s;}
function nearbySortedKeys(obj){return Object.keys(obj||{}).map(function(k){return {key:k,score:nearbyCardPriority(obj[k])};}).sort(function(a,b){return b.score-a.score;}).map(function(x){return x.key;});}

function nearbyPillHTML(kind,label,text,style){return '<span class="nb-pill '+kind+'"'+(style?' style="'+style+'"':'')+'><span class="nb-pill-ic">'+text+'</span><span class="nb-pill-tx">'+esc(label)+'</span></span>';}
function nearbyNameIconsHTML(m){var a=[];if(m.mega)a.push('<img class="mega-ic" style="height:14px" src="https://img.baibai.cv/f/YNBKTy/1788349081288.png" alt="Mega" onerror="this.remove()">');if(m.dynamax)a.push('<img class="mega-ic" style="height:14px" src="https://img.baibai.cv/f/GKpwto/1788410257587.png" alt="超极巨化" onerror="this.remove()">');if(m.boss)a.push('<img class="mega-ic" style="height:14px" src="https://img.baibai.cv/f/yeRrTj/1788410175968.png" alt="头目/霸主" onerror="this.remove()">');if(m.shiny)a.push('<img class="mega-ic" style="height:14px" src="https://raw.githubusercontent.com/msikma/pokesprite/master/misc/special-attribute/shiny-stars.png" alt="闪光" onerror="this.remove()">');return a.join('');}
function nearbyPillsHTML(m){var a=[];if(m.legendary)a.push(nearbyPillHTML('legendary','神兽','✦','--nb-pill1:'+m.accent1+';--nb-pill2:'+m.accent2+';--nb-pill-soft:'+m.glow1+';'));if(m.mythical)a.push(nearbyPillHTML('mythical','幻兽','◇'));if(m.ultra)a.push(nearbyPillHTML('ultra','异兽','UB'));return a.join('');}
function nearbyCellClasses(m){var cls=['nb-primary-'+m.primary];if(m.legendary)cls.push('is-legendary');if(m.mythical)cls.push('is-mythical');if(m.ultra)cls.push('is-ultra');if(m.boss)cls.push('is-boss');if(m.mega)cls.push('is-mega');if(m.dynamax)cls.push('is-dynamax');if(m.shiny)cls.push('is-shiny');return cls.join(' ');}
function nearbyCellStyle(m){return '--nb-accent1:'+m.accent1+';--nb-accent2:'+m.accent2+';--nb-soft1:'+m.soft1+';--nb-soft2:'+m.soft2+';--nb-glow1:'+m.glow1+';--nb-glow2:'+m.glow2+';';}
function nearbyCardHTML(key,raw,mode){var m=nearbyCategoryMeta(raw),p=m.pokemon,img=pkImgHTML(p.名字,p.图标,m.shiny,mode==='page'?'box-icon nearby-pic':'nb-icon nearby-pic'),attr=(mode==='page'?'data-nearby':'data-nearby-open')+'="'+esc(key)+'"',cls=(mode==='page'?'box-cell nearby-cell ':'nb-cell ')+nearbyCellClasses(m),sub='×'+num(p.数量,1),title=esc(p.名字||'未知宝可梦');return '<div class="'+cls+'" style="'+nearbyCellStyle(m)+'" '+attr+'><div class="nb-aura"></div><div class="nb-edge"></div><div class="nb-thumb-wrap">'+img+'</div><div class="nb-name-row"><span class="nb-name" title="'+title+'">'+title+'</span><span class="nb-name-icons">'+nearbyNameIconsHTML(m)+'</span></div><div class="nb-pillbar">'+nearbyPillsHTML(m)+'</div><div class="nb-typebar">'+nearbyTypeBarHTML(m)+'</div><div class="nb-cnt">'+sub+'</div></div>';}
function nearbyDiagnostics(){var obj=stat_data.附近宝可梦||{},out=[];Object.keys(obj).forEach(function(key){var raw=obj[key],m=nearbyCategoryMeta(raw),p=m.pokemon,w=[];if(!p.名字)w.push('缺少名字');if((m.legendary||m.mythical||m.ultra)&&!p.属性1)w.push('稀有宝可梦未提供属性，将自动联网补齐（52poke 英文名重定向优先，中文名兜底）');var rv=(raw&&raw.是否闪光);if(typeof rv==='string'&&!/^(?:是|否|true|false|1|0|yes|no|y|n|闪光|异色|異色)$/i.test(rv.trim()))w.push('是否闪光字段不是推荐布尔/是/否格式');if(!p.图标)w.push('未提供图标，将依赖 HUD 在线图片解析');out.push({key:key,normalized:{名字:p.名字,英文名:p.英文名,数量:p.数量,是否闪光:p.是否闪光,状态:p.状态,属性1:p.属性1,属性2:p.属性2,图标:p.图标,标签:p._nearbyTags},detected:{神兽:m.legendary,幻兽:m.mythical,异兽:m.ultra,霸主:m.boss,Mega:m.mega,极巨化:m.dynamax,闪光:m.shiny,primary:m.primary},warnings:w});});return out;}
function nearbyHTML(){var obj=stat_data.附近宝可梦||{};var keys=nearbySortedKeys(obj);if(!keys.length)return frame('附近宝可梦','<div class="empty">暂无</div>');var show=nearbyOpen?keys:keys.slice(0,6);var cells=show.map(function(key){return nearbyCardHTML(key,obj[key],'strip');}).join('');var rare=keys.filter(function(k){var m=nearbyCategoryMeta(obj[k]);return m.legendary||m.mythical||m.ultra||m.boss||m.mega||m.dynamax||m.shiny;}).length;var more=keys.length>6?'<span class="nb-toggle" data-nearby-toggle>'+(nearbyOpen?'收起 ▲':'展开全部('+keys.length+') ▼')+'</span>':'';var rareText=rare?'<span class="nb-rare-count">✦ '+rare+' 特殊</span>':'';return '<div class="info-frame nearby-frame"><div class="info-inner"><div class="info-title"><span>附近宝可梦</span>'+rareText+more+'</div><div class="nb-grid">'+cells+'</div></div></div>';}



function bagCategories(){var cats=[{key:'道具',label:'道具',items:[]},{key:'精灵球',label:'精灵球',items:[]},{key:'重要物品',label:'重要物品',items:[]}];var bag=stat_data.背包||{};Object.keys(bag).forEach(function(name){var it=bag[name];if(!it||typeof it!=='object'||!(('类型')in it))return;var c=cats.find(function(x){return x.key===it.类型;});if(c)c.items.push({name:name,count:Number(it.数量)||0,icon:String(it.图标||'')});});return cats;}
var activeBag='道具';
function bagItemsHTML(){var cats=bagCategories();var cur=cats.find(function(c){return c.key===activeBag;})||cats[0];if(!cur.items.length)return '<div class="empty">这里什么都没有...</div>';return cur.items.map(function(it){var isTM=(it.name.indexOf('技能机')>=0||it.name.indexOf('招式学习器')>=0);var tmMove=isTM?tmMoveName(it.name):'';var icon;if(tmMove){var iconSlug=String(it.icon||'').toLowerCase().replace(/\.(png|gif|jpe?g|webp)$/,'');icon=iconSlug?'<span class="item-icon-wrap"><img class="item-icon" src="'+esc(psItemUrl(iconSlug,'bag'))+'" onerror="itemImgErr(this)"></span>':'<span class="item-icon-wrap"><span class="item-icon placeholder tm-wiki" data-tm="'+esc(tmMove)+'">?</span></span>';}else if(isTM){var iconName=(itemIconName(it.name)||String(it.icon||'')).toLowerCase();if(iconName.slice(-4)==='.png'){iconName=iconName.slice(0,-4);}icon=iconName?'<span class="item-icon-wrap"><img class="item-icon" src="'+esc(psItemUrl(iconName,'bag'))+'" onerror="itemImgErr(this)"></span>':'<span class="item-icon-wrap"><span class="item-icon placeholder">?</span></span>';}else if(pkmItemSource==='serebii'){var ov2=itemImgOf(it.name);if(ov2!==undefined){icon=ov2?'<span class="item-icon-wrap"><img class="item-icon" src="'+esc(ov2)+'" referrerpolicy="origin" onerror="itemImgErr(this)"></span>':'<span class="item-icon-wrap"><span class="item-icon placeholder">?</span></span>';}else{icon='<span class="item-icon-wrap"><span class="item-icon placeholder item-wiki" data-item="'+esc(it.name)+'" data-item-en="'+esc(it.icon||'')+'" data-cls="item-icon">?</span></span>';}}else{var ov=itemImgOf(it.name);if(ov!==undefined){icon=ov?'<span class="item-icon-wrap"><img class="item-icon" src="'+esc(ov)+'" referrerpolicy="origin" onerror="itemImgErr(this)"></span>':'<span class="item-icon-wrap"><span class="item-icon placeholder">?</span></span>';}else{icon='<span class="item-icon-wrap"><span class="item-icon placeholder item-wiki" data-item="'+esc(it.name)+'" data-cls="item-icon">?</span></span>';}}var click=tmMove?' data-tm="'+esc(tmMove)+'" style="cursor:pointer"':((!isTM&&itemClickEnabled)?' data-item="'+esc(it.name)+'" style="cursor:pointer"':'');return '<div class="item-entry"'+click+'>'+icon+'<span class="item-name">'+esc(it.name)+'</span><span class="item-count">×'+it.count+'</span><button class="btn-small" data-bag-discard="'+esc(it.name)+'">丢弃</button></div>';}).join('');}
function bagHTML(){var tabs=bagCategories().map(function(c){return '<button class="bag-tab'+(c.key===activeBag?' active':'')+'" data-bag="'+c.key+'">'+c.label+'</button>';}).join('');return frame('背包','<div class="bag-tabs">'+tabs+'</div><div class="bag-list" id="bag-list">'+bagItemsHTML()+'</div>');}

var MAPS_DATA=[
  {
  name:'关都',
  img:'https://img.baibai.cv/f/OMKnsy/CI_NSwitch_PokemonLetsGoPikachuPokemonLetsGoEevee_01_Map.jpeg',
  towns:[
    {name:'真新镇',x:23.9,y:64.9},
    {name:'常青市',x:24.4,y:45.4},
    {name:'深灰市',x:25.1,y:20.9},
    {name:'华蓝市',x:64.7,y:17.6},
    {name:'紫苑镇',x:88.8,y:36.1},
    {name:'金黄市',x:64.6,y:34.9},
    {name:'玉虹市',x:47.7,y:35.1},
    {name:'浅红市',x:50.5,y:74.5},
    {name:'枯叶市',x:64.4,y:56},
    {name:'红莲镇',x:23.8,y:91.4},
    {name:'霓虹镇',x:49.9,y:83.6}
  ],
  roads:[
    {name:'1号道路',x:23.9,y:56.2},
    {name:'2号道路',x:24.8,y:33.6},
    {name:'3号道路',x:36.4,y:20.8},
    {name:'4号道路',x:52.4,y:17.8},
    {name:'5号道路',x:64.7,y:26.3},
    {name:'6号道路',x:64.7,y:45},
    {name:'7号道路',x:56.9,y:35.3},
    {name:'8号道路',x:77,y:35.4},
    {name:'9号道路',x:77.3,y:16.6},
    {name:'10号道路',x:88.2,y:29.8},
    {name:'11号道路',x:78.5,y:54.8},
    {name:'12号道路',x:89.5,y:55},
    {name:'13号道路',x:79.3,y:69.5},
    {name:'14号道路',x:72.9,y:73.3},
    {name:'15号道路',x:65,y:76.4},
    {name:'16号道路',x:37.4,y:35.4},
    {name:'17号道路',x:35.9,y:52.1},
    {name:'18号道路',x:38.2,y:75.8},
    {name:'19号水道',x:49.6,y:89.8},
    {name:'20号水道',x:33.3,y:93},
    {name:'21号水道',x:23.9,y:78},
    {name:'22号道路',x:16.6,y:45.9},
    {name:'24号道路',x:64.6,y:9.2},
    {name:'25号道路',x:73.5,y:5.9}
  ],
  specials:[
    {name:'月见山',x:42.9,y:11.6},
    {name:'常青森林',x:23.5,y:31.3},
    {name:'伙伴公园',x:50.4,y:62.3},
    {name:'正辉灯塔',x:81.3,y:4.7},
    {name:'圣特安努号',x:64.5,y:66.3},
    {name:'小明的道馆',x:64.5,y:43.3},
    {name:'宝可梦研究学院',x:64.6,y:47.5},
    {name:'胜利之路',x:12.5,y:32.3},
    {name:'白银山',x:5,y:6.4},
    {name:'蓝普尔其',x:59.7,y:56.2},
    {name:'少女峡',x:69.6,y:58.5},
    {name:'大傻谷',x:34.2,y:92.4},
    {name:'石英高原',x:12.9,y:5.2},
    {name:'自行车道',x:35.6,y:58.2},
    {name:'地鼠洞穴出入口',x:26.6,y:27.6},
    {name:'地鼠洞穴出入口',x:66.2,y:44.3},
    {name:'双子岛',x:38.5,y:92.8},
    {name:'华蓝洞窟',x:56.3,y:12.8},
    {name:'岩山隧道',x:86.4,y:19.6}
  ]
},
  {
    name:'城都',
    img:'https://img.baibai.cv/f/PkPxug/%E5%9F%8E%E9%83%BD.jpg',
    towns:[
      {name:'若叶镇',x:70,y:67.5},
      {name:'吉花市',x:57.6,y:67.7},
      {name:'桔梗市',x:50.2,y:45.9},
      {name:'桧皮镇',x:43.2,y:79.5},
      {name:'满金市',x:37.7,y:60.6},
      {name:'缘朱市',x:40.9,y:33.8},
      {name:'浅葱市',x:28.3,y:47.5},
      {name:'湛蓝市',x:19.6,y:62.2},
      {name:'卡吉镇',x:54.4,y:34.3},
      {name:'烟墨市',x:68.2,y:33.5}
    ],
    roads:[
      {name:'29号道路',x:64.1,y:67.6},
      {name:'28号道路',x:96.2,y:47.9},
      {name:'27号道路',x:84.3,y:67.8},
      {name:'30号道路',x:57.4,y:56.1},
      {name:'31号道路',x:56,y:49},
      {name:'32号道路',x:48.4,y:60},
      {name:'33号道路',x:47.5,y:80},
      {name:'34号道路',x:39.1,y:71.7},
      {name:'35号道路',x:38.9,y:50.6},
      {name:'36号道路',x:44.4,y:44.5},
      {name:'37号道路',x:41.3,y:40},
      {name:'38号道路',x:33.3,y:34.4},
      {name:'39号道路',x:27.7,y:39.1},
      {name:'40号水路',x:25.5,y:53.2},
      {name:'41号水路',x:24,y:60.6},
      {name:'42号道路',x:48.3,y:35.3},
      {name:'43号道路',x:54.7,y:27.4},
      {name:'44号道路',x:60.6,y:34.5},
      {name:'45号道路',x:67.2,y:45.3},
      {name:'46号道路',x:63.8,y:61.5},
      {name:'47号道路',x:9.6,y:61.9},
      {name:'48号道路',x:9,y:56.6}
    ],
    specials:[
      {name:'黑暗洞穴出入口',x:58.2,y:48.2},
      {name:'黑暗洞穴出入口',x:64.6,y:57.2},
      {name:'黑暗洞穴出入口',x:66.7,y:37.9},
      {name:'喇叭芽之塔',x:50.6,y:41.7},
      {name:'阿露福遗迹',x:45.3,y:51.1},
      {name:'互连洞',x:47.9,y:71.7},
      {name:'呆呆兽之井',x:45.4,y:77.6},
      {name:'栎树林',x:40.2,y:77.3},
      {name:'播音塔',x:36.2,y:59.5},
      {name:'全球终端',x:33.7,y:58.1},
      {name:'满金地下通道',x:38.4,y:62.6},
      {name:'满金游戏城',x:37,y:61.8},
      {name:'自然公园',x:37.1,y:43.5},
      {name:'宝可全能竞技赛巨蛋',x:33.6,y:46.7},
      {name:'铃铛塔',x:40.8,y:28.5},
      {name:'烧焦塔',x:39.8,y:30.7},
      {name:'哞哞牧场',x:27.1,y:34.4},
      {name:'浅葱灯塔',x:30.4,y:48.2},
      {name:'对战开拓区',x:23.7,y:43},
      {name:'断崖入口',x:15.2,y:65.1},
      {name:'断崖洞穴',x:13.2,y:67.8},
      {name:'埋葬之塔',x:8.6,y:66.3},
      {name:'狩猎地带',x:8.9,y:50.3},
      {name:'漩涡岛',x:24.1,y:61.2},
      {name:'擂钵山',x:48.3,y:33.3},
      {name:'愤怒之湖',x:53,y:15.8},
      {name:'火箭队基地',x:54.2,y:35.4},
      {name:'冰雪小径',x:71.1,y:30},
      {name:'龙穴',x:68.8,y:28.2},
      {name:'白银山',x:90.8,y:34.1},
      {name:'都城瀑布',x:78.2,y:67.9}
    ]
  },
  {
    name:'丰缘',
    img:'https://img.baibai.cv/f/ovRNiO/%E4%B8%B0%E7%BC%98.jpg',
    towns:[
      {name:'末白镇',x:20.1,y:70.8},
      {name:'古玫镇',x:20.2,y:62.1},
      {name:'橙华市',x:13,y:62.7},
      {name:'卡那兹市',x:8.5,y:45.8},
      {name:'武斗镇',x:11.4,y:89.8},
      {name:'凯那市',x:30.9,y:66.8},
      {name:'紫堇市',x:31.4,y:38.3},
      {name:'绿茵镇',x:20.3,y:37.7},
      {name:'釜炎镇',x:23.7,y:21.8},
      {name:'秋叶镇',x:20.4,y:8.4},
      {name:'茵郁市',x:46,y:11.4},
      {name:'水静市',x:68,y:22.5},
      {name:'绿岭市',x:88.2,y:25.3},
      {name:'琉璃市',x:76,y:43.8},
      {name:'暮水镇',x:63.5,y:64.3},
      {name:'彩悠市',x:94,y:46.6}
    ],
    roads:[
      {name:'101号道路',x:20.1,y:67.1},
      {name:'102号道路',x:16.8,y:62.5},
      {name:'103号道路',x:24.2,y:54.4},
      {name:'104号道路',x:8.7,y:63.2},
      {name:'105号水路',x:7.6,y:74.2},
      {name:'106号水路',x:10.9,y:84.5},
      {name:'107号水路',x:17,y:89.4},
      {name:'108号水路',x:24.6,y:88.5},
      {name:'109号水路',x:31.6,y:83.5},
      {name:'110号道路',x:31.2,y:47.5},
      {name:'111号道路',x:34.4,y:17},
      {name:'112号道路',x:29.3,y:21.8},
      {name:'113号道路',x:28.6,y:8.7},
      {name:'114号道路',x:15,y:13.7},
      {name:'115号道路',x:9.8,y:34.2},
      {name:'116号道路',x:13.2,y:41.4},
      {name:'117号道路',x:26.5,y:38.7},
      {name:'118号道路',x:41.7,y:38.1},
      {name:'119号道路',x:40,y:21.1},
      {name:'120号道路',x:54.6,y:18.2},
      {name:'121号道路',x:59.4,y:23.3},
      {name:'122号水路',x:58.4,y:29.3},
      {name:'123号道路',x:50.7,y:39.1},
      {name:'124号水路',x:75.2,y:22.5},
      {name:'125号水路',x:80.9,y:26.4},
      {name:'126号水路',x:77.7,y:39.1},
      {name:'127号水路',x:83.9,y:46.4},
      {name:'128号水路',x:85.3,y:54.5},
      {name:'129号水路',x:83.8,y:64.8},
      {name:'130号水路',x:75.7,y:65.1},
      {name:'131号水路',x:69.6,y:65.5},
      {name:'132号水路',x:53.9,y:64.1},
      {name:'133号水路',x:45.7,y:65.3},
      {name:'134号水路',x:38.6,y:64.2}
    ],
    specials:[
      {name:'橙华森林',x:7,y:57.6},
      {name:'石之洞窟',x:7.4,y:86.1},
      {name:'海紫堇',x:23.9,y:83},
      {name:'新紫堇',x:33.9,y:42.4},
      {name:'卡绿隧道',x:16.3,y:38.7},
      {name:'烟囱山',x:24.6,y:11},
      {name:'凹凸山道',x:24.5,y:14.9},
      {name:'烈焰小径',x:27.5,y:17.8},
      {name:'流星瀑布',x:11.3,y:22.5},
      {name:'狩猎地带',x:59.1,y:19.2},
      {name:'送神山',x:61,y:29},
      {name:'浅滩洞穴',x:88.8,y:14.8},
      {name:'天空之柱',x:75.1,y:60.5},
      {name:'南方孤岛',x:46.8,y:85.7},
      {name:'秘密海滨',x:86.2,y:68.7},
      {name:'冠军之路',x:93.9,y:39.9},
      {name:'起源洞窟',x:84,y:47.7},
      {name:'对战度假地',x:78.7,y:77.2},
      {name:'幻影岛',x:61,y:91.6},
      {name:'觉醒神殿',x:76,y:43},
      {name:'秘密小岛',x:71,y:49.4}
    ]
  },
  {
    name:'神奥',
    img:'https://img.baibai.cv/f/apYeHR/%E7%A5%9E%E5%A5%A5.png',
    towns:[
      {name:'双叶镇',x:15.8,y:87.7},
      {name:'水脉市',x:11.6,y:66},
      {name:'真砂镇',x:22.9,y:82.8},
      {name:'祝庆市',x:22.4,y:71.1},
      {name:'黑金市',x:36.1,y:70.4},
      {name:'家缘市',x:53.7,y:61.3},
      {name:'野原市',x:66.9,y:76.4},
      {name:'滨海市',x:91,y:71.5},
      {name:'帷幕市',x:74.7,y:50.4},
      {name:'雪峰市',x:43.8,y:8.9},
      {name:'神和镇',x:51.4,y:41.8},
      {name:'百代市',x:38.7,y:42},
      {name:'花苑镇',x:24.8,y:56.3},
      {name:'随意镇',x:61.9,y:56}
    ],
    roads:[
      {name:'201号道路',x:16.1,y:83.2},
      {name:'202号道路',x:23.4,y:79.1},
      {name:'203号道路',x:29.1,y:70.3},
      {name:'204号道路',x:24.5,y:61.7},
      {name:'205号道路',x:29.1,y:50.9},
      {name:'206号道路',x:37.5,y:52.5},
      {name:'207号道路',x:40.2,y:63.2},
      {name:'208号道路',x:46.6,y:65.2},
      {name:'209号道路',x:60.9,y:64.4},
      {name:'210号道路',x:59.1,y:41},
      {name:'211号道路',x:45.7,y:41.3},
      {name:'212号道路',x:57.1,y:83},
      {name:'213号道路',x:71,y:77},
      {name:'214号道路',x:77.6,y:62.4},
      {name:'215号道路',x:65.8,y:48.6},
      {name:'216号道路',x:43.6,y:27.4},
      {name:'217号道路',x:39,y:19.3},
      {name:'218号道路',x:15.8,y:69.3},
      {name:'219号道路',x:23.1,y:87.3},
      {name:'220号水路',x:23.1,y:94.3},
      {name:'221号道路',x:31,y:92.8},
      {name:'222号道路',x:82.4,y:73.1},
      {name:'223号水路',x:88.7,y:58.2},
      {name:'224号道路',x:92.3,y:40.9},
      {name:'225号道路',x:67.5,y:23.5},
      {name:'226号水路',x:74.8,y:21.8},
      {name:'227号道路',x:74.9,y:16.5},
      {name:'228号道路',x:79,y:24.5},
      {name:'229号道路',x:81.7,y:30.7},
      {name:'230号水路',x:74.5,y:32.5}
    ],
    specials:[
      {name:'睿智湖',x:40,y:9.3},
      {name:'钢铁岛',x:21.2,y:37.3},
      {name:'新月岛',x:17.6,y:13.7},
      {name:'满月岛',x:7.2,y:14.7},
      {name:'多多罗铁工厂',x:24.3,y:46.2},
      {name:'百代森林',x:29,y:41.4},
      {name:'山谷发电站',x:32.8,y:54.7},
      {name:'心齐湖',x:11.9,y:79.3},
      {name:'伙伴公园',x:36.1,y:86.2},
      {name:'天冠山',x:44.5,y:41.6},
      {name:'立志湖',x:74.8,y:69},
      {name:'宝可梦联盟',x:88,y:41.7},
      {name:'隐泉之路',x:81,y:61.8},
      {name:'战斗区',x:66.7,y:29.1},
      {name:'生存区',x:67.4,y:19.9},
      {name:'名胜区',x:82.5,y:35.2},
      {name:'严酷山',x:70,y:7.4},
      {name:'花之乐园',x:75.6,y:14.3},
      {name:'冠军之路',x:87.4,y:46.9}
    ]
  },
  {
    name:'卡洛斯',
    img:'https://img.baibai.cv/f/y2M4Uj/%E5%8D%A1%E6%B4%9B%E6%96%AF.png',
    towns:[
      {name:'比翼市',x:36.2,y:27.8},
      {name:'古木镇',x:43.6,y:56.4},
      {name:'密阿雷市',x:54.1,y:35.2},
      {name:'娑罗市',x:16.8,y:41.6},
      {name:'石香镇',x:11.3,y:48.5},
      {name:'遥香市',x:20.7,y:56.2},
      {name:'古香镇',x:25.3,y:71.6},
      {name:'香薰市',x:54.1,y:15},
      {name:'风絮镇',x:70.7,y:28.2},
      {name:'宝可梦联盟',x:75.5,y:39.9},
      {name:'百刻市',x:86.6,y:39.6},
      {name:'连理镇',x:94.5,y:45.9},
      {name:'映雪市',x:85,y:54.7},
      {name:'白檀市',x:63.5,y:54.4},
      {name:'名水镇',x:67,y:70.1},
      {name:'朝香镇',x:67.3,y:78.5},
      {name:'奇楠市',x:77.1,y:91}
    ],
    roads:[
      {name:'1号道路',x:67.1,y:75.1},
      {name:'2号道路',x:67,y:67.8},
      {name:'3号道路',x:66.8,y:58.6},
      {name:'4号道路',x:59.1,y:46.8},
      {name:'5号道路',x:48.7,y:46.7},
      {name:'6号道路',x:38.1,y:50.4},
      {name:'7号道路',x:35.7,y:55.7},
      {name:'8号道路',x:23.8,y:65.7},
      {name:'9号道路',x:35.3,y:72.1},
      {name:'10号道路',x:16.7,y:51.6},
      {name:'11号道路',x:13.2,y:46.1},
      {name:'12号道路',x:27.9,y:30.3},
      {name:'13号道路',x:45.1,y:28.8},
      {name:'14号道路',x:53.7,y:26.3},
      {name:'15号道路',x:62,y:19.5},
      {name:'16号道路',x:64.3,y:21.8},
      {name:'17号道路',x:76.8,y:33},
      {name:'18号道路',x:92.5,y:42},
      {name:'19号道路',x:86.9,y:47.2},
      {name:'20号道路',x:82.8,y:62.1},
      {name:'21号道路',x:81.4,y:51.6},
      {name:'22号道路',x:69.2,y:50.8}
    ],
    specials:[
      {name:'海神之穴',x:27.1,y:17.3},
      {name:'巴尔法姆香殿',x:33.2,y:46.1},
      {name:'镜穴',x:13.8,y:44.6},
      {name:'串连地洞',x:25,y:61.7},
      {name:'闪耀洞窟',x:40.3,y:71},
      {name:'卡洛斯发电厂',x:42.5,y:32.2},
      {name:'精灵球工厂',x:54,y:8.5},
      {name:'废弃酒店',x:67.7,y:22},
      {name:'冰结洞窟',x:77.6,y:17.6},
      {name:'终结洞窟',x:94.2,y:30.7},
      {name:'宝可梦村',x:82.7,y:70.3},
      {name:'冠军之路',x:75.9,y:50},
      {name:'白檀森林',x:67.2,y:64.2},
      {name:'虚空之室',x:72.9,y:58.2},
      {name:'精练之塔',x:16.7,y:37.2},
      {name:'蔚蓝湾',x:30.6,y:20.9},
      {name:'逊毕勒城',x:44.1,y:53.6},
      {name:'对战城塞',x:29.6,y:54},
      {name:'无名洞窟',x:81.5,y:75.9},
      {name:'树果园',x:38.6,y:57.7},
      {name:'恐怖小屋',x:53.8,y:25}
    ]
  },
  {
    name:'伽勒尔',
    img:'https://img.baibai.cv/f/GkBXIo/%E4%BC%BD%E5%8B%92%E5%B0%94.png',
    towns:[
      {name:'宫门市',x:51.8,y:17},
      {name:'舞姿镇',x:35.7,y:29},
      {name:'溯传镇',x:33.9,y:36.5},
      {name:'拳关市',x:51.9,y:36.4},
      {name:'战竞镇',x:69.1,y:30.6},
      {name:'尖钉镇',x:75.8,y:37.3},
      {name:'水舟镇',x:60,y:45.4},
      {name:'草路镇',x:37.5,y:45.4},
      {name:'机擎市',x:43.9,y:53.2},
      {name:'木杆镇',x:49.8,y:84.8},
      {name:'化朗镇',x:48.6,y:91.6}
    ],
    roads:[
      {name:'10号道路',x:52.9,y:23.8},
      {name:'6号道路',x:38.8,y:37.2},
      {name:'7号道路',x:62.7,y:37},
      {name:'8号道路',x:66.5,y:34},
      {name:'9号道路',x:72.8,y:34},
      {name:'5号道路',x:48.7,y:46},
      {name:'4号道路',x:37.2,y:47.8},
      {name:'3号道路',x:31.7,y:52.2},
      {name:'2号道路',x:58.5,y:81.5},
      {name:'1号道路',x:49.1,y:88.4}
    ],
    specials:[
      {name:'对战塔',x:51.8,y:12.7},
      {name:'迷光森林',x:38.6,y:31.3},
      {name:'九路隧道',x:69.2,y:37.1},
      {name:'拳关丘陵',x:53.8,y:40.4},
      {name:'宝可梦寄放屋',x:46.8,y:45.4},
      {name:'伽勒尔矿山',x:28,y:48.6},
      {name:'逆鳞湖',x:43.5,y:40.1},
      {name:'沙尖洼地',x:52.1,y:43.7},
      {name:'巨人帽岩',x:47.6,y:41.3},
      {name:'巨人镜池',x:59.3,y:41.6},
      {name:'巨石原野',x:53.8,y:45.2},
      {name:'桥间空地',x:51.8,y:49.7},
      {name:'第二矿山',x:66.8,y:50.3},
      {name:'机擎市郊外',x:54.3,y:52.7},
      {name:'机擎河岸',x:52.3,y:56.7},
      {name:'瞭望塔旧址',x:34.9,y:60.5},
      {name:'牙牙湖',x:40.9,y:63.1},
      {name:'美纳斯湖',x:51.2,y:64.3},
      {name:'沐光森林',x:37.2,y:69.9},
      {name:'照丽草原',x:42.2,y:67.8},
      {name:'巨人凳岩',x:60.7,y:66.6},
      {name:'集汇空地',x:45.4,y:73.1},
      {name:'微寐森林',x:38.5,y:91.5},
      {name:'铠之孤岛',x:97,y:35.9},
      {name:'王冠雪原',x:50.6,y:98.2}
    ]
  },
  {
    name:'阿罗拉',
    img:'https://img.baibai.cv/f/pNj7uE/%E9%98%BF%E7%BD%97%E6%8B%89.png',
    islands:[
      {name:'美乐美乐岛',x:32.8,y:26.2,img:'https://img.baibai.cv/f/jmjdcX/%E7%BE%8E%E4%B9%90%E7%BE%8E%E4%B9%90%E5%B2%9B.png',
        towns:[
          {name:'利利小镇',x:32.9,y:27.8},
          {name:'好奥乐市',x:27.9,y:71}
        ],
        roads:[
          {name:'2号道路',x:10.2,y:46.8},
          {name:'1号道路',x:48.3,y:31.9},
          {name:'3号道路',x:41.1,y:12.9}
        ],
        specials:[
          {name:'大浪海滩',x:5,y:32.5},
          {name:'卡拉蔚湾',x:54.4,y:17.6},
          {name:'美乐美乐海',x:83.9,y:45.5},
          {name:'好奥乐墓园',x:21.2,y:51.7},
          {name:'马哈罗山路',x:29.6,y:8.6},
          {name:'十克拉山丘',x:64.1,y:46.5},
          {name:'美乐美乐花园',x:35.5,y:9.1},
          {name:'通海洞穴',x:32.4,y:14.5},
          {name:'树果园',x:5.9,y:48.1},
          {name:'葱郁洞窟',x:21.6,y:15.7},
          {name:'战争遗迹',x:30.6,y:20.9},
          {name:'海滩洞穴',x:1.6,y:48.9}
        ]
      },
      {name:'乌拉乌拉岛',x:80.6,y:68.6,img:'https://img.baibai.cv/f/3r1zhe/%E4%B9%8C%E6%8B%89%E4%B9%8C%E6%8B%89%E5%B2%9B.png',
        towns:[
          {name:'马利埃静市',x:69.6,y:25.5},
          {name:'卡璞村',x:58,y:39.4},
          {name:'魄镇',x:31.6,y:9.5}
        ],
        roads:[
          {name:'10号道路',x:52,y:17.7},
          {name:'17号道路',x:35.7,y:18.1},
          {name:'16号道路',x:28.8,y:30.4},
          {name:'15号水路',x:21.8,y:70.3},
          {name:'14号道路',x:48.2,y:81},
          {name:'13号道路',x:71.3,y:52.6},
          {name:'11号道路',x:73.9,y:33.4},
          {name:'12号道路',x:83,y:45.3}
        ],
        specials:[
          {name:'乌拉乌拉海滩',x:94.2,y:57.9},
          {name:'辉克拉尼山',x:47.7,y:18},
          {name:'拉纳基拉山',x:53,y:31.8},
          {name:'哈伊纳沙漠',x:70.4,y:46.5},
          {name:'乌拉乌拉花园',x:23.5,y:33.1},
          {name:'以太之家',x:46.1,y:68},
          {name:'辉克拉尼天文台',x:51.1,y:13.2},
          {name:'超值超市旧址',x:62.6,y:81.6},
          {name:'宝可梦联盟',x:52.6,y:26.6},
          {name:'丰收遗迹',x:68.6,y:41.3}
        ]
      },
      {name:'阿卡拉岛',x:61.5,y:30,img:'https://img.baibai.cv/f/Xm1yUd/%E9%98%BF%E5%8D%A1%E6%8B%89%E5%B2%9B.png',
        towns:[
          {name:'可霓可市',x:17,y:81},
          {name:'欧哈纳镇',x:33.7,y:32.6},
          {name:'慷待市',x:22.7,y:59.2},
          {name:'豪诺豪诺度假地',x:64,y:56.1},
          {name:'皇家大道',x:55.5,y:28.8}
        ],
        roads:[
          {name:'8号道路',x:24.2,y:3.9},
          {name:'5号道路',x:26.5,y:14.3},
          {name:'7号道路',x:59.7,y:12.5},
          {name:'4号道路',x:29.3,y:45.2},
          {name:'6号道路',x:41.9,y:35.3},
          {name:'9号道路',x:32.1,y:89.8}
        ],
        specials:[
          {name:'慷待海滩',x:16.1,y:47.8},
          {name:'豪诺豪诺海滩',x:76.1,y:59.8},
          {name:'潺潺之丘',x:14.8,y:15.8},
          {name:'维拉火山公园',x:64.2,y:18.2},
          {name:'树荫丛林',x:32.1,y:10.7},
          {name:'地鼠隧道',x:33.1,y:70.4},
          {name:'回忆之丘',x:35.9,y:88.6},
          {name:'生命遗迹',x:43.7,y:84.6},
          {name:'皮卡丘山谷',x:26.9,y:43.9},
          {name:'分隔岭隧道',x:55.1,y:7.3},
          {name:'欧哈纳牧场',x:32,y:25.3}
        ]
      },
      {name:'波尼岛',x:17.2,y:50.2,img:'https://img.baibai.cv/f/B6RYfX/%E6%B3%A2%E5%B0%BC%E5%B2%9B.png',
        towns:[
          {name:'海洋居民之村',x:39.9,y:83.8}
        ],
        roads:[],
        specials:[
          {name:'波尼险路',x:39.4,y:20.5},
          {name:'波尼海岸',x:80.9,y:30.6},
          {name:'波尼旷野',x:57.4,y:33.6},
          {name:'波尼树林',x:61.7,y:42},
          {name:'波尼鼓浪岩岸',x:77.9,y:51.3},
          {name:'波尼古道',x:54,y:52.5},
          {name:'波尼原野',x:27.6,y:63.2},
          {name:'波尼海滩',x:15.2,y:76.1},
          {name:'椰蛋树岛',x:7.1,y:93.8},
          {name:'波尼大峡谷',x:44,y:43.8},
          {name:'日轮祭坛',x:21,y:30.1},
          {name:'月轮祭坛',x:23.2,y:31.7},
          {name:'彼岸遗迹',x:79.8,y:42.6},
          {name:'波尼花园',x:74.5,y:30.8},
          {name:'旷野洞窟',x:53.3,y:26.7},
          {name:'终结洞窟',x:49.3,y:22.2},
          {name:'对战树',x:26.1,y:16.8}
        ]
      },
      {name:'以太乐园',x:44,y:45.1,img:'',
        towns:[],
        roads:[],
        specials:[]
      }
    ]
  },
  {
  name:'帕底亚',
  img:'https://img.baibai.cv/f/AznmHX/%E5%B8%95%E5%BA%95%E4%BA%9A.png',
  towns:[
    {name:'小匙镇',x:47.9,y:91.7},
    {name:'平碟镇',x:47.9,y:74.6},
    {name:'桌台市',x:47.9,y:61.4},
    {name:'深钵镇',x:78.4,y:56.2},
    {name:'酿光市',x:83.1,y:44.3},
    {name:'焙固镇',x:7.3,y:74.1},
    {name:'圆模镇',x:26.5,y:59.9},
    {name:'玻瓶市',x:30.3,y:35.1},
    {name:'渍沁镇',x:14.8,y:32.2},
    {name:'穴扎镇',x:66.1,y:37.5},
    {name:'锦汇镇',x:40.6,y:30.7},
    {name:'冰柜镇',x:54.1,y:4.5}
  ],
  roads:[
    {name:'南第1区',x:57.5,y:77.7},
    {name:'南第5区',x:68.5,y:71.5},
    {name:'南第3区',x:66.1,y:61.6},
    {name:'东第1区',x:71.8,y:47.4},
    {name:'东第2区',x:76.5,y:46.1},
    {name:'东第3区',x:72.8,y:36.9},
    {name:'北第2区',x:84.7,y:23.9},
    {name:'北第1区',x:69.1,y:17.3},
    {name:'北第3区',x:44.6,y:8.7},
    {name:'西第3区',x:40,y:26.1},
    {name:'西第2区',x:22.3,y:28.9},
    {name:'西第1区',x:16.4,y:50},
    {name:'南第2区',x:31.1,y:58.8},
    {name:'南第4区',x:33.6,y:75.5},
    {name:'南第6区',x:16.2,y:72.4}
  ],
  specials:[
    {name:'小匙小径',x:50.8,y:84.4},
    {name:'朽木之祠',x:65.6,y:80.9},
    {name:'火难之祠',x:77.9,y:21.4},
    {name:'尘土之祠',x:25.8,y:14.5},
    {name:'冻裂之祠',x:5.2,y:43.6},
    {name:'橘子学院|葡萄学院',x:48.2,y:54.4},
    {name:'第零区|零区研究所',x:49.1,y:42.6},
    {name:'帕底亚巨坑',x:49.3,y:38.9},
    {name:'南帕底亚海',x:47.8,y:98.4},
    {name:'北帕底亚海',x:44.6,y:2.4},
    {name:'西帕底亚海',x:2.8,y:28.9},
    {name:'东帕底亚海',x:95.9,y:39.6},
    {name:'印记树林',x:65.6,y:30.2},
    {name:'霜抹山',x:55.2,y:14.3},
    {name:'锦穴山道',x:55.6,y:26.6},
    {name:'大锅湖',x:27.9,y:22.7},
    {name:'锅巴林道',x:27.4,y:14.5},
    {name:'烘烘沙漠',x:20.7,y:37.5},
    {name:'宝可梦联盟',x:36.6,y:47.7},
    {name:'烘固空洞',x:10.3,y:71.1}
  ]
  }

];
var MAPS=pkmHudClone(MAPS_DATA);

/* 地图图片直接走 URL + 浏览器 HTTP 缓存（图床返回 Cache-Control max-age=28 天），不再写入 IndexedDB，省约 30MB 空间与内存。 */
function mapImgSrc(url){return url||'';}
/* 升级清理：删除旧版地图 IndexedDB 缓存库，释放其占用空间。 */
(function(){
  try{
    var idb=WIN.indexedDB||window.indexedDB;
    if(!idb||!idb.deleteDatabase)return;
    var rq=idb.deleteDatabase('pkm_hud_mapcache');
    rq.onblocked=rq.onerror=function(){};
    rq.onsuccess=function(){hudDiagInc('mapCacheLegacyCleared',1);};
  }catch(e){}
})();
var activeMap='';
var alolaIsland=-1;
var mapSpotOn=false;
var mapFilter={town:false,road:false,special:false};
var mapLabelSize=10;
var mapManualControlsOpen=false;
var mapViewerResizeObserver=null,mapViewerWindowResizeHandler=null,mapViewerVisualViewportHandler=null,mapViewerVisualViewport=null;
try{var _mls=parseInt(localStorage.getItem('pk_maplabelsize'),10);if(_mls>=6&&_mls<=24)mapLabelSize=_mls;}catch(e){}
function updateMapLabels(wrap){
  if(!wrap)return;
  var scale=wrap._mapScale||1;
  var tx=wrap._mapTx||0;
  var ty=wrap._mapTy||0;
  var stage=wrap.querySelector('.map-stage');
  var sw=(stage&&stage.offsetWidth)||wrap.clientWidth||1;
  var sh=(stage&&stage.offsetHeight)||1;
  var els=wrap.querySelectorAll('[data-x][data-y]');
  for(var i=0;i<els.length;i++){
    var el=els[i];
    var x=parseFloat(el.getAttribute('data-x'))||0;
    var y=parseFloat(el.getAttribute('data-y'))||0;
    el.style.left=(x/100*sw*scale+tx)+'px';
    el.style.top=(y/100*sh*scale+ty)+'px';
  }
  var lbls=wrap.querySelectorAll('.map-spot-label,.map-pin-label');
for(var j=0;j<lbls.length;j++){lbls[j].style.fontSize=mapLabelSize+'px';}
}
function mapAllSpots(map){
  var out=[];
  var cats=[['towns','town'],['roads','road'],['specials','special']];
  function pushList(list,cat,island){
    if(!list)return;
    for(var j=0;j<list.length;j++){
      var s=list[j];
      var o={name:s.name,x:s.x,y:s.y,cat:cat};
      if(island){o.island=island.idx;o.islandName=island.name;}
      out.push(o);
    }
  }
  if(map.islands){
    for(var i=0;i<map.islands.length;i++){
      var is=map.islands[i];
      for(var ci=0;ci<cats.length;ci++){
        pushList(is[cats[ci][0]],cats[ci][1],{idx:i,name:is.name});
      }
    }
    return out;
  }
  for(var ci2=0;ci2<cats.length;ci2++){
    pushList(map[cats[ci2][0]],cats[ci2][1],null);
  }
  return out;
}

function cnNumToInt(s){
  s=String(s||'').trim();
  if(!s)return null;
  if(/^\d+$/.test(s))return parseInt(s,10);
  if(!/^[零〇一二两三四五六七八九十百千万]+$/.test(s))return null;
  var m={零:0,〇:0,一:1,二:2,两:2,三:3,四:4,五:5,六:6,七:7,八:8,九:9};
  var u={十:10,百:100,千:1000,万:10000};
  var total=0,section=0,number=0;
  for(var i=0;i<s.length;i++){
    var c=s[i];
    if(m[c]!==undefined){number=m[c];}
    else if(u[c]!==undefined){
      if(u[c]===10000){section=(section+number)*10000;total+=section;section=0;number=0;}
      else{if(number===0)number=1;section+=number*u[c];number=0;}
    }
  }
  return total+section+number;
}
function cnNumNormalize(s){
  s=String(s||'');
  return s.replace(/[零〇一二两三四五六七八九十百千万]+/g,function(x){var v=cnNumToInt(x);return (v===null)?x:String(v);});
}
function normLoc(s){return cnNumNormalize(t2s(String(s||'').trim()));}
function normLocParts(s){
  var t=String(s||'').split(/[|｜、/／]+/);
  var out=[];
  for(var i=0;i<t.length;i++){
    var v=normLoc(t[i]);
    if(v&&out.indexOf(v)<0)out.push(v);
  }
  return out;
}
function findSpot(map,loc){
  if(!map||!loc)return null;
  var l=normLoc(loc);
  if(!l)return null;
  var all=mapAllSpots(map);
  for(var i=0;i<all.length;i++){
    var parts=normLocParts(all[i].name);
    if(parts.indexOf(l)>=0)return all[i];
  }
  for(var j=0;j<all.length;j++){
    var parts=normLocParts(all[j].name);
    for(var p=0;p<parts.length;p++){
      var n=parts[p];
      if(n&&(l.indexOf(n)>=0||n.indexOf(l)>=0))return all[j];
    }
  }
  return null;
}
function regionOfLocation(loc){
  var s=String(loc||'').trim();
  if(!s)return '';
  var r=regionFromLocation(s);
  if(r)return r;
  var l=normLoc(s);
  var hits=[];
  for(var i=0;i<MAPS.length;i++){
    var all=mapAllSpots(MAPS[i]);
    for(var j=0;j<all.length;j++){
      var parts=normLocParts(all[j].name);
      if(parts.indexOf(l)>=0){hits.push(MAPS[i].name);break;}
    }
  }
  if(hits.length===1)return hits[0];
  if(!hits.length){
    var hits2=[];
    for(var i2=0;i2<MAPS.length;i2++){
      var all2=mapAllSpots(MAPS[i2]);
      for(var j2=0;j2<all2.length;j2++){
        var parts2=normLocParts(all2[j2].name);
        for(var p2=0;p2<parts2.length;p2++){
          var n=parts2[p2];
          if(n&&(l.indexOf(n)>=0||n.indexOf(l)>=0)){hits2.push(MAPS[i2].name);break;}
        }
      }
    }
    if(hits2.length===1)return hits2[0];
  }
  return '';
}
function mapSpotLabelsHTML(all,curName){
  return all.map(function(sp){
    if(curName&&normLoc(sp.name)===curName)return '';
    return '<div class="map-spot-label" data-cat="'+esc(sp.cat)+'" data-x="'+sp.x+'" data-y="'+sp.y+'">'+esc(sp.name)+'</div>';
  }).join('');
}
function mapControlsHTML(){
  var filterBar='<div class="map-filter'+(mapSpotOn?' show':'')+'" data-map-filter>'+
  '<button class="map-tab'+(mapFilter.town?' active':'')+'" data-mcat="town">🏙 城镇</button>'+
  '<button class="map-tab'+(mapFilter.road?' active':'')+'" data-mcat="road">🛣 道路</button>'+
  '<button class="map-tab'+(mapFilter.special?' active':'')+'" data-mcat="special">✨ 特殊地点</button>'+
  '</div>';
  var sizeBtn='<button class="map-size-btn" data-map-size-btn>🔤 字号 '+mapLabelSize+'</button>';
  var sizePop='<div class="map-size-pop" data-map-size-pop><span class="dim">名称字号</span><input type="range" min="6" max="24" step="1" value="'+mapLabelSize+'" data-map-size><span class="dim" data-map-size-val>'+mapLabelSize+'px</span><button class="map-size-done" data-map-size-done>✓</button></div>';
  return '<div class="map-controls">'+sizeBtn+filterBar+sizePop+'</div>';
}
function mapToolbarHTML(tabs,extraRight){
  return '<div class="map-toolbar"><div class="map-tabs">'+tabs+'</div>'+(extraRight||'')+'</div>';
}
function mapManualControlsHTML(){
  return '<div class="map-manual-controls" data-map-manual-controls aria-hidden="'+(mapManualControlsOpen?'false':'true')+'">'+
    '<div class="map-dpad" aria-label="视角方向控制">'+
      '<button type="button" class="map-manual-btn" data-map-pan="up" title="视角向上移动" aria-label="视角向上移动">↑</button>'+
      '<button type="button" class="map-manual-btn" data-map-pan="left" title="视角向左移动" aria-label="视角向左移动">←</button>'+
      '<span class="map-dpad-core" aria-hidden="true"></span>'+
      '<button type="button" class="map-manual-btn" data-map-pan="right" title="视角向右移动" aria-label="视角向右移动">→</button>'+
      '<button type="button" class="map-manual-btn" data-map-pan="down" title="视角向下移动" aria-label="视角向下移动">↓</button>'+
    '</div>'+
    '<div class="map-zoom-pad" aria-label="地图缩放控制">'+
      '<button type="button" class="map-manual-btn" data-map-zoom="out" title="缩小地图" aria-label="缩小地图">−</button>'+
      '<button type="button" class="map-manual-btn" data-map-zoom="in" title="放大地图" aria-label="放大地图">＋</button>'+
    '</div>'+
  '</div>';
}
function mapViewerFrameHTML(wrapHtml){
  return '<div class="map-viewer-frame'+(mapManualControlsOpen?' manual-open':'')+'" data-map-viewer-frame>'+wrapHtml+mapManualControlsHTML()+'</div>';
}
function mapWrapHTML(v,spot,loc,pinNote){
  var all=mapAllSpots(v);
  var curName=spot?normLoc(spot.name):'';
  var spotLabels=mapSpotLabelsHTML(all,curName);
  var wrapCls='map-wrap';
  if(mapSpotOn){
    wrapCls+=' show-all';
    for(var k in mapFilter){if(mapFilter[k])wrapCls+=' show-'+k;}
  }
  if(v.img){
    var pin='';
    if(spot){
      pin='<div class="map-pin-label" data-x="'+spot.x+'" data-y="'+spot.y+'">'+esc(spot.name)+'</div><div class="map-pin" data-x="'+spot.x+'" data-y="'+spot.y+'"></div>';
    }
    var inner='<div class="'+wrapCls+'" data-mapwrap><div class="map-stage"><img class="map-img" data-src="'+esc(v.img)+'" src="'+esc(mapImgSrc(v.img))+'" draggable="false" onerror="this.style.display=\'none\'"></div><div class="map-labels">'+spotLabels+pin+'</div></div>';
    var framed=mapViewerFrameHTML(inner);
    if(!spot)framed+='<div class="map-no-loc">📍 当前位置：'+esc(loc||'未知')+(pinNote||'（本图未匹配到坐标）')+'</div>';
    return framed;
  }
  return '<div class="empty">该地图没配图片链接</div>';
}
function mapHTML(){
  if(!MAPS.length)return '<div class="map-page"><div class="empty">暂未配置地图</div></div>';
  if(!MAPS.some(function(x){return x.name===activeMap;}))activeMap=MAPS[0].name;
  var m=MAPS.filter(function(x){return x.name===activeMap;})[0]||MAPS[0];
  var loc=(stat_data.环境&&stat_data.环境.当前地点)||'';
  var locRegion=regionOfLocation(loc);
  var tabs=MAPS.map(function(x){return '<button class="map-tab'+(x.name===m.name?' active':'')+'" data-map="'+esc(x.name)+'">'+esc(x.name)+'</button>';}).join('');
  var hint='<div class="map-zoom-hint">👁 开启地点显示 · 城镇/道路/特殊地点可组合点选 · 点击「字号」弹出滑条 · 单指/鼠标拖动 · 双指/滚轮缩放 · 右上角「🎮」可展开方向/缩放按键 · 双击复位</div>';
  var eye='<button class="map-eye'+(mapSpotOn?' on':'')+'" data-map-eye title="点击显示/隐藏地点">👁</button>';

  if(m.islands){
    if(alolaIsland<0||!m.islands[alolaIsland]||!m.islands[alolaIsland].img){
      if(alolaIsland>=0)alolaIsland=-1;
      var spot=null,pinNote='';
      if(locRegion){
        if(m.name===locRegion)spot=findSpot(m,loc);
        else pinNote='（当前位置在'+esc(locRegion)+'，不在此图）';
      }else{spot=findSpot(m,loc);}
      var labels=m.islands.map(function(is,i){
        var hl=(spot&&spot.island===i);
        var cls='map-island-label'+(hl?' hl':'')+(is.img?'':' no-sub');
        var inner='<span class="il-dot"></span>'+esc(is.name)+(hl?' 📍':'');
        var tip=is.img?is.name:is.name+'（无子地图）';
        return '<div class="'+cls+'" data-island="'+i+'" data-x="'+is.x+'" data-y="'+is.y+'" title="'+esc(tip)+'">'+inner+'</div>';
      }).join('');
      var inner2='';
      if(m.img){
        inner2=mapViewerFrameHTML('<div class="map-wrap" data-mapwrap><div class="map-stage"><img class="map-img" data-src="'+esc(m.img)+'" src="'+esc(mapImgSrc(m.img))+'" draggable="false" onerror="this.style.display=\'none\'"></div><div class="map-labels">'+labels+'</div></div>');
      }else{
        inner2='<div class="empty">该地图没配图片链接</div>';
      }
      var status='';
      if(spot&&m.islands[spot.island])status='<div class="map-no-loc">📍 当前位置：'+esc(spot.name)+'（'+esc(m.islands[spot.island].name)+'）</div>';
      else if(pinNote)status='<div class="map-no-loc">📍 当前位置：'+esc(loc||'未知')+pinNote+'</div>';
      else status='<div class="map-no-loc">📍 当前位置：'+esc(loc||'未知')+'（大图未匹配到坐标）</div>';
      return '<div class="map-page">'+mapToolbarHTML(tabs,'')+inner2+status+'<div class="map-zoom-hint">👆 点击岛屿进入该岛地图 · 发光的岛屿是当前所在 · 单指/鼠标拖动 · 双指/滚轮缩放 · 右上角「🎮」可展开方向/缩放按键 · 双击复位</div></div>';
    }
    var is=m.islands[alolaIsland];
    var v={name:is.name,img:is.img,towns:is.towns||[],roads:is.roads||[],specials:is.specials||[]};
    var spot2=null,pinNote2='';
    if(locRegion){
      if(m.name===locRegion)spot2=findSpot(v,loc);
      else pinNote2='（当前位置在'+esc(locRegion)+'，不在此图）';
    }else{spot2=findSpot(v,loc);}
    var backBtn='<button class="map-back-btn" data-map-back>← 返回阿罗拉大图</button>';
    return '<div class="map-page">'+mapToolbarHTML(tabs,backBtn+eye)+mapControlsHTML()+mapWrapHTML(v,spot2,loc,pinNote2)+hint+'</div>';
  }

  var spot3=null,pinNote3='';
  if(locRegion){
    if(m.name===locRegion)spot3=findSpot(m,loc);
    else pinNote3='（当前位置在'+esc(locRegion)+'，不在此图）';
  }else{spot3=findSpot(m,loc);}
  return '<div class="map-page">'+mapToolbarHTML(tabs,eye)+mapControlsHTML()+mapWrapHTML(m,spot3,loc,pinNote3)+hint+'</div>';
}
function bindMapViewer(wrap){
  if(!wrap||wrap._mapViewerBound)return;
  var stage=wrap.querySelector('.map-stage');
  if(!stage)return;
  wrap._mapViewerBound=true;
  var fitScale=1,scale=1,tx=0,ty=0,MAX=8,fitted=false;
  function computeFit(){
    var rw=wrap.clientWidth||1,rh=wrap.clientHeight||1;
    var sw=stage.offsetWidth||1,sh=stage.offsetHeight||1;
    var f=Math.min(rw/sw,rh/sh);
    if(!isFinite(f)||f<0.02)f=1;
    if(f>1)f=1;
    return f;
  }
  function apply(){
    var rw=wrap.clientWidth||1,rh=wrap.clientHeight||1;
    var sw=(stage.offsetWidth||rw)*scale,sh=(stage.offsetHeight||rh)*scale;
    if(sw<=rw){tx=(rw-sw)/2;}else{tx=Math.min(0,Math.max(tx,rw-sw));}
    if(sh<=rh){ty=(rh-sh)/2;}else{ty=Math.min(0,Math.max(ty,rh-sh));}
    stage.style.transform='translate('+tx+'px,'+ty+'px) scale('+scale+')';
    wrap._mapScale=scale;wrap._mapTx=tx;wrap._mapTy=ty;
    updateMapLabels(wrap);
  }
  function zoomAt(factor,ox,oy){
    factor=Number(factor)||1;
    var ns=Math.max(fitScale,Math.min(MAX,scale*factor));
    if(Math.abs(ns-scale)<0.0001)return;
    ox=Number.isFinite(Number(ox))?Number(ox):(wrap.clientWidth||1)/2;
    oy=Number.isFinite(Number(oy))?Number(oy):(wrap.clientHeight||1)/2;
    var k=ns/scale;
    tx=ox-(ox-tx)*k;ty=oy-(oy-ty)*k;scale=ns;apply();
  }
  function zoomBy(factor){zoomAt(factor,(wrap.clientWidth||1)/2,(wrap.clientHeight||1)/2);}
  function panBy(dx,dy){tx+=Number(dx)||0;ty+=Number(dy)||0;apply();}
  function resetView(){scale=fitScale;tx=0;ty=0;apply();}
  var pts={},panStart=null,pinchStart=null;
  function npts(){return Object.keys(pts).length;}
  function dist(a,b){var dx=a.x-b.x,dy=a.y-b.y;return Math.sqrt(dx*dx+dy*dy);}
  function pointerDown(e){
    try{wrap.setPointerCapture(e.pointerId);}catch(err){}
    pts[e.pointerId]={x:e.clientX,y:e.clientY};
    if(npts()===1){panStart={x:e.clientX,y:e.clientY,tx:tx,ty:ty};pinchStart=null;wrap.classList.add('dragging');}
    else if(npts()===2){panStart=null;var ks=Object.keys(pts);pinchStart={d:dist(pts[ks[0]],pts[ks[1]]),scale:scale};}
    if(e.cancelable)e.preventDefault();
  }
  function pointerMove(e){
    if(!pts[e.pointerId])return;
    pts[e.pointerId]={x:e.clientX,y:e.clientY};
    if(npts()===1&&panStart){tx=panStart.tx+(e.clientX-panStart.x);ty=panStart.ty+(e.clientY-panStart.y);apply();}
    else if(npts()===2&&pinchStart){
      var ks=Object.keys(pts),d=dist(pts[ks[0]],pts[ks[1]]);
      if(pinchStart.d>0){
        var ns=Math.max(fitScale,Math.min(MAX,pinchStart.scale*d/pinchStart.d));
        var mid={x:(pts[ks[0]].x+pts[ks[1]].x)/2,y:(pts[ks[0]].y+pts[ks[1]].y)/2};
        var r=wrap.getBoundingClientRect(),ox=mid.x-r.left,oy=mid.y-r.top,k=ns/scale;
        tx=ox-(ox-tx)*k;ty=oy-(oy-ty)*k;scale=ns;apply();
      }
    }
    if(e.cancelable)e.preventDefault();
  }
  function rel(e){
    delete pts[e.pointerId];
    if(npts()===0){panStart=null;pinchStart=null;wrap.classList.remove('dragging');}
    else if(npts()===1){pinchStart=null;var k0=Object.keys(pts)[0];panStart={x:pts[k0].x,y:pts[k0].y,tx:tx,ty:ty};}
  }
  if('PointerEvent' in WIN||'onpointerdown' in wrap){
    wrap.addEventListener('pointerdown',pointerDown,{passive:false});
    wrap.addEventListener('pointermove',pointerMove,{passive:false});
    wrap.addEventListener('pointerup',rel);
    wrap.addEventListener('pointercancel',rel);
    wrap.addEventListener('lostpointercapture',rel);
  }else{
    var touchPan=null,touchPinch=null;
    wrap.addEventListener('touchstart',function(e){
      var ts=e.touches||[];
      if(ts.length===1){touchPan={x:ts[0].clientX,y:ts[0].clientY,tx:tx,ty:ty};touchPinch=null;wrap.classList.add('dragging');}
      else if(ts.length>=2){touchPan=null;touchPinch={d:dist({x:ts[0].clientX,y:ts[0].clientY},{x:ts[1].clientX,y:ts[1].clientY}),scale:scale};}
      if(e.cancelable)e.preventDefault();
    },{passive:false});
    wrap.addEventListener('touchmove',function(e){
      var ts=e.touches||[];
      if(ts.length===1&&touchPan){tx=touchPan.tx+(ts[0].clientX-touchPan.x);ty=touchPan.ty+(ts[0].clientY-touchPan.y);apply();}
      else if(ts.length>=2&&touchPinch&&touchPinch.d>0){
        var a={x:ts[0].clientX,y:ts[0].clientY},b={x:ts[1].clientX,y:ts[1].clientY},d=dist(a,b),ns=Math.max(fitScale,Math.min(MAX,touchPinch.scale*d/touchPinch.d));
        var r=wrap.getBoundingClientRect(),ox=(a.x+b.x)/2-r.left,oy=(a.y+b.y)/2-r.top,k=ns/scale;
        tx=ox-(ox-tx)*k;ty=oy-(oy-ty)*k;scale=ns;apply();
      }
      if(e.cancelable)e.preventDefault();
    },{passive:false});
    function touchEnd(e){if(!(e.touches&&e.touches.length)){touchPan=null;touchPinch=null;wrap.classList.remove('dragging');}}
    wrap.addEventListener('touchend',touchEnd);wrap.addEventListener('touchcancel',touchEnd);
  }
  wrap.addEventListener('wheel',function(e){
    e.preventDefault();
    var r=wrap.getBoundingClientRect();
    zoomAt(e.deltaY<0?1.15:1/1.15,e.clientX-r.left,e.clientY-r.top);
  },{passive:false});
  wrap.addEventListener('dblclick',function(e){if(e)e.preventDefault();resetView();});
  var mapImgEl=wrap.querySelector('.map-img');
  
  function fitMap(reset){
    var vp=vpSize(),compact=Math.min(vp.w,vp.h)<=600;
    var page=wrap.closest('.page');
    var maxW=Math.min(Math.floor(vp.w*(compact?0.92:0.94)),compact?760:900);
    var availW=maxW-8;if(availW<120)availW=120;
    var availH=Math.floor(vp.h*(compact?0.90:0.82));
    if(page){
      var pr=page.getBoundingClientRect(),wr=wrap.getBoundingClientRect();
      var hint=page.querySelector('.map-zoom-hint'),noLoc=page.querySelector('.map-no-loc');
      var manual=page.querySelector('[data-map-manual-controls]');
      var above=Math.max(0,wr.top-pr.top);
      var below=(hint?hint.offsetHeight:0)+(noLoc?noLoc.offsetHeight:0)+((manual&&mapManualControlsOpen)?manual.offsetHeight:0)+(compact?20:34);
      availH=Math.floor(vp.h*(compact?0.90:0.82))-above-below;
      if(availH<(compact?140:120))availH=compact?140:120;
    }
    var nw=mapImgEl&&mapImgEl.naturalWidth||0,nh=mapImgEl&&mapImgEl.naturalHeight||0;
    var imgW=availW,imgH=Math.round(availW*0.75);
    if(nw>0&&nh>0){var ar=nw/nh;imgH=Math.round(availW/ar);if(imgH>availH){imgH=availH;imgW=Math.round(imgH*ar);}if(imgW<40)imgW=40;if(imgH<40)imgH=40;}
    else if(imgH>availH)imgH=availH;
    wrap.style.width=imgW+'px';wrap.style.height=imgH+'px';wrap.style.margin='0 auto';
    var frame=wrap.closest('[data-map-viewer-frame]');if(frame){frame.style.width=imgW+'px';frame.style.maxWidth='100%';}
    fitScale=computeFit();
    if(!fitted||reset===true){scale=fitScale;tx=0;ty=0;fitted=true;}
    else{scale=Math.max(fitScale,Math.min(MAX,scale));}
    apply();
  }
  wrap._mapApi={panBy:panBy,zoomBy:zoomBy,reset:resetView,refit:function(reset){fitMap(reset===true);},getState:function(){return {scale:scale,fitScale:fitScale,tx:tx,ty:ty};}};
  if(mapImgEl){if(mapImgEl.complete&&mapImgEl.naturalWidth)fitMap(true);mapImgEl.addEventListener('load',function(){fitMap(true);});}
  fitMap(true);
  var _fitT=null;
  function _scheduleFit(){if(_fitT)return;_fitT=hudScope.setTimeout(function(){_fitT=null;try{hudSyncMapPopoutHeight();}catch(_e){}if(wrap&&wrap.isConnected!==false)fitMap(false);},100);}
  try{
    if(mapViewerResizeObserver){try{mapViewerResizeObserver.disconnect();}catch(e){}}
    var RO=(typeof ResizeObserver!=='undefined')?ResizeObserver:null;
    if(RO){var _ro=new RO(_scheduleFit),_pg=wrap.closest('.page');if(_pg)_ro.observe(_pg);mapViewerResizeObserver=_ro;hudScope.cleanup(function(){try{if(mapViewerResizeObserver===_ro){_ro.disconnect();mapViewerResizeObserver=null;}}catch(e){}});}
  }catch(e){}
  try{
    if(mapViewerWindowResizeHandler)WIN.removeEventListener('resize',mapViewerWindowResizeHandler);
    mapViewerWindowResizeHandler=_scheduleFit;WIN.addEventListener('resize',_scheduleFit);
    hudScope.cleanup(function(){try{if(mapViewerWindowResizeHandler===_scheduleFit){WIN.removeEventListener('resize',_scheduleFit);mapViewerWindowResizeHandler=null;}}catch(e){}});
  }catch(e2){}
  try{
    var vv=WIN.visualViewport||window.visualViewport;
    if(mapViewerVisualViewport&&mapViewerVisualViewportHandler){try{mapViewerVisualViewport.removeEventListener('resize',mapViewerVisualViewportHandler);}catch(e){}}
    if(vv&&vv.addEventListener){mapViewerVisualViewport=vv;mapViewerVisualViewportHandler=_scheduleFit;vv.addEventListener('resize',_scheduleFit);hudScope.cleanup(function(){try{if(mapViewerVisualViewport===vv&&mapViewerVisualViewportHandler===_scheduleFit){vv.removeEventListener('resize',_scheduleFit);mapViewerVisualViewport=null;mapViewerVisualViewportHandler=null;}}catch(e){}});}
  }catch(e3){}
}


var activeBox='1';var nearbyOpen=false;var foldState={};function foldHTML(key,label,fn){var open=!!foldState[key];return '<div class="fold-box"><div class="fold-head" data-fold="'+key+'"><span>'+label+'</span><span class="fold-arrow">'+(open?'▾':'▸')+'</span></div>'+(open?'<div class="fold-body">'+fn()+'</div>':'')+'</div>';}function bagPlainHTML(){var tabs=bagCategories().map(function(c){return '<button class="bag-tab'+(c.key===activeBag?' active':'')+'" data-bag="'+c.key+'">'+c.label+'</button>';}).join('');return '<div class="fold-inner"><div class="bag-tabs">'+tabs+'</div><div class="bag-list" id="bag-list">'+bagItemsHTML()+'</div></div>';}function relPlainHTML(){var rel=stat_data.人际关系||{};var ks=Object.keys(rel);if(!ks.length)return '<div class="fold-inner"><div class="empty">暂无</div></div>';return '<div class="fold-inner">'+ks.map(function(k){var val=rel[k];var score=(typeof val==='object'&&val)?num(val.好感度,0):(typeof val==='number'?val:0);return '<div class="rel-item"><span class="rel-name">'+esc(k)+'</span><div class="rel-bar"><div class="rel-fill" style="width:'+Math.max(0,Math.min(100,score))+'%"></div></div><span class="rel-val">'+score+'</span></div>';}).join('')+'</div>';}
function homeFoldHTML(){return foldHTML('bagfold','<span style="display:inline-flex;align-items:center;gap:4px"><img src="https://img.baibai.cv/f/3o2qte/1788188339193.png" style="width:18px;height:18px;object-fit:contain;image-rendering:pixelated">背包</span>',bagPlainHTML)+foldHTML('relfold','💬 人际关系',relPlainHTML);}function boxHTML(){return bw2BoxHTML();}

function tasksHTML(){var t=stat_data.任务||{},html='';if(t.主线)html+='<div class="task-item"><span class="task-tag main">主线</span><div class="task-text">'+esc(t.主线)+'</div></div>';if(t.传说)html+='<div class="task-item"><span class="task-tag legend">传说</span><div class="task-text">'+esc(t.传说)+'</div></div>';if(t.支线)html+='<div class="task-item"><span class="task-tag random">支线</span><div class="task-text">'+esc(t.支线).split(/[；;\n]/).join('<br>')+'</br></div></div>';if(!html)html='<div class="empty">暂无任务</div>';return frameP('任务',html);}
function worldHTML(){var w=stat_data.世界事件||{},html='';function ln(v){return esc(String(v||'')).split(/[；;]/).join('<br>');}if(w.附近遭遇)html+='<div class="event-item"><span class="event-type">📍 附近遭遇</span><p>'+ln(w.附近遭遇)+'</p></div>';if(w.地区新闻)html+='<div class="event-item"><span class="event-type">📰 地区新闻</span><p>'+ln(w.地区新闻)+'</p></div>';if(w.区域动态)html+='<div class="event-item"><span class="event-type">🌍 区域动态</span><p>'+ln(w.区域动态)+'</p></div>';if(!html)html='<div class="empty">暂无世界事件</div>';return '<div class="info-frame world-frame plain-frame"><div class="info-inner"><div class="info-title">世界动态</div>'+html+'</div></div>';}
function relHTML(){var rel=stat_data.人际关系||{};var entries=Object.entries(rel);if(!entries.length)return frame('人际关系','<div class="empty">暂无</div>');var html=entries.map(function(kv){var val=kv[1];var score=(typeof val==='object'&&val)?num(val.好感度,0):(typeof val==='number'?val:0);return '<div class="rel-item"><span class="rel-name">'+esc(kv[0])+'</span><div class="rel-bar"><div class="rel-fill" style="width:'+Math.max(0,Math.min(100,score))+'%"></div></div><span class="rel-val">'+score+'</span></div>';}).join('');return frame('人际关系',html);}
function rivalsHTML(){var r=stat_data.劲敌||{};var entries=Object.entries(r);if(!entries.length)return frameP('劲敌','<div class="empty">尚未遭遇劲敌</div>');var html=entries.map(function(kv){return '<div class="nearby-item" style="cursor:default"><div class="nearby-info"><div class="nearby-name">'+esc(kv[0])+'</div><div class="nearby-sub">'+esc(kv[1])+'</div></div></div>';}).join('');return frameP('劲敌',html);}
function breedingHTML(){return bw2BreedingHTML();}
function btAbiLink(n){n=String(n||'').trim();if(!n||n==='无')return esc(n);return '<span class="abi-link" data-ability="'+esc(n)+'">'+esc(n)+'</span>';}function btItemLink(n){n=String(n||'').trim();if(!n||n==='无')return esc(n);return '<span class="abi-link" data-item="'+esc(n)+'">'+esc(n)+'</span>';}function btNatureLink(n){n=String(n||'').trim();if(!n||n==='无')return esc(n);return '<span class="abi-link" data-nature="'+esc(n)+'">'+esc(n)+'</span>';}function btMoveLinks(t){return String(t||'').split(/[/,，、]/).map(function(x){var n=x.trim();if(!n)return '';return '<span class="abi-link" data-move="'+esc(n)+'">'+esc(n)+'</span>';}).filter(Boolean).join(' / ');}function btCardLine(s){s=String(s||'').trim();if(!s)return '';var m=s.match(/^(招式|技能)\s*[：:]\s*(.*)$/);if(m&&m[2])return '<div class="bt-line"><span class="bt-k">招式</span>'+btMoveLinks(m[2])+'</div>';var mi=s.match(/^(携带物|携带道具|道具|持有物)\s*[：:]\s*(.+)$/);if(mi&&mi[2])return '<div class="bt-line"><span class="bt-k">道具</span>'+btItemLink(mi[2])+'</div>';var ma=s.match(/^(特性|能力)\s*[：:]\s*(.+)$/);if(ma&&ma[2])return '<div class="bt-line"><span class="bt-k">特性</span>'+btAbiLink(ma[2])+'</div>';if(s.indexOf('·')>0){var ps=s.split('·').map(function(x){return x.trim();}).filter(Boolean);if(ps.length>=2){var out=btAbiLink(ps[0]);if(ps.length>=3){out+=' · '+btNatureLink(ps[1])+' · '+btItemLink(ps[2]);}else{out+=' · '+btItemLink(ps[1]);}return '<div class="bt-line">'+out+'</div>';}}return '<div class="bt-line">'+esc(s)+'</div>';}function sideOf(k){if(k.indexOf('敌方')>=0)return 'foe';if(k.indexOf('友方')>=0)return 'ally';if(k.indexOf('中立')>=0)return 'neu';return 'self';}function btCard(k,v){var side=sideOf(k),segs=String(v||'').split(/[｜|]/),nm=String(k).replace(/[（(](我方|友方|中立|敌方)[)）]/,'').trim(),tr='',pk=nm,di=nm.indexOf('·');if(di>0){tr=nm.slice(0,di);pk=nm.slice(di+1);}var lv='',hpc=0,hpm=0,rest=[];for(var i=0;i<segs.length;i++){var s=segs[i].trim();if(!s)continue;if(i===0){var lm=s.match(/Lv\.?\s*(\d+)/i);if(lm)lv=lm[1];var hm=s.match(/(\d+)\s*\/\s*(\d+)/);if(hm){hpc=parseInt(hm[1],10);hpm=parseInt(hm[2],10);}continue;}if(s.indexOf('阶级')===0){var bd=s.replace(/^阶级[：:\s]*/,'').trim();if(bd&&bd!=='无')rest.push('<div class="bt-line"><span class="bt-k">阶级</span>'+esc(bd).replace(/([+\-])(\d)/g,function(a,g,n){return '<b class="'+(g==='-'?'st-dn':'st-up')+'">'+g+n+'</b>';})+'</div>');continue;}if(s.indexOf('状态')===0){var stx=s.replace(/^状态[：:\s]*/,'').trim();if(stx&&stx!=='无')rest.push('<div class="bt-line"><span class="bt-k">状态</span>'+stx.split(/[,，、\/]/).map(function(x){return statusTag(x.trim());}).join(' ')+'</div>');continue;}rest.push(btCardLine(s));}var pct=hpm>0?Math.max(0,Math.min(100,hpc/hpm*100)):0;var hc=pct>=50?'hp-high':pct>=20?'hp-mid':'hp-low';var fnt=(hpm>0&&hpc<=0)?'<span class="ailment fnt">圈圈眼</span>':'';return '<div class="bt-card '+side+'"><div class="bt-head"><span class="bt-pk">'+esc(pk)+fnt+'</span>'+(lv?'<span class="bt-lv">Lv.'+esc(lv)+'</span>':'')+'</div>'+(tr?'<div class="bt-tr">'+esc(tr)+'</div>':'')+(hpm>0?'<div class="bt-hp"><div class="hp-bar"><div class="hp-fill '+hc+'" style="width:'+pct+'%"></div></div><span class="bt-hpn">'+hpc+'/'+hpm+'</span></div>':'')+rest.join('')+'</div>';}function btNormType(t){t=String(t||'').trim();var m={'飞':'飞行','超':'超能力','地':'地面','岩':'岩石','幽':'幽灵','普':'一般'};return m[t]||t;}function btQueueName(seg){var s=String(seg||'').replace(/^队列\s*\d+\s*[.．、]\s*/,'').trim();var lv='';var lm=s.match(/Lv\.?\s*(\d+)/i);if(lm){lv=lm[1];s=s.slice(0,lm.index).trim();}var types=[];var m=s.match(/^(.*?)[（(]\s*([^（）()]*?)\s*[)）]\s*$/);if(m){s=m[1].trim();types=m[2].split(/[·、,，/]/).map(function(x){return btNormType(x.trim());}).filter(Boolean);}return{name:s,types:types,lv:lv};}function btQueueLine(s){s=String(s||'').trim();if(!s)return '';var m=s.match(/^(招式|技能)\s*[：:]\s*(.*)$/);if(m&&m[2])return '<div class="bt-line"><span class="bt-k">招式</span>'+btMoveLinks(m[2])+'</div>';if(s.indexOf('·')>0){var ps=s.split('·').map(function(x){return x.trim();}).filter(Boolean);if(ps.length){var out='<span class="bt-k">特性</span>'+btAbiLink(ps[0]);if(ps[1])out+=' · <span class="bt-k">道具</span>'+btItemLink(ps[1]);return '<div class="bt-line">'+out+'</div>';}}return '<div class="bt-line">'+esc(s)+'</div>';}function btQueueCard(q){var chips='';if(q.types&&q.types.length){chips='<span class="bt-types">'+q.types.map(function(t){return typeChipHTML(t);}).join('')+'</span>';}var accent=(q.types&&q.types.length)?typeColor(q.types[0]):'';var lines=(q.parts||[]).map(btQueueLine).filter(Boolean).join('');return '<div class="bt-card bt-q"'+(accent?' style="--bt-accent:'+esc(accent)+'"':'')+'><div class="bt-head"><span class="bt-pk">'+esc(q.name)+chips+'</span>'+(q.lv?'<span class="bt-lv">Lv.'+esc(q.lv)+'</span>':'')+'</div>'+lines+'</div>';}function btSideHTML(k,v){var segs=String(v||'').split(/[｜|]/).map(function(x){return x.trim();}).filter(Boolean);var tactic='',cards=[],meta=[],cur=null;for(var i=0;i<segs.length;i++){var s=segs[i];if(/^战术\s*[：:]/.test(s)){tactic=s.replace(/^战术\s*[：:]\s*/,'');continue;}if(/^队列\s*\d+\s*[.．、]/.test(s)){cur=btQueueName(s);cur.parts=[];cards.push(cur);continue;}if(/^(后备|已换下|已倒下|机制)/.test(s)){if(!/^(已换下|已倒下)\s*[：:]\s*无\s*$/.test(s))meta.push(s);continue;}if(cur)cur.parts.push(s);}var body='';if(tactic)body+='<div class="bt-tactic"><span class="bt-k">战术</span>'+esc(tactic)+'</div>';if(cards.length)body+='<div class="bt-grid">'+cards.map(btQueueCard).join('')+'</div>';if(meta.length)body+='<div class="bt-meta">'+meta.map(function(m){return '<span>'+esc(m)+'</span>';}).join('')+'</div>';return '<div class="bt-side"><div class="bt-side-h">📋 '+esc(k)+'</div><div class="bt-side-b">'+body+'</div></div>';}function battleHTML(){var b=stat_data.战场||{},html='';function ln(v){return esc(String(v||'')).split(/[｜|]/).join('<br>');}var f=b.场上||{},fk=Object.keys(f),s=b.各方||{},sk=Object.keys(s);if(b.规则)html+='<div class="bt-rule">'+ln(b.规则)+'</div>';if(b.场景)html+='<div class="bt-scene">'+ln(b.场景)+'</div>';if(fk.length)html+='<div class="bt-grid">'+fk.map(function(k){return btCard(k,f[k]);}).join('')+'</div>';if(sk.length)html+=sk.map(function(k){return btSideHTML(k,s[k]);}).join('');if(!html)return '<div class="bt-empty">当前没有正在进行的战斗</div>';return '<div class="info-frame battle-frame"><div class="info-inner"><div class="info-title">战场</div><div class="battle-list">'+html+'</div></div></div>';}



var moveCache={},moveLoading={},moveBackStack=[],preloadQueue=[],preloadTimer=null;
function pushBack(){try{if(overlay)moveBackStack.push(overlay.innerHTML);}catch(e){}}
function popBack(){return (moveBackStack&&moveBackStack.length)?moveBackStack.pop():'';}
function clearBack(){moveBackStack=[];}







/* ==== GitHub 仓库数据源（特性/招式/道具效果）==== */
var PKM_DATA_BASE='https://raw.githubusercontent.com/xianjiu0926/Pokemon/main/';
var PKM_DATA_REV='r20260930f';
var PKM_DB={abil:null,move:null,item:null,dex:null},PKM_DB_LOADING={abil:false,move:false,item:false,dex:false},PKM_DB_CBS={abil:[],move:[],item:[],dex:[]};
function pkmDbBuildIndex(data,fields){
  var idx={};
  for(var i=0;i<data.length;i++){
    for(var f=0;f<fields.length;f++){
      var v=data[i][fields[f]];
      if(v===undefined||v===null||v==='')continue;
      var k=String(v);if(!idx[k])idx[k]=data[i];
      if(fields[f]==='en'||fields[f]==='jp'){var lk=k.toLowerCase();if(!idx[lk])idx[lk]=data[i];}
      var hw=normItemName(k);if(hw!==k&&!idx[hw])idx[hw]=data[i];
    }
  }
  return idx;
}
function pkmDbLoad(kind,file,fields,cb){
  var store=PKM_DB[kind];
  if(store){cb&&cb(store);return;}
  var _c=lsGet('pk_gh_'+kind,null);
  if(_c&&_c.rev===PKM_DATA_REV&&_c.data&&_c.data.length){store={data:_c.data,idx:pkmDbBuildIndex(_c.data,fields)};PKM_DB[kind]=store;cb&&cb(store);return;}
  if(PKM_DB_LOADING[kind]){cb&&(PKM_DB_CBS[kind]=PKM_DB_CBS[kind]||[]).push(cb);return;}
  PKM_DB_LOADING[kind]=true;
  hudFetch(PKM_DATA_BASE+file)
    .then(function(r){return r.ok?r.json():Promise.reject(new Error('HTTP '+r.status));})
    .then(function(j){
      var data=(j&&j.data)||[];
      var st={data:data,idx:pkmDbBuildIndex(data,fields)};
      PKM_DB[kind]=st;PKM_DB_LOADING[kind]=false;
      if(data.length){try{lsSet('pk_gh_'+kind,{rev:PKM_DATA_REV,data:data});}catch(e){}}
      var cbs=PKM_DB_CBS[kind]||[];PKM_DB_CBS[kind]=[];
      for(var i=0;i<cbs.length;i++){try{cbs[i](st);}catch(e){}}
      if(cb)cb(st);
    })
    .catch(function(){
      PKM_DB_LOADING[kind]=false;
      var cbs=PKM_DB_CBS[kind]||[];PKM_DB_CBS[kind]=[];
      for(var i=0;i<cbs.length;i++){try{cbs[i](null);}catch(e){}}
      if(cb)cb(null);
    });
}
function pkmDbLookup(kind,name){
  var store=PKM_DB[kind];if(!store)return null;
  var n=String(name==null?'':name).trim();if(!n)return null;
  if(store.idx[n])return store.idx[n];
  var low=n.toLowerCase();if(store.idx[low])return store.idx[low];
  var hw=normItemName(n);if(hw!==n&&store.idx[hw])return store.idx[hw];
  return null;
}
function fetchMove(name,cb){
  if(!name){cb&&cb(null);return;}
  var _diy=diyGet('move',name);
  if(_diy){cb&&cb(_diy);return;}
  if(moveCache[name]&&moveCache[name].type!==undefined){cb&&cb(moveCache[name]);return;}
  var _c=lsGet('pk_mv_'+name,null);if(_c&&_c.type!==undefined){moveCache[name]=_c;cb&&cb(_c);return;}
  pkmDbLoad('move','moves.json',['name','en','jp'],function(store){
    var hit=store&&pkmDbLookup('move',moveKey(name));
    if(hit){
      var d={type:hit.type,cat:hit.cat,power:hit.power,acc:hit.acc,desc:hit.desc,eff:hit.effect};
      moveCache[name]=d;
      if(d.type!==undefined){try{lsSet('pk_mv_'+name,d);}catch(e){}}
      cb&&cb(d);return;
    }
    cb&&cb(null);
  });
}
function preloadMoves(skills){
  if(!skills)return;
  String(skills).split(/[,，/、]/).forEach(function(x){
    var p=x.split(':');
    var name=p[0]||'';
    if(name&&!moveCache[name]&&!moveLoading[name]&&preloadQueue.indexOf(name)<0)preloadQueue.push(name);
  });
  if(!preloadTimer){
    preloadTimer=hudScope.setInterval(function(){
      if(!preloadQueue.length){hudScope.clearInterval(preloadTimer);preloadTimer=null;return;}
      var name=preloadQueue.shift();
      if(name&&!moveCache[name]&&!moveLoading[name])fetchMove(name);
    },300);
  }
}
function showMoveInfo(name,type,cat){
  function rows(d){
    var t=(d&&d.type)?d.type:type;
    var c=(d&&d.cat)?d.cat:cat;
    var out='';
    if(d&&d.power)out+='<div class="row"><span class="k">威力</span><span class="v">'+esc(d.power)+'</span></div>';
    if(d&&d.acc)out+='<div class="row"><span class="k">命中</span><span class="v">'+esc(d.acc)+'</span></div>';
    out+='<div class="row"><span class="k">属性</span><span class="v">'+esc(t||'-')+'</span></div>';
    out+='<div class="row"><span class="k">分类</span><span class="v">'+esc(c||'-')+'</span></div>';
    if(d&&d.desc)out+='<div class="row block"><span class="k">描述</span><span class="v">'+esc(d.desc).replace(/\n/g,'<br>')+'</span></div>';
    if(d&&d.eff)out+='<div class="row block"><span class="k">详细效果</span><span class="v">'+esc(d.eff).replace(/\n/g,'<br>')+'</span></div>';
    return out;
  }
  subOverlay.innerHTML='<div class="modal"><div class="modal-head"><div class="modal-name">'+esc(name)+'</div><button class="close" data-sub-close>✕</button></div><div class="modal-body" id="move-body">'+rows(null)+(name?'<div class="empty">技能数据加载中...</div>':'')+'</div></div>';
  subOverlay.classList.add('open');
  if(!name)return;
  fetchMove(name,function(d){
    var b=document.querySelector('#move-body');
    if(!b)return;
    b.innerHTML=rows(d)+(d?'':'<div class="empty">技能数据获取失败</div>');
  });
}
var dexCache=null,dexLoading=false,dexCbs=[];
function fetchDex(cb){
  if(dexCache){cb&&cb(dexCache);return;}
  var _d=lsGet('pk_dexlist',null);if(_d&&_d.length){dexCache=_d;cb&&cb(dexCache);return;}
  if(dexLoading){cb&&dexCbs.push(cb);return;}
  dexLoading=true;
  pkmDbLoad('dex','dex-list.json',['en','name'],function(store){
    var data=store&&store.data?store.data:[];
    var list=[],seen={};
    for(var i=0;i<data.length;i++){
      var d=data[i];
      var no=String(d.no||'');
      if(!no)continue;
      var id=('000'+no).slice(-4);
      if(seen[id])continue;
      seen[id]=1;
      list.push({id:id,name:String(d.name||'').trim()});
    }
    dexCache=list;dexLoading=false;
    if(list.length){lsSet('pk_dexlist',list);}
    var cbs=dexCbs;dexCbs=[];
    for(var i=0;i<cbs.length;i++){try{cbs[i](list);}catch(e){}}
    if(cb)cb(list);
  });
}
var PKM_DEX_EN=(function(){var r={};for(var _k in PKM_EN_DEX){r[PKM_EN_DEX[_k]]=_k;}return r;})();
function dexCellImgUrl(ndex){
  var n=parseInt(ndex,10);
  if(!n||n<=0)return '';
  var slug=PKM_DEX_EN[n];
  if(!slug)return '';
  var full=pkmRepoUrl('static','pokeos',slug,false);
  return PKM_POKEOS_PROXY+encodeURIComponent(full)+'&w='+PKM_POKEOS_W;
}
var dexLazyObs=null;
var dexThumbCache={};



function dexLoadImg(img){
  var u=img.getAttribute('data-dexsrc');
  if(!u)return;
  img.removeAttribute('data-dexsrc');
  img.onerror=function(){try{this.style.display='none';}catch(e){}};
  img.src=u;
}
function setupDexLazy(){
  var g=document.getElementById('pokedex-grid');
  if(!g)return;
  if(dexLazyObs){try{dexLazyObs.disconnect();}catch(e){}dexLazyObs=null;}
  var imgs=g.querySelectorAll('img[data-dexsrc]');
  if(!imgs.length)return;
  var Obs=WIN.IntersectionObserver||(typeof IntersectionObserver!=='undefined'?IntersectionObserver:null);
  if(!Obs){
    for(var i=0;i<imgs.length;i++)dexLoadImg(imgs[i]);
    return;
  }
  var obs=new Obs(function(entries){
    for(var i=0;i<entries.length;i++){
      var en=entries[i];
      if(en.isIntersecting){dexLoadImg(en.target);obs.unobserve(en.target);}
    }
  },{root:g,rootMargin:'400px'});
  hudScope.observe(obs);
  dexLazyObs=obs;
  for(var j=0;j<imgs.length;j++)obs.observe(imgs[j]);
}
function clearDexGrid(){
  if(dexLazyObs){try{dexLazyObs.disconnect();}catch(e){}dexLazyObs=null;}
  var g=document.getElementById('pokedex-grid');
  if(!g)return;
  var imgs=g.querySelectorAll('img');
  for(var i=0;i<imgs.length;i++){
    var im=imgs[i];
    try{im.removeAttribute('src');im.removeAttribute('srcset');im.removeAttribute('data-dexsrc');}catch(e){}
  }
  g.innerHTML='';
}
function dexThumbsEnabled(){try{return localStorage.getItem('pk_dex_thumbs')!=='0';}catch(e){return true;}}
function dexThumbsToggle(){
  var now=!dexThumbsEnabled();
  try{localStorage.setItem('pk_dex_thumbs',now?'1':'0');}catch(e){}
  var b=pageOverlay.querySelector('[data-dex-thumb]');
  if(b)b.textContent=now?'🖼️ 缩略图':'📃 仅列表';
  renderDexRegion();
  dexSearch();
}
function renderDexGrid(list,cSet,sSet,owned){
  var g=document.getElementById('pokedex-grid');
  if(!g)return;
  g.classList.toggle('list-only',!dexThumbsEnabled());
  var t=document.getElementById('dex-total');
  if(!list){g.innerHTML='<div class="empty">图鉴数据加载失败</div>';if(t)t.textContent='—';return;}
  if(t)t.textContent=list.length;
  var showThumbs=dexThumbsEnabled();
  var html='';
  list.forEach(function(p){
    var id=p.id||'',ndex=p.ndex||id,name=p.name||'';
var bn=name.split('（')[0].split('(')[0].trim();
var caught=devUnlocked()||hitSpecies(owned,bn);
var seen=!caught&&hitSpecies(sSet,bn);
var known=caught||seen;
var cls=caught?'caught':(seen?'seen':'unknown');
var label=known?name:'？？？';
var attr=known?' data-name="'+esc(bn)+'"':' data-noclick="1"';
var imgHtml='';
if(showThumbs){var img=dexCellImgUrl(ndex);if(img){var sil=(label==='？？？')?' style="filter:brightness(0) opacity(.45) !important"':'';imgHtml='<span class="dex-img"><img decoding="async" data-dexsrc="'+esc(img)+'" referrerpolicy="origin" alt=""'+sil+'></span>';}}
html+='<div class="dex-cell '+cls+'" data-id="'+esc(ndex)+'" data-rdex="'+esc(id)+'"'+attr+'><span class="dex-no">#'+esc(id)+'</span>'+imgHtml+'<span class="dex-name">'+esc(label)+'</span></div>';
  });
  g.innerHTML=html;
  setupDexLazy();
}
var dexTimer=null;
function dexApplyFilter(){
  var q=document.getElementById('dex-search-input');
  var v=q?q.value.trim():'';
  var cells=document.querySelectorAll('#pokedex-grid .dex-cell');
  for(var i=0;i<cells.length;i++){
    var c=cells[i];
    var okF=(dexFilter==='all')||c.classList.contains(dexFilter);
    var okS=true;
    if(v){
      var nm=c.getAttribute('data-name')||'';
      var id=c.getAttribute('data-id')||'';
      var rd=c.getAttribute('data-rdex')||'';
      okS=!!(nm&&(nm.indexOf(v)>=0||id.indexOf(v)>=0||rd.indexOf(v)>=0));
    }
    c.style.display=(okF&&okS)?'':'none';
  }
}
function dexSearch(){
  hudScope.clearTimeout(dexTimer);
  dexTimer=hudScope.setTimeout(dexApplyFilter,150);
}
var REGIONAL_DEX={'关都':1,'城都':1,'丰缘':1,'神奥':1,'合众':1,'卡洛斯':1,'阿罗拉':1,'伽勒尔':1,'铠岛':1,'王冠雪原':1,'帕底亚':1,'北上乡':1,'蓝莓学院':1};
var LOC_REGION={
  '关都':'关都','城都':'城都','丰缘':'丰缘','神奥':'神奥','合众':'合众','卡洛斯':'卡洛斯','阿罗拉':'阿罗拉','伽勒尔':'伽勒尔','铠岛':'铠岛','铠之孤岛':'铠岛','王冠雪原':'王冠雪原','冠之雪原':'王冠雪原','帕底亚':'帕底亚','北上乡':'北上乡','北上':'北上乡','蓝莓学院':'蓝莓学院','蓝莓学园':'蓝莓学院',
  '深灰市':'关都','尼比市':'关都','华蓝市':'关都','枯叶市':'关都','玉虹市':'关都','彩虹市':'关都','浅红市':'关都','金黄市':'关都','黄金市':'关都','红莲镇':'关都','红莲岛':'关都','常青市':'关都','常磐市':'关都','真新镇':'关都','紫苑镇':'关都','月见山':'关都','华蓝洞窟':'关都',
  '桔梗市':'城都','桧皮镇':'城都','满金市':'城都','圆珠市':'城都','缘朱市':'城都','湛蓝市':'城都','浅葱市':'城都','卡吉镇':'城都','烟墨市':'城都','若叶镇':'城都','吉花市':'城都',
  '卡那兹市':'丰缘','武斗镇':'丰缘','紫堇市':'丰缘','釜炎镇':'丰缘','橙华市':'丰缘','茵郁市':'丰缘','绿岭市':'丰缘','琉璃市':'丰缘','未白镇':'丰缘',
  '黑金市':'神奥','百代市':'神奥','帷幕市':'神奥','野原市':'神奥','家缘市':'神奥','水脉市':'神奥','雪峰市':'神奥','滨海市':'神奥','双叶镇':'神奥','真砂镇':'神奥','祝庆市':'神奥','神和镇':'神奥','花苑镇':'神奥','随意镇':'神奥',
  '三曜市':'合众','七宝市':'合众','立涌市':'合众','飞云市':'合众','雷文市':'合众','帆巴市':'合众','吹寄市':'合众','雪花市':'合众','双龙市':'合众','青海波市':'合众','鹿子镇':'合众',
  '白檀市':'卡洛斯','遥香市':'卡洛斯','娑罗市':'卡洛斯','比翼市':'卡洛斯','香薰市':'卡洛斯','百刻市':'卡洛斯','映雪市':'卡洛斯','朝香镇':'卡洛斯','密阿雷市':'卡洛斯','古木镇':'卡洛斯','石香镇':'卡洛斯','古香镇':'卡洛斯','风絮镇':'卡洛斯','连理镇':'卡洛斯','名水镇':'卡洛斯','奇楠市':'卡洛斯',
  '好奥乐市':'阿罗拉','利利小镇':'阿罗拉','美乐美乐岛':'阿罗拉','阿卡拉岛':'阿罗拉','乌拉乌拉岛':'阿罗拉','波尼岛':'阿罗拉',
  '草路镇':'伽勒尔','水舟镇':'伽勒尔','机擎市':'伽勒尔','溯传镇':'伽勒尔','舞姿镇':'伽勒尔','战竞镇':'伽勒尔','尖钉镇':'伽勒尔','拳关市':'伽勒尔','化朗镇':'伽勒尔',
  '圆模镇':'帕底亚','深钵镇':'帕底亚','玻瓶市':'帕底亚','酿光市':'帕底亚','锦汇市':'帕底亚','霜抹山':'帕底亚','冰柜镇':'帕底亚','焙固镇':'帕底亚','小匙镇':'帕底亚'
};
function regionFromLocation(loc){
  var s=t2s(String(loc||'').trim());
  if(!s)return '';
  if(LOC_REGION[s])return LOC_REGION[s];
  
  var head=String(s).split(/[-－—|｜]/)[0];
  if(head){head=head.trim();}
  if(head&&head!==s){
    if(LOC_REGION[head])return LOC_REGION[head];
    var hh=t2s(head);
    for(var k0 in LOC_REGION){if(t2s(k0)===hh)return LOC_REGION[k0];}
  }
  var sfx=['地区','地方','市','镇','岛','村','町','山','冻土','原野','湿地','海岸','山麓','洞窟','遗迹','森林','道路'];
  var key=s;
  for(var i=0;i<sfx.length;i++){
    if(key.length>sfx[i].length&&key.slice(-sfx[i].length)===sfx[i]){key=key.slice(0,-sfx[i].length);break;}
  }
  for(var k in LOC_REGION){var kk=t2s(k);if(kk===key)return LOC_REGION[k];}
  for(var k2 in LOC_REGION){if(s.indexOf(k2)>=0)return LOC_REGION[k2];}
  return '';
}
var dexFilter='all';
var dexRegion='全国';
var dexRegionCache={};
var regionalDexCache={};
function fetchRegionalDex(region,cb){
  if(!REGIONAL_DEX[region]){cb&&cb(null);return;}
  if(regionalDexCache[region]){cb&&cb(regionalDexCache[region]);return;}
  hudFetch(PKM_DATA_BASE+'regional-dex.json')
    .then(function(r){return r.ok?r.json():Promise.reject();})
    .then(function(j){
      for(var k in j){if(j[k]&&j[k].length)regionalDexCache[k]=j[k];}
      var list=regionalDexCache[region];
      if(list&&list.length)cb&&cb(list);else cb&&cb(null);
    })
    .catch(function(){cb&&cb(null);});
}
function loadDexList(region,cb){
  if(region==='全国'){
    if(dexCache){cb&&cb(dexCache);return;}
    fetchDex(cb);return;
  }
  var cached=dexRegionCache[region]||lsGet('pk_dexlist4_'+region,null);
if(cached&&cached.length){dexRegionCache[region]=cached;cb&&cb(cached);return;}
fetchRegionalDex(region,function(list){
  if(list&&list.length){dexRegionCache[region]=list;lsSet('pk_dexlist4_'+region,list);}
  cb&&cb(list);
});
}
function dexRegionTabsHTML(){
  var regs=['全国'].concat(Object.keys(REGIONAL_DEX));
  return '<div class="dex-tabs-scroll"><div class="dex-tabs-grid">'+regs.map(function(r){return '<button class="badge-tab'+(dexRegion===r?' active':'')+'" data-dexregion="'+esc(r)+'">'+esc(r)+'</button>';}).join('')+'</div></div>';
}
function dexCountHTML(list,owned,sSet){
  if(!list)return '<div class="dex-count">加载失败</div>';
  var caught=0,seenC=0;
  list.forEach(function(p){
    var bn=p.name.split('（')[0].split('(')[0].trim();
    if(devUnlocked()||hitSpecies(owned,bn))caught++;
    else if(hitSpecies(sSet,bn))seenC++;
  });
  if(devUnlocked())return '<div class="dex-count">✨ 已解锁全部图鉴 · 总数 '+list.length+'</div>';
  return '<div class="dex-count">捕捉 '+caught+' · 见过 '+seenC+' · 总数 '+list.length+'</div>';
}
function renderDexRegion(){
  var owned=ownedSpecies(),sSet=loadSeen();
  var c=document.getElementById('dex-count');
  if(c)c.innerHTML='<div class="dex-count">加载中…</div>';
  loadDexList(dexRegion,function(list){
    renderDexGrid(list,null,sSet,owned);
    var c2=document.getElementById('dex-count');
    if(c2)c2.innerHTML=dexCountHTML(list,owned,sSet);
    dexApplyFilter();
  });
}
function dexFilterHTML(){
  var opts=[['all','全部'],['caught','已捕捉'],['seen','已见过'],['unknown','未见过']];
  return '<div class="dex-filter-bar">'+opts.map(function(o){return '<button class="dex-filter-btn'+(dexFilter===o[0]?' active':'')+'" data-dexfilter="'+o[0]+'" data-f="'+o[0]+'">'+o[1]+'</button>';}).join('')+'</div>';
}
function pokedexHTML(){
  var on=dexThumbsEnabled();
  var toggle='<button class="dex-thumb-btn" data-dex-thumb>'+(on?'🖼️ 缩略图':'📃 仅列表')+'</button>';
  var gridCls='pokedex'+(on?'':' list-only');
  var html=frame('图鉴 '+toggle,dexRegionTabsHTML()+'<div class="dex-search"><input id="dex-search-input" placeholder="搜索宝可梦名或编号" autocomplete="off"></div>'+dexFilterHTML()+'<div id="dex-count"><div class="dex-count">加载中…</div></div><div class="'+gridCls+'" id="pokedex-grid"><div class="empty">图鉴加载中...</div></div>');
  hudScope.setTimeout(function(){renderDexRegion();},0);
  return html;
}
var pkmCache={},pkmLoading={};
function formKeyOf(nm,region){
  if(region)return region;
  var s=t2s(nm).replace(/超級/g,'超级').replace(/超極巨/g,'超极巨').replace(/Ｘ/g,'X').replace(/Ｙ/g,'Y').replace(/Ｚ/g,'Z').toUpperCase();
  if(s.indexOf('MEGA')>=0||s.indexOf('超级')>=0){
    if(s.indexOf('X')>=0)return 'mega-x';
    if(s.indexOf('Y')>=0)return 'mega-y';
    if(s.indexOf('Z')>=0)return 'mega-z';
    return 'mega';
  }
  if(s.indexOf('原始')>=0)return 'primal';
  if(s.indexOf('超极巨')>=0)return 'gmax';
  if(s.indexOf('小智')>=0||s.indexOf('牵绊')>=0)return 'ash';
  if(s.indexOf('黄昏之鬃')>=0)return 'dusk';
  if(s.indexOf('拂晓之翼')>=0)return 'dawn';
  if(s.indexOf('究极')>=0)return 'ultra';
  if(s.indexOf('起源')>=0)return 'origin';
  if(s.indexOf('天空')>=0)return 'sky';
  if(s.indexOf('完全体')>=0)return 'complete';
  if(s.indexOf('10%')>=0)return '10';
  if(s.indexOf('50%')>=0)return '50';
  if(s.indexOf('攻击形态')>=0)return 'attack';
  if(s.indexOf('防御形态')>=0)return 'defense';
  if(s.indexOf('速度形态')>=0)return 'speed';
  if(s.indexOf('暗黑')>=0)return 'black';
  if(s.indexOf('焰白')>=0)return 'white';
  if(s.indexOf('剑之王')>=0)return 'crowned-sword';
  if(s.indexOf('盾之王')>=0)return 'crowned-shield';
  if(s.indexOf('骑白马')>=0)return 'ice';
  if(s.indexOf('骑黑马')>=0)return 'shadow';
  if(s.indexOf('灵兽')>=0)return 'therian';
  if(s.indexOf('达摩')>=0)return 'zen';
  if(s.indexOf('鱼群')>=0)return 'school';
  if(s.indexOf('现形')>=0)return 'busted';
  if(s.indexOf('血月')>=0)return 'bloodmoon';
  if(s.indexOf('星晶')>=0)return 'stellar';
  if(s.indexOf('500年前')>=0||s.indexOf('古老')>=0)return 'original';
  if(s.indexOf('全能')>=0)return 'hero';
  return '';
}
function parsePkmn(wt){
  var d={name:'',enname:'',species:'',ndex:'',egg1:'',egg2:'',catchrate:'',forms:[]};
  var m=wt.match(/\{\{\s*[^{}\n]*信息框[\s\S]*?\n\}\}/);
  if(!m)return d;
  var box=m[0];
  function g(key){var r=box.match(new RegExp('\\|'+key+'=([^|\\n]+)'));return r?r[1].trim():'';}
  function g0(key){var r=box.match(new RegExp('\\|'+key+'=([^\\n]*)'));return r?r[1].trim():null;}
  var bms=[];
var bmre=/\{\{\s*种族值\s*[\s\S]*?\n\}\}/g;
var bmm;
while((bmm=bmre.exec(wt))!==null){bms.push(bmm[0]);}
function gs2(key,src){var r=src?src.match(new RegExp('\\|'+key+'=([0-9]+)')):null;return r?r[1]:'';}
function statsOf(src){return {hp:gs2('HP',src),atk:gs2('攻击',src),def:gs2('防御',src),spa:gs2('特攻',src),spd:gs2('特防',src),spe:gs2('速度',src)};}
var bs=bms.length?statsOf(bms[0]):{hp:'',atk:'',def:'',spa:'',spd:'',spe:''};
  d.name=g('name');d.enname=g('enname');d.species=g('species');
  d.ndex=g('ndex');
  d.egg1=g('egggroup1');d.egg2=g('egggroup2');
  d.catchrate=g('catchrate');
  d.forms.push({name:t2s(d.name),label:'普通',region:'',type1:t2s(g('type1')),type2:t2s(g('type2')),ability1:t2s(g('ability1')),ability2:t2s(g('ability2')),abilityd:t2s(g('abilityd')),height:g('height'),weight:g('weight'),stats:bs});
  var n=2;
  while(true){
    var t1=g('type1-'+n);
    var nm=g('form'+n)||'';
    if(!t1&&!nm)break;
    var region='';
    if(nm.indexOf('阿罗拉')>=0||nm.indexOf('阿羅拉')>=0)region='alola';
    else if(nm.indexOf('伽勒尔')>=0||nm.indexOf('伽勒爾')>=0)region='galar';
    else if(nm.indexOf('洗翠')>=0)region='hisui';
    else if(nm.indexOf('帕底亚')>=0||nm.indexOf('帕底亞')>=0)region='paldea';
    var lb=region==='alola'?'阿罗拉的样子':region==='galar'?'伽勒尔的样子':region==='hisui'?'洗翠的样子':region==='paldea'?'帕底亚的样子':nm||('形态'+n);
    var t1v=g0('type1-'+n);if(t1v===null)t1v=g('type1');
    var t2v=g0('type2-'+n);if(t2v===null)t2v=g('type2');
    var a1v=g0('ability1-'+n);if(a1v===null)a1v=g('ability1');
    d.forms.push({name:t2s(nm),label:lb,region:region,formKey:formKeyOf(nm,region),type1:t2s(t1v),type2:t2s(t2v),ability1:t2s(a1v),ability2:t2s(g('ability2-'+n)),abilityd:t2s(g('abilityd'+n)),height:g('height'+n)||g('height'),weight:g('weight'+n)||g('weight'),stats:bms[n-1]?statsOf(bms[n-1]):bs});
    n++;
  }
  return d;
}
function genFileOf(no){
  var n=parseInt(no,10);
  if(n>=1&&n<=151)return 'gen-01.json';
  if(n>=152&&n<=251)return 'gen-02.json';
  if(n>=252&&n<=386)return 'gen-03.json';
  if(n>=387&&n<=493)return 'gen-04.json';
  if(n>=494&&n<=649)return 'gen-05.json';
  if(n>=650&&n<=721)return 'gen-06.json';
  if(n>=722&&n<=809)return 'gen-07.json';
  if(n>=810&&n<=905)return 'gen-08.json';
  if(n>=906&&n<=1025)return 'gen-09.json';
  return 'gen-10.json';
}
function genToPkm(g){
  var ab=g.abilities||[],ty=g.types||[],st=g.stats||{},eg=g.eggGroups||[];
  return {name:g.name||'',enname:g.en||'',species:g.species||'',ndex:(g.no!=null?String(g.no):''),
    egg1:eg[0]||'',egg2:eg[1]||'',catchrate:(g.catchRate!=null?String(g.catchRate):''),
    forms:[{name:g.name||'',label:'普通',region:'',type1:ty[0]||'',type2:ty[1]||'',
      ability1:ab[0]||'',ability2:ab[1]||'',abilityd:ab[2]||'',
      height:(g.height!=null?String(g.height):''),weight:(g.weight!=null?String(g.weight):''),
      stats:{hp:(st.hp!=null?String(st.hp):''),atk:(st.atk!=null?String(st.atk):''),def:(st.def!=null?String(st.def):''),spa:(st.spa!=null?String(st.spa):''),spd:(st.spd!=null?String(st.spd):''),spe:(st.spe!=null?String(st.spe):'')}}]};
}
function fetchPokemon(name,cb){
  if(!name){cb&&cb(null);return;}
  var key=name;
  if(pkmCache[key]){cb&&cb(pkmCache[key]);return;}
  var _c2=lsGet('pk_pm_'+key,null);if(_c2){pkmCache[key]=_c2;cb&&cb(pkmCache[key]);return;}
  if(pkmLoading[key]){pkmLoading[key].push(cb);return;}
  pkmLoading[key]=[];
  if(cb)pkmLoading[key].push(cb);
  function done(d){
    pkmCache[key]=d||null;
    if(d){lsSet('pk_pm_'+key,d);}
    var cbs=pkmLoading[key]||[];
    pkmLoading[key]=null;
    for(var i=0;i<cbs.length;i++){try{cbs[i](d);}catch(e){}}
  }
  function parsePage(title,onFail){
    hudFetch('https://wiki.52poke.com/api.php?action=parse&page='+encodeURIComponent(title)+'&format=json&prop=wikitext&variant=zh-hans&redirects=1&origin=*')
      .then(function(r){return r.ok?r.json():Promise.reject();})
      .then(function(j){
        var wt=(j&&j.parse&&j.parse.wikitext)?j.parse.wikitext['*']:'';
        var d2=wt?parsePkmn(wt):null;
        if(d2&&d2.name){done(d2);}else{onFail();}
      })
      .catch(onFail);
  }
  function searchThen(){
    hudFetch('https://wiki.52poke.com/api.php?action=query&list=search&srsearch='+encodeURIComponent(t2s(key))+'&srnamespace=0&srlimit=6&format=json&origin=*')
      .then(function(r){return r.json();})
      .then(function(j){
        var rs=(j&&j.query&&j.query.search)||[];
        var i=0;
        function tryNext(){
          if(i>=rs.length){done(null);return;}
          parsePage(rs[i++].title,tryNext);
        }
        tryNext();
      })
      .catch(function(){done(null);});
  }
  function localLookup(){
    var b=pkmFormParse(key).base;
    if(!b){parsePage(t2s(key),searchThen);return;}
    pkmDbLoad('dex','dex-list.json',['en','name'],function(store){
      var hit=store&&pkmDbLookup('dex',b);
      if(!hit||!hit.no){parsePage(t2s(key),searchThen);return;}
      var gf=genFileOf(hit.no);
      pkmDbLoad('pkm_'+gf,gf,['en','name'],function(gstore){
        var ghit=gstore&&(pkmDbLookup('pkm_'+gf,hit.en)||pkmDbLookup('pkm_'+gf,hit.name));
        if(ghit){done(genToPkm(ghit));}else{parsePage(t2s(key),searchThen);}
      });
    });
  }
  localLookup();
}
var curPkm=null,curPkmForm=0,curPkmForms=[],curPkmShiny=false,curPkmNdex=0;
function pkmPreviewFallback(el){
  var cur=String(el.getAttribute('src')||'');
  if(!cur){el.style.display='none';return;}
  if(cur.indexOf('media.52poke.com')>=0){
    var fn=cur.split('/').pop();
    if(fn){el.src='https://wiki.52poke.com/wiki/Special:FilePath/'+fn;return;}
  }
  if(curPkm&&curPkm.enname){
    var _en=String(curPkm.enname).toLowerCase();
    var base=pkmRepoUrl('static','pokeos',_en,curPkmShiny);
    if(base&&base!==cur){el.src=base;return;}
  }
  el.style.display='none';
}
var pkmLvValue=50;
function bindPkmSlider(el){
  if(!el)return;
  var min=0,max=100;
  pkmLvValue=parseInt(el.getAttribute('data-val'),10)||50;
  var fill=el.querySelector('.pkm-fill');
  var thumb=el.querySelector('.pkm-thumb');
  function paint(){
    var pct=Math.max(0,Math.min(100,(pkmLvValue-min)/(max-min)*100));
    if(fill)fill.style.width=pct+'%';
    if(thumb)thumb.style.left='calc('+pct+'% - 9px)';
  }
  function setFromClientX(cx){
    var r=el.getBoundingClientRect();
    if(r.width<=0)return;
    var pct=Math.max(0,Math.min(1,(cx-r.left)/r.width));
    var v=Math.round(min+pct*(max-min));
    if(v!==pkmLvValue){pkmLvValue=v;el.setAttribute('data-val',String(v));paint();updatePkmStats();}
  }
  paint();
  el._pkmDrag=false;
  el.addEventListener('pointerdown',function(e){el._pkmDrag=true;try{el.setPointerCapture(e.pointerId);}catch(err){}setFromClientX(e.clientX);e.preventDefault();});
  el.addEventListener('pointermove',function(e){if(el._pkmDrag)setFromClientX(e.clientX);});
  el.addEventListener('pointerup',function(){el._pkmDrag=false;});
  el.addEventListener('pointercancel',function(){el._pkmDrag=false;});
}
var pkmStatsRaf=0;
function updatePkmStats(){
  if(pkmStatsRaf)return;
  pkmStatsRaf=requestAnimationFrame(function(){pkmStatsRaf=0;updatePkmStatsNow();});
}
function updatePkmStatsNow(){
  var d=curPkm;if(!d)return;
  var list=curPkmForms&&curPkmForms.length?curPkmForms:d.forms;
  var f=list[curPkmForm]||list[0]||{};
  if(!f||!f.stats)return;
  var lvEl=document.getElementById('pkm-lv');
  var stEl=document.getElementById('pkm-stats');
  var numEl=document.getElementById('pkm-lv-num');
  if(!lvEl||!stEl)return;
  var lv=parseInt(pkmLvValue,10)||0;
  if(numEl)numEl.textContent=lv+'级';
  var isShed=(curPkmNdex===292)||(f.name&&f.name.indexOf('脱壳忍者')>=0)||(d.name&&d.name.indexOf('脱壳忍者')>=0);
  function range(b,isHp){
    var bb=parseInt(b,10);if(isNaN(bb))return '—~—';
    var mn=Math.floor((2*bb)*lv/100)+(isHp?lv+10:5);
    var mx=Math.floor((2*bb+31+63)*lv/100)+(isHp?lv+10:5);
    if(!isHp){mn=Math.floor(mn*0.9);mx=Math.floor(mx*1.1);}
    return mn+'~'+mx;
  }
  var rows=[['HP',f.stats.hp,1],['物攻',f.stats.atk,0],['物防',f.stats.def,0],['特攻',f.stats.spa,0],['特防',f.stats.spd,0],['速度',f.stats.spe,0]];
  var key=curPkmNdex+'|'+curPkmForm;
  if(stEl.getAttribute('data-stats-key')!==key){
    var h='',total=0;
    for(var i=0;i<rows.length;i++){
      var b=parseInt(rows[i][1],10);
      if(isNaN(b))continue;
      total+=b;
      h+='<div style="display:flex;justify-content:space-between;gap:8px"><span>'+rows[i][0]+' '+b+'</span><span data-st="'+i+'"></span></div>';
    }
    h+='<div style="margin-top:4px;font-weight:800"><span>总和 '+total+'</span></div>';
    stEl.innerHTML=h;
    stEl.setAttribute('data-stats-key',key);
  }
  for(var j=0;j<rows.length;j++){
    var cell=stEl.querySelector('[data-st="'+j+'"]');
    if(!cell)continue;
    var bb=parseInt(rows[j][1],10);
    if(isNaN(bb)){cell.textContent='—~—';continue;}
    cell.textContent=(j===0&&isShed)?'1':range(bb,rows[j][2]);
  }
}
function renderPkmForm(idx){
  var d=curPkm;if(!d)return;
  curPkmForm=idx;
  var list=curPkmForms&&curPkmForms.length?curPkmForms:d.forms;
  var f=list[idx]||list[0]||{};
  var btns=document.querySelectorAll('#pkm-formbar .pkm-form-btn');
  for(var i=0;i<btns.length;i++){btns[i].classList.toggle('active',i===idx);}
  var big=document.getElementById('pkm-big');
if(big){
  var url=pickHomeImg(idx,curPkmShiny);
  var tag='<span class="pkm-shiny-tag'+(curPkmShiny?'':' off')+'">'+(curPkmShiny?'✦ 闪光':'普通')+'</span>';
  big.innerHTML=url?('<img class="pkm-big-img" src="'+url+'" referrerpolicy="origin">'+tag):'<div class="dim">图片加载中…</div>';
  var imgEl=big.querySelector('img.pkm-big-img');
  if(imgEl){imgEl.addEventListener('error',function(){pkmPreviewFallback(imgEl);});}
}
  var b=document.getElementById('pkm-body');
  if(b){
    var out='';
    if(d.species)out+='<div class="row"><span class="k">分类</span><span class="v">'+esc(d.species)+'</span></div>';
    var types='';
    if(f.type1)types+=typeChipHTML(f.type1);
    if(f.type2)types+=typeChipHTML(f.type2);
    if(types)out+='<div class="row"><span class="k">属性</span><div class="types">'+types+'</div></div>';
    var abis=[];
    if(f.ability1)abis.push(f.ability1);
    if(f.ability2)abis.push(f.ability2);
    if(abis.length||f.abilityd){
      var abi='';
      for(var ai=0;ai<abis.length;ai++){abi+='<span class="abi-link" data-ability="'+esc(abis[ai])+'">'+esc(abis[ai])+'</span> ';}
      if(f.abilityd)abi+='<span class="dim">隐藏:</span><span class="abi-link" data-ability="'+esc(f.abilityd)+'">'+esc(f.abilityd)+'</span>';
      out+='<div class="row"><span class="k">特性</span><span class="v">'+abi+'</span></div>';
    }
    if(f.stats&&(f.stats.hp||f.stats.atk||f.stats.def||f.stats.spa||f.stats.spd||f.stats.spe)){out+='<div class="row block"><span class="k">种族值</span><span class="v" style="width:100%"><div style="display:flex;align-items:center;gap:8px;margin:2px 0"><span class="dim" style="font-size:.72rem">等级</span><div id="pkm-lv" data-val="50" style="flex:1;position:relative;height:24px;touch-action:none;user-select:none;-webkit-user-select:none;cursor:pointer"><div class="pkm-rail" style="position:absolute;left:0;right:0;top:50%;height:4px;margin-top:-2px;background:rgba(0,0,0,.72);border-radius:999px;box-shadow:inset 0 1px 2px rgba(0,0,0,.6)"></div><div class="pkm-fill" style="position:absolute;left:0;top:50%;height:4px;margin-top:-2px;width:50%;background:linear-gradient(180deg,#7cc4f8,#4a9dd8);border-radius:999px"></div><div class="pkm-thumb" style="position:absolute;top:50%;left:calc(50% - 9px);width:18px;height:18px;margin-top:-9px;background:#fff;border:2px solid #7cc4f8;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,.5)"></div></div><span id="pkm-lv-num" style="font-size:.8rem;font-weight:800">50级</span></div><div id="pkm-stats" style="font-size:.82rem;line-height:1.6"></div></span></div>';}
    if(d.ndex)out+='<div class="row"><span class="k">全国图鉴</span><span class="v">#'+esc(d.ndex)+'</span></div>';
    var nd=parseInt(d.ndex,10)||0;
    if(nd>0)out+='<div class="row"><span class="k">叫声</span><span class="v"><button class="btn-small" data-cry="'+nd+'">🔊 播放</button></span></div>';
    if(f.height)out+='<div class="row"><span class="k">身高</span><span class="v">'+esc(f.height)+' m</span></div>';
    if(f.weight)out+='<div class="row"><span class="k">体重</span><span class="v">'+esc(f.weight)+' kg</span></div>';
    if(d.egg1||d.egg2)out+='<div class="row"><span class="k">蛋组</span><span class="v">'+esc(d.egg1)+(d.egg2?' / '+esc(d.egg2):'')+'</span></div>';
    if(d.catchrate){
      var rate=parseInt(d.catchrate,10);
      var ratePct=(!isNaN(rate)&&rate>0)?(rate/7.65).toFixed(1)+'%':'—';
      out+='<div class="row"><span class="k">捕获率</span><span class="v">'+ratePct+'</span></div>';
    }
    b.innerHTML=out||'<div class="empty">没有数据</div>';var lv=document.getElementById('pkm-lv');if(lv){bindPkmSlider(lv);}updatePkmStats();
  }
}
var PKM_REPO_FORM_SUFFIX={
  'mega-x':'-mega-x','mega-y':'-mega-y','mega-z':'-mega-z','mega':'-mega','primal':'-primal',
  'gmax':'-gmax','ash':'-ash','dusk':'-dusk','dawn':'-dawn','ultra':'-ultra','origin':'-origin',
  'sky':'-sky','complete':'-complete','10':'-10','50':'-50','attack':'-attack','defense':'-defense',
  'speed':'-speed','black':'-black','white':'-white','crowned-sword':'-crowned','crowned-shield':'-crowned',
  'ice':'-ice','shadow':'-shadow','therian':'-therian','zen':'-zen','school':'-school','busted':'-busted',
  'bloodmoon':'-bloodmoon','stellar':'-stellar','hero':'-hero',
  'alola':'-alola','galar':'-galar','hisui':'-hisui','paldea':'-paldea'
};
function pickHomeImg(idx,shiny){
  var d=curPkm;
  var f=null;
  if(d){var forms=curPkmForms&&curPkmForms.length?curPkmForms:d.forms;f=forms[idx]||forms[0];}
  var en=(d&&d.enname)?String(d.enname).toLowerCase():'';
  if(!en)return '';
  var fk=(f&&f.formKey)||'';
  var nm=((f&&f.name)||'')+' '+((f&&f.label)||'');
  var suf='';
  if(nm.indexOf('水井')>=0)suf='-wellspring-mask';
  else if(nm.indexOf('火灶')>=0)suf='-hearthflame-mask';
  else if(nm.indexOf('础石')>=0)suf='-cornerstone-mask';
  else if(nm.indexOf('连击流')>=0)suf='-rapid-strike';
  else if(nm.indexOf('觉悟')>=0)suf='-resolute';
  else suf=PKM_REPO_FORM_SUFFIX[fk]||'';
  var slug=en+suf;
  return pkmRepoUrl('static','pokeos',slug,shiny);
}
function showPokemonInfo(name,ndex){
  curPkmNdex=parseInt(ndex,10)||0;
  clearBack();
  overlay.innerHTML='<div class="modal"><div class="modal-head"><div class="modal-name">'+esc(name)+'</div><button class="close" data-close>✕</button></div><div class="modal-body"><div id="pkm-formbar"></div><div class="pkm-big" id="pkm-big" data-shiny-toggle title="点击切换普通/闪光"><div class="empty">加载中...</div></div><div id="pkm-body"></div></div></div>';
  overlay.classList.add('open');
  curPkm=null;curPkmForm=0;curPkmForms=[];curPkmShiny=false;
fetchPokemon(name,function(d){
    var bb=document.getElementById('pkm-body');
    if(!d){if(bb)bb.innerHTML='<div class="empty">宝可梦数据获取失败</div>';return;}
    curPkm=d;
    var seenFull=devUnlocked()?{}:loadSeenFull();
    var shown=[];
    d.forms.forEach(function(f){
      if(formSeen(seenFull,f,name))shown.push(f);
    });
    if(!shown.length)shown=d.forms;
    curPkmForms=shown;
    var bar=document.getElementById('pkm-formbar');
    if(bar&&shown.length>1){
      bar.innerHTML='<div class="pkm-forms">'+shown.map(function(f,i){return '<button class="btn-small pkm-form-btn'+(i===0?' active':'')+'" data-form="'+i+'">'+esc(f.label)+'</button>';}).join('')+'</div>';
    }
  renderPkmForm(0);
});
}
function t2s(s){
  var m={'㑯':'㑔','㑳':'㑇','㑶':'㐹','㓨':'刾','㗲':'𠵾','㘚':'㘎','㜄':'㚯','㜏':'㛣','㜢':'𡞱','㠏':'㟆','㠣':'𫵷','㥮':'㤘','㩜':'㨫','㩳':'㧐','㩵':'擜','㺏':'𤠋','䁪':'𥇢','䁻':'䀥','䃮':'鿎','䊷':'䌶','䋙':'䌺','䋚':'䌻','䋹':'䌿','䋻':'䌾','䍦':'䍠','䎱':'䎬','䓣':'𬜯','䙡':'䙌','䜀':'䜧','䝼':'䞍','䡵':'𫟦','䥇':'䦂','䥑':'鿏','䥕':'𬭯','䥱':'䥾','䦛':'䦶','䦟':'䦷','䧢':'𨸟','䮄':'𫠊','䯀':'䯅','䰾':'鲃','䱷':'䲣','䱽':'䲝','䲁':'鳚','䲘':'鳤','䴉':'鹮','丟':'丢','並':'并','乾':'干','亂':'乱','亙':'亘','亞':'亚','佇':'伫','佈':'布','佔':'占','併':'并','來':'来','侖':'仑','侶':'侣','侷':'局','俁':'俣','係':'系','俔':'伣','俠':'侠','俥':'伡','俬':'私','倀':'伥','倆':'俩','倈':'俫','倉':'仓','個':'个','們':'们','倖':'幸','倫':'伦','倲':'㑈','偉':'伟','偑':'㐽','側':'侧','偵':'侦','偽':'伪','傌':'㐷','傑':'杰','傖':'伧','傘':'伞','備':'备','傢':'家','傭':'佣','傯':'偬','傳':'传','傴':'伛','債':'债','傷':'伤','傾':'倾','僂':'偻','僅':'仅','僉':'佥','僑':'侨','僕':'仆','僞':'伪','僤':'𫢸','僥':'侥','僨':'偾','僱':'雇','價':'价','儀':'仪','儁':'俊','儂':'侬','億':'亿','儈':'侩','儉':'俭','儎':'傤','儐':'傧','儔':'俦','儕':'侪','儘':'尽','償':'偿','優':'优','儲':'储','儷':'俪','儸':'㑩','儺':'傩','儻':'傥','儼':'俨','兇':'凶','兌':'兑','兒':'儿','兗':'兖','內':'内','兩':'两','冊':'册','冑':'胄','冪':'幂','凈':'净','凍':'冻','凜':'凛','凱':'凯','別':'别','刪':'删','剄':'刭','則':'则','剋':'克','剎':'刹','剗':'刬','剛':'刚','剝':'剥','剮':'剐','剴':'剀','創':'创','剷':'铲','劃':'划','劄':'札','劇':'剧','劉':'刘','劊':'刽','劌':'刿','劍':'剑','劏':'㓥','劑':'剂','劚':'㔉','勁':'劲','動':'动','務':'务','勛':'勋','勝':'胜','勞':'劳','勢':'势','勣':'𪟝','勩':'勚','勱':'劢','勳':'勋','勵':'励','勸':'劝','勻':'匀','匭':'匦','匯':'汇','匱':'匮','區':'区','協':'协','卹':'恤','卻':'却','卽':'即','厙':'厍','厠':'厕','厤':'历','厭':'厌','厲':'厉','厴':'厣','參':'参','叄':'叁','叢':'丛','吒':'咤','吳':'吴','吶':'呐','呂':'吕','咼':'呙','員':'员','唄':'呗','唸':'念','問':'问','啓':'启','啞':'哑','啟':'启','啢':'唡','喎':'㖞','喚':'唤','喪':'丧','喫':'吃','喬':'乔','單':'单','喲':'哟','嗆':'呛','嗇':'啬','嗊':'唝','嗎':'吗','嗚':'呜','嗩':'唢','嗰':'𠮶','嗶':'哔','嘆':'叹','嘍':'喽','嘓':'啯','嘔':'呕','嘖':'啧','嘗':'尝','嘜':'唛','嘩':'哗','嘮':'唠','嘯':'啸','嘰':'叽','嘵':'哓','嘸':'呒','嘽':'啴','噁':'恶','噓':'嘘','噚':'㖊','噝':'咝','噠':'哒','噥':'哝','噦':'哕','噯':'嗳','噲':'哙','噴':'喷','噸':'吨','噹':'当','嚀':'咛','嚇':'吓','嚌':'哜','嚐':'尝','嚕':'噜','嚙':'啮','嚥':'咽','嚦':'呖','嚧':'𠰷','嚨':'咙','嚮':'向','嚲':'亸','嚳':'喾','嚴':'严','嚶':'嘤','囀':'啭','囁':'嗫','囂':'嚣','囅':'冁','囈':'呓','囉':'啰','囌':'苏','囑':'嘱','囪':'囱','圇':'囵','國':'国','圍':'围','園':'园','圓':'圆','圖':'图','團':'团','垻':'坝','埡':'垭','埨':'𫭢','埰':'采','執':'执','堅':'坚','堊':'垩','堖':'垴','堝':'埚','堯':'尧','報':'报','場':'场','塊':'块','塋':'茔','塏':'垲','塒':'埘','塗':'涂','塚':'冢','塢':'坞','塤':'埙','塵':'尘','塸':'𫭟','塹':'堑','塿':'𪣻','墊':'垫','墜':'坠','墠':'𫮃','墮':'堕','墰':'坛','墳':'坟','墶':'垯','墻':'墙','墾':'垦','壇':'坛','壋':'垱','壎':'埙','壓':'压','壗':'𡋤','壘':'垒','壙':'圹','壚':'垆','壜':'坛','壞':'坏','壟':'垄','壠':'垅','壢':'坜','壩':'坝','壪':'塆','壯':'壮','壺':'壶','壼':'壸','壽':'寿','夠':'够','夢':'梦','夥':'伙','夾':'夹','奐':'奂','奧':'奥','奩':'奁','奪':'夺','奬':'奖','奮':'奋','奼':'姹','妝':'妆','姍':'姗','姦':'奸','娙':'𫰛','娛':'娱','婁':'娄','婦':'妇','婭':'娅','媧':'娲','媯':'妫','媰':'㛀','媼':'媪','媽':'妈','嫋':'袅','嫗':'妪','嫵':'妩','嫺':'娴','嫻':'娴','嫿':'婳','嬀':'妫','嬃':'媭','嬈':'娆','嬋':'婵','嬌':'娇','嬙':'嫱','嬡':'嫒','嬤':'嬷','嬪':'嫔','嬰':'婴','嬸':'婶','孃':'娘','孋':'㛤','孌':'娈','孫':'孙','學':'学','孻':'𡥧','孿':'孪','宮':'宫','寀':'采','寢':'寝','實':'实','寧':'宁','審':'审','寫':'写','寬':'宽','寵':'宠','寶':'宝','將':'将','專':'专','尋':'寻','對':'对','導':'导','尷':'尴','屆':'届','屍':'尸','屓':'屃','屜':'屉','屢':'屡','層':'层','屨':'屦','屬':'属','岡':'冈','峯':'峰','峴':'岘','島':'岛','峽':'峡','崍':'崃','崑':'昆','崗':'岗','崙':'仑','崢':'峥','崬':'岽','嵐':'岚','嵗':'岁','嵽':'𫶇','嵾':'㟥','嶁':'嵝','嶄':'崭','嶇':'岖','嶔':'嵚','嶗':'崂','嶠':'峤','嶢':'峣','嶧':'峄','嶨':'峃','嶮':'崄','嶸':'嵘','嶺':'岭','嶼':'屿','嶽':'岳','巋':'岿','巒':'峦','巔':'巅','巖':'岩','巘':'𪩘','巰':'巯','巹':'卺','帥':'帅','師':'师','帳':'帐','帶':'带','幀':'帧','幃':'帏','幓':'㡎','幗':'帼','幘':'帻','幟':'帜','幣':'币','幫':'帮','幬':'帱','幷':'并','幹':'干','幾':'几','庫':'库','廁':'厕','廂':'厢','廄':'厩','廈':'厦','廎':'庼','廕':'荫','廚':'厨','廝':'厮','廞':'𫷷','廟':'庙','廠':'厂','廡':'庑','廢':'废','廣':'广','廩':'廪','廬':'庐','廳':'厅','弒':'弑','弔':'吊','弳':'弪','張':'张','強':'强','彄':'𫸩','彆':'别','彈':'弹','彌':'弥','彎':'弯','彔':'录','彙':'汇','彠':'彟','彥':'彦','彫':'雕','彲':'彨','彿':'佛','後':'后','徑':'径','從':'从','徠':'徕','復':'复','徵':'征','徹':'彻','恆':'恒','恥':'耻','悅':'悦','悞':'悮','悵':'怅','悶':'闷','悽':'凄','惡':'恶','惱':'恼','惲':'恽','惻':'恻','愛':'爱','愜':'惬','愨':'悫','愴':'怆','愷':'恺','愾':'忾','慄':'栗','態':'态','慍':'愠','慘':'惨','慚':'惭','慟':'恸','慣':'惯','慤':'悫','慪':'怄','慫':'怂','慮':'虑','慳':'悭','慶':'庆','慺':'㥪','慼':'戚','慾':'欲','憂':'忧','憊':'惫','憐':'怜','憑':'凭','憒':'愦','憖':'慭','憚':'惮','憤':'愤','憫':'悯','憮':'怃','憲':'宪','憶':'忆','懇':'恳','應':'应','懌':'怿','懍':'懔','懞':'蒙','懟':'怼','懣':'懑','懤':'㤽','懨':'恹','懲':'惩','懶':'懒','懷':'怀','懸':'悬','懺':'忏','懼':'惧','懾':'慑','戀':'恋','戇':'戆','戔':'戋','戧':'戗','戩':'戬','戰':'战','戱':'戯','戲':'戏','戶':'户','扞':'捍','拋':'抛','拚':'拼','挩':'捝','挱':'挲','挾':'挟','捨':'舍','捫':'扪','捱':'挨','捲':'卷','掃':'扫','掄':'抡','掆':'㧏','掗':'挜','掙':'挣','掛':'挂','採':'采','揀':'拣','揚':'扬','換':'换','揮':'挥','揯':'搄','損':'损','搖':'摇','搗':'捣','搧':'扇','搵':'揾','搶':'抢','摑':'掴','摜':'掼','摟':'搂','摯':'挚','摳':'抠','摶':'抟','摺':'折','摻':'掺','撈':'捞','撏':'挦','撐':'撑','撓':'挠','撝':'㧑','撟':'挢','撣':'掸','撥':'拨','撫':'抚','撲':'扑','撳':'揿','撻':'挞','撾':'挝','撿':'捡','擁':'拥','擄':'掳','擇':'择','擊':'击','擋':'挡','擓':'㧟','擔':'担','據':'据','擠':'挤','擡':'抬','擣':'捣','擬':'拟','擯':'摈','擰':'拧','擱':'搁','擲':'掷','擴':'扩','擷':'撷','擺':'摆','擻':'擞','擼':'撸','擽':'㧰','擾':'扰','攄':'摅','攆':'撵','攏':'拢','攔':'拦','攖':'撄','攙':'搀','攛':'撺','攜':'携','攝':'摄','攢':'攒','攣':'挛','攤':'摊','攪':'搅','攬':'揽','敎':'教','敓':'敚','敗':'败','敘':'叙','敵':'敌','數':'数','斂':'敛','斃':'毙','斆':'敩','斕':'斓','斬':'斩','斷':'断','於':'于','旂':'旗','旣':'既','昇':'升','時':'时','晉':'晋','晛':'𬀪','晝':'昼','暈':'晕','暉':'晖','暐':'𬀩','暘':'旸','暢':'畅','暫':'暂','曄':'晔','曆':'历','曇':'昙','曉':'晓','曏':'向','曖':'暧','曠':'旷','曥':'𣆐','曨':'昽','曬':'晒','書':'书','會':'会','朥':'𦛨','朧':'胧','朮':'术','東':'东','枴':'拐','柵':'栅','柺':'拐','査':'查','桱':'𣐕','桿':'杆','梔':'栀','梘':'枧','梜':'𬂩','條':'条','梟':'枭','梲':'棁','棄':'弃','棊':'棋','棖':'枨','棗':'枣','棟':'栋','棡':'㭎','棧':'栈','棲':'栖','棶':'梾','椏':'桠','椲':'㭏','楊':'杨','楓':'枫','楨':'桢','業':'业','極':'极','榘':'矩','榦':'干','榪':'杩','榮':'荣','榲':'榅','榿':'桤','構':'构','槍':'枪','槓':'杠','槤':'梿','槧':'椠','槨':'椁','槮':'椮','槳':'桨','槶':'椢','槼':'椝','樁':'桩','樂':'乐','樅':'枞','樑':'梁','樓':'楼','標':'标','樞':'枢','樢':'㭤','樣':'样','樧':'榝','樫':'㭴','樳':'桪','樸':'朴','樹':'树','樺':'桦','樿':'椫','橈':'桡','橋':'桥','機':'机','橢':'椭','橫':'横','橯':'𣓿','檁':'檩','檉':'柽','檔':'档','檜':'桧','檟':'槚','檢':'检','檣':'樯','檮':'梼','檯':'台','檳':'槟','檸':'柠','檻':'槛','櫃':'柜','櫍':'𬃊','櫓':'橹','櫚':'榈','櫛':'栉','櫝':'椟','櫞':'橼','櫟':'栎','櫥':'橱','櫧':'槠','櫨':'栌','櫪':'枥','櫫':'橥','櫬':'榇','櫱':'蘖','櫳':'栊','櫸':'榉','櫻':'樱','欄':'栏','欅':'榉','權':'权','欏':'椤','欒':'栾','欓':'𣗋','欖':'榄','欞':'棂','欽':'钦','歎':'叹','歐':'欧','歟':'欤','歡':'欢','歲':'岁','歷':'历','歸':'归','歿':'殁','殘':'残','殞':'殒','殤':'殇','殨':'㱮','殫':'殚','殭':'僵','殮':'殓','殯':'殡','殰':'㱩','殲':'歼','殺':'杀','殻':'壳','殼':'壳','毀':'毁','毆':'殴','毿':'毵','氂':'牦','氈':'毡','氌':'氇','氣':'气','氫':'氢','氬':'氩','氳':'氲','氾':'泛','汎':'泛','汙':'污','決':'决','沒':'没','沖':'冲','況':'况','泝':'溯','洩':'泄','洶':'汹','浹':'浃','浿':'𬇙','涇':'泾','涗':'涚','涼':'凉','淒':'凄','淚':'泪','淥':'渌','淨':'净','淩':'凌','淪':'沦','淵':'渊','淶':'涞','淺':'浅','渙':'涣','減':'减','渢':'沨','渦':'涡','測':'测','渾':'浑','湊':'凑','湋':'𣲗','湞':'浈','湧':'涌','湯':'汤','溈':'沩','準':'准','溝':'沟','溫':'温','溮':'浉','溳':'涢','溼':'湿','滄':'沧','滅':'灭','滌':'涤','滎':'荥','滙':'汇','滬':'沪','滯':'滞','滲':'渗','滷':'卤','滸':'浒','滻':'浐','滾':'滚','滿':'满','漁':'渔','漊':'溇','漍':'𬇹','漚':'沤','漢':'汉','漣':'涟','漬':'渍','漲':'涨','漵':'溆','漸':'渐','漿':'浆','潁':'颍','潑':'泼','潔':'洁','潕':'𣲘','潙':'沩','潚':'㴋','潛':'潜','潤':'润','潯':'浔','潰':'溃','潷':'滗','潿':'涠','澀':'涩','澆':'浇','澇':'涝','澐':'沄','澗':'涧','澠':'渑','澤':'泽','澦':'滪','澩':'泶','澫':'𬇕','澮':'浍','澱':'淀','澾':'㳠','濁':'浊','濃':'浓','濄':'㳡','濆':'𣸣','濕':'湿','濘':'泞','濚':'溁','濛':'蒙','濜':'浕','濟':'济','濤':'涛','濧':'㳔','濫':'滥','濰':'潍','濱':'滨','濺':'溅','濼':'泺','濾':'滤','瀂':'澛','瀅':'滢','瀆':'渎','瀇':'㲿','瀉':'泻','瀋':'沈','瀏':'浏','瀕':'濒','瀘':'泸','瀝':'沥','瀟':'潇','瀠':'潆','瀦':'潴','瀧':'泷','瀨':'濑','瀰':'弥','瀲':'潋','瀾':'澜','灃':'沣','灄':'滠','灑':'洒','灒':'𪷽','灕':'漓','灘':'滩','灙':'𣺼','灝':'灏','灡':'㳕','灣':'湾','灤':'滦','灧':'滟','灩':'滟','災':'灾','為':'为','烏':'乌','烴':'烃','無':'无','煉':'炼','煒':'炜','煙':'烟','煢':'茕','煥':'焕','煩':'烦','煬':'炀','煱':'㶽','熅':'煴','熒':'荧','熗':'炝','熰':'𬉼','熱':'热','熲':'颎','熾':'炽','燀':'𬊤','燁':'烨','燈':'灯','燉':'炖','燒':'烧','燖':'𬊈','燙':'烫','燜':'焖','營':'营','燦':'灿','燬':'毁','燭':'烛','燴':'烩','燶':'㶶','燻':'熏','燼':'烬','燾':'焘','爍':'烁','爐':'炉','爛':'烂','爭':'争','爲':'为','爺':'爷','爾':'尔','牀':'床','牆':'墙','牘':'牍','牴':'抵','牽':'牵','犖':'荦','犛':'牦','犢':'犊','犧':'牺','狀':'状','狹':'狭','狽':'狈','猙':'狰','猶':'犹','猻':'狲','獁':'犸','獃':'呆','獄':'狱','獅':'狮','獎':'奖','獨':'独','獪':'狯','獫':'猃','獮':'狝','獰':'狞','獱':'㺍','獲':'获','獵':'猎','獷':'犷','獸':'兽','獺':'獭','獻':'献','獼':'猕','玀':'猡','現':'现','琱':'雕','琺':'珐','琿':'珲','瑋':'玮','瑒':'玚','瑣':'琐','瑤':'瑶','瑩':'莹','瑪':'玛','瑲':'玱','璉':'琏','璊':'𫞩','璕':'𬍤','璗':'𬍡','璡':'琎','璣':'玑','璦':'瑷','璫':'珰','璯':'㻅','環':'环','璵':'玙','璸':'瑸','璽':'玺','璿':'璇','瓅':'𬍛','瓊':'琼','瓏':'珑','瓔':'璎','瓚':'瓒','瓛':'𤩽','甌':'瓯','甕':'瓮','產':'产','産':'产','畝':'亩','畢':'毕','畫':'画','異':'异','畵':'画','當':'当','疇':'畴','疊':'叠','痙':'痉','痠':'酸','痾':'疴','瘂':'痖','瘋':'疯','瘍':'疡','瘓':'痪','瘞':'瘗','瘡':'疮','瘧':'疟','瘮':'瘆','瘲':'疭','瘺':'瘘','瘻':'瘘','療':'疗','癆':'痨','癇':'痫','癉':'瘅','癒':'愈','癘':'疠','癟':'瘪','癡':'痴','癢':'痒','癤':'疖','癥':'症','癧':'疬','癩':'癞','癬':'癣','癭':'瘿','癮':'瘾','癰':'痈','癱':'瘫','癲':'癫','發':'发','皁':'皂','皚':'皑','皰':'疱','皸':'皲','皺':'皱','盃':'杯','盜':'盗','盞':'盏','盡':'尽','監':'监','盤':'盘','盧':'卢','盪':'荡','眞':'真','眥':'眦','眾':'众','睍':'𪾢','睏':'困','睜':'睁','睞':'睐','瞘':'眍','瞜':'䁖','瞞':'瞒','瞶':'瞆','瞼':'睑','矇':'蒙','矓':'眬','矚':'瞩','矯':'矫','硃':'朱','硜':'硁','硤':'硖','硨':'砗','硯':'砚','碕':'埼','碩':'硕','碭':'砀','碸':'砜','確':'确','碼':'码','碽':'䂵','磑':'硙','磚':'砖','磠':'硵','磣':'碜','磧':'碛','磯':'矶','磽':'硗','磾':'䃅','礄':'硚','礎':'础','礐':'𬒈','礙':'碍','礦':'矿','礪':'砺','礫':'砾','礬':'矾','礱':'砻','祕':'秘','祿':'禄','禍':'祸','禎':'祯','禕':'祎','禡':'祃','禦':'御','禪':'禅','禮':'礼','禰':'祢','禱':'祷','禿':'秃','秈':'籼','稅':'税','稈':'秆','稏':'䅉','稜':'棱','稟':'禀','種':'种','稱':'称','穀':'谷','穇':'䅟','穌':'稣','積':'积','穎':'颖','穠':'秾','穡':'穑','穢':'秽','穩':'稳','穫':'获','穭':'穞','窩':'窝','窪':'洼','窮':'穷','窯':'窑','窵':'窎','窶':'窭','窺':'窥','竄':'窜','竅':'窍','竇':'窦','竈':'灶','竊':'窃','竪':'竖','競':'竞','筆':'笔','筍':'笋','筧':'笕','筴':'䇲','箇':'个','箋':'笺','箏':'筝','箚':'札','節':'节','範':'范','築':'筑','篋':'箧','篔':'筼','篠':'筿','篢':'𬕂','篤':'笃','篩':'筛','篳':'筚','篸':'𥮾','簀':'箦','簍':'篓','簑':'蓑','簞':'箪','簡':'简','簣':'篑','簫':'箫','簹':'筜','簽':'签','簾':'帘','籃':'篮','籅':'𥫣','籌':'筹','籔':'䉤','籙':'箓','籛':'篯','籜':'箨','籟':'籁','籠':'笼','籤':'签','籩':'笾','籪':'簖','籬':'篱','籮':'箩','籲':'吁','粵':'粤','糉':'粽','糝':'糁','糞':'粪','糧':'粮','糰':'团','糲':'粝','糴':'籴','糶':'粜','糹':'纟','糾':'纠','紀':'纪','紂':'纣','紃':'𬘓','約':'约','紅':'红','紆':'纡','紇':'纥','紈':'纨','紉':'纫','紋':'纹','納':'纳','紐':'纽','紓':'纾','純':'纯','紕':'纰','紖':'纼','紗':'纱','紘':'纮','紙':'纸','級':'级','紛':'纷','紜':'纭','紝':'纴','紞':'𬘘','紡':'纺','紬':'䌷','紮':'扎','細':'细','紱':'绂','紲':'绁','紳':'绅','紵':'纻','紹':'绍','紺':'绀','紼':'绋','紿':'绐','絀':'绌','終':'终','絃':'弦','組':'组','絅':'䌹','絆':'绊','絎':'绗','結':'结','絕':'绝','絛':'绦','絝':'绔','絞':'绞','絡':'络','絢':'绚','給':'给','絨':'绒','絪':'𬘡','絰':'绖','統':'统','絲':'丝','絳':'绛','絶':'绝','絹':'绢','絺':'𫄨','綁':'绑','綃':'绡','綄':'𬘫','綆':'绠','綈':'绨','綉':'绣','綌':'绤','綎':'𬘩','綏':'绥','綐':'䌼','綑':'捆','經':'经','綖':'𫄧','綜':'综','綝':'𬘭','綞':'缍','綠':'绿','綡':'𫟅','綢':'绸','綣':'绻','綧':'𬘯','綪':'𬘬','綫':'线','綬':'绶','維':'维','綯':'绹','綰':'绾','綱':'纲','網':'网','綳':'绷','綴':'缀','綵':'彩','綸':'纶','綹':'绺','綺':'绮','綻':'绽','綽':'绰','綾':'绫','綿':'绵','緄':'绲','緇':'缁','緊':'紧','緋':'绯','緑':'绿','緒':'绪','緓':'绬','緔':'绱','緗':'缃','緘':'缄','緙':'缂','線':'线','緝':'缉','緞':'缎','締':'缔','緡':'缗','緣':'缘','緦':'缌','編':'编','緩':'缓','緬':'缅','緯':'纬','緱':'缑','緲':'缈','練':'练','緶':'缏','緹':'缇','緻':'致','緼':'缊','縈':'萦','縉':'缙','縊':'缢','縋':'缒','縐':'绉','縑':'缣','縕':'缊','縗':'缞','縛':'缚','縝':'缜','縞':'缟','縟':'缛','縣':'县','縧':'绦','縫':'缝','縭':'缡','縮':'缩','縯':'𬙂','縱':'纵','縲':'缧','縳':'䌸','縴':'纤','縵':'缦','縶':'絷','縷':'缕','縹':'缥','總':'总','績':'绩','繃':'绷','繅':'缫','繆':'缪','繒':'缯','織':'织','繕':'缮','繚':'缭','繞':'绕','繡':'绣','繢':'缋','繩':'绳','繪':'绘','繫':'系','繭':'茧','繮':'缰','繯':'缳','繰':'缲','繳':'缴','繶':'𫄷','繸':'䍁','繹':'绎','繻':'𦈡','繼':'继','繽':'缤','繾':'缱','繿':'䍀','纁':'𫄸','纆':'𬙊','纇':'颣','纈':'缬','纊':'纩','續':'续','纍':'累','纏':'缠','纓':'缨','纔':'才','纕':'𬙋','纖':'纤','纘':'缵','纜':'缆','缽':'钵','罃':'䓨','罈':'坛','罌':'罂','罎':'坛','罰':'罚','罵':'骂','罷':'罢','羅':'罗','羆':'罴','羈':'羁','羋':'芈','羣':'群','羥':'羟','羨':'羡','義':'义','羶':'膻','習':'习','翫':'玩','翬':'翚','翹':'翘','翽':'翙','耬':'耧','耮':'耢','聖':'圣','聞':'闻','聯':'联','聰':'聪','聲':'声','聳':'耸','聵':'聩','聶':'聂','職':'职','聹':'聍','聽':'听','聾':'聋','肅':'肃','脅':'胁','脈':'脉','脛':'胫','脣':'唇','脩':'修','脫':'脱','脹':'胀','腎':'肾','腖':'胨','腡':'脶','腦':'脑','腫':'肿','腳':'脚','腸':'肠','膃':'腽','膕':'腘','膚':'肤','膞':'䏝','膠':'胶','膢':'𦝼','膩':'腻','膽':'胆','膾':'脍','膿':'脓','臉':'脸','臍':'脐','臏':'膑','臘':'腊','臚':'胪','臟':'脏','臠':'脔','臢':'臜','臥':'卧','臨':'临','臺':'台','與':'与','興':'兴','舉':'举','舊':'旧','舖':'铺','舘':'馆','艙':'舱','艤':'舣','艦':'舰','艫':'舻','艱':'艰','艷':'艳','芻':'刍','苧':'苎','茲':'兹','荊':'荆','莊':'庄','莖':'茎','莢':'荚','莧':'苋','華':'华','菴':'庵','菸':'烟','萇':'苌','萊':'莱','萬':'万','萴':'荝','萵':'莴','葉':'叶','葒':'荭','葤':'荮','葦':'苇','葯':'药','葷':'荤','蒍':'𫇭','蒐':'搜','蒓':'莼','蒔':'莳','蒕':'蒀','蒞':'莅','蒼':'苍','蓀':'荪','蓆':'席','蓋':'盖','蓮':'莲','蓯':'苁','蓴':'莼','蓽':'荜','蔄':'𬜬','蔔':'卜','蔘':'参','蔞':'蒌','蔣':'蒋','蔥':'葱','蔦':'茑','蔭':'荫','蔯':'𫈟','蔿':'𫇭','蕁':'荨','蕆':'蒇','蕎':'荞','蕒':'荬','蕓':'芸','蕕':'莸','蕘':'荛','蕢':'蒉','蕩':'荡','蕪':'芜','蕭':'萧','蕷':'蓣','薀':'蕰','薈':'荟','薊':'蓟','薌':'芗','薑':'姜','薔':'蔷','薘':'荙','薟':'莶','薦':'荐','薩':'萨','薴':'苧','薵':'䓓','薹':'苔','薺':'荠','藍':'蓝','藎':'荩','藝':'艺','藥':'药','藪':'薮','藭':'䓖','藴':'蕴','藶':'苈','藹':'蔼','藺':'蔺','蘀':'萚','蘄':'蕲','蘆':'芦','蘇':'苏','蘊':'蕴','蘋':'苹','蘚':'藓','蘞':'蔹','蘟':'𦻕','蘢':'茏','蘭':'兰','蘺':'蓠','蘿':'萝','虆':'蔂','虉':'𬟁','處':'处','虛':'虚','虜':'虏','號':'号','虧':'亏','虯':'虬','蛺':'蛱','蛻':'蜕','蜆':'蚬','蝀':'𬟽','蝕':'蚀','蝟':'猬','蝦':'虾','蝨':'虱','蝸':'蜗','螄':'蛳','螞':'蚂','螢':'萤','螮':'䗖','螻':'蝼','螿':'螀','蟄':'蛰','蟈':'蝈','蟎':'螨','蟣':'虮','蟬':'蝉','蟯':'蛲','蟲':'虫','蟳':'𫊻','蟶':'蛏','蟻':'蚁','蠁':'蚃','蠅':'蝇','蠆':'虿','蠍':'蝎','蠐':'蛴','蠑':'蝾','蠔':'蚝','蠟':'蜡','蠣':'蛎','蠨':'蟏','蠱':'蛊','蠶':'蚕','蠻':'蛮','衆':'众','衊':'蔑','術':'术','衕':'同','衚':'胡','衛':'卫','衝':'冲','袞':'衮','袷':'夹','裊':'袅','裏':'里','補':'补','裝':'装','裡':'里','製':'制','複':'复','褌':'裈','褘':'袆','褲':'裤','褳':'裢','褸':'褛','褻':'亵','襀':'𫌀','襇':'裥','襉':'裥','襏':'袯','襖':'袄','襝':'裣','襠':'裆','襤':'褴','襪':'袜','襬':'摆','襯':'衬','襲':'袭','襴':'襕','覈':'核','見':'见','覎':'觃','規':'规','覓':'觅','視':'视','覘':'觇','覡':'觋','覥':'觍','覦':'觎','親':'亲','覬':'觊','覯':'觏','覲':'觐','覷':'觑','覺':'觉','覽':'览','覿':'觌','觀':'观','觴':'觞','觶':'觯','觸':'触','訁':'讠','訂':'订','訃':'讣','計':'计','訊':'讯','訌':'讧','討':'讨','訏':'𬣙','訐':'讦','訒':'讱','訓':'训','訕':'讪','訖':'讫','託':'托','記':'记','訛':'讹','訝':'讶','訟':'讼','訢':'䜣','訣':'诀','訥':'讷','訩':'讻','訪':'访','設':'设','許':'许','訴':'诉','訶':'诃','診':'诊','註':'注','証':'证','詀':'𧮪','詁':'诂','詆':'诋','詎':'讵','詐':'诈','詒':'诒','詔':'诏','評':'评','詖':'诐','詗':'诇','詘':'诎','詛':'诅','詝':'𬣞','詞':'词','詠':'咏','詡':'诩','詢':'询','詣':'诣','試':'试','詩':'诗','詪':'𬣳','詫':'诧','詬':'诟','詭':'诡','詮':'诠','詰':'诘','話':'话','該':'该','詳':'详','詵':'诜','詷':'𫍣','詼':'诙','詿':'诖','誄':'诔','誅':'诛','誆':'诓','誇':'夸','誌':'志','認':'认','誑':'诳','誒':'诶','誕':'诞','誘':'诱','誚':'诮','語':'语','誠':'诚','誡':'诫','誣':'诬','誤':'误','誥':'诰','誦':'诵','誨':'诲','說':'说','説':'说','誰':'谁','課':'课','誶':'谇','誹':'诽','誼':'谊','誾':'訚','調':'调','諂':'谄','諄':'谆','談':'谈','諉':'诿','請':'请','諍':'诤','諏':'诹','諑':'诼','諒':'谅','諓':'𬣡','論':'论','諗':'谂','諛':'谀','諜':'谍','諝':'谞','諞':'谝','諟':'𬤊','諡':'谥','諢':'诨','諤':'谔','諦':'谛','諧':'谐','諫':'谏','諭':'谕','諮':'咨','諱':'讳','諲':'𬤇','諳':'谙','諴':'𫍯','諶':'谌','諷':'讽','諸':'诸','諺':'谚','諼':'谖','諾':'诺','謀':'谋','謁':'谒','謂':'谓','謄':'誊','謅':'诌','謊':'谎','謎':'谜','謏':'𫍲','謐':'谧','謔':'谑','謖':'谡','謗':'谤','謙':'谦','謚':'谥','講':'讲','謝':'谢','謠':'谣','謡':'谣','謨':'谟','謫':'谪','謬':'谬','謭':'谫','謳':'讴','謹':'谨','謾':'谩','譁':'哗','證':'证','譎':'谲','譏':'讥','譓':'𬤝','譖':'谮','識':'识','譙':'谯','譚':'谭','譜':'谱','譞':'𫍽','譟':'噪','譫':'谵','譭':'毁','譯':'译','議':'议','譴':'谴','護':'护','譸':'诪','譽':'誉','譾':'谫','讀':'读','讅':'谉','變':'变','讋':'詟','讌':'䜩','讎':'雠','讒':'谗','讓':'让','讕':'谰','讖':'谶','讚':'赞','讜':'谠','讞':'谳','谿':'溪','豈':'岂','豎':'竖','豐':'丰','豔':'艳','豬':'猪','豶':'豮','貍':'狸','貓':'猫','貙':'䝙','貝':'贝','貞':'贞','貟':'贠','負':'负','財':'财','貢':'贡','貧':'贫','貨':'货','販':'贩','貪':'贪','貫':'贯','責':'责','貯':'贮','貰':'贳','貲':'赀','貳':'贰','貴':'贵','貶':'贬','買':'买','貸':'贷','貺':'贶','費':'费','貼':'贴','貽':'贻','貿':'贸','賀':'贺','賁':'贲','賂':'赂','賃':'赁','賄':'贿','賅':'赅','資':'资','賈':'贾','賊':'贼','賑':'赈','賒':'赊','賓':'宾','賕':'赇','賙':'赒','賚':'赉','賜':'赐','賞':'赏','賠':'赔','賡':'赓','賢':'贤','賣':'卖','賤':'贱','賦':'赋','賧':'赕','質':'质','賫':'赍','賬':'账','賭':'赌','賰':'䞐','賴':'赖','賵':'赗','賺':'赚','賻':'赙','購':'购','賽':'赛','賾':'赜','贄':'贽','贅':'赘','贇':'赟','贈':'赠','贊':'赞','贋':'赝','贍':'赡','贏':'赢','贐':'赆','贓':'赃','贔':'赑','贖':'赎','贗':'赝','贛':'赣','贜':'赃','赬':'赪','趕':'赶','趙':'赵','趨':'趋','趲':'趱','跡':'迹','踐':'践','踰':'逾','踴':'踊','蹌':'跄','蹕':'跸','蹟':'迹','蹠':'跖','蹣':'蹒','蹤':'踪','蹺':'跷','躂':'跶','躉':'趸','躊':'踌','躋':'跻','躍':'跃','躎':'䟢','躑':'踯','躒':'跞','躓':'踬','躕':'蹰','躚':'跹','躡':'蹑','躥':'蹿','躦':'躜','躪':'躏','軀':'躯','車':'车','軋':'轧','軌':'轨','軍':'军','軏':'𫐄','軑':'轪','軒':'轩','軔':'轫','軛':'轭','軝':'𬨂','軟':'软','軤':'轷','軫':'轸','軲':'轱','軸':'轴','軹':'轵','軺':'轺','軻':'轲','軼':'轶','軾':'轼','較':'较','輄':'𨐈','輅':'辂','輇':'辁','輈':'辀','載':'载','輊':'轾','輋':'𪨶','輒':'辄','輓':'挽','輔':'辅','輕':'轻','輗':'𫐐','輛':'辆','輜':'辎','輝':'辉','輞':'辋','輟':'辍','輥':'辊','輦':'辇','輩':'辈','輪':'轮','輬':'辌','輮':'𫐓','輯':'辑','輳':'辏','輶':'𬨎','輸':'输','輻':'辐','輼':'辒','輾':'辗','輿':'舆','轀':'辒','轂':'毂','轄':'辖','轅':'辕','轆':'辘','轉':'转','轍':'辙','轎':'轿','轔':'辚','轟':'轰','轡':'辔','轢':'轹','轤':'轳','辦':'办','辭':'辞','辮':'辫','辯':'辩','農':'农','迴':'回','逕':'径','這':'这','連':'连','週':'周','進':'进','遊':'游','運':'运','過':'过','達':'达','違':'违','遙':'遥','遜':'逊','遞':'递','遠':'远','遡':'溯','適':'适','遲':'迟','遶':'绕','遷':'迁','選':'选','遺':'遗','遼':'辽','邁':'迈','還':'还','邇':'迩','邊':'边','邏':'逻','邐':'逦','郟':'郏','郵':'邮','鄆':'郓','鄉':'乡','鄒':'邹','鄔':'邬','鄖':'郧','鄧':'邓','鄩':'𬩽','鄭':'郑','鄰':'邻','鄲':'郸','鄳':'𫑡','鄴':'邺','鄶':'郐','鄺':'邝','酇':'酂','酈':'郦','醃':'腌','醖':'酝','醜':'丑','醞':'酝','醟':'蒏','醣':'糖','醫':'医','醬':'酱','醱':'酦','醲':'𬪩','釀':'酿','釁':'衅','釃':'酾','釅':'酽','釋':'释','釐':'厘','釒':'钅','釓':'钆','釔':'钇','釕':'钌','釗':'钊','釘':'钉','釙':'钋','針':'针','釣':'钓','釤':'钐','釦':'扣','釧':'钏','釩':'钒','釴':'𬬩','釵':'钗','釷':'钍','釹':'钕','釺':'钎','釾':'䥺','釿':'𬬱','鈀':'钯','鈁':'钫','鈃':'钘','鈄':'钭','鈅':'钥','鈇':'𫓧','鈈':'钚','鈉':'钠','鈍':'钝','鈎':'钩','鈐':'钤','鈑':'钣','鈒':'钑','鈔':'钞','鈕':'钮','鈞':'钧','鈡':'钟','鈣':'钙','鈥':'钬','鈦':'钛','鈧':'钪','鈮':'铌','鈰':'铈','鈳':'钶','鈴':'铃','鈷':'钴','鈸':'钹','鈹':'铍','鈺':'钰','鈽':'钸','鈾':'铀','鈿':'钿','鉀':'钾','鉅':'巨','鉆':'钻','鉈':'铊','鉉':'铉','鉊':'𬬿','鉋':'铇','鉍':'铋','鉑':'铂','鉕':'钷','鉗':'钳','鉚':'铆','鉛':'铅','鉝':'𫟷','鉞':'钺','鉢':'钵','鉤':'钩','鉥':'𬬸','鉦':'钲','鉧':'𬭁','鉬':'钼','鉭':'钽','鉮':'𬬹','鉳':'锫','鉶':'铏','鉷':'𫟹','鉸':'铰','鉺':'铒','鉻':'铬','鉿':'铪','銀':'银','銃':'铳','銅':'铜','銈':'𫓯','銍':'铚','銑':'铣','銓':'铨','銖':'铢','銘':'铭','銚':'铫','銛':'铦','銜':'衔','銠':'铑','銣':'铷','銥':'铱','銦':'铟','銨':'铵','銩':'铥','銪':'铕','銫':'铯','銬':'铐','銱':'铞','銳':'锐','銶':'𨱇','銷':'销','銹':'锈','銻':'锑','銼':'锉','鋁':'铝','鋃':'锒','鋅':'锌','鋇':'钡','鋌':'铤','鋏':'铗','鋐':'𬭎','鋒':'锋','鋗':'𫓶','鋙':'铻','鋝':'锊','鋟':'锓','鋣':'铘','鋤':'锄','鋥':'锃','鋦':'锔','鋨':'锇','鋩':'铓','鋪':'铺','鋭':'锐','鋮':'铖','鋯':'锆','鋰':'锂','鋱':'铽','鋶':'锍','鋸':'锯','鋹':'𬬮','鋼':'钢','錀':'𬬭','錁':'锞','錄':'录','錆':'锖','錇':'锫','錈':'锩','錏':'铔','錐':'锥','錒':'锕','錕':'锟','錘':'锤','錙':'锱','錚':'铮','錛':'锛','錞':'𬭚','錟':'锬','錠':'锭','錡':'锜','錢':'钱','錤':'𫓹','錦':'锦','錨':'锚','錩':'锠','錫':'锡','錮':'锢','錯':'错','録':'录','錳':'锰','錶':'表','錸':'铼','錼':'镎','鍀':'锝','鍁':'锨','鍃':'锪','鍅':'钫','鍆':'钔','鍇':'锴','鍈':'锳','鍊':'炼','鍋':'锅','鍍':'镀','鍔':'锷','鍘':'铡','鍚':'钖','鍛':'锻','鍠':'锽','鍤':'锸','鍥':'锲','鍩':'锘','鍬':'锹','鍭':'𬭤','鍰':'锾','鍵':'键','鍶':'锶','鍺':'锗','鍼':'针','鍾':'钟','鎂':'镁','鎄':'锿','鎇':'镅','鎊':'镑','鎌':'镰','鎓':'𬭩','鎔':'镕','鎖':'锁','鎘':'镉','鎚':'锤','鎛':'镈','鎝':'𨱏','鎡':'镃','鎢':'钨','鎣':'蓥','鎦':'镏','鎧':'铠','鎩':'铩','鎪':'锼','鎬':'镐','鎭':'镇','鎮':'镇','鎰':'镒','鎲':'镋','鎳':'镍','鎵':'镓','鎶':'鿔','鎸':'镌','鎿':'镎','鏃':'镞','鏇':'旋','鏈':'链','鏌':'镆','鏍':'镙','鏏':'𬭬','鏐':'镠','鏑':'镝','鏗':'铿','鏘':'锵','鏜':'镗','鏝':'镘','鏞':'镛','鏟':'铲','鏡':'镜','鏢':'镖','鏤':'镂','鏨':'錾','鏰':'镚','鏵':'铧','鏷':'镤','鏹':'镪','鏺':'䥽','鏻':'𬭸','鏽':'锈','鐃':'铙','鐄':'𨱑','鐇':'𫔍','鐋':'铴','鐍':'𫔎','鐏':'𨱔','鐐':'镣','鐒':'铹','鐓':'镦','鐔':'镡','鐘':'钟','鐙':'镫','鐝':'镢','鐠':'镨','鐥':'䦅','鐦':'锎','鐧':'锏','鐨':'镄','鐩':'𬭼','鐫':'镌','鐮':'镰','鐯':'䦃','鐲':'镯','鐳':'镭','鐵':'铁','鐶':'镮','鐸':'铎','鐺':'铛','鐽':'𫟼','鐿':'镱','鑄':'铸','鑊':'镬','鑌':'镔','鑑':'鉴','鑒':'鉴','鑔':'镲','鑕':'锧','鑞':'镴','鑠':'铄','鑣':'镳','鑥':'镥','鑪':'𬬻','鑭':'镧','鑰':'钥','鑱':'镵','鑲':'镶','鑷':'镊','鑹':'镩','鑼':'锣','鑽':'钻','鑾':'銮','鑿':'凿','钁':'镢','钂':'镋','長':'长','門':'门','閂':'闩','閃':'闪','閆':'闫','閈':'闬','閉':'闭','開':'开','閌':'闶','閎':'闳','閏':'闰','閑':'闲','閒':'闲','間':'间','閔':'闵','閘':'闸','閡':'阂','閣':'阁','閤':'合','閥':'阀','閨':'闺','閩':'闽','閫':'阃','閬':'阆','閭':'闾','閱':'阅','閲':'阅','閶':'阊','閹':'阉','閻':'阎','閼':'阏','閽':'阍','閾':'阈','閿':'阌','闃':'阒','闆':'板','闇':'暗','闈':'闱','闉':'𬮱','闊':'阔','闋':'阕','闌':'阑','闍':'阇','闐':'阗','闑':'𫔶','闒':'阘','闓':'闿','闔':'阖','闕':'阙','闖':'闯','關':'关','闞':'阚','闠':'阓','闡':'阐','闢':'辟','闤':'阛','闥':'闼','陘':'陉','陝':'陕','陞':'升','陣':'阵','陰':'阴','陳':'陈','陸':'陆','陽':'阳','隉':'陧','隊':'队','階':'阶','隑':'𬮿','隕':'陨','際':'际','隤':'𬯎','隨':'随','險':'险','隮':'𬯀','隯':'陦','隱':'隐','隴':'陇','隸':'隶','隻':'只','雋':'隽','雖':'虽','雙':'双','雛':'雏','雜':'杂','雞':'鸡','離':'离','難':'难','雲':'云','電':'电','霑':'沾','霢':'霡','霧':'雾','霽':'霁','靂':'雳','靄':'霭','靆':'叇','靈':'灵','靉':'叆','靚':'靓','靜':'静','靝':'靔','靦':'腼','靨':'靥','鞏':'巩','鞝':'绱','鞦':'秋','鞽':'鞒','韁':'缰','韃':'鞑','韆':'千','韉':'鞯','韋':'韦','韌':'韧','韍':'韨','韓':'韩','韙':'韪','韜':'韬','韝':'鞲','韞':'韫','韻':'韵','響':'响','頁':'页','頂':'顶','頃':'顷','項':'项','順':'顺','頇':'顸','須':'须','頊':'顼','頌':'颂','頍':'𫠆','頎':'颀','頏':'颃','預':'预','頑':'顽','頒':'颁','頓':'顿','頔':'𬱖','頗':'颇','領':'领','頜':'颌','頠':'𬱟','頡':'颉','頤':'颐','頦':'颏','頫':'𫖯','頭':'头','頮':'颒','頰':'颊','頲':'颋','頴':'颕','頵':'𫖳','頷':'颔','頸':'颈','頹':'颓','頻':'频','頽':'颓','顆':'颗','題':'题','額':'额','顎':'颚','顏':'颜','顒':'颙','顓':'颛','顔':'颜','顗':'𫖮','願':'愿','顙':'颡','顛':'颠','類':'类','顢':'颟','顥':'颢','顧':'顾','顫':'颤','顬':'颥','顯':'显','顰':'颦','顱':'颅','顳':'颞','顴':'颧','風':'风','颭':'飐','颮':'飑','颯':'飒','颱':'台','颳':'刮','颶':'飓','颸':'飔','颺':'飏','颻':'飖','颼':'飕','飀':'飗','飄':'飘','飆':'飙','飈':'飚','飛':'飞','飠':'饣','飢':'饥','飣':'饤','飥':'饦','飩':'饨','飪':'饪','飫':'饫','飭':'饬','飯':'饭','飱':'飧','飲':'饮','飴':'饴','飼':'饲','飽':'饱','飾':'饰','飿':'饳','餃':'饺','餄':'饸','餅':'饼','餈':'糍','餉':'饷','養':'养','餌':'饵','餎':'饹','餏':'饻','餑':'饽','餒':'馁','餓':'饿','餕':'馂','餖':'饾','餗':'𫗧','餘':'余','餚':'肴','餛':'馄','餜':'馃','餞':'饯','餡':'馅','館':'馆','餬':'糊','餱':'糇','餳':'饧','餵':'喂','餶':'馉','餷':'馇','餸':'𩠌','餺':'馎','餼':'饩','餾':'馏','餿':'馊','饁':'馌','饃':'馍','饅':'馒','饈':'馐','饉':'馑','饊':'馓','饋':'馈','饌':'馔','饑':'饥','饒':'饶','饗':'飨','饘':'𫗴','饜':'餍','饞':'馋','饢':'馕','馬':'马','馭':'驭','馮':'冯','馱':'驮','馳':'驰','馴':'驯','馹':'驲','馼':'𫘜','駁':'驳','駃':'𫘝','駉':'𬳶','駐':'驻','駑':'驽','駒':'驹','駓':'𬳵','駔':'驵','駕':'驾','駘':'骀','駙':'驸','駛':'驶','駝':'驼','駟':'驷','駡':'骂','駢':'骈','駪':'𬳽','駭':'骇','駰':'骃','駱':'骆','駸':'骎','駼':'𬳿','駿':'骏','騁':'骋','騂':'骍','騄':'𫘧','騅':'骓','騊':'𫘦','騌':'骔','騍':'骒','騎':'骑','騏':'骐','騑':'𬴂','騖':'骛','騙':'骗','騞':'𬴃','騠':'𫘨','騤':'骙','騧':'䯄','騫':'骞','騭':'骘','騮':'骝','騰':'腾','騱':'𫘬','騵':'𫘪','騶':'驺','騷':'骚','騸':'骟','騾':'骡','驀':'蓦','驁':'骜','驂':'骖','驃':'骠','驄':'骢','驅':'驱','驊':'骅','驌':'骕','驍':'骁','驎':'𬴊','驏':'骣','驕':'骄','驗':'验','驚':'惊','驛':'驿','驟':'骤','驢':'驴','驤':'骧','驥':'骥','驦':'骦','驪':'骊','驫':'骉','骯':'肮','髏':'髅','髒':'脏','體':'体','髕':'髌','髖':'髋','髮':'发','鬆':'松','鬍':'胡','鬚':'须','鬢':'鬓','鬥':'斗','鬧':'闹','鬨':'哄','鬩':'阋','鬮':'阄','鬱':'郁','鬹':'鬶','魎':'魉','魘':'魇','魚':'鱼','魛':'鱽','魟':'𫚉','魢':'鱾','魨':'鲀','魯':'鲁','魴':'鲂','魷':'鱿','魺':'鲄','鮀':'𬶍','鮁':'鲅','鮃':'鲆','鮆':'𫚖','鮈':'𬶋','鮊':'鲌','鮋':'鲉','鮍':'鲏','鮎':'鲇','鮐':'鲐','鮑':'鲍','鮒':'鲋','鮓':'鲊','鮚':'鲒','鮜':'鲘','鮝':'鲞','鮞':'鲕','鮟':'𩽾','鮠':'𬶏','鮡':'𬶐','鮣':'䲟','鮦':'鲖','鮪':'鲔','鮫':'鲛','鮭':'鲑','鮮':'鲜','鮳':'鲓','鮶':'鲪','鮸':'𩾃','鮺':'鲝','鯀':'鲧','鯁':'鲠','鯇':'鲩','鯉':'鲤','鯊':'鲨','鯒':'鲬','鯔':'鲻','鯕':'鲯','鯖':'鲭','鯗':'鲞','鯛':'鲷','鯝':'鲴','鯡':'鲱','鯢':'鲵','鯤':'鲲','鯧':'鲳','鯨':'鲸','鯪':'鲮','鯫':'鲰','鯰':'鲶','鯴':'鲺','鯷':'鳀','鯻':'𬶟','鯽':'鲫','鯿':'鳊','鰁':'鳈','鰂':'鲗','鰃':'鳂','鰆':'䲠','鰈':'鲽','鰉':'鳇','鰊':'𬶠','鰌':'䲡','鰍':'鳅','鰏':'鲾','鰐':'鳄','鰒':'鳆','鰓':'鳃','鰛':'鳁','鰜':'鳒','鰟':'鳑','鰠':'鳋','鰣':'鲥','鰤':'𫚕','鰥':'鳏','鰧':'䲢','鰨':'鳎','鰩':'鳐','鰭':'鳍','鰮':'鳁','鰱':'鲢','鰲':'鳌','鰳':'鳓','鰵':'鳘','鰶':'𬶭','鰷':'鲦','鰹':'鲣','鰺':'鲹','鰻':'鳗','鰼':'鳛','鰾':'鳔','鱀':'𬶨','鱂':'鳉','鱅':'鳙','鱇':'𩾌','鱈':'鳕','鱉':'鳖','鱒':'鳟','鱔':'鳝','鱖':'鳜','鱗':'鳞','鱘':'鲟','鱚':'𬶮','鱝':'鲼','鱟':'鲎','鱠':'鲙','鱣':'鳣','鱤':'鳡','鱧':'鳢','鱨':'鲿','鱭':'鲚','鱯':'鳠','鱲':'𫚭','鱷':'鳄','鱸':'鲈','鱺':'鲡','鳥':'鸟','鳧':'凫','鳩':'鸠','鳬':'凫','鳲':'鸤','鳳':'凤','鳴':'鸣','鳶':'鸢','鳾':'䴓','鴆':'鸩','鴇':'鸨','鴉':'鸦','鴒':'鸰','鴕':'鸵','鴛':'鸳','鴝':'鸲','鴞':'鸮','鴟':'鸱','鴣':'鸪','鴦':'鸯','鴨':'鸭','鴯':'鸸','鴰':'鸹','鴴':'鸻','鴷':'䴕','鴻':'鸿','鴿':'鸽','鵁':'䴔','鵂':'鸺','鵃':'鸼','鵏':'𬷕','鵐':'鹀','鵑':'鹃','鵒':'鹆','鵓':'鹁','鵜':'鹈','鵝':'鹅','鵟':'𫛭','鵠':'鹄','鵡':'鹉','鵪':'鹌','鵬':'鹏','鵮':'鹐','鵯':'鹎','鵰':'雕','鵲':'鹊','鵷':'鹓','鵾':'鹍','鶄':'䴖','鶇':'鸫','鶉':'鹑','鶊':'鹒','鶓':'鹋','鶖':'鹙','鶘':'鹕','鶚':'鹗','鶠':'𬸘','鶡':'鹖','鶥':'鹛','鶩':'鹜','鶪':'䴗','鶬':'鸧','鶯':'莺','鶱':'𬸣','鶲':'鹟','鶴':'鹤','鶹':'鹠','鶺':'鹡','鶻':'鹘','鶼':'鹣','鶿':'鹚','鷀':'鹚','鷁':'鹢','鷂':'鹞','鷄':'鸡','鷉':'䴘','鷊':'鹝','鷓':'鹧','鷖':'鹥','鷗':'鸥','鷙':'鸷','鷚':'鹨','鷟':'𬸦','鷥':'鸶','鷦':'鹪','鷫':'鹔','鷭':'𬸪','鷯':'鹩','鷲':'鹫','鷳':'鹇','鷴':'鹇','鷸':'鹬','鷹':'鹰','鷺':'鹭','鷽':'鸴','鸂':'㶉','鸇':'鹯','鸊':'䴙','鸌':'鹱','鸏':'鹲','鸑':'𬸚','鸕':'鸬','鸘':'鹴','鸚':'鹦','鸛':'鹳','鸝':'鹂','鸞':'鸾','鹵':'卤','鹹':'咸','鹺':'鹾','鹼':'碱','鹽':'盐','麗':'丽','麥':'麦','麩':'麸','麪':'面','麫':'面','麬':'𤿲','麯':'曲','麳':'𪎌','麴':'曲','麵':'面','麼':'么','麽':'么','黃':'黄','黌':'黉','點':'点','黨':'党','黲':'黪','黴':'霉','黶':'黡','黷':'黩','黽':'黾','黿':'鼋','鼂':'鼌','鼉':'鼍','鼕':'冬','鼴':'鼹','齊':'齐','齋':'斋','齎':'赍','齏':'齑','齒':'齿','齔':'龀','齕':'龁','齗':'龂','齘':'𬹼','齙':'龅','齜':'龇','齟':'龃','齠':'龆','齡':'龄','齣':'出','齦':'龈','齧':'啮','齪':'龊','齬':'龉','齮':'𬺈','齯':'𫠜','齲':'龋','齶':'腭','齷':'龌','齼':'𬺓','龍':'龙','龎':'厐','龐':'庞','龑':'䶮','龔':'龚','龕':'龛','龜':'龟','鿁':'䜤','鿓':'鿒','𠁞':'𠀾','𠗣':'㓆','𡃕':'𠴛','𡅏':'𠲥','𡑍':'𫭼','𡑭':'𡋗','𡓾':'𡋀','𡔖':'𡍣','𡞵':'㛟','𡠹':'㛿','𡢃':'㛠','𡮉':'𡭜','𡮣':'𡭬','𡳳':'𡳃','𡻕':'岁','𡾱':'㟜','𢣚':'𢘝','𢶫':'𢫞','𢹿':'𢬦','𣈶':'暅','𣙎':'㭣','𣞻':'𣘓','𣠩':'𣞎','𣠲':'𣑶','𣯶':'毶','𣾷':'㳢','𤁣':'𣺽','𤅶':'𣷷','𤓩':'𤊰','𤪺':'㻘','𤫩':'㻏','𤳸':'𤳄','𥊝':'𥅿','𥌃':'𥅘','𥕥':'𥐰','𥖅':'𥐯','𥗽':'𬒗','𥢢':'䅪','𥸠':'𥮋','𥼽':'𥹥','𦘧':'𡳒','𦣎':'𦟗','𦪙':'䑽','𧜗':'䘞','𧜵':'䙊','𧝞':'䘛','𧟀':'𧝧','𧩙':'䜥','𧵳':'䞌','𧶧':'䞎','𨊰':'䢀','𨊸':'䢁','𨋢':'䢂','𨤻':'𨤰','𨦫':'䦀','𨧀':'𬭊','𨧜':'䦁','𨨏':'𬭛','𨭆':'𬭶','𨭎':'𬭳','𨯅':'䥿','𩞯':'䭪','𩠴':'𩠠','𩣑':'䯃','𩶘':'䲞','𰻞':'𰻝'};
  return String(s||'').split('').map(function(c){return m[c]||c;}).join('');
}
var abiCache={};



var ABI_ALIAS={'诅咒之躯':'咒术之躯'};
function abiKey(name){var n=String(name||'').trim();return ABI_ALIAS[n]||n;}
function fetchAbility(name,cb){
  if(!name){cb&&cb(null);return;}
  var _diy=diyGet('ability',name);
  if(_diy){cb&&cb(_diy);return;}
  if(abiCache[name]){cb&&cb(abiCache[name]);return;}
  pkmDbLoad('abil','abilities.json',['name','en'],function(store){
    var hit=(store&&pkmDbLookup('abil',abiKey(name)))||(store&&pkmDbLookup('abil',name));
    if(hit){
      var d={name:name,text:hit.desc||hit.effect||'',detail:hit.effect||''};
      abiCache[name]=d;
      if(d.text){try{lsSet('pk_ab_'+name,d);}catch(e){}}
      cb&&cb(d);return;
    }
    cb&&cb(null);
  });
}
function showAbilityInfo(name){
  subOverlay.innerHTML='<div class="modal"><div class="modal-head"><div class="modal-name">'+esc(name)+'</div><button class="close" data-sub-close>✕</button></div><div class="modal-body" id="abi-body"><div class="empty">特性数据加载中...</div></div></div>';
  subOverlay.classList.add('open');
  fetchAbility(name,function(d){
    var b=document.getElementById('abi-body');
    if(!b)return;
    if(!d||!d.text){b.innerHTML='<div class="empty">特性数据获取失败</div>';return;}
b.innerHTML='<div class="row block"><span class="k">介绍</span><span class="v">'+esc(d.text)+'</span></div>'+((d.detail&&d.detail!==d.text)?'<div class="row block"><span class="k">详细效果</span><span class="v">'+esc(d.detail).replace(/\n/g,'<br>')+'</span></div>':'');
  });
}
var itemCache={},itemSpriteCache={};
var ITEM_ALIAS={};
var itemAliasPromise=null;function ensureItemAlias(){if(itemAliasPromise)return itemAliasPromise;itemAliasPromise=hudFetch(PKM_DATA_BASE+'item-alias.json').then(function(r){return r.ok?r.json():null;}).then(function(j){var m=(j&&j.data&&typeof j.data==='object'&&!Array.isArray(j.data))?j.data:((j&&typeof j==='object'&&!Array.isArray(j))?j:{});for(var k in m){if(m[k])ITEM_ALIAS[k]=String(m[k]);}return ITEM_ALIAS;}).catch(function(){return ITEM_ALIAS;});return itemAliasPromise;}function itemKey(name){ensureItemAlias();var n=String(name||'').trim();return ITEM_ALIAS[n]||n;}
var MOVE_ALIAS={};
var moveAliasPromise=null;function ensureMoveAlias(){if(moveAliasPromise)return moveAliasPromise;moveAliasPromise=hudFetch(PKM_DATA_BASE+'move-alias.json').then(function(r){return r.ok?r.json():null;}).then(function(j){var m=(j&&j.data&&typeof j.data==='object'&&!Array.isArray(j.data))?j.data:((j&&typeof j==='object'&&!Array.isArray(j))?j:{});for(var k in m){if(m[k])MOVE_ALIAS[k]=String(m[k]);}return MOVE_ALIAS;}).catch(function(){return MOVE_ALIAS;});return moveAliasPromise;}function moveKey(name){ensureMoveAlias();var n=t2s(String(name||'').trim());return MOVE_ALIAS[n]||n;}
function tmMoveName(name){
  var n=String(name||'').trim();
  var m=n.match(/^(?:技能机|招式学习器|TM)\s*[·:：]?\s*(.+)$/i);
  if(!m)return '';
  var v=m[1].trim();
  if(!v||/^\d+$/.test(v))return '';
  return v;
}
function itemCands(name){
  var n=String(name||'').trim();
  var keys=[n];
  var base=itemKey(n);
  if(base!==n)keys.push(base);
  var out=[];
  for(var i=0;i<keys.length;i++){
    var k=keys[i];
    if(out.indexOf(k)<0)out.push(k);
    var fw=k.replace(/[A-Za-z0-9]/g,function(c){return String.fromCharCode(c.charCodeAt(0)+65248);});
    if(out.indexOf(fw)<0)out.push(fw);
    var hw=k.replace(/[！-～]/g,function(c){return String.fromCharCode(c.charCodeAt(0)-65248);});
    if(out.indexOf(hw)<0)out.push(hw);
  }
  return out;
}
var itemListCache=null;


function itemListMaps(raw){
  if(!raw)return {cn:{},en:{},cn2en:{}};
  if(raw.cn&&typeof raw.cn==='object')return raw;
  return {cn:raw,en:{},cn2en:{}};
}
function itemPageTitles(key){
  var k=String(key||'').trim();
  if(!k)return [];
  if(/[\u4e00-\u9fff]/.test(k))return [t2s(k)+'（道具）'];
  var titles=[t2s(k)];
  var acc=t2s(k).replace(/\bPoke\b/g,'Poké');
  if(acc!==titles[0]&&titles.indexOf(acc)<0)titles.push(acc);
  return titles;
}
function itemBagIconEn(name){
  try{
    var it=(stat_data&&stat_data.背包)?stat_data.背包[name]:null;
    if(it&&it.图标){
      var s=String(it.图标).trim().replace(/\.(png|gif|jpe?g|webp)$/i,'').trim();
      if(s){return s.replace(/[-_]+/g,' ').replace(/\b[a-z]/g,function(c){return c.toUpperCase();});}
    }
  }catch(e){}
  return '';
}
function itemEnCands(en){
  var out=[];
  var e=String(en||'').trim();
  if(!e)return out;
  if(out.indexOf(e)<0)out.push(e);
  var spaced=e.replace(/[-_]+/g,' ');
  if(spaced!==e&&out.indexOf(spaced)<0)out.push(spaced);
  var titled=spaced.replace(/\b[a-z]/g,function(c){return c.toUpperCase();});
  if(out.indexOf(titled)<0)out.push(titled);
  return out;
}






function fetchItem(name,enName,cb){
  if(typeof enName==='function'){cb=enName;enName='';}
  if(!name){cb&&cb(null);return;}
  var _diy=diyGet('item',name);
  if(_diy){cb&&cb(_diy);return;}
  if(itemCache[name]){cb&&cb(itemCache[name]);return;}
  pkmDbLoad('item','items.json',['name','en','jp'],function(store){
    var hit=(store&&pkmDbLookup('item',itemKey(name)))||(store&&pkmDbLookup('item',name))||(store&&enName&&pkmDbLookup('item',enName));
    if(hit){
      var text=hit.desc||hit.effect||'';
      var det=(hit.cat==='重要物品')?'':(hit.effect||'');
      var img=(pkmItemSource==='serebii'&&hit.en)?serebiiItemUrl(hit.en):'';
      var d={name:name,text:text,detail:det,img:img};
      itemCache[name]=d;
      if(d.text){try{lsSet('pk_item_'+name,d);}catch(e){}}
      cb&&cb(d);return;
    }
    cb&&cb(null);
  });
}
function showItemInfo(name,back,enName){
  var toSub=!!(back&&subOverlay);
  var target=toSub?subOverlay:overlay;
  var closeAttr=toSub?'data-sub-close':'data-move-back';
  if(!toSub){if(back){pushBack();}else{clearBack();}}
  target.innerHTML='<div class="modal"><div class="modal-head"><div class="modal-name">'+esc(name)+'</div><button class="close" '+closeAttr+'>✕</button></div><div class="modal-body" id="item-body"><div class="empty">道具数据加载中...</div></div></div>';
  target.classList.add('open');
  fetchItem(name,enName,function(d){
    var b=document.getElementById('item-body');
    if(!b)return;
    if(!d||!d.text){b.innerHTML='<div class="empty">道具数据获取失败</div>';return;}
    var _body='<div class="row block"><span class="k">介绍</span><span class="v">'+esc(d.text||'').replace(/\n/g,'<br>')+'</span></div>';
    if(d.detail&&d.detail!==d.text)_body+='<div class="row block"><span class="k">详细效果</span><span class="v">'+esc(d.detail).replace(/\n/g,'<br>')+'</span></div>';
    b.innerHTML=_body;
  });
}
function itemCleanTarget(v){
  return String(v||'')
    .replace(/^\[\[(?:File|文件|檔案):/i,'')
    .replace(/[\[\]]/g,'')
    .replace(/\{\{[^}]*\}\}/g,'')
    .replace(/\|\s*\d+\s*px\s*$/i,'')
    .replace(/\d+\s*px\s*$/i,'')
    .replace(/\s+/g,'_')
    .replace(/^_+|_+$/g,'');
}
var itemEnCache={};
function itemEnOf(name,cb){
  var n=String(name||'').trim();
  if(!n){cb&&cb('');return;}
  if(itemEnCache[n]!==undefined){cb&&cb(itemEnCache[n]);return;}
  pkmDbLoad('item','items.json',['name','en'],function(store){
    var hit=(store&&pkmDbLookup('item',itemKey(n)))||(store&&pkmDbLookup('item',n));
    var en=hit?hit.en:'';
    itemEnCache[n]=en;
    cb&&cb(en);
  });
}
function fetchItemSprite(name,enName,cb){
  if(typeof enName==='function'){cb=enName;enName='';}
  if(!name){cb&&cb('');return;}
  itemEnOf(name,function(en){_fetchItemSprite(name,en||enName||'',cb);});
}
function _fetchItemSprite(name,enName,cb){
  if(pkmItemSource==='serebii'){var _ov=itemImgOf(name);if(_ov!==undefined){cb&&cb(_ov);return;}var _slug=itemSlugOf(name,enName);var _u=_slug?serebiiItemUrl(_slug):'';cb&&cb(_u);return;}
  if(itemSpriteCache[name]){cb&&cb(itemSpriteCache[name]);return;}
  var _c=lsGet('pk_itemimg_'+name,'');if(_c){itemSpriteCache[name]=_c;cb&&cb(_c);return;}
  var _diy=diyGet('item',name);
  if(_diy&&_diy.img){
    var _ref=String(_diy.img).trim();
    if(_ref.indexOf(HUD_DIY_SCHEME)===0){hudDiyAssetResolve(_ref).then(function(u){itemSpriteCache[name]=u;cb&&cb(u);});return;}
    if(/^(?:https?:|data:image\/|blob:)/i.test(_ref)){itemSpriteCache[name]=_ref;cb&&cb(_ref);return;}
  }
  var cands=itemCands(name);
  var bagEn=itemBagIconEn(name);
  if(bagEn&&cands.indexOf(bagEn)<0)cands.push(bagEn);
  var ens=itemEnCands(enName);
  for(var x=0;x<ens.length;x++){if(cands.indexOf(ens[x])<0)cands.push(ens[x]);}
  var ci=0,ti=0;
  function _try(){
  if(ci>=cands.length){itemSpriteCache[name]='';cb&&cb('');return;}
  var titles=itemPageTitles(cands[ci]);
  if(ti>=titles.length){ci++;ti=0;_try();return;}
  var page=titles[ti++];
  hudFetch('https://wiki.52poke.com/api.php?action=parse&page='+encodeURIComponent(page)+'&format=json&prop=wikitext|text&variant=zh-hans&origin=*&redirects=1')
    .then(function(r){return r.ok?r.json():Promise.reject();})
    .then(function(j){
      var wt=(j&&j.parse&&j.parse.wikitext)?j.parse.wikitext['*']:'';
      var html=(j&&j.parse&&j.parse.text)?j.parse.text['*']:'';
      var url='';
      var target='';
      var box=wt.match(/\{\{\s*[^{}\n]*信息框[\s\S]*?\n\}\}/);
      if(box){
        var im=box[0].match(/\|\s*(?:sprite|image|图片|贴图|img|圖)\s*=\s*([^\n|]+)/i);
        var primary=im?itemCleanTarget(im[1]):'';
        var dream='';
        var allre=/\|\s*(sprite\d*|image|img|图片|贴图|圖)\s*=\s*([^\n|]+)/gi;
        var mm;
        while((mm=allre.exec(box[0]))!==null){
          var v=itemCleanTarget(mm[2]);
          if(v&&/^Dream[_\s]/i.test(v)){dream=v;break;}
        }
        target=dream||primary;
      }
      if(target&&html){
        var enc=encodeURIComponent(target);
        var m3=html.match(new RegExp('src="([^"]*'+enc+'[^"]*)"','i'));
        if(m3){url=m3[1];}
      }
      if(!url&&html&&!target){
        var ownT=itemCleanTarget('Bag '+name+' Sprite');
        if(ownT){
          var ownEnc=encodeURIComponent(ownT);
          var ownM=html.match(new RegExp('src="([^"]*'+ownEnc+'[^"]*)"','i'));
          if(ownM){url=ownM[1];}
        }
      }
      if(!url&&html){
        var dm=html.match(/src="([^"]*Dream_[^"]*Sprite\.png[^"]*)"/);
        if(dm){url=dm[1];}
        if(!url){var m=html.match(/src="([^"]*Bag_[^"]*Sprite\.png[^"]*)"/);url=m?m[1]:'';}
        if(!url){var m2=html.match(/https?:\/\/[^"']*?Sprite\.png[^"']*/);url=m2?m2[0]:'';}
      }
      if(url){itemSpriteCache[name]=url;lsSet('pk_itemimg_'+name,url);cb&&cb(url);}
      else{_try();}
    })
    .catch(function(){_try();});
  }
  _try();
}
function resolveItemImgs(scope){
  var els=(scope||document).querySelectorAll('.item-wiki[data-item]');
  for(var i=0;i<els.length;i++){
    (function(el){
      var name=el.getAttribute('data-item');
      var en=el.getAttribute('data-item-en')||'';
      fetchItemSprite(name,en,function(url){
        if(url){
          var img=document.createElement('img');
          img.className=el.getAttribute('data-cls')||'item-icon';
          img.referrerPolicy='origin';
          img.src=url;
          img.onerror=function(){var p=document.createElement('span');p.className='item-icon placeholder';p.textContent='?';this.parentNode.replaceChild(p,this);};
          el.parentNode.replaceChild(img,el);
        }
      });
    })(els[i]);
  }
  var tms=(scope||document).querySelectorAll('.tm-wiki[data-tm]');
  for(var j=0;j<tms.length;j++){
    (function(el){
      var move=el.getAttribute('data-tm');
      fetchMove(move,function(d){
        var slug=typeSlug(d&&d.type);
        if(slug){
          var img=document.createElement('img');
          img.className='item-icon';
          img.src=psItemUrl('tm-'+slug,'bag');
          img.onerror=function(){var p=document.createElement('span');p.className='item-icon placeholder';p.textContent='?';this.parentNode.replaceChild(p,this);};
          el.parentNode.replaceChild(img,el);
        }
      });
    })(tms[j]);
  }
}
var TYPE_CHART=[['一般',[],['岩石','钢'],['幽灵']],['格斗',['一般','岩石','钢','冰','恶'],['飞行','毒','虫','超能力','妖精'],['幽灵']],['飞行',['格斗','虫','草'],['岩石','钢','电'],[]],['毒',['草','妖精'],['毒','地面','岩石','幽灵'],['钢']],['地面',['毒','岩石','钢','火','电'],['草','虫'],['飞行']],['岩石',['飞行','虫','火','冰'],['格斗','地面','钢'],[]],['虫',['草','超能力','恶'],['格斗','飞行','毒','幽灵','钢','火','妖精'],[]],['幽灵',['幽灵','超能力'],['恶'],['一般']],['钢',['岩石','冰','妖精'],['钢','火','水','电'],[]],['火',['虫','钢','草','冰'],['岩石','火','水','龙'],[]],['水',['地面','岩石','火'],['水','草','龙'],[]],['草',['地面','岩石','水'],['飞行','毒','虫','钢','火','草','龙'],[]],['电',['飞行','水'],['草','电','龙'],['地面']],['超能力',['格斗','毒'],['钢','超能力'],['恶']],['冰',['飞行','地面','草','龙'],['钢','火','水','冰'],[]],['龙',['龙'],['钢'],['妖精']],['恶',['幽灵','超能力'],['格斗','恶','妖精'],[]],['妖精',['格斗','龙','恶'],['毒','钢','火'],[]]];
function typeMul(atk,def){
  for(var i=0;i<TYPE_CHART.length;i++){
    if(TYPE_CHART[i][0]===atk){
      if(TYPE_CHART[i][3].indexOf(def)>=0)return 0;
      if(TYPE_CHART[i][1].indexOf(def)>=0)return 2;
      if(TYPE_CHART[i][2].indexOf(def)>=0)return 0.5;
      return 1;
    }
  }
  return 1;
}
function typeChartCalc(){
  var d1=document.getElementById('tc-def-1');
  var d2=document.getElementById('tc-def-2');
  var res=document.getElementById('tc-result');
  if(!d1||!res)return;
  var v1=d1.value,v2=d2?d2.value:'';
  if(!v1){res.innerHTML='<div class="empty">选择防御方属性后，自动显示克制它的属性</div>';return;}
  var defs=[v1];
  if(v2&&v2!==v1)defs.push(v2);
  var o4=[],o2=[],o05=[],o025=[],o0=[];
  for(var i=0;i<TYPE_CHART.length;i++){
    var atk=TYPE_CHART[i][0];
    var mul=1;
    for(var j=0;j<defs.length;j++){
      var m=typeMul(atk,defs[j]);
      if(m===0){mul=0;break;}
      mul*=m;
    }
    if(mul>=4)o4.push(atk);
    else if(mul===2)o2.push(atk);
    else if(mul===0.5)o05.push(atk);
    else if(mul===0.25)o025.push(atk);
    else if(mul===0)o0.push(atk);
  }
  function row(lab,list){
    if(!list.length)return '';
    return '<div style="display:flex;align-items:flex-start;gap:6px;padding:4px 0"><span class="dim" style="font-size:.72rem;flex-shrink:0;min-width:52px">'+lab+'</span><span style="display:flex;flex-wrap:wrap;gap:4px">'+list.map(function(t){return typeChipHTML(t);}).join('')+'</span></div>';
  }
  var h='';
  h+=row('4× 克制',o4);
  h+=row('2× 克制',o2);
  h+=row('½× 抵抗',o05);
  h+=row('¼× 抵抗',o025);
  h+=row('0× 无效',o0);
  if(!h)h='<div class="empty">无克制/抵抗/免疫关系</div>';
  res.innerHTML=h;
}
function typeChartHTML(){
  var opts='<option value="">无</option>'+TYPE_LIST.map(function(t){return '<option value="'+t+'">'+t+'</option>';}).join('');
  var selStyle='flex:1;min-width:0;box-sizing:border-box;padding:6px 8px;font-family:inherit;font-size:.85rem;background:rgba(43,74,111,.5);border:1px solid var(--frame);border-radius:4px;color:var(--text);outline:none';
  var h='<div class="set-title" style="margin-left:0">防御方属性（最多选两个）</div>';
  h+='<div style="display:flex;gap:6px;margin-bottom:8px"><select id="tc-def-1" style="'+selStyle+'">'+opts+'</select><select id="tc-def-2" style="'+selStyle+'">'+opts+'</select></div>';
  h+='<div id="tc-result"><div class="empty">选择防御方属性后，自动显示克制它的属性</div></div>';
  h+='<div class="set-title" style="margin-left:0;margin-top:6px">完整克制表</div>';
  h+='<div style="text-align:center"><img src="https://img.baibai.cv/f/e2jdhn/%E5%B1%9E%E6%80%A7%E7%9B%B8%E5%85%8B%E8%A1%A8.png" referrerpolicy="origin" data-tc-big="https://img.baibai.cv/f/e2jdhn/%E5%B1%9E%E6%80%A7%E7%9B%B8%E5%85%8B%E8%A1%A8.png" style="max-width:100%;height:auto;border-radius:6px;cursor:zoom-in" onerror="this.style.display=\'none\'"><div class="dim" style="font-size:.72rem;margin-top:4px">点击图片放大查看</div></div>';
  return frameP('属性克制表',h);
}
function typeColor(t){t=t2s(String(t||'').trim());return TYPE_COLORS[t]||TYPE_COLORS[TYPE_CN[t]]||'#888';}
function typeLabel(t){t=t2s(String(t||'').trim());return TYPE_CN[t]||t;}
function typeSlug(t){
  t=t2s(String(t||'').trim());
  if(!t)return '';
  if(/^[a-z]+$/i.test(t))return t.toLowerCase();
  for(var en in TYPE_CN){if(TYPE_CN[en]===t)return en;}
  return '';
}
function typeChipHTML(t){return '<span class="type-chip" style="background:'+typeColor(t)+'">'+esc(typeLabel(t))+'</span>';}
function typesHTML(a1,a2){var out='';if(a1)out+=typeChipHTML(a1);if(a2&&a2!=='无')out+=typeChipHTML(a2);if(!out)return '<span class="dim">-</span>';return '<div class="types">'+out+'</div>';}

function movesArr(s){
  if(!s)return [];
  return String(s).split(/[,，/、]/).map(function(x){
    var p=x.split(':');
    return {name:(p[0]||'').trim(),type:(p[1]||'').trim(),cat:(p[2]||'').trim()};
  }).filter(function(m){return m.name;});
}

function moveGridItemHTML(m){
  if(!m||!m.name)return '';
  var type=m.type||MOVE_TYPE[m.name]||'';
  var lb=typeLabel(type),cl=typeColor(type);
  var chip='<span class="move-type" style="background:'+(cl||'#6b7f99')+'">'+(lb?esc(lb):'?')+'</span>';
  return '<div class="dt-move-cell" data-move="'+esc(m.name)+'" data-mvtype="'+esc(type)+'" data-mvcat="'+esc(m.cat)+'">'+chip+'<span class="move-name">'+esc(m.name)+'</span></div>';
}

function moveGridHTML(s){
  if(!s)return '';
  var arr=movesArr(s);
  if(!arr.length)return '';
  var html='<div class="dt-move-grid">'+arr.slice(0,4).map(moveGridItemHTML).join('')+'</div>';
  if(arr.length>4){
    html+='<button type="button" class="dt-more-btn" data-dt-all="'+esc(s)+'">☰ 全部技能（'+arr.length+'）</button>';
  }
  return html;
}
function showAllMoves(s){
  var arr=movesArr(s);
  subOverlay.innerHTML='<div class="modal"><div class="modal-head"><div class="modal-name">全部技能（'+arr.length+'）</div><button class="close" data-sub-close>✕</button></div><div class="modal-body"><div class="dt-move-grid">'+arr.map(moveGridItemHTML).join('')+'</div></div></div>';
  subOverlay.classList.add('open');
}
function resolveMoveTypes(scope){var els=(scope||document).querySelectorAll('.dt-move-cell[data-move]');for(var i=0;i<els.length;i++){(function(el){var name=el.getAttribute('data-move');if(!name)return;fetchMove(name,function(d){if(d&&d.type){var lb=typeLabel(d.type);var cl=typeColor(d.type);if(!lb)return;el.setAttribute('data-mvtype',d.type);var sp=el.querySelector('.move-type');if(!sp){sp=document.createElement('span');sp.className='move-type';el.insertBefore(sp,el.firstChild);}sp.style.background=cl;sp.textContent=lb;}});})(els[i]);}}

var NATURE_MAP={'勤奋':{up:'',down:''},'怕寂寞':{up:'攻击',down:'防御'},'固执':{up:'攻击',down:'特攻'},'顽皮':{up:'攻击',down:'特防'},'勇敢':{up:'攻击',down:'速度'},'大胆':{up:'防御',down:'攻击'},'坦率':{up:'',down:''},'淘气':{up:'防御',down:'特攻'},'乐天':{up:'防御',down:'特防'},'悠闲':{up:'防御',down:'速度'},'内敛':{up:'特攻',down:'攻击'},'慢吞吞':{up:'特攻',down:'防御'},'害羞':{up:'',down:''},'马虎':{up:'特攻',down:'特防'},'冷静':{up:'特攻',down:'速度'},'温和':{up:'特防',down:'攻击'},'温顺':{up:'特防',down:'防御'},'慎重':{up:'特防',down:'特攻'},'浮躁':{up:'',down:''},'自大':{up:'特防',down:'速度'},'胆小':{up:'速度',down:'攻击'},'急躁':{up:'速度',down:'防御'},'爽朗':{up:'速度',down:'特攻'},'天真':{up:'速度',down:'特防'},'认真':{up:'',down:''}};
var NATURE_ALIAS={'开朗':'爽朗','保守':'内敛','沉着':'温和','胆怯':'胆小','轻率':'马虎','鲁莽':'马虎','谨慎':'慎重','散漫':'乐天','温吞':'慢吞吞','傲慢':'自大','冲动':'急躁','单纯':'天真','严肃':'认真','腼腆':'害羞','顽固':'固执','寂寞':'怕寂寞','顺从':'坦率','努力':'勤奋','温柔':'温顺'};
function natureEffectText(n){
  n=t2s(String(n||'').trim());
  var key=NATURE_MAP[n]?n:(NATURE_ALIAS[n]||n);
  var e=NATURE_MAP[key];
  if(!e)return '';
  if(!e.up&&!e.down)return '无能力值变化';
  return (e.up?'+'+e.up:'')+' '+(e.down?'-'+e.down:'');
}
function showNatureInfo(name){
  subOverlay.innerHTML='<div class="modal"><div class="modal-head"><div class="modal-name">'+esc(name)+'</div><button class="close" data-sub-close>✕</button></div><div class="modal-body"><div class="row"><span class="k">能力变化</span><span class="v">'+esc(natureEffectText(name)||'-')+'</span></div></div></div>';
  subOverlay.classList.add('open');
}
function bw2DetailFieldsHTML(c){
 var ball=c.ball?'<span class="item-icon placeholder item-wiki" data-item="'+esc(c.ball)+'" data-item-en="'+esc(c.ballEn||'')+'" data-cls="ball-icon dt-ball">?</span>':'';
 var rows='<div class="row"><span class="k">HP</span><span class="v">'+c.hpCur+'/'+c.hpMax+'</span></div>'+(c.status?'<div class="row"><span class="k">异常状态</span><span class="v">'+statusTag(c.status)+'</span></div>':'')+(c.hatch?'<div class="row"><span class="k">孵化剩余</span><span class="v">'+esc(c.hatch)+'</span></div>':'')+(c.partner?'<div class="row"><span class="k">搭档倾向</span><span class="v">'+esc(c.partner)+'</span></div>':'');
 return '<div class="modal-body"><div class="dt-top">'+ball+'</div><div class="dt-sprite">'+pkImgHTML(c.species,c.icon,c.shiny,'dt-big')+'</div>'+moveGridHTML(c.skills)+'<div class="row">'+(c.ability?'<span class="abi-link" data-ability="'+esc(c.ability)+'">'+esc(c.ability)+'</span>':'')+'</div><div class="row">'+(c.nature?'<span class="abi-link" data-nature="'+esc(c.nature)+'">'+esc(c.nature)+'</span>':'')+'</div>'+rows+'</div>';
}
function detailHTML(c){return bw2DetailHTML(c);}

function actionHTML(raw,key){return bw2ActionHTML(raw,key);}

function sendMessage(text){
  try{
    var w=WIN;
    var ta=w.document.querySelector('#send_textarea');
    var sb=w.document.querySelector('#send_but')||w.document.querySelector('button#send_but')||w.document.querySelector('[data-testid="send-button"]');
    if(ta&&sb){
      try{
        var proto=(WIN.HTMLTextAreaElement&&WIN.HTMLTextAreaElement.prototype)||(w.HTMLTextAreaElement&&w.HTMLTextAreaElement.prototype);
        var set=proto?Object.getOwnPropertyDescriptor(proto,'value'):null;
        if(set&&set.set){set.set.call(ta,text);}else{ta.value=text;}
      }catch(e){ta.value=text;}
      try{ta.dispatchEvent(new Event('input',{bubbles:true}));}catch(e){}
      try{ta.dispatchEvent(new Event('change',{bubbles:true}));}catch(e){}
      sb.click();return;
    }
    w.postMessage({type:'send_message',message:text},'*');return;
  }catch(e){}
  alert('已生成指令：'+text);
}
function sendAction(pkm,action){var map={对战:'我要向'+pkm.名字+'发起对战。',捕捉:'我要收服'+pkm.名字+'。',观察:'我要观察'+pkm.名字+'的举动。'};var text=map[action]||('我'+action+pkm.名字+'。');var ov=document.querySelector('.overlay');if(ov)ov.classList.remove('open');if(!fillInput(text))sendMessage(text);}

function menuHTML(){return bw2MenuHTML();}

var clearTarget='all',clearStep=0;
var itemClickEnabled=true;
try{var _ic=localStorage.getItem('pk_itemclick');itemClickEnabled=(_ic==null)||(_ic==='1');}catch(e){itemClickEnabled=true;}
function devUnlocked(){try{return localStorage.getItem('pk_dev_unlock')==='1';}catch(e){return false;}}
function setDevUnlock(v){try{if(v)localStorage.setItem('pk_dev_unlock','1');else localStorage.removeItem('pk_dev_unlock');}catch(e){}}
function devPanelOn(){try{return localStorage.getItem('pk_dev_panel')==='1';}catch(e){return false;}}
function setDevPanelOn(v){try{if(v)localStorage.setItem('pk_dev_panel','1');else localStorage.removeItem('pk_dev_panel');}catch(e){}}
function devPanelHTML(errMsg){
  if(!devPanelOn()){
    return '<div id="dev-status" class="dim" style="font-size:.72rem;margin-top:6px">'+(errMsg?esc(errMsg):'未解锁（输入密码后出现「全图鉴」选项）')+'</div>';
  }
  var fullChk=devUnlocked()?' checked':'';
  return '<div class="dim" style="font-size:.72rem;margin-top:6px">✨ 开发者选项已解锁</div>'+
    '<div class="set-title" style="margin-top:10px">全图鉴</div>'+
    '<div class="set-opts"><label class="set-opt"><input type="checkbox" data-toggle="devfull"'+fullChk+'>解锁全部图鉴（图鉴里可见全宝可梦）</label></div>';
}
function bindDevPanel(){
  var df=pageOverlay.querySelector('input[data-toggle="devfull"]');
  if(df){df.addEventListener('change',function(){setDevUnlock(df.checked);});}
}
function bindRandomMode(container){
  container=container||pageOverlay;
  var rm=container.querySelector('input[data-toggle="randommode"]');
  if(rm){rm.addEventListener('change',function(){if(rm.checked){if(randomModeEnabled)return;randomModeOn();}else{if(!randomModeEnabled)return;randomModeOff();}});}
  var rmc=container.querySelector('#random-mode-content');
  if(rmc){rmc.addEventListener('input',function(){randomModeSaveContent(rmc.value);});}
  var rap=container.querySelector('[data-random-apply]');
  if(rap){rap.addEventListener('click',function(e){e.stopPropagation();randomModeApply();});}
  var rr=container.querySelector('[data-random-restore]');
  if(rr){rr.addEventListener('click',function(e){e.stopPropagation();randomModeRestore();});}
  randomModeSyncUI();
}
var ICON_CFG=[
  {id:'q-box',label:'快捷·盒子',src:'https://img.baibai.cv/f/4eN3HA/%E7%9B%92%E5%AD%90.png',def:22},
  {id:'q-pokedex',label:'快捷·图鉴',src:'https://img.baibai.cv/f/1dNbu2/%E5%9B%BE%E9%89%B4.png',def:16},
  {id:'q-breeding',label:'快捷·繁育',src:'https://img.baibai.cv/f/ZVn1UV/%E7%B9%81%E8%82%B2.png',def:16},
  {id:'q-typechart',label:'快捷·克制表',emoji:'⚡',def:15},
{id:'q-map',label:'快捷·地图',emoji:'🗺️',def:15},
  {id:'m-bag',label:'菜单·背包',src:'https://img.baibai.cv/f/3o2qte/1788188339193.png',def:30},
  {id:'m-box',label:'菜单·盒子',src:'https://img.baibai.cv/f/4eN3HA/%E7%9B%92%E5%AD%90.png',def:30},
  {id:'m-breeding',label:'菜单·繁育',src:'https://img.baibai.cv/f/ZVn1UV/%E7%B9%81%E8%82%B2.png',def:20},
  {id:'m-pokedex',label:'菜单·图鉴',src:'https://img.baibai.cv/f/1dNbu2/%E5%9B%BE%E9%89%B4.png',def:30},
  {id:'m-rel',label:'菜单·人际关系',emoji:'💬',def:22},
  {id:'m-rivals',label:'菜单·劲敌',emoji:'👥',def:22},
  {id:'m-badge',label:'菜单·徽章盒',emoji:'🏅',def:22},
  {id:'m-diy',label:'菜单·DIY',emoji:'🛠️',def:22},
  {id:'m-map',label:'菜单·地图',emoji:'🗺️',def:22},
  {id:'m-settings',label:'菜单·设置',emoji:'⚙️',def:22}
];
function getIconSize(id){
  var c=ICON_CFG.find(function(x){return x.id===id;});
  var d=c?c.def:30;
  try{var m=JSON.parse(localStorage.getItem('pk_iconsize')||'{}');var v=m[id];return (v!=null&&!isNaN(Number(v)))?Number(v):d;}catch(e){return d;}
}
function iszIconHTML(c,sz){return c.src?'<img src="'+esc(c.src)+'" referrerpolicy="origin" style="width:'+sz+'px;height:'+sz+'px;object-fit:contain;image-rendering:pixelated">':'<span style="font-size:'+sz+'px;line-height:1">'+esc(c.emoji)+'</span>';}
function iconSizeListHTML(){
  var h='';
  for(var i=0;i<ICON_CFG.length;i++){
    var c=ICON_CFG[i],sz=getIconSize(c.id);
    h+='<div class="item-entry" style="align-items:center"><span id="isz-pv-'+esc(c.id)+'" style="width:64px;height:64px;flex-shrink:0;display:flex;align-items:center;justify-content:center;overflow:hidden">'+iszIconHTML(c,sz)+'</span><span class="item-name">'+esc(c.label)+'</span><span style="display:flex;align-items:center;gap:6px;flex-shrink:0"><button class="btn-small" data-isz-minus="'+esc(c.id)+'">－</button><input type="number" id="isz-'+esc(c.id)+'" value="'+sz+'" min="8" max="60" style="width:50px;box-sizing:border-box;padding:4px 6px;font-family:inherit;font-size:.82rem;background:rgba(43,74,111,.5);border:1px solid var(--frame);border-radius:4px;color:var(--text);outline:none;text-align:center"><button class="btn-small" data-isz-plus="'+esc(c.id)+'">＋</button></span></div>';
  }
  return h;
}
var fabSize=54;
try{var _fs=parseInt(localStorage.getItem('pk_fabsize'),10);if(_fs>=40&&_fs<=100)fabSize=_fs;}catch(e){}
var inlineH=500;
try{var _ih=parseInt(localStorage.getItem('pk_inline_h'),10);if(_ih>=320&&_ih<=900)inlineH=_ih;}catch(e){}

var FAB_IMG_DEFAULT='https://img.baibai.cv/f/n5n3fp/1788810124723.png';
var fabImg='';
try{fabImg=localStorage.getItem('pk_fabimg')||'';}catch(e){fabImg='';}
function applyFabSize(){
  var btn=document.getElementById('pkm-hud-btn');
  if(btn){
    btn.style.width=fabSize+'px';
    btn.style.height=fabSize+'px';
    btn.style.fontSize=Math.round(fabSize*0.48)+'px';
    var im=btn.querySelector('img');
    if(im){im.style.width=(fabSize-8)+'px';im.style.height=(fabSize-8)+'px';}
    try{
      var vw2=WIN.innerWidth||360, vh2=WIN.innerHeight||640;
      var l=parseFloat(btn.style.left)||0;
      var t=parseFloat(btn.style.top)||0;
      var nl=Math.max(0,Math.min(l,vw2-fabSize));
      var nt=Math.max(0,Math.min(t,vh2-fabSize));
      if(nl!==l||nt!==t){
        btn.style.left=nl+'px';
        btn.style.top=nt+'px';
        try{localStorage.setItem('pkm_fab_pos',JSON.stringify({l:nl,t:nt}));}catch(e){}
      }
    }catch(e){}
  }
  try{localStorage.setItem('pk_fabsize',String(fabSize));}catch(e){}
}
function openFabSize(){
  clearBack();
  overlay.innerHTML='<div class="modal" style="max-width:420px"><div class="modal-head"><div class="modal-name">悬浮球大小</div><button class="close" data-close>✕</button></div><div class="modal-body">'+
    '<div style="display:flex;align-items:center;justify-content:center;padding:14px 0"><span id="fab-pv" style="display:flex;align-items:center;justify-content:center;width:'+fabSize+'px;height:'+fabSize+'px;border-radius:50%;background:radial-gradient(circle at 30% 30%,#5a7db0,#2b4a6f);border:2px solid #7d95b5;box-shadow:0 4px 14px rgba(0,0,0,.5),0 0 12px rgba(124,196,248,.35);overflow:hidden;color:#fff;font-size:26px"><img src="https://img.baibai.cv/f/n5n3fp/1788810124723.png" onerror="this.outerHTML=\'⚪\'" style="width:100%;height:100%;object-fit:cover;border-radius:50%;pointer-events:none"></span></div>'+
    '<div style="display:flex;align-items:center;justify-content:center;gap:10px;margin:10px 0"><button class="btn-small" data-fab-minus>－</button><input type="number" id="fab-size" value="'+fabSize+'" min="40" max="100" style="width:80px;box-sizing:border-box;padding:6px 8px;font-family:inherit;font-size:.9rem;background:rgba(43,74,111,.5);border:1px solid var(--frame);border-radius:4px;color:var(--text);outline:none;text-align:center"><button class="btn-small" data-fab-plus>＋</button></div>'+
    '<div class="dim" style="font-size:.72rem;text-align:center;margin-bottom:4px">范围 40 ~ 100 px（默认 54）</div>'+
    '<div class="action-btns" style="margin-top:12px"><button class="act-btn" data-fab-apply>✔ 应用</button><button class="act-btn" data-fab-reset>↺ 恢复默认</button></div>'+
    '</div></div>';
  overlay.classList.add('open');
}
function fabStep(d){
  var v=Math.max(40,Math.min(100,fabSize+d));
  fabSize=v;
  var el=document.getElementById('fab-size');
  if(el)el.value=v;
  var pv=document.getElementById('fab-pv');
  if(pv){pv.style.width=v+'px';pv.style.height=v+'px';}
}
function fabApply(){
  var el=document.getElementById('fab-size');
  var v=el?parseInt(el.value,10):NaN;
  if(!isNaN(v))fabSize=Math.max(40,Math.min(100,v));
  applyFabSize();
  overlay.classList.remove('open');
  hudMsg('悬浮球大小已应用：'+fabSize+'px');
}
function fabReset(){
  fabSize=54;
  applyFabSize();
  overlay.classList.remove('open');
  hudMsg('悬浮球大小已恢复默认 54px');
}
function openInlineH(){return bw2OpenScale();}
function inlineHStep(d){return bw2ScaleStep(d/2);}
function inlineHApply(){return bw2ScaleApply(false);}
function inlineHReset(){return bw2ScaleApply(true);}
function applyFabImg(){
  var btn=document.getElementById('pkm-hud-btn');
  if(btn){
    var src=fabImg||FAB_IMG_DEFAULT;
    var im=btn.querySelector('img');
    if(!im){
      btn.textContent='';
      im=document.createElement('img');
      im.style.width=(fabSize-8)+'px';
      im.style.height=(fabSize-8)+'px';
      im.style.objectFit='cover';
      im.style.borderRadius='50%';
      im.style.pointerEvents='none';
      im.onerror=function(){this.remove();this.parentNode.textContent='⚪';};
      btn.appendChild(im);
    }
    im.src=src;
  }
  try{if(fabImg){localStorage.setItem('pk_fabimg',fabImg);}else{localStorage.removeItem('pk_fabimg');}}catch(e){}
}
function fabImgPreview(src){
  src=String(src||'').trim();
  var pv=document.getElementById('fab-img-pv');
  if(pv){pv.innerHTML='<img id="fab-img-pv-img" src="'+esc(src)+'" onerror="this.outerHTML=\'⚪\'" style="width:100%;height:100%;object-fit:cover;border-radius:50%;pointer-events:none">';}
}
function openFabImg(){
  clearBack();
  var cur=fabImg||FAB_IMG_DEFAULT;
  overlay.innerHTML='<div class="modal" style="max-width:460px"><div class="modal-head"><div class="modal-name">悬浮球图片</div><button class="close" data-close>✕</button></div><div class="modal-body">'+
    '<div style="display:flex;align-items:center;justify-content:center;padding:14px 0"><span id="fab-img-pv" style="display:flex;align-items:center;justify-content:center;width:'+fabSize+'px;height:'+fabSize+'px;border-radius:50%;background:radial-gradient(circle at 30% 30%,#5a7db0,#2b4a6f);border:2px solid #7d95b5;box-shadow:0 4px 14px rgba(0,0,0,.5),0 0 12px rgba(124,196,248,.35);overflow:hidden;color:#fff;font-size:26px"><img id="fab-img-pv-img" src="'+esc(cur)+'" onerror="this.outerHTML=\'⚪\'" style="width:100%;height:100%;object-fit:cover;border-radius:50%;pointer-events:none"></span></div>'+
    '<div class="set-title" style="margin-left:0;margin-top:4px">选择图片</div>'+
    '<input type="text" id="fab-img-url" placeholder="粘贴图片链接（http/https 或 data:image/...）" value="'+esc(fabImg)+'" style="'+DIY_INPUT_STYLE+'">'+
    '<div style="display:flex;gap:8px;align-items:center;margin-bottom:6px"><button class="btn-small" id="fab-img-upload" type="button">📁 上传本地图片</button><input type="file" id="fab-img-file" accept="image/*" style="display:none"><span class="dim" style="font-size:.7rem">建议 ≤800KB</span></div>'+
    '<div class="action-btns" style="margin-top:10px"><button class="act-btn" data-fab-img-apply>✔ 应用</button><button class="act-btn" data-fab-img-preview>👁 预览</button><button class="act-btn" data-fab-img-reset>↺ 恢复默认</button></div>'+
    '</div></div>';
  overlay.classList.add('open');
  var file=document.getElementById('fab-img-file');
  var up=document.getElementById('fab-img-upload');
  if(up&&file){
    up.addEventListener('click',function(){file.click();});
    file.addEventListener('change',function(){
      if(!file.files||!file.files.length)return;
      var f=file.files[0];
      if(f.size>800*1024){hudMsg('图片超过 800KB，请换一张更小的');return;}
      var rd=new FileReader();
      rd.onload=function(){
        var data=String(rd.result||'');
        var url=document.getElementById('fab-img-url');
        if(url)url.value=data;
        fabImgPreview(data);
      };
      rd.readAsDataURL(f);
    });
  }
}
function fabImgApply(){
  var url=document.getElementById('fab-img-url');
  var v=url?url.value.trim():'';
  fabImg=v;
  applyFabImg();
  overlay.classList.remove('open');
  hudMsg(fabImg?'悬浮球图片已应用':'已恢复默认悬浮球图片');
}
function fabImgReset(){
  fabImg='';
  try{localStorage.removeItem('pk_fabimg');}catch(e){}
  applyFabImg();
  overlay.classList.remove('open');
  hudMsg('悬浮球图片已恢复默认');
}
function openIconSize(){
  clearBack();
  overlay.innerHTML='<div class="modal" style="max-width:480px"><div class="modal-head"><div class="modal-name">自定义图标大小</div><button class="close" data-close>✕</button></div><div class="modal-body">'+iconSizeListHTML()+'<div class="action-btns" style="margin-top:10px"><button class="act-btn" data-isz-apply>✔ 应用</button><button class="act-btn" data-isz-reset>↺ 恢复默认</button></div></div></div>';
  overlay.classList.add('open');
}
function iszStep(id,d){
  var el=document.getElementById('isz-'+id);
  if(!el)return;
  var v=(parseInt(el.value,10)||0)+d;
  v=Math.max(8,Math.min(60,v));
  el.value=v;
  var pv=document.getElementById('isz-pv-'+id);
  var c=ICON_CFG.find(function(x){return x.id===id;});
  if(pv&&c){pv.innerHTML=iszIconHTML(c,v);}
}
function iszApply(){
  try{
    var m={};
    for(var i=0;i<ICON_CFG.length;i++){
      var el=document.getElementById('isz-'+ICON_CFG[i].id);
      if(el){var v=parseInt(el.value,10);if(!isNaN(v)){v=Math.max(8,Math.min(60,v));m[ICON_CFG[i].id]=v;}}
    }
    localStorage.setItem('pk_iconsize',JSON.stringify(m));
  }catch(e){}
  overlay.classList.remove('open');
  render();
  resizeFrame();
}
function iszReset(){
  try{localStorage.removeItem('pk_iconsize');}catch(e){}
  overlay.classList.remove('open');
  render();
  resizeFrame();
}
function pokeosPxClearSpriteCache(){
  pkmSpriteCache={};pkmIconCache={};dexThumbCache={};
  try{for(var i=localStorage.length-1;i>=0;i--){var k=localStorage.key(i);if(k&&(k.indexOf('pk_sprite_')===0||k.indexOf('pk_icon_')===0||k.indexOf('pk_dexthumb_')===0)){localStorage.removeItem(k);}}}catch(e){}
}
function hudDiagSnapshot(){
  var lastErrors=(hudDiag.errors||[]).slice(-8).map(function(x){return {at:x.at,area:x.area,name:x.name,message:x.message};});
  return {
    version:PK_VER,
    uptimeMs:Date.now()-hudDiag.startedAt,
    activeRequests:hudDiag.activeRequests,
    maxActiveRequests:hudDiag.maxActiveRequests,
    timers:hudScope.timerCount,
    intervals:hudScope.intervalCount,
    observers:hudScope.observerCount,
    controllers:hudScope.controllerCount,
    cacheMemoryKeys:Object.keys(hudCacheMem||{}).length,
    diyObjectUrls:Object.keys(hudDiyBlobByRef||{}).length,
    locationIndex:(hudLocationIndex&&hudLocationIndex.size)||0,
    diyIndex:(hudDiyNameIndex&&hudDiyNameIndex.size)||0,
    stateRevision:hudStateRevision(),
    counters:pkmHudClone(hudDiag.counters||{}),
    errors:lastErrors
  };
}
try{WIN.__pkmHudDiagnostics=function(){return pkmHudClone(hudDiagSnapshot());};}catch(e){}
function diagInfo(){
  var d={styles:'?',cache:'?',scripts:'?',runtime:hudDiagSnapshot()};
  try{
    d.styles=0;
    document.querySelectorAll('style').forEach(function(s){if(s.textContent.indexOf('pkm-hud')>=0||s.textContent.indexOf('map-pin')>=0)d.styles++;});
  }catch(e){}
  try{
    var cnt=0,bytes=0;
    for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(k&&k.indexOf('pk_')===0){cnt++;bytes+=String(localStorage.getItem(k)||'').length;}}
    d.cache='localStorage '+cnt+'项 / '+Math.round(bytes/1024)+'KB · IDB内存索引 '+Object.keys(hudCacheMem||{}).length+'项';
  }catch(e){}
  try{
    var w=WIN,ST=w&&w.SillyTavern,ctx=ST&&ST.getContext?ST.getContext():null;
    var ch=ctx&&ctx.characters?ctx.characters[ctx.characterId]:null;
    var sc=(ch&&ch.data&&ch.data.extensions&&ch.data.extensions.tavern_helper&&ch.data.extensions.tavern_helper.scripts)||[];
    var n=0;sc.forEach(function(s){if(s&&s.content&&s.content.indexOf('pkm-hud-btn')>=0)n++;});
    d.scripts=n;
  }catch(e){}
  return d;
}
function diagHTML(){
  var d=diagInfo(),r=d.runtime||{},ok=(d.scripts===1&&d.styles===1),errs=r.errors||[],last=errs.length?errs[errs.length-1]:null,h='';
  h+='<div class="info-row"><span class="k">HUD脚本份数</span><span class="v">'+d.scripts+'（正常1）</span></div>';
  h+='<div class="info-row"><span class="k">HUD样式注入</span><span class="v">'+d.styles+'（正常1）</span></div>';
  h+='<div class="info-row info-row-click" data-cache-usage title="点击查看缓存明细"><span class="k">缓存占用</span><span class="v">'+esc(d.cache)+' 🔍</span></div>';
  h+='<div class="info-row"><span class="k">生命周期</span><span class="v">计时器 '+r.timers+' · 轮询 '+r.intervals+' · Observer '+r.observers+'</span></div>';
  h+='<div class="info-row"><span class="k">网络请求</span><span class="v">当前 '+r.activeRequests+' · 峰值 '+r.maxActiveRequests+'</span></div>';
  h+='<div class="info-row"><span class="k">索引</span><span class="v">精灵 '+r.locationIndex+' · DIY '+r.diyIndex+' · Rev '+esc(r.stateRevision||'-')+'</span></div>';
  h+='<div class="info-row"><span class="k">局部刷新</span><span class="v">'+Number((r.counters||{}).partialRenders||0)+' 次</span></div>';
  h+='<div class="info-row"><span class="k">最近错误</span><span class="v" style="color:'+(last?'#fbbf24':'#4ade80')+'">'+(last?esc(last.area+': '+last.message):'无')+'</span></div>';
  h+='<div class="info-row"><span class="k">诊断结论</span><span class="v" style="color:'+(ok?'#4ade80':'#f87171')+'">'+(ok?'✅ 运行结构正常':'⚠️ 检测到重复脚本/样式')+'</span></div>';
  h+='<div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn-small" data-diag-refresh>🔍 重新检测</button><button class="btn-small" data-diag-copy>📋 复制诊断</button><button class="btn-small" data-diag-clear>🧹 清错误日志</button></div>';
  return h;
}
function hudFmtBytes(n){
  n=Math.max(0,Number(n)||0);
  if(n<1024)return n+' B';
  if(n<1048576)return (n/1024).toFixed(1)+' KB';
  if(n<1073741824)return (n/1048576).toFixed(1)+' MB';
  return (n/1073741824).toFixed(2)+' GB';
}
function hudUtf8Bytes(s){
  s=String(s==null?'':s);
  if(!s)return 0;
  try{var E=WIN.TextEncoder||(typeof TextEncoder!=='undefined'?TextEncoder:null);if(E)return new E().encode(s).length;}catch(e){}
  var b=0;
  for(var i=0;i<s.length;i++){var c=s.charCodeAt(i);if(c<0x80)b+=1;else if(c<0x800)b+=2;else if(c>=0xd800&&c<=0xdbff){b+=4;i++;}else b+=3;}
  return b;
}
function hudCacheValBytes(v){
  var s;
  if(typeof v==='string')s=v;
  else{try{s=JSON.stringify(v);}catch(e){s=String(v);}}
  return hudUtf8Bytes(s);
}
var HUD_CACHE_USAGE_ORDER=['sprite','item','mv','pm','ab','dex','fid','nearby','other','diy','seen','legacy','settings'];
var HUD_CACHE_USAGE_LABELS={sprite:'精灵图缓存',item:'道具缓存（含道具图）',mv:'招式缓存',pm:'宝可梦预览缓存',ab:'特性缓存',dex:'图鉴列表',fid:'形态ID',nearby:'附近属性缓存',other:'其它数据缓存',diy:'DIY 图片库',seen:'图鉴收集进度',legacy:'本地残留缓存',settings:'设置与其它数据'};
function hudCacheUsageItems(){
  var buckets={};HUD_CACHE_USAGE_ORDER.forEach(function(k){buckets[k]={name:HUD_CACHE_USAGE_LABELS[k],count:0,bytes:0};});
  var memKeys=Object.keys(hudCacheMem||{});
  for(var i=0;i<memKeys.length;i++){
    var k=memKeys[i],b=hudCacheValBytes(hudCacheMem[k]),key='other';
    if(/^pk_(sprite_|icon_|slug_|ndex_|ps_|psf_)/.test(k))key='sprite';
    else if(/^pk_item_/.test(k)||k==='pk_itemlist'||/^pk_itemimg_/.test(k))key='item';
    else if(/^pk_mv_/.test(k))key='mv';
    else if(/^pk_pm_/.test(k))key='pm';
    else if(/^pk_ab_/.test(k)||k==='pk_abilist')key='ab';
    else if(k==='pk_dexlist')key='dex';
    else if(/^pk_fid_/.test(k))key='fid';
    else if(/^nbtype_/.test(k))key='nearby';
    buckets[key].count++;buckets[key].bytes+=b;
  }
  try{
    for(var li=0;li<localStorage.length;li++){
      var lk=localStorage.key(li);if(!lk)continue;
      if(lk.indexOf('pk_')!==0&&lk.indexOf('nbtype_')!==0)continue;
      var raw=localStorage.getItem(lk);var lb=hudUtf8Bytes(raw||'');var lkey;
      if(/^pk_seen_/.test(lk)||/^pk_seenfull2_/.test(lk))lkey='seen';
      else if(/^nbtype_/.test(lk))lkey='nearby';
      else if(/^pk_dexlist4_/.test(lk)||lk==='pk_dexlist')lkey='dex';
      else if(hudIsCacheKey(lk))lkey='legacy';
      else lkey='settings';
      buckets[lkey].count++;buckets[lkey].bytes+=lb;
    }
  }catch(e){}
  return buckets;
}
function hudCacheUsageSnapshot(){
  var buckets=hudCacheUsageItems();
  function scanStore(dbP,storeName){
    return dbP().then(function(db){
      return new Promise(function(res){
        var rows=[],tx=null,done=false,tm=0;
        function finish(){if(done)return;done=true;if(tm)WIN.clearTimeout(tm);res(rows);}
        try{
          tx=db.transaction(storeName,'readonly');
          var rq=tx.objectStore(storeName).openCursor();
          tm=WIN.setTimeout(finish,8000);
          rq.onsuccess=function(){var c=rq.result;if(!c){finish();return;}var v=c.value||{};rows.push({size:Number(v.size||(v.b&&v.b.size)||(v.blob&&v.blob.size)||0)});c.continue();};
          rq.onerror=finish;tx.onabort=finish;
        }catch(e){finish();}
      });
    }).catch(function(){return [];});
  }
  return scanStore(hudDiyAssetDb,'assets').then(function(diyRows){
    var i,diyBytes=0;
    for(i=0;i<diyRows.length;i++)diyBytes+=diyRows[i].size||0;
    buckets.diy.count=diyRows.length;buckets.diy.bytes=diyBytes;
    return buckets;
  });
}
function renderCacheUsage(buckets){
  var total=0,i,key;
  for(i=0;i<HUD_CACHE_USAGE_ORDER.length;i++)total+=buckets[HUD_CACHE_USAGE_ORDER[i]].bytes||0;
  var rows=[];
  for(i=0;i<HUD_CACHE_USAGE_ORDER.length;i++){
    key=HUD_CACHE_USAGE_ORDER[i];var c=buckets[key];
    if(c&&c.count>0)rows.push('<div class="row"><span class="k">'+esc(c.name)+'</span><span class="v">'+c.count+' 项 · '+hudFmtBytes(c.bytes)+'</span></div>');
  }
  var list=rows.length?rows.join(''):'<div class="row"><span class="v dim">暂无缓存</span></div>';
  var bar='';
  if(total>0){
    var colors=['#7cc4f8','#8b5cf6','#4ade80','#fbbf24','#f472b6','#38bdf8','#a3e635','#fb923c','#94a3b8','#f87171','#c084fc'];
    var grads=[],acc=0;
    for(i=0;i<HUD_CACHE_USAGE_ORDER.length;i++){
      key=HUD_CACHE_USAGE_ORDER[i];var cc=buckets[key];
      if(!cc||cc.bytes<=0)continue;
      var pct=Math.round(cc.bytes/total*1000)/10;
      var from=acc,to=acc+pct;
      grads.push(colors[i%colors.length]+' '+from+'% '+to+'%');
      acc=to;
    }
    bar='<div class="cu-bar"><i style="background:linear-gradient(90deg,'+grads.join(',')+')"></i></div>';
  }
  overlay.innerHTML='<div class="modal"><div class="modal-head"><div class="modal-name">📊 缓存占用明细</div><button class="close" data-close>✕</button></div><div class="modal-body">'+
    '<div class="cu-total"><span>总计</span><span>'+hudFmtBytes(total)+'</span></div>'+bar+
    list+
    '<div class="dim" style="font-size:.72rem;margin-top:10px;line-height:1.6">文字类缓存按文本字节数估算，DIY 图片为实际文件大小；可在「设置 → 清理缓存」按类别清理。</div>'+
    '<div class="action-btns" style="margin-top:10px"><button class="act-btn" data-cache-usage-refresh>🔄 重新扫描</button></div>'+
    '</div></div>';
}
function openCacheUsage(){
  if(!overlay)return;
  overlay.innerHTML='<div class="modal"><div class="modal-head"><div class="modal-name">📊 缓存占用明细</div><button class="close" data-close>✕</button></div><div class="modal-body"><div class="row"><span class="v dim">正在扫描缓存…</span></div></div></div>';
  overlay.classList.add('open');
  hudCacheUsageSnapshot().then(function(buckets){
    if(!overlay.classList.contains('open'))return;
    renderCacheUsage(buckets);
  }).catch(function(){
    if(!overlay.classList.contains('open'))return;
    overlay.innerHTML='<div class="modal"><div class="modal-head"><div class="modal-name">📊 缓存占用明细</div><button class="close" data-close>✕</button></div><div class="modal-body"><div class="row"><span class="v">扫描失败，请重试。</span></div><div class="action-btns"><button class="act-btn" data-cache-usage-refresh>🔄 重试</button></div></div></div>';
  });
}









function settingsHTML(){
  var opts=[['mv','招式缓存'],['pm','宝可梦预览缓存'],['sprite','队伍精灵图缓存'],['ab','特性缓存'],['dex','图鉴列表'],['fid','形态ID'],['item','道具缓存'],['seen','图鉴收集进度'],['all','全部缓存']];
  var radios=opts.map(function(o){return '<label class="set-opt"><input type="radio" name="pk-clear" value="'+o[0]+'"'+(clearTarget===o[0]?' checked':'')+' data-clear="'+o[0]+'">'+o[1]+'</label>';}).join('');
  var itemChk=itemClickEnabled?' checked':'';
var winChk=(winMode==='1')?' checked':'';
var inlineOpt='<label class="set-opt">界面缩放：<b>'+bw2ScalePercent+'</b> %</label><button class="act-btn" data-inline-h-open>等比放大／缩小</button>';
var fabOpt=(winMode==='1')?'<button class="act-btn" data-fab-open>🔵 悬浮球大小</button><button class="act-btn" data-fab-img-open>🖼 悬浮球图片</button>':'';
return frame('设置','<div class="set-title">功能开关</div><div class="set-opts"><label class="set-opt"><input type="checkbox" data-toggle="itemclick"'+itemChk+'>点击道具查看效果</label></div>'+entertainmentModeHTML()+'<div class="set-title">界面模式</div><div class="set-opts"><label class="set-opt"><input type="checkbox" data-toggle="winmode"'+winChk+'>悬浮窗模式（关闭则显示在AI回复下方，刷新后生效）</label>'+inlineOpt+'</div><div class="set-title">精灵图源</div><div class="set-opts"><label class="set-opt"><input type="radio" name="pk-source" value="pokeos"'+(pkmSource==='pokeos'?' checked':'')+' data-source="pokeos">PokeOS</label><label class="set-opt"><input type="radio" name="pk-source" value="showdown"'+(pkmSource==='showdown'?' checked':'')+' data-source="showdown">Showdown</label></div><div class="dim">界面使用黑白2版固定配色。</div><div class="set-title">图标</div><div class="set-opts"><button class="act-btn" data-isz-open>🎨 自定义图标大小</button>'+fabOpt+'</div><div class="set-title">清理缓存</div><div class="set-opts">'+radios+'</div><button class="act-btn" data-clear-start>清理所选缓存</button><div class="dim" style="font-size:.72rem;margin-top:8px">需连续确认 3 次；清理后缓存重新联网获取，图鉴进度只保留队伍和盒子里的</div><div class="set-title">运行诊断</div><div class="set-opts">'+diagHTML()+'</div><div class="set-title">版本</div><div class="dim">黑白2独立版 v0.3.10 · 通过重新导入交付文件更新</div><div class="set-title">开发者选项</div><div class="set-opts"><div style="display:flex;gap:6px;align-items:center"><input type="password" id="dev-pwd" placeholder="输入开发者密码" style="flex:1;min-width:0;padding:6px 10px;font-family:inherit;font-size:.85rem;background:rgba(43,74,111,.5);border:1px solid var(--frame);border-radius:4px;color:var(--text);outline:none"><button class="btn-small" data-dev-unlock>解锁</button></div><div id="dev-panel">'+devPanelHTML()+'</div></div><details class="src-fold"><summary>资料来源</summary><div class="dim" style="font-size:.72rem;line-height:1.9;word-break:break-all;overflow-wrap:anywhere">图鉴、道具、招式、特性、种族值等文字数据及道具、精灵球图标图片：神奇宝贝百科（52poke）：<br>　　https://wiki.52poke.com<br>技能机（TM/TR/HM）图标：PokéSprite：<br>　　https://github.com/msikma/pokesprite<br>精灵图：<br>· Pokémon Showdown（像素小动图）：<br>　　https://play.pokemonshowdown.com<br>· PokeOS（高清HOME动图）：<br>　　https://www.pokeos.com/</div></details>');
}

























function recordOwnedOnly(){
  var s={},sf={},o=ownedSpecies(),of=ownedFull(),k;
  for(k in o){s[k]=1;}
  for(k in of){sf[k]=1;}
  try{localStorage.setItem(seenKey(),JSON.stringify(s));}catch(e){}
  try{localStorage.setItem(seenFullKey(),JSON.stringify(sf));}catch(e){}
}
function doClear(target){
  try{
    if(target==='seen'){recordOwnedOnly();setDevUnlock(false);var dp=document.querySelector('#dev-panel');if(dp){dp.innerHTML=devPanelHTML();bindDevPanel();}return;}
    if(target==='sprite'){
      pkmSpriteCache={};pkmIconCache={};pkmSlugCache={};pkmDexCache={};dexThumbCache={};hudCacheDeletePrefixes(['pk_sprite_','pk_icon_','pk_slug_','pk_ndex_','pk_dexthumb_','pk_ps_','pk_psf_']);
      var dels=[];for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(k&&(/^(?:pk_sprite_|pk_icon_|pk_slug_|pk_ndex_|pk_dexthumb_|pk_ps_|pk_psf_)/).test(k))dels.push(k);}dels.forEach(function(k){try{localStorage.removeItem(k);}catch(e){}});return;
    }
    if(target==='item'){
      itemListCache=null;itemSpriteCache={};itemCache={};hudCacheDeletePrefixes(['pk_item_','pk_itemlist','pk_itemimg_','pk_gh_item']);
      var deli=[];for(var i2=0;i2<localStorage.length;i2++){var k2=localStorage.key(i2);if(k2&&(k2.indexOf('pk_item_')===0||k2==='pk_itemlist'||k2.indexOf('pk_itemimg_')===0||k2.indexOf('pk_gh_item')===0))deli.push(k2);}deli.forEach(function(k){try{localStorage.removeItem(k);}catch(e){}});return;
    }
    var map={mv:'pk_mv_',pm:'pk_pm_',ab:'pk_ab_',dex:'pk_dexlist',fid:'pk_fid_'};
    var pre=target==='all'?['pk_mv_','pk_pm_','pk_ab_','pk_dexlist','pk_fid_','pk_item_','pk_itemlist','pk_itemimg_','pk_gh_','pk_sprite_','pk_icon_','pk_slug_','pk_ndex_','pk_dexthumb_','pk_ps_','pk_psf_','pk_abilist','nbtype_']:[map[target]];
    hudCacheDeletePrefixes(pre.filter(Boolean));
    var del=[];
    for(var i=0;i<localStorage.length;i++){
      var k=localStorage.key(i);
      if(!k)continue;
      for(var j=0;j<pre.length;j++){if(k.indexOf(pre[j])===0){del.push(k);break;}}
    }
    del.forEach(function(k){try{localStorage.removeItem(k);}catch(e){}});
    if(target==='all'||target==='mv')moveCache={};
    if(target==='all'||target==='pm')pkmCache={};
    if(target==='all'||target==='ab')abiCache={};
    if(target==='all'||target==='dex')dexCache=null;
    if(target==='all'){itemListCache=null;itemSpriteCache={};itemCache={};pkmSpriteCache={};pkmIconCache={};pkmSlugCache={};pkmDexCache={};nearbyTypeCache={};nearbyTypePending={};}
  }catch(e){}
}
function confirmClearModal(){
  var names={mv:'招式',pm:'宝可梦预览',sprite:'队伍精灵图',ab:'特性',dex:'图鉴列表',fid:'形态ID',item:'道具',seen:'图鉴收集进度',all:'全部'};
  clearStep++;
  if(clearStep>=3){
    doClear(clearTarget);
    overlay.innerHTML='<div class="modal"><div class="modal-head"><div class="modal-name">已清理</div><button class="close" data-close>✕</button></div><div class="modal-body"><div class="row"><span class="v">「'+(names[clearTarget]||'')+'」缓存已清理完成。</span></div></div></div>';
    clearStep=0;
    overlay.classList.add('open');
    return;
  }
  overlay.innerHTML='<div class="modal"><div class="modal-head"><div class="modal-name">确认清理（'+clearStep+'/3）</div><button class="close" data-close>✕</button></div><div class="modal-body"><div class="row"><span class="v">确认清理「'+(names[clearTarget]||'')+'」缓存？</span></div><div class="action-btns"><button class="act-btn" data-clear-confirm>✔ 确认（第 '+clearStep+' 次）</button><button class="act-btn" data-close>取消</button></div></div></div>';
  overlay.classList.add('open');
}
function pageContent(key){switch(key){case 'bag':return bagHTML();case 'box':return boxHTML();case 'rel':return relHTML();case 'rivals':return rivalsHTML();case 'breeding':return breedingHTML();case 'pokedex':return pokedexHTML();case 'badge':return badgePageHTML();case 'diy':return diyHTML();case 'map':return mapHTML();case 'settings':return settingsHTML();case 'typechart':return typeChartHTML();default:return '<div class="empty">暂无</div>';}}
function pageHTML(title,content){var mapCtl=(title==='地图')?'<button type="button" class="map-pad-toggle'+(mapManualControlsOpen?' on':'')+'" data-map-pad-toggle title="显示/隐藏地图方向与缩放按钮" aria-label="显示或隐藏地图方向与缩放按钮">🎮</button>':'';return '<div class="page"><div class="page-head"><strong class="bw2-page-title">'+esc(title)+'</strong>'+mapCtl+'<button class="page-close" data-page-close>✕</button></div><div class="page-body">'+content+'</div></div>';}

var overlay,subOverlay,pageOverlay,cards,pageOverlayHost=null;

var hudGestureShieldUntil=0,hudGestureShieldOrigin=null,hudModalIsolationObserver=null;
function hudArmGestureShield(origin,ms){
  hudGestureShieldOrigin=origin||null;
  hudGestureShieldUntil=Date.now()+Math.max(250,Number(ms)||700);
}
function hudDisarmGestureShield(){
  hudGestureShieldOrigin=null;
  hudGestureShieldUntil=0;
}
function hudGhostClickGuard(e){
  if(Date.now()>hudGestureShieldUntil)return;
  var t=e&&e.target;
  try{
    if(t&&t.nodeType!==1)t=t.parentElement;
    if(t&&t.closest&&t.closest('#pkm-hud-win,#pkm-hud-inline,#pkm-hud-btn,#pkm-hud-mapfab,#pkm-hud-mask,#pkm-hud-close,.pkm-hud-overlay,.pkm-hud-page-overlay'))return;
  }catch(_e){}
  var o=hudGestureShieldOrigin;
  try{if(o&&o.isConnected&&t&&(o===t||o.contains(t)))return;}catch(_e2){}
  try{if(e.cancelable)e.preventDefault();}catch(_e3){}
  try{e.stopPropagation();}catch(_e4){}
  try{e.stopImmediatePropagation();}catch(_e5){}
}
hudScope.listen(document,'click',hudGhostClickGuard,true);
function hudSetInert(el,on){
  if(!el)return;
  try{el.inert=!!on;}catch(_e){}
  if(on)el.setAttribute('data-hud-modal-inert','1');else el.removeAttribute('data-hud-modal-inert');
}
function bw2NativeModalIsolation(){
  var host=pageOverlayHost;
  var pageOpen=!!(pageOverlay&&pageOverlay.classList.contains('open'));
  var overlayOpen=!!(overlay&&overlay.classList.contains('open'));
  var subOpen=!!(subOverlay&&subOverlay.classList.contains('open'));
  var modalOpen=overlayOpen||subOpen;
  var mapBody=!!(pageOpen&&pageOverlay&&pageOverlay.classList.contains('map-focus')&&pageOverlay.parentElement===document.body);
  if(host){
    try{host.classList.toggle('modal-child-open',modalOpen);host.classList.toggle('page-child-open',pageOpen&&!modalOpen&&pageOverlay&&pageOverlay.parentElement===host);}catch(_e){}
    try{
      Array.prototype.forEach.call(host.children,function(ch){
        var keep;
        if(subOpen){keep=(ch===overlay||ch===subOverlay);}
        else if(overlayOpen){keep=(ch===overlay);}
        else if(pageOpen&&pageOverlay&&pageOverlay.parentElement===host){keep=(ch===pageOverlay);}
        else{keep=true;}
        hudSetInert(ch,!keep);
      });
    }catch(_e2){}
    
    try{hudSetInert(host,mapBody);}catch(_e3){}
  }
  try{
    var hw=document.getElementById('pkm-hud-win');
    if(hw&&(!host||!hw.contains(host)))hudSetInert(hw,mapBody);
  }catch(_e4){}
}
function hudSyncModalIsolation(){return bw2PageIsolation();}
function hudBindModalIsolation(){
  try{if(hudModalIsolationObserver)hudModalIsolationObserver.disconnect();}catch(_e){}
  try{
    hudModalIsolationObserver=hudScope.observe(new MutationObserver(function(){hudSyncModalIsolation();}));
    if(overlay)hudModalIsolationObserver.observe(overlay,{attributes:true,attributeFilter:['class']});
    if(subOverlay)hudModalIsolationObserver.observe(subOverlay,{attributes:true,attributeFilter:['class']});
    if(pageOverlay)hudModalIsolationObserver.observe(pageOverlay,{attributes:true,attributeFilter:['class']});
  }catch(_e2){hudModalIsolationObserver=null;}
  hudSyncModalIsolation();
}
var currentPageKey='';
var quickMapFromFab=false;
var hudActionCard=null;
var hudConfirmCb=null;
var currentDetailCard=null;

var CMDS=[['🏋️ 特训','洛托姆，帮我找个地方进行特训。','可指定方向：学会某个招式、赚钱、针对某项六维的专项特训'],['💨 快躲开','快躲开！（羁绊）使用XX攻击！','敌方招式必MISS，速度+1、闪避+1'],['⚡ 趁现在','趁现在！（羁绊）使用XX！','必先手、必暴击'],['🛡️ 坚持住','坚持住！（羁绊）使用XX！','清除异常状态，防御+1、特防+1，恢复30%最大HP'],['🔥 站起来','站起来！（羁绊）使用XX！','倒下的宝可梦复苏至HP1，攻击+1、特攻+1，本回合锁血'],['✨ 羁绊Mega','回应我的呼唤吧，Mega进化！（羁绊Mega，无需道具）然后使用XX！','搭档且亲密度≥200时，无需钥石与Mega石即可超进化'],['⚔️ 招式对抗','用XX对抗敌人的招式！（招式对抗）','无视先后手，两招正面相撞。不计算克制的攻防伤害相互抵消，僵持(差≤20%)双方受伤（差值+5），差>20%高方命中(用差值伤害)']];var cmdOpen=false;var pkHudIntentFocus=false;function fillInput(text){try{var w=WIN;var ta=w.document.querySelector('#send_textarea');if(ta){var cur=String(ta.value||'').replace(/\s+$/,'');var val=cur?cur+'\n'+text:text;ta.value=val;ta.dispatchEvent(new Event('input',{bubbles:true}));pkHudIntentFocus=true;ta.focus();hudScope.setTimeout(function(){pkHudIntentFocus=false;},80);try{var i=val.indexOf('XX',cur.length);if(i<0){ta.setSelectionRange(val.length,val.length);}else{ta.setSelectionRange(i,i+2);}}catch(e2){}return true;}}catch(e){}return false;}var hudPendingActions=[];
var hudActionInjected=null;
var hudCleanupBound=false;
var hudCmdOpen=false;
var hudCmdSeq=0;

function hudCmdBarHTML(){
  if(!hudPendingActions.length) return '';
  var head='<div class="info-frame plain-frame" style="margin-bottom:10px">'+
    '<div class="info-inner"><div class="info-title" style="cursor:pointer" data-hud-cmd-toggle>'+
    '下回合执行命令（'+hudPendingActions.length+'）'+
    '<span style="float:right;font-size:.8rem;color:var(--dim)">'+(hudCmdOpen?'收起 ▲':'展开 ▼')+'</span>'+
    '</div>';
  var list='';
  if(hudCmdOpen){
    list='<div id="hud-cmd-list">';
    for(var i=0;i<hudPendingActions.length;i++){
      var a=hudPendingActions[i];
      list+='<div class="nearby-item" style="cursor:default">'+
        '<div class="nearby-info"><div class="nearby-name" style="font-size:.8rem">'+esc(a.display || a.text)+'</div></div>'+
        '<button class="btn-small" data-hud-cmd-remove="'+a.id+'" style="color:#fff;background:rgba(180,60,60,.7);border-color:#f05060">✕</button>'+
      '</div>';
    }
    list+='</div>';
  }
  return head+list+'</div></div>';
}

function hudClearInjected(){
  try{
    var w=WIN;
    var ST=w&&w.SillyTavern;
    var ctx=ST&&ST.getContext?ST.getContext():null;
    if(ctx&&typeof ctx.setExtensionPrompt==='function'&&hudActionInjected){
      ctx.setExtensionPrompt(hudActionInjected,'');
    }
  }catch(e){}
  hudActionInjected=null;
}

function hudClearAll(){
  hudClearInjected();
  hudPendingActions=[];
  hudCleanupBound=false;
  hudCmdOpen=false;
}

var hudCleanupUnsub=null;
function hudBindCleanup(ctx){
  if(hudCleanupBound)return;
  hudCleanupBound=true;
  try{
    var ev=ctx.eventTypes&&(ctx.eventTypes.MESSAGE_RECEIVED||ctx.eventTypes.MESSAGE_SENT||'message_received');
    if(ctx.eventSource&&ev){
      var fired=false,done=function(){
        if(fired)return;fired=true;
        try{if(hudCleanupUnsub)hudCleanupUnsub();}catch(e){}hudCleanupUnsub=null;
        hudClearAll();render();resizeFrame();
      };
      if(typeof ctx.eventSource.once==='function'){
        ctx.eventSource.once(ev,done);
        hudCleanupUnsub=function(){try{if(typeof ctx.eventSource.off==='function')ctx.eventSource.off(ev,done);else if(typeof ctx.eventSource.removeListener==='function')ctx.eventSource.removeListener(ev,done);}catch(e){}};
      }else if(typeof ctx.eventSource.on==='function'){
        ctx.eventSource.on(ev,done);
        hudCleanupUnsub=function(){try{if(typeof ctx.eventSource.off==='function')ctx.eventSource.off(ev,done);else if(typeof ctx.eventSource.removeListener==='function')ctx.eventSource.removeListener(ev,done);}catch(e){}};
      }
    }
  }catch(e){hudDiagError('HUD cleanup bind',e);}
  hudScope.setTimeout(function(){try{if(hudCleanupUnsub)hudCleanupUnsub();}catch(e){}hudCleanupUnsub=null;hudClearAll();render();resizeFrame();},120000);
}

function hudRefreshInjection(){
  hudClearInjected();
  if(!hudPendingActions.length){ hudCleanupBound=false; return true; }

  var parts=['【HUD操作指令 · 请依次执行以下操作】'];
  for(var i=0;i<hudPendingActions.length;i++){
    parts.push((i+1)+'. '+hudPendingActions[i].text);
  }
  parts.push('全部执行完成后，请更新状态栏/MVU。');
  var text=parts.join('\n');

  try{
    var w=WIN;
    var ST=w&&w.SillyTavern;
    var ctx=ST&&ST.getContext?ST.getContext():null;
    if(!ctx||typeof ctx.setExtensionPrompt!=='function') return false;

    var id='pkmn_hud_action';
    hudActionInjected=id;

    try{ ctx.setExtensionPrompt(id, text, 1, 0, false, 1); }
    catch(e1){
      try{ ctx.setExtensionPrompt(id, text, 1, 0, false); }
      catch(e2){ return false; }
    }

    hudBindCleanup(ctx);
    return true;
  }catch(e){}
  return false;
}

function hudSend(text, undo, display){
  hudPendingActions.push({id:'hudc'+(++hudCmdSeq)+'_'+Date.now(), text:text, display:display||text, undo:undo||function(){}});
  
  try{pkmHudPersistStatData();}catch(e){}
  if(!hudRefreshInjection()){
    hudMsg('当前环境无法静默注入，操作仅更新本地显示');
  }
}

function hudRemoveAction(id){
  for(var i=0;i<hudPendingActions.length;i++){
    if(hudPendingActions[i].id===id){
      var a=hudPendingActions.splice(i,1)[0];
      try{ a.undo(); }catch(e){}
      break;
    }
  }
  try{pkmHudPersistStatData();}catch(e){}
  hudRefreshInjection();
  render(); resizeFrame();
}



function bindPageInteractions(){
  pageOverlay.querySelectorAll('.box-cell[data-slot],.bw2-box-card[data-slot]').forEach(function(el){el.addEventListener('click',function(){var boxNum=el.getAttribute('data-box');var slot=el.getAttribute('data-slot');var p=stat_data.盒子[boxNum]&&stat_data.盒子[boxNum][slot];if(p){preloadMoves(p.技能);currentDetailCard=cardFromPkm(p,slot,'box',boxNum);clearBack();overlay.innerHTML=detailHTML(currentDetailCard);overlay.classList.add('open');pkImgFix(overlay);resolvePkmImgs(overlay);resolveMoveTypes(overlay);resolveItemImgs(overlay);}});});
pageOverlay.querySelectorAll('.nearby-cell[data-nearby]').forEach(function(el){el.addEventListener('click',function(){var key=el.getAttribute('data-nearby');var p=stat_data.附近宝可梦&&stat_data.附近宝可梦[key];if(p){clearBack();overlay.innerHTML=actionHTML(p,key);overlay.classList.add('open');pkImgFix(overlay);resolvePkmImgs(overlay);resolveNearbyTypes(overlay);}});});
  pageOverlay.querySelectorAll('.bag-tab[data-bag]').forEach(function(btn){btn.addEventListener('click',function(){activeBag=btn.getAttribute('data-bag');pageOverlay.querySelectorAll('.bag-tab').forEach(function(b){b.classList.toggle('active',b===btn);});var list=pageOverlay.querySelector('#bag-list');if(list){list.innerHTML=bagItemsHTML();resolveItemImgs(pageOverlay);}});});
  pageOverlay.querySelectorAll('.badge-tab[data-bregion]').forEach(function(b){b.addEventListener('click',function(){badgeSel=b.getAttribute('data-bregion');try{localStorage.setItem('pk_badge_sel',JSON.stringify({region:badgeSel}));}catch(e){}var pg=pageOverlay.querySelector('.page');var oldTabs=pageOverlay.querySelector('.badge-tabs');var pageTop=pg?pg.scrollTop:0;var tabsLeft=oldTabs?oldTabs.scrollLeft:0;pageOverlay.querySelector('.page-body').innerHTML=badgePageHTML();bindPageInteractions();if(pg){pg.scrollTop=pageTop;}var newTabs=pageOverlay.querySelector('.badge-tabs');if(newTabs){newTabs.scrollLeft=tabsLeft;}});});
  pageOverlay.querySelectorAll('[data-bag-discard]').forEach(function(btn){btn.addEventListener('click',function(e){e.stopPropagation();discardBagItemAsk(btn.getAttribute('data-bag-discard'));});});
var bn=pageOverlay.querySelector('[data-box-new]');
if(bn){bn.addEventListener('click',function(e){e.stopPropagation();openNewBoxModal();});}
var bd=pageOverlay.querySelector('[data-box-del]');
if(bd){bd.addEventListener('click',function(e){e.stopPropagation();openDeleteBoxConfirm();});}
var bs=pageOverlay.querySelector('#box-select');if(bs){bs.addEventListener('change',function(){activeBox=bs.value;pageOverlay.querySelector('.page-body').innerHTML=boxHTML();bindPageInteractions();resolvePkmImgs(pageOverlay);});}
  var si=pageOverlay.querySelector('#dex-search-input');
if(si){si.addEventListener('input',dexSearch);}
pageOverlay.querySelectorAll('[data-dexregion]').forEach(function(b){b.addEventListener('click',function(){dexRegion=b.getAttribute('data-dexregion');pageOverlay.querySelectorAll('[data-dexregion]').forEach(function(x){x.classList.toggle('active',x===b);});renderDexRegion();});});
pageOverlay.querySelectorAll('[data-dexfilter]').forEach(function(b){b.addEventListener('click',function(){dexFilter=b.getAttribute('data-dexfilter');pageOverlay.querySelectorAll('[data-dexfilter]').forEach(function(x){x.classList.toggle('active',x===b);});dexApplyFilter();});});
var dt=pageOverlay.querySelector('[data-dex-thumb]');
if(dt){dt.addEventListener('click',function(e){e.stopPropagation();dexThumbsToggle();});}
  pageOverlay.querySelectorAll('input[data-clear]').forEach(function(r){r.addEventListener('change',function(){if(r.checked)clearTarget=r.getAttribute('data-clear');});});
var ic=pageOverlay.querySelector('input[data-toggle="itemclick"]');
if(ic){ic.addEventListener('change',function(){itemClickEnabled=ic.checked;try{localStorage.setItem('pk_itemclick',itemClickEnabled?'1':'0');}catch(e){}});}
var wm=pageOverlay.querySelector('input[data-toggle="winmode"]');
if(wm){wm.addEventListener('change',function(){winMode=wm.checked?'1':'0';try{localStorage.setItem('pk_winmode',winMode);}catch(e){}});}
var et=pageOverlay.querySelector('[data-entertain-open]');
if(et){et.addEventListener('click',function(e){e.stopPropagation();openEntertainmentMode();});}
  var cs=pageOverlay.querySelector('[data-clear-start]');
if(cs){cs.addEventListener('click',function(e){e.stopPropagation();clearStep=0;confirmClearModal();});}
pageOverlay.querySelectorAll('[data-diy-tab]').forEach(function(b){b.addEventListener('click',function(){diyType=b.getAttribute('data-diy-tab');pageOverlay.querySelectorAll('[data-diy-tab]').forEach(function(x){x.classList.toggle('active',x===b);});var f=pageOverlay.querySelector('#diy-form');if(f)f.innerHTML=diyFormHTML(diyType);var l=pageOverlay.querySelector('#diy-list');if(l)l.innerHTML=diyListHTML(diyType);});});
var df=pageOverlay.querySelector('#diy-form');if(df){df.addEventListener('click',function(e){if(e.target.closest('[data-diy-add]')){diyAdd(diyType);}else if(e.target.closest('[data-diy-clear]')){diyClearStart();}else if(e.target.closest('[data-diy-add-type]')){diyAddType();}else if(e.target.closest('[data-diy-evo-add]')){diyEvoAddPage();}else if(e.target.closest('[data-diy-evo-add-type]')){diyEvoAddType(e.target.closest('[data-diy-evo-add-type]').getAttribute('data-diy-evo-add-type'));}else if(e.target.closest('[data-diy-evo-addbranch]')){diyEvoAddBranch(e.target.closest('[data-diy-evo-addbranch]').getAttribute('data-diy-evo-addbranch'));}else if(e.target.closest('[data-diy-evo-delbranch]')){var db=e.target.closest('[data-diy-evo-delbranch]').getAttribute('data-diy-evo-delbranch').split('|');diyEvoDelBranch(db[0],db[1]);}else if(e.target.closest('[data-diy-evo-adddesc]')){diyEvoToggleDesc(e.target.closest('[data-diy-evo-adddesc]').getAttribute('data-diy-evo-adddesc'));}else if(e.target.closest('[data-diy-evo-upload]')){diyEvoUpload(e.target.closest('[data-diy-evo-upload]').getAttribute('data-diy-evo-upload'));}else if(e.target.closest('[data-diy-evo-vision]')){diyEvoVision(e.target.closest('[data-diy-evo-vision]').getAttribute('data-diy-evo-vision'));}else if(e.target.closest('[data-diy-move-add]')){diyMoveAdd();}else if(e.target.closest('[data-diy-move-del]')){diyMoveDel(e.target.closest('[data-diy-move-del]').getAttribute('data-diy-move-del'));}else if(e.target.closest('[data-diy-item-upload]')){diyItemUpload();}});df.addEventListener('input',function(e){if(e.target&&e.target.id==='diy-ability-search'){diyFilterAbility();}if(e.target&&e.target.id&&e.target.id.indexOf('evo-abi-search-')===0){diyEvoFilterAbility(parseInt(e.target.id.replace('evo-abi-search-',''),10));}if(e.target&&e.target.id&&e.target.id.indexOf('evo-name-')===0){diyEvoSyncNext();diyMoveFormRefresh();}if(e.target&&e.target.id&&e.target.id.indexOf('evo-desc-')===0){diyEvoDescAutosize(parseInt(e.target.id.replace('evo-desc-',''),10));}});df.addEventListener('change',function(e){if(e.target&&e.target.id==='diy-item-img-file'){diyItemFileChange(e.target);}if(e.target&&e.target.id&&e.target.id.indexOf('evo-img-file-')===0){diyEvoFileChange(e.target);}if(e.target&&e.target.id==='diy-ability-cat'){diyAbilityCat=e.target.value;var w=document.getElementById('diy-ability-wrap');if(w)w.innerHTML=diyAbilityWrapHTML();if(diyAbilityCat==='orig'){diyLoadAbiOptions();}}if(e.target&&e.target.id&&e.target.id.indexOf('evo-abi-cat-')===0){var p=parseInt(e.target.id.replace('evo-abi-cat-',''),10);diyEvoAbiCats[p]=e.target.value;var w2=document.getElementById('evo-abi-wrap-'+p);if(w2)w2.innerHTML=diyEvoAbiWrapHTML(p);if(diyEvoAbiCats[p]==='orig'){diyEvoLoadAbiOptions(p);}}});diyLoadAbiOptions();}
var dl=pageOverlay.querySelector('#diy-list');if(dl){dl.addEventListener('click',function(e){var del=e.target.closest('[data-diy-del]');if(del){diyDelStart(diyType,del.getAttribute('data-diy-del'));return;}var sh=e.target.closest('[data-diy-share]');if(sh){diyShare(diyType,sh.getAttribute('data-diy-share'));return;}var vw=e.target.closest('[data-diy-view]');if(vw){diyView(diyType,vw.getAttribute('data-diy-view'));}});}
var dib=pageOverlay.querySelector('[data-diy-import]');if(dib){dib.addEventListener('click',function(e){e.stopPropagation();diyImport();});}
var dii=pageOverlay.querySelector('#diy-import-code');if(dii){dii.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();diyImport();}});}
var bms=pageOverlay.querySelector('#diy-lore-mode-select');
if(bms){bms.addEventListener('click',function(e){e.stopPropagation();diySetLoreMode('select');});}
var bmi=pageOverlay.querySelector('#diy-lore-mode-input');
if(bmi){bmi.addEventListener('click',function(e){e.stopPropagation();diySetLoreMode('input');});}
var ls=pageOverlay.querySelector('#diy-lorebook');
if(ls){ls.addEventListener('change',function(){diyLorebook=ls.value;try{localStorage.setItem('pk_diy_lorebook2',diyLorebook);}catch(e){}});}
var lsc=pageOverlay.querySelector('#diy-lorebook-custom');
if(lsc){lsc.addEventListener('input',function(){diyLorebook=lsc.value.trim();try{localStorage.setItem('pk_diy_lorebook2',diyLorebook);}catch(e){}});}
var vst=pageOverlay.querySelector('[data-vision-settings]');
if(vst){vst.addEventListener('click',function(e){e.stopPropagation();openVisionSettings();});}
diyFillLorebookOptions();
diyEvoSyncNext();
diyEvoLoadAbi();
pageOverlay.querySelectorAll('[data-map]').forEach(function(b){b.addEventListener('click',function(){activeMap=b.getAttribute('data-map');alolaIsland=-1;pageOverlay.querySelector('.page-body').innerHTML=mapHTML();bindPageInteractions();});});
var dr=pageOverlay.querySelector('[data-diag-refresh]');
if(dr){dr.addEventListener('click',function(e){e.stopPropagation();openPage('settings');});}
var dcp=pageOverlay.querySelector('[data-diag-copy]');
if(dcp){dcp.addEventListener('click',function(e){e.stopPropagation();var txt='PKM HUD Diagnostics v'+PK_VER+'\n'+JSON.stringify(hudDiagSnapshot(),null,2);diyCopyText(txt,function(ok){if(ok)dcp.textContent='✔ 已复制';});});}
var dcl=pageOverlay.querySelector('[data-diag-clear]');
if(dcl){dcl.addEventListener('click',function(e){e.stopPropagation();hudDiag.errors.length=0;hudDiag.events.length=0;hudDiag.counters.errors=0;openPage('settings');});}
var cu=pageOverlay.querySelector('[data-cache-usage]');
if(cu){cu.addEventListener('click',function(e){e.stopPropagation();openCacheUsage();});}
var mvw=pageOverlay.querySelector('[data-mapwrap]');
if(mvw){bindMapViewer(mvw);}
var mapPadToggle=pageOverlay.querySelector('[data-map-pad-toggle]');
if(mapPadToggle&&!mapPadToggle._pkmMapToggleBound){
  mapPadToggle._pkmMapToggleBound=true;
  mapPadToggle.addEventListener('click',function(e){
    e.preventDefault();e.stopPropagation();
    mapManualControlsOpen=!mapManualControlsOpen;
    mapPadToggle.classList.toggle('on',mapManualControlsOpen);
    var frame=pageOverlay.querySelector('[data-map-viewer-frame]');
    var manual=pageOverlay.querySelector('[data-map-manual-controls]');
    var wrapNow=pageOverlay.querySelector('[data-mapwrap]');
    if(frame)frame.classList.toggle('manual-open',mapManualControlsOpen);
    if(manual)manual.setAttribute('aria-hidden',mapManualControlsOpen?'false':'true');
    if(wrapNow&&wrapNow._mapApi&&typeof wrapNow._mapApi.refit==='function')hudScope.setTimeout(function(){try{wrapNow._mapApi.refit(false);}catch(err){}},40);
  });
}
if(mvw&&mvw._mapApi){
  var mapFrame=mvw.closest('[data-map-viewer-frame]')||pageOverlay;
  mapFrame.querySelectorAll('[data-map-pan]').forEach(function(btn){btn.addEventListener('click',function(e){
    e.preventDefault();e.stopPropagation();
    var dir=btn.getAttribute('data-map-pan'),sx=Math.max(28,Math.min(84,Math.round((mvw.clientWidth||320)*0.10))),sy=Math.max(24,Math.min(72,Math.round((mvw.clientHeight||240)*0.10)));
    
    if(dir==='up')mvw._mapApi.panBy(0,sy);else if(dir==='down')mvw._mapApi.panBy(0,-sy);else if(dir==='left')mvw._mapApi.panBy(sx,0);else if(dir==='right')mvw._mapApi.panBy(-sx,0);
  });});
  mapFrame.querySelectorAll('[data-map-zoom]').forEach(function(btn){btn.addEventListener('click',function(e){
    e.preventDefault();e.stopPropagation();
    mvw._mapApi.zoomBy(btn.getAttribute('data-map-zoom')==='in'?1.22:1/1.22);
  });});
}
var eye=pageOverlay.querySelector('[data-map-eye]');
if(eye){
  var wrap=pageOverlay.querySelector('[data-mapwrap]');
  var fb=pageOverlay.querySelector('[data-map-filter]');
  eye.addEventListener('click',function(e){
    e.preventDefault();e.stopPropagation();
    mapSpotOn=!mapSpotOn;
    if(wrap)wrap.classList.toggle('show-all',mapSpotOn);
    eye.classList.toggle('on',mapSpotOn);
    if(fb)fb.classList.toggle('show',mapSpotOn);
  });
}
var szb=pageOverlay.querySelector('[data-map-size-btn]');
var szp=pageOverlay.querySelector('[data-map-size-pop]');
if(szb&&szp){
  szb.addEventListener('click',function(e){
    e.preventDefault();e.stopPropagation();
    szp.classList.toggle('open');
  });
  var szd=pageOverlay.querySelector('[data-map-size-done]');
  if(szd){szd.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();szp.classList.remove('open');});}
}
pageOverlay.querySelectorAll('[data-mcat]').forEach(function(b){
  b.addEventListener('click',function(e){
    e.preventDefault();e.stopPropagation();
    var cat=b.getAttribute('data-mcat');
    mapFilter[cat]=!mapFilter[cat];
    b.classList.toggle('active',mapFilter[cat]);
    var wrap=pageOverlay.querySelector('[data-mapwrap]');
    if(wrap)wrap.classList.toggle('show-'+cat,mapFilter[cat]);
  });
});
var msz=pageOverlay.querySelector('[data-map-size]');
if(msz){
  msz.addEventListener('input',function(){
    mapLabelSize=parseInt(msz.value,10)||10;
    var v=pageOverlay.querySelector('[data-map-size-val]');
    if(v)v.textContent=mapLabelSize+'px';
    var sb=pageOverlay.querySelector('[data-map-size-btn]');
    if(sb)sb.textContent='🔤 字号 '+mapLabelSize;
    try{localStorage.setItem('pk_maplabelsize',String(mapLabelSize));}catch(e){}
    var wrap=pageOverlay.querySelector('[data-mapwrap]');
    if(wrap)updateMapLabels(wrap);
  });
}
pageOverlay.querySelectorAll('.map-spot-label').forEach(function(lb){
  lb.addEventListener('click',function(e){
    e.stopPropagation();
    pageOverlay.querySelectorAll('.map-spot-label').forEach(function(x){x.classList.remove('top');});
    lb.classList.add('top');
  });
});
pageOverlay.querySelectorAll('.map-island-label').forEach(function(lb){
  lb.addEventListener('pointerdown',function(e){e.stopPropagation();});
  lb.addEventListener('click',function(e){
    e.stopPropagation();
    var i=parseInt(lb.getAttribute('data-island'),10);
    var m=MAPS.filter(function(x){return x.name===activeMap;})[0];
    if(m&&m.islands&&m.islands[i]&&m.islands[i].img){
      alolaIsland=i;
      var pb=pageOverlay.querySelector('.page-body');
      if(pb){pb.innerHTML=mapHTML();bindPageInteractions();}
    }
  });
});
var backMap=pageOverlay.querySelector('[data-map-back]');
if(backMap){backMap.addEventListener('click',function(e){e.stopPropagation();alolaIsland=-1;var pb=pageOverlay.querySelector('.page-body');if(pb){pb.innerHTML=mapHTML();bindPageInteractions();}});}
var tc1=pageOverlay.querySelector('#tc-def-1');
if(tc1){tc1.addEventListener('change',typeChartCalc);}
var tc2=pageOverlay.querySelector('#tc-def-2');
if(tc2){tc2.addEventListener('change',typeChartCalc);}
typeChartCalc();
var iso=pageOverlay.querySelector('[data-isz-open]');
if(iso){iso.addEventListener('click',function(e){e.stopPropagation();openIconSize();});}
var fbo=pageOverlay.querySelector('[data-fab-open]');
if(fbo){fbo.addEventListener('click',function(e){e.stopPropagation();openFabSize();});}
var iho=pageOverlay.querySelector('[data-inline-h-open]');
if(iho){iho.addEventListener('click',function(e){e.stopPropagation();openInlineH();});}
pageOverlay.querySelectorAll('input[data-source]').forEach(function(r){r.addEventListener('change',function(){if(r.checked){pkmSource=r.getAttribute('data-source');try{localStorage.setItem('pk_source',pkmSource);}catch(e){}pokeosPxClearSpriteCache();render();openPage('settings');}});});
var fio=pageOverlay.querySelector('[data-fab-img-open]');
if(fio){fio.addEventListener('click',function(e){e.stopPropagation();openFabImg();});}








var db=pageOverlay.querySelector('[data-dev-unlock]');
if(db){db.addEventListener('click',function(e){
  e.stopPropagation();
  var pwd=pageOverlay.querySelector('#dev-pwd');
  var panel=pageOverlay.querySelector('#dev-panel');
  var v=pwd?pwd.value.trim():'';
  if(v==='3525442929'){
    setDevPanelOn(true);
    if(panel){panel.innerHTML=devPanelHTML();bindDevPanel();}
    if(pwd)pwd.value='';
  }else{
    if(panel){panel.innerHTML=devPanelHTML('❌ 密码错误');}
    if(pwd){pwd.value='';pwd.focus();}
  }
});}
bindDevPanel();
}


function badgeClick(e){e.stopPropagation();var rs=parseBadges();if(rs.length>1){var cur=pickRegion(rs),i=0,k;for(k=0;k<rs.length;k++){if(rs[k].region===cur)i=k;}try{localStorage.setItem('pk_badge_sel',JSON.stringify({region:rs[(i+1)%rs.length].region}));}catch(err){}var tf=document.querySelector('.bw2-profile');if(tf){var panel=tf.parentElement;tf.outerHTML=trainerHTML();bw2Hydrate(panel);bw2RememberHome(panel);bw2RequestLayout();}return;}openPage('badge');}

function pageOverlayPopout(on){return bw2PagePopout(on);}
function openPage(key){
  var m=MENU.find(function(x){return x.key===key;})||(key==='typechart'?{label:'克制表'}:null);if(!m)return;
  if(key==='map'){
    var _loc=(stat_data.环境&&stat_data.环境.当前地点)||'';
    var _reg=regionOfLocation(_loc);
    if(_reg&&MAPS.some(function(x){return x.name===_reg;}))activeMap=_reg;
    mapSpotOn=true;
    mapFilter={town:true,road:false,special:false};
    alolaIsland=-1;
  }
  bw2PreparePage(key);currentPageKey=key;
  pageOverlay.classList.toggle('map-focus',key==='map');
  pageOverlayPopout(key==='map'||key==='typechart');
  pageOverlay.style.paddingTop='';
  pageOverlay.innerHTML=pageHTML(m.label,pageContent(key));pageOverlay.classList.add('open');hudSyncModalIsolation();bindPageInteractions();pkImgFix(pageOverlay);resolvePkmImgs(pageOverlay);resolveItemImgs(pageOverlay);if(key==='map')hudSyncMapPopoutHeight();bw2SyncPageScreens(pageOverlayHost.parentElement);hudResolvePkidbImages(pageOverlay);
}

function hudMsg(msg){
  if(!overlay) return;
  overlay.innerHTML='<div class="modal"><div class="modal-head"><div class="modal-name">提示</div><button class="close" data-close>✕</button></div><div class="modal-body"><div class="row"><span class="v">'+esc(msg)+'</span></div><div class="action-btns"><button class="act-btn" data-close>知道了</button></div></div></div>';
  overlay.classList.add('open');
}
function hudConfirm(title,msg,cb){
  hudConfirmCb=cb;
  overlay.innerHTML='<div class="modal"><div class="modal-head"><div class="modal-name">'+esc(title)+'</div><button class="close" data-close>✕</button></div><div class="modal-body"><div class="row"><span class="v">'+esc(msg)+'</span></div><div class="action-btns"><button class="act-btn" data-hud-confirm>✔ 确认</button><button class="act-btn" data-close>取消</button></div></div></div>';
  overlay.classList.add('open');
}
function getCardPkm(c){
  if(!c) return null;
  if(c.where==='box' && c.boxName){
    var box=stat_data.盒子[c.boxName];
    return box ? (box[c.slot]||null) : null;
  }
  if(c.where==='team'){
    return stat_data.队伍[String(c.slot)] || null;
  }
  return null;
}
function boxDisp(b){
  var s=String(b||'');
  return (s.indexOf('盒子')===0 ? s : '盒子'+s);
}
function findBoxSlot(boxName){
  var b=stat_data.盒子[boxName]=stat_data.盒子[boxName]||{};
  var n=1;
  while(b[String(n)] && b[String(n)].名字 && b[String(n)].名字!=='空') n++;
  return String(n);
}
function getBagCount(name){
  var it=stat_data.背包[name];
  return it ? (parseInt(it.数量,10)||0) : 0;
}
function bagItemIconOf(name,fallbackEn){
  var it=(stat_data&&stat_data.背包)?stat_data.背包[name]:null;
  var s=(it&&it.图标)?String(it.图标).trim():'';
  if(!s&&fallbackEn)s=String(fallbackEn).trim();
  if(!s)s=itemIconName(name);
  return s;
}
function addBagItem(name,count,icon){
  count=count||1;
  var it=stat_data.背包[name];
  if(!it) stat_data.背包[name]={类型:'道具',数量:count,图标:bagItemIconOf(name,icon)};
  else{
    it.数量=(parseInt(it.数量,10)||0)+count;
    if(!it.图标&&icon){it.图标=String(icon).trim();}
  }
}
function removeBagItem(name,count){
  count=count||1;
  var it=stat_data.背包[name];
  if(!it) return;
  it.数量=(parseInt(it.数量,10)||0)-count;
  if(it.数量<=0) delete stat_data.背包[name];
}
function storePkm(c,boxName){
  var p=getCardPkm(c);
  if(!p || !p.名字 || p.名字==='空'){ hudMsg('没有可存入的精灵'); return; }
  if(c.where!=='team'){ hudMsg('只能从队伍存入盒子'); return; }
  if(!hudAssertPokemonMutable(p,'移动'))return;
  hudEnsurePokemonIdentity(p);
  var slot=findBoxSlot(boxName);
  var fromSlot=String(c.slot);
  stat_data.盒子[boxName][slot]=p;
  stat_data.队伍[fromSlot]={名字:'空'};
  hudSend('请执行【队伍→盒子】：把队伍中的《'+p.名字+'》存入《'+boxName+'》，并更新状态栏。', function(){
  stat_data.队伍[fromSlot]=p;
  delete stat_data.盒子[boxName][slot];
}, '把队伍中的'+p.名字+'存入'+boxDisp(boxName)+'。');
  hudRecordAssetMutation(p,{action:'move',method:'HUD 队伍→盒子',fromLocation:'队伍第'+fromSlot+'位',toLocation:boxDisp(boxName)+' 第'+slot+'格',location:boxDisp(boxName)+' 第'+slot+'格'});
  render(); resizeFrame();
  hudMsg('已把《'+p.名字+'》存入《'+boxName+'》');
}
function withdrawPkm(c,teamSlot){
  var p=getCardPkm(c);
  if(!p || !p.名字 || p.名字==='空'){ hudMsg('没有可取出的精灵'); return; }
  if(c.where!=='box' || !c.boxName){ hudMsg('只能从盒子取出到队伍'); return; }
  if(!hudAssertPokemonMutable(p,'取出'))return;
  if(teamSlot<1 || teamSlot>6){ hudMsg('无效的队伍位置'); return; }
  var dst=stat_data.队伍[String(teamSlot)];
  if(dst && dst.名字 && dst.名字!=='空'){ hudMsg('该队伍位置已有精灵'); return; }
  hudEnsurePokemonIdentity(p);
  var boxName=c.boxName, boxSlot=c.slot;
  stat_data.队伍[String(teamSlot)]=p;
  delete stat_data.盒子[boxName][boxSlot];
  hudSend('请执行【盒子→队伍】：把《'+boxName+'》里的《'+p.名字+'》取出到队伍第'+teamSlot+'位，并更新状态栏。', function(){
  stat_data.盒子[boxName][boxSlot]=p;
  stat_data.队伍[String(teamSlot)]={名字:'空'};
}, '把'+boxDisp(boxName)+'里的'+p.名字+'取出到队伍第'+teamSlot+'位。');
  hudRecordAssetMutation(p,{action:'move',method:'HUD 盒子→队伍',fromLocation:boxDisp(boxName)+' 第'+boxSlot+'格',toLocation:'队伍第'+teamSlot+'位',location:'队伍第'+teamSlot+'位'});
  render(); resizeFrame();
  if(currentPageKey==='box'){openPage('box');}
  hudMsg('已把《'+p.名字+'》取出到队伍第 '+teamSlot+' 位');
}
function equipPkm(c,itemName){
  var p=getCardPkm(c);
  if(!p || !p.名字 || p.名字==='空'){ hudMsg('没有目标精灵'); return; }
  if(!hudAssertPokemonMutable(p,'更换携带道具'))return;
  if(getBagCount(itemName)<=0){ hudMsg('背包里没有该道具'); return; }

  var beforeBag=pkmHudClone(stat_data.背包||{});
  var beforeItem=p.携带道具||'无';
  var beforeItemEn=p.携带道具英文||'';

  var old=p.携带道具;
  var oldIcon=bagItemIconOf(old,beforeItemEn);
  if(old && old!=='无') addBagItem(old,1,oldIcon);
  var newIcon=bagItemIconOf(itemName,'');
  removeBagItem(itemName,1);
  p.携带道具=itemName;
  p.携带道具英文=newIcon;
  var oldItem=old;

  hudSend('请让《'+p.名字+'》携带《'+itemName+'》'+(oldItem && oldItem!=='无' ? '；请先卸下原道具《'+oldItem+'》并放回背包':'')+'，并更新状态栏。', function(){
  stat_data.背包=beforeBag;
  p.携带道具=beforeItem;
  p.携带道具英文=beforeItemEn;
}, '让'+p.名字+'携带'+itemName+(oldItem && oldItem!=='无' ? '，并先卸下原道具'+oldItem+'放回背包':'')+'。');

  render(); resizeFrame();
  hudMsg(oldItem && oldItem!=='无' ? '已卸下《'+oldItem+'》并携带《'+itemName+'》' : '已携带《'+itemName+'》');
}
function unequipPkmByCard(c){
  var p=getCardPkm(c);
  if(!p || !p.名字 || p.名字==='空'){ hudMsg('没有目标精灵'); return; }
  if(!hudAssertPokemonMutable(p,'卸下携带道具'))return;
  var old=p.携带道具;
  if(!old || old==='无'){ hudMsg('该精灵没有携带道具'); return; }

  var beforeBag=pkmHudClone(stat_data.背包||{});
  var beforeItem=old;
  var beforeItemEn=p.携带道具英文||'';

  addBagItem(old,1,bagItemIconOf(old,beforeItemEn));
  p.携带道具='无';
  p.携带道具英文='';
  var oldItem=old;

  hudSend('请卸下《'+p.名字+'》携带的《'+oldItem+'》并放回背包，并更新状态栏。', function(){
  stat_data.背包=beforeBag;
  p.携带道具=beforeItem;
  p.携带道具英文=beforeItemEn;
}, '卸下'+p.名字+'携带的'+oldItem+'并放回背包。');

  render(); resizeFrame();
  hudMsg('已卸下《'+oldItem+'》');
}
function discardBagItem(name,count){
  count=count||1;
  if(getBagCount(name)<=0){ hudMsg('背包里没有该道具'); return; }
  var keepIcon=bagItemIconOf(name,'');
  removeBagItem(name,count);
  var cnt=count;
  hudSend('请丢弃背包中的《'+name+'》×'+cnt+'，并更新状态栏。', function(){
  addBagItem(name,cnt,keepIcon);
}, '丢弃背包中的'+name+'×'+cnt+'。');
  render(); resizeFrame();
  hudMsg('已丢弃《'+name+'》×'+cnt);
}
function discardBagItemAsk(name){
  hudConfirm('丢弃道具','确定丢弃《'+name+'》×1 吗？',function(){ discardBagItem(name,1); });
}
function openNewBoxModal(){
  overlay.innerHTML='<div class="modal"><div class="modal-head"><div class="modal-name">新建盒子</div><button class="close" data-close>✕</button></div><div class="modal-body"><input type="text" id="box-new-name" placeholder="输入盒子名称" style="width:100%;box-sizing:border-box;padding:8px 10px;margin-bottom:10px;font-family:inherit;font-size:.9rem;background:rgba(43,74,111,.5);border:1px solid var(--frame);border-radius:6px;color:var(--text);outline:none"><div class="action-btns"><button class="act-btn" data-box-new-confirm>✔ 创建</button><button class="act-btn" data-close>取消</button></div></div></div>';
  overlay.classList.add('open');
  hudScope.setTimeout(function(){var i=document.getElementById('box-new-name'); if(i)i.focus();},30);
}

function createBox(name){
  name=String(name||'').trim();
  if(!name){ hudMsg('盒子名称不能为空'); return; }
  if(stat_data.盒子[name]){ hudMsg('盒子「'+name+'」已存在'); return; }
  stat_data.盒子[name]={};
  activeBox=name;
  hudSend('请新建一个盒子，盒子名称为《'+name+'》，并更新状态栏。', function(){
    delete stat_data.盒子[name];
  }, '新建盒子'+name);
overlay.classList.remove('open');
render();
resizeFrame();
openPage('box');
hudMsg('已新建盒子「'+name+'」');
}

function openDeleteBoxConfirm(){
  var name=activeBox;
  if(!stat_data.盒子 || !stat_data.盒子[name]){ hudMsg('没有可删除的盒子'); return; }
  var cnt=Object.keys(stat_data.盒子[name]||{}).filter(function(s){
    var p=stat_data.盒子[name][s];
    return p && p.名字 && p.名字!=='空';
  }).length;
  if(cnt>0){ hudMsg('盒子「'+name+'」里还有宝可梦，请先取出'); return; }
  hudConfirm('删除盒子','确定删除盒子「'+name+'」吗？', function(){ deleteBox(name); });
}

function deleteBox(name){
  name=String(name||'');
  if(!name || !stat_data.盒子[name]){ hudMsg('盒子不存在'); return; }
  delete stat_data.盒子[name];
  var keys=Object.keys(stat_data.盒子);
  activeBox=keys.length ? keys[0] : '1';
  hudSend('请删除盒子《'+name+'》，并更新状态栏。', function(){
    stat_data.盒子[name]={};
  }, '删除盒子'+name);
overlay.classList.remove('open');
render();
resizeFrame();
openPage('box');
hudMsg('已删除盒子「'+name+'」');
}

function openMoveBoxPicker(c){
  hudActionCard=c;
  var boxes=Object.keys(stat_data.盒子||{}).filter(function(b){ return b!==c.boxName; });
  if(!boxes.length){ hudMsg('没有其他盒子，请先新建盒子'); return; }
  var html='<div class="modal"><div class="modal-head"><div class="modal-name">选择目标盒子</div><button class="close" data-close>✕</button></div><div class="modal-body"><div class="action-btns">';
  boxes.forEach(function(b){ html+='<button class="act-btn" data-hud-movebox="'+esc(b)+'">移动到 '+esc(b)+'</button>'; });
  html+='</div></div></div>';
  overlay.innerHTML=html;
  overlay.classList.add('open');
}

function moveBoxPkm(c,targetBox){
  var p=getCardPkm(c);
  if(!p || !p.名字 || p.名字==='空'){ hudMsg('没有可移动的宝可梦'); return; }
  if(c.where!=='box' || !c.boxName){ hudMsg('只能移动盒子里的宝可梦'); return; }
  if(!hudAssertPokemonMutable(p,'移动'))return;
  if(targetBox===c.boxName){ hudMsg('目标盒子不能是当前盒子'); return; }

  hudEnsurePokemonIdentity(p);
  var srcBox=c.boxName, srcSlot=c.slot;
  var slot=findBoxSlot(targetBox);
  stat_data.盒子[targetBox][slot]=p;
  delete stat_data.盒子[srcBox][srcSlot];

  hudSend('请把盒子《'+srcBox+'》里的《'+p.名字+'》移动到盒子《'+targetBox+'》，并更新状态栏。', function(){
  delete stat_data.盒子[targetBox][slot];
  stat_data.盒子[srcBox][srcSlot]=p;
}, '把'+p.名字+'从'+boxDisp(srcBox)+'移动到'+boxDisp(targetBox));
  hudRecordAssetMutation(p,{action:'move',method:'HUD 盒子间移动',fromLocation:boxDisp(srcBox)+' 第'+srcSlot+'格',toLocation:boxDisp(targetBox)+' 第'+slot+'格',location:boxDisp(targetBox)+' 第'+slot+'格'});

render();
resizeFrame();
openPage('box');
hudMsg('已把《'+p.名字+'》移动到'+boxDisp(targetBox));
}

function openBoxPicker(c){
  hudActionCard=c;
  var boxes=Object.keys(stat_data.盒子||{});
  var html='<div class="modal"><div class="modal-head"><div class="modal-name">选择盒子</div><button class="close" data-close>✕</button></div><div class="modal-body"><div class="action-btns">';
  if(!boxes.length){
    html+='<button class="act-btn" data-hud-newbox>新建「盒子1」并存入</button>';
  }else{
    boxes.forEach(function(b){ html+='<button class="act-btn" data-hud-storebox="'+esc(b)+'">存入 '+esc(b)+'</button>'; });
  }
  html+='</div></div></div>';
  overlay.innerHTML=html;
  overlay.classList.add('open');
}
function openSlotPicker(c){
  hudActionCard=c;
  var hasEmpty=false;
  var html='<div class="modal"><div class="modal-head"><div class="modal-name">选择队伍位置</div><button class="close" data-close>✕</button></div><div class="modal-body"><div class="action-btns">';
  for(var i=1;i<=6;i++){
    var p=stat_data.队伍[String(i)];
    var empty=!p || !p.名字 || p.名字==='空';
    if(empty) hasEmpty=true;
    html+='<button class="act-btn" data-hud-slot="'+i+'"'+(empty?'':' disabled style="opacity:.35"')+'>'+(empty?('第 '+i+' 位（空）'):('第 '+i+' 位：'+esc(p.名字)))+'</button>';
  }
  html+='</div></div></div>';
  if(!hasEmpty){ hudMsg('队伍已满，请先存入盒子腾出位置'); return; }
  overlay.innerHTML=html;
  overlay.classList.add('open');
}
function openItemPicker(c){
  hudActionCard=c;
  var items=Object.keys(stat_data.背包||{}).filter(function(n){
    var it=stat_data.背包[n];
    return it && getBagCount(n)>0 && it.类型!=='重要物品';
  });
  if(!items.length){ hudMsg('背包里没有道具'); return; }
  var html='<div class="modal"><div class="modal-head"><div class="modal-name">选择携带道具</div><button class="close" data-close>✕</button></div><div class="modal-body"><div class="action-btns">';
  items.forEach(function(n){ html+='<button class="act-btn" data-hud-item="'+esc(n)+'">'+esc(n)+' ×'+getBagCount(n)+'</button>'; });
  html+='</div></div></div>';
  overlay.innerHTML=html;
  overlay.classList.add('open');
}
function refreshIconHTML(){
  return '<img src="https://img.baibai.cv/f/WEvnT4/1789326633150.png" alt="刷新">';
}
function refreshBtnHTML(){
  return '<button type="button" class="hud-refresh-btn" data-hud-refresh title="刷新变量">'+refreshIconHTML()+'</button>';
}
function hudBindRefreshProgrammaticGuard(root){
  try{
    var scope=(root&&root.querySelectorAll)?root:document,list=[];
    if(scope.matches&&scope.matches('[data-hud-refresh]'))list.push(scope);
    var q=scope.querySelectorAll?scope.querySelectorAll('[data-hud-refresh]'):[];
    for(var i=0;i<q.length;i++)list.push(q[i]);
    for(var j=0;j<list.length;j++)(function(btn){
      if(!btn||btn._pkmProgrammaticRefreshGuard)return;
      btn._pkmProgrammaticRefreshGuard=true;
      // External legacy bridges use button.click(). Shadow only the instance method so
      // real mouse/touch/keyboard activation still produces a trusted click event.
      var safeClick=function(){hudDiagInc('programmaticRefreshIntercepted');hudHydrateDiyDomOnly();};
      try{Object.defineProperty(btn,'click',{configurable:true,writable:true,value:safeClick});}
      catch(e){try{btn.click=safeClick;}catch(_e){hudDiagError('refresh button programmatic guard',_e);}}
    })(list[j]);
  }catch(e){hudDiagError('refresh button guard bind',e);}
}
function hudRefreshFromMvuSilent(){
  try{
    var before=pkmStateSnapshot(stat_data),next=hudPendingActions.length?stat_data:loadStatData();
    if(next){stat_data=next;hudExternalStateChanged();hudRebuildLocationIndex();}
    var after=pkmStateSnapshot(stat_data);
    if(before===after){hudHydrateDiyDomOnly();hudDiagInc('silentRefreshSkipped');return true;}
  }catch(e){hudDiagError('silent refresh state',e);return false;}
  try{pkmHudRenderCurrent();return true;}catch(e){hudDiagError('silent refresh render',e);return false;}
}
var hudManualRefreshBusy=false;
function hudRefresh(){
  if(hudManualRefreshBusy){hudDiagInc('manualRefreshDeduped');return false;}
  hudManualRefreshBusy=true;
  var activeTab='1';
  try{var at=document.querySelector('.tab-btn.active');if(at)activeTab=at.getAttribute('data-tab')||'1';}catch(e){}
  var btn=document.querySelector('[data-hud-refresh]');
  if(btn){btn.classList.add('spin');btn.disabled=true;}
  try{if(!hudPendingActions.length){stat_data=loadStatData();hudExternalStateChanged();hudEnsureLocationIndex();}}catch(e){hudDiagError('manual refresh state',e);}
  try{diySyncFromStorage(false);}catch(e){}
  // Manual MVU refresh must not migrate/canonicalize DIY images. Image migration has its
  // own lifecycle (startup/save/import) and mixing the two was the feedback-loop trigger.
  try{recordSeen();}catch(e){}
  try{
    render();
    var tabs=document.querySelectorAll('.tab-btn');
    for(var i=0;i<tabs.length;i++){tabs[i].classList.toggle('active',tabs[i].getAttribute('data-tab')===activeTab);}
    var panels=document.querySelectorAll('.tab-panel');
    for(var j=0;j<panels.length;j++){panels[j].classList.toggle('active',panels[j].id==='tab-'+activeTab);}
    hudHydrateDiyDomOnly();resizeFrame();
  }catch(e){try{fail('HUD 刷新失败：'+e.message);}catch(e2){}}
  hudScope.setTimeout(function(){
    hudManualRefreshBusy=false;
    var b=document.querySelector('[data-hud-refresh]');
    if(b){b.classList.remove('spin');b.disabled=false;b.innerHTML='<span class="hud-refresh-ok">✔</span>';hudBindRefreshProgrammaticGuard(b);}
    hudScope.setTimeout(function(){
      var b2=document.querySelector('[data-hud-refresh]');
      if(b2){b2.innerHTML=refreshIconHTML();hudBindRefreshProgrammaticGuard(b2);}
    },900);
  },80);
  return true;
}

function hudActiveTab(app){try{var b=app&&app.querySelector('.tab-btn.active');return b?String(b.getAttribute('data-tab')||'1'):'1';}catch(e){return '1';}}
function refreshHudPanels(app){return bw2RefreshPanels(app);}
function hudBindRootDelegation(app){
  if(!app||app._pkmDelegated)return;app._pkmDelegated=true;hudDiagInc('rootDelegation');
  
  var hudInlineGuard=(app&&app.id==='pkm-hud-inline');
  ['touchstart','touchmove','touchend','touchcancel','pointerdown','pointermove','pointerup','mousedown','mousemove','mouseup'].forEach(function(type){
    try{app.addEventListener(type,function(e){var t=e.target;if(t&&t.nodeType!==1)t=t.parentElement;if(!t)return;if(hudInlineGuard||(t.closest&&t.closest('.nb-grid'))){e.stopPropagation();}},{passive:true});}catch(_e){}
  });
  app.addEventListener('click',function(e){
    var _et=e.target;if(_et&&_et.nodeType!==1)_et=_et.parentElement;var x=_et&&_et.closest?_et.closest.bind(_et):null;if(!x)return;
    var r=x('[data-hud-refresh]');if(r){
      e.preventDefault();e.stopPropagation();
      if(e.isTrusted===false){hudDiagInc('syntheticRefreshEventsBlocked');hudHydrateDiyDomOnly();return;}
      hudRefresh();return;
    }
    var ht=x('[data-hud-cmd-toggle]');if(ht){e.stopPropagation();hudCmdOpen=!hudCmdOpen;refreshHudPanels(app);resizeFrame();return;}
    var hr=x('[data-hud-cmd-remove]');if(hr){e.stopPropagation();hudRemoveAction(hr.getAttribute('data-hud-cmd-remove'));return;}
    var tip=x('[data-tip]');if(tip){e.preventDefault();e.stopPropagation();hudMsg(tip.getAttribute('data-tip'));return;}
    var cmd=x('[data-cmd]');if(cmd){e.preventDefault();e.stopPropagation();var txt=cmd.getAttribute('data-cmd'),old=cmd.textContent;if(fillInput(txt)){cmd.textContent='✔ 已填入输入栏';hudScope.setTimeout(function(){if(cmd&&cmd.isConnected)cmd.textContent=old;},1200);}else hudMsg('无法访问输入栏。指令：'+txt);return;}
    var tab=x('.tab-btn[data-tab]');if(tab){var t=tab.getAttribute('data-tab');app.querySelectorAll('.tab-btn').forEach(function(b){b.classList.toggle('active',b===tab);});app.querySelectorAll('.tab-panel').forEach(function(p){p.classList.toggle('active',p.id==='tab-'+t);});resizeFrame();return;}
    var menu=x('.menu-item[data-page]');if(menu){openPage(menu.getAttribute('data-page'));return;}
    var fold=x('#home-fold [data-fold]');if(fold){var k=fold.getAttribute('data-fold');foldState[k]=!foldState[k];var home=app.querySelector('#home-fold');if(home){home.innerHTML=homeFoldHTML();resolveItemImgs(home);hudResolvePkidbImages(home);}resizeFrame();return;}
    var bag=x('#home-fold .bag-tab[data-bag]');if(bag){activeBag=bag.getAttribute('data-bag');var home2=app.querySelector('#home-fold');if(home2){home2.querySelectorAll('.bag-tab').forEach(function(b){b.classList.toggle('active',b===bag);});var list=home2.querySelector('#bag-list');if(list){list.innerHTML=bagItemsHTML();resolveItemImgs(home2);}}resizeFrame();return;}
    var bd=x('#home-fold [data-bag-discard]');if(bd){e.stopPropagation();discardBagItemAsk(bd.getAttribute('data-bag-discard'));return;}
    var tmv=x('#home-fold .item-entry[data-tm]');if(tmv){e.stopPropagation();showMoveInfo(tmv.getAttribute('data-tm'));return;}
    var item=x('#home-fold .item-entry[data-item]');if(item){e.stopPropagation();if(itemClickEnabled)showItemInfo(item.getAttribute('data-item'),false,item.getAttribute('data-item-en')||'');return;}
    var bc=x('#badge-cycle');if(bc){badgeClick(e);return;}
    var bo=x('[data-badge-open]');if(bo){e.stopPropagation();openPage('badge');return;}
    var card=x('.card-frame[data-slot]');if(card){var sl=parseInt(card.getAttribute('data-slot'),10),c=null;for(var i=0;i<cards.length;i++)if(cards[i].slot===sl){c=cards[i];break;}if(c){currentDetailCard=c;clearBack();overlay.innerHTML=detailHTML(c);overlay.classList.add('open');pkImgFix(overlay);resolvePkmImgs(overlay);resolveMoveTypes(overlay);resolveItemImgs(overlay);hudResolvePkidbImages(overlay);}return;}
    var nb=x('[data-nearby-open]');if(nb){e.stopPropagation();var key=nb.getAttribute('data-nearby-open'),pk=stat_data.附近宝可梦&&stat_data.附近宝可梦[key];if(pk){clearBack();overlay.innerHTML=actionHTML(pk,key);overlay.classList.add('open');pkImgFix(overlay);resolvePkmImgs(overlay);resolveNearbyTypes(overlay);hudResolvePkidbImages(overlay);}return;}
    var nt=x('[data-nearby-toggle]');if(nt){e.stopPropagation();nearbyOpen=!nearbyOpen;var nf=app.querySelector('.nearby-frame');if(nf){nf.outerHTML=nearbyHTML();pkImgFix(app);resolvePkmImgs(app);resolveNearbyTypes(app);hudResolvePkidbImages(app);}resizeFrame();return;}
    var bmv=x('[data-move]');if(bmv){e.stopPropagation();showMoveInfo(bmv.getAttribute('data-move'),bmv.getAttribute('data-mvtype'),bmv.getAttribute('data-mvcat'));return;}    var bab=x('[data-ability]');if(bab){e.stopPropagation();showAbilityInfo(bab.getAttribute('data-ability'));return;}    var bit=x('.abi-link[data-item]');if(bit){e.stopPropagation();showItemInfo(bit.getAttribute('data-item'),true,bit.getAttribute('data-item-en')||'');return;}    var bnt=x('[data-nature]');if(bnt){e.stopPropagation();showNatureInfo(bnt.getAttribute('data-nature'));return;}    var sum=x('.cmd-panel>summary');if(sum){var det=sum.parentElement;hudScope.setTimeout(function(){if(det)cmdOpen=!!det.open;},0);}
  });
}
function render(){
  var inline=(winMode==='0');
  var app=inline?document.getElementById('pkm-hud-inline'):document.getElementById('pkm-hud-slot');
  if(!app){app=document.createElement('div');app.id=inline?'pkm-hud-inline':'pkm-hud-slot';if(inline){document.body.appendChild(app);}else{try{ensureHud();}catch(e){}var win=document.getElementById('pkm-hud-win');var slot=document.getElementById('pkm-hud-slot');if(slot){app=slot;}else if(win){win.appendChild(app);}else{document.body.appendChild(app);}}}
  bw2BindUI(app);
  if(app._pkmOptimizedReady&&app.querySelector('.hud')){refreshHudPanels(app);resizeFrame();return;}
  app.innerHTML=bw2ConsoleHTML();
hudBindRefreshProgrammaticGuard(app);
ensureItemAlias();
ensureMoveAlias();
pkImgFix(app);
resolvePkmImgs(app);
resolveItemImgs(app);
resolveNearbyTypes(app);
  var hudEl=app.querySelector('.hud')||document.querySelector('.hud');
overlay=document.createElement('div');overlay.className='overlay pkm-hud-overlay';hudEl.appendChild(overlay);
subOverlay=document.createElement('div');subOverlay.className='overlay pkm-hud-overlay pkm-hud-sub';hudEl.appendChild(subOverlay);
pageOverlay=document.createElement('div');pageOverlay.className='page-overlay pkm-hud-page-overlay';hudEl.appendChild(pageOverlay);pageOverlayHost=hudEl;
hudBindModalIsolation();

['pointerdown','pointerup','mousedown','mouseup','touchstart','touchend'].forEach(function(type){
  try{pageOverlay.addEventListener(type,function(e){e.stopPropagation();},{passive:true});}catch(_e){}
  try{overlay.addEventListener(type,function(e){e.stopPropagation();},{passive:true});}catch(_e2){}
  try{subOverlay.addEventListener(type,function(e){e.stopPropagation();},{passive:true});}catch(_e3){}
});
  cards=buildCards();
for(var i=0;i<cards.length;i++){preloadMoves(cards[i].skills);}
  hudBindRootDelegation(app);
  app._pkmOptimizedReady=true;bw2RememberHome(app.querySelector("#tab-1"));app.querySelector("#tab-4")._bw2Signature=bw2PanelSignature("controls-1");bw2SyncConsoleLabels(app);
  hudResolvePkidbImages(app);


  pageOverlay.addEventListener('click',function(e){
  e.stopPropagation();
  var bagDiscard=e.target.closest('[data-bag-discard]');
  if(bagDiscard){e.stopPropagation();discardBagItemAsk(bagDiscard.getAttribute('data-bag-discard'));return;}
  var dc=e.target.closest('.dex-cell[data-name]');
if(dc){e.stopPropagation();showPokemonInfo(dc.getAttribute('data-name'),dc.getAttribute('data-id'));return;}
var tm=e.target.closest('.item-entry[data-tm]');
if(tm){e.stopPropagation();showMoveInfo(tm.getAttribute('data-tm'));return;}
var it=e.target.closest('.item-entry[data-item]');
if(it){e.stopPropagation();if(itemClickEnabled)showItemInfo(it.getAttribute('data-item'),false,it.getAttribute('data-item-en')||'');return;}
var tb=e.target.closest('[data-tc-big]');
if(tb){e.stopPropagation();overlay.innerHTML='<div class="modal" style="max-width:none;width:100%"><div class="modal-head"><div class="modal-name">属性克制表（可滚动查看）</div><button class="close" data-close>✕</button></div><div class="modal-body" style="padding:8px;overflow:auto;text-align:center"><img src="'+tb.getAttribute('data-tc-big')+'" style="width:200%;max-width:none;height:auto"></div></div>';overlay.classList.add('open');return;}
  if(e.target===pageOverlay||e.target.closest('[data-page-close]')){
  if(e.cancelable)e.preventDefault();hudArmGestureShield(pageOverlay,750);
  pageOverlay.classList.remove('open');
  pageOverlayPopout(false);
  currentPageKey='';
  clearDexGrid();
  if(quickMapFromFab){
  quickMapFromFab=false;
  var _win=document.getElementById('pkm-hud-win');
  var _mask=document.getElementById('pkm-hud-mask');
  var _btn=document.getElementById('pkm-hud-btn');
  if(_win)_win.classList.remove('open');
  if(_mask)_mask.classList.remove('open');
  if(_btn)_btn.style.display='';
  try{document.body.style.overflow='';}catch(e2){}
}
  var tf=document.querySelector('.bw2-profile');
  if(tf){tf.outerHTML=trainerHTML();hudResolvePkidbImages(document);}
}
});
  overlay.addEventListener('click',function(e){
    e.stopPropagation();
    if(e.target.closest('[data-move-back]')){e.stopPropagation();var _pb=popBack();if(_pb){overlay.innerHTML=_pb;}else{overlay.classList.remove('open');}return;}
var itm=e.target.closest('[data-item]');if(itm){e.stopPropagation();if(itemClickEnabled)showItemInfo(itm.getAttribute('data-item'),true,itm.getAttribute('data-item-en')||'');return;}
    if(e.target===overlay){if(e.cancelable)e.preventDefault();hudArmGestureShield(overlay,750);diyVisionCancel();var _pb2=popBack();if(_pb2){overlay.innerHTML=_pb2;}else{overlay.classList.remove('open');}return;}
        if(e.target.closest('[data-close]')){if(e.cancelable)e.preventDefault();hudArmGestureShield(overlay,750);diyVisionCancel();overlay.classList.remove('open');clearBack();return;}
var bnc=e.target.closest('[data-box-new-confirm]');if(bnc){e.stopPropagation();var inp=document.getElementById('box-new-name');createBox(inp?inp.value:'');return;}
var ps=e.target.closest('[data-pkm-store]');if(ps){e.stopPropagation();if(currentDetailCard)openBoxPicker(currentDetailCard);return;}
var pw=e.target.closest('[data-pkm-withdraw]');if(pw){e.stopPropagation();if(currentDetailCard)openSlotPicker(currentDetailCard);return;}
var pm=e.target.closest('[data-pkm-movebox]');if(pm){e.stopPropagation();if(currentDetailCard)openMoveBoxPicker(currentDetailCard);return;}
var pe=e.target.closest('[data-pkm-equip]');if(pe){e.stopPropagation();if(currentDetailCard)openItemPicker(currentDetailCard);return;}
var pu=e.target.closest('[data-pkm-unequip]');if(pu){e.stopPropagation();if(currentDetailCard)unequipPkmByCard(currentDetailCard);return;}
var hb=e.target.closest('[data-hud-storebox]');if(hb){e.stopPropagation();storePkm(hudActionCard,hb.getAttribute('data-hud-storebox'));return;}
var hn=e.target.closest('[data-hud-newbox]');if(hn){e.stopPropagation();storePkm(hudActionCard,'盒子1');return;}
var mb=e.target.closest('[data-hud-movebox]');if(mb){e.stopPropagation();moveBoxPkm(hudActionCard,mb.getAttribute('data-hud-movebox'));return;}
var hs=e.target.closest('[data-hud-slot]');if(hs){e.stopPropagation();withdrawPkm(hudActionCard,parseInt(hs.getAttribute('data-hud-slot'),10));return;}
var hi=e.target.closest('[data-hud-item]');if(hi){e.stopPropagation();equipPkm(hudActionCard,hi.getAttribute('data-hud-item'));return;}
var hc=e.target.closest('[data-hud-confirm]');if(hc){e.stopPropagation();var cb=hudConfirmCb;hudConfirmCb=null;if(typeof cb==='function')cb();return;}
var ddc=e.target.closest('[data-diy-confirm]');if(ddc){e.stopPropagation();diyDelConfirm();return;}
var dcl=e.target.closest('[data-diy-clear-confirm]');if(dcl){e.stopPropagation();diyClearConfirm();return;}
var dcp=e.target.closest('[data-diy-copy]');if(dcp){e.stopPropagation();diyCopy(dcp.getAttribute('data-diy-copy-type'),dcp.getAttribute('data-diy-copy'));return;}
var de=e.target.closest('[data-diy-edit]');if(de){e.stopPropagation();diyEdit(de.getAttribute('data-diy-edit-type'),de.getAttribute('data-diy-edit'));return;}
var ccc=e.target.closest('[data-copy-code]');if(ccc){e.stopPropagation();var cd=ccc.getAttribute('data-copy-code');diyCopyText(cd,function(ok){ccc.textContent=ok?'✔ 已复制':'复制失败';});return;}
var vsv=e.target.closest('[data-vision-save]');if(vsv){e.stopPropagation();diyVisionSaveFromModal();return;}
var ip=e.target.closest('[data-isz-plus]');if(ip){e.stopPropagation();iszStep(ip.getAttribute('data-isz-plus'),1);return;}
var im=e.target.closest('[data-isz-minus]');if(im){e.stopPropagation();iszStep(im.getAttribute('data-isz-minus'),-1);return;}
var ia=e.target.closest('[data-isz-apply]');if(ia){e.stopPropagation();iszApply();return;}
var ir=e.target.closest('[data-isz-reset]');if(ir){e.stopPropagation();iszReset();return;}
var fp=e.target.closest('[data-fab-plus]');if(fp){e.stopPropagation();fabStep(1);return;}
var fm=e.target.closest('[data-fab-minus]');if(fm){e.stopPropagation();fabStep(-1);return;}
var fa=e.target.closest('[data-fab-apply]');if(fa){e.stopPropagation();fabApply();return;}
var fr=e.target.closest('[data-fab-reset]');if(fr){e.stopPropagation();fabReset();return;}
var ihp=e.target.closest('[data-inline-h-plus]');if(ihp){e.stopPropagation();inlineHStep(10);return;}
var ihm=e.target.closest('[data-inline-h-minus]');if(ihm){e.stopPropagation();inlineHStep(-10);return;}
var iha=e.target.closest('[data-inline-h-apply]');if(iha){e.stopPropagation();inlineHApply();return;}
var ihr=e.target.closest('[data-inline-h-reset]');if(ihr){e.stopPropagation();inlineHReset();return;}
var fia=e.target.closest('[data-fab-img-apply]');if(fia){e.stopPropagation();fabImgApply();return;}
var fip=e.target.closest('[data-fab-img-preview]');if(fip){e.stopPropagation();var fiuv=document.getElementById('fab-img-url');if(fiuv)fabImgPreview(fiuv.value);return;}
var fir=e.target.closest('[data-fab-img-reset]');if(fir){e.stopPropagation();fabImgReset();return;}
var dmb=e.target.closest('[data-dt-all]');if(dmb){e.stopPropagation();showAllMoves(dmb.getAttribute('data-dt-all'));return;}
    var mv=e.target.closest('[data-move]');if(mv){e.stopPropagation();showMoveInfo(mv.getAttribute('data-move'),mv.getAttribute('data-mvtype'),mv.getAttribute('data-mvcat'));return;}
    var cry=e.target.closest('[data-cry]');if(cry){e.stopPropagation();try{var _nd=cry.getAttribute('data-cry');var _au=new Audio(PKM_DATA_BASE+'cries/'+_nd+'.ogg');_au.onerror=function(){try{new Audio('https://cdn.jsdelivr.net/gh/PokeAPI/cries@main/cries/pokemon/latest/'+_nd+'.ogg').play();}catch(e2){}};_au.play();}catch(err){}return;}
    var ab=e.target.closest('[data-ability]');if(ab){e.stopPropagation();showAbilityInfo(ab.getAttribute('data-ability'));return;}
var nt=e.target.closest('[data-nature]');if(nt){e.stopPropagation();showNatureInfo(nt.getAttribute('data-nature'));return;}
var st=e.target.closest('[data-shiny-toggle]');if(st){e.stopPropagation();if(curPkm){curPkmShiny=!curPkmShiny;renderPkmForm(curPkmForm);}return;}
    var fm=e.target.closest('[data-form]');if(fm){e.stopPropagation();renderPkmForm(parseInt(fm.getAttribute('data-form'),10));return;}
var cc=e.target.closest('[data-clear-confirm]');if(cc){e.stopPropagation();confirmClearModal();return;}
var cur=e.target.closest('[data-cache-usage-refresh]');if(cur){e.stopPropagation();openCacheUsage();return;}



    var btn=e.target.closest('[data-action]');if(btn){var action=btn.getAttribute('data-action');var key=btn.getAttribute('data-key');var p=stat_data.附近宝可梦&&stat_data.附近宝可梦[key];if(p)sendAction(p,action);}
  });
  subOverlay.addEventListener('click',function(e){
    e.stopPropagation();
    if(e.target.closest('[data-sub-close]')){if(e.cancelable)e.preventDefault();subOverlay.classList.remove('open');subOverlay.innerHTML='';return;}
    if(e.target===subOverlay){if(e.cancelable)e.preventDefault();subOverlay.classList.remove('open');subOverlay.innerHTML='';return;}
    var mv=e.target.closest('[data-move]');if(mv){e.stopPropagation();showMoveInfo(mv.getAttribute('data-move'),mv.getAttribute('data-mvtype'),mv.getAttribute('data-mvcat'));return;}
    var ab=e.target.closest('[data-ability]');if(ab){e.stopPropagation();showAbilityInfo(ab.getAttribute('data-ability'));return;}
    var nt=e.target.closest('[data-nature]');if(nt){e.stopPropagation();showNatureInfo(nt.getAttribute('data-nature'));return;}
    var itm=e.target.closest('[data-item]');if(itm){e.stopPropagation();if(itemClickEnabled)showItemInfo(itm.getAttribute('data-item'),true,itm.getAttribute('data-item-en')||'');return;}
  });
}

function fail(msg){try{var a=document.getElementById('pkm-hud-slot')||document.body;a.insertAdjacentHTML('beforeend','<div style="color:#faa;background:#300;padding:12px;font-family:monospace">'+msg+'</div>');}catch(e2){}}
function vpSize(){
  var w=WIN.innerWidth||360, h=WIN.innerHeight||640, ox=0, oy=0;
  try{
    var vv=WIN.visualViewport||window.visualViewport;
    if(vv&&vv.width&&vv.height){ w=vv.width; h=vv.height; ox=vv.offsetLeft||0; oy=vv.offsetTop||0; }
  }catch(e){}
  return {w:w,h:h,ox:ox,oy:oy};
}

function hudClampFab(btn){
  try{
    if(!btn)return false;
    var vp=vpSize(), size=fabSize, edge=14;
    var rawL=parseFloat(btn.style.left), rawT=parseFloat(btn.style.top);
    var l=rawL, t=rawT;
    var maxL=Math.max(0,vp.w-size), maxT=Math.max(0,vp.h-size);
    if(isNaN(l)||l<0||l>maxL)l=vp.w-size-edge;
    if(isNaN(t)||t<0||t>maxT)t=vp.h-140-size;
    var nl=Math.min(Math.max(0,l),maxL), nt=Math.min(Math.max(0,t),maxT);
    if(nl!==rawL)btn.style.left=nl+'px';
    if(nt!==rawT)btn.style.top=nt+'px';
    return true;
  }catch(e){return false;}
}

function hudSyncMapPopoutHeight(){
  try{
    if(!pageOverlay||!pageOverlay.classList.contains('popout'))return;
    var vh=vpSize().h;
    var padTop=0,padBottom=0;
    try{var cs=WIN.getComputedStyle?WIN.getComputedStyle(pageOverlay):null;if(cs){padTop=parseFloat(cs.paddingTop)||0;padBottom=parseFloat(cs.paddingBottom)||0;}}catch(_e2){}
    var avail=Math.floor(vh-padTop-padBottom-4);
    if(avail<160)avail=160;
    var page=pageOverlay.querySelector('.page');
    if(page)page.style.maxHeight=avail+'px';
    var body=pageOverlay.querySelector('.page-body');
    if(body)body.style.maxHeight=Math.max(120,avail-44)+'px';
  }catch(e){}
}
var VP_Y=0.6;


function resizeFrame(){return bw2ResizeConsole();}
function preloadBadges(){var r,t,i,im;for(r in BADGE_MAP){t=BADGE_MAP[r];for(i=0;i<t.length;i++){im=new Image();im.src=badgeUrl(r,t[i][0]);}}}
function ensureHud(){
  if(winMode==='0'){
    try{
      var b0=document.getElementById('pkm-hud-btn');if(b0)b0.style.display='none';
      var w0=document.getElementById('pkm-hud-win');if(w0){w0.classList.remove('open');w0.style.display='none';}
      var m0=document.getElementById('pkm-hud-mask');if(m0)m0.style.display='none';
      var s0=document.getElementById('pkm-hud-slot');if(s0){s0.innerHTML='';}
    }catch(e){}
    return;
  }
  var _ebtn=document.getElementById('pkm-hud-btn');
  var _ewin=document.getElementById('pkm-hud-win');
  var _emask=document.getElementById('pkm-hud-mask');
  var _eslot=document.getElementById('pkm-hud-slot');
  var _estructOk=!!(_ewin&&_emask&&_eslot&&_ewin.contains(_eslot));
  if(_ebtn&&_estructOk){
    // FAB exists and window structure is intact. Repair any "hidden" leftovers from a
    // previous inline-mode session, and make sure the FAB is visible when the window is
    // closed and clamped inside the viewport.
    if(!_ewin.classList.contains('open')&&_ebtn.style.display==='none'){try{_ebtn.style.display='';}catch(e){}}
    try{if(_ewin.style.display==='none')_ewin.style.display='';}catch(e){}
    try{if(_emask.style.display==='none')_emask.style.display='';}catch(e){}
    try{hudClampFab(_ebtn);}catch(e){}
    return;
  }
  // Structure broken (FAB/window/mask/slot partially or fully lost, or slot orphaned):
  // tear down every stale piece and rebuild the whole floating UI below.
  try{if(_ebtn&&_ebtn.parentNode)_ebtn.parentNode.removeChild(_ebtn);}catch(e){}
  try{var _emf=document.getElementById('pkm-hud-mapfab');if(_emf&&_emf.parentNode)_emf.parentNode.removeChild(_emf);}catch(e){}
  try{if(_ewin&&_ewin.parentNode)_ewin.parentNode.removeChild(_ewin);}catch(e){}
  try{if(_emask&&_emask.parentNode)_emask.parentNode.removeChild(_emask);}catch(e){}
  try{
    var _slots=document.querySelectorAll('#pkm-hud-slot');
    for(var _si=0;_si<_slots.length;_si++){var _s=_slots[_si];try{if(_s.parentNode)_s.parentNode.removeChild(_s);}catch(e){}}
  }catch(e){}

  var size=fabSize, edge=14;
var vp=vpSize();

var btn=document.createElement('div');
btn.id='pkm-hud-btn';
btn.title='宝可梦 HUD（可拖动）';
btn.style.width=fabSize+'px';
btn.style.height=fabSize+'px';
btn.style.fontSize=Math.round(fabSize*0.48)+'px';
btn.innerHTML='<img src="'+esc(fabImg||FAB_IMG_DEFAULT)+'" style="width:'+(fabSize-8)+'px;height:'+(fabSize-8)+'px" onerror="this.remove();this.parentNode.textContent=\'⚪\'">';
btn.style.left=(vp.w-size-edge)+'px';
btn.style.top=(vp.oy+vp.h-140-size)+'px';
document.body.appendChild(btn);


  
  var saved=null;
  try{ saved=JSON.parse(localStorage.getItem('pkm_fab_pos')); }catch(e){}
  if(saved && saved.l!==undefined && saved.t!==undefined){
    btn.style.left=saved.l+'px';
    btn.style.top=saved.t+'px';
  }
  try{hudClampFab(btn);}catch(e){}

  
  function fixPos(wantX,wantY){
    try{
      var r=btn.getBoundingClientRect();
      var l=parseFloat(btn.style.left)||0;
      var t=parseFloat(btn.style.top)||0;
      btn.style.left=(l+(wantX-r.x))+'px';
      btn.style.top=(t+(wantY-r.y))+'px';
    }catch(e){}
  }
  if(!saved){ fixPos(vp.w-size-edge, vp.oy+vp.h-140-size); }

  var mask=document.createElement('div');
  mask.id='pkm-hud-mask';
  document.body.appendChild(mask);
  var win=document.createElement('div');
  win.id='pkm-hud-win';
  var close=document.createElement('button');
  close.id='pkm-hud-close';
  close.type='button';
  close.innerHTML='✕';
  win.appendChild(close);
  var slot=document.createElement('div');
  slot.id='pkm-hud-slot';
  win.appendChild(slot);
  document.body.appendChild(win);

  function centerWin(){
try{
  var vp2=vpSize();
  var cw=vp2.w, ch=vp2.h;
  var w=win.offsetWidth, h=win.offsetHeight;
  if(w<10||h<10){ w=Math.min(cw*0.94,650); h=Math.min(ch*0.86,560); }
  var wantX=Math.max(4, vp2.ox+(cw-w)/2);
  var wantY=Math.max(4, vp2.oy+(ch-h)*VP_Y);
    win.style.left=wantX+'px';
    win.style.top=wantY+'px';
    var r=win.getBoundingClientRect();
    win.style.left=(wantX+(wantX-r.x))+'px';
    win.style.top=(wantY+(wantY-r.y))+'px';
  }catch(e){}
}

var touchY=0;
win.addEventListener('touchstart', function(e){ if(e.touches&&e.touches[0]) touchY=e.touches[0].clientY; }, {passive:true});
win.addEventListener('touchmove', function(e){
  try{
    if(!e.touches||!e.touches[0]) return;
    var t=e.target;
    if(t&&t.nodeType===1&&t.closest&&(t.closest('#pkm-lv')||t.closest('input,select,button,textarea,label'))){return;}
    var y=e.touches[0].clientY;
    if(y<=touchY){ touchY=y; return; }
    var el=t;
    if(el && el.nodeType!==1) el=el.parentElement;
    var atTop=true;
    while(el && el!==win && el!==document.body && el!==document.documentElement){
      if(el.scrollTop>0){ atTop=false; break; }
      el=el.parentElement;
    }
    touchY=y;
    if(atTop && e.cancelable){ e.preventDefault(); }
  }catch(err){}
}, {passive:false});

function open(){
  try{var _sd=loadStatData();if(_sd){stat_data=_sd;hudExternalStateChanged();hudRebuildLocationIndex();}nearbyOpen=false;foldState={};activeBag='道具';}catch(e){}
try{recordSeen();}catch(e){}
try{render();}catch(e){fail('HUD 渲染失败：'+e.message);}
  btn.style.display='none';
  hideMapFab();
  mask.classList.add('open');
  win.classList.add('open');
  try{ document.body.style.overflow='hidden'; }catch(e){}
  hudScope.setTimeout(function(){
    centerWin();
    resizeFrame();
  }, 30);
  
  hudScope.setTimeout(function(){
    resizeFrame();
  }, 230);
}
function closeHud(){
  btn.style.display='';
  hideMapFab();
  mask.classList.remove('open');
  win.classList.remove('open');
  try{ document.body.style.overflow=''; }catch(e){}
  try{
    var _vp=vpSize();
    var _l=parseFloat(btn.style.left);
    var _t=parseFloat(btn.style.top);
    var _maxL=Math.max(0,_vp.w-size);
    var _maxT=Math.max(0,_vp.h-size);
    if(isNaN(_l)||_l<0||_l>_maxL)_l=_vp.w-size-edge;
    if(isNaN(_t)||_t<0||_t>_maxT)_t=_vp.h-140-size;
    btn.style.left=Math.min(Math.max(0,_l),_maxL)+'px';
    btn.style.top=Math.min(Math.max(0,_t),_maxT)+'px';
    try{localStorage.setItem('pkm_fab_pos',JSON.stringify({l:parseFloat(btn.style.left),t:parseFloat(btn.style.top)}));}catch(e3){}
  }catch(e2){}
}
  function toggleHud(){ if(win.classList.contains('open'))closeHud(); else open(); }

  
var drag=null;
var longPressTimer=null,longPressFired=false;
var fabSkipClick=false;
var fabTouchActive=false;
var fabTouchId=0;
var fabSuppressMouseUntil=0;
var mapFab=document.createElement('button');
mapFab.id='pkm-hud-mapfab';
mapFab.type='button';
mapFab.innerHTML='🗺️';
mapFab.title='打开地图';
document.body.appendChild(mapFab);
function showMapFab(){
  try{
    var r=btn.getBoundingClientRect();
    mapFab.style.left=(r.left + r.width/2 - 22)+'px';
    mapFab.style.top=(r.top - 52)+'px';
  }catch(e){}
  mapFab.classList.add('show');
}
function hideMapFab(){mapFab.classList.remove('show');}
mapFab.addEventListener('click',function(e){
  if(e.cancelable)e.preventDefault();e.stopPropagation();try{e.stopImmediatePropagation();}catch(_e){}
  hudArmGestureShield(mapFab,750);
  hideMapFab();
  try{
    quickMapFromFab=true;
    if(!win.classList.contains('open')){open();}
    openPage('map');
  }catch(err){}
});
hudScope.listen(document,'click',function(e){
  var t=e.target&&e.target.closest?e.target:null;
  if(!t||(!t.closest('#pkm-hud-mapfab') && !t.closest('#pkm-hud-btn'))){hideMapFab();}
});
function startDrag(cx,cy){
  hideMapFab();
  hudScope.clearTimeout(longPressTimer);
  longPressFired=false;
  drag={x:cx,y:cy,l:parseFloat(btn.style.left)||0,t:parseFloat(btn.style.top)||0,moved:false};
  longPressTimer=hudScope.setTimeout(function(){
    if(drag && !drag.moved){
      longPressFired=true;
      hudDisarmGestureShield();
      showMapFab();
      try{if(navigator.vibrate)navigator.vibrate(30);}catch(e2){}
    }
  },500);
}
function moveDrag(cx,cy){
  if(!drag)return;
  var dx=cx-drag.x, dy=cy-drag.y;
  if(Math.abs(dx)>8||Math.abs(dy)>8){
    drag.moved=true;
    hudScope.clearTimeout(longPressTimer);longPressTimer=null;
    hideMapFab();
  }
  if(drag.moved){
    btn.style.left=(drag.l+dx)+'px';
    btn.style.top=(drag.t+dy)+'px';
    try{hudClampFab(btn);}catch(e){}
  }
}
function fabToggleHud(){
  hudArmGestureShield(btn,900);
  hideMapFab();
  toggleHud();
}
function endDrag(e){
  if(!drag)return;
  var wasMove=drag.moved;
  var fired=longPressFired;
  drag=null;
  hudScope.clearTimeout(longPressTimer);longPressTimer=null;
  fabSuppressMouseUntil=Date.now()+1500;
  if(wasMove){
    fabSkipClick=true;
    try{hudClampFab(btn);}catch(err){}
    try{ localStorage.setItem('pkm_fab_pos', JSON.stringify({l:parseFloat(btn.style.left), t:parseFloat(btn.style.top)})); }catch(err){}
    hudArmGestureShield(btn,750);
    if(e && e.cancelable){ e.preventDefault(); }
  }else if(fired){
    fabSkipClick=true;
    hudDisarmGestureShield();
  }else{
    fabSkipClick=false;
    hudArmGestureShield(btn,900);
    hideMapFab();
  }
}

  btn.addEventListener('touchstart', function(e){
    e.stopPropagation();
    fabTouchActive=true;
    fabTouchId=e.touches[0].identifier;
    startDrag(e.touches[0].clientX, e.touches[0].clientY);
  }, {passive:true});

  function hudFabTouch(e, arr){
    for(var i=0;i<arr.length;i++){ if(arr[i].identifier===fabTouchId) return arr[i]; }
    return null;
  }

  hudScope.listen(document.body,'touchmove', function(e){
    if(!fabTouchActive || !drag)return;
    var t=hudFabTouch(e, e.changedTouches)||hudFabTouch(e, e.touches);
    if(!t)return;
    if(e.cancelable){ e.preventDefault(); }
    moveDrag(t.clientX, t.clientY);
  }, {passive:false});

  hudScope.listen(document.body,'touchend', function(e){
    if(!fabTouchActive)return;
    if(!hudFabTouch(e, e.changedTouches))return;
    fabSuppressMouseUntil=Date.now()+750;
    fabTouchActive=false;
    endDrag(e);
  });

  hudScope.listen(document.body,'touchcancel', function(e){
    if(!fabTouchActive)return;
    if(!hudFabTouch(e, e.changedTouches))return;
    fabSuppressMouseUntil=Date.now()+750;
    fabTouchActive=false;
    drag=null;hudScope.clearTimeout(longPressTimer);longPressTimer=null;hideMapFab();
  });

  btn.addEventListener('mousedown', function(e){ e.stopPropagation();if(Date.now()<fabSuppressMouseUntil){if(e.cancelable)e.preventDefault();return;}startDrag(e.clientX,e.clientY); e.preventDefault(); });
  hudScope.listen(document,'mousemove', function(e){ if(Date.now()<fabSuppressMouseUntil)return; if(drag) moveDrag(e.clientX,e.clientY); });
  hudScope.listen(document,'mouseup', function(e){ if(Date.now()<fabSuppressMouseUntil)return; endDrag(e); });
  
  btn.addEventListener('click', function(e){
    if(e.cancelable)e.preventDefault();e.stopPropagation();try{e.stopImmediatePropagation();}catch(_e){}
    if(fabSkipClick){fabSkipClick=false;return;}
    fabToggleHud();
  });

  function hudFabIsHudTarget(t){
    try{ if(t && t.nodeType!==1) t=t.parentElement; }catch(_e){}
    return !!(t && t.closest && t.closest('#pkm-hud-btn,#pkm-hud-mapfab,#pkm-hud-win,#pkm-hud-inline,#pkm-hud-mask,#pkm-hud-close,.pkm-hud-overlay,.pkm-hud-page-overlay'));
  }
  function hudFabGuardActive(){
    return (drag!==null) || (Date.now()<fabSuppressMouseUntil);
  }
  hudScope.listen(document,'mousedown',function(e){
    if(!hudFabGuardActive())return;
    if(hudFabIsHudTarget(e.target))return;
    if(e.cancelable)e.preventDefault();
  },true);
  hudScope.listen(document,'focusin',function(e){
    if(pkHudIntentFocus)return;
    if(!hudFabGuardActive())return;
    if(hudFabIsHudTarget(e.target))return;
    try{ var ft=e.target; if(ft && typeof ft.blur==='function') ft.blur(); }catch(_e2){}
  },true);

  mask.addEventListener('click', function(e){if(e.cancelable)e.preventDefault();e.stopPropagation();hudArmGestureShield(mask,700);closeHud();});
  close.addEventListener('click', function(e){ if(e.cancelable)e.preventDefault();e.stopPropagation();hudArmGestureShield(close,700);closeHud(); });

  
  try{
    var _repos=function(){
  try{
    var vp3=vpSize();
    var _l=parseFloat(btn.style.left), _t=parseFloat(btn.style.top);
    if(isNaN(_l)) _l=vp3.w-size-edge;
    if(isNaN(_t)) _t=vp3.oy+vp3.h-140-size;
    var _maxL=Math.max(0, vp3.w-size), _maxT=Math.max(0, vp3.h-size);
    btn.style.left=Math.max(0, Math.min(_l, _maxL))+'px';
    btn.style.top=Math.max(0, Math.min(_t, _maxT))+'px';
    if(win.classList.contains('open')){ centerWin(); }
  }catch(e){}
};
    var vv=WIN.visualViewport||window.visualViewport;
    if(vv){
      hudScope.listen(vv,'resize', _repos);
      hudScope.listen(vv,'scroll', _repos);
    }
    hudScope.listen(WIN,'resize', _repos);
  }catch(e){}
}

var pkmInlineAnchorMes=null, pkmLastRenderedSnap='';
function restoreInlineTabs(activeTab){
  try{
    var tabs=document.querySelectorAll('#pkm-hud-inline .tab-btn');
    for(var i=0;i<tabs.length;i++){tabs[i].classList.toggle('active',tabs[i].getAttribute('data-tab')===activeTab);}
    var panels=document.querySelectorAll('#pkm-hud-inline .tab-panel');
    for(var j=0;j<panels.length;j++){panels[j].classList.toggle('active',panels[j].id==='tab-'+activeTab);}
  }catch(e){}
}
function renderStatusBar(force){
  try{
    if(winMode==='1')return;
    var activeTab='1';
    var at=document.querySelector('#pkm-hud-inline .tab-btn.active');
    if(at)activeTab=at.getAttribute('data-tab')||'1';
    var pageWasOpen=false, pageKey=currentPageKey;
    if(pageOverlay&&pageOverlay.classList.contains('open'))pageWasOpen=true;
    var all=document.querySelectorAll('.mes[is_user="false"]');
    if(!all.length){all=document.querySelectorAll('.mes');}
    if(!all.length)return;
    var last=all[all.length-1];
    var inline=document.getElementById('pkm-hud-inline');
    var anchoredOk=!!(inline&&inline.isConnected&&last===pkmInlineAnchorMes);

    if(!anchoredOk){
      
      pkmLastRenderedSnap=pkmStateSnapshot(stat_data);
      document.querySelectorAll('#pkm-hud-inline').forEach(function(el){el.remove();});
      if(pageOverlay&&pageOverlay.parentElement===document.body){try{pageOverlay.remove();}catch(e){}}
      var ic=document.createElement('div');
      ic.id='pkm-hud-inline';
      var textEl=last.querySelector('.mes_text');
      if(textEl){textEl.insertAdjacentElement('afterend',ic);}else{last.appendChild(ic);}
      pkmInlineAnchorMes=last;
      render();
      restoreInlineTabs(activeTab);
      if(pageWasOpen&&pageKey){try{openPage(pageKey);}catch(e){}}
      return;
    }

    
    var snap=pkmStateSnapshot(stat_data);
    if(!force && snap===pkmLastRenderedSnap)return;
    pkmLastRenderedSnap=snap;
    render();
    restoreInlineTabs(activeTab);
  }catch(e){}
}
var pkmAutoRefreshBound=false;
var pkmEventSourceActive=false;
function pkRefreshData(){
  try{
    var next=loadStatData();
    if(next){stat_data=next;hudExternalStateChanged();hudEnsureLocationIndex();}
  }catch(e){hudDiagError('pkRefreshData load',e);}
  try{if(winMode==='1')ensureHud();}catch(e){hudDiagError('pkRefreshData ensureHud',e);}
  try{recordSeen();}catch(e){}
  try{renderStatusBar();}catch(e){hudDiagError('statusbar render',e);}
  try{
    var hw=document.getElementById('pkm-hud-win');
    var ov=document.querySelector('.overlay.open,.page-overlay.open');
    if(hw&&hw.classList.contains('open')&&!ov){render();resizeFrame();}
  }catch(e){hudDiagError('HUD partial refresh',e);}
}
function pkBindAutoRefresh(){
  if(pkmAutoRefreshBound)return pkmEventSourceActive;
  pkmAutoRefreshBound=true;
  try{
    var w=WIN,ST=w&&w.SillyTavern,ctx=ST&&ST.getContext?ST.getContext():null;
    if(!(ctx&&ctx.eventSource&&typeof ctx.eventSource.on==='function'))return false;
    var evs=[
      (ctx.eventTypes&&ctx.eventTypes.MESSAGE_RECEIVED)||'message_received',
      (ctx.eventTypes&&ctx.eventTypes.MESSAGE_SENT)||'message_sent',
      (ctx.eventTypes&&ctx.eventTypes.CHAT_CHANGED)||'chat_changed',
      (ctx.eventTypes&&ctx.eventTypes.MESSAGE_SWIPED)||'message_swiped'
    ].filter(Boolean);
    var handler=function(){bw2ScheduleRefresh();};
    evs.forEach(function(ev){hudScope.emitter(ctx.eventSource,ev,handler);});
    pkmEventSourceActive=evs.length>0;
    if(pkmEventSourceActive)hudDiagEvent('auto-sync','SillyTavern eventSource 主通道');
    return pkmEventSourceActive;
  }catch(e){hudDiagError('auto-refresh eventSource',e);return false;}
}
var pkmAutoSnap='';
var pkmAutoTimer=null;
var pkmAutoPending=false;
var pkmAutoChatObserver=null;
var pkmLastLocalWrite=0;
function pkmStateSnapshot(d){
  try{var raw=JSON.stringify(d||{}),h=2166136261;for(var i=0;i<raw.length;i++){h^=raw.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(16)+':'+raw.length;}catch(e){return '';}
}
function pkmAutoCheck(){
  try{
    try{if(winMode==='1')ensureHud();}catch(e){}
    if(hudPendingActions&&hudPendingActions.length)return;
    if((Date.now()-pkmLastLocalWrite)<1500)return;
    var ov=document.querySelector('.overlay.open,.page-overlay.open');if(ov)return;
    var d=loadStatDataLight();if(!d)return;
    var snap=pkmStateSnapshot(d);if(snap===pkmAutoSnap)return;
    pkmAutoSnap=snap;stat_data=d;hudExternalStateChanged();hudEnsureLocationIndex();
    try{recordSeen();}catch(e){}
    try{renderStatusBar();}catch(e){}
    try{var hw=document.getElementById('pkm-hud-win');if(hw&&hw.classList.contains('open')){render();resizeFrame();}}catch(e){}
    hudDiagInc('autoSyncUpdates');
  }catch(e){hudDiagError('auto-sync check',e);}
}
function pkmAutoSchedule(){
  if(pkmAutoPending)return;
  pkmAutoPending=true;
  hudScope.setTimeout(function(){pkmAutoPending=false;pkmAutoCheck();},550);
}
function pkmStartAutoUpdate(){
  pkmAutoSnap=pkmStateSnapshot(stat_data);
  
  var hasEvents=pkmEventSourceActive||pkBindAutoRefresh();
  if(!hasEvents){
    try{
      if(window.MutationObserver){
        var root=WIN.document.querySelector('#chat,.chat,.mes_block')||document.querySelector('#chat,.chat,.mes_block')||WIN.document.body||document.body;
        pkmAutoChatObserver=hudScope.observe(new MutationObserver(function(muts){
          for(var i=0;i<muts.length;i++){
            var m=muts[i];if(m.type!=='childList'||!m.addedNodes||!m.addedNodes.length)continue;
            for(var j=0;j<m.addedNodes.length;j++){
              var n=m.addedNodes[j];if(!n||n.nodeType!==1)continue;
              if((n.matches&&n.matches('.mes'))||(n.querySelector&&n.querySelector('.mes'))){pkmAutoSchedule();return;}
            }
          }
        }));
        pkmAutoChatObserver.observe(root,{subtree:true,childList:true});
        hudDiagEvent('auto-sync','局部聊天 MutationObserver fallback');
      }
    }catch(e){hudDiagError('auto-sync observer',e);}
  }
  try{
    var sb=WIN.document.querySelector('.statusbar-data-source')||document.querySelector('.statusbar-data-source');
    if(sb){var h=function(){pkmAutoSchedule();};hudScope.listen(sb,'input',h);hudScope.listen(sb,'change',h);}
  }catch(e){}
  if(!pkmAutoTimer){
    var cadence=hasEvents?30000:8000;
    pkmAutoTimer=hudScope.setInterval(function(){try{if(WIN.document.visibilityState==='hidden')return;}catch(e){}pkmAutoCheck();},cadence);
  }
}
function safeRender(){

  try{pkBindAutoRefresh();}catch(e){}
  try{pkmStartAutoUpdate();}catch(e){}
  try{recordSeen();}catch(e){}
  try{var _udc=WIN['updateDexContext'];if(typeof _udc==='function')_udc();}catch(e){}
  try{renderStatusBar();}catch(e){}
  hudScope.setTimeout(pkRefreshData,1200);
  hudScope.setTimeout(pkRefreshData,3000);
  try{preloadBadges();}catch(e){}
  if(winMode==='1'){try{render();}catch(e){fail('HUD 渲染失败：'+e.message);}try{resizeFrame();}catch(e){}}
  try{
    if(window.ResizeObserver){
      var _ro=hudScope.observe(new window.ResizeObserver(function(){if(window._roRaf)return;window._roRaf=requestAnimationFrame(function(){window._roRaf=0;resizeFrame();});}));
      var _hud=document.querySelector('.hud');if(_hud)_ro.observe(_hud);
    }
    hudScope.setTimeout(resizeFrame,300);hudScope.setTimeout(resizeFrame,1200);
  }catch(e){hudDiagError('ResizeObserver',e);}
}

function showErr(msg){
  try{
    if(msg && !/pkm|hud|poke|宝可梦|resolve|render|diy|badge|stat_data|teamHTML|trainerHTML|cardHTML|battleHTML/i.test(String(msg))){
      return;
    }
    var a=document.getElementById('pkm-hud-win')||document.body;
    var d2=document.createElement('div');
    d2.style.cssText='position:fixed;left:0;right:0;bottom:0;z-index:99999;background:#400;color:#fcc;padding:8px 12px;font-family:monospace;font-size:12px;line-height:1.4;white-space:pre-wrap';
    d2.textContent='⚠️ '+msg+'（点击关闭）';
    d2.onclick=function(){try{d2.parentNode&&d2.parentNode.removeChild(d2);}catch(e3){}};
    a.appendChild(d2);
  }catch(e2){}
}
hudScope.listen(WIN,'error',function(e){var m=String(e.message||'未知错误');if(m.indexOf('ResizeObserver')>=0||m.indexOf('EmbeddedRuntimeManager')>=0||m.indexOf('slot not found')>=0)return;hudDiagError('window.error',new Error(m));showErr(m);});
hudScope.listen(WIN,'unhandledrejection',function(e){var m=String((e.reason&&e.reason.message)||e.reason||'未处理的Promise错误');hudDiagError('unhandledrejection',new Error(m));showErr(m);});

try{ensureHud();}catch(e){}
try{if(boot&&typeof boot.coreReady==='function')boot.coreReady();}catch(e){}
(function(){
  var done=false,finish=function(){if(done)return;done=true;safeRender();try{if(boot&&typeof boot.ready==='function')boot.ready();}catch(e){}};
  try{Promise.race([Promise.resolve(hudCacheInitPromise),new Promise(function(res){hudScope.setTimeout(res,250);})]).then(finish,finish);}catch(e){finish();}
})();
}

runPkmHud({coreReady:function(){},ready:function(){},reportError:function(){}});
})();
