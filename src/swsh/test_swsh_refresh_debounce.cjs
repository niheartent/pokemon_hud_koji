const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'swsh-adapter.js'),'utf8');
const start=source.indexOf('// Coalesce host events inside one short, bounded refresh window.');
const end=source.indexOf('function swshDOM',start);
assert(start>=0&&end>start,'refresh coalescer must remain in the adapter');
const handlers=Object.create(null),context={eventTypes:{MESSAGE_RECEIVED:'message_received',MESSAGE_SENT:'message_sent',CHAT_CHANGED:'chat_changed',MESSAGE_SWIPED:'message_swiped'},eventSource:{on:function(name,fn){(handlers[name]||(handlers[name]=[])).push(fn);}}};
let refreshes=0,diagnostics=[];
const sandbox={WIN:{SillyTavern:{getContext:function(){return context;}}},hudScope:{setTimeout:setTimeout,clearTimeout:clearTimeout,emitter:function(src,name,fn){src.on(name,fn);}},pkBindAutoRefresh:function(){throw new Error('adapter did not replace core event binder');},pkmAutoRefreshBound:false,pkmEventSourceActive:false,pkmAutoSnap:'',stat_data:{revision:1},pkRefreshData:function(){refreshes++;},pkmStateSnapshot:function(state){return String(state.revision);},hudDiagEvent:function(type,detail){diagnostics.push([type,detail]);},hudDiagError:function(type,error){throw error;}};
vm.runInNewContext(source.slice(start,end),sandbox,{filename:'swsh-adapter-refresh-debounce.js'});
function emit(name){(handlers[name]||[]).forEach(function(fn){fn();});}
function wait(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}
(async function(){
  assert.equal(sandbox.pkBindAutoRefresh(),true);
  assert.equal(Object.values(handlers).reduce(function(sum,list){return sum+list.length;},0),4,'one listener per host event');
  assert.equal(sandbox.pkBindAutoRefresh(),true);
  assert.equal(Object.values(handlers).reduce(function(sum,list){return sum+list.length;},0),4,'re-binding must not duplicate listeners');
  emit('message_received');emit('message_sent');emit('chat_changed');
  await wait(30);emit('message_received');
  await wait(35);
  assert.equal(refreshes,1,'a burst must trigger one refresh within the bounded window');
  assert.equal(sandbox.pkmAutoSnap,'1','state snapshot follows the coalesced refresh');
  emit('message_swiped');await wait(70);
  assert.equal(refreshes,2,'later independent events still refresh');
  console.log(JSON.stringify({passed:true,hostEvents:4,burstEvents:4,refreshesAfterBurst:1,boundedWindowMs:50,laterEventRefreshes:true,listenersNotDuplicated:true,diagnostic:diagnostics.length===1}));
})().catch(function(error){console.error(error);process.exitCode=1;});
