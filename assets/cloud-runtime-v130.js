/* Mawang Scheduler v1.3.0 - staged cloud runtime successor */
(()=>{
  'use strict';
  if(window.__mwsCloudV110Loaded||window.__mwsCloudRuntimeV130)return;
  window.__mwsCloudRuntimeV130=true;
  window.__mwsCloudRuntimeV130Ready=false;

  const REMEMBER_KEY='mws_access_remember_v1';
  const MODE_KEY='mws_access_mode_v1';
  const CACHE_DB='mawang_data_v130';
  const CACHE_SCHEMA_VERSION=3;
  const CACHE_STORES=['core','contacts','contactMeta','events','posts','miniGames','activity','clipboard','notebook'];
  const WARDOGS_CACHE_DB='mws_wardogs_meta_v1';
  const WARDOGS_CACHE_VERSION=1;
  const INITIAL_PARTS=['core','contacts','events','posts','activity','clipboard'];
  const EXTRA_PARTS=['wardogs'];
  const ALL_PARTS=[...CACHE_STORES,...EXTRA_PARTS];
  const PARTS_BY_TAB={dashboard:[],calendar:['clipboard'],contacts:['contactMeta'],posts:[],sniper:[],targets:[],memos:['notebook'],worldtime:[],wardogs:['wardogs'],gameLadder:['miniGames'],gameRps:['miniGames'],gamePachinko:['miniGames'],gameMultiDraw:['miniGames'],toolTier:['miniGames'],toolMatrix:['miniGames'],toolRelations:['miniGames'],export:['contactMeta','miniGames','notebook','clipboard','wardogs'],settings:['contactMeta']};
  const CORE_KEYS=['version','categories','dashboardNoticeUrl','selfContactId','timezones','achievementCards','contentGroups','gameLibrary'];
  const $=id=>document.getElementById(id);
  const clone=v=>{try{return structuredClone(v)}catch(_){return JSON.parse(JSON.stringify(v))}};
  const timeout=(promise,ms,label='요청')=>Promise.race([promise,new Promise((_,reject)=>setTimeout(()=>reject(new Error(`${label} 응답 시간이 초과되었습니다.`)),ms))]);
  const byteLen=v=>{try{return new TextEncoder().encode(typeof v==='string'?v:JSON.stringify(v??null)).byteLength}catch(_){return 0}};

  let mode=null,manifest=null,cloudSaveTimer=0,cloudSaving=false,cacheDbPromise=null,wardogsCacheDbPromise=null,currentAdmin=null;
  const loadedParts=new Set(),baselineJson=new Map(),dirtyParts=new Set();
  window.mwsCanEditCalendarClipboardV1=()=>mode==='admin'&&Boolean(currentAdmin)&&!hydrating&&loadedParts.has('clipboard')&&Number.isInteger(manifest?.parts?.clipboard)&&manifest.parts.clipboard>=0;
  let lazyBridgeInstalled=false;
  const metrics=window.__mwsV55NetworkMetrics={startedAt:new Date().toISOString(),backend:'cloudflare-d1-r2-auth',cacheSchemaVersion:CACHE_SCHEMA_VERSION,requests:[],cacheHits:0,cacheMisses:0,semanticResponseBytes:0,actualCloudflareResponseBytes:0,actualCloudflareRequestBytes:0};
  function metric(type,detail={}){metrics.requests.push({at:new Date().toISOString(),type,...detail});if(metrics.requests.length>300)metrics.requests.shift()}
  window.mwsV55EgressReport=()=>({...clone(metrics),mode,manifest:clone(manifest),loadedParts:[...loadedParts],dirtyParts:[...dirtyParts],saving:cloudSaving,blockedDraft:Boolean(draftBlocked)});
  window.__mwsV55Backend='cloudflare-d1-r2-auth';
  window.__mwsV55Supabase=null;

  function clearLegacySupabaseStorage(){
    try{for(let i=localStorage.length-1;i>=0;i--){const k=localStorage.key(i);if(k&&/^sb-/.test(k))localStorage.removeItem(k)}}catch(_){}
  }
  clearLegacySupabaseStorage();

  if(!window.__mwsV55FetchMeterInstalled){
    window.__mwsV55FetchMeterInstalled=true;
    const base=window.fetch.bind(window);
    window.fetch=async function(input,init={}){
      const raw=typeof input==='string'?input:(input?.url||'');let sameOrigin=false;
      try{const u=new URL(raw,location.href);sameOrigin=u.origin===location.origin&&(u.pathname.startsWith('/api/')||u.pathname.startsWith('/media/'))}catch(_){}
      if(init?.body&&sameOrigin)metrics.actualCloudflareRequestBytes+=byteLen(init.body);
      const res=await base(input,{credentials:'same-origin',...init});
      if(sameOrigin){try{const copy=res.clone();copy.arrayBuffer().then(buf=>{metrics.actualCloudflareResponseBytes+=buf.byteLength;metric('cloudflare-http',{url:new URL(raw,location.href).pathname,status:res.status,responseBytes:buf.byteLength})}).catch(()=>{})}catch(_){}}
      return res;
    };
  }

  async function fetchJson(url,options={},label='Cloudflare 요청'){
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),options.timeout||15000);
    try{const res=await fetch(url,{credentials:'same-origin',cache:'no-store',...options,signal:controller.signal});let body=null;try{body=await res.json()}catch(e){if(controller.signal.aborted)throw e}
      if(!res.ok){const error=Error(body?.error||label+' 실패: HTTP '+res.status);error.status=res.status;error.conflicts=body?.conflicts;throw error}return body;
    }catch(error){if(controller.signal.aborted)throw Error(label+' 응답 시간이 초과되었습니다.');throw error}finally{clearTimeout(timer)}
  }
  function openCache(){
    if(cacheDbPromise)return cacheDbPromise;
    cacheDbPromise=new Promise((resolve,reject)=>{if(!('indexedDB'in window)){reject(new Error('IndexedDB를 사용할 수 없습니다.'));return}const req=indexedDB.open(CACHE_DB,CACHE_SCHEMA_VERSION);req.onupgradeneeded=()=>{const db=req.result;for(const name of [...db.objectStoreNames])db.deleteObjectStore(name);for(const name of CACHE_STORES)db.createObjectStore(name,{keyPath:'scope'});db.createObjectStore('meta',{keyPath:'key'})};req.onerror=()=>{cacheDbPromise=null;reject(req.error||new Error('IndexedDB 열기 실패'))};req.onblocked=()=>{cacheDbPromise=null;reject(Error('IndexedDB open blocked'))};req.onsuccess=()=>resolve(req.result)});return cacheDbPromise;
  }
  async function idbTx(store,modeName,fn){const db=await openCache();return await new Promise((resolve,reject)=>{const tx=db.transaction(store,modeName),os=tx.objectStore(store);let result;try{result=fn(os)}catch(e){reject(e);return}tx.oncomplete=()=>resolve(result?.result);tx.onerror=()=>reject(tx.error||new Error('IndexedDB transaction 실패'));tx.onabort=()=>reject(tx.error||new Error('IndexedDB transaction 취소'))})}
  function openWardogsCache(){
    if(wardogsCacheDbPromise)return wardogsCacheDbPromise;
    wardogsCacheDbPromise=new Promise((resolve,reject)=>{if(!('indexedDB'in window)){reject(new Error('IndexedDB를 사용할 수 없습니다.'));return}const req=indexedDB.open(WARDOGS_CACHE_DB,WARDOGS_CACHE_VERSION);req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains('part'))db.createObjectStore('part',{keyPath:'scope'})};req.onerror=()=>{wardogsCacheDbPromise=null;reject(req.error||new Error('WARDOGS IndexedDB 열기 실패'))};req.onsuccess=()=>resolve(req.result)});return wardogsCacheDbPromise;
  }
  async function wardogsCacheTx(modeName,fn){const db=await openWardogsCache();return await new Promise((resolve,reject)=>{const tx=db.transaction('part',modeName),os=tx.objectStore('part');let result;try{result=fn(os)}catch(e){reject(e);return}tx.oncomplete=()=>resolve(result?.result);tx.onerror=()=>reject(tx.error||new Error('WARDOGS IndexedDB transaction 실패'));tx.onabort=()=>reject(tx.error||new Error('WARDOGS IndexedDB transaction 취소'))})}
  async function getCachedPart(scope,part){if(part==='wardogs'){try{return await wardogsCacheTx('readonly',os=>os.get(scope))||null}catch(_){return null}}if(!CACHE_STORES.includes(part))return null;try{return await idbTx(part,'readonly',os=>os.get(scope))||null}catch(_){return null}}
  async function putCachedPart(scope,part,version,value){
    const write=os=>{const current=os.get(scope);current.onsuccess=()=>{if(Number(current.result?.version||0)<=Number(version))os.put({scope,version:Number(version)||0,data:clone(value),cachedAt:Date.now()})};return current};
    if(part==='wardogs'){try{await wardogsCacheTx('readwrite',write)}catch(_){}return}
    if(!CACHE_STORES.includes(part))return;try{await idbTx(part,'readwrite',write)}catch(_){}
  }
  async function clearCache(){try{const db=await openCache();await Promise.all(CACHE_STORES.map(store=>new Promise((resolve,reject)=>{const tx=db.transaction(store,'readwrite');tx.objectStore(store).clear();tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)})))}catch(_){}}
  async function validateCacheSchema(){try{const db=await openCache();const current=await new Promise((resolve,reject)=>{const tx=db.transaction('meta','readonly'),r=tx.objectStore('meta').get('schemaVersion');r.onsuccess=()=>resolve(r.result?.value);r.onerror=()=>reject(r.error)});if(Number(current)!==CACHE_SCHEMA_VERSION){await clearCache();await idbTx('meta','readwrite',os=>os.put({key:'schemaVersion',value:CACHE_SCHEMA_VERSION,updatedAt:Date.now()}))}}catch(_){}}

  function setLoginError(msg=''){const el=$('mwsLoginError');if(el)el.textContent=msg}
  function showGate(){document.body.classList.add('mws-gated');$('mwsAccessGate')?.classList.remove('hidden');$('mwsAccessTools')?.setAttribute('hidden','');setLoginError('')}
  function hideGate(){document.body.classList.remove('mws-gated');$('mwsAccessGate')?.classList.add('hidden');$('mwsAccessTools')?.removeAttribute('hidden')}
  function rememberChoice(chosen){const yes=$('mwsRemember')?.checked!==false;if(yes){localStorage.setItem(REMEMBER_KEY,'1');localStorage.setItem(MODE_KEY,chosen)}else{localStorage.removeItem(REMEMBER_KEY);localStorage.removeItem(MODE_KEY)}}
  function selectLoginMode(next){const admin=next==='admin';$('mwsModeAdmin')?.classList.toggle('active',admin);$('mwsModePublic')?.classList.toggle('active',!admin);if($('mwsAdminFields'))$('mwsAdminFields').style.display=admin?'grid':'none';if($('mwsLoginSubmit'))$('mwsLoginSubmit').textContent=admin?'Admin 로그인':'Public 입장';if($('mwsLoginForm'))$('mwsLoginForm').dataset.mode=next;setLoginError('')}
  function applyPublicRestrictions(){document.querySelectorAll('#contactModal input,#contactModal select,#contactModal textarea,#eventModal input,#eventModal select,#eventModal textarea').forEach(el=>{el.disabled=false});const title=$('postDisplayName');if(title){title.readOnly=false;title.removeAttribute('aria-readonly')}document.querySelectorAll('.mws-admin-only,#newEventBtn,#newContactBtn,#cleanupDuplicatesBtn,#postUrlAddBtn,#postUrlInput,#postSyncBtn,#postDeleteBtn,#postScheduleCreateBtn,.post-applicant-delete').forEach(el=>el.style.removeProperty('display'));const urlCard=$('postUrlInput')?.closest('.post-url-card');if(urlCard)urlCard.style.removeProperty('display')}
  function applyModeUi(){const isAdmin=mode==='admin';document.body.classList.toggle('mws-public-mode',!isAdmin);document.body.dataset.mwsMode=isAdmin?'admin':'public';const badge=$('mwsModeBadge');if(badge){badge.textContent=isAdmin?'ADMIN':'PUBLIC';badge.classList.toggle('admin',isAdmin)}if($('mwsAdminManageBtn'))$('mwsAdminManageBtn').hidden=!isAdmin;if($('mwsSidebarSaveBtn'))$('mwsSidebarSaveBtn').hidden=!isAdmin;document.querySelectorAll('.nav button').forEach(btn=>delete btn.dataset.mwsPublicHidden);applyPublicRestrictions();try{updateStorageStatus(true)}catch(_){}}

  function stripPostSources(posts){return(Array.isArray(posts)?posts:[]).map(p=>{const x=clone(p);for(const k of['sourceContent','sourcePhotos','sourceAuthor','sourceAuthorId','sourceRegDate','sourceViewCount','sourceUrl'])delete x[k];return x})}
  function extractPart(part,src=data){const d=src||{};if(part==='core'){const out={};for(const k of CORE_KEYS)if(Object.prototype.hasOwnProperty.call(d,k))out[k]=clone(d[k]);return out}if(part==='contacts')return clone(Array.isArray(d.contacts)?d.contacts:[]);if(part==='events')return clone(Array.isArray(d.events)?d.events:[]);if(part==='posts')return stripPostSources(d.posts);if(part==='miniGames')return clone(d.miniGames&&typeof d.miniGames==='object'?d.miniGames:{});if(part==='activity')return{collaborations:clone(Array.isArray(d.collaborations)?d.collaborations:[]),todayPeopleByDate:clone(d.todayPeopleByDate&&typeof d.todayPeopleByDate==='object'?d.todayPeopleByDate:{}),todayPeopleManualByDate:clone(d.todayPeopleManualByDate&&typeof d.todayPeopleManualByDate==='object'?d.todayPeopleManualByDate:{}),targetList:clone(Array.isArray(d.targetList)?d.targetList:[])};if(part==='notebook')return{memos:clone(Array.isArray(d.memos)?d.memos:[]),favoriteFolders:clone(Array.isArray(d.favoriteFolders)?d.favoriteFolders:[]),patchNotes:clone(Array.isArray(d.patchNotes)?d.patchNotes:[]),suggestions:clone(Array.isArray(d.suggestions)?d.suggestions:[])};if(part==='contactMeta')return{contactTags:clone(Array.isArray(d.contactTags)?d.contactTags:[]),contactTagBanners:clone(d.contactTagBanners&&typeof d.contactTagBanners==='object'?d.contactTagBanners:{}),emoticons:clone(Array.isArray(d.emoticons)?d.emoticons:[])};if(part==='clipboard')return{scheduleClipboard:clone(Array.isArray(d.scheduleClipboard)?d.scheduleClipboard:[])};if(part==='wardogs'){const raw=d.wardogs&&typeof d.wardogs==='object'&&!Array.isArray(d.wardogs)?d.wardogs:{schemaVersion:1,cards:[]};return window.mwsWardogsDataV119?.normalize?window.mwsWardogsDataV119.normalize(raw):clone(raw)}return null}
  function mergePart(part,value,target=data){const v=clone(value);if(part==='core'){const hadAchievements=Boolean(v&&typeof v==='object'&&Object.prototype.hasOwnProperty.call(v,'achievementCards'));Object.assign(target,v||{});if(!hadAchievements){const shadow=window.mwsLoadAchievementShadowV1621?.();if(Array.isArray(shadow)&&shadow.length)target.achievementCards=clone(shadow)}return}if(part==='contacts'){target.contacts=Array.isArray(v)?v:[];return}if(part==='events'){target.events=Array.isArray(v)?v:[];return}if(part==='posts'){target.posts=Array.isArray(v)?v:[];return}if(part==='miniGames'){target.miniGames=v&&typeof v==='object'?v:{};return}if(part==='wardogs'){const raw=v&&typeof v==='object'&&!Array.isArray(v)?v:{schemaVersion:1,cards:[]};target.wardogs=window.mwsWardogsDataV119?.normalize?window.mwsWardogsDataV119.normalize(raw):raw;return}if(['activity','notebook','contactMeta','clipboard'].includes(part))Object.assign(target,v&&typeof v==='object'?v:{})}
  function freshSkeleton(){return{version:52,categories:[],contacts:[],events:[],posts:[],miniGames:{},collaborations:[],todayPeopleByDate:{},todayPeopleManualByDate:{},targetList:[],memos:[],favoriteFolders:[],patchNotes:[],suggestions:[],contactTags:[],contactTagBanners:{},emoticons:[],scheduleClipboard:[],timezones:[],achievementCards:[],gameLibrary:[],wardogs:{schemaVersion:1,cards:[]}}}
  function normalizeAndRender(reason){try{normalizeDataShape()}catch(_){try{normalizeMiniGameData()}catch(__){}}try{if(typeof mwsApplyDevicePrefs==='function')mwsApplyDevicePrefs(data)}catch(_){}document.body.dataset.theme=data.theme||'neon';document.body.classList.toggle('sidebar-pinned',Boolean(data.sidebarPinned));try{renderAll(reason)}catch(e){console.error('v1.1 render failed',e)}}

  async function fetchManifest(){const started=performance.now(),m=await fetchJson('/api/manifest',{},'Cloudflare 버전 확인');metrics.semanticResponseBytes+=byteLen(m);metric('manifest',{bytes:byteLen(m),backend:m.backend,ms:Math.round(performance.now()-started)});return m}
  async function fetchPart(part){const started=performance.now(),row=await fetchJson(`/api/parts/${encodeURIComponent(part)}`,{cache:'no-store'},`${part} 불러오기`);metrics.semanticResponseBytes+=byteLen(row);metrics.cacheMisses++;metric('part-fetch',{part,version:Number(row.version)||0,bytes:byteLen(row),ms:Math.round(performance.now()-started)});return row}
  async function loadPartWithCache(scope,part,serverManifest,{allowStale=true}={}){
    const wanted=Number(serverManifest?.parts?.[part])||0,cached=await getCachedPart(scope,part);
    if(serverManifest?.parts&&!ownSave(serverManifest.parts,part)){
      if(Number(cached?.version)>0)throw Error('서버 데이터가 없어 기존 캐시를 보호합니다: '+part);
      return{data:extractPart(part,freshSkeleton()),version:0,source:'absent'};
    }
    if(cached&&wanted>0&&Number(cached.version)===wanted){metrics.cacheHits++;return{data:cached.data,version:wanted,source:'cache'}}
    if(!serverManifest&&cached&&allowStale){metrics.cacheHits++;return{data:cached.data,version:Number(cached.version)||0,source:'cache-offline'}}
    const row=await fetchPart(part);if(!Number.isInteger(Number(row?.version))||!ownSave(row,'data')||(serverManifest&&Number(row.version)<wanted))throw Error('최신 서버 데이터 확인 실패: '+part);
    await putCachedPart(scope,part,row.version,row.data);return{data:row.data,version:Number(row.version),source:'network'};
  }

  async function hydrate(chosen){
    const generation=++hydrationSeq;hydrating=true;window.__mwsAppReadyV130=false;mode=chosen;
    loadedParts.clear();baselineJson.clear();dirtyParts.clear();lazyPartLoads.clear();manifest=null;draftBlocked=null;lastDraft=null;draftOrigin=null;
    const scope=chosen==='admin'?'admin':'public',required=chosen==='admin'?ALL_PARTS:INITIAL_PARTS;
    let serverManifest=null,offline=false;
    try{serverManifest=await fetchManifest();manifest=serverManifest}catch(e){offline=true;console.warn('Manifest unavailable; IndexedDB fallback',e)}
    try{
      if(chosen==='admin'&&offline)throw Error('관리자 편집은 최신 서버 버전 확인 후 가능합니다. 미저장 복구본은 그대로 보존됩니다.');
      const next=freshSkeleton();
      const results=await Promise.allSettled(required.map(part=>loadPartWithCache(scope,part,serverManifest,{allowStale:true})));
      if(generation!==hydrationSeq||mode!==chosen)throw Error('데이터 로딩이 취소되었습니다.');
      for(let i=0;i<required.length;i++){
        const part=required[i],result=results[i];let row=result.status==='fulfilled'?result.value:null;
        if(!row){const cached=await getCachedPart(scope,part);if(!cached||(serverManifest&&Number(cached.version)!==Number(serverManifest.parts?.[part])))throw Error('최신 데이터를 불러오지 못했습니다: '+part);row=cached}
        if(generation!==hydrationSeq||mode!==chosen)throw Error('데이터 로딩이 취소되었습니다.');
        mergePart(part,row.data,next);loadedParts.add(part);baselineJson.set(part,JSON.stringify(row.data));
        if(serverManifest?.parts)serverManifest.parts[part]=Number(row.version);
      }
      data=next;normalizeDataShape();const recovered=chosen==='admin'&&!offline?await recoverSaveDraft():false;
      normalizeAndRender(offline?'IndexedDB 오프라인 캐시':'Cloudflare D1 데이터');
      try{localStorage.removeItem('mawangSchedulerBeta')}catch(_){}
      applyModeUi();hideGate();const st=$('syncStatusText');if(st)st.textContent=offline?'오프라인 · 편집 저장 보류':'Cloudflare D1 동기화';
      metric('hydrate-complete',{scope,offline,loaded:[...loadedParts]});
      window.__mwsAppReadyV130=Boolean(chosen==='admin'&&currentAdmin&&!offline&&loadedParts.has('core')&&manifest?.parts);
      try{window.dispatchEvent(new CustomEvent('mws:app-ready',{detail:{scope,online:!offline,adminReady:window.__mwsAppReadyV130}}))}catch(_){}
      if(recovered&&dirtyParts.size){hydrating=false;queueCloudSave()}else if(draftBlocked)setSaveStatus('미저장 복구본 충돌 · 다운로드 후 확인',true);
    }catch(error){if(generation===hydrationSeq){loadedParts.clear();baselineJson.clear();dirtyParts.clear();window.__mwsAppReadyV130=false}throw error}finally{if(generation===hydrationSeq)hydrating=false}
  }
  async function ensurePartsForTab(tab){
    const extras=PARTS_BY_TAB[tab]||[];if(!extras.length)return true;
    const scope=mode==='admin'?'admin':'public',generation=hydrationSeq;let changed=false;
    if(!manifest){try{manifest=await fetchManifest()}catch(_){}}
    const results=await Promise.all(extras.map(async part=>{
      if(loadedParts.has(part))return true;
      if(!lazyPartLoads.has(part)){
        const loading=(async()=>{
          try{
            const row=await loadPartWithCache(scope,part,manifest,{allowStale:true});
            if(generation!==hydrationSeq||scope!==(mode==='admin'?'admin':'public'))return false;
            if(!loadedParts.has(part)){
              mergePart(part,row.data,data);loadedParts.add(part);baselineJson.set(part,JSON.stringify(row.data));
              if(manifest?.parts)manifest.parts[part]=Number(row.version);changed=true;
            }
            return true;
          }catch(e){console.error('Lazy part load failed',part,e);return false}
          finally{if(lazyPartLoads.get(part)===loading)lazyPartLoads.delete(part)}
        })();lazyPartLoads.set(part,loading);
      }
      return lazyPartLoads.get(part);
    }));
    if(changed){normalizeAndRender(`${tab} lazy data`);try{window.dispatchEvent(new CustomEvent('mws:parts-loaded',{detail:{tab,parts:[...extras]}}))}catch(_){}}
    if(results.some(ok=>!ok)){setSaveStatus(tab+' 데이터 로딩 실패',true);return false}
    return true;
  }
  window.mwsV55EnsureParts=ensurePartsForTab;window.mwsV55EnsureAllParts=()=>ensurePartsForTab('export');
  function installLazyTabBridge(){if(lazyBridgeInstalled||typeof window.setTab!=='function')return;lazyBridgeInstalled=true;const base=window.setTab;window.setTab=function(tab){const out=base.apply(this,arguments);Promise.resolve().then(()=>ensurePartsForTab(tab)).catch(()=>{});return out};try{setTab=window.setTab}catch(_){}const exportAll=$('exportAllBtn');if(exportAll&&!exportAll.dataset.v55Guard){exportAll.dataset.v55Guard='1';exportAll.addEventListener('click',e=>{if(loadedParts.size<ALL_PARTS.length){e.preventDefault();e.stopImmediatePropagation();ensurePartsForTab('export').then(ok=>{if(ok&&loadedParts.size===ALL_PARTS.length)exportAll.click();else try{toast('내보내기 실패','필수 데이터를 모두 불러오지 못했습니다.')}catch(_){}})}},true)}}


  // Authoritative per-part save queue and recoverable draft. No workspace schema changes.
  const SAVE_DRAFT_PREFIX='mws_save_outbox_v1:';
  let saveRun=null,saveRetryTimer=0,hydrationSeq=0,hydrating=false,draftDbPromise=null,draftWrites=Promise.resolve(),draftOrigin=null,draftBlocked=null,lastDraft=null;
  const lazyPartLoads=new Map();
  let draftTabId='';
  try{draftTabId=sessionStorage.getItem('mws_save_tab_v1')||crypto.randomUUID();sessionStorage.setItem('mws_save_tab_v1',draftTabId)}catch(_){draftTabId=String(Date.now())+'-'+Math.random().toString(36).slice(2)}
  const draftKey=()=>currentAdmin?.id!=null?SAVE_DRAFT_PREFIX+String(currentAdmin.id)+':'+draftTabId:'';
  const sameSaveValue=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
  const ownSave=(obj,key)=>Object.prototype.hasOwnProperty.call(obj||{},key);
  const plainSaveObject=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
  function mergeSaveChanges(base,local,remote,path=''){
    if(sameSaveValue(local,base))return {ok:true,value:remote};
    if(sameSaveValue(remote,base)||sameSaveValue(local,remote))return {ok:true,value:local};
    if(Array.isArray(base)&&Array.isArray(local)&&Array.isArray(remote)){
      const keyed=rows=>rows.every(x=>plainSaveObject(x)&&typeof x.id==='string'&&x.id)&&new Set(rows.map(x=>x.id)).size===rows.length;
      if(![base,local,remote].every(keyed))return {ok:false,path};
      const bm=new Map(base.map(x=>[x.id,x])),lm=new Map(local.map(x=>[x.id,x])),rm=new Map(remote.map(x=>[x.id,x])),values=new Map();
      const baseIds=base.map(x=>x.id),shared=baseIds.filter(id=>lm.has(id)&&rm.has(id));
      const order=rows=>rows.map(x=>x.id).filter(id=>shared.includes(id));
      const lo=order(local),ro=order(remote),bo=order(base);
      if(!sameSaveValue(lo,bo)&&!sameSaveValue(ro,bo)&&!sameSaveValue(lo,ro))return{ok:false,path:path+'.order'};
      for(const id of new Set([...bm.keys(),...lm.keys(),...rm.keys()])){
        const merged=mergeSaveChanges(bm.get(id),lm.get(id),rm.get(id),path+'['+id+']');
        if(!merged.ok)return merged;if(merged.value!==undefined)values.set(id,merged.value);
      }
      const preferred=!sameSaveValue(lo,bo)?local:remote;
      const ids=[...new Set([...preferred.map(x=>x.id),...local.map(x=>x.id),...remote.map(x=>x.id)])];
      return{ok:true,value:ids.filter(id=>values.has(id)).map(id=>values.get(id))};
    }
    if(plainSaveObject(base)&&plainSaveObject(local)&&plainSaveObject(remote)){
      const value=Object.create(null);
      for(const k of new Set([...Object.keys(base),...Object.keys(local),...Object.keys(remote)])){
        const result=mergeSaveChanges(ownSave(base,k)?base[k]:undefined,ownSave(local,k)?local[k]:undefined,ownSave(remote,k)?remote[k]:undefined,path+'.'+k);
        if(!result.ok)return result;if(result.value!==undefined)value[k]=result.value;
      }
      return{ok:true,value};
    }
    return{ok:false,path};
  }
  function openDraftDb(){
    if(draftDbPromise)return draftDbPromise;
    draftDbPromise=new Promise((resolve,reject)=>{
      if(!('indexedDB'in window)){reject(Error('draft database unavailable'));return}
      const req=indexedDB.open('mws_save_outbox_v1',1);
      req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('drafts'))req.result.createObjectStore('drafts',{keyPath:'key'})};
      req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);req.onblocked=()=>reject(Error('draft database blocked'));
    }).catch(error=>{draftDbPromise=null;throw error});
    return draftDbPromise;
  }
  async function draftTx(modeName,fn){
    const db=await openDraftDb();return new Promise((resolve,reject)=>{
      const tx=db.transaction('drafts',modeName),req=fn(tx.objectStore('drafts'));
      tx.oncomplete=()=>resolve(req?.result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
    });
  }
  function setSaveStatus(label,failed=false){
    const st=$('syncStatusText');if(st){st.textContent=label;st.dataset.mwsSaveState=failed?'failed':label.includes('저장 완료')?'saved':'pending'}
    const btn=$('mwsSidebarSaveBtn');if(btn)btn.title=label;
  }
  function showDraftExport(){
    const st=$('syncStatusText');if(!st||!st.parentElement||$('mwsPendingDraftExportV1'))return;
    const btn=document.createElement('button');btn.type='button';btn.id='mwsPendingDraftExportV1';btn.className='ghost';btn.textContent='미저장 복구본 다운로드';
    btn.onclick=()=>{const record=lastDraft||draftBlocked;if(!record)return;const url=URL.createObjectURL(new Blob([JSON.stringify(record,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='mws-unsaved-draft.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
    st.parentElement.appendChild(btn);
  }
  function persistSaveDraft(){
    const key=draftKey();if(!key||mode!=='admin')return;
    const parts={};for(const part of dirtyParts){if(!baselineJson.has(part))continue;parts[part]={base:JSON.parse(baselineJson.get(part)),local:extractPart(part),version:manifest?.parts?.[part]??null}}
    const blocked=draftBlocked?.parts||{};
    const record=(Object.keys(parts).length||Object.keys(blocked).length)?{key,updatedAt:Math.max(Date.now(),Number(lastDraft?.updatedAt||0)+1),parts,blocked}:null;lastDraft=record;
    let syncOk=false;try{if(record)localStorage.setItem(key,JSON.stringify(record));else localStorage.removeItem(key);syncOk=true}catch(_){}
    draftWrites=draftWrites.catch(()=>{}).then(()=>draftTx('readwrite',os=>record?os.put(record):os.delete(key))).catch(()=>{if(!syncOk&&record){setSaveStatus('미저장 데이터 · 브라우저 복구본 저장 실패',true);showDraftExport()}});
    if(!record){$('mwsPendingDraftExportV1')?.remove();if(draftOrigin){const origin=draftOrigin;draftOrigin=null;try{const raw=JSON.parse(localStorage.getItem(origin.key)||'null');if(raw?.updatedAt===origin.updatedAt)localStorage.removeItem(origin.key)}catch(_){}draftWrites=draftWrites.then(async()=>{const old=await draftTx('readonly',os=>os.get(origin.key));if(old?.updatedAt===origin.updatedAt)await draftTx('readwrite',os=>os.delete(origin.key))}).catch(()=>{})}}
  }
  async function readSaveDraft(){
    const key=draftKey();if(!key)return null;
    const prefix=SAVE_DRAFT_PREFIX+String(currentAdmin.id)+':',rows=new Map();
    const add=row=>{if(row?.key?.startsWith(prefix)&&plainSaveObject(row.parts)&&(Object.keys(row.parts).length||Object.keys(row.blocked||{}).length)&&(!rows.has(row.key)||Number(rows.get(row.key).updatedAt)<Number(row.updatedAt)))rows.set(row.key,row)};
    try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k?.startsWith(prefix))add(JSON.parse(localStorage.getItem(k)||'null'))}}catch(_){}
    try{for(const row of await draftTx('readonly',os=>os.getAll())||[])add(row)}catch(_){}
    if(rows.has(key))return rows.get(key);
    const other=[...rows.values()].sort((a,b)=>b.updatedAt-a.updatedAt)[0];
    if(other&&window.confirm('이전 탭에 남아 있는 미저장 변경사항이 있습니다. 서버 데이터와 충돌하지 않는 변경사항을 복구하시겠습니까?')){draftOrigin=other;return other}
    return null;
  }
  async function recoverSaveDraft(){
    if(mode!=='admin'||!currentAdmin||!manifest?.parts)return;
    draftBlocked=null;lastDraft=null;const draft=await readSaveDraft();if(!draft)return;
    const staged=[],blocked={...(draft.blocked||{})};
    for(const [part,row] of Object.entries(draft.parts)){
      if(!loadedParts.has(part)||!Number.isInteger(manifest.parts[part])){blocked[ownSave(blocked,part)?part+'#'+Date.now():part]=row;continue}
      const result=mergeSaveChanges(row.base,row.local,extractPart(part),part);
      if(!result.ok){if(ownSave(blocked,part)){blocked[part+'#'+Date.now()]=row}else blocked[part]=row;continue}
      staged.push([part,result.value]);
    }
    for(const [part,value] of staged)mergePart(part,value,data);
    if(Object.keys(blocked).length){draftBlocked={key:draft.key,updatedAt:draft.updatedAt,parts:blocked};lastDraft=draft;setSaveStatus('미저장 복구본 충돌 · 다운로드 후 확인',true);showDraftExport();try{toast('미저장 복구본','다른 변경과 충돌한 데이터는 덮어쓰지 않았습니다. 복구본을 다운로드해 보관하세요.')}catch(_){}}
    markDirty();persistSaveDraft();return true;
  }
  async function reconcileSaveVersions(parts,sent){
    const results=await Promise.all(parts.map(async part=>{try{return[part,await fetchPart(part,true)]}catch(e){if(e.status===404&&manifest.parts[part]===0)return[part,{version:0,data:JSON.parse(baselineJson.get(part))}];throw e}}));
    const staged=[];
    for(const [part,row] of results){
      if(!Number.isInteger(Number(row.version))||!ownSave(row,'data'))throw Error('최신 서버 버전을 확인하지 못했습니다: '+part);
      const base=JSON.parse(baselineJson.get(part)),local=extractPart(part),remote=row.data;
      const merged=mergeSaveChanges(ownSave(sent,part)&&sameSaveValue(remote,sent[part])?sent[part]:base,local,remote,part);
      if(!merged.ok){const error=Error('같은 항목이 다른 화면에서 변경되었습니다. 미저장 복구본을 보관하고 충돌 내용을 확인해 주세요: '+merged.path);error.conflict=true;throw error}
      staged.push([part,Number(row.version),remote,merged.value]);
    }
    for(const [part,version,remote,value] of staged){manifest.parts[part]=version;baselineJson.set(part,JSON.stringify(remote));mergePart(part,value,data);void putCachedPart('admin',part,version,remote)}
    markDirty();persistSaveDraft();normalizeAndRender('서버 변경사항 병합');
  }

  function markDirty(){
    if(mode!=='admin')return[];const changed=[];
    for(const part of loadedParts){const current=JSON.stringify(extractPart(part));if(current!==baselineJson.get(part)){dirtyParts.add(part);changed.push(part)}else dirtyParts.delete(part)}
    return changed;
  }
  function queueCloudSave(){
    if(mode!=='admin'||hydrating)return;clearTimeout(cloudSaveTimer);clearTimeout(saveRetryTimer);markDirty();persistSaveDraft();
    if(!dirtyParts.size){if(!saveRun&&!draftBlocked)setSaveStatus('Cloudflare D1 저장 완료');return;}
    if(!manifest?.parts){setSaveStatus('오프라인 · 미저장 복구본 보관 중',true);return}
    setSaveStatus(saveRun?'온라인 저장 중 · 추가 변경 대기':'변경사항 저장 대기');
    if(!saveRun)cloudSaveTimer=setTimeout(()=>writeCloudNow(false),250);
  }
  async function writeCloudNow(manual=false){
    if(mode!=='admin'||!currentAdmin||hydrating)return false;
    clearTimeout(cloudSaveTimer);clearTimeout(saveRetryTimer);
    if(saveRun)return saveRun;
    markDirty();persistSaveDraft();
    if(!dirtyParts.size){if(draftBlocked){setSaveStatus('미저장 복구본 충돌 · 다운로드 후 확인',true);return false}if(manual)try{toast('SAVE','변경된 데이터가 없습니다.')}catch(_){}return true}
    if(!manifest?.parts){setSaveStatus('온라인 연결 필요 · 미저장 복구본 보관 중',true);showDraftExport();return false}
    const generation=hydrationSeq;cloudSaving=true;
    saveRun=(async()=>{
      await Promise.resolve();let recoveries=0;
      try{
        while(dirtyParts.size){
          if(generation!==hydrationSeq||mode!=='admin')throw Error('저장 세션이 변경되었습니다.');
          const partsToSave=[...dirtyParts],payload={},expectedVersions={};
          for(const part of partsToSave){payload[part]=extractPart(part);const expected=Number(manifest?.parts?.[part]);if(!Number.isInteger(expected)||expected<0)throw Error('온라인 저장 기준 버전 확인 필요: '+part);expectedVersions[part]=expected}
          setSaveStatus('Cloudflare D1 저장 중');if(manual)setManualSaveProgress(28,'UPLOAD');
          let result;
          try{
            result=await fetchJson('/api/save',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({parts:payload,versions:expectedVersions}),timeout:60000},'Cloudflare 변경 데이터 저장');
            const versions=result?.versions||{},normalized=result?.normalized||{};
            for(const part of partsToSave){const v=Number(versions[part]);if(!Number.isInteger(v)||v<=expectedVersions[part]||!ownSave(normalized,part))throw Error('Cloudflare 저장 응답을 확인할 수 없습니다: '+part)}
          }catch(error){
            if((error.status===409||error.status>=500||!error.status)&&recoveries++<2){
              setSaveStatus('최신 서버 버전 확인 및 재시도');
              await reconcileSaveVersions(partsToSave,payload);
              if(dirtyParts.size)await new Promise(resolve=>setTimeout(resolve,350*recoveries));
              continue;
            }
            throw error;
          }
          if(generation!==hydrationSeq||mode!=='admin')throw Error('저장 세션이 변경되었습니다.');
          const versions=result.versions,normalized=result.normalized;
          for(const part of partsToSave){
            const local=extractPart(part),serverValue=normalized[part],version=Number(versions[part]);
            if(sameSaveValue(local,payload[part]))mergePart(part,serverValue,data);
            else{const merged=mergeSaveChanges(payload[part],local,serverValue,part);if(merged.ok)mergePart(part,merged.value,data)}
            manifest.parts[part]=version;baselineJson.set(part,JSON.stringify(serverValue));
            void putCachedPart('admin',part,version,serverValue);
          }
          markDirty();persistSaveDraft();recoveries=0;
        }
        if(draftBlocked){setSaveStatus('저장 완료 · 충돌 복구본 별도 확인',true);showDraftExport();return false}
        setSaveStatus('Cloudflare D1 저장 완료');if(manual)setManualSaveProgress(100,'SAVED');return true;
      }catch(error){
        markDirty();persistSaveDraft();setSaveStatus('온라인 저장 실패 · 미저장 변경 보관',true);showDraftExport();
        console.error('Cloudflare save failed',error);try{toast('온라인 저장 실패',error.message||String(error))}catch(_){}
        if(manual)setManualSaveProgress(0,'FAILED');return false;
      }finally{cloudSaving=false;saveRun=null}
    })();
    return saveRun;
  }
  window.mwsV55SaveNow=()=>writeCloudNow(true);
  window.addEventListener('online',()=>{if(mode==='admin'&&dirtyParts.size){if(manifest?.parts)queueCloudSave();else setSaveStatus('연결 복구 · 복구본을 보관했습니다. 새로고침 후 다시 저장해 주세요',true)}});
  function installSaveBridge(){
    const devicePersist=()=>{try{if(typeof mwsSaveDevicePrefs==='function')mwsSaveDevicePrefs(data)}catch(_){}if(mode==='admin')queueCloudSave();return true};
    try{persist=devicePersist;window.persist=devicePersist}catch(_){}
    const v55Save=function(reason='데이터 저장'){
      try{normalizeDataShape()}catch(_){try{normalizeMiniGameData()}catch(__){}}
      try{lastSyncReason=reason}catch(_){}
      try{if(typeof mwsSaveDevicePrefs==='function')mwsSaveDevicePrefs(data)}catch(_){}
      if(mode==='admin')queueCloudSave();
      try{renderAll(reason)}catch(e){console.error('render after save',e)}
      try{window.dispatchEvent(new CustomEvent('mawang:datachange',{detail:{reason}}))}catch(_){}
      if(mode==='admin'&&dirtyParts.size)setSaveStatus(saveRun?'온라인 저장 중 · 추가 변경 대기':'변경사항 저장 대기');
      return true;
    };
    try{saveData=v55Save;window.saveData=v55Save}catch(_){}
  }

  async function adminLogin(username,password){const result=await fetchJson('/api/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({username,password}),timeout:20000},'Admin 로그인');if(!result.authenticated)throw new Error('관리자 로그인 실패');currentAdmin=result.user||null;return result}
  async function logout(){window.__mwsAppReadyV130=false;try{await fetchJson('/api/auth/logout',{method:'POST'},'로그아웃')}catch(_){}currentAdmin=null}
  async function handleLogin(ev){ev.preventDefault();const chosen=$('mwsLoginForm')?.dataset.mode||'admin',btn=$('mwsLoginSubmit');if(btn)btn.disabled=true;setLoginError('');try{if(chosen==='admin'){const u=$('mwsLoginId')?.value.trim(),p=$('mwsLoginPw')?.value;if(!u||!p)throw new Error('Admin 아이디와 비밀번호를 입력해 주세요.');const result=await adminLogin(u,p);if(result.bootstrapped){try{toast('Admin 생성','Cloudflare D1에 최초 Admin 계정을 생성했습니다.')}catch(_){}}}else await logout();rememberChoice(chosen);await hydrate(chosen)}catch(e){setLoginError(e.message||String(e))}finally{if(btn)btn.disabled=false}}
  async function loadAdminList(){const list=$('mwsAdminList');if(!list)return;list.innerHTML='<div class="subtle">불러오는 중...</div>';try{const result=await fetchJson('/api/auth/admins',{},'Admin 목록');const rows=result.admins||[];list.innerHTML=rows.map((r,i)=>`<div class="mws-admin-row"><div><div style="font-weight:850">${typeof esc==='function'?esc(r.username):r.username}</div><small>${i===0?'초기 Admin':'추가 Admin'}</small></div><small>${new Date(r.created_at).toLocaleDateString('ko-KR')}</small></div>`).join('')||'<div class="subtle">Admin 계정이 없습니다.</div>'}catch(e){list.innerHTML=`<div class="mws-login-error">${typeof esc==='function'?esc(e.message):e.message}</div>`}}
  async function addAdmin(ev){ev.preventDefault();const msg=$('mwsAdminManageMsg');if(msg)msg.textContent='';const username=$('mwsNewAdminId')?.value.trim(),password=$('mwsNewAdminPw')?.value;try{const result=await fetchJson('/api/auth/admins',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({username,password})},'Admin 추가');$('mwsNewAdminId').value='';$('mwsNewAdminPw').value='';if(msg){msg.style.color='var(--ok)';msg.textContent=`${result.username} Admin 계정을 추가했습니다.`}await loadAdminList()}catch(e){if(msg){msg.style.color='var(--danger)';msg.textContent=e.message||String(e)}}}
  function setManualSaveProgress(percent,phase='SAVE'){const btn=$('mwsSidebarSaveBtn');if(!btn)return;const p=Math.max(0,Math.min(100,Math.round(Number(percent)||0)));btn.style.setProperty('--save-progress-v574',`${p}%`);const label=btn.querySelector('.sidebar-save-label-v572');if(label)label.textContent=p>=100?'SAVED 100%':phase==='FAILED'?'SAVE FAILED':`${phase} ${p}%`;if(p>=100)setTimeout(()=>{btn.style.removeProperty('--save-progress-v574');if(label)label.textContent='SAVE'},1100)}
  async function manualSave(){const btn=$('mwsSidebarSaveBtn');if(btn)btn.disabled=true;try{await writeCloudNow(true)}finally{if(btn)btn.disabled=false}}
  function bindUi(){$('mwsModeAdmin')?.addEventListener('click',()=>selectLoginMode('admin'));$('mwsModePublic')?.addEventListener('click',()=>selectLoginMode('public'));$('mwsLoginForm')?.addEventListener('submit',handleLogin);$('mwsSidebarSaveBtn')?.addEventListener('click',manualSave);$('mwsChangeModeBtn')?.addEventListener('click',async()=>{if(hydrating)return;if(mode==='admin'){markDirty();if((saveRun||dirtyParts.size)&&!(await writeCloudNow(true)))return;markDirty();if(dirtyParts.size)return}++hydrationSeq;clearTimeout(cloudSaveTimer);clearTimeout(saveRetryTimer);localStorage.removeItem(REMEMBER_KEY);localStorage.removeItem(MODE_KEY);mode=null;await logout();selectLoginMode('admin');showGate()});$('mwsAdminManageBtn')?.addEventListener('click',()=>{$('mwsAdminModal')?.classList.add('open');$('mwsAdminModal')?.setAttribute('aria-hidden','false');loadAdminList()});$('mwsAdminClose')?.addEventListener('click',()=>{$('mwsAdminModal')?.classList.remove('open');$('mwsAdminModal')?.setAttribute('aria-hidden','true')});$('mwsAddAdminForm')?.addEventListener('submit',addAdmin)}

  async function init(){await validateCacheSchema();installSaveBridge();bindUi();selectLoginMode('admin');try{await fetchJson('/api/health',{},'Cloudflare 상태 확인');const remember=localStorage.getItem(REMEMBER_KEY)==='1',preferred=localStorage.getItem(MODE_KEY);if(remember&&preferred==='public'){await hydrate('public');installLazyTabBridge();return}if(remember&&preferred==='admin'){const session=await fetchJson('/api/auth/session',{},'Admin 세션 확인');if(session.authenticated){currentAdmin=session.user;await hydrate('admin');installLazyTabBridge();return}}showGate();installLazyTabBridge()}catch(e){console.error('Mawang v1.1 init',e);setLoginError('Cloudflare 연결 실패: '+(e.message||String(e)));showGate();installLazyTabBridge()}}

  try{window.mwsApplyAppVersionV120?.()}catch(_){}
  window.addEventListener('mws:v55-features-ready',installLazyTabBridge,{once:true});
  const initPromise=init();
  window.__mwsCloudV110Loaded=true;
  window.__mwsCloudRuntimeV130Ready=true;
  window.__mwsCloudRuntimeV130InitPromise=initPromise;
  try{window.dispatchEvent(new Event('mws:cloud-runtime-v130-ready'))}catch(_){}
})();
