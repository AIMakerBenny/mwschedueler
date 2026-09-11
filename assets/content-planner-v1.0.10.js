/* MAWANG Content Planner V1.0.10 UI patch */
(()=>{
'use strict';
if(window.__mwsPlannerV110)return;
window.__mwsPlannerV110=1;

const $all=(sel,root=document)=>Array.from(root.querySelectorAll(sel));
const textOf=el=>String(el?.textContent||'').replace(/\s+/g,' ').trim();
const visible=el=>{if(!el)return false;const r=el.getBoundingClientRect();const s=getComputedStyle(el);return r.width>2&&r.height>2&&s.display!=='none'&&s.visibility!=='hidden'};
const buttons=()=> $all('button,[role="button"],input[type="button"],input[type="submit"]');
function findControl(re){return buttons().find(el=>re.test([textOf(el),el.getAttribute('title')||'',el.getAttribute('aria-label')||'',el.dataset?.tool||''].join(' '))&&visible(el))||null}
function css(){
  if(document.getElementById('mwsPlannerV110Style'))return;
  const s=document.createElement('style');s.id='mwsPlannerV110Style';s.textContent=`
  .mws-v110-tabbar{background:#0b1020!important;color:#e5e7eb!important;border-color:#26334d!important}
  .mws-v110-tabbar *{border-color:#26334d}
  #mwsV110RotateWrap{display:flex;align-items:center;gap:8px;min-width:210px;padding:8px 10px;border:1px solid #26334d;border-radius:10px;background:#111827;color:#e5e7eb;font-size:12px;font-weight:800}
  #mwsV110RotateWrap input{width:120px;accent-color:#7c5cff}#mwsV110RotateWrap output{min-width:40px;text-align:right;color:#c4b5fd}
  #mwsPlannerFullscreenBtn{display:block;width:100%;min-height:48px;margin-top:10px;border:1px solid #7357ff;border-radius:12px;background:linear-gradient(135deg,#6d4aff,#8b5cf6);color:#fff;font:900 15px/1 Pretendard,"Noto Sans KR",sans-serif;cursor:pointer;box-shadow:0 8px 22px rgba(109,74,255,.22)}
  #mwsPlannerFullscreenExit{position:fixed;right:18px;top:18px;z-index:2147483646;border:1px solid #5f6b85;border-radius:12px;background:#111827;color:#fff;padding:12px 16px;font-weight:900;cursor:pointer;display:none}
  #mwsV110BlankPanel{display:none}
  body.mws-v110-focus{overflow:hidden!important;background:#060914!important}
  body.mws-v110-focus [data-mws-v110-canvas-host="1"]{position:fixed!important;left:0!important;top:0!important;width:72vw!important;height:100vh!important;max-width:none!important;max-height:none!important;margin:0!important;border-radius:0!important;z-index:2147483600!important;overflow:auto!important;background:#fff!important;box-sizing:border-box!important}
  body.mws-v110-focus [data-mws-v110-tool-panel="1"]{position:fixed!important;right:0!important;top:0!important;width:28vw!important;height:50vh!important;max-width:none!important;max-height:50vh!important;margin:0!important;border-radius:0!important;z-index:2147483601!important;overflow:auto!important;background:#0b1020!important;box-sizing:border-box!important;padding:14px!important}
  body.mws-v110-focus #mwsV110BlankPanel{display:block;position:fixed;right:0;bottom:0;width:28vw;height:50vh;background:#070b14;z-index:2147483599;border-top:1px solid #26334d;box-sizing:border-box}
  body.mws-v110-focus #mwsPlannerFullscreenExit{display:block}
  body.mws-v110-focus .mws-v110-tabbar{background:#0b1020!important}
  .mws-v110-custom-first{order:-10!important}
  .mws-v110-sticky{rotate:var(--mws-v110-rotate,0deg)!important;transform-origin:center center!important}
  `;document.head.appendChild(s);
}

function findWideRow(el){
  let p=el;
  for(let i=0;i<6&&p&&p!==document.body;i++,p=p.parentElement){
    const r=p.getBoundingClientRect();
    if(r.width>innerWidth*.55&&r.height>=30&&r.height<=120)return p;
  }
  return null;
}
function darkenTabBar(){
  const auto=$all('body *').find(e=>e.children.length===0&&/자동\s*저장됨/.test(textOf(e))&&visible(e));
  let row=auto?findWideRow(auto):null;
  if(!row){
    const tab=$all('button,[role="tab"],div').find(e=>/제목\s*없는\s*기획/.test(textOf(e))&&visible(e));
    if(tab)row=findWideRow(tab);
  }
  if(row)row.classList.add('mws-v110-tabbar');
}

let brushChosen=false;
function chooseBrush(force=false){
  if(brushChosen&&!force)return;
  const b=findControl(/브러[시쉬]|\bbrush\b/i);
  if(!b)return;
  try{b.click();brushChosen=true}catch(_){ }
}

function customImageScore(img){
  const src=String(img.currentSrc||img.src||'').toLowerCase();
  if(!src)return 0;
  if(src.startsWith('data:image/svg')||src.includes('twemoji')||src.includes('emoji-data')||src.includes('/icons/'))return 0;
  if(src.startsWith('data:image/png')||src.startsWith('data:image/gif')||src.startsWith('data:image/webp')||src.startsWith('blob:'))return 4;
  if(/\.(png|gif|webp)(\?|$)/.test(src))return 3;
  if(/custom|user|upload|emoticon|sticker/.test(src))return 2;
  return 0;
}
function reorderCustomEmoticons(root=document){
  const candidates=$all('div,section,aside,dialog',root).filter(el=>{
    if(!visible(el))return false;
    const imgs=$all('img',el).filter(visible);
    if(imgs.length<6)return false;
    const t=textOf(el).slice(0,500);
    const cs=getComputedStyle(el),r=el.getBoundingClientRect();
    return /이모티콘|스티커|emoji|sticker/i.test(t)||((cs.overflowY==='auto'||cs.overflowY==='scroll'||cs.position==='fixed'||cs.position==='absolute')&&r.width<700&&r.height<700);
  });
  for(const panel of candidates){
    const tiles=[];
    for(const img of $all('img',panel)){
      const tile=img.closest('button,[role="button"],li,[class*="item"],[class*="tile"],div');
      if(!tile||tile===panel||!panel.contains(tile))continue;
      if(!tiles.includes(tile))tiles.push(tile);
    }
    if(tiles.length<6)continue;
    const parent=tiles[0]?.parentElement;
    if(!parent||!tiles.every(x=>x.parentElement===parent))continue;
    const custom=tiles.filter(tile=>customImageScore(tile.querySelector('img'))>0);
    if(!custom.length)continue;
    const ref=tiles[0];
    for(const tile of custom){tile.classList.add('mws-v110-custom-first');parent.insertBefore(tile,ref)}
  }
}

let currentSticky=null;
function rgbParts(c){const m=String(c||'').match(/rgba?\((\d+)[, ]+(\d+)[, ]+(\d+)/i);return m?m.slice(1,4).map(Number):null}
function looksSticky(el){
  if(!el||el===document.body||el===document.documentElement)return false;
  const meta=[el.className,el.id,el.getAttribute('data-type'),el.getAttribute('data-tool'),el.getAttribute('aria-label')].filter(Boolean).join(' ').toLowerCase();
  if(/sticky|post.?it|postit|memo|note/.test(meta))return true;
  const bg=rgbParts(getComputedStyle(el).backgroundColor);
  const hasClose=!!el.querySelector('button,.delete,[class*="delete"],[class*="close"]');
  const abs=['absolute','fixed'].includes(getComputedStyle(el).position);
  return !!(bg&&bg[0]>220&&bg[1]>190&&bg[2]<190&&hasClose&&abs);
}
function stickyFromTarget(t){
  let p=t instanceof Element?t:null;
  for(let i=0;i<7&&p&&p!==document.body;i++,p=p.parentElement)if(looksSticky(p))return p;
  return null;
}
function rotateKey(el){return el?.dataset?.id||el?.getAttribute('data-id')||el?.id||''}
function loadRotation(el){
  if(!el)return 0;
  if(el.dataset.mwsRotation!=null)return Number(el.dataset.mwsRotation)||0;
  let v=0;const k=rotateKey(el);
  if(k)try{v=Number(JSON.parse(localStorage.getItem('mws_planner_rotation_v110')||'{}')[k])||0}catch(_){ }
  el.dataset.mwsRotation=String(v);return v;
}
function saveRotation(el,v){
  if(!el)return;el.dataset.mwsRotation=String(v);el.style.setProperty('--mws-v110-rotate',`${v}deg`);el.classList.add('mws-v110-sticky');
  const k=rotateKey(el);if(k)try{const map=JSON.parse(localStorage.getItem('mws_planner_rotation_v110')||'{}');map[k]=v;localStorage.setItem('mws_planner_rotation_v110',JSON.stringify(map))}catch(_){ }
  el.dispatchEvent(new Event('change',{bubbles:true}));
}
function findToolbar(){
  const submit=findControl(/기획안\s*제출/);
  if(!submit)return null;
  let p=submit.parentElement,best=null;
  for(let i=0;i<7&&p&&p!==document.body;i++,p=p.parentElement){
    const r=p.getBoundingClientRect(),n=p.querySelectorAll('button').length;
    if(n>=4&&r.width>300&&r.height<520)best=p;
  }
  return best||submit.parentElement;
}
function ensureRotateControl(){
  if(document.getElementById('mwsV110RotateWrap'))return;
  const toolbar=findToolbar();if(!toolbar)return;
  const wrap=document.createElement('label');wrap.id='mwsV110RotateWrap';wrap.innerHTML='<span>포스트잇 기울기</span><input type="range" min="-45" max="45" step="1" value="0"><output>0°</output>';
  const input=wrap.querySelector('input'),out=wrap.querySelector('output');input.disabled=true;
  input.addEventListener('input',()=>{const v=Number(input.value)||0;out.value=`${v}°`;out.textContent=`${v}°`;if(currentSticky)saveRotation(currentSticky,v)});
  toolbar.appendChild(wrap);
}
function selectSticky(el){
  currentSticky=el;ensureRotateControl();if(!el)return;
  const v=loadRotation(el);saveRotation(el,v);
  const input=document.querySelector('#mwsV110RotateWrap input'),out=document.querySelector('#mwsV110RotateWrap output');
  if(input){input.disabled=false;input.value=String(v)}if(out){out.value=`${v}°`;out.textContent=`${v}°`}
}
function normalizeExistingStickies(){for(const el of $all('[class*="sticky"],[class*="post"],[class*="memo"],[class*="note"]'))if(looksSticky(el)){const v=loadRotation(el);saveRotation(el,v)}}

function findCanvasHost(toolPanel){
  const canvases=$all('canvas').filter(visible).sort((a,b)=>b.getBoundingClientRect().width*b.getBoundingClientRect().height-a.getBoundingClientRect().width*a.getBoundingClientRect().height);
  for(const c of canvases){
    let p=c.parentElement,best=c;
    for(let i=0;i<6&&p&&p!==document.body;i++,p=p.parentElement){const r=p.getBoundingClientRect();if(r.width>innerWidth*.45&&r.height>innerHeight*.35&&!p.contains(toolPanel))best=p}
    if(best!==c)return best;
  }
  let best=null,area=0;
  for(const el of $all('main,section,div')){
    if(!visible(el)||el===toolPanel||el.contains(toolPanel))continue;
    const r=el.getBoundingClientRect();if(r.width<innerWidth*.45||r.height<innerHeight*.35)continue;
    const bg=rgbParts(getComputedStyle(el).backgroundColor);if(!bg||Math.min(...bg)<240)continue;
    const a=r.width*r.height;if(a>area){area=a;best=el}
  }
  return best;
}
function exitFocus(){
  document.body.classList.remove('mws-v110-focus');
  document.querySelector('[data-mws-v110-canvas-host="1"]')?.removeAttribute('data-mws-v110-canvas-host');
  document.querySelector('[data-mws-v110-tool-panel="1"]')?.removeAttribute('data-mws-v110-tool-panel');
  if(document.fullscreenElement)document.exitFullscreen?.().catch(()=>{});
}
function enterFocus(){
  const tool=findToolbar(),canvas=findCanvasHost(tool);if(!tool||!canvas){alert('전체화면 레이아웃을 찾지 못했습니다.');return}
  tool.dataset.mwsV110ToolPanel='1';canvas.dataset.mwsV110CanvasHost='1';document.body.classList.add('mws-v110-focus');
  document.documentElement.requestFullscreen?.().catch(()=>{});
}
function ensureFullscreen(){
  const submit=findControl(/기획안\s*제출/);if(!submit)return;
  if(!document.getElementById('mwsPlannerFullscreenBtn')){
    const b=document.createElement('button');b.id='mwsPlannerFullscreenBtn';b.type='button';b.textContent='전체화면';b.addEventListener('click',enterFocus);
    const parent=submit.parentElement;parent?.insertAdjacentElement('afterend',b);
  }
  if(!document.getElementById('mwsPlannerFullscreenExit')){const e=document.createElement('button');e.id='mwsPlannerFullscreenExit';e.type='button';e.textContent='전체화면 취소';e.addEventListener('click',exitFocus);document.body.appendChild(e)}
  if(!document.getElementById('mwsV110BlankPanel')){const blank=document.createElement('div');blank.id='mwsV110BlankPanel';document.body.appendChild(blank)}
}

function apply(){css();darkenTabBar();ensureRotateControl();ensureFullscreen();normalizeExistingStickies();reorderCustomEmoticons()}

document.addEventListener('pointerdown',e=>{const s=stickyFromTarget(e.target);if(s)selectSticky(s)},true);
document.addEventListener('click',e=>{
  const ctl=e.target.closest('button,[role="button"]');const meta=ctl?[textOf(ctl),ctl.title||'',ctl.getAttribute('aria-label')||''].join(' '):'';
  if(/이모티콘|스티커|emoji|sticker/i.test(meta))setTimeout(()=>reorderCustomEmoticons(),40);
  if(ctl&&(/^\+$/.test(textOf(ctl))||/새\s*메모/.test(meta)))setTimeout(()=>{chooseBrush(true);darkenTabBar()},80);
  setTimeout(()=>{ensureFullscreen();ensureRotateControl()},60);
},true);
document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement&&document.body.classList.contains('mws-v110-focus'))exitFocus()});
window.addEventListener('DOMContentLoaded',()=>{apply();setTimeout(()=>chooseBrush(false),120)},{once:true});
window.addEventListener('load',()=>{apply();setTimeout(()=>chooseBrush(false),120)},{once:true});
[80,220,500,1000,1800,3000].forEach(ms=>setTimeout(()=>{apply();if(ms<=500)chooseBrush(false)},ms));
if(document.readyState!=='loading'){apply();setTimeout(()=>chooseBrush(false),120)}
})();
