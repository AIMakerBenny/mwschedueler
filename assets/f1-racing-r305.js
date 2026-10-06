(()=>{
'use strict';
const VERSION305='phase305-f1-workspace-ui-stability';
const stateV305={installed:false,syncCount:0,repairCount:0,migratedDefault:false,resizeObserver:null,mutationObserver:null,lastReport:null};

function workspaceV305(){return document.getElementById('f1RacingWorkspaceRecoveryE')}
function panelV305(id){return workspaceV305()?.querySelector('[data-f1-workspace-panel="'+id+'"]')||null}
function visiblePanelsV305(){
 const root=workspaceV305();if(!root)return [];
 return [...root.querySelectorAll('[data-f1-workspace-panel]')].filter(panel=>!panel.hidden&&getComputedStyle(panel).display!=='none');
}
function overlapPairsV305(){
 const panels=visiblePanelsV305(),rows=[];
 for(let i=0;i<panels.length;i++){
  const a=panels[i].getBoundingClientRect();
  for(let j=i+1;j<panels.length;j++){
   const b=panels[j].getBoundingClientRect();
   const w=Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left));
   const h=Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));
   if(w*h>2)rows.push({a:panels[i].dataset.f1WorkspacePanel,b:panels[j].dataset.f1WorkspacePanel,area:Number((w*h).toFixed(2))});
  }
 }
 return rows;
}
function outOfBoundsV305(){
 const root=workspaceV305();if(!root)return [];
 const wr=root.getBoundingClientRect(),tol=2;
 return visiblePanelsV305().map(panel=>{
  const r=panel.getBoundingClientRect();
  return {id:panel.dataset.f1WorkspacePanel,left:r.left-wr.left,top:r.top-wr.top,right:r.right-wr.right,bottom:r.bottom-wr.bottom,width:r.width,height:r.height};
 }).filter(row=>row.left<-tol||row.top<-tol||row.right>tol||row.bottom>tol);
}
function legacyDefaultV305(layout){
 const p=layout?.panels||{};
 const same=(id,x,y,w,h)=>Number(p[id]?.x)===x&&Number(p[id]?.y)===y&&Number(p[id]?.w)===w&&Number(p[id]?.h)===h&&!p[id]?.hidden&&!p[id]?.maximized&&!String(p[id]?.tabGroup||'');
 return same('track',0,0,8,8)&&same('timing',8,0,4,3)&&same('commentary',8,3,4,5);
}
function migrateDefaultV305(){
 if(stateV305.migratedDefault)return false;
 const layout=window.mwsF1GetWorkspaceLayoutRecoveryE?.();
 if(!legacyDefaultV305(layout))return false;
 const ok=window.mwsF1ResizeSplitRecoveryJ?.('track',-1,0)===true;
 if(ok)stateV305.migratedDefault=true;
 return ok;
}
function timingDensityV305(width){
 const w=Number(width)||0;
 return w>=720?'wide':w>=560?'standard':w>=430?'compact':'micro';
}
function panelDensityV305(width){
 const w=Number(width)||0;
 return w>=620?'wide':w>=430?'standard':'compact';
}
function syncDensitiesV305(){
 const root=workspaceV305();if(!root)return null;
 const timing=panelV305('timing'),commentary=panelV305('commentary'),track=panelV305('track');
 const rootWidth=root.getBoundingClientRect().width;
 root.dataset.f1WorkspaceDensityV305=rootWidth>=1700?'wide':rootWidth>=1200?'standard':'compact';
 for(const panel of [timing,commentary,track].filter(Boolean)){
  panel.dataset.f1PanelDensityV305=panelDensityV305(panel.getBoundingClientRect().width);
 }
 if(timing)timing.dataset.f1TimingDensityV305=timingDensityV305(timing.getBoundingClientRect().width);
 if(commentary){
  const r=commentary.getBoundingClientRect();
  commentary.dataset.f1CommentaryDensityV305=r.width<430||r.height<300?'compact':'standard';
 }
 return {workspace:root.dataset.f1WorkspaceDensityV305,timing:timing?.dataset.f1TimingDensityV305||'',commentary:commentary?.dataset.f1CommentaryDensityV305||''};
}
function horizontalOverflowV305(node){return Boolean(node&&node.scrollWidth>node.clientWidth+2)}
function uiReportV305(){
 const root=workspaceV305(),timing=panelV305('timing'),header=document.querySelector('#f1RacingViewRaceV185 .f1-racing-race-header-v188'),toolbar=document.getElementById('f1RacingWorkspaceToolbarRecoveryE');
 const wr=root?.getBoundingClientRect();
 const panelRects=Object.fromEntries(visiblePanelsV305().map(panel=>{const r=panel.getBoundingClientRect();return [panel.dataset.f1WorkspacePanel,{width:Number(r.width.toFixed(1)),height:Number(r.height.toFixed(1)),left:Number(r.left.toFixed(1)),top:Number(r.top.toFixed(1))}]}));
 const overlaps=overlapPairsV305(),outOfBounds=outOfBoundsV305();
 const timingOverflow=horizontalOverflowV305(timing);
 const titleOverflow=visiblePanelsV305().filter(panel=>horizontalOverflowV305(panel.querySelector('.f1-racing-panel-title-v188'))).map(panel=>panel.dataset.f1WorkspacePanel);
 const report={
  version:VERSION305,
  workspace:wr?{width:Number(wr.width.toFixed(1)),height:Number(wr.height.toFixed(1)),bottom:Number(wr.bottom.toFixed(1)),viewportHeight:window.innerHeight}:null,
  panelRects,densities:syncDensitiesV305(),overlaps,outOfBounds,timingOverflow,titleOverflow,
  headerOverflow:horizontalOverflowV305(header),toolbarOverflow:horizontalOverflowV305(toolbar),
  gridOverlaps:window.mwsF1WorkspaceOverlapPairsRecoveryI?.()||[]
 };
 report.allPass=Boolean(root)&&overlaps.length===0&&outOfBounds.length===0&&!timingOverflow&&!report.headerOverflow&&!report.toolbarOverflow&&titleOverflow.length===0&&report.gridOverlaps.length===0;
 stateV305.lastReport=report;return report;
}
function repairV305(){
 const root=workspaceV305();if(!root)return false;
 const needsRepair=overlapPairsV305().length>0||outOfBoundsV305().length>0||(window.mwsF1WorkspaceOverlapPairsRecoveryI?.()||[]).length>0;
 if(!needsRepair)return false;
 const ok=window.mwsF1ReflowWorkspaceRecoveryI?.()===true;
 if(ok){stateV305.repairCount+=1;window.mwsF1ApplyWorkspaceViewportFitV288?.()}
 return ok;
}
function syncV305(){
 if(String(window.mwsF1GetScreenStateV185?.()||'')!=='RACE')return null;
 migrateDefaultV305();
 window.mwsF1ApplyWorkspaceViewportFitV288?.();
 syncDensitiesV305();
 repairV305();
 syncDensitiesV305();
 stateV305.syncCount+=1;
 return uiReportV305();
}
let scheduledV305=false;
function scheduleV305(){
 if(scheduledV305)return;
 scheduledV305=true;
 requestAnimationFrame(()=>requestAnimationFrame(()=>{scheduledV305=false;syncV305()}));
}
function installV305(){
 if(stateV305.installed)return true;
 stateV305.installed=true;
 const root=workspaceV305(),race=document.getElementById('f1RacingViewRaceV185');
 if(root&&typeof ResizeObserver==='function'){
  stateV305.resizeObserver=new ResizeObserver(scheduleV305);
  stateV305.resizeObserver.observe(root);
  root.querySelectorAll('[data-f1-workspace-panel]').forEach(panel=>stateV305.resizeObserver.observe(panel));
 }
 if(root){
  stateV305.mutationObserver=new MutationObserver(scheduleV305);
  stateV305.mutationObserver.observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','data-used-rows']});
 }
 if(race)new MutationObserver(scheduleV305).observe(race,{attributes:true,attributeFilter:['hidden']});
 window.addEventListener('resize',scheduleV305,{passive:true});
 window.visualViewport?.addEventListener('resize',scheduleV305,{passive:true});
 document.getElementById('f1RacingWorkspaceResetRecoveryE')?.addEventListener('click',scheduleV305);
 scheduleV305();return true;
}
function qaV305(){const report=syncV305()||uiReportV305();return {...report,installed:stateV305.installed,syncCount:stateV305.syncCount,repairCount:stateV305.repairCount,migratedDefault:stateV305.migratedDefault,allPass:Boolean(report?.allPass&&stateV305.installed)}}

window.mwsF1SyncWorkspaceUiV305=syncV305;
window.mwsF1QaWorkspaceUiV305=qaV305;
window.mwsF1WorkspaceUiReportV305=uiReportV305;
window.__mwsF1RacingV305=VERSION305;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installV305,{once:true});else installV305();
})();