import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../assets/steam-game-v111.js',import.meta.url),'utf8');
const code=source.slice(source.indexOf('const STEAM_CACHE_TTL'),source.indexOf('function resetPanelSearch'));
test('Steam local cache, same-query concurrency, invalid responses, and hidden/closed guards',async()=>{
 let now=100000,calls=0,active=true,hidden=false,query='Fixture',bad=false,display=[];
 const values=new Map(),storage={get length(){return values.size},key:i=>[...values.keys()][i],getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
 const queues=new Map(),locks={request(key,fn){const p=(queues.get(key)||Promise.resolve()).catch(()=>{}).then(fn);queues.set(key,p);return p}};
 const fetch=async raw=>{calls++;const q=new URL(raw,'http://127.0.0.1').searchParams.get('q');return {ok:!bad,json:async()=>bad?{error:'fixture'}:{query:q,results:[{appid:'1',name:q}]}}};
 const make=()=>new Function('window','document','localStorage','fetch','Date','$','renderSearchResults','console','clearTimeout',
  'let panelSearchGeneration=0,panelSearchTimer=null;const steamSearchPending=new Map(),steamSearchFailures=new Map();\n'+code+'\nreturn {readSteamSearch,searchSteam,cancelPanelSearch};')(
 {navigator:{locks}},{get hidden(){return hidden}},storage,fetch,{now:()=>now},id=>id==='eventModal'?{classList:{contains:()=>active}}:id==='eventGameSearchV112'?{value:query}:{hidden:false},(rows,msg)=>display.push({rows,msg}),{error(){}},()=>{});
 const a=make(),b=make();
 const batch=await Promise.all([a.readSteamSearch(query,()=>true),a.readSteamSearch(query,()=>true),b.readSteamSearch(query,()=>true)]);
 assert(batch.every(x=>x.results[0].name===query));assert.equal(calls,1);
 await make().searchSteam(query);assert.equal(calls,1);
 now+=60001;await a.searchSteam(query);assert.equal(calls,2);
 query='Another';active=false;await a.searchSteam(query);assert.equal(calls,2);
 active=true;hidden=true;await a.searchSteam(query);assert.equal(calls,2);
 hidden=false;bad=true;await a.searchSteam(query);assert.equal(calls,3);
 await a.searchSteam(query);assert.equal(calls,3);
 bad=false;await a.searchSteam(query,true);assert.equal(calls,4);assert.equal(display.at(-1).rows[0].name,query);
});
