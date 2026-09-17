/* Mawang Scheduler v1.3.0 - LIVE card and contact station link reliability fixes */
(()=>{
'use strict';
if(window.__mwsV130LiveContactFix)return;
window.__mwsV130LiveContactFix=1;

const rawFetch=window.fetch.bind(window);
const LIVE_INTERVAL=15000;
let liveTimer=0;
let liveBusy=false;

function dataRef(){try{return data}catch(_){return window.data||null}}
function normalizeHttp(raw){
  const text=String(raw||'').trim();if(!text)return'';
  const candidate=/^https?:\/\//i.test(text)?text:`https://${text}`;
  try{const u=new URL(candidate);if(u.protocol!=='http:'&&u.protocol!=='https:')return'';return u.href}catch(_){return''}
}
function stationKey(raw){
  const url=normalizeHttp(raw);if(!url)return'';
  try{
    const u=new URL(url),host=u.hostname.toLowerCase(),parts=u.pathname.split('/').filter(Boolean);
    if(!/(sooplive|afreecatv)/.test(host))return'';
    if(parts[0]==='station'&&parts[1])return decodeURIComponent(parts[1]).toLowerCase();
    if((host.startsWith('bj.')||host.startsWith('play.'))&&parts[0])return decodeURIComponent(parts[0]).toLowerCase();
    if(parts[0]&&parts[0]!=='live'&&parts[0]!=='directory')return decodeURIComponent(parts[0]).toLowerCase();
  }catch(_){}
  return'';
}
function channelUrl(id){return `https://api-channel.sooplive.co.kr/v1.1/channel/${encodeURIComponent(id)}/home/section/broad`}
function findLiveObject(root){
  if(!root||typeof root!=='object')return null;
  const seen=new Set(),queue=[root];
  while(queue.length){
    const value=queue.shift();if(!value||typeof value!=='object'||seen.has(value))continue;seen.add(value);
    if(value.broadNo||value.broad_no||value.bno||value.broadTitle||value.broad_title)return value;
    for(const child of Array.isArray(value)?value:Object.values(value))if(child&&typeof child==='object')queue.push(child);
  }
  return null;
}
function broadNo(d){return String(d?.broadNo??d?.broad_no??d?.bno??'').trim()}
function broadTitle(d){return String(d?.broadTitle??d?.broad_title??d?.title??'').trim()}
function categoryName(d){return String(d?.categoryName??d?.category_name??d?.cate_name??'').trim()}
function viewers(d){const n=Number(d?.currentSumViewer??d?.current_sum_viewer??d?.total_view_cnt);return Number.isFinite(n)&&n>=0?n:null}
function playUrl(id,bno){return `https://play.sooplive.com/${encodeURIComponent(id)}${bno?`/${encodeURIComponent(bno)}`:''}`}
function thumbUrls(bno){
  const id=encodeURIComponent(bno),stamp=Math.floor(Date.now()/10000);
  return [`https://liveimg.sooplive.co.kr/m/${id}?mws=${stamp}`,`https://liveimg.sooplive.com/m/${id}?mws=${stamp}`,`https://liveimg.sooplive.co.kr/m/${id}`,`https://liveimg.sooplive.com/m/${id}`];
}
function friendRoot(){
  for(const s of document.querySelectorAll('.section')){
    if(/친구\s*찾기/.test(String(s.textContent||'').slice(0,1400)))return s;
  }
  return null;
}
function cardForContact(root,contact){
  const name=String(contact?.name||'').trim();if(!name)return null;
  const buttons=[...root.querySelectorAll('button,a')].filter(x=>String(x.textContent||'').includes('방송국'));
  for(const button of buttons){
    let node=button.parentElement;
    for(let i=0;i<8&&node&&node!==root;i++,node=node.parentElement){
      const text=String(node.textContent||'');
      if(text.includes(name)&&[...node.querySelectorAll('button,a')].some(x=>String(x.textContent||'').trim()==='프로필'))return node;
    }
  }
  const candidates=[...root.querySelectorAll('.card,[class*="friend"],[class*="contact"]')];
  return candidates.find(x=>String(x.textContent||'').includes(name))||null;
}
function setImage(screen,bno){
  const img=screen.querySelector('img');if(!img||!bno)return;
  const urls=thumbUrls(bno);let i=0;
  screen.classList.remove('is-image-fallback');
  img.onload=()=>screen.classList.remove('is-image-fallback');
  img.onerror=()=>{i++;if(i<urls.length){img.src=urls[i];return}screen.classList.add('is-image-fallback')};
  img.dataset.bno=bno;img.src=urls[0];
}
function decorateLiveCard(card,id,d){
  const bno=broadNo(d);if(!bno)return;
  let screen=card.querySelector('.mws-live-screen-v120');
  if(!screen){
    screen=document.createElement('div');screen.className='mws-live-screen-v120';
    screen.innerHTML='<img alt="현재 방송 화면" loading="eager" decoding="async" fetchpriority="high" referrerpolicy="no-referrer"><span class="mws-live-screen-label-v120">LIVE 화면</span><span class="mws-live-screen-title-v120"></span>';
    card.appendChild(screen);
  }
  screen.hidden=false;screen.style.display='block';
  screen.onclick=()=>window.open(playUrl(id,bno),'_blank','noopener,noreferrer');
  const title=screen.querySelector('.mws-live-screen-title-v120');if(title)title.textContent=broadTitle(d)||'현재 방송 화면';
  const img=screen.querySelector('img');if(img&&img.dataset.bno!==bno)setImage(screen,bno);
  let meta=card.querySelector('.mws-live-category-v120');
  if(!meta){meta=document.createElement('div');meta.className='mws-live-category-v120';card.insertBefore(meta,screen)}
  const count=viewers(d),cat=categoryName(d);meta.classList.remove('offline');meta.textContent=`카테고리 · ${cat||'미분류'}${count!==null?` · ${count.toLocaleString()}명`:''}`;
}
async function refreshLiveCards(){
  if(liveBusy)return;const root=friendRoot();if(!root)return;
  const contacts=Array.isArray(dataRef()?.contacts)?dataRef().contacts:[];
  const targets=[],byId=new Map();
  for(const c of contacts){const id=stationKey(c?.stationUrl);if(!id||byId.has(id))continue;byId.set(id,c);targets.push(channelUrl(id))}
  if(!targets.length)return;
  liveBusy=true;
  try{
    const res=await rawFetch('/api/soop/live-batch',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'content-type':'application/json'},body:JSON.stringify({urls:targets,force:true})});
    if(!res.ok)return;const payload=await res.json();
    for(const row of Array.isArray(payload?.results)?payload.results:[]){
      let id='';try{id=decodeURIComponent(new URL(row.url).pathname.split('/')[3]||'').toLowerCase()}catch(_){}
      const contact=byId.get(id);if(!contact)continue;
      let body=null;try{body=JSON.parse(String(row.body||''))}catch(_){}
      const live=findLiveObject(body);if(!live)continue;
      const card=cardForContact(root,contact);if(card)decorateLiveCard(card,id,live);
    }
  }catch(error){console.warn('v1.3.0 LIVE card fallback refresh failed',error)}finally{liveBusy=false}
}
function scheduleLive(){clearTimeout(liveTimer);liveTimer=setTimeout(()=>{refreshLiveCards().finally(()=>{liveTimer=setTimeout(scheduleLive,LIVE_INTERVAL)})},80)}
window.addEventListener('mws:friend-live-updated',scheduleLive);
window.addEventListener('mawang:datachange',scheduleLive);
document.addEventListener('click',e=>{if(e.target?.closest?.('[data-tab="friendFinder"],[data-tab="friends"],button'))setTimeout(scheduleLive,120)},true);
new MutationObserver(()=>{if(friendRoot())scheduleLive()}).observe(document.body,{childList:true,subtree:true});
scheduleLive();

/* Contact detail "방문": keep the navigation in the user's click stack and use a real anchor. */
function visitStation(){
  const input=document.getElementById('ctStationUrl');const url=normalizeHttp(input?.value);
  if(!url){try{window.toast?.('방송국 주소','올바른 http/https 방송국 주소를 입력해 주세요')}catch(_){};return false}
  const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.style.display='none';document.body.appendChild(a);
  try{a.click()}finally{a.remove()}
  return false;
}
function installVisitFix(){window.visitContactStationV55=visitStation;const btn=document.getElementById('ctStationVisitBtn');if(btn)btn.onclick=visitStation}
installVisitFix();
new MutationObserver(installVisitFix).observe(document.body,{childList:true,subtree:true});
})();
