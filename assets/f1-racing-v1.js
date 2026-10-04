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
const VERSION191='phase191-position-gap-interval';
const VERSION192='phase192-simulation-clock';
const VERSION193='phase193-track-geometry-v2';
const VERSION194='phase194-corner-phase-model';
const VERSION195='phase195-speed-profile';
const VERSION196='phase196-vehicle-dynamics-telemetry';
const VERSION197='phase197-racing-line-track-width';
const VERSION198='phase198-slipstream';
const SLIPSTREAM_CONFIG_V198=Object.freeze({maxGapMeters:42,minGapMeters:1.5,maxLateralMeters:8,minSpeedKph:120,maxDragReduction:0.14,maxTargetBonusKph:8});
const VERSION199='phase199-dirty-air';
const DIRTY_AIR_CONFIG_V199=Object.freeze({maxGapMeters:32,minGapMeters:1.5,maxLateralMeters:7,maxCornerGripLoss:0.08,maxUndersteerRisk:0.62,maxSlideRisk:0.38,maxTyreHeatLoad:0.5});
const VERSION200='phase200-driver-pace-consistency-racecraft';
const DRIVER_PROFILE_KEYS_V200=Object.freeze(['pace','braking','cornering','racecraft','consistency','tyreManagement','start','aggression','errorResistance']);
const DRIVER_PACE_CONFIG_V200=Object.freeze({ratingMin:55,ratingMax:95,paceRange:0.006,brakingRange:0.004,corneringRange:0.007,noiseSampleMs:350,noiseBase:0.0025,noiseRange:0.0065,noiseClamp:0.018});
const VERSION201='phase201-energy-recharge-boost';
const ENERGY_CONFIG_V201=Object.freeze({usableCapacityMJ:4,maxRechargePerLapMJ:8.5,maxHarvestPowerKW:350,maxDeployPowerKW:350,icePowerKW:400,minStandingDeployKph:50});
const VERSION202='phase202-active-aero-overtake';
const ACTIVE_AERO_CONFIG_V202=Object.freeze({transitionMs:400,detectionGapSeconds:1,extraRechargeMJ:0.5,overtakeFullPowerToKph:337,overtakeCutoffKph:355});
const VERSION203='phase203-tyre-system';
const VERSION204='phase204-driving-incidents';
const VERSION205='phase205-pit-lane-stop-warmup';
const VERSION206='phase206-pit-strategy-ai';
const VERSION207='phase207-traffic-slipstream-defence';
const VERSION208='phase208-pass-state-machine';
const VERSION209='phase209-long-run-gap-balance';
const VERSION210='phase210-multi-track-integration';
const VERSION211='phase211-track-marker-integration';
const VERSION212='phase212-live-timing-flip';
const VERSION213='phase213-top-three-presentation';
const VERSION214='phase214-race-control-flags';
const RACE_FLAGS_V214=Object.freeze(['GREEN','YELLOW','VSC','SAFETY_CAR','RED']);
const RACE_FLAG_SPEED_V214=Object.freeze({GREEN:1,YELLOW:.82,VSC:.72,SAFETY_CAR:.58,RED:0});
const PASS_STATES_V208=Object.freeze(['FOLLOWING','CLOSING','TOWING','PREPARING_ATTACK','PULLING_OUT','SIDE_BY_SIDE','BRAKING_DUEL','CORNER_BATTLE','SWITCHBACK','PASS_COMPLETED','PASS_FAILED','COUNTER_ATTACK']);
const PASS_CONFIG_V208=Object.freeze({followGapMeters:48,prepareGapMeters:20,pullOutGapMeters:15,sideBySideGapMeters:8,failGapMeters:32,passMarginMeters:1.2,stateHoldMs:160,maxBattleBiasKph:2.4});
const LONG_RUN_GAP_CONFIG_V209=Object.freeze({settlingLaps:3.5,maxOpeningPaceBias:0.0045,maxSettledPaceBias:0.0018,relativeShape:1.25,qaLapSeconds:90,qaLaps:30});
const TRAFFIC_STATES_V207=Object.freeze(['CLEAR','FOLLOWING','TOWING','PRESSURE','DEFENDING']);
const TRAFFIC_CONFIG_V207=Object.freeze({followingGapMeters:48,pressureGapMeters:26,attackGapMeters:18,defendGapMeters:22,minClosingKph:1.5,strongClosingKph:16});
const PIT_STRATEGIES_V206=Object.freeze(['NONE','BOX_NOW','UNDERCUT','OVERCUT','GO_LONG','COVER_UNDERCUT']);
const PIT_STRATEGY_CONFIG_V206=Object.freeze({
  evaluationMs:1600,
  openingLaps:2,
  minRemainingLapsToPit:1.35,
  undercutGapSeconds:4.2,
  coverGapSeconds:7.0,
  overcutGapSeconds:6.5,
  severePressure:0.52,
  normalPressure:0.15,
  postStopCooldownLaps:1
});
const PIT_STATES_V205=Object.freeze(['TRACK','PIT_ENTRY','PIT_LANE','PIT_BOX','PIT_EXIT']);
const PIT_CONFIG_V205=Object.freeze({approachProgress:0.075,boxStopMs:2400,boxVariationMs:450,exitMergeProgress:0.025,warmupLaps:0.55,coldSurface:0.38,coldCarcass:0.40,minWarmupGrip:0.90});
const INCIDENT_CONFIG_V204=Object.freeze({
  evaluationMs:240,
  lockupDurationMs:720,
  understeerDurationMs:900,
  oversteerDurationMs:760,
  lockupBrakeFactor:0.80,
  understeerSpeedFactor:0.93,
  oversteerSpeedFactor:0.91,
  oversteerThrottleFactor:0.48
});
const TYRE_COMPOUNDS_V203=Object.freeze({SOFT:Object.freeze({code:'S',gripBias:1.01,wearPerLap:0.070,heatFactor:1.10,idealSurface:0.60}),MEDIUM:Object.freeze({code:'M',gripBias:1.00,wearPerLap:0.052,heatFactor:1.00,idealSurface:0.56}),HARD:Object.freeze({code:'H',gripBias:0.99,wearPerLap:0.038,heatFactor:0.90,idealSurface:0.52})});
const TYRE_CONFIG_V203=Object.freeze({ambientSurface:0.42,ambientCarcass:0.44,minGrip:0.82,maxGrip:1.03});
const DEFAULT_TOTAL_LAPS_V190=10;
const F1_LINE_MODES_V197=Object.freeze(['IDEAL','ATTACK_INSIDE','DEFENSIVE_INSIDE','OUTSIDE','PIT_LINE']);
const F1_STATES_V185=Object.freeze(['SETUP','TRANSITION','GRID','RACE','FINISHING','PODIUM','RESULT']);
const F1_TRANSITIONS_V185=Object.freeze({
  SETUP:Object.freeze(['TRANSITION']),
  TRANSITION:Object.freeze(['SETUP','GRID','RACE']),
  GRID:Object.freeze(['SETUP','RACE']),
  RACE:Object.freeze(['SETUP','FINISHING']),
  FINISHING:Object.freeze(['PODIUM','RESULT']),
  PODIUM:Object.freeze(['RESULT']),
  RESULT:Object.freeze(['SETUP'])
});
let f1ScreenStateV185='SETUP';
const selectedIds=[];
let activeTrackId='majoku-ring-v1';
let selectedTotalLapsRecoveryD=DEFAULT_TOTAL_LAPS_V190;
let persistenceRestoredRecoveryD=false;
const previewStateV184={running:false,progress:0,lastTimestamp:0,rafId:0,lapDurationMs:18000};
let activeRaceSnapshotV187=null;
let raceTransitionTimerV187=0;
let raceGeometryV193=null;
let activeRaceResultRecoveryG=null;
let finishCounterRecoveryG=0;
const raceMotionV189={running:false,suspended:false,rafId:0,lastTimestamp:0,vehicles:[],snapshotCreatedAt:'',hudAccumulatorMs:0};
const simClockV192={
  paused:false,
  timeScale:1,
  simTimeMs:0,
  accumulatorMs:0,
  fixedStepMs:20,
  maxStepsPerFrame:12
};
let raceFlagStateV214={flag:'GREEN',reason:'',sinceSimMs:0};
function raceFlagSpeedFactorV214(flag=raceFlagStateV214.flag){
  return RACE_FLAG_SPEED_V214[String(flag||'GREEN')]??1;
}
function syncRaceFlagHudV214(){
  const status=document.getElementById('f1RacingRaceStatusV188');
  if(status){
    const flag=String(raceFlagStateV214.flag||'GREEN');
    status.textContent=flag==='GREEN'?'RACING':flag.replace('_',' ')+(raceFlagStateV214.reason?' · '+raceFlagStateV214.reason:'');
    status.dataset.raceFlag=flag;
  }
  const section=document.getElementById('gameF1Racing');
  if(section)section.dataset.raceFlag=String(raceFlagStateV214.flag||'GREEN');
  return {...raceFlagStateV214};
}
function setRaceControlFlagV214(flag='GREEN',reason=''){
  const next=String(flag||'GREEN').toUpperCase();
  if(!RACE_FLAGS_V214.includes(next))return false;
  raceFlagStateV214={flag:next,reason:String(reason||''),sinceSimMs:Number(simClockV192.simTimeMs)||0};
  if(next!=='GREEN'){
    for(const vehicle of raceMotionV189.vehicles){
      vehicle.defenceActive=false;
      vehicle.battleSpeedBiasKph=0;
      if(vehicle.racingLineMode==='ATTACK_INSIDE')vehicle.racingLineMode='IDEAL';
    }
  }
  syncRaceFlagHudV214();
  return true;
}
function getRaceControlFlagV214(){return {...raceFlagStateV214}}
function qaRaceControlFlagsV214(){
  const original={...raceFlagStateV214};
  const rows=RACE_FLAGS_V214.map(flag=>{
    setRaceControlFlagV214(flag,'QA');
    return {flag,factor:raceFlagSpeedFactorV214(flag),accepted:raceFlagStateV214.flag===flag};
  });
  raceFlagStateV214=original;syncRaceFlagHudV214();
  return {rows,allPass:rows.every(row=>row.accepted&&row.factor>=0&&row.factor<=1)&&rows.find(row=>row.flag==='RED')?.factor===0};
}

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
  persistF1SettingsRecoveryD();
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
    selectedTrackId:String(activeTrackId||''),
    totalLaps:selectedTotalLapsRecoveryD
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
    totalLaps:draft.totalLaps,
    track:Object.freeze({
      id:String(track.id),
      name:String(track.name),
      lengthMeters:Number(track.lengthMeters)||0,
      viewBox:Object.freeze([...(track.viewBox||[])]),
      path:String(track.path||''),
      geometry:Object.freeze({...track.geometry}),
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
  if(hint)hint.textContent=ready?'준비가 완료되었습니다. 경기 진행 후 STARTING GRID에서 경기 시작을 눌러야 출발합니다.':'드라이버를 2명 이상 선택하고 트랙을 선택해 주세요.';
  if(button)button.disabled=!ready;
  return ready;
}
function populateTransitionV187(snapshot){
  const track=document.getElementById('f1RacingTransitionTrackV187');
  const drivers=document.getElementById('f1RacingTransitionDriversV187');
  if(track)track.textContent=String(snapshot?.track?.name||'TRACK').toUpperCase();
  if(drivers)drivers.textContent=(snapshot?.drivers?.length||0)+' DRIVERS';
}
function populateGridRecoveryM(snapshot){
  const track=document.getElementById('f1RacingGridTrackRecoveryM');
  const drivers=document.getElementById('f1RacingGridDriversRecoveryM');
  const laps=document.getElementById('f1RacingGridLapsRecoveryM');
  if(track)track.textContent=String(snapshot?.track?.name||'TRACK').toUpperCase();
  if(drivers)drivers.textContent=(snapshot?.drivers?.length||0)+' DRIVERS';
  if(laps)laps.textContent=(Number(snapshot?.totalLaps)||DEFAULT_TOTAL_LAPS_V190)+' LAPS';
}
function startRaceFromSetupV187(){
  if(f1ScreenStateV185!=='SETUP')return false;
  const snapshot=buildRaceSnapshotV187();
  if(!snapshot)return false;
  resetRaceMotionV189();
  activeRaceResultRecoveryG=null;
  finishCounterRecoveryG=0;
  activeRaceSnapshotV187=snapshot;
  populateTransitionV187(snapshot);
  if(!setScreenStateV185('TRANSITION'))return false;
  if(raceTransitionTimerV187)clearTimeout(raceTransitionTimerV187);
  raceTransitionTimerV187=window.setTimeout(function(){
    raceTransitionTimerV187=0;
    populateGridRecoveryM(snapshot);
    setScreenStateV185('GRID');
    const chip=document.getElementById('f1RacingPhaseChipV180');
    if(chip)chip.textContent='STARTING GRID';
  },900);
  return true;
}
function confirmRaceStartRecoveryM(){
  if(f1ScreenStateV185!=='GRID'||!activeRaceSnapshotV187)return false;
  if(raceMotionV189.running)return false;
  if(!setScreenStateV185('RACE'))return false;
  renderRaceControlV188();
  const started=startRaceMotionV189();
  if(!started){
    setScreenStateV185('GRID',{force:true});
    return false;
  }
  const chip=document.getElementById('f1RacingPhaseChipV180');
  if(chip)chip.textContent='RACE CONTROL';
  return true;
}
function bindManualRaceStartRecoveryM(){
  const start=document.getElementById('f1RacingGridStartRecoveryM');
  if(start&&!start.dataset.f1ManualStartBound){
    start.dataset.f1ManualStartBound='1';
    start.addEventListener('click',confirmRaceStartRecoveryM);
  }
}

function cancelRaceToSetupRecoveryC(){
  if(!['TRANSITION','GRID','RACE'].includes(f1ScreenStateV185))return false;
  if(raceTransitionTimerV187){
    clearTimeout(raceTransitionTimerV187);
    raceTransitionTimerV187=0;
  }
  resetRaceMotionV189();
  activeRaceSnapshotV187=null;
  activeRaceResultRecoveryG=null;
  finishCounterRecoveryG=0;
  setScreenStateV185('SETUP',{force:true});
  renderTrackChoicesV186();
  updateTrackFoundationStatusV182();
  renderTrackMapV183();
  renderContacts();
  renderSelected();
  syncSetupActionV187();
  const chip=document.getElementById('f1RacingPhaseChipV180');
  if(chip)chip.textContent='RACE SETUP';
  return true;
}
function bindRaceCancelRecoveryC(){
  ['f1RacingTransitionCancelRecoveryC','f1RacingGridCancelRecoveryM','f1RacingRaceCancelRecoveryC'].forEach(id=>{
    const button=document.getElementById(id);
    if(button&&!button.dataset.f1CancelBound){
      button.dataset.f1CancelBound='1';
      button.addEventListener('click',cancelRaceToSetupRecoveryC);
    }
  });
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
    const gear=row.querySelector('.gear');if(gear)gear.textContent=String(vehicle.gear||1);
    const rpm=row.querySelector('.rpm');if(rpm)rpm.textContent=String(Math.round(vehicle.rpm||0));
    const speed=row.querySelector('.speed');if(speed)speed.textContent=String(Math.round(vehicle.speedKph||0));
    row.dataset.throttle=(Number(vehicle.throttle)||0).toFixed(2);
    row.dataset.brake=(Number(vehicle.brake)||0).toFixed(2);
    row.dataset.targetSpeed=String(Math.round(vehicle.targetSpeedKph||0));
    row.dataset.slipstream=(Number(vehicle.slipstreamStrength)||0).toFixed(3);
    row.dataset.carAhead=String(vehicle.carAheadId||'');
    row.dataset.dirtyAir=(Number(vehicle.dirtyAirStrength)||0).toFixed(3);
    row.dataset.aeroGrip=(Number(vehicle.aeroGripMultiplier)||1).toFixed(3);
    row.dataset.understeerRisk=(Number(vehicle.understeerRisk)||0).toFixed(3);
    row.dataset.driverPace=(Number(vehicle.driverPaceMultiplier)||1).toFixed(4);
    row.dataset.paceNoise=(Number(vehicle.paceNoise)||0).toFixed(4);
    row.dataset.driverPaceRating=String(vehicle.driverProfile?.pace||'');
    row.dataset.driverConsistency=String(vehicle.driverProfile?.consistency||'');
    row.dataset.driverRacecraft=String(vehicle.driverProfile?.racecraft||'');
    row.dataset.longRunPaceBias=(Number(vehicle.longRunPaceBias)||0).toFixed(5);
    row.dataset.longRunPaceMultiplier=(Number(vehicle.longRunPaceMultiplier)||1).toFixed(5);
    row.dataset.energyMJ=(Number(vehicle.batteryMJ)||0).toFixed(3);
    row.dataset.energyDeployKW=String(Math.round(vehicle.energyDeployKW||0));
    row.dataset.energyRechargeKW=String(Math.round(vehicle.energyRechargeKW||0));
    row.dataset.energyHarvestLapMJ=(Number(vehicle.energyHarvestLapMJ)||0).toFixed(3);
    row.dataset.boost=vehicle.boostActive?'1':'0';
    row.dataset.boostKW=String(Math.round(vehicle.boostPowerKW||0));
    row.dataset.activeAero=String(vehicle.activeAeroMode||'CORNER');
    row.dataset.activeAeroTarget=String(vehicle.activeAeroTarget||'CORNER');
    row.dataset.overtakeEligible=vehicle.overtakeEligible?'1':'0';
    row.dataset.overtakeActive=vehicle.overtakeActive?'1':'0';
    row.dataset.overtakeGap=Number.isFinite(vehicle.overtakeGapSeconds)?Number(vehicle.overtakeGapSeconds).toFixed(3):'';
    row.dataset.tyreCompound=String(vehicle.tyreCompound||'MEDIUM');
    row.dataset.incident=activeDrivingIncidentV204(vehicle)||'';
    row.dataset.lockups=String(Number(vehicle.lockupCount)||0);
    row.dataset.understeers=String(Number(vehicle.understeerCount)||0);
    row.dataset.oversteers=String(Number(vehicle.oversteerCount)||0);
    row.dataset.pitState=String(vehicle.pitState||'TRACK');
    row.dataset.pitRequested=vehicle.pitRequested?'1':'0';
    row.dataset.pitStops=String(Number(vehicle.pitStopCount)||0);
    row.dataset.tyreWarmup=(Number(vehicle.tyreWarmupFactor)||1).toFixed(3);
    row.dataset.pitStrategy=String(vehicle.strategyDecision||'NONE');
    row.dataset.trafficState=String(vehicle.trafficState||'CLEAR');
    row.dataset.trafficPressure=(Number(vehicle.trafficPressure)||0).toFixed(3);
    row.dataset.trafficClosingKph=(Number(vehicle.trafficClosingRateKph)||0).toFixed(1);
    row.dataset.defence=vehicle.defenceActive?'1':'0';
    row.dataset.battleState=String(vehicle.battleState||'FOLLOWING');
    row.dataset.battleTarget=String(vehicle.battleTargetId||'');
    row.dataset.passCompleted=String(Number(vehicle.passCompletedCount)||0);
    row.dataset.pitStrategyReason=String(vehicle.strategyReason||'');
    row.dataset.pitStrategyScore=(Number(vehicle.strategyScore)||0).toFixed(3);
    row.dataset.pitStrategyTarget=String(vehicle.strategyTargetCompound||vehicle.tyreCompound||'MEDIUM');
    row.dataset.tyreWear=(Number(vehicle.tyreWear)||0).toFixed(3);
    row.dataset.tyreSurface=(Number(vehicle.tyreSurfaceTemp)||0).toFixed(3);
    row.dataset.tyreCarcass=(Number(vehicle.tyreCarcassTemp)||0).toFixed(3);
    row.dataset.tyreGrip=(Number(vehicle.tyreGrip)||1).toFixed(3);
    row.dataset.tyreStrategy=(Number(vehicle.tyreStrategyPressure)||0).toFixed(3);
    const tyre=row.querySelector('.tyre');if(tyre)tyre.textContent=tyreCompoundSpecV203(vehicle.tyreCompound).code;
  }
  updateRaceStandingsV191();
  return true;
}
function computeRaceStandingsV191(){
  const sorted=[...raceMotionV189.vehicles].sort(function(a,b){
    const delta=Number(b.raceProgress||0)-Number(a.raceProgress||0);
    if(Math.abs(delta)>1e-9)return delta;
    return Number(a.driver?.gridPosition||999)-Number(b.driver?.gridPosition||999);
  });
  const leader=sorted[0]||null;
  return sorted.map(function(vehicle,index){
    const previous=index>0?sorted[index-1]:null;
    const gapProgress=leader?Math.max(0,Number(leader.raceProgress)-Number(vehicle.raceProgress)):0;
    const intervalProgress=previous?Math.max(0,Number(previous.raceProgress)-Number(vehicle.raceProgress)):0;
    const leaderLapMs=Math.max(1,Number(leader?.lapDurationMs)||1);
    const previousLapMs=Math.max(1,Number(previous?.lapDurationMs)||leaderLapMs);
    return {
      vehicle,
      position:index+1,
      gapProgress,
      intervalProgress,
      gapSeconds:index===0?0:gapProgress*leaderLapMs/1000,
      intervalSeconds:index===0?0:intervalProgress*previousLapMs/1000
    };
  });
}
function formatRaceDeltaV191(progress,seconds,isLeader=false){
  if(isLeader)return 'LEADER';
  const laps=Math.floor(Math.max(0,Number(progress)||0));
  if(laps>=1)return '+'+laps+' LAP'+(laps===1?'':'S');
  return '+'+Math.max(0,Number(seconds)||0).toFixed(3);
}
function applyLiveTimingFlipV212(standings){
  const list=document.getElementById('f1RacingTimingListV188');
  if(!list||!Array.isArray(standings)||!standings.length)return {moved:0,order:[]};
  const before=new Map();
  for(const row of Array.from(list.querySelectorAll('[data-f1-driver-id]'))){
    const rect=row.getBoundingClientRect();
    before.set(String(row.dataset.f1DriverId),rect.top);
  }
  let moved=0;
  for(const standing of standings){
    const row=findTimingRowV190(standing.vehicle.id);
    if(row)list.appendChild(row);
  }
  for(const standing of standings){
    const row=findTimingRowV190(standing.vehicle.id);if(!row)continue;
    const previousTop=before.get(String(row.dataset.f1DriverId));
    const nextTop=row.getBoundingClientRect().top;
    const delta=Number.isFinite(previousTop)?previousTop-nextTop:0;
    row.dataset.flipDelta=String(Math.round(delta));
    if(Math.abs(delta)>.5){
      moved+=1;
      if(typeof row.animate==='function')row.animate(
        [{transform:'translateY('+delta+'px)'},{transform:'translateY(0px)'}],
        {duration:320,easing:'cubic-bezier(.2,.8,.2,1)'}
      );
    }
  }
  return {moved,order:standings.map(row=>String(row.vehicle.id))};
}
function ensureTopThreeStylesV213(){
  if(document.getElementById('f1RacingTopThreeStylesV213'))return true;
  const style=document.createElement('style');
  style.id='f1RacingTopThreeStylesV213';
  style.textContent=[
    '.f1-racing-timing-row-v188[data-top-three="p1"]{box-shadow:inset 4px 0 0 #ffd54a,0 0 0 1px rgba(255,213,74,.35);background:linear-gradient(90deg,rgba(255,213,74,.16),rgba(255,213,74,.025));}',
    '.f1-racing-timing-row-v188[data-top-three="p2"]{box-shadow:inset 4px 0 0 #c7d2df,0 0 0 1px rgba(199,210,223,.28);background:linear-gradient(90deg,rgba(199,210,223,.13),rgba(199,210,223,.02));}',
    '.f1-racing-timing-row-v188[data-top-three="p3"]{box-shadow:inset 4px 0 0 #c98b5a,0 0 0 1px rgba(201,139,90,.28);background:linear-gradient(90deg,rgba(201,139,90,.13),rgba(201,139,90,.02));}',
    '.f1-racing-timing-row-v188[data-top-three] .pos{font-size:1.08em;letter-spacing:.04em;}',
    '.f1-racing-timing-row-v188[data-top-three="p1"] .driver b{font-size:1.05em;}'
  ].join('');
  document.head.appendChild(style);
  return true;
}
function applyTopThreePresentationV213(standings){
  ensureTopThreeStylesV213();
  const rows=document.querySelectorAll('#f1RacingTimingListV188 [data-f1-driver-id]');
  rows.forEach(row=>{delete row.dataset.topThree;delete row.dataset.topThreeLabel;});
  for(const standing of standings||[]){
    const row=findTimingRowV190(standing.vehicle.id);if(!row)continue;
    if(standing.position<=3){
      row.dataset.topThree='p'+standing.position;
      row.dataset.topThreeLabel=standing.position===1?'LEADER':standing.position===2?'P2':'P3';
    }
  }
  return Array.from(rows).filter(row=>row.dataset.topThree).map(row=>({id:row.dataset.f1DriverId,rank:row.dataset.topThree}));
}
function qaTopThreePresentationV213(){
  ensureTopThreeStylesV213();
  const standings=computeRaceStandingsV191();
  const applied=applyTopThreePresentationV213(standings);
  return {standings:standings.length,applied,styleReady:Boolean(document.getElementById('f1RacingTopThreeStylesV213')),allPass:standings.length<3||applied.length===3};
}

function qaLiveTimingFlipV212(){
  const standings=computeRaceStandingsV191();
  const list=document.getElementById('f1RacingTimingListV188');
  return {
    standings:standings.length,
    domRows:list?list.querySelectorAll('[data-f1-driver-id]').length:0,
    functionReady:typeof applyLiveTimingFlipV212==='function',
    allPass:typeof applyLiveTimingFlipV212==='function'&&(!list||list.querySelectorAll('[data-f1-driver-id]').length===standings.length)
  };
}
function updateRaceStandingsV191(){
  const standings=computeRaceStandingsV191();
  for(const standing of standings){
    const vehicle=standing.vehicle;
    vehicle.position=standing.position;
    vehicle.gapProgress=standing.gapProgress;
    vehicle.intervalProgress=standing.intervalProgress;
    vehicle.gapSeconds=standing.gapSeconds;
    vehicle.intervalSeconds=standing.intervalSeconds;
    const row=findTimingRowV190(vehicle.id);if(!row)continue;
    row.dataset.position=String(standing.position);
    const pos=row.querySelector('.pos');if(pos)pos.textContent='P'+String(standing.position).padStart(2,'0');
    const gap=row.querySelector('[data-f1-gap]');if(gap)gap.textContent=formatRaceDeltaV191(standing.gapProgress,standing.gapSeconds,standing.position===1);
    const interval=row.querySelector('[data-f1-interval]');if(interval)interval.textContent=standing.position===1?'--':formatRaceDeltaV191(standing.intervalProgress,standing.intervalSeconds,false);
    row.classList.remove('podium','p1','p2','p3');
    if(standing.position<=3)row.classList.add('podium','p'+standing.position);
    if(vehicle.marker)vehicle.marker.classList.toggle('leader',standing.position===1);
  }
  applyTopThreePresentationV213(standings);
  applyLiveTimingFlipV212(standings);
  return standings;
}

function seededDriverUnitV200(state){
  const next=(Math.imul(Number(state)||1,1664525)+1013904223)>>>0;
  return {state:next,value:next/4294967296};
}
function createDriverProfileV200(driver,snapshot){
  let state=hashDriverV189(String(driver?.contactId||driver?.name||'driver')+'|'+String(snapshot?.createdAt||'race')+'|phase200');
  const cfg=DRIVER_PACE_CONFIG_V200;
  const profile={};
  for(const key of DRIVER_PROFILE_KEYS_V200){
    const draw=seededDriverUnitV200(state);state=draw.state;
    profile[key]=Math.round(cfg.ratingMin+draw.value*(cfg.ratingMax-cfg.ratingMin));
  }
  return Object.freeze(profile);
}
function driverSkillNormV200(vehicle,key){
  const rating=Number(vehicle?.driverProfile?.[key]);
  if(!Number.isFinite(rating))return 0;
  const mid=(DRIVER_PACE_CONFIG_V200.ratingMin+DRIVER_PACE_CONFIG_V200.ratingMax)/2;
  const half=Math.max(1,(DRIVER_PACE_CONFIG_V200.ratingMax-DRIVER_PACE_CONFIG_V200.ratingMin)/2);
  return Math.max(-1,Math.min(1,(rating-mid)/half));
}
function nextDriverRandomV200(vehicle){
  const draw=seededDriverUnitV200(vehicle?.driverRandomState||1);
  vehicle.driverRandomState=draw.state;
  return draw.value;
}
function updateDriverPaceStateV200(vehicle,stepMs){
  if(!vehicle||!(stepMs>0))return 0;
  const dt=stepMs/1000;
  const consistency=Math.max(0,Math.min(1,(Number(vehicle.driverProfile?.consistency)||75)/100));
  const errorResistance=Math.max(0,Math.min(1,(Number(vehicle.driverProfile?.errorResistance)||75)/100));
  const reversion=0.45+consistency*0.85;
  vehicle.paceNoise=(Number(vehicle.paceNoise)||0)*Math.max(0,1-reversion*dt);
  vehicle.nextPaceNoiseMs=Math.max(0,(Number(vehicle.nextPaceNoiseMs)||0)-stepMs);
  if(vehicle.nextPaceNoiseMs<=0){
    const shock=nextDriverRandomV200(vehicle)*2-1;
    const volatility=DRIVER_PACE_CONFIG_V200.noiseBase+(1-consistency)*DRIVER_PACE_CONFIG_V200.noiseRange;
    const resistance=1.08-errorResistance*.08;
    vehicle.paceNoise+=shock*volatility*resistance;
    vehicle.nextPaceNoiseMs=DRIVER_PACE_CONFIG_V200.noiseSampleMs;
  }
  const clamp=DRIVER_PACE_CONFIG_V200.noiseClamp*(1.08-errorResistance*.08);
  vehicle.paceNoise=Math.max(-clamp,Math.min(clamp,vehicle.paceNoise));
  return vehicle.paceNoise;
}
function driverTargetMultiplierV200(vehicle,phase){
  const cfg=DRIVER_PACE_CONFIG_V200;
  let multiplier=1+driverSkillNormV200(vehicle,'pace')*cfg.paceRange+(Number(vehicle?.paceNoise)||0);
  if(phase==='BRAKING')multiplier*=1+driverSkillNormV200(vehicle,'braking')*cfg.brakingRange;
  if(phase==='TURN_IN'||phase==='APEX'||phase==='EXIT')multiplier*=1+driverSkillNormV200(vehicle,'cornering')*cfg.corneringRange;
  return Math.max(.965,Math.min(1.035,multiplier));
}
function getDriverProfilesV200(){
  return raceMotionV189.vehicles.map(vehicle=>({id:vehicle.id,name:vehicle.driver?.name||'',profile:{...(vehicle.driverProfile||{})},paceNoise:Number(vehicle.paceNoise)||0}));
}

function fieldMeanPaceNormV209(vehicles=raceMotionV189.vehicles){
  const active=(vehicles||[]).filter(vehicle=>vehicle&&!vehicle.finished);
  if(!active.length)return 0;
  return active.reduce((sum,vehicle)=>sum+driverSkillNormV200(vehicle,'pace'),0)/active.length;
}
function longRunPaceBiasV209(vehicle,lapAge=Math.max(0,Number(vehicle?.raceProgress)||0),vehicles=raceMotionV189.vehicles){
  const cfg=LONG_RUN_GAP_CONFIG_V209;
  const rawNorm=driverSkillNormV200(vehicle,'pace');
  const fieldCenter=fieldMeanPaceNormV209(vehicles);
  const relativeNorm=Math.max(-1,Math.min(1,rawNorm-fieldCenter));
  const rawBias=rawNorm*DRIVER_PACE_CONFIG_V200.paceRange;
  const centerBias=fieldCenter*DRIVER_PACE_CONFIG_V200.paceRange;
  const openingBias=Math.max(-cfg.maxOpeningPaceBias,Math.min(cfg.maxOpeningPaceBias,rawBias-centerBias));
  const settledBias=Math.tanh(relativeNorm*cfg.relativeShape)*cfg.maxSettledPaceBias;
  const settle=clamp01V198(Math.max(0,Number(lapAge)||0)/cfg.settlingLaps);
  return openingBias+(settledBias-openingBias)*settle;
}
function longRunPaceCorrectionV209(vehicle,lapAge=Math.max(0,Number(vehicle?.raceProgress)||0),vehicles=raceMotionV189.vehicles){
  const rawBias=driverSkillNormV200(vehicle,'pace')*DRIVER_PACE_CONFIG_V200.paceRange;
  const desiredBias=longRunPaceBiasV209(vehicle,lapAge,vehicles);
  const correction=(1+desiredBias)/Math.max(.98,1+rawBias);
  return Math.max(.985,Math.min(1.015,correction));
}
function getLongRunBalanceStatesV209(){
  return raceMotionV189.vehicles.map(vehicle=>({
    id:vehicle.id,name:vehicle.driver?.name||'',rawDriverPaceMultiplier:Number(vehicle.rawDriverPaceMultiplier)||1,
    longRunPaceMultiplier:Number(vehicle.longRunPaceMultiplier)||1,longRunPaceBias:Number(vehicle.longRunPaceBias)||0,
    raceProgress:Number(vehicle.raceProgress)||0,trafficState:String(vehicle.trafficState||'CLEAR'),pitState:String(vehicle.pitState||'TRACK'),
    tyreGrip:Number(vehicle.tyreGrip)||1,battleState:String(vehicle.battleState||'FOLLOWING')
  }));
}
function qaLongRunGapBalanceV209(){
  const cfg=LONG_RUN_GAP_CONFIG_V209;
  const ratings=[55,65,75,85,95];
  const synthetic=ratings.map((pace,index)=>({id:'qa'+index,finished:false,driverProfile:{pace,consistency:75,racecraft:75},raceProgress:0}));
  const opening=synthetic.map(vehicle=>longRunPaceBiasV209(vehicle,0,synthetic));
  const settled=synthetic.map(vehicle=>longRunPaceBiasV209(vehicle,20,synthetic));
  const spread=list=>Math.max(...list)-Math.min(...list);
  const totalTimes=synthetic.map(vehicle=>{
    let seconds=0;
    for(let lap=0;lap<cfg.qaLaps;lap++){
      const bias=longRunPaceBiasV209(vehicle,lap,synthetic);
      seconds+=cfg.qaLapSeconds/Math.max(.98,1+bias);
    }
    return seconds;
  });
  const paceOnlyThirtyLapSpreadSeconds=Math.max(...totalTimes)-Math.min(...totalTimes);
  const systemsConnected=typeof updateSlipstreamStatesV198==='function'&&typeof updateDirtyAirStatesV199==='function'&&typeof updateTrafficAndDefenceV207==='function'&&typeof updatePassStateMachineV208==='function'&&typeof updatePitStrategiesV206==='function'&&typeof updateTyreSystemV203==='function';
  return {
    vehicleCount:synthetic.length,openingBiasSpread:spread(opening),settledBiasSpread:spread(settled),
    paceOnlyThirtyLapSpreadSeconds,nonUniform:spread(settled)>.0001,gapDependency:false,systemsConnected
  };
}
function qaMultiTrackIntegrationV210(){
  const originalTrackId=activeTrackId;
  const catalog=getTrackCatalogV186();
  const tracks=[];
  try{
    for(const item of catalog){
      const track=window.mwsGetF1TrackV182?.(item.id);
      const validation=typeof window.mwsValidateF1TrackV182==='function'?window.mwsValidateF1TrackV182(track):['validator missing'];
      activeTrackId=String(item.id);
      const snapshot=buildRaceSnapshotV187();
      const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
      const path=document.createElementNS('http://www.w3.org/2000/svg','path');
      svg.setAttribute('viewBox',(track?.viewBox||[0,0,1000,600]).join(' '));
      path.setAttribute('d',String(track?.path||''));
      svg.style.cssText='position:fixed;left:-10000px;top:-10000px;width:1000px;height:600px;visibility:hidden';
      svg.appendChild(path);document.body.appendChild(svg);
      let geometry=null,cornered=null,profiled=null;
      try{
        geometry=window.mwsBuildF1TrackGeometryV193?.(track,path)||null;
        cornered=geometry&&window.mwsBuildF1CornerPhasesV194?.(track,geometry)||null;
        profiled=cornered&&window.mwsBuildF1SpeedProfileV195?.(track,cornered)||null;
      }finally{svg.remove()}
      const snapshotReady=Boolean(snapshot&&snapshot.trackId===item.id&&snapshot.track?.path===track?.path&&snapshot.track?.lengthMeters===track?.lengthMeters);
      const geometryReady=Boolean(geometry?.samples?.length&&cornered?.cornerPhases?.length&&profiled?.speedProfile?.length);
      const pitReady=Boolean(snapshot?.track?.pit&&Number(snapshot.track.pit.speedLimitKph)>0);
      const overtakeReady=Boolean(snapshot?.track?.overtakeZones?.length);
      const renderingReady=Boolean(snapshot?.track?.viewBox?.length===4&&String(snapshot?.track?.path||'').startsWith('M '));
      const dynamicsReady=Boolean(profiled?.speedProfile?.every(row=>Number(row.targetKph)>0));
      const trafficPassReady=typeof updateTrafficAndDefenceV207==='function'&&typeof updatePassStateMachineV208==='function';
      const pass=validation.length===0&&snapshotReady&&geometryReady&&pitReady&&overtakeReady&&renderingReady&&dynamicsReady&&trafficPassReady;
      tracks.push({id:item.id,name:item.name,validation,snapshotReady,geometryReady,pitReady,overtakeReady,renderingReady,dynamicsReady,trafficPassReady,samples:geometry?.samples?.length||0,corners:cornered?.cornerPhases?.length||0,pass});
    }
  }finally{activeTrackId=originalTrackId}
  return {trackCount:tracks.length,ids:tracks.map(row=>row.id),tracks,allPass:tracks.length===3&&tracks.every(row=>row.pass)};
}



function trackZoneAtProgressV202(progress){
  const track=activeRaceSnapshotV187?.track;
  const p=normalizedProgressV190(progress);
  return (track?.zones||[]).find(zone=>p>=Number(zone.start)&&p<Number(zone.end))||null;
}
function overtakeZoneAtProgressV202(progress){
  const track=activeRaceSnapshotV187?.track;
  const p=normalizedProgressV190(progress);
  return (track?.overtakeZones||[]).find(zone=>p>=Number(zone.start)&&p<Number(zone.end))||null;
}
function ersOvertakePowerLimitV202(speedKph){
  const speed=Math.max(0,Number(speedKph)||0);
  if(speed>=ACTIVE_AERO_CONFIG_V202.overtakeCutoffKph)return 0;
  return Math.max(0,Math.min(ENERGY_CONFIG_V201.maxDeployPowerKW,7100-20*speed));
}
function estimatedGapSecondsV202(vehicle){
  const gap=Math.max(0,Number(vehicle?.gapToCarAheadMeters));
  if(!Number.isFinite(gap))return Infinity;
  const ahead=raceMotionV189.vehicles.find(v=>String(v.id)===String(vehicle?.carAheadId||''))||null;
  const meanKph=Math.max(1,((Number(vehicle?.speedKph)||0)+(Number(ahead?.speedKph)||Number(vehicle?.speedKph)||0))/2);
  return gap/(meanKph/3.6);
}
function updateActiveAeroAndOvertakeV202(vehicle,stepMs){
  if(!vehicle)return null;
  const cfg=ACTIVE_AERO_CONFIG_V202;
  const zone=trackZoneAtProgressV202(vehicle.progress);
  const requestedMode=zone?.type==='straight'?'STRAIGHT':'CORNER';
  if(vehicle.activeAeroTarget!==requestedMode){
    vehicle.activeAeroTarget=requestedMode;
    vehicle.activeAeroTransitionMs=cfg.transitionMs;
  }
  vehicle.activeAeroTransitionMs=Math.max(0,(Number(vehicle.activeAeroTransitionMs)||0)-Math.max(0,Number(stepMs)||0));
  if(vehicle.activeAeroTransitionMs<=0)vehicle.activeAeroMode=requestedMode;

  const overtakeZone=overtakeZoneAtProgressV202(vehicle.progress);
  const gapSeconds=estimatedGapSecondsV202(vehicle);
  const eligible=Boolean(overtakeZone&&vehicle.carAheadId&&gapSeconds<=cfg.detectionGapSeconds);
  vehicle.overtakeZoneId=overtakeZone?.id||'';
  vehicle.overtakeGapSeconds=gapSeconds;
  vehicle.overtakeEligible=eligible;
  vehicle.overtakeActive=eligible;
  if(eligible)vehicle.overtakeRechargeAllowanceActive=true;
  return {activeAeroMode:vehicle.activeAeroMode,activeAeroTarget:vehicle.activeAeroTarget,transitionMs:vehicle.activeAeroTransitionMs,overtakeZoneId:vehicle.overtakeZoneId,gapSeconds,eligible,overtakeActive:vehicle.overtakeActive};
}
function getActiveAeroOvertakeStatesV202(){
  return raceMotionV189.vehicles.map(vehicle=>({
    id:vehicle.id,name:vehicle.driver?.name||'',activeAeroMode:vehicle.activeAeroMode,
    activeAeroTarget:vehicle.activeAeroTarget,activeAeroTransitionMs:Number(vehicle.activeAeroTransitionMs)||0,
    overtakeZoneId:vehicle.overtakeZoneId||'',overtakeGapSeconds:Number(vehicle.overtakeGapSeconds),
    overtakeEligible:Boolean(vehicle.overtakeEligible),overtakeActive:Boolean(vehicle.overtakeActive),
    overtakeRechargeAllowanceActive:Boolean(vehicle.overtakeRechargeAllowanceActive)
  }));
}

function ersNormalPowerLimitV201(speedKph){
  const speed=Math.max(0,Number(speedKph)||0);
  const cfg=ENERGY_CONFIG_V201;
  if(speed<cfg.minStandingDeployKph)return 0;
  if(speed<290)return cfg.maxDeployPowerKW;
  if(speed<340)return Math.max(0,Math.min(cfg.maxDeployPowerKW,1800-5*speed));
  if(speed<345)return Math.max(0,Math.min(cfg.maxDeployPowerKW,6900-20*speed));
  return 0;
}
function trailingThreatScoreV201(vehicle,vehicles=raceMotionV189.vehicles){
  let score=0;
  for(const candidate of vehicles||[]){
    if(!candidate||candidate===vehicle)continue;
    if(String(candidate.carAheadId||'')!==String(vehicle.id||''))continue;
    score=Math.max(score,clamp01V198(candidate.slipstreamStrength));
  }
  return score;
}
function syncEnergyLapV201(vehicle){
  const lap=Math.max(1,Number(vehicle?.currentLap)||1);
  if(Number(vehicle.energyLapNumber)!==lap){
    vehicle.energyLapNumber=lap;
    vehicle.energyHarvestLapMJ=0;
  }
  return lap;
}
function updateEnergySystemV201(vehicle,stepMs,phase,throttle,brake){
  const cfg=ENERGY_CONFIG_V201;
  const dt=Math.max(0,Number(stepMs)||0)/1000;
  if(!vehicle||!(dt>0))return {deployKW:0,rechargeKW:0,boostKW:0,powerUnitFactor:1};
  syncEnergyLapV201(vehicle);
  vehicle.energyTargetMJ=cfg.usableCapacityMJ;
  let battery=Math.max(0,Math.min(cfg.usableCapacityMJ,Number(vehicle.batteryMJ)||0));
  let rechargeKW=0;
  let harvestedMJ=0;
  if(Number(brake)>0){
    const rechargeLimit=cfg.maxRechargePerLapMJ+(vehicle.overtakeRechargeAllowanceActive?ACTIVE_AERO_CONFIG_V202.extraRechargeMJ:0);
    const lapRoom=Math.max(0,rechargeLimit-(Number(vehicle.energyHarvestLapMJ)||0));
    const storeRoom=Math.max(0,cfg.usableCapacityMJ-battery);
    const requestedKW=cfg.maxHarvestPowerKW*clamp01V198(brake);
    const requestedMJ=requestedKW*dt/1000;
    harvestedMJ=Math.min(requestedMJ,lapRoom,storeRoom);
    rechargeKW=dt>0?harvestedMJ*1000/dt:0;
    battery+=harvestedMJ;
  }

  const normalLimitKW=Number(brake)>0?0:ersNormalPowerLimitV201(vehicle.speedKph);
  const overtakeLimitKW=vehicle.overtakeActive?ersOvertakePowerLimitV202(vehicle.speedKph):normalLimitKW;
  const deployLimitKW=Math.max(normalLimitKW,overtakeLimitKW);
  const attackOpportunityScore=clamp01V198(vehicle.slipstreamStrength);
  const defenceThreatScore=trailingThreatScoreV201(vehicle);
  let boostKW=vehicle.overtakeActive?Math.max(0,deployLimitKW-normalLimitKW):0;
  let requestedDeployKW=Number(throttle)>0?Math.min(cfg.maxDeployPowerKW,deployLimitKW):0;
  const availableDeployKW=dt>0?battery*1000/dt:0;
  const deployKW=Math.max(0,Math.min(requestedDeployKW,availableDeployKW));
  if(requestedDeployKW>0&&deployKW<requestedDeployKW){
    const ratio=deployKW/requestedDeployKW;
    boostKW*=ratio;
  }
  const deployedMJ=deployKW*dt/1000;
  const boostEnergyMJ=boostKW*dt/1000;
  battery=Math.max(0,battery-deployedMJ);

  vehicle.batteryMJ=battery;
  vehicle.energyDeployKW=deployKW;
  vehicle.energyRechargeKW=rechargeKW;
  vehicle.boostPowerKW=boostKW;
  vehicle.boostActive=boostKW>0.01;
  vehicle.attackOpportunityScore=attackOpportunityScore;
  vehicle.defenceThreatScore=defenceThreatScore;
  vehicle.energyDeployMJ=(Number(vehicle.energyDeployMJ)||0)+deployedMJ;
  vehicle.energyHarvestMJ=(Number(vehicle.energyHarvestMJ)||0)+harvestedMJ;
  vehicle.energyHarvestLapMJ=(Number(vehicle.energyHarvestLapMJ)||0)+harvestedMJ;
  vehicle.boostEnergyMJ=(Number(vehicle.boostEnergyMJ)||0)+boostEnergyMJ;
  const fullPowerKW=cfg.icePowerKW+cfg.maxDeployPowerKW;
  const powerUnitFactor=Math.max(.4,Math.min(1,(cfg.icePowerKW+deployKW)/fullPowerKW));
  vehicle.powerUnitFactor=powerUnitFactor;
  return {deployKW,rechargeKW,boostKW,powerUnitFactor,batteryMJ:battery,harvestedMJ,deployedMJ,boostEnergyMJ,attackOpportunityScore,defenceThreatScore};
}
function getEnergyStatesV201(){
  return raceMotionV189.vehicles.map(vehicle=>({
    id:vehicle.id,name:vehicle.driver?.name||'',batteryMJ:Number(vehicle.batteryMJ)||0,
    energyTargetMJ:Number(vehicle.energyTargetMJ)||0,energyDeployKW:Number(vehicle.energyDeployKW)||0,
    energyRechargeKW:Number(vehicle.energyRechargeKW)||0,energyDeployMJ:Number(vehicle.energyDeployMJ)||0,
    energyHarvestMJ:Number(vehicle.energyHarvestMJ)||0,energyHarvestLapMJ:Number(vehicle.energyHarvestLapMJ)||0,
    boostActive:Boolean(vehicle.boostActive),boostPowerKW:Number(vehicle.boostPowerKW)||0,
    boostEnergyMJ:Number(vehicle.boostEnergyMJ)||0,attackOpportunityScore:Number(vehicle.attackOpportunityScore)||0,
    defenceThreatScore:Number(vehicle.defenceThreatScore)||0,powerUnitFactor:Number(vehicle.powerUnitFactor)||1
  }));
}


function tyreCompoundSpecV203(compound){
  const key=String(compound||'MEDIUM').toUpperCase();
  return TYRE_COMPOUNDS_V203[key]||TYRE_COMPOUNDS_V203.MEDIUM;
}
function tyreCornerLoadV203(phase){
  if(phase==='TURN_IN'||phase==='APEX')return 1;
  if(phase==='EXIT')return .75;
  if(phase==='BRAKING')return .55;
  if(phase==='APPROACH')return .25;
  return .08;
}
function setVehicleTyreCompoundV203(driverId,compound){
  const key=String(compound||'').toUpperCase();
  if(!TYRE_COMPOUNDS_V203[key])return false;
  const vehicle=raceMotionV189.vehicles.find(v=>String(v.id)===String(driverId));
  if(!vehicle)return false;
  vehicle.tyreCompound=key;
  vehicle.tyreStartRaceProgress=Number(vehicle.raceProgress)||0;
  vehicle.tyreAgeLaps=0;
  vehicle.tyreWear=0;
  vehicle.tyreSurfaceTemp=.5;
  vehicle.tyreCarcassTemp=.5;
  vehicle.tyreGrip=tyreCompoundSpecV203(key).gripBias;
  vehicle.tyreThermalDeg=0;
  vehicle.tyreGraining=0;
  vehicle.tyreFlatSpot=0;
  vehicle.tyreStrategyPressure=0;
  return true;
}
function updateTyreSystemV203(vehicle,stepMs,phase){
  if(!vehicle||!(stepMs>0))return null;
  const dt=stepMs/1000;
  const spec=tyreCompoundSpecV203(vehicle.tyreCompound);
  const track=activeRaceSnapshotV187?.track;
  const speedKph=Math.max(0,Number(vehicle.speedKph)||0);
  const speedMps=speedKph/3.6;
  const lapFraction=(speedMps*dt)/Math.max(1,Number(track?.lengthMeters)||1);
  const managementNorm=driverSkillNormV200(vehicle,'tyreManagement');
  const managementWearFactor=Math.max(.85,Math.min(1.15,1-managementNorm*.12));
  const cornerLoad=tyreCornerLoadV203(phase);
  const brakeLoad=clamp01V198(vehicle.brake);
  const throttleLoad=clamp01V198(vehicle.throttle);
  const dirtyHeat=clamp01V198(vehicle.dirtyAirTyreHeatLoad);

  let surface=Math.max(0,Math.min(1,Number(vehicle.tyreSurfaceTemp)||.5));
  let carcass=Math.max(0,Math.min(1,Number(vehicle.tyreCarcassTemp)||.5));
  const heatInput=(brakeLoad*.34+throttleLoad*.13+cornerLoad*.22+dirtyHeat*.18)*spec.heatFactor;
  surface+=heatInput*dt*.18;
  surface+=(TYRE_CONFIG_V203.ambientSurface-surface)*dt*.035;
  surface=Math.max(0,Math.min(1,surface));
  carcass+=(surface-carcass)*dt*.075;
  carcass+=(TYRE_CONFIG_V203.ambientCarcass-carcass)*dt*.012;
  carcass=Math.max(0,Math.min(1,carcass));

  const tempError=Math.abs(surface-spec.idealSurface);
  const thermalStress=Math.max(0,tempError-.10);
  const thermalDegGain=thermalStress*lapFraction*3.2*managementWearFactor;
  const coldStress=Math.max(0,(spec.idealSurface-.12)-surface);
  const grainingGain=coldStress*cornerLoad*lapFraction*2.4*managementWearFactor;
  const flatSpotGain=(Number(vehicle.lockupActiveMs)||0)>0?clamp01V198(vehicle.lockupSeverity)*lapFraction*1.6:0;
  const wearGain=spec.wearPerLap*lapFraction*managementWearFactor*(1+thermalStress*.8+dirtyHeat*.18);

  vehicle.tyreWear=Math.max(0,Math.min(1,(Number(vehicle.tyreWear)||0)+wearGain));
  vehicle.tyreThermalDeg=Math.max(0,Math.min(1,(Number(vehicle.tyreThermalDeg)||0)+thermalDegGain));
  vehicle.tyreGraining=Math.max(0,Math.min(1,(Number(vehicle.tyreGraining)||0)+grainingGain));
  vehicle.tyreFlatSpot=Math.max(0,Math.min(1,(Number(vehicle.tyreFlatSpot)||0)+flatSpotGain));
  vehicle.tyreSurfaceTemp=surface;
  vehicle.tyreCarcassTemp=carcass;
  vehicle.tyreAgeLaps=Math.max(0,(Number(vehicle.raceProgress)||0)-(Number(vehicle.tyreStartRaceProgress)||0));

  const tempGrip=Math.max(.88,1-tempError*.42);
  const wearGrip=Math.max(.84,1-vehicle.tyreWear*.15);
  const damageGrip=Math.max(.88,1-vehicle.tyreThermalDeg*.06-vehicle.tyreGraining*.05-vehicle.tyreFlatSpot*.10);
  const warmupFactor=Math.max(PIT_CONFIG_V205.minWarmupGrip,Math.min(1,Number(vehicle.tyreWarmupFactor)||1));
  vehicle.tyreGrip=Math.max(TYRE_CONFIG_V203.minGrip,Math.min(TYRE_CONFIG_V203.maxGrip,spec.gripBias*tempGrip*wearGrip*damageGrip*warmupFactor));
  vehicle.tyreStrategyPressure=clamp01V198(vehicle.tyreWear*.55+vehicle.tyreThermalDeg*.20+vehicle.tyreGraining*.15+vehicle.tyreFlatSpot*.35);
  return {compound:vehicle.tyreCompound,ageLaps:vehicle.tyreAgeLaps,wear:vehicle.tyreWear,surfaceTemp:surface,carcassTemp:carcass,grip:vehicle.tyreGrip,thermalDeg:vehicle.tyreThermalDeg,graining:vehicle.tyreGraining,flatSpot:vehicle.tyreFlatSpot,strategyPressure:vehicle.tyreStrategyPressure};
}
function getTyreStatesV203(){
  return raceMotionV189.vehicles.map(vehicle=>({
    id:vehicle.id,name:vehicle.driver?.name||'',compound:vehicle.tyreCompound,
    ageLaps:Number(vehicle.tyreAgeLaps)||0,wear:Number(vehicle.tyreWear)||0,
    surfaceTemp:Number(vehicle.tyreSurfaceTemp)||0,carcassTemp:Number(vehicle.tyreCarcassTemp)||0,
    grip:Number(vehicle.tyreGrip)||1,thermalDeg:Number(vehicle.tyreThermalDeg)||0,
    graining:Number(vehicle.tyreGraining)||0,flatSpot:Number(vehicle.tyreFlatSpot)||0,
    strategyPressure:Number(vehicle.tyreStrategyPressure)||0
  }));
}

function activeDrivingIncidentV204(vehicle){
  if((Number(vehicle?.lockupActiveMs)||0)>0)return 'LOCK_UP';
  if((Number(vehicle?.understeerActiveMs)||0)>0)return 'UNDERSTEER';
  if((Number(vehicle?.oversteerActiveMs)||0)>0)return 'OVERSTEER';
  return '';
}
function triggerDrivingIncidentV204(vehicle,type,severity=.7,forced=false){
  if(!vehicle)return null;
  const key=String(type||'').toUpperCase();
  const s=Math.max(.15,Math.min(1,Number(severity)||.7));
  if(key==='LOCK_UP'){
    vehicle.lockupActiveMs=Math.max(Number(vehicle.lockupActiveMs)||0,INCIDENT_CONFIG_V204.lockupDurationMs*(.72+s*.38));
    vehicle.lockupSeverity=s;
    vehicle.tyreFlatSpot=Math.max(0,Math.min(1,(Number(vehicle.tyreFlatSpot)||0)+.012+s*.028));
    vehicle.lockupCount=(Number(vehicle.lockupCount)||0)+1;
  }else if(key==='UNDERSTEER'){
    vehicle.understeerActiveMs=Math.max(Number(vehicle.understeerActiveMs)||0,INCIDENT_CONFIG_V204.understeerDurationMs*(.72+s*.38));
    vehicle.understeerIncidentSeverity=s;
    vehicle.understeerCount=(Number(vehicle.understeerCount)||0)+1;
  }else if(key==='OVERSTEER'){
    vehicle.oversteerActiveMs=Math.max(Number(vehicle.oversteerActiveMs)||0,INCIDENT_CONFIG_V204.oversteerDurationMs*(.72+s*.38));
    vehicle.oversteerIncidentSeverity=s;
    vehicle.oversteerCount=(Number(vehicle.oversteerCount)||0)+1;
  }else return null;
  vehicle.lastIncidentType=key;
  vehicle.lastIncidentSimMs=simClockV192.simTimeMs;
  vehicle.lastIncidentForced=Boolean(forced);
  return {type:key,severity:s,forced:Boolean(forced)};
}
function updateDrivingIncidentsV204(vehicle,stepMs,phase,controls={}){
  if(!vehicle||!(stepMs>0))return {active:'',speedFactor:1,brakeFactor:1,throttleFactor:1,lateralOffsetMeters:0};
  vehicle.lockupActiveMs=Math.max(0,(Number(vehicle.lockupActiveMs)||0)-stepMs);
  vehicle.understeerActiveMs=Math.max(0,(Number(vehicle.understeerActiveMs)||0)-stepMs);
  vehicle.oversteerActiveMs=Math.max(0,(Number(vehicle.oversteerActiveMs)||0)-stepMs);
  vehicle.incidentEvalMs=Math.max(0,(Number(vehicle.incidentEvalMs)||0)-stepMs);
  if(vehicle.incidentEvalMs<=0&&!activeDrivingIncidentV204(vehicle)){
    vehicle.incidentEvalMs=INCIDENT_CONFIG_V204.evaluationMs;
    const errorResistance=Math.max(0,Math.min(1,(Number(vehicle.driverProfile?.errorResistance)||75)/100));
    const aggression=Math.max(0,Math.min(1,(Number(vehicle.driverProfile?.aggression)||75)/100));
    const tyreGrip=Math.max(TYRE_CONFIG_V203.minGrip,Math.min(TYRE_CONFIG_V203.maxGrip,Number(vehicle.tyreGrip)||1));
    const gripLoss=clamp01V198((1-tyreGrip)/.18);
    const evalSeconds=INCIDENT_CONFIG_V204.evaluationMs/1000;
    const brake=clamp01V198(controls.brake);
    const throttle=clamp01V198(controls.throttle);
    const speed=Math.max(0,Number(vehicle.speedKph)||0);
    const lockRisk=phase==='BRAKING'&&brake>.82&&speed>110
      ?clamp01V198((brake-.82)/.18*.55+gripLoss*.25+Math.max(0,driverSkillNormV200(vehicle,'aggression'))*.2):0;
    const underRisk=(phase==='TURN_IN'||phase==='APEX')
      ?clamp01V198((Number(vehicle.understeerRisk)||0)*.6+gripLoss*.3+clamp01V198(vehicle.dirtyAirStrength)*.25):0;
    const overRisk=(phase==='EXIT'||phase==='TURN_IN')
      ?clamp01V198(Math.max(0,throttle-.55)*1.35+gripLoss*.35+aggression*.12):0;
    const resistanceFactor=Math.max(.45,1-errorResistance*.5);
    const candidates=[
      {type:'LOCK_UP',risk:lockRisk,rate:.045},
      {type:'UNDERSTEER',risk:underRisk,rate:.055},
      {type:'OVERSTEER',risk:overRisk,rate:.050}
    ].filter(row=>row.risk>0).sort((a,b)=>b.risk-a.risk);
    if(candidates.length){
      const pick=candidates[0];
      const chance=pick.risk*pick.rate*evalSeconds*resistanceFactor;
      if(nextDriverRandomV200(vehicle)<chance)triggerDrivingIncidentV204(vehicle,pick.type,pick.risk,false);
    }
  }
  const lockSeverity=(Number(vehicle.lockupActiveMs)||0)>0?Math.max(.15,Number(vehicle.lockupSeverity)||.5):0;
  const underSeverity=(Number(vehicle.understeerActiveMs)||0)>0?Math.max(.15,Number(vehicle.understeerIncidentSeverity)||.5):0;
  const overSeverity=(Number(vehicle.oversteerActiveMs)||0)>0?Math.max(.15,Number(vehicle.oversteerIncidentSeverity)||.5):0;
  const phaseInfo=getCornerPhaseAtProgressV194(vehicle.progress);
  const direction=phaseInfo?.corner?.direction==='right'?-1:1;
  const lateralOffsetMeters=-direction*underSeverity*1.15+direction*overSeverity*.48;
  vehicle.incidentLateralOffsetMeters=lateralOffsetMeters;
  const active=activeDrivingIncidentV204(vehicle);
  return {
    active,
    speedFactor:Math.min(1,
      underSeverity?1-(1-INCIDENT_CONFIG_V204.understeerSpeedFactor)*underSeverity:1,
      overSeverity?1-(1-INCIDENT_CONFIG_V204.oversteerSpeedFactor)*overSeverity:1
    ),
    brakeFactor:lockSeverity?1-(1-INCIDENT_CONFIG_V204.lockupBrakeFactor)*lockSeverity:1,
    throttleFactor:overSeverity?1-(1-INCIDENT_CONFIG_V204.oversteerThrottleFactor)*overSeverity:1,
    lateralOffsetMeters
  };
}
function getDrivingIncidentStatesV204(){
  return raceMotionV189.vehicles.map(vehicle=>({
    id:vehicle.id,name:vehicle.driver?.name||'',active:activeDrivingIncidentV204(vehicle),
    lockupActiveMs:Number(vehicle.lockupActiveMs)||0,understeerActiveMs:Number(vehicle.understeerActiveMs)||0,oversteerActiveMs:Number(vehicle.oversteerActiveMs)||0,
    lockupCount:Number(vehicle.lockupCount)||0,understeerCount:Number(vehicle.understeerCount)||0,oversteerCount:Number(vehicle.oversteerCount)||0,
    tyreFlatSpot:Number(vehicle.tyreFlatSpot)||0,lastIncidentType:String(vehicle.lastIncidentType||''),lastIncidentSimMs:Number(vehicle.lastIncidentSimMs)||0
  }));
}
function forceDrivingIncidentV204(driverId,type,severity=.85){
  const key=String(driverId||'');
  const vehicle=raceMotionV189.vehicles.find(v=>String(v.id)===key)||raceMotionV189.vehicles[0];
  return triggerDrivingIncidentV204(vehicle,type,severity,true);
}


function pitDistanceAheadV205(progress,target){
  const p=normalizedProgressV190(progress),t=normalizedProgressV190(target);
  return (t-p+1)%1;
}
function nextAbsoluteProgressV205(raceProgress,target){
  const current=Number(raceProgress)||0;
  let absolute=Math.floor(current)+normalizedProgressV190(target);
  if(absolute<=current+1e-9)absolute+=1;
  return absolute;
}
function passedTrackProgressV205(previousRaceProgress,currentRaceProgress,target){
  const prev=Number(previousRaceProgress)||0,current=Number(currentRaceProgress)||0;
  if(current<=prev)return false;
  const absolute=nextAbsoluteProgressV205(prev,target);
  return absolute>prev&&absolute<=current+1e-9;
}
function pitTrackV205(){return activeRaceSnapshotV187?.track||null}
function pitSpeedLimitV205(){return Math.max(20,Number(pitTrackV205()?.pit?.speedLimitKph)||80)}
function requestPitStopV205(driverId,compound='MEDIUM',reason='REQUEST'){
  const vehicle=raceMotionV189.vehicles.find(v=>String(v.id)===String(driverId||''))||null;
  const nextCompound=String(compound||'MEDIUM').toUpperCase();
  if(!vehicle||!TYRE_COMPOUNDS_V203[nextCompound]||vehicle.finished)return false;
  if(vehicle.pitState&&vehicle.pitState!=='TRACK')return false;
  vehicle.pitRequested=true;
  vehicle.pitTargetCompound=nextCompound;
  vehicle.pitRequestReason=String(reason||'REQUEST');
  vehicle.pitPreviousRacingLineMode=vehicle.racingLineMode==='PIT_LINE'?'IDEAL':String(vehicle.racingLineMode||'IDEAL');
  return true;
}
function cancelPitRequestV205(driverId){
  const vehicle=raceMotionV189.vehicles.find(v=>String(v.id)===String(driverId||''))||null;
  if(!vehicle||vehicle.pitState!=='TRACK')return false;
  vehicle.pitRequested=false;vehicle.pitRequestReason='';
  if(vehicle.racingLineMode==='PIT_LINE')vehicle.racingLineMode=vehicle.pitPreviousRacingLineMode||'IDEAL';
  return true;
}
function pitControlV205(vehicle){
  const limit=pitSpeedLimitV205();
  const state=String(vehicle?.pitState||'TRACK');
  if(state==='PIT_BOX')return {stationary:true,speedCapKph:0,state,limitKph:limit};
  if(state==='PIT_ENTRY'||state==='PIT_LANE')return {stationary:false,speedCapKph:limit,state,limitKph:limit};
  if(state==='PIT_EXIT')return {stationary:false,speedCapKph:Math.max(limit+35,140),state,limitKph:limit};
  return {stationary:false,speedCapKph:Infinity,state:'TRACK',limitKph:limit};
}
function enterPitBoxV205(vehicle){
  if(!vehicle)return false;
  const racecraft=Math.max(-1,Math.min(1,driverSkillNormV200(vehicle,'racecraft')));
  const variation=(nextDriverRandomV200(vehicle)*2-1)*PIT_CONFIG_V205.boxVariationMs;
  vehicle.pitState='PIT_BOX';
  vehicle.pitBoxDurationMs=Math.max(1800,PIT_CONFIG_V205.boxStopMs-racecraft*180+variation);
  vehicle.pitBoxTimerMs=vehicle.pitBoxDurationMs;
  vehicle.speedKph=0;vehicle.targetSpeedKph=0;vehicle.throttle=0;vehicle.brake=1;vehicle.accelerationMps2=0;
  return true;
}
function completePitServiceV205(vehicle){
  if(!vehicle)return false;
  const compound=TYRE_COMPOUNDS_V203[String(vehicle.pitTargetCompound||'').toUpperCase()]?String(vehicle.pitTargetCompound).toUpperCase():'MEDIUM';
  setVehicleTyreCompoundV203(vehicle.id,compound);
  vehicle.tyreSurfaceTemp=PIT_CONFIG_V205.coldSurface;
  vehicle.tyreCarcassTemp=PIT_CONFIG_V205.coldCarcass;
  vehicle.tyreWarmupFactor=PIT_CONFIG_V205.minWarmupGrip;
  vehicle.pitWarmupRemainingLaps=PIT_CONFIG_V205.warmupLaps;
  vehicle.pitWarmupStartRaceProgress=Number(vehicle.raceProgress)||0;
  vehicle.pitStopCount=(Number(vehicle.pitStopCount)||0)+1;
  vehicle.pitServiced=true;
  vehicle.pitBoxTimerMs=0;
  vehicle.pitState='PIT_LANE';
  return true;
}
function completePitExitV205(vehicle){
  if(!vehicle)return false;
  vehicle.pitState='TRACK';
  vehicle.pitRequested=false;
  vehicle.pitServiced=false;
  vehicle.pitRequestReason='';
  vehicle.pitLastStopLap=Math.max(1,Number(vehicle.currentLap)||1);
  vehicle.racingLineMode=F1_LINE_MODES_V197.includes(vehicle.pitPreviousRacingLineMode)?vehicle.pitPreviousRacingLineMode:'IDEAL';
  vehicle.pitPreviousRacingLineMode='IDEAL';
  return true;
}
function updatePitWarmupV205(vehicle,previousRaceProgress){
  if(!vehicle)return 1;
  const previous=Number(previousRaceProgress)||0,current=Number(vehicle.raceProgress)||0;
  const travelled=Math.max(0,current-previous);
  if((Number(vehicle.pitWarmupRemainingLaps)||0)>0&&travelled>0){
    vehicle.pitWarmupRemainingLaps=Math.max(0,Number(vehicle.pitWarmupRemainingLaps)-travelled);
  }
  const remaining=Math.max(0,Number(vehicle.pitWarmupRemainingLaps)||0);
  const ratio=clamp01V198(remaining/PIT_CONFIG_V205.warmupLaps);
  vehicle.tyreWarmupFactor=remaining>0?PIT_CONFIG_V205.minWarmupGrip+(1-PIT_CONFIG_V205.minWarmupGrip)*(1-ratio):1;
  return vehicle.tyreWarmupFactor;
}
function updatePitPreStepV205(vehicle,stepMs){
  if(!vehicle)return {stationary:false,speedCapKph:Infinity,state:'TRACK',limitKph:pitSpeedLimitV205()};
  const track=pitTrackV205(),pit=track?.pit;
  if(!pit)return pitControlV205(vehicle);
  if(vehicle.pitState==='PIT_BOX'){
    vehicle.pitBoxTimerMs=Math.max(0,(Number(vehicle.pitBoxTimerMs)||0)-Math.max(0,Number(stepMs)||0));
    if(vehicle.pitBoxTimerMs<=0)completePitServiceV205(vehicle);
  }
  if(vehicle.pitState==='TRACK'&&vehicle.pitRequested){
    const ahead=pitDistanceAheadV205(vehicle.progress,pit.entry);
    if(ahead<=PIT_CONFIG_V205.approachProgress)vehicle.racingLineMode='PIT_LINE';
  }
  if(vehicle.pitState==='PIT_ENTRY'&&Number(vehicle.speedKph)<=pitSpeedLimitV205()+2)vehicle.pitState='PIT_LANE';
  return pitControlV205(vehicle);
}
function updatePitPostStepV205(vehicle,previousRaceProgress){
  if(!vehicle)return false;
  const track=pitTrackV205(),pit=track?.pit;if(!pit)return false;
  const current=Number(vehicle.raceProgress)||0;
  if(vehicle.pitState==='TRACK'&&vehicle.pitRequested&&passedTrackProgressV205(previousRaceProgress,current,pit.entry)){
    vehicle.pitState='PIT_ENTRY';
    vehicle.pitEntryRaceProgress=current;
    vehicle.pitServiced=false;
    vehicle.racingLineMode='PIT_LINE';
  }
  if((vehicle.pitState==='PIT_ENTRY'||vehicle.pitState==='PIT_LANE')&&!vehicle.pitServiced&&passedTrackProgressV205(previousRaceProgress,current,pit.stop)){
    enterPitBoxV205(vehicle);
  }else if(vehicle.pitState==='PIT_LANE'&&vehicle.pitServiced&&passedTrackProgressV205(previousRaceProgress,current,pit.exit)){
    vehicle.pitState='PIT_EXIT';
    vehicle.pitExitRaceProgress=current;
  }else if(vehicle.pitState==='PIT_EXIT'&&current-(Number(vehicle.pitExitRaceProgress)||current)>=PIT_CONFIG_V205.exitMergeProgress){
    completePitExitV205(vehicle);
  }
  updatePitWarmupV205(vehicle,previousRaceProgress);
  return true;
}
function getPitStatesV205(){
  return raceMotionV189.vehicles.map(vehicle=>({
    id:vehicle.id,name:vehicle.driver?.name||'',state:String(vehicle.pitState||'TRACK'),requested:Boolean(vehicle.pitRequested),
    targetCompound:String(vehicle.pitTargetCompound||'MEDIUM'),requestReason:String(vehicle.pitRequestReason||''),
    stopCount:Number(vehicle.pitStopCount)||0,boxTimerMs:Number(vehicle.pitBoxTimerMs)||0,
    speedLimitKph:pitSpeedLimitV205(),warmupRemainingLaps:Number(vehicle.pitWarmupRemainingLaps)||0,
    tyreWarmupFactor:Number(vehicle.tyreWarmupFactor)||1,compound:String(vehicle.tyreCompound||'MEDIUM')
  }));
}
function qaPitCycleV205(driverId,compound='SOFT'){
  const vehicle=raceMotionV189.vehicles.find(v=>String(v.id)===String(driverId||''))||raceMotionV189.vehicles[0];
  if(!vehicle)return null;
  const states=[];
  if(!requestPitStopV205(vehicle.id,compound,'QA'))return null;
  vehicle.pitState='PIT_ENTRY';vehicle.racingLineMode='PIT_LINE';states.push(vehicle.pitState);
  vehicle.pitState='PIT_LANE';states.push(vehicle.pitState);
  const laneControl=pitControlV205(vehicle);
  enterPitBoxV205(vehicle);states.push(vehicle.pitState);
  vehicle.pitBoxTimerMs=0;completePitServiceV205(vehicle);states.push(vehicle.pitState);
  vehicle.pitState='PIT_EXIT';vehicle.pitExitRaceProgress=Number(vehicle.raceProgress)||0;states.push(vehicle.pitState);
  completePitExitV205(vehicle);states.push(vehicle.pitState);
  return {states,laneSpeedCapKph:laneControl.speedCapKph,compound:vehicle.tyreCompound,stopCount:vehicle.pitStopCount,warmupFactor:vehicle.tyreWarmupFactor,warmupRemainingLaps:vehicle.pitWarmupRemainingLaps};
}


function pitLossSecondsV206(track=activeRaceSnapshotV187?.track){
  if(!track?.pit)return 22;
  const length=Math.max(1,Number(track.lengthMeters)||1);
  const entry=normalizedProgressV190(track.pit.entry),exit=normalizedProgressV190(track.pit.exit);
  const laneFraction=(exit-entry+1)%1;
  const pitDistance=Math.max(150,laneFraction*length);
  const limitMps=Math.max(8,Number(track.pit.speedLimitKph||80)/3.6);
  const raceMps=230/3.6;
  const loss=pitDistance/limitMps-pitDistance/raceMps+PIT_CONFIG_V205.boxStopMs/1000;
  return Math.max(14,Math.min(40,loss));
}
function pitRivalCommittedV206(vehicle,currentLap){
  if(!vehicle)return false;
  if(vehicle.pitRequested||String(vehicle.pitState||'TRACK')!=='TRACK')return true;
  const last=Number(vehicle.pitLastStopLap)||0;
  return last>0&&Math.abs((Number(currentLap)||1)-last)<=1;
}
function choosePitCompoundV206(vehicle,remainingLaps){
  const remaining=Math.max(0,Number(remainingLaps)||0);
  const management=driverSkillNormV200(vehicle,'tyreManagement');
  if(remaining<=3.25)return 'SOFT';
  if(remaining<=6.5)return 'MEDIUM';
  return management>.45?'MEDIUM':'HARD';
}
function pitStrategyContextV206(vehicle){
  const snapshot=activeRaceSnapshotV187;
  const standings=computeRaceStandingsV191();
  const index=standings.findIndex(row=>row.vehicle===vehicle);
  const row=index>=0?standings[index]:null;
  const ahead=index>0?standings[index-1]?.vehicle:null;
  const behind=index>=0&&index<standings.length-1?standings[index+1]?.vehicle:null;
  const gapAhead=index>0?Math.max(0,Number(row?.intervalSeconds)||0):Infinity;
  const gapBehind=behind?Math.max(0,Number(standings[index+1]?.intervalSeconds)||0):Infinity;
  const totalLaps=Math.max(1,Number(snapshot?.totalLaps)||DEFAULT_TOTAL_LAPS_V190);
  const currentLap=Math.max(1,Number(vehicle?.currentLap)||1);
  const remainingLaps=Math.max(0,totalLaps-Math.max(0,Number(vehicle?.raceProgress)||0));
  const pressure=clamp01V198(vehicle?.tyreStrategyPressure);
  const grip=Math.max(TYRE_CONFIG_V203.minGrip,Math.min(TYRE_CONFIG_V203.maxGrip,Number(vehicle?.tyreGrip)||1));
  const gripLoss=clamp01V198((.985-grip)/.16);
  const flatSpot=clamp01V198(vehicle?.tyreFlatSpot);
  const thermalDeg=clamp01V198(vehicle?.tyreThermalDeg);
  const graining=clamp01V198(vehicle?.tyreGraining);
  const wear=clamp01V198(vehicle?.tyreWear);
  const tyreNeed=clamp01V198(pressure*.52+gripLoss*.25+flatSpot*.18+thermalDeg*.12+graining*.08+wear*.08);
  const management=driverSkillNormV200(vehicle,'tyreManagement');
  const racecraft=driverSkillNormV200(vehicle,'racecraft');
  const pitLossSeconds=pitLossSecondsV206(snapshot?.track);
  return {
    currentLap,totalLaps,remainingLaps,position:Number(row?.position)||Number(vehicle?.position)||999,
    gapAhead,gapBehind,aheadId:String(ahead?.id||''),behindId:String(behind?.id||''),
    rivalAheadPitting:pitRivalCommittedV206(ahead,currentLap),
    rivalBehindPitting:pitRivalCommittedV206(behind,currentLap),
    pressure,grip,gripLoss,flatSpot,thermalDeg,graining,wear,tyreNeed,management,racecraft,pitLossSeconds
  };
}
function compactPitStrategyContextV206(context){
  if(!context)return {};
  return {
    currentLap:context.currentLap,totalLaps:context.totalLaps,remainingLaps:Number(context.remainingLaps.toFixed(3)),
    position:context.position,gapAhead:Number.isFinite(context.gapAhead)?Number(context.gapAhead.toFixed(3)):null,
    gapBehind:Number.isFinite(context.gapBehind)?Number(context.gapBehind.toFixed(3)):null,
    rivalAheadPitting:Boolean(context.rivalAheadPitting),rivalBehindPitting:Boolean(context.rivalBehindPitting),
    pressure:Number(context.pressure.toFixed(3)),grip:Number(context.grip.toFixed(3)),
    tyreNeed:Number(context.tyreNeed.toFixed(3)),management:Number(context.management.toFixed(3)),
    racecraft:Number(context.racecraft.toFixed(3)),pitLossSeconds:Number(context.pitLossSeconds.toFixed(2))
  };
}
function recordPitStrategyDecisionV206(vehicle,decision,reason,score,compound,context){
  const next=PIT_STRATEGIES_V206.includes(decision)?decision:'NONE';
  const previous=String(vehicle.strategyDecision||'NONE');
  vehicle.strategyDecision=next;
  vehicle.strategyReason=String(reason||'');
  vehicle.strategyScore=Math.max(0,Math.min(1,Number(score)||0));
  vehicle.strategyTargetCompound=String(compound||vehicle.tyreCompound||'MEDIUM');
  vehicle.strategyLastLap=Math.max(1,Number(vehicle.currentLap)||1);
  vehicle.strategyLastSimMs=simClockV192.simTimeMs;
  vehicle.strategyLastContext=compactPitStrategyContextV206(context);
  if(previous!==next||vehicle.strategyLastRecordedReason!==vehicle.strategyReason){
    vehicle.strategyHistory=Array.isArray(vehicle.strategyHistory)?vehicle.strategyHistory:[];
    vehicle.strategyHistory.push({
      simTimeMs:simClockV192.simTimeMs,lap:vehicle.strategyLastLap,decision:next,
      reason:vehicle.strategyReason,score:vehicle.strategyScore,compound:vehicle.strategyTargetCompound
    });
    if(vehicle.strategyHistory.length>12)vehicle.strategyHistory.splice(0,vehicle.strategyHistory.length-12);
    vehicle.strategyLastRecordedReason=vehicle.strategyReason;
  }
  return next;
}
function evaluatePitStrategyV206(vehicle,options={}){
  if(!vehicle||vehicle.finished)return null;
  const context=pitStrategyContextV206(vehicle);
  const cfg=PIT_STRATEGY_CONFIG_V206;
  const compound=choosePitCompoundV206(vehicle,context.remainingLaps);
  const currentLap=context.currentLap;
  const pitWindowOpen=currentLap>=cfg.openingLaps&&context.remainingLaps>cfg.minRemainingLapsToPit;
  const cooldown=(Number(vehicle.pitStopCount)||0)>0&&(currentLap-(Number(vehicle.pitLastStopLap)||0))<=cfg.postStopCooldownLaps;
  let decision='NONE',reason='WAIT_FOR_WINDOW',score=.08;

  if(String(vehicle.pitState||'TRACK')!=='TRACK'||vehicle.pitRequested){
    decision=String(vehicle.strategyDecision||'NONE');
    reason=vehicle.pitRequested?'PIT_ALREADY_COMMITTED':'PIT_SEQUENCE_ACTIVE';
    score=Math.max(.3,Number(vehicle.strategyScore)||0);
  }else if(cooldown||(Number(vehicle.pitWarmupRemainingLaps)||0)>0){
    decision='GO_LONG';reason='POST_STOP_WARMUP';score=.72;
  }else if(Number(vehicle.strategyHoldUntilLap)>currentLap){
    decision='OVERCUT';reason='OVERCUT_STINT_EXTENSION';score=.74;
  }else if(!pitWindowOpen){
    decision='GO_LONG';reason=context.remainingLaps<=cfg.minRemainingLapsToPit?'TOO_LATE_TO_PIT':'OPENING_STINT';score=.46;
  }else if(Number(vehicle.strategyHoldUntilLap)>0&&currentLap>=Number(vehicle.strategyHoldUntilLap)&&context.tyreNeed>=.18){
    decision='BOX_NOW';reason='OVERCUT_WINDOW_COMPLETE';score=.82;
    vehicle.strategyHoldUntilLap=0;
  }else if(context.pressure>=cfg.severePressure||context.grip<=.885||context.flatSpot>=.32||context.thermalDeg>=.58){
    decision='BOX_NOW';reason='TYRE_STATE_CRITICAL';
    score=Math.max(.86,Math.min(1,context.tyreNeed+.22));
  }else if(context.rivalBehindPitting&&context.gapBehind<=cfg.coverGapSeconds&&context.tyreNeed>=.10){
    decision='COVER_UNDERCUT';reason='COVER_RIVAL_PIT';
    score=Math.min(1,.66+(1-context.gapBehind/cfg.coverGapSeconds)*.18+context.tyreNeed*.18);
  }else if(context.rivalAheadPitting&&context.gapAhead<=cfg.overcutGapSeconds&&context.pressure<.39&&context.grip>.91&&context.management>-.30){
    decision='OVERCUT';reason='RIVAL_PIT_STAY_OUT';
    score=Math.min(1,.61+(1-context.gapAhead/cfg.overcutGapSeconds)*.16+Math.max(0,context.management)*.12);
    vehicle.strategyHoldUntilLap=currentLap+1;
  }else if(Number.isFinite(context.gapAhead)&&context.gapAhead<=cfg.undercutGapSeconds&&context.tyreNeed>=cfg.normalPressure&&context.remainingLaps>2.2){
    decision='UNDERCUT';reason='ATTACK_CAR_AHEAD';
    score=Math.min(1,.60+(1-context.gapAhead/cfg.undercutGapSeconds)*.20+context.tyreNeed*.14+Math.max(0,context.racecraft)*.06);
  }else if(context.pressure<.33&&context.grip>.925&&context.management>.05&&context.remainingLaps>2.5){
    decision='GO_LONG';reason='TYRE_MANAGEMENT_MARGIN';
    score=Math.min(.85,.52+Math.max(0,context.management)*.22+(1-context.pressure)*.10);
  }else{
    decision='NONE';reason='HOLD_CURRENT_STRATEGY';score=.28+context.tyreNeed*.18;
  }

  recordPitStrategyDecisionV206(vehicle,decision,reason,score,compound,context);
  const shouldPit=decision==='BOX_NOW'||decision==='UNDERCUT'||decision==='COVER_UNDERCUT';
  let requested=false;
  if(shouldPit&&!vehicle.pitRequested&&String(vehicle.pitState||'TRACK')==='TRACK'){
    requested=requestPitStopV205(vehicle.id,compound,decision);
    if(requested){
      vehicle.strategyPitRequestedAtLap=currentLap;
      vehicle.strategyPitRequestedAtSimMs=simClockV192.simTimeMs;
    }
  }
  return {
    id:vehicle.id,decision,reason,score:vehicle.strategyScore,targetCompound:compound,
    requested:Boolean(vehicle.pitRequested||requested),context:compactPitStrategyContextV206(context)
  };
}
function updatePitStrategiesV206(stepMs){
  if(!(stepMs>0))return [];
  const results=[];
  for(const vehicle of raceMotionV189.vehicles){
    if(!vehicle||vehicle.finished)continue;
    vehicle.strategyEvalMs=Math.max(0,(Number(vehicle.strategyEvalMs)||0)-stepMs);
    if(vehicle.strategyEvalMs>0)continue;
    vehicle.strategyEvalMs=PIT_STRATEGY_CONFIG_V206.evaluationMs;
    if(String(vehicle.pitState||'TRACK')!=='TRACK'||vehicle.pitRequested)continue;
    const result=evaluatePitStrategyV206(vehicle);
    if(result)results.push(result);
  }
  return results;
}
function getPitStrategyStatesV206(){
  return raceMotionV189.vehicles.map(vehicle=>({
    id:vehicle.id,name:vehicle.driver?.name||'',decision:String(vehicle.strategyDecision||'NONE'),
    reason:String(vehicle.strategyReason||''),score:Number(vehicle.strategyScore)||0,
    targetCompound:String(vehicle.strategyTargetCompound||vehicle.tyreCompound||'MEDIUM'),
    lastLap:Number(vehicle.strategyLastLap)||0,lastSimMs:Number(vehicle.strategyLastSimMs)||0,
    holdUntilLap:Number(vehicle.strategyHoldUntilLap)||0,pitRequested:Boolean(vehicle.pitRequested),
    pitRequestReason:String(vehicle.pitRequestReason||''),context:{...(vehicle.strategyLastContext||{})},
    history:(vehicle.strategyHistory||[]).map(row=>({...row}))
  }));
}
function qaPitStrategyV206(driverId,scenario='BOX_NOW'){
  const vehicle=raceMotionV189.vehicles.find(v=>String(v.id)===String(driverId||''))||raceMotionV189.vehicles[0];
  if(!vehicle)return null;
  const keys=[
    'raceProgress','currentLap','tyreWear','tyreGrip','tyreFlatSpot','tyreThermalDeg','tyreGraining','tyreStrategyPressure',
    'pitState','pitRequested','pitTargetCompound','pitRequestReason','pitPreviousRacingLineMode','pitStopCount','pitLastStopLap',
    'pitWarmupRemainingLaps','strategyDecision','strategyReason','strategyScore','strategyTargetCompound','strategyLastLap',
    'strategyLastSimMs','strategyLastContext','strategyHistory','strategyLastRecordedReason','strategyHoldUntilLap',
    'strategyPitRequestedAtLap','strategyPitRequestedAtSimMs'
  ];
  const saved={};for(const key of keys)saved[key]=key==='strategyHistory'?(vehicle[key]||[]).map(row=>({...row})):key==='strategyLastContext'?{...(vehicle[key]||{})}:vehicle[key];
  const totalLaps=Math.max(8,Number(activeRaceSnapshotV187?.totalLaps)||10);
  vehicle.raceProgress=Math.min(totalLaps-3.2,3.15);
  vehicle.currentLap=Math.max(4,Math.floor(vehicle.raceProgress)+1);
  vehicle.pitState='TRACK';vehicle.pitRequested=false;vehicle.pitStopCount=0;vehicle.pitLastStopLap=0;vehicle.pitWarmupRemainingLaps=0;
  if(String(scenario||'BOX_NOW').toUpperCase()==='BOX_NOW'){
    vehicle.tyreWear=.92;vehicle.tyreGrip=.84;vehicle.tyreFlatSpot=.42;vehicle.tyreThermalDeg=.62;vehicle.tyreGraining=.22;vehicle.tyreStrategyPressure=.91;
  }
  const result=evaluatePitStrategyV206(vehicle,{qa:true});
  const output=result?{
    ...result,requestReason:String(vehicle.pitRequestReason||''),pitRequested:Boolean(vehicle.pitRequested),
    historyLength:Array.isArray(vehicle.strategyHistory)?vehicle.strategyHistory.length:0
  }:null;
  for(const key of keys)vehicle[key]=saved[key];
  return output;
}


function trafficBattlePhaseV207(vehicle){
  const phase=getCornerPhaseAtProgressV194(vehicle?.progress)?.phase||'STRAIGHT';
  return {phase,open:phase==='STRAIGHT'||phase==='APPROACH'||phase==='BRAKING'};
}
function updateTrafficAndDefenceV207(){
  const track=activeRaceSnapshotV187?.track;
  const length=Math.max(1,Number(track?.lengthMeters)||1);
  const standings=computeRaceStandingsV191();
  for(const standing of standings){
    const vehicle=standing.vehicle;
    vehicle.trafficState='CLEAR';vehicle.trafficCarAheadId='';vehicle.trafficGapMeters=Infinity;vehicle.trafficClosingRateKph=0;vehicle.trafficPressure=0;vehicle.trafficThreatFromId='';vehicle.defenceActive=false;vehicle.trafficLineIntent='IDEAL';
    if(String(vehicle.pitState||'TRACK')==='TRACK'&&!vehicle.pitRequested&&['ATTACK_INSIDE','DEFENSIVE_INSIDE'].includes(vehicle.racingLineMode))vehicle.racingLineMode='IDEAL';
  }
  for(let index=1;index<standings.length;index++){
    const vehicle=standings[index].vehicle,ahead=standings[index-1].vehicle;
    if(!vehicle||!ahead||vehicle.finished||ahead.finished)continue;
    if(String(vehicle.pitState||'TRACK')!=='TRACK'||String(ahead.pitState||'TRACK')!=='TRACK')continue;
    const gapMeters=Math.max(0,(Number(ahead.raceProgress)-Number(vehicle.raceProgress))*length);
    const closingRateKph=(Number(vehicle.speedKph)||0)-(Number(ahead.speedKph)||0);
    const gapFactor=clamp01V198(1-gapMeters/TRAFFIC_CONFIG_V207.followingGapMeters);
    const closingFactor=clamp01V198((closingRateKph+4)/(TRAFFIC_CONFIG_V207.strongClosingKph+4));
    const pressure=clamp01V198(gapFactor*(.35+.65*closingFactor));
    vehicle.trafficCarAheadId=String(ahead.id);vehicle.trafficGapMeters=gapMeters;vehicle.trafficClosingRateKph=closingRateKph;vehicle.trafficPressure=pressure;
    let state='CLEAR';
    if(gapMeters<=TRAFFIC_CONFIG_V207.followingGapMeters)state='FOLLOWING';
    if(gapMeters<=TRAFFIC_CONFIG_V207.followingGapMeters&&Number(vehicle.slipstreamStrength)>.08)state='TOWING';
    if(gapMeters<=TRAFFIC_CONFIG_V207.pressureGapMeters&&closingRateKph>=TRAFFIC_CONFIG_V207.minClosingKph)state='PRESSURE';
    vehicle.trafficState=state;
    const battle=trafficBattlePhaseV207(vehicle);
    if(state==='PRESSURE'&&gapMeters<=TRAFFIC_CONFIG_V207.attackGapMeters&&battle.open){
      vehicle.trafficLineIntent='ATTACK_INSIDE';vehicle.racingLineMode='ATTACK_INSIDE';
    }
    if(pressure>=.24&&gapMeters<=TRAFFIC_CONFIG_V207.defendGapMeters){
      ahead.trafficThreatFromId=String(vehicle.id);ahead.defenceActive=true;ahead.trafficState='DEFENDING';
      const aheadBattle=trafficBattlePhaseV207(ahead);
      if(aheadBattle.open&&!ahead.pitRequested){ahead.trafficLineIntent='DEFENSIVE_INSIDE';ahead.racingLineMode='DEFENSIVE_INSIDE'}
    }
  }
  return getTrafficStatesV207();
}
function getTrafficStatesV207(){
  return raceMotionV189.vehicles.map(vehicle=>({id:String(vehicle.id),state:String(vehicle.trafficState||'CLEAR'),carAheadId:String(vehicle.trafficCarAheadId||''),gapMeters:Number.isFinite(vehicle.trafficGapMeters)?Number(vehicle.trafficGapMeters):null,closingRateKph:Number(vehicle.trafficClosingRateKph)||0,pressure:Number(vehicle.trafficPressure)||0,threatFromId:String(vehicle.trafficThreatFromId||''),defenceActive:Boolean(vehicle.defenceActive),lineIntent:String(vehicle.trafficLineIntent||'IDEAL'),racingLineMode:String(vehicle.racingLineMode||'IDEAL')}));
}
function qaTrafficV207(){
  const track=activeRaceSnapshotV187?.track,vehicles=raceMotionV189.vehicles;
  if(!track||vehicles.length<2)return null;
  const standings=computeRaceStandingsV191(),ahead=standings[0]?.vehicle,follower=standings[1]?.vehicle;
  if(!ahead||!follower)return null;
  const keys=['raceProgress','progress','speedKph','slipstreamStrength','racingLineMode','trafficState','trafficCarAheadId','trafficGapMeters','trafficClosingRateKph','trafficPressure','trafficThreatFromId','defenceActive','trafficLineIntent'];
  const saved=new Map(vehicles.map(v=>[v.id,Object.fromEntries(keys.map(k=>[k,v[k]]))]));
  let base=.05;
  for(let i=0;i<100;i++){
    const candidate=(i+.5)/100;
    if(trafficBattlePhaseV207({progress:candidate}).phase==='STRAIGHT'){base=candidate;break}
  }
  const gapProgress=12/Math.max(1,Number(track.lengthMeters)||1);
  ahead.raceProgress=2+base;ahead.progress=normalizedProgressV190(ahead.raceProgress);ahead.speedKph=250;ahead.racingLineMode='IDEAL';
  follower.raceProgress=ahead.raceProgress-gapProgress;follower.progress=normalizedProgressV190(follower.raceProgress);follower.speedKph=272;follower.slipstreamStrength=.65;follower.racingLineMode='IDEAL';
  const states=updateTrafficAndDefenceV207(),output={follower:states.find(row=>row.id===String(follower.id))||null,ahead:states.find(row=>row.id===String(ahead.id))||null};
  for(const vehicle of vehicles){const row=saved.get(vehicle.id);if(row)for(const key of keys)vehicle[key]=row[key]}
  return output;
}


function nextPassStateV208(current,ctx={}){
  const state=PASS_STATES_V208.includes(current)?current:'FOLLOWING';
  const gap=Math.max(0,Number(ctx.gapMeters)||0),closing=Number(ctx.closingRateKph)||0,slip=Number(ctx.slipstreamStrength)||0;
  const phase=String(ctx.phase||'STRAIGHT'),open=phase==='STRAIGHT'||phase==='APPROACH'||phase==='BRAKING';
  const passed=Boolean(ctx.passed),counter=Boolean(ctx.counterAttack);
  if(passed&&['PULLING_OUT','SIDE_BY_SIDE','BRAKING_DUEL','CORNER_BATTLE','SWITCHBACK','COUNTER_ATTACK'].includes(state))return 'PASS_COMPLETED';
  if(['PULLING_OUT','SIDE_BY_SIDE','BRAKING_DUEL','CORNER_BATTLE','SWITCHBACK','COUNTER_ATTACK'].includes(state)&&gap>PASS_CONFIG_V208.failGapMeters)return 'PASS_FAILED';
  if(state==='FOLLOWING')return closing>1&&gap<PASS_CONFIG_V208.followGapMeters?'CLOSING':'FOLLOWING';
  if(state==='CLOSING')return slip>.12?'TOWING':gap>=PASS_CONFIG_V208.followGapMeters?'FOLLOWING':'CLOSING';
  if(state==='TOWING')return gap<PASS_CONFIG_V208.prepareGapMeters?'PREPARING_ATTACK':slip>.08?'TOWING':'CLOSING';
  if(state==='PREPARING_ATTACK')return gap<PASS_CONFIG_V208.pullOutGapMeters&&open?'PULLING_OUT':'PREPARING_ATTACK';
  if(state==='PULLING_OUT')return gap<PASS_CONFIG_V208.sideBySideGapMeters?'SIDE_BY_SIDE':'PULLING_OUT';
  if(state==='SIDE_BY_SIDE')return phase==='BRAKING'||phase==='TURN_IN'?'BRAKING_DUEL':'SIDE_BY_SIDE';
  if(state==='BRAKING_DUEL')return phase==='TURN_IN'||phase==='APEX'?'CORNER_BATTLE':'BRAKING_DUEL';
  if(state==='CORNER_BATTLE')return phase==='EXIT'?'SWITCHBACK':'CORNER_BATTLE';
  if(state==='SWITCHBACK')return counter&&gap<14?'COUNTER_ATTACK':'SWITCHBACK';
  if(state==='COUNTER_ATTACK')return gap>PASS_CONFIG_V208.failGapMeters?'PASS_FAILED':'COUNTER_ATTACK';
  if(state==='PASS_COMPLETED'||state==='PASS_FAILED')return 'FOLLOWING';
  return state;
}
function battleBiasKphV208(vehicle,state){
  const racecraft=driverSkillNormV200(vehicle,'racecraft');
  const aggression=driverSkillNormV200(vehicle,'aggression');
  const skill=1+racecraft*.12+Math.max(0,aggression)*.06;
  const base={FOLLOWING:0,CLOSING:.3,TOWING:.9,PREPARING_ATTACK:.7,PULLING_OUT:1.1,SIDE_BY_SIDE:.55,BRAKING_DUEL:.35,CORNER_BATTLE:.15,SWITCHBACK:1.0,COUNTER_ATTACK:.8,PASS_COMPLETED:0,PASS_FAILED:-.25}[state]||0;
  return Math.max(-PASS_CONFIG_V208.maxBattleBiasKph,Math.min(PASS_CONFIG_V208.maxBattleBiasKph,base*skill));
}
function setPassStateV208(vehicle,next,targetId='',reason=''){
  const current=String(vehicle.battleState||'FOLLOWING');
  if(current!==next){
    vehicle.battleState=next;vehicle.battleStateMs=0;vehicle.battleReason=String(reason||'');
    if(next==='PASS_COMPLETED')vehicle.passCompletedCount=(Number(vehicle.passCompletedCount)||0)+1;
    if(next==='PASS_FAILED')vehicle.passFailedCount=(Number(vehicle.passFailedCount)||0)+1;
  }
  if(targetId)vehicle.battleTargetId=String(targetId);
  vehicle.battleSpeedBiasKph=battleBiasKphV208(vehicle,vehicle.battleState);
  return vehicle.battleState;
}
function updatePassStateMachineV208(stepMs){
  const track=activeRaceSnapshotV187?.track;
  if(!track)return [];
  const length=Math.max(1,Number(track.lengthMeters)||1),standings=computeRaceStandingsV191();
  const byId=new Map(raceMotionV189.vehicles.map(v=>[String(v.id),v]));
  for(const vehicle of raceMotionV189.vehicles){
    vehicle.battleStateMs=(Number(vehicle.battleStateMs)||0)+Math.max(0,Number(stepMs)||0);
    if(vehicle.finished||String(vehicle.pitState||'TRACK')!=='TRACK'){
      vehicle.battleSpeedBiasKph=0;continue;
    }
    let target=byId.get(String(vehicle.battleTargetId||''))||null;
    const currentStanding=standings.find(row=>row.vehicle===vehicle);
    const immediateAhead=currentStanding&&currentStanding.position>1?standings[currentStanding.position-2]?.vehicle:null;
    if(!target||String(target.pitState||'TRACK')!=='TRACK')target=immediateAhead||null;
    if(!target){vehicle.battleState='FOLLOWING';vehicle.battleTargetId='';vehicle.battleSpeedBiasKph=0;continue}
    const signedGapMeters=(Number(target.raceProgress)-Number(vehicle.raceProgress))*length;
    const passed=signedGapMeters<-PASS_CONFIG_V208.passMarginMeters;
    const gapMeters=Math.abs(signedGapMeters);
    const phase=getCornerPhaseAtProgressV194(vehicle.progress)?.phase||'STRAIGHT';
    const ctx={
      gapMeters,closingRateKph:(Number(vehicle.speedKph)||0)-(Number(target.speedKph)||0),
      slipstreamStrength:Number(vehicle.slipstreamStrength)||0,phase,passed,
      counterAttack:String(vehicle.battleState||'')==='SWITCHBACK'&&(Number(vehicle.speedKph)||0)>(Number(target.speedKph)||0)
    };
    const hold=(Number(vehicle.battleStateMs)||0)<PASS_CONFIG_V208.stateHoldMs;
    const next=hold?String(vehicle.battleState||'FOLLOWING'):nextPassStateV208(String(vehicle.battleState||'FOLLOWING'),ctx);
    setPassStateV208(vehicle,next,target.id,'gap='+gapMeters.toFixed(1)+';phase='+phase);
    if(['PREPARING_ATTACK','PULLING_OUT','SIDE_BY_SIDE','BRAKING_DUEL','CORNER_BATTLE'].includes(next)&&!vehicle.pitRequested)vehicle.racingLineMode='ATTACK_INSIDE';
    if(next==='SWITCHBACK'||next==='COUNTER_ATTACK')vehicle.racingLineMode='OUTSIDE';
    if(next==='PASS_COMPLETED'||next==='PASS_FAILED')vehicle.racingLineMode='IDEAL';
  }
  return getPassStatesV208();
}
function getPassStatesV208(){
  return raceMotionV189.vehicles.map(vehicle=>({id:String(vehicle.id),state:String(vehicle.battleState||'FOLLOWING'),targetId:String(vehicle.battleTargetId||''),stateMs:Number(vehicle.battleStateMs)||0,biasKph:Number(vehicle.battleSpeedBiasKph)||0,completed:Number(vehicle.passCompletedCount)||0,failed:Number(vehicle.passFailedCount)||0,reason:String(vehicle.battleReason||'')}));
}
function qaPassStateMachineV208(){
  let state='FOLLOWING';const sequence=[state];
  const steps=[
    {gapMeters:40,closingRateKph:8,slipstreamStrength:.05,phase:'STRAIGHT'},
    {gapMeters:30,closingRateKph:10,slipstreamStrength:.4,phase:'STRAIGHT'},
    {gapMeters:18,closingRateKph:12,slipstreamStrength:.5,phase:'STRAIGHT'},
    {gapMeters:12,closingRateKph:14,slipstreamStrength:.45,phase:'APPROACH'},
    {gapMeters:6,closingRateKph:9,slipstreamStrength:.2,phase:'APPROACH'},
    {gapMeters:5,closingRateKph:5,slipstreamStrength:.1,phase:'BRAKING'},
    {gapMeters:4,closingRateKph:2,slipstreamStrength:0,phase:'APEX'},
    {gapMeters:5,closingRateKph:3,slipstreamStrength:0,phase:'EXIT'},
    {gapMeters:8,closingRateKph:6,slipstreamStrength:.05,phase:'STRAIGHT',counterAttack:true},
    {gapMeters:1,closingRateKph:5,slipstreamStrength:.05,phase:'STRAIGHT',passed:true}
  ];
  for(const ctx of steps){state=nextPassStateV208(state,ctx);sequence.push(state)}
  const failed=nextPassStateV208('SIDE_BY_SIDE',{gapMeters:40,closingRateKph:-8,phase:'STRAIGHT'});
  return {sequence,failed,states:[...PASS_STATES_V208]};
}

function createRaceVehiclesV189(snapshot){
  const count=Math.max(1,snapshot?.drivers?.length||0);
  return (snapshot?.drivers||[]).map(function(driver,index){
    const hash=hashDriverV189(driver.contactId||driver.name);
    const driverProfile=createDriverProfileV200(driver,snapshot);
    const raceSeed=hashDriverV189(String(driver.contactId||driver.name)+'|'+String(snapshot?.createdAt||'race')+'|pace-noise');
    const startOffset=-(index*Math.min(.0045,.045/count));
    const vehicle={
      id:String(driver.contactId),driver,startOffset,progress:normalizedProgressV190(startOffset),travel:0,raceProgress:startOffset,raceDistanceMeters:0,currentLap:1,completedLaps:0,sector:'GRID',
      lapDurationMs:21000,
      speedKph:0,targetSpeedKph:0,throttle:0,brake:0,accelerationMps2:0,gear:1,rpm:8500,
      racingLineMode:'IDEAL',lateralOffsetMeters:0,
      carAheadId:null,gapToCarAheadMeters:Infinity,slipstreamStrength:0,slipstreamDragReduction:0,slipstreamGapEffect:0,slipstreamAlignmentEffect:0,slipstreamLateralEffect:0,slipstreamStraightEffect:0,
      dirtyAirStrength:0,aeroGripMultiplier:1,understeerRisk:0,slideRisk:0,dirtyAirTyreHeatLoad:0,
      driverProfile,driverRandomState:raceSeed||1,paceNoise:0,nextPaceNoiseMs:0,driverPaceMultiplier:1,rawDriverPaceMultiplier:1,longRunPaceMultiplier:1,longRunPaceBias:0,
      batteryMJ:ENERGY_CONFIG_V201.usableCapacityMJ,energyTargetMJ:ENERGY_CONFIG_V201.usableCapacityMJ,energyDeployKW:0,energyRechargeKW:0,energyDeployMJ:0,energyHarvestMJ:0,energyHarvestLapMJ:0,energyLapNumber:1,boostActive:false,boostPowerKW:0,boostEnergyMJ:0,attackOpportunityScore:0,defenceThreatScore:0,powerUnitFactor:1,
      activeAeroMode:'CORNER',activeAeroTarget:'CORNER',activeAeroTransitionMs:0,overtakeZoneId:'',overtakeGapSeconds:Infinity,overtakeEligible:false,overtakeActive:false,overtakeRechargeAllowanceActive:false,
      tyreCompound:'MEDIUM',tyreStartRaceProgress:startOffset,tyreAgeLaps:0,tyreWear:0,tyreSurfaceTemp:.5,tyreCarcassTemp:.5,tyreGrip:TYRE_COMPOUNDS_V203.MEDIUM.gripBias,tyreThermalDeg:0,tyreGraining:0,tyreFlatSpot:0,tyreStrategyPressure:0,
      incidentEvalMs:INCIDENT_CONFIG_V204.evaluationMs,lockupActiveMs:0,understeerActiveMs:0,oversteerActiveMs:0,
      lockupSeverity:0,understeerIncidentSeverity:0,oversteerIncidentSeverity:0,incidentLateralOffsetMeters:0,
      lockupCount:0,understeerCount:0,oversteerCount:0,lastIncidentType:'',lastIncidentSimMs:0,lastIncidentForced:false,
      pitState:'TRACK',pitRequested:false,pitTargetCompound:'MEDIUM',pitRequestReason:'',pitPreviousRacingLineMode:'IDEAL',
      pitEntryRaceProgress:0,pitExitRaceProgress:0,pitServiced:false,pitBoxTimerMs:0,pitBoxDurationMs:0,pitStopCount:0,pitLastStopLap:0,
      pitWarmupStartRaceProgress:0,pitWarmupRemainingLaps:0,tyreWarmupFactor:1,
      strategyEvalMs:900+index*140,strategyDecision:'NONE',strategyReason:'',strategyScore:0,strategyTargetCompound:'MEDIUM',
      strategyLastLap:0,strategyLastSimMs:0,strategyLastContext:{},strategyHistory:[],strategyLastRecordedReason:'',
      strategyHoldUntilLap:0,strategyPitRequestedAtLap:0,strategyPitRequestedAtSimMs:0,
      trafficState:'CLEAR',trafficCarAheadId:'',trafficGapMeters:Infinity,trafficClosingRateKph:0,trafficPressure:0,trafficThreatFromId:'',defenceActive:false,trafficLineIntent:'IDEAL',
      battleState:'FOLLOWING',battleTargetId:'',battleStateMs:0,battleReason:'',battleSpeedBiasKph:0,passCompletedCount:0,passFailedCount:0,
      finished:false,finishPosition:0,finishedAtSimMs:0,
      marker:null
    };
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
function lineOffsetMetersV197(vehicle){
  const track=activeRaceSnapshotV187?.track;
  const width=Math.max(4,Number(track?.geometry?.trackWidthMeters)||14);
  const margin=Math.max(0,Number(track?.geometry?.racingLineMarginMeters)||1.5);
  const usable=Math.max(1,width/2-margin);
  const phaseInfo=getCornerPhaseAtProgressV194(vehicle?.progress);
  const corner=phaseInfo?.corner;
  const direction=corner?.direction==='right'?-1:1;
  const mode=F1_LINE_MODES_V197.includes(vehicle?.racingLineMode)?vehicle.racingLineMode:'IDEAL';
  if(mode==='ATTACK_INSIDE')return direction*usable*.72;
  if(mode==='DEFENSIVE_INSIDE')return direction*usable*.55;
  if(mode==='OUTSIDE')return -direction*usable*.72;
  if(mode==='PIT_LINE')return -usable*.9;
  if(!phaseInfo)return 0;
  if(phaseInfo.phase==='APPROACH'||phaseInfo.phase==='BRAKING')return -direction*usable*.62;
  if(phaseInfo.phase==='TURN_IN')return -direction*usable*.18;
  if(phaseInfo.phase==='APEX')return direction*usable*.72;
  if(phaseInfo.phase==='EXIT')return -direction*usable*.42;
  return 0;
}
function raceLinePointV197(path,progress,offsetMeters){
  const total=Number(path?.getTotalLength?.())||0;
  if(!(total>0))return null;
  const p=((Number(progress)||0)%1+1)%1;
  const at=p*total;
  const center=path.getPointAtLength(at);
  const d=Math.max(1,total/800);
  const before=path.getPointAtLength(Math.max(0,at-d));
  const after=path.getPointAtLength(Math.min(total,at+d));
  const dx=Number(after.x)-Number(before.x),dy=Number(after.y)-Number(before.y);
  const mag=Math.hypot(dx,dy)||1;
  const nx=-dy/mag,ny=dx/mag;
  const track=activeRaceSnapshotV187?.track;
  const physicalWidth=Math.max(1,Number(track?.geometry?.trackWidthMeters)||14);
  const visualWidth=Math.max(8,Number(track?.geometry?.visualTrackWidthSvg)||26);
  const offsetSvg=(Number(offsetMeters)||0)*(visualWidth/physicalWidth);
  return {x:Number(center.x)+nx*offsetSvg,y:Number(center.y)+ny*offsetSvg};
}
function setVehicleRacingLineV197(driverId,mode){
  const key=String(driverId||'');
  const next=String(mode||'').toUpperCase();
  if(!F1_LINE_MODES_V197.includes(next))return false;
  const vehicle=raceMotionV189.vehicles.find(v=>String(v.id)===key);
  if(!vehicle)return false;
  vehicle.racingLineMode=next;
  return true;
}

function clamp01V198(value){return Math.max(0,Math.min(1,Number(value)||0))}
function angleDeltaRadV198(a,b){
  let d=(Number(a)||0)-(Number(b)||0);
  while(d>Math.PI)d-=Math.PI*2;
  while(d<-Math.PI)d+=Math.PI*2;
  return Math.abs(d);
}
function geometrySampleAtProgressV198(progress){
  return typeof window.mwsF1TrackGeometrySampleAtProgressV193==='function'
    ?window.mwsF1TrackGeometrySampleAtProgressV193(raceGeometryV193,progress)
    :null;
}
function resolveSlipstreamV198(vehicle,vehicles=raceMotionV189.vehicles){
  const track=activeRaceSnapshotV187?.track;
  if(!vehicle||!track){
    return {carAhead:null,gapMeters:Infinity,strength:0,dragReduction:0,gapEffect:0,alignmentEffect:0,lateralEffect:0,straightEffect:0};
  }
  const length=Math.max(1,Number(track.lengthMeters)||1);
  let ahead=null,gapMeters=Infinity;
  for(const candidate of vehicles||[]){
    if(!candidate||candidate===vehicle)continue;
    const delta=(Number(candidate.raceProgress)||0)-(Number(vehicle.raceProgress)||0);
    if(!(delta>0))continue;
    const meters=delta*length;
    if(meters<gapMeters){gapMeters=meters;ahead=candidate}
  }
  const cfg=SLIPSTREAM_CONFIG_V198;
  if(!ahead||gapMeters>cfg.maxGapMeters||gapMeters<cfg.minGapMeters||Number(vehicle.speedKph||0)<cfg.minSpeedKph){
    vehicle.carAheadId=ahead?String(ahead.id):null;
    vehicle.gapToCarAheadMeters=gapMeters;
    vehicle.slipstreamStrength=0;vehicle.slipstreamDragReduction=0;
    vehicle.slipstreamGapEffect=0;vehicle.slipstreamAlignmentEffect=0;vehicle.slipstreamLateralEffect=0;vehicle.slipstreamStraightEffect=0;
    return {carAhead:ahead,gapMeters,strength:0,dragReduction:0,gapEffect:0,alignmentEffect:0,lateralEffect:0,straightEffect:0};
  }
  const hereSample=geometrySampleAtProgressV198(vehicle.progress);
  const aheadSample=geometrySampleAtProgressV198(ahead.progress);
  const headingDelta=angleDeltaRadV198(hereSample?.headingRad,aheadSample?.headingRad);
  const alignmentEffect=clamp01V198(1-headingDelta/(Math.PI/5));
  const hereOffset=lineOffsetMetersV197(vehicle);
  const aheadOffset=lineOffsetMetersV197(ahead);
  const lateralDelta=Math.abs(hereOffset-aheadOffset);
  const lateralEffect=clamp01V198(1-lateralDelta/cfg.maxLateralMeters);
  const curvature=Math.abs(Number(hereSample?.curvatureRadPerMeter)||0);
  const phase=getCornerPhaseAtProgressV194(vehicle.progress)?.phase||'STRAIGHT';
  const phaseFactor=phase==='STRAIGHT'||phase==='APPROACH' ? 1 : phase==='EXIT' ? .55 : .15;
  const curvatureFactor=clamp01V198(1-curvature/0.0025);
  const straightEffect=clamp01V198(phaseFactor*curvatureFactor);
  const gapEffect=clamp01V198(1-(gapMeters-cfg.minGapMeters)/(cfg.maxGapMeters-cfg.minGapMeters));
  const wakeEffect=clamp01V198((Number(ahead.speedKph)||0)/300);
  const strength=clamp01V198(gapEffect*alignmentEffect*lateralEffect*straightEffect*wakeEffect);
  const dragReduction=strength*cfg.maxDragReduction;
  vehicle.carAheadId=String(ahead.id);
  vehicle.gapToCarAheadMeters=gapMeters;
  vehicle.slipstreamStrength=strength;
  vehicle.slipstreamDragReduction=dragReduction;
  vehicle.slipstreamGapEffect=gapEffect;
  vehicle.slipstreamAlignmentEffect=alignmentEffect;
  vehicle.slipstreamLateralEffect=lateralEffect;
  vehicle.slipstreamStraightEffect=straightEffect;
  return {carAhead:ahead,gapMeters,strength,dragReduction,gapEffect,alignmentEffect,lateralEffect,straightEffect};
}
function updateSlipstreamStatesV198(){
  for(const vehicle of raceMotionV189.vehicles)resolveSlipstreamV198(vehicle,raceMotionV189.vehicles);
  return raceMotionV189.vehicles.map(vehicle=>({id:vehicle.id,carAheadId:vehicle.carAheadId,gapToCarAheadMeters:vehicle.gapToCarAheadMeters,slipstreamStrength:vehicle.slipstreamStrength}));
}


function resolveDirtyAirV199(vehicle,vehicles=raceMotionV189.vehicles){
  const track=activeRaceSnapshotV187?.track;
  const cfg=DIRTY_AIR_CONFIG_V199;
  if(!vehicle||!track){
    return {carAhead:null,gapMeters:Infinity,strength:0,aeroGripMultiplier:1,understeerRisk:0,slideRisk:0,tyreHeatLoad:0};
  }
  const ahead=(vehicles||[]).find(v=>String(v?.id||'')===String(vehicle.carAheadId||''))||null;
  const gapMeters=Math.max(0,Number(vehicle.gapToCarAheadMeters)||Infinity);
  const phase=getCornerPhaseAtProgressV194(vehicle.progress)?.phase||'STRAIGHT';
  const phaseWeight=phase==='BRAKING'?.35:phase==='TURN_IN'?.8:phase==='APEX'?1:phase==='EXIT'?.65:phase==='APPROACH'?.12:0;
  if(!ahead||gapMeters>cfg.maxGapMeters||gapMeters<cfg.minGapMeters||phaseWeight<=0){
    vehicle.dirtyAirStrength=0;vehicle.aeroGripMultiplier=1;vehicle.understeerRisk=0;vehicle.slideRisk=0;vehicle.dirtyAirTyreHeatLoad=0;
    return {carAhead:ahead,gapMeters,strength:0,aeroGripMultiplier:1,understeerRisk:0,slideRisk:0,tyreHeatLoad:0};
  }
  const hereSample=geometrySampleAtProgressV198(vehicle.progress);
  const aheadSample=geometrySampleAtProgressV198(ahead.progress);
  const headingDelta=angleDeltaRadV198(hereSample?.headingRad,aheadSample?.headingRad);
  const alignmentEffect=clamp01V198(1-headingDelta/(Math.PI/4));
  const lateralDelta=Math.abs(lineOffsetMetersV197(vehicle)-lineOffsetMetersV197(ahead));
  const lateralEffect=clamp01V198(1-lateralDelta/cfg.maxLateralMeters);
  const gapEffect=clamp01V198(1-(gapMeters-cfg.minGapMeters)/(cfg.maxGapMeters-cfg.minGapMeters));
  const curvature=Math.abs(Number(hereSample?.curvatureRadPerMeter)||0);
  const curvatureEffect=clamp01V198(curvature/0.0022);
  const strength=clamp01V198(gapEffect*alignmentEffect*lateralEffect*phaseWeight*Math.max(.25,curvatureEffect));
  const aeroGripMultiplier=1-strength*cfg.maxCornerGripLoss;
  const understeerRisk=strength*cfg.maxUndersteerRisk;
  const slideRisk=strength*cfg.maxSlideRisk;
  const tyreHeatLoad=strength*cfg.maxTyreHeatLoad;
  vehicle.dirtyAirStrength=strength;
  vehicle.aeroGripMultiplier=aeroGripMultiplier;
  vehicle.understeerRisk=understeerRisk;
  vehicle.slideRisk=slideRisk;
  vehicle.dirtyAirTyreHeatLoad=tyreHeatLoad;
  return {carAhead:ahead,gapMeters,strength,aeroGripMultiplier,understeerRisk,slideRisk,tyreHeatLoad,phase};
}
function updateDirtyAirStatesV199(){
  for(const vehicle of raceMotionV189.vehicles)resolveDirtyAirV199(vehicle,raceMotionV189.vehicles);
  return raceMotionV189.vehicles.map(vehicle=>({id:vehicle.id,dirtyAirStrength:vehicle.dirtyAirStrength,aeroGripMultiplier:vehicle.aeroGripMultiplier,understeerRisk:vehicle.understeerRisk,slideRisk:vehicle.slideRisk,dirtyAirTyreHeatLoad:vehicle.dirtyAirTyreHeatLoad}));
}

function renderRaceVehiclesV189(){
  const path=document.getElementById('f1RacingRaceTrackPathV188');
  const layer=document.getElementById('f1RacingRaceVehicleLayerV188');
  if(!path||!layer)return false;
  const totalLength=path.getTotalLength();if(!(totalLength>0))return false;
  raceMotionV189.vehicles.forEach(function(vehicle,index){
    const marker=vehicle.marker||ensureRaceVehicleMarkerV189(vehicle,index);if(!marker)return;
    vehicle.lateralOffsetMeters=lineOffsetMetersV197(vehicle)+(Number(vehicle.incidentLateralOffsetMeters)||0);
    const point=raceLinePointV197(path,vehicle.progress,vehicle.lateralOffsetMeters);if(!point)return;
    marker.setAttribute('transform','translate('+point.x.toFixed(2)+' '+point.y.toFixed(2)+')');
    marker.dataset.lineMode=vehicle.racingLineMode||'IDEAL';
    marker.dataset.cornerPhase=getCornerPhaseAtProgressV194(vehicle.progress)?.phase||'STRAIGHT';
    marker.dataset.incident=activeDrivingIncidentV204(vehicle)||'';
    marker.dataset.pitState=String(vehicle.pitState||'TRACK');
    marker.dataset.trafficState=String(vehicle.trafficState||'CLEAR');
    marker.dataset.defence=vehicle.defenceActive?'1':'0';
    marker.dataset.battleState=String(vehicle.battleState||'FOLLOWING');
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
function syncSimulationControlsV192(){
  const pause=document.getElementById('f1RacingPauseV192');
  const status=document.getElementById('f1RacingRaceStatusV188');
  if(pause){
    pause.textContent=simClockV192.paused?'Resume':'Pause';
    pause.setAttribute('aria-pressed',simClockV192.paused?'true':'false');
    pause.classList.toggle('active',simClockV192.paused);
  }
  document.querySelectorAll('#f1RacingRaceControlsV192 [data-f1-timescale]').forEach(function(button){
    const active=Number(button.dataset.f1Timescale)===simClockV192.timeScale;
    button.classList.toggle('active',active);
    button.setAttribute('aria-pressed',active?'true':'false');
  });
  if(status&&raceMotionV189.running)status.textContent=simClockV192.paused?'PAUSED':'RUNNING';
}
function setSimulationTimeScaleV192(scale){
  const next=Number(scale);
  if(![1,2,4].includes(next))return false;
  simClockV192.timeScale=next;
  simClockV192.accumulatorMs=0;
  syncSimulationControlsV192();
  return true;
}
function toggleSimulationPauseV192(force){
  simClockV192.paused=typeof force==='boolean'?force:!simClockV192.paused;
  simClockV192.accumulatorMs=0;
  raceMotionV189.lastTimestamp=0;
  syncSimulationControlsV192();
  return simClockV192.paused;
}
function bindSimulationControlsV192(){
  const pause=document.getElementById('f1RacingPauseV192');
  if(pause&&!pause.dataset.f1Bound){
    pause.dataset.f1Bound='1';
    pause.addEventListener('click',function(){toggleSimulationPauseV192()});
  }
  document.querySelectorAll('#f1RacingRaceControlsV192 [data-f1-timescale]').forEach(function(button){
    if(button.dataset.f1Bound)return;
    button.dataset.f1Bound='1';
    button.addEventListener('click',function(){setSimulationTimeScaleV192(Number(button.dataset.f1Timescale))});
  });
  syncSimulationControlsV192();
}
function gearForSpeedV196(speedKph){
  const speed=Math.max(0,Number(speedKph)||0);
  if(speed<85)return 1;if(speed<125)return 2;if(speed<165)return 3;if(speed<205)return 4;
  if(speed<245)return 5;if(speed<280)return 6;if(speed<315)return 7;return 8;
}
function rpmForSpeedAndGearV196(speedKph,gear){
  const bands=[[0,85],[65,125],[100,165],[135,205],[170,245],[205,280],[235,315],[270,350]];
  const band=bands[Math.max(0,Math.min(7,(Number(gear)||1)-1))];
  const t=Math.max(0,Math.min(1,((Number(speedKph)||0)-band[0])/Math.max(1,band[1]-band[0])));
  return Math.round(8500+t*3500);
}
function simulateVehicleDynamicsV196(vehicle,stepMs){
  const track=activeRaceSnapshotV187?.track;
  if(!vehicle||!track||!(stepMs>0))return false;
  const previousRaceProgress=Number(vehicle.raceProgress)||0;
  const pitControl=updatePitPreStepV205(vehicle,stepMs);
  if(pitControl.stationary){
    vehicle.speedKph=0;vehicle.targetSpeedKph=0;vehicle.throttle=0;vehicle.brake=1;vehicle.accelerationMps2=0;vehicle.gear=1;vehicle.rpm=8500;
    return true;
  }
  const targetData=getSpeedTargetAtProgressV195(vehicle.progress);
  const baseTarget=Math.max(60,Number(targetData?.targetKph)||250);
  const phase=getCornerPhaseAtProgressV194(vehicle.progress)?.phase||'STRAIGHT';
  const tyreGrip=Math.max(TYRE_CONFIG_V203.minGrip,Math.min(TYRE_CONFIG_V203.maxGrip,Number(vehicle.tyreGrip)||1));
  const tyreCornerFactor=(phase==='TURN_IN'||phase==='APEX'||phase==='EXIT')?tyreGrip:1;
  updateActiveAeroAndOvertakeV202(vehicle,stepMs);
  updateDriverPaceStateV200(vehicle,stepMs);
  const rawDriverPaceMultiplier=driverTargetMultiplierV200(vehicle,phase);
  const longRunPaceMultiplier=longRunPaceCorrectionV209(vehicle);
  const driverPaceMultiplier=rawDriverPaceMultiplier*longRunPaceMultiplier;
  vehicle.rawDriverPaceMultiplier=rawDriverPaceMultiplier;
  vehicle.longRunPaceMultiplier=longRunPaceMultiplier;
  vehicle.longRunPaceBias=longRunPaceBiasV209(vehicle);
  vehicle.driverPaceMultiplier=driverPaceMultiplier;
  const racecraftNorm=driverSkillNormV200(vehicle,'racecraft');
  const aggressionNorm=driverSkillNormV200(vehicle,'aggression');
  const towStrength=clamp01V198(vehicle.slipstreamStrength)*(1+racecraftNorm*.05+Math.max(0,aggressionNorm)*.025);
  const rawAeroGrip=Math.max(.85,Math.min(1,Number(vehicle.aeroGripMultiplier)||1));
  const dirtyAirRecovery=Math.max(0,racecraftNorm)*.08;
  const aeroGripMultiplier=Math.min(1,rawAeroGrip+(1-rawAeroGrip)*dirtyAirRecovery);
  let maxTarget=baseTarget*driverPaceMultiplier*aeroGripMultiplier*tyreCornerFactor+towStrength*SLIPSTREAM_CONFIG_V198.maxTargetBonusKph+(Number(vehicle.battleSpeedBiasKph)||0);
  maxTarget*=raceFlagSpeedFactorV214();
  const current=Math.max(0,Number(vehicle.speedKph)||0);
  const preError=maxTarget-current;
  const preThrottle=preError>1.5?Math.max(.08,Math.min(1,preError/45)):preError>=-1.5?.12:0;
  const preBrake=preError<-1.5?Math.max(.08,Math.min(1,(-preError)/55)):0;
  const incidentState=updateDrivingIncidentsV204(vehicle,stepMs,phase,{throttle:preThrottle,brake:preBrake});
  maxTarget*=incidentState.speedFactor;
  if(Number.isFinite(pitControl.speedCapKph))maxTarget=Math.min(maxTarget,pitControl.speedCapKph);
  const error=maxTarget-current;
  const accelBase=Math.max(0.5,Number(track?.geometry?.referenceAccelMps2)||8.5);
  let brakeBase=Math.max(1,Number(track?.geometry?.referenceBrakeDecelMps2)||20)*tyreGrip*incidentState.brakeFactor;
  let throttle=0,brake=0,accelMps2=0;
  if(error>1.5){
    throttle=Math.max(.08,Math.min(1,error/45))*incidentState.throttleFactor;
    const dragRelief=Math.max(0,Number(vehicle.slipstreamDragReduction)||0);
    const highSpeedFade=Math.max(.35,1-current/520+dragRelief*.45);
    const tractionGrip=phase==='EXIT'?tyreGrip:1;
    accelMps2=accelBase*throttle*highSpeedFade*tractionGrip;
  }else if(error<-1.5){
    brake=Math.max(.08,Math.min(1,(-error)/55));
    accelMps2=-brakeBase*brake;
  }else{
    throttle=.12*incidentState.throttleFactor;
    accelMps2=0;
  }
  const propulsionThrottle=accelMps2>0?throttle:0;
  const energyState=updateEnergySystemV201(vehicle,stepMs,phase,propulsionThrottle,brake);
  if(accelMps2>0)accelMps2*=energyState.powerUnitFactor;
  const dt=stepMs/1000;
  const nextMps=Math.max(0,current/3.6+accelMps2*dt);
  const straightCapBase=(Number(track?.geometry?.maxStraightKph)||335)+towStrength*SLIPSTREAM_CONFIG_V198.maxTargetBonusKph;
  const straightCap=Number.isFinite(pitControl.speedCapKph)?Math.min(straightCapBase,pitControl.speedCapKph):straightCapBase;
  const nextKph=Math.max(0,Math.min(straightCap,nextMps*3.6));
  const avgMps=((current+nextKph)/2)/3.6;
  const distanceMeters=avgMps*dt;
  vehicle.speedKph=nextKph;
  vehicle.targetSpeedKph=maxTarget;
  vehicle.throttle=throttle;
  vehicle.brake=brake;
  vehicle.accelerationMps2=accelMps2;
  vehicle.gear=gearForSpeedV196(nextKph);
  vehicle.rpm=rpmForSpeedAndGearV196(nextKph,vehicle.gear);
  updateTyreSystemV203(vehicle,stepMs,phase);
  vehicle.travel+=distanceMeters/Math.max(1,Number(track.lengthMeters)||1);
  syncVehicleRaceMetricsV190(vehicle,track);
  updatePitPostStepV205(vehicle,previousRaceProgress);
  return true;
}

function markRaceFinishersRecoveryG(){
  const snapshot=activeRaceSnapshotV187;
  if(!snapshot||f1ScreenStateV185!=='RACE')return false;
  const totalLaps=Math.max(1,Number(snapshot.totalLaps)||DEFAULT_TOTAL_LAPS_V190);
  let changed=false;
  const newlyFinished=raceMotionV189.vehicles
    .filter(vehicle=>!vehicle.finished&&Number(vehicle.raceProgress)>=totalLaps)
    .sort((a,b)=>Number(b.raceProgress)-Number(a.raceProgress));
  for(const vehicle of newlyFinished){
    finishCounterRecoveryG+=1;
    vehicle.finished=true;
    vehicle.finishPosition=finishCounterRecoveryG;
    vehicle.finishedAtSimMs=simClockV192.simTimeMs;
    vehicle.travel=Math.max(0,totalLaps-Number(vehicle.startOffset||0));
    vehicle.speedKph=0;
    vehicle.targetSpeedKph=0;
    vehicle.throttle=0;
    vehicle.brake=0;
    syncVehicleRaceMetricsV190(vehicle,snapshot.track);
    changed=true;
  }
  return changed;
}
function buildRaceResultRecoveryG(){
  const snapshot=activeRaceSnapshotV187;
  if(!snapshot)return null;
  const rows=[...raceMotionV189.vehicles]
    .sort((a,b)=>{
      const ap=Number(a.finishPosition)||9999,bp=Number(b.finishPosition)||9999;
      if(ap!==bp)return ap-bp;
      return Number(b.raceProgress||0)-Number(a.raceProgress||0);
    })
    .map((vehicle,index)=>Object.freeze({
      position:Number(vehicle.finishPosition)||index+1,
      contactId:String(vehicle.id||''),
      name:String(vehicle.driver?.name||'Driver'),
      gridPosition:Number(vehicle.driver?.gridPosition)||index+1,
      finishedAtSimMs:Number(vehicle.finishedAtSimMs)||simClockV192.simTimeMs,
      tyreCompound:String(vehicle.tyreCompound||'MEDIUM'),
      raceProgress:Number(vehicle.raceProgress)||0
    }));
  return Object.freeze({
    trackId:String(snapshot.trackId||''),
    trackName:String(snapshot.track?.name||'Track'),
    totalLaps:Number(snapshot.totalLaps)||DEFAULT_TOTAL_LAPS_V190,
    simTimeMs:simClockV192.simTimeMs,
    rows:Object.freeze(rows)
  });
}
function formatRaceTimeRecoveryG(ms){
  const total=Math.max(0,Math.floor(Number(ms)||0));
  const minutes=Math.floor(total/60000);
  const seconds=Math.floor((total%60000)/1000);
  const millis=total%1000;
  return String(minutes).padStart(2,'0')+':'+String(seconds).padStart(2,'0')+'.'+String(millis).padStart(3,'0');
}
function renderFinishingRecoveryG(){
  const result=activeRaceResultRecoveryG;
  const title=document.getElementById('f1RacingFinishingTitleRecoveryG');
  const summary=document.getElementById('f1RacingFinishingSummaryRecoveryG');
  const winner=result?.rows?.[0];
  if(title)title.textContent=winner?winner.name+' 우승':'RACE FINISHED';
  if(summary)summary.textContent=result
    ?result.trackName+' · '+result.totalLaps+' LAPS · '+result.rows.length+' DRIVERS · '+formatRaceTimeRecoveryG(result.simTimeMs)
    :'결과를 정리하고 있습니다.';
}
function renderPodiumRecoveryG(){
  const box=document.getElementById('f1RacingPodiumRowsRecoveryG');
  if(!box)return false;
  const rows=(activeRaceResultRecoveryG?.rows||[]).slice(0,3);
  box.innerHTML=rows.length?rows.map((row,index)=>
    '<div class="f1-racing-podium-place-recovery-g p'+(index+1)+'"><span>P'+(index+1)+'</span><strong>'+escapeHtml(row.name)+'</strong><small>GRID P'+String(row.gridPosition).padStart(2,'0')+'</small></div>'
  ).join(''):'<div class="f1-racing-lifecycle-empty-recovery-g">Podium 결과가 없습니다.</div>';
  return true;
}
function renderResultRecoveryG(){
  const title=document.getElementById('f1RacingResultTitleRecoveryG');
  const list=document.getElementById('f1RacingResultRowsRecoveryG');
  const result=activeRaceResultRecoveryG;
  if(title)title.textContent=result?result.trackName+' · FINAL RESULT':'FINAL RESULT';
  if(!list)return false;
  list.innerHTML=result?.rows?.length?result.rows.map(row=>
    '<div class="f1-racing-result-row-recovery-g"><span>P'+String(row.position).padStart(2,'0')+'</span><strong>'+escapeHtml(row.name)+'</strong><small>GRID P'+String(row.gridPosition).padStart(2,'0')+' · '+escapeHtml(row.tyreCompound)+'</small><time>'+formatRaceTimeRecoveryG(row.finishedAtSimMs)+'</time></div>'
  ).join(''):'<div class="f1-racing-lifecycle-empty-recovery-g">결과가 없습니다.</div>';
  return true;
}
function finishRaceRecoveryG(force=false){
  if(f1ScreenStateV185!=='RACE'||!activeRaceSnapshotV187||!raceMotionV189.vehicles.length)return false;
  if(force){
    const unfinished=computeRaceStandingsV191().map(row=>row.vehicle).filter(vehicle=>!vehicle.finished);
    for(const vehicle of unfinished){
      finishCounterRecoveryG+=1;
      vehicle.finished=true;
      vehicle.finishPosition=finishCounterRecoveryG;
      vehicle.finishedAtSimMs=simClockV192.simTimeMs;
    }
  }else{
    markRaceFinishersRecoveryG();
    if(raceMotionV189.vehicles.some(vehicle=>!vehicle.finished))return false;
  }
  updateRaceProgressHudV190();
  pauseRaceMotionV189(false);
  simClockV192.paused=true;
  activeRaceResultRecoveryG=buildRaceResultRecoveryG();
  if(!setScreenStateV185('FINISHING'))setScreenStateV185('FINISHING',{force:true});
  renderFinishingRecoveryG();
  const chip=document.getElementById('f1RacingPhaseChipV180');
  if(chip)chip.textContent='FINISHING';
  return true;
}
function updateRaceLifecycleRecoveryG(){
  if(f1ScreenStateV185!=='RACE')return false;
  markRaceFinishersRecoveryG();
  const allFinished=raceMotionV189.vehicles.length>0&&raceMotionV189.vehicles.every(vehicle=>vehicle.finished);
  if(allFinished)return finishRaceRecoveryG(false);
  return false;
}
function showPodiumRecoveryG(){
  if(f1ScreenStateV185!=='FINISHING')return false;
  if(!setScreenStateV185('PODIUM'))return false;
  renderPodiumRecoveryG();
  const chip=document.getElementById('f1RacingPhaseChipV180');if(chip)chip.textContent='PODIUM';
  return true;
}
function showResultRecoveryG(){
  if(!['FINISHING','PODIUM'].includes(f1ScreenStateV185))return false;
  if(!setScreenStateV185('RESULT'))return false;
  renderResultRecoveryG();
  const chip=document.getElementById('f1RacingPhaseChipV180');if(chip)chip.textContent='RESULT';
  return true;
}
function returnToSetupRecoveryG(){
  if(raceTransitionTimerV187){clearTimeout(raceTransitionTimerV187);raceTransitionTimerV187=0}
  resetRaceMotionV189();
  activeRaceSnapshotV187=null;
  activeRaceResultRecoveryG=null;
  finishCounterRecoveryG=0;
  setScreenStateV185('SETUP',{force:true});
  renderContacts();renderSelected();renderTrackChoicesV186();updateTrackFoundationStatusV182();renderTrackMapV183();syncSetupActionV187();
  const chip=document.getElementById('f1RacingPhaseChipV180');if(chip)chip.textContent='RACE SETUP';
  return true;
}
function newRaceSameSettingsRecoveryG(){
  returnToSetupRecoveryG();
  return startRaceFromSetupV187();
}
function bindRaceLifecycleRecoveryG(){
  const handlers={
    f1RacingShowPodiumRecoveryG:showPodiumRecoveryG,
    f1RacingFinishingResultRecoveryG:showResultRecoveryG,
    f1RacingPodiumResultRecoveryG:showResultRecoveryG,
    f1RacingPodiumSetupRecoveryG:returnToSetupRecoveryG,
    f1RacingResultNewRaceRecoveryG:newRaceSameSettingsRecoveryG,
    f1RacingResultSetupRecoveryG:returnToSetupRecoveryG
  };
  for(const [id,handler] of Object.entries(handlers)){
    const button=document.getElementById(id);
    if(button&&!button.dataset.f1LifecycleBound){button.dataset.f1LifecycleBound='1';button.addEventListener('click',handler)}
  }
}

function simulateRaceStepV192(stepMs){
  if(simClockV192.paused||!(stepMs>0))return false;
  simClockV192.simTimeMs+=stepMs;
  updateSlipstreamStatesV198();
  updateDirtyAirStatesV199();
  if(raceFlagStateV214.flag==='GREEN'){
    updateTrafficAndDefenceV207();
    updatePassStateMachineV208(stepMs);
  }else{
    for(const vehicle of raceMotionV189.vehicles){
      vehicle.defenceActive=false;
      vehicle.battleSpeedBiasKph=0;
      if(vehicle.racingLineMode==='ATTACK_INSIDE')vehicle.racingLineMode='IDEAL';
    }
  }
  updatePitStrategiesV206(stepMs);
  for(const vehicle of raceMotionV189.vehicles){
    if(vehicle.finished)continue;
    simulateVehicleDynamicsV196(vehicle,stepMs);
  }
  if(updateRaceLifecycleRecoveryG())return false;
  return true;
}
function raceFrameV189(timestamp){
  if(!raceMotionV189.running)return;
  if(!raceMotionV189.lastTimestamp)raceMotionV189.lastTimestamp=timestamp;
  const delta=Math.min(50,Math.max(0,timestamp-raceMotionV189.lastTimestamp));
  raceMotionV189.lastTimestamp=timestamp;
  if(!simClockV192.paused){
    simClockV192.accumulatorMs+=delta*simClockV192.timeScale;
    let steps=0;
    while(simClockV192.accumulatorMs>=simClockV192.fixedStepMs&&steps<simClockV192.maxStepsPerFrame){
      const continued=simulateRaceStepV192(simClockV192.fixedStepMs);
      simClockV192.accumulatorMs-=simClockV192.fixedStepMs;
      steps+=1;
      if(!continued||!raceMotionV189.running)break;
    }
    if(steps>=simClockV192.maxStepsPerFrame)simClockV192.accumulatorMs=0;
  }
  if(!raceMotionV189.running)return;
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
  bindSimulationControlsV192();
  syncSimulationControlsV192();
  raceMotionV189.rafId=requestAnimationFrame(raceFrameV189);return true;
}
function pauseRaceMotionV189(suspended=false){
  raceMotionV189.running=false;raceMotionV189.suspended=Boolean(suspended);raceMotionV189.lastTimestamp=0;
  if(raceMotionV189.rafId)cancelAnimationFrame(raceMotionV189.rafId);raceMotionV189.rafId=0;return true;
}
function resetRaceMotionV189(){
  pauseRaceMotionV189(false);raceMotionV189.vehicles=[];raceMotionV189.snapshotCreatedAt='';raceGeometryV193=null;
  simClockV192.paused=false;simClockV192.timeScale=1;simClockV192.simTimeMs=0;simClockV192.accumulatorMs=0;
  raceFlagStateV214={flag:'GREEN',reason:'',sinceSimMs:0};
  const layer=document.getElementById('f1RacingRaceVehicleLayerV188');if(layer)layer.replaceChildren();
  syncSimulationControlsV192();
}
function refreshRaceGeometryV193(snapshot=activeRaceSnapshotV187,pathElement=document.getElementById('f1RacingRaceTrackPathV188')){
  if(!snapshot?.track||!pathElement||typeof window.mwsBuildF1TrackGeometryV193!=='function'){
    raceGeometryV193=null;
    return null;
  }
  raceGeometryV193=window.mwsBuildF1TrackGeometryV193(snapshot.track,pathElement);
  if(raceGeometryV193&&typeof window.mwsBuildF1CornerPhasesV194==='function'){
    raceGeometryV193=window.mwsBuildF1CornerPhasesV194(snapshot.track,raceGeometryV193);
  }
  if(raceGeometryV193&&typeof window.mwsBuildF1SpeedProfileV195==='function'){
    raceGeometryV193=window.mwsBuildF1SpeedProfileV195(snapshot.track,raceGeometryV193);
  }
  const meta=document.getElementById('f1RacingRaceMapMetaV188');
  if(meta&&raceGeometryV193){
    meta.textContent=(snapshot.track.lengthMeters/1000).toFixed(3)+' km · '+snapshot.drivers.length+' drivers · '+raceGeometryV193.samples.length+' samples · '+(raceGeometryV193.cornerPhases?.length||raceGeometryV193.corners.length)+' corners';
  }
  return raceGeometryV193;
}
function getRaceGeometryV193(){return raceGeometryV193}
function getCornerPhasesV194(){
  return (raceGeometryV193?.cornerPhases||[]).map(corner=>({...corner}));
}
function getCornerPhaseAtProgressV194(progress){
  return typeof window.mwsF1CornerPhaseAtProgressV194==='function'
    ?window.mwsF1CornerPhaseAtProgressV194(raceGeometryV193,progress)
    :null;
}
function getSpeedProfileV195(){
  return (raceGeometryV193?.speedProfile||[]).map(row=>({...row}));
}
function getSpeedTargetAtProgressV195(progress){
  return typeof window.mwsF1SpeedTargetAtProgressV195==='function'
    ?window.mwsF1SpeedTargetAtProgressV195(raceGeometryV193,progress)
    :null;
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
    '<span class="gear">--</span><span class="rpm">----</span><span class="speed">---</span><span class="last">--:--.---</span><span class="best">--:--.---</span><span class="gap" data-f1-gap>'+(pos===1?'LEADER':'--.---')+'</span><span class="interval" data-f1-interval>--</span><span class="tyre">--</span><span class="s1">--.---</span><span class="s2">--.---</span><span class="s3">--.---</span>'+
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
  const annotations=document.getElementById('f1RacingRaceAnnotationsRecoveryB');
  if(name)name.textContent=String(snapshot.track.name||'TRACK').toUpperCase();
  if(count)count.textContent=String(snapshot.drivers.length);
  if(status)status.textContent='PRE-RACE';
  syncRaceFlagHudV214();
  if(lap)lap.textContent='1 / '+(Number(snapshot.totalLaps)||DEFAULT_TOTAL_LAPS_V190);
  if(list)list.innerHTML=snapshot.drivers.map(timingRowV188).join('');
  ensureTopThreeStylesV213();
  if(mapMeta)mapMeta.textContent=(snapshot.track.lengthMeters/1000).toFixed(3)+' km · '+snapshot.drivers.length+' drivers';
  if(svg)svg.setAttribute('viewBox',(snapshot.track.viewBox||[0,0,1000,600]).join(' '));
  if(path)path.setAttribute('d',snapshot.track.path||'');
  if(glow)glow.setAttribute('d',snapshot.track.path||'');
  if(path&&annotations)renderTrackMarkersV211(annotations,path,snapshot.track,'race');
  if(path)refreshRaceGeometryV193(snapshot,path);
  bindSimulationControlsV192();
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


const F1_WORKSPACE_PANEL_META_RECOVERY_E=Object.freeze({
  timing:Object.freeze({label:'LIVE TIMING',minW:4,minH:2}),
  track:Object.freeze({label:'TRACK MAP',minW:4,minH:4}),
  commentary:Object.freeze({label:'RACE COMMENTARY',minW:3,minH:3}),
  radio:Object.freeze({label:'TEAM RADIO',minW:3,minH:2}),
  speed:Object.freeze({label:'SPEED TRAP',minW:3,minH:2})
});
const F1_WORKSPACE_DEFAULT_LAYOUT_RECOVERY_E=Object.freeze({
  version:4,
  panels:Object.freeze({
    timing:Object.freeze({x:0,y:0,w:12,h:2,hidden:false,maximized:false,tabGroup:''}),
    track:Object.freeze({x:0,y:2,w:7,h:6,hidden:false,maximized:false,tabGroup:''}),
    commentary:Object.freeze({x:7,y:2,w:5,h:3,hidden:false,maximized:false,tabGroup:''}),
    radio:Object.freeze({x:7,y:5,w:5,h:3,hidden:false,maximized:false,tabGroup:'race-side'}),
    speed:Object.freeze({x:7,y:5,w:5,h:3,hidden:false,maximized:false,tabGroup:'race-side'})
  }),
  activeTabs:Object.freeze({'race-side':'radio'})
});
let workspaceLayoutRecoveryE=null;
let workspacePointerRecoveryE=null;

function cloneWorkspaceLayoutRecoveryE(layout){
  return JSON.parse(JSON.stringify(layout));
}

const F1_WORKSPACE_MAX_ROWS_RECOVERY_I=32;
function workspaceMinSizeRecoveryI(id){
  const meta=F1_WORKSPACE_PANEL_META_RECOVERY_E[id]||{};
  return {w:Math.max(2,Number(meta.minW)||2),h:Math.max(2,Number(meta.minH)||2)};
}
function workspaceClampRectRecoveryI(id,rect={}){
  const min=workspaceMinSizeRecoveryI(id);
  const w=Math.max(min.w,Math.min(12,Math.round(Number(rect.w)||min.w)));
  const h=Math.max(min.h,Math.min(12,Math.round(Number(rect.h)||min.h)));
  const x=Math.max(0,Math.min(12-w,Math.round(Number(rect.x)||0)));
  const y=Math.max(0,Math.min(F1_WORKSPACE_MAX_ROWS_RECOVERY_I-h,Math.round(Number(rect.y)||0)));
  return {x,y,w,h};
}
function workspaceRectsOverlapRecoveryI(a,b){
  if(!a||!b)return false;
  return a.x<a.x+b.w&&b.x<b.x+a.w&&a.y<a.y+b.h&&b.y<b.y+a.h;
}
function workspaceRectIntersectsRecoveryI(a,b){
  if(!a||!b)return false;
  return a.x<b.x+b.w&&b.x<a.x+a.w&&a.y<b.y+b.h&&b.y<a.y+a.h;
}
function workspaceSlotMembersRecoveryI(layout,id){
  const state=layout?.panels?.[id];
  if(!state)return [];
  const group=String(state.tabGroup||'');
  return group
    ?Object.keys(layout.panels).filter(memberId=>String(layout.panels[memberId]?.tabGroup||'')===group)
    :[id];
}
function workspaceSlotLeadersRecoveryI(layout){
  const slots=[],seen=new Set();
  for(const id of Object.keys(F1_WORKSPACE_PANEL_META_RECOVERY_E)){
    const state=layout?.panels?.[id];if(!state)continue;
    const group=String(state.tabGroup||'');
    const key=group?'tab:'+group:'panel:'+id;
    if(seen.has(key))continue;
    seen.add(key);
    const members=workspaceSlotMembersRecoveryI(layout,id);
    const visible=members.filter(memberId=>!layout.panels[memberId]?.hidden);
    if(!visible.length)continue;
    const active=group&&visible.includes(layout.activeTabs?.[group])?layout.activeTabs[group]:visible[0];
    slots.push({id:active,key,members,rect:workspaceClampRectRecoveryI(active,layout.panels[active])});
  }
  return slots;
}
function workspaceApplySlotRectRecoveryI(layout,id,rect){
  const next=workspaceClampRectRecoveryI(id,rect);
  for(const memberId of workspaceSlotMembersRecoveryI(layout,id)){
    Object.assign(layout.panels[memberId],next);
  }
  return next;
}
function workspaceFindFreeRectRecoveryI(id,desired,occupied){
  const base=workspaceClampRectRecoveryI(id,desired);
  const fits=rect=>!occupied.some(other=>workspaceRectIntersectsRecoveryI(rect,other));
  if(fits(base))return base;
  const candidates=[];
  for(let y=0;y<=F1_WORKSPACE_MAX_ROWS_RECOVERY_I-base.h;y++){
    for(let x=0;x<=12-base.w;x++){
      const rect={x,y,w:base.w,h:base.h};
      if(!fits(rect))continue;
      const distance=Math.abs(x-base.x)*2+Math.abs(y-base.y);
      candidates.push({rect,score:distance+y*.02+x*.005});
    }
  }
  candidates.sort((a,b)=>a.score-b.score);
  return candidates[0]?.rect||base;
}
function workspaceDetachTabRecoveryI(layout,id){
  const state=layout?.panels?.[id];
  const group=String(state?.tabGroup||'');
  if(!state||!group)return;
  state.tabGroup='';
  const remaining=Object.keys(layout.panels).filter(memberId=>String(layout.panels[memberId]?.tabGroup||'')===group);
  if(remaining.length<2){
    remaining.forEach(memberId=>{layout.panels[memberId].tabGroup=''});
    delete layout.activeTabs[group];
  }else if(!remaining.includes(layout.activeTabs[group])){
    layout.activeTabs[group]=remaining[0];
  }
}
function workspaceReflowRecoveryI(layout,preferredId='',preferredRect=null){
  if(!layout?.panels)return layout;
  const preferredMembers=preferredId?workspaceSlotMembersRecoveryI(layout,preferredId):[];
  const preferredKey=preferredId
    ?(layout.panels[preferredId]?.tabGroup?'tab:'+layout.panels[preferredId].tabGroup:'panel:'+preferredId)
    :'';
  const slots=workspaceSlotLeadersRecoveryI(layout);
  const ordered=[...slots].sort((a,b)=>{
    if(a.key===preferredKey)return -1;
    if(b.key===preferredKey)return 1;
    if(a.rect.y!==b.rect.y)return a.rect.y-b.rect.y;
    return a.rect.x-b.rect.x;
  });
  const occupied=[];
  for(const slot of ordered){
    let desired=slot.rect;
    if(slot.key===preferredKey&&preferredRect)desired=workspaceClampRectRecoveryI(slot.id,preferredRect);
    const placed=workspaceFindFreeRectRecoveryI(slot.id,desired,occupied);
    workspaceApplySlotRectRecoveryI(layout,slot.id,placed);
    occupied.push(placed);
  }
  for(const group of new Set(Object.values(layout.panels).map(state=>String(state.tabGroup||'')).filter(Boolean))){
    const members=Object.keys(layout.panels).filter(id=>String(layout.panels[id]?.tabGroup||'')===group);
    const visible=members.filter(id=>!layout.panels[id].hidden);
    if(!visible.length)continue;
    const leader=visible.includes(layout.activeTabs[group])?layout.activeTabs[group]:visible[0];
    layout.activeTabs[group]=leader;
    const rect=workspaceClampRectRecoveryI(leader,layout.panels[leader]);
    members.forEach(id=>Object.assign(layout.panels[id],rect));
  }
  return workspaceCompactRecoveryK(layout,preferredId);
}
function workspaceOverlapPairsRecoveryI(layout=workspaceLayoutRecoveryE){
  const slots=workspaceSlotLeadersRecoveryI(layout);
  const pairs=[];
  for(let i=0;i<slots.length;i++){
    for(let j=i+1;j<slots.length;j++){
      if(workspaceRectIntersectsRecoveryI(slots[i].rect,slots[j].rect))pairs.push([slots[i].id,slots[j].id]);
    }
  }
  return pairs;
}


let workspaceRepairReportRecoveryK={repaired:false,reasons:[],version:4};

function workspaceRawIssuesRecoveryK(raw){
  const reasons=[];
  const candidate=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:null;
  if(!candidate){reasons.push('missing-layout');return reasons}
  if(Number(candidate.version)<4)reasons.push('legacy-version');
  const panels=candidate.panels&&typeof candidate.panels==='object'?candidate.panels:{};
  const rects=[];
  for(const id of Object.keys(F1_WORKSPACE_PANEL_META_RECOVERY_E)){
    const row=panels[id];
    if(!row||typeof row!=='object'){reasons.push('missing-panel:'+id);continue}
    const min=workspaceMinSizeRecoveryI(id);
    const x=Math.round(Number(row.x)),y=Math.round(Number(row.y)),w=Math.round(Number(row.w)),h=Math.round(Number(row.h));
    if(![x,y,w,h].every(Number.isFinite)){reasons.push('invalid-rect:'+id);continue}
    if(w<min.w||h<min.h||w>12||h>12||x<0||x+w>12||y<0||y+h>F1_WORKSPACE_MAX_ROWS_RECOVERY_I)reasons.push('out-of-bounds:'+id);
    rects.push({id,x,y,w,h,tabGroup:String(row.tabGroup||'')});
  }
  for(let i=0;i<rects.length;i++){
    for(let j=i+1;j<rects.length;j++){
      const a=rects[i],b=rects[j];
      if(a.tabGroup&&a.tabGroup===b.tabGroup)continue;
      if(workspaceRectIntersectsRecoveryI(a,b))reasons.push('overlap:'+a.id+':'+b.id);
    }
  }
  const groups=new Map();
  for(const rect of rects){
    if(!rect.tabGroup)continue;
    if(!groups.has(rect.tabGroup))groups.set(rect.tabGroup,[]);
    groups.get(rect.tabGroup).push(rect);
  }
  for(const [group,members] of groups){
    if(members.length<2){reasons.push('orphan-tab:'+group);continue}
    const first=members[0];
    for(const member of members.slice(1)){
      if(member.x!==first.x||member.y!==first.y||member.w!==first.w||member.h!==first.h){reasons.push('tab-rect-mismatch:'+group);break}
    }
  }
  return [...new Set(reasons)];
}
function workspaceCompactRecoveryK(layout,preferredId=''){
  if(!layout?.panels)return layout;
  const preferredKey=preferredId
    ?(layout.panels[preferredId]?.tabGroup?'tab:'+layout.panels[preferredId].tabGroup:'panel:'+preferredId)
    :'';
  const slotKey=slot=>slot.key;
  let slots=workspaceSlotLeadersRecoveryI(layout).sort((a,b)=>a.rect.y-b.rect.y||a.rect.x-b.rect.x);
  for(const slot of slots){
    if(slotKey(slot)===preferredKey)continue;
    let rect=workspaceClampRectRecoveryI(slot.id,layout.panels[slot.id]);
    const others=()=>workspaceSlotLeadersRecoveryI(layout).filter(other=>other.key!==slot.key).map(other=>other.rect);
    let moved=true;
    while(moved){
      moved=false;
      if(rect.y>0){
        const up={...rect,y:rect.y-1};
        if(!others().some(other=>workspaceRectIntersectsRecoveryI(up,other))){rect=up;moved=true}
      }
      if(rect.x>0){
        const left={...rect,x:rect.x-1};
        if(!others().some(other=>workspaceRectIntersectsRecoveryI(left,other))){rect=left;moved=true}
      }
    }
    workspaceApplySlotRectRecoveryI(layout,slot.id,rect);
  }
  return layout;
}
function workspaceUsedRowsRecoveryK(layout=workspaceLayoutRecoveryE){
  const slots=workspaceSlotLeadersRecoveryI(layout);
  return Math.max(4,...slots.map(slot=>slot.rect.y+slot.rect.h));
}
function workspaceAuditLayoutRecoveryK(raw){
  const before=workspaceRawIssuesRecoveryK(raw);
  const layout=normalizeWorkspaceLayoutRecoveryE(raw);
  const overlaps=workspaceOverlapPairsRecoveryI(layout);
  return {layout:cloneWorkspaceLayoutRecoveryE(layout),overlaps:overlaps.map(pair=>pair.slice()),before,repaired:before.length>0||overlaps.length>0};
}

function normalizeWorkspaceLayoutRecoveryE(raw){
  const defaults=cloneWorkspaceLayoutRecoveryE(F1_WORKSPACE_DEFAULT_LAYOUT_RECOVERY_E);
  const candidate=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
  const rawIssues=workspaceRawIssuesRecoveryK(candidate);
  const source=Number(candidate.version)>=3?candidate:{};
  const result={version:4,panels:{},activeTabs:{}};
  for(const id of Object.keys(F1_WORKSPACE_PANEL_META_RECOVERY_E)){
    const base=defaults.panels[id];
    const row=source.panels?.[id]&&typeof source.panels[id]==='object'?source.panels[id]:{};
    let w=Math.max(2,Math.min(12,Math.round(Number(row.w)||base.w)));
    let h=Math.max(2,Math.min(10,Math.round(Number(row.h)||base.h)));
    let x=Math.max(0,Math.min(12-w,Math.round(Number(row.x)||base.x)));
    let y=Math.max(0,Math.min(12-h,Math.round(Number(row.y)||base.y)));
    result.panels[id]={
      x,y,w,h,
      hidden:Object.prototype.hasOwnProperty.call(row,'hidden')?Boolean(row.hidden):Boolean(base.hidden),
      maximized:Object.prototype.hasOwnProperty.call(row,'maximized')?Boolean(row.maximized):Boolean(base.maximized),
      tabGroup:Object.prototype.hasOwnProperty.call(row,'tabGroup')?String(row.tabGroup||''):String(base.tabGroup||'')
    };
  }
  for(const [group,id] of Object.entries(defaults.activeTabs||{})){
    if(result.panels[id]?.tabGroup===group)result.activeTabs[group]=id;
  }
  for(const [group,id] of Object.entries(source.activeTabs||{})){
    if(result.panels[id]?.tabGroup===group)result.activeTabs[group]=id;
  }
  const maxIds=Object.keys(result.panels).filter(id=>result.panels[id].maximized);
  maxIds.slice(1).forEach(id=>{result.panels[id].maximized=false});
  let normalized=workspaceReflowRecoveryI(result);
  let overlaps=workspaceOverlapPairsRecoveryI(normalized);
  if(overlaps.length){
    const fallback=cloneWorkspaceLayoutRecoveryE(F1_WORKSPACE_DEFAULT_LAYOUT_RECOVERY_E);
    fallback.version=4;
    normalized=workspaceReflowRecoveryI(fallback);
    overlaps=workspaceOverlapPairsRecoveryI(normalized);
    rawIssues.push('fallback-default-layout');
  }
  normalized.version=4;
  workspaceRepairReportRecoveryK={repaired:rawIssues.length>0,reasons:[...new Set(rawIssues)],version:4,overlapCount:overlaps.length};
  return normalized;
}
function readWorkspaceLayoutRecoveryE(){
  const saved=readPersistedF1SettingsRecoveryD()?.workspaceLayout;
  workspaceLayoutRecoveryE=normalizeWorkspaceLayoutRecoveryE(saved);
  return workspaceLayoutRecoveryE;
}
function persistWorkspaceLayoutRecoveryE(){
  if(!workspaceLayoutRecoveryE)return false;
  return persistF1SettingsRecoveryD({workspaceLayout:cloneWorkspaceLayoutRecoveryE(workspaceLayoutRecoveryE)});
}
function workspacePanelRecoveryE(id){
  return document.querySelector('#f1RacingWorkspaceRecoveryE [data-f1-workspace-panel="'+id+'"]');
}
function workspacePanelLabelRecoveryE(id){
  return F1_WORKSPACE_PANEL_META_RECOVERY_E[id]?.label||String(id||'PANEL').toUpperCase();
}
function workspaceGroupMembersRecoveryE(group){
  if(!group||!workspaceLayoutRecoveryE)return [];
  return Object.keys(workspaceLayoutRecoveryE.panels).filter(id=>workspaceLayoutRecoveryE.panels[id].tabGroup===group);
}
function renderWorkspaceTabsRecoveryE(){
  const workspace=document.getElementById('f1RacingWorkspaceRecoveryE');
  if(!workspace||!workspaceLayoutRecoveryE)return;
  workspace.querySelectorAll('.f1-racing-workspace-tabs-recovery-e').forEach(node=>node.remove());
  for(const id of Object.keys(workspaceLayoutRecoveryE.panels)){
    const state=workspaceLayoutRecoveryE.panels[id];
    const group=state.tabGroup;
    if(!group)continue;
    const members=workspaceGroupMembersRecoveryE(group);
    if(members.length<2)continue;
    const active=workspaceLayoutRecoveryE.activeTabs[group]&&members.includes(workspaceLayoutRecoveryE.activeTabs[group])
      ?workspaceLayoutRecoveryE.activeTabs[group]
      :members[0];
    workspaceLayoutRecoveryE.activeTabs[group]=active;
    if(id!==active)continue;
    const panel=workspacePanelRecoveryE(id);
    const title=panel?.querySelector('.f1-racing-panel-title-v188');
    if(!title)continue;
    const tabs=document.createElement('div');
    tabs.className='f1-racing-workspace-tabs-recovery-e';
    tabs.dataset.f1TabGroup=group;
    for(const memberId of members){
      const button=document.createElement('button');
      button.type='button';
      button.dataset.f1WorkspaceTab=memberId;
      button.className=memberId===active?'active':'';
      button.textContent=workspacePanelLabelRecoveryE(memberId);
      tabs.appendChild(button);
    }
    title.prepend(tabs);
  }
}
function renderWorkspaceVisibilityControlsRecoveryE(){
  const box=document.getElementById('f1RacingWorkspacePanelTogglesRecoveryE');
  if(!box||!workspaceLayoutRecoveryE)return;
  box.replaceChildren();
  for(const id of Object.keys(F1_WORKSPACE_PANEL_META_RECOVERY_E)){
    const button=document.createElement('button');
    button.type='button';
    button.className='secondary small'+(workspaceLayoutRecoveryE.panels[id].hidden?' is-hidden':'');
    button.dataset.f1WorkspaceToggle=id;
    button.textContent=workspacePanelLabelRecoveryE(id);
    button.setAttribute('aria-pressed',workspaceLayoutRecoveryE.panels[id].hidden?'false':'true');
    box.appendChild(button);
  }
}
function applyWorkspaceLayoutRecoveryE(){
  const workspace=document.getElementById('f1RacingWorkspaceRecoveryE');
  if(!workspace)return false;
  if(!workspaceLayoutRecoveryE)readWorkspaceLayoutRecoveryE();
  const maximizedId=Object.keys(workspaceLayoutRecoveryE.panels).find(id=>workspaceLayoutRecoveryE.panels[id].maximized)||'';
  workspace.classList.toggle('has-maximized',Boolean(maximizedId));
  workspace.dataset.maximized=maximizedId;
  for(const id of Object.keys(workspaceLayoutRecoveryE.panels)){
    const state=workspaceLayoutRecoveryE.panels[id];
    const panel=workspacePanelRecoveryE(id);
    if(!panel)continue;
    const members=state.tabGroup?workspaceGroupMembersRecoveryE(state.tabGroup):[];
    const activeTab=state.tabGroup?(workspaceLayoutRecoveryE.activeTabs[state.tabGroup]||members[0]||id):id;
    const tabHidden=Boolean(state.tabGroup&&activeTab!==id);
    const maxHidden=Boolean(maximizedId&&maximizedId!==id);
    panel.hidden=Boolean(state.hidden||tabHidden||maxHidden);
    panel.classList.toggle('is-maximized',maximizedId===id);
    panel.style.gridColumn=(state.x+1)+' / span '+state.w;
    panel.style.gridRow=(state.y+1)+' / span '+state.h;
    panel.dataset.f1Dock=state.x===0&&state.w===6?'left':state.x===6&&state.w===6?'right':state.y===0&&state.w===12&&state.h===4?'top':state.y===4&&state.w===12&&state.h===4?'bottom':'free';
    const maxButton=panel.querySelector('[data-f1-workspace-action="maximize"]');
    if(maxButton)maxButton.textContent=maximizedId===id?'RESTORE':'MAX';
  }
  const usedRows=workspaceUsedRowsRecoveryK(workspaceLayoutRecoveryE);
  workspace.dataset.usedRows=String(usedRows);
  if(window.matchMedia?.('(min-width:901px)').matches){
    const rowHeight=workspaceGridRowHeightRecoveryJ(workspace);
    const gap=parseFloat(getComputedStyle(workspace).gap)||0;
    workspace.style.setProperty('min-height',Math.ceil(usedRows*rowHeight+Math.max(0,usedRows-1)*gap)+'px','important');
  }else{
    workspace.style.removeProperty('min-height');
  }
  renderWorkspaceTabsRecoveryE();
  renderWorkspaceVisibilityControlsRecoveryE();
  return true;
}

function workspaceGridRowHeightRecoveryJ(workspace=document.getElementById('f1RacingWorkspaceRecoveryE')){
  if(!workspace)return 72;
  const raw=parseFloat(getComputedStyle(workspace).gridAutoRows);
  return Number.isFinite(raw)&&raw>0?raw:72;
}

const F1_TRIPLE_DOCK_COLUMNS_RECOVERY_N=Object.freeze({
  left:Object.freeze({x:0,w:4}),
  center:Object.freeze({x:4,w:4}),
  right:Object.freeze({x:8,w:4})
});
function workspaceTripleDockRectRecoveryN(id,zone){
  const col=F1_TRIPLE_DOCK_COLUMNS_RECOVERY_N[String(zone||'')];
  if(!col)return null;
  const min=workspaceMinSizeRecoveryI(id);
  if(min.w>4)return null;
  return {x:col.x,y:0,w:4,h:10};
}
function workspacePackColumnGroupRecoveryN(layout,slots,column){
  if(!slots.length)return true;
  const totalMin=slots.reduce((sum,slot)=>sum+workspaceMinSizeRecoveryI(slot.id).h,0);
  if(totalMin>10)return false;
  let extra=10-totalMin;
  let y=0;
  slots.forEach((slot,index)=>{
    const minH=workspaceMinSizeRecoveryI(slot.id).h;
    const remaining=slots.length-index;
    const add=Math.floor(extra/remaining);
    const h=minH+add;
    extra-=add;
    workspaceApplySlotRectRecoveryI(layout,slot.id,{x:column.x,y,w:4,h});
    y+=h;
  });
  return true;
}
function workspacePackRemainingTripleColumnsRecoveryN(layout,excludeId,zone){
  const selected=F1_TRIPLE_DOCK_COLUMNS_RECOVERY_N[zone];
  if(!selected)return false;
  const excludedKey=layout.panels[excludeId]?.tabGroup?'tab:'+layout.panels[excludeId].tabGroup:'panel:'+excludeId;
  const columns=Object.entries(F1_TRIPLE_DOCK_COLUMNS_RECOVERY_N)
    .filter(([,col])=>col.x!==selected.x)
    .map(([name,col])=>({name,...col}));
  const slots=workspaceSlotLeadersRecoveryI(layout)
    .filter(slot=>slot.key!==excludedKey)
    .sort((a,b)=>a.rect.y-b.rect.y||a.rect.x-b.rect.x);
  const groups=columns.map(()=>[]);
  const used=columns.map(()=>0);
  for(const slot of slots){
    let best=0;
    for(let i=1;i<columns.length;i++)if(used[i]<used[best])best=i;
    groups[best].push(slot);
    used[best]+=workspaceMinSizeRecoveryI(slot.id).h;
  }
  for(let i=0;i<columns.length;i++){
    if(!workspacePackColumnGroupRecoveryN(layout,groups[i],columns[i]))return false;
  }
  return true;
}
function workspaceDockTripleRecoveryN(id,zone){
  if(!workspaceLayoutRecoveryE?.panels[id])return false;
  const desired=workspaceTripleDockRectRecoveryN(id,zone);
  if(!desired)return false;
  workspaceDetachTabRecoveryI(workspaceLayoutRecoveryE,id);
  const source=workspaceLayoutRecoveryE.panels[id];
  source.hidden=false;source.maximized=false;
  workspaceApplySlotRectRecoveryI(workspaceLayoutRecoveryE,id,desired);
  if(!workspacePackRemainingTripleColumnsRecoveryN(workspaceLayoutRecoveryE,id,zone)){
    workspaceReflowRecoveryI(workspaceLayoutRecoveryE,id,desired);
  }
  applyWorkspaceLayoutRecoveryE();
  persistWorkspaceLayoutRecoveryE();
  return workspaceOverlapPairsRecoveryI().length===0;
}

function workspaceDockRectRecoveryJ(id,zone){
  const triple=workspaceTripleDockRectRecoveryN(id,zone);
  if(triple)return triple;
  const min=workspaceMinSizeRecoveryI(id);
  if(zone==='top')return {x:0,y:0,w:12,h:Math.max(min.h,3)};
  if(zone==='bottom'){const h=Math.max(min.h,3);return {x:0,y:10-h,w:12,h}}
  return null;
}
function workspaceRegionFreeRectRecoveryJ(id,desired,region,occupied){
  const min=workspaceMinSizeRecoveryI(id);
  const w=Math.max(min.w,Math.min(region.w,Math.round(Number(desired?.w)||min.w)));
  const h=Math.max(min.h,Math.min(region.h,Math.round(Number(desired?.h)||min.h)));
  const find=(width,height)=>{
    const maxX=region.x+region.w-width,maxY=region.y+region.h-height,candidates=[];
    for(let y=region.y;y<=maxY;y++){
      for(let x=region.x;x<=maxX;x++){
        const rect={x,y,w:width,h:height};
        if(occupied.some(other=>workspaceRectIntersectsRecoveryI(rect,other)))continue;
        const score=Math.abs(x-(Number(desired?.x)||region.x))*2+Math.abs(y-(Number(desired?.y)||region.y))+y*.01+x*.002;
        candidates.push({rect,score});
      }
    }
    candidates.sort((a,b)=>a.score-b.score);
    return candidates[0]?.rect||null;
  };
  return find(w,h)||find(min.w,min.h);
}
function workspacePackRegionRecoveryJ(layout,excludeId,region){
  const excludedKey=layout.panels[excludeId]?.tabGroup?'tab:'+layout.panels[excludeId].tabGroup:'panel:'+excludeId;
  const slots=workspaceSlotLeadersRecoveryI(layout).filter(slot=>slot.key!==excludedKey).sort((a,b)=>a.rect.y-b.rect.y||a.rect.x-b.rect.x);
  const occupied=[];
  for(const slot of slots){
    const placed=workspaceRegionFreeRectRecoveryJ(slot.id,slot.rect,region,occupied);
    if(!placed)return false;
    workspaceApplySlotRectRecoveryI(layout,slot.id,placed);
    occupied.push(placed);
  }
  return true;
}
function workspaceDockSplitRecoveryJ(id,zone){
  if(['left','center','right'].includes(String(zone||'')))return workspaceDockTripleRecoveryN(id,String(zone));
  if(!workspaceLayoutRecoveryE?.panels[id])return false;
  workspaceDetachTabRecoveryI(workspaceLayoutRecoveryE,id);
  const source=workspaceLayoutRecoveryE.panels[id];
  source.maximized=false;source.hidden=false;
  const desired=workspaceDockRectRecoveryJ(id,zone);
  if(!desired)return false;
  const placed=workspaceApplySlotRectRecoveryI(workspaceLayoutRecoveryE,id,desired);
  let region=null;
  if(zone==='left')region={x:placed.w,y:0,w:12-placed.w,h:10};
  else if(zone==='right')region={x:0,y:0,w:placed.x,h:10};
  else if(zone==='top')region={x:0,y:placed.h,w:12,h:10-placed.h};
  else if(zone==='bottom')region={x:0,y:0,w:12,h:placed.y};
  if(!region||region.w<3||region.h<2)return false;
  if(!workspacePackRegionRecoveryJ(workspaceLayoutRecoveryE,id,region))workspaceReflowRecoveryI(workspaceLayoutRecoveryE,id,placed);
  applyWorkspaceLayoutRecoveryE();persistWorkspaceLayoutRecoveryE();
  return workspaceOverlapPairsRecoveryI().length===0;
}
function workspaceAdjacentSlotsRecoveryJ(layout,id,edge){
  const source=workspaceClampRectRecoveryI(id,layout.panels[id]);
  return workspaceSlotLeadersRecoveryI(layout).filter(slot=>{
    if(slot.members.includes(id))return false;
    const rect=slot.rect;
    if(edge==='right')return rect.x===source.x+source.w&&Math.min(source.y+source.h,rect.y+rect.h)>Math.max(source.y,rect.y);
    if(edge==='bottom')return rect.y===source.y+source.h&&Math.min(source.x+source.w,rect.x+rect.w)>Math.max(source.x,rect.x);
    return false;
  });
}
function workspaceResizeSplitRecoveryJ(pointer,dw,dh){
  if(!pointer?.layoutStart?.panels?.[pointer.id])return false;
  workspaceLayoutRecoveryE=cloneWorkspaceLayoutRecoveryE(pointer.layoutStart);
  const id=pointer.id,start=workspaceClampRectRecoveryI(id,pointer.layoutStart.panels[id]),min=workspaceMinSizeRecoveryI(id);
  let targetW=Math.max(min.w,Math.min(12-start.x,start.w+dw));
  const right=workspaceAdjacentSlotsRecoveryJ(pointer.layoutStart,id,'right');
  if(right.length){
    const maxPositive=Math.min(...right.map(slot=>slot.rect.w-workspaceMinSizeRecoveryI(slot.id).w));
    const delta=Math.max(min.w-start.w,Math.min(targetW-start.w,maxPositive));
    targetW=start.w+delta;
    for(const slot of right)workspaceApplySlotRectRecoveryI(workspaceLayoutRecoveryE,slot.id,{x:slot.rect.x+delta,y:slot.rect.y,w:slot.rect.w-delta,h:slot.rect.h});
  }
  let targetH=Math.max(min.h,Math.min(12,start.h+dh));
  const bottom=workspaceAdjacentSlotsRecoveryJ(pointer.layoutStart,id,'bottom');
  if(bottom.length){
    const maxPositive=Math.min(...bottom.map(slot=>slot.rect.h-workspaceMinSizeRecoveryI(slot.id).h));
    const delta=Math.max(min.h-start.h,Math.min(targetH-start.h,maxPositive));
    targetH=start.h+delta;
    for(const slot of bottom)workspaceApplySlotRectRecoveryI(workspaceLayoutRecoveryE,slot.id,{x:slot.rect.x,y:slot.rect.y+delta,w:slot.rect.w,h:slot.rect.h-delta});
  }
  workspaceApplySlotRectRecoveryI(workspaceLayoutRecoveryE,id,{x:start.x,y:start.y,w:targetW,h:targetH});
  workspaceReflowRecoveryI(workspaceLayoutRecoveryE,id,workspaceLayoutRecoveryE.panels[id]);
  return workspaceOverlapPairsRecoveryI().length===0;
}
function workspaceDropPreviewRectRecoveryJ(drop,sourceId){
  const workspace=document.getElementById('f1RacingWorkspaceRecoveryE');
  if(!workspace||!drop)return null;
  const wr=workspace.getBoundingClientRect();
  if(drop.kind==='tab'&&drop.rect)return {left:drop.rect.left-wr.left,top:drop.rect.top-wr.top,width:drop.rect.width,height:drop.rect.height};
  let rect=null;
  if(drop.kind==='dock')rect=workspaceDockRectRecoveryJ(sourceId,drop.zone);
  if(drop.kind==='free'){
    const state=workspaceLayoutRecoveryE?.panels?.[sourceId];if(!state)return null;
    rect=workspaceClampRectRecoveryI(sourceId,{x:drop.x,y:drop.y,w:state.w,h:state.h});
  }
  if(!rect)return null;
  const col=wr.width/12,row=workspaceGridRowHeightRecoveryJ(workspace),gap=parseFloat(getComputedStyle(workspace).gap)||0;
  return {left:rect.x*col,top:rect.y*row,width:Math.max(0,rect.w*col-gap),height:Math.max(0,rect.h*row-gap)};
}

function workspaceDockLayoutRecoveryE(id,zone){
  return workspaceDockSplitRecoveryJ(id,zone);
}
function workspaceTabGroupRecoveryE(sourceId,targetId){
  if(sourceId===targetId||!workspaceLayoutRecoveryE?.panels[sourceId]||!workspaceLayoutRecoveryE?.panels[targetId])return false;
  workspaceDetachTabRecoveryI(workspaceLayoutRecoveryE,sourceId);
  const source=workspaceLayoutRecoveryE.panels[sourceId];
  const target=workspaceLayoutRecoveryE.panels[targetId];
  const group=target.tabGroup||('f1-tab-'+targetId);
  target.tabGroup=group;
  source.tabGroup=group;
  source.x=target.x;source.y=target.y;source.w=target.w;source.h=target.h;
  source.hidden=false;target.hidden=false;
  source.maximized=false;target.maximized=false;
  workspaceLayoutRecoveryE.activeTabs[group]=sourceId;
  workspaceReflowRecoveryI(workspaceLayoutRecoveryE,targetId,target);
  applyWorkspaceLayoutRecoveryE();
  persistWorkspaceLayoutRecoveryE();
  return true;
}
function workspaceSetActiveTabRecoveryE(id){
  const state=workspaceLayoutRecoveryE?.panels[id];
  if(!state?.tabGroup)return false;
  workspaceLayoutRecoveryE.activeTabs[state.tabGroup]=id;
  applyWorkspaceLayoutRecoveryE();
  persistWorkspaceLayoutRecoveryE();
  return true;
}
function workspaceTogglePanelRecoveryE(id){
  const state=workspaceLayoutRecoveryE?.panels[id];if(!state)return false;
  state.hidden=!state.hidden;
  if(!state.hidden&&state.tabGroup)workspaceLayoutRecoveryE.activeTabs[state.tabGroup]=id;
  if(state.hidden)state.maximized=false;
  workspaceReflowRecoveryI(workspaceLayoutRecoveryE,state.hidden?'':id,state.hidden?null:state);
  applyWorkspaceLayoutRecoveryE();persistWorkspaceLayoutRecoveryE();return workspaceOverlapPairsRecoveryI().length===0;
}
function workspaceToggleMaximizeRecoveryE(id){
  if(!workspaceLayoutRecoveryE?.panels[id])return false;
  const next=!workspaceLayoutRecoveryE.panels[id].maximized;
  Object.values(workspaceLayoutRecoveryE.panels).forEach(state=>{state.maximized=false});
  workspaceLayoutRecoveryE.panels[id].maximized=next;
  workspaceLayoutRecoveryE.panels[id].hidden=false;
  applyWorkspaceLayoutRecoveryE();persistWorkspaceLayoutRecoveryE();return true;
}
function resetWorkspaceRecoveryE(){
  workspaceLayoutRecoveryE=normalizeWorkspaceLayoutRecoveryE(F1_WORKSPACE_DEFAULT_LAYOUT_RECOVERY_E);
  applyWorkspaceLayoutRecoveryE();persistWorkspaceLayoutRecoveryE();return true;
}
function workspaceDropTargetRecoveryE(clientX,clientY,sourceId){
  const workspace=document.getElementById('f1RacingWorkspaceRecoveryE');
  if(!workspace)return {kind:'none'};
  const rect=workspace.getBoundingClientRect();
  const rx=(clientX-rect.left)/Math.max(1,rect.width);
  const ry=(clientY-rect.top)/Math.max(1,rect.height);
  if(ry<.08)return {kind:'dock',zone:'top'};
  if(ry>.92)return {kind:'dock',zone:'bottom'};
  if(rx<.14)return {kind:'dock',zone:'left'};
  if(rx>.86)return {kind:'dock',zone:'right'};
  if(rx>=.46&&rx<=.54)return {kind:'dock',zone:'center'};
  const target=document.elementFromPoint(clientX,clientY)?.closest?.('[data-f1-workspace-panel]');
  if(target&&target.dataset.f1WorkspacePanel!==sourceId&&!target.hidden){
    const tr=target.getBoundingClientRect();
    const tx=(clientX-tr.left)/Math.max(1,tr.width);
    const ty=(clientY-tr.top)/Math.max(1,tr.height);
    if(tx>.22&&tx<.78&&ty>.18&&ty<.82)return {kind:'tab',targetId:target.dataset.f1WorkspacePanel,rect:tr};
  }
  const state=workspaceLayoutRecoveryE.panels[sourceId];
  const col=Math.max(0,Math.min(12-state.w,Math.round(rx*12-state.w/2)));
  const rowHeight=workspaceGridRowHeightRecoveryJ(workspace);
  const row=Math.max(0,Math.min(F1_WORKSPACE_MAX_ROWS_RECOVERY_I-state.h,Math.round((clientY-rect.top)/rowHeight-state.h/2)));
  return {kind:'free',x:col,y:row};
}
function showWorkspaceDockGuideRecoveryE(drop,sourceId=''){
  const workspace=document.getElementById('f1RacingWorkspaceRecoveryE');
  const guide=document.getElementById('f1RacingWorkspaceDockGuideRecoveryE');
  if(!workspace||!guide)return;
  if(!drop||drop.kind==='none'){guide.hidden=true;return}
  const preview=workspaceDropPreviewRectRecoveryJ(drop,sourceId);
  if(!preview){guide.hidden=true;return}
  guide.hidden=false;
  guide.className='f1-racing-workspace-dock-guide-recovery-e '+(drop.kind==='tab'?'tab':drop.kind==='free'?'free':drop.zone||'');
  guide.dataset.preview=drop.kind==='tab'?'TAB':drop.kind==='free'?'MOVE':String(drop.zone||'DOCK').toUpperCase();
  guide.style.left=preview.left+'px';guide.style.top=preview.top+'px';guide.style.width=preview.width+'px';guide.style.height=preview.height+'px';
}
function beginWorkspacePointerRecoveryE(event,type,id){
  const panel=workspacePanelRecoveryE(id);
  if(!panel||!workspaceLayoutRecoveryE?.panels[id])return;
  if(type==='drag'&&event.target.closest('button'))return;
  event.preventDefault();
  workspacePointerRecoveryE={
    type,id,startX:event.clientX,startY:event.clientY,
    start:cloneWorkspaceLayoutRecoveryE(workspaceLayoutRecoveryE.panels[id]),
    layoutStart:cloneWorkspaceLayoutRecoveryE(workspaceLayoutRecoveryE),
    lastX:event.clientX,lastY:event.clientY
  };
  panel.classList.add(type==='drag'?'is-dragging':'is-resizing');
}
function onWorkspacePointerMoveRecoveryE(event){
  const state=workspacePointerRecoveryE;if(!state)return;
  state.lastX=event.clientX;state.lastY=event.clientY;
  const panel=workspacePanelRecoveryE(state.id);if(!panel)return;
  if(state.type==='drag'){
    panel.style.transform='translate('+(event.clientX-state.startX)+'px,'+(event.clientY-state.startY)+'px)';
    showWorkspaceDockGuideRecoveryE(workspaceDropTargetRecoveryE(event.clientX,event.clientY,state.id),state.id);
    return;
  }
  const workspace=document.getElementById('f1RacingWorkspaceRecoveryE');if(!workspace)return;
  const colWidth=Math.max(1,workspace.clientWidth/12);
  const rowHeight=workspaceGridRowHeightRecoveryJ(workspace);
  const dw=Math.round((event.clientX-state.startX)/colWidth);
  const dh=Math.round((event.clientY-state.startY)/rowHeight);
  workspaceResizeSplitRecoveryJ(state,dw,dh);
  applyWorkspaceLayoutRecoveryE();
}
function onWorkspacePointerUpRecoveryE(event){
  const pointer=workspacePointerRecoveryE;if(!pointer)return;
  workspacePointerRecoveryE=null;
  const panel=workspacePanelRecoveryE(pointer.id);
  if(panel){panel.classList.remove('is-dragging','is-resizing');panel.style.transform=''}
  showWorkspaceDockGuideRecoveryE(null,pointer.id);
  if(pointer.type==='resize'){persistWorkspaceLayoutRecoveryE();return}
  const drop=workspaceDropTargetRecoveryE(event.clientX,event.clientY,pointer.id);
  const state=workspaceLayoutRecoveryE.panels[pointer.id];
  if(drop.kind==='dock'){workspaceDockLayoutRecoveryE(pointer.id,drop.zone);return}
  if(drop.kind==='tab'){workspaceTabGroupRecoveryE(pointer.id,drop.targetId);return}
  if(drop.kind==='free'){
    workspaceDetachTabRecoveryI(workspaceLayoutRecoveryE,pointer.id);
    state.maximized=false;
    workspaceReflowRecoveryI(workspaceLayoutRecoveryE,pointer.id,{x:drop.x,y:drop.y,w:state.w,h:state.h});
    applyWorkspaceLayoutRecoveryE();persistWorkspaceLayoutRecoveryE();
  }
}
function addWorkspacePanelChromeRecoveryE(panel,id){
  if(!panel||panel.dataset.f1WorkspacePrepared)return;
  panel.dataset.f1WorkspacePrepared='1';
  panel.dataset.f1WorkspacePanel=id;
  panel.classList.add('f1-racing-workspace-panel-recovery-e');
  const title=panel.querySelector('.f1-racing-panel-title-v188');
  if(title){
    title.dataset.f1PanelDrag=id;
    const controls=document.createElement('div');
    controls.className='f1-racing-workspace-panel-controls-recovery-e';
    controls.innerHTML='<button type="button" data-f1-workspace-action="maximize" title="패널 최대화">MAX</button><button type="button" data-f1-workspace-action="hide" title="패널 숨기기">HIDE</button>';
    title.appendChild(controls);
  }
  const resize=document.createElement('button');
  resize.type='button';
  resize.className='f1-racing-workspace-resize-recovery-e';
  resize.dataset.f1WorkspaceResize=id;
  resize.setAttribute('aria-label',workspacePanelLabelRecoveryE(id)+' 크기 조절');
  panel.appendChild(resize);
}
function installF1WorkspaceRecoveryE(){
  const race=document.getElementById('f1RacingViewRaceV185');if(!race)return false;
  let workspace=document.getElementById('f1RacingWorkspaceRecoveryE');
  if(!workspace){
    const header=race.querySelector('.f1-racing-race-header-v188');
    const toolbar=document.createElement('div');
    toolbar.id='f1RacingWorkspaceToolbarRecoveryE';
    toolbar.className='f1-racing-workspace-toolbar-recovery-e';
    toolbar.innerHTML='<div class="f1-racing-workspace-toolbar-label-recovery-e"><span>WORKSPACE</span><small>Drag · Resize · Dock · Tab · Maximize</small></div><div id="f1RacingWorkspacePanelTogglesRecoveryE" class="f1-racing-workspace-panel-toggles-recovery-e"></div><button type="button" class="secondary small" id="f1RacingWorkspaceResetRecoveryE">Reset Layout</button>';
    workspace=document.createElement('div');
    workspace.id='f1RacingWorkspaceRecoveryE';
    workspace.className='f1-racing-workspace-recovery-e';
    const guide=document.createElement('div');
    guide.id='f1RacingWorkspaceDockGuideRecoveryE';
    guide.className='f1-racing-workspace-dock-guide-recovery-e';
    guide.hidden=true;
    workspace.appendChild(guide);
    header?.insertAdjacentElement('afterend',toolbar);
    toolbar.insertAdjacentElement('afterend',workspace);

    const timing=race.querySelector('.f1-racing-live-timing-v188');
    const legacyGrid=race.querySelector('.f1-racing-race-grid-v188');
    const track=legacyGrid?.querySelector('.f1-racing-race-map-v188');
    const commentary=legacyGrid?.querySelector('.f1-racing-commentary-v188');
    const side=legacyGrid?.querySelector('.f1-racing-race-side-v188');
    const sideSections=side?Array.from(side.querySelectorAll(':scope > section')):[];
    const radio=sideSections.find(section=>section.querySelector('#f1RacingTeamRadioV188'))||null;
    const speed=sideSections.find(section=>section.querySelector('#f1RacingSpeedTrapV188'))||null;
    const pairs=[['timing',timing],['track',track],['commentary',commentary],['radio',radio],['speed',speed]];
    for(const [id,panel] of pairs){
      if(panel){workspace.appendChild(panel);addWorkspacePanelChromeRecoveryE(panel,id)}
    }
    if(legacyGrid)legacyGrid.hidden=true;
    if(side)side.hidden=true;

    toolbar.addEventListener('click',event=>{
      const toggle=event.target.closest('[data-f1-workspace-toggle]');
      if(toggle){workspaceTogglePanelRecoveryE(toggle.dataset.f1WorkspaceToggle);return}
      if(event.target.closest('#f1RacingWorkspaceResetRecoveryE'))resetWorkspaceRecoveryE();
    });
    workspace.addEventListener('click',event=>{
      const tab=event.target.closest('[data-f1-workspace-tab]');
      if(tab){workspaceSetActiveTabRecoveryE(tab.dataset.f1WorkspaceTab);return}
      const action=event.target.closest('[data-f1-workspace-action]');
      if(action){
        const panel=action.closest('[data-f1-workspace-panel]');
        const id=panel?.dataset.f1WorkspacePanel;if(!id)return;
        if(action.dataset.f1WorkspaceAction==='maximize')workspaceToggleMaximizeRecoveryE(id);
        if(action.dataset.f1WorkspaceAction==='hide')workspaceTogglePanelRecoveryE(id);
      }
    });
    workspace.addEventListener('pointerdown',event=>{
      const resize=event.target.closest('[data-f1-workspace-resize]');
      if(resize){beginWorkspacePointerRecoveryE(event,'resize',resize.dataset.f1WorkspaceResize);return}
      const title=event.target.closest('[data-f1-panel-drag]');
      if(title)beginWorkspacePointerRecoveryE(event,'drag',title.dataset.f1PanelDrag);
    });
    window.addEventListener('pointermove',onWorkspacePointerMoveRecoveryE);
    window.addEventListener('pointerup',onWorkspacePointerUpRecoveryE);
  }
  if(!workspaceLayoutRecoveryE)readWorkspaceLayoutRecoveryE();
  applyWorkspaceLayoutRecoveryE();
  return true;
}

function readPersistedF1SettingsRecoveryD(){
  return typeof window.mwsGetF1RacingSettingsRecoveryD==='function'
    ?window.mwsGetF1RacingSettingsRecoveryD()
    :null;
}
function restoreF1SettingsRecoveryD(force=false){
  if(persistenceRestoredRecoveryD&&!force)return false;
  const settings=readPersistedF1SettingsRecoveryD();
  if(!settings){persistenceRestoredRecoveryD=true;return false}
  const contacts=getContacts();
  const validContactIds=new Set(contacts.map(row=>String(row.id)));
  const restoredIds=(Array.isArray(settings.selectedDriverIds)?settings.selectedDriverIds:[])
    .map(String).filter(id=>validContactIds.has(id));
  selectedIds.splice(0,selectedIds.length,...restoredIds);
  const restoredTrack=String(settings.selectedTrackId||'majoku-ring-v1');
  activeTrackId=window.mwsGetF1TrackV182?.(restoredTrack)?restoredTrack:'majoku-ring-v1';
  selectedTotalLapsRecoveryD=Math.max(1,Math.min(200,Math.floor(Number(settings.totalLaps)||DEFAULT_TOTAL_LAPS_V190)));
  persistenceRestoredRecoveryD=true;
  return true;
}
function persistF1SettingsRecoveryD(extra={}){
  if(typeof window.mwsSaveF1RacingSettingsRecoveryD!=='function')return false;
  return Boolean(window.mwsSaveF1RacingSettingsRecoveryD({
    selectedDriverIds:selectedIds.slice(),
    selectedTrackId:String(activeTrackId||'majoku-ring-v1'),
    totalLaps:selectedTotalLapsRecoveryD,
    ...extra
  })?.ok);
}

function render(){
  const section=document.getElementById('gameF1Racing');
  if(!section)return false;
  restoreF1SettingsRecoveryD(false);
  const search=document.getElementById('f1RacingContactSearchV181');
  const clear=document.getElementById('f1RacingClearDriversV181');
  if(search&&!search.dataset.f1Bound){search.dataset.f1Bound='1';search.addEventListener('input',renderContacts)}
  if(clear&&!clear.dataset.f1Bound){clear.dataset.f1Bound='1';clear.addEventListener('click',function(){selectedIds.splice(0);persistF1SettingsRecoveryD();stopPreviewV184(true);renderContacts();renderSelected();syncSetupActionV187()})}
  applyScreenStateV185();
  renderContacts();
  renderSelected();
  renderTrackChoicesV186();
  bindRaceProceedV187();
  bindManualRaceStartRecoveryM();
  bindRaceCancelRecoveryC();
  bindRaceLifecycleRecoveryG();
  installF1WorkspaceRecoveryE();
  updateTrackFoundationStatusV182();
  renderTrackMapV183();
  if(previewStateV184.running)stopPreviewV184(true);
  if(f1ScreenStateV185==='RACE'&&activeRaceSnapshotV187){renderRaceControlV188();startRaceMotionV189()}
  const chip=document.getElementById('f1RacingPhaseChipV180');if(chip)chip.textContent=f1ScreenStateV185==='SETUP'?'RACE SETUP':'RACE CONTROL';
  section.dataset.f1Runtime=VERSION210;
  return true;
}
function toggleDriver(id){
  const key=String(id||'');if(!key)return;
  const index=selectedIds.findIndex(function(value){return String(value)===key});
  if(index>=0)selectedIds.splice(index,1);else selectedIds.push(key);
  persistF1SettingsRecoveryD();
  renderContacts();renderSelected();syncSetupActionV187();
}
function removeDriver(id){
  const key=String(id||'');
  const index=selectedIds.findIndex(function(value){return String(value)===key});
  if(index>=0)selectedIds.splice(index,1);
  persistF1SettingsRecoveryD();
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

function startFinishGeometryRecoveryB(path,track){
  const total=Number(path?.getTotalLength?.())||0;
  if(!(total>0)||!track)return null;
  const progress=normalizedProgressV190(Number(track.startFinish)||0);
  const at=progress*total;
  const d=Math.max(2,total/900);
  const beforeAt=(at-d+total)%total;
  const afterAt=(at+d)%total;
  const center=path.getPointAtLength(at);
  const before=path.getPointAtLength(beforeAt);
  const after=path.getPointAtLength(afterAt);
  const dx=Number(after.x)-Number(before.x),dy=Number(after.y)-Number(before.y);
  const mag=Math.hypot(dx,dy)||1;
  const tx=dx/mag,ty=dy/mag;
  const nx=-ty,ny=tx;
  const visualWidth=Math.max(10,Number(track?.geometry?.visualTrackWidthSvg)||26);
  const halfSpan=Math.max(18,visualWidth*.92);
  return {
    progress,
    center:{x:Number(center.x),y:Number(center.y)},
    tangent:{x:tx,y:ty},
    normal:{x:nx,y:ny},
    a:{x:Number(center.x)-nx*halfSpan,y:Number(center.y)-ny*halfSpan},
    b:{x:Number(center.x)+nx*halfSpan,y:Number(center.y)+ny*halfSpan}
  };
}
function addStartFinishLineRecoveryB(layer,path,track,scope='setup'){
  if(!layer||!path||!track)return null;
  const geometry=startFinishGeometryRecoveryB(path,track);
  if(!geometry)return null;
  const group=svgNodeV183('g',{
    class:'f1-racing-start-finish-recovery-b '+scope,
    'data-f1-start-finish':'1',
    'data-progress':geometry.progress.toFixed(6)
  });
  const underlay=svgNodeV183('line',{class:'finish-underlay',x1:geometry.a.x,y1:geometry.a.y,x2:geometry.b.x,y2:geometry.b.y});
  const stripe=svgNodeV183('line',{class:'finish-stripe',x1:geometry.a.x,y1:geometry.a.y,x2:geometry.b.x,y2:geometry.b.y});
  const labelDistance=scope==='race'?34:42;
  const label=svgNodeV183('text',{
    class:'finish-label',
    x:geometry.center.x+geometry.tangent.x*labelDistance+geometry.normal.x*18,
    y:geometry.center.y+geometry.tangent.y*labelDistance+geometry.normal.y*18,
    'text-anchor':'middle'
  });
  label.textContent='START / FINISH';
  group.append(underlay,stripe,label);
  layer.appendChild(group);
  return group;
}
function renderRaceStartFinishRecoveryB(layer,path,track){
  if(!layer||!path||!track)return false;
  layer.replaceChildren();
  return Boolean(addStartFinishLineRecoveryB(layer,path,track,'race'));
}
function renderTrackMarkersV211(layer,path,track,scope='race'){
  if(!layer||!path||!track)return false;
  layer.replaceChildren();
  addStartFinishLineRecoveryB(layer,path,track,scope);
  (track.sectors||[]).slice(0,-1).forEach((sector,index)=>addTrackAnnotationV183(layer,path,'sector','S'+(index+1),sector.end));
  (track.speedTraps||[]).forEach((trap,index)=>addTrackAnnotationV183(layer,path,'trap',String(trap.id||('ST'+(index+1))),trap.progress));
  if(track.pit){
    addTrackAnnotationV183(layer,path,'pit','PIT IN',track.pit.entry);
    addTrackAnnotationV183(layer,path,'pit','PIT OUT',track.pit.exit);
  }
  (track.overtakeZones||[]).forEach((zone,index)=>{
    if(Number.isFinite(Number(zone.detection)))addTrackAnnotationV183(layer,path,'overtake','OVT D'+(index+1),zone.detection);
  });
  return true;
}
function qaTrackMarkersV211(){
  const tracks=typeof window.mwsGetF1TrackCatalogV186==='function'?window.mwsGetF1TrackCatalogV186():[];
  const catalog=(tracks&&tracks.length)?tracks:(window.MWS_F1_TRACKS_V182?Object.values(window.MWS_F1_TRACKS_V182):[]);
  const rows=catalog.map(track=>({
    id:track.id,
    sectors:(track.sectors||[]).length,
    speedTraps:(track.speedTraps||[]).length,
    pitReady:Boolean(track.pit&&Number.isFinite(Number(track.pit.entry))&&Number.isFinite(Number(track.pit.exit))),
    detectionLines:(track.overtakeZones||[]).filter(zone=>Number.isFinite(Number(zone.detection))).length
  }));
  return {trackCount:rows.length,rows,allPass:rows.length===3&&rows.every(row=>row.sectors===3&&row.speedTraps>=3&&row.pitReady&&row.detectionLines>=1)};
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
  renderTrackMarkersV211(layer,path,track,'setup');
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
window.mwsF1StartFinishGeometryRecoveryB=startFinishGeometryRecoveryB;
window.mwsF1AddStartFinishLineRecoveryB=addStartFinishLineRecoveryB;
window.mwsF1RenderRaceStartFinishRecoveryB=renderRaceStartFinishRecoveryB;
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
window.mwsF1ConfirmRaceStartRecoveryM=confirmRaceStartRecoveryM;
window.mwsF1GetActiveRaceSnapshotV187=getActiveRaceSnapshotV187;
window.mwsF1CancelRaceRecoveryC=cancelRaceToSetupRecoveryC;
window.mwsF1RestoreSettingsRecoveryD=restoreF1SettingsRecoveryD;
window.mwsF1PersistSettingsRecoveryD=persistF1SettingsRecoveryD;
window.mwsF1InstallWorkspaceRecoveryE=installF1WorkspaceRecoveryE;
window.mwsF1ApplyWorkspaceLayoutRecoveryE=applyWorkspaceLayoutRecoveryE;
window.mwsF1ResetWorkspaceRecoveryE=resetWorkspaceRecoveryE;
window.mwsF1DockPanelRecoveryE=workspaceDockLayoutRecoveryE;
window.mwsF1TabGroupRecoveryE=workspaceTabGroupRecoveryE;
window.mwsF1ToggleWorkspacePanelRecoveryE=workspaceTogglePanelRecoveryE;
window.mwsF1ToggleWorkspaceMaximizeRecoveryE=workspaceToggleMaximizeRecoveryE;
window.mwsF1GetWorkspaceLayoutRecoveryE=function(){return workspaceLayoutRecoveryE?cloneWorkspaceLayoutRecoveryE(workspaceLayoutRecoveryE):null};
window.mwsF1ReflowWorkspaceRecoveryI=function(id='',rect=null){if(!workspaceLayoutRecoveryE)return false;workspaceReflowRecoveryI(workspaceLayoutRecoveryE,id,rect);applyWorkspaceLayoutRecoveryE();persistWorkspaceLayoutRecoveryE();return workspaceOverlapPairsRecoveryI().length===0};
window.mwsF1WorkspaceOverlapPairsRecoveryI=function(){return workspaceOverlapPairsRecoveryI().map(pair=>pair.slice())};
window.mwsF1DockSplitRecoveryJ=workspaceDockSplitRecoveryJ;
window.mwsF1DockTripleRecoveryN=workspaceDockTripleRecoveryN;
window.mwsF1ResizeSplitRecoveryJ=function(id,dw=0,dh=0){
  if(!workspaceLayoutRecoveryE?.panels?.[id])return false;
  const pointer={id,start:cloneWorkspaceLayoutRecoveryE(workspaceLayoutRecoveryE.panels[id]),layoutStart:cloneWorkspaceLayoutRecoveryE(workspaceLayoutRecoveryE)};
  const ok=workspaceResizeSplitRecoveryJ(pointer,Number(dw)||0,Number(dh)||0);
  applyWorkspaceLayoutRecoveryE();persistWorkspaceLayoutRecoveryE();return ok;
};
window.mwsF1AuditWorkspaceLayoutRecoveryK=workspaceAuditLayoutRecoveryK;
window.mwsF1GetWorkspaceRepairReportRecoveryK=function(){return {...workspaceRepairReportRecoveryK,reasons:[...(workspaceRepairReportRecoveryK.reasons||[])]}};
window.mwsF1FinishRaceRecoveryG=finishRaceRecoveryG;
window.mwsF1ForceFinishRecoveryG=function(){return finishRaceRecoveryG(true)};
window.mwsF1ShowPodiumRecoveryG=showPodiumRecoveryG;
window.mwsF1ShowResultRecoveryG=showResultRecoveryG;
window.mwsF1ReturnToSetupRecoveryG=returnToSetupRecoveryG;
window.mwsF1NewRaceSameSettingsRecoveryG=newRaceSameSettingsRecoveryG;
window.mwsF1GetRaceResultRecoveryG=function(){return activeRaceResultRecoveryG};
window.mwsF1RenderRaceControlV188=renderRaceControlV188;
window.mwsF1StartRaceMotionV189=startRaceMotionV189;
window.mwsF1PauseRaceMotionV189=pauseRaceMotionV189;
window.mwsF1ResetRaceMotionV189=resetRaceMotionV189;
window.mwsF1RenderRaceVehiclesV189=renderRaceVehiclesV189;
window.mwsF1SectorForProgressV190=sectorForProgressV190;
window.mwsF1SyncVehicleRaceMetricsV190=syncVehicleRaceMetricsV190;
window.mwsF1UpdateRaceProgressHudV190=updateRaceProgressHudV190;
window.mwsF1ComputeRaceStandingsV191=computeRaceStandingsV191;
window.mwsF1UpdateRaceStandingsV191=updateRaceStandingsV191;
window.mwsF1FormatRaceDeltaV191=formatRaceDeltaV191;
window.mwsF1SetSimulationTimeScaleV192=setSimulationTimeScaleV192;
window.mwsF1ToggleSimulationPauseV192=toggleSimulationPauseV192;
window.mwsF1GetSimulationClockV192=function(){return {...simClockV192}};
window.mwsF1SimulateRaceStepV192=simulateRaceStepV192;
window.mwsF1RefreshRaceGeometryV193=refreshRaceGeometryV193;
window.mwsF1GetRaceGeometryV193=getRaceGeometryV193;
window.mwsF1GetCornerPhasesV194=getCornerPhasesV194;
window.mwsF1GetCornerPhaseAtProgressV194=getCornerPhaseAtProgressV194;
window.mwsF1GetSpeedProfileV195=getSpeedProfileV195;
window.mwsF1GetSpeedTargetAtProgressV195=getSpeedTargetAtProgressV195;
window.mwsF1SimulateVehicleDynamicsV196=simulateVehicleDynamicsV196;
window.mwsF1GearForSpeedV196=gearForSpeedV196;
window.mwsF1RpmForSpeedAndGearV196=rpmForSpeedAndGearV196;
window.mwsF1SetVehicleRacingLineV197=setVehicleRacingLineV197;
window.mwsF1LineOffsetMetersV197=lineOffsetMetersV197;
window.mwsF1RaceLinePointV197=raceLinePointV197;
window.mwsF1ResolveSlipstreamV198=resolveSlipstreamV198;
window.mwsF1UpdateSlipstreamStatesV198=updateSlipstreamStatesV198;
window.mwsF1ResolveDirtyAirV199=resolveDirtyAirV199;
window.mwsF1UpdateDirtyAirStatesV199=updateDirtyAirStatesV199;
window.mwsF1CreateDriverProfileV200=createDriverProfileV200;
window.mwsF1UpdateDriverPaceStateV200=updateDriverPaceStateV200;
window.mwsF1DriverTargetMultiplierV200=driverTargetMultiplierV200;
window.mwsF1GetDriverProfilesV200=getDriverProfilesV200;
window.mwsF1LongRunPaceBiasV209=longRunPaceBiasV209;
window.mwsF1LongRunPaceCorrectionV209=longRunPaceCorrectionV209;
window.mwsF1GetLongRunBalanceStatesV209=getLongRunBalanceStatesV209;
window.mwsF1QaLongRunGapBalanceV209=qaLongRunGapBalanceV209;
window.mwsF1QaMultiTrackIntegrationV210=qaMultiTrackIntegrationV210;
window.mwsF1RenderTrackMarkersV211=renderTrackMarkersV211;
window.mwsF1QaTrackMarkersV211=qaTrackMarkersV211;
window.mwsF1ApplyLiveTimingFlipV212=applyLiveTimingFlipV212;
window.mwsF1QaLiveTimingFlipV212=qaLiveTimingFlipV212;
window.mwsF1ApplyTopThreePresentationV213=applyTopThreePresentationV213;
window.mwsF1QaTopThreePresentationV213=qaTopThreePresentationV213;
window.mwsF1SetRaceControlFlagV214=setRaceControlFlagV214;
window.mwsF1GetRaceControlFlagV214=getRaceControlFlagV214;
window.mwsF1QaRaceControlFlagsV214=qaRaceControlFlagsV214;
window.mwsF1ErsNormalPowerLimitV201=ersNormalPowerLimitV201;
window.mwsF1UpdateEnergySystemV201=updateEnergySystemV201;
window.mwsF1GetEnergyStatesV201=getEnergyStatesV201;
window.mwsF1ErsOvertakePowerLimitV202=ersOvertakePowerLimitV202;
window.mwsF1UpdateActiveAeroAndOvertakeV202=updateActiveAeroAndOvertakeV202;
window.mwsF1GetActiveAeroOvertakeStatesV202=getActiveAeroOvertakeStatesV202;
window.mwsF1SetVehicleTyreCompoundV203=setVehicleTyreCompoundV203;
window.mwsF1UpdateTyreSystemV203=updateTyreSystemV203;
window.mwsF1GetTyreStatesV203=getTyreStatesV203;
window.mwsF1UpdateDrivingIncidentsV204=updateDrivingIncidentsV204;
window.mwsF1GetDrivingIncidentStatesV204=getDrivingIncidentStatesV204;
window.mwsF1ForceDrivingIncidentV204=forceDrivingIncidentV204;
window.mwsF1RequestPitStopV205=requestPitStopV205;
window.mwsF1CancelPitRequestV205=cancelPitRequestV205;
window.mwsF1GetPitStatesV205=getPitStatesV205;
window.mwsF1QaPitCycleV205=qaPitCycleV205;
window.mwsF1EvaluatePitStrategyV206=evaluatePitStrategyV206;
window.mwsF1UpdatePitStrategiesV206=updatePitStrategiesV206;
window.mwsF1GetPitStrategyStatesV206=getPitStrategyStatesV206;
window.mwsF1QaPitStrategyV206=qaPitStrategyV206;
window.mwsF1UpdateTrafficAndDefenceV207=updateTrafficAndDefenceV207;
window.mwsF1GetTrafficStatesV207=getTrafficStatesV207;
window.mwsF1QaTrafficV207=qaTrafficV207;
window.mwsF1NextPassStateV208=nextPassStateV208;
window.mwsF1UpdatePassStateMachineV208=updatePassStateMachineV208;
window.mwsF1GetPassStatesV208=getPassStatesV208;
window.mwsF1QaPassStateMachineV208=qaPassStateMachineV208;
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
window.__mwsF1RacingV191=VERSION191;
window.__mwsF1RacingV192=VERSION192;
window.__mwsF1RacingV193=VERSION193;
window.__mwsF1RacingV194=VERSION194;
window.__mwsF1RacingV195=VERSION195;
window.__mwsF1RacingV196=VERSION196;
window.__mwsF1RacingV197=VERSION197;
window.__mwsF1RacingV198=VERSION198;
window.__mwsF1RacingV199=VERSION199;
window.__mwsF1RacingV200=VERSION200;
window.__mwsF1RacingV201=VERSION201;
window.__mwsF1RacingV202=VERSION202;
window.__mwsF1RacingV203=VERSION203;
window.__mwsF1RacingV204=VERSION204;
window.__mwsF1RacingV205=VERSION205;
window.__mwsF1RacingV206=VERSION206;
window.__mwsF1RacingV207=VERSION207;
window.__mwsF1RacingV208=VERSION208;
window.__mwsF1RacingV209=VERSION209;
window.__mwsF1RacingV210=VERSION210;
window.__mwsF1RacingV211=VERSION211;
window.__mwsF1RacingV212=VERSION212;
window.__mwsF1RacingV213=VERSION213;
window.__mwsF1RacingV214=VERSION214;
window.__mwsF1RecoveryM='explicit-grid-start-v1';
window.__mwsF1RecoveryN='left-center-right-triple-dock-v1';
window.__mwsF1RecoveryB='start-finish-line-v1';
window.__mwsF1RecoveryC='race-cancel-setup-return-v1';
window.__mwsF1RecoveryD='persistent-roster-track-settings-v1';
window.__mwsF1RecoveryE='premiere-workspace-foundation-v1';
window.__mwsF1RecoveryF='race-workspace-default-redesign-v1';
window.__mwsF1RecoveryG='complete-race-lifecycle-v1';
window.__mwsF1RecoveryI='collision-free-reflow-v1';
window.__mwsF1RecoveryJ='split-resize-dock-preview-v1';
window.__mwsF1RecoveryK='saved-layout-repair-dom-overlap-qa-v1';
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
