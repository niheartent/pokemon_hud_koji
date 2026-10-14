/* A pure writer factory: usable by a verified downloaded package before HUD reload. */
function kojiCreateCharacterWriter(WIN,invoke,channel){
function kojiTauriInvoke(command,args){
  var bridge=WIN&&WIN.__TAURI_INTERNALS__;
  if(!bridge||typeof bridge.invoke!=='function')return Promise.reject(Error('桌面端角色卡接口不可用'));
  try{return Promise.resolve((invoke||bridge.invoke).call(bridge,command,args));}catch(error){return Promise.reject(error);}
}
function kojiCharacterHud(card){
  var candidates=[card,card&&card.data,card&&card.character,card&&card.character&&card.character.data],hits=[],seen=[];
  for(var i=0;i<candidates.length;i++){
    var ext=candidates[i]&&candidates[i].extensions,scripts=ext&&ext.tavern_helper&&ext.tavern_helper.scripts;
    if(!Array.isArray(scripts)||seen.indexOf(scripts)>=0)continue;seen.push(scripts);
    for(var j=0;j<scripts.length;j++){
      var script=scripts[j];
      if(!script||script.enabled===false||typeof script.content!=='string'||script.content.indexOf('pkm-hud-btn')<0||script.content.indexOf('PK_VER')<0)continue;
      var match=script.content.match(/"channel":"(swsh|bw2)"/);
      hits.push({extensions:ext,scripts:scripts,idx:j,channel:match?match[1]:null});
    }
  }
  var own=channel?hits.filter(function(h){return h.channel===channel;}):hits;
  if(own.length===1)return own[0];
  if(own.length>1)throw Error('当前角色卡启用了多个相同版本类型的 HUD，请只启用一个');
  var legacy=hits.filter(function(h){return !h.channel;});
  return legacy.length===1?legacy[0]:null;
}
function kojiCharacterStem(card){
  var avatar=card&&(card.avatar||(card.data&&card.data.avatar));
  return typeof avatar==='string'&&/^[^\\/]+\.png$/i.test(avatar)?avatar.slice(0,-4):'';
}
function kojiCurrentCharacter(){
  var st=WIN&&WIN.SillyTavern,ctx=st&&st.getContext?st.getContext():null;
  if(!ctx||ctx.characterId===null||ctx.characterId===undefined||ctx.characterId==='')throw Error('当前会话没有选中的角色卡');
  var card=ctx.characters&&ctx.characters[ctx.characterId];
  return Promise.resolve(card|| (typeof ctx.getOneCharacter==='function'?ctx.getOneCharacter(ctx.characterId):null)).then(function(value){
    if(!value)throw Error('无法读取当前会话角色卡');
    return {card:value,id:ctx.characterId,key:kojiCharacterStem(value)};
  });
}
function kojiTauriTarget(){
  return kojiCurrentCharacter().then(function(active){
    if(active.key)return active;
    // Older context bridges may omit avatar. Resolve a unique display-name match
    // from the live list, then use its avatar identity for all reads and writes.
    return kojiTauriInvoke('get_all_characters',{shallow:false}).then(function(res){
      var list=Array.isArray(res)?res:res&&(res.items||res.characters||res.data||res.list);
      if(!Array.isArray(list))throw Error('角色列表格式不受支持');
      var name=active.card.name||(active.card.data&&active.card.data.name),matches=list.filter(function(c){return name&&(c.name||(c.data&&c.data.name))===name&&kojiCharacterStem(c);});
      if(matches.length!==1)throw Error('无法唯一确认当前角色卡的存储标识');
      active.key=kojiCharacterStem(matches[0]);return active;
    });
  });
}
function kojiTauriWriteback(content){
  function attempt(){
    var selected;
    return kojiTauriTarget().then(function(active){
      selected=active;return kojiTauriInvoke('get_character',{name:active.key});
    }).then(function(card){
      card=card&&card.character||card;
      if(!card||kojiCharacterStem(card)!==selected.key)throw Error('角色卡读取结果与当前存储标识不一致');
      var fresh=JSON.parse(JSON.stringify(card)),hit=kojiCharacterHud(fresh);
      if(!hit)throw Error('当前角色卡内没有可更新的 HUD 脚本');
      hit.scripts[hit.idx].content=content;
      var extensions=hit.extensions;
      if(!extensions)throw Error('当前角色卡缺少 HUD 扩展字段');
      return kojiTauriTarget().then(function(now){
        if(now.key!==selected.key)throw Error('更新期间切换了角色卡，请在当前卡重新检查更新');
        return kojiTauriInvoke('update_character',{name:selected.key,dto:{extensions:extensions}});
      });
    }).then(function(){return kojiTauriInvoke('get_character',{name:selected.key});}).then(function(saved){
      var hit=kojiCharacterHud(saved);
      if(!hit||hit.scripts[hit.idx].content!==content)throw Error('角色卡保存后回读校验未通过');
      return kojiCurrentCharacter().then(function(active){
        // Keep the active frontend copy consistent so a later host save cannot
        // overwrite the verified script with the pre-update cached content.
        if(active.key===selected.key){var cached=kojiCharacterHud(active.card);if(cached)cached.scripts[cached.idx].content=content;}
        return {ok:true,msg:'角色卡脚本已保存并回读验证'};
      },function(){return {ok:true,msg:'角色卡脚本已保存并回读验证'};});
    });
  }
  return Promise.resolve().then(attempt).catch(function(error){
    var message=error&&error.message||String(error);
    if(!/not found|找不到角色/i.test(message))throw error;
    // Rebuild stale backend indexes after a card import/replacement, once only.
    return kojiTauriInvoke('clear_character_cache',{}).catch(function(){}).then(attempt);
  }).catch(function(error){return {ok:false,msg:error&&error.message||String(error)};});
}
return kojiTauriWriteback;
}

/* Old clients cannot replace their closed-over installer. The verified composer
 * arms a scoped button handler which uses this package's slot installer/writer.
 * Checking never writes. No host API is patched and no downloaded HUD is started. */
function kojiLegacyWritebackHost(){
  if(typeof window==='undefined')return null;
  try{if(window.parent&&window.parent!==window&&window.parent.document&&window.parent.document.body)return window.parent;}catch(e){}
  return window;
}
function kojiClearLegacyWriteback(host,channel,content){
  var state=host&&host.__kojiHudLiveInstallerV1;if(!state)return;
  var entry=state.entries[channel];if(entry&&entry.content===content)delete state.entries[channel];
  if(Object.keys(state.entries).length===0){host.document.removeEventListener('click',state.handler,true);delete host.__kojiHudLiveInstallerV1;}
}
function kojiStageLegacyWriteback(content,pkg){
  var host=kojiLegacyWritebackHost();
  if(!host||!host.__TAURI_INTERNALS__||typeof pkg.installRuntime!=='string')return;
  var state=host.__kojiHudLiveInstallerV1;
  if(state&&state.busy)return;
  if(!state){
    state={entries:Object.create(null),busy:false};
    state.handler=function(event){
      var button=event.target&&event.target.closest&&event.target.closest('[data-pk-do-update]');if(!button)return;
      var channel=button.closest('.bw2-host')?'bw2':'swsh',entry=state.entries[channel];if(!entry)return;
      event.preventDefault();event.stopImmediatePropagation();if(state.busy)return;
      var box=button.closest('.set-opts')||button.parentElement,msg=box.querySelector('#pk-update-msg')||host.document.getElementById('pk-update-msg');
      function message(text){if(msg)msg.textContent=text;}
      state.busy=true;entry.pending=true;button.disabled=true;message('正在安装并写入当前角色卡…');
      var slots=null,localSaved=false;
      Promise.resolve().then(function(){
        slots=Function('host','db',entry.pkg.installRuntime+'\nreturn kojiCreateSlotInstaller(host,db);')(host,entry.pkg.runtimeDb);
        var version=(entry.content.match(/var PK_VER='([^']+)';/)||[])[1],db=(entry.content.match(/var PK_RUNTIME_DB=['"]([^'"]+)['"];/)||[])[1];if(!version||db!==entry.pkg.runtimeDb)throw Error('安装包核心版本或更新槽标识无效');
        return slots.install(version,entry.content);
      }).then(function(){
        localSaved=true;return kojiCreateCharacterWriter(host,null,entry.pkg.channel)(entry.content);
      }).then(function(result){
        if(!result||!result.ok)throw Error(result&&result.msg||'角色卡写回未成功');
        message('新版已写入当前角色卡并校验成功；刷新可加载新版界面。');button.textContent='已写入当前角色卡';button.disabled=true;
        kojiClearLegacyWriteback(host,entry.pkg.channel,entry.content);
      }).catch(function(error){
        message((localSaved?'本地更新已保存；角色卡写回失败：':'未安装：')+(error&&error.message||String(error)));button.disabled=false;
      }).finally(function(){state.busy=false;entry.pending=false;if(slots)slots.close();});
    };
    host.__kojiHudLiveInstallerV1=state;host.document.addEventListener('click',state.handler,true);
    var scope=host.__pkmHudScope_v180;
    if(scope&&typeof scope.cleanup==='function')scope.cleanup(function(){if(host.__kojiHudLiveInstallerV1===state){host.document.removeEventListener('click',state.handler,true);delete host.__kojiHudLiveInstallerV1;}});
  }
  state.entries[pkg.channel]={content:content,pkg:pkg,pending:false};
}
function kojiPreparedCharacterWriter(host,pkg){
  if(!pkg||typeof pkg.writebackRuntime!=='string'||!host||!host.__TAURI_INTERNALS__)return null;
  return Function('host','channel',pkg.writebackRuntime+'\nreturn kojiCreateCharacterWriter(host,null,channel);')(host,pkg.channel);
}
