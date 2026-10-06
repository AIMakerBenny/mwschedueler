(()=>{
'use strict';
const VERSION309='phase309-viewport-marker-overtake-flow-ui';
const stateV309={installed:false,syncCount:0,last:null};

function workspaceV309(){return document.getElementById('f1RacingWorkspaceRecoveryE')}
function raceStageV309(){return document.querySelector('#f1RacingViewRaceV185 .f1-racing-race-map-stage-v188')}

function syncFixedMarkerLabelsV309(){
 window.__mwsF1FixedMarkerLabelsV309=true;
 const markers=[...document.querySelectorAll('.f1-racing-race-vehicle-v189')];
 for(const marker of markers){
  const label=marker.querySelector('.car-label');
  if(label){label.setAttribute('x','0');label.setAttribute('y','22');label.setAttribute('text-anchor','middle');label.dataset.labelSlotV228='fixed-below-v309'}
  const tag=marker.querySelector('.car-position-tag-v254');
  if(tag){tag.style.setProperty('--v306-tag-x','0px');tag.style.setProperty('--v306-tag-y','0px');tag.dataset.v306Shift='0,0'}
 }
 return markers.length;
}
function syncViewportV309(){
 if(String(window.mwsF1GetScreenStateV185?.()||'')!=='RACE')return null;
 return window.mwsF1ApplyWorkspaceViewportFitV288?.()||null;
}
function syncV309(){
 const labels=syncFixedMarkerLabelsV309();
 const fit=syncViewportV309();
 stateV309.syncCount+=1;
 stateV309.last={labels,fit};
 return stateV309.last;
}
function qaV309(){
 const workspace=workspaceV309(),stage=raceStageV309();
 const fit=String(window.mwsF1GetScreenStateV185?.()||'')==='RACE'?syncViewportV309():null;
 syncFixedMarkerLabelsV309();
 const labels=[...document.querySelectorAll('.f1-racing-race-vehicle-v189 .car-label')];
 const tags=[...document.querySelectorAll('.f1-racing-race-vehicle-v189 .car-position-tag-v254')];
 const labelFixed=labels.every(node=>node.getAttribute('x')==='0'&&node.getAttribute('y')==='22'&&node.getAttribute('text-anchor')==='middle');
 const tagFixed=tags.every(node=>getComputedStyle(node).transform==='none'||getComputedStyle(node).transform==='matrix(1, 0, 0, 1, 0, 0)');
 const wr=workspace?.getBoundingClientRect();
 const viewport=Math.max(1,Number(window.visualViewport?.height)||window.innerHeight||document.documentElement.clientHeight||1);
 const viewportFit=!wr||String(window.mwsF1GetScreenStateV185?.()||'')!=='RACE'||wr.bottom<=viewport+2;
 const defaultHeightOk=!wr||Number(workspace?.dataset?.usedRows||0)>10||wr.height<=642;
 const overtake=window.mwsF1QaOvertakeFlowV309?.()||null;
 return {version:VERSION309,installed:stateV309.installed,workspace:Boolean(workspace),stage:Boolean(stage),labelCount:labels.length,tagCount:tags.length,labelFixed,tagFixed,viewportFit,defaultHeightOk,workspaceRect:wr?{top:wr.top,bottom:wr.bottom,height:wr.height,viewport}:null,fit,overtake,allPass:Boolean(workspace&&stage)&&labelFixed&&tagFixed&&viewportFit&&defaultHeightOk&&overtake?.allPass===true};
}
function installV309(){
 if(stateV309.installed)return true;
 stateV309.installed=true;window.__mwsF1FixedMarkerLabelsV309=true;
 const root=document.getElementById('gameF1Racing');
 if(root)new MutationObserver(()=>queueMicrotask(syncV309)).observe(root,{subtree:true,childList:true});
 const reset=document.getElementById('f1RacingWorkspaceResetRecoveryE');
 reset?.addEventListener('click',()=>requestAnimationFrame(()=>requestAnimationFrame(syncV309)));
 window.addEventListener('resize',()=>requestAnimationFrame(syncV309),{passive:true});
 window.visualViewport?.addEventListener('resize',()=>requestAnimationFrame(syncV309),{passive:true});
 syncV309();return true;
}
window.mwsF1SyncViewportMarkerOvertakeV309=syncV309;
window.mwsF1QaViewportMarkerOvertakeV309=qaV309;
window.__mwsF1RacingUiV309=VERSION309;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installV309,{once:true});else installV309();
})();