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
  if(p==='/api/media-batch-v5')return '이미지 일괄 요청';
  if(p==='/api/soop/application-sync'||p==='/api/soop/application-batch')return '신청 콘텐츠 통합 조회';
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
  if(entry.workerStart>0)row.unknown++;
  else if(entry.transferSize>0)row.network++;
  else if(entry.transferSize===0&&(entry.decodedBodySize>0||entry.deliveryType==='cache'))row.cache++;
  else row.unknown++;
  totals.set(group,row);
 }
 function report(){
  const groups=[...totals].map(([name,row])=>({name,...row})).sort((a,b)=>b.network-a.network||b.unknown-a.unknown);
  const sum=key=>groups.reduce((n,row)=>n+row[key],0);
  return {network:sum('network'),cache:sum('cache'),unknown:sum('unknown'),groups};
 }
 return {observe,report,classify};
}
const meter=createMeter(location.origin);let supported=false;
const trace={start:null,end:null,rows:[],counts:new Map(),total:0};
const categories=[];
function markCategory(){
 if(trace.start===null||trace.end!==null)return;
 const category=document.querySelector('.section.active')?.id||'unknown';
 if(categories.at(-1)?.category!==category)categories.push({at:performance.now(),category});
}
window.addEventListener('mws:workspace-tab-v1',markCategory);
// Session-local fingerprints support equality checks without retaining URLs or identifiers.
const fingerprints=new Map(),pendingMethods=new Map();
let salt=0;
const deliveries=new Map();
function signalWorker(enabled){navigator.serviceWorker?.controller?.postMessage({kind:'mws-media-trace',enabled,salt})}
navigator.serviceWorker?.addEventListener('controllerchange',()=>{if(trace.start!==null&&trace.end===null)signalWorker(true)});
navigator.serviceWorker?.addEventListener('message',event=>{
 const m=event.data;
 if(event.source!==navigator.serviceWorker.controller||m?.kind!=='mws-media-delivery'||m.salt!==salt||!['service-worker-cache','service-worker-fetch'].includes(m.source))return;
 if(deliveries.size>=2000)deliveries.delete(deliveries.keys().next().value);
 deliveries.set(m.id,m);
});
function fingerprint(value){
 let hash=2166136261^salt;
 for(let i=0;i<value.length;i++)hash=Math.imul(hash^value.charCodeAt(i),16777619);
 return hash>>>0;
}
function markMethod(raw,method,meta){
 if(trace.start===null||trace.end!==null)return;
 try{
  const url=new URL(raw,location.href);url.hash='';
  const id=fingerprint(url.href);
  if(pendingMethods.size>=2000&&!pendingMethods.has(id))pendingMethods.delete(pendingMethods.keys().next().value);
  const queue=pendingMethods.get(id)||[];
  if(queue.length>=20)queue.shift();
  queue.push({method:/^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)$/i.test(method)?method.toUpperCase():null,at:performance.now(),automatic:typeof meta?.automatic==='boolean'?meta.automatic:null,retry:typeof meta?.retry==='boolean'?meta.retry:null,module:['friend-finder-v120','content-applications-v2','media-cache-first-v1'].includes(meta?.module)?meta.module:null});
  pendingMethods.set(id,queue);
 }catch(_){}
}
const originalFetch=window.fetch;
if(originalFetch)window.fetch=function(input,options){
 if(trace.start!==null&&trace.end===null)markMethod(input?.url??input,options?.method||input?.method||'GET',options?.mwsTrace);
 return originalFetch.apply(this,arguments);
};
function record(entry){
 meter.observe(entry);
 if(trace.start===null||entry.startTime<trace.start||trace.end!==null&&entry.startTime>trace.end)return;
 const workerRoute=meter.classify(entry);
 const url=new URL(entry.name,location.href);
 if(!['https:','http:'].includes(url.protocol))return;
 const group=workerRoute||(url.origin===location.origin?'정적 리소스':'외부 리소스');
 const category=categories.findLast(item=>item.at<=entry.startTime)?.category||'unknown';
 const kind=entry.workerStart>0?'service-worker':entry.deliveryType==='cache'?'browser-cache':entry.transferSize>0?'network':'unknown';
 // Only route families are retained. Raw paths, query strings and headers can identify people.
 const route=['/api/media-batch-v5','/api/soop/live-batch','/api/soop/live-thumb','/api/soop/application-sync','/api/soop/application-batch','/api/soop/comment-batch','/api/calendar-startup','/api/parts-batch','/api/save','/api/manifest','/api/bootstrap','/api/health','/','/index.html'].includes(url.pathname)?url.pathname:group;
 const id=fingerprint(url.href),duplicate=fingerprints.has(id);
 if(fingerprints.size>=4000&&!duplicate)fingerprints.delete(fingerprints.keys().next().value);
 fingerprints.set(id,true);
 const delivery=deliveries.get(id);
 const swSource=delivery&&delivery.at>=performance.timeOrigin+entry.startTime-5&&delivery.at<=performance.timeOrigin+entry.responseEnd+50?delivery.source:null;
 const queue=pendingMethods.get(id);
 const index=queue?.findIndex(x=>Math.abs(x.at-entry.startTime)<1000)??-1;
 const matched=index>=0?queue.splice(index,1)[0]:null;
 const method=matched?matched.method:['img','css','script','link','iframe'].includes(entry.initiatorType)?'GET':null;
 if(!queue?.length)pendingMethods.delete(id);
 const key=category+' · '+route;
 trace.counts.set(key,(trace.counts.get(key)||0)+1);
 trace.total++;
 trace.rows.push({time:new Date(performance.timeOrigin+entry.startTime).toISOString(),category,route,feature:group,initiator:entry.initiatorType,method,duplicate,workerRoute:!!workerRoute,retry:matched?.retry??null,automatic:matched?.automatic??null,module:matched?.module??null,status:entry.responseStatus||null,delivery:swSource||kind,network:swSource==='service-worker-cache'||kind==='browser-cache'?false:kind==='network'?true:null,workerExecution:null,bytes:entry.encodedBodySize||null,durationMs:Math.round(entry.duration)});
 if(trace.rows.length>2000)trace.rows.shift();
}
try{
 const observer=new PerformanceObserver(list=>{for(const entry of list.getEntries())record(entry)});
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
 const controls=document.getElementById('mwsTraceControls');
 const status=document.createElement('p'),history=document.createElement('pre');history.style.cssText='max-height:16rem;overflow:auto;white-space:pre-wrap;font-size:.8rem';
 const reset=()=>{signalWorker(false);deliveries.clear();fingerprints.clear();pendingMethods.clear();salt=crypto.getRandomValues(new Uint32Array(1))[0];trace.start=null;trace.end=null;trace.total=0;trace.counts.clear();trace.rows.length=0;categories.length=0};
 function update(){
  history.textContent=trace.rows.slice(-30).map(row=>row.time.slice(11,19)+' UTC · '+row.category+' · '+(row.method||'?')+' '+row.route+' · '+(row.status||'?')+' · '+row.delivery+' · '+row.durationMs+'ms').join('\n');
  const minutes=trace.start===null?0:((trace.end??performance.now())-trace.start)/60000;
  status.textContent=(trace.start===null?'대기':trace.end===null?'측정 중':'종료')+' · '+trace.total+'건 · 분당 '+(minutes?(trace.total/minutes).toFixed(1):0)+'건';
 }
 function action(label,fn){const b=document.createElement('button');b.type='button';b.className='ghost small';b.textContent=label;b.onclick=()=>{fn();update()};controls.append(b)}
 if(controls){
  action('측정 시작',()=>{if(trace.start!==null&&trace.end===null)return;reset();trace.start=performance.now();signalWorker(true);markCategory()});
  action('측정 종료',()=>{if(trace.start!==null){trace.end??=performance.now();signalWorker(false)}});
  action('초기화',reset);
  action('JSON 내보내기',()=>{const blob=new Blob([JSON.stringify({total:trace.total,counts:Object.fromEntries(trace.counts),latest2000:trace.rows},null,2)],{type:'application/json'});const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download='mws-network.json';link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000)});
  controls.append(status,history);update();
  panel.querySelector('[data-request-budget-refresh]')?.addEventListener('click',update);
 }
 details.addEventListener('toggle',render);panel.querySelector('[data-request-budget-refresh]')?.addEventListener('click',render);
 window.addEventListener('mws:app-ready',syncMode);
 try{new MutationObserver(syncMode).observe(document.body,{attributes:true,attributeFilter:['data-mws-mode']})}catch(_){}
 syncMode();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();
