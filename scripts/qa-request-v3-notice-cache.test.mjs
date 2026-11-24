import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
const loader=readFileSync(new URL('../assets/online-v5-loader.js',import.meta.url),'utf8');
const start=loader.indexOf('String.raw`  let noticeCache='),end=loader.indexOf('`+safeFeatures.slice(noticeEnd)',start);
assert(start>=0&&end>start);
const patch=loader.slice(start+'String.raw`'.length,end);
test('packed notice patch targets exist exactly once',()=>{
 const encoded=loader.match(/const PAYLOAD='([A-Za-z0-9+/=]+)'/)[1],decoded=gunzipSync(Buffer.from(encoded,'base64')).toString();
 assert.equal(decoded.split("  let noticeCache={url:'',rows:[],loading:false,error:''};").length,2);
 assert.equal(decoded.split('  function renderNoticeRows(').length,2);
});
test('notice hidden view, persistent empty result, no auto retry, and manual recovery',async()=>{
 let active=false,hidden=false,now=100000,calls=0,fail=false,rendered=[];
 const data={dashboardNoticeUrl:'fixture'},storageMap=new Map(),nodes={dashboard:{classList:{contains:()=>active}},dashboardNoticeList:{},dashboardNoticeStatus:{}};
 const queues=new Map(),locks={request(key,fn){const p=(queues.get(key)||Promise.resolve()).catch(()=>{}).then(fn);queues.set(key,p);return p}};
 const storage={getItem:k=>storageMap.get(k)||null,setItem:(k,v)=>storageMap.set(k,v)};
 const create=()=>new Function('window','document','localStorage','data','Date','extractStationId','extractNoticeBoardNumber','soopNoticeApiUrl','noticePostNo','noticeTitle','noticeDate','fetchSoopJson','renderNoticeRows',
 patch+'\nreturn loadDashboardNotices')({__mwsAppReadyV130:true,navigator:{locks},addEventListener(){}},{get hidden(){return hidden},getElementById:id=>nodes[id]},storage,data,class extends Date{static now(){return now}},()=> 'station',()=>'',()=> 'target',r=>String(r.id||''),r=>String(r.title||''),r=>String(r.date||''),async()=>{calls++;if(fail)throw Error('fixture');return {data:[]}},(_u,_s,rows)=>rendered.push(rows));
 const a=create(),b=create();
 await a();assert.equal(calls,0);
 active=true;await Promise.all([a(),b()]);assert.equal(calls,1);
 await a();await b();assert.equal(calls,1);assert.deepEqual(rendered.at(-1),[]);
 now+=60001;await a();assert.equal(calls,1,'Warm category reentry fetched');
 fail=true;const c=create();await c();assert.equal(calls,2);await c();assert.equal(calls,2);
 await c(true);assert.equal(calls,3);
 fail=false;await c(true);assert.equal(calls,4);await c();assert.equal(calls,4);
 hidden=true;await c(true);assert.equal(calls,4);
});
