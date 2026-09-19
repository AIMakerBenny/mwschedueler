import authWorker from './cf-v120-friend.js';

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
    out=out.replace(/<\/body>/i,'<script src="assets/post-login-runtime-v130.js?v=1.4.0-phase86"></script>\n</body>');
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

  /* Data hydration must not control whether authentication is considered successful. */
  out=out.replace("applyModeUi();hideGate();const st=$('syncStatusText');","applyModeUi();const st=$('syncStatusText');");

  const marker="  async function adminLogin(username,password){";
  if(out.includes(marker)&&!out.includes('function enterAppShell(chosen)')){
    const bridge=`  function enterAppShell(chosen){\n    mode=chosen;\n    window.__mwsAppReadyV130=false;\n    applyModeUi();\n    document.body.classList.add('mws-app-loading');\n    const submit=$('mwsLoginSubmit');\n    if(submit)submit.disabled=true;\n    setLoginError('로그인 완료 · 데이터를 불러오는 중입니다.');\n    const st=$('syncStatusText');\n    if(st)st.textContent='로그인 완료 · 데이터 불러오는 중';\n    try{window.dispatchEvent(new CustomEvent('mws:auth-granted',{detail:{mode:chosen,user:currentAdmin||null}}))}catch(_){}\n  }\n  function revealReadyShell(){\n    document.body.classList.remove('mws-app-loading');\n    const submit=$('mwsLoginSubmit');\n    if(submit)submit.disabled=false;\n    setLoginError('');\n    hideGate();\n  }\n  function markAppReady(chosen,degraded=false){\n    window.__mwsAppReadyV130=true;\n    const reveal=()=>revealReadyShell();\n    if(window.__mwsPostLoginUiReadyV130)reveal();\n    else window.addEventListener('mws:post-login-ui-ready',reveal,{once:true});\n    try{window.dispatchEvent(new CustomEvent('mws:app-ready',{detail:{mode:chosen,user:currentAdmin||null,degraded:Boolean(degraded)}}))}catch(_){}\n  }\n  async function startHydration(chosen){\n    try{\n      await hydrate(chosen);\n      installLazyTabBridge();\n      markAppReady(chosen,false);\n    }catch(error){\n      console.error('Mawang data hydration failed after authentication',error);\n      loadedParts.clear();\n      baselineJson.clear();\n      dirtyParts.clear();\n      document.body.classList.remove('mws-app-loading');\n      const submit=$('mwsLoginSubmit');\n      if(submit)submit.disabled=false;\n      const st=$('syncStatusText');\n      if(st)st.textContent='로그인 완료 · 필수 데이터 로딩 실패';\n      try{applyModeUi()}catch(_){}\n      try{selectLoginMode(chosen)}catch(_){}\n      showGate();\n      setLoginError('로그인에는 성공했지만 필수 데이터를 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.');\n      try{window.dispatchEvent(new CustomEvent('mws:app-data-error',{detail:{mode:chosen,message:error?.message||String(error)}}))}catch(_){}\n    }\n  }\n\n`;
    out=out.replace(marker,bridge+marker);
  }

  out=out.replace(
    "rememberChoice(chosen);await hydrate(chosen)",
    "rememberChoice(chosen);enterAppShell(chosen);void startHydration(chosen)"
  );

  out=out.replace(
    "async function init(){await validateCacheSchema();installSaveBridge();bindUi();selectLoginMode('admin');try{await fetchJson('/api/health',{},'Cloudflare 상태 확인');const remember=",
    "async function init(){installSaveBridge();bindUi();selectLoginMode('admin');void validateCacheSchema();try{const remember="
  );
  out=out.replace(
    "if(remember&&preferred==='public'){await hydrate('public');installLazyTabBridge();return}",
    "if(remember&&preferred==='public'){enterAppShell('public');void startHydration('public');return}"
  );
  out=out.replace(
    "if(session.authenticated){currentAdmin=session.user;await hydrate('admin');installLazyTabBridge();return}",
    "if(session.authenticated){currentAdmin=session.user;enterAppShell('admin');void startHydration('admin');return}"
  );

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
        'x-mws-cache-db':'mawang_data_v130'
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
      const replacement=new URL('/assets/cloud-v1.1-loader.js?v=1.3.0-auth-decoupled',request.url);
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
