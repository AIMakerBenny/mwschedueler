(()=>{
'use strict';
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
function bootV288(){installWorkspaceViewportFitV288()}
window.mwsF1ApplyWorkspaceViewportFitV288=applyWorkspaceViewportFitV288;window.mwsF1QaWorkspaceViewportFitV288=qaWorkspaceViewportFitV288;window.__mwsF1RacingV288=VERSION288;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bootV288,{once:true});else bootV288();
})();
