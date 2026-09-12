from pathlib import Path
import json
import re


def once(text, old, new, label):
    n = text.count(old)
    if n != 1:
        raise SystemExit(f"{label}: expected 1 match, got {n}")
    return text.replace(old, new, 1)


# Core timezone behavior. Display defaults to KST. Explicit timeZone requests remain untouched.
p = Path("assets/app-core.js")
s = p.read_text(encoding="utf-8")
kst = r'''/* CF MWS V 1.0.12 - primary system timezone: Asia/Seoul */
(()=>{
  if(window.__mwsKstCoreV112)return;window.__mwsKstCoreV112=1;
  const TZ='Asia/Seoul';
  const rawString=Date.prototype.toLocaleString,rawDate=Date.prototype.toLocaleDateString,rawTime=Date.prototype.toLocaleTimeString;
  const opts=o=>o&&Object.prototype.hasOwnProperty.call(o,'timeZone')?o:{...(o||{}),timeZone:TZ};
  Date.prototype.toLocaleString=function(locales,options){return rawString.call(this,locales,opts(options))};
  Date.prototype.toLocaleDateString=function(locales,options){return rawDate.call(this,locales,opts(options))};
  Date.prototype.toLocaleTimeString=function(locales,options){return rawTime.call(this,locales,opts(options))};
  window.MWS_PRIMARY_TIME_ZONE=TZ;
  window.mwsKstDateTime=value=>{const d=value instanceof Date?value:new Date(value);return Number.isNaN(d.getTime())?String(value??''):rawString.call(d,'ko-KR',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false})};
})();

'''
if "__mwsKstCoreV112" not in s:
    s = kst + s
p.write_text(s, encoding="utf-8")

# The three consolidated tools use the miniGames part.
p = Path("assets/cloud-v5.5.js")
s = p.read_text(encoding="utf-8")
old = """    gamePachinko:['miniGames'],gameMultiDraw:['miniGames'],export:['contactMeta','miniGames','notebook','clipboard'],
    settings:['contactMeta']"""
new = """    gamePachinko:['miniGames'],gameMultiDraw:['miniGames'],toolTier:['miniGames'],toolMatrix:['miniGames'],toolRelations:['miniGames'],
    export:['contactMeta','miniGames','notebook','clipboard'],settings:['contactMeta']"""
s = once(s, old, new, "tool lazy-load mapping")
p.write_text(s, encoding="utf-8")

# Consolidated tools. No additional versioned runtime layer is created.
p = Path("assets/tools.js")
s = p.read_text(encoding="utf-8")
s = once(s, "/* CF MWS V 1.0.10 - consolidated tools, behavior-preserving */", "/* CF MWS V 1.0.12 - consolidated tools, behavior-preserving */", "tools header")
s = once(s, "const BUILD='CF MWS V 1.0.10';", "const BUILD='CF MWS V 1.0.12';", "tools build")
s = once(
    s,
    "const CHO='ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';",
    "const CHO='ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';\nconst kstDateTime=v=>typeof window.mwsKstDateTime==='function'?window.mwsKstDateTime(v):new Date(v).toLocaleString('ko-KR',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false});",
    "tools KST helper",
)
s = once(s, "${esc(String(x.updatedAt||'').replace('T',' ').slice(0,16))}", "${esc(kstDateTime(x.updatedAt||''))}", "saved tool KST display")
old_activate = "function activate(kind){const id=SECTION[kind];if(!id)return;try{typeof window.setTab==='function'&&window.setTab(id)}catch(_){ }$$('.section').forEach(s=>s.classList.toggle('active',s.id===id));$$('.nav button[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===id));const title=$('#pageTitle');if(title)title.textContent=LABEL[kind];render(kind);try{window.mwsV101ApplyPageLayoutScale?.()}catch(_){}}"
new_activate = "async function activate(kind){const id=SECTION[kind];if(!id)return;try{if(typeof window.mwsV55EnsureParts==='function')await window.mwsV55EnsureParts(id)}catch(e){console.error('Tool miniGames preload failed',e)}try{typeof window.setTab==='function'&&window.setTab(id)}catch(_){ }$$('.section').forEach(s=>s.classList.toggle('active',s.id===id));$$('.nav button[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===id));const title=$('#pageTitle');if(title)title.textContent=LABEL[kind];render(kind);try{window.mwsV101ApplyPageLayoutScale?.()}catch(_){}}"
s = once(s, old_activate, new_activate, "tool activation preload")
p.write_text(s, encoding="utf-8")

# Keep baseline extensions functional, but none may overwrite the authoritative release label.
p = Path("assets/test-v5.5.js")
s = p.read_text(encoding="utf-8")
s = s.replace("const VERSION='CF MWS V 1.0.2';", "const VERSION='CF MWS V 1.0.12';")
p.write_text(s, encoding="utf-8")

p = Path("assets/test-v5.6.js")
s = p.read_text(encoding="utf-8")
s = s.replace(
    "document.body.setAttribute('data-build-version','TEST V5.6');const v=document.querySelector('[id^=\"mwsBuildVersionV5\"],[class*=\"sidebar-build-version\"]');if(v)v.textContent='TEST V5.6';",
    "document.body.setAttribute('data-build-version','CF MWS V 1.0.12');const v=document.querySelector('[id^=\"mwsBuildVersionV5\"],[class*=\"sidebar-build-version\"]');if(v)v.textContent='CF MWS V 1.0.12';",
)
p.write_text(s, encoding="utf-8")

# Content Planner. All changes are made directly in the flattened V1.0.10 source.
p = Path("content-planner.html")
s = p.read_text(encoding="utf-8")
s = once(s, "<title>MAWANG Content Planner V1.0.10</title>", "<title>MAWANG Content Planner V1.0.12</title>", "planner title")

old_actions = '''    <div class="submit-action-stack"><button class="btn small primary" onclick="openSubmitModal(false)">기획안 제출</button><button class="btn small planner-fullscreen-enter" type="button" onclick="enterPlannerFullscreen()">전체화면</button></div>'''
new_actions = '''    <button class="btn small planner-fullscreen-enter" type="button" onclick="enterPlannerFullscreen()">전체화면</button>'''
s = once(s, old_actions, new_actions, "remove submit action")
s = once(s, '<button class="btn ok" onclick="saveCanvasInfo()">저장</button>', '<button class="btn ok" id="canvasInfoSaveBtn" onclick="saveCanvasInfo()">저장</button>', "canvas save button")

# Remove the obsolete second submit path, while retaining the single storage adapter.
s, n = re.subn(
    r'\n<div id="submitModal" class="modal">.*?\n<div id="participantModal" class="modal">',
    '\n<div id="participantModal" class="modal">',
    s,
    count=1,
    flags=re.S,
)
if n != 1:
    raise SystemExit(f"remove submit modal failed: {n}")
s, n = re.subn(
    r'\nfunction openSubmitModal\(update=false\)\{.*?\nasync function submitProposalToBackend\(payload\)\{',
    '\nasync function submitProposalToBackend(payload){',
    s,
    count=1,
    flags=re.S,
)
if n != 1:
    raise SystemExit(f"remove submit functions failed: {n}")

old_board = """.board-wrap{padding:0!important;width:100%!important;height:calc(100% - 54px)!important;min-width:0!important;min-height:0!important;overflow:hidden!important;position:relative!important;background:#fff!important}
#board{width:100%!important;height:100%!important;position:absolute!important;inset:0!important;transform-origin:center center!important;box-shadow:none!important;border-radius:0!important;overflow:hidden!important}
#drawCanvas,#connectorSvg,#nodeLayer{width:100%!important;height:100%!important}"""
new_board = """.board-wrap{padding:0!important;width:100%!important;height:calc(100% - 54px)!important;min-width:0!important;min-height:0!important;overflow:hidden!important;position:relative!important;background:#060911!important;--planner-edge-gap:10px}
#board{width:1600px!important;height:1000px!important;position:absolute!important;left:0!important;top:0!important;right:auto!important;bottom:auto!important;inset:auto!important;transform-origin:top left!important;box-shadow:none!important;border-radius:0!important;overflow:hidden!important}
#drawCanvas,#connectorSvg,#nodeLayer{width:100%!important;height:100%!important}"""
s = once(s, old_board, new_board, "uniform canvas css")

old_full = "body.planner-fullscreen{overflow:hidden!important}body.planner-fullscreen .topbar{display:none!important}body.planner-fullscreen .app{height:100vh!important}body.planner-fullscreen #creatorMode.creator.active{display:grid!important;grid-template-columns:72vw 28vw!important;grid-template-rows:50vh 50vh!important;height:100vh!important;min-height:0!important}body.planner-fullscreen #creatorMode .workspace{grid-column:1!important;grid-row:1/3!important;height:100vh!important;min-height:0!important;border-right:1px solid var(--line)!important}body.planner-fullscreen #creatorMode .creator-toolbar{grid-column:2!important;grid-row:1!important;min-height:0!important;height:50vh!important;max-height:50vh!important;overflow:auto!important;align-content:flex-start!important;border-bottom:1px solid var(--line)!important}body.planner-fullscreen #creatorMode .planner-fullscreen-blank{display:block!important;grid-column:2!important;grid-row:2!important;background:#070a12!important;border-left:1px solid var(--line)!important}"
new_full = "body.planner-fullscreen{overflow:hidden!important}body.planner-fullscreen .topbar{display:none!important}body.planner-fullscreen .app{height:100vh!important}body.planner-fullscreen #creatorMode.creator.active{display:grid!important;grid-template-columns:76vw 24vw!important;grid-template-rows:44vh 56vh!important;height:100vh!important;min-height:0!important}body.planner-fullscreen #creatorMode .workspace{grid-column:1!important;grid-row:1/3!important;height:100vh!important;min-height:0!important;border-right:1px solid var(--line)!important}body.planner-fullscreen #creatorMode .creator-toolbar{grid-column:2!important;grid-row:1!important;min-height:0!important;height:44vh!important;max-height:44vh!important;overflow:auto!important;align-content:flex-start!important;border-bottom:1px solid var(--line)!important}body.planner-fullscreen #creatorMode .planner-fullscreen-blank{display:block!important;grid-column:2!important;grid-row:2!important;background:transparent!important;border-left:1px solid var(--line)!important}"
s = once(s, old_full, new_full, "fullscreen proportions")
s = once(
    s,
    ".submit-action-stack{display:flex;flex-direction:column;gap:5px;align-items:stretch}.planner-fullscreen-enter{font-weight:950!important;min-width:120px}",
    ".top-actions{display:flex!important;align-items:center!important;justify-content:flex-end!important;gap:8px!important;flex-wrap:wrap!important}.top-actions>.btn,.top-actions>.delete-canvas-wrap>.btn{height:40px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important}.planner-fullscreen-enter{font-weight:950!important;min-width:120px}",
    "top action layout",
)

old_drop = ".dropdown-panel{position:absolute;top:calc(100% + 7px);left:0;z-index:500;min-width:220px;max-width:min(520px,80vw);padding:10px;border:1px solid #354462;background:#0e1422;border-radius:13px;box-shadow:0 18px 48px rgba(0,0,0,.5)}"
new_drop = ".tool-group{position:relative!important}.dropdown-panel{position:absolute;top:calc(100% + 7px);right:0;left:auto;z-index:500;min-width:220px;width:max-content;max-width:calc(100vw - 24px);padding:10px;border:1px solid #354462;background:#0e1422;border-radius:13px;box-shadow:0 18px 48px rgba(0,0,0,.5);box-sizing:border-box;overflow:hidden}"
s = once(s, old_drop, new_drop, "dropdown containment")
s = once(
    s,
    ".shape-grid{display:grid;grid-template-columns:repeat(4,84px);gap:8px}",
    ".shape-grid{display:grid;grid-template-columns:repeat(4,minmax(0,84px));gap:8px;width:min(360px,calc(100vw - 44px));max-width:100%}.shape-pick{min-width:0!important;width:100%!important}",
    "shape grid containment",
)
s = once(s, ".node-delete{display:none;position:absolute;right:4px;top:4px;", ".node-delete{display:none;position:absolute;right:-13px;top:-13px;", "node close position")

old_part = ".participant-node{background:linear-gradient(135deg,#12192b,#1d2740);color:#fff;border:1px solid #3a4b70;border-radius:16px;padding:14px;display:grid;grid-template-columns:64px 1fr;gap:12px;align-items:center}.participant-avatar{width:64px;height:64px;border-radius:14px;background:#5e45ba;display:grid;place-items:center;font-size:20px;font-weight:950;overflow:hidden}.participant-avatar img{width:100%;height:100%;object-fit:cover}.participant-name{font-size:16px;font-weight:950}.participant-meta{font-size:10px;color:#aab9da;margin-top:5px}.tag-badge{display:inline-block;margin:6px 4px 0 0;padding:3px 6px;border-radius:999px;background:#30245a;color:#dcd2ff;font-size:9px}"
new_part = ".participant-node{background:linear-gradient(135deg,#12192b,#1d2740);color:#fff;border:1px solid #3a4b70;border-radius:16px;padding:min(8cqw,8cqh);display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:min(5cqw,4cqh);overflow:hidden;container-type:size;box-sizing:border-box}.participant-avatar{width:min(72cqw,55cqh);height:min(72cqw,55cqh);border-radius:min(12cqw,10cqh);background:#5e45ba;display:grid;place-items:center;font-size:min(18cqw,14cqh);font-weight:950;overflow:hidden;flex:none}.participant-avatar img{width:100%;height:100%;object-fit:cover}.participant-name{width:100%;font-size:min(14cqw,10cqh);line-height:1.15;font-weight:950;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.participant-meta,.tag-badge{display:none!important}"
s = once(s, old_part, new_part, "participant vertical card")

old_part_html = "if(e.type==='participant'){const d=e.data,avatar=d.image?`<img src=\"${d.image}\">`:esc((d.name||'?').slice(0,2));inner=`<div class=\"participant-avatar\">${avatar}</div><div><div class=\"participant-name\">${esc(d.name)}</div><div class=\"participant-meta\">${esc((d.labels||[]).join(' · ')||'참가자')}</div><span class=\"tag-badge\">${esc(d.team||'TEAM 미정')}</span><span class=\"tag-badge\">${esc(d.role||'ROLE 미정')}</span></div>`}"
new_part_html = "if(e.type==='participant'){const d=e.data,avatar=d.image?`<img src=\"${esc(d.image)}\">`:esc((d.name||'?').slice(0,2));inner=`<div class=\"participant-avatar\">${avatar}</div><div class=\"participant-name\">${esc(d.name)}</div>`}"
s = once(s, old_part_html, new_part_html, "participant renderer")
s = once(
    s,
    "function addParticipant(id){const c=contactDb.find(x=>x.id===id);if(!c)return;addElement('participant',{w:320,h:120,data:{contactId:c.id,name:c.name,image:c.image||'',labels:c.labels||[],team:'',role:''}});closeModal('participantModal')}",
    "function addParticipant(id){const c=contactDb.find(x=>x.id===id);if(!c)return;addElement('participant',{w:120,h:150,data:{contactId:c.id,name:c.name,image:c.image||'',labels:c.labels||[],team:'',role:''}});closeModal('participantModal')}",
    "participant default size",
)

old_zoom = "function setZoom(v){zoom=clamp(Number(v)||1,1,2.25);const board=$('board');if(board)board.style.transform=`scale(${zoom})`;if($('zoomBadge'))$('zoomBadge').textContent=Math.round(zoom*100)+'%';updateDrawCursorVisualV110()}\nfunction resizePlannerCanvas(){renderPositions();redrawDrawCanvas();renderConnectors()}"
new_zoom = """function applyPlannerScaleV112(){const wrap=$('boardWrap'),board=$('board');if(!wrap||!board)return;const gap=10,fit=Math.min(Math.max(1,wrap.clientWidth-gap)/BOARD_W,Math.max(1,wrap.clientHeight-gap)/BOARD_H),scale=Math.max(.05,fit)*zoom;board.style.transform=`scale(${scale})`;board.style.left='0px';board.style.top='0px';board.dataset.fitScale=String(fit);board.dataset.renderScale=String(scale)}
function setZoom(v){zoom=clamp(Number(v)||1,.5,2.25);applyPlannerScaleV112();if($('zoomBadge'))$('zoomBadge').textContent=Math.round(zoom*100)+'%';updateDrawCursorVisualV110()}
function resizePlannerCanvas(){applyPlannerScaleV112();renderPositions();redrawDrawCanvas();renderConnectors()}"""
s = once(s, old_zoom, new_zoom, "uniform planner scaling")

save_pattern = re.compile(r"function saveCanvasInfo\(\)\{\n  const ids=.*?\n\}", re.S)
save_repl = """async function saveCanvasInfo(){
  const btn=$('canvasInfoSaveBtn'),oldLabel=btn?.textContent||'저장';
  const ids=[...canvasInfoParticipantSelectionV110],title=$('canvasInfoTitle').value.trim()||'새 메모',author=$('canvasInfoAuthor').value.trim(),summary=$('canvasInfoSummary').value.trim();
  state.meta={...state.meta,title,author,summary,participantIds:ids};syncCurrentDocumentV110();touch();
  if(btn){btn.disabled=true;btn.textContent='저장 중...'}
  try{
    const canvas=await renderBoardToCanvas(),preview=canvas.toDataURL('image/png',.88),existingId=state.activeProposalId||'',id=existingId||uid(),now=new Date().toISOString(),old=existingId?await dbGet(id):null;
    const payload={id,title,author,summary,createdAt:old?.createdAt||now,updatedAt:now,participants:proposalParticipantsV110(),preview,canvas:deep(state)};
    payload.canvas.activeProposalId=id;await submitProposalToBackend(payload);state.activeProposalId=id;syncCurrentDocumentV110();touch();closeModal('canvasInfoModal');await renderArchive();toast(old?'저장 및 기획안 업데이트 완료':'저장 및 기획안 등록 완료')
  }catch(err){console.error('Content Planner save failed',err);alert('저장 실패: '+(err?.message||err))}
  finally{if(btn){btn.disabled=false;btn.textContent=oldLabel}}
}"""
s, n = save_pattern.subn(save_repl, s, count=1)
if n != 1:
    raise SystemExit(f"saveCanvasInfo replacement failed: {n}")

s = once(
    s,
    "function formatDate(v){try{return new Date(v).toLocaleString('ko-KR',{year:'2-digit',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})}catch(_){return v||''}}",
    "function formatDate(v){try{return new Date(v).toLocaleString('ko-KR',{timeZone:'Asia/Seoul',year:'2-digit',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})}catch(_){return v||''}}",
    "planner KST date",
)

old_canvas_draw = "if(e.type==='participant'){c.fillStyle='#151e31';roundRect(c,x,y,w,h,15,true);c.fillStyle='#6048b7';roundRect(c,x+14,y+18,64,64,14,true);if(e.data.image){try{const im=await loadRasterImage(e.data.image);c.save();roundRect(c,x+14,y+18,64,64,14,false,true);c.clip();c.drawImage(im,x+14,y+18,64,64);c.restore()}catch(_){}}c.fillStyle='#fff';c.font='bold 20px sans-serif';c.fillText(e.data.name||'',x+92,y+42);continue}"
new_canvas_draw = "if(e.type==='participant'){c.fillStyle='#151e31';roundRect(c,x,y,w,h,Math.min(16,w*.12,h*.12),true);const av=Math.max(16,Math.min(w*.68,h*.55)),ax=x+(w-av)/2,ay=y+Math.max(6,h*.08);c.fillStyle='#6048b7';roundRect(c,ax,ay,av,av,Math.min(14,av*.14),true);if(e.data.image){try{const im=await loadRasterImage(e.data.image);c.save();roundRect(c,ax,ay,av,av,Math.min(14,av*.14),false,true);c.clip();c.drawImage(im,ax,ay,av,av);c.restore()}catch(_){}}c.fillStyle='#fff';c.textAlign='center';c.font=`bold ${Math.max(7,Math.min(w*.12,h*.10))}px sans-serif`;c.fillText(e.data.name||'',x+w/2,Math.min(y+h-6,ay+av+Math.max(10,h*.13)));c.textAlign='left';continue}"
s = once(s, old_canvas_draw, new_canvas_draw, "participant preview renderer")
p.write_text(s, encoding="utf-8")

# Host, main page and Worker carry one release number. Worker does not patch static HTML or JS.
p = Path("assets/content-planner-host.js")
s = p.read_text(encoding="utf-8")
s = s.replace("CF MWS V 1.0.10", "CF MWS V 1.0.12")
s = s.replace("/content-planner.html?v=1.0.10", "/content-planner.html?v=1.0.12")
s = s.replace("/assets/tools.js?v=1.0.10", "/assets/tools.js?v=1.0.12")
p.write_text(s, encoding="utf-8")

p = Path("index.html")
s = p.read_text(encoding="utf-8")
s = s.replace('data-build-version="CF MWS V 1.0.10"', 'data-build-version="CF MWS V 1.0.12"')
s = s.replace("CF MWS V 1.0.10", "CF MWS V 1.0.12")
s = re.sub(r'assets/content-planner-host\.js(?:\?v=[^"\']+)?', 'assets/content-planner-host.js?v=1.0.12', s)
s = re.sub(r'assets/tools\.js(?:\?v=[^"\']+)?', 'assets/tools.js?v=1.0.12', s)
p.write_text(s, encoding="utf-8")

p = Path("src/cf-v571.js")
s = p.read_text(encoding="utf-8")
s = once(s, "const BUILD_VERSION = 'CF MWS V 1.0.8';", "const BUILD_VERSION = 'CF MWS V 1.0.12';", "worker build")
s = s.replace("body.mode = 'cf-v5.7.1-bundle';", "body.mode = 'cf-mws-v1.0.12';")
p.write_text(s, encoding="utf-8")

p = Path("package.json")
d = json.loads(p.read_text(encoding="utf-8"))
d["version"] = "1.0.12"
p.write_text(json.dumps(d, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

p = Path("README.md")
s = p.read_text(encoding="utf-8")
s = re.sub(r"Current release: .*", "Current release: CF MWS V1.0.12", s, count=1)
p.write_text(s, encoding="utf-8")

print("Clean V1.0.12 source patch completed")
