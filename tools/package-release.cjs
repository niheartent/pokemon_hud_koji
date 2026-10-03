const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{zipSync}=require('fflate');
const root=path.join(__dirname,'..'),repo='niheartent/pokemon_hud_koji',sha=data=>crypto.createHash('sha256').update(data).digest('hex');
const selected=process.argv[2]?[process.argv[2]]:['bw2','swsh'];
for(const channel of selected){
  if(!['bw2','swsh'].includes(channel))throw Error('channel must be bw2 or swsh');
  const dir=path.join(root,'src',channel),ui=require(path.join(dir,'package.json')).version,tag=channel+'-v'+ui;
  const out=channel==='bw2'?path.join(dir,'黑白2双版本-v'+ui):path.join(dir,'HUD美化版-交付');
  const runtime=channel==='bw2'?path.join(out,'完整版/宝可梦HUD-完整版.js'):path.join(out,'宝可梦HUD-剑盾风格.js');
  const record=JSON.parse(fs.readFileSync(runtime.replace(/\.js$/,'.json'),'utf8')),core=record.content.match(/var PK_VER='([^']+)'/)[1];
  const destination=path.join(root,'versions',channel,ui),files={};
  files['hud.js']=fs.readFileSync(runtime);files['hud.json']=Buffer.from(JSON.stringify(record,null,2)+'\n');
  if(channel==='bw2'){files['independent/hud.js']=fs.readFileSync(path.join(out,'独立版/宝可梦HUD-独立版.js'));files['independent/hud.json']=fs.readFileSync(path.join(out,'独立版/宝可梦HUD-独立版.json'));}
  files['Acorn-LICENSE.txt']=fs.readFileSync(channel==='bw2'?path.join(dir,'HUD黑白2版-第一版/Acorn许可证.txt'):path.join(out,'Acorn许可证.txt'));
  files['README.md']=Buffer.from(`# ${channel==='bw2'?'黑白2':'剑盾'}美化版 v${ui}\n\n内置弦九核心 v${core}。导入 hud.json 替换旧版，只启用一个 HUD 脚本。设置中的检查更新同时检查本仓库美化版与弦九核心，检查通过后由用户安装。\n${channel==='bw2'?'\nindependent/hud.json 为独立版，不含在线更新器，重新导入升级。\n':''}\n本包不含真实聊天存档。测试报告与发布流程见仓库 docs。\n`);
  const sums=Object.entries(files).map(([file,data])=>({file,sha256:sha(data)}));files['SHA256SUMS.json']=Buffer.from(JSON.stringify({files:sums},null,2)+'\n');
  fs.mkdirSync(destination,{recursive:true});
  for(const [name,data] of Object.entries(files)){
    const target=path.join(destination,name);fs.mkdirSync(path.dirname(target),{recursive:true});
    if(fs.existsSync(target)&&!fs.readFileSync(target).equals(data))throw Error('Published version changed; bump UI version first: '+target);
    fs.writeFileSync(target,data);
  }
  const notes=fs.readFileSync(path.join(root,'docs',channel+'-release.md'),'utf8');
  const manifest={schema:1,channel,ui,core,testedCore:['3.3.19'],script:`https://raw.githubusercontent.com/${repo}/${tag}/versions/${channel}/${ui}/hud.js`,sha256:sha(files['hud.js']),import:`https://raw.githubusercontent.com/${repo}/${tag}/versions/${channel}/${ui}/hud.json`,release:`https://github.com/${repo}/releases/tag/${tag}`,notes};
  fs.mkdirSync(path.join(root,'updates'),{recursive:true});fs.writeFileSync(path.join(root,'updates',channel+'.json'),JSON.stringify(manifest,null,2)+'\n');
  const archive={};for(const [name,data] of Object.entries(files))archive[`${tag}/${name}`]=[new Uint8Array(data),{mtime:new Date(2020,0,1,0,0,0)}];
  fs.mkdirSync(path.join(root,'artifacts'),{recursive:true});fs.writeFileSync(path.join(root,'artifacts',tag+'.zip'),zipSync(archive,{level:9}));
  fs.writeFileSync(path.join(root,'artifacts',tag+'-hud.json'),files['hud.json']);
  fs.writeFileSync(path.join(root,'artifacts',tag+'-notes.md'),notes);
  if(channel==='bw2')fs.writeFileSync(path.join(root,'artifacts',tag+'-independent.json'),files['independent/hud.json']);
  console.log(JSON.stringify({channel,ui,core,tag,sha256:manifest.sha256}));
}
