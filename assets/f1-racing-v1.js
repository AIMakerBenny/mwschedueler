(()=>{
'use strict';
const VERSION='phase180-shell';
const VERSION181='phase181-participants';
const VERSION182='phase182-track-model';
const VERSION183='phase183-svg-track';
const VERSION184='phase184-smooth-single-marker';
const VERSION185='phase185-screen-state-machine';
const F1_STATES_V185=Object.freeze(['SETUP','TRANSITION','GRID','RACE','FINISHING','PODIUM','RESULT']);
const F1_TRANSITIONS_V185=Object.freeze({
  SETUP:Object.freeze(['TRANSITION']),
  TRANSITION:Object.freeze(['SETUP','GRID','RACE']),
  GRID:Object.freeze(['SETUP','RACE']),
  RACE:Object.freeze(['FINISHING']),
  FINISHING:Object.freeze(['PODIUM','RESULT']),
  PODIUM:Object.freeze(['RESULT']),
  RESULT:Object.freeze(['SETUP'])
});
let f1ScreenStateV185='SETUP';
const selectedIds=[];
let activeTrackId='majoku-ring-v1';
const previewStateV184={running:false,progress:0,lastTimestamp:0,rafId:0,lapDurationMs:18000};

function escapeHtml(value=''){
  return String(value).replace(/[&<>"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]});
}
function initials(name=''){
  return String(name||'?').trim().split(/\s+/).filter(Boolean).map(function(x){return x[0]}).join('').slice(0,2).toUpperCase()||'?';
}
function getContacts(){
  const source=typeof window.mwsGetF1ContactsV181==='function'?window.mwsGetF1ContactsV181():[];
  return Array.isArray(source)?source:[];
}
function contactMatches(row,query){
  if(typeof window.mwsF1ContactMatchesV181==='function')return window.mwsF1ContactMatchesV181(row,query);
  const q=String(query||'').trim().toLowerCase();
  if(!q)return true;
  return [row&&row.name].concat(row&&row.labels||[]).join(' ').toLowerCase().includes(q);
}
function pruneSelection(contacts){
  const valid=new Set(contacts.map(function(row){return String(row.id)}));
  for(let i=selectedIds.length-1;i>=0;i--)if(!valid.has(String(selectedIds[i])))selectedIds.splice(i,1);
}
function avatar(row){
  const name=escapeHtml(row&&row.name||'');
  const id=escapeHtml(row&&row.id||'');
  const src=String(row&&row.image||'').trim();
  if(src)return '<img class="f1-racing-avatar-v181" loading="lazy" decoding="async" src="'+escapeHtml(src)+'" alt="'+name+'" data-contact-id="'+id+'" data-contact-initials="'+escapeHtml(initials(row&&row.name))+'">';
  return '<span class="f1-racing-avatar-v181">'+escapeHtml(initials(row&&row.name))+'</span>';
}
function selectedSet(){return new Set(selectedIds.map(String))}
function renderContacts(){
  const list=document.getElementById('f1RacingContactListV181');
  const search=document.getElementById('f1RacingContactSearchV181');
  const count=document.getElementById('f1RacingContactCountV181');
  if(!list)return;
  const contacts=getContacts();
  pruneSelection(contacts);
  const q=String(search&&search.value||'').trim();
  const filtered=contacts.filter(function(row){return contactMatches(row,q)}).sort(function(a,b){return String(a.name||'').localeCompare(String(b.name||''),'ko')});
  if(count)count.textContent=filtered.length+'명';
  const selected=selectedSet();
  list.innerHTML=filtered.length?filtered.map(function(row){
    const active=selected.has(String(row.id));
    const labels=(row.labels||[]).slice(0,4).join(' · ')||'라벨 없음';
    return '<button type="button" class="f1-racing-contact-row-v181 '+(active?'selected':'')+'" data-contact-id="'+escapeHtml(row.id)+'" aria-pressed="'+(active?'true':'false')+'">'+avatar(row)+'<span style="min-width:0"><span class="f1-racing-contact-name-v181">'+escapeHtml(row.name)+'</span><span class="f1-racing-contact-meta-v181">'+escapeHtml(labels)+'</span></span><span class="f1-racing-contact-action-v181">'+(active?'선택됨':'추가')+'</span></button>';
  }).join(''):'<div class="f1-racing-empty-v181">검색 조건에 맞는 연락처가 없습니다.</div>';
  list.querySelectorAll('[data-contact-id]').forEach(function(button){button.addEventListener('click',function(){toggleDriver(button.dataset.contactId)})});
}
function renderSelected(){
  const list=document.getElementById('f1RacingSelectedListV181');
  const count=document.getElementById('f1RacingSelectedCountV181');
  if(!list)return;
  const contacts=getContacts();
  pruneSelection(contacts);
  const byId=new Map(contacts.map(function(row){return [String(row.id),row]}));
  const rows=selectedIds.map(function(id){return byId.get(String(id))}).filter(Boolean);
  if(count)count.textContent=rows.length+'명';
  list.innerHTML=rows.length?rows.map(function(row,index){
    return '<div class="f1-racing-selected-row-v181"><span class="f1-racing-grid-pos-v181">P'+String(index+1).padStart(2,'0')+'</span>'+avatar(row)+'<span style="min-width:0"><span class="f1-racing-contact-name-v181">'+escapeHtml(row.name)+'</span><span class="f1-racing-contact-meta-v181">'+escapeHtml((row.labels||[]).slice(0,4).join(' · ')||'라벨 없음')+'</span></span><button type="button" class="f1-racing-selected-remove-v181" data-remove-contact-id="'+escapeHtml(row.id)+'" title="출전 목록에서 제거">×</button></div>';
  }).join(''):'<div class="f1-racing-empty-v181">왼쪽 연락처에서 레이스 참가자를 선택해 주세요.</div>';
  list.querySelectorAll('[data-remove-contact-id]').forEach(function(button){button.addEventListener('click',function(){removeDriver(button.dataset.removeContactId)})});
}
function driverForPreviewV184(){
  const firstId=selectedIds[0];
  if(!firstId)return null;
  return getContacts().find(row=>String(row.id)===String(firstId))||null;
}
function driverCodeV184(driver){
  const raw=String(driver?.name||'CAR').replace(/\s+/g,'');
  return raw.slice(0,3).toUpperCase()||'CAR';
}
function ensurePreviewMarkerV184(){
  const layer=document.getElementById('f1RacingVehicleLayerV183');
  if(!layer)return null;
  let marker=document.getElementById('f1RacingPreviewCarV184');
  if(marker)return marker;
  marker=svgNodeV183('g',{id:'f1RacingPreviewCarV184',class:'f1-racing-preview-car-v184'});
  marker.append(
    svgNodeV183('circle',{class:'car-halo',cx:0,cy:0,r:20}),
    svgNodeV183('circle',{class:'car-body',cx:0,cy:0,r:11}),
    svgNodeV183('circle',{class:'car-core',cx:0,cy:0,r:5})
  );
  const label=svgNodeV183('text',{class:'car-label',x:17,y:-13});
  marker.appendChild(label);
  layer.appendChild(marker);
  return marker;
}
function positionPreviewMarkerV184(progress=previewStateV184.progress){
  const path=document.getElementById('f1RacingTrackPathV183');
  const marker=ensurePreviewMarkerV184();
  if(!path||!marker)return false;
  const total=path.getTotalLength();
  if(!(total>0))return false;
  const point=path.getPointAtLength(Math.max(0,Math.min(1,Number(progress)||0))*total);
  marker.setAttribute('transform','translate('+point.x.toFixed(2)+' '+point.y.toFixed(2)+')');
  const label=marker.querySelector('.car-label');
  const driver=driverForPreviewV184();
  if(label)label.textContent=driverCodeV184(driver);
  marker.style.display=driver?'':'none';
  return Boolean(driver);
}
function syncPreviewControlsV184(){
  const driver=driverForPreviewV184();
  const start=document.getElementById('f1RacingPreviewStartV184');
  const stop=document.getElementById('f1RacingPreviewStopV184');
  const status=document.getElementById('f1RacingPreviewStatusV184');
  if(!driver&&previewStateV184.running)return stopPreviewV184(true);
  if(start){start.disabled=!driver||previewStateV184.running;start.textContent=previewStateV184.running?'주행 중':'주행 미리보기'}
  if(stop)stop.disabled=!previewStateV184.running;
  if(status)status.textContent=!driver?'드라이버 선택 후 테스트 가능':previewStateV184.running?driver.name+' · smooth preview running':driver.name+' · ready';
  positionPreviewMarkerV184();
}
function previewFrameV184(timestamp){
  if(!previewStateV184.running)return;
  if(!previewStateV184.lastTimestamp)previewStateV184.lastTimestamp=timestamp;
  const delta=Math.min(50,Math.max(0,timestamp-previewStateV184.lastTimestamp));
  previewStateV184.lastTimestamp=timestamp;
  previewStateV184.progress=(previewStateV184.progress+delta/previewStateV184.lapDurationMs)%1;
  positionPreviewMarkerV184(previewStateV184.progress);
  previewStateV184.rafId=requestAnimationFrame(previewFrameV184);
}
function startPreviewV184(){
  if(previewStateV184.running||!driverForPreviewV184())return false;
  if(!renderTrackMapV183())return false;
  previewStateV184.running=true;
  previewStateV184.lastTimestamp=0;
  const marker=ensurePreviewMarkerV184();if(marker)marker.classList.add('running');
  syncPreviewControlsV184();
  previewStateV184.rafId=requestAnimationFrame(previewFrameV184);
  return true;
}
function stopPreviewV184(reset=false){
  previewStateV184.running=false;
  previewStateV184.lastTimestamp=0;
  if(previewStateV184.rafId)cancelAnimationFrame(previewStateV184.rafId);
  previewStateV184.rafId=0;
  if(reset)previewStateV184.progress=0;
  const marker=document.getElementById('f1RacingPreviewCarV184');if(marker)marker.classList.remove('running');
  positionPreviewMarkerV184(previewStateV184.progress);
  const driver=driverForPreviewV184();
  const start=document.getElementById('f1RacingPreviewStartV184');
  const stop=document.getElementById('f1RacingPreviewStopV184');
  const status=document.getElementById('f1RacingPreviewStatusV184');
  if(start){start.disabled=!driver;start.textContent='주행 미리보기'}
  if(stop)stop.disabled=true;
  if(status)status.textContent=driver?driver.name+' · ready':'드라이버 선택 후 테스트 가능';
  return true;
}
function bindPreviewControlsV184(){
  const start=document.getElementById('f1RacingPreviewStartV184');
  const stop=document.getElementById('f1RacingPreviewStopV184');
  if(start&&!start.dataset.f1Bound){start.dataset.f1Bound='1';start.addEventListener('click',startPreviewV184)}
  if(stop&&!stop.dataset.f1Bound){stop.dataset.f1Bound='1';stop.addEventListener('click',()=>stopPreviewV184(false))}
  syncPreviewControlsV184();
}
function applyScreenStateV185(){
  document.querySelectorAll('#gameF1Racing [data-f1-view]').forEach(function(view){
    const active=view.dataset.f1View===f1ScreenStateV185;
    view.hidden=!active;
    view.classList.toggle('active',active);
  });
  const section=document.getElementById('gameF1Racing');
  if(section)section.dataset.f1Screen=f1ScreenStateV185;
  return f1ScreenStateV185;
}
function canTransitionF1V185(next){
  return F1_TRANSITIONS_V185[f1ScreenStateV185]?.includes(next)===true;
}
function setScreenStateV185(next,options={}){
  const target=String(next||'').toUpperCase();
  const force=options&&options.force===true;
  if(!F1_STATES_V185.includes(target))return false;
  if(!force&&target!==f1ScreenStateV185&&!canTransitionF1V185(target))return false;
  f1ScreenStateV185=target;
  applyScreenStateV185();
  return true;
}
function getScreenStateV185(){return f1ScreenStateV185}
function render(){
  const section=document.getElementById('gameF1Racing');
  if(!section)return false;
  const search=document.getElementById('f1RacingContactSearchV181');
  const clear=document.getElementById('f1RacingClearDriversV181');
  if(search&&!search.dataset.f1Bound){search.dataset.f1Bound='1';search.addEventListener('input',renderContacts)}
  if(clear&&!clear.dataset.f1Bound){clear.dataset.f1Bound='1';clear.addEventListener('click',function(){selectedIds.splice(0);stopPreviewV184(true);renderContacts();renderSelected();syncPreviewControlsV184()})}
  applyScreenStateV185();
  renderContacts();
  renderSelected();
  updateTrackFoundationStatusV182();
  renderTrackMapV183();
  bindPreviewControlsV184();
  const chip=document.getElementById('f1RacingPhaseChipV180');if(chip)chip.textContent='SMOOTH MARKER';
  section.dataset.f1Runtime=VERSION184;
  return true;
}
function toggleDriver(id){
  const key=String(id||'');if(!key)return;
  const index=selectedIds.findIndex(function(value){return String(value)===key});
  if(index>=0)selectedIds.splice(index,1);else selectedIds.push(key);
  renderContacts();renderSelected();syncPreviewControlsV184();
}
function removeDriver(id){
  const key=String(id||'');
  const index=selectedIds.findIndex(function(value){return String(value)===key});
  if(index>=0)selectedIds.splice(index,1);
  renderContacts();renderSelected();syncPreviewControlsV184();
}
function getSelectedContactIds(){return selectedIds.slice()}
function getActiveTrack(){return typeof window.mwsGetF1TrackV182==='function'?window.mwsGetF1TrackV182(activeTrackId):null}
function svgNodeV183(name,attrs={}){
  const node=document.createElementNS('http://www.w3.org/2000/svg',name);
  Object.entries(attrs).forEach(([key,value])=>node.setAttribute(key,String(value)));
  return node;
}
function pointAtProgressV183(path,progress){
  const length=path.getTotalLength();
  return path.getPointAtLength(Math.max(0,Math.min(1,Number(progress)||0))*length);
}
function addTrackAnnotationV183(layer,path,kind,label,progress){
  const point=pointAtProgressV183(path,progress);
  const group=svgNodeV183('g',{class:'f1-racing-track-annotation-v183 '+kind,'data-kind':kind,'data-progress':progress});
  const circle=svgNodeV183('circle',{cx:point.x,cy:point.y,r:kind==='start'?9:7});
  const textNode=svgNodeV183('text',{x:point.x+12,y:point.y-10});
  textNode.textContent=label;
  group.append(circle,textNode);
  layer.appendChild(group);
}
function renderTrackMapV183(){
  const track=getActiveTrack();
  const svg=document.getElementById('f1RacingTrackSvgV183');
  const path=document.getElementById('f1RacingTrackPathV183');
  const glow=document.getElementById('f1RacingTrackGlowV183');
  const layer=document.getElementById('f1RacingTrackAnnotationsV183');
  if(!track||!svg||!path||!glow||!layer)return false;
  svg.setAttribute('viewBox',track.viewBox.join(' '));
  svg.setAttribute('aria-label',track.name+' track map');
  path.setAttribute('d',track.path);
  glow.setAttribute('d',track.path);
  layer.replaceChildren();
  addTrackAnnotationV183(layer,path,'start','START',track.startFinish);
  addTrackAnnotationV183(layer,path,'sector','S1',track.sectors[0].end);
  addTrackAnnotationV183(layer,path,'sector','S2',track.sectors[1].end);
  track.speedTraps.forEach((trap,index)=>addTrackAnnotationV183(layer,path,'trap','ST'+(index+1),trap.progress));
  addTrackAnnotationV183(layer,path,'pit','PIT IN',track.pit.entry);
  addTrackAnnotationV183(layer,path,'pit','PIT OUT',track.pit.exit);
  const name=document.getElementById('f1RacingTrackNameV183');
  const length=document.getElementById('f1RacingTrackLengthV183');
  const pit=document.getElementById('f1RacingPitLimitV183');
  const pathState=document.getElementById('f1RacingTrackPathStateV183');
  if(name)name.textContent=track.name;
  if(length)length.textContent=(track.lengthMeters/1000).toFixed(3)+' km';
  if(pit)pit.textContent=track.pit.speedLimitKph+' km/h';
  if(pathState)pathState.textContent=Math.round(path.getTotalLength())+' SVG units';
  return true;
}
function updateTrackFoundationStatusV182(){
  const track=getActiveTrack();
  const chip=document.getElementById('f1RacingPhaseChipV180');
  const status=document.getElementById('f1RacingFoundationStatusV180');
  if(chip)chip.textContent=track?'TRACK MODEL':'TRACK ERROR';
  if(status)status.textContent=track
    ?'트랙 데이터 준비 완료 · '+track.name+' · '+(track.lengthMeters/1000).toFixed(3)+' km · 3 Sectors · Pit/Speed Trap metadata'
    :'트랙 데이터를 불러오지 못했습니다.';
}

window.mwsRenderF1RacingV180=render;
window.mwsRenderF1RacingV181=render;
window.mwsF1ToggleDriverV181=toggleDriver;
window.mwsF1RemoveDriverV181=removeDriver;
window.mwsF1GetSelectedContactIdsV181=getSelectedContactIds;
window.mwsF1GetActiveTrackV182=getActiveTrack;
window.mwsF1RenderTrackMapV183=renderTrackMapV183;
window.mwsF1PointAtProgressV183=pointAtProgressV183;
window.mwsF1StartPreviewV184=startPreviewV184;
window.mwsF1StopPreviewV184=stopPreviewV184;
window.mwsF1PositionPreviewV184=positionPreviewMarkerV184;
window.mwsF1SetScreenStateV185=setScreenStateV185;
window.mwsF1GetScreenStateV185=getScreenStateV185;
window.mwsF1CanTransitionV185=canTransitionF1V185;
window.__mwsF1RacingV180=VERSION;
window.__mwsF1RacingV181=VERSION181;
window.__mwsF1RacingV182=VERSION182;
window.__mwsF1RacingV183=VERSION183;
window.__mwsF1RacingV184=VERSION184;
window.__mwsF1RacingV185=VERSION185;
window.addEventListener('mawang:datachange',function(){const section=document.getElementById('gameF1Racing');if(section&&section.classList.contains('active'))render()});
document.addEventListener('visibilitychange',function(){if(document.hidden&&previewStateV184.running)stopPreviewV184(false)});
})();
