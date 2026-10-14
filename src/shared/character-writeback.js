/* A pure writer factory: usable by a verified downloaded package before HUD reload. */
function kojiCreateCharacterWriter(WIN,invoke){
function kojiTauriInvoke(command,args){
  var bridge=WIN&&WIN.__TAURI_INTERNALS__;
  if(!bridge||typeof bridge.invoke!=='function')return Promise.reject(Error('桌面端角色卡接口不可用'));
  try{return Promise.resolve((invoke||bridge.invoke).call(bridge,command,args));}catch(error){return Promise.reject(error);}
}
function kojiCharacterHud(card){
  var candidates=[card,card&&card.data,card&&card.character,card&&card.character&&card.character.data];
  for(var i=0;i<candidates.length;i++){
    var ext=candidates[i]&&candidates[i].extensions,scripts=ext&&ext.tavern_helper&&ext.tavern_helper.scripts;
    if(!Array.isArray(scripts))continue;
    for(var j=0;j<scripts.length;j++)if(scripts[j]&&typeof scripts[j].content==='string'&&scripts[j].content.indexOf('pkm-hud-btn')>=0&&scripts[j].content.indexOf('PK_VER')>=0)return {extensions:ext,scripts:scripts,idx:j};
  }
  return null;
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

/* Legacy updaters execute the verified package composer during check, but still
 * call their old writer during install. Route only that exact composed payload
 * through the new writer. Other host commands are untouched; restore on success. */
function kojiLegacyWritebackHost(){
  if(typeof window==='undefined')return null;
  try{if(window.parent&&window.parent!==window&&window.parent.document&&window.parent.document.body)return window.parent;}catch(e){}
  return window;
}
function kojiClearLegacyWriteback(host,channel,content){
  var bridge=host&&host.__TAURI_INTERNALS__,state=bridge&&bridge.__kojiHudWritebackBridgeV1;
  if(!state)return;
  var entry=state.entries[channel];if(entry&&entry.content===content)delete state.entries[channel];
  if(Object.keys(state.entries).length===0&&bridge.invoke===state.shim){bridge.invoke=state.original;delete bridge.__kojiHudWritebackBridgeV1;}
}
function kojiStageLegacyWriteback(content,pkg){
  var host=kojiLegacyWritebackHost(),bridge=host&&host.__TAURI_INTERNALS__;
  if(!bridge||typeof bridge.invoke!=='function')return;
  var state=bridge.__kojiHudWritebackBridgeV1;
  if(!state){
    state={original:bridge.invoke,entries:Object.create(null)};
    state.shim=function(command,args){
      if(command==='update_character'&&args&&args.dto){
        var dto=args.dto,locations=[dto,dto.data,dto.character,dto.character&&dto.character.data];
        for(var channel in state.entries){
          var entry=state.entries[channel],matches=locations.some(function(o){var th=o&&o.extensions&&o.extensions.tavern_helper;return th&&Array.isArray(th.scripts)&&th.scripts.some(function(script){return script&&script.content===entry.content;});});
          if(matches){
            // Newer hosts/writers already send a minimal extensions DTO. Preserve
            // that request exactly; only the obsolete full-card DTO needs rerouting.
            if(!dto.avatar){
              return Promise.resolve(state.original.apply(bridge,arguments)).then(function(result){kojiClearLegacyWriteback(host,entry.channel,entry.content);return result;});
            }
            if(!entry.pending)entry.pending=entry.writer(entry.content).then(function(result){
              if(!result||!result.ok)throw Error(result&&result.msg||'角色卡写回未成功');
              kojiClearLegacyWriteback(host,entry.channel,entry.content);return result;
            }).finally(function(){entry.pending=null;});
            return entry.pending;
          }
        }
      }
      return state.original.apply(bridge,arguments);
    };
    try{bridge.invoke=state.shim;if(bridge.invoke!==state.shim)return;bridge.__kojiHudWritebackBridgeV1=state;}catch(e){return;}
  }
  state.entries[pkg.channel]={channel:pkg.channel,content:content,writer:kojiCreateCharacterWriter(host,state.original),pending:null};
}
function kojiPreparedCharacterWriter(host,pkg){
  if(!pkg||typeof pkg.writebackRuntime!=='string')return null;
  var bridge=host&&host.__TAURI_INTERNALS__,state=bridge&&bridge.__kojiHudWritebackBridgeV1;
  if(!bridge)return null;
  return Function('host','invoke',pkg.writebackRuntime+'\nreturn kojiCreateCharacterWriter(host,invoke);')(host,state?state.original:bridge.invoke);
}
