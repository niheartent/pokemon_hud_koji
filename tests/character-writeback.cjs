const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const root=require('path').join(__dirname,'..'),runtime=fs.readFileSync(require('path').join(root,'src/shared/koji-updater.js'),'utf8');
const clone=x=>JSON.parse(JSON.stringify(x));
const oldContent="var PK_VER='5.2.7'; var PK_BEAUTY_PACKAGE={channel:'swsh'}; // pkm-hud-btn",newContent="var PK_VER='5.3.2'; var PK_BEAUTY_PACKAGE={channel:'swsh'}; // pkm-hud-btn NEW";
const originalContent="var PK_VER='9.9.9'; // pkm-hud-btn";
function card(avatar,name){return {avatar,name,description:'keep description',extensions:{custom:{preserve:1},tavern_helper:{otherSetting:7,scripts:[{id:'original-hud',content:originalContent},{id:'hud',content:oldContent},{id:'other',content:'keep other script'}]}}};}
async function scenario(label,options={}){
 const a=card('storage-a.png','same display'),b=card('storage-b.png','same display');
 const db={'storage-a':a,'storage-b':b},calls=[];let clears=0,reads=0,native=0;
 const stale=clone(b);stale.name='obsolete display';stale.description='obsolete description';stale.extensions.custom.preserve=-1;
 const ctx={characterId:0,characters:[stale]};if(options.noAvatar){delete stale.avatar;stale.name=b.name;}
 if(options.unique){a.name='another display';}
 if(options.noHud)b.extensions.tavern_helper.scripts=[];
 if(options.originalOnly)b.extensions.tavern_helper.scripts=[{id:'original-hud',content:originalContent}];
 if(options.missing)delete db['storage-b'];
 if(options.noContext)ctx.characterId=null;
 const scope={PK_BEAUTY_PACKAGE:{channel:'swsh'},WIN:{SillyTavern:{getContext:()=>ctx},__TAURI_INTERNALS__:{invoke:async(command,args)=>{
  calls.push({command,args:clone(args)});
  if(command==='clear_character_cache'){clears++;return;}
  if(command==='get_all_characters')return Object.values(db).map(clone);
  if(command==='get_character'){
   reads++;if(options.staleIndex&&!clears)throw Error('Not found: Character not found: '+args.name);
   const found=db[args.name];if(!found)throw Error('Not found: Character not found: '+args.name);
   const result=clone(found);
   if(options.switchCard&&reads===1)ctx.characters[0]=clone(a);
   return result;
  }
  if(command==='update_character'){
   assert(db[args.name],'must use storage key, never display name');
   assert.deepEqual(Object.keys(args.dto),['extensions'],'only extensions may change');
   if(options.permission)throw Error('Permission denied');
   if(!options.noSave)db[args.name].extensions=clone(args.dto.extensions);
   return clone(db[args.name]);
  }
  throw Error('Unexpected command '+command);
 }}},pkUpdateScript:()=>{native++;return Promise.resolve({ok:true});}};
 if(options.web)delete scope.WIN.__TAURI_INTERNALS__;
 vm.createContext(scope);vm.runInContext(fs.readFileSync(require('path').join(root,'src/shared/character-writeback.js'),'utf8')+runtime,scope);
 const result=await scope.pkUpdateScript(newContent),updates=calls.filter(c=>c.command==='update_character');
 if(options.originalOnly)assert.equal(b.extensions.tavern_helper.scripts[0].content,originalContent,'original-only card must remain byte-for-byte unchanged');
 const fail=options.noContext||options.noHud||options.originalOnly||options.missing||options.switchCard||options.permission||options.noSave||(options.noAvatar&&!options.unique);
 assert.equal(result.ok,!fail,label+': '+result.msg);
 if(!fail&&!options.web){assert.equal(db['storage-b'].extensions.tavern_helper.scripts[0].content,originalContent,'original HUD must never be overwritten');assert.equal(db['storage-b'].extensions.tavern_helper.scripts[1].content,newContent);assert.equal(db['storage-b'].description,'keep description');assert.equal(db['storage-b'].extensions.custom.preserve,1);assert.equal(db['storage-b'].extensions.tavern_helper.scripts[2].content,'keep other script');assert.equal(updates.length,1);assert(reads>=2);}
 if(options.web)assert.equal(native,1);else assert.equal(native,0);
 if(!options.web&&!options.noAvatar&&!options.noContext&&!options.switchCard)assert.equal(stale.extensions.tavern_helper.scripts[1].content,fail?oldContent:newContent,'frontend cache changes only after verified save');
 assert.equal(a.extensions.tavern_helper.scripts[1].content,oldContent,'other HUD card must never change');
 if(options.noContext||options.noHud||options.originalOnly||options.missing||options.switchCard||(options.noAvatar&&!options.unique))assert.equal(updates.length,0);
 if(options.staleIndex||options.missing)assert.equal(clears,1);else assert.equal(clears,0);
 return {label,ok:result.ok,reads,writes:updates.length,cacheRetries:clears};
}
async function shippedScripts(){
 const path=require('path'),{chromium,launchOptions}=require('../src/swsh/browser-runtime.cjs'),browser=await chromium.launch({headless:true,...launchOptions}),results=[];
 try{for(const channel of ['swsh','bw2']){
  const ver=require('../src/'+channel+'/package.json').version;
  const file=channel==='swsh'?'src/swsh/HUD美化版-交付/剑盾版预览.html':'src/bw2/黑白2双版本-v'+ver+'/完整版/预览与测试.html';
  let html=fs.readFileSync(path.join(root,file),'utf8'),marker=html.lastIndexOf('try{ensureHud();}catch(e){}');assert(marker>0);
  html=html.slice(0,marker)+`window.__WRITE_TEST={write:function(s){return pkUpdateScript(s);},open:openPage,host:WIN,installed:function(){var content="var PK_VER='"+PK_VER+"';var PK_BEAUTY_VER='"+PK_BEAUTY_VER+"';var PK_BEAUTY_PACKAGE={channel:'${channel}'}; // pkm-hud-btn";pkSlotRead=function(){return Promise.resolve({content:content});};}};`+html.slice(marker);
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>r.fulfill({contentType:r.request().url().startsWith('http://write.test')?'text/html':r.request().resourceType()==='image'?'image/svg+xml':'application/json',body:r.request().url().startsWith('http://write.test')?html:r.request().resourceType()==='image'?'<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"/>':'{"data":[]}'}));
  await page.goto('http://write.test');await page.locator(channel==='swsh'?'.swsh-team':'.bw2-console').waitFor();
  const result=await page.evaluate(async({oldContent,newContent})=>{
   const db={name:'display differs',avatar:'file-key.png',extensions:{keep:123,tavern_helper:{scripts:[{content:"var PK_VER='9.9.9'; // pkm-hud-btn"},{content:oldContent}]}}},calls=[];
   __WRITE_TEST.host.SillyTavern={getContext:()=>({characterId:0,characters:[{...db,name:'stale display'}]})};
   __WRITE_TEST.host.__TAURI_INTERNALS__={invoke:async(command,args)=>{
    calls.push({command,args:JSON.parse(JSON.stringify(args))});
    if(command==='get_character'){if(args.name!=='file-key')throw Error('Not found');return JSON.parse(JSON.stringify(db));}
    if(command==='update_character'){if(args.name!=='file-key')throw Error('Character not found');db.extensions=args.dto.extensions;return db;}
    throw Error('Unexpected '+command);
   }};
   const saved=await __WRITE_TEST.write(newContent);return {saved,calls,db};
  },{oldContent:oldContent.replace('swsh',channel),newContent:newContent.replace('swsh',channel)});
  assert.equal(result.saved.ok,true,JSON.stringify(result));assert.equal(result.db.extensions.tavern_helper.scripts[0].content,"var PK_VER='9.9.9'; // pkm-hud-btn");assert.equal(result.db.extensions.tavern_helper.scripts[1].content,newContent.replace('swsh',channel));assert.equal(result.db.extensions.keep,123);await page.evaluate(()=>{__WRITE_TEST.installed();__WRITE_TEST.open('settings');});
  await page.locator('.page-overlay.open [data-koji-writeback]').click();
  await page.waitForFunction(()=>document.querySelector('#pk-update-msg')?.textContent.includes('当前已安装版本已写回角色卡'));
  assert.deepEqual(errors,[]);await page.close();results.push({channel,shippedWritebackVerified:true,retryButtonVerified:true});
 }}finally{await browser.close();}return results;
}
(async()=>{
 const cases=[['display name differs from storage + current character index 0',{}],['fresh card fields after replacement',{}],['stale backend index retries without reopening',{staleIndex:true}],['avatarless bridge with unique live match',{noAvatar:true,unique:true}],['ambiguous identical names reject',{noAvatar:true}],['switch during read rejects',{switchCard:true}],['missing current card rejects, never chooses another HUD',{missing:true}],['no active card rejects',{noContext:true}],['missing HUD rejects',{noHud:true}],['original HUD only rejects without overwrite',{originalOnly:true}],['write permission errors do not retry',{permission:true}],['false successful save caught by readback',{noSave:true}],['web host keeps native writeback',{web:true}]];
 const results=[];for(const [name,opts] of cases)results.push(await scenario(name,opts));
 results.push(...await shippedScripts());
 fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/character-writeback-tests.json',JSON.stringify({passed:true,results,liveHostWriteTested:false},null,2));console.log(JSON.stringify({passed:true,results}));
})().catch(e=>{console.error(e);process.exitCode=1;});
