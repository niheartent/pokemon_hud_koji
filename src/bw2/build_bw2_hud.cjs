/* Build from original Xianjiu core, not the Sword/Shield delivery. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const acorn=require('acorn');
// Identical release bytes on Windows and Linux.
const readText=file=>fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n');
const root=__dirname,out=path.join(root,'HUD黑白2版-第一版');fs.mkdirSync(out,{recursive:true});
const payload=JSON.parse(readText(path.join(root,'pkm-hud-upstream.json')).replace(/^\uFEFF/,''));
const upstream=require('../shared/upstream-core.cjs')();let original,code;const patches=[];
const version='0.4.6';
const nativeVisualCss=readText(path.join(root,'bw2-native-base.css'));
const presentation=readText(path.join(root,'../shared/presentation.js'));
const presentationContract=require('../shared/presentation-contract.json');
original=require('../shared/presentation-boundary.js').own(upstream,acorn,presentation,nativeVisualCss,presentationContract);
const adapted=require('./bw2-core-adapter.js')(original,acorn,{version,nativeCss:nativeVisualCss});
code=require('../shared/koji-bootstrap.js')(adapted.code);patches.push(...adapted.patches);
const {functions,baseCss,consoleMenu,core}=adapted;
const bootstrapRuntime=readText(path.join(root,'../shared/koji-bootstrap.js')).replace(/if\(typeof module[^\n]+\n?/,'');
const updateRuntime=readText(path.join(root,'../shared/koji-updater.js'));
const runtime=readText(path.join(root,'../shared/presentation-boundary.js')).replace(/if\(typeof module[^\n]+\n?/,'')+'\n'+bootstrapRuntime+'\n'+readText(path.join(root,'bw2-core-adapter.js')).replace(/if\(typeof module[^\n]+\n?/,'')+'\n'+readText(path.join(root,'swsh-updater.js'));
const beauty=readText(path.join(root,'../shared/feature-adapter.js'))+'\n'+readText(path.join(root,'bw2-move-icons.js'))+'\n'+readText(path.join(root,'bw2-command-icons.js'))+'\n'+readText(path.join(root,'swsh-icons.js'))+'\n'+readText(path.join(root,'bw2-detail-identity.js'))+'\n'+readText(path.join(root,'bw2-popup-ui.js'))+'\n'+readText(path.join(root,'bw2-console.js'))+'\n'+readText(path.join(root,'bw2-pages.js'))+'\n'+readText(path.join(root,'bw2-ui.js'));
// Grid geometry belongs to our fixed foundation, not the downloaded core.
const gridBlock=baseCss.match(/\.hud::before\{([^}]+)\}/)[1];
const originalGrid=gridBlock.match(/background-image:([^;]+)(?:;|$)/)[1];
const css=('.bw2-host{--bw2-original-grid:'+originalGrid+';}\n'+readText(path.join(root,'bw2-theme.css'))+'\n'+readText(path.join(root,'bw2-hud.css'))+'\n'+readText(path.join(root,'bw2-detail.css'))+'\n'+readText(path.join(root,'bw2-popup.css'))+'\n'+readText(path.join(root,'bw2-console.css'))+'\n'+readText(path.join(root,'bw2-trainer.css'))).replace(/@media\s*\(max-width:/g,'@container bw2-layout (max-width:');
const parserLicense=readText(path.join(path.dirname(require.resolve('acorn')),'../LICENSE'));
const parser='(function(){var exports={},module={exports:exports};\n/* '+parserLicense+' */\n'+readText(require.resolve('acorn'))+'\nreturn module.exports;})()';
const pkg={schema:2,styleOwnership:'bw2',channel:'bw2',updateUrl:'https://raw.githubusercontent.com/niheartent/pokemon_hud_koji/main/updates/bw2.json',updateRuntime,version,parser,presentation,presentationContract,nativeCss:nativeVisualCss,runtime,beauty,css};
code=require('../shared/presentation-boundary.js').insert(code,acorn,'var PK_BEAUTY_PACKAGE='+JSON.stringify(pkg)+';\n'+runtime+'\n'+beauty+'\n'+updateRuntime+'\ncss += '+JSON.stringify(css)+';');
new Function(code);acorn.parse(code,{ecmaVersion:'latest'});
payload.name='宝可梦 HUD 黑白2版（第一版）';
payload.id=crypto.createHash('sha256').update(payload.id+':bw2-v1').digest('hex').slice(0,32).replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/,'$1-$2-$3-$4-$5');
payload.info='黑白2 UI v'+version+'，基于弦九原版核心 v'+core+'。窄边双屏与金属转轴，等比缩放；盒子、背包、繁育、徽章盒在上屏，图鉴、精灵详情与设置占双屏，地图和克制表独立大窗。盒子复用队伍卡片，附近四只分页。可见页按需刷新，样式与 SVG 内嵌，精灵/道具沿用在线图源。';payload.content=code;
fs.writeFileSync(path.join(out,'Acorn许可证.txt'),parserLicense);
fs.writeFileSync(path.join(out,'宝可梦HUD-黑白2版.json'),JSON.stringify(payload,null,2));
fs.writeFileSync(path.join(out,'宝可梦HUD-黑白2版.js'),code);
const outlinePoints=JSON.parse(beauty.match(/var BW2_SCREEN_POINTS=(\[.*\]);/)[1]);
const outlinePath=outlinePoints.map((p,i)=>(i?'L':'M')+p[0]+' '+p[1]).join('')+'Z';
fs.writeFileSync(path.join(out,'大多边形轮廓.svg'),'<svg xmlns="http://www.w3.org/2000/svg" width="386" height="248" viewBox="0 0 386 248"><path d="'+outlinePath+'" fill="#9088f1" fill-opacity=".25"/><path d="'+outlinePath+'" fill="none" stroke="#c9e6fb" stroke-opacity=".55" stroke-width="2"/></svg>');
fs.writeFileSync(path.join(out,'大多边形坐标.json'),JSON.stringify({reference:'设计参考：多边形底.png',referenceSize:[1992,1472],viewBox:[386,248],points:outlinePoints,calibration:{horizontalVertical:true,diagonalAngleDeg:45},sharedBy:['统一精灵详情']},null,2));
const lowerPoints=JSON.parse(beauty.match(/var BW2_LOWER_SCREEN_POINTS=(\[.*\]);/)[1]);
const lowerPath=lowerPoints.map((p,i)=>(i?'L':'M')+p[0]+' '+p[1]).join('')+'Z';
fs.writeFileSync(path.join(out,'下屏多边形轮廓.svg'),'<svg xmlns="http://www.w3.org/2000/svg" width="386" height="268" viewBox="0 0 386 268"><path d="'+lowerPath+'" fill="#9088f1" fill-opacity=".25"/><path d="'+lowerPath+'" fill="none" stroke="#c9e6fb" stroke-opacity=".55" stroke-width="2"/></svg>');
fs.writeFileSync(path.join(out,'下屏多边形坐标.json'),JSON.stringify({reference:'设计参考：下多边形底.png',referenceSize:[1330,888],viewBox:[386,268],points:lowerPoints,calibration:{horizontalVertical:true,diagonalAngleDeg:45},sharedBy:['统一精灵详情']},null,2));
fs.writeFileSync(path.join(out,'构建信息.json'),JSON.stringify({core,ui:version,updateSchema:2,presentationOwnership:'local',componentServices:presentationContract.services,updateAdapter:'bw2-core-adapter.js shared local/browser composer',embeddedParser:'Acorn '+acorn.version,sourceSha256:crypto.createHash('sha256').update(upstream).digest('hex'),patches:patches.length,source:'../shared/upstream/pkm-hud.js',presentationFoundation:'bw2-native-base.css',palette:'BW2 v0.2.27',refreshDependencies:'per-view and trainer/party split',sourceUrl:'https://raw.githubusercontent.com/xianjiu0926/pkm-hud/main/pkm-hud.js',rootLayout:'narrow-dual-screen-with-hinge',screenRoles:['display','controls'],featureMenu:consoleMenu.map(m=>m.key),upperScreenPages:['box','bag','breeding','badge'],fullConsolePages:['settings','pokedex'],externalPages:['map','typechart'],boxUsesPartyCardRenderer:true,mapContainedInConsole:false,detailOrder:['header','pokemon-and-moves','values'],partyRendererUnchanged:code.includes(functions.teamHTML)&&code.includes(functions.cardHTML)},null,2));
console.log(JSON.stringify({core,ui:version,patches:patches.length,bytes:Buffer.byteLength(code),out}));



