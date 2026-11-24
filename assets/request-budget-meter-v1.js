/* Local Resource Timing diagnostic, never requests or uploads data. */
(()=>{
'use strict';
if(window.mwsRequestBudgetReportV1)return;
function createMeter(origin){
 const totals=new Map();
 function classify(entry){
  let u;try{u=new URL(entry.name,origin)}catch(_){return null}
  if(u.origin!==origin)return null;
  const p=u.pathname;
  if(p==='/api/soop/application-sync')return '신청 콘텐츠 통합 조회';
  if(p==='/api/soop/comment-batch')return u.searchParams.get('legacy')==='1'?'게시글 관리 동기화':'신청 콘텐츠 댓글';
  if(p==='/api/soop/proxy'){try{const t=new URL(u.searchParams.get('url'));if(t.hostname==='chapi.sooplive.co.kr'&&/\/comment\/?$/.test(t.pathname))return '신청 콘텐츠 댓글'}catch(_){}return 'SOOP 기타 조회'}
  if(p==='/api/soop/live-batch')return '친구찾기 방송 상태';
  if(p==='/api/soop/live-thumb')return 'LIVE 썸네일';
  if(p.startsWith('/api/soop/'))return 'SOOP 기타 조회';
  if(p.startsWith('/media/achievement/')||p.startsWith('/api/achievement-media/'))return '업적 이미지';
  if(p.startsWith('/media/contact/'))return '연락처 이미지';
  if(p.startsWith('/media/'))return '기타 미디어';
  if(p.startsWith('/api/auth/')||p==='/api/health')return '인증 및 상태 확인';
  if(p==='/api/calendar-startup'||p==='/api/manifest'||p==='/api/bootstrap'||p==='/api/parts-batch'||p.startsWith('/api/parts/'))return '공통 데이터 조회';
  if(p==='/api/save')return '데이터 저장';
  if(p.startsWith('/api/'))return '기타 API';
  if(['/', '/index.html','/majoku-castle','/majoku-castle.html','/assets/cloud-v5.5.js','/assets/cloud-v1.1.js','/assets/boss-manager-v121.js','/assets/boss-raid-v116.js'].includes(p))return 'Worker 우선 경로';
  return null;
 }
 function observe(entry){
  const group=classify(entry);if(!group)return;
  const row=totals.get(group)||{network:0,cache:0,unknown:0};
  if(entry.transferSize>0)row.network++;
  else if(entry.transferSize===0&&(entry.decodedBodySize>0||entry.deliveryType==='cache'))row.cache++;
  else row.unknown++;
  totals.set(group,row);
 }
 function report(){
  const groups=[...totals].map(([name,row])=>({name,...row})).sort((a,b)=>b.network-a.network||b.unknown-a.unknown);
  const sum=key=>groups.reduce((n,row)=>n+row[key],0);
  return {network:sum('network'),cache:sum('cache'),unknown:sum('unknown'),groups};
 }
 return {observe,report};
}
const meter=createMeter(location.origin);let supported=false;
try{
 const observer=new PerformanceObserver(list=>{for(const entry of list.getEntries())meter.observe(entry)});
 observer.observe({type:'resource',buffered:true});supported=true;
}catch(_){}
try{for(const entry of performance.getEntriesByType('navigation'))meter.observe(entry)}catch(_){}
window.mwsRequestBudgetReportV1=()=>({...meter.report(),supported,scope:'current document',accountUsage:null});
function bind(){
 const panel=document.getElementById('mwsRequestBudgetSettings'),details=document.getElementById('mwsRequestBudgetDetails'),out=document.getElementById('mwsRequestBudgetOutput');
 if(!panel||!details||!out)return;
 function syncMode(){panel.hidden=document.body.dataset.mwsMode!=='admin';if(panel.hidden)details.open=false}
 function render(){
  if(panel.hidden||!details.open)return;
  const r=window.mwsRequestBudgetReportV1();
  out.replaceChildren();
  const summary=document.createElement('p');summary.className='muted small';summary.textContent=r.supported?'네트워크 전송 '+r.network.toLocaleString()+'건 · 캐시 '+r.cache.toLocaleString()+'건 · 판별 불가 '+r.unknown.toLocaleString()+'건':'이 브라우저에서는 세부 측정이 지원되지 않습니다.';out.appendChild(summary);
  for(const group of r.groups){const row=document.createElement('div');row.className='space';const name=document.createElement('span'),counts=document.createElement('span');name.textContent=group.name;counts.className='muted small';counts.textContent=group.network.toLocaleString()+' / '+group.cache.toLocaleString()+' / '+group.unknown.toLocaleString();row.append(name,counts);out.appendChild(row)}
 }
 details.addEventListener('toggle',render);panel.querySelector('[data-request-budget-refresh]')?.addEventListener('click',render);
 window.addEventListener('mws:app-ready',syncMode);
 try{new MutationObserver(syncMode).observe(document.body,{attributes:true,attributeFilter:['data-mws-mode']})}catch(_){}
 syncMode();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();
