/* Render the existing Sword/Shield vector artwork as embedded transparent PNGs. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {chromium}=require('./browser-runtime.cjs');
const context={};vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(__dirname,'swsh-icons.js'),'utf8'),context);
const artwork={training:'#79cfea',dodge:'#bc9eef',initiative:'#f3bd53',guard:'#79bcec',revive:'#ef8760',mega:'#df92d6',clash:'#dfc66d',help:'#78c7bd',typechart:'#dfb457'};
(async()=>{const browser=await chromium.launch({headless:true,...require('./browser-runtime.cjs').launchOptions});
try{const page=await browser.newPage({viewport:{width:64,height:64},deviceScaleFactor:2}),icons={},out=path.join(__dirname,'HUD黑白2版-第一版','快捷指令PNG');fs.mkdirSync(out,{recursive:true});
for(const [key,color] of Object.entries(artwork)){await page.setContent('<style>html,body{margin:0;background:transparent}svg{width:64px;height:64px;color:'+color+'}</style>'+context.swshIcon(key,48));const buffer=await page.locator('svg').screenshot({omitBackground:true});fs.writeFileSync(path.join(out,key+'.png'),buffer);icons[key]='data:image/png;base64,'+buffer.toString('base64');}
fs.writeFileSync(path.join(__dirname,'bw2-command-icons.js'),'/* PNG exports of the existing Sword/Shield icon artwork. */\nvar BW2_COMMAND_ICONS='+JSON.stringify(icons)+';\n');console.log('Rendered '+Object.keys(icons).length+' existing icons as PNG');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});

