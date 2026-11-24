import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const slice=(s,a,b)=>{const x=s.indexOf(a),y=s.indexOf(b,x);assert(x>=0&&y>x);return s.slice(x,y)};
for(const path of ['assets/cloud-runtime-v130.js','assets/cloud-v1.1.js'])test(path+' shares one remaining-data request across rapid navigation',async()=>{
 const src=read(path),code=slice(src,'async function ensureRemainingWorkspace()','window.mwsV55EnsureParts=');
 let calls=0,renders=0;let release;const wait=new Promise(r=>release=r);
 const parts=['core','events','contacts','posts','miniGames','wardogs'],loaded=new Set(parts.slice(0,3));
 const api=new Function('ALL_PARTS','loadedParts','PARTS_BY_TAB','loadWorkspaceParts','mergePart','normalizeDataShape','window','CustomEvent','setSaveStatus','baselineJson','data', "let mode='public',hydrationSeq=1,manifest={parts:{}},remainingWorkspaceLoad=null,remainingRetryAt=0;"+code+'\nreturn {ensurePartsForTab,ensureRemainingWorkspace}')(parts,loaded,{contacts:['posts'],posts:['posts'],gameLadder:['miniGames'],wardogs:['wardogs'],calendar:[]},async(_,missing)=>{calls++;await wait;return missing.map(p=>({status:'fulfilled',value:{data:{p},version:1}}))},()=>{},()=>{renders++},{dispatchEvent(){}},class{},()=>{},new Map(),{});
 const requests=[api.ensureRemainingWorkspace(),...Array.from({length:20},(_,i)=>api.ensurePartsForTab(['contacts','posts','gameLadder','wardogs','calendar'][i%5]))];
 release();assert((await Promise.all(requests)).every(Boolean));assert.equal(calls,1);assert.equal(renders,1);
 for(let i=0;i<20;i++)await api.ensurePartsForTab(['contacts','posts','gameLadder','wardogs','calendar'][i%5]);assert.equal(calls,1);
});
test('200 simultaneous LIVE readers use bounded batches, even when every batch fails',async()=>{
 const src=read('assets/friend-finder-v120.js');
 const code=slice(src,'async function runBatch(extraTarget','function stopActiveRefresh()')+slice(src,'window.fetch=async function','function installStyle');
 const urls=Array.from({length:200},(_,i)=>'https://api-channel.sooplive.co.kr/v1.1/channel/user'+i+'/home/section/broad');
 let batchCalls=0,singleCalls=0;const window={};const liveCache=new Map();
 const baseFetch=async(url,opts)=>{if(url!=='/api/soop/live-batch'){singleCalls++;throw Error('individual fallback')}batchCalls++;assert(JSON.parse(opts.body).urls.length<=12);return {ok:false,status:503}};
 const setup=new Function('window','document','allContactTargets','baseFetch','liveCache','liveByUserId','rememberRow','dispatchLiveUpdate','extractActualTarget','syntheticResponse','console','Request','Response','URL', 'const LIVE_BATCH_SIZE=12,LIVE_CACHE_MS=30000,liveAttempts=new Map();let batchPromise=null,forceNextBatch=false,friendReadGeneration=0;const friendReadActive=()=>true;'+code+'\nreturn {ensureBatch}')(window,{body:{dataset:{mwsMode:'public'}}},()=>[...urls],baseFetch,liveCache,new Map(),()=>{},()=>{},input=>new URL(input),()=>{throw Error('unexpected data')},{warn(){}},Request,Response,URL);
 const results=await Promise.all(urls.map(url=>window.fetch(url)));assert(results.every(r=>r.status===503));assert.equal(batchCalls,17);assert.equal(singleCalls,0);
 await Promise.all(urls.map(url=>window.fetch(url)));assert.equal(batchCalls,17);assert.equal(singleCalls,0);
});

test('contact image failures share retry URLs and suppress repeated failed fallback',()=>{
 const app=read('assets/app-core.js'),code=slice(app,'const mwsContactRetryHistoryV2=','function mwsBindContactMediaImageV111');
 let now=1000;class Image{constructor(src){this.src=src;this.dataset={};this.style={}}getAttribute(){return this.src}removeAttribute(){}replaceWith(){this.replaced=true}}
 const win={};
 new Function('window','HTMLImageElement','mwsContactMediaIdV110','contact','initials','mwsPersistentContactMediaFallbackV115','mwsContactFallbackNodeV110','Date',code)(win,Image,()=> 'one',()=>({name:'One'}),()=> 'O',()=>false,()=>({}),{now:()=>now});
 const a=new Image('/media/contact/one?v=1'),b=new Image('/media/contact/one?v=1');
 win.mwsRecoverContactMediaImageV110(a);now++;win.mwsRecoverContactMediaImageV110(b);assert.equal(a.src,b.src);
 win.mwsRecoverContactMediaImageV110(a);assert(a.replaced);
 const c=new Image('/media/contact/one?v=1');win.mwsRecoverContactMediaImageV110(c);assert(c.replaced);
 const d=new Image('/media/contact/one?v=2');win.mwsRecoverContactMediaImageV110(d);assert(!d.replaced);assert.notEqual(d.src,b.src);
 now+=60001;const e=new Image('/media/contact/one?v=1');win.mwsRecoverContactMediaImageV110(e);assert(!e.replaced);assert.notEqual(e.src,b.src);
});
