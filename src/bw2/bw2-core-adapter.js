/* Shared by local builds and browser update checks. Parse only when composing a core. */
function bw2AdaptCore(original,acorn,config){
original=original.replace(/\r\n/g,'\n');
let code=original;const patches=[];
const ast=acorn.parse(original,{ecmaVersion:'latest'}),functions={};let baseCss='';
function walk(n){if(!n||!n.type)return;if(n.type==='FunctionDeclaration')functions[n.id.name]=original.slice(n.start,n.end);for(const v of Object.values(n))if(Array.isArray(v))v.forEach(walk);else if(v&&v.type)walk(v);}walk(ast);
function replace(oldText,newText,record=true){if(code.split(oldText).length!==2)throw new Error('Missing/ambiguous anchor: '+oldText.slice(0,75));code=code.replace(oldText,function(){return newText;});if(record)patches.push([oldText,newText]);}
function replaceFunction(name,newText){if(!functions[name])throw new Error('Missing function '+name);replace(functions[name],newText);}
function fragment(source,oldText,newText){if(source.split(oldText).length!==2)throw new Error('Missing/ambiguous function hook: '+oldText.slice(0,75));return source.replace(oldText,function(){return newText;});}
const version=config.version,core=code.match(/var PK_VER='([^']+)'/)[1];
// Templates and CSS have already been supplied by the owned presentation boundary.
baseCss=config.nativeCss;
replace("var PK_VER='"+core+"';","var PK_VER='"+core+"';\nvar PK_BEAUTY_VER='"+version+"';",false);
// A newer manually imported UI must not delegate to an older UI's cached core.
replace("var PK_RUNTIME_DB='pk_hud_runtime_v1';","var PK_RUNTIME_DB='pk_hud_koji_bw2_runtime_v1';");
replaceFunction('trainerHTML','function trainerHTML(){return bw2TrainerHTML();}');
replaceFunction('menuHTML','function menuHTML(){return bw2MenuHTML();}');
const originalMenu=original.match(/var MENU=\[[\s\S]*?\];/)[0];
const consoleMenu=[['settings','设置','⚙️'],['badge','徽章盒','🏅'],['pokedex','图鉴','📖'],['breeding','繁育','🥚'],['bag','背包','🎒'],['box','盒子','📦'],['map','地图','🗺️'],['typechart','克制表','⚡']].map(([key,label,emoji])=>({key,label,emoji,img:''}));
replace(originalMenu,'var MENU='+JSON.stringify(consoleMenu)+';');
replaceFunction('pageOverlayPopout','function pageOverlayPopout(on){return bw2PagePopout(on);}');
replaceFunction('hudSyncModalIsolation',functions.hudSyncModalIsolation.replace('function hudSyncModalIsolation()','function bw2NativeModalIsolation()')+'\nfunction hudSyncModalIsolation(){return bw2PageIsolation();}');
replaceFunction('actionHTML','function actionHTML(raw,key){return bw2ActionHTML(raw,key);}');
replaceFunction('breedingHTML','function breedingHTML(){return bw2BreedingHTML();}');
replaceFunction('boxHTML','function boxHTML(){return bw2BoxHTML();}');
let openPage=fragment(functions.openPage,'  currentPageKey=key;','  bw2PreparePage(key);currentPageKey=key;');
openPage=fragment(openPage,"pageOverlayPopout(key==='map');","pageOverlayPopout(key==='map'||key==='typechart');");
openPage=fragment(openPage,"if(key==='map')hudSyncMapPopoutHeight();","if(key==='map')hudSyncMapPopoutHeight();bw2SyncPageScreens(pageOverlayHost.parentElement);hudResolvePkidbImages(pageOverlay);");
replaceFunction('openPage',openPage);
replaceFunction('pageHTML',fragment(functions.pageHTML,"'<div class=\"page\"><div class=\"page-head\">'+mapCtl+","'<div class=\"page\"><div class=\"page-head\"><strong class=\"bw2-page-title\">'+esc(title)+'</strong>'+mapCtl+"));
replaceFunction('bindPageInteractions',fragment(functions.bindPageInteractions,"'.box-cell[data-slot]'","'.box-cell[data-slot],.bw2-box-card[data-slot]'"));
replaceFunction('resizeFrame','function resizeFrame(){return bw2ResizeConsole();}');
replaceFunction('applyInlineH','function applyInlineH(){return bw2ResizeConsole();}');
replaceFunction('openInlineH','function openInlineH(){return bw2OpenScale();}');
replaceFunction('inlineHStep','function inlineHStep(d){return bw2ScaleStep(d/2);}');
replaceFunction('inlineHApply','function inlineHApply(){return bw2ScaleApply(false);}');
replaceFunction('inlineHReset','function inlineHReset(){return bw2ScaleApply(true);}');
replace("var inlineOpt=(winMode==='0')?'<label class=\"set-opt\" style=\"cursor:default\">内嵌模式高度：<b>'+inlineH+'</b> px</label><button class=\"act-btn\" data-inline-h-open>📏 调整内嵌模式高度</button>':'';","var inlineOpt='<label class=\"set-opt\">界面缩放：<b>'+bw2ScalePercent+'</b> %</label><button class=\"act-btn\" data-inline-h-open>等比放大／缩小</button>';");
replaceFunction('detailHTML',functions.detailHTML.replace('function detailHTML(c)','function bw2LegacyDetailHTML(c)')+'\nfunction detailHTML(c){return bw2DetailHTML(c);}');
replaceFunction('refreshHudPanels','function refreshHudPanels(app){return bw2RefreshPanels(app);}');
let render=functions.render;
render=fragment(render,'  if(inline)applyInlineH(app);','  bw2BindUI(app);pkBeautyBindUpdateUI(app);');
render=fragment(render,'  pkThemeApplyScheme();','');
const layoutStart=render.indexOf('  app.innerHTML='),layoutEnd=render.indexOf('\nhudBindRefreshProgrammaticGuard(app);',layoutStart);
if(layoutStart<0||layoutEnd<0)throw new Error('Missing root layout assignment');
render=fragment(render,render.slice(layoutStart,layoutEnd),'  app.innerHTML=bw2ConsoleHTML();');
render=fragment(render,'  app._pkmOptimizedReady=true;','  app._pkmOptimizedReady=true;bw2RememberHome(app.querySelector("#tab-1"));app.querySelector("#tab-4")._bw2Signature=bw2PanelSignature("controls-1");bw2SyncConsoleLabels(app);');
render=render.replace("document.querySelector('.trainer-frame')","document.querySelector('.bw2-profile')");
replaceFunction('render',render);
replaceFunction('badgeClick',functions.badgeClick.replace("document.querySelector('.trainer-frame')","document.querySelector('.bw2-profile')").replace('tf.outerHTML=trainerHTML();hudResolvePkidbImages(document);','var panel=tf.parentElement;tf.outerHTML=trainerHTML();bw2Hydrate(panel);bw2RememberHome(panel);bw2RequestLayout();'));
replaceFunction('pkBindAutoRefresh',fragment(functions.pkBindAutoRefresh,"var handler=function(){hudScope.setTimeout(function(){pkRefreshData();try{pkmAutoSnap=pkmStateSnapshot(stat_data);}catch(e){}},350);};",'var handler=function(){bw2ScheduleRefresh();};'));
// Upstream already invalidates the location index by team/box fingerprint.
// Respect that dirty flag instead of cloning the full inventory on every event.
for(const name of ['pkRefreshData','pkmAutoCheck','hudRefresh']){
  if(!functions[name].includes('hudRebuildLocationIndex();'))throw new Error('Missing index hook: '+name);
  replaceFunction(name,functions[name].replaceAll('hudRebuildLocationIndex();','hudEnsureLocationIndex();'));
}
// Keep original check/compatible-install flow, using a BW2 package and isolated slot.
replace('<div class="set-title">脚本更新</div>','<div class="set-title">黑白2版与原版核心更新</div>');
replace('<button class="act-btn" data-pk-do-update style="display:none">⬆️ 更新到最新版</button><button class="act-btn" data-pk-show-content style="display:none">📋 复制脚本内容</button><button class="act-btn" data-pk-repair>🔧 修复（重新下载安装最新脚本）</button>','<button class="act-btn" data-pk-do-update style="display:none">更新已验证的黑白2版</button><button class="act-btn" data-pk-show-content style="display:none">复制已合成的黑白2版</button><div class="dim">黑白2 UI v'+version+' · 先检查兼容，通过后才能更新。</div>');
replace('<button class="act-btn" data-notice-update>⬆️ 立即更新</button>','<button class="act-btn" data-close>知道了</button>');
replaceFunction('pkCheckUpdate','function pkCheckUpdate(){return pkBeautyCheckUpdate(false);}');
replaceFunction('pkAutoCheckUpdate','function pkAutoCheckUpdate(){return pkBeautyCheckUpdate(true);}');
replaceFunction('pkDoUpdate','function pkDoUpdate(){return pkBeautyDoUpdate();}');
replaceFunction('pkRepair',"function pkRepair(){pkSetUpdateMsg('请先检查黑白2兼容性');}");
return {code:code,patches:patches,functions:functions,baseCss:baseCss,consoleMenu:consoleMenu,core:core};
}
if(typeof module!=='undefined'&&module.exports)module.exports=bw2AdaptCore;
