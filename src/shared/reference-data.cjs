const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
module.exports=function(){
  const dir=path.join(__dirname,'reference-data'),manifest=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8')),data={};
  for(const name of ['map-locations','badge-rules','nearby-special','t2s-map','item-categories']){
    const file=name+'.json',bytes=fs.readFileSync(path.join(dir,file)),expected=manifest.files&&manifest.files[file];
    if(!expected||crypto.createHash('sha256').update(bytes).digest('hex')!==expected)throw Error('Reference data checksum mismatch: '+file);
    data[name]=JSON.parse(bytes.toString('utf8'));
  }
  return fs.readFileSync(path.join(__dirname,'reference-data.js'),'utf8').replace(/\r\n/g,'\n').replace('__KOJI_REFERENCE_DATA__',JSON.stringify(data));
};
