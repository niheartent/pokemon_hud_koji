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
  var holder=document.createElement('div');holder.innerHTML=bw2LegacyDetailHTML(c);
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
    '<div class="bw2-detail-types" aria-label="精灵属性">'+kojiDetailTypesHTML(c.attr1,c.attr2)+'</div><div class="bw2-detail-moves">'+moves+'</div><div class="bw2-move-actions'+(more?' has-more':'')+'">'+boxAction+more+'</div>'+
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
function bw2Hydrate(root){bw2SyncMoveColors(root);hudBindRefreshProgrammaticGuard(root);if(typeof pkImgFix==='function')pkImgFix(root);resolvePkmImgs(root);resolveItemImgs(root);resolveNearbyTypes(root);hudResolvePkidbImages(root);}
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
    var pageButton=target.closest('.bw2-menu-button[data-page]');
    if(pageButton&&bw2IsTogglePage(pageButton.getAttribute('data-page'))){e.preventDefault();e.stopImmediatePropagation();var key=pageButton.getAttribute('data-page');if(pageOverlay.classList.contains('open')&&pageOverlay.getAttribute('data-bw2-page-key')===key)bw2CloseInteractions();else openPage(key);bw2SyncPageButtons();return;}
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
  if(!card)return;var holder=document.createElement('div');holder.innerHTML=bw2LegacyDetailHTML(card);
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
  if(typeof pkImgFix==='function')pkImgFix(overlay);resolvePkmImgs(overlay);resolveMoveTypes(overlay);resolveItemImgs(overlay);hudResolvePkidbImages(overlay);
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
