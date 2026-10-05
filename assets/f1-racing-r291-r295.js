(()=>{
'use strict';
const VERSION291='phase291-f1-r16-finish-podium-result-overlay';
const finishOverlayStateV291={installed:false,active:false,renderCount:0,lastResultKey:''};
function screenStateV291(){return String(window.mwsF1GetScreenStateV185?.()||'')}
function raceResultV291(){return window.mwsF1GetRaceResultRecoveryG?.()||null}
function escV291(value=''){return String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}
function timeV291(ms){const total=Math.max(0,Math.floor(Number(ms)||0)),m=Math.floor(total/60000),s=Math.floor((total%60000)/1000),x=total%1000;return String(m).padStart(2,'0')+':'+String(s).padStart(2,'0')+'.'+String(x).padStart(3,'0')}
function lapV291(ms){const total=Math.max(0,Math.floor(Number(ms)||0));if(!total)return '--:--.---';const m=Math.floor(total/60000),s=Math.floor((total%60000)/1000),x=total%1000;return String(m)+':'+String(s).padStart(2,'0')+'.'+String(x).padStart(3,'0')}
function movementV291(row){const start=Math.max(1,Number(row?.gridPosition)||1),finish=Math.max(1,Number(row?.position)||1),delta=start-finish;return delta>0?'▲ '+delta:delta<0?'▼ '+Math.abs(delta):'–'}
function avatarV291(row){const src=String(row?.image||'').trim(),name=String(row?.name||'Driver');return src?'<img src="'+escV291(src)+'" alt="'+escV291(name)+'">':'<span class="fallback">'+escV291(name.slice(0,2).toUpperCase())+'</span>'}
function ensureFinishOverlayV291(){
 const race=document.getElementById('f1RacingViewRaceV185');if(!race)return null;
 let root=document.getElementById('f1RacingFinishOverlayV291');if(root)return root;
 root=document.createElement('section');root.id='f1RacingFinishOverlayV291';root.className='f1-racing-finish-overlay-v291';root.hidden=true;
 root.innerHTML='<div class="f1-racing-finish-overlay-panel-v291"><header><div><span>RACE FINISHED</span><strong id="f1RacingFinishOverlayTitleV291">FINAL RESULT</strong><small id="f1RacingFinishOverlayMetaV291"></small></div><div class="actions"><button type="button" class="secondary" id="f1RacingFinishOverlaySetupV291">설정으로 돌아가기</button><button type="button" class="primary" id="f1RacingFinishOverlayNewRaceV291">같은 설정으로 새 경기</button></div></header><div id="f1RacingFinishOverlayPodiumV291" class="f1-racing-finish-podium-v291"></div><div class="f1-racing-finish-result-head-v291"><span>POS</span><span>DRIVER</span><span>START</span><span>BEST LAP</span><span>OVERTAKES</span><span>TIME</span></div><div id="f1RacingFinishOverlayResultsV291" class="f1-racing-finish-results-v291"></div></div>';
 race.appendChild(root);
 root.querySelector('#f1RacingFinishOverlaySetupV291')?.addEventListener('click',()=>{hideFinishOverlayV291();window.mwsF1ReturnToSetupRecoveryG?.()});
 root.querySelector('#f1RacingFinishOverlayNewRaceV291')?.addEventListener('click',()=>{hideFinishOverlayV291();window.mwsF1NewRaceSameSettingsRecoveryG?.()});
 return root;
}
function renderFinishOverlayV291(result=raceResultV291()){
 const root=ensureFinishOverlayV291();if(!root||!result?.rows?.length)return false;
 const rows=[...result.rows].sort((a,b)=>(Number(a.position)||999)-(Number(b.position)||999)),podium=rows.slice(0,3);
 const title=root.querySelector('#f1RacingFinishOverlayTitleV291'),meta=root.querySelector('#f1RacingFinishOverlayMetaV291'),pbox=root.querySelector('#f1RacingFinishOverlayPodiumV291'),list=root.querySelector('#f1RacingFinishOverlayResultsV291');
 if(title)title.textContent=(result.trackName||'GRAND PRIX')+' · FINAL RESULT';
 if(meta)meta.textContent=(Number(result.totalLaps)||0)+' LAPS · '+rows.length+' DRIVERS · '+timeV291(result.simTimeMs);
 if(pbox)pbox.innerHTML=podium.map((row,index)=>'<article class="place p'+(index+1)+'"><b>P'+String(row.position).padStart(2,'0')+'</b>'+avatarV291(row)+'<div><strong>'+escV291(row.name)+'</strong><small>START P'+String(row.gridPosition).padStart(2,'0')+' · '+movementV291(row)+'</small></div><span>BEST '+lapV291(row.bestLapMs)+' · '+(Number(row.passCompletedCount)||0)+' OVT</span></article>').join('');
 if(list)list.innerHTML=rows.map(row=>'<div class="row"><b>P'+String(row.position).padStart(2,'0')+'</b><strong>'+escV291(row.name)+'</strong><span>P'+String(row.gridPosition).padStart(2,'0')+'</span><time>'+lapV291(row.bestLapMs)+'</time><span>'+String(Number(row.passCompletedCount)||0)+'</span><time>'+timeV291(row.finishedAtSimMs)+'</time></div>').join('');
 root.hidden=false;root.classList.add('active');document.body?.classList.add('f1-racing-finish-overlay-active-v291');
 finishOverlayStateV291.active=true;finishOverlayStateV291.renderCount+=1;finishOverlayStateV291.lastResultKey=String(result.trackId||'')+'|'+String(result.simTimeMs||0);return true;
}
function hideFinishOverlayV291(){const root=document.getElementById('f1RacingFinishOverlayV291');if(root){root.hidden=true;root.classList.remove('active')}document.body?.classList.remove('f1-racing-finish-overlay-active-v291');finishOverlayStateV291.active=false;return true}
function syncFinishOverlayV291(){
 const state=screenStateV291(),result=raceResultV291();
 if(state==='FINISHING'&&result?.rows?.length){window.mwsF1SetScreenStateV185?.('RACE',{force:true});return renderFinishOverlayV291(result)}
 if(state==='RACE'&&result?.rows?.length&&finishOverlayStateV291.active)return renderFinishOverlayV291(result);
 if(!result||['SETUP','TRANSITION','GRID'].includes(state))hideFinishOverlayV291();return false;
}
function installFinishOverlayV291(){
 if(finishOverlayStateV291.installed)return true;finishOverlayStateV291.installed=true;ensureFinishOverlayV291();
 const section=document.getElementById('gameF1Racing');if(section)new MutationObserver(()=>queueMicrotask(syncFinishOverlayV291)).observe(section,{attributes:true,attributeFilter:['data-f1-screen']});
 document.addEventListener('click',event=>{if(event.target.closest('#f1RacingRaceCancelRecoveryC,#f1RacingResultSetupRecoveryG,#f1RacingResultNewRaceRecoveryG'))queueMicrotask(hideFinishOverlayV291)},true);
 queueMicrotask(syncFinishOverlayV291);return true;
}
function qaFinishOverlayV291(){const root=ensureFinishOverlayV291(),podium=root?.querySelector('#f1RacingFinishOverlayPodiumV291'),results=root?.querySelector('#f1RacingFinishOverlayResultsV291'),newRace=root?.querySelector('#f1RacingFinishOverlayNewRaceV291'),setup=root?.querySelector('#f1RacingFinishOverlaySetupV291');const api=typeof window.mwsF1SetScreenStateV185==='function'&&typeof window.mwsF1GetRaceResultRecoveryG==='function'&&typeof window.mwsF1NewRaceSameSettingsRecoveryG==='function'&&typeof window.mwsF1ReturnToSetupRecoveryG==='function';return {version:VERSION291,installed:finishOverlayStateV291.installed,api,root:Boolean(root),podium:Boolean(podium),results:Boolean(results),actions:Boolean(newRace&&setup),active:finishOverlayStateV291.active,renderCount:finishOverlayStateV291.renderCount,allPass:Boolean(root&&podium&&results&&newRace&&setup)&&api&&finishOverlayStateV291.installed}}

const VERSION292='phase292-f1-r17-integrated-desktop-qa';
const desktopQaStateV292={installed:false,errors:[],errorLimit:20};
function installFinalDesktopQaV292(){
 if(desktopQaStateV292.installed)return true;desktopQaStateV292.installed=true;
 const push=value=>{desktopQaStateV292.errors.push(String(value||''));if(desktopQaStateV292.errors.length>desktopQaStateV292.errorLimit)desktopQaStateV292.errors.splice(0,desktopQaStateV292.errors.length-desktopQaStateV292.errorLimit)};
 window.addEventListener('error',event=>push('error:'+String(event.message||event.error||'')));
 window.addEventListener('unhandledrejection',event=>push('rejection:'+String(event.reason||'')));
 return true;
}
function qaFinalDesktopV292(){
 const requiredApis={
  liveConversation:typeof window.mwsF1QaLiveConversationStackV276==='function',
  dialogueCadence:typeof window.mwsF1QaDialogueCadenceV281==='function',
  pause:typeof window.mwsF1ToggleSimulationPauseV192==='function',
  markerZoom:typeof window.mwsF1QaZoomLinkedMarkerScaleV285==='function',
  cameraJitter:typeof window.mwsF1QaAutoCameraJitterSuppressionV286==='function',
  liveRanking:typeof window.mwsF1QaTrackRankingOverlayV284==='function',
  layoutReset:typeof window.mwsF1QaWorkspaceViewportFitV288==='function',
  compactRace:typeof window.mwsF1QaRaceCompactShellV287==='function',
  prerace:typeof window.mwsF1QaPreraceCompactV289==='function',
  shuffle:typeof window.mwsF1QaGridShuffleSmoothnessV290==='function',
  finishOverlay:typeof window.mwsF1QaFinishOverlayV291==='function'
 };
 const qa={
  layoutReset:window.mwsF1QaWorkspaceViewportFitV288?.()||null,
  compactRace:window.mwsF1QaRaceCompactShellV287?.()||null,
  prerace:window.mwsF1QaPreraceCompactV289?.()||null,
  shuffle:window.mwsF1QaGridShuffleSmoothnessV290?.()||null,
  finishOverlay:window.mwsF1QaFinishOverlayV291?.()||null
 };
 const dom={
  race:Boolean(document.getElementById('f1RacingViewRaceV185')),
  workspace:Boolean(document.getElementById('f1RacingWorkspaceRecoveryE')),
  liveConversation:Boolean(document.getElementById('f1RacingConversationStackV276')),
  liveRanking:Boolean(document.getElementById('f1RacingTrackRankingV284')),
  finishOverlay:Boolean(document.getElementById('f1RacingFinishOverlayV291')),
  grid:Boolean(document.getElementById('f1RacingViewGridV185'))
 };
 const qaPass=Object.values(qa).every(row=>row?.allPass===true);
 const apiPass=Object.values(requiredApis).every(Boolean),domPass=Object.values(dom).every(Boolean),errors=[...desktopQaStateV292.errors];
 return {version:VERSION292,viewport:{width:window.innerWidth,height:window.innerHeight,desktop:window.innerWidth>=1024},requiredApis,qa,dom,errors,apiPass,qaPass,domPass,allPass:desktopQaStateV292.installed&&apiPass&&qaPass&&domPass&&errors.length===0};
}


const VERSION295='phase295-f1-final-regression-gate';
function qaFinalRegressionV295(){
 const desktop=window.mwsF1QaFinalDesktopV292?.()||null;
 const overlay=window.mwsF1QaFinishOverlayV291?.()||null;
 return {version:VERSION295,desktop,overlay,allPass:desktop?.allPass===true&&overlay?.allPass===true};
}

function bootV291(){installFinishOverlayV291();installFinalDesktopQaV292()}
window.mwsF1RenderFinishOverlayV291=renderFinishOverlayV291;window.mwsF1SyncFinishOverlayV291=syncFinishOverlayV291;window.mwsF1HideFinishOverlayV291=hideFinishOverlayV291;window.mwsF1QaFinishOverlayV291=qaFinishOverlayV291;window.__mwsF1RacingV291=VERSION291;
window.mwsF1QaFinalDesktopV292=qaFinalDesktopV292;window.__mwsF1RacingV292=VERSION292;
window.mwsF1QaFinalRegressionV295=qaFinalRegressionV295;window.__mwsF1RacingV295=VERSION295;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bootV291,{once:true});else bootV291();
})();
