/* Same syntax-based composer used by local builds and in-HUD updates. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const acorn=require('acorn');
const root=__dirname,out=path.join(root,'HUD美化版-交付'),sourcePath=path.join(root,'pkm-hud-swsh-upstream.json');
const payload=JSON.parse(fs.readFileSync(sourcePath,'utf8').replace(/^\uFEFF/,'')),source=require('../shared/upstream-core.cjs')();
const read=name=>fs.readFileSync(path.join(root,name),'utf8').replace(/\r\n/g,'\n');
const version='1.6.8',sourceAst=acorn.parse(source,{ecmaVersion:'latest'});
const outer=sourceAst.body[0].expression.callee.body,versionDeclaration=outer.body.filter(n=>n.type==='VariableDeclaration').flatMap(n=>n.declarations).find(n=>n.id.name==='PK_VER');
const core=versionDeclaration.init.value;
const license=fs.readFileSync(path.join(path.dirname(require.resolve('acorn')),'../LICENSE'),'utf8');
const parser='(function(){var exports={},module={exports:exports};\n/* '+license+' */\n'+fs.readFileSync(require.resolve('acorn'),'utf8').replace(/\r\n/g,'\n')+'\nreturn module.exports;})()';
const pkg={schema:2,version,channel:'swsh',updateUrl:'https://raw.githubusercontent.com/niheartent/pokemon_hud_koji/main/updates/swsh.json',updateRuntime:read('../shared/koji-updater.js'),runtimeDb:'pk_hud_koji_swsh_runtime_v1',interfaces:['render','teamHTML','trainerHTML','quickHTML','homeFoldHTML','menuHTML','worldHTML','cmdPanelHTML','settingsHTML','showNoticeModal','pkCheckUpdate','pkDoUpdate','pkRepair','pkInstallRecord','pkUpdateScript','pkSetUpdateMsg','buildCards','pkImgHTML','resolvePkmImgs','hudResolvePkidbImages','getIconSize','resizeFrame'],parser,presentation:read('../shared/presentation.js'),presentationContract:JSON.parse(read('../shared/presentation-contract.json')),runtime:read('../shared/presentation-boundary.js').replace(/if\(typeof module[^\n]+\n?/,'')+'\n'+read('../shared/koji-bootstrap.js').replace(/if\(typeof module[^\n]+\n?/,'')+'\n'+read('swsh-compat.js'),beauty:read('../shared/feature-adapter.js')+'\n'+read('swsh-icons.js')+'\n'+read('swsh-beauty.js')+'\n'+read('swsh-adapter.js'),styleOwnership:'swsh',css:read('swsh-foundation.css')+'\n'+read('swsh-hud.css')+'\n'+read('swsh-colors.css')};
pkg.viewInterfaces=pkg.interfaces.filter(name=>new RegExp('function '+name+'\\(').test(pkg.presentation));
pkg.interfaces=pkg.interfaces.filter(name=>!pkg.viewInterfaces.includes(name));
pkg.coreNotice=((source.match(/\/\*PK_NOTICE_BEGIN([\s\S]*?)PK_NOTICE_END\*\//)||[])[1]||'').trim();
pkg.beautyNotice='同步核心4.0.52：战场属性支持点击查看克制／抵抗／免疫，合众地图与图片镜像回退，统一标识资源路径。\n同步核心4.0.45：点击详情属性标签查看双属性克制、抵抗与免疫，支持回车／空格，保留自有样式。\n同步核心4.0.43：固定镜像源、新增阿尔宙斯手机图标。人际关系工具按钮明暗配色、暗色好感度蓝青色；弹出地图继承独立主题。\n同步核心4.0.30：背包有效效果判断、图标英文名反查和克制表攻击方视角，使用本地样式。\n修复附近宝可梦列表初次打开、图片加载或尺寸改变时自动横向吸附，保留手动滑动。\n剑盾样式基础、字体和主题完全由美化版管理，原版核心更新不再带入其 CSS。\n修复暗色背包和人际关系栏目误用红色强调条，恢复蓝色；白天保留红色。\n设置只保留白天／暗色切换，移除主题预设、选色、深浅与文字颜色控件，修复白底浅字。\n修复白天主题的训练家、附近宝可梦、背包、人际关系与战场颜色。\n页面模板、根布局、属性颜色与样式安装由本地展示模块管理，原版 CSS 不执行。\n首次使用默认暗色，保留已保存的白天选择。';
const scope={PK_BEAUTY_PACKAGE:pkg};vm.createContext(scope);vm.runInContext(pkg.runtime,scope);const code=scope.pkBeautyBuildRemote(source);
acorn.parse(code,{ecmaVersion:'latest'});new Function(code);
payload.name='宝可梦 HUD 美化版';payload.id='7a84833f-6436-599b-a78a-952d0578c9e7';
payload.info='剑盾美化版 v'+version+'，基于弦九核心 v'+core+'。自有页面模板、根布局与明暗样式；核心仅接入数据与功能接口，兼容检查通过后更新。';payload.content=code;
fs.mkdirSync(out,{recursive:true});for(const folder of [root,out])for(const stem of ['宝可梦HUD-美化版','宝可梦HUD-剑盾风格']){fs.writeFileSync(path.join(folder,stem+'.json'),JSON.stringify(payload,null,2));fs.writeFileSync(path.join(folder,stem+'.js'),code);}
const manifest={core,ui:version,schema:2,source:'../shared/upstream/pkm-hud.js',sourceSha256:crypto.createHash('sha256').update(source).digest('hex'),runtimeDb:pkg.runtimeDb,scriptId:payload.id,injectionPoints:4,interfaces:pkg.interfaces,businessFunctionsPreserved:true,presentationOwnership:'local',styleOwnership:'swsh',visualFoundation:'swsh-foundation.css',aliasesContainSameScript:true,embeddedParser:'Acorn '+acorn.version};
fs.writeFileSync(path.join(out,'构建信息.json'),JSON.stringify(manifest,null,2));fs.writeFileSync(path.join(out,'Acorn许可证.txt'),license);
console.log(JSON.stringify({core,ui:version,schema:2,injectionPoints:4,bytes:Buffer.byteLength(code)}));


