import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const sw=readFileSync(new URL('../mws-media-cache-sw.js',import.meta.url),'utf8');
test('only verified short-lived live image responses can be cached; invalid route and expired rows rejected',()=>{
 const code=sw.slice(sw.indexOf('const LIVE_CACHE='),sw.indexOf('async function sweepLiveThumbs'));
 const f=new Function('self',code+'\nreturn {liveThumbKey,validLiveThumb,freshLiveThumb}')({location:{origin:'http://127.0.0.1'}});
 assert(f.liveThumbKey('http://127.0.0.1/api/soop/live-thumb?bno=123'));
 for(const url of ['http://127.0.0.1/api/soop/live-thumb?bno=abc','http://127.0.0.1/api/soop/live-thumb?bno=123&force=1','https://fixture.invalid/api/soop/live-thumb?bno=123'])assert.equal(f.liveThumbKey(url),null);
 const row=(at,policy='public, max-age=60')=>new Response(new Uint8Array([1]),{headers:{'content-type':'image/png','cache-control':policy,'x-mws-live-cached-at':String(at)}});
 assert(f.freshLiveThumb(row(100000),159999));assert(!f.freshLiveThumb(row(100000),160000));assert(!f.freshLiveThumb(row(100001),100000));
 assert(!f.validLiveThumb(row(100000,'private, max-age=60')));assert(!f.validLiveThumb(row(100000,'public, no-store, max-age=60')));
});
test('same-isolate simultaneous visitors share one upstream status fetch, including forced concurrent read',async()=>{
 const source=readFileSync(new URL('../src/cf-v120-friend.js',import.meta.url),'utf8');
 const code=source.slice(source.indexOf('async function liveRow('),source.indexOf('async function mapLimit('));
 let calls=0,release;const gate=new Promise(r=>release=r);
 const read=new Function('fetchText','attachNormalizedLive','Date','const LIVE_TTL_MS=30000,liveCache=new Map(),livePending=new Map();\n'+code+'\nreturn liveRow')(
 async target=>{calls++;await gate;return {url:target.href,status:200}},v=>v,{now:()=>100000});
 const target=new URL('https://fixture.invalid/channel');
 const pending=Array.from({length:10},(_,i)=>read(target,i%2===0));
 assert.equal(calls,1);release();assert((await Promise.all(pending)).every(r=>r.status===200));
 await read(target);assert.equal(calls,1);
});
