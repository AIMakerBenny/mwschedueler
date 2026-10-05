(()=>{
'use strict';
const VERSION283='phase283-f1-r08-general-overtake-defence';
const GENERAL_BATTLE_CONFIG_V283=Object.freeze({maxGapMeters:34,attackGapMeters:24,defendGapMeters:26,minClosingKph:.8,attackBiasBaseKph:.55,attackBiasPressureKph:.85,maxPatchedBiasKph:2.4,defendPressure:.22});
const VERSION284='phase284-f1-r09-track-ranking-overlay';
const VERSION285='phase285-f1-r10-zoom-linked-marker-scale';
const VERSION286='phase286-f1-r11-auto-camera-jitter-suppression';
const AUTO_CAMERA_SMOOTH_CONFIG_V286=Object.freeze({startupMs:1600,startupAlpha:.07,normalAlpha:.16,zoomAlpha:.18,centerDeadband:2.4,zoomDeadband:.018,wheelBypassMs:260});
const ZOOM_MARKER_CONFIG_V285=Object.freeze({exponent:.38,minScale:.54,maxScale:1});
const TRACK_RANKING_CONFIG_V284=Object.freeze({maxRows:6,refreshMs:140});
const runtimeState={rafId:0,frames:0,activeFrames:0,lastApplied:0};
const rankingStateV284={lastRenderAt:0,renderCount:0};
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
function syncTrackRankingV284(force=false){
 const root=ensureTrackRankingV284();if(!root)return false;
 root.hidden=screenState()!=='RACE';if(root.hidden&&!force)return false;
 const now=performance.now();if(!force&&now-rankingStateV284.lastRenderAt<TRACK_RANKING_CONFIG_V284.refreshMs)return true;
 rankingStateV284.lastRenderAt=now;rankingStateV284.renderCount+=1;
 const list=root.querySelector('[data-f1-track-ranking-list-v284]');if(!list)return false;
 const standings=liveStandings().slice(0,TRACK_RANKING_CONFIG_V284.maxRows);
 list.replaceChildren(...standings.map(row=>{
   const item=document.createElement('div');item.className='f1-racing-track-ranking-row-v284';item.dataset.position=String(row.position||0);
   const pos=document.createElement('b');pos.textContent='P'+String(row.position||0);
   const driver=document.createElement('span');driver.className='driver';driver.textContent=String(row.vehicle?.driver?.name||row.vehicle?.driver?.displayName||row.vehicle?.driver?.code||'DRIVER');
   const gap=document.createElement('small');gap.textContent=formatIntervalV284(row);
   const color=typeof window.mwsF1DriverColorV216==='function'?window.mwsF1DriverColorV216(row.vehicle?.driver,Number(row.position||1)-1):'#94a3b8';
   item.style.setProperty('--rank-driver-color-v284',String(color||'#94a3b8'));item.append(pos,driver,gap);return item;
 }));
 return true;
}
function qaTrackRankingOverlayV284(){
 const root=ensureTrackRankingV284(),api=typeof window.mwsF1ComputeRaceStandingsV191==='function';
 const header=Boolean(root?.querySelector('header')),list=Boolean(root?.querySelector('[data-f1-track-ranking-list-v284]'));
 const cfg=TRACK_RANKING_CONFIG_V284;
 return {version:VERSION284,api,header,list,maxRows:cfg.maxRows,refreshMs:cfg.refreshMs,renderCount:rankingStateV284.renderCount,allPass:Boolean(root)&&api&&header&&list&&cfg.maxRows>=5&&cfg.maxRows<=8&&cfg.refreshMs>=100};
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

function loop(){patchGeneralBattleV283();syncTrackRankingV284();syncZoomMarkerScaleV285();installAutoCameraSmoothingV286();runtimeState.rafId=requestAnimationFrame(loop)}
function boot(){installZoomMarkerObserverV285();installAutoCameraSmoothingV286();if(!runtimeState.rafId)runtimeState.rafId=requestAnimationFrame(loop)}
window.mwsF1PatchGeneralBattleV283=patchGeneralBattleV283;window.mwsF1QaGeneralOvertakeDefenceV283=qaGeneralOvertakeDefenceV283;window.__mwsF1RacingV283=VERSION283;
window.mwsF1SyncTrackRankingV284=syncTrackRankingV284;window.mwsF1QaTrackRankingOverlayV284=qaTrackRankingOverlayV284;window.__mwsF1RacingV284=VERSION284;
window.mwsF1ZoomMarkerScaleV285=zoomMarkerScaleV285;window.mwsF1SyncZoomMarkerScaleV285=syncZoomMarkerScaleV285;window.mwsF1QaZoomLinkedMarkerScaleV285=qaZoomLinkedMarkerScaleV285;window.__mwsF1RacingV285=VERSION285;
window.mwsF1InstallAutoCameraSmoothingV286=installAutoCameraSmoothingV286;window.mwsF1QaAutoCameraJitterSuppressionV286=qaAutoCameraJitterSuppressionV286;window.__mwsF1RacingV286=VERSION286;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();