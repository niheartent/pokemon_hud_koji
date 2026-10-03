const fs=require('node:fs'),path=require('node:path');
const [channel,next]=process.argv.slice(2);if(!['bw2','swsh'].includes(channel)||!/^\d+\.\d+\.\d+$/.test(next||''))throw Error('Usage: node tools/set-version.cjs bw2 0.3.10');
const dir=path.join(__dirname,'../src',channel),old=require(path.join(dir,'package.json')).version;
const compare=(a,b)=>{const x=a.split('.').map(Number),y=b.split('.').map(Number);for(let i=0;i<3;i++)if(x[i]!==y[i])return x[i]-y[i];return 0;};if(compare(next,old)<=0)throw Error('New version must be higher than '+old);
for(const name of fs.readdirSync(dir))if(name.endsWith('.cjs')||name==='package.json'){
  const file=path.join(dir,name);fs.writeFileSync(file,fs.readFileSync(file,'utf8').replaceAll(old,next));
}
const readme=path.join(__dirname,'../README.md');fs.writeFileSync(readme,fs.readFileSync(readme,'utf8').replaceAll(old,next));
console.log(channel+': '+old+' -> '+next);
