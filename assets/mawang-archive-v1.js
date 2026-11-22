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
  const missing=new Set(),loaded=new Set();
  let selected=entries[0],filter='all',query='',mounted=false;
  const normalize=s=>s.toLocaleLowerCase('ko').replace(/[\s-]+/g,'');
  const matching=()=>entries.filter(c=>(filter==='all'||filter===c.group)&&normalize([c.name,c.english,c.tagline,...c.tags].join(' ')).includes(normalize(query)));
  function pic(c,hero=false){
    const fallback=hero&&c.media.length&&c.id!=='yoo'?videos[c.media[0]]:null;
    const failed=missing.has(c.image),showVideo=failed&&fallback;
    return `<div class="ma-portrait${failed?' ma-image-missing':''}${showVideo?' ma-video-fallback':''}" style="--ma-color:${c.color}">
      <div class="ma-monogram" aria-hidden="true"><span>${escape(c.name.slice(0,1))}</span><i>MW / ${number(c)}</i></div>
      ${!failed?`<img class="ma-character-image" data-ma-image="${escape(c.image)}" src="${escape(c.image)}" alt="${escape(c.name)} 캐릭터 자료 이미지" loading="${hero?'eager':'lazy'}" decoding="async" referrerpolicy="no-referrer">`:''}
      ${showVideo?`<img class="ma-video-image" src="${thumb(fallback.id)}" alt="${escape(fallback.title)} 영상 썸네일" loading="eager" decoding="async">`:''}
      ${hero?`<span class="ma-image-caption">${showVideo?'대표 영상 썸네일':failed?'이미지 원본 연결 불가':escape(c.imageSource)}</span>`:''}
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
  }
  function stage(){
    const c=selected,list=matching(),index=list.findIndex(x=>x.id===c.id);
    const node=root.querySelector('.ma-stage');
    node.style.setProperty('--ma-color',c.color);
    node.innerHTML=`<div class="ma-stage-art">
       <div class="ma-stage-index"><span>AVATAR / ${number(c)}</span><span class="ma-stage-group">${groupName(c)}</span></div>
       <div class="ma-stage-ring" aria-hidden="true"></div><div class="ma-stage-word" aria-hidden="true">${escape(c.english.split(' ')[0])}</div>
       ${pic(c,true)}
       <div class="ma-stage-nav"><button type="button" data-ma-step="-1" aria-label="이전 캐릭터" ${list.length<2?'disabled':''}>‹</button><span>${index>=0?index+1:0} <i>/</i> ${list.length}</span><button type="button" data-ma-step="1" aria-label="다음 캐릭터" ${list.length<2?'disabled':''}>›</button></div>
     </div><div class="ma-stage-info">
       <div class="ma-stage-kicker"><span class="ma-eyebrow">CHARACTER FILE / ${number(c)}</span><span class="ma-status">${c.id==='yoo'?'대표 아바타 기록':c.id==='ye-new'?'리메이크':'아바타 기록'}</span></div>
       <h2 id="maCharacterName">${escape(c.name)}</h2><p class="ma-english">${escape(c.english)}</p>
       <h3>${escape(c.tagline)}</h3><p class="ma-desc">${escape(c.description)}</p>
       <div class="ma-tags">${c.tags.map(t=>`<span>${escape(t)}</span>`).join('')}</div>
       <dl class="ma-facts"><div><dt>${escape(c.dateLabel)}</dt><dd>${c.date?escape(c.date.replaceAll('-','.')):'미확인'}</dd></div><div><dt>구분</dt><dd>${groupName(c)}</dd></div><div><dt>정보 근거</dt><dd>공개 기록 <small>2차 자료</small></dd></div></dl>
       <div class="ma-source-links">${c.sources.map(s=>link(s.url,s.label)).join('')}${link(c.imageOriginal,'이미지 원본 주소')}</div>
     </div>`;
    const related=root.querySelector('.ma-related');
    const keys=c.media.length?c.media:c.group==='classic'?['intro']:['profile'];
    related.innerHTML=`<div class="ma-section-title"><div><span class="ma-eyebrow">MEDIA LIBRARY</span><h3>${c.media.length?'관련 영상':'마왕 공식 아카이브'}</h3></div><span>${c.media.length?'선택한 캐릭터 관련 공개 자료':'개별 영상 미확인 · 공통 참고 영상'}</span></div><div class="ma-video-grid">${[...new Set([...keys,'intro','profile'])].map(videoCard).join('')}</div>`;
    root.querySelector('.ma-announce').textContent=c.name+' 선택됨';
    if(!loaded.has(c.image)&&missing.has(c.image))node.querySelector('.ma-image-caption').title=c.imageName;
  }
  function choose(c,focus=false){
    if(!c)return;
    selected=c;
    // Only selection-dependent areas update; no full page re-render or timer.
    root.querySelectorAll('[data-ma-character]').forEach(b=>{
      const active=b.dataset.maCharacter===c.id;
      b.classList.toggle('is-selected',active);b.setAttribute('aria-pressed',String(active));
    });
    stage();
    if(focus)root.querySelector('[data-ma-character="'+c.id+'"]')?.focus({preventScroll:true});
  }
  function updateFilter(){
    const list=matching();
    if(list.length&&!list.includes(selected))selected=list[0];
    roster();stage();
  }
  function render(){
    if(mounted)return;
    mounted=true;
    root.innerHTML=`<header class="ma-header"><div class="ma-header-brand"><div class="ma-brand-img"><img src="${db.profileImage}" alt="유정 공개 자료 이미지" decoding="async"></div><div><div class="ma-eyebrow">MAWANG ARCHIVES / CHARACTER SELECT</div><h2>마왕 자료실</h2><p>마왕0216의 여러 모습, 캐릭터마다 이어지는 이야기.</p></div></div><div class="ma-header-count"><strong>${entries.length}</strong><span>CHARACTER FILES<br>공개 자료로 정리</span></div></header>
      <div class="ma-stage" aria-labelledby="maCharacterName"></div>
      <div class="ma-roster"><div class="ma-section-title"><div><span class="ma-eyebrow">SELECT YOUR CHARACTER</span><h3>캐릭터 선택 <span class="ma-count"></span></h3></div><label class="ma-search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/></svg><input type="search" aria-label="캐릭터 검색" placeholder="이름 또는 특징 검색"></label></div>
      <div class="ma-filters" aria-label="캐릭터 분류"><button type="button" data-ma-filter="all">전체 ${entries.length}</button><button type="button" data-ma-filter="jeong">정 시리즈 ${entries.filter(c=>c.group==='jeong').length}</button><button type="button" data-ma-filter="classic">클래식 ${entries.filter(c=>c.group==='classic').length}</button></div><div class="ma-roster-grid" aria-label="캐릭터 목록"></div></div>
      <section class="ma-related" aria-label="공식 영상 자료"></section>
      <footer class="ma-footer"><div><span class="ma-eyebrow">SOURCE INDEX</span><p>공개 자료 확인 기준 · 2026.11.22. 제작일과 첫 등장일이 불명확한 경우 미확인으로 표시합니다. PIKU의 팬 공개 이미지와 위키 자료는 2차 자료이며 공식 설정과 구분합니다. 이미지 표시가 불가능할 경우 원본 주소와 관련 영상으로 안내합니다.</p></div><div class="ma-channel-links">${link(channels.official,'마왕 공식 유튜브')}${link(channels.secondary,'마왕의 심연')}${link(channels.soop,'SOOP 방송국')}${link(db.wiki,'캐릭터 공개 기록')}${link(db.sona,'소나위키')}</div><span class="ma-announce" aria-live="polite"></span></footer>`;
    // Capture image errors once, including lazy roster images. Never substitute
    // another character's face for a missing source image.
    function imageFailed(event){
      const img=event.target;if(!(img instanceof HTMLImageElement))return;
      const url=img.dataset.maImage,wrap=img.closest('.ma-portrait');
      img.hidden=true;
      if(!url||!wrap)return;
      missing.add(url);wrap.classList.add('ma-image-missing');
      if(wrap.closest('.ma-stage-art')){
        const c=selected;if(c.image!==url)return;
        const caption=wrap.querySelector('.ma-image-caption');
        if(c.media.length&&c.id!=='yoo'){
          const v=videos[c.media[0]],replacement=document.createElement('img');
          replacement.className='ma-video-image';replacement.src=thumb(v.id);replacement.alt=v.title+' 영상 썸네일';replacement.decoding='async';
          wrap.append(replacement);wrap.classList.add('ma-video-fallback');caption.textContent='대표 영상 썸네일';
          replacement.addEventListener('error',()=>{caption.textContent='이미지 원본 연결 불가';wrap.classList.remove('ma-video-fallback')},{once:true});
        }else caption.textContent='이미지 원본 연결 불가';
      }
    }
    root.addEventListener('error',imageFailed,true);
    root.addEventListener('load',e=>{if(e.target.dataset?.maImage){if(e.target.naturalWidth<2||e.target.naturalHeight<2)imageFailed(e);else loaded.add(e.target.dataset.maImage)}},true);
    root.addEventListener('click',e=>{
      const b=e.target.closest('button');if(!b)return;
      if(b.dataset.maCharacter)choose(entries.find(c=>c.id===b.dataset.maCharacter));
      else if(b.dataset.maFilter){filter=b.dataset.maFilter;updateFilter()}
      else if(b.dataset.maStep){const list=matching(),i=list.indexOf(selected);if(list.length)choose(list[(i+Number(b.dataset.maStep)+list.length)%list.length]);root.querySelector('[data-ma-step="'+b.dataset.maStep+'"]')?.focus({preventScroll:true})}
    });
    root.addEventListener('input',e=>{if(e.target.matches('.ma-search input')){query=e.target.value;updateFilter()}});
    root.addEventListener('keydown',e=>{
      const b=e.target.closest('[data-ma-character]');if(!b||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(e.key))return;
      const list=matching(),i=list.findIndex(c=>c.id===b.dataset.maCharacter),grid=root.querySelector('.ma-roster-grid');
      const columns=Math.max(1,Math.round(grid.clientWidth/Math.max(1,b.offsetWidth+8)));
      const next=e.key==='Home'?0:e.key==='End'?list.length-1:i+({ArrowLeft:-1,ArrowRight:1,ArrowUp:-columns,ArrowDown:columns}[e.key]||0);
      e.preventDefault();choose(list[Math.min(list.length-1,Math.max(0,next))],true);
    });
    roster();stage();
  }
  window.mwsMawangArchiveV1={render};
  if(root.closest('.section')?.classList.contains('active'))render();
})();
