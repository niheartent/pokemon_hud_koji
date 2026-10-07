/* Compose our owned view components; core handlers remain the behavior contract. */
var swshBaseViews={teamHTML:teamHTML,trainerHTML:trainerHTML,quickHTML:quickHTML,homeFoldHTML:homeFoldHTML,menuHTML:menuHTML,worldHTML:worldHTML,cmdPanelHTML:cmdPanelHTML,settingsHTML:settingsHTML,render:render,pkCheckUpdate:pkCheckUpdate,pkDoUpdate:pkDoUpdate,pkRepair:pkRepair,showNoticeModal:showNoticeModal,pkSetUpdateMsg:pkSetUpdateMsg};
// Newer cores have a hue/lightness engine; the two fixed palettes replace it.
if(typeof pkThemeApplyScheme==='function')pkThemeApplyScheme=function(){};
function swshDOM(html){var el=document.createElement('div');el.innerHTML=html;return el;}
// One last result per renderer: bounded, in-memory, and owned base generation still runs.
var swshDecorationCache=Object.create(null);
function swshDecorate(nativeFn,decorate,args,context,key,extra){
  var html=nativeFn.apply(context,args);
  try{var dependency=extra?extra():'';
    var cached=key&&swshDecorationCache[key];
    if(cached&&cached.input===html&&cached.dependency===dependency)return cached.output;
    var output=decorate(html);
    if(key)swshDecorationCache[key]={input:html,dependency:dependency,output:output};
    return output;
  }catch(e){hudDiagError('剑盾界面装饰',e);return html;}
}
function swshTeamDependency(){var current=buildCards(),lead=current.find(function(c){return !c.empty;});return JSON.stringify(current)+'|'+swshPartyFocusHTML(lead);}
function swshReplaceIcon(el,key,size){if(!el)return;var icon=swshIcon(key,size);if(icon)el.innerHTML=icon;}
function swshBaseViewsTeam(html){
  var dom=swshDOM(html),grid=dom.querySelector('.grid'),rows=Array.from(dom.querySelectorAll('.card-frame[data-slot],.empty-frame'));
  if(!grid||!rows.length)return html;
  var cards=buildCards(),occupied=cards.filter(function(c){return !c.empty;}),lead=occupied[0];
  var shell=swshDOM('<section class="swsh-team grid"><div class="swsh-party-heading"><span class="swsh-ball-mark">◉</span><strong>POKÉMON</strong><span>'+occupied.length+' / '+cards.length+'</span></div><div class="swsh-party-stage"><div class="swsh-party-list"></div><div class="swsh-party-preview"><div class="swsh-party-focus">'+swshPartyFocusHTML(lead)+'</div><div class="swsh-preview-controls"><button type="button" data-party-step="-1" aria-label="预览上一只宝可梦">'+swshIcon('chevron',20)+'</button>'+swshPartyBallHTML(lead)+'<button type="button" data-party-step="1" aria-label="预览下一只宝可梦">'+swshIcon('chevron',20)+'</button></div></div></div><div class="swsh-party-foot">选择宝可梦查看详情</div></section>');
  var section=shell.firstElementChild,list=section.querySelector('.swsh-party-list');
  Array.from(grid.attributes).forEach(function(a){if(a.name==='class')a.value.split(/\s+/).filter(Boolean).forEach(function(c){section.classList.add(c);});else section.setAttribute(a.name,a.value);});
  rows.forEach(function(row,i){var card=cards.find(function(c){return String(c.slot)===row.getAttribute('data-slot');}),gender=row.querySelector('.gender-sym'),side=row.querySelector('.gender-side');if(card&&gender&&side){side.querySelectorAll('.mega-ic').forEach(function(icon){icon.remove();});gender.insertAdjacentHTML('beforebegin',swshPartyMarksHTML(card));}row.querySelectorAll('.card-bg-svg').forEach(function(svg){svg.remove();});if(cards[i])row.setAttribute('data-swsh-party-slot',cards[i].slot);if(lead&&String(lead.slot)===row.getAttribute('data-slot'))row.classList.add('swsh-selected');list.appendChild(row);});
  if(!lead)section.querySelectorAll('[data-party-step]').forEach(function(button){button.disabled=true;});
  // Keep additional native content, including annotations added to our own templates.
  grid.querySelectorAll('.col').forEach(function(col){while(col.firstChild)grid.insertBefore(col.firstChild,col);col.remove();});
  if(grid.innerHTML.trim()){var extra=document.createElement('div');extra.className='swsh-native-extra';while(grid.firstChild)extra.appendChild(grid.firstChild);section.appendChild(extra);}
  grid.replaceWith(section);return dom.innerHTML;
}
function swshBaseViewsTrainer(html){
  var dom=swshDOM(html),frame=dom.querySelector('.trainer-frame'),inner=frame&&frame.querySelector('.info-inner');if(!inner)return html;
  var rows=Array.from(inner.children).filter(function(el){return el.classList.contains('info-row');});
  function take(label){return rows.find(function(row){var key=row.querySelector('.k');return key&&key.textContent.trim()===label;});}
  var name=take('名字'),money=take('金钱'),badges=inner.querySelector('#badge-entry'),title=inner.querySelector('.info-title');if(!name||!money||!title)return html;
  var shell=swshDOM('<section class="swsh-trainer trainer-frame"><div class="swsh-location"><span class="swsh-location-dot"></span><span class="swsh-place"></span><span class="swsh-time"></span></div><div class="swsh-trainer-main"><div class="swsh-trainer-id"><span class="swsh-eyebrow">TRAINER</span><strong></strong><span class="swsh-vital"></span></div><div class="swsh-trainer-tools"><span class="swsh-money"></span></div></div><div class="swsh-badges"></div><details class="swsh-trainer-details"><summary>训练家资料 <span>身份 · 声望 · 气场 · 可命令等级</span></summary><div class="swsh-trainer-details-body"></div></details></section>'),section=shell.firstElementChild;
  var nameValue=name.querySelector('.v');nameValue.querySelectorAll('.heart').forEach(function(heart){section.querySelector('.swsh-vital').appendChild(heart);});section.querySelector('strong').innerHTML=nameValue.innerHTML;name.remove();
  section.querySelector('.swsh-money').innerHTML=money.querySelector('.v').innerHTML;money.remove();
  var refresh=title.querySelector('.hud-refresh-btn');if(refresh)section.querySelector('.swsh-trainer-tools').prepend(refresh);
  var env=title.querySelector('.tr-env'),parts=env?Array.from(env.children):[];section.querySelector('.swsh-place').textContent=parts[0]?parts[0].textContent.replace(/^📍\s*/,''):'地点未记录';section.querySelector('.swsh-time').textContent=parts[1]?parts[1].textContent.replace(/^🕐\s*/,''):'时间未记录';
  if(badges){section.querySelector('.swsh-badges').appendChild(badges);swshReplaceIcon(badges.querySelector('[data-badge-open]'),'badge',16);var badgeButton=badges.querySelector('[data-badge-open]');if(badgeButton)badgeButton.appendChild(document.createTextNode(' 查看'));}
  // An owned trainer field remains visible in the expandable details.
  title.remove();while(inner.firstChild)section.querySelector('.swsh-trainer-details-body').appendChild(inner.firstChild);
  Array.from(frame.attributes).forEach(function(a){if(a.name!=='class')section.setAttribute(a.name,a.value);});frame.replaceWith(section);return dom.innerHTML;
}
function swshBaseViewsMenu(html){var dom=swshDOM(html);dom.querySelectorAll('.menu-item[data-page]').forEach(function(item){swshReplaceIcon(item.querySelector('.menu-icon-wrap'),item.getAttribute('data-page'),getIconSize('m-'+item.getAttribute('data-page')));});return dom.innerHTML;}
function swshBaseViewsQuick(html){var dom=swshDOM(html);dom.querySelectorAll('.quick-chip[data-page]').forEach(function(item){var key=item.getAttribute('data-page'),icon=swshIcon(key,getIconSize('q-'+key));if(!icon)return;var old=item.querySelector('img,.quick-emoji');if(old){var span=document.createElement('span');span.className='swsh-quick-icon';span.innerHTML=icon;old.replaceWith(span);}});return dom.innerHTML;}
function swshBaseViewsFold(html){var dom=swshDOM(html);dom.querySelectorAll('[data-fold]').forEach(function(head){var key=head.getAttribute('data-fold'),label=head.firstElementChild,icon=key==='bagfold'?'bag':key==='relfold'?'rel':'';if(label&&icon){label.classList.add('swsh-fold-label');var tools=Array.from(label.querySelectorAll('button'));tools.forEach(function(button){button.remove();});var text=label.textContent.replace(/^[💬\s]+/u,'');label.innerHTML=swshIcon(icon,20);label.appendChild(document.createTextNode(text));tools.forEach(function(button){label.appendChild(button);});}});return dom.innerHTML;}
function swshBaseViewsWorld(html){var dom=swshDOM(html),keys=['pin','news','globe'];dom.querySelectorAll('.event-type').forEach(function(label){var text=label.textContent,key=/附近遭遇/.test(text)?keys[0]:/地区新闻/.test(text)?keys[1]:/区域动态/.test(text)?keys[2]:'';if(key){label.innerHTML=swshIcon(key,18);label.appendChild(document.createTextNode(text.replace(/^[📍📰🌍\s]+/u,'')));}});return dom.innerHTML;}
function swshDecorateCommands(scope){
  var keys=['training','dodge','initiative','guard','revive','mega','clash'];
  scope.querySelectorAll('.cmd-panel .cmd-btn').forEach(function(button,i){if(button.querySelector('.swsh-cmd-label'))return;var text=button.textContent.replace(/^[^\p{L}\p{N}]+/u,'');button.innerHTML='<span class="swsh-cmd-icon">'+swshIcon(keys[i]||'command',24)+'</span><span class="swsh-cmd-label">'+esc(text)+'</span>';});
  scope.querySelectorAll('.cmd-panel .cmd-tip').forEach(function(button){if(!button.querySelector('svg'))swshReplaceIcon(button,'help',18);});
  scope.querySelectorAll('.cmd-panel summary').forEach(function(summary){if(!summary.querySelector('svg')){var text=summary.textContent.replace(/^⌨️\s*/,'');summary.innerHTML=swshIcon('command',22)+'<span>'+esc(text)+'</span>';}});
}
function swshBaseViewsCommands(html){var dom=swshDOM(html);swshDecorateCommands(dom);return dom.innerHTML;}
function swshUpdateLogHTML(){
  var downloaded=!!(pkLatestContent&&pkLatestVer),version=downloaded?pkLatestVer:PK_VER;
  var notice=downloaded?pkLatestNotice:PK_BEAUTY_PACKAGE.coreNotice;
  return '<details class="swsh-update-log" open><summary>上游更新日志 · v'+esc(version)+'</summary><div class="swsh-update-log-text">'+esc(notice||'上游未提供该版本的更新日志。')+'</div></details><details class="swsh-update-log"><summary>剑盾美化日志 · v'+esc(PK_BEAUTY_VER)+'</summary><div class="swsh-update-log-text">'+esc(PK_BEAUTY_PACKAGE.beautyNotice||'暂无美化版本日志。')+'</div></details>';
}
function swshRefreshUpdateLog(){
  document.querySelectorAll('[data-swsh-update-logs]').forEach(function(box){var html=swshUpdateLogHTML();if(box._swshUpdateLogHTML!==html){box.innerHTML=html;box._swshUpdateLogHTML=html;}});
}
function swshBaseViewsSettings(html){
  var dom=swshDOM(html),check=dom.querySelector('[data-pk-check-update]'),update=dom.querySelector('[data-pk-do-update]'),copy=dom.querySelector('[data-pk-show-content]');
  var settings=dom.querySelector('.info-inner');if(settings)settings.classList.add('swsh-settings');
  if(check&&update){update.textContent='⬆️ 更新已验证的美化版';if(copy)copy.textContent='📋 复制已合成的美化版';var repair=dom.querySelector('[data-pk-repair]');if(repair)repair.remove();
    var box=check.closest('.set-opts');if(box){var row=swshDOM('<div class="info-row"><span class="k">HUD 美化版</span><span class="v">v'+PK_BEAUTY_VER+'</span></div><div class="dim" style="font-size:.72rem">先检查上游接口，通过后才可安装。普通文案、排版和功能改动保留。</div>');var first=box.querySelector('.info-row');while(row.firstChild)box.insertBefore(row.firstChild,first?first.nextSibling:check);}
    if(box){var logs=document.createElement('div');logs.setAttribute('data-swsh-update-logs','');logs.innerHTML=swshUpdateLogHTML();box.appendChild(logs);}
  }
  var toggle=dom.querySelector('[data-toggle="winmode"]'),mode=toggle&&toggle.closest('.set-opts');if(mode){var title=mode.previousElementSibling,extras=swshDOM('<div class="set-title">界面配色</div><div class="set-opts"><label class="set-opt"><input type="checkbox" data-toggle="swsh-dark"'+(swshDarkTheme?' checked':'')+'>暗色模式（关闭使用白天配色）</label></div><div class="set-title">HUD 宽度</div><div class="set-opts"><label class="swsh-width-control"><input type="range" data-swsh-hud-width aria-label="HUD 宽度" min="480" max="900" step="10" value="'+swshWidthDisplayValue()+'"><output data-swsh-hud-width-value>'+swshWidthDisplayValue()+' px</output></label><button type="button" class="act-btn" data-swsh-hud-width-reset>恢复默认宽度</button></div>');while(extras.firstChild)mode.parentNode.insertBefore(extras.firstChild,title||mode);}
  return dom.innerHTML;
}
teamHTML=function(){return swshDecorate(swshBaseViews.teamHTML,swshBaseViewsTeam,arguments,this,'team',swshTeamDependency);};
trainerHTML=function(){return swshDecorate(swshBaseViews.trainerHTML,swshBaseViewsTrainer,arguments,this,'trainer');};
menuHTML=function(){return swshDecorate(swshBaseViews.menuHTML,swshBaseViewsMenu,arguments,this,'menu');};
quickHTML=function(){return swshDecorate(swshBaseViews.quickHTML,swshBaseViewsQuick,arguments,this,'quick');};
homeFoldHTML=function(){return swshDecorate(swshBaseViews.homeFoldHTML,swshBaseViewsFold,arguments,this,'fold');};
worldHTML=function(){return swshDecorate(swshBaseViews.worldHTML,swshBaseViewsWorld,arguments,this,'world');};
cmdPanelHTML=function(){return swshDecorate(swshBaseViews.cmdPanelHTML,swshBaseViewsCommands,arguments,this,'commands');};
settingsHTML=function(){return swshDecorate(swshBaseViews.settingsHTML,swshBaseViewsSettings,arguments,this);};
// Guard only these owned panels, never Element.prototype or upstream source.
// Any live markup change invalidates the shortcut, including native interactions.
function swshGuardPanels(app){
  if(!app)return;
  var descriptor=Object.getOwnPropertyDescriptor(Element.prototype,'innerHTML');
  if(!descriptor||!descriptor.get||!descriptor.set)return;
  ['tab-1','tab-2','tab-3','tab-4'].forEach(function(id){
    var panel=app.querySelector('#'+id);if(!panel||panel._swshMarkupGuard)return;
    var lastInput=null,lastMarkup=null;
    try{Object.defineProperty(panel,'innerHTML',{configurable:true,get:function(){return descriptor.get.call(this);},set:function(value){
      if(typeof value==='string'){
        var live=descriptor.get.call(this);
        if(value===lastInput&&live===lastMarkup)return;
        if(live===value){lastInput=value;lastMarkup=live;return;}
      }
      descriptor.set.call(this,value);
      lastInput=typeof value==='string'?value:null;lastMarkup=descriptor.get.call(this);
    }});panel._swshMarkupGuard=true;}catch(e){hudDiagError('剑盾刷新优化',e);}
  });
}
function swshCurrentApp(){return document.getElementById(winMode==='0'?'pkm-hud-inline':'pkm-hud-slot');}
function swshBindAdapter(app){
  if(!app||app._swshAdapterBound)return;app._swshAdapterBound=true;
  hudScope.listen(app,'mouseover',function(e){var target=e.target.nodeType===1?e.target:e.target.parentElement,row=target&&target.closest('.swsh-party-list .card-frame[data-slot]');if(row)swshSelectPartyCard(app,row);});
  hudScope.listen(app,'click',function(e){var copy=e.target.closest('[data-pk-show-content],[data-pk-copy-content],[data-pk-copy-content-close]');if(copy){if(!pkBeautyPreparedContent||pkBeautyPreparedVer!==pkLatestVer){e.preventDefault();e.stopImmediatePropagation();pkSetUpdateMsg('请先检查美化兼容性，再复制已合成的脚本');return;}pkLatestContent=pkBeautyPreparedContent;}var step=e.target.closest('[data-party-step]');if(step){e.preventDefault();e.stopImmediatePropagation();swshStepPartyCard(app,step);return;}if(e.target.closest('[data-swsh-hud-width-reset]')){swshResetHudWidth();var slider=app.querySelector('[data-swsh-hud-width]'),output=app.querySelector('[data-swsh-hud-width-value]');if(slider)slider.value=swshWidthDisplayValue();if(output)output.textContent=swshWidthDisplayValue()+' px';}},true);
  hudScope.listen(app,'change',function(e){if(e.target.matches('[data-toggle="swsh-dark"]')){swshDarkTheme=e.target.checked;try{localStorage.setItem('pk_swsh_dark_theme',swshDarkTheme?'1':'0');}catch(_){}swshApplyTheme(app);}});
  hudScope.listen(app,'input',function(e){if(e.target.matches('[data-swsh-hud-width]')){swshSetHudWidth(e.target.value);var output=app.querySelector('[data-swsh-hud-width-value]');if(output)output.textContent=swshHudWidth+' px';}});
  var observer=hudScope.observe(new MutationObserver(function(records){
    var relevant=records.some(function(record){var target=record.target.nodeType===1?record.target:record.target.parentElement;
      if(target&&target.closest('.cmd-panel'))return true;
      return Array.prototype.some.call(record.addedNodes,function(node){return node.nodeType===1&&(node.matches('.cmd-panel')||node.querySelector('.cmd-panel'));});
    });if(relevant)swshDecorateCommands(app);
  }));observer.observe(app,{childList:true,subtree:true,characterData:true});
}
render=function(){swshGuardPanels(swshCurrentApp());var result=swshBaseViews.render.apply(this,arguments),app=swshCurrentApp();swshGuardPanels(app);swshApplyTheme(app);swshApplyWidth();swshBindAdapter(app);return result;};
pkSetUpdateMsg=function(){var result=swshBaseViews.pkSetUpdateMsg.apply(this,arguments);swshRefreshUpdateLog();return result;};
pkCheckUpdate=function(){pkBeautyPreparedContent=null;pkBeautyPreparedVer=null;document.querySelectorAll('[data-pk-show-content]').forEach(function(button){button.style.display='none';});return swshBaseViews.pkCheckUpdate.apply(this,arguments);};
showNoticeModal=function(ver,notice){
  if(pkLatestContent&&pkLatestVer===ver){var button=document.querySelector('[data-pk-do-update]');if(button)button.style.display='none';try{pkBeautyPreparedContent=pkBeautyBuildRemote(pkLatestContent);pkBeautyPreparedVer=ver;pkSetUpdateMsg('✅ 原版 v'+ver+' 兼容美化层，可点击「更新已验证的美化版」');if(button)button.style.display='block';}catch(e){pkBeautyPreparedContent=null;pkBeautyPreparedVer=null;pkSetUpdateMsg('❌ 不兼容，未更新：'+e.message);}return;}
  return swshBaseViews.showNoticeModal.apply(this,arguments);
};
pkDoUpdate=function(){
  if(!pkBeautyPreparedContent||pkBeautyPreparedVer!==pkLatestVer){pkSetUpdateMsg('请先检查兼容性，通过后才能更新');return;}
  pkLatestContent=pkBeautyPreparedContent;return swshBaseViews.pkDoUpdate.apply(this,arguments);
};
pkRepair=function(){pkSetUpdateMsg('请先使用「检查更新」验证美化兼容性，再安装已合成版本。');};

/* Detached operation pages receive the owned palette when they change hosts. */
var swshBasePagePopout=pageOverlayPopout;
pageOverlayPopout=function(on){var result=swshBasePagePopout(on);swshApplyTheme(swshCurrentApp());return result;};
