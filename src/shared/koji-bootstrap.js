/* Core versions and beauty versions advance independently. */
function kojiPatchBootstrap(code){
  var anchor='if(active&&active.version&&pkVerCompare(active.version,PK_VER)>0){';
  var replacement="if(active&&active.version&&/var PK_BEAUTY_VER='[^']+';/.test(active.content||'')&&((pkVerCompare(active.version,PK_VER)>0&&pkVerCompare(((active.content||'').match(/var PK_BEAUTY_VER='([^']+)';/)||[])[1],PK_BEAUTY_VER)>=0)||(pkVerCompare(active.version,PK_VER)===0&&pkVerCompare(((active.content||'').match(/var PK_BEAUTY_VER='([^']+)';/)||[])[1],PK_BEAUTY_VER)>0))){";
  if(code.split(anchor).length!==2)throw new Error('原版接口已变化：双版本启动检查');
  return code.replace(anchor,function(){return replacement;});
}
if(typeof module!=='undefined'&&module.exports)module.exports=kojiPatchBootstrap;
