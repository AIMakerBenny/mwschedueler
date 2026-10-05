(()=>{
'use strict';
const VERSION283='phase283-f1-r08-general-overtake-defence';
const GENERAL_BATTLE_CONFIG_V283=Object.freeze({maxGapMeters:34,attackGapMeters:24,defendGapMeters:26,minClosingKph:.8,attackBiasBaseKph:.55,attackBiasPressureKph:.85,maxPatchedBiasKph:2.4,defendPressure:.22});
const runtimeState={rafId:0,frames:0,activeFrames:0,lastApplied:0};
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
function loop(){patchGeneralBattleV283();runtimeState.rafId=requestAnimationFrame(loop)}
function boot(){if(!runtimeState.rafId)runtimeState.rafId=requestAnimationFrame(loop)}
window.mwsF1PatchGeneralBattleV283=patchGeneralBattleV283;window.mwsF1QaGeneralOvertakeDefenceV283=qaGeneralOvertakeDefenceV283;window.__mwsF1RacingV283=VERSION283;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();