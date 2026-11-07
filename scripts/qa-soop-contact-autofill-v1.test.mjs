import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseSoopStationId,parseSoopStationResponse,handleSoopContactRoute} from '../src/soop-contact-autofill-v1.js';

const API='https://mws.example/api/soop/contact-station?id=kwakchunshik';
const AVATAR='https://mws.example/api/soop/contact-avatar?id=kwakchunshik';
const imageUrl='https://profile.img.sooplive.com/LOGO/kw/kwakchunshik/kwakchunshik.jpg';
const good={station:{user_id:'kwakchunshik',user_nick:'곽춘식'},profile_image:imageUrl};
const stationResponse=()=>Response.json(good);
const fakeFetch=async()=>stationResponse();
const data=async(res)=>res.json();

test('SOOP user IDs must be bounded plain identifiers',()=>{
  assert.equal(parseSoopStationId('kwakchunshik'),'kwakchunshik');
  assert.equal(parseSoopStationId('abc_2026'),'abc_2026');
  for(const value of ['','x','a'.repeat(41),'../../etc/passwd','http://example.com','abc@site','abc%2Fxxx'])
    assert.equal(parseSoopStationId(value),null,value);
});
test('trusted nickname and image are returned only for matching station ID',()=>{
  const v=parseSoopStationResponse(good,'kwakchunshik');
  assert.equal(v.name,'곽춘식');assert.equal(v.upstreamImage,imageUrl);assert.equal(v.hasProfile,true);
  assert.equal(parseSoopStationResponse({station:{user_id:'other',user_nick:'Other'}},'kwakchunshik'),null);
  assert.equal(parseSoopStationResponse({station:{user_nick:''}},'kwakchunshik'),null);
});
test('station lookup returns nickname, canonical URL and internal image path',async()=>{
  const res=await handleSoopContactRoute(new Request(API),fakeFetch);
  assert.equal(res.status,200);
  const json=await data(res);
  assert.equal(json.name,'곽춘식');
  assert.equal(json.stationUrl,'https://www.sooplive.com/station/kwakchunshik');
  assert.equal(json.avatarUrl,'/api/soop/contact-avatar?id=kwakchunshik');
  assert.equal(json.upstreamImage,undefined);
});
test('profile proxy preserves valid image content without direct CORS access',async()=>{
  let calls=[];
  const fetcher=async url=>{
    calls.push(String(url));
    return String(url).includes('/station')?stationResponse():
      new Response(new Uint8Array([0xff,0xd8,0xff,0xd9]),{headers:{'content-type':'image/jpeg'}});
  };
  const res=await handleSoopContactRoute(new Request(AVATAR),fetcher);
  assert.equal(res.status,200);
  assert.equal(res.headers.get('content-type'),'image/jpeg');
  assert.equal((await res.arrayBuffer()).byteLength,4);
  assert.equal(calls.length,2);
  assert.equal(calls[1],imageUrl);
});
test('hostile image domains and non-https URLs never get fetched',async()=>{
  for(const image of ['http://profile.img.sooplive.com/p.jpg','https://sooplive.com.evil.test/p.jpg','https://127.0.0.1/p.jpg']){
    let count=0;
    const fetcher=async()=>{count++;return Response.json({...good,profile_image:image})};
    const result=await data(await handleSoopContactRoute(new Request(API),fetcher));
    assert.equal(result.hasProfile,false);
    const avatarRes=await handleSoopContactRoute(new Request(AVATAR),fetcher);
    assert.equal(avatarRes.status,404);
    assert.equal(count,2);
  }
});
test('Cloudflare regional host fallback succeeds when first endpoint blocks',async()=>{
  const calls=[];
  const fetcher=async url=>{
    calls.push(String(url));
    if(calls.length===1)return new Response('Forbidden',{status:403});
    return stationResponse();
  };
  const res=await handleSoopContactRoute(new Request(API),fetcher);
  assert.equal(res.status,200);
  assert.equal((await res.json()).name,'곽춘식');
  assert.equal(calls.length,2);
  assert(calls[0].includes('chapi.sooplive.co.kr'));
  assert(calls[1].includes('chapi.sooplive.com'));
});
test('failed fixed-host lookups expose only safe numeric diagnostics when asked',async()=>{
  const blocked=async()=>new Response('Forbidden',{status:403});
  const res=await handleSoopContactRoute(new Request(API+'&diagnostics=1'),blocked);
  assert.equal(res.status,502);
  const payload=await res.json();
  assert.equal(payload.upstreamAttempts.length,4);
  assert(payload.upstreamAttempts.every(x=>x.status===403));
  const silent=await handleSoopContactRoute(new Request(API),blocked);
  assert.equal((await silent.json()).upstreamAttempts,undefined);
});
test('malformed station and unsupported avatar MIME fail closed',async()=>{
  const badFetch=async()=>Response.json({station:{user_nick:''}});
  assert.equal((await handleSoopContactRoute(new Request(API),badFetch)).status,502);
  const badAvatar=async url=>String(url).includes('/station')?stationResponse():
    new Response('<svg></svg>',{headers:{'content-type':'image/svg+xml'}});
  assert.equal((await handleSoopContactRoute(new Request(AVATAR),badAvatar)).status,415);
});
test('invalid ID and unsafe HTTP methods rejected before upstream requests',async()=>{
  let count=0;const fetcher=async()=>{count++;return stationResponse()};
  assert.equal((await handleSoopContactRoute(new Request('https://mws.example/api/soop/contact-station?id=../etc'),fetcher)).status,400);
  assert.equal((await handleSoopContactRoute(new Request(API,{method:'POST'}),fetcher)).status,405);
  assert.equal(count,0);
});
test('UI bootstraps once after app-core, retains existing save/image handlers',()=>{
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const ui=readFileSync(new URL('../assets/soop-contact-autofill-v1.js',import.meta.url),'utf8');
  const core=readFileSync(new URL('../assets/app-core.js',import.meta.url),'utf8');
  const worker=readFileSync(new URL('../src/cf-v111-entry.js',import.meta.url),'utf8');
  assert(html.indexOf('assets/app-core.js')<html.indexOf('assets/soop-contact-autofill-v1.js'));
  assert.equal(html.split('assets/soop-contact-autofill-v1.js').length-1,1);
  assert(ui.includes('window.handleContactImageFile(avatarFile)'));
  assert(ui.includes('findContactForSoopApplicant'));
  assert(ui.includes('const alreadyHasImage=Boolean(stored?.image'));
  assert(core.includes('pendingContactImageFile=file;'));
  assert(core.includes("const file=pendingContactImageFile||"));
  assert(worker.includes("return handleSoopContactRoute(request)"));
});
