/* Reuse the pinned core's exact slot transaction, without booting a HUD. */
const acorn=require('acorn');
module.exports=function(){
 const raw=require('./upstream-core.cjs')(),outer=acorn.parse(raw,{ecmaVersion:'latest'}).body[0].expression.callee.body.body;
 const functions=['pkSha256Text','pkDbOpen','pkInstallRecord'].map(name=>{const n=outer.find(n=>n.type==='FunctionDeclaration'&&n.id.name===name);if(!n)throw Error('Missing slot interface '+name);return raw.slice(n.start,n.end);});
 const constants=['PK_RUNTIME_STORE','PK_RUNTIME_OPEN_TIMEOUT','PK_RUNTIME_TX_TIMEOUT'].map(name=>{let d;for(const n of outer)if(n.type==='VariableDeclaration')d=d||n.declarations.find(d=>d.id.name===name);if(!d||d.init.type!=='Literal')throw Error('Missing slot constant '+name);return 'var '+name+'='+JSON.stringify(d.init.value)+';';});
 return 'function kojiCreateSlotInstaller(WIN,PK_RUNTIME_DB){\nvar pkDbPromise=null;\n'+constants.join('\n')+'\n'+functions.join('\n')+'\nreturn {install:pkInstallRecord,close:function(){if(pkDbPromise)pkDbPromise.then(function(db){db.close();},function(){});}};\n}\n';
};
