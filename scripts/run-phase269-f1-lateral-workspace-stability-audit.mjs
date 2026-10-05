import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase269F1LateralWorkspaceStabilityAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const live=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
  const phases=[...index.matchAll(/recovery=N1&phase=(\d+)/g)].map(m=>Number(m[1]));
  if(!phases.some(v=>v>=269))issues.push('Phase 269 asset cache missing');

  for(const token of [
    "const VERSION269='phase269-lateral-velocity-acceleration-smoothing';",
    'const VISUAL_LATERAL_DYNAMICS_V269=Object.freeze({',
    'function visualLateralMaxSpeedV269(',
    'function committedVisualTargetV269(',
    'Math.hypot(totalDx,totalDy)<6',
    'maxAcceleration:7.5',
    'lineModeHoldMs:420',
    'function qaLateralDynamicsV269(){',
    'function qaWorkspaceExactRestoreV269(){',
    "const structuralIssues=rawIssues.filter(reason=>reason!=='legacy-version');",
    "workspace.style.setProperty('--f1-workspace-used-rows',String(usedRows));",
    "if(document.body.classList.contains('f1-racing-immersive'))",
    'window.mwsF1QaWorkspaceExactRestoreV269=qaWorkspaceExactRestoreV269;',
    'window.__mwsF1RacingV269=VERSION269;'
  ])if(!racing.includes(token))issues.push('Phase 269 runtime missing: '+token);

  for(const token of [
    'Phase 269 lateral dynamics QA failed',
    'Phase 269 exact workspace restore failed'
  ])if(!live.includes(token))issues.push('Phase 269 Recovery H missing: '+token);

  const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});
  if(syntax.status!==0)issues.push('F1 JS syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());

  const result={phase:269,name:'f1-lateral-workspace-stability',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));
  if(issues.length)process.exitCode=1;
  return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase269F1LateralWorkspaceStabilityAudit();
