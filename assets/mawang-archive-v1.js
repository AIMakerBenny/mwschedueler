(()=>{
  'use strict';
  const db=window.mwsMawangArchiveDataV1,root=document.getElementById('mwsArchiveRoot');
  if(!db||!root)return;
  const {entries}=db;
  let columnCapacity=14,activeColumns=14,headerFilters=null;
  const escape=value=>String(value??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
  const groups={all:'전체',jeong:'정 시리즈',classic:'클래식',mascot:'마스코트'};
  const groupName=c=>groups[c.group];
  const number=c=>String(c.number).padStart(2,'0');
  const missing=new Set(),profiles=new Map(),busy=new Set(),messages=new Map();
  const validTypes=new Set(['image/jpeg','image/png','image/webp','image/gif','image/avif']);
  const isAdmin=()=>document.body.dataset.mwsMode==='admin'&&window.__mwsAppReadyV130===true;
  const icons={check:'m5 12 4 4L19 6',image:'M4 4h16v16H4z M4 16l5-5 4 4 3-3 4 4 M15 8h.01',reset:'M4 11a8 8 0 1 1 2 6 M4 4v7h7',calendar:'M4 6h16v15H4z M8 3v6 M16 3v6 M4 11h16',layers:'m12 3 9 5-9 5-9-5 9-5 M3 12l9 5 9-5 M3 16l9 5 9-5',close:'m6 6 12 12 M18 6 6 18'};
  const icon=name=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${icons[name]}"/></svg>`;
  let selected=entries[0],filter='all',query='',page=0,mounted=false,profileError='',profileReady=false,uploadTarget=null;
  const normalize=s=>s.toLocaleLowerCase('ko').replace(/[\s-]+/g,'');
  const matching=()=>entries.filter(c=>(filter==='all'||filter===c.group)&&normalize([c.name,c.english,c.tagline,...c.tags].join(' ')).includes(normalize(query)));
  // Category cards stay grouped; arrows follow one continuous archive when not searching.
  const navigation=()=>normalize(query)?matching():entries;
  const rosterPages=(list=matching())=>['jeong','classic','mascot'].map(group=>list.filter(c=>c.group===group)).filter(items=>items.length);
  const profilePhoto=c=>profiles.get(c.id)||(c.image?.startsWith('/assets/mawang-archive-portraits/')?{url:c.image}:null);
  function pic(c,hero=false){
    const p=profilePhoto(c),failed=!p||missing.has(p.url);
    return `<div class="ma-portrait${failed?' ma-image-missing':''}" style="--ma-color:${c.color}"><div class="ma-monogram" aria-hidden="true"><span>${escape(c.name.slice(0,1))}</span>${hero?`<small>${p?'사진 불러오기 실패':'프로필 사진 미등록'}</small>`:''}</div>${!failed?`<img class="ma-character-image" data-ma-image="${escape(p.url)}" src="${escape(p.url)}" alt="${escape(c.name)} 프로필 사진" loading="${hero?'eager':'lazy'}" decoding="async" draggable="false">`:''}</div>`;
  }
  function roster(direction=0){
    const list=matching(),sections=rosterPages(list),pages=Math.max(1,sections.length);page=Math.min(page,pages-1);
    const visible=sections[page]||[],grid=root.querySelector('.ma-roster-grid');
    // Keep the same card slot width across every category, including the single mascot.
    const referenceCount=Math.max(...rosterPages(entries).map(items=>items.length));
    activeColumns=Math.max(1,Math.ceil(referenceCount/Math.ceil(referenceCount/columnCapacity)));
    root.querySelector('.ma-count').textContent=list.length+' / '+entries.length;
    grid.dataset.motion=direction?'slide':'none';grid.style.setProperty('--ma-enter-x',direction<0?'-10px':'10px');
    grid.innerHTML=visible.length?visible.map((c,i)=>`<button type="button" class="ma-character-card${c.id===selected.id?' is-selected':''}" data-ma-character="${c.id}" aria-pressed="${c.id===selected.id}" title="${escape(c.name)}" style="--ma-color:${c.color};--ma-delay:${Math.min(i,7)*13}ms">${pic(c)}${c.id==='kkomwang'?'<span class="ma-new-badge">NEW</span>':''}<span class="ma-selection-mark">${icon('check')}</span><span class="ma-roster-label"><strong>${escape(c.name)}</strong></span></button>`).join(''):'<div class="ma-no-results">검색 결과가 없습니다.<button type="button" data-ma-clear>검색 초기화</button></div>';
    [...root.querySelectorAll('[data-ma-filter]'),...(headerFilters?.querySelectorAll('[data-ma-filter]')||[])].forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.maFilter===filter)));
    const paging=root.querySelector('.ma-pagination');
    paging.textContent=(page+1)+' / '+pages+' 페이지'+(visible.length?' · '+groupName(visible[0]):'');
    const canBrowse=pages>1||(!normalize(query)&&filter!=='all'&&rosterPages(entries).length>1);
    root.querySelector('[data-ma-step="-1"]').disabled=!canBrowse;
    root.querySelector('[data-ma-step="1"]').disabled=!canBrowse;
    grid.style.setProperty('--ma-columns',activeColumns);
    // A one-card mascot page follows the same thumbnail-height tier as 13-14 card pages.
    grid.dataset.rows=String(Math.ceil(referenceCount/activeColumns));
    grid.dataset.pageSize=String(visible.length);
    root.querySelector('.ma-search-clear').hidden=!query;
  }
  function fitRoster(){
    const grid=root.querySelector('.ma-roster-grid'),width=grid?.clientWidth||0;
    if(!width)return;
    const compact=root.clientWidth<600,newCapacity=Math.min(compact?4:14,Math.max(2,Math.floor((width+8)/(compact?66:86))));
    if(newCapacity===columnCapacity)return;
    columnCapacity=newCapacity;
    roster();
  }
  function fitLayout(){
    if(!root.clientWidth)return;
    fitRoster();
    const node=root.querySelector('.ma-stage');
    const top=node.getBoundingClientRect().top+window.scrollY;
    const space=Math.max(240,Math.floor(window.innerHeight-top-20));
    node.style.setProperty('--ma-profile-space',space+'px');
  }
  function profilePanel(refreshPhoto=true){
    const c=selected,custom=profiles.has(c.id),p=profilePhoto(c),panel=root.querySelector('.ma-profile-panel');
    if(!panel||root.querySelector('.ma-stage').hidden)return;
    const admin=isAdmin(),disabled=busy.has(c.id)||!profileReady?'disabled':'';
    panel.innerHTML=`<div class="ma-profile-copy"><span class="ma-eyebrow"><i></i>${escape(groupName(c))}<span class="ma-profile-number">NO. ${number(c)}</span></span><h2 id="maCharacterName">${escape(c.name)}</h2><p class="ma-english">${escape(c.english)}</p>${admin?`<span class="ma-profile-label">${custom?'등록된 프로필 사진':p?'기본 프로필 사진':'프로필 사진 미등록'}</span>`:''}</div>${admin?`<div class="ma-profile-actions"><button type="button" data-ma-profile-upload ${disabled}>${icon('image')}${custom?'사진 변경':'사진 등록'}</button>${custom?`<button type="button" data-ma-profile-reset ${disabled} title="프로필 사진 초기화" aria-label="프로필 사진 초기화">${icon('reset')}</button>`:''}</div>`:''}`;
    root.querySelector('.ma-profile-message').textContent=admin?(messages.get(c.id)||profileError||''):'';
    if(refreshPhoto){root.querySelector('.ma-main-profile').innerHTML=pic(c,true);root.querySelector('.ma-announce').textContent=c.name+' 선택';}
  }
  function syncAdmin(){
    const slot=root.querySelector('.ma-admin-input-slot');
    if(isAdmin()){if(!slot.querySelector?.('input'))slot.innerHTML='<input class="ma-profile-input" type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" hidden>';}
    else{uploadTarget=null;slot.innerHTML='';}
    profilePanel(false);
  }
  function stage(direction=0){
    const c=selected,node=root.querySelector('.ma-stage');node.style.setProperty('--ma-color',c.color);node.dataset.group=c.group;
    const visibleList=matching(),nav=navigation(),index=visibleList.indexOf(c),navIndex=nav.indexOf(c);
    node.hidden=index<0;if(index<0){node.innerHTML='';return;}
    node.style.setProperty('--ma-enter-x',direction<0?'-12px':direction>0?'12px':'0px');
    const dateFact=c.date&&c.dateLabel?`<div><span class="ma-fact-icon">${icon('calendar')}</span><div><dt>${escape(c.dateLabel)}</dt><dd>${escape(c.date.replaceAll('-','.'))}</dd></div></div>`:'';
    const arrow=step=>{const target=nav.length>1?nav[(navIndex+step+nav.length)%nav.length]:null,label=(step<0?'이전':'다음')+' 캐릭터'+(target?' · '+target.name:'');return `<button type="button" class="ma-hero-arrow" data-ma-hero-step="${step}" aria-label="${escape(label)}" ${target?'':'disabled'}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${step<0?'m15 5-7 7 7 7':'m9 5 7 7-7 7'}"/></svg>${target?`<span class="ma-hero-tip">${escape(target.name)}</span>`:''}</button>`};
    node.innerHTML=`<div class="ma-stage-art"><div class="ma-main-profile" aria-label="${escape(c.name)} 대표 프로필"></div>${arrow(-1)}${arrow(1)}<span class="ma-hero-count"><span>${String(navIndex+1).padStart(2,'0')}</span> / ${String(nav.length).padStart(2,'0')}</span></div><div class="ma-stage-info"><div class="ma-profile-panel"></div>${c.tagline?`<h3>${escape(c.tagline)}</h3>`:''}${c.description?`<p class="ma-desc">${escape(c.description)}</p>`:''}<div class="ma-tags">${c.tags.map(t=>`<span>${escape(t)}</span>`).join('')}</div><dl class="ma-facts">${dateFact}<div><span class="ma-fact-icon">${icon('layers')}</span><div><dt>분류</dt><dd>${escape(groupName(c))}</dd></div></div></dl>${c.details?.length?`<div class="ma-character-details"><h3>캐릭터 정보</h3>${c.details.map(([label,value])=>`<div><h4>${escape(label)}</h4><p>${escape(value)}</p></div>`).join('')}</div>`:''}<p class="ma-profile-message" role="status"></p></div>`;
    profilePanel();
  }
  function stepCharacter(step){
    const list=navigation(),i=list.indexOf(selected);
    if(list.length<2||i<0)return;
    choose(list[(i+step+list.length)%list.length],false,step);
    root.querySelector('[data-ma-hero-step="'+step+'"]')?.focus({preventScroll:true});
  }
  function choose(c,focus=false,direction=0){
    if(!c)return;const list=navigation(),old=list.indexOf(selected);if(c===selected){if(focus)root.querySelector('[data-ma-character="'+c.id+'"]')?.focus({preventScroll:true});return;}
    const outsideFilter=filter!=='all'&&!normalize(query)&&c.group!==filter;
    if(outsideFilter)filter='all';
    selected=c;
    const move=direction||Math.sign(list.indexOf(c)-old);
    const nextPage=rosterPages().findIndex(items=>items.includes(c));
    if(nextPage>=0&&(nextPage!==page||outsideFilter)){page=nextPage;roster(move)}else root.querySelectorAll('[data-ma-character]').forEach(b=>{const active=b.dataset.maCharacter===c.id;b.classList.toggle('is-selected',active);b.setAttribute('aria-pressed',String(active))});
    stage(move);if(focus)root.querySelector('[data-ma-character="'+c.id+'"]')?.focus({preventScroll:true});
  }
  function updateFilter(animate=false){const first=rosterPages()[0]||[];page=0;if(first.length&&!first.includes(selected))selected=first[0];roster(animate?1:0);stage(animate?1:0)}
  function changePage(next){
    let sections=rosterPages(),old=page;const move=Math.sign(next-old);if(!move)return;
    if(filter!=='all'&&!normalize(query)){
      const currentGroup=sections[old]?.[0]?.group||selected.group;
      sections=rosterPages(entries);const from=sections.findIndex(items=>items[0]?.group===currentGroup);
      filter='all';page=((from+move)%sections.length+sections.length)%sections.length;
    }else{
      if(sections.length<2)return;
      page=((next%sections.length)+sections.length)%sections.length;
    }
    const visible=sections[page]||[];
    if(visible.length&&!visible.includes(selected))selected=visible[0];
    roster(move);stage(move);
  }
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
    root.innerHTML=`<div class="ma-roster"><div class="ma-roster-toolbar"><div class="ma-roster-heading"><h3>캐릭터 선택 <span class="ma-count"></span></h3></div><div class="ma-filters" aria-label="캐릭터 분류">${Object.entries(groups).map(([key,name])=>`<button type="button" data-ma-filter="${key}"><span>${name}</span><span class="ma-filter-count">${key==='all'?entries.length:entries.filter(c=>c.group===key).length}</span></button>`).join('')}</div><div class="ma-search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/></svg><input type="search" aria-label="캐릭터 검색" placeholder="캐릭터 검색"><button class="ma-search-clear" type="button" data-ma-clear aria-label="검색 초기화" hidden>${icon('close')}</button></div><div class="ma-pagination" aria-live="polite" aria-label="캐릭터 목록 페이지"></div></div><div class="ma-roster-row"><button type="button" class="ma-page-arrow" data-ma-step="-1" aria-label="이전 캐릭터 페이지"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="m15 5-7 7 7 7"/></svg><span>이전</span></button><div class="ma-roster-grid" aria-label="캐릭터 목록"></div><button type="button" class="ma-page-arrow" data-ma-step="1" aria-label="다음 캐릭터 페이지"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg><span>다음</span></button></div></div><div class="ma-stage" aria-labelledby="maCharacterName"></div><div class="ma-admin-input-slot"></div><span class="ma-announce" aria-live="polite"></span>`;
    // The header uses the same category controls without duplicating the archive state.
    if(typeof document.createElement==='function'){
      const wiki=document.getElementById('mwsArchiveWikiLink');
      if(wiki?.parentElement){
        headerFilters=document.createElement('nav');
        headerFilters.className='ma-header-filters';
        headerFilters.setAttribute('aria-label','캐릭터 분류');
        headerFilters.innerHTML=root.querySelector('.ma-filters').innerHTML;
        wiki.insertAdjacentElement('afterend',headerFilters);
        const archiveSection=root.closest('.section');
        const reflectVisible=()=>{headerFilters.hidden=!archiveSection?.classList.contains('active')};
        reflectVisible();
        if(archiveSection&&typeof MutationObserver==='function'){
          new MutationObserver(reflectVisible).observe(archiveSection,{attributes:true,attributeFilter:['class']});
        }
        headerFilters.addEventListener('click',event=>{
          const button=event.target.closest('button[data-ma-filter]');
          if(button)root.querySelector('.ma-filters [data-ma-filter="'+button.dataset.maFilter+'"]')?.click();
        });
      }
    }
    function imageFailed(event){const img=event.target;if(!(img instanceof HTMLImageElement))return;const url=img.dataset.maImage,wrap=img.closest('.ma-portrait');img.hidden=true;if(!url||!wrap)return;missing.add(url);wrap.classList.add('ma-image-missing');const note=wrap.querySelector('.ma-monogram small');if(note)note.textContent='사진 불러오기 실패'}
    root.addEventListener('error',imageFailed,true);
    root.addEventListener('load',e=>{if(e.target.dataset?.maImage&&(e.target.naturalWidth<2||e.target.naturalHeight<2))imageFailed(e)},true);
    root.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;if(b.dataset.maCharacter)choose(entries.find(c=>c.id===b.dataset.maCharacter));else if(b.dataset.maHeroStep!==undefined)stepCharacter(Number(b.dataset.maHeroStep));else if(b.dataset.maFilter){if(filter!==b.dataset.maFilter){filter=b.dataset.maFilter;updateFilter(true)}}else if(b.dataset.maStep!==undefined){changePage(page+Number(b.dataset.maStep));if(b.disabled)root.querySelector('[data-ma-step="'+(-Number(b.dataset.maStep))+'"]')?.focus({preventScroll:true})}else if(b.dataset.maClear!==undefined){query='';root.querySelector('.ma-search input').value='';updateFilter();root.querySelector('.ma-search input').focus()}else if(b.hasAttribute('data-ma-profile-upload')&&isAdmin()&&profileReady){uploadTarget=selected;root.querySelector('.ma-profile-input')?.click()}else if(b.hasAttribute('data-ma-profile-reset'))void changeProfile(selected,null,true)});
    root.addEventListener('change',e=>{if(e.target.matches('.ma-profile-input')){const c=uploadTarget,file=e.target.files[0];e.target.value='';uploadTarget=null;if(c&&file)void changeProfile(c,file)}});
    root.addEventListener('input',e=>{if(e.target.matches('.ma-search input')){query=e.target.value;updateFilter()}});
    root.addEventListener('keydown',e=>{const b=e.target.closest('[data-ma-character]');if(!b||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(e.key))return;const list=navigation(),i=list.findIndex(c=>c.id===b.dataset.maCharacter),delta=({ArrowLeft:-1,ArrowRight:1,ArrowUp:-activeColumns,ArrowDown:activeColumns}[e.key]||0),next=e.key==='Home'?0:e.key==='End'?list.length-1:['ArrowLeft','ArrowRight'].includes(e.key)?(i+delta+list.length)%list.length:Math.min(list.length-1,Math.max(0,i+delta));e.preventDefault();choose(list[next],true)});
    let swipe=null;
    root.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'&&e.target.closest('.ma-stage-art')&&!e.target.closest('button'))swipe={id:e.pointerId,x:e.clientX,y:e.clientY};});
    root.addEventListener('pointerup',e=>{if(!swipe||swipe.id!==e.pointerId)return;const dx=e.clientX-swipe.x,dy=e.clientY-swipe.y;swipe=null;if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.5)stepCharacter(dx<0?1:-1);});
    root.addEventListener('pointercancel',()=>{swipe=null});
    roster();stage();syncAdmin();fitLayout();if(typeof ResizeObserver==='function'){const observer=new ResizeObserver(fitLayout);observer.observe(root);observer.observe(root.querySelector('.ma-roster'))}if(typeof MutationObserver==='function')new MutationObserver(syncAdmin).observe(document.body,{attributes:true,attributeFilter:['data-mws-mode']});window.addEventListener('mws:app-ready',syncAdmin);window.addEventListener('resize',fitLayout,{passive:true});void loadProfiles();
  }
  window.mwsMawangArchiveV1={render};if(root.closest('.section')?.classList.contains('active'))render();
})();
