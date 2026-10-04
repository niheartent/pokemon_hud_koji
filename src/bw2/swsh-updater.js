/* Runs inside the HUD scope. The package is embedded by build_swsh_hud.py. */
var pkBeautyPreparedContent=null;
var pkBeautyPreparedVer=null;
var pkBeautyCheckPromise=null,pkBeautyCheckVisible=false,pkBeautyInstalling=false;
function pkBeautyUpdateButtons(ready){
  document.querySelectorAll('[data-pk-do-update],[data-pk-show-content]').forEach(function(button){button.style.display=ready?'block':'none';button.disabled=pkBeautyInstalling;});
}
function pkBeautyBindUpdateUI(app){
  if(app._bw2UpdateBound)return;app._bw2UpdateBound=true;
  hudScope.listen(app,'click',function(e){
    var button=e.target.closest&&e.target.closest('[data-pk-show-content],[data-pk-copy-content],[data-pk-copy-content-close]');if(!button)return;
    if(!pkBeautyPreparedContent||pkBeautyPreparedVer!==pkLatestVer){e.preventDefault();e.stopImmediatePropagation();pkSetUpdateMsg('请先检查兼容性，只能复制已合成的黑白2脚本');return;}
    pkLatestContent=pkBeautyPreparedContent;
  },true);
}
function pkBeautyCheckUpdate(quiet){
  if(pkBeautyInstalling){if(!quiet)pkSetUpdateMsg('正在安装，请稍候');return Promise.resolve(false);}
  if(!quiet){pkBeautyCheckVisible=true;pkSetUpdateMsg('正在检查原版核心更新与黑白2兼容性…');}
  if(pkBeautyCheckPromise)return pkBeautyCheckPromise;
  pkBeautyPreparedContent=null;pkBeautyPreparedVer=null;pkLatestContent=null;pkLatestVer=null;pkBeautyUpdateButtons(false);
  function message(text){if(pkBeautyCheckVisible)pkSetUpdateMsg(text);}
  pkBeautyCheckPromise=Promise.resolve().then(function(){return hudFetch(PK_UPDATE_URL+'?t='+Date.now(),{cache:'no-store'});}).then(function(response){
    if(!response.ok)throw new Error('下载失败 HTTP '+response.status);return response.text();
  }).then(function(raw){
    var match=raw.match(/var PK_VER='(\d+\.\d+\.\d+(?:-[\w.-]+)?)';/);if(!match)throw new Error('远程内容缺少原版版本号');
    var ver=match[1];if(pkVerCompare(ver,PK_VER)<=0){pkClearHasUpdate();message('原版核心已是最新 v'+PK_VER+' · 黑白2 UI v'+PK_BEAUTY_VER+' 保持当前版本');return false;}
    var content=pkBeautyBuildRemote(raw);
    pkBeautyPreparedContent=content;pkBeautyPreparedVer=ver;pkLatestContent=content;pkLatestVer=ver;
    pkLatestNotice=((raw.match(/\*PK_NOTICE_BEGIN([\s\S]*?)PK_NOTICE_END\*/)||[])[1]||'').trim();
    pkMarkHasUpdate(ver);pkBeautyUpdateButtons(true);message('核心 v'+ver+' 已通过接入点和语法检查，可安装；黑白2 UI v'+PK_BEAUTY_VER+' 保留。');return true;
  }).catch(function(error){
    pkBeautyPreparedContent=null;pkBeautyPreparedVer=null;pkLatestContent=null;pkLatestVer=null;pkBeautyUpdateButtons(false);pkClearHasUpdate();message('未更新：'+(error&&error.message||error));return false;
  }).then(function(result){pkBeautyCheckPromise=null;pkBeautyCheckVisible=false;return result;});
  return pkBeautyCheckPromise;
}
function pkBeautyDoUpdate(){
  if(pkBeautyInstalling)return Promise.resolve(false);
  if(!pkBeautyPreparedContent||pkBeautyPreparedVer!==pkLatestVer){pkSetUpdateMsg('请先检查兼容性，通过后才能安装');return Promise.resolve(false);}
  var content=pkBeautyPreparedContent,ver=pkBeautyPreparedVer;pkBeautyInstalling=true;pkBeautyUpdateButtons(true);pkSetUpdateMsg('正在保存已合成的黑白2版，核心 v'+ver+'…');
  return Promise.resolve().then(function(){return pkInstallRecord(ver,content);}).then(function(){
    return Promise.resolve().then(function(){return pkUpdateScript(content);}).then(function(result){
      pkClearHasUpdate();pkSetUpdateMsg(result&&result.ok?'已保存黑白2版，核心 v'+ver+'；刷新页面生效。':'已保存本地更新，刷新后生效；角色卡写回未成功，可复制已合成脚本手动更新。');return true;
    },function(error){pkSetUpdateMsg('已保存本地更新；角色卡写回失败，可复制已合成脚本：'+(error&&error.message||error));return true;});
  }).catch(function(error){pkSetUpdateMsg('本地更新保存失败，未安装；可复制已合成脚本：'+(error&&error.message||error));return false;}).then(function(result){pkBeautyInstalling=false;pkLatestContent=content;pkLatestVer=ver;pkBeautyUpdateButtons(true);return result;});
}
var pkBeautyParser=null;
function pkBeautyBuildRemote(raw){
  var pkg=PK_BEAUTY_PACKAGE;
  if(typeof raw!=='string'||raw.indexOf('PK_BEAUTY_PACKAGE')>=0)throw new Error('下载内容不是原版脚本');
  if(raw.indexOf('pkm-hud-btn')<0)throw new Error('原版 HUD 标识缺失');
  if(!pkBeautyParser)pkBeautyParser=Function('return '+pkg.parser)();
  var adapted;
  try{adapted=bw2AdaptCore(kojiOwnPresentation(raw,pkBeautyParser,pkg.presentation,pkg.nativeCss,pkg.presentationContract),pkBeautyParser,{version:pkg.version,nativeCss:pkg.nativeCss});}
  catch(e){throw new Error('原版接口不兼容：'+(e&&e.message||e));}
  var code=kojiPatchBootstrap(adapted.code);
  var injected="\nvar PK_BEAUTY_PACKAGE="+JSON.stringify(pkg)+";\n"+pkg.runtime+"\n"+pkg.beauty+"\n"+(pkg.updateRuntime||'')+"\ncss += "+JSON.stringify(pkg.css)+";";
  code=kojiInsertPresentationModule(code,pkBeautyParser,injected);
  try{new Function(code);}catch(e){throw new Error('合成后的脚本语法错误：'+(e&&e.message||e));}
  return code;
}
