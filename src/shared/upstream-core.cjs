const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
module.exports=function(){
  const dir=path.join(__dirname,'upstream'),meta=require(path.join(dir,'manifest.json'));
  const data=fs.readFileSync(path.join(dir,'pkm-hud.js'));
  if(crypto.createHash('sha256').update(data).digest('hex')!==meta.sha256)throw Error('Upstream snapshot checksum mismatch');
  const code=data.toString('utf8');
  if(code.match(/var PK_VER='([^']+)'/)[1]!==meta.version)throw Error('Upstream snapshot version mismatch');
  return code;
};
