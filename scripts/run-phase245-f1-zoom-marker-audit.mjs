import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import vm from 'node:vm';
export function runPhase245F1ZoomMarkerAudit(){
 const issues=[],warnings=[];const index=fs.readFileSync('index.html','utf8'),racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
 const phase=Number(index.match(/recovery=N1&phase=(\d+)/)?.[1]||0);if(phase<245)issues.push('Phase 245 asset cache missing');
 for(const token of ["const VERSION245='phase245-zoom-aware-marker-scale';",'function raceMarkerScaleV245(','function syncRaceMarkerScaleV245(){','raceMarkerTransformV245(point,raceCameraV216.zoom)','syncRaceMarkerScaleV245();','function qaZoomAwareMarkerScaleV245(){','window.mwsF1QaZoomAwareMarkerScaleV245=qaZoomAwareMarkerScaleV245;','window.__mwsF1RacingV245=VERSION245;'])if(!racing.includes(token))issues.push('Phase 245 runtime missing: '+token);
 const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});if(syntax.status!==0)issues.push('F1 JS syntax failed');
 for(const token of ['function syncTrackAnnotationScaleV245(){','syncTrackAnnotationScaleV245();','group.dataset.zoomAnchorX','label.dataset.zoomAnchorX','anchor,scale);'])if(!racing.includes(token))issues.push('Phase 245 annotation/label scaling missing: '+token);
 const live=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
 if(!live.includes('sizesAtZoom245')||!live.includes('lineAtFull245'))issues.push('Phase 245 rendered zoom geometry QA is not connected');
 try{
  const extract=name=>racing.slice(racing.indexOf('function '+name+'('),racing.indexOf('\nfunction ',racing.indexOf('function '+name+'(')+1));
  const context=vm.createContext({});
  vm.runInContext(extract('raceMarkerScaleV245')+'\n'+extract('labelCandidateRectV228'),context);
  const scale=context.raceMarkerScaleV245;
  for(const zoom of [1,1.5,2,3,4.5])if(zoom*scale(zoom)<.85||zoom*scale(zoom)>1.12)issues.push('Phase 245 screen size out of range at '+zoom);
  if(scale(0)!==1||scale(100)!==.22)issues.push('Phase 245 scale clamp failed');
  const label={textContent:'DRV'};
  for(const zoom of [1,2,4.5])for(const anchor of ['start','middle','end']){
   const s=scale(zoom),a=context.labelCandidateRectV228({x:0,y:0},label,24,-18,anchor),b=context.labelCandidateRectV228({x:500,y:300},label,24,-18,anchor,s);
   for(const key of ['left','right','top','bottom']){
    const origin=key==='left'||key==='right'?500:300;
    if(Math.abs(b[key]-(origin+a[key]*s))>1e-6)issues.push('Phase 228 label collision coordinates do not match scaled SVG');
   }
  }
 }catch(error){issues.push('Phase 245 executable geometry audit failed: '+error.message)}
 const result={phase:245,name:'f1-zoom-aware-marker-scale',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase245F1ZoomMarkerAudit();
