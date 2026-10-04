/* Compile-time boundary: core supplies behavior, this package supplies templates/styles.
 * Runs only when building/checking an update, never on each render. */
function kojiOwnPresentation(raw,parser,presentation,css,contract){
  var ast=parser.parse(raw,{ecmaVersion:'latest'}),entry=ast.body.length===1&&ast.body[0].expression;
  if(!entry||entry.type!=='CallExpression'||entry.callee.type!=='FunctionExpression')throw Error('功能接口已变化：HUD 启动作用域');
  var outer=entry.callee.body;
  var run=outer.body.find(function(n){return n.type==='FunctionDeclaration'&&n.id.name==='runPkmHud';});
  if(!run)throw Error('功能接口缺失：runPkmHud');
  var ownedAst=parser.parse(presentation,{ecmaVersion:'latest'}),owned=Object.create(null),edits=[],missing=[];
  ownedAst.body.forEach(function(n){if(n.type!=='FunctionDeclaration')throw Error('展示模块只允许组件函数');owned[n.id.name]=presentation.slice(n.start,n.end);});
  contract=contract||{services:[],state:[],visualConstants:{}};
  var services=outer.body.concat(run.body.body).filter(function(n){return n.type==='FunctionDeclaration';}).map(function(n){return n.id.name;});
  var state=run.body.body.filter(function(n){return n.type==='VariableDeclaration';}).reduce(function(list,n){return list.concat(n.declarations.map(function(d){return d.id.name;}));},[]);
  contract.services.forEach(function(name){if(services.indexOf(name)<0)throw Error('功能接口缺失：'+name);});
  contract.state.forEach(function(name){if(state.indexOf(name)<0)throw Error('数据接口缺失：'+name);});
  var visualConstants=contract.visualConstants||{},seenConstants=Object.create(null);
  var styleNames=Object.create(null);
  function findStyleNames(n){
    if(!n||!n.type||/^(Function|ArrowFunction)/.test(n.type))return;
    var i=n.type==='VariableDeclarator'&&n.init;
    if(i&&i.type==='CallExpression'&&i.callee.type==='MemberExpression'&&i.callee.property.name==='createElement'&&i.arguments[0]&&i.arguments[0].value==='style')styleNames[n.id.name]=true;
    Object.keys(n).forEach(function(k){var v=n[k];if(Array.isArray(v))v.forEach(findStyleNames);else if(v&&v.type)findStyleNames(v);});
  }
  findStyleNames(run.body);
  var present=Object.create(null);
  run.body.body.forEach(function(n){
    if(n.type==='FunctionDeclaration'){
      present[n.id.name]=true;
      if(owned[n.id.name])edits.push({start:n.start,end:n.end,text:owned[n.id.name]});
      return;
    }
    if(n.type==='VariableDeclaration'){
      n.declarations.forEach(function(d){if(Object.prototype.hasOwnProperty.call(visualConstants,d.id.name)){seenConstants[d.id.name]=true;edits.push({start:d.init.start,end:d.init.end,text:JSON.stringify(visualConstants[d.id.name])});}});
      var keep=n.declarations.filter(function(d){return d.id.name!=='css';});
      if(keep.length!==n.declarations.length)edits.push({start:n.start,end:n.end,text:keep.length?n.kind+' '+keep.map(function(d){return raw.slice(d.start,d.end);}).join(',')+';':''});
    }
    // Native stylesheet construction and injection never execute. Ignore nested
    // functions, whose local `css` may be a sprite background URL.
    function visual(x){
      if(!x||!x.type||/^(Function|ArrowFunction)/.test(x.type))return false;
      if(x.type==='CallExpression'&&x.callee.type==='MemberExpression'&&x.callee.property.name==='createElement'&&x.arguments[0]&&x.arguments[0].value==='style')return true;
      if(x.type==='AssignmentExpression'&&x.left.type==='MemberExpression'&&x.left.object.type==='Identifier'&&styleNames[x.left.object.name])return true;
      if(x.type==='CallExpression'&&x.arguments.some(function(a){return a.type==='Identifier'&&styleNames[a.name];}))return true;
      if(x.type==='AssignmentExpression'&&((x.left.type==='Identifier'&&x.left.name==='css')||(x.left.type==='MemberExpression'&&x.left.property.name==='textContent'&&x.right.type==='Identifier'&&x.right.name==='css')))return true;
      return Object.keys(x).some(function(k){var v=x[k];return Array.isArray(v)?v.some(visual):v&&v.type&&visual(v);});
    }
    if(visual(n))edits.push({start:n.start,end:n.end,text:''});
  });
  Object.keys(owned).forEach(function(name){if(!present[name])missing.push(owned[name]);});
  Object.keys(visualConstants).forEach(function(name){if(!seenConstants[name])missing.push('var '+name+'='+JSON.stringify(visualConstants[name])+';');});
  var render=run.body.body.find(function(n){return n.type==='FunctionDeclaration'&&n.id.name==='render';});
  if(!render)throw Error('功能接口缺失：render');
  var roots=render.body.body.filter(function(n){var e=n.expression;return e&&e.type==='AssignmentExpression'&&e.left.type==='MemberExpression'&&e.left.object.name==='app'&&e.left.property.name==='innerHTML';});
  if(roots.length!==1)throw Error('功能接口已变化：render 挂载点');
  edits.push({start:roots[0].expression.right.start,end:roots[0].expression.right.end,text:'kojiRootHTML(inline)'});
  // A package-owned canonical CSS declaration is also the module insertion point.
  edits.push({start:run.body.start+1,end:run.body.start+1,text:'\nvar css='+JSON.stringify(css)+';\n'+missing.join('\n')+'\n'});
  // Install after native cleanup, before the UI can boot. This has no dependency
  // on whether upstream uses a style tag, a condition, or no stylesheet at all.
  edits.push({start:render.start,end:render.start,text:"var kojiStyle=document.getElementById('pkm-hud-css');if(!kojiStyle){kojiStyle=document.createElement('style');kojiStyle.id='pkm-hud-css';(document.head||document.body).appendChild(kojiStyle);}kojiStyle.dataset.kojiOwner='presentation';kojiStyle.textContent=css;\n"});
  edits.sort(function(a,b){return b.start-a.start;});
  var last=Infinity;edits.forEach(function(e){if(e.end>last)throw Error('展示边界编辑重叠');raw=raw.slice(0,e.start)+e.text+raw.slice(e.end);last=e.start;});
  return raw;
}
function kojiInsertPresentationModule(code,parser,moduleCode){
  var ast=parser.parse(code,{ecmaVersion:'latest'}),run=ast.body[0].expression.callee.body.body.find(function(n){return n.id&&n.id.name==='runPkmHud';});
  var declaration=run.body.body.find(function(n){return n.type==='VariableDeclaration'&&n.declarations.some(function(d){return d.id.name==='css';});});
  if(!declaration)throw Error('自有展示模块初始化缺失');
  return code.slice(0,declaration.end)+'\n'+moduleCode+'\n'+code.slice(declaration.end);
}
if(typeof module!=='undefined'&&module.exports)module.exports={own:kojiOwnPresentation,insert:kojiInsertPresentationModule};
