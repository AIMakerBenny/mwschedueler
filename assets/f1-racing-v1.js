(()=>{
'use strict';
const VERSION='phase180-shell';
const VERSION181='phase181-participants';
const VERSION182='phase182-track-model';
const VERSION183='phase183-svg-track';
const VERSION184='phase184-smooth-single-marker';
const VERSION185='phase185-screen-state-machine';
const VERSION186='phase186-setup-track-select';
const VERSION187='phase187-race-draft-snapshot-transition';
const VERSION188='phase188-race-control-frame';
const VERSION189='phase189-shared-multicar-raf';
const VERSION190='phase190-race-distance-lap-sector';
const DEFAULT_TOTAL_LAPS_V190=10;
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
let activeRaceSnapshotV187=null;
let raceTransitionTimerV187=0;
const raceMotionV189={running:false,suspended:false,rafId:0,lastTimestamp:0,vehicles:[],snapshotCreatedAt:'',hudAccumulatorMs:0};

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
function getTrackCatalogV186(){
  const source=window.MWS_F1_TRACKS_V182||{};
  return Object.values(source).map(track=>({
    id:String(track.id||''),
    name:String(track.name||'Track'),
    lengthMeters:Number(track.lengthMeters)||0,
    sectors:Array.isArray(track.sectors)?track.sectors.length:0,
    pitLimit:Number(track.pit?.speedLimitKph)||0,
    zones:Array.isArray(track.zones)?track.zones.length:0,
    overtakeZones:Array.isArray(track.overtakeZones)?track.overtakeZones.length:0
  }));
}
function selectTrackV186(trackId){
  const id=String(trackId||'');
  if(!window.mwsGetF1TrackV182?.(id))return false;
  activeTrackId=id;
  renderTrackChoicesV186();
  updateTrackFoundationStatusV182();
  renderTrackMapV183();
  syncSetupActionV187();
  return true;
}
function renderTrackChoicesV186(){
  const box=document.getElementById('f1RacingTrackOptionsV186');
  const count=document.getElementById('f1RacingTrackCountV186');
  if(!box)return;
  const tracks=getTrackCatalogV186();
  if(count)count.textContent=tracks.length+' TRACK'+(tracks.length===1?'':'S');
  box.innerHTML=tracks.map(track=>{
    const selected=track.id===activeTrackId;
    return '<button type="button" class="f1-racing-track-card-v186 '+(selected?'selected':'')+'" data-f1-track-id="'+escapeHtml(track.id)+'" aria-pressed="'+(selected?'true':'false')+'">'+
      '<span class="f1-racing-track-card-title-v186">'+escapeHtml(track.name)+'</span>'+
      '<span class="f1-racing-track-card-meta-v186">'+(track.lengthMeters/1000).toFixed(3)+' km · '+track.sectors+' sectors · '+track.zones+' zones</span>'+
      '<span class="f1-racing-track-card-meta-v186">Pit '+track.pitLimit+' km/h · Overtake '+track.overtakeZones+'</span>'+
      '</button>';
  }).join('');
  box.querySelectorAll('[data-f1-track-id]').forEach(button=>button.addEventListener('click',()=>selectTrackV186(button.dataset.f1TrackId)));
}
function getRaceDraftV187(){
  return Object.freeze({
    selectedDriverIds:Object.freeze(selectedIds.slice()),
    selectedTrackId:String(activeTrackId||'')
  });
}
function cloneDriverForRaceV187(row,index){
  return Object.freeze({
    contactId:String(row?.id||''),
    name:String(row?.name||'Driver'),
    image:String(row?.image||''),
    labels:Object.freeze(Array.isArray(row?.labels)?row.labels.slice():[]),
    gridPosition:index+1
  });
}
function buildRaceSnapshotV187(){
  const draft=getRaceDraftV187();
  const byId=new Map(getContacts().map(row=>[String(row.id),row]));
  const drivers=draft.selectedDriverIds.map((id,index)=>cloneDriverForRaceV187(byId.get(String(id)),index)).filter(row=>row.contactId);
  const track=window.mwsGetF1TrackV182?.(draft.selectedTrackId);
  if(drivers.length<2||!track)return null;
  return Object.freeze({
    createdAt:new Date().toISOString(),
    trackId:String(track.id),
    totalLaps:DEFAULT_TOTAL_LAPS_V190,
    track:Object.freeze({
      id:String(track.id),
      name:String(track.name),
      lengthMeters:Number(track.lengthMeters)||0,
      viewBox:Object.freeze([...(track.viewBox||[])]),
      path:String(track.path||''),
      sectors:Object.freeze((track.sectors||[]).map(row=>Object.freeze({...row}))),
      pit:Object.freeze({...track.pit}),
      speedTraps:Object.freeze((track.speedTraps||[]).map(row=>Object.freeze({...row}))),
      overtakeZones:Object.freeze((track.overtakeZones||[]).map(row=>Object.freeze({...row}))),
      zones:Object.freeze((track.zones||[]).map(row=>Object.freeze({...row})))
    }),
    drivers:Object.freeze(drivers)
  });
}
function syncSetupActionV187(){
  const button=document.getElementById('f1RacingProceedV187');
  const summary=document.getElementById('f1RacingSetupSummaryV187');
  const hint=document.getElementById('f1RacingSetupHintV187');
  const track=getActiveTrack();
  const ready=selectedIds.length>=2&&Boolean(track);
  if(summary)summary.textContent='드라이버 '+selectedIds.length+'명 · '+(track?.name||'트랙 미선택');
  if(hint)hint.textContent=ready?'준비가 완료되었습니다. 경기 진행을 누르면 관제 화면으로 전환됩니다.':'드라이버를 2명 이상 선택하고 트랙을 선택해 주세요.';
  if(button)button.disabled=!ready;
  return ready;
}
function populateTransitionV187(snapshot){
  const track=document.getElementById('f1RacingTransitionTrackV187');
  const drivers=document.getElementById('f1RacingTransitionDriversV187');
  if(track)track.textContent=String(snapshot?.track?.name||'TRACK').toUpperCase();
  if(drivers)drivers.textContent=(snapshot?.drivers?.length||0)+' DRIVERS';
}
function startRaceFromSetupV187(){
  if(f1ScreenStateV185!=='SETUP')return false;
  const snapshot=buildRaceSnapshotV187();
  if(!snapshot)return false;
  resetRaceMotionV189();
  activeRaceSnapshotV187=snapshot;
  populateTransitionV187(snapshot);
  if(!setScreenStateV185('TRANSITION'))return false;
  if(raceTransitionTimerV187)clearTimeout(raceTransitionTimerV187);
  raceTransitionTimerV187=window.setTimeout(function(){
    raceTransitionTimerV187=0;
    setScreenStateV185('RACE');
    renderRaceControlV188();
    startRaceMotionV189();
    const chip=document.getElementById('f1RacingPhaseChipV180');
    if(chip)chip.textContent='RACE CONTROL';
  },1600);
  return true;
}
function getActiveRaceSnapshotV187(){return activeRaceSnapshotV187}
function hashDriverV189(value=''){
  let hash=2166136261;
  for(const ch of String(value)){hash^=ch.charCodeAt(0);hash=Math.imul(hash,16777619)}
  return hash>>>0;
}
function normalizedProgressV190(value){
  return ((Number(value)||0)%1+1)%1;
}
function sectorForProgressV190(track,progress){
  const p=normalizedProgressV190(progress);
  const sectors=Array.isArray(track?.sectors)?track.sectors:[];
  const found=sectors.find(function(sector){return p>=Number(sector.start)&&p<Number(sector.end)})||sectors[sectors.length-1];
  return found?.id||'S1';
}
function syncVehicleRaceMetricsV190(vehicle,track=activeRaceSnapshotV187?.track){
  if(!vehicle||!track)return vehicle;
  const length=Math.max(1,Number(track.lengthMeters)||1);
  const raceProgress=Number(vehicle.startOffset||0)+Number(vehicle.travel||0);
  vehicle.raceProgress=raceProgress;
  vehicle.progress=normalizedProgressV190(raceProgress);
  vehicle.raceDistanceMeters=Math.max(0,raceProgress*length);
  vehicle.completedLaps=Math.max(0,Math.floor(Math.max(0,raceProgress)));
  vehicle.currentLap=vehicle.completedLaps+1;
  vehicle.sector=raceProgress<0?'GRID':sectorForProgressV190(track,vehicle.progress);
  return vehicle;
}
function findTimingRowV190(driverId){
  return Array.from(document.querySelectorAll('#f1RacingTimingListV188 [data-f1-driver-id]')).find(function(row){return String(row.dataset.f1DriverId)===String(driverId)})||null;
}
function updateRaceProgressHudV190(){
  const snapshot=activeRaceSnapshotV187;if(!snapshot||!raceMotionV189.vehicles.length)return false;
  const leader=raceMotionV189.vehicles.reduce((best,vehicle)=>!best||vehicle.raceProgress>best.raceProgress?vehicle:best,null);
  const totalLaps=Number(snapshot.totalLaps)||DEFAULT_TOTAL_LAPS_V190;
  const lap=document.getElementById('f1RacingRaceLapV188');
  const meta=document.getElementById('f1RacingRaceMapMetaV188');
  if(lap)lap.textContent=Math.min(totalLaps,leader?.currentLap||1)+' / '+totalLaps;
  if(meta)meta.textContent=(snapshot.track.lengthMeters/1000).toFixed(3)+' km · '+snapshot.drivers.length+' drivers · '+(leader?.sector||'GRID');
  for(const vehicle of raceMotionV189.vehicles){
    const row=findTimingRowV190(vehicle.id);if(!row)continue;
    row.dataset.lap=String(vehicle.currentLap||1);
    row.dataset.sector=String(vehicle.sector||'GRID');
    row.dataset.raceDistance=String(Math.round(vehicle.raceDistanceMeters||0));
    const badge=row.querySelector('[data-f1-current-sector]');
    if(badge)badge.textContent=vehicle.sector||'GRID';
  }
  return true;
}
function createRaceVehiclesV189(snapshot){
  const count=Math.max(1,snapshot?.drivers?.length||0);
  return (snapshot?.drivers||[]).map(function(driver,index){
    const hash=hashDriverV189(driver.contactId||driver.name);
    const startOffset=-(index*Math.min(.0045,.045/count));
    const vehicle={id:String(driver.contactId),driver,startOffset,progress:normalizedProgressV190(startOffset),travel:0,raceProgress:startOffset,raceDistanceMeters:0,currentLap:1,completedLaps:0,sector:'GRID',lapDurationMs:17500+(hash%6500),marker:null};
    return syncVehicleRaceMetricsV190(vehicle,snapshot.track);
  });
}
function ensureRaceVehicleMarkerV189(vehicle,index){
  const layer=document.getElementById('f1RacingRaceVehicleLayerV188');
  if(!layer)return null;
  const safeId='f1RaceVehicleV189_'+String(vehicle.id).replace(/[^a-zA-Z0-9_-]/g,'_');
  let marker=document.getElementById(safeId);
  if(!marker){
    marker=svgNodeV183('g',{id:safeId,class:'f1-racing-race-vehicle-v189','data-driver-id':vehicle.id,'data-grid':index+1});
    marker.append(svgNodeV183('circle',{class:'car-halo',cx:0,cy:0,r:18}),svgNodeV183('circle',{class:'car-ring',cx:0,cy:0,r:10}),svgNodeV183('circle',{class:'car-core',cx:0,cy:0,r:5}));
    const label=svgNodeV183('text',{class:'car-label',x:15,y:-12});label.textContent=driverCodeV188(vehicle.driver);marker.appendChild(label);layer.appendChild(marker);
  }
  vehicle.marker=marker;return marker;
}
function renderRaceVehiclesV189(){
  const path=document.getElementById('f1RacingRaceTrackPathV188');
  const layer=document.getElementById('f1RacingRaceVehicleLayerV188');
  if(!path||!layer)return false;
  const totalLength=path.getTotalLength();if(!(totalLength>0))return false;
  raceMotionV189.vehicles.forEach(function(vehicle,index){
    const marker=vehicle.marker||ensureRaceVehicleMarkerV189(vehicle,index);if(!marker)return;
    const point=path.getPointAtLength((((Number(vehicle.progress)||0)%1+1)%1)*totalLength);
    marker.setAttribute('transform','translate('+point.x.toFixed(2)+' '+point.y.toFixed(2)+')');
  });
  return true;
}
function initializeRaceMotionV189(snapshot=activeRaceSnapshotV187){
  if(!snapshot)return false;
  raceMotionV189.vehicles=createRaceVehiclesV189(snapshot);
  raceMotionV189.snapshotCreatedAt=String(snapshot.createdAt||'');
  raceMotionV189.lastTimestamp=0;
  raceMotionV189.hudAccumulatorMs=0;
  const layer=document.getElementById('f1RacingRaceVehicleLayerV188');if(layer)layer.replaceChildren();
  renderRaceVehiclesV189();
  updateRaceProgressHudV190();
  return raceMotionV189.vehicles.length>0;
}
function raceFrameV189(timestamp){
  if(!raceMotionV189.running)return;
  if(!raceMotionV189.lastTimestamp)raceMotionV189.lastTimestamp=timestamp;
  const delta=Math.min(50,Math.max(0,timestamp-raceMotionV189.lastTimestamp));
  raceMotionV189.lastTimestamp=timestamp;
  for(const vehicle of raceMotionV189.vehicles){const step=delta/vehicle.lapDurationMs;vehicle.travel+=step;syncVehicleRaceMetricsV190(vehicle)}
  renderRaceVehiclesV189();
  raceMotionV189.hudAccumulatorMs+=delta;
  if(raceMotionV189.hudAccumulatorMs>=100){raceMotionV189.hudAccumulatorMs=0;updateRaceProgressHudV190()}
  raceMotionV189.rafId=requestAnimationFrame(raceFrameV189);
}
function startRaceMotionV189(){
  const snapshot=activeRaceSnapshotV187;if(!snapshot||f1ScreenStateV185!=='RACE')return false;
  if(raceMotionV189.snapshotCreatedAt!==String(snapshot.createdAt||'')||!raceMotionV189.vehicles.length){if(!initializeRaceMotionV189(snapshot))return false}
  if(raceMotionV189.running)return true;
  raceMotionV189.running=true;raceMotionV189.suspended=false;raceMotionV189.lastTimestamp=0;
  const status=document.getElementById('f1RacingRaceStatusV188');if(status)status.textContent='RUNNING';
  raceMotionV189.rafId=requestAnimationFrame(raceFrameV189);return true;
}
function pauseRaceMotionV189(suspended=false){
  raceMotionV189.running=false;raceMotionV189.suspended=Boolean(suspended);raceMotionV189.lastTimestamp=0;
  if(raceMotionV189.rafId)cancelAnimationFrame(raceMotionV189.rafId);raceMotionV189.rafId=0;return true;
}
function resetRaceMotionV189(){
  pauseRaceMotionV189(false);raceMotionV189.vehicles=[];raceMotionV189.snapshotCreatedAt='';
  const layer=document.getElementById('f1RacingRaceVehicleLayerV188');if(layer)layer.replaceChildren();
}
function driverCodeV188(driver){
  const raw=String(driver?.name||'DRV').replace(/\s+/g,'');
  return raw.slice(0,4).toUpperCase()||'DRV';
}
function timingRowV188(driver,index){
  const pos=index+1;
  const podium=pos<=3?' podium p'+pos:'';
  return '<div class="f1-racing-timing-row-v188'+podium+'" data-f1-driver-id="'+escapeHtml(driver.contactId)+'">'+
    '<span class="pos">P'+String(pos).padStart(2,'0')+'</span>'+
    '<span class="driver"><b>'+escapeHtml(driverCodeV188(driver))+'</b><small>'+escapeHtml(driver.name)+'</small><em data-f1-current-sector>GRID</em></span>'+
    '<span>--</span><span>----</span><span>---</span><span>--:--.---</span><span>--:--.---</span><span>'+(pos===1?'LEADER':'--.---')+'</span><span>--</span><span>--.---</span><span>--.---</span><span>--.---</span>'+
    '</div>';
}
function renderRaceControlV188(){
  const snapshot=activeRaceSnapshotV187;
  if(!snapshot)return false;
  const name=document.getElementById('f1RacingRaceTrackNameV188');
  const count=document.getElementById('f1RacingRaceDriverCountV188');
  const status=document.getElementById('f1RacingRaceStatusV188');
  const lap=document.getElementById('f1RacingRaceLapV188');
  const list=document.getElementById('f1RacingTimingListV188');
  const mapMeta=document.getElementById('f1RacingRaceMapMetaV188');
  const svg=document.getElementById('f1RacingRaceTrackSvgV188');
  const path=document.getElementById('f1RacingRaceTrackPathV188');
  const glow=document.getElementById('f1RacingRaceTrackGlowV188');
  if(name)name.textContent=String(snapshot.track.name||'TRACK').toUpperCase();
  if(count)count.textContent=String(snapshot.drivers.length);
  if(status)status.textContent='PRE-RACE';
  if(lap)lap.textContent='1 / '+(Number(snapshot.totalLaps)||DEFAULT_TOTAL_LAPS_V190);
  if(list)list.innerHTML=snapshot.drivers.map(timingRowV188).join('');
  if(mapMeta)mapMeta.textContent=(snapshot.track.lengthMeters/1000).toFixed(3)+' km · '+snapshot.drivers.length+' drivers';
  if(svg)svg.setAttribute('viewBox',(snapshot.track.viewBox||[0,0,1000,600]).join(' '));
  if(path)path.setAttribute('d',snapshot.track.path||'');
  if(glow)glow.setAttribute('d',snapshot.track.path||'');
  const chip=document.getElementById('f1RacingPhaseChipV180');if(chip)chip.textContent='RACE CONTROL';
  return true;
}
function bindRaceProceedV187(){
  const button=document.getElementById('f1RacingProceedV187');
  if(button&&!button.dataset.f1Bound){
    button.dataset.f1Bound='1';
    button.addEventListener('click',startRaceFromSetupV187);
  }
  syncSetupActionV187();
}
function render(){
  const section=document.getElementById('gameF1Racing');
  if(!section)return false;
  const search=document.getElementById('f1RacingContactSearchV181');
  const clear=document.getElementById('f1RacingClearDriversV181');
  if(search&&!search.dataset.f1Bound){search.dataset.f1Bound='1';search.addEventListener('input',renderContacts)}
  if(clear&&!clear.dataset.f1Bound){clear.dataset.f1Bound='1';clear.addEventListener('click',function(){selectedIds.splice(0);stopPreviewV184(true);renderContacts();renderSelected();syncSetupActionV187()})}
  applyScreenStateV185();
  renderContacts();
  renderSelected();
  renderTrackChoicesV186();
  bindRaceProceedV187();
  updateTrackFoundationStatusV182();
  renderTrackMapV183();
  if(previewStateV184.running)stopPreviewV184(true);
  if(f1ScreenStateV185==='RACE'&&activeRaceSnapshotV187){renderRaceControlV188();startRaceMotionV189()}
  const chip=document.getElementById('f1RacingPhaseChipV180');if(chip)chip.textContent=f1ScreenStateV185==='SETUP'?'RACE SETUP':'RACE CONTROL';
  section.dataset.f1Runtime=VERSION190;
  return true;
}
function toggleDriver(id){
  const key=String(id||'');if(!key)return;
  const index=selectedIds.findIndex(function(value){return String(value)===key});
  if(index>=0)selectedIds.splice(index,1);else selectedIds.push(key);
  renderContacts();renderSelected();syncSetupActionV187();
}
function removeDriver(id){
  const key=String(id||'');
  const index=selectedIds.findIndex(function(value){return String(value)===key});
  if(index>=0)selectedIds.splice(index,1);
  renderContacts();renderSelected();syncSetupActionV187();
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
window.mwsF1SelectTrackV186=selectTrackV186;
window.mwsF1GetTrackCatalogV186=getTrackCatalogV186;
window.mwsF1GetRaceDraftV187=getRaceDraftV187;
window.mwsF1BuildRaceSnapshotV187=buildRaceSnapshotV187;
window.mwsF1StartRaceFromSetupV187=startRaceFromSetupV187;
window.mwsF1GetActiveRaceSnapshotV187=getActiveRaceSnapshotV187;
window.mwsF1RenderRaceControlV188=renderRaceControlV188;
window.mwsF1StartRaceMotionV189=startRaceMotionV189;
window.mwsF1PauseRaceMotionV189=pauseRaceMotionV189;
window.mwsF1ResetRaceMotionV189=resetRaceMotionV189;
window.mwsF1RenderRaceVehiclesV189=renderRaceVehiclesV189;
window.mwsF1SectorForProgressV190=sectorForProgressV190;
window.mwsF1SyncVehicleRaceMetricsV190=syncVehicleRaceMetricsV190;
window.mwsF1UpdateRaceProgressHudV190=updateRaceProgressHudV190;
window.__mwsF1RacingV180=VERSION;
window.__mwsF1RacingV181=VERSION181;
window.__mwsF1RacingV182=VERSION182;
window.__mwsF1RacingV183=VERSION183;
window.__mwsF1RacingV184=VERSION184;
window.__mwsF1RacingV185=VERSION185;
window.__mwsF1RacingV186=VERSION186;
window.__mwsF1RacingV187=VERSION187;
window.__mwsF1RacingV188=VERSION188;
window.__mwsF1RacingV189=VERSION189;
window.__mwsF1RacingV190=VERSION190;
window.addEventListener('mawang:datachange',function(){const section=document.getElementById('gameF1Racing');if(section&&section.classList.contains('active'))render()});
document.addEventListener('visibilitychange',function(){
  if(document.hidden){
    if(previewStateV184.running)stopPreviewV184(false);
    if(raceMotionV189.running)pauseRaceMotionV189(true);
  }else if(raceMotionV189.suspended&&f1ScreenStateV185==='RACE'){
    startRaceMotionV189();
  }
});
})();
