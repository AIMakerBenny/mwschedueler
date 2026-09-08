from pathlib import Path
import hashlib, sys

p = Path("index.html")
s = p.read_text(encoding="utf-8")

if 'id="v590-contact-recovery-script"' in s:
    print("v5.9 contact recovery already present")
    sys.exit(0)

required = ['id="contacts"','id="contactGrid"','id="contactTagList"','function filteredContacts','function renderContacts']
missing = [x for x in required if x not in s]
if missing:
    raise SystemExit("Required anchors missing: " + repr(missing))

style = r'''
<style id="v590-contact-recovery-style">
#contacts.active .contact-board-layout{
  display:grid!important;
  grid-template-columns:220px minmax(0,1fr)!important;
  gap:14px!important;
  align-items:start!important;
  width:100%!important;
  min-width:0!important;
  overflow:visible!important;
}
#contacts.active .contact-board-main{
  display:block!important;
  width:100%!important;
  min-width:0!important;
  max-width:none!important;
  overflow:visible!important;
}
#contacts.active #contactTagList{
  visibility:visible!important;
  opacity:1!important;
  min-height:42px;
}
#contacts.active #contactGrid{
  width:100%!important;
  min-width:0!important;
  visibility:visible!important;
  opacity:1!important;
}
#contacts.active #contactGrid .contact-card{
  visibility:visible!important;
  opacity:1!important;
}
.contact-load-status-v59{
  grid-column:1/-1;
  padding:18px;
  border:1px dashed var(--border);
  border-radius:12px;
  color:var(--muted);
  background:color-mix(in srgb,var(--panel2) 74%,transparent);
}
.contact-count-v59{
  display:inline-flex;
  align-items:center;
  margin-left:7px;
  padding:2px 7px;
  border:1px solid var(--border);
  border-radius:999px;
  background:var(--chip);
  color:var(--muted);
  font-size:9px;
  font-weight:900;
  vertical-align:middle;
}
@media(max-width:900px){
  #contacts.active .contact-board-layout{grid-template-columns:1fr!important}
  #contacts.active .contact-tag-panel{position:static!important;max-height:none!important}
}
</style>
'''

script = r'''
<script id="v590-contact-recovery-script">
(function(){
  'use strict';

  let contactRenderTokenV59 = 0;
  let contactRepairTimerV59 = 0;

  function stateV59(){
    try{return data}catch(_){return window.data||{}}
  }
  function escV59(v){
    return String(v??'').replace(/[&<>"']/g,function(ch){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];
    });
  }
  function normalizeContactsV59(){
    const d=stateV59();
    if(!Array.isArray(d.contacts))d.contacts=[];
    for(let i=d.contacts.length-1;i>=0;i--){
      const c=d.contacts[i];
      if(!c||typeof c!=='object'){d.contacts.splice(i,1);continue}
      if(!Array.isArray(c.labels))c.labels=[];
      c.labels=[...new Set(c.labels.map(x=>String(x??'').trim()).filter(Boolean))];
      if(c.name==null)c.name='';
      c.name=String(c.name);
      if(c.id==null||c.id===''){
        let generated='';
        try{generated=globalThis.crypto&&typeof globalThis.crypto.randomUUID==='function'?globalThis.crypto.randomUUID():''}catch(_){}
        c.id=generated||('contact-'+Math.random().toString(36).slice(2));
      }
      c.id=String(c.id);
    }
    if(!Array.isArray(d.contactTags))d.contactTags=[];
    const tags=[];
    const seen=new Set();
    [...d.contactTags,...d.contacts.flatMap(c=>c.labels)].forEach(raw=>{
      const tag=String(raw??'').trim();
      if(tag&&!seen.has(tag)){seen.add(tag);tags.push(tag)}
    });
    d.contactTags.splice(0,d.contactTags.length,...tags);
    if(!d.contactTagBanners||typeof d.contactTagBanners!=='object'||Array.isArray(d.contactTagBanners))d.contactTagBanners={};
    return d;
  }
  function activeTagV59(){
    try{return String(activeContactTag||'')}catch(_){
      return String(document.getElementById('contactLabelFilter')?.value||'');
    }
  }
  function setActiveTagV59(tag){
    const value=String(tag||'');
    try{activeContactTag=value}catch(_){}
    const hidden=document.getElementById('contactLabelFilter');
    if(hidden)hidden.value=value;
    try{contactView='cards'}catch(_){}
    document.querySelectorAll('#contacts .contact-view').forEach(b=>b.classList.toggle('active',b.dataset.contactView==='cards'));
    const grid=document.getElementById('contactGrid');
    const pending=document.getElementById('pendingContacts');
    const incomplete=document.getElementById('incompleteContacts');
    const panel=document.querySelector('#contacts .contact-tag-panel');
    const board=document.querySelector('#contacts .contact-board-layout');
    if(grid)grid.style.display='grid';
    if(pending)pending.style.display='none';
    if(incomplete)incomplete.style.display='none';
    if(panel)panel.style.display='block';
    board?.classList.remove('maintenance-mode');
    renderContactsV59('tag');
  }

  function renderContactTagSidebarV59(){
    const d=normalizeContactsV59();
    const box=document.getElementById('contactTagList');
    if(!box)return false;
    const current=activeTagV59();
    box.replaceChildren();

    const makeRow=(tag,label,count,isAll)=>{
      const row=document.createElement('div');
      row.className='contact-tag-item'+(isAll?'':' reorder-row');
      if(!isAll)row.dataset.contactTag=encodeURIComponent(tag);

      if(!isAll){
        const handle=document.createElement('button');
        handle.type='button';
        handle.className='reorder-handle tag-reorder-handle';
        handle.draggable=true;
        handle.title='드래그해서 태그 순서 변경';
        handle.textContent='⋮⋮';
        handle.addEventListener('click',e=>e.stopPropagation());
        handle.addEventListener('dragstart',e=>{
          try{
            if(typeof window.contactTagReorderStart==='function')window.contactTagReorderStart(tag,e);
            else{
              e.dataTransfer.effectAllowed='move';
              e.dataTransfer.setData('application/x-mawang-tag-order',tag);
            }
          }catch(_){}
        });
        handle.addEventListener('dragend',e=>{try{window.contactTagReorderEnd?.(e)}catch(_){}});
        row.appendChild(handle);
      }

      const button=document.createElement('button');
      button.type='button';
      button.className='contact-tag-button'+(current===tag?' active':'');
      const name=document.createElement('span');
      name.className='contact-tag-name';
      name.textContent=label;
      const num=document.createElement('span');
      num.className='contact-tag-count';
      num.textContent=String(count);
      button.append(name,num);
      button.addEventListener('click',()=>setActiveTagV59(tag));
      if(!isAll){
        button.addEventListener('dragover',e=>{try{window.contactTagDragOver?.(e)}catch(_){}});
        button.addEventListener('dragleave',e=>{try{window.contactTagDragLeave?.(e)}catch(_){}});
        button.addEventListener('drop',e=>{try{window.dropContactOnTag?.(tag,e)}catch(_){}});
      }
      row.appendChild(button);

      if(!isAll){
        const rename=document.createElement('button');
        rename.type='button';rename.className='contact-tag-action';rename.title='태그 이름 변경';rename.textContent='수정';
        rename.addEventListener('click',e=>{e.stopPropagation();try{window.renameContactTag?.(tag)}catch(_){}});
        const del=document.createElement('button');
        del.type='button';del.className='contact-tag-action';del.title='태그 삭제';del.textContent='삭제';
        del.addEventListener('click',e=>{e.stopPropagation();try{window.deleteContactTag?.(tag)}catch(_){}});
        row.append(rename,del);
      }
      return row;
    };

    const normalContacts=d.contacts.filter(c=>!c.pendingSetup);
    box.appendChild(makeRow('','전체',normalContacts.length,true));
    d.contactTags.forEach(tag=>{
      const count=normalContacts.filter(c=>(c.labels||[]).includes(tag)).length;
      box.appendChild(makeRow(tag,tag,count,false));
    });
    return true;
  }

  function contactMatchesV59(c,q){
    if(!q)return true;
    const text=(String(c.name||'')+' '+(c.labels||[]).join(' ')+' '+String(c.notes||'')).toLowerCase();
    return text.includes(q);
  }
  function lastDateV59(c){
    try{return getLastCollab(c.id)?.date||''}catch(_){return ''}
  }
  function sortContactsV59(arr,mode){
    const list=[...arr];
    const name=c=>String(c?.name||'');
    if(mode==='nameDesc')return list.sort((a,b)=>name(b).localeCompare(name(a),'ko'));
    if(mode==='oldestFirst')return list.sort((a,b)=>{
      const ad=lastDateV59(a),bd=lastDateV59(b);
      if(!ad&&!bd)return name(a).localeCompare(name(b),'ko');
      if(!ad)return-1;if(!bd)return 1;return new Date(ad)-new Date(bd);
    });
    if(mode==='recentFirst')return list.sort((a,b)=>{
      const ad=lastDateV59(a),bd=lastDateV59(b);
      if(!ad&&!bd)return name(a).localeCompare(name(b),'ko');
      if(!ad)return 1;if(!bd)return-1;return new Date(bd)-new Date(ad);
    });
    if(mode==='noRecordFirst')return list.sort((a,b)=>{
      const aa=lastDateV59(a)?1:0,bb=lastDateV59(b)?1:0;
      return aa-bb||name(a).localeCompare(name(b),'ko');
    });
    return list.sort((a,b)=>name(a).localeCompare(name(b),'ko'));
  }
  function filteredContactsV59(){
    const d=normalizeContactsV59();
    const q=String(document.getElementById('contactSearch')?.value||'').trim().toLowerCase();
    const label=activeTagV59()||String(document.getElementById('contactLabelFilter')?.value||'');
    const sort=document.getElementById('contactSort')?.value||'nameAsc';
    let arr=d.contacts.filter(c=>String(c.id)!==String(d.selfContactId||'')&&contactMatchesV59(c,q));
    if(label)arr=arr.filter(c=>(c.labels||[]).includes(label));
    return sortContactsV59(arr,sort);
  }

  function createContactCardV59(c){
    const card=document.createElement('div');
    card.className='contact-card'+(c.pendingSetup?' pending-card':'');
    card.draggable=true;
    card.dataset.contactId=c.id;

    let last=null,upcoming=[];
    try{last=getLastCollab(c.id)}catch(_){}
    try{upcoming=typeof upcomingEventsForContact==='function'?(upcomingEventsForContact(c.id)||[]):[]}catch(_){}
    if(upcoming.length)card.classList.add('has-upcoming');
    let isSelf=false;
    try{isSelf=String(c.id)===String(stateV59().selfContactId||'')}catch(_){}
    if(isSelf)card.classList.add('is-self');

    const core=document.createElement('div');
    core.className='contact-card-core';
    let avatar;
    if(c.image){
      avatar=document.createElement('img');
      avatar.className='contact-card-avatar-lg';
      avatar.loading='lazy';
      avatar.decoding='async';
      avatar.alt='';
      avatar.src=c.image;
    }else{
      avatar=document.createElement('div');
      avatar.className='contact-card-avatar-lg';
      try{avatar.textContent=initials(c.name)}catch(_){avatar.textContent=String(c.name||'?').slice(0,2)}
    }
    const info=document.createElement('div');info.className='contact-card-info';
    const nameRow=document.createElement('div');nameRow.className='contact-card-name-row';
    const title=document.createElement('div');title.className='contact-card-name';title.textContent=c.name||'이름 없음';
    nameRow.appendChild(title);
    if(isSelf){const b=document.createElement('span');b.className='contact-self-badge';b.textContent='본인';nameRow.appendChild(b)}
    if(upcoming.length){const b=document.createElement('span');b.className='upcoming-count-badge';b.textContent='UPCOMING '+upcoming.length;nameRow.appendChild(b)}
    const tags=document.createElement('div');tags.className='contact-card-tags';
    if((c.labels||[]).length){
      c.labels.forEach(x=>{const chip=document.createElement('span');chip.className='chip';chip.textContent=x;tags.appendChild(chip)});
    }else{const none=document.createElement('span');none.className='muted small';none.textContent='태그 없음';tags.appendChild(none)}
    const hist=document.createElement('div');hist.className='contact-card-last';
    if(last){
      const strong=document.createElement('strong');strong.style.color='var(--text)';strong.textContent=last.title||'컨텐츠';
      hist.append('최근 컨텐츠: ',strong,document.createElement('br'));
      let meta='';
      try{meta=formatDateWeekday(last.date)+' · '+daysSince(last.date)+'일 전'}catch(_){meta=String(last.date||'')}
      hist.append(meta);
    }else hist.textContent='합방 기록 없음';
    const actions=document.createElement('div');actions.className='contact-card-actions';
    if(c.stationUrl){
      const btn=document.createElement('button');btn.type='button';btn.className='station-link';btn.textContent='방송국 열기';
      btn.addEventListener('click',e=>{e.stopPropagation();try{window.openContactStation?.(c.id)}catch(_){}});
      actions.appendChild(btn);
    }
    if(c.pendingSetup){const chip=document.createElement('span');chip.className='chip';chip.textContent='신규 추가';actions.appendChild(chip)}
    info.append(nameRow,tags,hist,actions);
    core.append(avatar,info);
    card.appendChild(core);
    try{
      const holder=document.createElement('div');
      holder.innerHTML=typeof contactUpcomingPopover==='function'?contactUpcomingPopover(c):'';
      while(holder.firstChild)card.appendChild(holder.firstChild);
    }catch(_){}

    card.addEventListener('click',()=>{try{openContact(c.id)}catch(err){console.error('[v5.9] contact open failed',err)}});
    card.addEventListener('dragstart',e=>{try{window.contactCardDragStart?.(c.id,e)}catch(_){}});
    card.addEventListener('dragend',e=>{try{window.contactCardDragEnd?.(e)}catch(_){}});
    return card;
  }

  function currentContactViewV59(){
    try{return String(contactView||'cards')}catch(_){
      return document.querySelector('#contacts .contact-view.active')?.dataset.contactView||'cards';
    }
  }
  function updateVisibleCountV59(shown,total){
    const note=document.querySelector('#contacts .contact-controls-note');
    if(!note)return;
    let badge=note.querySelector('.contact-count-v59');
    if(!badge){badge=document.createElement('span');badge.className='contact-count-v59';note.appendChild(badge)}
    badge.textContent=shown===total?`${total}명`:`표시 ${shown}명 · 전체 ${total}명`;
  }

  function renderContactsV59(reason='manual'){
    const d=normalizeContactsV59();
    const grid=document.getElementById('contactGrid');
    if(!grid)return false;
    if(currentContactViewV59()!=='cards')return false;
    const token=++contactRenderTokenV59;
    try{renderContactTagSidebarV59()}catch(err){console.error('[v5.9] contact tags failed',err)}
    try{if(typeof renderContactTagBanner==='function')renderContactTagBanner()}catch(err){console.warn('[v5.9] contact banner failed',err)}

    const arr=filteredContactsV59();
    const total=d.contacts.length;
    updateVisibleCountV59(arr.length,total);
    grid.style.display='grid';
    grid.replaceChildren();
    if(!arr.length){
      const empty=document.createElement('div');
      empty.className='contact-load-status-v59';
      empty.textContent=total?`연락처 ${total}명은 저장되어 있지만 현재 검색 또는 태그 조건에 맞는 연락처가 없습니다.`:'연락처가 없습니다';
      grid.appendChild(empty);
      return true;
    }

    let pos=0;
    const BATCH=18;
    const draw=()=>{
      if(token!==contactRenderTokenV59)return;
      const frag=document.createDocumentFragment();
      const end=Math.min(arr.length,pos+BATCH);
      for(;pos<end;pos++){
        try{frag.appendChild(createContactCardV59(arr[pos]))}
        catch(err){console.error('[v5.9] contact card skipped',arr[pos]?.id,err)}
      }
      grid.appendChild(frag);
      if(pos<arr.length)requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
    return true;
  }

  window.renderContactsV59=renderContactsV59;
  window.renderContactTagSidebarV59=renderContactTagSidebarV59;
  window.setActiveContactTag=setActiveTagV59;
  try{setActiveContactTag=setActiveTagV59}catch(_){}

  try{renderContactTagSidebar=renderContactTagSidebarV59}catch(_){}
  try{renderContacts=renderContactsV59}catch(_){}

  try{
    const baseSetTabV59=setTab;
    setTab=function(tab){
      const result=baseSetTabV59.apply(this,arguments);
      if(tab==='contacts'){
        setTimeout(()=>renderContactsV59('tab'),0);
        setTimeout(()=>renderContactsV59('tab-settled'),180);
      }
      return result;
    };
    window.setTab=setTab;
  }catch(err){console.warn('[v5.9] setTab hook unavailable',err)}

  const rerender=()=>{
    if(document.getElementById('contacts')?.classList.contains('active')){
      clearTimeout(contactRepairTimerV59);
      contactRepairTimerV59=setTimeout(()=>renderContactsV59('datachange'),40);
    }
  };
  window.addEventListener('mawang:datachange',rerender);
  document.getElementById('contactSearch')?.addEventListener('input',()=>renderContactsV59('search'));
  document.getElementById('contactSort')?.addEventListener('change',()=>renderContactsV59('sort'));
  document.querySelector('[data-contact-view="cards"]')?.addEventListener('click',()=>setTimeout(()=>renderContactsV59('cards-button'),0));

  setInterval(()=>{
    const section=document.getElementById('contacts');
    const grid=document.getElementById('contactGrid');
    const d=stateV59();
    if(section?.classList.contains('active')&&currentContactViewV59()==='cards'&&Array.isArray(d.contacts)&&d.contacts.length>0){
      if(!grid?.querySelector('.contact-card')&&!grid?.querySelector('.contact-load-status-v59')){
        renderContactsV59('watchdog');
      }
    }
  },1200);

  setTimeout(()=>{
    if(document.getElementById('contacts')?.classList.contains('active'))renderContactsV59('startup');
  },80);
})();
</script>
'''

insert = style + "\n" + script + "\n"
idx = s.lower().rfind("</body>")
if idx < 0:
    raise SystemExit("No </body> found")
s = s[:idx] + insert + s[idx:]
p.write_text(s, encoding="utf-8")

out = p.read_text(encoding="utf-8")
checks = ['id="v590-contact-recovery-script"','function renderContactsV59','function renderContactTagSidebarV59','contact-load-status-v59',"setInterval(()=>"]
for c in checks:
    if c not in out:
        raise SystemExit("v5.9 check missing: " + c)
print("v5.9 patched", len(out), hashlib.sha256(out.encode()).hexdigest())
