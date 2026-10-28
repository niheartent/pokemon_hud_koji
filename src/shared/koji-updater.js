/*KOJI_UPDATE_RUNTIME_BEGIN*/
/* Resolve the active card by its storage identity, never by the first HUD in the library.
 * TauriTavern: character-identity.js / get_character / UpdateCharacterDto.
 * Display names are not storage keys; avatar stems are. */
// Shared by both full editions and by remotely composed future cores.
var kojiTauriWriteback=kojiCreateCharacterWriter(WIN,null,PK_BEAUTY_PACKAGE.channel);
var kojiNativeWriteback=pkUpdateScript;
pkUpdateScript=function(content){return WIN&&WIN.__TAURI_INTERNALS__?kojiTauriWriteback(content):kojiNativeWriteback(content);};
/* Two independent release channels, one verified installation per check. */
var kojiCheckPromise=null,kojiCheckVisible=false,kojiInstalling=false,kojiPrepared=null;
function kojiUpdateButtons(ready){
  document.querySelectorAll('[data-koji-writeback]').forEach(function(button){button.disabled=kojiInstalling;});
  document.querySelectorAll('[data-pk-do-update],[data-pk-show-content]').forEach(function(button){button.style.display=ready?'block':'none';button.disabled=kojiInstalling;});
}
function kojiVersion(code){var match=code.match(/var PK_VER='(\d+\.\d+\.\d+(?:-[\w.-]+)?)';/);if(!match)throw new Error('缺少核心版本号');return match[1];}
function kojiOwnURL(url){
  var parsed=new URL(url),manifestURL=new URL(PK_BEAUTY_PACKAGE.updateUrl),prefix=manifestURL.origin+manifestURL.pathname.replace(/\/main\/updates\/[^/]+$/,'/');
  if(parsed.href.indexOf(prefix)!==0||parsed.username||parsed.password)throw new Error('美化更新地址不属于发布仓库');return parsed.href;
}
function kojiFetchText(url){return hudFetch(url,{cache:'no-store'}).then(function(response){if(!response.ok)throw new Error('下载失败 HTTP '+response.status);return response.text();});}
function kojiParser(){if(!pkBeautyParser)pkBeautyParser=Function('return '+PK_BEAUTY_PACKAGE.parser)();return pkBeautyParser;}
function kojiPackage(code,manifest){
  var ast=kojiParser().parse(code,{ecmaVersion:'latest'}),node=null;
  function visit(n){if(!n||!n.type)return;if(n.type==='VariableDeclarator'&&n.id.name==='PK_BEAUTY_PACKAGE'){if(node)throw new Error('重复美化更新包');node=n.init;}for(var key in n){var value=n[key];if(Array.isArray(value))value.forEach(visit);else if(value&&value.type)visit(value);}}visit(ast);
  if(!node)throw new Error('缺少美化更新包');var pkg=JSON.parse(code.slice(node.start,node.end));
  if(pkg.version!==manifest.ui||pkg.channel!==PK_BEAUTY_PACKAGE.channel||pkg.schema!==2)throw new Error('美化更新包版本或通道不符');
  if(kojiVersion(code)!==manifest.core)throw new Error('发布核心版本不符');new Function(code);return pkg;
}
function kojiCompose(raw,pkg){
  // Execute only the checked package's composer, never boot the downloaded HUD.
  var compose=Function('PK_BEAUTY_PACKAGE',pkg.runtime+'\nreturn pkBeautyBuildRemote;')(pkg);
  return compose(raw);
}
function kojiCheckUpdate(quiet){
  if(kojiInstalling)return Promise.resolve(false);
  if(!quiet){kojiCheckVisible=true;pkSetUpdateMsg('正在检查美化版与弦九核心更新…');}
  if(kojiCheckPromise)return kojiCheckPromise;
  kojiPrepared=null;pkBeautyPreparedContent=null;pkBeautyPreparedVer=null;pkLatestContent=null;pkLatestVer=null;kojiUpdateButtons(false);
  function message(text){if(kojiCheckVisible)pkSetUpdateMsg(text);}
  var candidate=PK_BEAUTY_PACKAGE,releaseCode=null,warnings=[];
  // Settle both sources: either one may still be useful if the other fails.
  kojiCheckPromise=Promise.allSettled([
    kojiFetchText(kojiOwnURL(PK_BEAUTY_PACKAGE.updateUrl)+'?t='+Date.now()),
    kojiFetchText(PK_UPDATE_URL+'?t='+Date.now())
  ]).then(function(results){
    var upstream=results[1].status==='fulfilled'?results[1].value:null;
    if(!upstream)warnings.push('原版检查失败');
    if(results[0].status==='rejected'){warnings.push('美化检查失败');return upstream;}
    return Promise.resolve().then(function(){
    var manifest=JSON.parse(results[0].value);
    if(manifest.schema!==1||manifest.channel!==candidate.channel||!/^\d+\.\d+\.\d+$/.test(manifest.ui)||!/^\d+\.\d+\.\d+(?:-[\w.-]+)?$/.test(manifest.core))throw new Error('美化更新清单无效');
    if(pkVerCompare(manifest.ui,PK_BEAUTY_VER)<=0)return upstream;
    if(!/^[a-f0-9]{64}$/.test(manifest.sha256))throw new Error('发布校验值无效');
    return kojiFetchText(kojiOwnURL(manifest.script)).then(function(code){return pkSha256Text(code).then(function(hash){if(!hash||hash!==manifest.sha256)throw new Error('美化脚本 SHA-256 校验失败');candidate=kojiPackage(code,manifest);releaseCode=code;return upstream;});});
    }).catch(function(error){warnings.push('美化更新未采用：'+error.message);return upstream;});
  }).then(function(upstream){
    var uiNew=pkVerCompare(candidate.version,PK_BEAUTY_VER)>0,coreNew=false,code=null,core=null;
    if(upstream){
      try{core=kojiVersion(upstream);coreNew=pkVerCompare(core,PK_VER)>0;if(coreNew){pkLatestContent=upstream;pkLatestVer=core;pkLatestNotice=((upstream.match(/\/\*PK_NOTICE_BEGIN([\s\S]*?)PK_NOTICE_END\*\//)||[])[1]||'').trim();}
        if((uiNew||coreNew)&&pkVerCompare(core,PK_VER)>=0)code=kojiCompose(upstream,candidate);
      }catch(error){warnings.push('最新原版不兼容：'+error.message);code=null;}
    }
    // A tested release can update the UI even when the newest upstream is incompatible.
    if(!code&&uiNew&&releaseCode&&pkVerCompare(kojiVersion(releaseCode),PK_VER)>=0){code=releaseCode;core=kojiVersion(code);}
    if(!code&&uiNew)warnings.push('新美化版暂无兼容且不降低当前核心的组合');
    if(!code){pkClearHasUpdate();message(warnings.length?'未安装：'+warnings.join('；'):'已是最新版本：核心 v'+PK_VER+' · 美化 v'+PK_BEAUTY_VER);return false;}
    kojiPrepared={content:code,core:core,ui:candidate.version,writebackPackage:candidate};pkBeautyPreparedContent=code;pkBeautyPreparedVer=core;pkLatestContent=code;pkLatestVer=core;
    pkLatestNotice=((code.match(/\/\*PK_NOTICE_BEGIN([\s\S]*?)PK_NOTICE_END\*\//)||[])[1]||'').trim();pkMarkHasUpdate(core);kojiUpdateButtons(true);
    message('可更新：核心 v'+core+' · 美化 v'+candidate.version+'，已合成并检查。'+(warnings.length?' '+warnings.join('；'):''));return true;
  }).catch(function(error){kojiPrepared=null;pkBeautyPreparedContent=null;pkBeautyPreparedVer=null;pkLatestContent=null;pkLatestVer=null;kojiUpdateButtons(false);pkClearHasUpdate();message('未安装：'+error.message);return false;}).then(function(result){kojiCheckPromise=null;kojiCheckVisible=false;return result;});
  return kojiCheckPromise;
}
function kojiDoUpdate(){
  if(kojiInstalling)return Promise.resolve(false);
  if(!kojiPrepared){pkSetUpdateMsg('请先检查更新，通过后才能安装');return Promise.resolve(false);}
  var prepared=kojiPrepared;kojiInstalling=true;kojiUpdateButtons(true);pkSetUpdateMsg('正在保存核心 v'+prepared.core+' · 美化 v'+prepared.ui+'…');
  return Promise.resolve().then(function(){return pkInstallRecord(prepared.core,prepared.content);}).then(function(){
    return Promise.resolve().then(function(){var writer=kojiPreparedCharacterWriter(WIN,prepared.writebackPackage);return writer?writer(prepared.content):pkUpdateScript(prepared.content);}).then(function(result){if(result&&result.ok)kojiClearLegacyWriteback(WIN,PK_BEAUTY_PACKAGE.channel,prepared.content);pkClearHasUpdate();pkSetUpdateMsg(result&&result.ok?'新版已写入当前角色卡并校验成功；刷新可加载新版界面。':'本地更新已保存；角色卡写回失败：'+(result&&result.msg||'未返回保存结果')+'。刷新后可使用本地新版，或复制已合成脚本导入。');return true;},function(error){pkSetUpdateMsg('本地更新已保存；角色卡写回失败：'+(error&&error.message||String(error))+'。刷新后可使用本地新版。');return true;});
  }).catch(function(error){pkSetUpdateMsg('未安装：本地保存失败，'+error.message);return false;}).then(function(result){kojiInstalling=false;kojiUpdateButtons(true);return result;});
}
function kojiRetryWriteback(){
  if(kojiInstalling)return Promise.resolve(false);
  kojiInstalling=true;kojiUpdateButtons(!!kojiPrepared);pkSetUpdateMsg('正在将本地已安装版本写回当前角色卡…');
  return Promise.resolve().then(function(){return pkSlotRead('active');}).then(function(record){
    if(!record||!record.content)throw Error('没有本地已安装版本，请先检查并安装更新');
    var ui=(record.content.match(/var PK_BEAUTY_VER='([^']+)';/)||[])[1];
    if(kojiVersion(record.content)!==PK_VER||ui!==PK_BEAUTY_VER)throw Error('本地版本与当前运行版本不同，请刷新后重试');
    return pkUpdateScript(record.content);
  }).then(function(result){
    if(!result||!result.ok)throw Error(result&&result.msg||'未返回保存结果');
    pkSetUpdateMsg('当前已安装版本已写回角色卡，并通过保存验证。');return true;
  }).catch(function(error){pkSetUpdateMsg('角色卡写回失败：'+(error&&error.message||String(error)));return false;}).then(function(ok){kojiInstalling=false;kojiUpdateButtons(!!kojiPrepared);return ok;});
}
pkCheckUpdate=function(){return kojiCheckUpdate(false);};
pkAutoCheckUpdate=function(){return kojiCheckUpdate(true);};
pkDoUpdate=function(){return kojiDoUpdate();};
pkRepair=function(){pkSetUpdateMsg('请先检查两路更新，通过后再安装已合成版本。');};
/*KOJI_UPDATE_RUNTIME_END*/
