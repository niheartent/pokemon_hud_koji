/* Same syntax-based composer used by local builds and in-HUD updates. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const acorn=require('acorn');
const root=__dirname,out=path.join(root,'HUD美化版-交付'),sourcePath=path.join(root,'pkm-hud-swsh-upstream.json');
const payload=JSON.parse(fs.readFileSync(sourcePath,'utf8').replace(/^\uFEFF/,'')),source=payload.content;
const read=name=>fs.readFileSync(path.join(root,name),'utf8').replace(/\r\n/g,'\n');
const version='1.4.11',sourceAst=acorn.parse(source,{ecmaVersion:'latest'});
const outer=sourceAst.body[0].expression.callee.body,versionDeclaration=outer.body.filter(n=>n.type==='VariableDeclaration').flatMap(n=>n.declarations).find(n=>n.id.name==='PK_VER');
const core=versionDeclaration.init.value;
const license=fs.readFileSync(path.join(path.dirname(require.resolve('acorn')),'../LICENSE'),'utf8');
const parser='(function(){var exports={},module={exports:exports};\n/* '+license+' */\n'+fs.readFileSync(require.resolve('acorn'),'utf8').replace(/\r\n/g,'\n')+'\nreturn module.exports;})()';
const pkg={schema:2,version,channel:'swsh',updateUrl:'https://raw.githubusercontent.com/niheartent/pokemon_hud_koji/main/updates/swsh.json',updateRuntime:read('../shared/koji-updater.js'),runtimeDb:'pk_hud_koji_swsh_runtime_v1',interfaces:['render','teamHTML','trainerHTML','quickHTML','homeFoldHTML','menuHTML','worldHTML','cmdPanelHTML','settingsHTML','showNoticeModal','pkCheckUpdate','pkDoUpdate','pkRepair','pkInstallRecord','pkUpdateScript','pkSetUpdateMsg','buildCards','pkImgHTML','pkImgFix','resolvePkmImgs','hudResolvePkidbImages','getIconSize','resizeFrame'],parser,runtime:read('../shared/koji-bootstrap.js').replace(/if\(typeof module[^\n]+\n?/,'')+'\n'+read('swsh-compat.js'),beauty:read('swsh-icons.js')+'\n'+read('swsh-beauty.js')+'\n'+read('swsh-adapter.js'),styleOwnership:'swsh',css:read('swsh-foundation.css')+'\n'+read('swsh-hud.css')+'\n'+read('swsh-colors.css')};
pkg.coreNotice=((source.match(/\/\*PK_NOTICE_BEGIN([\s\S]*?)PK_NOTICE_END\*\//)||[])[1]||'').trim();
pkg.beautyNotice='剑盾样式基础、字体和主题完全由美化版管理，原版核心更新不再带入其 CSS。\n修复暗色背包和人际关系栏目误用红色强调条，恢复蓝色；白天保留红色。\n设置只保留白天／暗色切换，移除主题预设、选色、深浅与文字颜色控件，修复白底浅字。\n修复白天主题的训练家、附近宝可梦、背包、人际关系与战场颜色。\n语义颜色集中管理，美化样式在原版全部 CSS 之后应用。\n首次使用默认暗色，保留已保存的白天选择。';
const scope={PK_BEAUTY_PACKAGE:pkg};vm.createContext(scope);vm.runInContext(pkg.runtime,scope);const code=scope.pkBeautyBuildRemote(source);
acorn.parse(code,{ecmaVersion:'latest'});new Function(code);
payload.name='宝可梦 HUD 美化版';payload.id='7a84833f-6436-599b-a78a-952d0578c9e7';
payload.info='剑盾美化版 v'+version+'，基于弦九核心 v'+core+'。语法定位注入与原生界面装饰，保留上游函数；兼容检查通过后安装合成美化版。';payload.content=code;
fs.mkdirSync(out,{recursive:true});for(const folder of [root,out])for(const stem of ['宝可梦HUD-美化版','宝可梦HUD-剑盾风格']){fs.writeFileSync(path.join(folder,stem+'.json'),JSON.stringify(payload,null,2));fs.writeFileSync(path.join(folder,stem+'.js'),code);}
const manifest={core,ui:version,schema:2,source:'pkm-hud-swsh-upstream.json',sourceSha256:crypto.createHash('sha256').update(source).digest('hex'),runtimeDb:pkg.runtimeDb,scriptId:payload.id,injectionPoints:4,interfaces:pkg.interfaces,nativeFunctionsPreserved:true,styleOwnership:'swsh',visualFoundation:'swsh-foundation.css',aliasesContainSameScript:true,embeddedParser:'Acorn '+acorn.version};
fs.writeFileSync(path.join(out,'构建信息.json'),JSON.stringify(manifest,null,2));fs.writeFileSync(path.join(out,'Acorn许可证.txt'),license);
console.log(JSON.stringify({core,ui:version,schema:2,injectionPoints:4,bytes:Buffer.byteLength(code)}));


