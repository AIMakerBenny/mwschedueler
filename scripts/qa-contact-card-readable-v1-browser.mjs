/* Real production markup + CSS headless QA. No private Cloudflare data or writes. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
const file=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const index=file('index.html');
const app=file('assets/app-core.js');
const runtime=file('assets/contact-runtime-v130.js');
const css=['assets/app-core.css','assets/mawang-premium-v1621.css',
  'assets/ui-frame-presets.css','assets/calendar-space-efficiency-v1.css',
  'assets/contact-card-readable-layout-v1.css'].map(file).join('\n');
const inline=[...index.matchAll(/<style(?:\s[^>]*)?>([\s\S]*?)<\/style>/gi)].map(m=>m[1]).join('\n');
const newSheet=['assets/contact-card-readable-layout-v1.css','assets/workspace-clean-v1.css','assets/workspace-ui-v176.css','assets/contact-directory-v177.css','assets/ui-interactions-v1.css'].map(file).join('\n');
const nav=index.match(/<button class="active" data-tab="calendar"/g)||[];
assert.equal(nav.length,1,'Calendar must be the sole default active nav button');
assert(!index.includes('<button class="active" data-tab="dashboard"'),'Dashboard must not be default nav');
assert(index.includes('<section id="calendar" class="section active">'),'Calendar must be the visible initial panel');
assert(index.includes('<section id="dashboard" class="section">'),'Dashboard must be initially hidden');
assert(index.includes('<h1 id="pageTitle">캘린더</h1>'),'Header must show calendar on initial HTML paint');
assert(index.indexOf('assets/contact-card-readable-layout-v1.css?v=1')>
  index.indexOf('assets/calendar-space-efficiency-v1.css?v=1'),'Override must load after old CSS');
assert(index.indexOf('assets/contact-directory-v177.css?v=3')>index.indexOf('assets/workspace-clean-v1.css'),'Directory polish must load after prior overrides');
assert(app.includes('function renderAll(reason=lastSyncReason)'),'Runtime must still render all panels after login');
assert(app.includes("safeRenderView('캘린더',renderCalendar)"),'Hydrated calendar render must remain intact');
assert(app.includes('contact-card-core')&&app.includes('contact-card-avatar-lg')&&app.includes('contact-card-info'),
  'Must test production DOM classes, not hypothetical card markup');

const chrome=['google-chrome','google-chrome-stable','chromium','chromium-browser']
 .map(cmd=>spawnSync('which',[cmd],{encoding:'utf8'})).find(r=>r.status===0)?.stdout.trim();
assert(chrome,'Chromium required');

function geometry(){
 const r=x=>x.getBoundingClientRect();
 const parent=document.querySelector('#contacts .contact-grid');
 const cards=[...parent.querySelectorAll(':scope > .contact-card')];
 const failures=[];
 for(const card of cards){
  const avatar=card.querySelector('.contact-card-avatar-lg');
  const info=card.querySelector('.contact-card-info');
  const name=card.querySelector('.contact-card-name');
  const tags=card.querySelector('.contact-card-tags');
  const last=card.querySelector('.contact-card-last');
  const actions=card.querySelector('.contact-card-actions');
  const pr=r(avatar),ir=r(info),cr=r(card);
  if(pr.right+9>ir.left)failures.push('portrait overlap '+name.textContent+': '+pr.right+' '+ir.left);
  for(const [key,el] of [['name',name],['tags',tags],['last',last],['actions',actions]]){
   const er=r(el);
   if(er.left<pr.right+8)failures.push(key+' starts on portrait '+name.textContent);
   if(er.right>cr.right+1||er.bottom>cr.bottom+1)failures.push(key+' outside card '+name.textContent);
   if(el.scrollWidth>el.clientWidth+3)failures.push(key+' horizontal clip '+name.textContent);
  }
  if(avatar.scrollWidth>avatar.clientWidth+2)failures.push('avatar overflow');
  if(avatar.tagName==='DIV'&&getComputedStyle(avatar).display!=='grid')failures.push('fallback initials are not centered');
  if(card.scrollHeight>card.clientHeight+2)failures.push('card vertical clip '+name.textContent);
 }
 if(document.documentElement.scrollWidth>window.innerWidth+4)failures.push('root page horizontal overflow');
 const toolbar=document.querySelector('#contacts .toolbar');
 const board=document.querySelector('#contacts .contact-board-layout');
 const sidebar=document.querySelector('#contacts .contact-tag-panel');
 for(const el of [toolbar,board,sidebar,document.querySelector('#contactSearch'),document.querySelector('#newContactBtn')]){
   if(r(el).right>innerWidth+2||r(el).left<0)failures.push('toolbar/tag layout overflow '+el.className);
 }
 if(r(toolbar).width>=900){
   const tools=['#contactSearch','#contactSort','#cleanupDuplicatesBtn','#newContactBtn'].map(s=>r(document.querySelector(s)));
   if(Math.max(...tools.map(x=>x.top))-Math.min(...tools.map(x=>x.top))>2)failures.push(' desktop toolbar unexpectedly wraps');
 }
 const first=cards[0];
 const initialRect=r(first),initialBorder=getComputedStyle(first).getPropertyValue('--person-state');
 for(const state of ['pending-card','has-upcoming','is-self']){
  first.classList.add(state);const paint=getComputedStyle(first),box=r(first);
  if(paint.getPropertyValue('--person-state')===initialBorder||!paint.boxShadow.includes('inset')||Math.abs(box.width-initialRect.width)>1||Math.abs(box.height-initialRect.height)>1)failures.push('state paint or geometry '+state);
  first.classList.remove(state);
 }
 if(getComputedStyle(first.querySelector('.contact-card-avatar-lg')).boxShadow==='none')failures.push('portrait depth missing');
 first.hidden=true;
 if(getComputedStyle(first).display!=='none')failures.push('search-hidden contact still displayed');
 first.hidden=false;
 parent.style.display='none';
 if(getComputedStyle(parent).display!=='none')failures.push('maintenance tab cannot hide cards');
 parent.style.display='grid';
 if(innerWidth<=760&&r(sidebar).bottom>r(parent).top+1)failures.push('mobile tag panel overlaps cards');
 const header=$('contactGroupHeaderV178'),area=$('contactTagBannerArea');
 activeContactTag='빈 그룹';renderContactTagBanner();injectAdd();
 const add=$('contactGroupAddV178');
 if(header.hidden||$('contactGroupNameV178').textContent!=='빈 그룹'||!add||r(add).width>34||r(add).height>34||parent.querySelector('.v56-add'))failures.push('group add must be a compact header action');
 if(getComputedStyle(area).display!=='none'||area.childElementCount||!$('contactGroupBannerRemoveV178').hidden)failures.push('empty banner must not occupy space');
 add.click();if(window.qaAdd?.gt!=='빈 그룹')failures.push('group add action lost');
 $('contactGroupBannerChooseV178').click();if(window.qaChoose!=='빈 그룹')failures.push('banner choose action lost');
 activeContactTag='배너 그룹';renderContactTagBanner();injectAdd();
 if(!area.querySelector('img')||getComputedStyle(area).display==='none'||$('contactGroupBannerRemoveV178').hidden)failures.push('existing banner not displayed');
 const persistentAdd=$('contactGroupAddV178');$('contactGroupBannerRemoveV178').click();
 if(area.childElementCount||getComputedStyle(area).display!=='none'||!$('contactGroupBannerRemoveV178').hidden||$('contactGroupAddV178')!==persistentAdd)failures.push('removing banner must collapse area without replacing controls');
 activeContactTag='';renderContactTagBanner();injectAdd();
 if(!header.hidden||getComputedStyle(header).display!=='none')failures.push('all contacts must not have group header');
 if(!getComputedStyle(first).backgroundImage.includes('gradient')||getComputedStyle(first).boxShadow==='none')failures.push('card depth styling missing');
 document.querySelector('#qa-result').textContent=JSON.stringify({
  ok:failures.length===0,failures,viewport:innerWidth,resolution:document.body.dataset.resolution,
  columns:getComputedStyle(parent).gridTemplateColumns,
  cards:cards.length,photo:r(cards[0].querySelector('.contact-card-avatar-lg')).width,
  gap:r(cards[0].querySelector('.contact-card-info')).left-r(cards[0].querySelector('.contact-card-avatar-lg')).right,
  cardHeight:r(cards[0]).height
 });
}
const avatar='<img class="contact-card-avatar-lg" alt="프로필" src="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22116%22 height=%22116%22%3E%3Crect width=%22116%22 height=%22116%22 fill=%22%238e78b8%22/%3E%3C/svg%3E">';
const cards=[
 ['모구구','버튜버','블루점프','합방 기록 없음'],
 ['로즈_MUSE','버튜버','', '합방 기록 없음'],
 ['물초코','버튜버','왁치동','최근 컨텐츠: SBO 연습경기'],
 ['유튜브_방송자_길이가아주긴이름','버튜버','천타버스',
   '최근 컨텐츠: 매우 긴 방송 제목과 연속 진행되는 이벤트 안내 및 참고 일정']
];
const cardMarkup=cards.map(([name,t1,t2,last],i)=>
 '<div class="contact-card"><div class="contact-card-core">'+(i===3?'<div class="contact-card-avatar-lg">?</div>':avatar)+
 '<div class="contact-card-info"><div class="contact-card-name-row"><div class="contact-card-name">'+name+'</div></div>'+
 '<div class="contact-card-tags"><span class="chip">'+t1+'</span>'+(t2?'<span class="chip">'+t2+'</span>':'')+
 '</div><div class="contact-card-last">'+last+'</div><div class="contact-card-actions">'+
 '<button class="station-link">방송국 열기</button></div></div></div></div>').join('');
const contactsSection=index.match(/<section id="contacts" class="section">[\s\S]*?<\/section>/)[0]
 .replace('class="section"','class="section active"')
 .replace('<div class="toolbar">','<div class="mws-contact-tabs-v176"><button class="mws-contact-tab-v176 active">연락처</button><button class="mws-contact-tab-v176">최근 만난 사람</button><button class="mws-contact-tab-v176">친구 찾기</button></div><div class="toolbar">')
 .replace('<div id="contactTagList" class="contact-tag-list"></div>','<div id="contactTagList" class="contact-tag-list"><div class="contact-tag-item"><button class="contact-tag-button active"><span class="contact-tag-name">전체</span><span class="contact-tag-count">217</span></button></div><div class="contact-tag-item"><button class="tag-reorder-handle">⋮⋮</button><button class="contact-tag-button"><span class="contact-tag-name">버튜버</span><span class="contact-tag-count">195</span></button></div></div>')
 .replace('<div id="contactGrid" class="contact-grid"></div>','<div id="contactGrid" class="contact-grid">'+cardMarkup+'</div>');

const boot=`const $=id=>document.getElementById(id);let contactView='cards',activeContactTag='';
const data={contactTagBanners:{'배너 그룹':'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22/%3E'}};
const D=()=>data,view=()=>contactView,tag=()=>activeContactTag,visibility=()=>{},esc=s=>String(s);
function openAdd(kind,gt){window.qaAdd={kind,gt}};window.chooseContactTagBanner=t=>window.qaChoose=t;
window.removeContactTagBanner=t=>{delete data.contactTagBanners[t];renderContactTagBanner();injectAdd()};
${app.slice(app.indexOf('function renderContactTagBanner(){'),app.indexOf('window.renderContactTagBanner=renderContactTagBanner;'))}
${runtime.slice(runtime.indexOf('function injectAdd(){'),runtime.indexOf('let injectQueuedV141=false;'))}`;

const folder=mkdtempSync(path.join(os.tmpdir(),'mws-contact-readable-'));
try {
 for(const [width,height,resolution,scale] of [
  [1366,768,'wide',1],[1517,852,'2k',1],[1920,1080,'2k',1],
  [2560,1440,'4k',1],[1366,768,'wide',1.2],[390,844,'mobile',1]
 ]){
  const page='<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
    '<style>'+css+'\n'+inline+'\n'+newSheet+'</style></head>'+
    '<body class="mws-premium" data-resolution="'+resolution+'" data-ui-frame="classic" style="--ui-text-scale:'+scale+'">'+
    '<div class="app"><aside class="sidebar"></aside><main class="main">'+contactsSection+'</main></div>'+
    '<pre id="qa-result">pending</pre><script>'+boot+'\n('+geometry.toString()+')()</script></body></html>';
  const dest=path.join(folder,'contact.html');writeFileSync(dest,page,'utf8');
  const proc=spawnSync(chrome,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
    '--no-first-run','--disable-background-networking','--virtual-time-budget=900',
    '--window-size='+width+','+height,'--dump-dom','file://'+dest],
    {encoding:'utf8',timeout:20000,maxBuffer:18*1024*1024});
  assert.equal(proc.status,0,'Chromium failed at '+width+': '+proc.stderr.slice(-600));
  const match=proc.stdout.match(/<pre id="qa-result">([^<]+)<\/pre>/);
  assert(match,'No rendered geometry: '+proc.stdout.slice(-900));
  const result=JSON.parse(match[1].replaceAll('&quot;','"'));
  assert(result.ok,'Card/image overlap at '+width+' '+resolution+': '+JSON.stringify(result));
  console.log('CONTACT_CARD_READABLE_OK',JSON.stringify(result));
 }
}finally{rmSync(folder,{recursive:true,force:true})}
