/* Mawang Scheduler v1.2.0 - Friend Finder LIVE screen previews */
(()=>{
'use strict';
if(window.__mwsFriendLivePreviewV120)return;
window.__mwsFriendLivePreviewV120=1;

const CACHE_KEY='mws_friend_live_preview_v120';
const CACHE_MAX_AGE=120000;
const REFRESH_MS=30000;
let rowsById=new Map();
let requestPromise=null;
let timer=0;
let decorateQueued=false;

function dataRef(){try{return data}catch(_){return window.data||null}}
function stationKey(raw){
  const text=String(raw||'').trim();if(!text)return'';
  try{
    const u=new URL(/^https?:\/\//i.test(text)?text:`https://${text}`);
    const host=u.hostname.toLowerCase(),parts=u.pathname.split('/').filter(Boolean);
    if(!/(sooplive|afreecatv)/.test(host))return'';
    if(parts[0]==='station'&&parts[1])return decodeURIComponent(parts[1]).toLowerCase();
    if((host.startsWith('bj.')||host.startsWith('play.'))&&parts[0])return decodeURIComponent(parts[0]).toLowerCase();
    if(parts[0]&&parts[0]!=='live'&&parts[0]!=='directory')return decodeURIComponent(parts[0]).toLowerCase();
  }catch(_){}
  return'';
}
function channelUrl(id){return `https://api-channel.sooplive.co.kr/v1.1/channel/${encodeURIComponent(id)}/home/section/broad`}
function userIdFromUrl(raw){try{const m=/\/v1\.1\/channel\/([^/]+)\/home\/section\/broad/.exec(new URL(raw).pathname);return m?decodeURIComponent(m[1]).toLowerCase():''}catch(_){return''}}
function liveData(row){try{return JSON.parse(String(row?.body||''))}catch(_){return null}}
function broadNo(d){return String(d?.broadNo??d?.broad_no??d?.bno??'').trim()}
function isLive(d){return Boolean(d&&typeof d==='object'&&(broadNo(d)||d.broadTitle||d.broad_title))}
function thumbnailUrl(bno){return bno?`https://liveimg.sooplive.co.kr/m/${encodeURIComponent(bno)}?mws=${Math.floor(Date.now()/REFRESH_MS)}`:''}
function playUrl(id,bno){return `https://play.sooplive.co.kr/${encodeURIComponent(id)}${bno?`/${encodeURIComponent(bno)}`:''}`}

function restore(){
  try{
    const saved=JSON.parse(sessionStorage.getItem(CACHE_KEY)||'null');
    if(!saved||Date.now()-Number(saved.at||0)>CACHE_MAX_AGE||!Array.isArray(saved.rows))return;
    for(const x of saved.rows)if(x?.id&&x?.data)rowsById.set(String(x.id),x.data);
  }catch(_){}
}
function persist(){
  try{sessionStorage.setItem(CACHE_KEY,JSON.stringify({at:Date.now(),rows:[...rowsById].map(([id,data])=>({id,data}))}))}catch(_){}
}
function targets(){
  const out=[];const seen=new Set();
  for(const c of Array.isArray(dataRef()?.contacts)?dataRef().contacts:[]){
    const id=stationKey(c?.stationUrl);if(!id||seen.has(id))continue;seen.add(id);out.push({id,url:channelUrl(id)});
  }
  return out;
}
async function refresh(force=false){
  if(requestPromise)return requestPromise;
  const list=targets();if(!list.length)return;
  requestPromise=(async()=>{
    try{
      const res=await fetch('/api/soop/live-batch',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'content-type':'application/json'},body:JSON.stringify({urls:list.map(x=>x.url),force})});
      if(!res.ok)return;
      const body=await res.json();
      for(const row of Array.isArray(body?.results)?body.results:[]){const id=userIdFromUrl(row?.url);if(!id)continue;const d=liveData(row);if(d)rowsById.set(id,d)}
      persist();scheduleDecorate();
    }catch(e){console.warn('Friend live preview refresh failed',e)}
    finally{requestPromise=null}
  })();
  return requestPromise;
}

function friendRoot(){
  const active=document.querySelector('.section.active');
  if(active&&/친구\s*찾기/.test(String(active.textContent||'').slice(0,1200)))return active;
  return null;
}
function findContact(card){
  const contacts=Array.isArray(dataRef()?.contacts)?[...dataRef().contacts]:[];
  contacts.sort((a,b)=>String(b?.name||'').length-String(a?.name||'').length);
  const text=String(card?.textContent||'');return contacts.find(c=>c?.name&&text.includes(String(c.name)))||null;
}
function cards(root){
  const out=[],used=new Set();
  for(const button of root.querySelectorAll('button,a')){
    if(!String(button.textContent||'').trim().includes('방송국'))continue;
    let node=button.parentElement,card=null;
    for(let i=0;i<7&&node&&node!==root;i++,node=node.parentElement){
      const labels=[...node.querySelectorAll('button,a')].map(x=>String(x.textContent||'').trim());
      if(labels.includes('프로필')&&labels.some(x=>x.includes('방송국'))){card=node;break}
    }
    if(!card||used.has(card))continue;
    const contact=findContact(card),id=stationKey(contact?.stationUrl);if(!contact||!id)continue;
    used.add(card);out.push({card,id});
  }
  return out;
}
function installStyle(){
  if(document.getElementById('mwsFriendLivePreviewV120Style'))return;
  const s=document.createElement('style');s.id='mwsFriendLivePreviewV120Style';s.textContent=`
.mws-live-screen-v120{display:block;width:100%;margin-top:12px;border-radius:10px;overflow:hidden;border:1px solid color-mix(in srgb,#ff334f 62%,var(--border));background:#090b10;cursor:pointer;aspect-ratio:16/9;position:relative}
.mws-live-screen-v120 img{display:block;width:100%;height:100%;object-fit:cover;background:#090b10}
.mws-live-screen-v120::after{content:'현재 방송 화면';position:absolute;left:9px;bottom:8px;padding:4px 7px;border-radius:6px;background:rgba(0,0,0,.72);color:#fff;font-size:10px;font-weight:800;pointer-events:none}
.mws-live-screen-v120[hidden]{display:none!important}
`;
  document.head.appendChild(s);
}
function decorate(){
  const root=friendRoot();if(!root)return;installStyle();
  for(const {card,id} of cards(root)){
    const d=rowsById.get(id),live=isLive(d),bno=broadNo(d);
    let box=card.querySelector('.mws-live-screen-v120');
    if(!live){if(box)box.hidden=true;continue}
    if(!box){box=document.createElement('div');box.className='mws-live-screen-v120';box.innerHTML='<img alt="현재 방송 화면" loading="lazy" decoding="async">';card.appendChild(box)}
    box.hidden=false;box.dataset.bno=bno;box.onclick=()=>window.open(playUrl(id,bno),'_blank','noopener');
    const img=box.querySelector('img'),src=thumbnailUrl(bno);if(img&&img.dataset.src!==src){img.dataset.src=src;img.src=src}
  }
}
function scheduleDecorate(){if(decorateQueued)return;decorateQueued=true;requestAnimationFrame(()=>{decorateQueued=false;decorate()})}
function active(){return Boolean(friendRoot())}
function scheduleTimer(){clearTimeout(timer);if(!active())return;timer=setTimeout(async()=>{await refresh(false);scheduleTimer()},REFRESH_MS)}

restore();
window.addEventListener('mws:friend-live-updated',()=>{refresh(false);scheduleDecorate();scheduleTimer()});
document.addEventListener('click',e=>{
  const btn=e.target?.closest?.('button');
  const text=String(btn?.textContent||'').trim();
  if(text.includes('라이브 새로고침')){rowsById.clear();try{sessionStorage.removeItem(CACHE_KEY)}catch(_){};setTimeout(()=>refresh(true),0)}
  const nav=e.target?.closest?.('.nav button[data-tab]');if(nav&&/친구\s*찾기/.test(String(nav.textContent||''))){setTimeout(()=>{scheduleDecorate();refresh(false);scheduleTimer()},0)}
},true);
document.addEventListener('visibilitychange',()=>{if(document.hidden)clearTimeout(timer);else if(active()){scheduleDecorate();refresh(false);scheduleTimer()}});

function boot(){installStyle();scheduleDecorate();if(active()){refresh(false);scheduleTimer()}setTimeout(scheduleDecorate,500);setTimeout(scheduleDecorate,1500)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
