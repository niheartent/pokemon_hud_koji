/* Owned presentation templates. Forked once from Xianjiu 3.3.29; never refreshed by core updates.
 * Business helpers remain in the core scope; data attributes are the interaction contract. */
function diyInput(id,ph){return '<input type="text" id="'+id+'" placeholder="'+esc(ph)+'" style="'+DIY_INPUT_STYLE+'">';}

function diyStatInput(id,ph){return '<input type="text" id="'+id+'" placeholder="'+esc(ph)+'" style="flex:1;min-width:0;box-sizing:border-box;padding:6px 8px;font-family:inherit;font-size:.85rem;background:rgba(43,74,111,.5);border:1px solid var(--frame);border-radius:4px;color:var(--text);outline:none">';}

function diyVisionBtnHTML(){
  return '<div class="info-frame plain-frame"><div class="info-inner"><div class="info-title">AI 识图</div><div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><button type="button" class="btn-small" data-vision-settings style="background:rgba(43,74,111,.7)">🤖 AI 识图设置</button><span class="dim" style="font-size:.72rem">配置 API 后，可在精灵表单里点「AI识图」自动生成外观描述</span></div></div></div>';
}

function diyTypeSelectHTML(i){
  var opts='<option value="">无</option>'+TYPE_LIST.map(function(t){return '<option value="'+t+'">'+t+'</option>';}).join('');
  return '<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px"><span style="font-size:.78rem;color:var(--dim);flex-shrink:0;min-width:44px">属性'+(CN_NUM[i]||i)+'</span><select id="diy-type-'+i+'" style="flex:1;min-width:0;box-sizing:border-box;padding:6px 8px;font-family:inherit;font-size:.85rem;background:rgba(43,74,111,.5);border:1px solid var(--frame);border-radius:4px;color:var(--text);outline:none">'+opts+'</select></div>';
}

function diyTypesHTML(){
  var out='';
  for(var i=1;i<=diyTypeCount;i++){out+=diyTypeSelectHTML(i);}
  return out;
}

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

function diyAbilityHTML(){
  return '<select id="diy-ability-cat" style="'+DIY_INPUT_STYLE+'"><option value="">选择特性类型</option><option value="orig">原有特性</option><option value="diy">DIY特性</option></select><div id="diy-ability-wrap">'+diyAbilityWrapHTML()+'</div>';
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

function diyImportHTML(){
  return '<div class="info-frame plain-frame"><div class="info-inner"><div class="info-title">导入分享码</div><div style="display:flex;gap:6px"><input type="text" id="diy-import-code" placeholder="粘贴分享码，自动加入自创并写入世界书" style="flex:1;min-width:0;box-sizing:border-box;padding:6px 10px;font-family:inherit;font-size:.85rem;background:rgba(43,74,111,.5);border:1px solid var(--frame);border-radius:4px;color:var(--text);outline:none"><button class="btn-small" data-diy-import>导入</button></div></div></div>';
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

function diyPkmItemHTML(){
  var diy=Object.keys(diyData.item||{}).sort();
  var opts='<option value="">无</option>';
  for(var k=0;k<diy.length;k++){var n=diy[k];opts+='<option value="'+esc(n)+'">'+esc(n)+'</option>';}
  return '<select id="diy-pkm-item" style="'+DIY_INPUT_STYLE+'">'+opts+'</select>';
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

function diyEvoDescHTML(p){
  if(!diyEvoDescShow[p])return '';
  var v=diyEvoDescCache[p]||'';
  var st='width:100%;box-sizing:border-box;padding:8px 10px;font-family:inherit;font-size:.85rem;line-height:1.6;background:rgba(43,74,111,.5);border:1px solid var(--frame);border-radius:4px;color:var(--text);outline:none;min-height:140px;resize:vertical';
  return '<textarea id="evo-desc-'+p+'" placeholder="外观描述，如 全身覆盖蓝色鳞片…" style="'+st+'">'+esc(v)+'</textarea>';
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

function badgeImg(region,e,got,big){var u=badgeUrl(region,e[0]),cls=got?'':' off';if(!u)return '<span class="badge-cell'+cls+'">·</span>';if(big)return '<div class="badge-item'+cls+'"><img src="'+esc(u)+'" onerror="badgeImgErr(this)"><span class="badge-name">'+esc(e[2])+'<br>'+esc(e[3])+'</span></div>';return '<span class="badge-cell'+cls+'" title="'+esc(e[2]+' · '+e[3]+' · '+e[1])+'"><img src="'+esc(u)+'" onerror="badgeImgErr(this)"></span>';}

function badgeRowHTML(){var rs=parseBadges();if(!rs.length)return '<div class="info-row" id="badge-entry"><span class="k">徽章</span><span class="v"><span class="dim">尚无徽章</span></span></div>';var reg=pickRegion(rs),cur=rs[0],i;for(i=0;i<rs.length;i++){if(rs[i].region===reg)cur=rs[i];}var tab=BADGE_MAP[cur.region]||[],cells='';if(tab.length){for(i=0;i<tab.length;i++){cells+=badgeImg(cur.region,tab[i],badgeGot(cur,tab[i],i),false);}}else{cells='<span class="dim">'+esc(cur.list.join(' '))+'</span>';}var more=rs.length>1?'<span class="badge-more">+'+(rs.length-1)+'个地区</span>':'';return '<div class="info-row block" id="badge-entry"><span class="k">徽章</span><span class="v"><div class="badge-line"><span class="badge-region" id="badge-cycle" title="点击切换地区">'+esc(cur.region)+(rs.length>1?' ⇄':'')+'<span class="badge-cnt"> '+badgeCount(cur)+'/'+(tab.length||badgeCount(cur))+'</span></span><span class="badge-row">'+cells+'</span>'+more+'<button class="btn-small" data-badge-open style="margin-left:auto;padding:2px 8px;font-size:.7rem">🏅 查看</button></div></span></div>';}

function badgePageHTML(){var rs=parseBadges(),regions=Object.keys(BADGE_MAP);var cur=badgeSel||pickRegion(rs)||regions[0];if(regions.indexOf(cur)<0)cur=regions[0];var tabs=regions.map(function(r){return '<button class="badge-tab'+(r===cur?' active':'')+'" data-bregion="'+esc(r)+'">'+esc(r)+'</button>';}).join('');var rec=null;rs.forEach(function(r){if(r.region===cur)rec=r;});if(!rec)rec={region:cur,list:[],cnt:0};var tab=BADGE_MAP[cur]||[],cells=tab.map(function(e,i){return badgeImg(cur,e,badgeGot(rec,e,i),true);}).join('');var mh=badgeMinH();return frame('徽章盒 '+esc(cur)+' '+badgeCount(rec)+'/'+tab.length,'<div class="badge-tabs">'+tabs+'</div><div class="badge-grid" style="min-height:'+mh+'px">'+cells+'</div>');}

function statusTag(s){s=String(s||'').trim();if(!s||s==='无'||s==='正常')return '';var m={'麻痹':'par','剧毒':'psn','中毒':'psn','灼伤':'brn','烧伤':'brn','睡眠':'slp','冰冻':'frz','混乱':'cnf','畏缩':'cnf'},c='bad';for(var k in m){if(s.indexOf(k)>=0){c=m[k];break;}}return '<span class="ailment '+c+'">'+esc(s)+'</span>';}

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
  return '<div class="card-frame" data-slot="'+c.slot+'">'+(isGmax?'<svg class="card-bg-svg" viewBox="0 0 100 100" preserveAspectRatio="none"><polygon points="7,1.5 98.5,1.5 98.5,74 93,98.5 1.5,98.5 1.5,26" fill="#D70645" fill-opacity="0.65" stroke="#7d95b5" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round"/></svg>':svgFrame)+'<div class="card-inner"><div class="pk-top"><div class="pk-side">'+img+'</div><div class="pk-info"><div class="name-row"><span class="pk-left"><span class="pk-name">'+esc(c.name)+'</span></span><span class="gender-side">'+(ail||'')+fnt+(isMega?'<img class="mega-ic" style="font-size:clamp(.74rem,2.8vw,.88rem)" src="'+pkmRepoFirst(PKM_DATA_BASE+'UI/ui/超进化.png')+'" onerror="this.remove()">':'')+(isGigantamax?'<img class="mega-ic" style="font-size:clamp(.74rem,2.8vw,.88rem)" src="'+pkmRepoFirst(PKM_DATA_BASE+'UI/ui/超极巨化.png')+'" onerror="this.remove()">':'')+'<span class="gender-sym '+gi.cls+'">'+gi.sym+'</span></span></span></div><div class="bar-row"><span class="hp-label">HP</span><div class="bar-stack"><div class="hp-bar"><div class="hp-fill '+hpCls+'" style="width:'+pct+'%"></div></div><div class="exp-bar"><div class="exp-fill" style="width:'+expPct+'%"></div></div></div></div></div></div><div class="bottom-row"><span class="pk-lv-wrap"><span class="pk-level">Lv.'+c.level+'</span>'+itemImg+'</span><span class="hp-num">'+c.hpCur+'/'+c.hpMax+'</span></div></div></div>';
}

function frame(title,content){return '<div class="info-frame plain-frame"><div class="info-inner"><div class="info-title">'+title+'</div>'+content+'</div></div>';}

function frameP(title,content){return '<div class="info-frame plain-frame"><div class="info-inner"><div class="info-title">'+title+'</div>'+content+'</div></div>';}

function infoRow(k,v){return '<div class="info-row"><span class="k">'+k+'</span><span class="v">'+v+'</span></div>';}

function teamHTML(){var cards=buildCards();var left=cards.slice(0,3).map(cardHTML).join('');var right=cards.slice(3,6).map(cardHTML).join('');return '<div class="grid"><div class="col col-left">'+left+'</div><div class="col col-right">'+right+'</div></div>';}

function trainerHTML(){var tr=stat_data.训练家||{};var hearts='';for(var i=0;i<num(tr.活力上限,3);i++){hearts+='<span class="heart'+(i<num(tr.活力,3)?'':' empty')+'">♥</span>';}var content=infoRow('名字',esc(tr.名字||'???')+' '+hearts)+infoRow('金钱','¥'+num(tr.金钱,0).toLocaleString())+badgeRowHTML()+infoRow('身份',esc(tr.身份||'-'))+infoRow('声望',esc(tr.声望||'-'))+'<div class="info-row block"><span class="k">气场</span><span class="v">'+esc(tr.气场||'-')+'</span></div>'+'<div class="info-row cmd"><span class="k">可命令等级</span><span class="v">Lv.'+num(tr.可命令等级,0)+'</span></div>';var ev=stat_data.环境||{},en='';if(ev.当前地点)en+='<span>📍 '+esc(ev.当前地点)+'</span>';if(ev.日期||ev.时间)en+='<span>🕐 '+esc(ev.日期||'')+(ev.日期&&ev.时间?' ':'')+esc(ev.时间||'')+'</span>';return '<div class="info-frame trainer-frame"><div class="info-inner"><div class="info-title"><span>个人信息</span>'+refreshBtnHTML()+'<span class="tr-right">'+(en?'<span class="tr-env">'+en+'</span>':'')+'</span></div>'+content+'</div></div>';}

function envStripHTML(){var e=stat_data.环境||{};if(!e.赛程)return '';return '<div class="env-strip"><div class="env-line"><span class="env-item">🏁 '+esc(e.赛程)+'</span></div></div>';}

function nearbyTypeChipsHTML(t1,t2){
  return (t1?typeChipHTML(t1):'')+(t2?typeChipHTML(t2):'');
}

function nearbyTypeBarHTML(m){
  var out=(m.type1?typeChipHTML(m.type1):'')+(m.type2?typeChipHTML(m.type2):'');
  if(!m.type1)out+='<span data-nb-type="'+esc(m.name)+'" data-nb-en="'+esc((m.pokemon&&m.pokemon.英文名)||'')+'" data-nb-cn="'+esc((m.pokemon&&m.pokemon.名字)||'')+'" data-nb-type-mode="chip"></span>';
  return out;
}

function nearbyMarkHTML(kind,label,text,style){return '<span class="nb-mark '+kind+'"'+(style?' style="'+style+'"':'')+' title="'+esc(label)+'"><span>'+text+'</span></span>';}

function nearbyPillHTML(kind,label,text,style){return '<span class="nb-pill '+kind+'"'+(style?' style="'+style+'"':'')+'><span class="nb-pill-ic">'+text+'</span><span class="nb-pill-tx">'+esc(label)+'</span></span>';}

function nearbyNameIconsHTML(m){var a=[];if(m.mega)a.push('<img class="mega-ic" style="height:14px" src="'+pkmRepoFirst(PKM_DATA_BASE+'UI/ui/超进化.png')+'" alt="Mega" onerror="this.remove()">');if(m.dynamax)a.push('<img class="mega-ic" style="height:14px" src="'+pkmRepoFirst(PKM_DATA_BASE+'UI/ui/超极巨化.png')+'" alt="超极巨化" onerror="this.remove()">');if(m.boss)a.push('<img class="mega-ic" style="height:14px" src="'+pkmRepoFirst(PKM_DATA_BASE+'UI/ui/头目.png')+'" alt="头目/霸主" onerror="this.remove()">');if(m.shiny)a.push('<img class="mega-ic" style="height:14px" src="'+pkmRepoFirst(PKM_DATA_BASE+'UI/ui/闪光.png')+'" alt="闪光" onerror="this.remove()">');return a.join('');}

function nearbyPillsHTML(m){var a=[];if(m.legendary)a.push(nearbyPillHTML('legendary','神兽','✦','--nb-pill1:'+m.accent1+';--nb-pill2:'+m.accent2+';--nb-pill-soft:'+m.glow1+';'));if(m.mythical)a.push(nearbyPillHTML('mythical','幻兽','◇'));if(m.ultra)a.push(nearbyPillHTML('ultra','异兽','UB'));return a.join('');}

function nearbyCardHTML(key,raw,mode){var m=nearbyCategoryMeta(raw),p=m.pokemon,img=pkImgHTML(p.名字,p.图标,m.shiny,mode==='page'?'box-icon nearby-pic':'nb-icon nearby-pic'),attr=(mode==='page'?'data-nearby':'data-nearby-open')+'="'+esc(key)+'"',cls=(mode==='page'?'box-cell nearby-cell ':'nb-cell ')+nearbyCellClasses(m),sub='×'+num(p.数量,1),title=esc(p.名字||'未知宝可梦');return '<div class="'+cls+'" style="'+nearbyCellStyle(m)+'" '+attr+'><div class="nb-aura"></div><div class="nb-edge"></div><div class="nb-thumb-wrap">'+img+'</div><div class="nb-name-row"><span class="nb-name" title="'+title+'">'+title+'</span><span class="nb-name-icons">'+nearbyNameIconsHTML(m)+'</span></div><div class="nb-pillbar">'+nearbyPillsHTML(m)+'</div><div class="nb-typebar">'+nearbyTypeBarHTML(m)+'</div><div class="nb-cnt">'+sub+'</div></div>';}

function nearbyHTML(){var obj=stat_data.附近宝可梦||{};var keys=nearbySortedKeys(obj);if(!keys.length)return frame('附近宝可梦','<div class="empty">暂无</div>');var show=nearbyOpen?keys:keys.slice(0,6);var cells=show.map(function(key){return nearbyCardHTML(key,obj[key],'strip');}).join('');var rare=keys.filter(function(k){var m=nearbyCategoryMeta(obj[k]);return m.legendary||m.mythical||m.ultra||m.boss||m.mega||m.dynamax||m.shiny;}).length;var more=keys.length>6?'<span class="nb-toggle" data-nearby-toggle>'+(nearbyOpen?'收起 ▲':'展开全部('+keys.length+') ▼')+'</span>':'';var rareText=rare?'<span class="nb-rare-count">✦ '+rare+' 特殊</span>':'';return '<div class="info-frame nearby-frame"><div class="info-inner"><div class="info-title"><span>附近宝可梦</span>'+rareText+more+'</div><div class="nb-grid">'+cells+'</div></div></div>';}

function nearbyPageHTML(){var obj=stat_data.附近宝可梦||{};var keys=nearbySortedKeys(obj);if(!keys.length)return '<div class="nearby-wrap"><div class="nearby-title">附近宝可梦</div><div class="empty">暂无</div></div>';var cells=keys.map(function(key){return nearbyCardHTML(key,obj[key],'page');}).join('');return '<div class="nearby-wrap"><div class="nearby-title">附近宝可梦 <span class="nb-page-count">'+keys.length+' 个目标</span></div><div class="nearby-grid">'+cells+'</div></div>';}

function bagItemsHTML(){var cats=bagCategories();var cur=cats.find(function(c){return c.key===activeBag;})||cats[0];if(!cur.items.length)return '<div class="empty">这里什么都没有...</div>';return cur.items.map(function(it){var isTM=(it.name.indexOf('技能机')>=0||it.name.indexOf('招式学习器')>=0);var tmMove=isTM?tmMoveName(it.name):'';var icon;if(tmMove){var iconSlug=String(it.icon||'').toLowerCase().replace(/\.(png|gif|jpe?g|webp)$/,'');icon=iconSlug?'<span class="item-icon-wrap"><img class="item-icon" src="'+esc(psItemUrl(iconSlug,'bag'))+'" onerror="itemImgErr(this)"></span>':'<span class="item-icon-wrap"><span class="item-icon placeholder tm-wiki" data-tm="'+esc(tmMove)+'">?</span></span>';}else if(isTM){var iconName=(itemIconName(it.name)||String(it.icon||'')).toLowerCase();if(iconName.slice(-4)==='.png'){iconName=iconName.slice(0,-4);}icon=iconName?'<span class="item-icon-wrap"><img class="item-icon" src="'+esc(psItemUrl(iconName,'bag'))+'" onerror="itemImgErr(this)"></span>':'<span class="item-icon-wrap"><span class="item-icon placeholder">?</span></span>';}else if(pkmItemSource==='serebii'){var ov2=itemImgOf(it.name);if(ov2!==undefined){icon=ov2?'<span class="item-icon-wrap"><img class="item-icon" src="'+esc(ov2)+'" referrerpolicy="origin" onerror="itemImgErr(this)"></span>':'<span class="item-icon-wrap"><span class="item-icon placeholder">?</span></span>';}else{icon='<span class="item-icon-wrap"><span class="item-icon placeholder item-wiki" data-item="'+esc(it.name)+'" data-item-en="'+esc(it.icon||'')+'" data-cls="item-icon">?</span></span>';}}else{var ov=itemImgOf(it.name);if(ov!==undefined){icon=ov?'<span class="item-icon-wrap"><img class="item-icon" src="'+esc(ov)+'" referrerpolicy="origin" onerror="itemImgErr(this)"></span>':'<span class="item-icon-wrap"><span class="item-icon placeholder">?</span></span>';}else{icon='<span class="item-icon-wrap"><span class="item-icon placeholder item-wiki" data-item="'+esc(it.name)+'" data-cls="item-icon">?</span></span>';}}var click=tmMove?' data-tm="'+esc(tmMove)+'" style="cursor:pointer"':((!isTM&&itemClickEnabled)?(typeof resolveBagItemClick==='function'?' data-bag-item="'+esc(it.name)+'" data-bag-icon="'+esc(it.icon||'')+'"':' data-item="'+esc(it.name)+'" style="cursor:pointer"'):'');return '<div class="item-entry"'+click+'>'+icon+'<span class="item-name">'+esc(it.name)+'</span><span class="item-count">×'+it.count+'</span><button class="btn-small" data-bag-discard="'+esc(it.name)+'">丢弃</button></div>';}).join('');}

function bagHTML(){var tabs=bagCategories().map(function(c){return '<button class="bag-tab'+(c.key===activeBag?' active':'')+'" data-bag="'+c.key+'">'+c.label+'</button>';}).join('');return frame('背包','<div class="bag-tabs">'+tabs+'</div><div class="bag-list" id="bag-list">'+bagItemsHTML()+'</div>');}

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
    var inner='<div class="'+wrapCls+'" data-mapwrap><div class="map-stage"><img class="map-img" data-src="'+esc(v.img)+'" src="'+esc(mapImgSrc(v.img))+'" draggable="false" onerror="kojiMapImgErr(this)"></div><div class="map-labels">'+spotLabels+pin+'</div></div>';
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
        inner2=mapViewerFrameHTML('<div class="map-wrap" data-mapwrap><div class="map-stage"><img class="map-img" data-src="'+esc(m.img)+'" src="'+esc(mapImgSrc(m.img))+'" draggable="false" onerror="kojiMapImgErr(this)"></div><div class="map-labels">'+labels+'</div></div>');
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

function foldHTML(key,label,fn){var open=!!foldState[key];return '<div class="fold-box"><div class="fold-head" data-fold="'+key+'"><span>'+label+'</span><span class="fold-arrow">'+(open?'▾':'▸')+'</span></div>'+(open?'<div class="fold-body">'+fn()+'</div>':'')+'</div>';}

function bagPlainHTML(){var tabs=bagCategories().map(function(c){return '<button class="bag-tab'+(c.key===activeBag?' active':'')+'" data-bag="'+c.key+'">'+c.label+'</button>';}).join('');return '<div class="fold-inner"><div class="bag-tabs">'+tabs+'</div><div class="bag-list" id="bag-list">'+bagItemsHTML()+'</div></div>';}

function relPlainHTML(){var rel=stat_data.人际关系||{};var ks=Object.keys(rel);if(!ks.length)return '<div class="fold-inner"><div class="empty">暂无</div></div>';return '<div class="fold-inner">'+ks.map(function(k){var val=rel[k];var score=(typeof val==='object'&&val)?num(val.好感度,0):(typeof val==='number'?val:0);return '<div class="rel-item"><span class="rel-name'+(kojiRelHasPortrait(k)?' rel-click" data-rel="'+esc(k)+'"':'"')+'>'+esc(k)+'</span><div class="rel-bar"><div class="rel-fill" style="width:'+Math.max(0,Math.min(100,score))+'%"></div></div><span class="rel-val">'+score+'</span></div>';}).join('')+'</div>';}

function quickHTML(){var Q=[['box','q-box','https://img.baibai.cv/f/4eN3HA/%E7%9B%92%E5%AD%90.png','盒子'],['pokedex','q-pokedex','https://img.baibai.cv/f/1dNbu2/%E5%9B%BE%E9%89%B4.png','图鉴'],['breeding','q-breeding','https://img.baibai.cv/f/ZVn1UV/%E7%B9%81%E8%82%B2.png','繁育'],['typechart','q-typechart','⚡','克制表'],['map','q-map','🗺️','地图']];return '<div class="quick-bar">'+Q.map(function(q){var sz=getIconSize(q[1]);var ic=q[2].indexOf('http')===0?'<img src="'+esc(q[2])+'" referrerpolicy="origin" style="width:'+sz+'px;height:'+sz+'px;object-fit:contain;image-rendering:pixelated">':'<span class="quick-emoji" style="font-size:'+sz+'px">'+q[2]+'</span>';return '<span class="menu-item quick-chip" data-page="'+q[0]+'">'+ic+q[3]+'</span>';}).join('')+'</div>';}

function homeFoldHTML(){return foldHTML('bagfold','<span style="display:inline-flex;align-items:center;gap:4px"><img src="https://img.baibai.cv/f/3o2qte/1788188339193.png" style="width:18px;height:18px;object-fit:contain;image-rendering:pixelated">背包</span>',bagPlainHTML)+foldHTML('relfold','💬 人际关系'+kojiRelToolsHTML(),relPlainHTML);}

function boxHTML(){var box=stat_data.盒子||{};var keys=Object.keys(box);if(!keys.length)return frame('<span>盒子</span><button class="btn-small" data-box-new style="display:inline-block;vertical-align:middle;margin-left:6px;padding:2px 7px;font-size:.7rem;line-height:1.3">＋ 新建盒子</button>','<div class="empty">这里是空的</div>');if(!box[activeBox])activeBox=keys[0];var sel='<select class="box-select" id="box-select" style="float:left;margin-bottom:5px;min-width:0;width:auto;max-width:100%">'+keys.map(function(k){return '<option value="'+esc(k)+'"'+(k===activeBox?' selected':'')+'>'+esc(String(k).replace(/^盒子/,''))+'</option>';}).join('')+'</select>';var pokemons=box[activeBox]||{};var entries=Object.keys(pokemons).filter(function(s){var p=pokemons[s];return p&&p.名字&&p.名字!=='空';}).map(function(s){return{slot:s,data:pokemons[s]};});var cells=entries.length?entries.map(function(e){var p=e.data;var img=pkImgHTML(p.名字,p.图标,p.是否闪光,'box-icon');return '<div class="box-cell" data-box="'+esc(activeBox)+'" data-slot="'+esc(e.slot)+'">'+img+'<div class="box-name">'+esc(p.昵称||p.名字)+'</div></div>';}).join(''):'<div class="empty">这里是空的</div>';return frame('<span>盒子</span><button class="btn-small" data-box-new style="display:inline-block;vertical-align:middle;margin-left:6px;padding:2px 7px;font-size:.7rem;line-height:1.3">＋ 新建盒子</button><button class="btn-small" data-box-del style="display:inline-block;vertical-align:middle;margin-left:4px;padding:2px 7px;font-size:.7rem;line-height:1.3;background:rgba(150,50,50,.65);border-color:#c06060">删除盒子</button>',sel+'<div class="box-grid">'+cells+'</div>');}

function tasksHTML(){var t=stat_data.任务||{},html='';if(t.主线)html+='<div class="task-item"><span class="task-tag main">主线</span><div class="task-text">'+esc(t.主线)+'</div></div>';if(t.传说)html+='<div class="task-item"><span class="task-tag legend">传说</span><div class="task-text">'+esc(t.传说)+'</div></div>';if(t.支线)html+='<div class="task-item"><span class="task-tag random">支线</span><div class="task-text">'+esc(t.支线).split(/[；;\n]/).join('<br>')+'</br></div></div>';if(!html)html='<div class="empty">暂无任务</div>';return frameP('任务',html);}

function worldHTML(){var w=stat_data.世界事件||{},html='';function ln(v){return esc(String(v||'')).split(/[；;]/).join('<br>');}if(w.附近遭遇)html+='<div class="event-item"><span class="event-type">📍 附近遭遇</span><p>'+ln(w.附近遭遇)+'</p></div>';if(w.地区新闻)html+='<div class="event-item"><span class="event-type">📰 地区新闻</span><p>'+ln(w.地区新闻)+'</p></div>';if(w.区域动态)html+='<div class="event-item"><span class="event-type">🌍 区域动态</span><p>'+ln(w.区域动态)+'</p></div>';if(!html)html='<div class="empty">暂无世界事件</div>';return '<div class="info-frame world-frame plain-frame"><div class="info-inner"><div class="info-title">世界动态</div>'+html+'</div></div>';}

function relHTML(){var rel=stat_data.人际关系||{};var entries=Object.entries(rel);if(!entries.length)return frame('人际关系','<div class="empty">暂无</div>');var html=entries.map(function(kv){var val=kv[1];var score=(typeof val==='object'&&val)?num(val.好感度,0):(typeof val==='number'?val:0);return '<div class="rel-item"><span class="rel-name'+(kojiRelHasPortrait(kv[0])?' rel-click" data-rel="'+esc(kv[0])+'"':'"')+'>'+esc(kv[0])+'</span><div class="rel-bar"><div class="rel-fill" style="width:'+Math.max(0,Math.min(100,score))+'%"></div></div><span class="rel-val">'+score+'</span></div>';}).join('');return frame('人际关系'+kojiRelToolsHTML(),html);}

function rivalsHTML(){var r=stat_data.劲敌||{};var entries=Object.entries(r);if(!entries.length)return frameP('劲敌','<div class="empty">尚未遭遇劲敌</div>');var html=entries.map(function(kv){return '<div class="nearby-item rival-item"><div class="nearby-info"><div class="nearby-name">'+esc(kv[0])+'</div><div class="nearby-sub">'+esc(kv[1])+'</div></div></div>';}).join('');return frameP('劲敌',html);}

function breedingHTML(){var b=stat_data.繁育||{};return frame('繁育',infoRow('蛋',esc(b.蛋||'无蛋'))+infoRow('剩余步数',num(b.剩余步数,0)+'步')+infoRow('存放',esc(b.存放||'-')));}

function btAbiLink(n){n=String(n||'').trim();if(!n||n==='无')return esc(n);return '<span class="abi-link" data-ability="'+esc(n)+'">'+esc(n)+'</span>';}

function btItemLink(n){n=String(n||'').trim();if(!n||n==='无')return esc(n);return '<span class="abi-link" data-item="'+esc(n)+'">'+esc(n)+'</span>';}

function btNatureLink(n){n=String(n||'').trim();if(!n||n==='无')return esc(n);return '<span class="abi-link" data-nature="'+esc(n)+'">'+esc(n)+'</span>';}

function btMoveLinks(t){return String(t||'').split(/[/,，、]/).map(function(x){var n=x.trim();if(!n)return '';return '<span class="abi-link" data-move="'+esc(n)+'">'+esc(n)+'</span>';}).filter(Boolean).join(' / ');}

function btCardLine(s){s=String(s||'').trim();if(!s)return '';var typeLine=kojiBattleTypeLine(s);if(typeLine)return typeLine;var m=s.match(/^(招式|技能)\s*[：:]\s*(.*)$/);if(m&&m[2])return '<div class="bt-line"><span class="bt-k">招式</span>'+btMoveLinks(m[2])+'</div>';var mi=s.match(/^(携带物|携带道具|道具|持有物)\s*[：:]\s*(.+)$/);if(mi&&mi[2])return '<div class="bt-line"><span class="bt-k">道具</span>'+btItemLink(mi[2])+'</div>';var ma=s.match(/^(特性|能力)\s*[：:]\s*(.+)$/);if(ma&&ma[2])return '<div class="bt-line"><span class="bt-k">特性</span>'+btAbiLink(ma[2])+'</div>';if(s.indexOf('·')>0){var ps=s.split('·').map(function(x){return x.trim();}).filter(Boolean);if(ps.length>=2){var out=btAbiLink(ps[0]);if(ps.length>=3){out+=' · '+btNatureLink(ps[1])+' · '+btItemLink(ps[2]);}else{out+=' · '+btItemLink(ps[1]);}return '<div class="bt-line">'+out+'</div>';}}return '<div class="bt-line">'+esc(s)+'</div>';}

function btCard(k,v){var side=sideOf(k),segs=String(v||'').split(/[｜|]/),nm=String(k).replace(/[（(](我方|友方|中立|敌方)[)）]/,'').trim(),tr='',pk=nm,di=nm.indexOf('·');if(di>0){tr=nm.slice(0,di);pk=nm.slice(di+1);}var lv='',hpc=0,hpm=0,rest=[];for(var i=0;i<segs.length;i++){var s=segs[i].trim();if(!s)continue;if(i===0){var lm=s.match(/Lv\.?\s*(\d+)/i);if(lm)lv=lm[1];var hm=s.match(/(\d+)\s*\/\s*(\d+)/);if(hm){hpc=parseInt(hm[1],10);hpm=parseInt(hm[2],10);}continue;}if(s.indexOf('阶级')===0){var bd=s.replace(/^阶级[：:\s]*/,'').trim();if(bd&&bd!=='无')rest.push('<div class="bt-line"><span class="bt-k">阶级</span>'+esc(bd).replace(/([+\-])(\d)/g,function(a,g,n){return '<b class="'+(g==='-'?'st-dn':'st-up')+'">'+g+n+'</b>';})+'</div>');continue;}if(s.indexOf('状态')===0){var stx=s.replace(/^状态[：:\s]*/,'').trim();if(stx&&stx!=='无')rest.push('<div class="bt-line"><span class="bt-k">状态</span>'+stx.split(/[,，、\/]/).map(function(x){return statusTag(x.trim());}).join(' ')+'</div>');continue;}rest.push(btCardLine(s));}var pct=hpm>0?Math.max(0,Math.min(100,hpc/hpm*100)):0;var hc=pct>=50?'hp-high':pct>=20?'hp-mid':'hp-low';var fnt=(hpm>0&&hpc<=0)?'<span class="ailment fnt">圈圈眼</span>':'';return '<div class="bt-card '+side+'"><div class="bt-head"><span class="bt-pk">'+esc(pk)+fnt+'</span>'+(lv?'<span class="bt-lv">Lv.'+esc(lv)+'</span>':'')+'</div>'+(tr?'<div class="bt-tr">'+esc(tr)+'</div>':'')+(hpm>0?'<div class="bt-hp"><div class="hp-bar"><div class="hp-fill '+hc+'" style="width:'+pct+'%"></div></div><span class="bt-hpn">'+hpc+'/'+hpm+'</span></div>':'')+rest.join('')+'</div>';}

function btQueueLine(s){s=String(s||'').trim();if(!s)return '';var typeLine=kojiBattleTypeLine(s);if(typeLine)return typeLine;var m=s.match(/^(招式|技能)\s*[：:]\s*(.*)$/);if(m&&m[2])return '<div class="bt-line"><span class="bt-k">招式</span>'+btMoveLinks(m[2])+'</div>';if(s.indexOf('·')>0){var ps=s.split('·').map(function(x){return x.trim();}).filter(Boolean);if(ps.length){var out='<span class="bt-k">特性</span>'+btAbiLink(ps[0]);if(ps[1])out+=' · <span class="bt-k">道具</span>'+btItemLink(ps[1]);return '<div class="bt-line">'+out+'</div>';}}return '<div class="bt-line">'+esc(s)+'</div>';}

function btQueueCard(q){var chips='';if(q.types&&q.types.length){chips='<span class="bt-types">'+kojiBattleTypeChips(q.types)+'</span>';}var accent=(q.types&&q.types.length)?typeColor(q.types[0]):'';var lines=(q.parts||[]).map(btQueueLine).filter(Boolean).join('');return '<div class="bt-card bt-q"'+(accent?' style="--bt-accent:'+esc(accent)+'"':'')+'><div class="bt-head"><span class="bt-pk">'+esc(q.name)+chips+'</span>'+(q.lv?'<span class="bt-lv">Lv.'+esc(q.lv)+'</span>':'')+'</div>'+lines+'</div>';}

function btSideHTML(k,v){var segs=String(v||'').split(/[｜|]/).map(function(x){return x.trim();}).filter(Boolean);var tactic='',cards=[],meta=[],cur=null;for(var i=0;i<segs.length;i++){var s=segs[i];if(/^战术\s*[：:]/.test(s)){tactic=s.replace(/^战术\s*[：:]\s*/,'');continue;}if(/^队列\s*\d+\s*[.．、]/.test(s)){cur=btQueueName(s);cur.parts=[];cards.push(cur);continue;}if(/^(后备|已换下|已倒下|机制)/.test(s)){if(!/^(已换下|已倒下)\s*[：:]\s*无\s*$/.test(s))meta.push(s);continue;}if(cur)cur.parts.push(s);}var body='';if(tactic)body+='<div class="bt-tactic"><span class="bt-k">战术</span>'+esc(tactic)+'</div>';if(cards.length)body+='<div class="bt-grid">'+cards.map(btQueueCard).join('')+'</div>';if(meta.length)body+='<div class="bt-meta">'+meta.map(function(m){return '<span>'+esc(m)+'</span>';}).join('')+'</div>';var trn=(typeof relNormName==='function'?relNormName(k):String(k||''));var trc=trn&&kojiRelHasPortrait(trn);var trh=trc?'<span class="rel-click" data-rel="'+esc(trn)+'">'+esc(k)+'</span>':esc(k);return '<div class="bt-side"><div class="bt-side-h">📋 '+trh+'</div><div class="bt-side-b">'+body+'</div></div>';}

function battleHTML(){var b=stat_data.战场||{},html='';function ln(v){return esc(String(v||'')).split(/[｜|]/).join('<br>');}var f=b.场上||{},fk=Object.keys(f),s=b.各方||{},sk=Object.keys(s);if(b.规则)html+='<div class="bt-rule">'+ln(b.规则)+'</div>';if(b.场景)html+='<div class="bt-scene">'+ln(b.场景)+'</div>';if(fk.length)html+='<div class="bt-grid">'+fk.map(function(k){return btCard(k,f[k]);}).join('')+'</div>';if(sk.length)html+=sk.map(function(k){return btSideHTML(k,s[k]);}).join('');if(!html)return '<div class="bt-empty">当前没有正在进行的战斗</div>';return '<div class="info-frame battle-frame"><div class="info-inner"><div class="info-title">战场</div><div class="battle-list">'+html+'</div></div></div>';}

function ivsHTML(s){if(!s)return '<span class="dim">-</span>';return '<div class="ivs">'+String(s).split(',').map(function(x){return '<span class="iv">'+esc(x.trim())+'</span>';}).join('')+'</div>';}

function movesHTML(s){if(!s)return '<span class="dim">-</span>';return '<div class="moves">'+String(s).split(/[,，/、]/).map(function(x){var p=x.split(':');var name=p[0]||'',type=p[1]||'',cat=p[2]||'';var color=TYPE_COLORS[type]||'#888';return '<div class="move-cell" style="border-color:'+color+';background:'+color+'22;cursor:pointer" data-move="'+esc(name)+'" data-mvtype="'+esc(type)+'" data-mvcat="'+esc(cat)+'"><div class="move-name">'+esc(name)+'</div><div class="move-meta"><span class="move-type" style="background:'+color+'">'+esc(type)+'</span><span class="move-cat">'+moveCatIcon(cat)+'</span></div></div>';}).join('')+'</div>';}

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

function evoChainRender(chain,selfNo){
  if(!chain||!chain.length)return '<span class="dim">暂无进化数据</span>';
  var selfN=parseInt(selfNo,10)||0,rows=[];
  for(var i=0;i<chain.length;i++){
    var c=chain[i];
    var cond=String(c.cond||'').replace(/\n/g,'；');
    var same=(c.from===c.to);
    if(same){
      cond=cond.replace(/[（(][^）)]*(超级进化|超极巨化|原始回归|形态变化)[^）)]*[）)]/g,'')
        .replace(/[；;]\s*$/,'');
    }
    var hlFrom=(c.from===selfN)?' style="color:var(--pk-blue);font-weight:700"':'';
    var hlTo=(c.to===selfN)?' style="color:var(--pk-blue);font-weight:700"':'';
    var toHtml='<span'+hlTo+'>'+esc(same?evoFormName(c.cond,evoName(c.from)):evoName(c.to))+'</span>';
    rows.push('<div class="evo-row">'
      +'<span class="evo-from"'+hlFrom+'>'+esc(evoName(c.from))+'</span>'
      +'<span class="evo-cond">'+(cond?esc(cond):'—')+'</span>'
      +'<span class="evo-to">'+toHtml+'</span>'
      +'</div>');
  }
  return rows.join('');
}

function mvRowHead(c1){
  return '<div class="mv-row mv-head"><span class="mv-c1">'+c1+'</span><span class="mv-c2">招式名</span><span class="mv-c3">属性</span></div>';
}

function mvRows(list,hasLevel,head1){
  var out=mvRowHead(head1);
  if(!list||!list.length){return out+'<div class="mv-row"><span class="mv-c1 dim" style="grid-column:1/-1;text-align:center">暂无</span></div>';}
  for(var i=0;i<list.length;i++){
    var mid=hasLevel?list[i][0]:list[i];
    var lvl=hasLevel?list[i][1]:'';
    var mv=moveById(mid);
    var nm=mv?mv.name:('#'+mid);
    var tp=mv?mv.type:'';
    var cat=mv?mv.cat:'';
    var c1=hasLevel?((lvl!==''&&lvl!=null&&lvl!==0)?lvl:'-'):'-';
    out+='<div class="mv-row">'
      +'<span class="mv-c1">'+c1+'</span>'
      +'<span class="mv-c2 mv-name" data-move="'+esc(nm)+'"'+(tp?' data-mvtype="'+esc(tp)+'"':'')+(cat?' data-mvcat="'+esc(cat)+'"':'')+'>'+esc(nm)+'</span>'
      +'<span class="mv-c3">'+(tp?typeChipHTML(tp):'<span class="dim">-</span>')+(cat?moveCatIcon(cat):'')+'</span>'
      +'</div>';
  }
  return out;
}

function movesetRender(ms){
  var gens=ms&&ms.allgen||[];
  var g=null;
  for(var i=gens.length-1;i>=0;i--){if(gens[i].levelup&&gens[i].levelup.length){g=gens[i];break;}}
  if(!g)g=gens[gens.length-1]||null;
  if(!g)return '<span class="dim">暂无招式数据</span>';
  var lv=(g.levelup||[]).slice().sort(function(a,b){return (a[1]-b[1])||(a[0]-b[0]);});
  var machine=(g.machine||[]).slice();
  var tabs='<div class="mv-tabs">'
    +'<button class="mv-tab active" data-mvtab="levelup">等级提升</button>'
    +'<button class="mv-tab" data-mvtab="machine">学习器</button>'
    +'</div>';
  return tabs
    +'<div class="mv-panel" data-mvpanel="levelup">'+mvRows(lv,true,'等级')+'</div>'
    +'<div class="mv-panel" data-mvpanel="machine" style="display:none">'+mvRows(machine,false,'-')+'</div>';
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
  var attack=typeof typeChartSwitchMode==='function'&&typeof typeChartCalcAtk==='function';
  var h=attack?'<div class="koji-tc-modes" aria-label="属性克制视角"><button type="button" class="btn-small tc-mode-btn" data-tc-mode="def">作为防御方</button><button type="button" class="btn-small tc-mode-btn" data-tc-mode="atk">作为攻击方</button></div>':'';
  h+='<div id="tc-def-wrap"><div class="set-title">防御方属性（最多选两个）</div><div class="koji-tc-selects"><select class="koji-tc-select" aria-label="防御方第一属性" id="tc-def-1">'+opts+'</select><select class="koji-tc-select" aria-label="防御方第二属性" id="tc-def-2">'+opts+'</select></div><div id="tc-result"><div class="empty">选择防御方属性后，自动显示克制它的属性</div></div></div>';
  if(attack)h+='<div id="tc-atk-wrap" style="display:none"><div class="set-title">攻击方属性</div><div class="koji-tc-selects"><select class="koji-tc-select" aria-label="攻击方属性" id="tc-atk-1">'+opts+'</select></div><div id="tc-atk-result"><div class="empty">选择攻击方属性后，自动显示它能克制／抵抗／无效的属性</div></div></div>';
  var url=kojiTypeChartURL();
  h+='<div class="set-title">完整克制表</div><div class="koji-tc-image"><img src="'+esc(url)+'" referrerpolicy="origin" data-tc-big="'+esc(url)+'" onerror="kojiMapImgErr(this)"><div class="dim">点击图片放大查看</div></div>';
  return frameP('属性克制表',h);
}
function kojiTypeChartURL(){var base=typeof PKM_DATA_BASE==='string'?PKM_DATA_BASE:'https://raw.githubusercontent.com/xianjiu0926/Pokemon/main/';var url=base+'UI/ui/属性相克表.webp';return typeof pkmRepoFirst==='function'?pkmRepoFirst(url):url;}

function typeChipHTML(t){return '<span class="type-chip" style="background:'+typeColor(t)+'">'+esc(typeLabel(t))+'</span>';}

function typesHTML(a1,a2){var out='';if(a1)out+=typeChipHTML(a1);if(a2&&a2!=='无')out+=typeChipHTML(a2);if(!out)return '<span class="dim">-</span>';return '<div class="types">'+out+'</div>';}

function moveCatIcon(cat){var m={'物理':'physical','特殊':'special','变化':'status'};var slug=m[cat];if(slug)return '<img class="move-cat-ic" src="'+PKM_DATA_BASE+'move-cat-icons/'+slug+'.png" alt="'+esc(cat)+'" title="'+esc(cat)+'">';return esc(cat||'');}

function moveGridItemHTML(m){
  if(!m||!m.name)return '';
  var type=m.type||MOVE_TYPE[m.name]||'';
  var lb=typeLabel(type),cl=typeColor(type);
  var chip='<span class="move-type" style="background:'+(cl||'#6b7f99')+'">'+(lb?esc(lb):'?')+'</span>';
  return '<div class="dt-move-cell" data-move="'+esc(m.name)+'" data-mvtype="'+esc(type)+'" data-mvcat="'+esc(m.cat)+'">'+chip+'<span class="move-name">'+esc(m.name)+'</span></div>';
}

function moveCellHTML(m){
  if(!m||!m.name)return '';
  var type=m.type||MOVE_TYPE[m.name]||'';
  var color=typeColor(type);
  return '<div class="move-cell" style="border-color:'+color+';background:'+color+'22;cursor:pointer" data-move="'+esc(m.name)+'" data-mvtype="'+esc(type)+'" data-mvcat="'+esc(m.cat)+'"><div class="move-name">'+esc(m.name)+'</div><div class="move-meta"><span class="move-type" style="background:'+color+'">'+esc(typeLabel(type))+'</span><span class="move-cat">'+moveCatIcon(m.cat)+'</span></div></div>';
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

function detailHTML(c){var gi=genderOf(c.gender);var isTotem=/霸主|头目|頭目/i.test(c.name+' '+c.species);var sprite=pkImgHTML(c.species,c.icon,c.shiny,'dt-big');var ballIcon=c.ball?'<span class="item-icon placeholder item-wiki" data-item="'+esc(c.ball)+'" data-item-en="'+esc(c.ballEn||'')+'" data-cls="ball-icon dt-ball">?</span>':'';var itName=(c.item&&c.item!=='无')?c.item:'';
var hold=itName?('持有物：<span class="abi-link" data-item="'+esc(itName)+'" data-item-en="'+esc(c.itemEn||'')+'">'+esc(itName)+'</span>'):'持有物：无';var p1='<div class="dt-top">'+ballIcon+'<span class="dt-name">'+esc(c.name)+(isTotem?' <img class="mega-ic" style="font-size:clamp(.74rem,2.8vw,.88rem)" src="'+pkmRepoFirst(PKM_DATA_BASE+'UI/ui/头目.png')+'" alt="头目/霸主" onerror="this.remove()">':'')+(c.shiny?' <img class="mega-ic" style="font-size:clamp(.74rem,2.8vw,.88rem)" src="'+pkmRepoFirst(PKM_DATA_BASE+'UI/ui/闪光.png')+'" alt="闪光" onerror="this.remove()">':'')+'&nbsp;<span class="gender-sym '+gi.cls+'">'+gi.sym+'</span></span></div><div class="dt-sprite">'+sprite+'</div><div class="dt-lv">Lv.'+c.level+'</div><div class="dt-hold">'+hold+'</div>'+moveGridHTML(c.skills);var p2='<div class="row"><span class="k">属性</span>'+kojiDetailTypesHTML(c.attr1,c.attr2)+'</div><div class="row"><span class="k">性格</span><span class="v">'+(c.nature?'<span class="abi-link" data-nature="'+esc(c.nature)+'">'+esc(c.nature)+'</span>':'-')+'</span></div><div class="row"><span class="k">特性</span><span class="v">'+(c.ability?'<span class="abi-link" data-ability="'+esc(c.ability)+'">'+esc(c.ability)+'</span>':'-')+'</span></div>'+(c.status?'<div class="row"><span class="k">异常状态</span><span class="v">'+statusTag(c.status)+'</span></div>':'')+'<div class="row"><span class="k">HP</span><span class="v">'+c.hpCur+'/'+c.hpMax+'</span></div>'+(c.intimacy!==''?'<div class="row"><span class="k">亲密度</span><span class="v">'+esc(c.intimacy)+'/255</span></div>':'')+(c.hatch?'<div class="row"><span class="k">孵化剩余</span><span class="v">'+esc(c.hatch)+'</span></div>':'')+(c.partner?'<div class="row"><span class="k">搭档倾向</span><span class="v">'+esc(c.partner)+'</span></div>':'')+'<div class="row"><span class="k">经验</span><span class="v">'+esc(c.exp||'-')+'</span></div><div class="row"><span class="k">个体值</span>'+ivsHTML(c.iv)+'</div>';var hudActions='';
if(c.where==='team') hudActions+='<button class="act-btn" data-pkm-store>存入盒子</button>';
if(c.where==='box' && c.boxName) hudActions+='<button class="act-btn" data-pkm-withdraw>取出到队伍</button>';
if(c.where==='box' && c.boxName) hudActions+='<button class="act-btn" data-pkm-movebox>切换盒子</button>';
if(c.item && c.item!=='无') hudActions+='<button class="act-btn" data-pkm-unequip>卸下道具</button>';
hudActions+='<button class="act-btn" data-pkm-equip>携带道具</button>';
if(hudActions) hudActions='<div class="action-btns" style="margin-top:10px">'+hudActions+'</div>';
return '<div class="modal detail-modal one"><div class="modal-head"><div class="modal-name">宝可梦详情</div><button class="close" data-close>✕</button></div><div class="modal-body">'+p1+'<div class="dt-sep"></div>'+p2+hudActions+'</div></div>';}

function actionHTML(raw,key){var m=nearbyCategoryMeta(raw),p=m.pokemon,img=pkImgHTML(p.名字,p.图标,m.shiny,'action-img'),badges=nearbyPillsHTML(m)+nearbyTypeBarHTML(m),marks=nearbyNameIconsHTML(m);return '<div class="modal"><div class="modal-head"><div class="modal-name">选择行动</div><button class="close" data-close>✕</button></div><div class="modal-body"><div class="action-pkm nearby-action-head '+nearbyCellClasses(m)+'" style="'+nearbyCellStyle(m)+'"><div class="nb-edge"></div><div class="nearby-action-img">'+img+'</div><div class="action-info"><div class="nearby-name nearby-action-name">'+esc(p.名字)+' <span class="nb-name-icons">'+marks+'</span></div><div class="nb-pillbar nearby-action-pills">'+badges+'</div><div class="nearby-sub">数量 ×'+num(p.数量,1)+'</div></div></div><div class="action-btns"><button class="act-btn" data-action="对战" data-key="'+esc(key)+'">⚔️ 对战</button><button class="act-btn" data-action="捕捉" data-key="'+esc(key)+'">🔴 捕捉</button><button class="act-btn" data-action="观察" data-key="'+esc(key)+'">👀 观察</button></div></div></div>';}

function menuHTML(){return '<div class="menu-grid">'+MENU.map(function(m){var sz=getIconSize('m-'+m.key);var icon=m.img?'<span class="menu-icon-wrap"><img class="menu-icon" src="'+esc(m.img)+'" referrerpolicy="origin" style="width:'+sz+'px;height:'+sz+'px"></span>':'<span class="menu-icon-wrap"><span class="menu-emoji" style="font-size:'+sz+'px">'+esc(m.emoji)+'</span></span>';var badge=(m.key==='settings'&&pkHasUpdate)?'<span class="menu-badge">新</span>':'';return '<div class="menu-item" data-page="'+esc(m.key)+'"><div class="menu-item-inner">'+icon+'<span class="menu-label">'+esc(m.label)+badge+'</span></div></div>';}).join('')+'</div>';}

function devPanelHTML(errMsg){
  if(!devPanelOn()){
    return '<div id="dev-status" class="dim" style="font-size:.72rem;margin-top:6px">'+(errMsg?esc(errMsg):'未解锁（输入密码后出现「全图鉴」选项）')+'</div>';
  }
  var fullChk=devUnlocked()?' checked':'';
  return '<div class="dim" style="font-size:.72rem;margin-top:6px">✨ 开发者选项已解锁</div>'+
    '<div class="set-title" style="margin-top:10px">全图鉴</div>'+
    '<div class="set-opts"><label class="set-opt"><input type="checkbox" data-toggle="devfull"'+fullChk+'>解锁全部图鉴（图鉴里可见全宝可梦）</label></div>';
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

function diagHTML(){
  var d=diagInfo(),r=d.runtime||{},errs=r.errors||[],last=errs.length?errs[errs.length-1]:null,h='';
  h+='<div class="info-row info-row-click" data-cache-usage title="点击查看缓存明细"><span class="k">缓存占用</span><span class="v">'+esc(d.cache)+' 🔍</span></div>';
  h+='<div class="info-row"><span class="k">生命周期</span><span class="v">计时器 '+r.timers+' · 轮询 '+r.intervals+' · Observer '+r.observers+'</span></div>';
  h+='<div class="info-row"><span class="k">网络请求</span><span class="v">当前 '+r.activeRequests+' · 峰值 '+r.maxActiveRequests+'</span></div>';
  h+='<div class="info-row"><span class="k">索引</span><span class="v">精灵 '+r.locationIndex+' · DIY '+r.diyIndex+' · Rev '+esc(r.stateRevision||'-')+'</span></div>';
  h+='<div class="info-row"><span class="k">局部刷新</span><span class="v">'+Number((r.counters||{}).partialRenders||0)+' 次</span></div>';
  h+='<div class="info-row"><span class="k">最近错误</span><span class="v" style="color:'+(last?'#fbbf24':'#4ade80')+'">'+(last?esc(last.area+': '+last.message):'无')+'</span></div>';
  h+='<div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn-small" data-diag-refresh>🔍 重新检测</button><button class="btn-small" data-diag-copy>📋 复制诊断</button><button class="btn-small" data-diag-clear>🧹 清错误日志</button></div>';
  return h;
}

function settingsHTML(){
  var opts=[['mv','招式缓存'],['pm','宝可梦预览缓存'],['sprite','队伍精灵图缓存'],['ab','特性缓存'],['dex','图鉴列表'],['fid','形态ID'],['item','道具缓存'],['seen','图鉴收集进度'],['all','全部缓存']];
  var radios=opts.map(function(o){return '<label class="set-opt"><input type="radio" name="pk-clear" value="'+o[0]+'"'+(clearTarget===o[0]?' checked':'')+' data-clear="'+o[0]+'">'+o[1]+'</label>';}).join('');
  var itemChk=itemClickEnabled?' checked':'';
var winChk=(winMode==='1')?' checked':'';
var inlineOpt=(winMode==='0')?'<label class="set-opt" style="cursor:default">内嵌模式高度：<b>'+inlineH+'</b> px</label><button class="act-btn" data-inline-h-open>📏 调整内嵌模式高度</button>':'';
var fabOpt=(winMode==='1')?'<button class="act-btn" data-fab-open>🔵 悬浮球大小</button><button class="act-btn" data-fab-img-open>🖼 悬浮球图片</button>':'';
var repoOpts=typeof pkmRepoAutoDetect==='function'?'<div class="set-title">数据加载源</div><div class="dim" data-repo-auto>自动测速选择 GitHub 直连或镜像加速，失败时切换备用源。</div>':typeof pkmRepoOrder==='function'?'<div class="set-title">数据加载源</div><div class="set-opts"><label class="set-opt"><input type="radio" name="pk-repo-order" value="raw" data-repo-order="raw"'+(pkmRepoOrder()==='raw'?' checked':'')+'>GitHub 直连</label><label class="set-opt"><input type="radio" name="pk-repo-order" value="jsdelivr" data-repo-order="jsdelivr"'+(pkmRepoOrder()==='jsdelivr'?' checked':'')+'>镜像加速</label></div>':typeof PKM_REPO_MIRROR==='string'?'<div class="set-title">数据加载源</div><div class="dim" data-repo-fixed>优先使用 jsDelivr 镜像，失败时切换备用源。</div>':'';
return frame('设置','<div class="set-title">功能开关</div><div class="set-opts"><label class="set-opt"><input type="checkbox" data-toggle="itemclick"'+itemChk+'>点击道具查看效果</label></div>'+entertainmentModeHTML()+'<div class="set-title">界面模式</div><div class="set-opts"><label class="set-opt"><input type="checkbox" data-toggle="winmode"'+winChk+'>悬浮窗模式（关闭则显示在AI回复下方，刷新后生效）</label>'+inlineOpt+'</div><div class="set-title">精灵图源</div><div class="set-opts"><label class="set-opt"><input type="radio" name="pk-source" value="pokeos"'+(pkmSource==='pokeos'?' checked':'')+' data-source="pokeos">PokeOS</label><label class="set-opt"><input type="radio" name="pk-source" value="showdown"'+(pkmSource==='showdown'?' checked':'')+' data-source="showdown">Showdown</label></div>'+repoOpts+'<div class="set-title">图标</div><div class="set-opts"><button class="act-btn" data-isz-open>🎨 自定义图标大小</button>'+fabOpt+'</div><div class="set-title">清理缓存</div><div class="set-opts">'+radios+'</div><button class="act-btn" data-clear-start>清理所选缓存</button><div class="dim" style="font-size:.72rem;margin-top:8px">需连续确认 3 次；清理后缓存重新联网获取，图鉴进度只保留队伍和盒子里的</div><div class="set-title">运行诊断</div><div class="set-opts">'+diagHTML()+'</div><div class="set-title">脚本更新</div><div class="set-opts"><div class="info-row"><span class="k">当前版本</span><span class="v">v'+PK_VER+'</span></div>'+(pkHasUpdate?'<div class="info-row"><span class="k">新版本</span><span class="v" style="color:#ffe066">v'+esc(pkLatestVer||'')+' 可更新</span></div>':'')+'<button class="act-btn" data-pk-check-update>🔍 检查更新</button><button class="act-btn" data-pk-do-update style="display:none">⬆️ 更新到最新版</button><button class="act-btn" data-pk-show-content style="display:none">📋 复制脚本内容</button><button class="act-btn" data-pk-repair>🔧 修复（重新下载安装最新脚本）</button><div id="pk-update-msg" class="dim" style="font-size:.72rem;margin-top:4px"></div></div><div class="set-title">开发者选项</div><div class="set-opts"><div style="display:flex;gap:6px;align-items:center"><input type="password" id="dev-pwd" placeholder="输入开发者密码" style="flex:1;min-width:0;padding:6px 10px;font-family:inherit;font-size:.85rem;background:rgba(43,74,111,.5);border:1px solid var(--frame);border-radius:4px;color:var(--text);outline:none"><button class="btn-small" data-dev-unlock>解锁</button></div><div id="dev-panel">'+devPanelHTML()+'</div></div><details class="src-fold"><summary>资料来源</summary><div class="dim" style="font-size:.72rem;line-height:1.9;word-break:break-all;overflow-wrap:anywhere">图鉴、道具、招式、特性、种族值等文字数据及道具、精灵球图标图片：神奇宝贝百科（52poke）：<br>　　https://wiki.52poke.com<br>技能机（TM/TR/HM）图标：PokéSprite：<br>　　https://github.com/msikma/pokesprite<br>精灵图：<br>· Pokémon Showdown（像素小动图）：<br>　　https://play.pokemonshowdown.com<br>· PokeOS（高清HOME动图）：<br>　　https://www.pokeos.com/</div></details>');
}

function pageHTML(title,content){var mapCtl=(title==='地图')?'<button type="button" class="map-pad-toggle'+(mapManualControlsOpen?' on':'')+'" data-map-pad-toggle title="显示/隐藏地图方向与缩放按钮" aria-label="显示或隐藏地图方向与缩放按钮">🎮</button>':'';return '<div class="page"><div class="page-head">'+mapCtl+'<button class="page-close" data-page-close>✕</button></div><div class="page-body">'+content+'</div></div>';}

function cmdPanelHTML(){var rows=CMDS.map(function(c){return '<div class="cmd-row"><button class="cmd-btn" data-cmd="'+esc(c[1])+'" title="'+esc(c[2])+'">'+esc(c[0])+'</button><button class="cmd-tip" data-tip="'+esc(c[0])+'｜'+esc(c[2])+'" title="'+esc(c[2])+'">?</button></div>';}).join('');return '<details class="cmd-panel"'+(cmdOpen?' open':'')+'><summary>⌨️ 快捷指令 · 点击填入输入栏</summary><div class="cmd-note">羁绊每只每场限1次；亲密度≥200且未成为搭档时触发羁绊可觉醒搭档。把指令里的 XX 换成招式名再发送</div>'+rows+'</details>';}

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

function refreshIconHTML(){
  return '<img src="https://img.baibai.cv/f/WEvnT4/1789326633150.png" alt="刷新">';
}

function refreshBtnHTML(){
  return '<button type="button" class="hud-refresh-btn" data-hud-refresh title="刷新变量">'+refreshIconHTML()+'</button>';
}

function kojiRootHTML(inline){return '<div class="hud"><div class="hud-inner" id="hud-inner">'+
  '<div class="tab-panel active" id="tab-1">'+hudCmdBarHTML()+trainerHTML()+teamHTML()+quickHTML()+nearbyHTML()+'<div id="home-fold">'+homeFoldHTML()+'</div></div>'+
'<div class="tab-panel" id="tab-2">'+envStripHTML()+worldHTML()+tasksHTML()+rivalsHTML()+'</div>'+
  '<div class="tab-panel" id="tab-3">'+cmdPanelHTML()+battleHTML()+'</div>'+
  '<div class="tab-panel" id="tab-4">'+menuHTML()+'</div>'+
  '</div>'+
  '<div class="tab-bar"><button class="tab-btn active" data-tab="1">主页</button><button class="tab-btn" data-tab="2">世界</button><button class="tab-btn" data-tab="3">战场</button><button class="tab-btn" data-tab="4">菜单</button></div></div>';}

function kojiRelHasPortrait(name){return typeof relHasPortrait==='function'&&relHasPortrait(name);}
function kojiRelToolsHTML(){return typeof relHasPortrait==='function'?'<button type="button" class="btn-small rel-settings" data-rel-settings>配图</button><button type="button" class="btn-small" data-rel-del-open>删除人物</button>':'';}

/* Only detail labels are interactive; the core owns matchup calculations. */
function kojiDetailTypesHTML(a1,a2){
  if(typeof showTypeWeakness!=='function')return typesHTML(a1,a2);
  var defs=[a1,a2].filter(function(t){return t&&t!=='无';}).map(function(t){return typeLabel(t);});
  var all=defs.join('|');
  if(!defs.length)return '<span class="dim">-</span>';
  return '<div class="types">'+defs.filter(function(t,i){return defs.indexOf(t)===i;}).map(function(t){return '<span class="type-chip koji-detail-type-chip" role="button" tabindex="0" data-type-weak="'+esc(all)+'" aria-label="查看'+esc(defs.join('与'))+'属性的克制与抵抗" title="点击查看克制与抵抗" style="background:'+typeColor(t)+'">'+esc(t)+'</span>';}).join('')+'</div>';
}

/* Battle type parsing and presentation belong to the local view. */
function kojiBattleTypeChips(types){
  var labels=types.map(function(t){return typeLabel(btNormType(t));}).filter(Boolean);
  return kojiDetailTypesHTML(labels[0],labels[1]).replace(/^<div class="types">|<\/div>$/g,'');
}
function kojiBattleTypeLine(s){
  var parts=String(s||'').trim().split(/[\s·、,，/／]+/).filter(Boolean);
  if(!parts.length||typeof TYPE_CHART==='undefined')return '';
  var known=TYPE_CHART.map(function(row){return row[0];});
  var labels=parts.map(function(t){return typeLabel(btNormType(t));});
  if(labels.some(function(t){return known.indexOf(t)<0;}))return '';
  return '<div class="bt-line"><span class="bt-types">'+kojiBattleTypeChips(labels)+'</span></div>';
}
function kojiMapImgErr(el){
  if(typeof mapImgErr==='function'){mapImgErr(el);return;}
  el.style.display='none';
}
