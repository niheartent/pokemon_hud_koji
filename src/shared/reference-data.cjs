const fs=require('node:fs'),path=require('node:path');
module.exports=function(){
  const data={};
  for(const name of ['map-locations','badge-rules','nearby-special','t2s-map','item-categories'])data[name]=JSON.parse(fs.readFileSync(path.join(__dirname,'reference-data',name+'.json'),'utf8'));
  return fs.readFileSync(path.join(__dirname,'reference-data.js'),'utf8').replace(/\r\n/g,'\n').replace('__KOJI_REFERENCE_DATA__',JSON.stringify(data));
};
