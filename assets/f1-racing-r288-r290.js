(()=>{
'use strict';
// phase290-production-retrigger
const VERSION288='phase288-f1-r13-layout-reset-viewport-fit';
const WORKSPACE_FIT_CONFIG_V288=Object.freeze({minHeightPx:420,bottomGapPx:8,minRowPx:42,targetViewports:Object.freeze([768,1080,1440])});
const fitStateV288={installed:false,applyCount:0,lastSignature:'',resetHooks:0};
function screenStateV288(){return String(window.mwsF1GetScreenStateV185?.()||'')}
function computeWorkspaceFitV288(viewportHeight,top,usedRows,gap){
 const rows=Math.max(1,Number(usedRows)||10),g=Math.max(0,Number(gap)||0),available=Math.max(WORKSPACE_FIT_CONFIG_V288.minHeightPx,Math.floor((Number(viewportHeight)||0)-(Number(top)||0)-WORKSPACE_FIT_CONFIG_V288.bottomGapPx));
 const rowHeight=Math.max(WORKSPACE_FIT_CONFIG_V288.minRowPx,(available-Math.max(0,rows-1)*g)/rows);
 const height=Math.ceil(rowHeight*rows+Math.max(0,rows-1)*g);
 return {rows,gap:g,available,rowHeight,height,blankPx:Math.max(0,available-height)};
}
function clearWorkspaceViewportFitV288(){
 const workspace=document.getElementById('f1RacingWorkspaceRecoveryE');if(!workspace)return false;
 workspace.classList.remove('f1-racing-workspace-fit-v288');workspace.removeAttribute('data-v288-fit');
 workspace.style.removeProperty('height');workspace.style.removeProperty('grid-auto-rows');
 return true;
}
function applyWorkspaceViewportFitV288(){
 const workspace=document.getElementById('f1RacingWorkspaceRecoveryE');if(!workspace)return false;
 if(screenStateV288()!=='RACE'){clearWorkspaceViewportFitV288();return false}
 const rect=workspace.getBoundingClientRect(),style=getComputedStyle(workspace),viewport=Math.max(1,Number(window.visualViewport?.height)||window.innerHeight||document.documentElement.clientHeight||768),usedRows=Math.max(1,Number(workspace.dataset.usedRows)||10),gap=parseFloat(style.rowGap||style.gap)||0;
 const fit=computeWorkspaceFitV288(viewport,rect.top,usedRows,gap),heightPx=fit.height+'px',rowPx=fit.rowHeight.toFixed(3)+'px';
 const signature=[Math.round(viewport),Math.round(rect.top),usedRows,gap.toFixed(2),heightPx,rowPx].join('|');
 if(workspace.style.getPropertyValue('height')!==heightPx)workspace.style.setProperty('height',heightPx,'important');
 if(workspace.style.getPropertyValue('min-height')!=='0px'||workspace.style.getPropertyPriority('min-height')!=='important')workspace.style.setProperty('min-height','0px','important');
 if(workspace.style.getPropertyValue('grid-auto-rows')!==rowPx)workspace.style.setProperty('grid-auto-rows',rowPx,'important');
 workspace.classList.add('f1-racing-workspace-fit-v288');workspace.dataset.v288Fit=signature;
 fitStateV288.lastSignature=signature;fitStateV288.applyCount+=1;return fit;
}
function scheduleWorkspaceFitV288(){requestAnimationFrame(()=>requestAnimationFrame(applyWorkspaceViewportFitV288))}
function installWorkspaceViewportFitV288(){
 if(fitStateV288.installed)return true;fitStateV288.installed=true;
 const workspace=document.getElementById('f1RacingWorkspaceRecoveryE'),reset=document.getElementById('f1RacingWorkspaceResetRecoveryE'),race=document.getElementById('f1RacingViewRaceV185');
 if(reset){reset.addEventListener('click',()=>{fitStateV288.resetHooks+=1;scheduleWorkspaceFitV288()},{capture:false})}
 window.addEventListener('resize',scheduleWorkspaceFitV288,{passive:true});window.visualViewport?.addEventListener('resize',scheduleWorkspaceFitV288,{passive:true});
 if(workspace){new MutationObserver(()=>scheduleWorkspaceFitV288()).observe(workspace,{attributes:true,attributeFilter:['data-used-rows']})}
 if(race){new MutationObserver(()=>scheduleWorkspaceFitV288()).observe(race,{attributes:true,attributeFilter:['hidden']})}
 scheduleWorkspaceFitV288();return true;
}
function qaWorkspaceViewportFitV288(){
 const samples=WORKSPACE_FIT_CONFIG_V288.targetViewports.map(viewport=>computeWorkspaceFitV288(viewport,150,10,5));
 const samplePass=samples.every(row=>row.blankPx<=1&&row.height>=WORKSPACE_FIT_CONFIG_V288.minHeightPx&&row.rowHeight>=WORKSPACE_FIT_CONFIG_V288.minRowPx);
 const workspace=document.getElementById('f1RacingWorkspaceRecoveryE');
 const live=screenStateV288()==='RACE'?applyWorkspaceViewportFitV288():null;
 const liveBlank=live?Math.max(0,live.available-workspace.getBoundingClientRect().height):0;
 return {version:VERSION288,config:{...WORKSPACE_FIT_CONFIG_V288,targetViewports:[...WORKSPACE_FIT_CONFIG_V288.targetViewports]},samples,samplePass,installed:fitStateV288.installed,resetHooks:fitStateV288.resetHooks,liveBlankPx:liveBlank,allPass:samplePass&&fitStateV288.installed&&(!live||liveBlank<=2)};
}
function bootV288(){installWorkspaceViewportFitV288();installPreraceCompactV289();installGridShuffleSmoothnessV290()}

const VERSION289='phase289-f1-r14-prerace-screen-compression';
const PRERACE_COMPACT_CONFIG_V289=Object.freeze({states:Object.freeze(['TRANSITION','GRID']),bodyClass:'f1-racing-r14-prerace-compact-v289'});
const preraceStateV289={installed:false,syncCount:0,lastState:''};
function syncPreraceCompactV289(forcedState=null){
 const state=forcedState===null?screenStateV288():String(forcedState),active=PRERACE_COMPACT_CONFIG_V289.states.includes(state);
 document.body?.classList.toggle(PRERACE_COMPACT_CONFIG_V289.bodyClass,active);
 const grid=document.getElementById('f1RacingViewGridV185'),transition=document.getElementById('f1RacingViewTransitionV185');
 if(grid)grid.dataset.preraceCompactV289=active&&state==='GRID'?'1':'0';
 if(transition)transition.dataset.preraceCompactV289=active&&state==='TRANSITION'?'1':'0';
 preraceStateV289.lastState=state;preraceStateV289.syncCount+=1;return active;
}
function installPreraceCompactV289(){
 if(preraceStateV289.installed)return true;preraceStateV289.installed=true;
 const shell=document.getElementById('f1RacingShellV180');
 if(shell)new MutationObserver(()=>syncPreraceCompactV289()).observe(shell,{subtree:true,attributes:true,attributeFilter:['hidden']});
 syncPreraceCompactV289();return true;
}
function qaPreraceCompactV289(){
 const grid=document.getElementById('f1RacingViewGridV185'),transition=document.getElementById('f1RacingViewTransitionV185');
 const original=screenStateV288(),gridActive=syncPreraceCompactV289('GRID'),gridClass=document.body?.classList.contains(PRERACE_COMPACT_CONFIG_V289.bodyClass),transitionActive=syncPreraceCompactV289('TRANSITION'),transitionClass=document.body?.classList.contains(PRERACE_COMPACT_CONFIG_V289.bodyClass),raceInactive=!syncPreraceCompactV289('RACE');
 syncPreraceCompactV289(original);
 return {version:VERSION289,states:[...PRERACE_COMPACT_CONFIG_V289.states],installed:preraceStateV289.installed,gridReady:Boolean(grid),transitionReady:Boolean(transition),gridActive,gridClass,transitionActive,transitionClass,raceInactive,allPass:Boolean(grid&&transition)&&gridActive&&gridClass&&transitionActive&&transitionClass&&raceInactive};
}

window.mwsF1ApplyWorkspaceViewportFitV288=applyWorkspaceViewportFitV288;window.mwsF1QaWorkspaceViewportFitV288=qaWorkspaceViewportFitV288;window.__mwsF1RacingV288=VERSION288;

const VERSION290='phase290-f1-r15-starting-grid-shuffle-smoothness';
const SHUFFLE_VISUAL_CONFIG_V290=Object.freeze({shuffleCycles:3,shuffleCycleMs:180,landingMs:460,maxStackCards:8,transformOnly:true});
const shuffleStateV290={installed:false,clicks:0,lastRoundText:''};
function syncGridShuffleSmoothnessV290(){
 const view=document.getElementById('f1RacingViewGridV185'),stage=document.getElementById('f1RacingGridShuffleStageV273'),list=document.getElementById('f1RacingGridListV272');
 if(view)view.classList.add('f1-racing-grid-smooth-v290');
 if(stage)stage.dataset.shuffleCyclesV290=String(SHUFFLE_VISUAL_CONFIG_V290.shuffleCycles);
 if(list)list.dataset.transformShuffleV290='1';
 const round=document.getElementById('f1RacingGridShuffleRoundV272');shuffleStateV290.lastRoundText=String(round?.textContent||'');
 return Boolean(view&&stage&&list);
}
function installGridShuffleSmoothnessV290(){
 if(shuffleStateV290.installed)return true;shuffleStateV290.installed=true;
 const shuffle=document.getElementById('f1RacingGridShuffleV272');
 if(shuffle)shuffle.addEventListener('click',()=>{shuffleStateV290.clicks+=1;requestAnimationFrame(()=>requestAnimationFrame(syncGridShuffleSmoothnessV290))},{capture:true});
 const list=document.getElementById('f1RacingGridListV272');
 if(list)new MutationObserver(()=>syncGridShuffleSmoothnessV290()).observe(list,{childList:true});
 syncGridShuffleSmoothnessV290();return true;
}
function qaGridShuffleSmoothnessV290(){
 const ready=syncGridShuffleSmoothnessV290(),view=document.getElementById('f1RacingViewGridV185'),stage=document.getElementById('f1RacingGridShuffleStageV273'),start=document.getElementById('f1RacingGridStartRecoveryM'),shuffle=document.getElementById('f1RacingGridShuffleV272');
 const configPass=SHUFFLE_VISUAL_CONFIG_V290.shuffleCycles>=2&&SHUFFLE_VISUAL_CONFIG_V290.shuffleCycles<=3&&SHUFFLE_VISUAL_CONFIG_V290.shuffleCycleMs>=140&&SHUFFLE_VISUAL_CONFIG_V290.shuffleCycleMs<=240&&SHUFFLE_VISUAL_CONFIG_V290.transformOnly===true;
 return {version:VERSION290,config:{...SHUFFLE_VISUAL_CONFIG_V290},installed:shuffleStateV290.installed,ready,viewClass:Boolean(view?.classList.contains('f1-racing-grid-smooth-v290')),stageReady:Boolean(stage),startReady:Boolean(start),shuffleReady:Boolean(shuffle),allPass:ready&&configPass&&Boolean(start&&shuffle)};
}

window.mwsF1SyncPreraceCompactV289=syncPreraceCompactV289;window.mwsF1QaPreraceCompactV289=qaPreraceCompactV289;window.__mwsF1RacingV289=VERSION289;
window.mwsF1SyncGridShuffleSmoothnessV290=syncGridShuffleSmoothnessV290;window.mwsF1QaGridShuffleSmoothnessV290=qaGridShuffleSmoothnessV290;window.__mwsF1RacingV290=VERSION290;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bootV288,{once:true});else bootV288();
})();
