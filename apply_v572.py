from pathlib import Path
import re, shutil

src=Path('index.html')
out=Path('index.html')
s=src.read_text(encoding='utf-8')

# 0) Bring local v5.7 copy up to the currently deployed v5.7.1 hotfix behavior.
# title fallback
pat=re.compile(r"async function fetchSoopPostTitle\(post,firstJson\)\{.*?\n\}\n\nfunction postById", re.S)
m=pat.search(s)
if not m:
    raise SystemExit('fetchSoopPostTitle not found')
block=m.group(0)
if "fetchSoopBoardRecord(post)" not in block:
    repl="""async function fetchSoopPostTitle(post,firstJson){
  const fromJson=titleFromSoopJson(firstJson);if(fromJson)return fromJson;
  try{
    const rec=await fetchSoopBoardRecord(post);
    const fromBoard=rec?metaFromSoopRecord(rec).title:'';
    if(fromBoard)return fromBoard;
  }catch(err){console.warn('SOOP 제목 보조 조회 실패',err)}
  return String(post?.sourceTitle||'').trim();
}

function postById"""
    s,n=pat.subn(repl,s,count=1)
    if n!=1: raise SystemExit('title patch failed')

# current storage hotfix for local copy
pat_write=re.compile(r"  async function writeCloudNow\(\)\{.*?\n  \}\n  function queueCloudSave", re.S)
m=pat_write.search(s)
if not m: raise SystemExit('writeCloudNow not found')
if "sb.rpc('save_shared_state'" not in m.group(0):
    repl="""  async function writeCloudNow(){
    if(mode!=='admin'||!sb)return false;
    if(cloudSaving){pendingSave=true;return false}
    cloudSaving=true;
    try{
      const {data:{user}}=await sb.auth.getUser();if(!user)throw new Error('Admin 세션이 만료되었습니다.');
      const payload=typeof mwsStripDevicePrefs==='function'?mwsStripDevicePrefs(data):clone(data);
      if(Array.isArray(payload.posts))for(const post of payload.posts){delete post.sourceContent;delete post.sourcePhotos;delete post.sourceAuthor;delete post.sourceAuthorId;delete post.sourceRegDate;delete post.sourceViewCount;delete post.sourceUrl}
      const saved=await sb.rpc('save_shared_state',{p_data:payload});if(saved.error)throw saved.error;
      const st=$('syncStatusText');if(st)st.textContent='Supabase 저장 완료';
      return true;
    }catch(e){console.error('Supabase 저장 실패',e);try{toast('온라인 저장 실패',e.message||String(e))}catch(_){};return false}
    finally{cloudSaving=false;if(pendingSave){pendingSave=false;queueCloudSave()}}
  }
  function queueCloudSave"""
    s,n=pat_write.subn(repl,s,count=1)
    if n!=1: raise SystemExit('write hotfix failed')
else:
    # Make v5.7.1 writeCloudNow return success/failure for manual SAVE.
    block=m.group(0)
    block=block.replace("if(mode!=='admin'||!sb)return;", "if(mode!=='admin'||!sb)return false;")
    block=block.replace("if(cloudSaving){pendingSave=true;return}", "if(cloudSaving){pendingSave=true;return false}")
    if "return true;" not in block:
        block=block.replace("const st=$('syncStatusText');if(st)st.textContent='Supabase 저장 완료';", "const st=$('syncStatusText');if(st)st.textContent='Supabase 저장 완료';\n      return true;")
    if "return false}" not in block and "return false\n" not in block:
        block=block.replace("}catch(e){console.error('Supabase 저장 실패',e);try{toast('온라인 저장 실패',e.message||String(e))}catch(_){}}", "}catch(e){console.error('Supabase 저장 실패',e);try{toast('온라인 저장 실패',e.message||String(e))}catch(_){};return false}")
    s=s[:m.start()]+block+s[m.end():]

pat_initial=re.compile(r"  async function writeInitialState\(\)\{.*?\n  \}\n\n  async function isCurrentUserAdmin", re.S)
m=pat_initial.search(s)
if not m: raise SystemExit('writeInitialState not found')
if "sb.rpc('save_shared_state'" not in m.group(0):
    repl="""  async function writeInitialState(){
    const {data:{user}}=await sb.auth.getUser();if(!user)return;
    const payload=typeof mwsStripDevicePrefs==='function'?mwsStripDevicePrefs(data):clone(data);
    if(Array.isArray(payload.posts))for(const post of payload.posts){delete post.sourceContent;delete post.sourcePhotos;delete post.sourceAuthor;delete post.sourceAuthorId;delete post.sourceRegDate;delete post.sourceViewCount;delete post.sourceUrl}
    const saved=await sb.rpc('save_shared_state',{p_data:payload});if(saved.error)throw saved.error;
  }

  async function isCurrentUserAdmin"""
    s,n=pat_initial.subn(repl,s,count=1)
    if n!=1: raise SystemExit('initial hotfix failed')

# 1) Fix final v5.7 mini game picker override: move modal out of .main before modal-active disables background interaction.
needle="""  window.openPostGamePicker=function(){
    const p=postById(activePostId); if(!p)return;
    const arr=uniquePostGameApplicants(p), modal=document.getElementById('postGamePickerModal');
    const subtitle=document.getElementById('postGamePickerSubtitle');"""
replacement="""  window.openPostGamePicker=function(){
    const p=postById(activePostId); if(!p)return;
    const arr=uniquePostGameApplicants(p), modal=document.getElementById('postGamePickerModal');
    if(modal&&modal.parentElement!==document.body)document.body.appendChild(modal);
    const subtitle=document.getElementById('postGamePickerSubtitle');"""
count=s.count(needle)
if count!=1: raise SystemExit(f'final v5.7 picker needle count={count}')
s=s.replace(needle,replacement,1)

# 2) Ladder - add 전원 제거 next to participant count.
needle="""<div class=\"space\"><div><h3>참가자</h3><div class=\"subtle\">이 순서대로 사다리 위쪽에 배치됩니다.</div></div><span id=\"ladderPlayerCountChip\" class=\"chip\">0명</span></div>"""
replacement="""<div class=\"space\"><div><h3>참가자</h3><div class=\"subtle\">이 순서대로 사다리 위쪽에 배치됩니다.</div></div><div class=\"row\"><span id=\"ladderPlayerCountChip\" class=\"chip\">0명</span><button type=\"button\" class=\"ghost small\" onclick=\"clearMiniEntries('ladder')\">전원 제거</button></div></div>"""
count=s.count(needle)
if count!=1: raise SystemExit(f'ladder header needle count={count}')
s=s.replace(needle,replacement,1)

# 3) Dashboard - replace checklist KPI with 7-day participation KPI.
needle='<span class="dashboard-stat-label-v55">7일 준비도</span><strong id="dashboardReadinessV55">0%</strong><small id="dashboardReadinessMetaV55">체크리스트 0 / 0</small>'
replacement='<span class="dashboard-stat-label-v55">7일 참여 예정</span><strong id="dashboardReadinessV55">0명</strong><small id="dashboardReadinessMetaV55">등록된 참여자</small>'
count=s.count(needle)
if count!=1: raise SystemExit(f'dashboard KPI needle count={count}')
s=s.replace(needle,replacement,1)

# Replace the checklist readiness calculation with unique upcoming participants.
old="""    const prepareRows=near.filter(e=>!e.restDay);
    let checklistDone=0,checklistTotal=0;
    prepareRows.forEach(e=>{const arr=Array.isArray(e?.checklist)?e.checklist:[];checklistTotal+=arr.length;checklistDone+=arr.filter(x=>x?.done).length});
    const readiness=checklistTotal?Math.round(checklistDone/checklistTotal*100):(prepareRows.length?100:0);
    v55Set('dashboardReadinessV55',`${readiness}%`);
    v55Set('dashboardReadinessMetaV55',checklistTotal?`체크리스트 ${checklistDone} / ${checklistTotal}`:(prepareRows.length?'등록된 체크리스트 없음':'예정 컨텐츠 없음'));"""
new="""    const prepareRows=near.filter(e=>!e.restDay);
    const upcomingParticipantKeys=new Set();
    prepareRows.forEach(e=>{
      let rows=[];try{rows=typeof eventParticipantRows==='function'?eventParticipantRows(e):[]}catch(_){rows=[]}
      rows.forEach((r,i)=>{const key=String(r?.contactId||r?.id||r?.name||`${e.id||e.date}-${i}`).trim();if(key)upcomingParticipantKeys.add(key)});
    });
    v55Set('dashboardReadinessV55',`${upcomingParticipantKeys.size}명`);
    v55Set('dashboardReadinessMetaV55',prepareRows.length?`${prepareRows.length}개 일정 · 고유 참여자`:'예정 컨텐츠 없음');"""
count=s.count(old)
if count!=1: raise SystemExit(f'dashboard readiness logic count={count}')
s=s.replace(old,new,1)

# 4) Sidebar manual save - insert markup before aside close.
needle="""      </div>
    </div>
  </aside>

  <main class=\"main\">"""
replacement="""      </div>
    </div>
    <button type=\"button\" id=\"mwsSidebarSaveBtn\" class=\"sidebar-save-v572\" title=\"현재 Admin 데이터를 즉시 온라인 저장\" hidden>
      <span class=\"sidebar-save-icon-v572\" aria-hidden=\"true\"><svg viewBox=\"0 0 24 24\"><path d=\"M5 3h12l2 2v16H5z\"/><path d=\"M8 3v6h8V3M8 17h8\"/></svg></span>
      <span class=\"sidebar-save-label-v572\">SAVE</span>
    </button>
  </aside>

  <main class=\"main\">"""
count=s.count(needle)
if count!=1: raise SystemExit(f'sidebar insertion count={count}')
s=s.replace(needle,replacement,1)

# Add manual save function before bindUi.
needle="""  function bindUi(){
    $('mwsModeAdmin')?.addEventListener('click',()=>selectLoginMode('admin'));"""
manual="""  async function manualCloudSaveV572(){
    const btn=$('mwsSidebarSaveBtn');
    if(mode!=='admin'){try{toast('SAVE','Admin 모드에서만 온라인 저장할 수 있습니다.')}catch(_){};return}
    clearTimeout(cloudSaveTimer);
    const oldLabel=btn?.querySelector('.sidebar-save-label-v572')?.textContent||'SAVE';
    if(btn){btn.disabled=true;btn.classList.add('saving');const label=btn.querySelector('.sidebar-save-label-v572');if(label)label.textContent='SAVING';}
    try{
      while(cloudSaving)await new Promise(resolve=>setTimeout(resolve,120));
      const ok=await writeCloudNow();
      if(ok){try{toast('SAVE 완료','Supabase 온라인 저장이 완료되었습니다.')}catch(_){};}
      else{try{toast('SAVE 실패','온라인 저장 결과를 확인해 주세요.')}catch(_){};}
    }finally{
      if(btn){btn.disabled=false;btn.classList.remove('saving');const label=btn.querySelector('.sidebar-save-label-v572');if(label)label.textContent=oldLabel;}
    }
  }

  function bindUi(){
    $('mwsModeAdmin')?.addEventListener('click',()=>selectLoginMode('admin'));"""
count=s.count(needle)
if count!=1: raise SystemExit(f'bindUi needle count={count}')
s=s.replace(needle,manual,1)

# Bind SAVE and toggle visibility in applyModeUi.
needle="""    if($('mwsAdminManageBtn'))$('mwsAdminManageBtn').hidden=!isAdmin;
    document.querySelectorAll('.nav button').forEach(btn=>{delete btn.dataset.mwsPublicHidden});"""
replacement="""    if($('mwsAdminManageBtn'))$('mwsAdminManageBtn').hidden=!isAdmin;
    if($('mwsSidebarSaveBtn'))$('mwsSidebarSaveBtn').hidden=!isAdmin;
    document.querySelectorAll('.nav button').forEach(btn=>{delete btn.dataset.mwsPublicHidden});"""
count=s.count(needle)
if count!=1: raise SystemExit(f'applyModeUi save toggle count={count}')
s=s.replace(needle,replacement,1)

needle="""    $('mwsModeAdmin')?.addEventListener('click',()=>selectLoginMode('admin'));$('mwsModePublic')?.addEventListener('click',()=>selectLoginMode('public'));$('mwsLoginForm')?.addEventListener('submit',handleLogin);"""
replacement="""    $('mwsModeAdmin')?.addEventListener('click',()=>selectLoginMode('admin'));$('mwsModePublic')?.addEventListener('click',()=>selectLoginMode('public'));$('mwsLoginForm')?.addEventListener('submit',handleLogin);$('mwsSidebarSaveBtn')?.addEventListener('click',manualCloudSaveV572);"""
count=s.count(needle)
if count!=1: raise SystemExit(f'bind save button count={count}')
s=s.replace(needle,replacement,1)

# 5) Styles only, appended before body close. No public login code is altered in this predeploy candidate.
style=r'''
<style id="mws-v572-predeploy-style">
/* Ladder contact palette stays visible while the game page scrolls. */
@media(min-width:851px){
  #gameLadder.active .ladder-contact-dock{
    position:sticky!important;top:18px!important;align-self:start!important;z-index:46!important;
    height:calc(100vh - 36px)!important;min-height:0!important;max-height:calc(100vh - 36px)!important;
    overflow:hidden!important;display:flex!important;flex-direction:column!important;
    box-shadow:0 16px 36px rgba(0,0,0,.16)
  }
  #gameLadder.active #ladderContactPalette{flex:1 1 auto!important;min-height:0!important;max-height:none!important}
  #gameLadder.active .mini-contact-search,#gameLadder.active .mini-manual-add,#gameLadder.active .mini-drop-zone{flex:0 0 auto!important}
}
body[data-resolution="mobile"] #gameLadder.active .ladder-contact-dock{position:static!important;height:auto!important;max-height:none!important}

/* Checklist presentation is removed from the dashboard summary. */
#dashboard .dashboard-week-row-v55{grid-template-columns:58px minmax(0,1fr)!important}
#dashboard .dashboard-week-progress-v55{display:none!important}

/* Bottom manual online SAVE action. */
.sidebar-save-v572{flex:0 0 auto;width:100%;min-height:47px;margin-top:8px;padding:9px 11px;border-radius:12px;border:1px solid rgba(52,211,153,.38);background:linear-gradient(135deg,rgba(16,185,129,.17),rgba(20,184,166,.10));color:#dffff3;display:flex;align-items:center;justify-content:center;gap:9px;font-weight:1000;letter-spacing:.08em;box-shadow:0 10px 25px rgba(16,185,129,.10);transition:.16s ease}
.sidebar-save-v572[hidden]{display:none!important}
.sidebar-save-v572:hover:not(:disabled){transform:translateY(-1px);border-color:rgba(110,231,183,.65);background:linear-gradient(135deg,rgba(16,185,129,.26),rgba(20,184,166,.17));box-shadow:0 14px 30px rgba(16,185,129,.16)}
.sidebar-save-v572:disabled{cursor:wait;opacity:.72}
.sidebar-save-v572.saving{animation:mwsSavePulseV572 .9s ease-in-out infinite alternate}
.sidebar-save-icon-v572{width:21px;height:21px;display:grid;place-items:center}.sidebar-save-icon-v572 svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
body:not(.sidebar-pinned) .sidebar:not(:hover) .sidebar-save-label-v572{display:none}
body:not(.sidebar-pinned) .sidebar:not(:hover) .sidebar-save-v572{padding-left:0;padding-right:0}
@keyframes mwsSavePulseV572{from{box-shadow:0 8px 20px rgba(16,185,129,.08)}to{box-shadow:0 8px 28px rgba(16,185,129,.28),0 0 18px rgba(45,212,191,.16)}}
</style>
<!-- mws-v5.7.2-predeploy -->
'''
if 'mws-v5.7.2-predeploy' in s: raise SystemExit('already patched')
s=s.replace('</body>',style+'\n</body>')
out.write_text(s,encoding='utf-8')
print(out)
