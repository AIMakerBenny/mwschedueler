import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const s=readFileSync(new URL('../assets/cloud-v1.1.js',import.meta.url),'utf8');
const block=s.slice(s.indexOf('let peerApplyBusy=false'),s.indexOf("  window.addEventListener('online'"));
const compare=s.slice(s.indexOf('function sameSerializedSaveValue('),s.indexOf('function markDirty()'));
function fixture({local='old',cached=2,mode='public',hidden=false,open=false}={}){
 const data={events:[{title:local}]},manifest={parts:{events:1}},normalizedReadBaseline=new Map([['events',JSON.stringify([{title:'old'}])]]),baselineJson=new Map(normalizedReadBaseline);
 const document={hidden,querySelector:()=>open?{}:null,addEventListener(){}};
 const setup="const ALL_PARTS=['events'],INITIAL_PARTS=['events'],loadedParts=new Set(['events']);\n"+
 "let hydrationSeq=1,hydrating=false,remainingWorkspaceLoad=null;\n"+
 "const window={__mwsAppReadyV130:true,addEventListener(){},dispatchEvent(){}},console={warn(){}},localStorage={setItem(){}};\n"+
 "const ownSave=(o,k)=>Object.hasOwn(o||{},k),getCachedPart=async()=>({version:cached,data:[{title:'new'}]});\n"+
 "const extractPart=p=>data[p],mergePart=(p,v,d)=>d[p]=v,normalizeAndRender=()=>{},metric=()=>{};\n"+
 "const CustomEvent=class{};\n";
 const run=new Function('data','manifest','normalizedReadBaseline','baselineJson','document','mode','cached',setup+compare+block+'\nreturn {setNotice:v=>{peerNotice={events:v}},applyPeerWorkspace};')(data,manifest,normalizedReadBaseline,baselineJson,document,mode,cached);
 return {run,data,manifest};
}
test('verified local public cache update; older rows, local edits, hidden editors and admin drafts remain untouched',async()=>{
 const a=fixture();a.run.setNotice(2);assert.equal(await a.run.applyPeerWorkspace(),true);assert.equal(a.data.events[0].title,'new');assert.equal(a.manifest.parts.events,2);
 for(const cfg of [{local:'draft'},{cached:1},{mode:'admin'},{hidden:true},{open:true}]){
  const b=fixture(cfg);b.run.setNotice(2);assert.equal(await b.run.applyPeerWorkspace(),false);assert.equal(b.data.events[0].title,cfg.local||'old');assert.equal(b.manifest.parts.events,1);
 }
});
