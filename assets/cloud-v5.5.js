/* MAWANG Scheduler TEST V5.5 - Cloudflare D1/R2 incremental backend */
(()=>{
  'use strict';
  if(window.__mwsCloudV55Loaded)return;
  window.__mwsCloudV55Loaded=true;

  const SB_URL='https://nysxcqlewzucbpoaymbg.supabase.co';
  const SB_KEY='sb_publishable_H7VPUOVV6nN7QdaJKO3-lA_-SNrg4mW';
  const REMEMBER_KEY='mws_access_remember_v1';
  const MODE_KEY='mws_access_mode_v1';
  const CACHE_DB='mawang_data';
  const CACHE_SCHEMA_VERSION=3;
  const CACHE_STORES=['core','contacts','contactMeta','events','posts','miniGames','activity','clipboard','notebook'];
  const INITIAL_PARTS=['core','contacts','events','posts','activity'];
  const ALL_PARTS=[...CACHE_STORES];
  const PARTS_BY_TAB={
    dashboard:[],calendar:['clipboard'],contacts:['contactMeta'],posts:[],sniper:[],targets:[],
    memos:['notebook'],worldtime:[],gameLadder:['miniGames'],gameRps:['miniGames'],
    gamePachinko:['miniGames'],gameMultiDraw:['miniGames'],export:['contactMeta','miniGames','notebook','clipboard'],
    settings:['contactMeta']
  };
  const CORE_KEYS=['version','categories','dashboardNoticeUrl','selfContactId','timezones'];
  const $=id=>document.getElementById(id);
  const clone=v=>{try{return structuredClone(v)}catch(_){return JSON.parse(JSON.stringify(v))}};
  const safeUserEmail=username=>`${String(username||'').trim().toLowerCase().replace(/[^a-z0-9._-]/g,'_')}@mws.local`;
  const timeout=(promise,ms,label='요청')=>Promise.race([promise,new Promise((_,reject)=>setTimeout(()=>reject(new Error(`${label} 응답 시간이 초과되었습니다.`)),ms))]);
  const byteLen=v=>{try{return new TextEncoder().encode(typeof v==='string'?v:JSON.stringify(v??null)).byteLength}catch(_){return 0}};

  let sb=null,mode=null,manifest=null,cloudSaveTimer=0,cloudSaving=false,pendingSave=false,cacheDbPromise=null;
  const loadedParts=new Set();
  const baselineJson=new Map();
  const dirtyParts=new Set();
  let lazyBridgeInstalled=false;

  const metrics=window.__mwsV55NetworkMetrics={
    startedAt:new Date().toISOString(),backend:'cloudflare-d1-r2',cacheSchemaVersion:CACHE_SCHEMA_VERSION,requests:[],cacheHits:0,cacheMisses:0,
    semanticResponseBytes:0,actualCloudflareResponseBytes:0,actualCloudflareRequestBytes:0,actualSupabaseResponseBytes:0,actualSupabaseRequestBytes:0
  };
  function metric(type,detail={}){metrics.requests.push({at:new Date().toISOString(),type,...detail});if(metrics.requests.length>300)metrics.requests.shift()}
  window.mwsV55EgressReport=()=>({
    ...clone(metrics),mode,manifest:clone(manifest),loadedParts:[...loadedParts],dirtyParts:[...dirtyParts],
    imageResources:(performance.getEntriesByType?.('resource')||[]).filter(x=>/\/media\/(contact|workspace)\//.test(x.name)).map(x=>({name:x.name,transferSize:x.transferSize,encodedBodySize:x.encodedBodySize,decodedBodySize:x.decodedBodySize,duration:Math.round(x.duration)}))
  });

  function installFetchMeter(){
    if(window.__mwsV55FetchMeterInstalled)return;
    window.__mwsV55FetchMeterInstalled=true;
    const base=window.fetch.bind(window);
    window.fetch=async function(input,init){
      const raw=typeof input==='string'?input:(input?.url||'');
      let sameOrigin=false,isSb=false;
      try{const u=new URL(raw,location.href);sameOrigin=u.origin===location.origin&&(u.pathname.startsWith('/api/')||u.pathname.startsWith('/media/'));isSb=u.origin===SB_URL}catch(_){}
      if(init?.body){const n=byteLen(init.body);if(sameOrigin)metrics.actualCloudflareRequestBytes+=n;if(isSb)metrics.actualSupabaseRequestBytes+=n}
      const res=await base(input,init);
      if(sameOrigin||isSb){
        try{
          const copy=res.clone();
          copy.arrayBuffer().then(buf=>{
            if(sameOrigin)metrics.actualCloudflareResponseBytes+=buf.byteLength;
            if(isSb)metrics.actualSupabaseResponseBytes+=buf.byteLength;
            metric(sameOrigin?'cloudflare-http':'supabase-auth-http',{url:new URL(raw,location.href).pathname,status:res.status,responseBytes:buf.byteLength});
          }).catch(()=>{});
        }catch(_){}
      }
      return res;
    };
  }
  installFetchMeter();

  async function fetchJson(url,options={},label='Cloudflare 요청'){
    const res=await timeout(fetch(url,options),options.timeout||15000,label);
    let body=null;try{body=await res.json()}catch(_){}
    if(!res.ok)throw new Error(body?.error||`${label} 실패: HTTP ${res.status}`);
    return body;
  }

  function openCache(){
    if(cacheDbPromise)return cacheDbPromise;
    cacheDbPromise=new Promise((resolve,reject)=>{
      if(!('indexedDB' in window)){reject(new Error('IndexedDB를 사용할 수 없습니다.'));return}
      const req=indexedDB.open(CACHE_DB,CACHE_SCHEMA_VERSION);
      req.onupgradeneeded=()=>{
        const db=req.result;
        for(const name of [...db.objectStoreNames])db.deleteObjectStore(name);
        for(const name of CACHE_STORES)db.createObjectStore(name,{keyPath:'scope'});
        db.createObjectStore('meta',{keyPath:'key'});
      };
      req.onerror=()=>reject(req.error||new Error('IndexedDB 열기 실패'));
      req.onsuccess=()=>resolve(req.result);
    });
    return cacheDbPromise;
  }
  async function idbTx(store,modeName,fn){
    const db=await openCache();
    return await new Promise((resolve,reject)=>{
      const tx=db.transaction(store,modeName),os=tx.objectStore(store);let result;
      try{result=fn(os)}catch(e){reject(e);return}
      tx.oncomplete=()=>resolve(result?.result);tx.onerror=()=>reject(tx.error||new Error('IndexedDB transaction 실패'));tx.onabort=()=>reject(tx.error||new Error('IndexedDB transaction 취소'));
    });
  }
  async function getCachedPart(scope,part){if(!CACHE_STORES.includes(part))return null;try{return await idbTx(part,'readonly',os=>os.get(scope))||null}catch(e){console.warn('IndexedDB cache read',part,e);return null}}
  async function putCachedPart(scope,part,version,value){if(!CACHE_STORES.includes(part))return;try{await idbTx(part,'readwrite',os=>os.put({scope,version:Number(version)||0,data:clone(value),cachedAt:Date.now()}))}catch(e){console.warn('IndexedDB cache write',part,e)}}
  async function clearCache(){try{const db=await openCache();await Promise.all(CACHE_STORES.map(store=>new Promise((resolve,reject)=>{const tx=db.transaction(store,'readwrite');tx.objectStore(store).clear();tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)})))}catch(e){console.warn('IndexedDB cache clear',e)}}
  async function validateCacheSchema(){
    try{
      const db=await openCache();
      const current=await new Promise((resolve,reject)=>{const tx=db.transaction('meta','readonly'),r=tx.objectStore('meta').get('schemaVersion');r.onsuccess=()=>resolve(r.result?.value);r.onerror=()=>reject(r.error)});
      if(Number(current)!==CACHE_SCHEMA_VERSION){await clearCache();await idbTx('meta','readwrite',os=>os.put({key:'schemaVersion',value:CACHE_SCHEMA_VERSION,updatedAt:Date.now()}))}
    }catch(e){console.warn('IndexedDB schema validation',e)}
  }
  async function setMeta(key,value){try{await idbTx('meta','readwrite',os=>os.put({key,value,updatedAt:Date.now()}))}catch(_){}}
  async function getMeta(key){try{return await idbTx('meta','readonly',os=>os.get(key))}catch(_){return null}}

  function setLoginError(msg=''){const el=$('mwsLoginError');if(el)el.textContent=msg}
  function showGate(){document.body.classList.add('mws-gated');$('mwsAccessGate')?.classList.remove('hidden');$('mwsAccessTools')?.setAttribute('hidden','');setLoginError('')}
  function hideGate(){document.body.classList.remove('mws-gated');$('mwsAccessGate')?.classList.add('hidden');$('mwsAccessTools')?.removeAttribute('hidden')}
  function rememberChoice(chosen){const yes=$('mwsRemember')?.checked!==false;if(yes){localStorage.setItem(REMEMBER_KEY,'1');localStorage.setItem(MODE_KEY,chosen)}else{localStorage.removeItem(REMEMBER_KEY);localStorage.removeItem(MODE_KEY)}}
  function selectLoginMode(next){
    const admin=next==='admin';$('mwsModeAdmin')?.classList.toggle('active',admin);$('mwsModePublic')?.classList.toggle('active',!admin);
    if($('mwsAdminFields'))$('mwsAdminFields').style.display=admin?'grid':'none';if($('mwsLoginSubmit'))$('mwsLoginSubmit').textContent=admin?'Admin 로그인':'Public 입장';if($('mwsLoginForm'))$('mwsLoginForm').dataset.mode=next;setLoginError('');
  }
  function applyPublicRestrictions(){
    document.querySelectorAll('#contactModal input,#contactModal select,#contactModal textarea,#eventModal input,#eventModal select,#eventModal textarea').forEach(el=>{el.disabled=false});
    const title=$('postDisplayName');if(title){title.readOnly=false;title.removeAttribute('aria-readonly')}
    document.querySelectorAll('.mws-admin-only,#newEventBtn,#newContactBtn,#cleanupDuplicatesBtn,#postUrlAddBtn,#postUrlInput,#postSyncBtn,#postDeleteBtn,#postScheduleCreateBtn,.post-applicant-delete').forEach(el=>el.style.removeProperty('display'));
    const urlCard=$('postUrlInput')?.closest('.post-url-card');if(urlCard)urlCard.style.removeProperty('display');
  }
  function applyModeUi(){
    const isAdmin=mode==='admin';document.body.classList.toggle('mws-public-mode',!isAdmin);document.body.dataset.mwsMode=isAdmin?'admin':'public';
    const badge=$('mwsModeBadge');if(badge){badge.textContent=isAdmin?'ADMIN':'PUBLIC';badge.classList.toggle('admin',isAdmin)}
    if($('mwsAdminManageBtn'))$('mwsAdminManageBtn').hidden=!isAdmin;if($('mwsSidebarSaveBtn'))$('mwsSidebarSaveBtn').hidden=!isAdmin;
    document.querySelectorAll('.nav button').forEach(btn=>delete btn.dataset.mwsPublicHidden);applyPublicRestrictions();try{updateStorageStatus(true)}catch(_){}
  }

  function stripPostSources(posts){return (Array.isArray(posts)?posts:[]).map(p=>{const x=clone(p);for(const k of ['sourceContent','sourcePhotos','sourceAuthor','sourceAuthorId','sourceRegDate','sourceViewCount','sourceUrl'])delete x[k];return x})}
  function extractPart(part,src=data){
    const d=typeof mwsStripDevicePrefs==='function'?mwsStripDevicePrefs(src||{}):clone(src||{});
    if(part==='core'){const out={};for(const k of CORE_KEYS)if(Object.prototype.hasOwnProperty.call(d,k))out[k]=clone(d[k]);return out}
    if(part==='contacts')return clone(Array.isArray(d.contacts)?d.contacts:[]);if(part==='events')return clone(Array.isArray(d.events)?d.events:[]);if(part==='posts')return stripPostSources(d.posts);
    if(part==='miniGames')return clone(d.miniGames&&typeof d.miniGames==='object'?d.miniGames:{});
    if(part==='activity')return {collaborations:clone(Array.isArray(d.collaborations)?d.collaborations:[]),todayPeopleByDate:clone(d.todayPeopleByDate&&typeof d.todayPeopleByDate==='object'?d.todayPeopleByDate:{}),todayPeopleManualByDate:clone(d.todayPeopleManualByDate&&typeof d.todayPeopleManualByDate==='object'?d.todayPeopleManualByDate:{}),targetList:clone(Array.isArray(d.targetList)?d.targetList:[])};
    if(part==='notebook')return {memos:clone(Array.isArray(d.memos)?d.memos:[]),favoriteFolders:clone(Array.isArray(d.favoriteFolders)?d.favoriteFolders:[])};
    if(part==='contactMeta')return {contactTags:clone(Array.isArray(d.contactTags)?d.contactTags:[]),contactTagBanners:clone(d.contactTagBanners&&typeof d.contactTagBanners==='object'?d.contactTagBanners:{})};
    if(part==='clipboard')return {scheduleClipboard:clone(Array.isArray(d.scheduleClipboard)?d.scheduleClipboard:[])};return null;
  }
  function mergePart(part,value,target=data){
    const v=clone(value);if(part==='core'){Object.assign(target,v||{});return}if(part==='contacts'){target.contacts=Array.isArray(v)?v:[];return}if(part==='events'){target.events=Array.isArray(v)?v:[];return}if(part==='posts'){target.posts=Array.isArray(v)?v:[];return}if(part==='miniGames'){target.miniGames=v&&typeof v==='object'?v:{};return}if(['activity','notebook','contactMeta','clipboard'].includes(part))Object.assign(target,v&&typeof v==='object'?v:{});
  }
  function freshSkeleton(){return {version:52,categories:[],contacts:[],events:[],posts:[],miniGames:{},collaborations:[],todayPeopleByDate:{},todayPeopleManualByDate:{},targetList:[],memos:[],favoriteFolders:[],contactTags:[],contactTagBanners:{},scheduleClipboard:[],timezones:[]}}
  function normalizeAndRender(reason){try{normalizeDataShape()}catch(_){try{normalizeMiniGameData()}catch(__){}}try{if(typeof mwsApplyDevicePrefs==='function')mwsApplyDevicePrefs(data)}catch(_){}document.body.dataset.theme=data.theme||'neon';document.body.classList.toggle('sidebar-pinned',Boolean(data.sidebarPinned));try{renderAll(reason)}catch(e){console.error('V5.5 render failed',e)}}

  async function fetchManifest(scope){
    const started=performance.now(),m=await fetchJson('/api/manifest',{},'Cloudflare 버전 확인');const bytes=byteLen(m);metrics.semanticResponseBytes+=bytes;metric('manifest',{scope,bytes,backend:m.backend,ms:Math.round(performance.now()-started)});return m;
  }
  async function fetchPart(scope,part){
    const started=performance.now(),row=await fetchJson(`/api/parts/${encodeURIComponent(part)}`,{},`${part} 불러오기`);const bytes=byteLen(row);metrics.semanticResponseBytes+=bytes;metrics.cacheMisses++;metric('part-fetch',{scope,part,version:Number(row.version)||0,bytes,ms:Math.round(performance.now()-started)});return row;
  }
  async function loadPartWithCache(scope,part,serverManifest,{allowStale=true}={}){
    const wanted=Number(serverManifest?.parts?.[part])||0,cached=await getCachedPart(scope,part);
    if(cached&&wanted>0&&Number(cached.version)===wanted){metrics.cacheHits++;metric('cache-hit',{scope,part,version:wanted,bytes:0});return {data:cached.data,version:wanted,source:'cache'}}
    if(!serverManifest&&cached&&allowStale){metrics.cacheHits++;metric('cache-stale-offline',{scope,part,version:Number(cached.version)||0,bytes:0});return {data:cached.data,version:Number(cached.version)||0,source:'cache-offline'}}
    const row=await fetchPart(scope,part);await putCachedPart(scope,part,row.version,row.data);return {data:row.data,version:Number(row.version)||0,source:'network'};
  }

  async function hydrate(chosen){
    mode=chosen;loadedParts.clear();baselineJson.clear();dirtyParts.clear();const scope=chosen==='admin'?'admin':'public';let serverManifest=null,offline=false;
    try{serverManifest=await fetchManifest(scope);manifest=serverManifest}catch(e){offline=true;manifest=null;console.warn('Cloudflare manifest unavailable; IndexedDB fallback',e)}
    const next=freshSkeleton();let loadedCount=0;
    try{const results=await Promise.all(INITIAL_PARTS.map(async part=>[part,await loadPartWithCache(scope,part,serverManifest,{allowStale:true})]));for(const [part,row] of results){mergePart(part,row.data,next);loadedParts.add(part);baselineJson.set(part,JSON.stringify(row.data));loadedCount++}}catch(e){console.warn('Cloudflare incremental initial load failed; cached parts only',e)}
    if(loadedCount<INITIAL_PARTS.length){let allCached=true;for(const part of INITIAL_PARTS){if(loadedParts.has(part))continue;const cached=await getCachedPart(scope,part);if(!cached){allCached=false;break}mergePart(part,cached.data,next);loadedParts.add(part);baselineJson.set(part,JSON.stringify(cached.data))}if(!allCached)throw new Error('필수 데이터와 IndexedDB 캐시를 모두 불러오지 못했습니다.')}
    data=next;normalizeAndRender(offline?'IndexedDB 오프라인 캐시':'Cloudflare D1 V5.5 증분 데이터');try{localStorage.removeItem('mawangSchedulerBeta')}catch(_){}applyModeUi();hideGate();const st=$('syncStatusText');if(st)st.textContent=offline?'IndexedDB 캐시 사용 중':'Cloudflare D1 버전 캐시 동기화';metric('hydrate-complete',{scope,offline,loaded:[...loadedParts]});
  }

  async function ensurePartsForTab(tab){
    const extras=PARTS_BY_TAB[tab]||[];if(!extras.length)return true;const scope=mode==='admin'?'admin':'public';if(!manifest){try{manifest=await fetchManifest(scope)}catch(_){}}
    let changed=false;for(const part of extras){if(loadedParts.has(part))continue;try{const row=await loadPartWithCache(scope,part,manifest,{allowStale:true});mergePart(part,row.data,data);loadedParts.add(part);baselineJson.set(part,JSON.stringify(row.data));changed=true}catch(e){console.error('Lazy part load failed',part,e);try{toast('데이터 불러오기',`${part} 데이터를 불러오지 못했습니다.`)}catch(_){}}}if(changed)normalizeAndRender(`${tab} lazy data`);return true;
  }
  window.mwsV55EnsureParts=ensurePartsForTab;window.mwsV55EnsureAllParts=()=>ensurePartsForTab('export');

  function installLazyTabBridge(){
    if(lazyBridgeInstalled||typeof window.setTab!=='function')return;lazyBridgeInstalled=true;const base=window.setTab;window.setTab=function(tab){const out=base.apply(this,arguments);Promise.resolve().then(()=>ensurePartsForTab(tab)).catch(e=>console.error('V5.5 lazy tab',e));return out};try{setTab=window.setTab}catch(_){}
    const exportAll=$('exportAllBtn');if(exportAll&&!exportAll.dataset.v55Guard){exportAll.dataset.v55Guard='1';exportAll.addEventListener('click',e=>{if(loadedParts.size<ALL_PARTS.length){e.preventDefault();e.stopImmediatePropagation();ensurePartsForTab('export').then(()=>exportAll.click())}},true)}
    const exportContacts=$('exportContactsBtn');if(exportContacts&&!exportContacts.dataset.v55Guard){exportContacts.dataset.v55Guard='1';exportContacts.addEventListener('click',()=>ensurePartsForTab('contacts'),{capture:true})}
  }

  function markDirty(){if(mode!=='admin')return [];const changed=[];for(const part of loadedParts){const current=JSON.stringify(extractPart(part));if(current!==baselineJson.get(part)){dirtyParts.add(part);changed.push(part)}else dirtyParts.delete(part)}return changed}
  function queueCloudSave(){if(mode!=='admin')return;clearTimeout(cloudSaveTimer);markDirty();cloudSaveTimer=setTimeout(()=>writeCloudNow(false),650)}
  function mergeNormalizedResult(normalized){if(!normalized||typeof normalized!=='object')return;for(const [part,value] of Object.entries(normalized)){if(loadedParts.has(part))mergePart(part,value,data)}}
  async function writeCloudNow(manual=false){
    if(mode!=='admin'||!sb)return false;if(cloudSaving){pendingSave=true;return false}markDirty();if(!dirtyParts.size){if(manual){try{toast('SAVE','변경된 데이터가 없습니다.')}catch(_){}}return true}
    cloudSaving=true;const partsToSave=[...dirtyParts];if(manual)setManualSaveProgress(8,'PREP');
    try{
      const {data:{session}}=await timeout(sb.auth.getSession(),10000,'Admin 세션 확인');if(!session?.user||!session.access_token)throw new Error('Admin 세션이 만료되었습니다.');
      const payload={};for(const part of partsToSave)payload[part]=extractPart(part);metric('save-parts',{parts:partsToSave,requestBytes:byteLen(payload)});if(manual)setManualSaveProgress(28,'UPLOAD');
      const result=await fetchJson('/api/save',{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${session.access_token}`},body:JSON.stringify({parts:payload}),timeout:60000},'Cloudflare 변경 데이터 저장');if(manual)setManualSaveProgress(88,'CACHE');
      const versions=result.versions||{},normalized=result.normalized||{};mergeNormalizedResult(normalized);if(manifest?.parts)for(const [part,version] of Object.entries(versions))manifest.parts[part]=Number(version)||manifest.parts[part];
      for(const part of partsToSave){const value=extractPart(part),version=Number(versions[part])||Number(manifest?.parts?.[part])||0;baselineJson.set(part,JSON.stringify(value));dirtyParts.delete(part);await putCachedPart('admin',part,version,value)}
      const st=$('syncStatusText');if(st)st.textContent='Cloudflare D1 변경 파트 저장 완료';if(manual)setManualSaveProgress(100,'SAVED');metric('save-complete',{parts:partsToSave,versions:clone(versions)});return true;
    }catch(e){console.error('Cloudflare incremental save failed',e);try{toast('온라인 저장 실패',e.message||String(e))}catch(_){}if(manual)setManualSaveProgress(0,'FAILED');return false}
    finally{cloudSaving=false;if(pendingSave){pendingSave=false;queueCloudSave()}}
  }
  window.mwsV55SaveNow=()=>writeCloudNow(true);

  function installSaveBridge(){
    const devicePersist=()=>{try{if(typeof mwsSaveDevicePrefs==='function')mwsSaveDevicePrefs(data)}catch(_){}if(mode==='admin')queueCloudSave();return true};try{persist=devicePersist;window.persist=devicePersist}catch(_){}
    const v55Save=function(reason='데이터 저장'){try{normalizeDataShape()}catch(_){try{normalizeMiniGameData()}catch(__){}}try{lastSyncReason=reason}catch(_){}try{if(typeof mwsSaveDevicePrefs==='function')mwsSaveDevicePrefs(data)}catch(_){}try{renderAll(reason)}catch(e){console.error('V5.5 render after save',e)}try{window.dispatchEvent(new CustomEvent('mawang:datachange',{detail:{reason}}))}catch(_){}if(mode==='admin')queueCloudSave();return true};try{saveData=v55Save;window.saveData=v55Save}catch(_){}
  }

  async function isCurrentUserAdmin(){
    const {data:{user}}=await timeout(sb.auth.getUser(),10000,'Admin 권한 확인');if(!user)return false;const {data:rows,error}=await timeout(sb.from('admin_profiles').select('user_id').eq('user_id',user.id).limit(1),10000,'Admin 권한 조회');if(!error&&Array.isArray(rows)&&rows.length===1){await setMeta('verifiedAdminUserId',user.id);return true}return false;
  }
  async function adminLogin(username,password){
    const email=safeUserEmail(username);let res=await timeout(sb.auth.signInWithPassword({email,password}),12000,'Admin 로그인');if(res.error){const boot=await timeout(sb.functions.invoke('bootstrap-admin',{body:{username,password}}),12000,'Admin 확인');if(boot.error||boot.data?.error)throw new Error(boot.data?.error||boot.error?.message||'관리자 로그인 실패');res=await timeout(sb.auth.signInWithPassword({email,password}),12000,'Admin 로그인')}if(res.error)throw res.error;if(!(await isCurrentUserAdmin())){await sb.auth.signOut();throw new Error('Admin 권한이 없는 계정입니다.')}
  }
  async function handleLogin(ev){ev.preventDefault();const chosen=$('mwsLoginForm')?.dataset.mode||'admin',btn=$('mwsLoginSubmit');if(btn)btn.disabled=true;setLoginError('');try{if(chosen==='admin'){const u=$('mwsLoginId')?.value.trim(),p=$('mwsLoginPw')?.value;if(!u||!p)throw new Error('Admin 아이디와 비밀번호를 입력해 주세요.');await adminLogin(u,p)}else await sb.auth.signOut();rememberChoice(chosen);await hydrate(chosen)}catch(e){setLoginError(e.message||String(e))}finally{if(btn)btn.disabled=false}}

  async function loadAdminList(){const list=$('mwsAdminList');if(!list)return;list.innerHTML='<div class="subtle">불러오는 중...</div>';const {data:rows,error}=await sb.from('admin_profiles').select('user_id,username,created_at').order('created_at',{ascending:true});if(error){list.innerHTML=`<div class="mws-login-error">${typeof esc==='function'?esc(error.message):error.message}</div>`;return}list.innerHTML=(rows||[]).map((r,i)=>`<div class="mws-admin-row"><div><div style="font-weight:850">${typeof esc==='function'?esc(r.username):r.username}</div><small>${i===0?'초기 Admin':'추가 Admin'}</small></div><small>${new Date(r.created_at).toLocaleDateString('ko-KR')}</small></div>`).join('')||'<div class="subtle">Admin 계정이 없습니다.</div>'}
  async function addAdmin(ev){ev.preventDefault();const msg=$('mwsAdminManageMsg');if(msg)msg.textContent='';const username=$('mwsNewAdminId')?.value.trim(),password=$('mwsNewAdminPw')?.value;try{const {data:result,error}=await sb.functions.invoke('create-admin',{body:{username,password}});if(error||result?.error)throw new Error(result?.error||error?.message||'추가 실패');$('mwsNewAdminId').value='';$('mwsNewAdminPw').value='';if(msg){msg.style.color='var(--ok)';msg.textContent=`${result.username} Admin 계정을 추가했습니다.`}await loadAdminList()}catch(e){if(msg){msg.style.color='var(--danger)';msg.textContent=e.message||String(e)}}}

  function setManualSaveProgress(percent,phase='SAVE'){const btn=$('mwsSidebarSaveBtn');if(!btn)return;const p=Math.max(0,Math.min(100,Math.round(Number(percent)||0)));btn.style.setProperty('--save-progress-v574',`${p}%`);const label=btn.querySelector('.sidebar-save-label-v572');if(label)label.textContent=p>=100?'SAVED 100%':phase==='FAILED'?'SAVE FAILED':`${phase} ${p}%`;if(p>=100)setTimeout(()=>{btn.style.removeProperty('--save-progress-v574');if(label)label.textContent='SAVE'},1100)}
  async function manualSave(){const btn=$('mwsSidebarSaveBtn');if(btn)btn.disabled=true;try{await writeCloudNow(true)}finally{if(btn)btn.disabled=false}}
  function bindUi(){
    $('mwsModeAdmin')?.addEventListener('click',()=>selectLoginMode('admin'));$('mwsModePublic')?.addEventListener('click',()=>selectLoginMode('public'));$('mwsLoginForm')?.addEventListener('submit',handleLogin);$('mwsSidebarSaveBtn')?.addEventListener('click',manualSave);
    $('mwsChangeModeBtn')?.addEventListener('click',async()=>{localStorage.removeItem(REMEMBER_KEY);localStorage.removeItem(MODE_KEY);mode=null;await sb.auth.signOut();selectLoginMode('admin');showGate()});$('mwsAdminManageBtn')?.addEventListener('click',()=>{$('mwsAdminModal')?.classList.add('open');$('mwsAdminModal')?.setAttribute('aria-hidden','false');loadAdminList()});$('mwsAdminClose')?.addEventListener('click',()=>{$('mwsAdminModal')?.classList.remove('open');$('mwsAdminModal')?.setAttribute('aria-hidden','true')});$('mwsAddAdminForm')?.addEventListener('submit',addAdmin);
  }
  async function canUseOfflineAdmin(session){if(!session?.user)return false;const verified=await getMeta('verifiedAdminUserId');if(verified?.value!==session.user.id)return false;for(const part of INITIAL_PARTS)if(!await getCachedPart('admin',part))return false;return true}

  async function init(){
    await validateCacheSchema();installSaveBridge();bindUi();selectLoginMode('admin');
    try{
      await fetchJson('/api/health',{},'Cloudflare 상태 확인');
      const mod=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.57.4/+esm');sb=mod.createClient(SB_URL,SB_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});window.__mwsV55Supabase=sb;window.__mwsV55Backend='cloudflare-d1-r2';
      const remember=localStorage.getItem(REMEMBER_KEY)==='1',preferred=localStorage.getItem(MODE_KEY);if(remember&&preferred==='public'){await hydrate('public');installLazyTabBridge();return}
      if(remember&&preferred==='admin'){const {data:{session}}=await timeout(sb.auth.getSession(),8000,'Admin 세션 확인');if(session){try{if(await isCurrentUserAdmin()){await hydrate('admin');installLazyTabBridge();return}}catch(e){if(await canUseOfflineAdmin(session)){await hydrate('admin');installLazyTabBridge();return}throw e}}}
      showGate();installLazyTabBridge();
    }catch(e){console.error('Cloudflare V5.5 init',e);setLoginError('Cloudflare 연결 실패: '+(e.message||String(e)));showGate();installLazyTabBridge()}
  }

  document.body.dataset.buildVersion='TEST V5.5 CF';const versionLabel=document.querySelector('.sidebar-build-version-v53');if(versionLabel)versionLabel.textContent='TEST V5.5 CF';window.addEventListener('mws:v55-features-ready',installLazyTabBridge,{once:true});init();
})();
