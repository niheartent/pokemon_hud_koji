/* Read-only compatibility probe. Never installs or publishes a candidate. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto'),acorn=require('acorn');
const root=path.join(__dirname,'..');
async function main(){
  let raw=require('../src/shared/upstream-core.cjs')(),commit=require('../src/shared/upstream/manifest.json').commit;
  if(process.argv.includes('--fetch')){
    const response=await fetch('https://api.github.com/repos/xianjiu0926/pkm-hud/commits?path=pkm-hud.js&per_page=1',{headers:{'User-Agent':'koji-compatibility'}});
    if(!response.ok)throw Error('GitHub metadata HTTP '+response.status);
    commit=(await response.json())[0].sha;
    const download=await fetch('https://raw.githubusercontent.com/xianjiu0926/pkm-hud/'+commit+'/pkm-hud.js');
    if(!download.ok)throw Error('Upstream HTTP '+download.status);
    raw=await download.text();
  }
  const version=(raw.match(/var PK_VER='([^']+)'/)||[])[1];if(!version)throw Error('Missing upstream version');
  const results=[];
  for(const channel of ['bw2','swsh']){
    const ui=require(path.join(root,'src',channel,'package.json')).version;
    const file=channel==='bw2'?path.join(root,'src/bw2','黑白2双版本-v'+ui,'完整版/宝可梦HUD-完整版.js'):path.join(root,'src/swsh/HUD美化版-交付/宝可梦HUD-剑盾风格.js');
    const code=fs.readFileSync(file,'utf8');let pkg;
    function visit(n){if(!n||!n.type)return;if(n.type==='VariableDeclarator'&&n.id.name==='PK_BEAUTY_PACKAGE')pkg=JSON.parse(code.slice(n.init.start,n.init.end));for(const v of Object.values(n))if(Array.isArray(v))v.forEach(visit);else if(v&&v.type)visit(v);}
    visit(acorn.parse(code,{ecmaVersion:'latest'}));
    const scope={PK_BEAUTY_PACKAGE:pkg};vm.createContext(scope);vm.runInContext(pkg.runtime,scope);
    try{const composed=scope.pkBeautyBuildRemote(raw);acorn.parse(composed,{ecmaVersion:'latest'});results.push({channel,ui,syntaxAndInterfaceCompatible:true});}
    catch(e){results.push({channel,ui,syntaxAndInterfaceCompatible:false,error:e.message});}
  }
  fs.mkdirSync(path.join(root,'artifacts'),{recursive:true});fs.writeFileSync(path.join(root,'artifacts/upstream-candidate.js'),raw);
  const report={version,commit,sha256:crypto.createHash('sha256').update(raw).digest('hex'),results,browserValidationRequired:true};
  fs.writeFileSync(path.join(root,'artifacts/upstream-compatibility.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
  if(results.some(r=>!r.syntaxAndInterfaceCompatible))process.exitCode=1;
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
