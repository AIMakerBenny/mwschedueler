import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {handleArchiveGallery} from '../src/mawang-archive-gallery-v1.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const window={};vm.runInNewContext(read('assets/mawang-archive-data-v1.js'),{window});
const {entries,videos}=window.mwsMawangArchiveDataV1;
test('28 individually named records with requested priority and verified detail notes',()=>{
  assert.equal(entries.length,28);
  assert.equal(new Set(entries.map(c=>c.id)).size,28);
  assert.equal(entries.filter(c=>c.group==='jeong').length,13);
  assert.equal(entries.filter(c=>c.group==='classic').length,14);
  assert.equal(entries.filter(c=>c.group==='mascot').length,1);
  assert.equal(entries.find(c=>c.id==='kkomwang').group,'jeong');
  assert(entries.find(c=>c.id==='kkomwang').tags.includes('신작'));
  assert(entries.slice(0,13).every(c=>c.group==='jeong')&&entries.slice(13,27).every(c=>c.group==='classic')&&entries[27].group==='mascot');
  assert.deepEqual(Array.from(entries.slice(0,6),c=>c.id),['yoo','da','su','su-black','su-half','ae']);
  assert.deepEqual(Array.from(entries.filter(c=>c.group==='jeong').slice(-2),c=>c.id),['mi','mi-gold']);
  assert.equal(entries.filter(c=>c.imageSource.startsWith('PIKU')).length,20);
  assert.equal(entries.find(c=>c.id==='yoo').name,'유정');
  assert.deepEqual(Array.from(entries.filter(c=>c.variantOf==='미정'),c=>c.name),['흑미정','금미정']);
  assert.deepEqual(Array.from(entries.filter(c=>c.variantOf==='수정'),c=>c.name),['백수정','흑수정','반반수정']);
  assert.equal(entries.find(c=>c.id==='mi').name,'흑미정');
  assert.equal(entries.find(c=>c.id==='su').name,'백수정');
  for(const c of entries){
    assert(c.english&&c.tags.length&&Array.isArray(c.details));
    assert(c.description&&c.tagline);
    assert(!/미확인|확인되지|확보하지|불명|알려지지|추정|기록(?:이 있다|되어|돼|에 남)|갤러리로 관리|관리자 프로필|정반대의 매력|시청자들은/.test([c.dateLabel,c.tagline,c.description,...c.tags,...c.details.flat()].join(' ')));
    assert(['kkomwang','marorong'].includes(c.id)||c.sources.length);
    assert(c.date===null||/^\d{4}-\d{2}-\d{2}$/.test(c.date));
    assert(c.date!==null||c.dateLabel===null);
    if(['mi-gold','su-black','su-half','kkomwang'].includes(c.id)){assert.equal(c.image,null);assert.equal(c.imageOriginal,null);assert.equal(c.date,null)}
    else if(c.id==='marorong'){assert.equal(c.image,'/assets/mawang-archive-portraits/marorong.webp');assert.equal(c.imageOriginal,c.image);const bytes=readFileSync(new URL('..'+c.image,import.meta.url));assert(bytes.length>3000&&bytes.toString('ascii',8,12)==='WEBP');}
    else assert(/^https:\/\/(img2\.piku\.co\.kr|file\.namu\.moe)\//.test(c.imageOriginal));
    if(c.imageSource.startsWith('PIKU')){
      assert.equal(c.image,`/assets/mawang-archive-portraits/${c.id}.jpg`);
      const jpg=readFileSync(new URL('..'+c.image,import.meta.url));
      assert(jpg.length>1024&&jpg[0]===0xff&&jpg[1]===0xd8);
    }
    assert(c.sources.every(s=>s.url.startsWith('https://')&&!s.url.includes('cafe.naver')));
    assert(c.media.every(k=>videos[k]&&/^[\w-]{11}$/.test(videos[k].id)));
  }
});
test('color variants share one character introduction, without changing the individual records',()=>{
  const byId=id=>entries.find(c=>c.id===id);
  for(const ids of [['su','su-black','su-half'],['mi','mi-gold']]){
    const base=byId(ids[0]);
    for(const id of ids.slice(1)){
      const variant=byId(id);assert.equal(variant.description,base.description);assert.deepEqual(variant.details,base.details);assert.notEqual(variant.name,base.name);
    }
  }
  assert.deepEqual(Array.from(byId('kkomwang').details),[]);assert.match(byId('kkomwang').description,/쇼츠 콘텐츠 활성화/);assert.match(byId('kkomwang').tagline,/쇼츠/);
  assert.match(byId('ae').description,/개백순/);assert(byId('ae').tags.includes('개백순'));
});
test('representative official videos remain attached to character copy as internal references',()=>{
  const expected={hakka:['hakka','pianoman'],lena:['hakka'],kokoa:['kokoa'],devil:['devil'],hina:['hina','hamsterAdventure','hamsterMeal'],real:['real'],'baby-shark':['babyShark']};
  for(const [id,keys] of Object.entries(expected)){
    const c=entries.find(item=>item.id===id);
    for(const key of keys){const video=videos[key];assert(c.media.includes(key));if(video.published!==undefined)assert.match(video.published,/^\d{4}-\d{2}-\d{2}$/);assert(c.sources.some(s=>s.url==='https://www.youtube.com/watch?v='+video.id));}
    assert(c.details.some(([,value])=>value.includes(videos[keys[0]].title==='Find the MaWang Hamster'?'숨바꼭질':videos[keys[0]].title.split(' · ')[0])||value.includes('360도')));
  }
});
test('portrait arrows navigate the matching list and synchronize roster pages',async()=>{
  const nodes=new Map(),handlers=new Map(),makeNode=()=>({innerHTML:'',textContent:'',clientWidth:1450,dataset:{},style:{setProperty(){}},getBoundingClientRect:()=>({top:280}),focus(){}});
  const root={clientWidth:1600,innerHTML:'',closest:()=>null,querySelector(s){if(!nodes.has(s))nodes.set(s,makeNode());return nodes.get(s)},querySelectorAll:()=>[],addEventListener:(name,fn)=>handlers.set(name,fn)};
  const win={mwsMawangArchiveDataV1:window.mwsMawangArchiveDataV1,scrollY:0,innerHeight:900,addEventListener:(name,fn)=>handlers.set(name,fn)};
  vm.runInNewContext(read('assets/mawang-archive-v1.js'),{window:win,document:{getElementById:()=>root,body:{dataset:{}}},fetch:async()=>new Response(JSON.stringify({profiles:[]}))});
  win.mwsMawangArchiveV1.render();
  const click=dataset=>handlers.get('click')({target:{closest:()=>({dataset})}}),name=()=>root.querySelector('.ma-profile-panel').innerHTML.match(/id="maCharacterName">([^<]+)</)[1],step=n=>click({maHeroStep:String(n)}),page=()=>root.querySelector('.ma-pagination').textContent;
  const rosterIds=()=>Array.from(root.querySelector('.ma-roster-grid').innerHTML.matchAll(/data-ma-character="([^"]+)"/g),m=>m[1]);
  const expectedIds=group=>Array.from(entries.filter(c=>c.group===group),c=>c.id);
  assert.equal(name(),'유정');assert.deepEqual(rosterIds(),expectedIds('jeong'));assert.equal(page(),'1 / 3 페이지 · 정 시리즈');
  click({maStep:'1'});assert.equal(name(),'하카');assert.deepEqual(rosterIds(),expectedIds('classic'));assert.equal(page(),'2 / 3 페이지 · 클래식');click({maStep:'1'});assert.equal(name(),'마로롱');assert.deepEqual(rosterIds(),expectedIds('mascot'));assert.equal(page(),'3 / 3 페이지 · 마스코트');click({maStep:'-1'});
  for(const width of [1000,400,250,1450]){root.querySelector('.ma-roster-grid').clientWidth=width;root.clientWidth=width+100;handlers.get('resize')();assert.deepEqual(rosterIds(),expectedIds('classic'));assert.equal(name(),'하카');}
  click({maStep:'-1'});assert.equal(name(),'유정');assert.deepEqual(rosterIds(),expectedIds('jeong'));
  click({maStep:'-1'});assert.equal(name(),'마로롱');assert.equal(page(),'3 / 3 페이지 · 마스코트');
  click({maStep:'1'});assert.equal(name(),'유정');assert.equal(page(),'1 / 3 페이지 · 정 시리즈');
  click({maStep:'1'});click({maCharacter:'baby-kuma'});step(1);assert.equal(name(),'마로롱');assert.equal(page(),'3 / 3 페이지 · 마스코트');
  step(1);assert.equal(name(),'유정');assert.equal(page(),'1 / 3 페이지 · 정 시리즈');
  step(1);assert.equal(name(),'다정');step(-1);assert.equal(name(),'유정');step(-1);assert.equal(name(),'마로롱');assert.equal(page(),'3 / 3 페이지 · 마스코트');step(1);assert.equal(name(),'유정');assert.equal(page(),'1 / 3 페이지 · 정 시리즈');
  click({maCharacter:'mi-gold'});step(1);assert.equal(name(),'하카');assert.deepEqual(rosterIds(),expectedIds('classic'));step(-1);assert.equal(name(),'금미정');assert.deepEqual(rosterIds(),expectedIds('jeong'));click({maCharacter:'yoo'});
  const seen=[];for(let i=0;i<28;i++){seen.push(name());const markup=root.querySelector('.ma-stage').innerHTML;const entry=entries.find(c=>c.name===name());assert(!/미확인|확인되지|기록돼|기록되어|추정|불명/.test(markup));if(entry.date)assert(markup.includes(`<dt>${entry.dateLabel}</dt><dd>${entry.date.replaceAll('-','.')}</dd>`));else assert.deepEqual(Array.from(markup.matchAll(/<dt>([^<]*)<\/dt>/g),m=>m[1]),['분류']);if(name()==='꼬뫙'){assert(markup.includes('쇼츠 콘텐츠 활성화'));assert(!markup.includes('ma-character-details'))}step(1)}assert.equal(new Set(seen).size,28);assert.equal(name(),'유정');
  click({maFilter:'jeong'});
  assert.deepEqual(rosterIds(),expectedIds('jeong'));assert.equal(page(),'1 / 1 페이지 · 정 시리즈');
  click({maStep:'-1'});assert.equal(name(),'마로롱');assert.equal(page(),'3 / 3 페이지 · 마스코트');
  click({maFilter:'classic'});click({maCharacter:'baby-kuma'});step(1);assert.equal(name(),'마로롱');
  step(1);assert.equal(name(),'유정');click({maFilter:'jeong'});
  handlers.get('input')({target:{value:'수정',matches:()=>true}});
  assert.equal(name(),'백수정');step(1);assert.equal(name(),'흑수정');step(1);assert.equal(name(),'반반수정');step(1);assert.equal(name(),'백수정');
  handlers.get('input')({target:{value:'유정',matches:()=>true}});step(1);assert.equal(name(),'유정');assert.match(root.querySelector('.ma-stage').innerHTML,/data-ma-hero-step="1"[^>]*disabled/);
  await new Promise(resolve=>setImmediate(resolve));
});
test('public and unready admin mount no profile controls; authenticated mode change mounts and removes them',async()=>{
  const nodes=new Map(),handlers=new Map(),writes=[],body={dataset:{mwsMode:'public'}},makeNode=()=>({innerHTML:'',textContent:'',clientWidth:1450,dataset:{},style:{setProperty(){}},getBoundingClientRect:()=>({top:280}),focus(){},click(){writes.push('picker')}});
  const root={clientWidth:1600,innerHTML:'',closest:()=>null,querySelector(s){if(!nodes.has(s))nodes.set(s,makeNode());return nodes.get(s)},querySelectorAll:()=>[],addEventListener:(name,fn)=>handlers.set(name,fn)};
  const win={mwsMawangArchiveDataV1:window.mwsMawangArchiveDataV1,scrollY:0,innerHeight:900,addEventListener:(name,fn)=>handlers.set(name,fn)};
  let observe;class Observer{constructor(fn){observe=fn}observe(){}}
  vm.runInNewContext(read('assets/mawang-archive-v1.js'),{window:win,document:{getElementById:()=>root,body},MutationObserver:Observer,fetch:async(url,opts)=>{if(opts.method)writes.push(opts.method);return new Response(JSON.stringify({profiles:[{character:'mi',revision:'123-abcd'}]}))}});
  win.mwsMawangArchiveV1.render();await new Promise(resolve=>setImmediate(resolve));
  const panel=()=>root.querySelector('.ma-profile-panel').innerHTML,slot=()=>root.querySelector('.ma-admin-input-slot').innerHTML;
  assert.doesNotMatch(panel(),/data-ma-profile-upload|data-ma-profile-reset|ma-profile-label/);assert.equal(slot(),'');
  assert.doesNotMatch(root.innerHTML,/<input class="ma-profile-input"/);
  const forged=()=>handlers.get('click')({target:{closest:()=>({dataset:{},hasAttribute:attr=>attr==='data-ma-profile-upload'})}});
  forged();assert.deepEqual(writes,[]);
  body.dataset.mwsMode='admin';observe();assert.doesNotMatch(panel(),/data-ma-profile-upload/);assert.equal(slot(),'');
  win.__mwsAppReadyV130=true;handlers.get('mws:app-ready')();assert.match(panel(),/data-ma-profile-upload/);assert.match(slot(),/type="file"/);
  handlers.get('click')({target:{closest:()=>({dataset:{maCharacter:'mi'}})}});assert.match(panel(),/data-ma-profile-reset/);
  body.dataset.mwsMode='public';observe();assert.doesNotMatch(panel(),/data-ma-profile-upload|data-ma-profile-reset/);assert.equal(slot(),'');forged();assert.deepEqual(writes,[]);
  handlers.get('input')({target:{value:'no match',matches:()=>true}});assert(root.querySelector('.ma-stage').hidden);assert.match(root.querySelector('.ma-roster-grid').innerHTML,/검색 초기화/);
  handlers.get('click')({target:{closest:()=>({dataset:{maClear:''}})}});assert(!root.querySelector('.ma-stage').hidden);
});
test('voice transition includes only the three broadcast stages, on the May 2023 milestone',()=>{
  const html=read('index.html'),year=html.match(/<details class="career-year" open><summary>2023년<\/summary>([\s\S]*?)<\/details>/)[1];
  const may=year.match(/<div class="career-month"><h3>5월<\/h3><ul>([\s\S]*?)<\/ul>/)[1];
  assert.match(may,/음성인식 자막 → STS 1\.0 → AI 보이스 2\.0/);
  assert.match(may,/2023년 5월부터 RVC 기반의 AI 보이스 2\.0/);
  assert.doesNotMatch(year,/Honey|Piano Man|AI 커버|미확인/);
});
test('archive registered between timeline and achievements; only gallery API writes',()=>{
  const html=read('index.html'),core=read('assets/app-core.js'),ui=read('assets/workspace-ui-v176.js'),runtime=read('assets/mawang-archive-v1.js'),css=read('assets/mawang-archive-v1.css');
  assert(/data-tab="careerTimeline"[\s\S]*?data-tab="mawangArchive"[\s\S]*?data-tab="achievements"/.test(html));
  assert(html.includes('id="mawangArchive"'));
  for(const asset of ['mawang-archive-v1.css','mawang-archive-v1.js','mawang-archive-data-v1.js']){
    assert(html.includes('assets/'+asset+'?v='),'versioned archive asset: '+asset);
  }
  assert(!runtime.includes('ma-gallery')&&!runtime.includes('<a ')&&!runtime.includes('ma-stage-ring')&&!runtime.includes('/api/mawang-gallery'));
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
  assert.equal(publicList.profiles.length,0);
  const profileUpload={...upload,method:'PUT'};
  assert.equal((await call('/api/mawang-profile/ae',profileUpload)).status,401);
  assert.equal((await call('/api/mawang-profile/ae',{...profileUpload,body:'invalid'},true)).status,415);
  const profileResponse=await call('/api/mawang-profile/ae',profileUpload,true);assert.equal(profileResponse.status,200);
  const {profile}=await profileResponse.json();assert.equal(profile.character,'ae');
  assert.deepEqual(Buffer.from(await (await call(profile.url)).arrayBuffer()),data);
  const replacement=readFileSync(new URL('../assets/mawang-archive-portraits/mi.jpg',import.meta.url));
  const replaced=await (await call('/api/mawang-profile/ae',{...profileUpload,body:replacement},true)).json();
  assert.deepEqual(Buffer.from(await (await call(replaced.profile.url)).arrayBuffer()),replacement);
  const withProfile=await (await call('/api/mawang-gallery')).json();assert.equal(withProfile.profiles.length,1);assert.equal(withProfile.photos.length,2);
  const profileOnly=await (await call('/api/mawang-profile')).json();assert.equal(profileOnly.profiles.length,1);assert(!('photos' in profileOnly));
  assert.equal((await call('/api/mawang-profile/kkomwang',profileUpload,true)).status,200);
  assert.equal((await call('/api/mawang-profile/kkomwang',{method:'DELETE'},true)).status,200);
  assert.equal((await call('/api/mawang-profile/ae',{method:'DELETE'})).status,401);
  await call('/api/mawang-profile/da',{method:'DELETE'},true);
  assert.equal((await call(profile.url)).status,200);
  const media=await call(photo.url);assert.equal(media.headers.get('content-type'),'image/jpeg');assert.deepEqual(Buffer.from(await media.arrayBuffer()),data);
  assert.equal((await call(photo.url,{method:'HEAD'})).status,200);
  assert.equal((await call('/api/mawang-gallery/ae/'+photo.id,{method:'DELETE'})).status,401);
  assert.equal((await call('/api/mawang-gallery/da/'+photo.id,{method:'DELETE'},true)).status,200);
  assert.equal((await call(photo.url)).status,200);
  assert.equal((await call('/api/mawang-gallery/ae/'+photo.id,{method:'DELETE'},true)).status,200);
  assert.equal((await call(photo.url)).status,404);
  assert.equal((await call(profile.url)).status,200);
  assert.equal((await call('/api/mawang-profile/ae',{method:'DELETE'},true)).status,200);
  assert.equal((await call(profile.url)).status,404);
  const finalList=await(await call('/api/mawang-gallery')).json();assert.equal(finalList.photos.length,1);assert.equal(finalList.profiles.length,0);
  for(const character of ['mi','mi-gold','su','su-black','su-half']){
    assert.equal((await call('/api/mawang-gallery/'+character,upload,true)).status,201);
    assert.equal((await call('/api/mawang-profile/'+character,profileUpload,true)).status,200);
  }
  const variants=await(await call('/api/mawang-gallery')).json();
  assert.equal(variants.photos.length,6);assert.equal(variants.profiles.length,5);
  await call('/api/mawang-profile/su-half',{method:'DELETE'},true);
  assert.equal((await call('/media/mawang-profile/su')).status,200);
  assert.equal((await call('/media/mawang-profile/su-black')).status,200);
});


test('sidebar has official icon links, compact zoom and admin-only docked save',()=>{
  const html=read('index.html'),styles=read('assets/sidebar-compact-v1.css');
  assert.match(html,/class="mws-creator-links"/);
  for(const href of [
    'https://www.sooplive.com/station/mawang0216',
    'https://www.youtube.com/channel/UCNpcMizRJ73OJm48LszuytQ/',
    'https://cafe.naver.com/mawangvr?iframe_url=/MyCafeIntro.nhn%3Fclubid=30660728'
  ])assert(html.includes('href="'+href+'"'));
  assert.equal((html.match(/id="mwsSidebarSaveBtn"/g)||[]).length,1);
  const dock=html.indexOf('id="mwsAccessTools"'),save=html.indexOf('id="mwsSidebarSaveBtn"'),admin=html.indexOf('id="mwsAdminManageBtn"');
  assert(dock>=0&&save>dock&&save<admin);
  assert(!html.includes('id="mwsStationVisitBtnV110"'));
  assert.match(html,/id="pageTextScaleValueV54"[^>]*>100%<\/span>/);
  assert(!html.includes('페이지 100%'));
  assert.match(html,/assets\/sidebar-compact-v1\.css\?v=1/);
  assert.match(styles,/grid-template-columns:184px/);
  assert.match(styles,/\#mwsSidebarSaveBtn\[hidden\]/);
});
