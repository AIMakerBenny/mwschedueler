from pathlib import Path
import json, re


def once(s, old, new, label):
    n = s.count(old)
    if n != 1:
        raise SystemExit(f'{label}: expected 1 match, got {n}')
    return s.replace(old, new, 1)


p = Path('content-planner.html')
s = p.read_text(encoding='utf-8')
s = s.replace('MAWANG Content Planner V1.0.13', 'MAWANG Content Planner V1.0.14')

s = once(s,
    '.participant-avatar{width:78%!important;max-width:150px!important;aspect-ratio:1/1!important;height:auto!important;',
    '.participant-avatar{width:78%!important;max-width:none!important;aspect-ratio:1/1!important;height:auto!important;',
    'participant avatar scalable')

old_delete = '.node-delete{display:none;position:absolute;right:5px;top:5px;z-index:40;width:24px;height:24px;border-radius:50%;border:1px solid #ff9aaa;background:#6e2030;color:#fff;font-size:17px;font-weight:950;line-height:1;place-items:center;cursor:pointer;box-shadow:0 3px 10px rgba(0,0,0,.32)}.node.selected .node-delete{display:grid}'
new_delete = '.node-delete{display:none;position:absolute;right:7px;top:5px;z-index:40;width:22px;height:22px;border:0;background:transparent;color:#8f2035;font-size:23px;font-weight:950;line-height:1;place-items:center;cursor:pointer;padding:0;box-shadow:none;text-shadow:0 1px 2px rgba(255,255,255,.75)}.node.selected .node-delete{display:grid}'
s = once(s, old_delete, new_delete, 'plain X close button')

s = once(s,
    '.draw-size-panel{min-width:270px!important}',
    '.draw-size-panel{min-width:270px!important;left:0!important;right:auto!important}',
    'draw panel direction')
s = s.replace('#board.bg-paper{background:#ffffff!important;background-image:none!important}', '#board.bg-paper{background:#ffffff!important;background-image:none!important}#board.image-drop-ready{outline:4px dashed #8b5cf6!important;outline-offset:-8px!important}')

old_menu = '<div id="brushSizeMenu" class="dropdown-panel draw-size-panel" hidden><div class="dropdown-title">브러시 / 지우개 크기</div><input id="drawSize" class="draw-size-slider" type="range" min="1" max="80" step="1" value="6" oninput="rememberDrawSize(this.value)"><div class="draw-size-preview"><span id="drawSizeSample" class="draw-size-sample"></span><b id="drawSizeValue">6px</b></div></div>'
new_menu = '<div id="brushSizeMenu" class="dropdown-panel draw-size-panel" hidden><div class="dropdown-title" id="drawSizeTitle">브러시 크기</div><input id="drawSize" class="draw-size-slider" type="range" min="1" max="80" step="1" value="6" oninput="rememberDrawSize(this.value)"><div class="draw-size-preview"><span id="drawSizeSample" class="draw-size-sample"></span><b id="drawSizeValue">6px</b></div></div>'
s = once(s, old_menu, new_menu, 'separate draw tool menu label')

old_vars = "let state=v110DefaultState(), selectedIds=[], tool='brush', zoom=.75, drawActive=false, currentStroke=null;\nlet undoStack=[],redoStack=[],saveTimer=0,currentViewerId=null,contactDb=[];"
new_vars = "let state=v110DefaultState(), selectedIds=[], tool='brush', zoom=.75, drawActive=false, currentStroke=null;\nlet undoStack=[],redoStack=[],saveTimer=0,currentViewerId=null,contactDb=[];\nlet drawToolSizesV114={brush:6,eraser:32};\nlet userStickersV114=[];"
s = once(s, old_vars, new_vars, 'planner state additions')

s = once(s,
    "if(e.type==='text')inner=`<div class=\"editable\" contenteditable=\"true\" spellcheck=\"false\">${esc(e.data.text||'')}</div>`;\n  if(e.type==='sticky')inner=`<div class=\"editable\" contenteditable=\"true\" spellcheck=\"false\">${esc(e.data.text||'')}</div>`;",
    "if(e.type==='text')inner=`<div class=\"editable\" contenteditable=\"${selectedIds.includes(e.id)?'true':'false'}\" spellcheck=\"false\">${esc(e.data.text||'')}</div>`;\n  if(e.type==='sticky')inner=`<div class=\"editable\" contenteditable=\"${selectedIds.includes(e.id)?'true':'false'}\" spellcheck=\"false\">${esc(e.data.text||'')}</div>`;",
    'text selection/edit behavior')

s = once(s,
    "if(e.type==='sticker')inner=`<img class=\"sticker-art\" src=\"${stickerDataUriV110(e.data.stickerId||'star')}\" alt=\"sticker\">`;",
    "if(e.type==='sticker')inner=`<img class=\"sticker-art\" src=\"${esc(e.data.stickerSrc||stickerDataUriV110(e.data.stickerId||'star'))}\" alt=\"${esc(e.data.stickerName||'sticker')}\">`;",
    'custom sticker node rendering')

old_bind = "node.addEventListener('pointerdown',ev=>{if(ev.target.closest('.resize-handle,.drag-handle,.node-delete,[contenteditable],video'))return;selectNode(id,ev)});"
new_bind = "node.addEventListener('pointerdown',ev=>{if(ev.target.closest('.resize-handle,.drag-handle,.node-delete,video'))return;const editable=ev.target.closest('[contenteditable]');if(editable){if(!selectedIds.includes(id)){ev.preventDefault();selectNode(id,ev)}return}selectNode(id,ev)});"
s = once(s, old_bind, new_bind, 'text re-selection')

s = once(s, ".replace(/ contenteditable=\"true\"/g,'')", ".replace(/ contenteditable=\"(?:true|false)\"/g,'')", 'static text cleanup')

s = once(s,
    "currentStroke={id:uid(),mode:tool,color:$('drawColor').value,size:Number($('drawSize').value)||6,points:[p]};",
    "currentStroke={id:uid(),mode:tool,color:$('drawColor').value,size:Number(drawToolSizesV114[tool]??$('drawSize').value)||6,points:[p]};",
    'separate stroke sizes')

old_draw_funcs = "function activateDrawTool(next,event){setTool(next);closeDropdownsV110('brushSizeMenu');$('brushSizeMenu').hidden=!$('brushSizeMenu').hidden;event?.stopPropagation()}\nfunction rememberDrawSize(v){if($('drawSize'))$('drawSize').value=String(v);updateDrawSizePreviewV110();updateDrawCursorVisualV110()}"
new_draw_funcs = "function activateDrawTool(next,event){setTool(next);const size=Number(drawToolSizesV114[next])||(next==='eraser'?32:6);if($('drawSize'))$('drawSize').value=String(size);if($('drawSizeTitle'))$('drawSizeTitle').textContent=next==='eraser'?'지우개 크기':'브러시 크기';updateDrawSizePreviewV110();updateDrawCursorVisualV110();closeDropdownsV110('brushSizeMenu');$('brushSizeMenu').hidden=!$('brushSizeMenu').hidden;event?.stopPropagation()}\nfunction rememberDrawSize(v){const size=Math.max(1,Math.min(80,Number(v)||6));if(tool==='brush'||tool==='eraser')drawToolSizesV114[tool]=size;if($('drawSize'))$('drawSize').value=String(size);updateDrawSizePreviewV110();updateDrawCursorVisualV110()}"
s = once(s, old_draw_funcs, new_draw_funcs, 'separate brush eraser controls')

needle = "const size=Math.max(1,Math.min(80,Number($('drawSize')?.value)||6));"
if s.count(needle) != 2:
    raise SystemExit(f'draw preview/cursor size: expected 2, got {s.count(needle)}')
s = s.replace(needle, "const size=Math.max(1,Math.min(80,Number(drawToolSizesV114[tool]??$('drawSize')?.value)||(tool==='eraser'?32:6)));", 2)

old_sticker_funcs = "function stickerDataUriV110(id){const x=STICKERS_V110.find(s=>s.id===id)||STICKERS_V110[0];if(x.src)return x.src;return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(x.svg)}\nfunction renderStickerGridV110(){const g=$('stickerGrid');if(!g)return;const ordered=[...STICKERS_V110.filter(x=>/^user/i.test(String(x.id||''))),...STICKERS_V110.filter(x=>!/^user/i.test(String(x.id||'')))];g.innerHTML=ordered.map(x=>`<button class=\"sticker-pick\" title=\"${x.name}\" onclick=\"beginStickerPlacement('${x.id}')\"><img src=\"${stickerDataUriV110(x.id)}\" alt=\"${x.name}\"></button>`).join('')}"
new_sticker_funcs = "function allStickersV114(){return [...userStickersV114,...STICKERS_V110]}\nfunction stickerDataUriV110(id){const x=allStickersV114().find(s=>String(s.id)===String(id))||STICKERS_V110[0];if(x.src)return x.src;return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(x.svg)}\nfunction renderStickerGridV110(){const g=$('stickerGrid');if(!g)return;const ordered=allStickersV114();g.innerHTML=ordered.map(x=>`<button class=\"sticker-pick\" title=\"${esc(x.name)}\" onclick=\"beginStickerPlacement('${esc(x.id)}')\"><img src=\"${esc(stickerDataUriV110(x.id))}\" alt=\"${esc(x.name)}\"></button>`).join('')}\nfunction applyPlannerEmoticonsV114(list){userStickersV114=(Array.isArray(list)?list:[]).map(x=>({id:String(x?.id||''),name:String(x?.name||'이모티콘'),src:String(x?.src||'')})).filter(x=>x.id&&x.src);renderStickerGridV110();return userStickersV114.length}"
s = once(s, old_sticker_funcs, new_sticker_funcs, 'custom sticker library')

old_begin = "function beginStickerPlacement(id){pendingPlacement={kind:'sticker',stickerId:id,w:130,h:130};closeDropdownsV110();setTool('select');showPlacementGhostV110()}\nfunction showPlacementGhostV110(){const g=$('placementGhost');if(!g||!pendingPlacement)return;g.style.width=pendingPlacement.w/BOARD_W*100+'%';g.style.height=pendingPlacement.h/BOARD_H*100+'%';g.innerHTML=pendingPlacement.kind==='sticker'?`<img src=\"${stickerDataUriV110(pendingPlacement.stickerId)}\">`:shapeSvgMarkupV110({data:{shape:pendingPlacement.shape},style:{borderColor:pendingPlacement.color,fill:hexToRgbaV110(pendingPlacement.color,.15)}});g.classList.add('show')}"
new_begin = "function beginStickerPlacement(id){const sticker=allStickersV114().find(x=>String(x.id)===String(id));pendingPlacement={kind:'sticker',stickerId:String(id),stickerSrc:sticker?stickerDataUriV110(sticker.id):stickerDataUriV110(id),stickerName:sticker?.name||'이모티콘',w:130,h:130};closeDropdownsV110();setTool('select');showPlacementGhostV110()}\nfunction showPlacementGhostV110(){const g=$('placementGhost');if(!g||!pendingPlacement)return;g.style.width=pendingPlacement.w/BOARD_W*100+'%';g.style.height=pendingPlacement.h/BOARD_H*100+'%';g.innerHTML=pendingPlacement.kind==='sticker'?`<img src=\"${esc(pendingPlacement.stickerSrc||stickerDataUriV110(pendingPlacement.stickerId))}\">`:shapeSvgMarkupV110({data:{shape:pendingPlacement.shape},style:{borderColor:pendingPlacement.color,fill:hexToRgbaV110(pendingPlacement.color,.15)}});g.classList.add('show')}"
s = once(s, old_begin, new_begin, 'custom sticker placement')

s = once(s, "data:{stickerId:q.stickerId}});else addElement('shape'", "data:{stickerId:q.stickerId,stickerSrc:q.stickerSrc||'',stickerName:q.stickerName||'이모티콘'}});else addElement('shape'", 'persist sticker source')
s = once(s, "loadRasterImage(stickerDataUriV110(e.data.stickerId||'star'))", "loadRasterImage(e.data.stickerSrc||stickerDataUriV110(e.data.stickerId||'star'))", 'sticker canvas export')

old_msg = "window.addEventListener('message',event=>{\n  if(event.origin!==location.origin)return;\n  const msg=event.data;\n  if(!msg||msg.type!=='mws:planner-contacts')return;\n  applySchedulerContacts(msg.contacts);\n});"
new_msg = "window.addEventListener('message',event=>{\n  if(event.origin!==location.origin)return;\n  const msg=event.data;if(!msg)return;\n  if(msg.type==='mws:planner-contacts')applySchedulerContacts(msg.contacts);\n  if(msg.type==='mws:planner-emoticons')applyPlannerEmoticonsV114(msg.emoticons);\n});"
s = once(s, old_msg, new_msg, 'planner asset messages')

old_image = "$('imageInput').addEventListener('change',async e=>{const f=e.target.files?.[0];if(!f)return;const data=await fileDataUrl(f);addElement('image',{w:380,h:270,data:{src:data,name:f.name,crop:{zoom:1,x:50,y:50},border:2,borderColor:'#cfd5df'}});e.target.value=''});"
new_image = "async function addImageFileV114(file,point=null){if(!file||!String(file.type||'').startsWith('image/'))return null;const src=await fileDataUrl(file);let w=380,h=270;try{const im=await loadRasterImage(src),ratio=(im.naturalWidth||im.width||380)/Math.max(1,im.naturalHeight||im.height||270);w=clamp(ratio>=1?Math.min(520,380*ratio):300,120,560);h=clamp(w/Math.max(.05,ratio),100,500)}catch(_){}const x=point?clamp(point.x-w/2,0,BOARD_W-w):180+Math.random()*120,y=point?clamp(point.y-h/2,0,BOARD_H-h):140+Math.random()*100;return addElement('image',{x,y,w,h,data:{src,name:file.name,crop:{zoom:1,x:50,y:50},border:2,borderColor:'#cfd5df'}})}\n$('imageInput').addEventListener('change',async e=>{const f=e.target.files?.[0];if(!f)return;await addImageFileV114(f);e.target.value=''});\nasync function handleCanvasImageDropV114(e){const files=[...(e.dataTransfer?.files||[])].filter(f=>String(f.type||'').startsWith('image/'));if(!files.length)return;e.preventDefault();e.stopPropagation();$('board')?.classList.remove('image-drop-ready');let p=boardPoint(e);for(const f of files){await addImageFileV114(f,p);p={x:clamp(p.x+28,0,BOARD_W),y:clamp(p.y+28,0,BOARD_H)}}}"
s = once(s, old_image, new_image, 'image drag drop support')

old_setup = "const board=$('board');if(board){board.addEventListener('wheel',e=>{e.preventDefault();setZoom(zoom*(e.deltaY<0?1.08:.92))},{passive:false});board.addEventListener('pointermove',updatePlacementGhostV110,true);board.addEventListener('pointermove',updateDrawCursorPositionV110,true);board.addEventListener('pointerleave',()=>$('drawCursor')?.classList.remove('show'));board.addEventListener('pointerdown',e=>{if(e.button===1){e.preventDefault();e.stopImmediatePropagation();return}if(pendingPlacement)placePendingV110(e)},true);board.addEventListener('auxclick',e=>{if(e.button===1)e.preventDefault()})}"
new_setup = "const board=$('board');if(board){board.addEventListener('wheel',e=>{e.preventDefault();setZoom(zoom*(e.deltaY<0?1.08:.92))},{passive:false});board.addEventListener('pointermove',updatePlacementGhostV110,true);board.addEventListener('pointermove',updateDrawCursorPositionV110,true);board.addEventListener('pointerleave',()=>$('drawCursor')?.classList.remove('show'));board.addEventListener('pointerdown',e=>{if(e.button===1){e.preventDefault();e.stopImmediatePropagation();return}if(pendingPlacement)placePendingV110(e)},true);board.addEventListener('auxclick',e=>{if(e.button===1)e.preventDefault()});board.addEventListener('dragenter',e=>{if([...(e.dataTransfer?.items||[])].some(x=>x.kind==='file')){e.preventDefault();board.classList.add('image-drop-ready')}});board.addEventListener('dragover',e=>{if([...(e.dataTransfer?.items||[])].some(x=>x.kind==='file')){e.preventDefault();e.dataTransfer.dropEffect='copy';board.classList.add('image-drop-ready')}});board.addEventListener('dragleave',e=>{if(!board.contains(e.relatedTarget))board.classList.remove('image-drop-ready')});board.addEventListener('drop',handleCanvasImageDropV114)}"
s = once(s, old_setup, new_setup, 'board image drop listeners')
p.write_text(s, encoding='utf-8')

# Host-side user emoticon manager. This reads only until the user explicitly adds/deletes an emoticon.
p = Path('assets/content-planner-host.js')
h = p.read_text(encoding='utf-8').replace('1.0.13', '1.0.14')
h = once(h,
    "function sendContacts(){const frame=document.getElementById(FRAME_ID);if(!frame?.contentWindow)return;try{frame.contentWindow.postMessage({type:'mws:planner-contacts',contacts:contactsForPlanner()},location.origin)}catch(error){console.warn('Content Planner contact sync failed',error)}}",
    "function sendContacts(){const frame=document.getElementById(FRAME_ID);if(!frame?.contentWindow)return;try{frame.contentWindow.postMessage({type:'mws:planner-contacts',contacts:contactsForPlanner()},location.origin)}catch(error){console.warn('Content Planner contact sync failed',error)}}\nfunction emoticonsForPlanner(){const d=rootData();return (Array.isArray(d?.emoticons)?d.emoticons:[]).map(x=>({id:String(x?.id||''),name:String(x?.name||'이모티콘'),src:String(x?.src||'')})).filter(x=>x.id&&x.src)}\nfunction sendEmoticons(){const frame=document.getElementById(FRAME_ID);if(!frame?.contentWindow)return;try{frame.contentWindow.postMessage({type:'mws:planner-emoticons',emoticons:emoticonsForPlanner()},location.origin)}catch(error){console.warn('Content Planner emoticon sync failed',error)}}\nfunction sendPlannerData(){sendContacts();sendEmoticons()}",
    'host planner data sync')
h = h.replace('setTimeout(sendContacts,0)', 'setTimeout(sendPlannerData,0)')

manager = r'''function hostEscV114(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function readFileV114(file){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(String(r.result||''));r.onerror=()=>rej(r.error);r.readAsDataURL(file)})}
async function normalizeEmoticonImageV114(file){if(!file||!String(file.type||'').startsWith('image/'))throw new Error('이미지 파일만 추가할 수 있습니다.');if(file.size>20*1024*1024)throw new Error(`${file.name}: 20MB 이하 이미지를 사용해 주세요.`);try{const bmp=await createImageBitmap(file),max=512,scale=Math.min(1,max/Math.max(bmp.width,bmp.height)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(bmp.width*scale));c.height=Math.max(1,Math.round(bmp.height*scale));c.getContext('2d').drawImage(bmp,0,0,c.width,c.height);bmp.close?.();return c.toDataURL('image/webp',.92)}catch(_){return readFileV114(file)}}
function renderEmoticonManagerV114(){const list=document.getElementById('mwsEmoticonListV114');if(!list)return;const arr=emoticonsForPlanner();const count=document.getElementById('mwsEmoticonCountV114');if(count)count.textContent=`${arr.length}개`;list.innerHTML=arr.length?arr.map(x=>`<div style="display:grid;grid-template-columns:54px 1fr auto;gap:10px;align-items:center;padding:9px;border:1px solid var(--border);border-radius:11px;background:var(--input)"><img src="${hostEscV114(x.src)}" alt="" style="width:54px;height:54px;object-fit:contain;border-radius:9px;background:rgba(255,255,255,.05)"><div style="min-width:0"><b style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${hostEscV114(x.name)}</b><small class="muted">사용자 이모티콘</small></div><button type="button" class="danger" data-emoticon-delete="${hostEscV114(x.id)}">삭제</button></div>`).join(''):'<div class="muted small" style="padding:14px;text-align:center">추가된 사용자 이모티콘이 없습니다.</div>';list.querySelectorAll('[data-emoticon-delete]').forEach(b=>b.onclick=async()=>{const d=rootData();if(!d)return;d.emoticons=emoticonsForPlanner().filter(x=>x.id!==b.dataset.emoticonDelete);const saver=window.saveData||window.persist;if(typeof saver==='function')await saver('이모티콘 삭제');renderEmoticonManagerV114();sendEmoticons()})}
function ensureEmoticonManagerV114(){if(document.getElementById('mwsEmoticonManagerCardV114'))return;const section=document.getElementById('export');const grid=section?.querySelector('.grid.cols-2');if(!grid)return;const card=document.createElement('div');card.id='mwsEmoticonManagerCardV114';card.className='card';card.innerHTML='<h3>이모티콘</h3><p class="muted small">컨텐츠 플래너에서 사용할 사용자 이모티콘 이미지를 추가하거나 삭제합니다. 전체 백업에도 함께 포함됩니다.</p><div class="row"><button type="button" class="primary" id="mwsEmoticonOpenV114">이모티콘 관리</button><span class="chip" id="mwsEmoticonCountV114">0개</span></div>';grid.appendChild(card);const modal=document.createElement('div');modal.id='mwsEmoticonModalV114';modal.className='modal';modal.innerHTML='<div class="modalbox" style="width:min(760px,94vw);max-height:86vh;display:flex;flex-direction:column"><div class="space"><div><h2 style="margin:0">이모티콘 관리</h2><div class="muted small" style="margin-top:4px">PNG, JPG, WEBP 등 이미지 파일을 추가할 수 있습니다.</div></div><button type="button" class="secondary" id="mwsEmoticonCloseV114">닫기</button></div><div class="row" style="margin:14px 0"><label class="primary" style="display:inline-block">사진 추가<input id="mwsEmoticonFilesV114" type="file" accept="image/*" multiple style="display:none"></label><span class="muted small">추가한 이미지는 플래너 이모티콘 목록 맨 앞에 표시됩니다.</span></div><div id="mwsEmoticonListV114" style="display:grid;gap:8px;overflow:auto;min-height:120px"></div></div>';document.body.appendChild(modal);document.getElementById('mwsEmoticonOpenV114').onclick=()=>{renderEmoticonManagerV114();modal.classList.add('open')};document.getElementById('mwsEmoticonCloseV114').onclick=()=>modal.classList.remove('open');modal.onclick=e=>{if(e.target===modal)modal.classList.remove('open')};document.getElementById('mwsEmoticonFilesV114').onchange=async e=>{const files=[...(e.target.files||[])];if(!files.length)return;const d=rootData();if(!d)return;const next=emoticonsForPlanner();try{for(const file of files){const src=await normalizeEmoticonImageV114(file),base=String(file.name||'이모티콘').replace(/\.[^.]+$/,'')||'이모티콘';next.push({id:'user-'+(crypto.randomUUID?.()||Date.now()+'-'+Math.random().toString(16).slice(2)),name:base,src})}d.emoticons=next;const saver=window.saveData||window.persist;if(typeof saver==='function')await saver('이모티콘 추가');renderEmoticonManagerV114();sendEmoticons()}catch(err){alert(err?.message||String(err))}finally{e.target.value=''}};renderEmoticonManagerV114()}
'''
h = once(h, 'function install(){syncGlobals();forceVersion();ensureStyle();ensureSection();ensureNav();loadTools()}', manager + 'function install(){syncGlobals();forceVersion();ensureStyle();ensureSection();ensureNav();ensureEmoticonManagerV114();loadTools()}', 'host emoticon manager')
h = h.replace("if(event.data?.type==='mws:planner-request-contacts')sendContacts()", "if(event.data?.type==='mws:planner-request-contacts'||event.data?.type==='mws:planner-request-emoticons')sendPlannerData()")
h = h.replace('forceVersion();sendContacts()', 'forceVersion();sendPlannerData()')
p.write_text(h, encoding='utf-8')

# Version alignment only. No data migration, reset, seed, or production data writes.
for fn in ['index.html', 'assets/tools.js', 'assets/test-v5.5.js', 'assets/test-v5.6.js', 'src/cf-v571.js']:
    q = Path(fn)
    t = q.read_text(encoding='utf-8').replace('1.0.13', '1.0.14')
    q.write_text(t, encoding='utf-8')
q = Path('index.html')
t = q.read_text(encoding='utf-8').replace('Admin은 변경사항을 Supabase 공유 데이터에 저장합니다.', 'Admin은 변경사항을 온라인 공유 데이터에 저장합니다.')
q.write_text(t, encoding='utf-8')
q = Path('package.json')
d = json.loads(q.read_text(encoding='utf-8'))
d['version'] = '1.0.14'
q.write_text(json.dumps(d, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
q = Path('README.md')
t = q.read_text(encoding='utf-8')
t = re.sub(r'Current release: .*', 'Current release: CF MWS V1.0.14', t, count=1)
q.write_text(t, encoding='utf-8')
