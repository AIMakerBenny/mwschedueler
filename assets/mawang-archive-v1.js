(()=>{
  'use strict';
  const db=window.mwsMawangArchiveDataV1,root=document.getElementById('mwsArchiveRoot');
  if(!db||!root)return;
  const {entries}=db;
  let pageSize=14,columns=14;
  const escape=value=>String(value??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
  const groups={all:'전체',jeong:'정 시리즈',classic:'클래식',other:'기타'};
  const groupName=c=>groups[c.group]||groups.other;
  const number=c=>String(c.number).padStart(2,'0');
  const missing=new Set(),profiles=new Map(),busy=new Set(),messages=new Map();
  const validTypes=new Set(['image/jpeg','image/png','image/webp','image/gif','image/avif']);
  const isAdmin=()=>document.body.dataset.mwsMode==='admin';
  let selected=entries[0],filter='all',query='',page=0,mounted=false,profileError='',profileReady=false,uploadTarget=null;
  const normalize=s=>s.toLocaleLowerCase('ko').replace(/[\s-]+/g,'');
  const matching=()=>entries.filter(c=>(filter==='all'||filter===c.group)&&normalize([c.name,c.english,c.tagline,...c.tags].join(' ')).includes(normalize(query)));
  const profilePhoto=c=>profiles.get(c.id)||(c.imageSource.startsWith('PIKU')?{url:c.image}:null);
  function pic(c,hero=false){
    const p=profilePhoto(c),failed=!p||missing.has(p.url);
    return `<div class="ma-portrait${failed?' ma-image-missing':''}" style="--ma-color:${c.color}"><div class="ma-monogram" aria-hidden="true"><span>${escape(c.name.slice(0,1))}</span>${hero?`<small>${p?'사진 불러오기 실패':'프로필 사진 미등록'}</small>`:''}</div>${!failed?`<img class="ma-character-image" data-ma-image="${escape(p.url)}" src="${escape(p.url)}" alt="${escape(c.name)} 프로필 사진" loading="${hero?'eager':'lazy'}" decoding="async" draggable="false">`:''}</div>`;
  }
  function roster(){
    const list=matching(),pages=Math.max(1,Math.ceil(list.length/pageSize));page=Math.min(page,pages-1);
    const visible=list.slice(page*pageSize,(page+1)*pageSize),grid=root.querySelector('.ma-roster-grid');
    root.querySelector('.ma-count').textContent=list.length+' / '+entries.length;
    grid.innerHTML=visible.length?visible.map(c=>`<button type="button" class="ma-character-card${c.id===selected.id?' is-selected':''}" data-ma-character="${c.id}" aria-pressed="${c.id===selected.id}" style="--ma-color:${c.color}">${pic(c)}<span class="ma-roster-label"><strong>${escape(c.name)}</strong></span></button>`).join(''):'<p class="ma-no-results">검색 결과가 없습니다.</p>';
    root.querySelectorAll('[data-ma-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.maFilter===filter)));
    const paging=root.querySelector('.ma-pagination');
    paging.textContent=(page+1)+' / '+pages+' 페이지';
    root.querySelector('[data-ma-step="-1"]').disabled=page===0;
    root.querySelector('[data-ma-step="1"]').disabled=page>=pages-1;
    grid.style.setProperty('--ma-columns',columns);
    grid.dataset.pageSize=String(pageSize);
  }
  function fitRoster(){
    const grid=root.querySelector('.ma-roster-grid'),width=grid?.clientWidth||0;
    if(!width)return;
    const compact=root.clientWidth<600,newColumns=Math.min(compact?4:14,Math.max(2,Math.floor((width+8)/(compact?74:96))));
    const size=newColumns*(compact?2:1);
    if(size===pageSize&&newColumns===columns)return;
    columns=newColumns;pageSize=size;
    const i=matching().indexOf(selected);
    page=i>=0?Math.floor(i/pageSize):0;
    roster();
  }
  function profilePanel(){
    const c=selected,custom=profiles.has(c.id),p=profilePhoto(c),panel=root.querySelector('.ma-profile-panel');
    panel.innerHTML=`<div class="ma-profile-copy"><span class="ma-eyebrow">${escape(groupName(c))} / ${number(c)}</span><h2 id="maCharacterName">${escape(c.name)}</h2><p class="ma-english">${escape(c.english)}</p><span class="ma-profile-label">${custom?'등록된 프로필 사진':p?'기본 프로필 사진':'프로필 사진 미등록'}</span></div><div class="ma-profile-actions"><button type="button" data-ma-profile-upload ${busy.has(c.id)||!profileReady?'disabled':''}>${custom?'프로필 사진 변경':'프로필 사진 등록'}</button>${custom?`<button type="button" data-ma-profile-reset ${busy.has(c.id)||!profileReady?'disabled':''}>프로필 초기화</button>`:''}</div>`;
    root.querySelector('.ma-profile-message').textContent=messages.get(c.id)||profileError||'';
    root.querySelector('.ma-main-profile').innerHTML=pic(c,true);
    root.querySelector('.ma-announce').textContent=c.name+' 선택';
  }
  function stage(){
    const c=selected,node=root.querySelector('.ma-stage');node.style.setProperty('--ma-color',c.color);
    node.innerHTML=`<div class="ma-stage-art"><div class="ma-main-profile" aria-label="${escape(c.name)} 대표 프로필"></div></div><div class="ma-stage-info"><div class="ma-profile-panel"></div><h3>${escape(c.tagline)}</h3><p class="ma-desc">${escape(c.description)}</p><div class="ma-tags">${c.tags.map(t=>`<span>${escape(t)}</span>`).join('')}</div><dl class="ma-facts"><div><dt>${escape(c.dateLabel)}</dt><dd>${c.date?escape(c.date.replaceAll('-','.')):'미확인'}</dd></div><div><dt>분류</dt><dd>${escape(groupName(c))}</dd></div></dl><div class="ma-character-details"><h3>캐릭터 정보</h3>${(c.details||[]).map(([label,value])=>`<div><h4>${escape(label)}</h4><p>${escape(value)}</p></div>`).join('')}</div><p class="ma-profile-message" role="status"></p></div>`;
    profilePanel();
  }
  function choose(c,focus=false){
    if(!c)return;selected=c;
    const i=matching().indexOf(c),nextPage=Math.floor(i/pageSize);
    if(i>=0&&nextPage!==page){page=nextPage;roster()}else root.querySelectorAll('[data-ma-character]').forEach(b=>{const active=b.dataset.maCharacter===c.id;b.classList.toggle('is-selected',active);b.setAttribute('aria-pressed',String(active))});
    stage();if(focus)root.querySelector('[data-ma-character="'+c.id+'"]')?.focus({preventScroll:true});
  }
  function updateFilter(){const list=matching();page=0;if(list.length&&!list.slice(0,pageSize).includes(selected))selected=list[0];roster();stage()}
  function changePage(next){const list=matching();page=Math.max(0,Math.min(next,Math.ceil(list.length/pageSize)-1));if(!list.slice(page*pageSize,(page+1)*pageSize).includes(selected)&&list[page*pageSize])selected=list[page*pageSize];roster();stage();}
  function normalizeProfile(p){
    if(!entries.some(c=>c.id===p?.character)||!/^\d{1,15}-[a-f0-9]{0,80}$/i.test(p?.revision||''))return null;
    return {character:p.character,url:'/media/mawang-profile/'+p.character+'?rev='+p.revision};
  }
  async function request(url,options={}){
    const response=await fetch(url,{credentials:'same-origin',cache:'no-store',...options}),body=await response.json().catch(()=>null);
    if(!response.ok||!body)throw Error(body?.error||'사진 서버 연결 실패');return body;
  }
  async function loadProfiles(){
    try{const body=await request('/api/mawang-profile');if(!Array.isArray(body.profiles))throw Error('프로필 목록을 불러올 수 없습니다.');profiles.clear();for(const raw of body.profiles){const p=normalizeProfile(raw);if(p)profiles.set(p.character,p)}profileError='';profileReady=true;roster();profilePanel()}
    catch(error){profileError='등록 프로필을 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.';profilePanel()}
  }
  function updateProfileUI(c){roster();if(c===selected)profilePanel()}
  async function changeProfile(c,file,reset=false){
    if(!isAdmin()||!profileReady||busy.has(c.id))return;
    if(reset&&!confirm(c.name+'의 프로필 사진을 기본 상태로 되돌리시겠습니까?'))return;
    if(!reset&&(!file||!validTypes.has(file.type)||!file.size||file.size>32*1024*1024)){messages.set(c.id,'프로필 사진 형식 또는 32MB 용량 제한');updateProfileUI(c);return}
    busy.add(c.id);messages.set(c.id,'프로필 사진 저장 중…');updateProfileUI(c);
    try{const body=await request('/api/mawang-profile/'+c.id,reset?{method:'DELETE'}:{method:'PUT',headers:{'content-type':file.type},body:file});if(reset)profiles.delete(c.id);else{const p=normalizeProfile(body.profile);if(!p||p.character!==c.id)throw Error('프로필 저장 응답 오류');profiles.set(c.id,p)}messages.set(c.id,reset?'프로필 초기화 완료':'프로필 사진 저장 완료')}
    catch(error){messages.set(c.id,error.message)}finally{busy.delete(c.id);updateProfileUI(c)}
  }
  function render(){
    if(mounted)return;mounted=true;
    root.innerHTML=`<div class="ma-roster"><div class="ma-roster-toolbar"><div class="ma-roster-heading"><h3>캐릭터 선택 <span class="ma-count"></span></h3></div><div class="ma-filters" aria-label="캐릭터 분류">${Object.entries(groups).map(([key,name])=>`<button type="button" data-ma-filter="${key}">${name} ${key==='all'?entries.length:entries.filter(c=>c.group===key).length}</button>`).join('')}</div><label class="ma-search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/></svg><input type="search" aria-label="캐릭터 검색" placeholder="캐릭터 검색"></label><div class="ma-pagination" aria-live="polite" aria-label="캐릭터 목록 페이지"></div></div><div class="ma-roster-row"><button type="button" class="ma-page-arrow" data-ma-step="-1" aria-label="이전 캐릭터 페이지"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="m15 5-7 7 7 7"/></svg><span>이전</span></button><div class="ma-roster-grid" aria-label="캐릭터 목록"></div><button type="button" class="ma-page-arrow" data-ma-step="1" aria-label="다음 캐릭터 페이지"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg><span>다음</span></button></div></div><div class="ma-stage" aria-labelledby="maCharacterName"></div><input class="ma-profile-input" type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" hidden><span class="ma-announce" aria-live="polite"></span>`;
    function imageFailed(event){const img=event.target;if(!(img instanceof HTMLImageElement))return;const url=img.dataset.maImage,wrap=img.closest('.ma-portrait');img.hidden=true;if(!url||!wrap)return;missing.add(url);wrap.classList.add('ma-image-missing');const note=wrap.querySelector('.ma-monogram small');if(note)note.textContent='사진 불러오기 실패'}
    root.addEventListener('error',imageFailed,true);
    root.addEventListener('load',e=>{if(e.target.dataset?.maImage&&(e.target.naturalWidth<2||e.target.naturalHeight<2))imageFailed(e)},true);
    root.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.maCharacter)choose(entries.find(c=>c.id===b.dataset.maCharacter));else if(b.dataset.maFilter){filter=b.dataset.maFilter;updateFilter()}else if(b.dataset.maStep!==undefined){changePage(page+Number(b.dataset.maStep));if(b.disabled)root.querySelector('[data-ma-step="'+(-Number(b.dataset.maStep))+'"]')?.focus({preventScroll:true})}else if(b.hasAttribute('data-ma-profile-upload')&&isAdmin()&&profileReady){uploadTarget=selected;root.querySelector('.ma-profile-input').click()}else if(b.hasAttribute('data-ma-profile-reset'))void changeProfile(selected,null,true)});
    root.addEventListener('change',e=>{if(e.target.matches('.ma-profile-input')){const c=uploadTarget,file=e.target.files[0];e.target.value='';uploadTarget=null;if(c&&file)void changeProfile(c,file)}});
    root.addEventListener('input',e=>{if(e.target.matches('.ma-search input')){query=e.target.value;updateFilter()}});
    root.addEventListener('keydown',e=>{const b=e.target.closest('[data-ma-character]');if(!b||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(e.key))return;const list=matching(),i=list.findIndex(c=>c.id===b.dataset.maCharacter),next=e.key==='Home'?0:e.key==='End'?list.length-1:i+({ArrowLeft:-1,ArrowRight:1,ArrowUp:-1,ArrowDown:1}[e.key]||0);e.preventDefault();choose(list[Math.min(list.length-1,Math.max(0,next))],true)});
    roster();fitRoster();stage();if(typeof ResizeObserver==='function'){const observer=new ResizeObserver(fitRoster);observer.observe(root)}void loadProfiles();
  }
  window.mwsMawangArchiveV1={render};if(root.closest('.section')?.classList.contains('active'))render();
})();
