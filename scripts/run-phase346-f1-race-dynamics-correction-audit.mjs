import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase346F1RaceDynamicsCorrectionAudit(){
  const issues=[],warnings=[];
  const core=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');

  for(const token of [
    "const VERSION346='phase346-f1-race-dynamics-correction';",
    "const insideSign=corner.direction==='right'?-1:1;",
    'function phaseSpeedTargetV343(',
    "const amplitude=mode==='FAST'?.065:.040;",
    'const rankWeight=index===1?1:index===2?0.68:index===3?0.38:0;',
    'window.mwsF1QaRaceDynamicsCorrectionV346=',
    'window.__mwsF1RacingV346=VERSION346;'
  ]) if(!core.includes(token)) issues.push('Phase 346 core missing: '+token);
  const legacyCornerPhases=core.includes("if(phase==='BRAKING'){")&&core.includes("if(phase==='TURN_IN'){")&&core.includes("if(phase==='APEX')return apexTarget;");
  const physicsCornerPhases=core.includes('function cornerDrivingPlanV351(')&&core.includes('cornerTargetAtDistanceV351(plan,here,raw,exitTarget)');
  if(!legacyCornerPhases&&!physicsCornerPhases)issues.push('Phase 346 corner phase speed correction missing or unsupported');

  for(const token of [
    'Phase 346 runtime did not propagate to Recovery H browser',
    'Phase 346 corrected racing line and competition QA failed'
  ]) if(!diag.includes(token)) issues.push('Phase 346 Recovery H missing: '+token);

  const run=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});
  if(run.status!==0) issues.push('core syntax failed: '+String(run.stderr||run.stdout||'').trim());

  const result={phase:346,name:'f1-race-dynamics-correction',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));
  if(issues.length) process.exitCode=1;
  return result;
}
if(import.meta.url==='file://'+process.argv[1]) runPhase346F1RaceDynamicsCorrectionAudit();
