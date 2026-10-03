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
