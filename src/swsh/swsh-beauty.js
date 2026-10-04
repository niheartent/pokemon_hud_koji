/* HUD beauty layer, injected inside the upstream HUD scope. */
function swshPartyFocusHTML(c){return c?'<div class="swsh-focus-art">'+pkImgHTML(c.species,c.icon,c.shiny,'swsh-focus-sprite')+'</div>':'<div class="swsh-focus-empty">暂无同行宝可梦</div>';}
function swshPartyBallHTML(c){
  var name=c&&c.ball||'',label=name||'未记录捕获球种';
  return '<span class="swsh-preview-ball" role="img" aria-label="'+esc(label)+'" title="'+esc(label)+'" data-ball="'+esc(name)+'">'+(name?'<span class="swsh-capture-ball item-wiki" data-item="'+esc(name)+'" data-item-en="'+esc(c.ballEn||'')+'" data-cls="swsh-capture-ball">?</span>':'<span class="swsh-capture-ball">?</span>')+'</span>';
}

function swshSelectPartyCard(app,row){
  if(!row||row.classList.contains('swsh-selected'))return;
  var party=row.closest('.swsh-team');if(!party||!app.contains(party))return;
  var slot=Number(row.getAttribute('data-slot')),current=buildCards(),c=null;
  for(var i=0;i<current.length;i++){if(current[i].slot===slot){c=current[i];break;}}
  if(!c||c.empty)return;
  var selected=party.querySelector('.swsh-party-list .swsh-selected');if(selected)selected.classList.remove('swsh-selected');
  row.classList.add('swsh-selected');
  var focus=party.querySelector('.swsh-party-focus');if(!focus)return;
  focus.innerHTML=swshPartyFocusHTML(c);
  var ball=party.querySelector('.swsh-preview-ball');
  if(ball){ball.outerHTML=swshPartyBallHTML(c);resolveItemImgs(party.querySelector('.swsh-preview-ball'));}
  if(typeof pkImgFix==='function')pkImgFix(focus);
  resolvePkmImgs(focus);hudResolvePkidbImages(focus);
}
function swshStepPartyCard(app,button){
  var party=button.closest('.swsh-team');if(!party||!app.contains(party))return;
  var rows=Array.prototype.filter.call(party.querySelectorAll('.swsh-party-list .card-frame[data-slot]'),function(row){return !row.classList.contains('empty-frame');});
  if(!rows.length)return;
  var selected=party.querySelector('.swsh-party-list .swsh-selected'),index=rows.indexOf(selected);
  var step=Number(button.getAttribute('data-party-step'))<0?-1:1;
  swshSelectPartyCard(app,rows[(index+step+rows.length)%rows.length]);
}

var swshDarkTheme=true;
// Missing preference uses dark; an explicit day preference survives upgrades.
try{swshDarkTheme=localStorage.getItem('pk_swsh_dark_theme')!=='0';}catch(e){}
function swshApplyTheme(app){
  if(app)app.classList.toggle('swsh-dark',swshDarkTheme);
  var win=document.getElementById('pkm-hud-win');if(win)win.classList.toggle('swsh-dark',swshDarkTheme);
  var inline=document.getElementById('pkm-hud-inline');if(inline)inline.classList.toggle('swsh-dark',swshDarkTheme);
}

var swshHudWidth=null;
try{var swshSavedWidth=parseInt(localStorage.getItem('pk_swsh_hud_width'),10);if(swshSavedWidth>=480&&swshSavedWidth<=900)swshHudWidth=swshSavedWidth;}catch(e){}
function swshWidthDisplayValue(){return swshHudWidth===null?(winMode==='0'?600:650):swshHudWidth;}
function swshApplyWidth(){
  var roots=[document.getElementById('pkm-hud-win'),document.getElementById('pkm-hud-inline')];
  for(var i=0;i<roots.length;i++){var root=roots[i];if(!root)continue;if(swshHudWidth===null)root.style.removeProperty('--swsh-hud-width');else root.style.setProperty('--swsh-hud-width',swshHudWidth+'px');}
}
function swshCenterWidth(){
  var win=document.getElementById('pkm-hud-win');if(!win||!win.classList.contains('open'))return;
  try{var vp=vpSize(),want=Math.max(4,vp.ox+(vp.w-win.offsetWidth)/2);win.style.left=want+'px';var rect=win.getBoundingClientRect();win.style.left=(want+(want-rect.x))+'px';}catch(e){}
}
function swshSetHudWidth(value){
  var n=Number(value);if(!Number.isFinite(n))return;
  swshHudWidth=Math.max(480,Math.min(900,Math.round(n/10)*10));
  try{localStorage.setItem('pk_swsh_hud_width',String(swshHudWidth));}catch(e){}
  swshApplyWidth();swshCenterWidth();resizeFrame();
}
function swshResetHudWidth(){
  swshHudWidth=null;try{localStorage.removeItem('pk_swsh_hud_width');}catch(e){}
  swshApplyWidth();swshCenterWidth();resizeFrame();
}
