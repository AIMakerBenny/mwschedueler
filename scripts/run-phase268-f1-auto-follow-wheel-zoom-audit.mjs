import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase268F1AutoFollowWheelZoomAudit(){
 const issues=[],warnings=[];
 const index=fs.readFileSync('index.html','utf8'),racing=fs.readFileSync('assets/f1-racing-v1.js','utf8'),css=fs.readFileSync('assets/f1-racing-v1.css','utf8'),live=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
 const phases=[...index.matchAll(/recovery=N1&phase=(\d+)/g)].map(m=>Number(m[1]));if(!phases.some(v=>v>=268))issues.push('Phase 268 asset cache missing');
 for(const token of [
  "const VERSION268='phase268-auto-follow-wheel-zoom';",
  'userZoomLockedV268:false',
  'dragCandidateV268:false',
  'if(raceCameraV216.userZoomLockedV268)focus.zoom=raceCameraV216.userZoomV268;',
  'Math.hypot(totalDx,totalDy)<6',
  "raceCameraV216.mode='MANUAL'",
  'function qaAutoFollowWheelZoomV268(){',
  'window.mwsF1QaAutoFollowWheelZoomV268=qaAutoFollowWheelZoomV268;',
  'window.__mwsF1RacingV268=VERSION268;'
 ])if(!racing.includes(token))issues.push('Phase 268 runtime missing: '+token);
 for(const token of [
  '/* Phase 268: fullscreen viewport fit repair */',
  'height:100dvh!important',
  'grid-template-rows:repeat(var(--f1-workspace-used-rows,10),minmax(0,1fr))!important'
 ])if(!css.includes(token))issues.push('Phase 268 fullscreen CSS missing: '+token);
 for(const token of ['Phase 268 wheel zoom must keep AUTO','Phase 268 drag did not enter MANUAL','Phase 268 auto-follow wheel zoom QA failed','Phase 268 fullscreen workspace clipped'])
  if(!live.includes(token))issues.push('Phase 268 Recovery H missing: '+token);
 const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});if(syntax.status!==0)issues.push('F1 JS syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());
 const result={phase:268,name:'f1-auto-follow-wheel-zoom',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase268F1AutoFollowWheelZoomAudit();
