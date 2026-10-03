const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{unzipSync}=require('fflate'),acorn=require('acorn');
const root=path.join(__dirname,'..'),sha=data=>crypto.createHash('sha256').update(data).digest('hex');
for(const channel of ['bw2','swsh']){
  const m=JSON.parse(fs.readFileSync(path.join(root,'updates',channel+'.json'),'utf8')),dir=path.join(root,'versions',channel,m.ui),tag=channel+'-v'+m.ui;
  const code=fs.readFileSync(path.join(dir,'hud.js'),'utf8');assert.equal(sha(code),m.sha256);assert.ok(m.script.includes('/'+tag+'/'));acorn.parse(code,{ecmaVersion:'latest'});new Function(code);
  assert.equal(JSON.parse(fs.readFileSync(path.join(dir,'hud.json'),'utf8')).content,code);assert.ok(code.includes('kojiCheckUpdate'));
  for(const entry of JSON.parse(fs.readFileSync(path.join(dir,'SHA256SUMS.json'),'utf8')).files)assert.equal(sha(fs.readFileSync(path.join(dir,entry.file))),entry.sha256);
  if(channel==='bw2'){const independent=fs.readFileSync(path.join(dir,'independent/hud.js'),'utf8');assert.ok(!independent.includes('kojiCheckUpdate')&&!independent.includes('PK_BEAUTY_PACKAGE'));}
  const zip=path.join(root,'artifacts',tag+'.zip');if(fs.existsSync(zip)){const contents=unzipSync(fs.readFileSync(zip));assert.equal(sha(contents[tag+'/hud.js']),m.sha256);}
  console.log(JSON.stringify({channel,ui:m.ui,verified:true}));
}
