(()=>{
  'use strict';
  const db=window.mwsMawangArchiveDataV1,root=document.getElementById('mwsArchiveRoot');
  if(!db||!root)return;
  const {entries,videos,channels}=db;
  const escape=value=>String(value??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
  const groupName=c=>c.group==='jeong'?'정 시리즈':'클래식';
  const number=c=>String(c.number).padStart(2,'0');
  const thumb=id=>'https://i.ytimg.com/vi/'+id+'/hqdefault.jpg';
  const link=(url,label,cls='')=>`<a class="${cls}" href="${escape(url)}" target="_blank" rel="noopener noreferrer">${escape(label)} <span aria-hidden="true">↗</span></a>`;
  const missing=new Set(),uploaded=new Map(),profiles=new Map(),position=new Map(),busy=new Set(),messages=new Map();
  const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
  const validTypes=new Set(['image/jpeg','image/png','image/webp','image/gif','image/avif']);
  const isAdmin=()=>document.body.dataset.mwsMode==='admin';
  let selected=entries[0],filter='all',query='',mounted=false,galleryError='',galleryReady=false,lastWheel=-Infinity,wheelSum=0,drag=null,uploadTarget=null;
  const normalize=s=>s.toLocaleLowerCase('ko').replace(/[\s-]+/g,'');
  const matching=()=>entries.filter(c=>(filter==='all'||filter===c.group)&&normalize([c.name,c.english,c.tagline,...c.tags].join(' ')).includes(normalize(query)));
  const stock=c=>c.imageSource.startsWith('PIKU')?{url:c.image,caption:c.imageSource}:null;
  const profilePhoto=c=>profiles.get(c.id)||stock(c);
  const photos=c=>[...(uploaded.get(c.id)||[]),...(stock(c)?[stock(c)]:[])];
  const photoIndex=c=>Math.min(Math.max(0,position.get(c.id)||0),Math.max(0,photos(c).length-1));
  function pic(c,hero=false){
    const p=hero?photos(c)[photoIndex(c)]:profilePhoto(c),failed=!p||missing.has(p.url);
    return `<div class="ma-portrait${failed?' ma-image-missing':''}" style="--ma-color:${c.color}">
      <div class="ma-monogram" aria-hidden="true"><span>${escape(c.name.slice(0,1))}</span><i>MW / ${number(c)}</i></div>
      ${!failed?`<img class="ma-character-image" data-ma-image="${escape(p.url)}" src="${escape(p.url)}" alt="${escape(c.name)} 캐릭터 자료 이미지" loading="${hero?'eager':'lazy'}" decoding="async" draggable="false">`:''}
      ${hero?`<span class="ma-image-caption">${!p?'등록된 사진 없음':failed?'이미지를 불러올 수 없습니다':escape(p.caption)}</span>`:''}
    </div>`;
  }
  function videoCard(key){
    const v=videos[key];if(!v)return '';
    return `<a class="ma-video-card" href="https://www.youtube.com/watch?v=${v.id}" target="_blank" rel="noopener noreferrer"><div class="ma-video-thumb"><img src="${thumb(v.id)}" alt="" loading="lazy" decoding="async"><span aria-hidden="true">▶</span></div><div><small>${escape(v.kind)}</small><strong>${escape(v.title)}</strong><span>YOUTUBE ↗</span></div></a>`;
  }
  function roster(){
    const list=matching(),grid=root.querySelector('.ma-roster-grid');
    root.querySelector('.ma-count').textContent=list.length+' / '+entries.length;
    grid.innerHTML=list.length?list.map(c=>`<button class="ma-character-card${c.id===selected.id?' is-selected':''}" data-ma-character="${c.id}" aria-pressed="${c.id===selected.id}" style="--ma-color:${c.color}">${pic(c)}<span class="ma-roster-number">${number(c)}</span><span class="ma-roster-label"><strong>${escape(c.name)}</strong><small>${escape(c.english)}</small></span></button>`).join(''):'<p class="ma-no-results">검색 결과가 없습니다. 다른 이름이나 특징을 검색하세요.</p>';
    root.querySelectorAll('[data-ma-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.maFilter===filter)));
    revealSelected();
  }
  function revealSelected(){
    const grid=root.querySelector('.ma-roster-grid'),active=grid.querySelector('.is-selected');if(!active)return;
    const a=active.getBoundingClientRect(),b=grid.getBoundingClientRect();
    if(a.left<b.left+4)grid.scrollLeft+=a.left-b.left-4;
    else if(a.right>b.right-4)grid.scrollLeft+=a.right-b.right+4;
  }
  function profilePanel(){
    const c=selected,custom=profiles.has(c.id),p=profilePhoto(c),panel=root.querySelector('.ma-profile-panel');
    panel.innerHTML=`<div class="ma-profile-preview">${pic(c)}</div><div class="ma-profile-copy"><span class="ma-eyebrow">CHARACTER FILE / ${number(c)}</span><h2 id="maCharacterName">${escape(c.name)}</h2><p class="ma-english">${escape(c.english)}</p><span class="ma-profile-label">${custom?'등록된 프로필 사진':p?'기본 프로필 사진':'프로필 사진 미등록'}</span></div><div class="ma-profile-actions"><button type="button" data-ma-profile-upload ${busy.has(c.id)||!galleryReady?'disabled':''}>${custom?'프로필 사진 변경':'프로필 사진 등록'}</button>${custom?`<button type="button" data-ma-profile-reset ${busy.has(c.id)?'disabled':''}>프로필 초기화</button>`:''}</div>`;
  }
  function gallery(){
    const c=selected,list=photos(c),index=photoIndex(c),p=list[index],disabled=list.length<2?'disabled':'';
    const frame=root.querySelector('.ma-gallery-frame');
    frame.innerHTML=pic(c,true);
    frame.classList.toggle('ma-gallery-many',list.length>1);
    frame.title=list.length>1?'휠 또는 좌우 드래그 · 사진 좌우 클릭으로 이동':'';
    const thumbs=root.querySelector('.ma-gallery-thumbs');
    const signature=list.map(p=>p.url).join('|')||'empty';
    if(thumbs.dataset.photos!==signature){thumbs.dataset.photos=signature;thumbs.innerHTML=list.length?list.map((p,i)=>`<button type="button" data-ma-photo="${i}" aria-label="사진 ${i+1}"><img src="${escape(p.url)}" alt="" loading="lazy" draggable="false"></button>`).join(''):'<span>사진이 아직 등록되지 않았습니다</span>'}
    thumbs.querySelectorAll('[data-ma-photo]').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));
    const active=thumbs.querySelector('[aria-pressed=true]');
    if(active){if(active.offsetLeft<thumbs.scrollLeft)thumbs.scrollLeft=active.offsetLeft;else if(active.offsetLeft+active.offsetWidth>thumbs.scrollLeft+thumbs.clientWidth)thumbs.scrollLeft=active.offsetLeft+active.offsetWidth-thumbs.clientWidth}
    const nav=root.querySelector('.ma-stage-nav');
    if(!nav.firstElementChild)nav.innerHTML='<button type="button" data-ma-step="-1" aria-label="이전 사진">‹</button><span aria-live="polite"></span><button type="button" data-ma-step="1" aria-label="다음 사진">›</button>';
    nav.querySelector('span').textContent=(list.length?index+1:0)+' / '+list.length;
    nav.querySelectorAll('button').forEach(b=>b.disabled=Boolean(disabled));
    root.querySelector('.ma-gallery-actions').innerHTML=`<div class="ma-gallery-actions-label"><strong>갤러리 사진</strong><small>최대 30장 · 원본 저장 · 32MB/장</small></div><div class="ma-gallery-buttons"><button type="button" data-ma-upload aria-label="갤러리 사진 업로드" ${busy.has(c.id)||!galleryReady?'disabled':''}>＋ 갤러리 사진 업로드</button>${p?.id?`<button type="button" data-ma-delete="${p.id}" ${busy.has(c.id)?'disabled':''}>선택 사진 삭제</button>`:''}</div>`;
    root.querySelector('.ma-gallery-message').textContent=messages.get(c.id)||galleryError||'';
    root.querySelectorAll('.ma-profile-actions button').forEach(b=>b.disabled=busy.has(c.id)||!galleryReady);
    root.querySelector('.ma-announce').textContent=c.name+' 사진 '+(list.length?index+1:0)+' / '+list.length;
  }
  function stepPhoto(delta,focus=false){
    const list=photos(selected);if(list.length<2)return;
    position.set(selected.id,(photoIndex(selected)+delta+list.length)%list.length);gallery();
    if(focus)root.querySelector('[data-ma-step="'+delta+'"]')?.focus({preventScroll:true});
  }
  function stage(){
    const c=selected;
    const node=root.querySelector('.ma-stage');
    node.style.setProperty('--ma-color',c.color);
    node.innerHTML=`<div class="ma-stage-art">
       <div class="ma-stage-index"><span>AVATAR / ${number(c)}</span><span class="ma-stage-group">${groupName(c)}</span></div>
       <div class="ma-stage-ring" aria-hidden="true"></div><div class="ma-stage-word" aria-hidden="true">${escape(c.english.split(' ')[0])}</div>
       <div class="ma-gallery-frame" tabindex="0" aria-label="캐릭터 사진 갤러리"></div>
       <div class="ma-gallery-thumbs" aria-label="사진 목록"></div>
       <div class="ma-stage-nav"></div>
     </div><div class="ma-stage-info">
       <div class="ma-profile-panel"></div>
       <h3>${escape(c.tagline)}</h3><p class="ma-desc">${escape(c.description)}</p>
       <div class="ma-tags">${c.tags.map(t=>`<span>${escape(t)}</span>`).join('')}</div>
       <dl class="ma-facts"><div><dt>${escape(c.dateLabel)}</dt><dd>${c.date?escape(c.date.replaceAll('-','.')):'미확인'}</dd></div><div><dt>구분</dt><dd>${groupName(c)}</dd></div><div><dt>정보 근거</dt><dd>공개 기록 <small>2차 자료</small></dd></div></dl>
       <div class="ma-source-links">${c.sources.map(s=>link(s.url,s.label)).join('')}${link(c.imageOriginal,'이미지 원본 주소')}</div>
       <div class="ma-gallery-actions" aria-label="사진 관리"></div>
       <p class="ma-gallery-message" role="status"></p>
     </div>`;
    const related=root.querySelector('.ma-related');
    const keys=c.media.length?c.media:c.group==='classic'?['intro']:['profile'];
    related.innerHTML=`<div class="ma-section-title"><div><span class="ma-eyebrow">MEDIA LIBRARY</span><h3>${c.media.length?'관련 영상':'마왕 공식 아카이브'}</h3></div><span>${c.media.length?'선택한 캐릭터 관련 공개 자료':'개별 영상 미확인 · 공통 참고 영상'}</span></div><div class="ma-video-grid">${[...new Set([...keys,'intro','profile'])].map(videoCard).join('')}</div>`;
    profilePanel();gallery();
  }
  function choose(c,focus=false){
    if(!c)return;
    selected=c;wheelSum=0;lastWheel=-Infinity;
    // Only selection-dependent areas update; no full page re-render or timer.
    root.querySelectorAll('[data-ma-character]').forEach(b=>{
      const active=b.dataset.maCharacter===c.id;
      b.classList.toggle('is-selected',active);b.setAttribute('aria-pressed',String(active));
    });
    revealSelected();
    stage();
    if(focus)root.querySelector('[data-ma-character="'+c.id+'"]')?.focus({preventScroll:true});
  }
  function updateFilter(){
    const list=matching();
    if(list.length&&!list.includes(selected))selected=list[0];
    roster();stage();
  }
  function normalizePhoto(p){
    if(!entries.some(c=>c.id===p?.character)||!UUID.test(p?.id||''))return null;
    return {id:p.id,character:p.character,url:'/media/mawang-archive/'+p.character+'/'+p.id,caption:'관리자 등록 사진 · 원본'};
  }
  function normalizeProfile(p){
    if(!entries.some(c=>c.id===p?.character)||!/^\d{1,15}-[a-f0-9]{0,80}$/i.test(p?.revision||''))return null;
    return {character:p.character,url:'/media/mawang-profile/'+p.character+'?rev='+p.revision,caption:'관리자 등록 프로필'};
  }
  async function request(url,options={}){
    const response=await fetch(url,{credentials:'same-origin',cache:'no-store',...options});
    const body=await response.json().catch(()=>null);
    if(!response.ok||!body)throw Error(body?.error||'사진 서버 연결 실패');
    return body;
  }
  async function loadGallery(){
    try{
      const body=await request('/api/mawang-gallery');
      if(!Array.isArray(body.photos))throw Error('사진 목록을 불러올 수 없습니다.');
      uploaded.clear();
      for(const raw of body.photos){const p=normalizePhoto(raw);if(p)uploaded.set(p.character,[...(uploaded.get(p.character)||[]),p])}
      profiles.clear();
      for(const raw of body.profiles||[]){const p=normalizeProfile(raw);if(p)profiles.set(p.character,p)}
      galleryError='';galleryReady=true;roster();profilePanel();gallery();
    }catch(error){galleryError='등록 사진 목록을 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.';gallery()}
  }
  function updateGalleryUI(c){if(c===selected)gallery()}
  function updateProfileUI(c){roster();if(c===selected){profilePanel();gallery()}}
  async function changeProfile(c,file,reset=false){
    if(!isAdmin()||!galleryReady||busy.has(c.id))return;
    if(reset&&!confirm(c.name+'의 프로필 사진을 기본 상태로 되돌리시겠습니까?'))return;
    if(!reset&&(!file||!validTypes.has(file.type)||!file.size||file.size>32*1024*1024)){messages.set(c.id,'프로필 사진 형식 또는 32MB 용량 제한');updateProfileUI(c);return}
    busy.add(c.id);messages.set(c.id,'프로필 사진 저장 중…');updateProfileUI(c);
    try{
      const body=await request('/api/mawang-profile/'+c.id,reset?{method:'DELETE'}:{method:'PUT',headers:{'content-type':file.type},body:file});
      if(reset)profiles.delete(c.id);
      else{const p=normalizeProfile(body.profile);if(!p||p.character!==c.id)throw Error('프로필 저장 응답 오류');profiles.set(c.id,p)}
      messages.set(c.id,reset?'프로필 초기화 완료':'프로필 사진 저장 완료');
    }catch(error){messages.set(c.id,error.message)}
    finally{busy.delete(c.id);updateProfileUI(c)}
  }
  async function uploadFiles(c,files){
    if(!isAdmin()||!galleryReady||busy.has(c.id)||!files.length)return;
    busy.add(c.id);let added=0;const errors=[];
    messages.set(c.id,'원본 사진 업로드 중…');updateGalleryUI(c);
    try{
      for(const file of files){
        const count=(uploaded.get(c.id)||[]).length;
        if(count>=30){errors.push('최대 30장까지 등록 가능합니다.');break}
        if(!validTypes.has(file.type)||!file.size||file.size>32*1024*1024){errors.push(file.name+': 형식 또는 32MB 용량 제한');continue}
        try{
          const body=await request('/api/mawang-gallery/'+c.id,{method:'POST',headers:{'content-type':file.type},body:file});
          const p=normalizePhoto(body.photo);if(!p||p.character!==c.id)throw Error('업로드 응답 오류');
          uploaded.set(c.id,[p,...(uploaded.get(c.id)||[])]);added++;position.set(c.id,0);
        }catch(error){errors.push(file.name+': '+error.message)}
      }
    }finally{
      busy.delete(c.id);messages.set(c.id,[added?added+'장 업로드 완료':'',...errors].filter(Boolean).join(' · ')||'사진이 등록되지 않았습니다.');updateGalleryUI(c);
    }
  }
  async function deletePhoto(c,id){
    if(!isAdmin()||busy.has(c.id)||!uploaded.get(c.id)?.some(p=>p.id===id))return;
    if(!confirm(c.name+'의 선택한 등록 사진을 삭제하시겠습니까?'))return;
    busy.add(c.id);updateGalleryUI(c);
    try{
      await request('/api/mawang-gallery/'+c.id+'/'+id,{method:'DELETE'});
      uploaded.set(c.id,uploaded.get(c.id).filter(p=>p.id!==id));position.set(c.id,Math.max(0,photoIndex(c)));messages.set(c.id,'사진 삭제 완료');
    }catch(error){messages.set(c.id,error.message)}
    finally{busy.delete(c.id);updateGalleryUI(c)}
  }
  function render(){
    if(mounted)return;
    mounted=true;
    root.innerHTML=`<div class="ma-roster"><div class="ma-roster-toolbar"><div class="ma-roster-heading"><span class="ma-eyebrow">CHARACTER SELECT</span><h3>캐릭터 선택 <span class="ma-count"></span></h3></div>
      <div class="ma-filters" aria-label="캐릭터 분류"><button type="button" data-ma-filter="all">전체 ${entries.length}</button><button type="button" data-ma-filter="jeong">정 시리즈 ${entries.filter(c=>c.group==='jeong').length}</button><button type="button" data-ma-filter="classic">클래식 ${entries.filter(c=>c.group==='classic').length}</button></div>
      <label class="ma-search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/></svg><input type="search" aria-label="캐릭터 검색" placeholder="이름 또는 특징 검색"></label>
      <div class="ma-roster-scroll-controls"><button type="button" data-ma-roster-step="-1" aria-label="이전 캐릭터 목록">‹</button><button type="button" data-ma-roster-step="1" aria-label="다음 캐릭터 목록">›</button></div></div>
      <div class="ma-roster-grid" aria-label="캐릭터 목록"></div></div>
      <div class="ma-stage" aria-labelledby="maCharacterName"></div>
      <section class="ma-related" aria-label="공식 영상 자료"></section>
      <input class="ma-upload-input" type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" multiple hidden>
      <input class="ma-profile-input" type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" hidden>
      <footer class="ma-footer"><div><span class="ma-eyebrow">SOURCE INDEX</span><p>공개 자료 확인 기준 · 2026.11.22. 제작일과 첫 등장일이 불명확한 경우 미확인으로 표시합니다. PIKU의 팬 공개 이미지와 위키 자료는 2차 자료이며 공식 설정과 구분합니다. 이미지 표시가 불가능할 경우 원본 주소와 관련 영상으로 안내합니다.</p></div><div class="ma-channel-links">${link(channels.official,'마왕 공식 유튜브')}${link(channels.secondary,'마왕의 심연')}${link(channels.soop,'SOOP 방송국')}${link(db.wiki,'캐릭터 공개 기록')}${link(db.sona,'소나위키')}</div><span class="ma-announce" aria-live="polite"></span></footer>`;
    // Capture image errors once, including lazy roster images. Never substitute
    // another character's face for a missing source image.
    function imageFailed(event){
      const img=event.target;if(!(img instanceof HTMLImageElement))return;
      const url=img.dataset.maImage,wrap=img.closest('.ma-portrait');
      img.hidden=true;
      if(!url||!wrap)return;
      missing.add(url);wrap.classList.add('ma-image-missing');
      const caption=wrap.querySelector('.ma-image-caption');if(caption)caption.textContent='이미지를 불러올 수 없습니다';
    }
    root.addEventListener('error',imageFailed,true);
    root.addEventListener('load',e=>{if(e.target.dataset?.maImage&&(e.target.naturalWidth<2||e.target.naturalHeight<2))imageFailed(e)},true);
    root.addEventListener('click',e=>{
      const b=e.target.closest('button');if(!b)return;
      if(b.dataset.maCharacter)choose(entries.find(c=>c.id===b.dataset.maCharacter));
      else if(b.dataset.maFilter){filter=b.dataset.maFilter;updateFilter()}
      else if(b.dataset.maRosterStep){const grid=root.querySelector('.ma-roster-grid'),reduce=document.documentElement.dataset.mwsMotion==='reduced'||(document.documentElement.dataset.mwsMotion!=='full'&&matchMedia('(prefers-reduced-motion: reduce)').matches);grid.scrollBy({left:Number(b.dataset.maRosterStep)*grid.clientWidth*.85,behavior:reduce?'instant':'smooth'})}
      else if(b.dataset.maStep)stepPhoto(Number(b.dataset.maStep),true);
      else if(b.dataset.maPhoto!==undefined){position.set(selected.id,Number(b.dataset.maPhoto));gallery();root.querySelector('[data-ma-photo="'+b.dataset.maPhoto+'"]')?.focus({preventScroll:true})}
      else if(b.hasAttribute('data-ma-upload')&&isAdmin()&&galleryReady){uploadTarget=selected;root.querySelector('.ma-upload-input').click()}
      else if(b.hasAttribute('data-ma-profile-upload')&&isAdmin()&&galleryReady){uploadTarget=selected;root.querySelector('.ma-profile-input').click()}
      else if(b.hasAttribute('data-ma-profile-reset'))void changeProfile(selected,null,true);
      else if(b.dataset.maDelete)void deletePhoto(selected,b.dataset.maDelete);
    });
    root.addEventListener('change',e=>{if(e.target.matches('.ma-upload-input,.ma-profile-input')){const c=uploadTarget,files=[...e.target.files],isProfile=e.target.matches('.ma-profile-input');e.target.value='';uploadTarget=null;if(c&&files.length){if(isProfile)void changeProfile(c,files[0]);else void uploadFiles(c,files)}}});
    root.addEventListener('wheel',e=>{
      if(!e.target.closest('.ma-gallery-frame')||photos(selected).length<2||e.ctrlKey)return;
      e.preventDefault();
      const now=performance.now();if(now-lastWheel<210)return;
      const delta=Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY;
      wheelSum+=delta*(e.deltaMode===1?16:e.deltaMode===2?400:1);
      if(Math.abs(wheelSum)>=35){lastWheel=now;stepPhoto(Math.sign(wheelSum));wheelSum=0}
    },{passive:false});
    root.addEventListener('pointerdown',e=>{
      const frame=e.target.closest('.ma-gallery-frame');
      if(!frame||photos(selected).length<2||e.button!==0||!e.isPrimary)return;
      drag={id:e.pointerId,x:e.clientX,y:e.clientY,frame,character:selected.id,type:e.pointerType};
      try{frame.setPointerCapture(e.pointerId)}catch(_){}
    });
    root.addEventListener('pointerup',e=>{
      if(!drag||drag.id!==e.pointerId)return;
      const d=drag;drag=null;if(d.character!==selected.id||!d.frame.isConnected)return;
      const dx=e.clientX-d.x,dy=e.clientY-d.y;
      if(Math.abs(dx)>30&&Math.abs(dx)>Math.abs(dy))stepPhoto(dx<0?1:-1);
      else if(d.type==='mouse'&&Math.abs(dx)<8&&Math.abs(dy)<8){const rect=d.frame.getBoundingClientRect();stepPhoto(e.clientX-rect.left>=rect.width/2?1:-1)}
    });
    root.addEventListener('pointercancel',()=>{drag=null});
    root.addEventListener('input',e=>{if(e.target.matches('.ma-search input')){query=e.target.value;updateFilter()}});
    root.addEventListener('keydown',e=>{
      if(e.target.closest('.ma-gallery-frame')&&['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();stepPhoto(e.key==='ArrowRight'?1:-1);return}
      const b=e.target.closest('[data-ma-character]');if(!b||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(e.key))return;
      const list=matching(),i=list.findIndex(c=>c.id===b.dataset.maCharacter);
      const next=e.key==='Home'?0:e.key==='End'?list.length-1:i+({ArrowLeft:-1,ArrowRight:1,ArrowUp:-1,ArrowDown:1}[e.key]||0);
      e.preventDefault();choose(list[Math.min(list.length-1,Math.max(0,next))],true);
    });
    roster();stage();void loadGallery();
  }
  window.mwsMawangArchiveV1={render};
  if(root.closest('.section')?.classList.contains('active'))render();
})();
