import authWorker from './cf-v120-friend.js';
import {handleSoopContactRoute} from './soop-contact-autofill-v1.js';

const APP_VERSION='1.4.0';
const DISPLAY_VERSION='1.6.21';
const APP_LABEL=`Mawang Scheduler v ${DISPLAY_VERSION}`;
const BUILD_LABEL=`MWS V ${APP_VERSION}`;

function normalizeVersionHtml(html){
  let out=String(html||'');
  out=out.replace(/data-build-version=["'][^"']*["']/i,`data-build-version="${BUILD_LABEL}"`);
  out=out.replace(/(<div\s+id=["']mwsBuildVersion["'][^>]*>)[\s\S]*?(<\/div>)/i,`$1${APP_LABEL}$2`);

  /* Heavy UI/runtime modules must never execute on the login screen. */
  const deferred=[
    'perf-runtime\\.js',
    'test-v5\\.5\\.js',
    'test-v5\\.6\\.js',
    'device-ui\\.js'
  ];
  for(const file of deferred){
    const re=new RegExp(`<script\\s+src=["']assets\\/${file}(?:\\?[^"']*)?["']><\\/script>`,`gi`);
    out=out.replace(re,'');
  }
  if(!out.includes('post-login-runtime-v130.js')){
    out=out.replace(/<\/body>/i,'<script src="assets/post-login-runtime-v130.js?v=1.4.0-phase176-workspace-ui&save-queue-v2=1&workspace-nav-v1=1&hall-v3=1&firstpaint-guard=1&achievement-cache-read=2&contactgroup178=1&modalmotionv2=1&shell-perf=1&career=1&firstpaint=1&peoplehover=1&dashboardnav=1&notebook-tools=1&contact-frequency=1&sidebar-stable=1&mawang-archive=1&request-budget=6"></script>\n</body>');
  }
  return out;
}

function normalizeCloudCore(js){
  let out=String(js||'');

  /* Repair the legacy source typo that was previously hidden by the old inline loader. */
  out=out.replace(
    "Math.max(0,Math.min(100,Math.round(Number(percent)||0));",
    "Math.max(0,Math.min(100,Math.round(Number(percent)||0)));"
  );

  /* One authoritative cache name. Do not remap IndexedDB from another loader. */
  out=out.replace("const CACHE_DB='mawang_data';","const CACHE_DB='mawang_data_v130';");

  /* Achievement cards are part of the authoritative cloud core. The legacy runtime
     did not know this field, so dirty detection and /api/save silently ignored it. */
  out=out.replace(
    "const CORE_KEYS=['version','categories','dashboardNoticeUrl','selfContactId','timezones','contentGroups'];",
    "const CORE_KEYS=['version','categories','dashboardNoticeUrl','selfContactId','timezones','contentGroups','achievementCards'];"
  );
  out=out.replace(
    "const CORE_KEYS=['version','categories','dashboardNoticeUrl','selfContactId','timezones','achievementCards'];",
    "const CORE_KEYS=['version','categories','dashboardNoticeUrl','selfContactId','timezones','achievementCards','contentGroups'];"
  );
  out=out.replace(
    "function mergePart(part,value,target=data){const v=clone(value);if(part==='core'){Object.assign(target,v||{});return}",
    "function mergePart(part,value,target=data){const v=clone(value);if(part==='core'){const hadAchievements=Boolean(v&&typeof v==='object'&&Object.prototype.hasOwnProperty.call(v,'achievementCards'));Object.assign(target,v||{});if(!hadAchievements){const shadow=window.mwsLoadAchievementShadowV1621?.();if(Array.isArray(shadow)&&shadow.length)target.achievementCards=clone(shadow)}return}"
  );
  out=out.replace(
    "function freshSkeleton(){return{version:52,categories:[],contacts:[],events:[],posts:[],miniGames:{},collaborations:[],todayPeopleByDate:{},todayPeopleManualByDate:{},targetList:[],memos:[],favoriteFolders:[],contactTags:[],contactTagBanners:{},emoticons:[],scheduleClipboard:[],timezones:[]}}",
    "function freshSkeleton(){return{version:52,categories:[],contacts:[],events:[],posts:[],miniGames:{},collaborations:[],todayPeopleByDate:{},todayPeopleManualByDate:{},targetList:[],memos:[],favoriteFolders:[],contactTags:[],contactTagBanners:{},emoticons:[],scheduleClipboard:[],timezones:[],achievementCards:[]}}"
  );

  /* Data hydration must not control whether authentication is considered successful. */
  out=out.replace("applyModeUi();hideGate();const st=$('syncStatusText');","applyModeUi();const st=$('syncStatusText');");

  const marker="  async function adminLogin(username,password){";
  if(out.includes(marker)&&!out.includes('function enterAppShell(chosen)')){
    const bridge=`  function enterAppShell(chosen){\n    mode=chosen;\n    window.__mwsAppReadyV130=false;\n    applyModeUi();\n    document.body.classList.add('mws-app-loading');\n    const submit=$('mwsLoginSubmit');\n    if(submit)submit.disabled=true;\n    setLoginError('로그인 완료 · 데이터를 불러오는 중입니다.');\n    const st=$('syncStatusText');\n    if(st)st.textContent='로그인 완료 · 데이터 불러오는 중';\n    try{window.dispatchEvent(new CustomEvent('mws:auth-granted',{detail:{mode:chosen,user:currentAdmin||null}}))}catch(_){}\n  }\n  function revealReadyShell(){\n    document.body.classList.remove('mws-app-loading');\n    const submit=$('mwsLoginSubmit');\n    if(submit)submit.disabled=false;\n    setLoginError('');\n    hideGate();\n  }\n  function markAppReady(chosen,degraded=false){\n    if(chosen==='admin'&&window.__mwsAppReadyV130!==true)throw Error('관리자 필수 데이터 준비 실패');\n    window.__mwsAppReadyV130=chosen!=='admin'||window.__mwsAppReadyV130===true;\n    const generation=hydrationSeq;\n    let released=false,timer=0;\n    const reveal=()=>{\n      if(released)return;\n      released=true;clearTimeout(timer);\n      window.removeEventListener('mws:post-login-ui-ready',reveal);\n      if(generation===hydrationSeq&&mode===chosen&&window.__mwsAppReadyV130===true)revealReadyShell();\n    };\n    if(window.__mwsPostLoginUiReadyV130)reveal();\n    else{\n      window.addEventListener('mws:post-login-ui-ready',reveal,{once:true});\n      timer=setTimeout(reveal,6000);\n    }\n    try{window.dispatchEvent(new CustomEvent('mws:app-ready',{detail:{mode:chosen,scope:chosen==='admin'?'admin':'public',online:Boolean(manifest),adminReady:chosen==='admin'&&window.__mwsAppReadyV130===true,user:currentAdmin||null,degraded:Boolean(degraded)}}))}catch(_){}\n  }\n  async function startHydration(chosen){\n    try{\n      await hydrate(chosen);\n      installLazyTabBridge();\n      markAppReady(chosen,false);\n    }catch(error){\n      console.error('Mawang data hydration failed after authentication',error);\n      loadedParts.clear();\n      baselineJson.clear();\n      dirtyParts.clear();\n      document.body.classList.remove('mws-app-loading');\n      const submit=$('mwsLoginSubmit');\n      if(submit)submit.disabled=false;\n      const st=$('syncStatusText');\n      if(st)st.textContent='로그인 완료 · 필수 데이터 로딩 실패';\n      try{applyModeUi()}catch(_){}\n      try{selectLoginMode(chosen)}catch(_){}\n      showGate();\n      setLoginError('로그인에는 성공했지만 필수 데이터를 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.');\n      try{window.dispatchEvent(new CustomEvent('mws:app-data-error',{detail:{mode:chosen,message:error?.message||String(error)}}))}catch(_){}\n    }\n  }\n\n`;
    out=out.replace(marker,bridge+marker);
  }

  out=out.replace(
    "rememberChoice(chosen);await hydrate(chosen)",
    "rememberChoice(chosen);enterAppShell(chosen);void startHydration(chosen)"
  );

  out=out.replace(
    "async function init(){await validateCacheSchema();installSaveBridge();bindUi();selectLoginMode('admin');try{await fetchJson('/api/health',{},'Cloudflare 상태 확인');const remember=",
    "async function init(){installSaveBridge();bindUi();selectLoginMode('admin');try{await validateCacheSchema();const remember="
  );
  out=out.replace(
    "if(remember&&preferred==='public'){await hydrate('public');installLazyTabBridge();return}",
    "if(remember&&preferred==='public'){enterAppShell('public');void startHydration('public');return}"
  );
  out=out.replace(
    "if(session.authenticated){currentAdmin=session.user;await hydrate('admin');installLazyTabBridge();return}",
    "if(session.authenticated){currentAdmin=session.user;enterAppShell('admin');void startHydration('admin');return}"
  );

  // The actual readiness event is emitted once by markAppReady after hydration and mode validation.
  out=out.replace(
    "try{window.dispatchEvent(new CustomEvent('mws:app-ready',{detail:{scope,online:!offline,adminReady:window.__mwsAppReadyV130}}))}catch(_){}",
    ""
  );

  /* Public-first entry: the HTML shell is visible before authentication. Keep the
     existing server authorization and save lifecycle; only the explicit Admin
     action opens the credential form. A remembered cookie is verified server-side. */
  out=out.replace("const isAdmin=mode==='admin';document.body.classList.toggle", "const isAdmin=mode==='admin'&&Boolean(currentAdmin);document.body.classList.toggle");
  out=out.replace("if($('mwsAdminManageBtn'))", "if($('mwsChangeModeBtn'))$('mwsChangeModeBtn').textContent=isAdmin?'로그아웃':'관리자 로그인';if($('mwsAdminManageBtn'))");
  out=out.replace("admin?'Admin 로그인':'Public 입장'", "admin?'로그인':'Public 입장'");
  out=out.replace("    applyModeUi();\n    document.body.classList.add('mws-app-loading');", "    if(chosen==='public')applyModeUi();\n    setEntryBusy(true);\n    document.body.classList.add('mws-app-loading');");
  out=out.replace("    hideGate();\n  }\n  function markAppReady", "    hideGate();\n    setEntryBusy(false);\n  }\n  function markAppReady");
  out=out.replace("      showGate();\n      setLoginError('로그인에는 성공했지만 필수 데이터를 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.');", `      if(chosen==='admin'){
        currentAdmin=null;mode='public';applyModeUi();hideGate();
        try{toast('관리자 복원 실패','Public으로 접속합니다. 관리자 로그인을 다시 시도해 주세요.')}catch(_){}
        enterAppShell('public');await startHydration('public');return;
      }
      // No credential prompt for a public network failure. Retain the inert
      // shell, do not promote stale data to ready, and explain how to retry.
      mode='public';currentAdmin=null;applyModeUi();hideGate();
      document.body.classList.add('mws-app-loading');setEntryBusy(true);
      if(st)st.textContent='데이터 로딩 실패 · 새로고침 후 다시 시도해 주세요';`);
  const publicEntry=`  let accessBusy=false;
  function setEntryBusy(busy){
    const app=document.querySelector('.app');if(app)app.inert=busy;
    const button=$('mwsChangeModeBtn');if(button)button.disabled=busy;
    const manage=$('mwsAdminManageBtn');if(manage)manage.disabled=busy;
  }
  function closeAdminLogin(){
    if(accessBusy||hydrating||!window.__mwsAppReadyV130)return;
    const pw=$('mwsLoginPw');if(pw)pw.value='';
    setLoginError('');hideGate();setEntryBusy(false);$('mwsChangeModeBtn')?.focus();
  }
  function openAdminLogin(){
    if(accessBusy||hydrating||!window.__mwsAppReadyV130)return;
    selectLoginMode('admin');setEntryBusy(true);showGate();$('mwsLoginId')?.focus();
  }
  async function changeAccessMode(){
    if(accessBusy||hydrating||!window.__mwsAppReadyV130)return;
    if(mode!=='admin'){openAdminLogin();return}
    accessBusy=true;setEntryBusy(true);
    try{
      markDirty();if((saveRun||dirtyParts.size||draftBlocked)&&!(await writeCloudNow(true)))return;
      markDirty();if(dirtyParts.size||draftBlocked)return;
      // Only a confirmed server logout can switch to Public. Keep Admin and
      // its unsaved recovery state untouched if logout or saving fails.
      await fetchJson('/api/auth/logout',{method:'POST'},'로그아웃');
      ++hydrationSeq;clearTimeout(cloudSaveTimer);clearTimeout(saveRetryTimer);
      try{localStorage.removeItem(REMEMBER_KEY);localStorage.removeItem(MODE_KEY)}catch(_){}
      currentAdmin=null;mode='public';enterAppShell('public');await startHydration('public');
    }catch(error){try{toast('로그아웃 실패',error.message||String(error))}catch(_){}}
    finally{accessBusy=false;if(window.__mwsAppReadyV130)setEntryBusy(false)}
  }
  async function handleLogin(ev){
    ev.preventDefault();if(accessBusy||hydrating||!window.__mwsAppReadyV130||$('mwsAccessGate')?.classList.contains('hidden'))return;
    const btn=$('mwsLoginSubmit');if(btn)btn.disabled=true;accessBusy=true;setLoginError('');
    try{
      const u=$('mwsLoginId')?.value.trim(),p=$('mwsLoginPw')?.value;
      if(!u||!p)throw Error('관리자 아이디와 비밀번호를 입력해 주세요.');
      const result=await adminLogin(u,p);if(!currentAdmin)throw Error('관리자 세션을 확인하지 못했습니다.');
      if($('mwsLoginPw'))$('mwsLoginPw').value='';
      if(result.bootstrapped){try{toast('Admin 생성','Cloudflare D1에 최초 Admin 계정을 생성했습니다.')}catch(_){}}
      try{rememberChoice('admin')}catch(_){}
      enterAppShell('admin');await startHydration('admin');
    }catch(error){setLoginError(error.message||String(error))}
    finally{accessBusy=false;if(btn)btn.disabled=false}
  }
  async function init(){
    installSaveBridge();bindUi();selectLoginMode('admin');mode='public';applyModeUi();setEntryBusy(true);
    const cache=validateCacheSchema().catch(()=>{});
    let chosen='public',remembered=false;
    try{remembered=localStorage.getItem(REMEMBER_KEY)==='1'&&localStorage.getItem(MODE_KEY)==='admin'}catch(_){}
    if(remembered){
      try{
        const session=await fetchJson('/api/auth/session',{timeout:4000},'Admin 세션 확인');
        if(session?.authenticated===true&&session.user){currentAdmin=session.user;chosen='admin'}
        else{try{localStorage.removeItem(REMEMBER_KEY);localStorage.removeItem(MODE_KEY)}catch(_){}}
      }catch(_){currentAdmin=null}
    }
    await cache;enterAppShell(chosen);await startHydration(chosen);
  }
`;
  // Replace only the two access lifecycle functions in either supported core.
  const loginStart=out.indexOf('  async function handleLogin(ev){'),loginEnd=out.indexOf('  async function loadAdminList(',loginStart);
  if(loginStart>=0&&loginEnd>loginStart)out=out.slice(0,loginStart)+publicEntry+out.slice(loginEnd);
  out=out.replace(/  async function init\(\)\{[^\n]*\}\n(?=\n)/g,match=>match.includes('validateCacheSchema')&&match.includes('showGate()')?'':match);
  const modeBind=out.indexOf("$('mwsChangeModeBtn')?.addEventListener('click',async()=>"),manageBind=out.indexOf("$('mwsAdminManageBtn')?.addEventListener",modeBind);
  if(modeBind>=0&&manageBind>modeBind)out=out.slice(0,modeBind)+"$('mwsChangeModeBtn')?.addEventListener('click',changeAccessMode);$('mwsLoginClose')?.addEventListener('click',closeAdminLogin);$('mwsLoginBack')?.addEventListener('click',closeAdminLogin);$('mwsAccessGate')?.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();closeAdminLogin()}else if(e.key==='Tab'){const items=[...$('mwsAccessGate').querySelectorAll('button:not([disabled]),input:not([disabled])')].filter(el=>el.getClientRects().length);if(e.shiftKey&&document.activeElement===items[0]){e.preventDefault();items.at(-1)?.focus()}else if(!e.shiftKey&&document.activeElement===items.at(-1)){e.preventDefault();items[0]?.focus()}}});"+out.slice(manageBind);

  /* Phase 7: a save acknowledgement may only advance the baseline to the payload that the server accepted.
     Edits made while /api/save is in flight must remain dirty and must never be overwritten by normalization. */
  out=out.replace(
    "const payload={};for(const part of partsToSave)payload[part]=extractPart(part);if(manual)setManualSaveProgress(28,'UPLOAD');",
    "const payload={};for(const part of partsToSave)payload[part]=extractPart(part);const sentJson=new Map(partsToSave.map(part=>[part,JSON.stringify(payload[part])]));if(manual)setManualSaveProgress(28,'UPLOAD');"
  );
  out=out.replace(
    "const versions=result.versions||{},normalized=result.normalized||{};mergeNormalizedResult(normalized);if(manifest?.parts)for(const[part,version]of Object.entries(versions))manifest.parts[part]=Number(version)||manifest.parts[part];for(const part of partsToSave){const value=extractPart(part),version=Number(versions[part])||Number(manifest?.parts?.[part])||0;baselineJson.set(part,JSON.stringify(value));dirtyParts.delete(part);await putCachedPart('admin',part,version,value)}",
    "const versions=result.versions||{},normalized=result.normalized||{};if(manifest?.parts)for(const[part,version]of Object.entries(versions))manifest.parts[part]=Number(version)||manifest.parts[part];for(const part of partsToSave){const version=Number(versions[part])||Number(manifest?.parts?.[part])||0;const sentValue=payload[part];const hasNormalized=Object.prototype.hasOwnProperty.call(normalized,part)&&normalized[part]!==undefined;const serverValue=hasNormalized?normalized[part]:sentValue;const changedAfterSend=JSON.stringify(extractPart(part))!==sentJson.get(part);if(!changedAfterSend&&hasNormalized)mergePart(part,serverValue,data);baselineJson.set(part,JSON.stringify(serverValue));await putCachedPart('admin',part,version,serverValue)}markDirty();"
  );

  /* Phase 8: changing access mode is a lifecycle boundary. Flush every Admin edit before logout. */
  out=out.replace(
    "$('mwsChangeModeBtn')?.addEventListener('click',async()=>{localStorage.removeItem(REMEMBER_KEY);localStorage.removeItem(MODE_KEY);mode=null;await logout();selectLoginMode('admin');showGate()})",
    "$('mwsChangeModeBtn')?.addEventListener('click',async()=>{if(mode==='admin'){clearTimeout(cloudSaveTimer);const deadline=Date.now()+65000;while(cloudSaving&&Date.now()<deadline)await new Promise(resolve=>setTimeout(resolve,50));clearTimeout(cloudSaveTimer);if(cloudSaving){try{toast('모드 변경 보류','온라인 저장이 끝나지 않아 모드를 변경하지 않았습니다.')}catch(_){}return}markDirty();if(dirtyParts.size&&!(await writeCloudNow(true)))return}localStorage.removeItem(REMEMBER_KEY);localStorage.removeItem(MODE_KEY);mode=null;await logout();selectLoginMode('admin');showGate()})"
  );

  /* Phase 9: lazy-load failure must be observable and export must never self-retry forever. */
  out=out.replace(
    "async function ensurePartsForTab(tab){const extras=PARTS_BY_TAB[tab]||[];if(!extras.length)return true;const scope=mode==='admin'?'admin':'public';if(!manifest){try{manifest=await fetchManifest()}catch(_){}}let changed=false;for(const part of extras){if(loadedParts.has(part))continue;try{const row=await loadPartWithCache(scope,part,manifest,{allowStale:true});mergePart(part,row.data,data);loadedParts.add(part);baselineJson.set(part,JSON.stringify(row.data));changed=true}catch(e){console.error('Lazy part load failed',part,e)}}if(changed)normalizeAndRender(`${tab} lazy data`);return true}",
    "async function ensurePartsForTab(tab){const extras=PARTS_BY_TAB[tab]||[];if(!extras.length)return true;const scope=mode==='admin'?'admin':'public';if(!manifest){try{manifest=await fetchManifest()}catch(_){}}let changed=false,failed=[];for(const part of extras){if(loadedParts.has(part))continue;try{const row=await loadPartWithCache(scope,part,manifest,{allowStale:true});mergePart(part,row.data,data);loadedParts.add(part);baselineJson.set(part,JSON.stringify(row.data));changed=true}catch(e){failed.push(part);console.error('Lazy part load failed',part,e)}}if(changed)normalizeAndRender(`${tab} lazy data`);if(failed.length){const st=$('syncStatusText');if(st)st.textContent=tab+' 데이터 로딩 실패: '+failed.join(', ');return false}return true}"
  );
  out=out.replace(
    "ensurePartsForTab('export').then(()=>exportAll.click())",
    "ensurePartsForTab('export').then(ok=>{if(ok&&loadedParts.size===ALL_PARTS.length)exportAll.click();else{try{toast('내보내기 실패','필수 데이터를 모두 불러오지 못했습니다.')}catch(_){}}})"
  );

  /* Phase 15: every save carries the baseline part versions so stale Admin screens cannot overwrite newer data. */
  out=out.replace(
    "body:JSON.stringify({parts:payload}),timeout:60000",
    "body:JSON.stringify({parts:payload,versions:Object.fromEntries(partsToSave.map(part=>[part,Number(manifest?.parts?.[part])||0]))}),timeout:60000"
  );

  /* Old core version text must not fight app-version-v120.js. */
  out=out.replace(
    "document.body.dataset.buildVersion='Mawang Scheduler v.1.1.0';const versionLabel=document.querySelector('.sidebar-build-version-v53');if(versionLabel)versionLabel.textContent='Mawang Scheduler v.1.1.0';",
    "try{window.mwsApplyAppVersionV120?.()}catch(_){};"
  );
  return out;
}

function normalizeBossRaidHtml(html){
  let out=String(html||'');

  out=out.replace(
    /(<strong\b[^>]*\bid=["']bossHpText["'][^>]*>)\s*100\s*\/\s*100\s*(<\/strong>)/i,
    (_,open,close)=>`${open}500 / 500${close}`
  );

  out=out.replace(
    /(const\s+bossState\s*=\s*\{[\s\S]*?\bmaxHealth\s*:\s*)100\b/,
    (_,prefix)=>`${prefix}500`
  );
  out=out.replace(
    /(const\s+bossState\s*=\s*\{[\s\S]*?\bhealth\s*:\s*)100\b/,
    (_,prefix)=>`${prefix}500`
  );

  if(!out.includes('window.mwsBossRaidSetMaxHealth')){
    out=out.replace(
      /(const\s+bossState\s*=\s*\{[\s\S]*?\blastAttacker\s*:\s*['"][^'"]*['"][\s\S]*?\};)/,
      `$1\n  window.mwsBossRaidSetMaxHealth = function(value) {\n    const numeric = Math.floor(Number(value));\n    const hp = Number.isFinite(numeric) && numeric >= 1 ? Math.min(1000000,numeric) : 500;\n    applyBossSettings(hp);\n    return hp;\n  };\n  window.mwsBossRaidGetHealthState = function() {\n    return {maxHealth:bossState.maxHealth,health:bossState.health,running:bossState.running,finished:bossState.finished};\n  };`
    );
  }

  out=out.replaceAll('Number(bossState.maxHealth)||100','Number(bossState.maxHealth)||500');
  out=out.replaceAll('Number(maxHealth)||100','Number(maxHealth)||500');
  return out;
}

function normalizeBossScript(js){
  return String(js||'')
    .replaceAll("if(id==='boss-default'&&hp===100)hp=DEFAULT_HP;",'')
    .replaceAll('if(id==="boss-default"&&hp===100)hp=DEFAULT_HP;','');
}

function textResponse(response,text,extraHeaders={}){
  const headers=new Headers(response.headers);
  headers.delete('content-length');
  headers.set('cache-control','no-store');
  for(const [key,value] of Object.entries(extraHeaders))headers.set(key,value);
  return new Response(text,{status:response.status,statusText:response.statusText,headers});
}

async function serveAsset(env,request,path){
  const target=new URL(path,request.url);
  return env.ASSETS.fetch(new Request(target.toString(),{method:'GET',headers:request.headers}));
}

export default {
  async fetch(request, env, ctx) {
    const url=new URL(request.url);

    if(url.pathname==='/api/soop/contact-station'||url.pathname==='/api/soop/contact-avatar'){
      return handleSoopContactRoute(request);
    }

    if(request.method==='GET'&&(url.pathname==='/majoku-castle'||url.pathname==='/majoku-castle.html')){
      const response=await serveAsset(env,request,'/majoku-castle.html');
      if(response.status!==200)return response;
      const raw=await response.text();
      const html=normalizeBossRaidHtml(raw);
      const bridgeOk=html.includes('window.mwsBossRaidSetMaxHealth');
      return textResponse(response,html,{
        'x-mws-boss-hp-default':'500',
        'x-mws-boss-hp-configurable':'true',
        'x-mws-boss-hp-bridge':bridgeOk?'ok':'missing'
      });
    }

    if(request.method==='GET'&&(url.pathname==='/assets/boss-manager-v121.js'||url.pathname==='/assets/boss-raid-v116.js')){
      const response=await serveAsset(env,request,url.pathname);
      if(response.status!==200)return response;
      return textResponse(response,normalizeBossScript(await response.text()),{'x-mws-boss-hp-policy':'configurable-default-500'});
    }

    if(request.method==='GET'&&url.pathname==='/assets/cloud-v1.1.js'){
      const response=await serveAsset(env,request,'/assets/cloud-v1.1.js');
      if(response.status!==200)return response;
      const patched=normalizeCloudCore(await response.text());
      return textResponse(response,patched,{
        'x-mws-auth-boundary':'decoupled-v130',
        'x-mws-cache-db':'mawang_data_v130',
        'x-mws-achievement-core':patched.includes("'achievementCards'")?'enabled':'missing'
      });
    }

    if(request.method==='GET'&&url.pathname==='/assets/cloud-runtime-v130.js'){
      const response=await serveAsset(env,request,'/assets/cloud-runtime-v130.js');
      if(response.status!==200)return response;
      const patched=normalizeCloudCore(await response.text());
      return textResponse(response,patched,{
        'x-mws-auth-boundary':'decoupled-v130',
        'x-mws-cache-db':'mawang_data_v130',
        'x-mws-runtime-stage':'cloud-runtime-v130'
      });
    }

    if(url.pathname==='/assets/cloud-v5.5.js'){
      const replacement=new URL('/assets/cloud-v1.1-loader.js?v=1.3.0-auth-decoupled&clipboard-first-v1=1&save-queue-v2=1&request-budget=6',request.url);
      const response=await env.ASSETS.fetch(new Request(replacement.toString(),{method:'GET',headers:request.headers}));
      const source=await response.text();
      const patched=source.replace('app-version-v120.js?v=1.3.0','app-version-v120.js?v=1.4.0-phase73');
      const headers=new Headers(response.headers);
      headers.delete('content-length');
      headers.set('cache-control','no-store');
      headers.set('x-mws-runtime','v1.4.0-version-owner');
      headers.set('x-mws-image-policy','original-bytes-no-reencode');
      return new Response(patched,{status:response.status,statusText:response.statusText,headers});
    }

    const response=await authWorker.fetch(request,env,ctx);
    if(request.method!=='GET'||response.status!==200)return response;

    if(url.pathname!=='/'&&url.pathname!=='/index.html')return response;
    const contentType=response.headers.get('content-type')||'';
    if(!contentType.toLowerCase().includes('text/html'))return response;

    const html=normalizeVersionHtml(await response.text());
    const headers=new Headers(response.headers);
    headers.delete('content-length');
    headers.set('cache-control','no-store, max-age=0');
    headers.set('x-mws-app-version',APP_VERSION);
    headers.set('x-mws-auth-boundary','decoupled-v130');
    return new Response(html,{status:response.status,statusText:response.statusText,headers});
  },
};
