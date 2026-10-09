import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase397F1EarlyPassAudit(){
  const core=fs.readFileSync('assets/f1-racing-v1.js','utf8'),
    live=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8'),
    cumulative=fs.readFileSync('scripts/run-current-full-integration-audit.mjs','utf8'),issues=[],warnings=[];
  for(const key of ['function qaEarlyAttackPersistenceV397(){','sustainedEarlyAttackV397','earlyApproachUntilV397',
  "earlyApproachV397:!engineQaV240.active",'window.mwsF1QaEarlyAttackPersistenceV397=qaEarlyAttackPersistenceV397;'])
    if(!core.includes(key))issues.push('missing early pass '+key);
  if(!live.includes('Phase 397 early-pass persistence Chromium QA failed')||!live.includes('earlyPassV397:earlyPass397||null'))issues.push('missing Chromium regression');
  if(!cumulative.includes('runPhase397F1EarlyPassAudit()')||!cumulative.includes('runPhase397FullIntegrationAudit()'))issues.push('missing cumulative audit');
  for(const path of ['assets/f1-racing-v1.js','scripts/diagnose-recovery-h-f1-live.mjs','scripts/run-current-full-integration-audit.mjs']){
    const r=spawnSync(process.execPath,['--check',path],{encoding:'utf8'});if(r.status!==0)issues.push('syntax '+path+' '+String(r.stderr).slice(0,400));
  }
  const result={phase:397,name:'f1-early-pass-commit',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase397F1EarlyPassAudit();
