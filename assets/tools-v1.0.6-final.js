/* CF MWS V 1.0.6 - tools polish + live search */
(()=>{
'use strict';
if(window.__mwsToolsFinalV106)return;
window.__mwsToolsFinalV106=1;

const BUILD='CF MWS V 1.0.6';
const qs=(s,r=document)=>r.querySelector(s);
const qsa=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const uid=()=>{try{return crypto.randomUUID()}catch(_){return'id_'+Date.now()+'_'+Math.random().toString(36).slice(2)}};
const state={search:{toolTier:'',toolMatrix:'',toolRelations:''},relSelected:new Set(),busy:false,pending:false};

function tools(){
  try{return window.data?.miniGames?.toolsV1||null}catch(_){return null}
}
function save(reason){
  try{if(typeof window.saveData==='function')window.saveData(reason||'도구 수정');else if(typeof window.persist==='function')window.persist()}catch(e){console.error(e)}
}
function forceVersion(){
  try{
    document.body?.setAttribute('data-build-version',BUILD);
    qsa('[id^="mwsBuildVersionV5"],#mwsBuildVersion,.sidebar-build-version-v52,.sidebar-build-version-v53,[class*="sidebar-build-version"]').forEach(x=>{if(x.textContent!==BUILD)x.textContent=BUILD});
  }catch(_){ }
}

function ensureStyle(){
  if(qs('#mwsToolsFinalV106Style'))return;
  const s=document.createElement('style');
  s.id='mwsToolsFinalV106Style';
  s.textContent=`
button[data-tab="toolRecords"],#toolRecords{display:none!important}
.mws-contact-drawer{position:static!important;bottom:auto!important;margin-top:18px!important;box-shadow:none!important}
.mws-drawer-head b{font-size:15px!important}
.mws-contact-track{display:grid!important;grid-template-columns:repeat(auto-fill,minmax(150px,1fr))!important;gap:8px!important;max-height:none!important;min-height:90px!important;overflow:visible!important;padding:8px 2px 4px!important}
.mws-contact-chip{width:auto!important;min-width:0!important;max-width:none!important;flex:none!important}
.mws-person-search-v106{width:min(440px,100%);box-sizing:border-box;border:1px solid var(--border);background:var(--input);color:var(--text);border-radius:9px;padding:9px 11px;margin:9px 0 2px;font:inherit}
.mws-tier-row{grid-template-columns:300px minmax(0,1fr)!important;min-height:100px!important}
.mws-tier-meta{display:grid!important;grid-template-columns:68px minmax(0,1fr) 34px!important;align-items:center!important;gap:8px!important;padding:10px!important}
.mws-tier-meta>input[type="text"]:first-child{font-size:21px!important;font-weight:950!important;text-align:center!important;min-width:0!important}
.mws-tier-title-v106{width:100%!important;min-width:0!important;box-sizing:border-box;border:1px solid rgba(0,0,0,.18);background:rgba(255,255,255,.72);color:#111;border-radius:7px;padding:9px 10px;font-weight:800}
.mws-tier-delete-v106{width:32px;height:32px;padding:0;border:0;border-radius:8px;background:rgba(80,0,12,.78);color:#fff;font-size:18px;font-weight:900}
.mws-tier-meta>textarea,.mws-tier-meta>input[type="color"],.mws-tier-meta>.mws-tier-mini{display:none!important}
.mws-matrix-actions-v106{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-left:auto}
.mws-matrix-size-v106{display:flex;align-items:center;gap:8px;border:1px solid var(--border);background:var(--panel);border-radius:10px;padding:7px 10px;font-size:12px;font-weight:850}
.mws-matrix-size-v106 input{width:170px;accent-color:var(--accent)}
.mws-matrix-size-v106 output{min-width:44px;text-align:right}
.mws-matrix-node{transform:translate(-50%,-50%) scale(var(--mws-matrix-card-scale,1.5))!important;transform-origin:center!important}
.mws-relation-board{touch-action:none!important;user-select:none}
.mws-marquee-v106{position:absolute;z-index:30;border:1px solid var(--accent);background:color-mix(in srgb,var(--accent) 14%,transparent);pointer-events:none;border-radius:4px}
.mws-rel-svg path{fill:none;stroke-width:2.5;vector-effect:non-scaling-stroke}
.mws-rel-svg text{paint-order:stroke;stroke:#0b1020;stroke-width:4px}
@media(max-width:760px){.mws-tier-row{grid-template-columns:1fr!important}.mws-tier-meta{grid-template-columns:58px minmax(0,1fr) 32px!important}.mws-contact-track{grid-template-columns:repeat(auto-fill,minmax(135px,1fr))!important}}
`;
  document.head.appendChild(s);
}

function sectionKind(sec){
  if(!sec)return'';
  if(sec.id==='toolTier')return'toolTier';
  if(sec.id==='toolMatrix')return'toolMatrix';
  if(sec.id==='toolRelations')return'toolRelations';
  return'';
}
function filterDrawer(drawer,kind){
  const q=(state.search[kind]||'').trim().toLocaleLowerCase('ko');
  qsa('.mws-contact-chip',drawer).forEach(ch=>{
    const name=(qs('span',ch)?.textContent||'').toLocaleLowerCase('ko');
    ch.hidden=!!q&&!name.includes(q);
  });
}
function patchDrawer(drawer){
  const sec=drawer.closest('.section');
  const kind=sectionKind(sec);
  if(!kind)return;
  const head=qs('.mws-drawer-head',drawer);
  const title=head?.querySelector('b');
  if(title&&title.textContent!=='인물')title.textContent='인물';
  let input=qs('.mws-person-search-v106',drawer);
  if(!input){
    input=document.createElement('input');
    input.type='search';
    input.className='mws-person-search-v106';
    input.placeholder='이름 검색';
    input.autocomplete='off';
    input.value=state.search[kind]||'';
    input.addEventListener('input',()=>{state.search[kind]=input.value;filterDrawer(drawer,kind)});
    const tags=qs('.mws-tag-strip',drawer);
    (tags||qs('.mws-contact-track',drawer))?.insertAdjacentElement('beforebegin',input);
  }
  if(input.value!==state.search[kind])input.value=state.search[kind]||'';
  filterDrawer(drawer,kind);
}

function patchTier(){
  const sec=qs('#toolTier');
  if(!sec)return;
  qsa('.mws-tier-meta',sec).forEach(meta=>{
    const name=qs('input[type="text"]',meta);
    const ta=qs('textarea',meta);
    if(!name||!ta)return;
    if(!meta.dataset.v106){
      meta.dataset.v106='1';
      const m=(ta.getAttribute('oninput')||'').match(/mwsTierEdit\('([^']+)'\s*,\s*'desc'/);
      const id=m?.[1]||'';
      const title=document.createElement('input');
      title.type='text';
      title.className='mws-tier-title-v106';
      title.placeholder='제목';
      title.value=ta.value||'';
      title.addEventListener('input',()=>{if(id&&typeof window.mwsTierEdit==='function')window.mwsTierEdit(id,'desc',title.value)});
      name.insertAdjacentElement('afterend',title);
      const del=document.createElement('button');
      del.type='button';
      del.className='mws-tier-delete-v106';
      del.textContent='×';
      del.title='티어 삭제';
      del.addEventListener('click',()=>{if(id&&typeof window.mwsTierDel==='function')window.mwsTierDel(id)});
      title.insertAdjacentElement('afterend',del);
    }
  });
  qsa('.mws-contact-drawer',sec).forEach(patchDrawer);
}

function getMatrix(){return tools()?.matrix||null}
function matrixScale(){const m=getMatrix();return Math.max(70,Math.min(220,Number(m?.cardScale)||150))}
function applyMatrixScale(){
  const v=matrixScale()/100;
  qsa('#toolMatrix .mws-matrix-node').forEach(n=>n.style.setProperty('--mws-matrix-card-scale',String(v)));
  const o=qs('#toolMatrix .mws-matrix-size-v106 output');if(o)o.value=Math.round(v*100)+'%';
  const r=qs('#toolMatrix .mws-matrix-size-v106 input');if(r&&Number(r.value)!==Math.round(v*100))r.value=String(Math.round(v*100));
}
function patchMatrix(){
  const sec=qs('#toolMatrix');if(!sec)return;
  const head=qs('.mws-tools-head',sec);
  if(head&&!qs('.mws-matrix-size-v106',head)){
    const actions=document.createElement('div');actions.className='mws-matrix-actions-v106';
    const label=document.createElement('label');label.className='mws-matrix-size-v106';
    label.innerHTML=`<span>카드 크기</span><input type="range" min="70" max="220" step="5"><output></output>`;
    const reset=[...head.querySelectorAll('button')].find(b=>(b.textContent||'').includes('초기화'));
    head.appendChild(actions);actions.appendChild(label);if(reset)actions.appendChild(reset);
    const input=qs('input',label);
    let t=0;
    input.value=String(matrixScale());
    input.addEventListener('input',()=>{
      const m=getMatrix();if(m)m.cardScale=Number(input.value);
      applyMatrixScale();clearTimeout(t);t=setTimeout(()=>save('2D Matrix 카드 크기'),250);
    });
  }
  applyMatrixScale();
  qsa('.mws-contact-drawer',sec).forEach(patchDrawer);
}

function relationData(){return tools()?.relations||null}
const relationColor=t=>({'친함':'#22c55e','협업':'#38bdf8','라이벌':'#f43f5e','소속':'#f59e0b','기타':'#8b5cf6'}[t]||'#8b5cf6');
function relationNodeId(node){
  const s=qs('.mws-x',node)?.getAttribute('onclick')||node.getAttribute('onclick')||'';
  return s.match(/mwsRelRemove\('([^']+)'\)/)?.[1]||s.match(/mwsRelSelect\('([^']+)'\)/)?.[1]||'';
}
function applyRelationSelection(){
  const board=qs('#mwsRelationBoard');if(!board)return;
  qsa('.mws-rel-node',board).forEach(n=>n.classList.toggle('selected',state.relSelected.has(relationNodeId(n))));
  const counter=[...qsa('#toolRelations .mws-relation-toolbar .muted.small')].find(x=>/명 선택/.test(x.textContent||''));
  if(counter)counter.textContent=`${state.relSelected.size}/2명 선택`;
}
function renderParallelEdges(){
  const r=relationData(),board=qs('#mwsRelationBoard'),svg=qs('.mws-rel-svg',board||document);
  if(!r||!board||!svg)return;
  const groups=new Map();
  for(const e of Array.isArray(r.edges)?r.edges:[]){
    const key=[String(e.a),String(e.b)].sort().join('|');
    if(!groups.has(key))groups.set(key,[]);groups.get(key).push(e);
  }
  const out=[];
  for(const list of groups.values()){
    list.forEach((e,i)=>{
      const a=r.nodes?.[e.a],b=r.nodes?.[e.b];if(!a||!b)return;
      const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1;
      const off=(i-(list.length-1)/2)*1.9;
      const ox=-dy/len*off,oy=dx/len*off;
      const x1=a.x+ox,y1=a.y+oy,x2=b.x+ox,y2=b.y+oy,tx=(a.x+b.x)/2+ox,ty=(a.y+b.y)/2+oy;
      out.push(`<path d="M ${x1}% ${y1}% L ${x2}% ${y2}%" style="stroke:${relationColor(e.type)}"></path><text x="${tx}%" y="${ty}%" text-anchor="middle">${esc(e.label||e.type)}</text>`);
    });
  }
  const html=out.join('');
  const sig=String(html.length)+':'+(Array.isArray(r.edges)?r.edges.map(e=>`${e.id}|${e.a}|${e.b}|${e.type}|${e.label}`).join('~'):'');
  if(svg.dataset.v106Sig!==sig){svg.dataset.v106Sig=sig;svg.innerHTML=html}
}
function overrideRelations(){
  if(window.mwsRelSelect&&!window.mwsRelSelect.__v106){
    const fn=id=>{
      id=String(id||'');if(!id)return;
      if(state.relSelected.has(id))state.relSelected.delete(id);else{if(state.relSelected.size>=2)state.relSelected.delete(state.relSelected.values().next().value);state.relSelected.add(id)}
      applyRelationSelection();
    };
    fn.__v106=true;window.mwsRelSelect=fn;
  }
  if(window.mwsRelConnect&&!window.mwsRelConnect.__v106){
    const fn=()=>{
      const ids=[...state.relSelected];
      if(ids.length!==2)return alert('관계도에서 인물 2명을 선택하세요.');
      const r=relationData();if(!r)return;
      if(!Array.isArray(r.edges))r.edges=[];
      r.edges.push({id:uid(),a:ids[0],b:ids[1],type:String(r.relationType||'친함'),label:String(r.relationLabel||'')});
      state.relSelected.clear();save('관계 연결');
      try{window.dispatchEvent(new Event('mawang:datachange'))}catch(_){ }
      setTimeout(()=>{applyAll();renderParallelEdges()},0);
    };
    fn.__v106=true;window.mwsRelConnect=fn;
  }
}
function installMarquee(){
  const board=qs('#mwsRelationBoard');if(!board||board.dataset.marqueeV106)return;
  board.dataset.marqueeV106='1';
  board.addEventListener('pointerdown',e=>{
    if(e.button!==0||e.target!==board)return;
    e.preventDefault();
    const br=board.getBoundingClientRect(),sx=e.clientX,sy=e.clientY;
    const box=document.createElement('div');box.className='mws-marquee-v106';board.appendChild(box);
    const move=ev=>{
      const x1=Math.max(br.left,Math.min(sx,ev.clientX)),y1=Math.max(br.top,Math.min(sy,ev.clientY));
      const x2=Math.min(br.right,Math.max(sx,ev.clientX)),y2=Math.min(br.bottom,Math.max(sy,ev.clientY));
      Object.assign(box.style,{left:(x1-br.left)+'px',top:(y1-br.top)+'px',width:(x2-x1)+'px',height:(y2-y1)+'px'});
    };
    const up=ev=>{
      window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);
      move(ev);const rr=box.getBoundingClientRect();
      const hits=qsa('.mws-rel-node',board).filter(n=>{const r=n.getBoundingClientRect();return r.right>=rr.left&&r.left<=rr.right&&r.bottom>=rr.top&&r.top<=rr.bottom}).map(relationNodeId).filter(Boolean).slice(0,2);
      box.remove();state.relSelected=new Set(hits);applyRelationSelection();
    };
    window.addEventListener('pointermove',move);window.addEventListener('pointerup',up,{once:true});
    move(e);
  });
}
function patchRelations(){
  const sec=qs('#toolRelations');if(!sec)return;
  qsa('.mws-contact-drawer',sec).forEach(patchDrawer);
  overrideRelations();installMarquee();applyRelationSelection();renderParallelEdges();
}

function removeRecords(){
  qsa('button[data-tab="toolRecords"],#toolRecords').forEach(x=>x.remove());
}

const flushGuard=new WeakSet();
function isSearchField(el){
  if(!(el instanceof HTMLInputElement||el instanceof HTMLTextAreaElement))return false;
  if(el.classList.contains('mws-person-search-v106'))return false;
  if(String(el.type||'').toLowerCase()==='search')return true;
  const meta=[el.id,el.name,el.className,el.placeholder,el.getAttribute('aria-label')].filter(Boolean).join(' ').toLowerCase();
  return /search|filter|find|검색|찾기/.test(meta);
}
function flushLegacySearch(el){
  if(!isSearchField(el)||flushGuard.has(el))return;
  flushGuard.add(el);
  try{
    try{el.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:null}))}catch(_){el.dispatchEvent(new Event('input',{bubbles:true}))}
    el.dispatchEvent(new KeyboardEvent('keyup',{bubbles:true,cancelable:true,key:'Unidentified',code:'Unidentified'}));
    el.dispatchEvent(new Event('change',{bubbles:true}));
  }finally{queueMicrotask(()=>flushGuard.delete(el))}
}
let searchTimer=0;
document.addEventListener('input',e=>{
  const el=e.target;if(flushGuard.has(el)||!isSearchField(el))return;
  clearTimeout(searchTimer);searchTimer=setTimeout(()=>flushLegacySearch(el),0);
},true);
document.addEventListener('compositionupdate',e=>{const el=e.target;if(isSearchField(el))setTimeout(()=>flushLegacySearch(el),0)},true);
document.addEventListener('compositionend',e=>{const el=e.target;if(isSearchField(el))setTimeout(()=>flushLegacySearch(el),0)},true);

function applyAll(){
  if(state.busy){state.pending=true;return}
  state.busy=true;
  try{ensureStyle();forceVersion();removeRecords();patchTier();patchMatrix();patchRelations()}
  catch(e){console.error('V1.0.6 tools patch failed',e)}
  finally{state.busy=false;if(state.pending){state.pending=false;requestAnimationFrame(applyAll)}}
}
let raf=0;
const observer=new MutationObserver(()=>{if(raf)return;raf=requestAnimationFrame(()=>{raf=0;applyAll()})});
observer.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('mawang:datachange',()=>setTimeout(applyAll,0));
window.addEventListener('DOMContentLoaded',applyAll,{once:true});
window.addEventListener('load',applyAll,{once:true});
[50,150,350,700,1200,2200,4000,7000].forEach(ms=>setTimeout(applyAll,ms));
if(document.readyState!=='loading')applyAll();
})();
