/* SOOP station URL -> contact form autofill. Never overwrites an existing contact's custom details. */
(()=>{
  'use strict';
  const stationInput=document.getElementById('ctStationUrl');
  const nameInput=document.getElementById('ctName');
  const noteInput=document.getElementById('ctNotes');
  const stationRow=stationInput?.closest('.contact-station-row-v55');
  const visit=document.getElementById('ctStationVisitBtn');
  if(!stationInput||!nameInput||!stationRow||!visit)return;

  const lookupButton=document.createElement('button');
  lookupButton.type='button';
  lookupButton.id='ctSoopAutofillBtnV1';
  lookupButton.className='secondary';
  lookupButton.textContent='SOOP 정보 가져오기';
  lookupButton.title='SOOP 방송국 주소로 닉네임과 프로필 이미지를 불러옵니다';
  stationRow.insertBefore(lookupButton,visit);
  stationRow.classList.add('mws-soop-autofill-row-v1');
  const style=document.createElement('style');
  style.id='mws-soop-autofill-style-v1';
  style.textContent=`.contact-station-row-v55.mws-soop-autofill-row-v1{grid-template-columns:minmax(0,1fr) auto auto}
    .mws-soop-autofill-row-v1 #ctSoopAutofillBtnV1{white-space:nowrap}
    @media(max-width:760px){
      .contact-station-row-v55.mws-soop-autofill-row-v1{grid-template-columns:minmax(0,1fr) auto}
      .mws-soop-autofill-row-v1 #ctStationUrl{grid-column:1/-1}
    }`;
  document.head.appendChild(style);

  const feedback=document.createElement('div');
  feedback.id='ctSoopAutofillStatusV1';
  feedback.setAttribute('role','status');
  feedback.setAttribute('aria-live','polite');
  feedback.style.cssText='margin-top:6px;font-size:12px;line-height:1.5;color:var(--muted)';
  stationRow.parentElement.appendChild(feedback);

  function parseStationUrl(raw){
    let url;
    try{url=new URL(String(raw||'').trim())}catch(_){return null}
    if(url.protocol!=='https:'||url.username||url.password||url.port)return null;
    if(!['sooplive.com','www.sooplive.com','sooplive.co.kr','www.sooplive.co.kr',
      'afreecatv.com','www.afreecatv.com'].includes(url.hostname.toLowerCase()))return null;
    const match=/^\/station\/([A-Za-z0-9_]{2,40})\/?$/.exec(url.pathname);
    return match?{id:match[1],canonical:'https://www.sooplive.com/station/'+match[1]}:null;
  }
  function show(text,isError=false){
    feedback.textContent=text;
    feedback.style.color=isError?'var(--danger)':'var(--muted)';
  }
  async function fetchJson(url){
    const response=await fetch(url,{headers:{accept:'application/json'}});
    const data=await response.json().catch(()=>null);
    if(!response.ok||!data?.ok)throw new Error(data?.error||'SOOP 조회에 실패했습니다.');
    return data;
  }
  function unchanged(raw,contactId){
    const modal=document.getElementById('contactModal');
    return modal?.classList.contains('open')&&stationInput.value===raw&&
      String(typeof editingContactId==='undefined'?'':editingContactId||'')===contactId;
  }
  async function lookup(){
    const parsed=parseStationUrl(stationInput.value);
    if(!parsed){show('SOOP 방송국 주소를 입력해 주세요. 예: https://www.sooplive.com/station/아이디',true);return}
    const originalUrl=stationInput.value;
    const contactId=String(typeof editingContactId==='undefined'?'':editingContactId||'');
    lookupButton.disabled=true;
    show('SOOP 방송국 정보를 확인하는 중입니다.');
    try{
      const station=await fetchJson('/api/soop/contact-station?id='+encodeURIComponent(parsed.id));
      if(!unchanged(originalUrl,contactId))return;
      const match=typeof findContactForSoopApplicant==='function'?
        findContactForSoopApplicant({userId:station.id}):null;
      if(match&&String(match.id)!==contactId){
        show('이미 등록된 SOOP ID입니다. 연락처 '+match.name+' 항목에서 정보를 확인해 주세요.',true);
        return;
      }
      // The existing image is authoritative. Do not replace manually selected files either.
      const stored=contactId&&typeof contact==='function'?contact(contactId):null;
      const alreadyHasImage=Boolean(stored?.image||document.getElementById('ctImage')?.files?.length);
      let avatarFile=null;
      let avatarError='';
      if(station.avatarUrl&&!alreadyHasImage){
        try{
          const response=await fetch(station.avatarUrl,{headers:{accept:'image/*'}});
          if(!response.ok)throw new Error('HTTP '+response.status);
          const mime=(response.headers.get('content-type')||'').split(';')[0].toLowerCase();
          const ext=({'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/gif':'gif'})[mime];
          if(!ext)throw new Error('지원하지 않는 이미지 형식');
          const blob=await response.blob();
          if(!blob.size||blob.size>5*1024*1024)throw new Error('이미지 크기 제한 초과');
          avatarFile=new File([blob],'soop-'+station.id+'.'+ext,{type:mime});
        }catch(error){avatarError=String(error?.message||error)}
      }
      if(!unchanged(originalUrl,contactId))return;
      // Preserve user typing performed while the remote request was active.
      const enteredName=nameInput.value.trim();
      const targetName=enteredName||station.name;
      stationInput.value=station.stationUrl||parsed.canonical;
      if(!enteredName)nameInput.value=station.name;
      if(!noteInput.value.trim())noteInput.value='SOOP ID: '+station.id;
      if(avatarFile&&!document.getElementById('ctImage')?.files?.length){
        const staged=typeof window.handleContactImageFile==='function'?
          await window.handleContactImageFile(avatarFile):false;
        // The ordinary file handler sets name from filename on new contacts.
        // Restore the verified station nickname or the user's entered name.
        if(unchanged(stationInput.value,contactId))nameInput.value=targetName;
        if(!staged)avatarError='브라우저에서 사진을 읽지 못했습니다';
      }
      if(!unchanged(stationInput.value,contactId))return;
      if(avatarError)show('이름과 방송국 주소를 입력했습니다. 프로필 사진은 불러오지 못했습니다: '+avatarError,true);
      else if(alreadyHasImage)show('방송국 정보를 확인했습니다. 기존 프로필 사진과 직접 입력한 정보는 유지했습니다.');
      else if(avatarFile)show('SOOP 닉네임과 프로필 사진을 입력했습니다. 연락처 저장 버튼으로 확정해 주세요.');
      else show('방송국 정보를 입력했습니다. SOOP에서 제공한 프로필 사진은 없습니다.');
    }catch(error){
      if(unchanged(originalUrl,contactId))show(String(error?.message||error||'SOOP 조회 실패'),true);
    }finally{lookupButton.disabled=false}
  }
  lookupButton.addEventListener('click',lookup);
  stationInput.addEventListener('input',()=>show(''));
  window.mwsSoopContactAutofillV1={parseStationUrl,lookup};
})();
