import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {handleArchiveGallery} from '../src/mawang-archive-gallery-v1.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const window={};vm.runInNewContext(read('assets/mawang-archive-data-v1.js'),{window});
const {entries,videos}=window.mwsMawangArchiveDataV1;
test('23 individually named records with dates distinguished from unknown dates and sources',()=>{
  assert.equal(entries.length,23);
  assert.equal(new Set(entries.map(c=>c.id)).size,23);
  assert.equal(entries.filter(c=>c.group==='jeong').length,9);
  assert.equal(entries.filter(c=>c.group==='classic').length,14);
  assert.equal(entries.filter(c=>c.imageSource.startsWith('PIKU')).length,20);
  assert.equal(entries.find(c=>c.id==='yoo').name,'유정');
  for(const c of entries){
    assert(c.description&&c.tagline&&c.english&&c.tags.length&&c.sources.length);
    assert(c.date===null||/^\d{4}-\d{2}-\d{2}$/.test(c.date));
    assert(c.date!==null||c.dateLabel.includes('미확인'));
    assert(/^https:\/\/(img2\.piku\.co\.kr|file\.namu\.moe)\//.test(c.imageOriginal));
    if(c.imageSource.startsWith('PIKU')){
      assert.equal(c.image,`/assets/mawang-archive-portraits/${c.id}.jpg`);
      const jpg=readFileSync(new URL('..'+c.image,import.meta.url));
      assert(jpg.length>1024&&jpg[0]===0xff&&jpg[1]===0xd8);
    }
    assert(c.sources.every(s=>s.url.startsWith('https://')&&!s.url.includes('cafe.naver')));
    assert(c.media.every(k=>videos[k]&&/^[\w-]{11}$/.test(videos[k].id)));
  }
});
test('archive registered between timeline and achievements; only gallery API writes',()=>{
  const html=read('index.html'),core=read('assets/app-core.js'),ui=read('assets/workspace-ui-v176.js'),runtime=read('assets/mawang-archive-v1.js'),css=read('assets/mawang-archive-v1.css');
  assert(/data-tab="careerTimeline"[\s\S]*?data-tab="mawangArchive"[\s\S]*?data-tab="achievements"/.test(html));
  assert(html.includes('id="mawangArchive"')&&html.includes('assets/mawang-archive-v1.js?v=3')&&html.includes('assets/mawang-archive-data-v1.js?v=2'));
  assert(core.includes("names.mawangArchive='마왕 자료실'")&&core.includes('window.mwsMawangArchiveV1?.render()'));
  assert(ui.includes('timeline.after(archive)')&&ui.includes('beforeAchievement=archive||timeline||afterPosts'));
  assert(!/\b(?:localStorage|setInterval|saveData)\s*\(/.test(runtime));
  assert(css.includes('prefers-reduced-motion:reduce')&&css.includes('data-mws-motion=reduced'));
});
test('gallery stores originals, exposes public reads, enforces admin writes, and isolates characters',async()=>{
  const objects=new Map();
  const bucket={
    async list({prefix}){return {objects:[...objects.values()].filter(x=>x.key.startsWith(prefix)),truncated:false}},
    async put(key,bytes,{httpMetadata}){const object={key,uploaded:new Date(),size:bytes.byteLength,body:bytes,httpEtag:'"test"',writeHttpMetadata(h){h.set('content-type',httpMetadata.contentType)}};objects.set(key,object);return object},
    async get(key){return objects.get(key)},
    async delete(key){objects.delete(key)}
  };
  const env={IMAGES:bucket},call=(path,opts={},admin=false)=>handleArchiveGallery(new Request('https://example.test'+path,opts),env,async()=>admin?{id:'test'}:null);
  const data=readFileSync(new URL('../assets/mawang-archive-portraits/yoo.jpg',import.meta.url));
  const upload={method:'POST',headers:{'content-type':'image/jpeg'},body:data};
  assert.equal((await call('/api/mawang-gallery/ae',upload)).status,401);
  assert.equal((await call('/api/mawang-gallery/invalid',upload,true)).status,400);
  assert.equal((await call('/api/mawang-gallery/ae',{...upload,headers:{'content-type':'image/svg+xml'}},true)).status,415);
  assert.equal((await call('/api/mawang-gallery/ae',{...upload,body:'not an image'},true)).status,415);
  assert.equal((await call('/api/mawang-gallery/ae',{...upload,headers:{...upload.headers,origin:'https://other.test'}},true)).status,403);
  const result=await call('/api/mawang-gallery/ae',upload,true);assert.equal(result.status,201);
  const {photo}=await result.json();assert.equal(photo.character,'ae');assert.equal(photo.size,data.length);
  const second=await call('/api/mawang-gallery/ae',upload,true);assert.equal(second.status,201);
  const publicList=await (await call('/api/mawang-gallery')).json();assert.equal(publicList.photos.length,2);
  const media=await call(photo.url);assert.equal(media.headers.get('content-type'),'image/jpeg');assert.deepEqual(Buffer.from(await media.arrayBuffer()),data);
  assert.equal((await call(photo.url,{method:'HEAD'})).status,200);
  assert.equal((await call('/api/mawang-gallery/ae/'+photo.id,{method:'DELETE'})).status,401);
  assert.equal((await call('/api/mawang-gallery/da/'+photo.id,{method:'DELETE'},true)).status,200);
  assert.equal((await call(photo.url)).status,200);
  assert.equal((await call('/api/mawang-gallery/ae/'+photo.id,{method:'DELETE'},true)).status,200);
  assert.equal((await call(photo.url)).status,404);
  assert.equal((await(await call('/api/mawang-gallery')).json()).photos.length,1);
});
