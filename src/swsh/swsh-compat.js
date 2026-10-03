/* Sword/Shield schema 2: syntax-based injection, native behavior retained. */
var pkBeautyPreparedContent=null,pkBeautyPreparedVer=null;
var pkBeautyParser=null;
function pkBeautyGetParser(){
  if(!pkBeautyParser)pkBeautyParser=Function('return '+PK_BEAUTY_PACKAGE.parser)();
  return pkBeautyParser;
}
function pkBeautyBuildRemote(raw){
  var pkg=Object.assign({},PK_BEAUTY_PACKAGE);
  if(typeof raw!=='string')throw new Error('下载内容不是原版脚本');
  var parser=pkBeautyGetParser(),ast;
  try{ast=parser.parse(raw,{ecmaVersion:'latest'});}catch(e){throw new Error('原版脚本语法错误：'+e.message);}
  function fail(name){throw new Error('原版接口已变化：'+name+'；未安装，需要适配此接口');}
  var expr=ast.body.length===1&&ast.body[0].expression;
  if(!expr||expr.type!=='CallExpression'||expr.callee.type!=='FunctionExpression')fail('HUD 启动作用域');
  var outer=expr.callee.body;
  function declarations(block){var f={},v={},statements={};block.body.forEach(function(n){if(n.type==='FunctionDeclaration'){if(f[n.id.name])fail(n.id.name+' 重复定义');f[n.id.name]=n;}if(n.type==='VariableDeclaration')n.declarations.forEach(function(d){if(d.id.type==='Identifier'){if(v[d.id.name])fail(d.id.name+' 重复定义');v[d.id.name]=d;statements[d.id.name]=n;}});});return {functions:f,variables:v,statements:statements};}
  var top=declarations(outer),run=top.functions.runPkmHud;
  if(top.variables.PK_BEAUTY_VER||raw.indexOf('var PK_BEAUTY_PACKAGE=')>=0)throw new Error('下载内容不是原版脚本');
  if(!run)fail('runPkmHud');
  var inner=declarations(run.body),required=pkg.interfaces;
  required.forEach(function(name){if(!inner.functions[name]&&!top.functions[name])fail(name);});
  ['stat_data','hudScope','winMode','MENU','CMDS','css'].forEach(function(name){if(!inner.variables[name])fail(name);});
  function calls(node,name){var found=false;function visit(n){if(!n||!n.type)return;if(n.type==='CallExpression'&&n.callee.type==='Identifier'&&n.callee.name===name)found=true;Object.keys(n).forEach(function(k){var x=n[k];if(Array.isArray(x))x.forEach(visit);else if(x&&x.type)visit(x);});}visit(node);return found;}
  if(!calls(inner.functions.pkCheckUpdate,'showNoticeModal'))fail('pkCheckUpdate → showNoticeModal');
  if(calls(inner.functions.pkCheckUpdate,'pkDoUpdate')||calls(inner.functions.pkCheckUpdate,'pkInstallRecord')||calls(inner.functions.pkCheckUpdate,'pkUpdateScript'))fail('检查更新不能直接安装');
  ['pkInstallRecord','pkUpdateScript'].forEach(function(name){if(!calls(inner.functions.pkDoUpdate,name))fail('pkDoUpdate → '+name);});
  var version=top.variables.PK_VER,db=top.variables.PK_RUNTIME_DB;
  if(!version||!version.init||version.init.type!=='Literal'||!/^\d+\.\d+\.\d+(?:-[\w.-]+)?$/.test(version.init.value))fail('PK_VER');
  if(!db||!db.init||db.init.type!=='Literal'||db.init.value!=='pk_hud_runtime_v1')fail('PK_RUNTIME_DB');
  if(!inner.variables.css.init)fail('css 初始化');
  pkg.coreNotice=((raw.match(/\/\*PK_NOTICE_BEGIN([\s\S]*?)PK_NOTICE_END\*\//)||[])[1]||'').trim();
  var injected='\nvar PK_BEAUTY_PACKAGE='+JSON.stringify(pkg)+';\n'+pkg.runtime+'\n'+pkg.beauty+'\n'+(pkg.updateRuntime||'')+'\ncss += '+JSON.stringify(pkg.css)+';\n';
  var edits=[{start:top.statements.PK_VER.end,end:top.statements.PK_VER.end,text:"\nvar PK_BEAUTY_VER='"+pkg.version+"';"},{start:db.init.start,end:db.init.end,text:JSON.stringify(pkg.runtimeDb)},{start:inner.statements.css.end,end:inner.statements.css.end,text:injected}];
  edits.sort(function(a,b){return b.start-a.start;});var code=kojiPatchBootstrap(raw);
  edits.forEach(function(e){code=code.slice(0,e.start)+e.text+code.slice(e.end);});
  try{new Function(code);}catch(e){throw new Error('合成后的脚本语法错误：'+e.message);}
  return code;
}
