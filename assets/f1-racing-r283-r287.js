(()=>{
'use strict';
const VERSION283='phase283-f1-r08-general-overtake-defence';
const GENERAL_BATTLE_CONFIG_V283=Object.freeze({maxGapMeters:34,attackGapMeters:24,defendGapMeters:26,minClosingKph:.8,attackBiasBaseKph:.55,attackBiasPressureKph:.85,maxPatchedBiasKph:2.4,defendPressure:.22});
const VERSION284='phase284-f1-r09-track-ranking-overlay';
const VERSION285='phase285-f1-r10-zoom-linked-marker-scale';
const VERSION286='phase286-f1-r11-auto-camera-jitter-suppression';
const VERSION287='phase287-f1-r12-compact-race-shell-sidebar-hide';
const VERSION302='phase302-f1-live-ranking-flip-status';
const COMPACT_RACE_CONFIG_V287=Object.freeze({bodyClass:'f1-racing-r12-compact-v287',raceState:'RACE'});
const AUTO_CAMERA_SMOOTH_CONFIG_V286=Object.freeze({startupMs:1600,startupAlpha:.07,normalAlpha:.16,zoomAlpha:.18,centerDeadband:2.4,zoomDeadband:.018,wheelBypassMs:260});
const ZOOM_MARKER_CONFIG_V285=Object.freeze({exponent:.38,minScale:.54,maxScale:1});
const TRACK_RANKING_CONFIG_V284=Object.freeze({maxRows:6,refreshMs:140});
const runtimeState={rafId:0,frames:0,activeFrames:0,lastApplied:0};
const rankingStateV284={lastRenderAt:0,renderCount:0,nodes:new Map(),lastPositions:new Map(),flipCount:0,statusRenderCount:0};
function screenState(){return String(window.mwsF1GetScreenStateV185?.()||'')}
function paused(){return document.getElementById('f1RacingPauseV192')?.getAttribute('aria-pressed')==='true'}
function liveStandings(){try{return window.mwsF1ComputeRaceStandingsV191?.()||[]}catch(_){return []}}
function phaseFor(vehicle){try{return String(window.mwsF1GetCornerPhaseAtProgressV194?.(vehicle?.progress)?.phase||'STRAIGHT')}catch(_){return 'STRAIGHT'}}
function eligible(vehicle){return Boolean(vehicle&&!vehicle.finished&&!vehicle.blueFlag&&!vehicle.trackBoundaryExceededV271&&String(vehicle.pitState||'TRACK')==='TRACK'&&!vehicle.pitRequested)}
function patchGeneralBattleV283(){
 runtimeState.frames+=1;if(screenState()!=='RACE'||paused())return 0;
 const standings=liveStandings(),snapshot=window.mwsF1GetActiveRaceSnapshotV187?.(),length=Math.max(1,Number(snapshot?.track?.lengthMeters)||1);let applied=0;
 for(let i=1;i<standings.length;i++){const follower=standings[i]?.vehicle,ahead=standings[i-1]?.vehicle;if(!eligible(follower)||!eligible(ahead))continue;
  const gapMeters=Math.max(0,((Number(ahead.raceProgress)||0)-(Number(follower.raceProgress)||0))*length);if(gapMeters>GENERAL_BATTLE_CONFIG_V283.maxGapMeters)continue;
  const closing=(Number(follower.speedKph)||0)-(Number(ahead.speedKph)||0),pressure=Math.max(0,Math.min(1,1-gapMeters/GENERAL_BATTLE_CONFIG_V283.maxGapMeters)),phase=phaseFor(follower),open=['STRAIGHT','APPROACH','BRAKING'].includes(phase);
  if(open&&gapMeters<=GENERAL_BATTLE_CONFIG_V283.attackGapMeters&&closing>=GENERAL_BATTLE_CONFIG_V283.minClosingKph){const requested=GENERAL_BATTLE_CONFIG_V283.attackBiasBaseKph+pressure*GENERAL_BATTLE_CONFIG_V283.attackBiasPressureKph;follower.battleSpeedBiasKph=Math.min(GENERAL_BATTLE_CONFIG_V283.maxPatchedBiasKph,Math.max(Number(follower.battleSpeedBiasKph)||0,requested));if(!follower.pitRequested&&String(follower.racingLineMode||'IDEAL')==='IDEAL')follower.racingLineMode='ATTACK_INSIDE';follower.generalBattlePressureV283=pressure;applied+=1}
  if(gapMeters<=GENERAL_BATTLE_CONFIG_V283.defendGapMeters&&pressure>=GENERAL_BATTLE_CONFIG_V283.defendPressure){ahead.defenceActive=true;ahead.trafficThreatFromId=String(follower.id||'');if(open&&!ahead.pitRequested&&String(ahead.racingLineMode||'IDEAL')==='IDEAL')ahead.racingLineMode='DEFENSIVE_INSIDE';ahead.generalDefencePressureV283=pressure;applied+=1}
 }
 if(applied){runtimeState.activeFrames+=1;runtimeState.lastApplied=applied}return applied;
}
function qaGeneralOvertakeDefenceV283(){const c=GENERAL_BATTLE_CONFIG_V283,publicApi=typeof window.mwsF1ComputeRaceStandingsV191==='function'&&typeof window.mwsF1GetActiveRaceSnapshotV187==='function',safeguards=c.maxPatchedBiasKph<=2.4&&c.attackBiasBaseKph>0&&c.minClosingKph>0,widerEngagement=c.maxGapMeters>26&&c.attackGapMeters>18&&c.defendGapMeters>22&&c.defendPressure<.24;return {version:VERSION283,config:{...c},publicApi,safeguards,widerEngagement,runtime:{...runtimeState},allPass:publicApi&&safeguards&&widerEngagement}}

function ensureTrackRankingV284(){
 const stage=document.querySelector('#f1RacingWorkspaceRecoveryE .f1-racing-race-map-stage-v188')||document.querySelector('#f1RacingViewRaceV185 .f1-racing-race-map-stage-v188');
 if(!stage)return null;
 let root=document.getElementById('f1RacingTrackRankingV284');
 if(!root){root=document.createElement('aside');root.id='f1RacingTrackRankingV284';root.className='f1-racing-track-ranking-v284';root.setAttribute('aria-label','트랙 실시간 순위');root.innerHTML='<header><span>LIVE RANK</span><small>TOP '+TRACK_RANKING_CONFIG_V284.maxRows+'</small></header><div data-f1-track-ranking-list-v284></div>';stage.appendChild(root)}
 return root;
}
function formatIntervalV284(row){if(Number(row?.position)===1)return 'LEADER';const v=Number(row?.intervalSeconds);return Number.isFinite(v)?'+'+Math.max(0,v).toFixed(3):'--'}
function rankingDriverKeyV302(row,index=0){return String(row?.vehicle?.id||row?.vehicle?.driver?.id||row?.vehicle?.driver?.contactId||row?.vehicle?.driver?.name||('rank-'+index))}
function rankingStatusV302(vehicle){
 const out=[],push=(code,label)=>{if(!out.some(row=>row.code===code)&&out.length<2)out.push({code,label})};
 const pit=String(vehicle?.pitState||'TRACK');
 const battle=String(vehicle?.battleState||'FOLLOWING');
 if(pit!=='TRACK'||vehicle?.pitRequested)push('PIT','PIT');
 if(['SIDE_BY_SIDE','BRAKING_DUEL','CORNER_BATTLE','SWITCHBACK','COUNTER_ATTACK'].includes(battle))push('SIDE','SIDE');
 if(['PREPARING_ATTACK','PULLING_OUT'].includes(battle)||String(vehicle?.racingLineMode||'')==='ATTACK_INSIDE')push('ATTACK','ATTACK');
 if(vehicle?.defenceActive||String(vehicle?.racingLineMode||'')==='DEFENSIVE_INSIDE')push('DEFEND','DEFEND');
 if(vehicle?.blueFlag)push('BLUE','BLUE');
 if(!out.length)push('NORMAL','RUN');
 return out.slice(0,2);
}
function createRankingRowV302(key){
 const item=document.createElement('div');item.className='f1-racing-track-ranking-row-v284';item.dataset.driverId=key;
 const pos=document.createElement('b');pos.className='rank-pos-v302';
 const driver=document.createElement('span');driver.className='driver';
 const gap=document.createElement('small');gap.className='rank-gap-v302';
 const status=document.createElement('span');status.className='f1-racing-track-ranking-status-v302';status.setAttribute('aria-label','현재 상태');
 item.append(pos,driver,gap,status);return item;
}
function updateRankingRowV302(item,row,index){
 const position=Number(row?.position)||index+1,vehicle=row?.vehicle||{},previous=Number(item.dataset.position)||position;
 item.dataset.previousPosition=String(previous);item.dataset.position=String(position);
 item.querySelector('.rank-pos-v302').textContent='P'+String(position);
 item.querySelector('.driver').textContent=String(vehicle?.driver?.name||vehicle?.driver?.displayName||vehicle?.driver?.code||'DRIVER');
 item.querySelector('.rank-gap-v302').textContent=formatIntervalV284(row);
 const statuses=rankingStatusV302(vehicle),status=item.querySelector('.f1-racing-track-ranking-status-v302');
 status.replaceChildren(...statuses.map(state=>{const badge=document.createElement('em');badge.dataset.rankStatus=state.code;badge.textContent=state.label;return badge}));
 item.dataset.statusCount=String(statuses.length);
 const color=typeof window.mwsF1DriverColorV216==='function'?window.mwsF1DriverColorV216(vehicle?.driver,position-1):'#94a3b8';
 item.style.setProperty('--rank-driver-color-v284',String(color||'#94a3b8'));
 item.classList.toggle('rank-up-v302',position<previous);item.classList.toggle('rank-down-v302',position>previous);
 rankingStateV284.statusRenderCount+=statuses.length;
 return {position,previous,statuses};
}
function animateRankingFlipV302(entries,before){
 requestAnimationFrame(()=>{
  for(const {key,item,position,previous} of entries){
   const oldTop=before.get(key),nextTop=item.getBoundingClientRect().top;
   const delta=Number.isFinite(oldTop)?oldTop-nextTop:0;
   if(Math.abs(delta)>.5){
    item.style.transition='none';item.style.transform='translate3d(0,'+delta.toFixed(2)+'px,0)';
    requestAnimationFrame(()=>{item.style.transition='transform 360ms cubic-bezier(.22,.78,.24,1),background-color 360ms ease,opacity 360ms ease';item.style.transform='translate3d(0,0,0)'});
    rankingStateV284.flipCount+=1;
   }
   if(position!==previous)setTimeout(()=>{item.classList.remove('rank-up-v302','rank-down-v302')},420);
  }
 })
}
function syncTrackRankingV284(force=false){
 const root=ensureTrackRankingV284();if(!root)return false;
 root.hidden=screenState()!=='RACE';if(root.hidden&&!force)return false;
 const now=performance.now();if(!force&&now-rankingStateV284.lastRenderAt<TRACK_RANKING_CONFIG_V284.refreshMs)return true;
 rankingStateV284.lastRenderAt=now;rankingStateV284.renderCount+=1;
 const list=root.querySelector('[data-f1-track-ranking-list-v284]');if(!list)return false;
 const standings=liveStandings().slice(0,TRACK_RANKING_CONFIG_V284.maxRows),before=new Map();
 for(const [key,node] of rankingStateV284.nodes){if(node.isConnected)before.set(key,node.getBoundingClientRect().top)}
 const active=new Set(),entries=[];
 standings.forEach((row,index)=>{
   const key=rankingDriverKeyV302(row,index);active.add(key);
   let item=rankingStateV284.nodes.get(key);
   if(!item){item=createRankingRowV302(key);rankingStateV284.nodes.set(key,item)}
   const state=updateRankingRowV302(item,row,index);entries.push({key,item,...state});list.appendChild(item);rankingStateV284.lastPositions.set(key,state.position);
 });
 for(const [key,node] of rankingStateV284.nodes){if(!active.has(key)){node.remove();rankingStateV284.nodes.delete(key);rankingStateV284.lastPositions.delete(key)}}
 animateRankingFlipV302(entries,before);
 return true;
}
function qaTrackRankingOverlayV284(){
 const root=ensureTrackRankingV284(),api=typeof window.mwsF1ComputeRaceStandingsV191==='function';
 const header=Boolean(root?.querySelector('header')),list=Boolean(root?.querySelector('[data-f1-track-ranking-list-v284]'));
 const cfg=TRACK_RANKING_CONFIG_V284;
 return {version:VERSION284,api,header,list,maxRows:cfg.maxRows,refreshMs:cfg.refreshMs,renderCount:rankingStateV284.renderCount,allPass:Boolean(root)&&api&&header&&list&&cfg.maxRows>=5&&cfg.maxRows<=8&&cfg.refreshMs>=100};
}
function qaTrackRankingFlipStatusV302(){
 const samples=[
  rankingStatusV302({pitState:'PIT_BOX',battleState:'SIDE_BY_SIDE',defenceActive:true}),
  rankingStatusV302({pitState:'TRACK',battleState:'PREPARING_ATTACK'}),
  rankingStatusV302({pitState:'TRACK',battleState:'FOLLOWING',defenceActive:true}),
  rankingStatusV302({pitState:'TRACK',battleState:'FOLLOWING'})
 ];
 const statusBounded=samples.every(rows=>rows.length>=1&&rows.length<=2),priority=samples[0][0]?.code==='PIT'&&samples[1][0]?.code==='ATTACK'&&samples[2][0]?.code==='DEFEND'&&samples[3][0]?.code==='NORMAL';
 const root=ensureTrackRankingV284(),list=root?.querySelector('[data-f1-track-ranking-list-v284]'),rows=[...(list?.querySelectorAll('.f1-racing-track-ranking-row-v284')||[])];
 const keyed=rows.every(row=>Boolean(row.dataset.driverId)),domStatus=rows.every(row=>Number(row.dataset.statusCount||0)<=2);
 return {version:VERSION302,statusBounded,priority,keyed,domStatus,flipDurationMs:360,flipCount:rankingStateV284.flipCount,rowReuse:rankingStateV284.nodes.size,allPass:statusBounded&&priority&&Boolean(root&&list)&&keyed&&domStatus};
}


function zoomMarkerScaleV285(zoom){
 const z=Math.max(1,Number(zoom)||1);
 return Math.max(ZOOM_MARKER_CONFIG_V285.minScale,Math.min(ZOOM_MARKER_CONFIG_V285.maxScale,1/Math.pow(z,ZOOM_MARKER_CONFIG_V285.exponent)));
}
function applyZoomMarkerScaleV285(marker,zoom){
 if(!marker)return false;
 const transform=String(marker.getAttribute('transform')||'');
 const match=transform.match(/^(translate\([^)]*\))\s+scale\(([-+0-9.eE]+)\)$/);
 if(!match)return false;
 const desired=zoomMarkerScaleV285(zoom),current=Number(match[2]);
 if(Number.isFinite(current)&&Math.abs(current-desired)<.0005){marker.dataset.zoomScaleV285=desired.toFixed(4);return true}
 marker.setAttribute('transform',match[1]+' scale('+desired.toFixed(4)+')');
 marker.dataset.zoomScaleV285=desired.toFixed(4);
 return true;
}
function syncZoomMarkerScaleV285(){
 const camera=window.mwsF1GetRaceCameraStateV216?.(),zoom=Math.max(1,Number(camera?.zoom)||1);
 let count=0;for(const marker of document.querySelectorAll('.f1-racing-race-vehicle-v189'))if(applyZoomMarkerScaleV285(marker,zoom))count+=1;
 return {zoom,scale:zoomMarkerScaleV285(zoom),count};
}
let zoomObserverV285=null;
const autoCameraVisualStateV286={initialized:false,lastBox:null,lastApplied:'',raceStartedAt:0,lastWheelAt:-Infinity,lastMode:''};
let autoCameraObserverV286=null;
function installZoomMarkerObserverV285(){
 const layer=document.getElementById('f1RacingRaceVehicleLayerV188');if(!layer)return false;
 if(zoomObserverV285)return true;
 zoomObserverV285=new MutationObserver(()=>syncZoomMarkerScaleV285());
 zoomObserverV285.observe(layer,{subtree:true,attributes:true,attributeFilter:['transform'],childList:true});
 syncZoomMarkerScaleV285();return true;
}
function qaZoomLinkedMarkerScaleV285(){
 const samples=[1,1.5,2,3,4.5].map(zoom=>({zoom,scale:zoomMarkerScaleV285(zoom)}));
 const screen=samples.map(row=>row.zoom*row.scale);
 const increasing=screen.every((value,index)=>index===0||value>screen[index-1]);
 return {version:VERSION285,samples,screenRatios:screen,increasing,observerReady:Boolean(zoomObserverV285),allPass:samples[0].scale===1&&increasing&&screen.at(-1)>2&&samples.at(-1).scale>=ZOOM_MARKER_CONFIG_V285.minScale};
}


function parseViewBoxV286(value){
 const rows=String(value||'').trim().split(/\s+/).map(Number);
 return rows.length===4&&rows.every(Number.isFinite)?{x:rows[0],y:rows[1],w:rows[2],h:rows[3]}:null;
}
function viewBoxTextV286(box){return [box.x,box.y,box.w,box.h].map(v=>Number(v).toFixed(3)).join(' ')}
function smoothAutoCameraBoxV286(raw){
 const mode=String(window.mwsF1GetRaceCameraStateV216?.()?.mode||'');
 const now=performance.now(),cfg=AUTO_CAMERA_SMOOTH_CONFIG_V286;
 if(mode!=='AUTO'||now-autoCameraVisualStateV286.lastWheelAt<=cfg.wheelBypassMs||!autoCameraVisualStateV286.initialized||autoCameraVisualStateV286.lastMode!==mode){
   autoCameraVisualStateV286.initialized=true;autoCameraVisualStateV286.lastBox={...raw};autoCameraVisualStateV286.lastMode=mode;
   if(screenState()==='RACE'&&!autoCameraVisualStateV286.raceStartedAt)autoCameraVisualStateV286.raceStartedAt=now;
   return {...raw};
 }
 const prev=autoCameraVisualStateV286.lastBox||raw,startup=now-autoCameraVisualStateV286.raceStartedAt<cfg.startupMs,alpha=startup?cfg.startupAlpha:cfg.normalAlpha;
 const prevCx=prev.x+prev.w/2,prevCy=prev.y+prev.h/2,rawCx=raw.x+raw.w/2,rawCy=raw.y+raw.h/2;
 const dx=rawCx-prevCx,dy=rawCy-prevCy,dw=raw.w-prev.w,dh=raw.h-prev.h;
 const cx=Math.hypot(dx,dy)<=cfg.centerDeadband?prevCx:prevCx+dx*alpha;
 const zoomDelta=Math.max(Math.abs(dw)/Math.max(1,prev.w),Math.abs(dh)/Math.max(1,prev.h));
 const zoomAlpha=zoomDelta<=cfg.zoomDeadband?0:cfg.zoomAlpha;
 const w=zoomAlpha?prev.w+dw*zoomAlpha:prev.w,h=zoomAlpha?prev.h+dh*zoomAlpha:prev.h;
 const next={x:cx-w/2,y:(Math.hypot(dx,dy)<=cfg.centerDeadband?prevCy:prevCy+dy*alpha)-h/2,w,h};
 autoCameraVisualStateV286.lastBox=next;return next;
}
function installAutoCameraSmoothingV286(){
 const svg=document.getElementById('f1RacingRaceTrackSvgV188'),stage=svg?.closest('.f1-racing-race-map-stage-v188');
 if(!svg||!stage)return false;
 if(!stage.dataset.autoCameraSmoothWheelV286){stage.dataset.autoCameraSmoothWheelV286='1';stage.addEventListener('wheel',()=>{autoCameraVisualStateV286.lastWheelAt=performance.now()},{capture:true,passive:true})}
 if(autoCameraObserverV286)return true;
 autoCameraObserverV286=new MutationObserver(()=>{
   const rawText=String(svg.getAttribute('viewBox')||'');
   if(rawText===autoCameraVisualStateV286.lastApplied)return;
   const raw=parseViewBoxV286(rawText);if(!raw)return;
   if(screenState()!=='RACE'){autoCameraVisualStateV286.initialized=false;autoCameraVisualStateV286.raceStartedAt=0;autoCameraVisualStateV286.lastBox={...raw};return}
   const camera=window.mwsF1GetRaceCameraStateV216?.();if(String(camera?.mode||'')!=='AUTO'){autoCameraVisualStateV286.initialized=false;autoCameraVisualStateV286.lastBox={...raw};autoCameraVisualStateV286.lastMode=String(camera?.mode||'');return}
   const next=smoothAutoCameraBoxV286(raw),text=viewBoxTextV286(next);
   autoCameraVisualStateV286.lastApplied=text;if(text!==rawText)svg.setAttribute('viewBox',text);
 });
 autoCameraObserverV286.observe(svg,{attributes:true,attributeFilter:['viewBox']});
 return true;
}
function qaAutoCameraJitterSuppressionV286(){
 const c=AUTO_CAMERA_SMOOTH_CONFIG_V286;
 return {version:VERSION286,config:{...c},observerReady:Boolean(autoCameraObserverV286),wheelBound:Boolean(document.querySelector('.f1-racing-race-map-stage-v188')?.dataset.autoCameraSmoothWheelV286),allPass:c.startupMs>=1200&&c.startupAlpha<c.normalAlpha&&c.normalAlpha<=.2&&c.centerDeadband>=2&&c.zoomDeadband>0&&c.wheelBypassMs>=200};
}


function syncRaceCompactShellV287(forcedState=null){
 const state=forcedState===null?screenState():String(forcedState);
 const active=state===COMPACT_RACE_CONFIG_V287.raceState;
 document.body?.classList.toggle(COMPACT_RACE_CONFIG_V287.bodyClass,active);
 const section=document.getElementById('gameF1Racing');if(section)section.dataset.compactRaceV287=active?'1':'0';
 return active;
}
function qaRaceCompactShellV287(){
 const body=document.body,section=document.getElementById('gameF1Racing'),sidebar=document.querySelector('.sidebar'),topbar=document.querySelector('.main>.topbar');
 const current=screenState(),had=body?.classList.contains(COMPACT_RACE_CONFIG_V287.bodyClass);
 syncRaceCompactShellV287('RACE');
 const sidebarHidden=!sidebar||getComputedStyle(sidebar).display==='none';
 const topbarHidden=!topbar||getComputedStyle(topbar).display==='none';
 const active=Boolean(body?.classList.contains(COMPACT_RACE_CONFIG_V287.bodyClass))&&section?.dataset.compactRaceV287==='1';
 syncRaceCompactShellV287(current);
 if(had&&current!=='RACE')body?.classList.add(COMPACT_RACE_CONFIG_V287.bodyClass);
 return {version:VERSION287,sidebarHidden,topbarHidden,active,restored:current==='RACE'?body?.classList.contains(COMPACT_RACE_CONFIG_V287.bodyClass):!body?.classList.contains(COMPACT_RACE_CONFIG_V287.bodyClass),allPass:sidebarHidden&&topbarHidden&&active};
}

function loop(){patchGeneralBattleV283();syncTrackRankingV284();syncZoomMarkerScaleV285();installAutoCameraSmoothingV286();syncRaceCompactShellV287();runtimeState.rafId=requestAnimationFrame(loop)}
function boot(){installZoomMarkerObserverV285();installAutoCameraSmoothingV286();syncRaceCompactShellV287();if(!runtimeState.rafId)runtimeState.rafId=requestAnimationFrame(loop)}
window.mwsF1PatchGeneralBattleV283=patchGeneralBattleV283;window.mwsF1QaGeneralOvertakeDefenceV283=qaGeneralOvertakeDefenceV283;window.__mwsF1RacingV283=VERSION283;
window.mwsF1SyncTrackRankingV284=syncTrackRankingV284;window.mwsF1QaTrackRankingOverlayV284=qaTrackRankingOverlayV284;window.__mwsF1RacingV284=VERSION284;
window.mwsF1QaTrackRankingFlipStatusV302=qaTrackRankingFlipStatusV302;window.__mwsF1RacingV302=VERSION302;
window.mwsF1ZoomMarkerScaleV285=zoomMarkerScaleV285;window.mwsF1SyncZoomMarkerScaleV285=syncZoomMarkerScaleV285;window.mwsF1QaZoomLinkedMarkerScaleV285=qaZoomLinkedMarkerScaleV285;window.__mwsF1RacingV285=VERSION285;
window.mwsF1InstallAutoCameraSmoothingV286=installAutoCameraSmoothingV286;window.mwsF1QaAutoCameraJitterSuppressionV286=qaAutoCameraJitterSuppressionV286;window.__mwsF1RacingV286=VERSION286;
window.mwsF1SyncRaceCompactShellV287=syncRaceCompactShellV287;window.mwsF1QaRaceCompactShellV287=qaRaceCompactShellV287;window.__mwsF1RacingV287=VERSION287;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();