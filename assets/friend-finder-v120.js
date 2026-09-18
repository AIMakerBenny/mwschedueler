/* Mawang Scheduler v1.3.0 - Friend Finder category filter, fast LIVE batching, and LIVE thumbnails */
(()=>{
'use strict';
if(window.__mwsFriendFinderV120)return;
window.__mwsFriendFinderV120=1;

const baseFetch=window.fetch.bind(window);
const liveCache=new Map();
const liveByUserId=new Map();
const LIVE_CACHE_MS=10000;
const THUMB_REFRESH_MS=10000;
const ACTIVE_REFRESH_MS=30000;
let batchPromise=null;
let categoriesPromise=null;
let forceNextBatch=false;
let uiScheduled=false;
let activeRefreshTimer=0;

function setVersionLabel(){try{window.mwsApplyAppVersionV120?.()}catch(_){}}

function dataRef(){try{return data}catch(_){return window.data||null}}
function stationKey(raw){
  const text=String(raw||'').trim();if(!text)return'';
  try{
    const u=new URL(/^https?:\/\//i.test(text)?text:`https://${text}`);
    const host=u.hostname.toLowerCase();const parts=u.pathname.split('/').filter(Boolean);
    if(!/(sooplive|afreecatv)/.test(host))return'';
    if(parts[0]==='station'&&parts[1])return decodeURIComponent(parts[1]).toLowerCase();
    if((host.startsWith('bj.')||host.startsWith('play.'))&&parts[0])return decodeURIComponent(parts[0]).toLowerCase();
    if(parts[0]&&parts[0]!=='live'&&parts[0]!=='directory')return decodeURIComponent(parts[0]).toLowerCase();
  }catch(_){}
  return'';
}
function channelUrl(id){return `https://api-channel.sooplive.co.kr/v1.1/channel/${encodeURIComponent(id)}/home/section/broad`}
function allContactTargets(){
  const contacts=Array.isArray(dataRef()?.contacts)?dataRef().contacts:[];
  const out=[];const seen=new Set();
  for(const c of contacts){const id=stationKey(c?.stationUrl);if(!id||seen.has(id))continue;seen.add(id);out.push(channelUrl(id))}
  return out;
}
function extractActualTarget(input){
  let u;try{const raw=typeof input==='string'||input instanceof URL?String(input):String(input?.url||'');u=new URL(raw,location.href)}catch(_){return null}
  if(u.hostname==='api-channel.sooplive.co.kr'&&/\/v1\.1\/channel\/[^/]+\/home\/section\/broad/.test(u.pathname))return u;
  if(u.origin===location.origin&&u.pathname==='/api/soop/proxy'){
    try{const t=new URL(u.searchParams.get('url')||'');if(t.hostname==='api-channel.sooplive.co.kr'&&/\/v1\.1\/channel\/[^/]+\/home\/section\/broad/.test(t.pathname))return t}catch(_){}
  }
  return null;
}
function userIdFromTarget(target){
  const m=/\/v1\.1\/channel\/([^/]+)\/home\/section\/broad/.exec(target?.pathname||'');
  return m?decodeURIComponent(m[1]).toLowerCase():'';
}

function firstLiveScalar(obj,keys){
  for(const key of keys){
    const value=obj?.[key];
    if((typeof value==='string'||typeof value==='number')&&String(value).trim())return String(value).trim();
  }
  return '';
}
function normalizeLivePayload(root){
  if(!root||typeof root!=='object')return null;
  const queue=[root],seen=new Set();
  while(queue.length){
    const value=queue.shift();
    if(!value||typeof value!=='object'||seen.has(value))continue;
    seen.add(value);
    if(!Array.isArray(value)){
      const broadNo=firstLiveScalar(value,['broadNo','broad_no','bno']);
      if(broadNo){
        const viewerRaw=firstLiveScalar(value,['currentSumViewer','current_sum_viewer','total_view_cnt','viewer_cnt','viewerCount']);
        const viewer=viewerRaw!==''?Number(viewerRaw):null;
        return {
          broadNo,
          broadTitle:firstLiveScalar(value,['broadTitle','broad_title','title']),
          categoryName:firstLiveScalar(value,['categoryName','category_name','broadCategoryName','broad_category_name']),
          broadCateNo:firstLiveScalar(value,['broadCateNo','broad_cate_no','categoryNo','category_no']),
          currentSumViewer:Number.isFinite(viewer)?viewer:null
        };
      }
    }
    for(const child of Array.isArray(value)?value:Object.values(value))if(child&&typeof child==='object')queue.push(child);
  }
  return null;
}
function syntheticResponse(row){
  const headers=new Headers();
  if(row?.contentType)headers.set('content-type',row.contentType);
  headers.set('cache-control','no-store');
  headers.set('x-mws-live-batch','v1.3.0');
  return new Response(String(row?.body??''),{status:Number(row?.status)||200,headers});
}
function rememberRow(row){
  if(!row?.url)return;
  liveCache.set(row.url,{row,at:Date.now()});
  try{
    const target=new URL(row.url);const id=userIdFromTarget(target);if(!id)return;
    const body=String(row.body||'').trim();let parsed=null;try{parsed=body?JSON.parse(body):null}catch(_){}
    const live=row?.live&&typeof row.live==='object'?row.live:normalizeLivePayload(parsed);
    liveByUserId.set(id,{at:Date.now(),status:Number(row.status)||0,data:live,url:row.url});
  }catch(_){}
}
function dispatchLiveUpdate(){window.dispatchEvent(new CustomEvent('mws:friend-live-updated',{detail:{count:liveByUserId.size}}));scheduleUi()}

async function runBatch(extraTarget,force=false){
  const urls=allContactTargets();
  if(extraTarget){const i=urls.indexOf(extraTarget.href);if(i>0){urls.splice(i,1);urls.unshift(extraTarget.href)}else if(i<0)urls.unshift(extraTarget.href)}
  if(!urls.length)return;
  const response=await baseFetch('/api/soop/live-batch',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'content-type':'application/json'},body:JSON.stringify({urls,force})});
  if(!response.ok)throw new Error(`LIVE batch HTTP ${response.status}`);
  const payload=await response.json();
  for(const row of Array.isArray(payload?.results)?payload.results:[])rememberRow(row);
  dispatchLiveUpdate();
}
async function ensureBatch(target,{force=false}={}){
  const cached=liveCache.get(target.href);
  if(!force&&cached&&Date.now()-cached.at<LIVE_CACHE_MS)return cached.row;
  if(!batchPromise){
    const runForce=force||forceNextBatch;forceNextBatch=false;
    batchPromise=runBatch(target,runForce).finally(()=>{batchPromise=null});
  }
  await batchPromise;
  return liveCache.get(target.href)?.row||null;
}
window.mwsFriendFinderFastRefresh=async()=>{liveCache.clear();liveByUserId.clear();forceNextBatch=true;const first=allContactTargets()[0];if(first){try{await ensureBatch(new URL(first),{force:true})}catch(e){console.warn('Friend Finder fast refresh failed',e)}}};

function stopActiveRefresh(){if(activeRefreshTimer)clearTimeout(activeRefreshTimer);activeRefreshTimer=0}
async function refreshActiveFriendLive(force=true){
  if(document.hidden||!activeFriendRoot())return;
  const first=allContactTargets()[0];
  if(!first){scheduleUi();return}
  try{await ensureBatch(new URL(first),{force})}catch(error){console.warn('Friend Finder active refresh failed',error)}
  scheduleUi();
}
function scheduleActiveRefresh(delay=ACTIVE_REFRESH_MS){
  stopActiveRefresh();
  if(document.hidden||!activeFriendRoot())return;
  activeRefreshTimer=setTimeout(async()=>{
    activeRefreshTimer=0;
    if(document.hidden||!activeFriendRoot())return;
    await refreshActiveFriendLive(true);
    if(!document.hidden&&activeFriendRoot())scheduleActiveRefresh(ACTIVE_REFRESH_MS);
  },Math.max(0,Number(delay)||0));
}

window.fetch=async function(input,init={}){
  let source;try{source=new Request(input,init)}catch(_){return baseFetch(input,init)}
  if(String(source.method||'GET').toUpperCase()!=='GET')return baseFetch(input,init);
  const target=extractActualTarget(input);if(!target)return baseFetch(input,init);
  try{
    const row=await ensureBatch(target,{force:false});
    if(row)return syntheticResponse(row);
  }catch(error){console.warn('Friend Finder batch fallback',error)}
  return baseFetch(input,init);
};

function friendRoot(){
  const exact=document.getElementById('friendFinder');if(exact)return exact;
  const active=document.querySelector('.section.active');
  if(active&&/친구\s*찾기/.test(String(active.textContent||'').slice(0,1200)))return active;
  return null;
}
function activeFriendRoot(){const root=friendRoot();return root?.classList.contains('active')?root:null}
function installStyle(){
  if(document.getElementById('mwsFriendFinderV120Style'))return;
  const style=document.createElement('style');style.id='mwsFriendFinderV120Style';style.textContent=`
#mwsFriendCategorySelect{min-width:190px;max-width:260px;height:36px;border:1px solid var(--border);border-radius:9px;background:var(--input);color:var(--text);padding:0 10px;font-size:12px}
.mws-live-category-v120{margin-top:7px;font-size:11px;font-weight:800;color:#7dd3fc;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mws-live-category-v120.offline{display:none}
.mws-category-hidden-v120{display:none!important}
#mwsFriendFastBadge{font-size:10px;color:var(--muted);white-space:nowrap}
#friendFinderGridV5.mws-friend-live-grid-v120{grid-auto-rows:auto!important;align-items:start!important}
#friendFinder .friend-finder-card-v5.mws-friend-live-card-v120{height:auto!important;min-height:0!important;max-height:none!important;overflow:hidden!important;align-self:start!important}
#friendFinder .friend-finder-card-v5 .mws-live-screen-v120{grid-column:1/-1!important;display:block!important;width:100%!important;min-width:0!important;min-height:0!important;margin-top:2px!important;border-radius:12px;overflow:hidden;border:1px solid rgba(255,51,79,.72);background:#090b10;cursor:pointer;aspect-ratio:16/9!important;position:relative;box-sizing:border-box}
.mws-live-screen-v120[hidden]{display:none!important}
.mws-live-screen-v120 img{display:block;width:100%;height:100%;object-fit:cover;background:#090b10}
.mws-live-screen-v120.is-image-fallback img{opacity:0}
.mws-live-screen-v120.is-image-fallback::before{content:'LIVE 방송 화면 불러오는 중';position:absolute;inset:0;display:grid;place-items:center;color:var(--muted);font-size:12px;font-weight:800;background:linear-gradient(145deg,#0b0f16,#111827)}
.mws-live-screen-v120 .mws-live-screen-label-v120{position:absolute;left:8px;top:8px;padding:4px 7px;border-radius:999px;background:rgba(5,8,14,.82);color:#fff;font-size:10px;font-weight:900;pointer-events:none;z-index:2}
.mws-live-screen-v120 .mws-live-screen-title-v120{position:absolute;left:0;right:0;bottom:0;padding:22px 10px 9px;background:linear-gradient(transparent,rgba(0,0,0,.86));color:#fff;font-size:11px;font-weight:850;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;pointer-events:none;z-index:2}
@media(max-width:900px){#mwsFriendCategorySelect{min-width:145px;max-width:180px}}
body[data-device-mode="mobile"] .mws-live-screen-v120{width:100%!important;aspect-ratio:16/9!important;min-height:180px!important;margin-top:14px!important;border-radius:14px!important}
body[data-device-mode="mobile"] .mws-live-screen-v120 .mws-live-screen-label-v120{font-size:12px!important;padding:5px 8px!important}
body[data-device-mode="mobile"] .mws-live-screen-v120 .mws-live-screen-title-v120{font-size:13px!important;padding:28px 12px 11px!important}
`;
  document.head.appendChild(style);
}
function findContactForCard(card){
  const contacts=Array.isArray(dataRef()?.contacts)?[...dataRef().contacts]:[];contacts.sort((a,b)=>String(b?.name||'').length-String(a?.name||'').length);
  const text=String(card?.textContent||'');return contacts.find(c=>c?.name&&text.includes(String(c.name)))||null;
}
function cardRows(root){
  const contacts=Array.isArray(dataRef()?.contacts)?dataRef().contacts:[];
  const byId=new Map(contacts.map(contact=>[String(contact?.id||''),contact]));
  const cards=[...root.querySelectorAll('#friendFinderGridV5 .friend-finder-card-v5[data-id],.friend-finder-card-v5[data-id]')];
  if(cards.length)return cards.map(card=>{
    const contact=byId.get(String(card.dataset.id||''))||findContactForCard(card);
    return contact?{card,contact,id:stationKey(contact.stationUrl)}:null;
  }).filter(Boolean);
  return [];
}
function baseLiveHint(card){
  const watch=card?.querySelector?.('[data-watch]')?.dataset?.watch||'';
  let bno='',url='';
  try{
    const parsed=new URL(watch,location.href),parts=parsed.pathname.split('/').filter(Boolean);
    if(parts.length>1&&/^\d+$/.test(parts[parts.length-1]))bno=parts[parts.length-1];
    if(/^https?:$/.test(parsed.protocol))url=parsed.href;
  }catch(_){}
  const text=String(card?.querySelector?.('.friend-finder-state-v5.live')?.textContent||'').trim();
  const title=text.replace(/^SOOP\s+LIVE\s*[·:]?\s*/i,'').trim();
  return {bno,url,title};
}
function isLiveEntry(entry){const d=entry?.data;return Boolean(d&&typeof d==='object'&&(d.broadNo||d.broad_no||d.broadTitle||d.broad_title))}
function liveCategory(entry){const d=entry?.data||{};return String(d.categoryName||d.category_name||'').trim()}
function liveCategoryId(entry){const d=entry?.data||{};return String(d.broadCateNo??d.broad_cate_no??'').trim()}
function liveViewers(entry){const d=entry?.data||{};const n=Number(d.currentSumViewer??d.current_sum_viewer??d.total_view_cnt);return Number.isFinite(n)&&n>=0?n:null}
function liveBroadNo(entry){const d=entry?.data||{};return String(d.broadNo??d.broad_no??d.bno??'').trim()}
function liveTitle(entry){const d=entry?.data||{};return String(d.broadTitle??d.broad_title??d.title??'').trim()}
function liveThumbStamp(){return String(Math.floor(Date.now()/THUMB_REFRESH_MS))}
function liveThumbCandidates(bno,stamp=liveThumbStamp()){
  if(!bno)return[];
  const id=encodeURIComponent(bno);
  return [
    `/api/soop/live-thumb?bno=${id}&v=${stamp}`,
    `https://liveimg.sooplive.com/m/${id}?mws=${stamp}`,
    `https://liveimg.sooplive.co.kr/m/${id}?mws=${stamp}`,
    `https://liveimg.sooplive.com/m/${id}`,
    `https://liveimg.sooplive.co.kr/m/${id}`
  ];
}
function livePlayUrl(id,bno){return `https://play.sooplive.com/${encodeURIComponent(id)}${bno?`/${encodeURIComponent(bno)}`:''}`}

async function loadCategories(){
  if(categoriesPromise)return categoriesPromise;
  categoriesPromise=(async()=>{
    try{
      const cached=JSON.parse(sessionStorage.getItem('mws_soop_categories_v120')||'null');
      if(cached&&Date.now()-Number(cached.at||0)<21600000&&Array.isArray(cached.items))return cached.items;
    }catch(_){}
    try{
      const res=await baseFetch('/api/soop/categories',{credentials:'same-origin',cache:'no-store'});if(!res.ok)throw new Error(`HTTP ${res.status}`);
      const body=await res.json();const items=Array.isArray(body?.categories)?body.categories:[];
      try{sessionStorage.setItem('mws_soop_categories_v120',JSON.stringify({at:Date.now(),items}))}catch(_){}
      return items;
    }catch(error){console.warn('SOOP categories unavailable',error);return[]}
  })();
  return categoriesPromise;
}
async function ensureCategoryControl(root){
  if(document.getElementById('mwsFriendCategorySelect'))return;
  const refresh=[...root.querySelectorAll('button')].find(b=>String(b.textContent||'').includes('라이브 새로고침'));
  const search=root.querySelector('input[placeholder*="이름"],input[placeholder*="검색"]');
  const host=refresh?.parentElement||search?.parentElement||root.firstElementChild||root;
  const select=document.createElement('select');select.id='mwsFriendCategorySelect';select.innerHTML='<option value="">전체 카테고리</option>';
  if(search&&search.parentElement===host)host.insertBefore(select,search);else host.insertBefore(select,refresh||host.firstChild);
  const badge=document.createElement('span');badge.id='mwsFriendFastBadge';badge.textContent='빠른 LIVE 조회';host.insertBefore(badge,refresh||null);
  select.onchange=()=>decorate(root);
  const items=await loadCategories();
  const unique=new Map();for(const item of items){const id=String(item?.id||'').trim(),name=String(item?.name||'').trim();if(name)unique.set(`${id}|${name}`,{id,name})}
  for(const entry of liveByUserId.values()){if(!isLiveEntry(entry))continue;const name=liveCategory(entry),id=liveCategoryId(entry);if(name)unique.set(`${id}|${name}`,{id,name})}
  [...unique.values()].sort((a,b)=>a.name.localeCompare(b.name,'ko')).forEach(x=>{const o=document.createElement('option');o.value=x.id?`id:${x.id}`:`name:${x.name}`;o.textContent=x.name;select.appendChild(o)});
}
function setLiveImage(img,screen,bno,stamp=liveThumbStamp()){
  if(!img||!screen||!bno)return;
  const candidates=liveThumbCandidates(bno,stamp);
  let index=0;
  screen.classList.remove('is-image-fallback');
  img.onload=()=>screen.classList.remove('is-image-fallback');
  img.onerror=()=>{
    index+=1;
    if(index<candidates.length){img.src=candidates[index];return}
    screen.classList.add('is-image-fallback');
  };
  img.dataset.bno=bno;
  img.dataset.thumbStamp=stamp;
  img.src=candidates[0];
}
function decorate(root=friendRoot()){
  if(!root)return;installStyle();setVersionLabel();
  ensureCategoryControl(root).catch(()=>{});
  const selected=document.getElementById('mwsFriendCategorySelect')?.value||'';
  for(const {card,id} of cardRows(root)){
    card.parentElement?.classList.add('mws-friend-live-grid-v120');
    const entry=id?liveByUserId.get(id):null;const live=isLiveEntry(entry);const cat=liveCategory(entry),catId=liveCategoryId(entry),viewers=liveViewers(entry);
    let match=true;if(selected){match=live&&(selected.startsWith('id:')?catId===selected.slice(3):cat===selected.slice(5))}
    card.classList.toggle('mws-category-hidden-v120',!match);

    let meta=card.querySelector('.mws-live-category-v120');if(!meta){meta=document.createElement('div');meta.className='mws-live-category-v120';const actions=[...card.querySelectorAll('button,a')].find(x=>String(x.textContent||'').trim()==='프로필')?.parentElement;actions?.parentElement?.insertBefore(meta,actions)||card.appendChild(meta)}
    meta.classList.toggle('offline',!live);meta.textContent=live?`카테고리 · ${cat||'미분류'}${viewers!==null?` · ${viewers.toLocaleString()}명`:''}`:'';

    let screen=card.querySelector('.mws-live-screen-v120');
    const hint=baseLiveHint(card),bno=liveBroadNo(entry)||hint.bno,title=liveTitle(entry)||hint.title;
    const showLive=Boolean(bno&&match&&(live||card.classList.contains('live')||hint.bno));
    card.classList.toggle('mws-friend-live-card-v120',showLive);
    if(!showLive){if(screen)screen.hidden=true;continue}
    if(!screen){
      screen=document.createElement('div');screen.className='mws-live-screen-v120';screen.innerHTML='<img alt="현재 방송 화면" loading="lazy" decoding="async" fetchpriority="low" referrerpolicy="no-referrer"><span class="mws-live-screen-label-v120">LIVE 화면</span><span class="mws-live-screen-title-v120"></span>';card.appendChild(screen);
    }
    screen.hidden=false;screen.onclick=()=>window.open(hint.url||livePlayUrl(id,bno),'_blank','noopener');
    const titleEl=screen.querySelector('.mws-live-screen-title-v120');if(titleEl)titleEl.textContent=title||'현재 방송 화면';
    const img=screen.querySelector('img'),thumbStamp=liveThumbStamp();
    if(img){
      img.loading='lazy';
      try{img.fetchPriority='low'}catch(_){}
      if(img.dataset.bno!==bno||img.dataset.thumbStamp!==thumbStamp)setLiveImage(img,screen,bno,thumbStamp)
    }
  }
}
let friendGridObserver=null,friendGridObserved=null;
function bindFriendGridObserver(){
  const grid=document.getElementById('friendFinderGridV5');if(!grid)return false;
  grid.classList.add('mws-friend-live-grid-v120');
  if(friendGridObserved===grid&&friendGridObserver)return true;
  try{friendGridObserver?.disconnect()}catch(_){}
  friendGridObserved=grid;
  friendGridObserver=new MutationObserver(records=>{
    if(records.some(record=>record.type==='childList'))scheduleUi();
  });
  friendGridObserver.observe(grid,{childList:true});
  scheduleUi();
  return true;
}
function scheduleUi(){if(uiScheduled)return;uiScheduled=true;requestAnimationFrame(()=>{uiScheduled=false;decorate()})}
window.addEventListener('mws:friend-live-updated',scheduleUi);
window.addEventListener('mawang:datachange',()=>{bindFriendGridObserver();scheduleUi();scheduleActiveRefresh(250)});
document.addEventListener('click',event=>{
  const text=String(event.target?.closest?.('button')?.textContent||'').trim();
  if(text.includes('라이브 새로고침')){liveCache.clear();liveByUserId.clear();forceNextBatch=true;setTimeout(()=>{scheduleUi();refreshActiveFriendLive(true).finally(()=>scheduleActiveRefresh())},0)}
  const nav=event.target?.closest?.('.nav button[data-tab]');
  if(nav)setTimeout(()=>{bindFriendGridObserver();if(activeFriendRoot()){scheduleUi();refreshActiveFriendLive(true).finally(()=>scheduleActiveRefresh())}else stopActiveRefresh()},0);
},true);
document.addEventListener('input',event=>{if(activeFriendRoot()?.contains(event.target))setTimeout(scheduleUi,0)},true);
document.addEventListener('change',event=>{if(activeFriendRoot()?.contains(event.target))setTimeout(scheduleUi,0)},true);
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopActiveRefresh();else scheduleActiveRefresh(120)});

function boot(){installStyle();setVersionLabel();bindFriendGridObserver();scheduleUi();scheduleActiveRefresh(120);[100,350,900,1800].forEach(ms=>setTimeout(()=>{setVersionLabel();bindFriendGridObserver();scheduleUi()},ms))}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();