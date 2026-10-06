import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase305F1WorkspaceUiStabilityAudit(){
 const issues=[],warnings=[];
 const index=fs.readFileSync('index.html','utf8');
 const js=fs.readFileSync('assets/f1-racing-r305.js','utf8');
 const css=fs.readFileSync('assets/f1-racing-r305.css','utf8');
 const diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');

 for(const token of [
  "const VERSION305='phase305-f1-workspace-ui-stability';",
  'function legacyDefaultV305(layout){',
  "window.mwsF1ResizeSplitRecoveryJ?.('track',-1,0)",
  'function timingDensityV305(width){',
  'function overlapPairsV305(){',
  'function outOfBoundsV305(){',
  'function repairV305(){',
  'window.mwsF1SyncWorkspaceUiV305=syncV305;',
  'window.mwsF1QaWorkspaceUiV305=qaV305;',
  'window.__mwsF1RacingV305=VERSION305;'
 ])if(!js.includes(token))issues.push('Phase 305 runtime missing: '+token);

 for(const token of [
  '[data-f1-timing-density-v305="wide"]',
  '[data-f1-timing-density-v305="standard"]',
  '[data-f1-timing-density-v305="compact"]',
  '[data-f1-timing-density-v305="micro"]',
  '[data-f1-commentary-density-v305="compact"]',
  'max-width:100%',
  'overflow:hidden'
 ])if(!css.includes(token))issues.push('Phase 305 CSS missing: '+token);

 for(const token of [
  'assets/f1-racing-r305.css?phase=305',
  'assets/f1-racing-r305.js?phase=305'
 ])if(!index.includes(token))issues.push('Phase 305 asset link missing: '+token);

 for(const token of [
  'Phase 305 runtime readiness',
  "label:'2k-100',width:2560,height:1440",
  "label:'2k-150-equivalent',width:1707,height:960",
  'Phase 305 viewport layout failed',
  'Phase 305 workspace bottom clipping',
  'Phase 305 timing panel horizontal overflow',
  'Phase 305 default panel proportions not stabilized',
  'Phase 305 final workspace UI QA failed'
 ])if(!diag.includes(token))issues.push('Phase 305 Recovery H QA missing: '+token);

 for(const file of ['assets/f1-racing-r305.js','scripts/diagnose-recovery-h-f1-live.mjs']){
  const run=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
  if(run.status!==0)issues.push(file+' syntax failed: '+String(run.stderr||run.stdout||'').trim());
 }

 const result={phase:305,name:'f1-workspace-ui-stability',issues,warnings,pass:issues.length===0};
 console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase305F1WorkspaceUiStabilityAudit();
