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
test('same-isolate reuse only completed plain-data status rows, respecting expiry and manual refresh',async()=>{
 const source=readFileSync(new URL('../src/cf-v120-friend.js',import.meta.url),'utf8');
 const code=source.slice(source.indexOf('async function liveRow('),source.indexOf('async function mapLimit('));
 let calls=0,now=100000;
 const read=new Function('fetchText','attachNormalizedLive','Date','const LIVE_TTL_MS=30000,liveCache=new Map();\n'+code+'\nreturn liveRow')(
 async target=>{calls++;return {url:target.href,status:200}},v=>v,{now:()=>now});
 const target=new URL('https://fixture.invalid/channel');
 assert.equal((await read(target)).status,200);await read(target);assert.equal(calls,1);
 now+=30000;await read(target);assert.equal(calls,2);await read(target,true);assert.equal(calls,3);
 assert(!source.includes('livePending'),'Do not share request-scoped I/O promises across invocations');
});
