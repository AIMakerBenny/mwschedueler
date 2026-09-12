from pathlib import Path
p=Path('content-planner.html')
s=p.read_text(encoding='utf-8')
old="function renderSelectionOnly(){document.querySelectorAll('.node').forEach(n=>n.classList.toggle('selected',selectedIds.includes(n.dataset.id)));renderInspector();renderConnectors()}"
new="function renderSelectionOnly(){document.querySelectorAll('.node').forEach(n=>{const selected=selectedIds.includes(n.dataset.id);n.classList.toggle('selected',selected);if(n.classList.contains('text-node')||n.classList.contains('sticky-node'))n.querySelectorAll('.editable').forEach(ed=>ed.setAttribute('contenteditable',selected?'true':'false'))});renderInspector();renderConnectors()}"
if s.count(old)!=1: raise SystemExit('renderSelectionOnly match failed')
s=s.replace(old,new,1)
old="node.addEventListener('pointerdown',ev=>{if(ev.target.closest('.resize-handle,.drag-handle,.node-delete,video'))return;const editable=ev.target.closest('[contenteditable]');if(editable){if(!selectedIds.includes(id)){ev.preventDefault();selectNode(id,ev)}return}selectNode(id,ev)});"
new="node.addEventListener('pointerdown',ev=>{if(ev.target.closest('.resize-handle,.drag-handle,.node-delete,video'))return;const editable=ev.target.closest('[contenteditable]');if(editable){if(!selectedIds.includes(id)){ev.preventDefault();selectNode(id,ev);editable.setAttribute('contenteditable','true');setTimeout(()=>editable.focus(),0)}return}selectNode(id,ev)});"
if s.count(old)!=1: raise SystemExit('bindNodes editable match failed')
s=s.replace(old,new,1)
old="function beginDrag(ev,e,node){\n  ev.preventDefault();ev.stopPropagation();snapshot();if(!selectedIds.includes(e.id))selectedIds=[e.id];const start={x:ev.clientX,y:ev.clientY};const originals=new Map(selectedIds.map(id=>{const n=getEl(id);return[id,{x:n.x,y:n.y}]}));\n  const move=m=>{const sc=boardScaleV110(),dx=(m.clientX-start.x)/Math.max(.0001,sc.x),dy=(m.clientY-start.y)/Math.max(.0001,sc.y);for(const [id,o] of originals){const n=getEl(id);n.x=clamp(o.x+dx,0,BOARD_W-n.w);n.y=clamp(o.y+dy,0,BOARD_H-n.h)}renderPositions()};\n  const up=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);touch()};window.addEventListener('pointermove',move);window.addEventListener('pointerup',up,{once:true})\n}"
new="function beginDrag(ev,e,node){\n  ev.preventDefault();ev.stopPropagation();snapshot();if(!selectedIds.includes(e.id))selectedIds=[e.id];const start=boardPoint(ev),originals=new Map(selectedIds.map(id=>{const n=getEl(id);return[id,{x:n.x,y:n.y}]}));\n  const move=m=>{const cur=boardPoint(m),dx=cur.x-start.x,dy=cur.y-start.y;for(const [id,o] of originals){const n=getEl(id);n.x=clamp(o.x+dx,0,BOARD_W-n.w);n.y=clamp(o.y+dy,0,BOARD_H-n.h)}renderPositions()};\n  const up=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);touch()};window.addEventListener('pointermove',move);window.addEventListener('pointerup',up,{once:true})\n}"
if s.count(old)!=1: raise SystemExit('beginDrag match failed')
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')
