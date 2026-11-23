import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {handleArchiveGallery} from '../src/mawang-archive-gallery-v1.js';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

function createBucket(){
  const objects=new Map();
  let serial=0;
  const object=(key,bytes,type)=>{
    const revision=++serial;
    const stored={key,uploaded:new Date(1700000000000+revision*1000),
      etag:'abcd'+revision, httpEtag:'"abcd'+revision+'"',
      size:bytes.byteLength,body:bytes,
      writeHttpMetadata(headers){headers.set('content-type',type)}};
    objects.set(key,stored);
    return stored;
  };
  return {
    list:async({prefix})=>({objects:[...objects.values()].filter(o=>o.key.startsWith(prefix)),truncated:false}),
    get:async(key)=>objects.get(key)||null,
    put:async(key,bytes,{httpMetadata})=>object(key,bytes,httpMetadata.contentType),
    delete:async(key)=>objects.delete(key)
  };
}
const makeCall=bucket=>(path,options={},admin=false)=>handleArchiveGallery(
  new Request('https://example.test'+path,options),{IMAGES:bucket},async()=>admin?{id:'verified'}:null
);
const smallJpg=new Uint8Array([255,216,255,217]);

test('profile-list uses no-store 200/304 and revision-based ETag changes',async()=>{
  const call=makeCall(createBucket());
  const initial=await call('/api/mawang-profile');
  assert.equal(initial.status,200);
  assert.equal(initial.headers.get('cache-control'),'no-store');
  const initialTag=initial.headers.get('etag');
  assert.match(initialTag,/^"[a-f0-9]{32}"$/);
  assert.deepEqual((await initial.json()).profiles,[]);
  const unchanged=await call('/api/mawang-profile',{headers:{'If-None-Match':initialTag}});
  assert.equal(unchanged.status,304);
  assert.equal(unchanged.headers.get('etag'),initialTag);
  assert.equal(unchanged.headers.get('cache-control'),'no-store');
  assert.equal(await unchanged.text(),'');

  const added=await call('/api/mawang-profile/yoo',{
    method:'PUT',headers:{'content-type':'image/jpeg'},body:smallJpg
  },true);
  assert.equal(added.status,200);
  const {profile}=await added.json();
  assert.match(profile.revision,/^\d+-abcd1$/);
  const changed=await call('/api/mawang-profile',{headers:{'If-None-Match':initialTag}});
  assert.equal(changed.status,200);
  const newerTag=changed.headers.get('etag');
  assert.notEqual(newerTag,initialTag);
  assert.equal((await changed.json()).profiles[0].character,'yoo');

  const edited=await call('/api/mawang-profile/yoo',{
    method:'PUT',headers:{'content-type':'image/jpeg'},body:smallJpg
  },true);
  assert.equal(edited.status,200);
  const afterEdit=await call('/api/mawang-profile',{headers:{'If-None-Match':newerTag}});
  assert.equal(afterEdit.status,200);
  const afterEditTag=afterEdit.headers.get('etag');
  assert.notEqual(afterEditTag,newerTag);
  await afterEdit.json();
  assert.equal((await call('/api/mawang-profile/yoo',{method:'DELETE'},true)).status,200);
  const afterDelete=await call('/api/mawang-profile',{headers:{'If-None-Match':afterEditTag}});
  assert.equal(afterDelete.status,200);
  assert.deepEqual((await afterDelete.json()).profiles,[]);
});

test('small versioned public portrait uses 24h HTTP disk cache without new JS image copies',async()=>{
  const call=makeCall(createBucket());
  const response=await call('/api/mawang-profile/mi',{
    method:'PUT',headers:{'content-type':'image/jpeg'},body:smallJpg
  },true);
  const {profile}=await response.json();
  const route='/media/mawang-profile/mi';
  const versioned=await call(route+'?rev='+encodeURIComponent(profile.revision));
  assert.equal(versioned.status,200);
  assert.equal(versioned.headers.get('cache-control'),'public, max-age=86400, immutable');
  assert.equal(versioned.headers.get('x-mws-image-policy'),'original-bytes-no-reencode');
  assert.deepEqual(new Uint8Array(await versioned.arrayBuffer()),smallJpg);
  const head=await call(route+'?rev='+encodeURIComponent(profile.revision),{method:'HEAD'});
  assert.equal(head.status,200);
  assert.equal(head.headers.get('cache-control'),'public, max-age=86400, immutable');
  assert.equal((await head.arrayBuffer()).byteLength,0);
  assert.equal((await call(route)).headers.get('cache-control'),'public, max-age=300');
  assert.equal((await call(route+'?rev=old')).headers.get('cache-control'),'public, max-age=300');
});

test('large portrait and deleted profile stay bounded and do not expose admin mutation',async()=>{
  const call=makeCall(createBucket());
  const big=new Uint8Array(2*1024*1024+1);
  big.set([255,216,255],0);
  assert.equal((await call('/api/mawang-profile/su',{method:'PUT',headers:{'content-type':'image/jpeg'},body:smallJpg})).status,401);
  const put=await call('/api/mawang-profile/su',{
    method:'PUT',headers:{'content-type':'image/jpeg'},body:big
  },true);
  const {profile}=await put.json();
  assert.equal((await call(profile.url)).headers.get('cache-control'),'public, max-age=300');
  assert.equal((await call('/media/mawang-profile/su')).headers.get('cache-control'),'public, max-age=300');
  await call('/api/mawang-profile/su',{method:'DELETE'},true);
  assert.equal((await call(profile.url)).status,404);
});

test('client revalidates archive manifest after interval without IndexedDB, localStorage or blob duplication',()=>{
  const runtime=read('assets/mawang-archive-v1.js');
  const cloud=read('assets/cloud-v5.5.js');
  assert.match(runtime,/PROFILE_REVALIDATE_MS=60_000/);
  assert.match(runtime,/'If-None-Match'/);
  assert.match(runtime,/response\.status===304/);
  assert.match(runtime,/if\(mounted\)\{void loadProfiles\(\);return\}/);
  assert.doesNotMatch(runtime,/\b(?:indexedDB|localStorage|caches\.open|createObjectURL)\s*\(/);
  assert.match(cloud,/data:value,cachedAt:Date\.now\(\)/);
  assert.doesNotMatch(cloud,/data:clone\(value\),cachedAt:Date\.now\(\)/);
  assert.match(cloud,/mwsV55CacheDiagnostics=async/);
});
