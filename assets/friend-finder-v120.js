/* Mawang Scheduler v1.2.0 - Friend Finder category filter and fast LIVE batching */
(()=>{
'use strict';
if(window.__mwsFriendFinderV120)return;
window.__mwsFriendFinderV120=1;

const VERSION_LABEL='Mawang Scheduler v 1.2.0';
const baseFetch=window.fetch.bind(window);
const liveCache=new Map();
const liveByUserId=new Map();
let batchPromise=null;
let categoriesPromise=null;
let forceNextBatch=false;
let uiScheduled=false;

function setVersionLabel(){
  document.body?.setAttribute('data-build-version','MWS V 1.2.0');
  const direct=document.querySelector('[id^="mwsBuildVersionV5"],.sidebar-build-version-v52,.sidebar-build-version-v53');
  if(direct)direct.textContent=VERSION_LABEL;
  document.querySelectorAll('.sidebar *').forEach(el=>{
    if(el.children.length===0&&/^Mawang Scheduler\s+v/i.test(String(el.textContent||'').trim()))el.textContent=VERSION_LABEL;
  });
}

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
  if(u.hostname==='nysxcqlewzucbpoaymbg.supabase.co'&&u.pathname==='/functions/v1/soop-proxy'){
    try{const t=new URL(u.searchParams.get('url')||'');if(t.hostname==='api-channel.sooplive.co.kr'&&/\/v1\.1\/channel\/[^/]+\/home\/section\/broad/.test(t.pathname))return t}catch(_){}
  }
  return null;
}
function userIdFromTarget(target){
  const m=/\/v1\.1\/channel\/([^/]+)\/home\/section\/broad/.exec(target?.pathname||'');
  return m?decodeURIComponent(m[1]).toLowerCase():'';
}
function syntheticResponse(row){
  const headers=new Headers();
  if(row?.contentType)headers.set('content-type',row.contentType);
  headers.set('cache-control','no-store');
  headers.set('x-mws-live-batch','v1.2.0');
  return new Response(String(row?.body??''),{status:Number(row?.status)||200,headers});
}
function rememberRow(row){
  if(!row?.url)return;
  liveCache.set(row.url,{row,at:Date.now()});
  try{
    const target=new URL(row.url);const id=userIdFromTarget(target);if(!id)return;
    const body=String(row.body||'').trim();let parsed=null;try{parsed=body?JSON.parse(body):null}catch(_){}
    liveByUserId.set(id,{at:Date.now(),status:Number(row.status)||0,data:parsed,url:row.url});
  }catch(_){}
}
function dispatchLiveUpdate(){window.dispatchEvent(new CustomEvent('mws:friend-live-updated',{detail:{count:liveByUserId.size}}));scheduleUi()}

async function runBatch(extraTarget,force=false){
  const urls=allContactTargets();if(extraTarget&&!urls.includes(extraTarget.href))urls.push(extraTarget.href);
  if(!urls.length)return;
  const response=await baseFetch('/api/soop/live-batch',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'content-type':'application/json'},body:JSON.stringify({urls,force})});
  if(!response.ok)throw new Error(`LIVE batch HTTP ${response.status}`);
  const payload=await response.json();
  for(const row of Array.isArray(payload?.results)?payload.results:[])rememberRow(row);
  dispatchLiveUpdate();
}
async function ensureBatch(target,{force=false}={}){
  const cached=liveCache.get(target.href);
  if(!force&&cached&&Date.now()-cached.at<12000)return cached.row;
  if(!batchPromise){
    const runForce=force||forceNextBatch;forceNextBatch=false;
    batchPromise=runBatch(target,runForce).finally(()=>{batchPromise=null});
  }
  await batchPromise;
  return liveCache.get(target.href)?.row||null;
}
window.mwsFriendFinderFastRefresh=async()=>{liveCache.clear();liveByUserId.clear();forceNextBatch=true;const first=allContactTargets()[0];if(first){try{await ensureBatch(new URL(first),{force:true})}catch(e){console.warn('Friend Finder fast refresh failed',e)}}};

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
  const active=document.querySelector('.section.active');
  if(active&&/친구\s*찾기/.test(String(active.textContent||'').slice(0,1200)))return active;
  for(const s of document.querySelectorAll('.section')){
    const h=[...s.querySelectorAll('h1,h2,h3,strong')].find(x=>String(x.textContent||'').trim()==='친구 찾기');if(h)return s;
  }
  return null;
}
function installStyle(){
  if(document.getElementById('mwsFriendFinderV120Style'))return;
  const style=document.createElement('style');style.id='mwsFriendFinderV120Style';style.textContent=`
#mwsFriendCategorySelect{min-width:190px;max-width:260px;height:36px;border:1px solid var(--border);border-radius:9px;background:var(--input);color:var(--text);padding:0 10px;font-size:12px}
.mws-live-category-v120{margin-top:7px;font-size:11px;font-weight:800;color:#7dd3fc;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mws-live-category-v120.offline{display:none}
.mws-category-hidden-v120{display:none!important}
#mwsFriendFastBadge{font-size:10px;color:var(--muted);white-space:nowrap}
@media(max-width:900px){#mwsFriendCategorySelect{min-width:145px;max-width:180px}}
`;
  document.head.appendChild(style);
}
function findContactForCard(card){
  const contacts=Array.isArray(dataRef()?.contacts)?[...dataRef().contacts]:[];contacts.sort((a,b)=>String(b?.name||'').length-String(a?.name||'').length);
  const text=String(card?.textContent||'');return contacts.find(c=>c?.name&&text.includes(String(c.name)))||null;
}
function cardFromStationButton(button,root){
  let node=button?.parentElement;
  for(let i=0;i<7&&node&&node!==root;i++,node=node.parentElement){
    const labels=[...node.querySelectorAll('button,a')].map(x=>String(x.textContent||'').trim());
    if(labels.includes('프로필')&&labels.some(x=>x.includes('방송국')))return node;
  }
  return button?.parentElement||null;
}
function cardRows(root){
  const out=[];const used=new Set();
  for(const button of root.querySelectorAll('button,a')){
    if(!String(button.textContent||'').trim().includes('방송국'))continue;
    const card=cardFromStationButton(button,root);if(!card||used.has(card))continue;
    const contact=findContactForCard(card);if(!contact)continue;used.add(card);out.push({card,contact,id:stationKey(contact.stationUrl)});
  }
  return out;
}
function isLiveEntry(entry){const d=entry?.data;return Boolean(d&&typeof d==='object'&&(d.broadNo||d.broad_no||d.broadTitle||d.broad_title))}
function liveCategory(entry){const d=entry?.data||{};return String(d.categoryName||d.category_name||'').trim()}
function liveCategoryId(entry){const d=entry?.data||{};return String(d.broadCateNo??d.broad_cate_no??'').trim()}
function liveViewers(entry){const d=entry?.data||{};const n=Number(d.currentSumViewer??d.current_sum_viewer??d.total_view_cnt);return Number.isFinite(n)&&n>=0?n:null}

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
function decorate(root=friendRoot()){
  if(!root)return;installStyle();setVersionLabel();
  ensureCategoryControl(root).catch(()=>{});
  const selected=document.getElementById('mwsFriendCategorySelect')?.value||'';
  for(const {card,id} of cardRows(root)){
    const entry=id?liveByUserId.get(id):null;const live=isLiveEntry(entry);const cat=liveCategory(entry),catId=liveCategoryId(entry),viewers=liveViewers(entry);
    let meta=card.querySelector('.mws-live-category-v120');if(!meta){meta=document.createElement('div');meta.className='mws-live-category-v120';const actions=[...card.querySelectorAll('button,a')].find(x=>String(x.textContent||'').trim()==='프로필')?.parentElement;actions?.parentElement?.insertBefore(meta,actions)||card.appendChild(meta)}
    meta.classList.toggle('offline',!live);meta.textContent=live?`카테고리 · ${cat||'미분류'}${viewers!==null?` · ${viewers.toLocaleString()}명`:''}`:'';
    let match=true;if(selected){match=live&&(selected.startsWith('id:')?catId===selected.slice(3):cat===selected.slice(5))}
    card.classList.toggle('mws-category-hidden-v120',!match);
  }
}
function scheduleUi(){if(uiScheduled)return;uiScheduled=true;requestAnimationFrame(()=>{uiScheduled=false;decorate()})}
window.addEventListener('mws:friend-live-updated',scheduleUi);
document.addEventListener('click',event=>{
  const text=String(event.target?.closest?.('button')?.textContent||'').trim();
  if(text.includes('라이브 새로고침')){liveCache.clear();liveByUserId.clear();forceNextBatch=true;setTimeout(scheduleUi,0)}
  const nav=event.target?.closest?.('.nav button[data-tab]');if(nav&&/친구\s*찾기/.test(String(nav.textContent||''))){setTimeout(()=>{scheduleUi();const first=allContactTargets()[0];if(first)ensureBatch(new URL(first)).catch(()=>{})},0)}
},true);

function boot(){installStyle();setVersionLabel();scheduleUi();[250,900,2200].forEach(ms=>setTimeout(()=>{setVersionLabel();scheduleUi()},ms))}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
